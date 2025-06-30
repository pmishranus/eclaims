const cds = require("@sap/cds");
const { SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchSequenceNumber: function (pattern, counter) {
        let fetchSequenceNumber = cds.run(
            `CALL SEQ_NUMBER_GENERATION(PATTERN => ?, COUNTER => ?, RUNNINGNORESULT => ?)`,
            [pattern, counter]
        );
        return fetchSequenceNumber;
    },
    fetchLoggedInUser: function (upperNusNetId) {
        let fetchStaffInfo = cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").where({
                or: [
                    { NUSNET_ID: upperNusNetId },
                    { STF_NUMBER: upperNusNetId }
                ]
            }).orderBy("END_DATE desc")
        );
        return fetchStaffInfo;
    },
    fetchUserInfo: async function (upperNusNetId) {
        let fetchStaffInfo = await cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").where({
                or: [
                    { NUSNET_ID: upperNusNetId },
                    { STF_NUMBER: upperNusNetId }
                ]
            }).orderBy("END_DATE desc")
        );
        return fetchStaffInfo;
    },

    fetchDistinctULU: async function (uluCode) {
        let fetchDistinctULU = await cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u").where({
                "u.ULU_C": uluCode
            })
        );
        return fetchDistinctULU;
    },
    fetchDistinctFDLU: function (fdluCode) {
        let fetchDistinctULU = cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u").where({
                "u.FDLU_C": fdluCode
            })
        );
        return fetchDistinctULU;
    },
    fetchUluFdlu: function (uluCode, fdluCode) {
        let fetchUluFdlu = cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u").where({
                "u.ULU_C": uluCode,
                "u.FDLU_C": fdluCode
            })
        );
        return fetchUluFdlu;
    },

    checkForMatrixAdmin: function (staffId) {
        const queryParameter = {
            "eam.STAFF_ID": staffId,
            "eam.VALID_FROM": { "<=" : "CURRENT_DATE" },
            "eam.VALID_TO": { ">=" : "CURRENT_DATE" },
            "eam.IS_DELETED": "N",
            "eam.STAFF_USER_GRP": "MATRIX_ADMIN"
        };
        let checkForMatrixAdmin = cds.run(
            SELECT.from(" NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ").where(queryParameter)
        );
        return checkForMatrixAdmin;
    },

    upsertOperationChained: async function (tx, entityName, record) {
        let execUpsertOperation = await tx.run(UPSERT.into(entityName).entries(record));
        return execUpsertOperation;
    },
};
