const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
module.exports = {
    fetchRole: async function (STF_NUMBER) {
        const queryParameter = ` STAFF_ID = '${STF_NUMBER}' AND USER_DESIGNATION <> 'VERIFIER' `
        let fetchRole = await cds.run(SELECT.distinct.from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS")
        .columns("USER_DESIGNATION")
            .where(queryParameter));
        return fetchRole;
    }
}