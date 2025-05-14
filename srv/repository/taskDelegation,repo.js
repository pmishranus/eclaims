const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
module.exports = {
    
    fetchProcessActiveDelegationDetails: async function (refKey, processCode, staffId) {
        const queryParameter = ` ( DELEGATED_TO = '${staffId}' OR DELEGATED_FOR = '${staffId}') AND VALID_TO >= CURRENT_DATE AND ( IS_DELETE is NULL OR IS_DELETE = 'N' )`
        let fetchDelegations = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_TASK_DELEGATION_DETAILS ')
                .where(queryParameter)
                .orderBy("ID desc")
        );
        return fetchDelegations;
    }
    
}