const cds = require("@sap/cds");
const CommonRepo = require("../repository/util.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
const ProcessParticipantsRepo = require("../repository/processParticipant.repo");
const ElligibilityCriteriaRepo = require("../repository/eligibilityCriteria.repo");
const DateToWeekRepo = require("../repository/dateToWeek.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const CommonUtils = require("../util/commonUtil");
const ProcessDetailsRepo = require("../repository/processDetails.repo");
const DateUtils = require("../util/dateUtil");
const TaskDetailsRepo = require("../repository/taskDetails.repo");
const ValidationResultsDto = require("../dto/validationResultsDto");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const RateTypeConfig = require("../enum/rateTypeConfig");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const EclaimService = require("../util/eclaimService");
/**
 *
 * @param request
 */
async function postClaims(request) {
    try {
        const tx = cds.tx(request);
        const user = request.user.id;
        // const userName = user.split('@')[0];
        const userName = "PTT_CA1";
        const upperNusNetId = userName.toUpperCase();
        let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }
        let massUploadRequest = request.data.data;

        let roleFlow = await EclaimService.fetchRole(massUploadRequest);

        massUploadRequest = await populateStartTimeEndTime(massUploadRequest, loggedInUserDetails);

        switch (roleFlow) {
            case ApplicationConstants.ESS:
                return claimantSubmissionFlow(massUploadRequest, roleFlow, loggedInUserDetails);
            case ApplicationConstants.CA:
                return claimAssistantSubmissionFlow(massUploadRequest, token, roleFlow);
            case ApplicationConstants.VERIFIER:
                return verifierSubmissionFlow(massUploadRequest, token);
            case ApplicationConstants.REPORTING_MGR:
            case ApplicationConstants.APPROVER:
                return approverSubmissionFlow(massUploadRequest, token);
            case ApplicationConstants.ADDITIONAL_APP_1:
                return approverSubmissionFlow(massUploadRequest, token);
            case ApplicationConstants.ADDITIONAL_APP_2:
                return approverSubmissionFlow(massUploadRequest, token);
            default:
                throw new ApplicationException("No valid Role type provided.");
        }
    } catch (error) {
        // Logger.debug("route can not bef found for host:", tenantHost);
        return;
    }
}


/**
 *
 * @param massUploadRequest
 */
async function populateStartTimeEndTime(massUploadRequest) {
    if (Array.isArray(massUploadRequest) && massUploadRequest.length > 0) {
        for (const uploadRequest of massUploadRequest) {
            if (
                uploadRequest &&
                Array.isArray(uploadRequest.selectedClaimDates) &&
                uploadRequest.selectedClaimDates.length > 0
            ) {
                for (const itemData of uploadRequest.selectedClaimDates) {
                    if (
                        itemData &&
                        CommonUtils.isBlank(itemData.START_TIME) &&
                        CommonUtils.isBlank(itemData.END_TIME)
                    ) {
                        itemData.START_TIME = ApplicationConstants.CLAIM_START_TIME_DEFAULT;
                        itemData.END_TIME = ApplicationConstants.CLAIM_END_TIME_DEFAULT;
                    }
                }
            }
        }
    }
    return massUploadRequest;
}

/**
 *
 * @param massUploadRequest
 * @param roleFlow
 * @param loggedInUserDetails
 */
async function claimantSubmissionFlow(massUploadRequest, roleFlow, loggedInUserDetails) {
    console.log("MassUploadServiceImpl claimantSubmissionFlow start()");

    let massUploadResponseDto = {
        message: "Successfully Uploaded.",
        error: false,
        eclaimsData: [],
    };

    if (!massUploadRequest || massUploadRequest.length === 0) {
        throw new ApplicationException("Mass upload request is empty");
    }

    for (const item of massUploadRequest) {
        if (!item) {continue;}

        // Withdraw or Retract actions (assuming you have those handlers)
        if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_WITHDRAW) {
            return await withdrawClaimSubmission(item, token);
        }
        if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_RETRACT) {
            return await retractClaimSubmission(item, token, roleFlow);
        }

        let savedData = null;
        if (item.DRAFT_ID && item.DRAFT_ID.trim() !== "") {
            // CAP fetch by key
            savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        }

        // claimantCASaveSubmit: you have to implement/migrate this logic
        const eclaimsDataResDto = await claimantCASaveSubmit(
            item,
            ApplicationConstants.NUS_CHRS_ECLAIMS_ESS,
            savedData,
            false,
            roleFlow,
            loggedInUserDetails
        );

        if (eclaimsDataResDto.ERROR_STATE) {
            massUploadResponseDto.message = MessageConstants.VALIDATION_RESULT_MESSAGE;
            massUploadResponseDto.error = true;
        } else {
            // Persist Lock Details
            let lockRequestorGrp = ApplicationConstants.NUS_CHRS_ECLAIMS_ESS;
            if (
                eclaimsDataResDto.REQUEST_STATUS &&
                eclaimsDataResDto.REQUEST_STATUS.toUpperCase() ===
                    ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED
            ) {
                lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
            }
            await initiateLockProcessDetails(
                eclaimsDataResDto.DRAFT_ID,
                eclaimsJWTTokenUtil.fetchNusNetIdFromToken(token),
                lockRequestorGrp,
                eclaimsDataResDto.CLAIM_TYPE
            );
        }
        massUploadResponseDto.eclaimsData.push(eclaimsDataResDto);

        // Email Acknowledgement sending
        if (
            item.ACTION &&
            item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
            eclaimsDataResDto.DRAFT_ID &&
            eclaimsDataResDto.DRAFT_ID !== ""
        ) {
            try {
                await emailService.sendOnDemandEmails(
                    eclaimsDataResDto.DRAFT_ID,
                    eclaimsDataResDto.CLAIM_TYPE,
                    item.ACTION,
                    eclaimsDataResDto.REQUESTOR_GRP,
                    eclaimsJWTTokenUtil.fetchNusNetIdFromToken(token),
                    null,
                    item.ROLE,
                    null,
                    null,
                    null
                );
            } catch (exception) {
                console.error("Exception in email flow", exception);
            }
        }
    }
    console.log("MassUploadServiceImpl claimantSubmissionFlow end()");
    return massUploadResponseDto;
}

