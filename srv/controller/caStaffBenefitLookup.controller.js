const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const DateUtils = require("../util/dateUtil");
const { ApplicationConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");

/**
 * Controller: caStaffBenefitLookup
 * Mirrors Java EligibilityCriteriaController.caStaffBenefitLookup but uses CAP user context (XSUAA)
 * @param {object} request - CAP request object
 * @returns {Promise<Array>} Array of staff lookup results for benefit management
 */
async function caStaffBenefitLookup(request) {
    try {
        // Extract user from XSUAA context
        const userId = request.user && request.user.id ? request.user.id : null;
        if (!userId) {
            throw new ApplicationException("Unauthorized: user id not found in context");
        }

        // Extract parameters from request
        const { claimType, ulu, fdlu, period, searchValue } = request.data;

        // Input validation
        if (!claimType || !ulu || !fdlu || !period) {
            throw new ApplicationException("Please provide valid inputs - claimType, ULU, FDLU, Period");
        }

        // Parse period and get date range
        let startDate, endDate;

        if (period.includes(ApplicationConstants.HYPHEN)) {
            // Period format: MM-YYYY
            const [month, year] = period.split(ApplicationConstants.HYPHEN);
            const inputMonth = parseInt(month);
            const inputYear = parseInt(year);

            // Get date range for the month/year
            const dateRange = DateUtils.fetchDatesFromYear(inputMonth, inputYear);
            if (!dateRange || dateRange.length < 2) {
                throw new ApplicationException("Invalid period format. Expected format: MM-YYYY");
            }
            startDate = dateRange[0];
            endDate = dateRange[1];
        } else {
            // Use current date if period is not in MM-YYYY format
            const currentDate = new Date();
            startDate = currentDate;
            endDate = currentDate;
        }

        // Call repository method
        const staffLookup = await ChrsJobInfoRepo.claimAssistantStaffBenefitLookup(
            userId,
            ulu,
            fdlu,
            startDate,
            endDate,
            searchValue
        );

        // Process and deduplicate results (mirroring Java implementation)
        let processedResults = [];
        if (staffLookup && staffLookup.length > 0) {
            // Create a map to deduplicate by STF_NUMBER
            const staffMap = new Map();
            staffLookup.forEach(staff => {
                if (!staffMap.has(staff.STF_NUMBER)) {
                    staffMap.set(staff.STF_NUMBER, staff);
                }
            });

            // Convert map values to array and sort by STF_NUMBER
            processedResults = Array.from(staffMap.values())
                .sort((a, b) => a.STF_NUMBER.localeCompare(b.STF_NUMBER));
        }

        return processedResults;

    } catch (err) {
        console.error("Error in caStaffBenefitLookup:", err);
        if (err instanceof ApplicationException) {
            throw err;
        }
        throw new ApplicationException(`Error in staff benefit lookup: ${err.message}`);
    }
}

module.exports = { caStaffBenefitLookup };
