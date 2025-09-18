const cds = require("@sap/cds");
const { SELECT, UPDATE } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetches process details by reference ID and process code
 * @param {string} referenceId - The reference ID
 * @param {string} processCode - The process code
 * @returns {Promise<Array>} Process details
 */
async function fetchByReferenceId(referenceId, processCode) {
    let query = ` SELECT * FROM NUSEXT_UTILITY_PROCESS_DETAILS WHERE REFERENCE_ID = ? AND PROCESS_CODE = ? `;
    let fetchByReferenceId = await cds.run(query, [referenceId, processCode]);
    return fetchByReferenceId;
}

/**
 * Fetches all process instances by process code
 * @param {string} processCode - The process code
 * @returns {Promise<Array>} Process instances
 */
async function fetchProcessInstancesByProcessCode(processCode) {
    let query = SELECT.from("NUSEXT_UTILITY_PROCESS_DETAILS").where({
        PROCESS_CODE: processCode,
        IS_DELETED: "N"
    });
    let fetchProcessInstancesByProcessCode = await cds.run(query);
    return fetchProcessInstancesByProcessCode || [];
}

/**
 * Soft deletes process details by process instance ID
 * @param {object} tx - The transaction object
 * @param {string} processInstId - The process instance ID
 * @param {string} modifiedBy - The user who modified the record
 * @param {string} modifiedOn - The modification date
 * @returns {Promise<object>} Delete result
 */
async function softDeleteByProcessInstId(tx, processInstId, modifiedBy, modifiedOn) {
    const query = UPDATE("NUSEXT_UTILITY_PROCESS_DETAILS")
        .set({
            IS_DELETED: "Y",
            MODIFIED_BY: modifiedBy,
            MODIFIED_ON: modifiedOn
        })
        .where({ PROCESS_INST_ID: processInstId });

    const result = await tx.run(query);
    return result;
}

/**
 * Soft deletes process details by reference ID
 * @param {object} tx - The transaction object
 * @param {string} referenceId - The reference ID
 * @param {string} modifiedBy - The user who modified the record
 * @param {string} modifiedOn - The modification date
 * @returns {Promise<object>} Delete result
 */
async function softDeleteByReferenceId(tx, referenceId, modifiedBy, modifiedOn) {
    const query = UPDATE("NUSEXT_UTILITY_PROCESS_DETAILS")
        .set({
            IS_DELETED: "Y",
            MODIFIED_BY: modifiedBy,
            MODIFIED_ON: modifiedOn
        })
        .where({ REFERENCE_ID: referenceId });

    const result = await tx.run(query);
    return result;
}

module.exports = {
    fetchByReferenceId,
    fetchProcessInstancesByProcessCode,
    softDeleteByProcessInstId,
    softDeleteByReferenceId,
};