/**
 *
 * @param draftId
 */
async function fetchRequestLockedUser(draftId) {
    // Assume requestLockDetailsRepository.checkIsRequestLocked returns a Promise
    const requestLockDetails = await requestLockDetailsRepo.checkIsRequestLocked(draftId);

    if (
        requestLockDetails &&
        requestLockDetails.LOCKED_BY_USER_NID &&
        requestLockDetails.LOCKED_BY_USER_NID.trim() !== ""
    ) {
        return requestLockDetails.LOCKED_BY_USER_NID;
    }
    return null;
}

/**
 *
 * @param loggedInUserDetails
 * @param fetchRequestLockedByUser
 */
async function checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser) {
    // Get user info (assume userUtil.getLoggedInUserDetails is async)
    const userInfoDetails = loggedInUserDetails;
    let staffId = "";
    if (userInfoDetails && userInfoDetails.NUSNET_ID) {
        staffId = userInfoDetails.STAFF_ID;
    }

    if (
        fetchRequestLockedByUser &&
        fetchRequestLockedByUser.trim() !== "" &&
        fetchRequestLockedByUser.toLowerCase() !== staffId.toLowerCase()
    ) {
        // In CAP, use req.error or throw {code, message, status}
        const error = new Error(MessageConstants.MSG_REQUEST_LOCKED + fetchRequestLockedByUser);
        error.status = 403;
        throw error;
        // OR in express-based APIs, you may use:
        // const { FORBIDDEN } = require('http-status-codes');
        // res.status(FORBIDDEN).json({ error: ... });
    }
}

/**
 *
 * @param item
 * @param requestorGroup
 * @param savedData
 * @param isCASave
 * @param roleFlow
 * @param loggedInUserDetails
 */
