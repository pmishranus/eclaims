const cds = require("@sap/cds");
const { INSERT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Email Notification Log Repository
 * Handles email notification logging
 */

/**
 * Save notification log entry
 * @param {string} referenceId - The reference ID (draft ID)
 * @param {string} notifTemplateId - The notification template ID
 * @param {string} notifType - The notification type
 * @param {object} mailIdMap - The mail ID map
 * @param {string} loggedInUserName - The logged in user name
 * @param {string} status - The status
 * @param {string} message - The message
 * @returns {Promise<object>} The saved notification log entry
 */
async function saveNotificationLog(referenceId, notifTemplateId, notifType, mailIdMap, loggedInUserName, status, message) {
    console.log("EmailNotificationLogRepo saveNotificationLog - referenceId:", referenceId, "notifTemplateId:", notifTemplateId, "status:", status);

    try {
        const notificationLog = {
            REFERENCE_ID: referenceId,
            NOTIF_TEMPLATE_ID: notifTemplateId,
            NOTIF_TYPE: notifType,
            SENT_TO: mailIdMap?.to || "",
            SENT_CC: mailIdMap?.cc || "",
            LOGGED_IN_USER: loggedInUserName,
            STATUS: status,
            MESSAGE: message,
            CREATED_ON: new Date(),
            CREATED_BY: loggedInUserName
        };

        const result = await cds.run(
            INSERT.into("NUSEXT_UTILITY_EMAIL_NOTIFICATION_LOGS").entries(notificationLog)
        );

        console.log("Notification log saved successfully:", result);
        return {
            status: "SUCCESS",
            message: "Notification log saved successfully",
            data: result
        };
    } catch (error) {
        console.error("Error in saveNotificationLog:", error);
        return {
            status: "ERROR",
            message: "Failed to save notification log: " + error.message,
            error: error
        };
    }
}

module.exports = {
    saveNotificationLog
};
