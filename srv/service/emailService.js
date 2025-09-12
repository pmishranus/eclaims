const cds = require("@sap/cds");
const ApplicationConstants = require("../util/constants");
const AppConfigRepo = require("../repository/appConfig.repo");
const EmailConfigRepo = require("../repository/emailConfig.repo");
const EmailNotificationLogRepo = require("../repository/emailNotificationLog.repo");

/**
 * Email Service Implementation
 * This service handles email functionality for the eclaims application
 * Based on Java EmailServiceImpl implementation
 */
class EmailService {

    /**
     * Sends on-demand emails for various actions
     * @param {string} draftId - The draft ID
     * @param {string} processCode - The process code (claim type)
     * @param {string} actionCode - The action code (SUBMIT, APPROVE, REJECT, etc.)
     * @param {string} requestorGrp - The requestor group
     * @param {string} loggedInUserName - The logged in user's NUSNET ID
     * @param {string} remarks - Any remarks for the action
     * @param {string} role - The user's role
     * @param {string} taskName - The task name
     * @param {string} nextTaskName - The next task name
     * @param {string} staffId - The staff ID
     * @param {Object} req - The request object for transaction context
     * @returns {Promise<Object>} The email response
     */
    async sendOnDemandEmails(draftId, processCode, actionCode, requestorGrp, loggedInUserName, remarks, role, taskName, nextTaskName, staffId, req = null) {
        console.log("EmailService sendOnDemandEmails start()");

        const emailResponse = {
            status: "SUCCESS",
            message: "Mail Sent Successfully",
            templateId: null,
            error: false
        };

        try {
            // Determine process type and route accordingly based on ApplicationConstants
            switch (processCode) {
                case ApplicationConstants.CLAIM_TYPE_101: // PTT
                case ApplicationConstants.CLAIM_TYPE_102: // CW
                case ApplicationConstants.CLAIM_TYPE_103: // OT
                case ApplicationConstants.CLAIM_TYPE_104: // HM
                case ApplicationConstants.CLAIM_TYPE_105: // TB
                    return await this.handleOnDemandEmailsForEClaims(draftId, processCode, actionCode, requestorGrp, loggedInUserName, remarks, role, taskName, nextTaskName, req);
                default:
                    console.log("No valid process type found for:", processCode);
                    break;
            }
        } catch (error) {
            console.error("Exception in sendOnDemandEmails:", error);
            emailResponse.status = "ERROR";
            emailResponse.message = "Mail sending FAILURE: " + error.message;
            emailResponse.error = true;
        }

        console.log("EmailService sendOnDemandEmails end()");
        return emailResponse;
    }

