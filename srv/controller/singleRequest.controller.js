const cds = require("@sap/cds");
const CommonRepo = require("../repository/util.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
const DateToWeekRepo = require("../repository/dateToWeek.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const CommonUtils = require("../util/commonUtil");
const DateUtils = require("../util/dateUtil");
const ValidationResultsDto = require("../dto/validationResultsDto");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const RateTypeConfig = require("../enum/rateTypeConfig");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
async function postClaims(request) {
    try {
        const tx = cds.tx();
        const user = request.user.id;
        // const userName = user.split('@')[0];
        const userName = "PTT_CA1";
        const upperNusNetId = userName.toUpperCase();
        let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }
        let massUploadRequest = oConnection.request.data.data;

        let roleFlow = await fetchRole(massUploadRequest);

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
        Logger.debug("route can not bef found for host:", tenantHost);
        return
    }
}

async function fetchRole(massUploadRequest) {
    let rolePassed = '';
    if (Array.isArray(massUploadRequest) && massUploadRequest.length > 0) {
        for (const item of massUploadRequest) {
            if (CommonUtils.isEmpty(item.ACTION)) {
                throw new Error('No ACTION passed. Please provide valid action.');
            }
            if (CommonUtils.CommonUtils.isNotBlank(item.ROLE)) {
                switch (item.ROLE) {
                    case ApplicationConstants.ESS:
                        rolePassed = ApplicationConstants.ESS;
                        break;
                    case ApplicationConstants.CA:
                        rolePassed = ApplicationConstants.CA;
                        break;
                    case ApplicationConstants.APPROVER:
                        rolePassed = ApplicationConstants.APPROVER;
                        break;
                    case ApplicationConstants.VERIFIER:
                        rolePassed = ApplicationConstants.VERIFIER;
                        break;
                    case ApplicationConstants.ADDITIONAL_APP_1:
                        rolePassed = ApplicationConstants.ADDITIONAL_APP_1;
                        break;
                    case ApplicationConstants.ADDITIONAL_APP_2:
                        rolePassed = ApplicationConstants.ADDITIONAL_APP_2;
                        break;
                    case ApplicationConstants.REPORTING_MGR:
                        rolePassed = ApplicationConstants.REPORTING_MGR;
                        break;
                    default:
                        rolePassed = '';
                }
            }
        }
    }
    return rolePassed;
}

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

async function claimantSubmissionFlow(massUploadRequest, roleFlow, loggedInUserDetails) {
    console.log('MassUploadServiceImpl claimantSubmissionFlow start()');

    let massUploadResponseDto = {
        message: 'Successfully Uploaded.',
        error: false,
        eclaimsData: []
    };

    if (!massUploadRequest || massUploadRequest.length === 0) {
        throw new ApplicationException('Mass upload request is empty');
    }

    for (const item of massUploadRequest) {
        if (!item) continue;

        // Withdraw or Retract actions (assuming you have those handlers)
        if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_WITHDRAW) {
            return await withdrawClaimSubmission(item, token);
        }
        if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_RETRACT) {
            return await retractClaimSubmission(item, token, roleFlow);
        }

        let savedData = null;
        if (item.DRAFT_ID && item.DRAFT_ID.trim() !== '') {
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
            eclaimsDataResDto.DRAFT_ID !== ''
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
                console.error('Exception in email flow', exception);
            }
        }
    }
    console.log('MassUploadServiceImpl claimantSubmissionFlow end()');
    return massUploadResponseDto;
}

async function fetchRequestLockedUser(draftId) {
    // Assume requestLockDetailsRepository.checkIsRequestLocked returns a Promise
    const requestLockDetails = await requestLockDetailsRepo.checkIsRequestLocked(draftId);

    if (
        requestLockDetails &&
        requestLockDetails.LOCKED_BY_USER_NID &&
        requestLockDetails.LOCKED_BY_USER_NID.trim() !== ''
    ) {
        return requestLockDetails.LOCKED_BY_USER_NID;
    }
    return null;
}

