const cds = require("@sap/cds");
const { SELECT, UPSERT, DELETE, UPDATE, INSERT } = require("@sap/cds/lib/ql/cds-ql");
const ApplicationConstants = require("../util/constant");

/**
 * Checks if a request is locked for a given draftId.
 * @param {string} draftId - The draft ID.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Object|null>} The lock details or null.
 */
async function checkIsRequestLocked(draftId, tx = null) {
    const query = SELECT.one
        .from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({ REFERENCE_ID: draftId, IS_LOCKED: ApplicationConstants.X });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result || null;
}

/**
 * Upserts lock details for a draft request.
 * @param {Object} lockDetails - The lock details object.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Object>} The upsert result.
 */
async function upsertLockDetails(lockDetails, tx = null) {
    const query = UPSERT.into("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .entries(lockDetails);

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result;
}

/**
 * Deletes lock details by draft ID.
 * @param {string} draftId - The draft ID.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Object>} The delete result.
 */
async function deleteByDraftId(draftId, tx = null) {
    const query = DELETE.from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({ REFERENCE_ID: draftId });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result;
}

/**
 * Gets all lock details for a specific user.
 * @param {string} staffNusNetId - The staff NUSNET ID.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Array>} Array of lock details.
 */
async function getLocksByUser(staffNusNetId, tx = null) {
    const query = SELECT.from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({
            LOCKED_BY_USER_NID: staffNusNetId,
            IS_LOCKED: ApplicationConstants.X
        });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result || [];
}

/**
 * Gets all active locks in the system.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Array>} Array of all active lock details.
 */
async function getAllActiveLocks(tx = null) {
    const query = SELECT.from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({ IS_LOCKED: ApplicationConstants.X });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result || [];
}

/**
 * Releases all locks for a specific user.
 * @param {string} staffNusNetId - The staff NUSNET ID.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Object>} The delete result.
 */
async function releaseAllLocksForUser(staffNusNetId, tx = null) {
    const query = DELETE.from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({
            LOCKED_BY_USER_NID: staffNusNetId,
            IS_LOCKED: ApplicationConstants.X
        });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result;
}

/**
 * Fetches all lock details by draft ID.
 * @param {string} draftId - The draft ID.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Array>} Array of lock details.
 */
async function fetchByDraftId(draftId, tx = null) {
    const query = SELECT.from("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .where({ REFERENCE_ID: draftId });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result || [];
}

/**
 * Updates lock value for a specific draft ID and user.
 * @param {string} draftId - The draft ID.
 * @param {string} nusNetId - The NUSNET ID.
 * @param {string} lockValue - The lock value.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Object>} The update result.
 */
async function updateLockValue(draftId, nusNetId, lockValue, tx = null) {
    const query = UPDATE("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .set({ IS_LOCKED: lockValue })
        .where({
            REFERENCE_ID: draftId,
            LOCKED_BY_USER_NID: nusNetId
        });

    const result = tx ? await tx.run(query) : await cds.run(query);
    return result;
}

/**
 * Saves all lock details.
 * @param {Array} lockDetailsList - Array of lock details.
 * @param {Object} tx - Optional transaction object.
 * @returns {Promise<Object>} The save result.
 */
async function saveAll(lockDetailsList, tx = null) {
    console.log("RequestLockDetailsRepo.saveAll: Starting save operation with", lockDetailsList.length, "items");
    const query = INSERT.into("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .entries(lockDetailsList);

    const result = tx ? await tx.run(query) : await cds.run(query);
    console.log("RequestLockDetailsRepo.saveAll: Successfully saved lock details");
    return result;
}

module.exports = {
    checkIsRequestLocked,
    upsertLockDetails,
    deleteByDraftId,
    getLocksByUser,
    getAllActiveLocks,
    releaseAllLocksForUser,
    fetchByDraftId,
    updateLockValue,
    saveAll,
};
