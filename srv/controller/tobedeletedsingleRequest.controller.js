/* eslint-disable no-use-before-define */
const cds = require("@sap/cds");
const CommonRepo = require("../repository/util.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
const ProcessParticipantsRepo = require("../repository/processParticipant.repo");
const ElligibilityCriteriaRepo = require("../repository/eligibilityCriteria.repo");
const DateToWeekRepo = require("../repository/dateToWeek.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const CommonUtils = require("../util/commonUtil");
// const ProcessDetailsRepo = require("../repository/processDetails.repo");
const DateUtils = require("../util/dateUtil");
// const TaskDetailsRepo = require("../repository/taskDetails.repo");
// const ValidationResultsDto = require("../dto/validationResultsDto");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const StatusConfigType = require("../enum/statusConfigType");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const StatusConfigRepo = require("../repository/statusConfig.repo");
const EclaimService = require("../util/eclaimService");
const UserUtil = require("../util/userUtil");

/**
 * Handles the main entry point for single request claims.
 * @param {object} request - The request object.
 * @returns {Promise<object>} The response DTO.
 */
async function postClaims(request) {
    try {
        const tx = cds.tx(request);
        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();
        let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }
        let massUploadRequest = request.data.data;
        // const token = request.token || (request.headers && (request.headers.Authorization || request.headers.authorization));

        let roleFlow = await EclaimService.fetchRole(massUploadRequest);

        massUploadRequest = populateStartTimeEndTime(massUploadRequest, loggedInUserDetails);

        switch (roleFlow) {
            case ApplicationConstants.ESS:
                return claimantSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails);
            case ApplicationConstants.CA:
                return claimAssistantSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails);
            case ApplicationConstants.VERIFIER:
                return verifierSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails);
            case ApplicationConstants.REPORTING_MGR:
            case ApplicationConstants.APPROVER:
                return approverSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails);
            case ApplicationConstants.ADDITIONAL_APP_1:
                return approverSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails);
            case ApplicationConstants.ADDITIONAL_APP_2:
                return approverSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails);
            default:
                throw new ApplicationException("No valid Role type provided.");
        }
    } catch (error) {
        // Logger.debug("route can not bef found for host:", tenantHost);
        console.error("Error in postClaims:", error);
        return {
            error: true,
            message: error.message || "An unexpected error occurred",
            eclaimsData: []
        };
    }
}

/**
 * Populates start and end time for mass upload requests.
 * @param {Array} massUploadRequest - The mass upload request array.
 * @returns {Array} The updated request array.
 */
