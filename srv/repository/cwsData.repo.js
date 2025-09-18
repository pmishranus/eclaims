const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * CwsDataRepo - Repository for CWS (Contract Work System) data operations
 * This repository handles operations on the CWS data table
 */

/**
 * Fetches CWS data by unique ID (matches Java CwsDataRepository.fetchByUNIQUE_ID)
 * @param {string} uniqueId - The unique ID
 * @param {object} tx - Optional transaction object
 * @returns {Promise<object | null>} The CWS data or null if not found
 */
async function fetchByUNIQUE_ID(uniqueId, tx = null) {
    try {
        const query = `
            SELECT * FROM NUSEXT_CWS_DATA 
            WHERE UNIQUE_ID = ?
        `;
        const values = [uniqueId];
        const result = tx ? await tx.run(query, values) : await cds.run(query, values);
        return result && result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("Error in fetchByUNIQUE_ID:", error);
        throw error;
    }
}

/**
 * Fetches all CWS data by unique ID (returns array)
 * @param {string} uniqueId - The unique ID
 * @param {object} tx - Optional transaction object
 * @returns {Promise<Array>} Array of CWS data
 */
async function fetchAllByUNIQUE_ID(uniqueId, tx = null) {
    try {
        const query = `
            SELECT * FROM NUSEXT_CWS_DATA 
            WHERE UNIQUE_ID = ?
        `;
        const values = [uniqueId];
        const result = tx ? await tx.run(query, values) : await cds.run(query, values);
        return result || [];
    } catch (error) {
        console.error("Error in fetchAllByUNIQUE_ID:", error);
        throw error;
    }
}

/**
 * Upserts CWS data
 * @param {object} cwsData - The CWS data object
 * @param {object} tx - Optional transaction object
 * @returns {Promise<object>} The upsert result
 */
async function upsertCwsData(cwsData, tx = null) {
    try {
        const query = `
            UPSERT INTO NUSEXT_CWS_DATA 
            SET ${Object.keys(cwsData).map(key => `${key} = ?`).join(', ')}
            WHERE UNIQUE_ID = ?
        `;
        const values = [...Object.values(cwsData), cwsData.UNIQUE_ID];
        const result = tx ? await tx.run(query, values) : await cds.run(query, values);
        return result;
    } catch (error) {
        console.error("Error in upsertCwsData:", error);
        throw error;
    }
}

/**
 * Deletes CWS data by unique ID
 * @param {string} uniqueId - The unique ID
 * @param {object} tx - Optional transaction object
 * @returns {Promise<object>} The delete result
 */
async function deleteByUNIQUE_ID(uniqueId, tx = null) {
    try {
        const query = `
            DELETE FROM NUSEXT_CWS_DATA 
            WHERE UNIQUE_ID = ?
        `;
        const values = [uniqueId];
        const result = tx ? await tx.run(query, values) : await cds.run(query, values);
        return result;
    } catch (error) {
        console.error("Error in deleteByUNIQUE_ID:", error);
        throw error;
    }
}

module.exports = {
    fetchByUNIQUE_ID,
    fetchAllByUNIQUE_ID,
    upsertCwsData,
    deleteByUNIQUE_ID,
}; 