async function claimantCASaveSubmit(item, requestorGroup, savedData, isCASave, roleFlow, loggedInUserDetails) {
    // User details (assume you have userUtil in Node.js)
    const userInfoDetails = loggedInUserDetails;

    // Debug check for status change
    if (
        item.DRAFT_ID &&
        savedData &&
        savedData.REQUEST_STATUS &&
        item.REQUEST_STATUS &&
        item.REQUEST_STATUS.toUpperCase() === ApplicationConstants.STATUS_ECLAIMS_DRAFT &&
        savedData.REQUEST_STATUS.toUpperCase() !== ApplicationConstants.STATUS_ECLAIMS_DRAFT
    ) {
        console.error("Status is being changed to draft from process flow for the request :" + item.DRAFT_ID);
        throw new ApplicationException("IGNORE_REQUEST");
    }
    if (!item.REQUEST_STATUS) {throw new ApplicationException("Invalid Request Status");}

    // Lock check (assume you implement fetchRequestLockedUser and checkIsLocked)
    const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
    await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

    let eclaimsData = {};
    let eclaimsItemsRes = [];
    const now = new Date();
    const reqMonth = String(now.getMonth() + 1).padStart(2, "0");
    const reqYear = String(now.getFullYear()).slice(-2);

    // Pending from here ------ Pankaj

    const draftIdPatternVal = draftIdPattern + reqYear + reqMonth; //need to check pending
    const requestIdPatternVal = requestIdPattern + reqYear + reqMonth; //need to check pending
    let draftNumber = "";

    // Already submitted check
    if (
        savedData &&
        item.ACTION &&
        item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
        [
            ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_SUBMITTED,
            ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED,
        ].includes(savedData.REQUEST_STATUS)
    ) {
        throw new ApplicationException("Claim is already submitted.");
    }

    const eclaimsDataResDto = {
        validationResults: [],
        ERROR_STATE: false,
    };

    // Validation
    let validationResults = await EclaimService.validateEclaimsData(item, roleFlow, requestorGroup, loggedInUserDetails);
    if (validationResults && validationResults.length > 0) {
        eclaimsDataResDto.validationResults = validationResults;
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }

    let itemCount =
        item.CLAIM_REQUEST_TYPE &&
        item.CLAIM_REQUEST_TYPE.toUpperCase() === ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD
            ? 0
            : 1;
    const nusNetId = loggedInUserDetails.NUSNET_ID;

    // DRAFT_ID Handling
    if (item.DRAFT_ID) {
        if (savedData) {
            draftNumber = item.DRAFT_ID;
            eclaimsData.DRAFT_ID = item.DRAFT_ID;
            eclaimsData.CREATED_ON = savedData.CREATED_ON;
            if (
                item.ACTION &&
                item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
                !savedData.REQUEST_ID
            ) {
                eclaimsData.CREATED_ON = new Date().toISOString();
            }
            eclaimsData.REQUEST_ID = savedData.REQUEST_ID;
            itemCount = await EclaimsItemDataRepo.fetchItemCount(savedData.DRAFT_ID);
        } else {
            draftNumber = await CommonRepo.fetchSequenceNumber(draftIdPatternVal, draftIdNoOfDigits);
            eclaimsData.DRAFT_ID = draftNumber;
            eclaimsData.CREATED_ON = new Date().toISOString();
        }
    } else {
        draftNumber = await CommonRepo.fetchSequenceNumber(draftIdPatternVal, draftIdNoOfDigits);
        eclaimsData.DRAFT_ID = draftNumber;
        eclaimsData.CREATED_ON = new Date().toISOString();
    }

    // MODIFIED fields
    if (userInfoDetails) {eclaimsData.MODIFIED_BY = userInfoDetails.STAFF_ID;}
    eclaimsData.MODIFIED_BY_NID = userInfoDetails.NUSNET_ID;
    eclaimsData.MODIFIED_ON = new Date().toISOString();

    item.DRAFT_ID = draftNumber;
    eclaimsData.REQUEST_STATUS = item.REQUEST_STATUS;

    // ACTION SUBMIT logic
    if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT) {
        if (!item.REQUEST_ID && !eclaimsData.REQUEST_ID) {
            const requestNumber = await CommonRepo.fetchSequenceNumber(requestIdPatternVal, requestIdNoOfDigits);
            eclaimsData.REQUEST_ID = requestNumber;
        } else if (item.REQUEST_ID) {
            eclaimsData.REQUEST_ID = item.REQUEST_ID;
        }
        if (roleFlow !== ApplicationConstants.CA) {
            eclaimsData.REQUEST_STATUS = ApplicationConstants.STATUS_PENDING_FOR_CLAIM_ASSISTANT;
        }
    }
    if (item.REQUEST_ID) {
        eclaimsData.REQUEST_ID = item.REQUEST_ID;
    }

    eclaimsData.REQUESTOR_GRP = requestorGroup;
    eclaimsData.STAFF_ID = item.STAFF_ID;
    eclaimsData.CLAIM_TYPE = item.CLAIM_TYPE;
    eclaimsData.CLAIM_REQUEST_TYPE = item.CLAIM_REQUEST_TYPE;

    // CLAIM_MONTH/YEAR logic
    if (item.CLAIM_MONTH && item.CLAIM_MONTH.includes(ApplicationConstants.HYPHEN)) {
        const monthData = item.CLAIM_MONTH.split(ApplicationConstants.HYPHEN);
        if (monthData[0]) {eclaimsData.CLAIM_MONTH = monthData[0].padStart(2, "0");}
        eclaimsData.CLAIM_YEAR = monthData[1];
        // If claim type is 102, fetch working hours
        if (item.CLAIM_TYPE && item.CLAIM_TYPE === ApplicationConstants.CLAIM_TYPE_102) {
            const dateRange = DateUtils.fetchDatesFromMonthAndYear(parseInt(monthData[0]), parseInt(monthData[1]));
            const staffResponseList = await ElligibilityCriteriaRepo.fetchWorkingHours(
                item.STAFF_ID,
                dateRange[0],
                dateRange[1],
                item.CLAIM_TYPE
            );
            const staffResponse = staffResponseList && staffResponseList.length > 0 ? staffResponseList[0] : {};
            eclaimsData.WORKING_HOURS = staffResponse.WORKING_HOURS;
            eclaimsData.APPOINTMENT_TRACK = staffResponse.APPOINTMENT_TRACK;
            eclaimsData.STF_CLAIM_TYPE_CAT = staffResponse.STF_CLAIM_TYPE_CAT;
        }
    }

    // SUBMITTED fields
    if (savedData) {
        eclaimsData.SUBMITTED_BY = savedData.SUBMITTED_BY;
        eclaimsData.SUBMITTED_BY_NID = savedData.SUBMITTED_BY_NID;
        eclaimsData.SUBMITTED_ON = savedData.SUBMITTED_ON;
    } else {
        if (userInfoDetails) {
            eclaimsData.SUBMITTED_BY_NID = userInfoDetails.NUSNET_ID;
            eclaimsData.SUBMITTED_BY = userInfoDetails.STAFF_ID;
        }
        eclaimsData.SUBMITTED_ON = new Date().toISOString();
    }

    // Fetch staff info
    const chrsJobInfoDtls = await ChrsJobInfoRepo.fetchStaffInfoForRequest(item.STAFF_ID, item.ULU, item.FDLU);
    if (!chrsJobInfoDtls || chrsJobInfoDtls.length === 0) {
        const chrsJobInfoDatavalidation = EclaimService.frameValidationMessage("Eclaims", "No chrsJobInfoDtls available.");
        validationResults = [chrsJobInfoDatavalidation];
        eclaimsDataResDto.validationResults = validationResults;
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }
    // Persist CHRS info (you'd write this)
    persistChrsJobInfoData(eclaimsData, chrsJobInfoDtls[0]);

    // ULU/FDLU/ULU_T
    if (item.ULU) {eclaimsData.ULU = item.ULU;}
    if (item.FDLU) {eclaimsData.FDLU = item.FDLU;}
    if (item.ULU_T) {eclaimsData.ULU_T = item.ULU_T;}

    // Save EClaims Data
    const savedMasterData = await CommonRepo.upsertOperationChained(tx, "NUSEXT_ECLAIMS_HEADER_DATA", eclaimsData);

    // Save or soft-delete items
    if (item.SelectedClaimDates && item.SelectedClaimDates.length > 0) {
        // Soft delete old items if needed
        if (draftNumber) {
            const itemIdList = item.SelectedClaimDates.map(x => x.ITEM_ID).filter(Boolean);
            const savedItemIds = await EclaimsItemDataRepo.fetchItemIds(draftNumber);
            if (savedItemIds && savedItemIds.length > 0) {
                const itemIdsToSoftDelete = savedItemIds.filter(itemId => !itemIdList.includes(itemId));
                if (itemIdsToSoftDelete.length > 0) {
                    await EclaimsItemDataRepo.softDeleteByItemId(
                        tx,
                        itemIdsToSoftDelete,
                        userInfoDetails.STAFF_ID,
                        new Date()
                    );
                    // await EclaimsItemDataRepo.softDeleteByDraftId(tx, draftNumber, userInfoDetails.STAFF_ID, new Date()); //here
                }
            }
        }
        // Save all item details
        for (const selectedClaimDates of item.SelectedClaimDates) {
            if (!selectedClaimDates) {continue;}
            if (!selectedClaimDates.ITEM_ID) {itemCount++;}
            const eclaimsItemDataResDto = await persistEclaimsItemData(
                draftNumber,
                itemCount,
                selectedClaimDates,
                item,
                eclaimsData,
                nusNetId,
                userInfoDetails
            );
            eclaimsItemsRes.push(eclaimsItemDataResDto);
        }
    } else if (draftNumber) {
        // User deleted all items
        await EclaimsItemDataRepo.softDeleteByDraftId(tx, draftNumber, userInfoDetails.STAFF_ID, new Date());
    }

    // CA Save? (add participants and verifiers)
    if (isCASave) {
        await populateProcessParticipantDetails(item, tx, loggedInUserDetails);
    }

    // Populate Remarks
    await populateRemarksDataDetails(item.REMARKS, item.DRAFT_ID, tx);

    // Persist processDetails & taskDetails
    try {
        const processDetails = await ProcessDetailsRepo.fetchByReferenceId(draftNumber, item.CLAIM_TYPE);
        if (
            savedData &&
            item.ACTION &&
            item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
            processDetails &&
            processDetails.PROCESS_INST_ID
        ) {
            const verifyRequest = [
                {
                    DRAFT_ID: item.DRAFT_ID,
                    REQUEST_ID: savedData.REQUEST_ID,
                    PROCESS_CODE: savedData.CLAIM_TYPE,
                    ACTION_CODE: ApplicationConstants.ACTION_SUBMIT,
                    TASK_INST_ID: (await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE))
                        ?.TASK_INST_ID,
                    ROLE: item.ROLE,
                    IS_REMARKS_UPDATE: true,
                },
            ];
            await inboxService.massTaskAction(verifyRequest, token, null, item.ACTION);
        } else if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT) {
            const additionalApproverOne = await isAdditionalApproverOneExists(item);
            const verifier = await isVerifierExists(item);
            // Async fire-and-forget (as in Java's CompletableFuture.runAsync)
            (async () => {
                try {
                    await initiateProcessOnEclaimSubmit(
                        savedMasterData,
                        item,
                        additionalApproverOne,
                        nusNetId,
                        chrsJobInfoDtls[0],
                        verifier
                    );
                    if (item.IsMassUpload && item.IsMassUpload.toUpperCase() === "Y") {
                        await releaseLock(savedMasterData.SUBMITTED_BY, savedMasterData.DRAFT_ID);
                    }
                } catch (e) {
                    console.error("Exception in process persistence flow", e);
                }
            })();
        }
    } catch (exception) {
        console.error("Exception on process details and task details commit - ", exception);
    }

    // Copy properties from savedMasterData to eclaimsDataResDto
    Object.assign(eclaimsDataResDto, savedMasterData);
    eclaimsDataResDto.eclaimsItemDataDetails = eclaimsItemsRes;
    return eclaimsDataResDto;
}