function populateStartTimeEndTime(massUploadRequest) {
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

// Withdraw Claim Submission
/**
 * Withdraws a claim submission.
 * @param {object} item - The claim item.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function withdrawClaimSubmission(item, userInfoDetails) {
    // TODO: Replace with actual logger if needed
    console.log("withdrawClaimSubmission start()");
    let massUploadResponseDto = {
        error: false,
        message: null,
        eclaimsData: []
    };
    try {
        // Lock check
        const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
        await checkIsLocked(userInfoDetails, fetchRequestLockedByUser);

        // Fetch claim data
        const eclaimsData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        // Fetch status alias using StatusConfigRepository
        const statusAlias = await StatusConfigRepo.fetchEclaimStatus(item.DRAFT_ID);
        if (statusAlias && statusAlias.startsWith("With")) {
            throw new ApplicationException("Requested Claim is already in Withdrawn State");
        }
        if (eclaimsData.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_APPROVED) {
            throw new ApplicationException("Withdraw is not possible. Claim already in Approved status.");
        }
        // Process Details update flow (stubbed)
        // TODO: Implement TaskApprovalDto, taskDetailsRepo, inboxService.massTaskAction
        // ...
        // Update claim and item data (stubbed)
        const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        const eclaimsDataResDto = { ...updated };
        // Fetch items (stubbed)
        // const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
        // eclaimsDataResDto.eclaimsItemDataDetails = savedEclaimsItemData || [];
        massUploadResponseDto.eclaimsData = [eclaimsDataResDto];
        massUploadResponseDto.error = false;
        massUploadResponseDto.message = "Claim Withdrawn successfully.";
    } catch (err) {
        throw new ApplicationException(err.message || err);
    }
    console.log("withdrawClaimSubmission end()");
    return massUploadResponseDto;
}

// Retract Claim Submission
/**
 * Retracts a claim submission.
 * @param {object} item - The claim item.
 * @param {string} roleFlow - The role flow.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function retractClaimSubmission(item, roleFlow, userInfoDetails) {
    console.log("retractClaimSubmission start()");
    let massUploadResponseDto = {
        error: false,
        message: null,
        eclaimsData: []
    };
    try {
        // Lock check
        const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
        await checkIsLocked(userInfoDetails, fetchRequestLockedByUser);
        // Fetch claim data
        const eclaimsData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        // Fetch status config using StatusConfigRepository
        const statusConfig = await StatusConfigRepo.fetchEclaimStatusByDraftId(item.DRAFT_ID);
        if (statusConfig) {
            if (statusConfig.STATUS_CODE === ApplicationConstants.CLAIMANT_RETRACT_STATUS) {
                throw new ApplicationException("Requested Claim is already Retracted by Claimant.");
            }
            if (statusConfig.STATUS_CODE === ApplicationConstants.CLAIM_ASSISTANT_RETRACT_STATUS) {
                throw new ApplicationException("Requested Claim is already Retracted by Claim Assistant.");
            }
        }
        if (eclaimsData.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_APPROVED) {
            throw new ApplicationException("Retract is not possible. Claim already in Approved status.");
        }
        // Role-based restrictions (stubbed)
        // ...
        // Process Details update flow (stubbed)
        // ...
        // Update claim and item data (stubbed)
        const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        const eclaimsDataResDto = { ...updated };
        // Fetch items (stubbed)
        // const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
        // eclaimsDataResDto.eclaimsItemDataDetails = savedEclaimsItemData || [];
        massUploadResponseDto.eclaimsData = [eclaimsDataResDto];
        // Persist Lock Details Table (stubbed)
        // ...
        massUploadResponseDto.error = false;
        massUploadResponseDto.message = "Claim Retracted successfully.";
    } catch (err) {
        throw new ApplicationException(err.message || err);
    }
    console.log("retractClaimSubmission end()");
    return massUploadResponseDto;
}

/**
 * Handles claimant submission flow.
 * @param {object} tx - The transaction object.
 * @param {Array} massUploadRequest - The mass upload request array.
 * @param {string} roleFlow - The role flow.
 * @param {object} loggedInUserDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function claimantSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails) {
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
        if (!item) { continue; }

        // Withdraw or Retract actions (assuming you have those handlers)
        if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_WITHDRAW) {
            return await withdrawClaimSubmission(item, loggedInUserDetails);
        }
        if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_RETRACT) {
            return await retractClaimSubmission(item, roleFlow, loggedInUserDetails);
        }

        let savedData = null;
        if (item.DRAFT_ID && item.DRAFT_ID.trim() !== "") {
            // CAP fetch by key
            savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        }

        // claimantCASaveSubmit: you have to implement/migrate this logic
        const eclaimsDataResDto = await claimantCASaveSubmit(tx, item, ApplicationConstants.NUS_CHRS_ECLAIMS_ESS, savedData, false, roleFlow, loggedInUserDetails);

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
            await initiateLockProcessDetails(tx, eclaimsDataResDto.DRAFT_ID, lockRequestorGrp, eclaimsDataResDto.CLAIM_TYPE, loggedInUserDetails);
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
                // await emailService.sendOnDemandEmails(
                //     eclaimsDataResDto.DRAFT_ID,
                //     eclaimsDataResDto.CLAIM_TYPE,
                //     item.ACTION,
                //     eclaimsDataResDto.REQUESTOR_GRP,
                //     loggedInUserDetails.NUSNET_ID,
                //     null,
                //     item.ROLE,
                //     null,
                //     null,
                //     null
                // );
            } catch (exception) {
                console.error("Exception in email flow", exception);
            }
        }
    }
    console.log("MassUploadServiceImpl claimantSubmissionFlow end()");
    return massUploadResponseDto;
}

/**
 * Fetches the user who locked the request.
 * @param {string} draftId - The draft ID.
 * @returns {Promise<string|null>} The NUSNET ID or null.
 */
async function fetchRequestLockedUser(draftId) {
    // Assume requestLockDetailsRepository.checkIsRequestLocked returns a Promise
    const requestLockDetails = await RequestLockDetailsRepo.checkIsRequestLocked(draftId);

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
 * Checks if the request is locked by another user.
 * @param {object} loggedInUserDetails - The user info.
 * @param {string} fetchRequestLockedByUser - The locked by user NUSNET ID.
 * @throws {Error} If locked by another user.
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
 * Handles save/submit logic for claimant/CA.
 * @param {object} tx - The transaction object.
 * @param {object} item - The claim item.
 * @param {string} requestorGroup - The requestor group.
 * @param {object | null} savedData - The saved data.
 * @param {boolean} isCASave - Is CA save.
 * @param {string} roleFlow - The role flow.
 * @param {object} loggedInUserDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function claimantCASaveSubmit(tx, item, requestorGroup, savedData, isCASave, roleFlow, loggedInUserDetails) {
    // Use loggedInUserDetails as userInfoDetails
    const userInfoDetails = loggedInUserDetails;

    // Status change to draft check
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
    if (!item.REQUEST_STATUS) {
        throw new ApplicationException("Invalid Request Status");
    }

    // Lock check
    const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
    await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

    let eclaimsData = {};
    let eclaimsItemsRes = [];
    const now = new Date();
    const reqMonth = String(now.getMonth() + 1).padStart(2, "0");
    const reqYear = String(now.getFullYear()).slice(-2);
    const draftIdPatternVal = ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_DRAFT_ID_PATTERN + reqYear + reqMonth;
    const requestIdPatternVal = ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_ID_PATTERN + reqYear + reqMonth;
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
    const nusNetId = userInfoDetails.NUSNET_ID;

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
            draftNumber = await CommonRepo.fetchSequenceNumber(draftIdPatternVal, ApplicationConstants.SEQUENCE_DRAFT_ID_DIGITS);
            eclaimsData.DRAFT_ID = draftNumber;
            eclaimsData.CREATED_ON = new Date().toISOString();
        }
    } else {
        draftNumber = await CommonRepo.fetchSequenceNumber(draftIdPatternVal, ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_DRAFT_ID_DIGITS);
        eclaimsData.DRAFT_ID = draftNumber;
        eclaimsData.CREATED_ON = new Date().toISOString();
    }

    // MODIFIED fields
    if (userInfoDetails) { eclaimsData.MODIFIED_BY = userInfoDetails.STF_NUMBER; }
    eclaimsData.MODIFIED_BY_NID = userInfoDetails.NUSNET_ID;
    eclaimsData.MODIFIED_ON = new Date().toISOString();

    item.DRAFT_ID = draftNumber;
    eclaimsData.REQUEST_STATUS = item.REQUEST_STATUS;

    // ACTION SUBMIT logic
    if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT) {
        if (!item.REQUEST_ID && !eclaimsData.REQUEST_ID) {
            const requestNumber = await CommonRepo.fetchSequenceNumber(requestIdPatternVal, ApplicationConstants.SEQUENCE_REQUEST_ID_DIGITS);
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
        if (monthData[0]) { eclaimsData.CLAIM_MONTH = monthData[0].padStart(2, "0"); }
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
            eclaimsData.SUBMITTED_BY = userInfoDetails.STF_NUMBER;
        }
        eclaimsData.SUBMITTED_ON = new Date().toISOString();
    }

    // Fetch staff info and persist job info
    // TODO: Implement or map to your repo/service
    const chrsJobInfoDtls = await ChrsJobInfoRepo.fetchStaffInfoForRequest(item.STAFF_ID, item.ULU, item.FDLU);
    if (!chrsJobInfoDtls || chrsJobInfoDtls.length === 0) {
        const chrsJobInfoDatavalidation = EclaimService.frameValidationMessage("Eclaims", "No chrsJobInfoDtls available.");
        eclaimsDataResDto.validationResults = [chrsJobInfoDatavalidation];
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }
    persistChrsJobInfoData(eclaimsData, chrsJobInfoDtls[0]);

    if (item.ULU) { eclaimsData.ULU = item.ULU; }
    if (item.FDLU) { eclaimsData.FDLU = item.FDLU; }
    if (item.ULU_T) { eclaimsData.ULU_T = item.ULU_T; }

    // Save EClaims Data
    // TODO: Implement or map to your repo/service
    // const savedMasterData = await EclaimsHeaderDataRepo.save(eclaimsData);
    const savedMasterData = eclaimsData; // Placeholder for now

    // SoftDelete logic for claim items
    if (item.selectedClaimDates && item.selectedClaimDates.length > 0) {
        if (draftNumber) {
            const itemIdList = item.selectedClaimDates.map(cd => cd.ITEM_ID).filter(Boolean);
            const savedItemIds = (await EclaimsItemDataRepo.fetchItemIds(draftNumber)).map(row => row.ITEM_ID);
            const itemIdsToSoftDelete = savedItemIds.filter(id => !itemIdList.includes(id));
            if (itemIdsToSoftDelete.length > 0) {
                await EclaimsItemDataRepo.softDeleteByItemId(tx, itemIdsToSoftDelete, userInfoDetails.STAFF_ID, DateUtils.formatDateAsString(new Date(), 'yyyy-MM-dd'));
            }
        }
        for (const selectedClaimDates of item.selectedClaimDates) {
            if (selectedClaimDates) {
                if (!selectedClaimDates.ITEM_ID) {
                    itemCount++;
                }
                await persistEclaimsItemData(tx, draftNumber, itemCount, selectedClaimDates, item, eclaimsData, nusNetId, userInfoDetails);
            }
        }
    } else if (draftNumber) {
        await EclaimsItemDataRepo.softDeleteByDraftId(tx, draftNumber, userInfoDetails.STAFF_ID, DateUtils.formatDateAsString(new Date(), 'yyyy-MM-dd'));
    }

    if (isCASave) {
        await populateProcessParticipantDetails(item, tx, loggedInUserDetails);
    }

    await populateRemarksDataDetails(item.REMARKS, item.DRAFT_ID, tx);

    // TODO: Implement processDetails & taskDetails persistence and async process initiation

    // Shallow copy savedMasterData to eclaimsDataResDto
    Object.assign(eclaimsDataResDto, savedMasterData);
    eclaimsDataResDto.eclaimsItemDataDetails = eclaimsItemsRes;
    return eclaimsDataResDto;
}

