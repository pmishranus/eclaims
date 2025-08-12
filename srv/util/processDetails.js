/* eslint-disable no-use-before-define */
const cds = require("@sap/cds");
const { SELECT, UPSERT, DELETE, UPDATE, INSERT } = require("@sap/cds/lib/ql/cds-ql");
const { ApplicationConstants } = require("./constant");
const { ApplicationException } = require("./customErrors");
const CommonRepo = require("../repository/util.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
// const ProcessDetailsRepo = require("../repository/processDetails.repo");
// const TaskDetailsRepo = require("../repository/taskDetails.repo");
// const ProcessParticipantsRepo = require("../repository/processParticipant.repo");
const TaskConfigRepo = require("../repository/taskConfig.repo");
const ProcessConfigRepo = require("../repository/processConfig.repo");
const TaskActionConfigRepo = require("../repository/taskActionConfig.repo");

/**
 * Process Details Service for Eclaims workflow management
 * Converts Java ProcessDetailsServiceImpl to Node.js
 */
class ProcessDetailsService {
    /**
     * Initiates process on eclaim submit
     * @param {Object} tx - The CDS transaction object
     * @param {Object} savedMasterData - The saved eclaims data
     * @param {string} action - The action being performed
     * @param {string} additionalApproverOne - Additional approver one NUSNET ID
     * @param {string} nusNetId - The NUSNET ID of the user
     * @param {string} stfNumber - The staff number
     * @param {string} verifier - The verifier NUSNET ID
     * @returns {Promise<void>}
     */
    async initiateProcessOnEclaimSubmit(tx, savedMasterData, action, additionalApproverOne, nusNetId, stfNumber, verifier) {
        console.log("ProcessDetailsService initiateProcessOnEclaimSubmit start()");

        try {
            // Validate input parameters
            if (!savedMasterData) {
                throw new ApplicationException("Saved EclaimsData is empty");
            }

            if (!savedMasterData.CLAIM_TYPE || savedMasterData.CLAIM_TYPE.trim() === "") {
                throw new ApplicationException("Claim Type is empty in saved EclaimsData");
            }

            if (!savedMasterData.REQUESTOR_GRP || savedMasterData.REQUESTOR_GRP.trim() === "") {
                throw new ApplicationException("Requestor Group is empty in saved EclaimsData");
            }

            // Get logged in user details
            const userInfoDetails = await CommonRepo.fetchUserInfo(nusNetId);
            if (userInfoDetails && userInfoDetails.STAFF_ID) {
                stfNumber = userInfoDetails.STAFF_ID;
            }

            let taskAssignTo = "";

            // Fetch process configuration
            const processConfig = await ProcessConfigRepo.fetchProcessConfigByProcessCode(savedMasterData.CLAIM_TYPE);
            if (!processConfig) {
                throw new ApplicationException("No process configured for the submitted claimType");
            }

            let tasksConfig = null;
            let taskActionConfig = null;

            // Handle different requestor groups
            if (savedMasterData.REQUESTOR_GRP.toUpperCase() === ApplicationConstants.NUS_CHRS_ECLAIMS_ESS.toUpperCase()) {
                // ESS submission flow
                tasksConfig = await TaskConfigRepo.fetchTasksConfig(
                    processConfig.PROCESS_CODE,
                    savedMasterData.REQUESTOR_GRP,
                    ApplicationConstants.TASK_SEQUENCE_CLAIM_SUBMIT
                );

                taskActionConfig = await TaskActionConfigRepo.fetchCAToBeRequestStatusData(
                    savedMasterData.REQUESTOR_GRP,
                    0,
                    tasksConfig.TASK_SEQUENCE,
                    savedMasterData.CLAIM_TYPE
                );

                // Handle CLAIM_TYPE_102 with reporting manager
                if (savedMasterData.CLAIM_TYPE.toUpperCase() === ApplicationConstants.CLAIM_TYPE_102.toUpperCase() &&
                    tasksConfig.TASK_NAME.toUpperCase() === ApplicationConstants.REPORTING_MGR.toUpperCase()) {
                    const claimantUserInfoDetails = await CommonRepo.fetchUserInfo(savedMasterData.STAFF_ID);
                    if (claimantUserInfoDetails && claimantUserInfoDetails.RM_STF_N) {
                        const taskUserDetailsDto = await CommonRepo.fetchUserInfo(claimantUserInfoDetails.RM_STF_N);
                        if (taskUserDetailsDto && taskUserDetailsDto.STAFF_ID) {
                            taskAssignTo = taskUserDetailsDto.NUSNET_ID;
                        }
                    }
                }

            } else if (savedMasterData.REQUESTOR_GRP.toUpperCase() === ApplicationConstants.CLAIM_ASSISTANT.toUpperCase()) {
                // Claim Assistant submission flow
                if (verifier && verifier.trim() !== "") {
                    tasksConfig = await TaskConfigRepo.fetchClaimAssistantInitialSubmit(
                        processConfig.PROCESS_CODE,
                        savedMasterData.REQUESTOR_GRP,
                        ApplicationConstants.TASK_NAME_VERIFIER
                    );
                    if (verifier.toUpperCase() !== ApplicationConstants.VERIFIER.toUpperCase()) {
                        taskAssignTo = verifier;
                    }
                } else if (additionalApproverOne && additionalApproverOne.trim() !== "") {
                    tasksConfig = await TaskConfigRepo.fetchClaimAssistantInitialSubmit(
                        processConfig.PROCESS_CODE,
                        savedMasterData.REQUESTOR_GRP,
                        ApplicationConstants.TASK_NAME_ADDITIONAL_APP_1
                    );
                    taskAssignTo = additionalApproverOne;
                } else {
                    // Handle different claim types
                    if (savedMasterData.CLAIM_TYPE.toUpperCase() === ApplicationConstants.CLAIM_TYPE_102.toUpperCase()) {
                        const claimantUserInfoDetails = await CommonRepo.fetchUserInfo(savedMasterData.STAFF_ID);
                        if (claimantUserInfoDetails && claimantUserInfoDetails.RM_STF_N) {
                            const taskUserDetailsDto = await CommonRepo.fetchUserInfo(claimantUserInfoDetails.RM_STF_N);
                            if (taskUserDetailsDto && taskUserDetailsDto.STAFF_ID) {
                                taskAssignTo = taskUserDetailsDto.NUSNET_ID;
                            }
                            tasksConfig = await TaskConfigRepo.fetchClaimAssistantInitialSubmit(
                                processConfig.PROCESS_CODE,
                                savedMasterData.REQUESTOR_GRP,
                                ApplicationConstants.REPORTING_MGR
                            );
                        }
                    } else if (savedMasterData.CLAIM_TYPE.toUpperCase() === ApplicationConstants.CLAIM_TYPE_105.toUpperCase()) {
                        tasksConfig = await TaskConfigRepo.fetchClaimAssistantInitialSubmit(
                            processConfig.PROCESS_CODE,
                            savedMasterData.REQUESTOR_GRP,
                            ApplicationConstants.TASK_NAME_FINANCE_LEAD
                        );
                    } else {
                        tasksConfig = await TaskConfigRepo.fetchClaimAssistantInitialSubmit(
                            processConfig.PROCESS_CODE,
                            savedMasterData.REQUESTOR_GRP,
                            ApplicationConstants.TASK_NAME_APPROVER
                        );
                    }
                }

                taskActionConfig = await TaskActionConfigRepo.fetchCAToBeRequestStatusData(
                    savedMasterData.REQUESTOR_GRP,
                    0,
                    tasksConfig.TASK_SEQUENCE,
                    savedMasterData.CLAIM_TYPE
                );
            }

            if (!tasksConfig) {
                throw new ApplicationException("No task configured for the submitted claimType and requestor group");
            }

            if (!taskActionConfig) {
                throw new ApplicationException("No task action configured for the submitted claimType, requestor group and task sequence");
            }

            // Update request status of EclaimsData
            await EclaimsHeaderDataRepo.updateRequestStatusOnTaskCompletion(
                tx,
                taskActionConfig.TO_BE_REQUEST_STATUS,
                savedMasterData.DRAFT_ID,
                stfNumber,
                nusNetId
            );

            // Persist process details
            const savedProcessDetails = await this.persistProcessDetailsData(
                tx,
                processConfig,
                savedMasterData,
                ApplicationConstants.STATUS_PROCESS_INPROGRESS,
                nusNetId,
                stfNumber,
                userInfoDetails
            );

            // Persist task details
            await this.persistTaskDetails(
                tx,
                tasksConfig,
                savedProcessDetails,
                ApplicationConstants.STATUS_TASK_ACTIVE,
                taskAssignTo,
                action,
                nusNetId,
                taskActionConfig,
                userInfoDetails
            );

        } catch (error) {
            console.error("Error in initiateProcessOnEclaimSubmit:", error);
            throw new ApplicationException(error.message || error);
        }

        console.log("ProcessDetailsService initiateProcessOnEclaimSubmit end()");
    }

    /**
     * Persists process details data
     * @param {Object} tx - The CDS transaction object
     * @param {Object} processConfig - The process configuration
     * @param {Object} savedMasterData - The saved master data
     * @param {string} status - The process status
     * @param {string} nusNetId - The NUSNET ID
     * @param {string} stfNumber - The staff number
     * @param {Object} userInfoDetails - The user info details
     * @returns {Promise<Object>} The saved process details
     */
    async persistProcessDetailsData(tx, processConfig, savedMasterData, status, nusNetId, stfNumber, userInfoDetails) {
        console.log("ProcessDetailsService persistProcessDetailsData start()");

        try {
            const now = new Date();
            const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
            const requestYear = String(now.getFullYear() % 100);
            const processIdPattern = `P${requestYear}${requestMonth}`;
            const processInstId = await CommonRepo.fetchSequenceNumber(processIdPattern, 4);

            const processDetails = {
                PROCESS_INST_ID: processInstId,
                PROCESS_CODE: processConfig.PROCESS_CODE,
                REFERENCE_ID: savedMasterData.DRAFT_ID,
                PROCESS_START_DATE: now,
                PROCESS_STATUS: status,
                PROCESSED_BY: userInfoDetails.STAFF_ID,
                PROCESSED_BY_NID: userInfoDetails.NUSNET_ID
            };

            // Use CommonRepo.upsertOperationChained for consistency
            await CommonRepo.upsertOperationChained(
                tx,
                "NUSEXT_UTILITY_PROCESS_DETAILS",
                processDetails
            );

            console.log("ProcessDetailsService persistProcessDetailsData end()");
            return processDetails;

        } catch (error) {
            console.error("Error in persistProcessDetailsData:", error);
            throw new ApplicationException(error.message || error);
        }
    }

    /**
     * Persists task details
     * @param {Object} tx - The CDS transaction object
     * @param {Object} tasksConfig - The tasks configuration
     * @param {Object} processDetails - The process details
     * @param {string} status - The task status
     * @param {string} taskAssignTo - The task assign to
     * @param {string} actionCode - The action code
     * @param {string} nusNetId - The NUSNET ID
     * @param {Object} taskActionConfig - The task action configuration
     * @param {Object} userInfoDetails - The user info details
     * @returns {Promise<void>}
     */
    async persistTaskDetails(tx, tasksConfig, processDetails, status, taskAssignTo, actionCode, nusNetId, taskActionConfig, userInfoDetails) {
        console.log("ProcessDetailsService persistTaskDetails start()");

        try {
            const now = new Date();
            const requestMonth = String(now.getMonth() + 1).padStart(2, "0");
            const requestYear = String(now.getFullYear() % 100);
            const taskIdPattern = `T${requestYear}${requestMonth}`;
            const taskInstId = await CommonRepo.fetchSequenceNumber(taskIdPattern, 6);

            let finalTaskAssignTo = taskAssignTo;
            let finalTaskAssignToStfNumber = taskAssignTo;

            if (taskAssignTo && taskAssignTo.trim() !== "" && taskAssignTo.toUpperCase() !== ApplicationConstants.ALL.toUpperCase()) {
                const taskUserDetailsDto = await CommonRepo.fetchUserInfo(taskAssignTo);
                if (taskUserDetailsDto && taskUserDetailsDto.STAFF_ID) {
                    finalTaskAssignToStfNumber = taskUserDetailsDto.STAFF_ID;
                }
                finalTaskAssignTo = taskUserDetailsDto.NUSNET_ID;
            } else {
                finalTaskAssignTo = ApplicationConstants.ALL;
                finalTaskAssignToStfNumber = ApplicationConstants.ALL;
            }

            const taskDetails = {
                TASK_INST_ID: taskInstId,
                TASK_SEQUENCE: tasksConfig.TASK_SEQUENCE,
                PROCESS_INST_ID: processDetails.PROCESS_INST_ID,
                TASK_ASSGN_GRP: tasksConfig.TASK_GRP,
                TASK_ASSGN_TO_STF_NUMBER: finalTaskAssignToStfNumber,
                TASK_ASSGN_TO: finalTaskAssignTo,
                TASK_STATUS: status,
                TASK_CREATED_ON: now,
                TASK_NAME: tasksConfig.TASK_NAME,
                TASK_CREATED_BY: userInfoDetails.STAFF_ID,
                TASK_CREATED_BY_NID: userInfoDetails.NUSNET_ID,
                TO_BE_TASK_SEQUENCE: taskActionConfig.TO_BE_TASK_SEQUENCE
            };

            // Use CommonRepo.upsertOperationChained for consistency
            await CommonRepo.upsertOperationChained(
                tx,
                "NUSEXT_UTILITY_TASK_DETAILS",
                taskDetails
            );

            console.log("ProcessDetailsService persistTaskDetails end()");

        } catch (error) {
            console.error("Error in persistTaskDetails:", error);
            throw new ApplicationException(error.message || error);
        }
    }
}

// Export singleton instance
module.exports = new ProcessDetailsService();