/**
 *
 * @param item
 * @param tx
 * @param loggedInUserDetails
 */
async function populateProcessParticipantDetails(item, tx, loggedInUserDetails) {
    // await processParticipantsRepository.softDeleteByDraftId(item.DRAFT_ID); // Uncomment if you want to use it

    const ppntIdList = [];

    // Process ADDTIONAL_APPROVER_1
    if (item.ADDTIONAL_APPROVER_1 && Array.isArray(item.ADDTIONAL_APPROVER_1) && item.ADDTIONAL_APPROVER_1.length > 0) {
        for (const additionalApproverOne of item.ADDTIONAL_APPROVER_1) {
            if (
                additionalApproverOne &&
                additionalApproverOne.NUSNET_ID &&
                additionalApproverOne.NUSNET_ID.trim() !== ""
            ) {
                const updated = await persistProcessParticipantDetails(
                    additionalApproverOne,
                    item,
                    loggedInUserDetails,
                    ApplicationConstants.TASK_ACTION_addapp1,
                    tx
                );
                ppntIdList.push(updated.PPNT_ID);
            }
        }
    }

    // Process ADDTIONAL_APPROVER_2
    if (item.ADDTIONAL_APPROVER_2 && Array.isArray(item.ADDTIONAL_APPROVER_2) && item.ADDTIONAL_APPROVER_2.length > 0) {
        for (const additionalApproverTwo of item.ADDTIONAL_APPROVER_2) {
            if (
                additionalApproverTwo &&
                additionalApproverTwo.NUSNET_ID &&
                additionalApproverTwo.NUSNET_ID.trim() !== ""
            ) {
                const updated = await persistProcessParticipantDetails(
                    additionalApproverTwo,
                    item,
                    loggedInUserDetails,
                    ApplicationConstants.TASK_ACTION_addapp2,
                    tx
                );
                ppntIdList.push(updated.PPNT_ID);
            }
        }
    }

    // Process VERIFIER
    if (item.VERIFIER && Array.isArray(item.VERIFIER) && item.VERIFIER.length > 0) {
        for (const verifier of item.VERIFIER) {
            if (verifier && verifier.NUSNET_ID && verifier.NUSNET_ID.trim() !== "") {
                const updated = await persistProcessParticipantDetails(
                    verifier,
                    item,
                    token,
                    loggedInUserDetails,
                    ApplicationConstants.TASK_ACTION_verifier,
                    tx
                );
                ppntIdList.push(updated.PPNT_ID);
            }
        }
    }

    // Fetch all participants currently saved for this draft
    const savedParticipants = await ProcessParticipantsRepo.fetchPPNTIdDtls(item.DRAFT_ID);

    if (savedParticipants && savedParticipants.length > 0) {
        // Find participants that were saved but not updated in this operation (should be soft deleted)
        const softDeleteIds = savedParticipants.filter(savedId => !ppntIdList.includes(savedId));
        if (softDeleteIds && softDeleteIds.length > 0) {
            await ProcessParticipantsRepo.softDeleteByPPNTId(tx, softDeleteIds);
        }
    }
}