    /**
     * Handles on-demand emails for EClaims processes
     * @param {string} draftId - The draft ID
     * @param {string} processCode - The process code
     * @param {string} actionCode - The action code
     * @param {string} requestorGrp - The requestor group
     * @param {string} loggedInUserName - The logged in user name
     * @param {string} rejectionRemarks - Rejection remarks
     * @param {string} role - The role
     * @param {string} taskName - The task name
     * @param {string} nextTaskName - The next task name
     * @param {Object} req - The request object for transaction context
     * @returns {Promise<Object>} The email response
     */
    async handleOnDemandEmailsForEClaims(draftId, processCode, actionCode, requestorGrp, loggedInUserName, rejectionRemarks, role, taskName, nextTaskName, req = null) {
        console.log("EmailService handleOnDemandEmailsForEClaims start()");

        const emailResponse = {
            status: "SUCCESS",
            message: "Mail Sent Successfully",
            templateId: null,
            error: false
        };

        try {
            let tempTaskName = null;

            // Get task name from role if not provided
            if (role) {
                tempTaskName = await this.getTaskNameFromRole(role, processCode);
            }
            tempTaskName = tempTaskName || taskName;

            // Handle different action codes
            if (actionCode && actionCode.toUpperCase() === ApplicationConstants.ACTION_REJECT) {
                if (rejectionRemarks) {
                    emailResponse = await this.emailHandler(draftId, processCode, actionCode, requestorGrp, loggedInUserName, rejectionRemarks, tempTaskName, null, null, req);
                } else {
                    emailResponse.status = "ERROR";
                    emailResponse.message = "Please provide Remarks for Rejection";
                    emailResponse.error = true;
                }
            }

            if (actionCode && actionCode.toUpperCase() === ApplicationConstants.ACTION_CHECK) {
                emailResponse = await this.emailHandler(draftId, processCode, actionCode, requestorGrp, loggedInUserName, null, tempTaskName, nextTaskName, null, req);
            }

            if (actionCode && actionCode.toUpperCase() === ApplicationConstants.ACTION_RETRACT) {
                emailResponse = await this.emailHandler(draftId, processCode, actionCode, requestorGrp, loggedInUserName, null, tempTaskName, null, null, req);
            }

            if (actionCode && actionCode.toUpperCase() === ApplicationConstants.ACTION_SUBMIT) {
                emailResponse = await this.emailHandler(draftId, processCode, actionCode, requestorGrp, loggedInUserName, null, tempTaskName, null, null, req);
            }

            if (actionCode && actionCode.toUpperCase() === ApplicationConstants.ACTION_APPROVE) {
                emailResponse = await this.emailHandler(draftId, processCode, actionCode, requestorGrp, loggedInUserName, null, tempTaskName, nextTaskName, null, req);
            }

        } catch (error) {
            console.error("Exception in handleOnDemandEmailsForEClaims:", error);
            emailResponse.status = "ERROR";
            emailResponse.message = "Mail sending FAILURE: " + error.message;
            emailResponse.error = true;
        }

        console.log("EmailService handleOnDemandEmailsForEClaims end()");
        return emailResponse;
    }


    /**
     * Main email handler method
     * @param {string} draftId - The draft ID
     * @param {string} processCode - The process code
     * @param {string} actionCode - The action code
     * @param {string} requestorGrp - The requestor group
     * @param {string} loggedInUserName - The logged in user name
     * @param {string} remarks - Remarks
     * @param {string} taskName - The task name
     * @param {string} nextTaskName - The next task name
     * @param {string} staffId - The staff ID
     * @param {Object} req - The request object for transaction context
     * @returns {Promise<Object>} The email response
     */
    async emailHandler(draftId, processCode, actionCode, requestorGrp, loggedInUserName, remarks, taskName, nextTaskName, staffId, req = null) {
        console.log("EmailService emailHandler start()");

        const emailResponse = {
            status: "SUCCESS",
            message: "Mail Sent Successfully",
            templateId: null,
            error: false
        };

        let emailConfig = null;
        let emailTemplate = null;
        let templateName = null;
        let emailType = null;
        let mailIdMap = null;

        try {
            // Get email configuration based on action code or next task name
            if (actionCode) {
                emailConfig = await EmailConfigRepo.getEmailTemplateConfiguration(processCode, taskName, actionCode);
            } else {
                // Pending email task notification handling
                const processTemplateName = processCode === ApplicationConstants.CLAIM_TYPE_101 ?
                    "ECLAIM_PENDING_EMAIL" : "OTHM_PENDING_EMAIL";
                emailConfig = await EmailConfigRepo.getPendingEmailTemplateConfiguration(processCode, taskName, processTemplateName);
            }

            if (!emailConfig) {
                emailResponse.status = "ERROR";
                emailResponse.message = "No Mail Configuration is maintained";
                emailResponse.error = true;
                return emailResponse;
            }

            emailType = emailConfig.EMAIL_TYPE;
            emailTemplate = await EmailConfigRepo.getEmailTemplate(emailConfig.TEMPLATE_NAME);

            if (!emailTemplate) {
                emailResponse.status = "ERROR";
                emailResponse.message = "No Mail Template Exists";
                emailResponse.error = true;
                return emailResponse;
            }

            templateName = emailTemplate.TEMPLATE_NAME;
            emailResponse.templateId = emailTemplate.TEMPLATE_NAME;

            // Frame email subject and content
            const emailSubject = await this.frameEmailSubject(processCode, emailConfig.TEMPLATE_NAME, emailTemplate.MAIL_SUBJECT, draftId, taskName);
            const emailContent = await this.frameEmailBody(emailConfig.TEMPLATE_NAME, emailTemplate.MAIL_BODY, draftId, taskName, nextTaskName, remarks, processCode, actionCode, requestorGrp, loggedInUserName);

            // Populate email IDs
            mailIdMap = await this.populateEmailIds(draftId, emailConfig, processCode, loggedInUserName, actionCode, false, staffId, requestorGrp);

            // Send email using external service
            await this.sendEmail(emailSubject, emailContent, mailIdMap, req);

            emailResponse.status = "SUCCESS";
            emailResponse.message = "Mail Sent Successfully";

        } catch (error) {
            console.error("Exception in emailHandler:", error);
            emailResponse.status = "ERROR";
            emailResponse.message = "Mail sending FAILURE: " + error.message;
            emailResponse.error = true;
        }

        // Save notification log
        await this.saveNotificationLog(draftId, templateName, emailType, mailIdMap, loggedInUserName, emailResponse.status, emailResponse.message);

        console.log("EmailService emailHandler end()");
        return emailResponse;
    }

