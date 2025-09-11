/* eslint-disable no-use-before-define */
const CommonRepo = require("../repository/util.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
const ProcessParticipantsRepo = require("../repository/processParticipant.repo");
const ElligibilityCriteriaRepo = require("../repository/eligibilityCriteria.repo");
const DateToWeekRepo = require("../repository/dateToWeek.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const CommonUtils = require("../util/commonUtil");
const DateUtils = require("../util/dateUtil");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const StatusConfigType = require("../enum/statusConfigType");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const StatusConfigRepo = require("../repository/statusConfig.repo");
const RemarksDataRepo = require("../repository/remarksData.repo");
const ProcessDetailsRepo = require("../repository/processDetails.repo");
const TaskDetailsRepo = require("../repository/taskDetails.repo");
const RequestLockService = require("../util/requestLockService");
const EclaimService = require("../util/eclaimService");
const UserUtil = require("../util/userUtil");
const ProcessDetailsService = require("../util/processDetails");
const emailService = require("../service/emailService");

/**
 * Converted Single Request method from Java implementation
 * This method handles mass upload requests for eclaims processing
 * @param {Object} request - The request object containing mass upload data
 * @returns {Promise<Object>} The upload response DTO
 */
async function singleRequest(request) {
    console.log("ConvertedSingleRequestController convertedSingleRequest start()");

    const uploadResponseDto = {
        claimDataResponse: null,
        error: false,
        message: "",
        ignoreError: false
    };

    // Create transaction at the beginning
    const tx = cds.tx(request);

    try {
        // Extract user information using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();

        // Fetch logged in user details
        let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);
        if (!loggedInUserDetails) {
            throw new Error("User not found..!!");
        }

        // Extract mass upload request data
        let massUploadRequest = request.data.data;
        if (!massUploadRequest || !Array.isArray(massUploadRequest) || massUploadRequest.length === 0) {
            throw new ApplicationException("Mass upload request is empty");
        }

        // Fetch role from the request
        let roleFlow = await EclaimService.fetchRole(massUploadRequest);

        // Populate start and end time
        massUploadRequest = populateStartTimeEndTime(massUploadRequest);

        // Process based on role flow - PASS TRANSACTION TO ALL FUNCTIONS
        let responseDto;
        switch (roleFlow) {
            case ApplicationConstants.ESS:
                responseDto = await claimantSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, request);
                break;
            case ApplicationConstants.CA:
                responseDto = await claimAssistantSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails, request);
                break;
            case ApplicationConstants.VERIFIER:
                responseDto = await verifierSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, request);
                break;
            case ApplicationConstants.REPORTING_MGR:
            case ApplicationConstants.APPROVER:
                responseDto = await approverSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, request);
                break;
            case ApplicationConstants.ADDITIONAL_APP_1:
                responseDto = await additionalApproverSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, request, ApplicationConstants.ADDITIONAL_APP_1);
                break;
            case ApplicationConstants.ADDITIONAL_APP_2:
                responseDto = await additionalApproverSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, request, ApplicationConstants.ADDITIONAL_APP_2);
                break;
            default:
                throw new ApplicationException("No valid Role type provided.");
        }

        // Set response data
        uploadResponseDto.claimDataResponse = responseDto;
        uploadResponseDto.error = responseDto.error || false;
        uploadResponseDto.message = responseDto.message || "Successfully Uploaded.";

        // COMMIT TRANSACTION ON SUCCESS
        console.log("About to commit transaction...");
        try {
            // await tx.commit();
            console.log("Transaction committed successfully");
        } catch (commitError) {
            console.error("Error during transaction commit:", commitError);
            // If commit fails, try to rollback
            try {
                await tx.rollback();
            } catch (rollbackError) {
                console.error("Error during transaction rollback after commit failure:", rollbackError);
            }
            throw commitError;
        }

    } catch (error) {
        console.error("Exception in convertedSingleRequest:", error);

        // ROLLBACK TRANSACTION ON ERROR
        try {
            await tx.rollback();
        } catch (rollbackError) {
            console.error("Error during transaction rollback:", rollbackError);
        }

        // Handle specific error types
        if (error.message === "IGNORE_REQUEST") {
            uploadResponseDto.error = true;
            uploadResponseDto.ignoreError = true;
            uploadResponseDto.message = error.message;
        } else if (error instanceof ApplicationException) {
            uploadResponseDto.error = true;
            uploadResponseDto.message = ApplicationConstants.GENERIC_EXCEPTION || "An error occurred during processing.";
        } else {
            uploadResponseDto.error = true;
            uploadResponseDto.message = error.message || "An unexpected error occurred.";
        }
    }

    console.log("ConvertedSingleRequestController convertedSingleRequest end()");
    return uploadResponseDto;
}

/**
 * Populates start and end time for mass upload requests
 * @param {Array} massUploadRequest - The mass upload request array
 * @returns {Array} The updated request array
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

/**
 * Handles claimant submission flow
 * @param {Object} tx - The CDS transaction object
 * @param {Array} massUploadRequest - The mass upload request array
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function claimantSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController claimantSubmissionFlow start()");

    const massUploadResponseDto = {
        message: "Successfully Uploaded.",
        error: false,
        eclaimsData: []
    };

    try {
        for (const item of massUploadRequest) {
            if (!item) {
                continue;
            }

            // Handle withdraw action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_WITHDRAW.toUpperCase()) {
                return await withdrawClaimSubmission(tx, item, loggedInUserDetails, req);
            }

            // Handle retract action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_RETRACT.toUpperCase()) {
                return await retractClaimSubmission(tx, item, ApplicationConstants.ESS, loggedInUserDetails, req);
            }

            // Get saved data if DRAFT_ID exists
            let savedData = null;
            if (item.DRAFT_ID) {
                savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            }

            // Process the claim
            const eclaimsDataResDto = await claimantCASaveSubmit(
                tx,
                item,
                ApplicationConstants.NUS_CHRS_ECLAIMS_ESS,
                savedData,
                false,
                ApplicationConstants.ESS,
                loggedInUserDetails
            );

            if (eclaimsDataResDto.error) {
                massUploadResponseDto.message = MessageConstants.VALIDATION_RESULT_MESSAGE;
                massUploadResponseDto.error = true;
            } else {
                // Initiate lock process details
                let lockRequestorGrp = ApplicationConstants.NUS_CHRS_ECLAIMS_ESS;
                if (eclaimsDataResDto.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED) {
                    lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
                }

                await initiateLockProcessDetails(
                    tx,
                    eclaimsDataResDto.DRAFT_ID,
                    loggedInUserDetails.NUSNET_ID,
                    lockRequestorGrp,
                    eclaimsDataResDto.CLAIM_TYPE,
                    loggedInUserDetails
                );
            }

            massUploadResponseDto.eclaimsData.push(eclaimsDataResDto);

            // Email Acknowledgement sending - Start
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT.toUpperCase() &&
                eclaimsDataResDto.DRAFT_ID) {
                try {
                    // Call local EmailService
                    const emailResponse = await emailService.sendOnDemandEmails(
                        eclaimsDataResDto.DRAFT_ID,
                        eclaimsDataResDto.CLAIM_TYPE,
                        item.ACTION,
                        eclaimsDataResDto.REQUESTOR_GRP,
                        loggedInUserDetails.NUSNET_ID,
                        null,
                        item.ROLE,
                        null,
                        null,
                        eclaimsDataResDto.STAFF_ID,
                        req
                    );
                    console.log("Email sent successfully for draft:", eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                } catch (exception) {
                    console.error("Exception in email flow", exception);
                    // Don't throw error to avoid blocking the main flow
                }
            }
            // Email Acknowledgement sending - End
        }
    } catch (error) {
        console.error("Error in claimantSubmissionFlow:", error);
        throw error;
    }

    console.log("ConvertedSingleRequestController claimantSubmissionFlow end()");
    return massUploadResponseDto;
}

/**
 * Handles claim assistant submission flow
 * @param {Object} tx - The CDS transaction object
 * @param {Array} massUploadRequest - The mass upload request array
 * @param {string} roleFlow - The role flow
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function claimAssistantSubmissionFlow(tx, massUploadRequest, roleFlow, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController claimAssistantSubmissionFlow start()");

    const massUploadResponseDto = {
        message: "Successfully Uploaded.",
        error: false,
        eclaimsData: []
    };

    try {
        for (const item of massUploadRequest) {
            if (!item) {
                continue;
            }

            // Handle reject action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase()) {
                return await rejectClaimSubmission(tx, item, roleFlow, loggedInUserDetails, req);
            }

            // Handle check action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_CHECK.toUpperCase()) {
                return await checkClaimSubmission(tx, item, roleFlow, loggedInUserDetails, req);
            }

            // Handle withdraw action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_WITHDRAW.toUpperCase()) {
                return await withdrawClaimSubmission(tx, item, loggedInUserDetails, req);
            }

            // Handle retract action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_RETRACT.toUpperCase()) {
                return await retractClaimSubmission(tx, item, roleFlow, loggedInUserDetails, req);
            }

            // Handle save and submit actions
            if (item.ACTION && (
                item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SAVE.toUpperCase() ||
                item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT.toUpperCase()
            )) {
                let requestorGroup = ApplicationConstants.CLAIM_ASSISTANT;
                let savedData = null;

                if (item.DRAFT_ID) {
                    savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
                    if (savedData && savedData.REQUESTOR_GRP === ApplicationConstants.NUS_CHRS_ECLAIMS_ESS) {
                        requestorGroup = ApplicationConstants.NUS_CHRS_ECLAIMS_ESS;
                    }
                }

                const eclaimsDataResDto = await claimantCASaveSubmit(
                    tx,
                    item,
                    requestorGroup,
                    savedData,
                    true,
                    roleFlow,
                    loggedInUserDetails
                );

                if (eclaimsDataResDto.error) {
                    massUploadResponseDto.message = MessageConstants.VALIDATION_RESULT_MESSAGE;
                    massUploadResponseDto.error = true;
                } else {
                    // Initiate lock process details
                    let lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
                    if (eclaimsDataResDto.REQUEST_STATUS !== ApplicationConstants.STATUS_ECLAIMS_DRAFT) {
                        const requestorGrp = StatusConfigType.fromValue(eclaimsDataResDto.REQUEST_STATUS);
                        if (!requestorGrp.isUnknown()) {
                            lockRequestorGrp = requestorGrp.getValue();
                        }
                    }

                    // Ensure all lock operations are complete before proceeding
                    await initiateLockProcessDetails(
                        tx,
                        eclaimsDataResDto.DRAFT_ID,
                        loggedInUserDetails.NUSNET_ID,
                        lockRequestorGrp,
                        eclaimsDataResDto.CLAIM_TYPE,
                        loggedInUserDetails
                    );
                }

                massUploadResponseDto.eclaimsData.push(eclaimsDataResDto);

                // Email Acknowledgement sending - Start
                if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT.toUpperCase() &&
                    eclaimsDataResDto.DRAFT_ID) {
                    try {
                        // Get task name from role for email
                        const taskName = await emailService.getTaskNameFromRole(item.ROLE, eclaimsDataResDto.CLAIM_TYPE);

                        // Call local EmailService
                        const emailResponse = await emailService.sendOnDemandEmails(
                            eclaimsDataResDto.DRAFT_ID,
                            eclaimsDataResDto.CLAIM_TYPE,
                            item.ACTION,
                            eclaimsDataResDto.REQUESTOR_GRP,
                            loggedInUserDetails.NUSNET_ID,
                            null,
                            item.ROLE,
                            taskName,
                            null,
                            eclaimsDataResDto.STAFF_ID
                        );
                        console.log("CA submission email sent successfully for draft:", eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                    } catch (exception) {
                        console.error("Exception in CA email flow", exception);
                        // Don't throw error to avoid blocking the main flow
                    }
                }
                // Email Acknowledgement sending - End
            }
        }
    } catch (error) {
        console.error("Error in claimAssistantSubmissionFlow:", error);
        throw error;
    }

    console.log("ConvertedSingleRequestController claimAssistantSubmissionFlow end()");
    return massUploadResponseDto;
}

/**
 * Handles verifier submission flow
 * @param {Object} tx - The CDS transaction object
 * @param {Array} massUploadRequest - The mass upload request array
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<Object>} The response DTO
 */