/**
 *
 * @param claimInnerRequestDto
 * @param item
 * @param loggedInUserDetails
 * @param userDesignation
 * @param tx
 */
async function persistProcessParticipantDetails(claimInnerRequestDto, item, loggedInUserDetails, userDesignation, tx) {
    // Get user details from token (assumed async)
    const userInfoDetails = loggedInUserDetails;

    // Build the ProcessParticipants object
    const processParticipants = {};

    processParticipants.NUSNET_ID = claimInnerRequestDto.NUSNET_ID;

    if (claimInnerRequestDto.PPNT_ID && claimInnerRequestDto.PPNT_ID.trim() !== "") {
        processParticipants.PPNT_ID = claimInnerRequestDto.PPNT_ID;
    } else {
        // Generate PPNT_ID
        const now = new Date();
        const requestMonth = String(now.getMonth() + 1).padStart(2, "0"); // JS months: 0-11
        const requestYear = String(now.getFullYear() % 100).padStart(2, "0");
        const particpantIdPattern = `PPNT${requestYear}${requestMonth}`;
        // Assume fetchSequenceNumber is async and returns a string
        const participantId = await CommonRepo.fetchSequenceNumber(particpantIdPattern, 4);
        processParticipants.PPNT_ID = participantId;
    }

    processParticipants.REFERENCE_ID = item.DRAFT_ID;
    processParticipants.STAFF_ID = claimInnerRequestDto.STAFF_ID;
    processParticipants.UPDATED_ON = new Date();
    processParticipants.STAFF_FULL_NAME = claimInnerRequestDto.STAFF_FULL_NAME;
    processParticipants.IS_DELETED = ApplicationConstants.N;

    if (userInfoDetails) {
        processParticipants.UPDATED_BY_NID = userInfoDetails.NUSNET_ID;
        processParticipants.UPDATED_BY = userInfoDetails.STAFF_ID;
    }

    processParticipants.USER_DESIGNATION = userDesignation;

    // Save to DB (assumed async)
    // const savedParticipant = await processParticipantsRepository.save(processParticipants);
    const savedParticipant = await CommonRepo.upsertOperationChained(
        tx,
        "NUSEXT_UTILITY_PROCESS_PARTICIPANTS",
        processParticipants
    );
    return savedParticipant;
}

/**
 *
 * @param claimInnerRequestDto
 * @param draftId
 * @param tx
 */
async function populateRemarksDataDetails(claimInnerRequestDto, draftId, tx) {
    if (
        claimInnerRequestDto &&
        Array.isArray(claimInnerRequestDto) &&
        claimInnerRequestDto.length > 0 &&
        draftId &&
        draftId.trim() !== ""
    ) {
        for (const remarksData of claimInnerRequestDto) {
            if (remarksData) {
                const inputData = {};

                // Set ID (reuse if present, else generate)
                if (remarksData.ID && remarksData.ID.trim() !== "") {
                    inputData.ID = remarksData.ID;
                } else {
                    const now = new Date();
                    const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
                    const requestYear = String(now.getFullYear() % 100).padStart(2, "0");
                    const remarkIdPattern = `RMK${requestYear}${requestMonth}`;
                    // Assume async function returning a string
                    inputData.ID = await CommonRepo.fetchSequenceNumber(remarkIdPattern, 5);
                }

                inputData.NUSNET_ID = remarksData.NUSNET_ID;
                inputData.REFERENCE_ID = draftId;
                inputData.STAFF_ID = remarksData.STAFF_ID;
                inputData.STAFF_NAME = remarksData.STAFF_NAME;

                // Sanitize REMARKS
                let tempRemarks = remarksData.REMARKS && remarksData.REMARKS.trim() !== "" ? remarksData.REMARKS : "";
                tempRemarks = tempRemarks.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                inputData.REMARKS = tempRemarks;

                inputData.REMARKS_UPDATE_ON = remarksData.REMARKS_UPDATE_ON;
                inputData.STAFF_USER_TYPE = remarksData.STAFF_USER_TYPE;
                inputData.IS_EDITABLE = 0;

                // Save (assume async)
                // await remarksDataRepository.save(inputData);
                await commonQuery.upsertOperationChained(tx, "NUSEXT_UTILITY_REMARKS_DATA", inputData);
            }
        }
    }
}

/**
 *
 * @param draftNumber
 * @param itemCount
 * @param selectedClaimDates
 * @param item
 * @param eclaimsData
 * @param nusNetId
 * @param userInfoDetails
 */
