const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetches CA to be request status data by requestor group, task sequences, and claim type
 * @param {string} requestorGrp - The requestor group
 * @param {number} fromTaskSequence - The from task sequence
 * @param {number} toTaskSequence - The to task sequence
 * @param {string} claimType - The claim type
 * @returns {Promise<object|null>} The task action configuration
 */
async function fetchCAToBeRequestStatusData(requestorGrp, fromTaskSequence, toTaskSequence, claimType) {
    const query = SELECT.one
        .from("NUSEXT_UTILITY_TASK_ACTION_CONFIG")
        .where({
            REQUESTOR_GRP: requestorGrp,
            CURRENT_TASK_SEQUENCE: fromTaskSequence,
            TO_BE_TASK_SEQUENCE: toTaskSequence,
            PROCESS_CODE: claimType
        });

    const result = await cds.run(query);
    return result || null;
}

module.exports = {
    fetchCAToBeRequestStatusData
};
