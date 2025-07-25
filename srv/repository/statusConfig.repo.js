const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetches eclaim status alias by draft ID
 * @param {string} draftId - The draft ID
 * @returns {Promise<string|null>} The status alias or null if not found
 */
async function fetchEclaimStatus(draftId) {
    try {
        const query = `
            SELECT sc.STATUS_ALIAS 
            FROM NUSEXT_ECLAIMS_HEADER_DATA ehd
            INNER JOIN NUSEXT_UTILITY_STATUS_CONFIG sc 
                ON ehd.REQUEST_STATUS = sc.STATUS_CODE
            WHERE ehd.DRAFT_ID = ?
                AND sc.STATUS_TYPE = 'ECLAIMS'
        `;

        const result = await cds.run(query, [draftId]);

        if (result && result.length > 0) {
            return result[0].STATUS_ALIAS;
        }

        return null;
    } catch (error) {
        console.error("Error in fetchEclaimStatus:", error);
        throw error;
    }
}

/**
 * Fetches eclaim status configuration by draft ID
 * @param {string} draftId - The draft ID
 * @returns {Promise<Object|null>} The status config object or null if not found
 */
async function fetchEclaimStatusByDraftId(draftId) {
    try {
        const query = `
            SELECT sc.STATUS_CODE,
                   sc.STATUS_TYPE,
                   sc.STATUS_ALIAS,
                   sc.STATUS_COLOR_CODE,
                   sc.STATUS_DESC,
                   sc.STATUS_STATE,
                   sc.SHOW_INBOX
            FROM NUSEXT_ECLAIMS_HEADER_DATA ehd
            INNER JOIN NUSEXT_UTILITY_STATUS_CONFIG sc 
                ON ehd.REQUEST_STATUS = sc.STATUS_CODE
            WHERE ehd.DRAFT_ID = ?
                AND sc.STATUS_TYPE = 'ECLAIMS'
        `;

        const result = await cds.run(query, [draftId]);

        if (result && result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error("Error in fetchEclaimStatusByDraftId:", error);
        throw error;
    }
}

/**
 * Fetches all status configurations for ECLAIMS type
 * @returns {Promise<Array>} Array of status config objects
 */
async function fetchAllEclaimStatusConfigs() {
    try {
        const query = `
            SELECT STATUS_CODE,
                   STATUS_TYPE,
                   STATUS_ALIAS,
                   STATUS_COLOR_CODE,
                   STATUS_DESC,
                   STATUS_STATE,
                   SHOW_INBOX
            FROM NUSEXT_UTILITY_STATUS_CONFIG
            WHERE STATUS_TYPE = 'ECLAIMS'
            ORDER BY STATUS_CODE
        `;

        const result = await cds.run(query);
        return result || [];
    } catch (error) {
        console.error("Error in fetchAllEclaimStatusConfigs:", error);
        throw error;
    }
}

/**
 * Fetches status configuration by status code
 * @param {string} statusCode - The status code
 * @returns {Promise<Object|null>} The status config object or null if not found
 */
async function fetchStatusConfigByCode(statusCode) {
    try {
        const result = await cds.run(
            SELECT.from("NUSEXT_UTILITY_STATUS_CONFIG").where({
                STATUS_CODE: statusCode,
                STATUS_TYPE: "ECLAIMS"
            })
        );

        if (result && result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error("Error in fetchStatusConfigByCode:", error);
        throw error;
    }
}

/**
 * Fetches status configurations by status codes array
 * @param {Array<string>} statusCodes - Array of status codes
 * @returns {Promise<Array>} Array of status config objects
 */
async function fetchStatusConfigsByCodes(statusCodes) {
    try {
        if (!statusCodes || statusCodes.length === 0) {
            return [];
        }

        const result = await cds.run(
            SELECT.from("NUSEXT_UTILITY_STATUS_CONFIG").where({
                STATUS_CODE: { in: statusCodes },
                STATUS_TYPE: "ECLAIMS"
            })
        );

        return result || [];
    } catch (error) {
        console.error("Error in fetchStatusConfigsByCodes:", error);
        throw error;
    }
}

/**
 * Fetches status configurations that should be shown in inbox
 * @returns {Promise<Array>} Array of status config objects that should be shown in inbox
 */
async function fetchInboxStatusConfigs() {
    try {
        const result = await cds.run(
            SELECT.from("NUSEXT_UTILITY_STATUS_CONFIG").where({
                STATUS_TYPE: "ECLAIMS",
                SHOW_INBOX: "X"
            })
        );

        return result || [];
    } catch (error) {
        console.error("Error in fetchInboxStatusConfigs:", error);
        throw error;
    }
}

module.exports = {
    fetchEclaimStatus,
    fetchEclaimStatusByDraftId,
    fetchAllEclaimStatusConfigs,
    fetchStatusConfigByCode,
    fetchStatusConfigsByCodes,
    fetchInboxStatusConfigs
}; 