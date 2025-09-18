const ElligibleCriteriaRepo = require("../repository/eligibilityCriteria.repo");
const { ApplicationException } = require("../util/customErrors");

/**
 * Controller: eligibleClaimTypes
 * Derives staff identity from XSUAA (request.user.id) and fetches eligible claim types
 * Mirrors Java EligibilityCriteriaController.eligibleClaimTypes but uses CAP user context
 * @param request
 */
async function eligibleClaimTypes(request) {
    try {
        const userId = request.user && request.user.id ? request.user.id : null;
        if (!userId) {
            throw new ApplicationException("Unauthorized: user id not found in context");
        }

        const { claimMonth, claimYear } = request.data;
        // Java signature accepts token, claimMonth, claimYear. Here token is not needed.
        // Repo currently derives eligibility by staff id alone. Month/year can be used later if needed.

        // Fetch both ECLAIMS and CW eligible claim types and merge, as per existing fetchClaimTypes pattern
        const [eclaimsResults, cwResults] = await Promise.all([
            ElligibleCriteriaRepo.fetchClaimTypes(userId),
            ElligibleCriteriaRepo.fetchClaimTypesForCw(userId),
        ]);

        const results = [...(eclaimsResults || []), ...(cwResults || [])];
        return results || [];
    } catch (err) {
        console.error("Error in eligibleClaimTypes:", err);
        return [];
    }
}

module.exports = { eligibleClaimTypes };