async function persistEclaimsItemData(
    draftNumber,
    itemCount,
    selectedClaimDates,
    item,
    eclaimsData,
    nusNetId,
    userInfoDetails
) {
    console.info("MassUploadServiceImpl persistEclaimsItemData start()");

    // Build item ID
    let itemId;
    if (selectedClaimDates.ITEM_ID && selectedClaimDates.ITEM_ID.trim() !== "") {
        itemId = selectedClaimDates.ITEM_ID;
    } else {
        itemId =
            draftNumber +
            (ApplicationConstants.PREFIX_ZERO_THREE_DIGITS ? String(itemCount).padStart(3, "0") : String(itemCount));
    }

    // Construct the object
    const eclaimsItemData = {
        ITEM_ID: itemId,
        DRAFT_ID: draftNumber,
        RATE_TYPE: selectedClaimDates.RATE_TYPE,
        CLAIM_DAY: selectedClaimDates.CLAIM_DAY,
        CLAIM_DAY_TYPE: selectedClaimDates.CLAIM_DAY_TYPE,
        CLAIM_START_DATE: selectedClaimDates.CLAIM_START_DATE,
        CLAIM_END_DATE: selectedClaimDates.CLAIM_END_DATE,
        START_TIME: selectedClaimDates.START_TIME,
        END_TIME: selectedClaimDates.END_TIME,
        REMARKS: selectedClaimDates.REMARKS,
        CLAIM_MONTH: eclaimsData.CLAIM_MONTH,
        CLAIM_YEAR: eclaimsData.CLAIM_YEAR,
        HOURS: ApplicationConstants.DEFAULT_DOUBLE_VALUE,
        RATE_TYPE_AMOUNT: Number(ApplicationConstants.DEFAULT_DOUBLE).toFixed(2),
        TOTAL_AMOUNT: Number(ApplicationConstants.DEFAULT_DOUBLE).toFixed(2),
        DISC_RATETYPE_AMOUNT: ApplicationConstants.DEFAULT_DOUBLE_VALUE,
        RATE_UNIT: ApplicationConstants.DEFAULT_DOUBLE_VALUE,
        HOURS_UNIT: ApplicationConstants.DEFAULT_DOUBLE,
        IS_PH: selectedClaimDates.IS_PH,
        WAGE_CODE: selectedClaimDates.WAGE_CODE,
        IS_DISCREPENCY: selectedClaimDates.IS_DISCREPENCY,
        WBS: selectedClaimDates.WBS,
        UPDATED_BY: userInfoDetails.STAFF_ID,
        UPDATED_ON: new Date(),
        IS_DELETED: ApplicationConstants.N,
    };

    // Provide default START_TIME and END_TIME if blank
    if (!eclaimsItemData.START_TIME || eclaimsItemData.START_TIME.trim() === "") {
        eclaimsItemData.START_TIME = ApplicationConstants.CLAIM_START_TIME_DEFAULT;
    }
    if (!eclaimsItemData.END_TIME || eclaimsItemData.END_TIME.trim() === "") {
        eclaimsItemData.END_TIME = ApplicationConstants.CLAIM_END_TIME_DEFAULT;
    }

    // Optional fields with formatting
    if (selectedClaimDates.HOURS && selectedClaimDates.HOURS.trim() !== "") {
        eclaimsItemData.HOURS = Number(selectedClaimDates.HOURS).toFixed(2);
    }
    if (selectedClaimDates.RATE_TYPE_AMOUNT && selectedClaimDates.RATE_TYPE_AMOUNT.trim() !== "") {
        eclaimsItemData.RATE_TYPE_AMOUNT = Number(selectedClaimDates.RATE_TYPE_AMOUNT).toFixed(2);
    }
    if (selectedClaimDates.TOTAL_AMOUNT && selectedClaimDates.TOTAL_AMOUNT.trim() !== "") {
        eclaimsItemData.TOTAL_AMOUNT = Number(selectedClaimDates.TOTAL_AMOUNT).toFixed(2);
    }
    if (selectedClaimDates.DISC_RATETYPE_AMOUNT && selectedClaimDates.DISC_RATETYPE_AMOUNT.trim() !== "") {
        eclaimsItemData.DISC_RATETYPE_AMOUNT = Number(selectedClaimDates.DISC_RATETYPE_AMOUNT).toFixed(2);
    }
    if (selectedClaimDates.RATE_UNIT && selectedClaimDates.RATE_UNIT.trim() !== "") {
        eclaimsItemData.RATE_UNIT = Number(selectedClaimDates.RATE_UNIT).toFixed(2);
    }
    if (selectedClaimDates.HOURS_UNIT && selectedClaimDates.HOURS_UNIT.trim() !== "") {
        eclaimsItemData.HOURS_UNIT = Number(selectedClaimDates.HOURS_UNIT);
    }

    // Set CLAIM_WEEK_NO if CLAIM_START_DATE is provided
    if (selectedClaimDates.CLAIM_START_DATE && selectedClaimDates.CLAIM_START_DATE.trim() !== "") {
        const claimDate = DateUtils.convertStringToDate(
            selectedClaimDates.CLAIM_START_DATE,
            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
        );
        const weekOfYear = await dateToWeekRepository.fetchWeekOfTheDay(claimDate); // Assume async
        eclaimsItemData.CLAIM_WEEK_NO = weekOfYear;
    }

    // Save to database (adjust for your DB or CAP model)
    await commonQuery.upsertOperationChained(tx, "NUSEXT_ECLAIMS_ITEMS_DATA", eclaimsItemData);

    // Prepare result DTO (you may want to use a mapping function or simply return the inserted object)
    const eclaimsItemDataResDto = { ...eclaimsItemData };

    console.info("MassUploadServiceImpl persistEclaimsItemData end()");
    return eclaimsItemDataResDto;
}

/**
 *
 * @param eclaimsData
 * @param chrsJobInfo
 */
