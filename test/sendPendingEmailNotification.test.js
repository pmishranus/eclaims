/**
 * Test file for sendPendingEmailNotification endpoint
 * This demonstrates how to call the /eclaims/sendPendingEmailNotification endpoint
 */

const cds = require("@sap/cds");

// Example test data matching the Java implementation parameters
const testData = {
    pendingTaskName: "APPROVER",
    processCode: "101", // PTT
    noOfDaysDiff: "3",
    emailDate: "2024-01-15",
    ignoreDifference: "N",
    timeRange: "09:00-17:00"
};

// Alternative test data for CWS process
const testDataCWS = {
    pendingTaskName: "VERIFIER",
    processCode: "106", // CWS
    noOfDaysDiff: "2",
    emailDate: "2024-01-15",
    ignoreDifference: "Y",
    timeRange: "08:00-18:00"
};

/**
 * Example of how to call the sendPendingEmailNotification function
 * This would be called via HTTP GET to: /eclaims/sendPendingEmailNotification
 */
async function testSendPendingEmailNotification() {
    try {
        console.log("Testing sendPendingEmailNotification function...");
        console.log("Test data (EClaims):", testData);
        console.log("Test data (CWS):", testDataCWS);

        // In a real scenario, this would be called via HTTP:
        // GET /eclaims/sendPendingEmailNotification?pendingTaskName=APPROVER&processCode=101&noOfDaysDiff=3&emailDate=2024-01-15&ignoreDifference=N&timeRange=09:00-17:00

        console.log("Function would be accessible at: GET /eclaims/sendPendingEmailNotification");
        console.log("Expected response format (array of email responses):");
        console.log([
            {
                status: "SUCCESS", // or "ERROR"
                message: "Pending email notification sent for process 101, task APPROVER",
                templateId: null,
                error: false
            }
        ]);

        console.log("\nSupported Process Codes:");
        console.log("- 101: PTT (EClaims)");
        console.log("- 102: CW (EClaims)");
        console.log("- 103: OT (EClaims)");
        console.log("- 104: HM (EClaims)");
        console.log("- 105: TB (EClaims)");
        console.log("- 106: CWS");
        console.log("- 107: NED");
        console.log("- 108: OPWN");

        console.log("\nSupported Task Names:");
        console.log("- APPROVER");
        console.log("- VERIFIER");
        console.log("- CLAIM_ASSISTANT");

    } catch (error) {
        console.error("Test error:", error);
    }
}

// Export for potential use in test runners
module.exports = {
    testData,
    testDataCWS,
    testSendPendingEmailNotification
};

// Run test if this file is executed directly
if (require.main === module) {
    testSendPendingEmailNotification();
}