async function verifierSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController verifierSubmissionFlow start()");

    const massUploadResponseDto = {
        error: false,
        eclaimsData: []
    };

    try {
        for (const item of massUploadRequest) {
            if (!item) {
                continue;
            }

            if (!item.DRAFT_ID) {
                throw new ApplicationException("Draft Id is blank/empty. Please provide Draft Id.");
            }

            // Check if request is locked
            const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
            await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

            // Handle non-save actions
            if (item.ACTION && item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE.toUpperCase()) {
                // Persist remarks
                await populateRemarksDataDetails(tx, item.REMARKS, item.DRAFT_ID);

                // Persist process participants (Verifier/Additional Approvers)
                await populateProcessParticipantDetails(tx, item, loggedInUserDetails);

                // Build task approval request
                const taskApprovalDto = await buildTaskApprovalDto(tx, item, loggedInUserDetails);
                const verifyRequest = [taskApprovalDto];

                // Call Utility InboxService action via external CAP service (CSN)
                const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);

                // Frame response message
                if (response && response.length > 0 && response[0]) {
                    massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "";
                    if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                        massUploadResponseDto.error = true;
                    }
                }
            } else {
                // SAVE flow for Verifier/Approver
                await verifierApproverSaveFlow(tx, item, /* isProcessParticipantUpdate */ true, loggedInUserDetails);
            }

            // Fetch updated claim data
            const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsDataResDto = { ...updated };
            massUploadResponseDto.eclaimsData.push(eclaimsDataResDto);

            // Email Acknowledgement sending - Start
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_VERIFY.toUpperCase() &&
                eclaimsDataResDto.DRAFT_ID) {
                try {
                    // Get task name from role for email
                    const taskName = await emailService.getTaskNameFromRole(item.ROLE, eclaimsDataResDto.CLAIM_TYPE);

                    // Call local EmailService
                    const emailResponse = await emailService.sendOnDemandEmails(
                        eclaimsDataResDto.DRAFT_ID,
                        eclaimsDataResDto.CLAIM_TYPE,
                        item.ACTION,
                        eclaimsDataResDto.REQUESTOR_GRP,
                        loggedInUserDetails.NUSNET_ID,
                        item.REMARKS || null,
                        item.ROLE,
                        taskName,
                        null,
                        eclaimsDataResDto.STAFF_ID,
                        req
                    );
                    console.log("Verifier email sent successfully for draft:", eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                } catch (exception) {
                    console.error("Exception in verifier email flow", exception);
                    // Don't throw error to avoid blocking the main flow
                }
            }
            // Email Acknowledgement sending - End

            // Initiate lock process details
            let lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
            const requestorGrp = StatusConfigType.fromValue(eclaimsDataResDto.REQUEST_STATUS);
            if (!requestorGrp.isUnknown()) {
                lockRequestorGrp = requestorGrp.getValue();
            }

            await initiateLockProcessDetails(
                tx,
                eclaimsDataResDto.DRAFT_ID,
                loggedInUserDetails.NUSNET_ID,
                lockRequestorGrp,
                eclaimsDataResDto.CLAIM_TYPE,
                loggedInUserDetails
            );
        }
    } catch (error) {
        console.error("Error in verifierSubmissionFlow:", error);
        throw error;
    }

    console.log("ConvertedSingleRequestController verifierSubmissionFlow end()");
    return massUploadResponseDto;
}

/**
 * Handles approver submission flow for REPORTING_MGR and APPROVER roles
 * @param {Object} tx - The CDS transaction object
 * @param {Array} massUploadRequest - The mass upload request array
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function approverSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController approverSubmissionFlow start()");

    const massUploadResponseDto = {
        error: false,
        eclaimsData: []
    };

    try {
        for (const item of massUploadRequest) {
            if (!item) {
                continue;
            }

            if (!item.DRAFT_ID) {
                throw new ApplicationException("Draft Id is blank/empty. Please provide Draft Id.");
            }

            // Check if request is locked
            const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
            await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

            // Handle non-save actions (APPROVE, REJECT)
            if (item.ACTION && item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE.toUpperCase()) {
                // Populate remarks data
                await populateRemarksDataDetails(tx, item.REMARKS, item.DRAFT_ID);

                // Build task approval request for APPROVER/REPORTING_MGR actions
                const taskApprovalDto = await buildApproverTaskApprovalDto(tx, item, loggedInUserDetails);
                const verifyRequest = [taskApprovalDto];

                // Call Utility InboxService action via external CAP service
                const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);

                // Frame response message
                massUploadResponseDto.error = false;
                if (response && response.length > 0 && response[0]) {
                    massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "";
                    if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                        massUploadResponseDto.error = true;
                    }
                }
            } else {
                // SAVE flow for Approver/Reporting Manager
                await verifierApproverSaveFlow(tx, item, false, loggedInUserDetails);
            }

            // Fetch updated claim data
            const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsDataResDto = { ...updated };

            // Fetch associated item data
            const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsItemsRes = [];
            if (savedEclaimsItemData && savedEclaimsItemData.length > 0) {
                for (const savedItemsData of savedEclaimsItemData) {
                    eclaimsItemsRes.push({ ...savedItemsData });
                }
            }
            eclaimsDataResDto.eclaimsItemDataDetails = eclaimsItemsRes;

            massUploadResponseDto.eclaimsData.push(eclaimsDataResDto);

            // Determine requestor group from process participants
            const processParticipants = await ProcessParticipantsRepo.fetchByDraftId(item.DRAFT_ID);
            let requestorGroup = ApplicationConstants.APPROVER;
            if (processParticipants && processParticipants.length > 0) {
                for (const processParticipant of processParticipants) {
                    if (processParticipant.NUSNET_ID &&
                        processParticipant.NUSNET_ID.toUpperCase() === loggedInUserDetails.NUSNET_ID.toUpperCase()) {
                        requestorGroup = processParticipant.USER_DESIGNATION;
                        break;
                    }
                }
            }

            // Handle lock process details based on status
            if (eclaimsDataResDto.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT) {
                await initiateLockProcessDetails(
                    tx,
                    eclaimsDataResDto.DRAFT_ID,
                    loggedInUserDetails.NUSNET_ID,
                    ApplicationConstants.CLAIM_ASSISTANT,
                    eclaimsDataResDto.CLAIM_TYPE,
                    loggedInUserDetails
                );
            } else if (eclaimsDataResDto.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_APPROVED) {
                // Delete lock details when approved
                await RequestLockDetailsRepo.deleteByDraftId(eclaimsDataResDto.DRAFT_ID);
            }

            // Email Acknowledgement sending - Start
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_APPROVE.toUpperCase() &&
                eclaimsDataResDto.DRAFT_ID) {
                try {
                    // Get task name from role for email
                    const taskName = await emailService.getTaskNameFromRole(item.ROLE, eclaimsDataResDto.CLAIM_TYPE);

                    // Call local EmailService
                    const emailResponse = await emailService.sendOnDemandEmails(
                        eclaimsDataResDto.DRAFT_ID,
                        eclaimsDataResDto.CLAIM_TYPE,
                        item.ACTION,
                        eclaimsDataResDto.REQUESTOR_GRP,
                        loggedInUserDetails.NUSNET_ID,
                        null,
                        item.ROLE,
                        taskName,
                        null,
                        eclaimsDataResDto.STAFF_ID,
                        req
                    );
                    console.log("Approval email sent successfully for draft:", eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                } catch (exception) {
                    console.error("Exception in email flow", exception);
                    // Don't throw error to avoid blocking the main flow
                }
            }
            // Email Acknowledgement sending - End

            // Email for reject action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase() &&
                eclaimsDataResDto.DRAFT_ID) {
                try {
                    // Get task name from role for email
                    const taskName = await emailService.getTaskNameFromRole(item.ROLE, eclaimsDataResDto.CLAIM_TYPE);

                    // Call local EmailService
                    const emailResponse = await emailService.sendOnDemandEmails(
                        eclaimsDataResDto.DRAFT_ID,
                        eclaimsDataResDto.CLAIM_TYPE,
                        item.ACTION,
                        eclaimsDataResDto.REQUESTOR_GRP,
                        loggedInUserDetails.NUSNET_ID,
                        item.REMARKS || null,
                        item.ROLE,
                        taskName,
                        null,
                        eclaimsDataResDto.STAFF_ID,
                        req
                    );
                    console.log("Rejection email sent successfully for draft:", eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                } catch (exception) {
                    console.error("Exception in email flow", exception);
                    // Don't throw error to avoid blocking the main flow
                }
            }
        }
    } catch (error) {
        console.error("Error in approverSubmissionFlow:", error);
        throw error;
    }

    console.log("ConvertedSingleRequestController approverSubmissionFlow end()");
    return massUploadResponseDto;
}

/**
 * Fetches the user who has locked the request
 * @param {string} draftId - The draft ID
 * @returns {Promise<string|null>} The locked by user NUSNET ID
 */
