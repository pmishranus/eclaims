const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetches tasks configuration by process code, requestor group, and task sequence
 * @param {string} processCode - The process code
 * @param {string} requestorGrp - The requestor group
 * @param {number} taskSequence - The task sequence
 * @returns {Promise<object|null>} The tasks configuration
 */
async function fetchTasksConfig(processCode, requestorGrp, taskSequence) {
    const query = SELECT.one
        .from("NUSEXT_UTILITY_TASKS_CONFIG")
        .where({
            PROCESS_CODE: processCode,
            REQUESTOR_GRP: requestorGrp,
            TASK_SEQUENCE: taskSequence
        });

    const result = await cds.run(query);
    return result || null;
}

/**
 * Fetches claim assistant initial submit configuration by process code, requestor group, and task name
 * @param {string} processCode - The process code
 * @param {string} requestorGrp - The requestor group
 * @param {string} taskName - The task name
 * @returns {Promise<object|null>} The tasks configuration
 */
async function fetchClaimAssistantInitialSubmit(processCode, requestorGrp, taskName) {
    const query = SELECT.one
        .from("NUSEXT_UTILITY_TASKS_CONFIG")
        .where({
            PROCESS_CODE: processCode,
            REQUESTOR_GRP: requestorGrp,
            TASK_NAME: taskName
        });

    const result = await cds.run(query);
    return result || null;
}

module.exports = {
    fetchTasksConfig,
    fetchClaimAssistantInitialSubmit
};
