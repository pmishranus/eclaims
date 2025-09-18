const { ApplicationConstants, MessageConstants } = require("./constant");
const CommonRepo = require("../repository/util.repo");
const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
const EclaimsDataRepo = require("../repository/eclaimsData.repo");
const CwsDataRepo = require("../repository/cwsData.repo");
const ApproverMatrixRepo = require("../repository/approverMatrix.repo");
const { ApplicationException } = require("./customErrors");

/**
 * RequestLockService - Service for managing request locks
 * This service mirrors the Java RequestLockServiceImpl functionality exactly
 */
class RequestLockService {

    /**
     * requestLock - Main method to lock/unlock requests (matches Java requestLock)
     * @param {object} requestDto - The request DTO containing lock details
     * @param {object} tx - Optional transaction object
     * @returns {Promise<object>} Response DTO
     */
    static async requestLock(requestDto, tx = null) {
        console.log("RequestLockService requestLock start()");
        const responseDto = {};

        try {
            // Input validation - Start
            const validationResults = this.validateInputData(requestDto);
            if (validationResults.length > 0) {
                responseDto.validationResults = validationResults;
                return responseDto;
            }
            // Input validation - End

            // Cleaning up the lock details table - Start
            if (requestDto.requestorFormFlow) {
                console.log("RequestLockService: Deleting existing lock details for draft ID:", requestDto.DRAFT_ID);
                await RequestLockDetailsRepo.deleteByDraftId(requestDto.DRAFT_ID, tx);
                console.log("RequestLockService: Successfully deleted existing lock details");
            }
            // Cleaning up the lock details table - End

            const savedRequestData = await RequestLockDetailsRepo.fetchByDraftId(requestDto.DRAFT_ID, tx);
            if (savedRequestData && savedRequestData.length > 0) {

                // Validation for existing lock details - Start
                const requestLockDetails = await RequestLockDetailsRepo.checkIsRequestLocked(requestDto.DRAFT_ID, tx);
                if (requestLockDetails &&
                    requestLockDetails.LOCKED_BY_USER_NID &&
                    requestLockDetails.LOCKED_BY_USER_NID.trim() !== "" &&
                    requestLockDetails.LOCKED_BY_USER_NID.toLowerCase() !== requestDto.NUSNET_ID.toLowerCase()) {
                    // Note: In Java, this calls userInfoUtils.getUserDetails() - simplified for Node.js
                    throw new ApplicationException(MessageConstants.MSG_REQUEST_LOCKED + requestLockDetails.LOCKED_BY_USER_NID + "(" + requestLockDetails.LOCKED_BY_USER_NID + ")");
                }
                // Validation for existing lock details - End

                // update flow
                let lockValue = null;
                let isUserExists = false;
                for (const savedLockDetails of savedRequestData) {
                    if (savedLockDetails &&
                        savedLockDetails.LOCKED_BY_USER_NID &&
                        savedLockDetails.LOCKED_BY_USER_NID.trim() !== "" &&
                        savedLockDetails.LOCKED_BY_USER_NID.toLowerCase() === requestDto.NUSNET_ID.toLowerCase()) {
                        lockValue = "";
                        if (requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.LOCK.toLowerCase()) {
                            lockValue = ApplicationConstants.X;
                        }
                        if (requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.UNLOCK.toLowerCase() &&
                            (!savedLockDetails.IS_LOCKED || savedLockDetails.IS_LOCKED.trim() === "")) {
                            throw new ApplicationException("The Request is not in the locked state.");
                        }
                        await RequestLockDetailsRepo.updateLockValue(requestDto.DRAFT_ID, requestDto.NUSNET_ID, lockValue, tx);
                        isUserExists = true;
                        break;
                    }
                }

            } else {
                // creation flow - First time creation
                console.log("RequestLockService: Creating new lock details for draft ID:", requestDto.DRAFT_ID);
                await this.persistLockInputDetails(requestDto.DRAFT_ID, requestDto.NUSNET_ID, requestDto.REQUESTOR_GRP, requestDto.PROCESS_CODE, tx);
                console.log("RequestLockService: Successfully created new lock details");
            }
            console.log("RequestLockService requestLock end()");
        } catch (error) {
            if (error instanceof ApplicationException) {
                throw error;
            } else {
                throw new ApplicationException(error.message);
            }
        }
        return responseDto;
    }