async function fetchRequestLockedUser(draftId) {
    const requestLockDetails = await RequestLockDetailsRepo.checkIsRequestLocked(draftId);

    if (requestLockDetails &&
        requestLockDetails.LOCKED_BY_USER_NID &&
        requestLockDetails.LOCKED_BY_USER_NID.trim() !== "") {
        return requestLockDetails.LOCKED_BY_USER_NID;
    }

    return null;
}

/**
 * Checks if the request is locked by another user
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {string} fetchRequestLockedByUser - The locked by user NUSNET ID
 * @throws {Error} If request is locked by another user
 */
async function checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser) {
    const staffId = loggedInUserDetails.STF_NUMBER || loggedInUserDetails.NUSNET_ID;

    if (fetchRequestLockedByUser &&
        fetchRequestLockedByUser.trim() !== "" &&
        fetchRequestLockedByUser.toLowerCase() !== staffId.toLowerCase()) {
        const error = new Error(MessageConstants.MSG_REQUEST_LOCKED + fetchRequestLockedByUser);
        error.status = 403; // Forbidden
        throw error;
    }
}

/**
 * Withdraws a claim submission
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The claim item
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function withdrawClaimSubmission(tx, item, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController withdrawClaimSubmission start()");

    const massUploadResponseDto = {
        error: false,
        message: "Claim Withdrawn successfully.",
        eclaimsData: []
    };

    try {
        // Lock check
        const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
        await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

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

        // Process Details update flow - Start
        const taskApprovalDto = {
            DRAFT_ID: item.DRAFT_ID,
            ROLE: item.ROLE,
            IS_REMARKS_UPDATE: true,
            ACTION_CODE: item.ACTION
        };

        const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        if (savedData) {
            taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
            taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
        }

        // Fetch task details
        const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
        if (taskDetails) {
            taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
        }

        const verifyRequest = [taskApprovalDto];

        // Call inbox service for task action
        try {
            const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);
            if (response && response.length > 0 && response[0]) {
                massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "Claim Withdrawn successfully.";
                if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                    massUploadResponseDto.error = true;
                }
            }
        } catch (error) {
            console.error("Error calling inbox service:", error);
            // Continue with withdrawal even if inbox service fails
        }
        // Process Details update flow - End

        // Update claim and item data
        const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        const eclaimsDataResDto = { ...updated };

        // Fetch items
        const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
        eclaimsDataResDto.eclaimsItemDataDetails = savedEclaimsItemData || [];

        massUploadResponseDto.eclaimsData = [eclaimsDataResDto];
        massUploadResponseDto.error = false;
        massUploadResponseDto.message = "Claim Withdrawn successfully.";

        // Email Acknowledgement sending - Start
        try {
            // Call local EmailService
            const emailResponse = await emailService.sendOnDemandEmails(
                item.DRAFT_ID,
                eclaimsDataResDto.CLAIM_TYPE,
                item.ACTION,
                eclaimsDataResDto.REQUESTOR_GRP,
                loggedInUserDetails.NUSNET_ID,
                null,
                item.ROLE,
                null,
                null,
                eclaimsDataResDto.STAFF_ID
            );
            console.log("Withdrawal email sent successfully for draft:", item.DRAFT_ID, "Response:", emailResponse);
        } catch (exception) {
            console.error("Exception in email flow", exception);
            // Don't throw error to avoid blocking the main flow
        }
        // Email Acknowledgement sending - End

    } catch (error) {
        console.error("Error in withdrawClaimSubmission:", error);
        throw new ApplicationException(error.message || error);
    }

    console.log("ConvertedSingleRequestController withdrawClaimSubmission end()");
    return massUploadResponseDto;
}

/**
 * Retracts a claim submission
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The claim item
 * @param {string} roleFlow - The role flow
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function retractClaimSubmission(tx, item, roleFlow, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController retractClaimSubmission start()");

    const massUploadResponseDto = {
        error: false,
        message: "Claim Retracted successfully.",
        eclaimsData: []
    };

    try {
        // Lock check
        const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
        await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

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

        // Role-based restrictions
        if (roleFlow === ApplicationConstants.ESS) {
            const claimantRestrictedStatus = [
                ApplicationConstants.STATUS_ECLAIMS_DRAFT,
                ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_REJECT,
                ApplicationConstants.STATUS_ECLAIMS_APPROVED,
                ApplicationConstants.STATUS_ECLAIMS_TRANSFERRED_TO_PAYROLL_SYSTEM,
                ApplicationConstants.STATUS_ECLAIMS_POSTED_SUCCESSFULLY
            ];

            if (claimantRestrictedStatus.includes(eclaimsData.REQUEST_STATUS)) {
                throw new ApplicationException("Retract is not possible. Claim Request cannot be retracted.");
            }
        }

        if (roleFlow === ApplicationConstants.CA) {
            const caRestrictedStatus = [
                ApplicationConstants.STATUS_ECLAIMS_DRAFT,
                ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED,
                ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT,
                ApplicationConstants.STATUS_ECLAIMS_APPROVED,
                ApplicationConstants.STATUS_ECLAIMS_TRANSFERRED_TO_PAYROLL_SYSTEM,
                ApplicationConstants.STATUS_ECLAIMS_POSTED_SUCCESSFULLY
            ];

            if (caRestrictedStatus.includes(eclaimsData.REQUEST_STATUS)) {
                throw new ApplicationException("Retract is not possible. Claim Request cannot be retracted.");
            }
        }

        // Process Details update flow - Start
        const taskApprovalDto = {
            DRAFT_ID: item.DRAFT_ID,
            ROLE: roleFlow,
            IS_REMARKS_UPDATE: true,
            ACTION_CODE: item.ACTION
        };

        const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        if (savedData) {
            taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
            taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
        }

        // Fetch task details
        const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
        if (taskDetails) {
            taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
        }

        const verifyRequest = [taskApprovalDto];

        // Call inbox service for task action
        try {
            const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);
            if (response && response.length > 0 && response[0]) {
                massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "Claim Retracted successfully.";
                if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                    massUploadResponseDto.error = true;
                }
            }
        } catch (error) {
            console.error("Error calling inbox service:", error);
            // Continue with retraction even if inbox service fails
        }
        // Process Details update flow - End

        // Update claim and item data
        const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        const eclaimsDataResDto = { ...updated };

        // Fetch items
        const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
        eclaimsDataResDto.eclaimsItemDataDetails = savedEclaimsItemData || [];

        massUploadResponseDto.eclaimsData = [eclaimsDataResDto];

        // Persist Lock Details Table - Start
        let lockRequestorGrp = ApplicationConstants.CLAIM_ASSISTANT;
        if (eclaimsDataResDto.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT) {
            lockRequestorGrp = ApplicationConstants.NUS_CHRS_ECLAIMS_ESS;
        }

        await initiateLockProcessDetails(
            tx,
            eclaimsDataResDto.DRAFT_ID,
            loggedInUserDetails.NUSNET_ID,
            lockRequestorGrp,
            eclaimsDataResDto.CLAIM_TYPE,
            loggedInUserDetails
        );
        // Persist Lock Details Table - End

        massUploadResponseDto.error = false;
        massUploadResponseDto.message = "Claim Retracted successfully.";

        // Email Acknowledgement sending - Start
        try {
            // Call local EmailService
            const emailResponse = await emailService.sendOnDemandEmails(
                item.DRAFT_ID,
                eclaimsDataResDto.CLAIM_TYPE,
                item.ACTION,
                eclaimsDataResDto.REQUESTOR_GRP,
                loggedInUserDetails.NUSNET_ID,
                null,
                roleFlow,
                null,
                null,
                eclaimsDataResDto.STAFF_ID
            );
            console.log("Retraction email sent successfully for draft:", item.DRAFT_ID, "Response:", emailResponse);
        } catch (exception) {
            console.error("Exception in email flow", exception);
            // Don't throw error to avoid blocking the main flow
        }
        // Email Acknowledgement sending - End

    } catch (error) {
        console.error("Error in retractClaimSubmission:", error);
        throw new ApplicationException(error.message || error);
    }

    console.log("ConvertedSingleRequestController retractClaimSubmission end()");
    return massUploadResponseDto;
}

/**
 * Rejects a claim submission
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The claim item
 * @param {string} roleFlow - The role flow
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function rejectClaimSubmission(tx, item, roleFlow, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController rejectClaimSubmission start()");

    const massUploadResponseDto = {
        error: false,
        message: "Claim Rejected successfully.",
        eclaimsData: []
    };

    try {
        // Lock check
        const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
        await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

        // Fetch claim data
        const eclaimsData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);

        if (eclaimsData.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_APPROVED) {
            throw new ApplicationException("Reject is not possible. Claim already in Approved status.");
        }

        // Validation for remarks
        const validationResult = await EclaimService.validateRejectionData(item, loggedInUserDetails.STF_NUMBER);
        if (validationResult && validationResult.length > 0) {
            const eclaimsDataResDto = {
                validationResults: validationResult,
                ERROR_STATE: true
            };
            massUploadResponseDto.eclaimsData = [eclaimsDataResDto];
            return massUploadResponseDto;
        }

        // Populate remarks data
        await populateRemarksDataDetails(tx, item.REMARKS, item.DRAFT_ID);

        // Process Details update flow - Start
        const taskApprovalDto = {
            DRAFT_ID: item.DRAFT_ID,
            ROLE: item.ROLE,
            IS_REMARKS_UPDATE: true,
            ACTION_CODE: item.ACTION
        };

        const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        if (savedData) {
            taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
            taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
        }

        // Fetch task details
        const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
        if (taskDetails) {
            taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
        }

        // Add rejection remarks
        const rejectionRemarks = await EclaimService.fetchRemarksValue(item, loggedInUserDetails.STF_NUMBER);
        taskApprovalDto.REJECT_REMARKS = rejectionRemarks;

        const verifyRequest = [taskApprovalDto];

        // Call inbox service for task action
        try {
            const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);
            if (response && response.length > 0 && response[0]) {
                massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "Claim Rejected successfully.";
                if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                    massUploadResponseDto.error = true;
                }
            }
        } catch (error) {
            console.error("Error calling inbox service:", error);
            // Continue with rejection even if inbox service fails
        }
        // Process Details update flow - End

        // Update claim and item data
        const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
        const eclaimsDataResDto = { ...updated };

        // Fetch items
        const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
        eclaimsDataResDto.eclaimsItemDataDetails = savedEclaimsItemData || [];

        massUploadResponseDto.eclaimsData = [eclaimsDataResDto];

        // Persist Lock Details Table - Start
        await initiateLockProcessDetails(
            tx,
            eclaimsDataResDto.DRAFT_ID,
            loggedInUserDetails.NUSNET_ID,
            ApplicationConstants.NUS_CHRS_ECLAIMS_ESS,
            eclaimsDataResDto.CLAIM_TYPE,
            loggedInUserDetails
        );
        // Persist Lock Details Table - End

        massUploadResponseDto.error = false;
        massUploadResponseDto.message = "Claim Rejected successfully.";

        // Email Acknowledgement sending - Start
        try {
            // Call local EmailService
            const emailResponse = await emailService.sendOnDemandEmails(
                item.DRAFT_ID,
                eclaimsDataResDto.CLAIM_TYPE,
                item.ACTION,
                eclaimsDataResDto.REQUESTOR_GRP,
                loggedInUserDetails.NUSNET_ID,
                item.REMARKS || null,
                roleFlow,
                null,
                null,
                eclaimsDataResDto.STAFF_ID
            );
            console.log("Rejection email sent successfully for draft:", item.DRAFT_ID, "Response:", emailResponse);
        } catch (exception) {
            console.error("Exception in email flow", exception);
            // Don't throw error to avoid blocking the main flow
        }
        // Email Acknowledgement sending - End

    } catch (error) {
        console.error("Error in rejectClaimSubmission:", error);
        throw new ApplicationException(error.message || error);
    }

    console.log("ConvertedSingleRequestController rejectClaimSubmission end()");
    return massUploadResponseDto;
}

/**
 * Checks a claim submission
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The claim item
 * @param {string} roleFlow - The role flow
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @returns {Promise<Object>} The response DTO
 */
