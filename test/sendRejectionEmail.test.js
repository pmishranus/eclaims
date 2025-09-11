/**
 * Test file for sendRejectionEmail endpoint
 * This demonstrates how to call the /eclaims/sendRejectionEmail endpoint
 */

const cds = require("@sap/cds");

// Example test data matching the Java implementation parameters
const testData = {
    draftId: "DRAFT123456",
    nusNetId: "testuser@nus.edu.sg",
    role: "APPROVER",
    rejectionRemarks: "Please provide additional documentation for this claim",
    requestorGroup: "CLAIM_ASSISTANT",
    taskName: "APPROVER"
};

/**
 * Example of how to call the sendRejectionEmail function
 * This would be called via HTTP GET to: /eclaims/sendRejectionEmail
 */
async function testSendRejectionEmail() {
    try {
        console.log("Testing sendRejectionEmail function...");
        console.log("Test data:", testData);

        // In a real scenario, this would be called via HTTP:
        // GET /eclaims/sendRejectionEmail?draftId=DRAFT123456&nusNetId=testuser@nus.edu.sg&role=APPROVER&rejectionRemarks=Please%20provide%20additional%20documentation&requestorGroup=CLAIM_ASSISTANT&taskName=APPROVER

        console.log("Function would be accessible at: GET /eclaims/sendRejectionEmail");
        console.log("Expected response format:");
        console.log({
            status: "SUCCESS", // or "ERROR"
            message: "Email sent successfully", // or error message
            templateId: "template_id_if_available",
            error: false // or true if error
        });

    } catch (error) {
        console.error("Test error:", error);
    }
}

// Export for potential use in test runners
module.exports = {
    testData,
    testSendRejectionEmail
};

// Run test if this file is executed directly
if (require.main === module) {
    testSendRejectionEmail();
}
