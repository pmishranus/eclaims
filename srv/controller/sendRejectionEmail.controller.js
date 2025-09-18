const emailService = require("../service/emailService");

/**
 * Controller for sending rejection emails
 * Implements the /eclaims/sendRejectionEmail endpoint from Java EmailController
 */
class SendRejectionEmailController {

    /**
     * Sends rejection email for eclaims
     * @param {object} request - The request object containing function parameters
     * @returns {Promise<object>} Email response object
     */
    async sendRejectionEmail(request) {
        console.log("SendRejectionEmailController sendRejectionEmail start()");

        try {
            // Extract parameters from function call (request.data contains the function parameters)
            const { draftId, nusNetId, role, rejectionRemarks, requestorGroup, taskName } = request.data || {};

            // Validate required parameters
            if (!draftId) {
                throw new Error("draftId is required");
            }
            if (!nusNetId) {
                throw new Error("nusNetId is required");
            }
            if (!role) {
                throw new Error("role is required");
            }
            if (!rejectionRemarks) {
                throw new Error("rejectionRemarks is required");
            }
            if (!requestorGroup) {
                throw new Error("requestorGroup is required");
            }
            if (!taskName) {
                throw new Error("taskName is required");
            }

            console.log("Sending rejection email for draftId:", draftId, "role:", role, "taskName:", taskName);

            // Call email service with hardcoded processCode "103" and actionCode "REJECT" as per Java implementation
            const emailResponse = await emailService.sendOnDemandEmails(
                draftId,           // draftId
                "103",             // processCode (hardcoded as per Java)
                "REJECT",          // actionCode (hardcoded as per Java)
                requestorGroup,    // requestorGroup
                nusNetId,          // loggedInUserName (nusNetId)
                rejectionRemarks,  // remarks
                role,              // role
                taskName,          // taskName
                null,              // nextTaskName (null as per Java)
                null,              // staffId (null as per Java)
                request            // req for transaction context
            );

            console.log("SendRejectionEmailController sendRejectionEmail end() - Success");
            return emailResponse;

        } catch (error) {
            console.error("Error in SendRejectionEmailController sendRejectionEmail:", error);

            // Return error response in the same format as Java
            return {
                status: "ERROR",
                message: "Mail sending FAILURE: " + error.message,
                templateId: null,
                error: true
            };
        }
    }
}

module.exports = new SendRejectionEmailController();