async function checkClaimSubmission(tx, item, roleFlow, loggedInUserDetails, req) {
    console.log("ConvertedSingleRequestController checkClaimSubmission start()");

    const massUploadResponseDto = {
        error: false,
        message: "Claim Checked successfully.",
        eclaimsData: []
    };

    try {
        // Lock check
        const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
        await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

        // Fetch claim data
        const eclaimsData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);

        if (eclaimsData.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_APPROVED) {
            throw new ApplicationException("Check is not possible. Claim already in Approved status.");
        }

        // Process the claim using claimantCASaveSubmit
        const eclaimsDataResDto = await claimantCASaveSubmit(
            tx,
            item,
            ApplicationConstants.NUS_CHRS_ECLAIMS_ESS,
            eclaimsData,
            true,
            roleFlow,
            loggedInUserDetails
        );

        if (eclaimsDataResDto.ERROR_STATE) {
            massUploadResponseDto.message = MessageConstants.VALIDATION_RESULT_MESSAGE;
            massUploadResponseDto.error = true;
        } else {
            // Process Details update flow - Start
            const taskApprovalDto = {
                DRAFT_ID: item.DRAFT_ID,
                ROLE: item.ROLE,
                IS_REMARKS_UPDATE: true,
                ACTION_CODE: item.ACTION
            };

            const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            if (savedData) {
                taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
                taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
            }

            // Fetch task details
            const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
            if (taskDetails) {
                taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
            }

            const verifyRequest = [taskApprovalDto];

            // Call inbox service for task action
            try {
                const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);
                if (response && response.length > 0 && response[0]) {
                    massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "Claim Checked successfully.";
                    if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                        massUploadResponseDto.error = true;
                    }
                }
            } catch (error) {
                console.error("Error calling inbox service:", error);
                // Continue with check even if inbox service fails
            }
            // Process Details update flow - End

            // Persist Lock Details Table - Start
            const lockRequestorGrp = StatusConfigType.fromValue(eclaimsDataResDto.REQUEST_STATUS).getValue();
            await initiateLockProcessDetails(
                tx,
                eclaimsDataResDto.DRAFT_ID,
                loggedInUserDetails.NUSNET_ID,
                lockRequestorGrp,
                eclaimsDataResDto.CLAIM_TYPE,
                loggedInUserDetails
            );
            // Persist Lock Details Table - End
        }

        massUploadResponseDto.eclaimsData = [eclaimsDataResDto];
        massUploadResponseDto.error = false;
        massUploadResponseDto.message = "Claim Checked successfully.";

        // Email Acknowledgement sending - Start
        try {
            // Call local EmailService
            const emailResponse = await emailService.sendOnDemandEmails(
                item.DRAFT_ID,
                eclaimsDataResDto.CLAIM_TYPE,
                item.ACTION,
                eclaimsDataResDto.REQUESTOR_GRP,
                loggedInUserDetails.NUSNET_ID,
                null,
                roleFlow,
                null,
                null,
                eclaimsDataResDto.STAFF_ID
            );
            console.log("Check email sent successfully for draft:", item.DRAFT_ID, "Response:", emailResponse);
        } catch (exception) {
            console.error("Exception in email flow", exception);
            // Don't throw error to avoid blocking the main flow
        }
        // Email Acknowledgement sending - End

    } catch (error) {
        console.error("Error in checkClaimSubmission:", error);
        throw new ApplicationException(error.message || error);
    }

    console.log("ConvertedSingleRequestController checkClaimSubmission end()");
    return massUploadResponseDto;
}

/**
 * Populates remarks data details for a draft request.
 * @param {Object} tx - The CDS transaction object
 * @param {Array} claimInnerRequestDto - The remarks data array.
 * @param {string} draftId - The draft ID.
 * @returns {Promise<void>}
 */
async function populateRemarksDataDetails(tx, claimInnerRequestDto, draftId) {
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
                    // Generate sequence number
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

                // Use CDS to upsert remarks data
                await CommonRepo.upsertOperationChained(
                    tx,
                    "NUSEXT_UTILITY_REMARKS_DATA",
                    inputData
                );
            }
        }
    }
}

/**
 * Checks if additional approver 1 exists for the given item
 * @param {Object} item - The mass upload request item
 * @returns {string|null} The NUSNET_ID of additional approver 1 if exists, null otherwise
 */
function isAdditionalApproverOneExists(item) {
    console.log("ConvertedSingleRequestController isAdditionalApproverOneExists start()");

    let additionalApprover = null;

    if (item && item.ADDTIONAL_APPROVER_1 && Array.isArray(item.ADDTIONAL_APPROVER_1) && item.ADDTIONAL_APPROVER_1.length > 0) {
        for (const additionalApproverOne of item.ADDTIONAL_APPROVER_1) {
            if (additionalApproverOne && additionalApproverOne.NUSNET_ID && additionalApproverOne.NUSNET_ID.trim() !== "") {
                additionalApprover = additionalApproverOne.NUSNET_ID;
            }
        }
    }

    console.log("ConvertedSingleRequestController isAdditionalApproverOneExists end()");
    return additionalApprover;
}

/**
 * Checks if verifier exists for the given item
 * @param {Object} item - The mass upload request item
 * @returns {string|null} The NUSNET_ID of verifier if exists, or default verifier value
 */
function isVerifierExists(item) {
    console.log("ConvertedSingleRequestController isVerifierExists start()");

    let verifierNusNetId = null;

    if (item && item.VERIFIER && Array.isArray(item.VERIFIER) && item.VERIFIER.length > 0) {
        for (const verifier of item.VERIFIER) {
            if (verifier && verifier.NUSNET_ID && verifier.NUSNET_ID.trim() !== "") {
                verifierNusNetId = verifier.NUSNET_ID;
            } else {
                if (item.CLAIM_TYPE && item.CLAIM_TYPE.toUpperCase() === ApplicationConstants.CLAIM_TYPE_102.toUpperCase()) {
                    verifierNusNetId = null;
                } else {
                    verifierNusNetId = ApplicationConstants.VERIFIER;
                }
            }
        }
    } else {
        if (item.CLAIM_TYPE && item.CLAIM_TYPE.toUpperCase() === ApplicationConstants.CLAIM_TYPE_102.toUpperCase()) {
            verifierNusNetId = null;
        } else {
            verifierNusNetId = ApplicationConstants.VERIFIER;
        }
    }

    console.log("ConvertedSingleRequestController isVerifierExists end()");
    return verifierNusNetId;
}



