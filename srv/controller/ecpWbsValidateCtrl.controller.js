const CommonUtils = require("../util/commonUtil");

/**
 * Validates WBS (Work Breakdown Structure) codes using ECP system
 * @param {Object} request - CAP request object containing WBS validation data
 * @returns {Promise<Object>} Validation results from ECP system
 */
async function ecpWbsValidate(request) {
    try {
        const user = request.user.id;
        
        // Extract WBS payload from request
        const wbsPayload = request.data.data;
        
        // Validate input
        if (!wbsPayload || !wbsPayload.WBSRequest || !Array.isArray(wbsPayload.WBSRequest.WBS)) {
            throw new Error("Invalid WBS request format. Expected: {WBSRequest: {WBS: [array of WBS codes]}}");
        }
        
        if (wbsPayload.WBSRequest.WBS.length === 0) {
            throw new Error("WBS array cannot be empty");
        }
        
        // Call ECP CPI API for WBS validation
        const apiUrl = '/ecpwbsvalidate_qa';
        const validationResult = await CommonUtils.callCpiApi(
            apiUrl,
            wbsPayload,
            'POST'
        );
        
        // Return the validation result
        return validationResult;
        // return {
        //     success: true,
        //     message: "WBS validation completed successfully",
        //     data: validationResult
        //     validatedBy: user,
        //     timestamp: new Date().toISOString()
        // };
        
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