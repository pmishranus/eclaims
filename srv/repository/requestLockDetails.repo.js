const cds = require("@sap/cds");
const { SELECT, UPSERT, DELETE } = require("@sap/cds/lib/ql/cds-ql");
const ApplicationConstants = require("../util/constant");

/**
 * Checks if a request is locked for a given draftId.
 * @param {string} draftId - The draft ID.
 * @returns {Promise<Object|null>} The lock details or null.
 */
async function checkIsRequestLocked(draftId) {
    const result = await cds.run(
        SELECT.one
            .from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
            .where({ REFERENCE_ID: draftId, IS_LOCKED: ApplicationConstants.X })
    );
    return result || null;
}

/**
 * Upserts lock details for a draft request.
 * @param {Object} lockDetails - The lock details object.
 * @returns {Promise<Object>} The upsert result.
 */
async function upsertLockDetails(lockDetails) {
    const result = await cds.run(
        UPSERT.into("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .entries(lockDetails)
    );
    return result;
}

/**
 * Deletes lock details by draft ID.
 * @param {string} draftId - The draft ID.
 * @returns {Promise<Object>} The delete result.
 */
async function deleteByDraftId(draftId) {
    const result = await cds.run(
        DELETE.from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({ REFERENCE_ID: draftId })
    );
    return result;
}

module.exports = {
    checkIsRequestLocked,
    upsertLockDetails,
    deleteByDraftId,
};