    /**
     * deleteLock - Deletes lock for a request (matches Java deleteLock)
     * @param {object} requestDto - The request DTO
     * @param {object} tx - Optional transaction object
     * @returns {Promise<object>} Response DTO
     */
    static async deleteLock(requestDto, tx = null) {
        const responseDto = {};

        if (!requestDto.DRAFT_ID || requestDto.DRAFT_ID.trim() === "") {
            responseDto.message = "Reference ID is not provided";
            responseDto.statusCode = "E";
        } else {
            await RequestLockDetailsRepo.deleteByDraftId(requestDto.DRAFT_ID, tx);
            responseDto.statusCode = "S";
            responseDto.message = "All locks for Reference ID are deleted successfully";
        }

        return responseDto;
    }

    /**
     * requestLockForCW - Locks request for CW (matches Java requestLockForCW)
     * @param {object} requestDto - The request DTO
     * @param {string} token - The token
     * @param {object} tx - Optional transaction object
     * @returns {Promise<object>} Response DTO
     */
    static async requestLockForCW(requestDto, token, tx = null) {
        console.log("RequestLockService requestLock start()");
        const responseDto = {};

        try {
            if (token && token.trim() !== "") {
                // Note: In Java, this calls userInfoUtils.getLoggedInUserDetails(token) - simplified for Node.js
                // For now, we'll assume the token contains user info or use a placeholder
                const userInfoDetails = { STAFF_ID: requestDto.STAFF_ID || requestDto.NUSNET_ID };
                requestDto.STAFF_ID = userInfoDetails.STAFF_ID;
                requestDto.NUSNET_ID = userInfoDetails.STAFF_ID;
            }

            // Input validation - Start
            const validationResults = this.validateInputData(requestDto);
            if (validationResults.length > 0) {
                responseDto.validationResults = validationResults;
                return responseDto;
            }
            // Input validation - End

            // Cleaning up the lock details table - Start
            // Note: This is commented out in Java implementation
            // if (requestDto.requestorFormFlow) {
            //     await RequestLockDetailsRepo.deleteByDraftId(requestDto.DRAFT_ID, tx);
            // }
            // Cleaning up the lock details table - End

            const savedRequestData = await RequestLockDetailsRepo.fetchByDraftId(requestDto.DRAFT_ID, tx);

            if (savedRequestData && savedRequestData.length > 0) {

                // Validation for existing lock details - Start
                const requestLockDetails = await RequestLockDetailsRepo.checkIsRequestLocked(requestDto.DRAFT_ID, tx);
                if (requestLockDetails &&
                    requestLockDetails.LOCKED_BY_USER_NID &&
                    requestLockDetails.LOCKED_BY_USER_NID.trim() !== "" &&
                    requestLockDetails.LOCKED_BY_USER_NID.toLowerCase() !== requestDto.NUSNET_ID.toLowerCase()) {
                    // Note: In Java, this calls userInfoUtils.getUserDetails() - simplified for Node.js
                    throw new ApplicationException(MessageConstants.MSG_REQUEST_LOCKED + requestLockDetails.LOCKED_BY_USER_NID + "(" + requestLockDetails.LOCKED_BY_USER_NID + ")");
                }
                // Validation for existing lock details - End

                // update flow
                let lockValue = null;
                let isUserExists = false;
                for (const savedLockDetails of savedRequestData) {
                    if (savedLockDetails &&
                        savedLockDetails.LOCKED_BY_USER_NID &&
                        savedLockDetails.LOCKED_BY_USER_NID.trim() !== "" &&
                        savedLockDetails.LOCKED_BY_USER_NID.toLowerCase() === requestDto.NUSNET_ID.toLowerCase()) {
                        lockValue = "";
                        if (requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.LOCK.toLowerCase()) {
                            lockValue = ApplicationConstants.X;
                        }
                        if (requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.UNLOCK.toLowerCase() &&
                            (!savedLockDetails.IS_LOCKED || savedLockDetails.IS_LOCKED.trim() === "")) {
                            throw new ApplicationException("The Request is not in the locked state.");
                        }
                        await RequestLockDetailsRepo.updateLockValue(requestDto.DRAFT_ID, requestDto.NUSNET_ID, lockValue, tx);
                        if (requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.UNLOCK.toLowerCase()) {
                            await RequestLockDetailsRepo.deleteByDraftId(requestDto.DRAFT_ID, tx);
                        }
                        isUserExists = true;
                        break;
                    }
                }

            } else {
                if (requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.UNLOCK.toLowerCase()) {
                    throw new ApplicationException("There are no Requests in the locked state.");
                }
                // creation flow - First time creation
                await this.persistLockInputDetails(requestDto.DRAFT_ID, requestDto.NUSNET_ID, requestDto.REQUESTOR_GRP, requestDto.PROCESS_CODE, tx);
            }
            console.log("RequestLockService requestLock end()");
        } catch (error) {
            if (error instanceof ApplicationException) {
                throw error;
            } else {
                throw new ApplicationException(error.message);
            }
        }
        return responseDto;
    }

