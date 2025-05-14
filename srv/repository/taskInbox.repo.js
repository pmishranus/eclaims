const cds = require("@sap/cds");
const { SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");
module.exports = {
    getActiveTaskCountByStaff: async function(STF_NUMBER,STATUS_CODE){
        const queryParameter = ` ( TASK_ASSGN_TO_STF_NUMBER = '${STF_NUMBER}') AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE`
        let getActiveTaskCountByStaff = await cds.run(
                SELECT
                    .from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
                    .columns("COUNT(*) as COUNT")
            .where(queryParameter));
        return getActiveTaskCountByStaff;
    }
}