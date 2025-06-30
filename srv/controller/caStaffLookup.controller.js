const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const DateUtils = require("../util/dateUtil");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ChrsCompInfoRepo = require("../repository/chrsCompInfo.repo");
const { monitor } = require("../util/performanceMonitor");
const { userInfoCache } = require("../util/cacheUtil");
const { ApplicationException, DatabaseException } = require("../util/customErrors");
const cds = require("@sap/cds");

/**
 * Enhanced CA Staff Lookup function with improved performance and error handling
 * Follows SAP BTP CAPM guidelines for error handling and performance optimization
 * 
 * @param {Object} request - CAP request object
 * @returns {Promise<Array>} Array of staff lookup results
 */
async function fetchCaStaffLookup(request) {
    const timerId = monitor.start("caStaffLookup");
    
    try {
        // Input validation with proper error messages
        const validationResult = await validateInput(request);
        if (!validationResult.isValid) {
            throw new ApplicationException(validationResult.errorMessage);
        }

        const { claimType, ulu, fdlu, period, searchValue } = request.data;
        const user = request.user.id;

        // Get user info with caching
        const userInfoDetails = await getUserInfoWithCache(user);
        if (!userInfoDetails) {
            throw new ApplicationException("User not found or inactive");
        }

        // Parse period and get date range
        const dateRange = await parsePeriodAndGetDateRange(period);
        if (!dateRange) {
            throw new ApplicationException("Invalid period format. Expected format: MM-YYYY or leave empty for current date");
        }

        // Fetch staff lookup data with performance monitoring
        const staffLookup = await monitor.async("databaseQuery", async () => {
            return await ChrsJobInfoRepo.claimAssistantStaffLookupOptimized(
                userInfoDetails.NUSNET_ID,
                ulu,
                fdlu,
                dateRange.startDate,
                dateRange.endDate,
                claimType,
                searchValue
            );
        });

        // Process and deduplicate results
        const processedResults = await processAndDeduplicateResults(staffLookup);

        // Log performance metrics
        const performanceMetrics = monitor.stop(timerId);
        console.log(`CA Staff Lookup completed successfully. Found ${processedResults.length} results in ${performanceMetrics.duration}ms`);

        return processedResults;

    } catch (error) {
        // Stop timer and log error
        monitor.stop(timerId);
        
        // Log error details for debugging
        console.error("CA Staff Lookup failed:", {
            error: error.message,
            stack: error.stack,
            user: request.user?.id,
            data: request.data
        });

        // Return proper CAP error response
        if (error instanceof ApplicationException) {
            return request.error(400, error.message);
        } else if (error instanceof DatabaseException) {
            return request.error(500, "Database operation failed. Please try again later.");
        } else {
            return request.error(500, "An unexpected error occurred. Please contact support.");
        }
    }
}

/**
 * Validate input parameters
 * @param {Object} request - CAP request object
 * @returns {Object} Validation result
 */
async function validateInput(request) {
    const { claimType, ulu, fdlu, period, searchValue } = request.data;

    // Check required fields
    if (!claimType || !ulu || !fdlu) {
        return {
            isValid: false,
            errorMessage: "Missing required parameters: claimType, ulu, and fdlu are mandatory"
        };
    }

    // Validate claim type format
    if (typeof claimType !== 'string' || claimType.trim().length === 0) {
        return {
            isValid: false,
            errorMessage: "Invalid claim type: must be a non-empty string"
        };
    }

    // Validate ULU and FDLU format
    if (typeof ulu !== 'string' || ulu.trim().length === 0) {
        return {
            isValid: false,
            errorMessage: "Invalid ULU: must be a non-empty string"
        };
    }

    if (typeof fdlu !== 'string' || fdlu.trim().length === 0) {
        return {
            isValid: false,
            errorMessage: "Invalid FDLU: must be a non-empty string"
        };
    }

    // Validate period format if provided
    if (period && typeof period === 'string' && period.trim().length > 0) {
        const periodRegex = /^\d{2}-\d{4}$/;
        if (!periodRegex.test(period)) {
            return {
                isValid: false,
                errorMessage: "Invalid period format. Expected format: MM-YYYY (e.g., 12-2024)"
            };
        }
    }

    // Validate search value if provided
    if (searchValue && typeof searchValue !== 'string') {
        return {
            isValid: false,
            errorMessage: "Invalid search value: must be a string"
        };
    }

    return { isValid: true };
}

/**
 * Get user info with caching for performance optimization
 * @param {string} user - User identifier
 * @returns {Promise<Object>} User info details
 */
async function getUserInfoWithCache(user) {
    const cacheKey = `userInfo_${user}`;
    
    // Try to get from cache first
    let userInfoDetails = userInfoCache.get(cacheKey);
    
    if (!userInfoDetails) {
        // Fetch from database if not in cache
        userInfoDetails = await monitor.async("userInfoQuery", async () => {
            return await CommonRepo.fetchUserInfo(user.toUpperCase());
        });
        
        // Cache the result for 10 minutes
        if (userInfoDetails) {
            userInfoCache.set(cacheKey, userInfoDetails, 600000); // 10 minutes
        }
    }
    
    return userInfoDetails;
}

/**
 * Parse period and get date range
 * @param {string} period - Period string in MM-YYYY format
 * @returns {Object|null} Date range object or null if invalid
 */
async function parsePeriodAndGetDateRange(period) {
    if (!period || !period.includes(ApplicationConstants.HYPHEN)) {
        // Use current date if no period provided
        const currentDate = DateUtils.formatDateAsString(new Date(), "yyyy-MM-dd");
        return {
            startDate: currentDate,
            endDate: currentDate
        };
    }

    try {
        const [monthStr, yearStr] = period.split(ApplicationConstants.HYPHEN);
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);

        // Validate month and year
        if (month < 1 || month > 12 || year < 1900 || year > 2100) {
            return null;
        }

        const inputDates = DateUtils.fetchDatesFromMonthAndYear(month, year);
        return {
            startDate: inputDates[0],
            endDate: inputDates[1]
        };
    } catch (error) {
        console.error("Error parsing period:", error);
        return null;
    }
}

/**
 * Process and deduplicate staff lookup results
 * @param {Array} staffLookup - Raw staff lookup results
 * @returns {Array} Processed and deduplicated results
 */
async function processAndDeduplicateResults(staffLookup) {
    if (!staffLookup || staffLookup.length === 0) {
        return [];
    }

    // Deduplicate by STF_NUMBER using Map for better performance
    const uniqueStaffMap = new Map();
    
    for (const staff of staffLookup) {
        if (staff && staff.STF_NUMBER) {
            // Keep the latest occurrence (as per original logic)
            uniqueStaffMap.set(staff.STF_NUMBER, staff);
        }
    }

    // Convert to array and sort by STF_NUMBER
    const uniqueStaffArray = Array.from(uniqueStaffMap.values());
    
    uniqueStaffArray.sort((a, b) => {
        const aNumber = String(a.STF_NUMBER || '');
        const bNumber = String(b.STF_NUMBER || '');
        return aNumber.localeCompare(bNumber, undefined, { numeric: true });
    });

    return uniqueStaffArray;
}

module.exports = {
    fetchCaStaffLookup,
}; 