/**
 * Releases lock for a draft request (equivalent to Java releaseLock)
 * @param {Object} tx - The CDS transaction object
 * @param {string} staffId - The staff ID
 * @param {string} draftId - The draft ID
 * @returns {Promise<void>}
 */
async function releaseLock(tx, staffId, draftId) {
    console.log("ConvertedSingleRequestController releaseLock start()");

    try {
        // Update lock value to empty string (equivalent to Java updateLockValue)
        await RequestLockDetailsRepo.updateLockValue(draftId, staffId, "", tx);
        console.log(`Lock released for draft ID: ${draftId} by staff: ${staffId}`);
    } catch (error) {
        console.error("Error in releaseLock:", error);
        throw error; // Re-throw to maintain transaction integrity
    }

    console.log("ConvertedSingleRequestController releaseLock end()");
}

/**
 * Claimant CA Save Submit method - converts Java claimantCASaveSubmit to Node.js
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The mass upload request item
 * @param {string} requestorGroup - The requestor group
 * @param {Object} savedData - The saved data if exists
 * @param {boolean} isCASave - Whether this is a CA save operation
 * @param {string} roleFlow - The role flow
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<Object>} The eclaims data response DTO
 */
async function claimantCASaveSubmit(tx, item, requestorGroup, savedData, isCASave, roleFlow, loggedInUserDetails) {
    console.log("ConvertedSingleRequestController claimantCASaveSubmit start()");

    // Check if status is being changed to draft from process flow
    if (item.DRAFT_ID && savedData && savedData.REQUEST_STATUS &&
        item.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_DRAFT &&
        savedData.REQUEST_STATUS !== ApplicationConstants.STATUS_ECLAIMS_DRAFT) {
        console.error("Status is being changed to draft from process flow for the request:", item.DRAFT_ID);
        throw new ApplicationException("IGNORE_REQUEST");
    }

    if (!item.REQUEST_STATUS) {
        throw new ApplicationException("Invalid Request Status");
    }

    // Check if request is locked
    const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
    await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

    // Initialize response DTO
    const eclaimsDataResDto = {
        validationResults: [],
        ERROR_STATE: false
    };

    // Validation for basic inputs from UI
    const validationResults = await EclaimService.validateEclaimsData(item, roleFlow, requestorGroup, loggedInUserDetails);
    if (validationResults && validationResults.length > 0) {
        eclaimsDataResDto.validationResults = validationResults;
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }

    // Initialize item count
    let itemCount = (item.CLAIM_REQUEST_TYPE === ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD) ? 0 : 1;

    // If we have a DRAFT_ID and savedData, calculate the correct itemCount based on existing items
    if (item.DRAFT_ID && savedData) {
        const existingItems = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
        if (existingItems && existingItems.length > 0) {
            // Find the highest item number from ALL existing items (including soft-deleted)
            // This ensures we never reuse any ITEM_ID number, even if it was soft-deleted
            const itemNumbers = existingItems
                .map(item => {
                    // Extract the numeric part from ITEM_ID (e.g., "DT2507000018002" -> "002")
                    const match = item.ITEM_ID.match(/(\d{3})$/);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(num => num > 0);

            if (itemNumbers.length > 0) {
                itemCount = Math.max(...itemNumbers) + 1;
            }
        }
    }

    // Generate draft and request ID patterns
    const now = new Date();
    const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
    const requestYear = String(now.getFullYear() % 100);
    const draftIdPatternVal = ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_DRAFT_ID_PATTERN + requestYear + requestMonth;
    const requestIdPatternVal = ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_ID_PATTERN + requestYear + requestMonth;
    let draftNumber = "";

    // Check if claim is already submitted
    if (savedData && item.ACTION === ApplicationConstants.ACTION_SUBMIT &&
        [ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_SUBMITTED,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED].includes(savedData.REQUEST_STATUS)) {
        throw new ApplicationException("Claim is already submitted.");
    }

    // Handle draft ID generation
    if (item.DRAFT_ID) {
        if (savedData) {
            draftNumber = item.DRAFT_ID;
            // Use existing data
        } else {
            draftNumber = await CommonRepo.fetchSequenceNumber(draftIdPatternVal, ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_DRAFT_ID_DIGITS);
        }
    } else {
        draftNumber = await CommonRepo.fetchSequenceNumber(draftIdPatternVal, ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_DRAFT_ID_DIGITS);
    }

    // Build eclaims data object
    const eclaimsData = {
        DRAFT_ID: draftNumber,
        CREATED_ON: savedData ? savedData.CREATED_ON : new Date(),
        REQUEST_ID: savedData ? savedData.REQUEST_ID : null,
        MODIFIED_BY: loggedInUserDetails.STF_NUMBER,
        MODIFIED_BY_NID: loggedInUserDetails.NUSNET_ID,
        MODIFIED_ON: new Date(),
        REQUEST_STATUS: item.REQUEST_STATUS,
        REQUESTOR_GRP: requestorGroup,
        STAFF_ID: item.STAFF_ID,
        CLAIM_TYPE: item.CLAIM_TYPE,
        CLAIM_REQUEST_TYPE: item.CLAIM_REQUEST_TYPE
    };

    // Handle request ID for submit action
    if (item.ACTION === ApplicationConstants.ACTION_SUBMIT) {
        if (!item.REQUEST_ID) {
            if (!eclaimsData.REQUEST_ID) {
                const requestNumber = await CommonRepo.fetchSequenceNumber(requestIdPatternVal, ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_ID_DIGITS);
                eclaimsData.REQUEST_ID = requestNumber;
            }
        } else {
            eclaimsData.REQUEST_ID = item.REQUEST_ID;
        }

        if (roleFlow !== ApplicationConstants.CA) {
            eclaimsData.REQUEST_STATUS = ApplicationConstants.STATUS_PENDING_FOR_CLAIM_ASSISTANT;
        }
    }

    if (item.REQUEST_ID) {
        eclaimsData.REQUEST_ID = item.REQUEST_ID;
    }

    // Handle claim month parsing
    if (item.CLAIM_MONTH && item.CLAIM_MONTH.includes(ApplicationConstants.HYPHEN)) {
        const monthData = item.CLAIM_MONTH.split(ApplicationConstants.HYPHEN);
        if (monthData[0]) {
            eclaimsData.CLAIM_MONTH = String(parseInt(monthData[0])).padStart(2, "0");
            eclaimsData.CLAIM_YEAR = monthData[1];
        }

        // eclaimsData - set working hours for CLAIM_TYPE_102
        if (item.CLAIM_TYPE && item.CLAIM_TYPE.toUpperCase() === ApplicationConstants.CLAIM_TYPE_102.toUpperCase()) {
            const inputMonth = parseInt(monthData[0]);
            const inputYear = parseInt(monthData[1]);
            const dateRange = DateUtils.fetchDatesFromMonthAndYear(inputMonth, inputYear);

            const staffResponseList = await ElligibilityCriteriaRepo.fetchWorkingHours(
                item.STAFF_ID,
                dateRange[0],
                dateRange[1],
                item.CLAIM_TYPE
            );

            const staffResponse = (staffResponseList && staffResponseList.length > 0)
                ? staffResponseList[0]
                : {};

            eclaimsData.WORKING_HOURS = staffResponse.WORKING_HOURS;
            eclaimsData.APPOINTMENT_TRACK = staffResponse.APPOINTMENT_TRACK;
            eclaimsData.STF_CLAIM_TYPE_CAT = staffResponse.STF_CLAIM_TYPE_CAT;
        }
    }

    // Handle submitted by information
    if (savedData) {
        eclaimsData.SUBMITTED_BY = savedData.SUBMITTED_BY;
        eclaimsData.SUBMITTED_BY_NID = savedData.SUBMITTED_BY_NID;
        eclaimsData.SUBMITTED_ON = savedData.SUBMITTED_ON;
    } else {
        eclaimsData.SUBMITTED_BY_NID = loggedInUserDetails.NUSNET_ID;
        eclaimsData.SUBMITTED_BY = loggedInUserDetails.STF_NUMBER;
        eclaimsData.SUBMITTED_ON = new Date();
    }

    // Fetch CHRS job info
    const chrsJobInfoList = await ChrsJobInfoRepo.fetchStaffInfoForRequest(item.STAFF_ID, item.ULU, item.FDLU);
    if (!chrsJobInfoList || chrsJobInfoList.length === 0) {
        const chrsJobInfoDatavalidation = EclaimService.frameValidationMessage("Eclaims", "No chrsJobInfoDtls available.");
        eclaimsDataResDto.validationResults = [chrsJobInfoDatavalidation];
        eclaimsDataResDto.ERROR_STATE = true;
        return eclaimsDataResDto;
    }

    // Persist CHRS job info data
    persistChrsJobInfoData(eclaimsData, chrsJobInfoList[0]);

    // Set ULU and FDLU information
    if (item.ULU) {
        eclaimsData.ULU = item.ULU;
    }
    if (item.FDLU) {
        eclaimsData.FDLU = item.FDLU;
    }
    if (item.ULU_T) {
        eclaimsData.ULU_T = item.ULU_T;
    }

    // Save eclaims data using transaction
    await CommonRepo.upsertOperationChained(
        tx,
        "NUSEXT_ECLAIMS_HEADER_DATA",
        eclaimsData
    );

    // Handle selected claim dates
    const eclaimsItemsRes = [];
    if (item.selectedClaimDates && item.selectedClaimDates.length > 0) {
        // Handle soft delete logic
        if (draftNumber) {
            const itemIdList = item.selectedClaimDates
                .map(date => date.ITEM_ID)
                .filter(id => id && id.trim() !== "");

            const savedItemIds = await EclaimsItemDataRepo.fetchItemIds(draftNumber);

            if (savedItemIds && savedItemIds.length > 0) {
                const itemIdsToSoftDelete = savedItemIds.filter(itemId => !itemIdList.includes(itemId));
                if (itemIdsToSoftDelete.length > 0) {
                    await EclaimsItemDataRepo.softDeleteByItemId(tx, itemIdsToSoftDelete, loggedInUserDetails.STF_NUMBER, DateUtils.formatDateAsString(new Date(), 'yyyy-MM-dd'));
                }
            }
        }

        // Process each selected claim date
        for (const selectedClaimDates of item.selectedClaimDates) {
            if (selectedClaimDates) {
                if (!selectedClaimDates.ITEM_ID) {
                    itemCount++;
                }
                const eclaimsItemDataResDto = await persistEclaimsItemData(tx, draftNumber, itemCount, selectedClaimDates, item, eclaimsData, loggedInUserDetails);
                eclaimsItemsRes.push(eclaimsItemDataResDto);
            }
        }
    } else if (draftNumber) {
        // User deleted all items in the claim request
        await EclaimsItemDataRepo.softDeleteByDraftId(tx, draftNumber, loggedInUserDetails.STF_NUMBER, DateUtils.formatDateAsString(new Date(), 'yyyy-MM-dd'));
    }

    // Handle CA save operations
    if (isCASave) {
        await populateProcessParticipantDetails(tx, item, loggedInUserDetails);
    }

    // Populate remarks data
    await populateRemarksDataDetails(tx, item.REMARKS, item.DRAFT_ID);

    // Handle process details and task details
    try {
        // Fetch process details to check if process exists
        const processDetails = await ProcessDetailsRepo.fetchByReferenceId(draftNumber, item.CLAIM_TYPE);
        // Retract flow check - Start
        if (savedData && item.ACTION === ApplicationConstants.ACTION_SUBMIT && processDetails && processDetails.PROCESS_INST_ID && processDetails.PROCESS_INST_ID.trim() !== "") {
            // Process exists, create task approval request for inbox service
            const verifyRequest = [];
            const taskApprovalDto = {
                DRAFT_ID: item.DRAFT_ID,
                REQUEST_ID: savedData.REQUEST_ID,
                PROCESS_CODE: savedData.CLAIM_TYPE,
                ACTION_CODE: ApplicationConstants.ACTION_SUBMIT,
                ROLE: item.ROLE || roleFlow,
                IS_REMARKS_UPDATE: true
            };

            // Fetch active task details
            const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
            if (taskDetails) {
                taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
            }

            verifyRequest.push(taskApprovalDto);

            // TODO: Call inbox service API when it's available
            // const response = await inboxService.massTaskAction(verifyRequest, token, null, item.ACTION);
            console.log("Task approval request prepared for inbox service:", verifyRequest);
        }

        // Retract flow check - End
        else if (item.ACTION === ApplicationConstants.ACTION_SUBMIT) {
            // Synchronous process initiation (wait for completion)
            const additionalApproverOne = isAdditionalApproverOneExists(item);
            const verifier = isVerifierExists(item);

            try {
                let stfNumber = "";
                if (chrsJobInfoList[0] && chrsJobInfoList[0].STF_NUMBER) {
                    stfNumber = chrsJobInfoList[0].STF_NUMBER;
                }

                await ProcessDetailsService.initiateProcessOnEclaimSubmit(
                    tx,
                    eclaimsData,
                    item.ACTION,
                    additionalApproverOne,
                    loggedInUserDetails.NUSNET_ID,
                    stfNumber,
                    verifier
                );

                // Handle mass upload lock release (equivalent to Java releaseLock)
                if (item.IS_MASS_UPLOAD && item.IS_MASS_UPLOAD.toUpperCase() === "Y") {
                    await releaseLock(tx, eclaimsData.SUBMITTED_BY, eclaimsData.DRAFT_ID);
                }

            } catch (error) {
                console.error("Exception in process persistence flow:", error);
                throw error; // Re-throw to maintain transaction integrity
            }
        }
    } catch (exception) {
        console.error("Exception on process details and task details commit:", exception);
    }

    // Build response
    Object.assign(eclaimsDataResDto, eclaimsData);
    eclaimsDataResDto.eclaimsItemDataDetails = eclaimsItemsRes;

    console.log("ConvertedSingleRequestController claimantCASaveSubmit end()");
    return eclaimsDataResDto;
}

/**
 * Persists CHRS job info data to eclaims data
 * @param {Object} eclaimsData - The eclaims data object
 * @param {Object} chrsJobInfo - The CHRS job info object
 */
function persistChrsJobInfoData(eclaimsData, chrsJobInfo) {
    if (chrsJobInfo) {
        eclaimsData.CONCURRENT_STAFF_ID = chrsJobInfo.SF_STF_NUMBER;
        eclaimsData.STAFF_ID = chrsJobInfo.STF_NUMBER;
        eclaimsData.STAFF_NUSNET_ID = chrsJobInfo.NUSNET_ID;
        eclaimsData.ULU = chrsJobInfo.ULU_C;
        eclaimsData.FDLU = chrsJobInfo.FDLU_C;
        eclaimsData.FULL_NM = chrsJobInfo.FULL_NM;
        eclaimsData.ULU_T = chrsJobInfo.ULU_T;
        if (chrsJobInfo.JOIN_DATE) {
            eclaimsData.DATE_JOINED = chrsJobInfo.JOIN_DATE.toString();
        }
        eclaimsData.EMPLOYEE_GRP = chrsJobInfo.EMP_GP_C;
    }
}

/**
 * Persists eclaims item data
 * @param {Object} tx - The CDS transaction object
 * @param {string} draftNumber - The draft number
 * @param {number} itemCount - The item count
 * @param {Object} selectedClaimDates - The selected claim dates
 * @param {Object} item - The claim item
 * @param {Object} eclaimsData - The eclaims data
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<Object>} The item data DTO
 */
async function persistEclaimsItemData(tx, draftNumber, itemCount, selectedClaimDates, item, eclaimsData, loggedInUserDetails) {
    console.log("ConvertedSingleRequestController persistEclaimsItemData start()");

    // Build item ID
    let itemId;
    if (selectedClaimDates.ITEM_ID && selectedClaimDates.ITEM_ID.trim() !== "") {
        itemId = selectedClaimDates.ITEM_ID;
    } else {
        itemId = draftNumber + String(itemCount).padStart(3, "0");
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
        START_TIME: selectedClaimDates.START_TIME || ApplicationConstants.CLAIM_START_TIME_DEFAULT,
        END_TIME: selectedClaimDates.END_TIME || ApplicationConstants.CLAIM_END_TIME_DEFAULT,
        REMARKS: selectedClaimDates.REMARKS,
        CLAIM_MONTH: eclaimsData.CLAIM_MONTH,
        CLAIM_YEAR: eclaimsData.CLAIM_YEAR,
        HOURS: selectedClaimDates.HOURS || ApplicationConstants.DEFAULT_DOUBLE_VALUE,
        RATE_TYPE_AMOUNT: selectedClaimDates.RATE_TYPE_AMOUNT || Number(ApplicationConstants.DEFAULT_DOUBLE).toFixed(2),
        TOTAL_AMOUNT: selectedClaimDates.TOTAL_AMOUNT || Number(ApplicationConstants.DEFAULT_DOUBLE).toFixed(2),
        DISC_RATETYPE_AMOUNT: selectedClaimDates.DISC_RATETYPE_AMOUNT || ApplicationConstants.DEFAULT_DOUBLE_VALUE,
        RATE_UNIT: selectedClaimDates.RATE_UNIT || ApplicationConstants.DEFAULT_DOUBLE_VALUE,
        HOURS_UNIT: selectedClaimDates.HOURS_UNIT || ApplicationConstants.DEFAULT_DOUBLE,
        IS_PH: selectedClaimDates.IS_PH,
        WAGE_CODE: selectedClaimDates.WAGE_CODE,
        IS_DISCREPENCY: selectedClaimDates.IS_DISCREPENCY,
        WBS: selectedClaimDates.WBS,
        UPDATED_BY: loggedInUserDetails.STF_NUMBER,
        UPDATED_ON: new Date(),
        IS_DELETED: ApplicationConstants.N,
    };

    // Handle claim week number
    if (selectedClaimDates.CLAIM_START_DATE) {
        const weekOfYear = await DateToWeekRepo.fetchWeekOfTheDay(selectedClaimDates.CLAIM_START_DATE);
        eclaimsItemData.CLAIM_WEEK_NO = weekOfYear;
    }

    // Save item data using transaction
    await CommonRepo.upsertOperationChained(
        tx,
        "NUSEXT_ECLAIMS_ITEMS_DATA",
        eclaimsItemData
    );

    console.log("ConvertedSingleRequestController persistEclaimsItemData end()");
    return eclaimsItemData;
}

/**
 * Populates process participant details for a draft request
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The mass upload request item
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<void>}
 */
async function populateProcessParticipantDetails(tx, item, loggedInUserDetails) {
    console.log("ConvertedSingleRequestController populateProcessParticipantDetails start()");

    const ppntIdList = [];

    // Process Additional Approver 1
    if (item.ADDTIONAL_APPROVER_1 && Array.isArray(item.ADDTIONAL_APPROVER_1) && item.ADDTIONAL_APPROVER_1.length > 0) {
        for (const additionalApproverOne of item.ADDTIONAL_APPROVER_1) {
            if (additionalApproverOne && additionalApproverOne.NUSNET_ID && additionalApproverOne.NUSNET_ID.trim() !== "") {
                const updated = await persistProcessParticipantDetails(tx, additionalApproverOne, item, loggedInUserDetails, ApplicationConstants.ADDITIONAL_APP_1);
                ppntIdList.push(updated.PPNT_ID);
            }
        }
    }

    // Process Additional Approver 2
    if (item.ADDTIONAL_APPROVER_2 && Array.isArray(item.ADDTIONAL_APPROVER_2) && item.ADDTIONAL_APPROVER_2.length > 0) {
        for (const additionalApproverTwo of item.ADDTIONAL_APPROVER_2) {
            if (additionalApproverTwo && additionalApproverTwo.NUSNET_ID && additionalApproverTwo.NUSNET_ID.trim() !== "") {
                const updated = await persistProcessParticipantDetails(tx, additionalApproverTwo, item, loggedInUserDetails, ApplicationConstants.ADDITIONAL_APP_2);
                ppntIdList.push(updated.PPNT_ID);
            }
        }
    }

    // Process Verifier
    if (item.VERIFIER && Array.isArray(item.VERIFIER) && item.VERIFIER.length > 0) {
        for (const verifier of item.VERIFIER) {
            if (verifier && verifier.NUSNET_ID && verifier.NUSNET_ID.trim() !== "") {
                const updated = await persistProcessParticipantDetails(tx, verifier, item, loggedInUserDetails, ApplicationConstants.VERIFIER);
                ppntIdList.push(updated.PPNT_ID);
            }
        }
    }

    // Handle soft delete for removed participants
    const savedParticipants = await ProcessParticipantsRepo.fetchPPNTIdDtls(item.DRAFT_ID);
    if (savedParticipants && savedParticipants.length > 0) {
        const savedParticipantIds = savedParticipants.map(p => p.PPNT_ID);
        const softDeleteIds = savedParticipantIds.filter(savedId => !ppntIdList.includes(savedId));

        if (softDeleteIds.length > 0) {
            // Use CDS transaction for chained operation
            const { DELETE } = require("@sap/cds/lib/ql/cds-ql");

            await tx.run(
                DELETE.from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS")
                    .where({ PPNT_ID: { in: softDeleteIds } })
            );
        }
    }

    console.log("ConvertedSingleRequestController populateProcessParticipantDetails end()");
}

/**
 * Persists process participant details
 * @param {Object} tx - The CDS transaction object
 * @param {Object} claimInnerRequestDto - The claim inner request DTO
 * @param {Object} item - The mass upload request item
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {string} userDesignation - The user designation
 * @returns {Promise<Object>} The process participant object
 */
async function persistProcessParticipantDetails(tx, claimInnerRequestDto, item, loggedInUserDetails, userDesignation) {
    const processParticipantData = {
        NUSNET_ID: claimInnerRequestDto.NUSNET_ID
    };

    // Set PPNT_ID (reuse if present, else generate)
    if (claimInnerRequestDto.PPNT_ID && claimInnerRequestDto.PPNT_ID.trim() !== "") {
        processParticipantData.PPNT_ID = claimInnerRequestDto.PPNT_ID;
    } else {
        const now = new Date();
        const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
        const requestYear = String(now.getFullYear() % 100);
        const participantIdPattern = `PPNT${requestYear}${requestMonth}`;
        processParticipantData.PPNT_ID = await CommonRepo.fetchSequenceNumber(participantIdPattern, 4);
    }

    processParticipantData.REFERENCE_ID = item.DRAFT_ID;
    processParticipantData.STAFF_ID = claimInnerRequestDto.STAFF_ID;
    processParticipantData.UPDATED_ON = new Date();
    processParticipantData.STAFF_FULL_NAME = claimInnerRequestDto.STAFF_FULL_NAME;
    processParticipantData.IS_DELETED = ApplicationConstants.N;
    processParticipantData.UPDATED_BY_NID = loggedInUserDetails.NUSNET_ID;
    processParticipantData.UPDATED_BY = loggedInUserDetails.STF_NUMBER;
    processParticipantData.USER_DESIGNATION = userDesignation;

    // Use chained operation for consistency
    await CommonRepo.upsertOperationChained(
        tx,
        "NUSEXT_UTILITY_PROCESS_PARTICIPANTS",
        processParticipantData
    );
    return processParticipantData;
}

/**
 * Initiates lock process details using RequestLockService (matches Java implementation)
 * @param {Object} tx - The CDS transaction object
 * @param {string} draftId - The draft ID
 * @param {string} staffNusNetId - The staff NUSNET ID
 * @param {string} requestorGrp - The requestor group
 * @param {string} claimType - The claim type
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<void>}
 */
async function initiateLockProcessDetails(tx, draftId, staffNusNetId, requestorGrp, claimType, loggedInUserDetails) {
    try {
        // Use provided loggedInUserDetails or fetch if not provided
        let staffId = staffNusNetId;
        if (loggedInUserDetails && loggedInUserDetails.STF_NUMBER) {
            staffId = loggedInUserDetails.STF_NUMBER;
        } else {
            // Fallback: Fetch staff info from CHRS job info only if not provided
            const chrsJobInfo = await CommonRepo.fetchLoggedInUser(staffNusNetId);
            staffId = (chrsJobInfo && chrsJobInfo.STF_NUMBER) ? chrsJobInfo.STF_NUMBER : staffNusNetId;
        }

        // Create RequestDto object (matches Java implementation)
        const requestDto = {
            DRAFT_ID: draftId,
            NUSNET_ID: staffId,
            REQUESTOR_GRP: requestorGrp,
            PROCESS_CODE: claimType,
            REQUEST_STATUS: ApplicationConstants.UNLOCK,
            requestorFormFlow: true  // This triggers deleteByDraftId in Java implementation
        };

        // Use RequestLockService.requestLock() (matches Java eclaimsRequestLockService.requestLock)
        await RequestLockService.requestLock(requestDto, tx);

    } catch (error) {
        console.error("Error in initiateLockProcessDetails:", {
            draftId: draftId,
            staffNusNetId: staffNusNetId,
            requestorGrp: requestorGrp,
            claimType: claimType,
            error: error.message,
            stack: error.stack
        });
        throw new ApplicationException(`Failed to initiate lock process details: ${error.message}`);
    }
}

/**
 * Builds TaskApproval DTO for InboxService placeholder
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The mass upload item
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<Object>} Task approval dto
 */
async function buildTaskApprovalDto(tx, item, loggedInUserDetails) {
    const taskApprovalDto = {
        DRAFT_ID: item.DRAFT_ID,
        ROLE: item.ROLE,
        IS_REMARKS_UPDATE: true
    };

    const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
    if (savedData) {
        taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
        taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
    } else if (item.CLAIM_TYPE) {
        taskApprovalDto.PROCESS_CODE = item.CLAIM_TYPE;
    }

    // Map action
    if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_VERIFY.toUpperCase()) {
        taskApprovalDto.ACTION_CODE = ApplicationConstants.ACTION_VERIFY;
    } else if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase()) {
        taskApprovalDto.ACTION_CODE = ApplicationConstants.ACTION_REJECT;
        taskApprovalDto.REJECT_REMARKS = extractRejectionRemarks(item, loggedInUserDetails);
    }

    // Attach task instance id if active task exists
    const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
    if (taskDetails) {
        taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
    }

    return taskApprovalDto;
}