async function checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser) {
    // Get user info (assume userUtil.getLoggedInUserDetails is async)
    const userInfoDetails = loggedInUserDetails
    let staffId = '';
    if (userInfoDetails && userInfoDetails.NUSNET_ID) {
        staffId = userInfoDetails.STAFF_ID;
    }

    if (
        fetchRequestLockedByUser &&
        fetchRequestLockedByUser.trim() !== '' &&
        fetchRequestLockedByUser.toLowerCase() !== staffId.toLowerCase()
    ) {
        // In CAP, use req.error or throw {code, message, status}
        const error = new Error(
            MessageConstants.MSG_REQUEST_LOCKED + fetchRequestLockedByUser
        );
        error.status = 403;
        throw error;
        // OR in express-based APIs, you may use:
        // const { FORBIDDEN } = require('http-status-codes');
        // res.status(FORBIDDEN).json({ error: ... });
    }
}

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
    if (!item.REQUEST_STATUS) throw new ApplicationException("Invalid Request Status");

    // Lock check (assume you implement fetchRequestLockedUser and checkIsLocked)
    const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
    await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

    let eclaimsData = {};
    let eclaimsItemsRes = [];
    const now = new Date();
    const reqMonth = String(now.getMonth() + 1).padStart(2, '0');
    const reqYear = String(now.getFullYear()).slice(-2);
























    // Pending from here ------ Pankaj

























    const draftIdPatternVal = draftIdPattern + reqYear + reqMonth;  //need to check pending
    const requestIdPatternVal = requestIdPattern + reqYear + reqMonth; //need to check pending
    let draftNumber = '';

    // Already submitted check
    if (
        savedData &&
        item.ACTION &&
        item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
        [ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_SUBMITTED,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED]
            .includes(savedData.REQUEST_STATUS)
    ) {
        throw new ApplicationException("Claim is already submitted.");
    }

    const eclaimsDataResDto = {
        validationResults: [],
        ERROR_STATE: false
    };

    // Validation
    let validationResults = await validateEclaimsData(item, roleFlow, requestorGroup, loggedInUserDetails);
    if (validationResults && validationResults.length > 0) {
        eclaimsDataResDto.validationResults = validationResults;
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }

    let itemCount = (item.CLAIM_REQUEST_TYPE &&
        item.CLAIM_REQUEST_TYPE.toUpperCase() === ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD) ? 0 : 1;
    const nusNetId = eclaimsJWTTokenUtil.fetchNusNetIdFromToken(token);

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
            itemCount = await eclaimsItemDataRepository.fetchItemCount(savedData.DRAFT_ID);
        } else {
            draftNumber = await eligibilityCriteriaRepository.fetchSequenceNumber(draftIdPatternVal, draftIdNoOfDigits);
            eclaimsData.DRAFT_ID = draftNumber;
            eclaimsData.CREATED_ON = new Date().toISOString();
        }
    } else {
        draftNumber = await eligibilityCriteriaRepository.fetchSequenceNumber(draftIdPatternVal, draftIdNoOfDigits);
        eclaimsData.DRAFT_ID = draftNumber;
        eclaimsData.CREATED_ON = new Date().toISOString();
    }

    // MODIFIED fields
    if (userInfoDetails) eclaimsData.MODIFIED_BY = userInfoDetails.STAFF_ID;
    eclaimsData.MODIFIED_BY_NID = userInfoDetails.NUSNET_ID;
    eclaimsData.MODIFIED_ON = new Date().toISOString();

    item.DRAFT_ID = draftNumber;
    eclaimsData.REQUEST_STATUS = item.REQUEST_STATUS;

    // ACTION SUBMIT logic
    if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT) {
        if (!item.REQUEST_ID && !eclaimsData.REQUEST_ID) {
            const requestNumber = await eligibilityCriteriaRepository.fetchSequenceNumber(requestIdPatternVal, requestIdNoOfDigits);
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
        if (monthData[0]) eclaimsData.CLAIM_MONTH = monthData[0].padStart(2, '0');
        eclaimsData.CLAIM_YEAR = monthData[1];
        // If claim type is 102, fetch working hours
        if (item.CLAIM_TYPE && item.CLAIM_TYPE === ApplicationConstants.CLAIM_TYPE_102) {
            const dateRange = DateUtils.fetchDatesFromMonthAndYear(parseInt(monthData[0]), parseInt(monthData[1]));
            const staffResponseList = await eligibilityCriteriaRepository.fetchWorkingHours(
                item.STAFF_ID, dateRange[0], dateRange[1], item.CLAIM_TYPE
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
    const chrsJobInfoDtls = await ChrsJobInfoRepository.fetchStaffInfoForRequest(item.STAFF_ID, item.ULU, item.FDLU);
    if (!chrsJobInfoDtls || chrsJobInfoDtls.length === 0) {
        const chrsJobInfoDatavalidation = frameValidationMessage("Eclaims", "No chrsJobInfoDtls available.");
        validationResults = [chrsJobInfoDatavalidation];
        eclaimsDataResDto.validationResults = validationResults;
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }
    // Persist CHRS info (you'd write this)
    await persistChrsJobInfoData(eclaimsData, chrsJobInfoDtls[0]);

    // ULU/FDLU/ULU_T
    if (item.ULU) eclaimsData.ULU = item.ULU;
    if (item.FDLU) eclaimsData.FDLU = item.FDLU;
    if (item.ULU_T) eclaimsData.ULU_T = item.ULU_T;

    // Save EClaims Data
    const savedMasterData = await EclaimsHeaderDataRepo.save(eclaimsData);

    // Save or soft-delete items
    if (item.SelectedClaimDates && item.SelectedClaimDates.length > 0) {
        // Soft delete old items if needed
        if (draftNumber) {
            const itemIdList = item.SelectedClaimDates.map(x => x.ITEM_ID).filter(Boolean);
            const savedItemIds = await eclaimsItemDataRepository.fetchItemIds(draftNumber);
            if (savedItemIds && savedItemIds.length > 0) {
                const itemIdsToSoftDelete = savedItemIds.filter(itemId => !itemIdList.includes(itemId));
                if (itemIdsToSoftDelete.length > 0) {
                    await eclaimsItemDataRepository.softDeleteByItemId(itemIdsToSoftDelete, userInfoDetails.STAFF_ID, new Date());
                }
            }
        }
        // Save all item details
        for (const selectedClaimDates of item.SelectedClaimDates) {
            if (!selectedClaimDates) continue;
            if (!selectedClaimDates.ITEM_ID) itemCount++;
            const eclaimsItemDataResDto = await persistEclaimsItemData(
                draftNumber, itemCount, selectedClaimDates, item, eclaimsData, nusNetId, userInfoDetails
            );
            eclaimsItemsRes.push(eclaimsItemDataResDto);
        }
    } else if (draftNumber) {
        // User deleted all items
        await eclaimsItemDataRepository.softDeleteByDraftId(draftNumber);
    }

    // CA Save? (add participants and verifiers)
    if (isCASave) {
        await populateProcessParticipantDetails(item, token);
    }

    // Populate Remarks
    await populateRemarksDataDetails(item.REMARKS, item.DRAFT_ID);

    // Persist processDetails & taskDetails
    try {
        const processDetails = await processDetailsRepository.fetchByReferenceId(draftNumber, item.CLAIM_TYPE);
        if (
            savedData &&
            item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT &&
            processDetails && processDetails.PROCESS_INST_ID
        ) {
            const verifyRequest = [{
                DRAFT_ID: item.DRAFT_ID,
                REQUEST_ID: savedData.REQUEST_ID,
                PROCESS_CODE: savedData.CLAIM_TYPE,
                ACTION_CODE: ApplicationConstants.ACTION_SUBMIT,
                TASK_INST_ID: (await taskDetailsRepository.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE))?.TASK_INST_ID,
                ROLE: item.ROLE,
                IS_REMARKS_UPDATE: true
            }];
            await inboxService.massTaskAction(verifyRequest, token, null, item.ACTION);
        } else if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT) {
            const additionalApproverOne = await isAdditionalApproverOneExists(item);
            const verifier = await isVerifierExists(item);
            // Async fire-and-forget (as in Java's CompletableFuture.runAsync)
            (async () => {
                try {
                    await initiateProcessOnEclaimSubmit(savedMasterData, item, additionalApproverOne, nusNetId, chrsJobInfoDtls[0], verifier);
                    if (item.IsMassUpload && item.IsMassUpload.toUpperCase() === 'Y') {
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

async function validateEclaimsData(item, roleFlow, requestorGroup, loggedInUserDetails) {
    let response = [];

    try {
        if (item !== null && item !== undefined) {
            response = emptyCheck(item);

            if (item.selectedClaimDates !== null && item.selectedClaimDates !== undefined &&
                item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE.toUpperCase()) {
                const itemDataValidationResults = itemDataValidation(item, roleFlow, requestorGroup, loggedInUserDetails);
                if (itemDataValidationResults !== null && itemDataValidationResults !== undefined && itemDataValidationResults.length > 0) {
                    for (const itemDataValidationResult of itemDataValidationResults) {
                        response.push(itemDataValidationResult);
                    }
                }
            }
        } else {
            const validationResultsDto = frameValidationMessage("Eclaims", "Request is empty/not valid.");
            response.push(validationResultsDto);
        }
    } catch (error) {
        if (error instanceof ParseException) {
            throw error;
        } else {
            throw new Error('An unexpected error occurred');
        }
    }

    return response;
}
function emptyCheck(item) {
    const response = [];

    if (!item.CLAIM_TYPE || item.CLAIM_TYPE.trim() === '') {
        const validationResultsDto = frameValidationMessage("CLAIM_TYPE", "Claim Type is missing.");
        response.push(validationResultsDto);
    }

    if (!item.CLAIM_MONTH || item.CLAIM_MONTH.trim() === '') {
        const validationResultsDto = frameValidationMessage("CLAIM_MONTH", "Claim Month is missing.");
        response.push(validationResultsDto);
    }

    if (!item.ULU || item.ULU.trim() === '') {
        const validationResultsDto = frameValidationMessage("ULU", "ULU is missing.");
        response.push(validationResultsDto);
    }

    if (!item.FDLU || item.FDLU.trim() === '') {
        const validationResultsDto = frameValidationMessage("FDLU", "FDLU is missing.");
        response.push(validationResultsDto);
    }

    if (!item.CLAIM_REQUEST_TYPE || item.CLAIM_REQUEST_TYPE.trim() === '') {
        const validationResultsDto = frameValidationMessage("CLAIM_REQUEST_TYPE", "ClaimRequestType is missing.");
        response.push(validationResultsDto);
    }

    if (!item.STAFF_ID || item.STAFF_ID.trim() === '') {
        const validationResultsDto = frameValidationMessage("STAFF_ID", "staffId is missing.");
        response.push(validationResultsDto);
    }

    if (!item.ACTION || item.ACTION.trim() === '') {
        const validationResultsDto = frameValidationMessage("ACTION", "Action is missing. Please provide Action - SAVE/SUBMIT.");
        response.push(validationResultsDto);
    }

    if (!item.ROLE || item.ROLE.trim() === '') {
        const validationResultsDto = frameValidationMessage("ROLE", "Role is missing.");
        response.push(validationResultsDto);
    }

    if (!item.REQUEST_STATUS || item.REQUEST_STATUS.trim() === '') {
        const validationResultsDto = frameValidationMessage("REQUEST_STATUS", "Request Status is missing.");
        response.push(validationResultsDto);
    }

    if (
        (item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT.toUpperCase() ||
            item.ACTION.toUpperCase() === ApplicationConstants.ACTION_CHECK.toUpperCase() ||
            item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase()) &&
        (!item.selectedClaimDates || item.selectedClaimDates.length === 0)
    ) {
        const validationResultsDto = frameValidationMessage("ITEM", "Please provide claim dates.");
        response.push(validationResultsDto);
    }

    return response;
}

function frameValidationMessage(field, message) {
    const validationResultsDto = new ValidationResultsDto();
    validationResultsDto.setField(field);
    validationResultsDto.setMessage(message);
    // Set other properties if needed
    return validationResultsDto;
}

async function itemDataValidation(item, roleFlow, requestorGroup,loggedInUserDetails) {
    const response = [];


    // Section 1: Current month claim existence check
    const claimType = item.CLAIM_TYPE;
    const claimRequestTypeNumber = item.CLAIM_REQUEST_TYPE_NUMBER;
    const action = item.ACTION;
    const claimMonth = item.CLAIM_MONTH;

    if (
        (!CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_101) &&
            !CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102)) ||
        (CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
            CommonUtils.equalsIgnoreCase(claimRequestTypeNumber, ApplicationConstants.CLAIM_REQUEST_TYPE_MONTHLY_NUMBER))
    ) {
        // check if claim exists for current month
        if (
            CommonUtils.equalsIgnoreCase(action, ApplicationConstants.ACTION_SUBMIT) &&
            claimMonth && claimMonth.includes(ApplicationConstants.HYPHEN)
        ) {
            const [month, year] = claimMonth.split(ApplicationConstants.HYPHEN);
            // Async repository method!
            const count = await EclaimsHeaderDataRepo.fetchMonthlyClaims(month, year, item.STAFF_ID, claimType);
            if (count > 0) {
                response.push(frameItemValidationMsg(
                    claimMonth,
                    ApplicationConstants.CLAIM_EXISTS,
                    "Claim already exists for the provided month."
                ));
            }
        }
    }

    // Section 2: Backdated daily claims - max 2 allowed
    if (
        CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
        CommonUtils.equalsIgnoreCase(claimRequestTypeNumber, ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY_NUMBER)
    ) {
        if (
            CommonUtils.equalsIgnoreCase(action, ApplicationConstants.ACTION_SUBMIT) &&
            claimMonth && claimMonth.includes(ApplicationConstants.HYPHEN)
        ) {
            const [month, year] = claimMonth.split(ApplicationConstants.HYPHEN);
            const enteredMonth = new Date(parseInt(year), parseInt(month) - 1);
            const now = new Date();
            const currentMonth = new Date(now.getFullYear(), now.getMonth());

            // Equivalent to enteredMonth.before(currentMonth)
            if (enteredMonth < currentMonth) {
                // Fetch boundaries for current calendar month
                const inputDates = DateUtils.fetchDatesFromMonthAndYear(now.getMonth() + 1, now.getFullYear());
                // Async repository method!
                const count = await EclaimsHeaderDataRepo.fetchMonthlyClaimsOnSubmittedOn(
                    month, year, item.STAFF_ID, claimType, inputDates[0], inputDates[1]
                );
                if (count >= 2) {
                    response.push(frameItemValidationMsg(
                        claimMonth,
                        ApplicationConstants.CLAIM_EXISTS,
                        "Only 2 backdated claims are allowed."
                    ));
                }
            }
        }
    }

    // Section 3: Check Reporting Manager info
    if (
        CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
        CommonUtils.isNotBlank(item.STAFF_ID)
    ) {
        const userInfoDetails = loggedInUserDetails;
        if (userInfoDetails && userInfoDetails.RM_STF_N) {
            const rmDetails = await CommonRepo.fetchLoggedInUser(userInfoDetails.RM_STF_N);
            if (rmDetails && CommonUtils.isBlank(rmDetails.STAFF_ID)) {
                response.push(frameItemValidationMsg(
                    claimMonth,
                    "REPORTING_MANAGER",
                    `Reporting Manager maintained for '${item.STAFF_ID}' staff is not present.`
                ));
            }
        }
    }

    // Section 4: Per-date validations
    for (let selectedClaimDates of item.selectedClaimDates || []) {
        if (selectedClaimDates) {
            // Set WEEK_NO (simulate repository call)
            selectedClaimDates.WEEK_NO = await DateToWeekRepo.fetchWeekOfTheDay(
                DateUtils.convertStringToDate(selectedClaimDates.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT)
            );

            if (CommonUtils.isBlank(selectedClaimDates.CLAIM_START_DATE)) {
                response.push(frameItemValidationMsg(
                    selectedClaimDates.CLAIM_START_DATE,
                    ApplicationConstants.CLAIM_START_DATE,
                    "Please provide StartDate."
                ));
            }

            if (CommonUtils.isBlank(selectedClaimDates.CLAIM_END_DATE)) {
                response.push(frameItemValidationMsg(
                    selectedClaimDates.CLAIM_START_DATE,
                    ApplicationConstants.CLAIM_END_DATE,
                    "Please provide EndDate."
                ));
            }

            // Start/End date compare
            let validationMessage = "";
            if (
                CommonUtils.isNotBlank(selectedClaimDates.CLAIM_START_DATE) &&
                CommonUtils.isNotBlank(selectedClaimDates.CLAIM_END_DATE)
            ) {
                validationMessage = DateUtils.compareDates(
                    DateUtils.convertStringToDate(selectedClaimDates.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT),
                    DateUtils.convertStringToDate(selectedClaimDates.CLAIM_END_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT)
                );
                if (CommonUtils.isNotBlank(validationMessage)) {
                    response.push(frameItemValidationMsg(
                        selectedClaimDates.CLAIM_START_DATE,
                        ApplicationConstants.CLAIM_START_DATE,
                        validationMessage
                    ));
                }
            }

            // Rate type required for type 101
            if (
                CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_101) &&
                CommonUtils.isBlank(selectedClaimDates.RATE_TYPE)
            ) {
                response.push(frameItemValidationMsg(
                    selectedClaimDates.CLAIM_START_DATE,
                    ApplicationConstants.RATE_TYPE,
                    "Please provide RateType."
                ));
            }

            // Hourly rate type needs start/end time
            if (
                CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE) &&
                CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY) &&
                (CommonUtils.isBlank(selectedClaimDates.START_TIME) || CommonUtils.isBlank(selectedClaimDates.END_TIME))
            ) {
                response.push(frameItemValidationMsg(
                    selectedClaimDates.CLAIM_START_DATE,
                    ApplicationConstants.START_TIME_END_TIME,
                    "Please provide Start Time/End Time."
                ));
            }

            // Section 5: Daily claim date logic
            if (
                CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
                CommonUtils.equalsIgnoreCase(claimRequestTypeNumber, ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY_NUMBER)
            ) {
                // // Custom block for specific dates (you need to implement this function)
                // blockClaimSubmissionFor1stTo3rdMar2024(item, response, selectedClaimDates);

                if (CommonUtils.isNotBlank(claimMonth) && claimMonth.includes(ApplicationConstants.HYPHEN)) {
                    const [month, year] = claimMonth.split(ApplicationConstants.HYPHEN);
                    // Async repository call!
                    const eclaimsDataReq = await EclaimsItemDataRepo.queryDayMonthAndYearRequests(
                        String(item.STAFF_ID), ApplicationConstants.CLAIM_TYPE_102, month, year, selectedClaimDates.CLAIM_START_DATE
                    );
                    let submittedHours = 0.0;
                    for (const eclaimsData of eclaimsDataReq) {
                        if (!CommonUtils.equalsIgnoreCase(eclaimsData.CLAIM_DAY_TYPE, selectedClaimDates.CLAIM_DAY_TYPE)) {
                            response.push(frameItemValidationMsg(
                                selectedClaimDates.CLAIM_START_DATE,
                                "Day Type",
                                `There is already a submited request ${await EclaimsHeaderDataRepo.fetchRequestId(eclaimsData.DRAFT_ID)} with different day type for the day: ${selectedClaimDates.CLAIM_START_DATE}`
                            ));
                        }
                        if (eclaimsData.IS_PH !== selectedClaimDates.IS_PH) {
                            response.push(frameItemValidationMsg(
                                selectedClaimDates.CLAIM_START_DATE,
                                "Indicator",
                                `There is already a submited request ${await EclaimsHeaderDataRepo.fetchRequestId(eclaimsData.DRAFT_ID)} with different indicator for the day: ${selectedClaimDates.CLAIM_START_DATE}`
                            ));
                        }
                        submittedHours += parseFloat(eclaimsData.HOURS_UNIT) || 0;
                    }

                    // Monthly data WBS check
                    const eclaimsMonthlyDataReq = await EclaimsItemDataRepo.queryMonthAndYearRequests(
                        String(item.STAFF_ID), ApplicationConstants.CLAIM_TYPE_102, selectedClaimDates.WEEK_NO
                    );
                    for (const eclaimsData of eclaimsMonthlyDataReq) {
                        if (!CommonUtils.equalsIgnoreCase(eclaimsData.WBS, selectedClaimDates.WBS)) {
                            response.push(frameItemValidationMsg(
                                selectedClaimDates.CLAIM_START_DATE,
                                "WBS",
                                `There is already a submited request ${await EclaimsHeaderDataRepo.fetchRequestId(eclaimsData.DRAFT_ID)} with different WBS for the day :${selectedClaimDates.CLAIM_START_DATE}`
                            ));
                            break;
                        }
                    }

                    // group by CLAIM_START_DATE for the day
                    const groupByDay = (item.selectedClaimDates || []).reduce((acc, curr) => {
                        const key = curr.CLAIM_START_DATE;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(curr);
                        return acc;
                    }, {});
                    const dayList = groupByDay[selectedClaimDates.CLAIM_START_DATE] || [];
                    const hourUnitList = dayList.map(p => parseFloat(p.HOURS_UNIT) || 0);
                    const hoursUnitSum = hourUnitList.reduce((sum, val) => sum + val, 0);
                    const hoursunit = hoursUnitSum + submittedHours;

                    if (hoursunit > 21) {
                        response.push(frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            "Hours/Unit",
                            `Hours unit per day should not be more than 21 hours for day : ${selectedClaimDates.CLAIM_START_DATE}`
                        ));
                    }
                }
            }

            // Only for claim type != 102: hours/unit required, must be numeric and > 0
            if (
                !CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
                (CommonUtils.isBlank(selectedClaimDates.HOURS_UNIT) ||
                    Number(selectedClaimDates.HOURS_UNIT) === 0.0 ||
                    !DateUtils.isNumeric(selectedClaimDates.HOURS_UNIT))
            ) {
                response.push(frameItemValidationMsg(
                    selectedClaimDates.CLAIM_START_DATE,
                    ApplicationConstants.HOURS_UNIT,
                    "Please provide Hours/Unit."
                ));
            }

            // Section 6: CA role-specific checks
            if (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.CA)) {
                if (
                    CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_101) &&
                    (CommonUtils.isBlank(selectedClaimDates.TOTAL_AMOUNT) ||
                        CommonUtils.equalsIgnoreCase(selectedClaimDates.TOTAL_AMOUNT, ApplicationConstants.DEFAULT_DOUBLE_VALUE))
                ) {
                    response.push(frameItemValidationMsg(
                        selectedClaimDates.CLAIM_START_DATE,
                        ApplicationConstants.TOTAL_AMOUNT,
                        "Please provide Total Amount."
                    ));
                }
                if (CommonUtils.isNotBlank(selectedClaimDates.WBS)) {
                    //check WBS by calling a repo
                    validationMessage = await checkWbsElement(selectedClaimDates.WBS); //pending
                    if (CommonUtils.isNotBlank(validationMessage)) {
                        response.push(frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.WBS,
                            validationMessage
                        ));
                    }
                }
            }

            // Section 7: Check for duplicate/overlapping claim
            const claimExistsMessage = checkClaimExists(selectedClaimDates, item, roleFlow, requestorGroup);
            if (CommonUtils.isNotBlank(claimExistsMessage)) {
                response.push(frameItemValidationMsg(
                    selectedClaimDates.CLAIM_START_DATE,
                    ApplicationConstants.CLAIM_EXISTS,
                    claimExistsMessage
                ));
            }
        }
    }

    // Section 8: All WBS for a week must be the same
    if (CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102)) {
        // group by WEEK_NO
        const groupByWeek = (item.selectedClaimDates || []).reduce((acc, curr) => {
            const key = curr.WEEK_NO;
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {});

        const allWbsSame = Object.values(groupByWeek).every(list => {
            const wbsSet = new Set(list.map(p => p.WBS));
            return wbsSet.size === 1;
        });

        if (!allWbsSame) {
            response.push(frameItemValidationMsg(
                "",
                "WBS",
                "Different WBS is entered for the items in the same week."
            ));
        }
    }

    // Section 9: Overlapping dates validation
    const overLappingValidationResult = await checkOverLapping(item);
    if (overLappingValidationResult && overLappingValidationResult.length > 0) {
        response.push(...overLappingValidationResult);
    }

    // Section 10: Staff validity and active check
    if (CommonUtils.equalsIgnoreCase(item.CLAIM_REQUEST_TYPE, ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY)) {
        for (const itemData of item.selectedClaimDates || []) {
            if (!CommonUtils.equalsIgnoreCase(itemData.RATE_TYPE, "18")) {
                // Non-monthly
                const activeValidData = await ChrsJobInfoRepo.checkStaffIsActiveAndValid(
                    item.STAFF_ID,
                    DateUtils.convertStringToDate(itemData.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT),
                    DateUtils.convertStringToDate(itemData.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT),
                    item.ULU, item.FDLU, item.CLAIM_TYPE
                );
                if (!activeValidData || activeValidData.length === 0) {
                    response.push(frameItemValidationMsg(
                        itemData.CLAIM_START_DATE,
                        "Staff Id",
                        "Staff is not active or valid for ULU,FDLU selected."
                    ));
                }
            } else {
                // Monthly
                const activeValidData = await ChrsJobInfoRepo.checkStaffIsActiveAndValidForMonthly(
                    item.STAFF_ID,
                    DateUtils.convertStringToDate(itemData.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT),
                    DateUtils.convertStringToDate(itemData.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT),
                    item.CLAIM_TYPE
                );
                if (!activeValidData || activeValidData.length === 0) {
                    response.push(frameItemValidationMsg(
                        itemData.CLAIM_START_DATE,
                        "Staff Id",
                        "Staff is not active or valid for ULU,FDLU selected."
                    ));
                }
            }
        }
    }

    return response;
}
async function checkOverLapping(item) {
    let validationResult = [];
  
    if (item && item.selectedClaimDates && item.selectedClaimDates.length > 0) {
      if (
        (item.CLAIM_REQUEST_TYPE || '').toUpperCase() === ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD.toUpperCase()
      ) {
        validationResult = await checkPeriodValidation(item);
      } else if (
        (item.CLAIM_REQUEST_TYPE || '').toUpperCase() === ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY.toUpperCase()
      ) {
        validationResult = await checkDailyValidation(item);
      }
    }
    return validationResult;
  }

  async function checkPeriodValidation(item) {
    const validationResult = [];
    const inputItems = [...item.selectedClaimDates]; // Clone/copy array
  
    // Sort by CLAIM_START_DATE
    inputItems.sort((a, b) => {
      const dateA = DateUtils.convertStringToDate(a.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT);
      const dateB = DateUtils.convertStringToDate(b.CLAIM_START_DATE, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT);
      return dateA - dateB;
    });
  
    for (let itemCount = 0; itemCount < inputItems.length; itemCount++) {
      const selectedClaimDates = inputItems[itemCount];
  
      const claimStartDate = DateUtils.convertStringToDate(
        selectedClaimDates.CLAIM_START_DATE,
        ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
      );
      const claimEndDate = DateUtils.convertStringToDate(
        selectedClaimDates.CLAIM_END_DATE,
        ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
      );
  
      const rateType = selectedClaimDates.RATE_TYPE || '';
  
      if (
        !selectedClaimDates.CLAIM_START_DATE || !selectedClaimDates.CLAIM_END_DATE ||
        selectedClaimDates.CLAIM_START_DATE.trim() === '' || selectedClaimDates.CLAIM_END_DATE.trim() === ''
      ) {
        const validationResultsDto = frameItemValidationMsg(
          '',
          ApplicationConstants.CLAIM_START_DATE,
          'Claim Start/End Date is not provided.'
        );
        validationResult.push(validationResultsDto);
      }
  
      // Inner loop
      for (let innerItemCount = 0; innerItemCount < inputItems.length; innerItemCount++) {
        const innerItemClaimDates = inputItems[innerItemCount];
        const innerRateType = innerItemClaimDates.RATE_TYPE || '';
  
        if (itemCount !== innerItemCount) {
          const rateTypeMatch =
            innerItemClaimDates.RATE_TYPE &&
            CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, innerItemClaimDates.RATE_TYPE) &&
            CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE_AMOUNT, innerItemClaimDates.RATE_TYPE_AMOUNT);
  
          if (
            rateTypeMatch ||
            isHourlyMonthlyRateType(rateType, innerRateType)
          ) {
            const innerClaimStartDate = DateUtils.convertStringToDate(
              innerItemClaimDates.CLAIM_START_DATE,
              ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
            );
            const innerClaimEndDate = DateUtils.convertStringToDate(
              innerItemClaimDates.CLAIM_END_DATE,
              ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
            );
  
            // Overlap check logic
            if (
              (innerClaimStartDate.getTime() === claimStartDate.getTime() && innerClaimEndDate.getTime() === claimEndDate.getTime()) ||
              (innerClaimStartDate > claimStartDate && innerClaimStartDate < claimEndDate) ||
              (claimStartDate > innerClaimStartDate && claimStartDate < innerClaimEndDate) ||
              (innerClaimEndDate > claimStartDate && innerClaimEndDate < claimEndDate) ||
              (claimEndDate > innerClaimStartDate && claimEndDate < innerClaimEndDate)
            ) {
              const validationResultsDto = frameItemValidationMsg(
                selectedClaimDates.CLAIM_START_DATE,
                ApplicationConstants.CLAIM_OVERLAP,
                'Please check claim date(s), start time, end time provided.'
              );
              validationResult.push(validationResultsDto);
            }
          }
        }
      }
    }
  
    return validationResult;
  }
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
        (CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), hourlyValue) && CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), monthlyValue)) ||
        (CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), monthlyValue) && CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), hourlyValue))
      ) {
        return true;
      }
    }
    return false;
  }

