const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchProcessConfigBasedOnProcessCode: async function (processCode) {
        let fetchProcessConfig = await cds.run(
            SELECT.from("NUSEXT_UTILITY_PROCESS_CONFIG as pc").where({
                "pc.PROCESS_CODE": processCode
            })
        );
        return fetchProcessConfig;
    },
};