/**
 * Builds TaskApproval DTO specifically for APPROVER and REPORTING_MGR actions
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The mass upload item
 * @param {Object} loggedInUserDetails - The logged in user details
 * @returns {Promise<Object>} Task approval dto for approver actions
 */
async function buildApproverTaskApprovalDto(tx, item, loggedInUserDetails) {
    const taskApprovalDto = {
        DRAFT_ID: item.DRAFT_ID,
        ROLE: item.ROLE,
        IS_REMARKS_UPDATE: true
    };

    const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
    if (savedData) {
        taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
        taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
    } else if (item.CLAIM_TYPE) {
        taskApprovalDto.PROCESS_CODE = item.CLAIM_TYPE;
    }

    // Map approver actions
    if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_APPROVE.toUpperCase()) {
        taskApprovalDto.ACTION_CODE = ApplicationConstants.ACTION_APPROVE;
    } else if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase()) {
        taskApprovalDto.ACTION_CODE = ApplicationConstants.ACTION_REJECT;
        taskApprovalDto.REJECT_REMARKS = extractRejectionRemarks(item, loggedInUserDetails);
    }

    // Attach task instance id if active task exists
    const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
    if (taskDetails) {
        taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
    }

    return taskApprovalDto;
}

/**
 * Handles additional approver submission flow for ADDITIONAL_APP_1 and ADDITIONAL_APP_2 roles
 * @param {Object} tx - The CDS transaction object
 * @param {Array} massUploadRequest - The mass upload request array
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {Object} req - The request object for inbox service calls
 * @param {string} approverRole - The specific additional approver role (ADDITIONAL_APP_1 or ADDITIONAL_APP_2)
 * @returns {Promise<Object>} The response DTO
 */
