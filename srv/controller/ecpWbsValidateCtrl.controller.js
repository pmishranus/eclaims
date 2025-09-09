const CommonUtils = require("../util/commonUtil");
const UserUtil = require("../util/userUtil");
const { validateWbsCodes } = require("../util/wbsValidation.service");

/**
 * Validates WBS (Work Breakdown Structure) codes using ECP system
 * @param {Object} request - CAP request object containing WBS validation data
 * @returns {Promise<Object>} Validation results from ECP system
 */
async function ecpWbsValidate(request) {
    try {
        // Extract username using utility function
        const user = UserUtil.extractUsername(request);

        // Extract WBS payload from request
        const wbsPayload = request.data.data;

        // Validate input
        if (!wbsPayload || !wbsPayload.WBSRequest || !Array.isArray(wbsPayload.WBSRequest.WBS)) {
            throw new Error("Invalid WBS request format. Expected: {WBSRequest: {WBS: [array of WBS codes]}}");
        }

        if (wbsPayload.WBSRequest.WBS.length === 0) {
            throw new Error("WBS array cannot be empty");
        }

        // Use shared validation service to call CPI and normalize results
        const sharedResult = await validateWbsCodes(wbsPayload.WBSRequest.WBS);

        // Preserve original endpoint behavior: return raw CPI result if needed
        // Here, return the normalized results for consistency
        return sharedResult;

    } catch (err) {
        console.error("ECP WBS Validation failed:", {
            user: request.user?.id,
            error: err.message,
            stack: err.stack
        });

        return {
            success: false,
            message: err.message || "Failed to validate WBS codes",
            error: true,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { ecpWbsValidate };