function persistChrsJobInfoData(eclaimsData, chrsJobInfo) {
    if (chrsJobInfo) {
        // Defensive: chrsJobInfoId may be undefined/null
        const jobInfoId = chrsJobInfo.chrsJobInfoId || {};

        eclaimsData.CONCURRENT_STAFF_ID = jobInfoId.SF_STF_NUMBER;
        eclaimsData.STAFF_ID = jobInfoId.STF_NUMBER;
        eclaimsData.STAFF_NUSNET_ID = chrsJobInfo.NUSNET_ID;
        eclaimsData.ULU = chrsJobInfo.ULU_C;
        eclaimsData.FDLU = chrsJobInfo.FDLU_C;
        eclaimsData.FULL_NM = chrsJobInfo.FULL_NM;
        eclaimsData.ULU_T = chrsJobInfo.ULU_T;

        if (chrsJobInfo.JOIN_DATE) {
            // If JOIN_DATE is a Date object, convert to ISO string or toString as needed
            if (chrsJobInfo.JOIN_DATE instanceof Date) {
                eclaimsData.DATE_JOINED = chrsJobInfo.JOIN_DATE.toISOString().split("T")[0]; // "YYYY-MM-DD"
            } else {
                eclaimsData.DATE_JOINED = chrsJobInfo.JOIN_DATE.toString();
            }
        }
        eclaimsData.EMPLOYEE_GRP = chrsJobInfo.EMP_GP_C;
    }
}








/**
 *
 * @param rateType
 * @param innerRateType
 */
function isHourlyMonthlyRateType(rateType, innerRateType) {
    const rateTypeObj = RateTypeConfig.fromValue(rateType);
    const innerRateTypeObj = RateTypeConfig.fromValue(innerRateType);

    const unknownValue = RateTypeConfig.UNKNOWN.getValue();
    const hourlyValue = RateTypeConfig.HOURLY.getValue();
    const monthlyValue = RateTypeConfig.MONTHLY.getValue();

    if (
        CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), unknownValue) &&
        CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), unknownValue)
    ) {
        if (
            (CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), hourlyValue) &&
                CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), monthlyValue)) ||
            (CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), monthlyValue) &&
                CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), hourlyValue))
        ) {
            return true;
        }
    }
    return false;
}

/**
 *
 * @param roleFlow
 * @param requestorGroup
 */
function isValidFlowCheck(roleFlow, requestorGroup) {
    // Helper for case-insensitive comparison

    return (
        (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.CA) &&
            CommonUtils.equalsIgnoreCase(requestorGroup, ApplicationConstants.CLAIM_ASSISTANT)) ||
        (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.ESS) &&
            CommonUtils.equalsIgnoreCase(requestorGroup, ApplicationConstants.NUS_CHRS_ECLAIMS_ESS))
    );
}

/**
 *
 * @param selectedClaimDates
 * @param item
 * @param roleFlow
 * @param requestorGroup
 */
async function checkClaimExists(selectedClaimDates, item, roleFlow, requestorGroup) {
    let validationMessage = null;

    // Assuming isValidFlowCheck is synchronous or asynchronous as needed
    const flowValid = isValidFlowCheck(roleFlow, requestorGroup);

    if (
        flowValid &&
        CommonUtils.isNotBlank(selectedClaimDates.CLAIM_START_DATE) &&
        CommonUtils.isNotBlank(selectedClaimDates.CLAIM_END_DATE) &&
        CommonUtils.isNotBlank(item.ULU) &&
        CommonUtils.isNotBlank(item.FDLU) &&
        CommonUtils.isNotBlank(item.STAFF_ID) &&
        CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE)
    ) {
        // Make sure this repository returns a Promise (async)
        const eclaimsItemData = await EclaimsItemDataRepo.checkForExistingReq(
            item.STAFF_ID,
            selectedClaimDates.CLAIM_START_DATE,
            selectedClaimDates.CLAIM_END_DATE,
            item.ULU,
            item.FDLU
        );
        // frameClaimExistMessage should also be implemented/reused in Node
        validationMessage = frameClaimExistMessage(eclaimsItemData, selectedClaimDates, item.CLAIM_REQUEST_TYPE);
    }
    return validationMessage;
}
/**
 *
 * @param eclaimsItemData
 * @param selectedClaimDates
 * @param claimRequestType
 */
function frameClaimExistMessage(eclaimsItemData, selectedClaimDates, claimRequestType) {
    let validationMessage = null;

    if (eclaimsItemData && eclaimsItemData.length > 0) {
        for (const eclaimsItemSavedData of eclaimsItemData) {
            if (
                CommonUtils.isNotBlank(eclaimsItemSavedData.RATE_TYPE) &&
                CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE) &&
                CommonUtils.equalsIgnoreCase(eclaimsItemSavedData.RATE_TYPE, selectedClaimDates.RATE_TYPE)
            ) {
                // Fix for mass upload validation issue - Hourly check not required for Period
                if (
                    (CommonUtils.equalsIgnoreCase(
                        eclaimsItemSavedData.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY
                    ) ||
                        CommonUtils.equalsIgnoreCase(
                            eclaimsItemSavedData.RATE_TYPE,
                            ApplicationConstants.RATE_TYPE_HOURLY_19
                        )) &&
                    !CommonUtils.equalsIgnoreCase(claimRequestType, ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD)
                ) {
                    // Assume DateUtils.frameLocalDateTime returns a JS Date or dayjs object
                    const claimStartDateTime = DateUtils.frameLocalDateTime(
                        selectedClaimDates.CLAIM_START_DATE,
                        selectedClaimDates.START_TIME
                    );
                    const claimEndDateTime = DateUtils.frameLocalDateTime(
                        selectedClaimDates.CLAIM_END_DATE,
                        selectedClaimDates.END_TIME
                    );
                    const savedStartDateTime = DateUtils.frameLocalDateTime(
                        eclaimsItemSavedData.CLAIM_START_DATE,
                        eclaimsItemSavedData.START_TIME
                    );
                    const savedEndDateTime = DateUtils.frameLocalDateTime(
                        eclaimsItemSavedData.CLAIM_END_DATE,
                        eclaimsItemSavedData.END_TIME
                    );

                    // JavaScript Date comparison
                    if (
                        (savedStartDateTime.getTime() === claimStartDateTime.getTime() &&
                            savedEndDateTime.getTime() === claimEndDateTime.getTime()) ||
                        (claimStartDateTime < savedEndDateTime && savedStartDateTime < claimEndDateTime) ||
                        (claimStartDateTime > savedStartDateTime && claimStartDateTime < savedEndDateTime) ||
                        (savedEndDateTime > claimEndDateTime && savedEndDateTime < claimEndDateTime) ||
                        (claimEndDateTime > savedStartDateTime && claimEndDateTime < savedEndDateTime)
                    ) {
                        validationMessage = "Claim already exists for the provided Start and End Date/Time.";
                        break;
                    }
                } else {
                    if (
                        CommonUtils.equalsIgnoreCase(claimRequestType, ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD)
                    ) {
                        // Checking for Rate Amount validation also
                        if (
                            CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE_AMOUNT) &&
                            Number(Number(selectedClaimDates.RATE_TYPE_AMOUNT).toFixed(2)) ===
                                Number(Number(eclaimsItemSavedData.RATE_TYPE_AMOUNT).toFixed(2))
                        ) {
                            validationMessage = "Claim already exists for the provided Start and End Date.";
                            break;
                        }
                    } else {
                        validationMessage = "Claim already exists for the provided Start and End Date.";
                        break;
                    }
                }
            } else if (
                CommonUtils.isNotBlank(eclaimsItemSavedData.RATE_TYPE) &&
                CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE) &&
                (CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY_20) ||
                    CommonUtils.equalsIgnoreCase(
                        selectedClaimDates.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY_21
                    ))
            ) {
                // Fix for mass upload validation issue - Hourly check not required for Period
                if (
                    CommonUtils.equalsIgnoreCase(
                        eclaimsItemSavedData.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY_20
                    ) ||
                    CommonUtils.equalsIgnoreCase(
                        eclaimsItemSavedData.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY_21
                    )
                ) {
                    validationMessage =
                        "Rate Type T-2 courses Learning Per Sem and T->2 courses Learning Per Sem cannot be selected for same day.";
                    break;
                }
            }
        }
    }
    return validationMessage;
}

