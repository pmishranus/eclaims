const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    checkForDuplicateWithValidity: async function (
        STF_NUMBER,
        ULU,
        FDLU,
        PROCESS_CODE,
        STAFF_USER_GRP,
        VALID_FROM,
        VALID_TO
    ) {
        const query = `
            SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
            WHERE eam.STAFF_ID = ? 
            AND eam.ULU = ? 
            AND eam.FDLU = ? 
            AND eam.PROCESS_CODE = ? 
            AND eam.STAFF_USER_GRP = ? 
            AND ((? BETWEEN eam.VALID_FROM AND eam.VALID_TO) 
                OR (? BETWEEN eam.VALID_FROM AND eam.VALID_TO) 
                OR (? < eam.VALID_FROM AND ? > eam.VALID_TO) 
                OR (? > eam.VALID_FROM AND ? < eam.VALID_TO)) 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP, VALID_FROM, VALID_TO, VALID_FROM, VALID_TO, VALID_FROM, VALID_TO];
        let checkForDuplicateWithValidity = await cds.run(query, values);
        return checkForDuplicateWithValidity;
    },

    checkForUserGrpNProcess: async function (PROCESS_CODE, STF_NUMBER, STAFF_USER_GRP) {
        let checkForUserGrpNProcess = await cds.run(
            SELECT.from(" NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ")
                .columns("eam.STAFF_ID")
                .where({
                    "eam.STAFF_ID": STF_NUMBER,
                    "eam.PROCESS_CODE": PROCESS_CODE,
                    "eam.STAFF_USER_GRP": STAFF_USER_GRP,
                    "eam.VALID_FROM": { "<=": "CURRENT_DATE" },
                    "eam.VALID_TO": { ">=": "CURRENT_DATE" },
                    "eam.IS_DELETED": "N"
                })
        );
        return checkForUserGrpNProcess;
    },

    validateAgainstStaffUserGrpNValidity: async function (
        STF_NUMBER,
        ULU,
        FDLU,
        PROCESS_CODE,
        STAFF_USER_GRP1,
        STAFF_USER_GRP2,
        STAFF_USER_GRP3,
        VALID_FROM,
        VALID_TO
    ) {
        const query = `
            SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
            WHERE eam.STAFF_ID = ? 
            AND eam.ULU = ? 
            AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
            AND eam.PROCESS_CODE = ?
            AND (eam.STAFF_USER_GRP = ? OR eam.STAFF_USER_GRP = ? OR eam.STAFF_USER_GRP = ?)
            AND ((? BETWEEN eam.VALID_FROM AND eam.VALID_TO) 
                OR (? BETWEEN eam.VALID_FROM AND eam.VALID_TO)
                OR (? < eam.VALID_FROM AND ? > eam.VALID_TO) 
                OR (? > eam.VALID_FROM AND ? < eam.VALID_TO))
            AND eam.IS_DELETED = 'N'
        `;
        const values = [STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP1, STAFF_USER_GRP2, STAFF_USER_GRP3, VALID_FROM, VALID_TO, VALID_FROM, VALID_TO, VALID_FROM, VALID_TO];
        let validateAgainstStaffUserGrpNValidity = await cds.run(query, values);
        return validateAgainstStaffUserGrpNValidity;
    },

    checkIfApproverMatrixEntryExists: async function (
        STF_NUMBER,
        ULU,
        FDLU,
        PROCESS_CODE,
        STAFF_USER_GRP,
        VALID_FROM,
        VALID_TO
    ) {
        const query = `
            SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
            WHERE eam.STAFF_ID = ? 
            AND eam.ULU = ? 
            AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
            AND eam.PROCESS_CODE = ? 
            AND eam.STAFF_USER_GRP = ? 
            AND ((? BETWEEN eam.VALID_FROM AND eam.VALID_TO) 
                OR (? BETWEEN eam.VALID_FROM AND eam.VALID_TO) 
                OR (? < eam.VALID_FROM AND ? > eam.VALID_TO) 
                OR (? > eam.VALID_FROM AND ? < eam.VALID_TO)) 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP, VALID_FROM, VALID_TO, VALID_FROM, VALID_TO, VALID_FROM, VALID_TO];
        let validateAgainstStaffUserGrpNValidity = await cds.run(query, values);
        return validateAgainstStaffUserGrpNValidity;
    },

    validateAgainstStaffUserGrp: async function (
        STF_NUMBER,
        ULU,
        FDLU,
        PROCESS_CODE,
        STAFF_USER_GRP1,
        STAFF_USER_GRP2,
        STAFF_USER_GRP3
    ) {
        const query = `
            SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
            WHERE eam.STAFF_ID = ? 
            AND eam.ULU = ? 
            AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
            AND eam.PROCESS_CODE = ?
            AND (eam.STAFF_USER_GRP = ? OR eam.STAFF_USER_GRP = ? OR eam.STAFF_USER_GRP = ?) 
            AND eam.VALID_FROM <= CURRENT_DATE 
            AND eam.VALID_TO >= CURRENT_DATE  
            AND eam.IS_DELETED = 'N'
        `;
        const values = [STF_NUMBER, ULU, FDLU, PROCESS_CODE, STAFF_USER_GRP1, STAFF_USER_GRP2, STAFF_USER_GRP3];
        let validateAgainstStaffUserGrp = await cds.run(query, values);
        return validateAgainstStaffUserGrp;
    },

    fetchEclaimsRole: async function (STF_NUMBER) {
        let fetchEclaimsRole = await cds.run(
            SELECT.from(" NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ")
                .columns("eam.STAFF_USER_GRP")
                .where({
                    "eam.STAFF_ID": STF_NUMBER,
                    "eam.VALID_FROM": { "<=": "CURRENT_DATE" },
                    "eam.VALID_TO": { ">=": "CURRENT_DATE" },
                    "eam.PROCESS_CODE": { "like": "10%" },
                    "eam.IS_DELETED": "N"
                })
        );
        return fetchEclaimsRole;
    },

    fetchCWRoleForDashboard: async function (STF_NUMBER) {
        let fetchCWRoleForDashboard = await cds.run(
            SELECT.from(" NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ")
                .columns("eam.STAFF_USER_GRP")
                .where({
                    "eam.STAFF_ID": STF_NUMBER,
                    "eam.VALID_FROM": { "<=": "CURRENT_DATE" },
                    "eam.VALID_TO": { ">=": "CURRENT_DATE" },
                    "eam.PROCESS_CODE": { "like": "20%" },
                    "eam.IS_DELETED": "N"
                })
        );
        return fetchCWRoleForDashboard;
    },

    fetchCAAndDADetails: async function (ULU, FDLU, PROCESS_CODE) {
        let fetchCAAndDADetails = await cds.run(
            SELECT.from(" NUSEXT_UTILITY_CHRS_APPROVER_MATRIX").where({
                ULU: ULU,
                FDLU: FDLU,
                STAFF_USER_GRP: {
                    in: ["DEPARTMENT_ADMIN", "CLAIM_ASSISTANT"],
                },
                PROCESS_CODE: {
                    in: PROCESS_CODE,
                },
                VALID_FROM: {
                    "<=": "CURRENT_DATE",
                },
                VALID_TO: {
                    ">=": "CURRENT_DATE",
                },
                IS_DELETED: "N",
            })
        );
        return fetchCAAndDADetails;
    },

    fetchCAClaimTypes: async function (staffNusNetId) {
        const query = `
            SELECT eam.PROCESS_CODE as CLAIM_TYPE_C,
                   mc.CLAIM_TYPE_T,
                   eam.STAFF_ID,
                   cj.SF_STF_NUMBER,
                   eam.VALID_FROM,
                   eam.VALID_TO,
                   cj.JOIN_DATE
            FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam
            JOIN NUSEXT_MASTER_DATA_MASTER_CLAIM_TYPE as mc ON eam.PROCESS_CODE = mc.CLAIM_TYPE_C
            JOIN NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj ON eam.STAFF_ID = cj.STF_NUMBER
            WHERE (UPPER(eam.STAFF_NUSNET_ID) = ? OR eam.STAFF_ID = ?)
            AND eam.VALID_FROM <= CURRENT_DATE 
            AND eam.VALID_TO >= CURRENT_DATE 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [staffNusNetId, staffNusNetId];
        let fetchCAClaimTypes = await cds.run(query, values);
        return fetchCAClaimTypes;
    },

    fetchAuthDetails: async function (staffId) {
        const query = `
            SELECT eam.PROCESS_CODE, eam.STAFF_ID, u.ULU_C, u.ULU_T, u.FDLU_C, u.FDLU_T, eam.VALID_FROM, eam.VALID_TO, eam.STAFF_USER_GRP
            FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam
            JOIN NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u ON eam.ULU = u.ULU_C
            WHERE (UPPER(eam.STAFF_NUSNET_ID) = ? OR eam.STAFF_ID = ?)
            AND u.FDLU_C = CASE WHEN eam.FDLU = 'ALL' THEN u.FDLU_C ELSE eam.FDLU END 
            AND eam.VALID_FROM <= CURRENT_DATE 
            AND eam.VALID_TO >= CURRENT_DATE 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [staffId, staffId];
        let fetchAuthDetails = await cds.run(query, values);
        return fetchAuthDetails;
    },

    fetchInboxApproverMatrix: async function (staffId) {
        const query = `
            SELECT eam.STAFF_USER_GRP, eam.PROCESS_CODE, eam.STAFF_ID, eam.ULU, eam.FDLU, eam.VALID_FROM, eam.VALID_TO
            FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam
            WHERE (UPPER(eam.STAFF_NUSNET_ID) = ? OR eam.STAFF_ID = ?)
            AND eam.VALID_FROM <= CURRENT_DATE 
            AND eam.VALID_TO >= CURRENT_DATE 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [staffId, staffId];
        let fetchInboxApproverMatrix = await cds.run(query, values);
        return fetchInboxApproverMatrix;
    },

    /**
     * fetchApprovalMatrixDtls - Fetches approval matrix details (matches Java fetchApprovalMatrixDtls)
     * @param {string} staffUserGroup - The staff user group
     * @param {string} ulu - The ULU
     * @param {string} fdlu - The FDLU
     * @param {string} processCode - The process code
     * @param {object} tx - Optional transaction object
     * @returns {Promise<Array>} Array of approver matrix details
     */
    fetchApprovalMatrixDtls: async function (staffUserGroup, ulu, fdlu, processCode, tx = null) {
        const query = `
            SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
            WHERE eam.STAFF_USER_GRP = ? 
            AND eam.ULU = ? 
            AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
            AND eam.PROCESS_CODE = ? 
            AND eam.VALID_FROM <= CURRENT_DATE 
            AND eam.VALID_TO >= CURRENT_DATE 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [staffUserGroup, ulu, fdlu, processCode];
        const result = tx ? await tx.run(query, values) : await cds.run(query, values);
        return result || [];
    },

    /**
     * fetchApprovalMatrixDtlsForAllUlunFdlu - Fetches approval matrix details for all ULU/FDLU (matches Java fetchApprovalMatrixDtlsForAllUlunFdlu)
     * @param {string} staffUserGroup - The staff user group
     * @param {string} ulu - The ULU
     * @param {string} fdlu - The FDLU
     * @param {string} processCode - The process code
     * @param {object} tx - Optional transaction object
     * @returns {Promise<Array>} Array of approver matrix details
     */
    fetchApprovalMatrixDtlsForAllUlunFdlu: async function (staffUserGroup, ulu, fdlu, processCode, tx = null) {
        const query = `
            SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
            WHERE eam.STAFF_USER_GRP = ? 
            AND eam.ULU = CASE WHEN eam.ULU = 'ALL' THEN eam.ULU ELSE ? END 
            AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
            AND eam.PROCESS_CODE = ? 
            AND eam.VALID_FROM <= CURRENT_DATE 
            AND eam.VALID_TO >= CURRENT_DATE 
            AND eam.IS_DELETED = 'N'
        `;
        const values = [staffUserGroup, ulu, fdlu, processCode];
        const result = tx ? await tx.run(query, values) : await cds.run(query, values);
        return result || [];
    },
};
