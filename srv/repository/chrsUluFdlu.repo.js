const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
module.exports = {
    // fetchUluFdluDetails: async function (staffId, userGroup) {
    //     const query = `SELECT DISTINCT ULU_T || '(' || ULU_C || ')' || ' / ' || FDLU_T || '(' || FDLU_C || ')' as UluFdlu 
    //     FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u 
    //     WHERE am.STAFF_ID = ? AND am.ULU = u.ULU_C AND 
    //     u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END 
    //     AND am.STAFF_USER_GRP = ? AND am.IS_DELETED = 'N' AND am.VALID_FROM <= CURRENT_DATE AND am.VALID_TO >= CURRENT_DATE`;
    //     let fetchUluFdluDetails = await cds.run(query,[staffId, userGroup]);
    //     return fetchUluFdluDetails;
    // },

    
//This is a capm based converted query
    fetchUluFdluDetails: async function (staffId, userGroup) {
            const query = ` SELECT DISTINCT * from APPROVERMATRIX_STAFF_BASED_USERGROUP_ULU_FDLU(?,?)`;
            let fetchUluFdluDetails = await cds.run(query,[staffId,userGroup]);
            return fetchUluFdluDetails;
        },
}