/**
 *
 * @param item
 */
async function checkDailyValidation(item) {
    const validationResult = [];
    // Clone and sort inputItems by CLAIM_START_DATE
    const inputItems = [...item.selectedClaimDates].sort((a, b) => {
        const dateA = DateUtils.frameLocalDateTime(a.CLAIM_START_DATE, a.START_TIME);
        const dateB = DateUtils.frameLocalDateTime(b.CLAIM_START_DATE, b.START_TIME);
        return dateA - dateB;
    });

    for (let itemCount = 0; itemCount < inputItems.length; itemCount++) {
        const selectedClaimDates = inputItems[itemCount];

        const claimStartDateTime = DateUtils.frameLocalDateTime(
            selectedClaimDates.CLAIM_START_DATE,
            selectedClaimDates.START_TIME
        );
        const claimEndDateTime = DateUtils.frameLocalDateTime(
            selectedClaimDates.CLAIM_END_DATE,
            selectedClaimDates.END_TIME
        );

        const rateType = selectedClaimDates.RATE_TYPE || "";

        for (let innerItemCount = 0; innerItemCount < inputItems.length; innerItemCount++) {
            const innerItemClaimDates = inputItems[innerItemCount];
            const innerRateType = innerItemClaimDates.RATE_TYPE || "";

            if (
                !innerItemClaimDates.CLAIM_START_DATE ||
                !innerItemClaimDates.CLAIM_END_DATE ||
                innerItemClaimDates.CLAIM_START_DATE.trim() === "" ||
                innerItemClaimDates.CLAIM_END_DATE.trim() === ""
            ) {
                const validationResultsDto = EclaimService.frameItemValidationMsg(
                    "",
                    ApplicationConstants.CLAIM_START_DATE,
                    "Claim Start/End Date is not provided."
                );
                validationResult.push(validationResultsDto);
            }

            if (itemCount !== innerItemCount) {
                const rateTypeMatch =
                    selectedClaimDates.RATE_TYPE &&
                    innerItemClaimDates.RATE_TYPE &&
                    selectedClaimDates.RATE_TYPE.toUpperCase() === innerItemClaimDates.RATE_TYPE.toUpperCase();

                if (
                    (rateTypeMatch && selectedClaimDates.RATE_TYPE.trim() !== "") ||
                    isHourlyMonthlyRateType(rateType, innerRateType)
                ) {
                    const innerClaimStartDateTime = DateUtils.frameLocalDateTime(
                        innerItemClaimDates.CLAIM_START_DATE,
                        innerItemClaimDates.START_TIME
                    );
                    const innerClaimEndDateTime = DateUtils.frameLocalDateTime(
                        innerItemClaimDates.CLAIM_END_DATE,
                        innerItemClaimDates.END_TIME
                    );

                    // Overlap check logic using date comparisons
                    if (
                        (innerClaimStartDateTime.getTime() === claimStartDateTime.getTime() &&
                            innerClaimEndDateTime.getTime() === claimEndDateTime.getTime()) ||
                        (innerClaimStartDateTime > claimStartDateTime && innerClaimStartDateTime < claimEndDateTime) ||
                        (claimStartDateTime > innerClaimStartDateTime && claimStartDateTime < innerClaimEndDateTime) ||
                        (innerClaimEndDateTime > claimEndDateTime && innerClaimEndDateTime < claimEndDateTime) ||
                        (claimEndDateTime > innerClaimStartDateTime && claimEndDateTime < innerClaimEndDateTime)
                    ) {
                        const validationResultsDto = frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.CLAIM_OVERLAP,
                            "Please check claim date(s), start time, end time provided."
                        );
                        validationResult.push(validationResultsDto);
                    }
                }
            }
        }
    }
    return validationResult;
}


module.exports = { postClaims };
