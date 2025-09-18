const CommonUtils = require("./commonUtil");
const { ApplicationConstants } = require("./constant");

/**
 * Shared WBS Validation Service
 * - Provides a common function to validate WBS codes via CPI
 * - Keeps a stable contract for reuse across controllers/services
 * @param wbsList
 * @param additionalPayload
 */
async function validateWbsCodes(wbsList, additionalPayload = {}) {
    if (!Array.isArray(wbsList)) {
        throw new Error("wbsList must be an array");
    }
    if (wbsList.length === 0) {
        return { success: true, results: [] };
    }

    // Build CPI payload per existing endpoint contract
    const payload = {
        WBSRequest: {
            WBS: wbsList
        },
        ...additionalPayload
    };

    // Call CPI API (same path used in ecpWbsValidate)
    const apiUrl = '/ecpwbsvalidate_qa';
    const raw = await CommonUtils.callCpiApi(apiUrl, payload, 'POST');

    // Normalize response into a simple map for easy consumption
    // Expecting CPI to return an array of structures or an object with status per WBS
    const results = [];
    const wbsToResult = {};

    // Heuristic normalization: accept either array or object forms
    if (Array.isArray(raw)) {
        for (const entry of raw) {
            const code = entry?.WBS || entry?.wbs || entry?.code;
            if (!code) {
                continue;
            }
            const result = {
                WBS: code,
                isValid: entry?.isValid ?? entry?.VALID ?? entry?.STATUS === ApplicationConstants.STATUS_SUCCESS,
                message: entry?.message || entry?.MESSAGE || entry?.REASON || ''
            };
            results.push(result);
            wbsToResult[code] = result;
        }
    } else if (raw && typeof raw === 'object') {
        for (const code of wbsList) {
            const entry = raw[code] || raw[code?.toUpperCase?.()] || raw[code?.toLowerCase?.()];
            const result = {
                WBS: code,
                isValid: entry?.isValid ?? entry?.VALID ?? entry?.STATUS === ApplicationConstants.STATUS_SUCCESS ?? true,
                message: entry?.message || entry?.MESSAGE || ''
            };
            results.push(result);
            wbsToResult[code] = result;
        }
    }

    return { success: true, results, map: wbsToResult, raw };
}

module.exports = { validateWbsCodes };