    /**
     * persistLockInputDetails - Persists lock input details (matches Java persistLockInputDetails)
     * @param {string} draftId - The draft ID
     * @param {string} staffNusNetId - The staff NUSNET ID
     * @param {string} requestorGrp - The requestor group
     * @param {string} processCode - The process code
     * @param {object} tx - Optional transaction object
     */
    static async persistLockInputDetails(draftId, staffNusNetId, requestorGrp, processCode, tx = null) {
        console.log("RequestLockService persistLockInputDetails start()");
        try {
            if (!draftId || draftId.trim() === "") {
                throw new ApplicationException("Draft Id is blank/empty/null");
            }

            let requestLockDetailsList = null;
            let caApproverLockDetails = null;
            let requestLockDetails = null;

            // Note: In Java, this uses ProcessConfigType enum - simplified for Node.js
            const pType = processCode;

            switch (pType) {
                case "PTT":
                case "CW":
                case "OT":
                case "HM":
                case "TB":
                    const eclaims = await EclaimsDataRepo.fetchByDraftId(draftId, tx);

                    if (!eclaims) {
                        throw new ApplicationException("No Eclaims Data available");
                    }

                    if (!eclaims.REQUEST_STATUS || eclaims.REQUEST_STATUS.trim() === "" ||
                        !eclaims.CLAIM_TYPE || eclaims.CLAIM_TYPE.trim() === "" ||
                        !eclaims.REQUESTOR_GRP || eclaims.REQUESTOR_GRP.trim() === "") {
                        throw new ApplicationException("Input claim is not valid. Submitted Claim - Request status (or) Process Code (or) Requestor group is missing.");
                    }

                    caApproverLockDetails = [];
                    requestLockDetailsList = [];

                    // populate group of lock details - CA, APPROVER group
                    if (requestorGrp.toLowerCase() === ApplicationConstants.CLAIM_ASSISTANT.toLowerCase() ||
                        requestorGrp.toLowerCase() === ApplicationConstants.APPROVER.toLowerCase()) {
                        caApproverLockDetails = await this.frameGroupParticipantLockDtls(draftId, eclaims.CLAIM_TYPE, eclaims.ULU, eclaims.FDLU, eclaims.REQUEST_STATUS, staffNusNetId, requestorGrp, tx);
                    } else {
                        // Claimant, verifier, APP1, APP2
                        requestLockDetails = await this.frameRequestLockDetails(draftId, eclaims.CLAIM_TYPE, eclaims.ULU, eclaims.FDLU, requestorGrp, eclaims.STAFF_ID, eclaims.REQUEST_STATUS, staffNusNetId);
                    }

                    if (requestLockDetails) {
                        requestLockDetailsList.push(requestLockDetails);
                    }

                    if (caApproverLockDetails.length > 0) {
                        for (const caApproverLockDetail of caApproverLockDetails) {
                            requestLockDetailsList.push(caApproverLockDetail);
                        }
                    }

                    if (requestLockDetailsList.length > 0) {
                        await RequestLockDetailsRepo.saveAll(requestLockDetailsList, tx);
                    }
                    break;

                case "CWS":
                case "NED":
                case "OPWN":
                    const cwsData = await CwsDataRepo.fetchByUNIQUE_ID(draftId, tx);
                    if (!cwsData) {
                        throw new ApplicationException("No Request Data available");
                    }

                    if (!cwsData.REQUEST_STATUS || cwsData.REQUEST_STATUS.trim() === "" ||
                        !cwsData.PROCESS_CODE || cwsData.PROCESS_CODE.trim() === "" ||
                        !cwsData.REQUESTOR_GRP || cwsData.REQUESTOR_GRP.trim() === "") {
                        throw new ApplicationException("Input is not valid. Submitted Request - Request status (or) Process Code (or) Requestor group is missing.");
                    }

                    caApproverLockDetails = [];
                    requestLockDetailsList = [];

                    // populate group of lock details - CW OHRSS and Program Manager
                    if (requestorGrp.toLowerCase() === ApplicationConstants.CW_OHRSS.toLowerCase() ||
                        requestorGrp.toLowerCase() === ApplicationConstants.CW_PROGRAM_MANAGER.toLowerCase()) {
                        caApproverLockDetails = await this.frameGroupParticipantLockDtls(draftId, cwsData.PROCESS_CODE, cwsData.ULU, cwsData.FDLU, cwsData.REQUEST_STATUS, staffNusNetId, requestorGrp, tx);
                    } else {
                        // Reporting Manager or RM's Manager
                        requestLockDetails = await this.frameRequestLockDetails(draftId, cwsData.PROCESS_CODE, cwsData.ULU, cwsData.FDLU, requestorGrp, staffNusNetId, cwsData.REQUEST_STATUS, staffNusNetId);
                        // Check against the logged in user and list user and mark the IS_LOCKED as "X"
                        if (staffNusNetId.toLowerCase() === requestLockDetails.LOCKED_BY_USER_NID.toLowerCase()) {
                            requestLockDetails.IS_LOCKED = ApplicationConstants.X;
                        }
                    }

                    if (requestLockDetails) {
                        requestLockDetailsList.push(requestLockDetails);
                    }

                    if (caApproverLockDetails.length > 0) {
                        for (const caApproverLockDetail of caApproverLockDetails) {
                            // Check against the logged in user and list user and mark the IS_LOCKED as "X"
                            // if it matches, else blank
                            if (staffNusNetId.toLowerCase() === caApproverLockDetail.LOCKED_BY_USER_NID.toLowerCase()) {
                                caApproverLockDetail.IS_LOCKED = ApplicationConstants.X;
                            }
                            requestLockDetailsList.push(caApproverLockDetail);
                        }
                    }

                    if (requestLockDetailsList.length > 0) {
                        await RequestLockDetailsRepo.saveAll(requestLockDetailsList, tx);
                    }
                    break;

                default:
                    break;
            }

        } catch (error) {
            if (error instanceof ApplicationException) {
                throw error;
            } else {
                throw new ApplicationException(error.message);
            }
        }
        console.log("RequestLockService persistLockInputDetails end()");
    }

