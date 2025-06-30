const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchProcessActiveDelegationDetails: async function (refKey, processCode, staffId) {
        let fetchDelegations = await cds.run(
            SELECT.from(" NUSEXT_UTILITY_TASK_DELEGATION_DETAILS ")
                .where({
                    or: [
                        { DELEGATED_TO: staffId },
                        { DELEGATED_FOR: staffId }
                    ],
                    VALID_TO: { ">=": "CURRENT_DATE" },
                    or: [
                        { IS_DELETE: null },
                        { IS_DELETE: "N" }
                    ]
                })
                .orderBy("ID desc")
        );
        return fetchDelegations;
    },
};
