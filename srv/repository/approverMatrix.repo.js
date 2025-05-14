const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { UTC } = require("../util/constant");
module.exports = {

    checkForDuplicateWithValidity: async function (STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP, VALID_FROM, VALID_TO) {
        const queryParameter = ` eam.STAFF_ID = '${STF_NUMBER}' and eam.ULU = '${ULU}' and eam.FDLU = '${FDLU}' and eam.PROCESS_CODE = '${PROCESS_CODE}' and eam.STAFF_USER_GRP = '${STAFF_USER_GRP}' and (('${VALID_FROM}' BETWEEN eam.VALID_FROM AND eam.VALID_TO) OR ('${VALID_TO}' BETWEEN eam.VALID_FROM AND eam.VALID_TO) OR ('${VALID_FROM}' < eam.VALID_FROM AND '${VALID_TO}' > eam.VALID_TO ) OR ('${VALID_FROM}' > eam.VALID_FROM AND '${VALID_TO}' < eam.VALID_TO)) and eam.IS_DELETED='N' `;
        let checkForDuplicateWithValidity = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .where(queryParameter));
        return checkForDuplicateWithValidity;
    },
    checkForUserGrpNProcess: async function (PROCESS_CODE,STF_NUMBER, STAFF_USER_GRP) {
        const queryParameter = ` eam.STAFF_ID = '${STF_NUMBER}' and eam.PROCESS_CODE = '${PROCESS_CODE}' and eam.STAFF_USER_GRP = '${STAFF_USER_GRP}' and eam.VALID_FROM <= CURRENT_DATE and eam.VALID_TO >= CURRENT_DATE  and eam.IS_DELETED='N' `;
        let checkForUserGrpNProcess = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .columns('eam.STAFF_ID')
                .where(queryParameter));
        return checkForUserGrpNProcess;
    },
    validateAgainstStaffUserGrpNValidity: async function (STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP1, STAFF_USER_GRP2, STAFF_USER_GRP3, VALID_FROM, VALID_TO) {
        const queryParameter = `  eam.STAFF_ID = '${STF_NUMBER}' and eam.ULU = '${ULU}' and eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE '${FDLU}' END and eam.PROCESS_CODE = '${PROCESS_CODE}'
          and (eam.STAFF_USER_GRP = '${STAFF_USER_GRP1}' or eam.STAFF_USER_GRP = '${STAFF_USER_GRP2}' or eam.STAFF_USER_GRP = '${STAFF_USER_GRP3}')
          and (('${VALID_FROM}' BETWEEN eam.VALID_FROM AND eam.VALID_TO) OR ('${VALID_TO}' BETWEEN eam.VALID_FROM AND eam.VALID_TO)
          OR ('${VALID_FROM}' < eam.VALID_FROM AND '${VALID_TO}' > eam.VALID_TO ) OR ('${VALID_FROM}' > eam.VALID_FROM AND '${VALID_TO}' < eam.VALID_TO))
           and eam.IS_DELETED='N' `;


        let validateAgainstStaffUserGrpNValidity = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .where(queryParameter));
        return validateAgainstStaffUserGrpNValidity;
    },

    checkIfApproverMatrixEntryExists: async function (STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP, VALID_FROM, VALID_TO) {
        const queryParameter = `  eam.STAFF_ID = '${STF_NUMBER}' and eam.ULU = '${ULU}' and eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE '${FDLU}' END and eam.PROCESS_CODE = '${PROCESS_CODE}' and eam.STAFF_USER_GRP = '${STAFF_USER_GRP}' and (('${VALID_FROM}' BETWEEN eam.VALID_FROM AND eam.VALID_TO) OR ('${VALID_TO}' BETWEEN eam.VALID_FROM AND eam.VALID_TO) OR ('${VALID_FROM}' < eam.VALID_FROM AND '${VALID_TO}' > eam.VALID_TO ) OR ('${VALID_FROM}' > eam.VALID_FROM AND '${VALID_TO}' < eam.VALID_TO)) and eam.IS_DELETED='N' `;

        let validateAgainstStaffUserGrpNValidity = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .where(queryParameter));
        return validateAgainstStaffUserGrpNValidity;
    },

    validateAgainstStaffUserGrp: async function (STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP1, STAFF_USER_GRP2, STAFF_USER_GRP3) {
        const queryParameter = `  eam.STAFF_ID = '${STF_NUMBER}' and eam.ULU = '${ULU}' and eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE '${FDLU}' END and eam.PROCESS_CODE = '${PROCESS_CODE}'
          and (eam.STAFF_USER_GRP = '${STAFF_USER_GRP1}' or eam.STAFF_USER_GRP = '${STAFF_USER_GRP2}' or eam.STAFF_USER_GRP = '${STAFF_USER_GRP3}') and eam.VALID_FROM <= CURRENT_DATE and eam.VALID_TO >= CURRENT_DATE  and eam.IS_DELETED='N' `;


        let validateAgainstStaffUserGrp = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .where(queryParameter));
        return validateAgainstStaffUserGrp;

    },
    fetchEclaimsRole : async function(STF_NUMBER){
        const queryParameter = ` eam.STAFF_ID = '${STF_NUMBER}' AND eam.VALID_FROM <= CURRENT_DATE AND eam.VALID_TO >= CURRENT_DATE AND eam.PROCESS_CODE LIKE '10%' AND eam.IS_DELETED='N' `;
        let fetchEclaimsRole = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .columns("eam.STAFF_USER_GRP")
                .where(queryParameter));
        return fetchEclaimsRole;
    },
    fetchCWRoleForDashboard :async function(STF_NUMBER){
        const queryParameter = ` eam.STAFF_ID = '${STF_NUMBER}' AND eam.VALID_FROM <= CURRENT_DATE AND eam.VALID_TO >= CURRENT_DATE AND eam.PROCESS_CODE LIKE '20%' AND eam.IS_DELETED='N' `;
        let fetchCWRoleForDashboard = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .columns("eam.STAFF_USER_GRP")
                .where(queryParameter));
        return fetchCWRoleForDashboard;
    },
    fetchCAAndDADetails:async function (ULU, FDLU, PROCESS_CODE) {
        // const queryParameter = ` eam.STAFF_USER_GRP in ('DEPARTMENT_ADMIN','CLAIM_ASSISTANT') and eam.ULU = '${ULU}' and eam.FDLU = '${FDLU}' and eam.PROCESS_CODE in ('${PROCESS_CODE}') and eam.VALID_FROM <= CURRENT_DATE and eam.VALID_TO >= CURRENT_DATE and eam.IS_DELETED='N' `;
        // let fetchCAAndDADetails = await cds.run(
        //     SELECT
        //         .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
        //         .where(queryParameter));

         let fetchCAAndDADetails = await cds.run(
                    SELECT
                        .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX')
                        .where({
                            ULU : ULU,
                            FDLU : FDLU,
                            STAFF_USER_GRP : {
                                in : ['DEPARTMENT_ADMIN','CLAIM_ASSISTANT']
                            },
                            PROCESS_CODE : {
                                in : PROCESS_CODE
                            },
                            VALID_FROM : {
                                '<=' : 'CURRENT_DATE'
                            },
                            VALID_TO : {
                                '<=' : 'CURRENT_DATE'
                            },
                            IS_DELETED : 'N'
                        }));
        return fetchCAAndDADetails;
    },
}