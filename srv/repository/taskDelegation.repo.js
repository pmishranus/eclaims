const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchProcessActiveDelegationDetails: async function (refKey, processCode, staffId) {
        let fetchDelegations = await cds.run(
            SELECT.from(" NUSEXT_UTILITY_TASK_DELEGATION_DETAILS ")
                .where({ DELEGATED_TO: staffId })
                .or({ DELEGATED_FOR: staffId })
                .where({ VALID_TO: { ">=": "CURRENT_DATE" } })
                .where({ IS_DELETE: null })
                .or({ IS_DELETE: "N" })
                .orderBy("ID desc")
        );
        return fetchDelegations;
    },
};