function isValidFlowCheck(roleFlow, requestorGroup) {
    // Helper for case-insensitive comparison
  
    return (
      (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.CA) &&
      CommonUtils.equalsIgnoreCase(requestorGroup, ApplicationConstants.CLAIM_ASSISTANT)) ||
      (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.ESS) &&
      CommonUtils.equalsIgnoreCase(requestorGroup, ApplicationConstants.NUS_CHRS_ECLAIMS_ESS))
    );
  }

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
      validationMessage = frameClaimExistMessage(
        eclaimsItemData,
        selectedClaimDates,
        item.CLAIM_REQUEST_TYPE
      );
    }
    return validationMessage;
  }
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
            (CommonUtils.equalsIgnoreCase(eclaimsItemSavedData.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY) ||
            CommonUtils.equalsIgnoreCase(eclaimsItemSavedData.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY_19)) &&
            !CommonUtils.equalsIgnoreCase(claimRequestType, ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD)
          ) {
            // Assume DateUtils.frameLocalDateTime returns a JS Date or dayjs object
            const claimStartDateTime = DateUtils.frameLocalDateTime(
              selectedClaimDates.CLAIM_START_DATE, selectedClaimDates.START_TIME
            );
            const claimEndDateTime = DateUtils.frameLocalDateTime(
              selectedClaimDates.CLAIM_END_DATE, selectedClaimDates.END_TIME
            );
            const savedStartDateTime = DateUtils.frameLocalDateTime(
              eclaimsItemSavedData.CLAIM_START_DATE, eclaimsItemSavedData.START_TIME
            );
            const savedEndDateTime = DateUtils.frameLocalDateTime(
              eclaimsItemSavedData.CLAIM_END_DATE, eclaimsItemSavedData.END_TIME
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
            if (CommonUtils.equalsIgnoreCase(claimRequestType, ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD)) {
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
          CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY_21))
        ) {
          // Fix for mass upload validation issue - Hourly check not required for Period
          if (
            CommonUtils.equalsIgnoreCase(eclaimsItemSavedData.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY_20) ||
            CommonUtils.equalsIgnoreCase(eclaimsItemSavedData.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY_21)
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
  
      const rateType = selectedClaimDates.RATE_TYPE || '';
  
      for (let innerItemCount = 0; innerItemCount < inputItems.length; innerItemCount++) {
        const innerItemClaimDates = inputItems[innerItemCount];
        const innerRateType = innerItemClaimDates.RATE_TYPE || '';
  
        if (
          !innerItemClaimDates.CLAIM_START_DATE ||
          !innerItemClaimDates.CLAIM_END_DATE ||
          innerItemClaimDates.CLAIM_START_DATE.trim() === '' ||
          innerItemClaimDates.CLAIM_END_DATE.trim() === ''
        ) {
          const validationResultsDto = frameItemValidationMsg(
            '',
            ApplicationConstants.CLAIM_START_DATE,
            'Claim Start/End Date is not provided.'
          );
          validationResult.push(validationResultsDto);
        }
  
        if (itemCount !== innerItemCount) {
          const rateTypeMatch =
            selectedClaimDates.RATE_TYPE &&
            innerItemClaimDates.RATE_TYPE &&
            selectedClaimDates.RATE_TYPE.toUpperCase() === innerItemClaimDates.RATE_TYPE.toUpperCase();
  
          if (
            (rateTypeMatch && selectedClaimDates.RATE_TYPE.trim() !== '') ||
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
              (innerClaimStartDateTime > claimStartDateTime &&
                innerClaimStartDateTime < claimEndDateTime) ||
              (claimStartDateTime > innerClaimStartDateTime &&
                claimStartDateTime < innerClaimEndDateTime) ||
              (innerClaimEndDateTime > claimEndDateTime &&
                innerClaimEndDateTime < claimEndDateTime) ||
              (claimEndDateTime > innerClaimStartDateTime &&
                claimEndDateTime < innerClaimEndDateTime)
            ) {
              const validationResultsDto = frameItemValidationMsg(
                selectedClaimDates.CLAIM_START_DATE,
                ApplicationConstants.CLAIM_OVERLAP,
                'Please check claim date(s), start time, end time provided.'
              );
              validationResult.push(validationResultsDto);
            }
          }
        }
      }
    }
    return validationResult;
  }

function frameItemValidationMsg(claimDate, columnName, message) {
    const validationResultsDto = new ValidationResultsDto();
    validationResultsDto.setType(MessageConstants.ERROR);
    validationResultsDto.setDisplayIdx(claimDate);
    validationResultsDto.setsTitle(`Claim Date : ${claimDate}\n Column : ${columnName}`);
    validationResultsDto.setTitle(columnName);
    validationResultsDto.setState(MessageConstants.ERROR);
    validationResultsDto.setMessage(message);
    validationResultsDto.setIdx(claimDate);
    return validationResultsDto;
}



module.exports = { postClaims }