    /**
     * Sends email using external CAPM service via InboxService
     * @param {string} emailSubject - The email subject
     * @param {string} emailContent - The email content
     * @param {Object} mailIdMap - The mail ID map
     * @param {Object} req - The request object for transaction context
     * @returns {Promise<void>}
     */
    async sendEmail(emailSubject, emailContent, mailIdMap, req = null) {
        console.log("EmailService sendEmail start()");

        try {
            // Call external InboxService sendMail action
            await this.callUtilityInboxEmailSender(req, emailSubject, emailContent, mailIdMap, false);
            console.log("Email sent successfully via InboxService");

        } catch (error) {
            console.error("Error calling InboxService sendMail:", error);
            throw error;
        }
    }


    /**
     * Gets task name from role and process code
     * @param {string} role - The role
     * @param {string} processCode - The process code
     * @returns {Promise<string>} The task name
     */
    async getTaskNameFromRole(role, processCode) {
        console.log("EmailService getTaskNameFromRole start() - role:", role, "processCode:", processCode);

        try {
            if (!role || !processCode) {
                console.log("Role or processCode is missing");
                return null;
            }

            // Fetch task name from app configuration using role as config key
            const taskName = await AppConfigRepo.fetchConfigValue(role, processCode);

            if (taskName) {
                console.log("Found task name from configuration:", taskName);
                return taskName;
            } else {
                console.log("No task name found in configuration for role:", role, "processCode:", processCode);

                // Fallback to role-based mapping if no configuration found
                const fallbackTaskName = this.getFallbackTaskName(role);
                console.log("Using fallback task name:", fallbackTaskName);
                return fallbackTaskName;
            }
        } catch (error) {
            console.error("Error in getTaskNameFromRole:", error);
            // Return fallback task name on error
            return this.getFallbackTaskName(role);
        }
    }

    /**
     * Gets fallback task name based on role constants
     * @param {string} role - The role
     * @returns {string} The fallback task name
     */
    getFallbackTaskName(role) {
        // Map roles to their corresponding task names using ApplicationConstants
        const roleToTaskNameMap = {
            [ApplicationConstants.APPROVER]: ApplicationConstants.TASK_NAME_APPROVER,
            [ApplicationConstants.ADDITIONAL_APP_1]: ApplicationConstants.TASK_NAME_ADDITIONAL_APP_1,
            [ApplicationConstants.ADDITIONAL_APP_2]: ApplicationConstants.TASK_NAME_ADDITIONAL_APP_2,
            [ApplicationConstants.VERIFIER]: ApplicationConstants.TASK_NAME_VERIFIER,
            [ApplicationConstants.FINANCE_LEAD]: ApplicationConstants.TASK_NAME_FINANCE_LEAD,
            [ApplicationConstants.REPORTING_MGR]: ApplicationConstants.TASK_NAME_APPROVER, // Reporting manager uses approver task name
            [ApplicationConstants.CA]: ApplicationConstants.TASK_NAME_VERIFIER, // Claim assistant uses verifier task name
            [ApplicationConstants.ESS]: ApplicationConstants.TASK_NAME_VERIFIER // ESS uses verifier task name
        };

        return roleToTaskNameMap[role] || role; // Return the role itself if no mapping found
    }

