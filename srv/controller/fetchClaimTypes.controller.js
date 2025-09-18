const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const ApproverMatrixRepo = require("../repository/approverMatrix.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ElligibleCriteriaRepo = require("../repository/eligibilityCriteria.repo");

/**
 * Optimized fetchClaimTypes function with improved performance and error handling
 * @param {object} request - The CAP request object
 * @returns {Array} Array of claim types with configuration
 */
async function fetchClaimTypes(request) {
    try {
        // Input validation
        const { staffId, userGroup } = request.data;
        
        if (!staffId || staffId.trim() === "") {
            throw new Error("StaffId is required and cannot be empty");
        }
        
        if (!userGroup || userGroup.trim() === "") {
            throw new Error("UserGroup is required and cannot be empty");
        }

        console.log("EligibilityCriteriaServiceImpl fetchClaimTypes start()");

        let results = [];
        let skip = false;

        // Determine which queries to execute based on user group
        if (CommonUtils.equalsIgnoreCase(userGroup, ApplicationConstants.ESS_MONTH)) {
            // Execute both queries in parallel for better performance
            const [eclaimsResults, cwResults] = await Promise.all([
                ElligibleCriteriaRepo.fetchClaimTypes(staffId),
                ElligibleCriteriaRepo.fetchClaimTypesForCw(staffId)
            ]);
            
            results = [...eclaimsResults, ...cwResults];
            skip = true;
        } else {
            results = await ApproverMatrixRepo.fetchCAClaimTypes(staffId);
        }

        if (!results || results.length === 0) {
            console.log("EligibilityCriteriaServiceImpl fetchClaimTypes end() - No results found");
            return [];
        }

        // Deduplicate results if needed
        let response = results;
        if (!skip) {
            const seen = new Set();
            response = results.filter(item => {
                if (seen.has(item.CLAIM_TYPE_C)) {
                    return false;
                }
                seen.add(item.CLAIM_TYPE_C);
                return true;
            });
        }

        if (response.length === 0) {
            console.log("EligibilityCriteriaServiceImpl fetchClaimTypes end() - No results after deduplication");
            return [];
        }

        // Batch fetch configurations to avoid N+1 query problem
        const claimTypeCodes = response.map(item => item.CLAIM_TYPE_C);
        const configMap = await AppConfigRepo.fetchConfigsByKeysAndProcessCodes(userGroup, claimTypeCodes);

        // Apply configurations to results
        response.forEach(eligibleClaims => {
            const config = configMap[eligibleClaims.CLAIM_TYPE_C];
            eligibleClaims.PAST_MONTHS = config ? config.CONFIG_VALUE : "";
        });

        console.log("EligibilityCriteriaServiceImpl fetchClaimTypes end()");
        return response;
        
    } catch (err) {
        console.error("Error in fetchClaimTypes:", err);
        throw new Error(`Failed to fetch claim types: ${err.message}`);
    }
}

module.exports = {
    fetchClaimTypes,
};