/**
 * Populates process participant details.
 * @param {object} item - The claim item.
 * @param {object} tx - The transaction object.
 * @param {object} loggedInUserDetails - The user info.
 * @returns {Promise<void>}
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
        const softDeleteIds = savedParticipants.filter(savedId => !ppntIdList.includes(savedId.PPNT_ID)).map(row => row.PPNT_ID);
        if (softDeleteIds && softDeleteIds.length > 0) {
            await ProcessParticipantsRepo.softDeleteByPPNTId(tx, softDeleteIds);
        }
    }
}

/**
 * Persists a process participant detail.
 * @param {object} claimInnerRequestDto - The inner request DTO.
 * @param {object} item - The claim item.
 * @param {object} loggedInUserDetails - The user info.
 * @param {string} userDesignation - The user designation.
 * @param {object} tx - The transaction object.
 * @returns {Promise<object>} The saved participant.
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
 * Populates remarks data details.
 * @param {Array} claimInnerRequestDto - The remarks array.
 * @param {string} draftId - The draft ID.
 * @param {object} tx - The transaction object.
 * @returns {Promise<void>}
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
                await CommonRepo.upsertOperationChained(tx, "NUSEXT_UTILITY_REMARKS_DATA", inputData);
            }
        }
    }
}

/**
 * Persists eclaims item data.
 * @param {object} tx - The transaction object.
 * @param {string} draftNumber - The draft number.
 * @param {number} itemCount - The item count.
 * @param {object} selectedClaimDates - The selected claim dates.
 * @param {object} item - The claim item.
 * @param {object} eclaimsData - The eclaims data.
 * @param {string} nusNetId - The NUSNET ID.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<object>} The item data DTO.
 */