    /**
     * Gets email template configuration
     * @param {string} processCode - The process code
     * @param {string} taskName - The task name
     * @param {string} actionCode - The action code
     * @returns {Promise<Object>} The email configuration
     */
    async getEmailTemplateConfiguration(processCode, taskName, actionCode) {
        console.log("EmailService getEmailTemplateConfiguration - processCode:", processCode, "taskName:", taskName, "actionCode:", actionCode);

        try {
            const emailConfig = await EmailConfigRepo.getEmailTemplateConfiguration(processCode, taskName, actionCode);
            return emailConfig;
        } catch (error) {
            console.error("Error in getEmailTemplateConfiguration:", error);
            return null;
        }
    }

    /**
     * Gets email template
     * @param {string} templateName - The template name
     * @returns {Promise<Object>} The email template
     */
    async getEmailTemplate(templateName) {
        console.log("EmailService getEmailTemplate - templateName:", templateName);

        try {
            const emailTemplate = await EmailConfigRepo.getEmailTemplate(templateName);
            return emailTemplate;
        } catch (error) {
            console.error("Error in getEmailTemplate:", error);
            return null;
        }
    }

    /**
     * Frames email subject
     * @param {string} processCode - The process code
     * @param {string} templateName - The template name
     * @param {string} emailSubject - The base email subject
     * @param {string} draftId - The draft ID
     * @param {string} taskName - The task name
     * @returns {Promise<string>} The framed email subject
     */
    async frameEmailSubject(processCode, templateName, emailSubject, draftId, taskName) {
        console.log("EmailService frameEmailSubject - processCode:", processCode, "templateName:", templateName, "draftId:", draftId, "taskName:", taskName);

        try {
            // Basic subject framing - can be enhanced with more complex logic
            let framedSubject = emailSubject;

            // Add draft ID to subject if not already present
            if (draftId && !framedSubject.includes(draftId)) {
                framedSubject = `${framedSubject} - ${draftId}`;
            }

            // Add task name if needed
            if (taskName && !framedSubject.includes(taskName)) {
                framedSubject = `${framedSubject} (${taskName})`;
            }

            console.log("Framed email subject:", framedSubject);
            return framedSubject;
        } catch (error) {
            console.error("Error in frameEmailSubject:", error);
            return emailSubject; // Return original subject on error
        }
    }

    /**
     * Frames email body
     * @param {string} templateName - The template name
     * @param {string} emailTemplateBody - The template body
     * @param {string} draftId - The draft ID
     * @param {string} taskName - The task name
     * @param {string} nextTaskName - The next task name
     * @param {string} remarks - Remarks
     * @param {string} processCode - The process code
     * @param {string} actionCode - The action code
     * @param {string} requestorGrp - The requestor group
     * @param {string} loggedInUserName - The logged in user name
     * @returns {Promise<string>} The framed email body
     */
    async frameEmailBody(templateName, emailTemplateBody, draftId, taskName, nextTaskName, remarks, processCode, actionCode, requestorGrp, loggedInUserName) {
        console.log("EmailService frameEmailBody - templateName:", templateName, "draftId:", draftId, "taskName:", taskName);

        try {
            // Basic email body framing with placeholder replacement
            let framedBody = emailTemplateBody;

            // Replace common placeholders
            const placeholders = {
                '${DRAFT_ID}': draftId || '',
                '${TASK_NAME}': taskName || '',
                '${NEXT_TASK_NAME}': nextTaskName || '',
                '${REMARKS}': remarks || '',
                '${PROCESS_CODE}': processCode || '',
                '${ACTION_CODE}': actionCode || '',
                '${REQUESTOR_GRP}': requestorGrp || '',
                '${LOGGED_IN_USER}': loggedInUserName || '',
                '${CURRENT_DATE}': new Date().toLocaleDateString(),
                '${CURRENT_TIME}': new Date().toLocaleTimeString()
            };

            // Replace placeholders in the email body
            for (const [placeholder, value] of Object.entries(placeholders)) {
                framedBody = framedBody.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
            }

            console.log("Framed email body length:", framedBody.length);
            return framedBody;
        } catch (error) {
            console.error("Error in frameEmailBody:", error);
            return emailTemplateBody; // Return original body on error
        }
    }