async function additionalApproverSubmissionFlow(tx, massUploadRequest, loggedInUserDetails, req, approverRole) {
    console.log(`ConvertedSingleRequestController additionalApproverSubmissionFlow start() for role: ${approverRole}`);

    const massUploadResponseDto = {
        error: false,
        eclaimsData: []
    };

    try {
        for (const item of massUploadRequest) {
            if (!item) {
                continue;
            }

            if (!item.DRAFT_ID) {
                throw new ApplicationException("Draft Id is blank/empty. Please provide Draft Id.");
            }

            // Check if request is locked
            const fetchRequestLockedByUser = await fetchRequestLockedUser(item.DRAFT_ID);
            await checkIsLocked(loggedInUserDetails, fetchRequestLockedByUser);

            // Handle non-save actions (APPROVE, REJECT)
            if (item.ACTION && item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE.toUpperCase()) {
                // Populate remarks data
                await populateRemarksDataDetails(tx, item.REMARKS, item.DRAFT_ID);

                // Build task approval request for ADDITIONAL_APP_1/ADDITIONAL_APP_2 actions
                const taskApprovalDto = await buildAdditionalApproverTaskApprovalDto(tx, item, loggedInUserDetails, approverRole);
                const verifyRequest = [taskApprovalDto];

                // Call Utility InboxService action via external CAP service
                const response = await callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req);

                // Frame response message
                massUploadResponseDto.error = false;
                if (response && response.length > 0 && response[0]) {
                    massUploadResponseDto.message = response[0].RESPONSE_MESSAGE || "";
                    if (response[0].STATUS && response[0].STATUS.toUpperCase() === ApplicationConstants.STATUS_ERROR) {
                        massUploadResponseDto.error = true;
                    }
                }
            } else {
                // SAVE flow for Additional Approver
                await verifierApproverSaveFlow(tx, item, false, loggedInUserDetails);
            }

            // Fetch updated claim data
            const updated = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsDataResDto = { ...updated };

            // Fetch associated item data
            const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(item.DRAFT_ID);
            const eclaimsItemsRes = [];
            if (savedEclaimsItemData && savedEclaimsItemData.length > 0) {
                for (const savedItemsData of savedEclaimsItemData) {
                    eclaimsItemsRes.push({ ...savedItemsData });
                }
            }
            eclaimsDataResDto.eclaimsItemDataDetails = eclaimsItemsRes;

            massUploadResponseDto.eclaimsData.push(eclaimsDataResDto);

            // Determine requestor group from process participants
            const processParticipants = await ProcessParticipantsRepo.fetchByDraftId(item.DRAFT_ID);
            let requestorGroup = approverRole; // Use the specific additional approver role
            if (processParticipants && processParticipants.length > 0) {
                for (const processParticipant of processParticipants) {
                    if (processParticipant.NUSNET_ID &&
                        processParticipant.NUSNET_ID.toUpperCase() === loggedInUserDetails.NUSNET_ID.toUpperCase()) {
                        requestorGroup = processParticipant.USER_DESIGNATION;
                        break;
                    }
                }
            }

            // Handle lock process details based on status
            if (eclaimsDataResDto.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT) {
                await initiateLockProcessDetails(
                    tx,
                    eclaimsDataResDto.DRAFT_ID,
                    loggedInUserDetails.NUSNET_ID,
                    ApplicationConstants.CLAIM_ASSISTANT,
                    eclaimsDataResDto.CLAIM_TYPE,
                    loggedInUserDetails
                );
            } else if (eclaimsDataResDto.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_APPROVED) {
                // Delete lock details when approved
                await RequestLockDetailsRepo.deleteByDraftId(eclaimsDataResDto.DRAFT_ID);
            }

            // Email Acknowledgement sending - Start
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_APPROVE.toUpperCase() &&
                eclaimsDataResDto.DRAFT_ID) {
                try {
                    // Get task name from role for email
                    const taskName = await emailService.getTaskNameFromRole(approverRole, eclaimsDataResDto.CLAIM_TYPE);

                    // Call local EmailService
                    const emailResponse = await emailService.sendOnDemandEmails(
                        eclaimsDataResDto.DRAFT_ID,
                        eclaimsDataResDto.CLAIM_TYPE,
                        item.ACTION,
                        eclaimsDataResDto.REQUESTOR_GRP,
                        loggedInUserDetails.NUSNET_ID,
                        null,
                        approverRole,
                        taskName,
                        null,
                        eclaimsDataResDto.STAFF_ID,
                        req
                    );
                    console.log(`${approverRole} approval email sent successfully for draft:`, eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                } catch (exception) {
                    console.error("Exception in email flow", exception);
                    // Don't throw error to avoid blocking the main flow
                }
            }

            // Email for reject action
            if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase() &&
                eclaimsDataResDto.DRAFT_ID) {
                try {
                    // Get task name from role for email
                    const taskName = await emailService.getTaskNameFromRole(approverRole, eclaimsDataResDto.CLAIM_TYPE);

                    // Call local EmailService
                    const emailResponse = await emailService.sendOnDemandEmails(
                        eclaimsDataResDto.DRAFT_ID,
                        eclaimsDataResDto.CLAIM_TYPE,
                        item.ACTION,
                        eclaimsDataResDto.REQUESTOR_GRP,
                        loggedInUserDetails.NUSNET_ID,
                        item.REMARKS || null,
                        approverRole,
                        taskName,
                        null,
                        eclaimsDataResDto.STAFF_ID,
                        req
                    );
                    console.log(`${approverRole} rejection email sent successfully for draft:`, eclaimsDataResDto.DRAFT_ID, "Response:", emailResponse);
                } catch (exception) {
                    console.error("Exception in email flow", exception);
                    // Don't throw error to avoid blocking the main flow
                }
            }
            // Email Acknowledgement sending - End
        }
    } catch (error) {
        console.error(`Error in additionalApproverSubmissionFlow for ${approverRole}:`, error);
        throw error;
    }

    console.log(`ConvertedSingleRequestController additionalApproverSubmissionFlow end() for role: ${approverRole}`);
    return massUploadResponseDto;
}

