const cds = require("@sap/cds");
const { INSERT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Deletes all remarks for a given draftId.
 * @param {string} draftId - The draft ID.
 * @returns {Promise<object>} The result of the delete operation.
 */
async function deleteRemarksByDraftId(draftId) {
    const query = `DELETE FROM NUSEXT_UTILITY_REMARKS_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    return await cds.run(query, values);
}

/**
 * Upserts (inserts or updates) a remark using a transaction.
 * @param {object} tx - The transaction object.
 * @param {object} remarkData - The remark data.
 * @returns {Promise<object>} The result of the upsert operation.
 */
async function upsertRemark(tx, remarkData) {
    // remarkData should be an object with the correct fields
    return await tx.run(UPSERT.into("NUSEXT_UTILITY_REMARKS_DATA").entries(remarkData));
}

/**
 * Fetches all remarks for a given draftId.
 * @param {string} draftId - The draft ID.
 * @returns {Promise<Array>} The remarks array.
 */
async function fetchByDraftId(draftId) {
    const query = `SELECT * FROM NUSEXT_UTILITY_REMARKS_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    return await cds.run(query, values);
}

module.exports = {
    deleteRemarksByDraftId,
    upsertRemark,
    fetchByDraftId,
}; 