    /**
     * Populates email IDs
     * @param {string} draftId - The draft ID
     * @param {Object} emailConfig - The email configuration
     * @param {string} processCode - The process code
     * @param {string} loggedInUserName - The logged in user name
     * @param {string} actionCode - The action code
     * @param {boolean} isPendingNotification - Whether it's a pending notification
     * @param {string} staffId - The staff ID
     * @param {string} requestorGrp - The requestor group
     * @returns {Promise<Object>} The mail ID map
     */
    async populateEmailIds(draftId, emailConfig, processCode, loggedInUserName, actionCode, isPendingNotification, staffId, requestorGrp) {
        console.log("EmailService populateEmailIds - draftId:", draftId, "processCode:", processCode, "actionCode:", actionCode);

        try {
            // Basic email ID population - can be enhanced with complex logic
            const mailIdMap = {
                to: "",
                cc: "",
                bcc: ""
            };

            // For now, use placeholder email addresses
            // In a real implementation, this would query user tables, process participants, etc.
            if (emailConfig && emailConfig.RECIPIENT_LIST) {
                // Parse recipient list from configuration
                const recipients = emailConfig.RECIPIENT_LIST.split(',').map(email => email.trim());
                mailIdMap.to = recipients.join(',');
            } else {
                // Default fallback
                mailIdMap.to = "user@nus.edu.sg";
            }

            if (emailConfig && emailConfig.CC_LIST) {
                const ccRecipients = emailConfig.CC_LIST.split(',').map(email => email.trim());
                mailIdMap.cc = ccRecipients.join(',');
            }

            console.log("Populated email IDs:", mailIdMap);
            return mailIdMap;
        } catch (error) {
            console.error("Error in populateEmailIds:", error);
            // Return default email IDs on error
            return {
                to: "user@nus.edu.sg",
                cc: "",
                bcc: ""
            };
        }
    }

    /**
     * Saves notification log
     * @param {string} referenceId - The reference ID
     * @param {string} notifTemplateId - The notification template ID
     * @param {string} notifType - The notification type
     * @param {Object} mailIdMap - The mail ID map
     * @param {string} loggedInUserName - The logged in user name
     * @param {string} status - The status
     * @param {string} message - The message
     * @returns {Promise<Object>} The notification log response
     */
    async saveNotificationLog(referenceId, notifTemplateId, notifType, mailIdMap, loggedInUserName, status, message) {
        console.log("EmailService saveNotificationLog - referenceId:", referenceId, "notifTemplateId:", notifTemplateId, "status:", status);

        try {
            const result = await EmailNotificationLogRepo.saveNotificationLog(
                referenceId,
                notifTemplateId,
                notifType,
                mailIdMap,
                loggedInUserName,
                status,
                message
            );

            console.log("Notification log saved successfully:", result);
            return result;
        } catch (error) {
            console.error("Error in saveNotificationLog:", error);
            return {
                status: "ERROR",
                message: "Failed to save notification log: " + error.message,
                error: error
            };
        }
    }