async function persistEclaimsItemData(tx, draftNumber, itemCount, selectedClaimDates, item, eclaimsData, nusNetId, userInfoDetails) {
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
        const weekOfYear = await DateToWeekRepo.fetchWeekOfTheDay(claimDate);
        eclaimsItemData.CLAIM_WEEK_NO = weekOfYear && weekOfYear.length > 0 ? weekOfYear[0].WEEK : null;
    }

    // Save to database (adjust for your DB or CAP model)
    await CommonRepo.upsertOperationChained(tx, "NUSEXT_ECLAIMS_ITEMS_DATA", eclaimsItemData);

    // Prepare result DTO (you may want to use a mapping function or simply return the inserted object)
    const eclaimsItemDataResDto = { ...eclaimsItemData };

    console.info("MassUploadServiceImpl persistEclaimsItemData end()");
    return eclaimsItemDataResDto;
}

/**
 * Persists CHRS job info data.
 * @param {object} eclaimsData - The eclaims data.
 * @param {object} chrsJobInfo - The CHRS job info.
 */
function persistChrsJobInfoData(eclaimsData, chrsJobInfo) {
    if (chrsJobInfo) {
        // // Defensive: chrsJobInfoId may be undefined/null
        // const jobInfoId = chrsJobInfo.chrsJobInfoId || {};

        eclaimsData.CONCURRENT_STAFF_ID = chrsJobInfo.SF_STF_NUMBER;
        eclaimsData.STAFF_ID = chrsJobInfo.STF_NUMBER;
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







// Claim Assistant Submission Flow
/**
 * Handles claim assistant submission flow.
 * @param {object} tx - The transaction object.
 * @param {Array} massUploadRequest - The mass upload request array.
 * @param {string} roleFlow - The role flow.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function claimAssistantSubmissionFlow(tx, massUploadRequest, roleFlow, userInfoDetails) {
    console.log("claimAssistantSubmissionFlow start()");
    let eclaimsDataResDtoList = [];
    let massUploadResponseDto = {
        message: "Successfully Uploaded.",
        error: false,
        eclaimsData: []
    };
    try {
        for (const item of massUploadRequest) {
            if (!item) {continue;}

            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT) {
                // TODO: Implement or stub rejectClaimSubmission
                // return await rejectClaimSubmission(item, token, roleFlow);
                throw new ApplicationException("Reject flow not implemented");
            }
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_CHECK) {
                // TODO: Implement or stub checkClaimSubmission
                // return await checkClaimSubmission(item, token, roleFlow);
                throw new ApplicationException("Check flow not implemented");
            }
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_WITHDRAW) {
                return await withdrawClaimSubmission(item, userInfoDetails);
            }
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_RETRACT) {
                return await retractClaimSubmission(item, roleFlow, userInfoDetails);
            }
            if (
                item.ACTION &&
                (item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SAVE ||
                    item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT)
            ) {
                let requestorGroup = ApplicationConstants.CLAIM_ASSISTANT;
                let savedData = null;
                if (item.DRAFT_ID) {
                    savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
                    if (
                        savedData &&
                        savedData.REQUESTOR_GRP &&
                        savedData.REQUESTOR_GRP.toUpperCase() === ApplicationConstants.NUS_CHRS_ECLAIMS_ESS
                    ) {
                        requestorGroup = ApplicationConstants.NUS_CHRS_ECLAIMS_ESS;
                    }
                }
                const eclaimsDataResDto = await claimantCASaveSubmit(tx, item, requestorGroup, savedData, true, roleFlow, userInfoDetails);
                if (eclaimsDataResDto.ERROR_STATE) {
                    massUploadResponseDto.message = MessageConstants.VALIDATION_RESULT_MESSAGE;
                    massUploadResponseDto.error = true;
                } else {
                    // Persist Lock Details Table - Start
                    let lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
                    if (
                        eclaimsDataResDto.REQUEST_STATUS &&
                        eclaimsDataResDto.REQUEST_STATUS.toUpperCase() !== ApplicationConstants.STATUS_ECLAIMS_DRAFT
                    ) {
                        // Map StatusConfigType.fromValue logic
                        const requestorGrp = StatusConfigType.fromValue(eclaimsDataResDto.REQUEST_STATUS);
                        if (!requestorGrp.isUnknown()) {
                            lockRequestorGrp = requestorGrp.getValue();
                        }
                    }
                    // TODO: Implement initiateLockProcessDetails
                    // await initiateLockProcessDetails(eclaimsDataResDto.DRAFT_ID, eclaimsJWTTokenUtil.fetchNusNetIdFromToken(token), lockRequestorGrp, eclaimsDataResDto.CLAIM_TYPE);
                }
                eclaimsDataResDtoList.push(eclaimsDataResDto);
                // Email Acknowledgement sending - Start
                if (
                    item.ACTION &&
                    item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
                    eclaimsDataResDto.DRAFT_ID
                ) {
                    try {
                        // TODO: Implement emailService.sendOnDemandEmails
                        // await emailService.sendOnDemandEmails(...);
                    } catch (exception) {
                        console.error("Exception in email flow", exception);
                    }
                }
                // Email Acknowledgement sending - End
            }
        }
    } catch (err) {
        throw new ApplicationException(err.message || err);
    }
    massUploadResponseDto.eclaimsData = eclaimsDataResDtoList;
    console.log("claimAssistantSubmissionFlow end()");
    return massUploadResponseDto;
}

// Approver Submission Flow
/**
 * Handles approver submission flow.
 * @param {object} tx - The transaction object.
 * @param {Array} massUploadRequest - The mass upload request array.
 * @param {string} roleFlow - The role flow.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function approverSubmissionFlow(tx, massUploadRequest, roleFlow, userInfoDetails) {
    console.log("approverSubmissionFlow start()");
    let massUploadResponseDto = {
        error: false,
        message: null,
        eclaimsData: []
    };
    let eclaimsDataResDtoList = [];
    try {
        for (const item of massUploadRequest) {
            if (!item) {continue;}
            if (!item.DRAFT_ID) {throw new ApplicationException("Draft Id is blank/empty.Please provide Draft Id.");}
            // Lock check
            const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
            await checkIsLocked(userInfoDetails, fetchRequestLockedByUser);
            if (item.ACTION && item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE) {
                // TODO: Implement remarks and process logic as needed
                // await populateRemarksDataDetails(item.REMARKS, item.DRAFT_ID);
                // ...
                // TODO: Implement task approval and inboxService.massTaskAction
            } else {
                // TODO: Implement verifierApproverSaveFlow
            }
            // Fetch updated claim and items (stubbed)
            const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsDataResDto = { ...updated };
            // eclaimsDataResDto.eclaimsItemDataDetails = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID) || [];
            eclaimsDataResDtoList.push(eclaimsDataResDto);
            // TODO: Implement lock details and requestor group logic
        }
    } catch (err) {
        throw new ApplicationException(err.message || err);
    }
    massUploadResponseDto.eclaimsData = eclaimsDataResDtoList;
    console.log("approverSubmissionFlow end()");
    return massUploadResponseDto;
}

// Verifier Submission Flow
/**
 * Handles verifier submission flow.
 * @param {object} tx - The transaction object.
 * @param {Array} massUploadRequest - The mass upload request array.
 * @param {string} roleFlow - The role flow.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<object>} The response DTO.
 */
async function verifierSubmissionFlow(tx, massUploadRequest, roleFlow, userInfoDetails) {
    console.log("verifierSubmissionFlow start()");
    let massUploadResponseDto = {
        error: false,
        message: null,
        eclaimsData: []
    };
    let eclaimsDataResDtoList = [];
    try {
        for (const item of massUploadRequest) {
            if (!item) {continue;}
            if (!item.DRAFT_ID) {throw new ApplicationException("Draft Id is blank/empty.Please provide Draft Id.");}
            // Lock check
            const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
            await checkIsLocked(userInfoDetails, fetchRequestLockedByUser);
            if (item.ACTION && item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE) {
                // TODO: Implement remarks, process participant, and process logic as needed
                // await populateRemarksDataDetails(item.REMARKS, item.DRAFT_ID);
                // await populateProcessParticipantDetails(item, token);
                // ...
                // TODO: Implement task approval and inboxService.massTaskAction
            } else {
                // TODO: Implement verifierApproverSaveFlow
            }
            // Fetch updated claim and items (stubbed)
            const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsDataResDto = { ...updated };
            // eclaimsDataResDto.eclaimsItemDataDetails = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID) || [];
            eclaimsDataResDtoList.push(eclaimsDataResDto);
            // Implement lock details and requestor group logic using StatusConfigType
            let lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
            const requestorGrp = StatusConfigType.fromValue(eclaimsDataResDto.REQUEST_STATUS);
            if (!requestorGrp.isUnknown()) {
                lockRequestorGrp = requestorGrp.getValue();
            }
            await initiateLockProcessDetails(tx, eclaimsDataResDto.DRAFT_ID, lockRequestorGrp, eclaimsDataResDto.CLAIM_TYPE, userInfoDetails);
        }
    } catch (err) {
        throw new ApplicationException(err.message || err);
    }
    massUploadResponseDto.eclaimsData = eclaimsDataResDtoList;
    console.log("verifierSubmissionFlow end()");
    return massUploadResponseDto;
}

// Initiate Lock Process Details
/**
 * Initiates lock process details.
 * @param {object} tx - The transaction object.
 * @param {string} draftId - The draft ID.
 * @param {string} requestorGrp - The requestor group.
 * @param {string} claimType - The claim type.
 * @param {object} userInfoDetails - The user info.
 * @returns {Promise<boolean>} True if successful.
 */
async function initiateLockProcessDetails(tx, draftId, requestorGrp, claimType, userInfoDetails) {
    // Fetch staff info
    let staffId = userInfoDetails && userInfoDetails.STAFF_ID ? userInfoDetails.STAFF_ID : userInfoDetails.NUSNET_ID;
    // Generate LOCK_INST_ID
    const now = new Date();
    const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
    const requestYear = String(now.getFullYear() % 100).padStart(2, "0");
    const lockIdPattern = ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_LOCK_ID_PATTERN + requestYear + requestMonth;
    const lockInstId = (await CommonRepo.fetchSequenceNumber(lockIdPattern, ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_LOCK_ID_DIGITS)).RUNNINGNORESULT;
    // Upsert lock details
    const lockDetails = {
        LOCK_INST_ID: lockInstId,
        REFERENCE_ID: draftId,
        PROCESS_CODE: claimType,
        IS_LOCKED: ApplicationConstants.X,
        LOCKED_BY_USER_NID: staffId,
        STAFF_USER_GRP: requestorGrp,
        REQUEST_STATUS: ApplicationConstants.UNLOCK,
        LOCKED_ON: new Date(),
    };
    await CommonRepo.upsertOperationChained(tx, "NUSEXT_UTILITY_REQUEST_LOCK_DETAILS", lockDetails);
    return true;
}

module.exports = { postClaims };