    /**
     * frameRequestLockDetails - Frames request lock details (matches Java frameRequestLockDetails)
     * @param {string} draftId - The draft ID
     * @param {string} processCode - The process code
     * @param {string} ulu - The ULU
     * @param {string} fdlu - The FDLU
     * @param {string} userGroup - The user group
     * @param {string} staffNusNetId - The staff NUSNET ID
     * @param {string} requestStatus - The request status
     * @param {string} lockedByUserID - The locked by user ID
     * @returns {Promise<object>} The request lock details
     */
    static async frameRequestLockDetails(draftId, processCode, ulu, fdlu, userGroup, staffNusNetId, requestStatus, lockedByUserID) {
        const now = new Date();
        const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
        const requestYear = String(now.getFullYear() % 100);
        const lockIdPatternVal = ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_LOCK_ID_PATTERN + requestYear + requestMonth;
        const lockInstId = await CommonRepo.fetchSequenceNumber(lockIdPatternVal, ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_LOCK_ID_DIGITS);

        const requestLockDetails = {
            LOCK_INST_ID: lockInstId,
            REFERENCE_ID: draftId,
            PROCESS_CODE: processCode,
            ULU: ulu,
            FDLU: fdlu,
            REQUEST_STATUS: requestStatus,
            STAFF_USER_GRP: userGroup,
            LOCKED_BY_USER_NID: staffNusNetId
        };

        return requestLockDetails;
    }

