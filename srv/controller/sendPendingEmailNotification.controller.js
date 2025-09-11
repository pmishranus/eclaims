const emailService = require("../service/emailService");

/**
 * Controller for sending pending email notifications
 * Implements the /eclaims/sendPendingEmailNotification endpoint from Java EmailController
 */
class SendPendingEmailNotificationController {

    /**
     * Sends pending email notifications for eclaims
     * @param {Object} request - The request object containing function parameters
     * @returns {Promise<Array>} Array of email response objects
     */
    async sendPendingEmailNotification(request) {
        console.log("SendPendingEmailNotificationController sendPendingEmailNotification start()");

        try {
            // Extract parameters from function call (request.data contains the function parameters)
            const {
                pendingTaskName,
                processCode,
                noOfDaysDiff,
                emailDate,
                ignoreDifference,
                timeRange
            } = request.data || {};

            // Validate required parameters
            if (!pendingTaskName) {
                throw new Error("pendingTaskName is required");
            }
            if (!processCode) {
                throw new Error("processCode is required");
            }

            console.log("Sending pending email notification for processCode:", processCode, "pendingTaskName:", pendingTaskName);

            // Call email service (matching Java implementation)
            const emailResponseList = await emailService.sendPendingTaskEmails(
                pendingTaskName,    // pendingTaskName
                processCode,        // processCode
                noOfDaysDiff,       // noOfDaysDiff
                emailDate,          // emailDate
                ignoreDifference,   // ignoreDifference
                timeRange,          // timeRange
                request             // req for transaction context
            );

            console.log("SendPendingEmailNotificationController sendPendingEmailNotification end() - Success");
            return emailResponseList;

        } catch (error) {
            console.error("Error in SendPendingEmailNotificationController sendPendingEmailNotification:", error);

            // Return error response in the same format as Java
            return [{
                status: "ERROR",
                message: "Mail sending FAILURE: " + error.message,
                templateId: null,
                error: true
            }];
        }
    }
}

module.exports = new SendPendingEmailNotificationController();
