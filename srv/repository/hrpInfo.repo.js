const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchHrpStaffDetails: async function (STF_NUMBER) {
        let fetchHrpInfo = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_HRP_INFO").where({
                HRP_STF_N: STF_NUMBER,
                START_DATE: { "<=": "CURRENT_DATE" },
                END_DATE: { ">=": "CURRENT_DATE" }
            })
        );
        return fetchHrpInfo;
    },
};