    /**
     * frameGroupParticipantLockDtls - Frames group participant lock details (matches Java frameGroupParticipantLockDtls)
     * @param {string} draftId - The draft ID
     * @param {string} processCode - The process code
     * @param {string} ulu - The ULU
     * @param {string} fdlu - The FDLU
     * @param {string} reqStatus - The request status
     * @param {string} staffNusNetId - The staff NUSNET ID
     * @param {string} requestorGrp - The requestor group
     * @param {object} tx - Optional transaction object
     * @returns {Promise<Array>} Array of request lock details
     */
    static async frameGroupParticipantLockDtls(draftId, processCode, ulu, fdlu, reqStatus, staffNusNetId, requestorGrp, tx = null) {
        const requestLockDetailsList = [];
        let grpParticipantDetails = null;

        if (requestorGrp.toLowerCase() === ApplicationConstants.CW_OHRSS.toLowerCase()) {
            grpParticipantDetails = await ApproverMatrixRepo.fetchApprovalMatrixDtlsForAllUlunFdlu(requestorGrp, ulu, fdlu, processCode, tx);
        } else {
            grpParticipantDetails = await ApproverMatrixRepo.fetchApprovalMatrixDtls(requestorGrp, ulu, fdlu, processCode, tx);
        }

        if (grpParticipantDetails && grpParticipantDetails.length > 0) {
            for (const caDetail of grpParticipantDetails) {
                const requestLockDetails = await this.frameRequestLockDetails(draftId, processCode, ulu, fdlu, requestorGrp, caDetail.STAFF_ID, reqStatus, staffNusNetId);
                requestLockDetailsList.push(requestLockDetails);
            }
        }
        return requestLockDetailsList;
    }

    /**
     * validateInputData - Validates input data (matches Java validateInputData)
     * @param {object} requestDto - The request DTO
     * @returns {Array} Array of validation results
     */
    static validateInputData(requestDto) {
        const validationResults = [];

        if (!requestDto.NUSNET_ID || requestDto.NUSNET_ID.trim() === "") {
            const validationResultsDto = this.frameValidationMessage(ApplicationConstants.STAFF_NUSNET_ID, " STAFF_NUSNET_ID is empty/null");
            validationResults.push(validationResultsDto);
        }

        if (!requestDto.REQUEST_STATUS || requestDto.REQUEST_STATUS.trim() === "") {
            const validationResultsDto = this.frameValidationMessage(ApplicationConstants.REQUEST_STATUS, " REQUEST_STATUS is empty/null");
            validationResults.push(validationResultsDto);
        }

        if (requestDto.REQUEST_STATUS && requestDto.REQUEST_STATUS.trim() !== "" &&
            !(requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.LOCK.toLowerCase() ||
                requestDto.REQUEST_STATUS.toLowerCase() === ApplicationConstants.UNLOCK.toLowerCase())) {
            const validationResultsDto = this.frameValidationMessage(ApplicationConstants.REQUEST_STATUS, " REQUEST_STATUS should be either LOCK or UNLOCK.");
            validationResults.push(validationResultsDto);
        }

        if (!requestDto.DRAFT_ID || requestDto.DRAFT_ID.trim() === "") {
            const validationResultsDto = this.frameValidationMessage(ApplicationConstants.DRAFT_ID, " DRAFT_ID is empty/null");
            validationResults.push(validationResultsDto);
        }

        return validationResults;
    }

    /**
     * frameValidationMessage - Frames validation message (matches Java frameValidationMessage)
     * @param {string} field - The field name
     * @param {string} message - The message
     * @returns {object} The validation results DTO
     */
    static frameValidationMessage(field, message) {
        const validationResultsDto = {
            field: field,
            message: message
        };
        return validationResultsDto;
    }
}

module.exports = RequestLockService; 