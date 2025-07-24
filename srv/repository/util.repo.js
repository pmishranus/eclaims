const cds = require("@sap/cds");
const { SELECT, UPSERT, DELETE } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    /**
     * Fetches a sequence number using a pattern and counter.
     * @param {string} pattern - The sequence pattern.
     * @param {number} counter - The counter.
     * @returns {Promise<Object>} The sequence number result.
     */
    fetchSequenceNumber: async function (pattern, counter) {
        let fetchSequenceNumber = await cds.run(
            `CALL SEQ_NUMBER_GENERATION(PATTERN => ?, COUNTER => ?, RUNNINGNORESULT => ?)`,
            [pattern, counter]
        );
        return fetchSequenceNumber.RUNNINGNORESULT;
    },
    /**
     * Fetches logged in user details by NUSNET ID.
     * @param {string} upperNusNetId - The NUSNET ID.
     * @returns {Promise<Object>} The user details.
     */
    fetchLoggedInUser: async function (upperNusNetId) {
        let fetchStaffInfo = await cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
            .where({ NUSNET_ID: upperNusNetId })
            .or({ STF_NUMBER: upperNusNetId })
            .orderBy("END_DATE desc")
        );
        return fetchStaffInfo;
    },
    /**
     * Fetches user info by NUSNET ID.
     * @param {string} upperNusNetId - The NUSNET ID.
     * @returns {Promise<Object>} The user info.
     */
    fetchUserInfo: async function (upperNusNetId) {
        let fetchStaffInfo = await cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
            .where({ NUSNET_ID: upperNusNetId })
            .or({ STF_NUMBER: upperNusNetId })
            .orderBy("END_DATE desc")
        );
        return fetchStaffInfo;
    },

    /**
     * Fetches distinct ULU by code.
     * @param {string} uluCode - The ULU code.
     * @returns {Promise<Object>} The ULU details.
     */
    fetchDistinctULU: async function (uluCode) {
        let fetchDistinctULU = await cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u").where({
                "u.ULU_C": uluCode
            })
        );
        return fetchDistinctULU;
    },
    /**
     * Fetches distinct FDLU by code.
     * @param {string} fdluCode - The FDLU code.
     * @returns {Promise<Object>} The FDLU details.
     */
    fetchDistinctFDLU: function (fdluCode) {
        let fetchDistinctULU = cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u").where({
                "u.FDLU_C": fdluCode
            })
        );
        return fetchDistinctULU;
    },
    /**
     * Fetches ULU and FDLU by code.
     * @param {string} uluCode - The ULU code.
     * @param {string} fdluCode - The FDLU code.
     * @returns {Promise<Object>} The ULU/FDLU details.
     */
    fetchUluFdlu: function (uluCode, fdluCode) {
        let fetchUluFdlu = cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u").where({
                "u.ULU_C": uluCode,
                "u.FDLU_C": fdluCode
            })
        );
        return fetchUluFdlu;
    },

    /**
     * Checks for matrix admin by staff ID.
     * @param {string} staffId - The staff ID.
     * @returns {Promise<Object>} The matrix admin details.
     */
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

    /**
     * Performs an upsert operation in a transaction.
     * @param {Object} tx - The transaction object.
     * @param {string} entityName - The entity name.
     * @param {Object} record - The record to upsert.
     * @returns {Promise<Object>} The upsert result.
     */
    upsertOperationChained: async function (tx, entityName, record) {
        let execUpsertOperation = await tx.run(UPSERT.into(entityName).entries(record));
        return execUpsertOperation;
    },
    /**
     * Performs a delete operation in a transaction.
     * @param {Object} tx - The transaction object.
     * @param {string} entityName - The entity name.
     * @param {Object} whereClause - The where clause.
     * @returns {Promise<Object>} The delete result.
     */
    deleteOperationChained: async function (tx, entityName, whereClause) {
        // whereClause should be an object, e.g. { DRAFT_ID: '123' }
        let execDeleteOperation = await tx.run(
            DELETE.from(entityName).where(whereClause)
        );
        return execDeleteOperation;
    },
};
