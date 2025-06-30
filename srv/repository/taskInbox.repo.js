const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    getActiveTaskCountByStaff: async function (STF_NUMBER, STATUS_CODE) {
        let getActiveTaskCountByStaff = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
                .columns("COUNT(*) as COUNT")
                .where({
                    TASK_ASSGN_TO_STF_NUMBER: STF_NUMBER,
                    START_DATE: { "<=": "CURRENT_DATE" },
                    END_DATE: { ">=": "CURRENT_DATE" }
                })
        );
        return getActiveTaskCountByStaff;
    },
    fetchTaskInbox: async function (STF_NUMBER) {
        let fetchTaskInbox = await cds.run(
            SELECT.from("NUSEXT_UTILITY_TASK_INBOX").where({
                TASK_ASSGN_TO_STF_NUMBER: STF_NUMBER,
                START_DATE: { "<=": "CURRENT_DATE" },
                END_DATE: { ">=": "CURRENT_DATE" }
            })
        );
        return fetchTaskInbox;
    },
};