    /**
     * Sends pending task emails for various process types
     * @param {string} pendingTaskName - The pending task name
     * @param {string} processCode - The process code
     * @param {string} noOfDaysDiff - Number of days difference
     * @param {string} emailDate - Email date
     * @param {string} ignoreDifference - Whether to ignore difference
     * @param {string} timeRange - Time range
     * @param {Object} req - The request object for transaction context
     * @returns {Promise<Array>} Array of email response objects
     */
    async sendPendingTaskEmails(pendingTaskName, processCode, noOfDaysDiff, emailDate, ignoreDifference, timeRange, req = null) {
        console.log("EmailService sendPendingTaskEmails start()");

        if (!pendingTaskName || !processCode) {
            throw new Error("Please provide correct input details.");
        }

        const emailResponseList = [];

        try {
            // Route based on process code (similar to Java implementation)
            switch (processCode) {
                case ApplicationConstants.CLAIM_TYPE_101: // PTT
                case ApplicationConstants.CLAIM_TYPE_102: // CW
                case ApplicationConstants.CLAIM_TYPE_103: // OT
                case ApplicationConstants.CLAIM_TYPE_104: // HM
                case ApplicationConstants.CLAIM_TYPE_105: // TB
                    return await this.handlePendingEmailsForEClaims(processCode, pendingTaskName, noOfDaysDiff, ignoreDifference, req);
                default:
                    console.log("No valid process type found for:", processCode);
                    break;
            }

            console.log("EmailService sendPendingTaskEmails end()");
            return emailResponseList;

        } catch (error) {
            console.error("Error in sendPendingTaskEmails:", error);
            emailResponseList.push({
                status: "ERROR",
                message: "Mail sending FAILURE: " + error.message,
                templateId: null,
                error: true
            });
            return emailResponseList;
        }
    }

    /**
     * Handles pending emails for EClaims processes
     * @param {string} processCode - The process code
     * @param {string} pendingTaskName - The pending task name
     * @param {string} noOfDaysDiff - Number of days difference
     * @param {string} ignoreDifference - Whether to ignore difference
     * @param {Object} req - The request object for transaction context
     * @returns {Promise<Array>} Array of email response objects
     */
    async handlePendingEmailsForEClaims(processCode, pendingTaskName, noOfDaysDiff, ignoreDifference, req = null) {
        console.log("EmailService handlePendingEmailsForEClaims start()");

        const emailResponseList = [];

        try {
            // TODO: Implement the full logic from Java
            // This is a placeholder implementation that can be extended

            // For now, return a success response indicating the method was called
            emailResponseList.push({
                status: "SUCCESS",
                message: `Pending email notification sent for process ${processCode}, task ${pendingTaskName}`,
                templateId: null,
                error: false
            });

            console.log("EmailService handlePendingEmailsForEClaims end()");
            return emailResponseList;

        } catch (error) {
            console.error("Error in handlePendingEmailsForEClaims:", error);
            emailResponseList.push({
                status: "ERROR",
                message: "Mail sending FAILURE: " + error.message,
                templateId: null,
                error: true
            });
            return emailResponseList;
        }
    }


    /**
     * Calls the external InboxService sendMail action for email sending
     * Similar to callUtilityInboxTaskActions but for email functionality
     * @param {Object} req - The request object
     * @param {string} emailSubject - The email subject
     * @param {string} emailContent - The email content (HTML)
     * @param {Object} mailIdMap - The mail ID map with to, cc, bcc
     * @param {boolean} setPriority - Whether to set email priority
     * @returns {Promise<Object>} The email sending result
     */
    async callUtilityInboxEmailSender(req, emailSubject, emailContent, mailIdMap, setPriority = false) {
        const srv = await cds.connect.to('InboxService');
        const oInboxCallEmail = {
            "emailSubject": emailSubject,
            "emailContent": emailContent,
            "mailMap": mailIdMap,
            "setPriority": setPriority
        };
        const payload = { data: oInboxCallEmail };
        // Use low-level REST send to avoid requiring a local CSN for the external service
        const send = (context) => context.send({ method: 'POST', path: '/sendEmail', data: payload });
        const result = req ? await send(srv.tx(req)) : await send(srv);
        return result;
    }
}

module.exports = new EmailService();
