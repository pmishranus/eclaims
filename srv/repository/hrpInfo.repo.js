const cds = require("@sap/cds");
const { SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");
module.exports = {
    fetchHrpStaffDetails: async function(STF_NUMBER){
        const queryParameter = ` ( HRP_STF_N = '${STF_NUMBER}') AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE`
        let fetchHrpStaffDetails = await cds.run(SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
            .where(queryParameter));
        return fetchHrpStaffDetails;
    }
}