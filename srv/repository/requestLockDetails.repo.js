const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
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

module.exports = {
    checkIsRequestLocked,
};
