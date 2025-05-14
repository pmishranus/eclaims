const cds = require("@sap/cds");
const { SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");
module.exports = {
    fetchProcessConfigBasedOnProcessCode: function(processCode){
        const queryParameter = ` pc.PROCESS_CODE = '${processCode}'`;
        let fetchProcessConfigBasedOnProcessCode = cds.run(SELECT.one.from("NUSEXT_UTILITY_PROCESS_CONFIG AS pc")
            .where(queryParameter)
        );
        return fetchProcessConfigBasedOnProcessCode;
    },
}