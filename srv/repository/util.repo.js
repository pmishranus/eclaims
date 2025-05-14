const cds = require("@sap/cds");
const { SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchSequenceNumber: function (pattern, counter) {
        let fetchSequenceNumber = cds.run(
            `CALL SEQ_NUMBER_GENERATION(PATTERN => '${pattern}',COUNTER => ${counter},RUNNINGNORESULT => ?)`
        );
        return fetchSequenceNumber;
    },
    fetchLoggedInUser :function(upperNusNetId){
        const stfInfoQueryParameter = ` ( NUSNET_ID = '${upperNusNetId}' OR STF_NUMBER = '${upperNusNetId}')`
        let fetchStaffInfo = cds.run(SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
            .where(stfInfoQueryParameter)
            .orderBy('END_DATE desc')
        );
        return fetchStaffInfo;
    },

    fetchDistinctULU: async function(uluCode){
        const queryParameter = ` u.ULU_C = '${uluCode}`;
        let fetchDistinctULU = await cds.run(SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u")
            .where(queryParameter)
        );
        return fetchDistinctULU;
    },
    fetchDistinctFDLU: function(fdluCode){
        const queryParameter = ` u.FDLU_C = '${fdluCode}`;
        let fetchDistinctULU = cds.run(SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u")
            .where(queryParameter)
        );
        return fetchDistinctULU;
    },
    fetchUluFdlu: function(uluCode,fdluCode){
        const queryParameter = ` u.ULU_C = '${uluCode} and u.FDLU_C = '${fdluCode}`;
        let fetchUluFdlu = cds.run(SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU AS u")
            .where(queryParameter)
        );
        return fetchUluFdlu;
    },
   
    checkForMatrixAdmin: function(staffId){
        queryParameter = ` eam.STAFF_ID = '${staffId}' and eam.VALID_FROM <= CURRENT_DATE and eam.VALID_TO >= CURRENT_DATE and eam.IS_DELETED='N' and eam.STAFF_USER_GRP = 'MATRIX_ADMIN'`;
        let checkForMatrixAdmin = cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam ')
                .where(queryParameter));
        return checkForMatrixAdmin;
    },

    upsertOperationChained : function(tx,entityName,record){
        let execUpsertOperation = tx.run(UPSERT.into(entityName).entries(record));
        return execUpsertOperation;
    }

}