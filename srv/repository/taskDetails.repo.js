const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { ApplicationConstants } = require("../util/constant");
/**
 *
 * @param draftId
 * @param processCode
 */
async function fetchActiveTaskByDraftId(draftId, processCode) {
    const fetchActiveTaskByDraftId = await cds.run(
        SELECT.one
            .from("NUSEXT_UTILITY_TASK_DETAILS as task")
            .join("NUSEXT_UTILITY_PROCESS_DETAILS as process")
            .on("task.PROCESS_INST_ID = process.PROCESS_INST_ID")
            .where([
                { "process.REFERENCE_ID": draftId },
                { "process.PROCESS_CODE": processCode },
                { "task.TASK_STATUS": ApplicationConstants.STATUS_TASK_ACTIVE },
            ])
            .columns(["task.*"]) // or list specific fields you want
    );
    return fetchActiveTaskByDraftId;
}

module.exports = {
    fetchActiveTaskByDraftId,
};