/**
 * Builds TaskApproval DTO specifically for ADDITIONAL_APP_1 and ADDITIONAL_APP_2 actions
 * @param {Object} tx - The CDS transaction object
 * @param {Object} item - The mass upload item
 * @param {Object} loggedInUserDetails - The logged in user details
 * @param {string} approverRole - The specific additional approver role
 * @returns {Promise<Object>} Task approval dto for additional approver actions
 */
async function buildAdditionalApproverTaskApprovalDto(tx, item, loggedInUserDetails, approverRole) {
    const taskApprovalDto = {
        DRAFT_ID: item.DRAFT_ID,
        ROLE: item.ROLE || approverRole,
        IS_REMARKS_UPDATE: true
    };

    const savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
    if (savedData) {
        taskApprovalDto.REQUEST_ID = savedData.REQUEST_ID;
        taskApprovalDto.PROCESS_CODE = savedData.CLAIM_TYPE;
    } else if (item.CLAIM_TYPE) {
        taskApprovalDto.PROCESS_CODE = item.CLAIM_TYPE;
    }

    // Map additional approver actions
    if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_APPROVE.toUpperCase()) {
        taskApprovalDto.ACTION_CODE = ApplicationConstants.ACTION_APPROVE;
    } else if (item.ACTION && item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase()) {
        taskApprovalDto.ACTION_CODE = ApplicationConstants.ACTION_REJECT;
        taskApprovalDto.REJECT_REMARKS = extractRejectionRemarks(item, loggedInUserDetails);
    }

    // Attach task instance id if active task exists
    const taskDetails = await TaskDetailsRepo.fetchActiveTaskByDraftId(item.DRAFT_ID, item.CLAIM_TYPE);
    if (taskDetails) {
        taskApprovalDto.TASK_INST_ID = taskDetails.TASK_INST_ID;
    }

    // Set specific task action based on additional approver role
    if (approverRole === ApplicationConstants.ADDITIONAL_APP_1) {
        taskApprovalDto.TASK_ACTION = ApplicationConstants.TASK_ACTION_addapp1;
    } else if (approverRole === ApplicationConstants.ADDITIONAL_APP_2) {
        taskApprovalDto.TASK_ACTION = ApplicationConstants.TASK_ACTION_addapp2;
    }

    return taskApprovalDto;
}

/**
 * Extracts rejection remarks from item.REMARKS for the logged-in user, or picks the last non-empty remark
 */
function extractRejectionRemarks(item, loggedInUserDetails) {
    if (!item || !Array.isArray(item.REMARKS) || item.REMARKS.length === 0) return "";
    const userStaffId = (loggedInUserDetails && loggedInUserDetails.STF_NUMBER) ? String(loggedInUserDetails.STF_NUMBER) : null;
    let candidate = "";
    for (const r of item.REMARKS) {
        if (!r) continue;
        const text = (r.REMARKS && String(r.REMARKS).trim() !== "") ? String(r.REMARKS) : "";
        if (text) {
            candidate = text;
            if (userStaffId && r.STAFF_ID && String(r.STAFF_ID) === userStaffId) {
                return text;
            }
        }
    }
    return candidate;
}


/**
 * Calls Utility's InboxService.taskactions action via CAP service consumption.
 */
async function callUtilityInboxTaskActions(req, verifyRequest, loggedInUserDetails, req) {
    const srv = await cds.connect.to('InboxService');
    const oInboxCallVerifier = {
        "loggedInUserDetails": loggedInUserDetails,
        "requestOfSource": req,
        "internalCall": true,
        "payload": verifyRequest
    }
    const payload = { data: oInboxCallVerifier };
    // Use low-level REST send to avoid requiring a local CSN for the external service
    // return;
    const send = (context) => context.send({ method: 'POST', path: '/taskactions', data: payload });
    const result = req ? await send(srv.tx(req)) : await send(srv);
    return Array.isArray(result) ? result : [result];
}


/**
 * SAVE flow for Verifier/Approver: persists remarks and process participants.
 * Mirrors Java verifierApproverSaveFlow.
 */
async function verifierApproverSaveFlow(tx, item, isProcessParticipantUpdate, loggedInUserDetails) {
    if (!item.REQUEST_STATUS) {
        throw new ApplicationException("Invalid Request Status");
    }
    if (item.DRAFT_ID && String(item.DRAFT_ID).trim() !== "") {
        // Persist remarks
        await populateRemarksDataDetails(tx, item.REMARKS, item.DRAFT_ID);
        // Persist process participants when requested
        if (isProcessParticipantUpdate) {
            await populateProcessParticipantDetails(tx, item, loggedInUserDetails);
        }
    }
}

module.exports = {
    singleRequest
}; 