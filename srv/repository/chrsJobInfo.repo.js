const cds = require("@sap/cds");
const { SELECT, func } = require("@sap/cds/lib/ql/cds-ql");

module.exports = {
    fetchUserDetails: async function (upperNusNetId) {
        const stfInfoQueryParameter = ` ( NUSNET_ID = '${upperNusNetId}' OR STF_NUMBER = '${upperNusNetId}') AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE`;
        let fetchUserDetails = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").where(stfInfoQueryParameter)
        );
        return fetchUserDetails;
    },
    retrieveExternalUserDetails: async function (upperNusNetId) {
        const stfInfoQueryParameter = ` ( NUSNET_ID = '${upperNusNetId}' OR STF_NUMBER = '${upperNusNetId}') AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE`;
        let retrieveExternalUserDetails = await cds.run(
            SELECT.from("NUSEXT_UTILITY_CHRS_EXTERNAL_USERS").where(stfInfoQueryParameter)
        );
        return retrieveExternalUserDetails;
    },
    fetchRmRole: async function (STF_NUMBER) {
        const queryParameter = ` RM_STF_N = '${STF_NUMBER}' `;
        let fetchRmRole = await cds.run(SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").where(queryParameter));
        return fetchRmRole;
    },
    fetchRmsManagerJobInfo: async function (STF_NUMBER) {
        const queryParameter = ` RM_STF_N = '${STF_NUMBER}' `;
        let fetchRmRole = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").alias("cj").where(queryParameter)
        );
        return fetchRmRole;
    },
    fetchJobInfoDetailsForDashboard: async function (sColumns, staffId) {
        const queryParameter = ` ( UPPER(NUSNET_ID) = UPPER('${staffId}') OR UPPER(STF_NUMBER) = UPPER('${staffId}')) AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE`;
        // let fetchJobInfoDetailsForDashboard = await cds.run(SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
        //     .columns(`${sColumns}`)
        //     .where(queryParameter));
        let query = "SELECT " + sColumns + " FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO WHERE " + queryParameter;
        let fetchJobInfoDetailsForDashboard = await cds.run(query);
        return fetchJobInfoDetailsForDashboard;
    },
    fetchName: async function (STF_NUMBER) {
        const queryParameter = ` cj.STF_NUMBER = '${STF_NUMBER}' and cj.SF_STF_NUMBER = '${STF_NUMBER}' and cj.START_DATE <= CURRENT_DATE AND cj.END_DATE >= CURRENT_DATE `;
        let fetchName = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj").columns("cj.FULL_NM").where(queryParameter)
        );
        return fetchName;
    },

    checkStaffIsActiveAndValid: async function (nusNetId, startDate, endDate, ulu, fdlu, claimType) {
        const query = ` SELECT cj.*
                            FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj
                            JOIN NUSEXT_MASTER_DATA_ELIGIBILITY_CRITERIA ec
                                ON ec.STF_NUMBER = cj.STF_NUMBER
                            AND ec.SF_STF_NUMBER = cj.SF_STF_NUMBER
                            WHERE cj.START_DATE <= ?
                                AND cj.END_DATE >= ?
                                AND (
                                UPPER(cj.NUSNET_ID) = UPPER(?) OR
                                UPPER(cj.STF_NUMBER) = UPPER(?)
                                )
                                AND cj.ULU_C = ?
                                AND cj.FDLU_C = ?
                                AND ec.START_DATE <= ?
                                AND ec.END_DATE >= ?
                                AND ec.CLAIM_TYPE = ?
                    `;
        const values = [
            endDate,
            startDate,
            nusNetId,
            nusNetId, // For both NUSNET_ID and STF_NUMBER
            ulu,
            fdlu,
            endDate,
            startDate,
            claimType,
        ];
        const checkStaffIsActiveAndValid = await cds.run(query, values);
        return checkStaffIsActiveAndValid;
    },

    fetchStaffInfoForRequest: async function (nusNetId, ulu, fdlu) {
        const query = `
                        SELECT cj.*
                        FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj
                        WHERE cj.STF_NUMBER IN (
                        SELECT cj1.STF_NUMBER
                        FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj1
                        WHERE (
                                UPPER(cj1.NUSNET_ID) = UPPER(?)
                                OR UPPER(cj1.STF_NUMBER) = UPPER(?)
                                )
                            AND cj1.ULU_C = ?
                            AND cj1.FDLU_C = ?
                        )
                        AND cj.ULU_C = ?
                        AND cj.FDLU_C = ?
                `;
        const values = [nusNetId, nusNetId, ulu, fdlu, ulu, fdlu];
        const fetchStaffInfoForRequest = await cds.run(query, values);
        return fetchStaffInfoForRequest;
    },

    checkStaffIsActiveAndValidForMonthly: async function (nusNetId, startDate, endDate, claimType) {
        const query = `
                        SELECT cj.*
                        FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj, NUSEXT_MASTER_DATA_ELIGIBILITY_CRITERIA ec
                        WHERE
                            cj.START_DATE <= ?
                            AND cj.END_DATE >= ?
                            AND cj.STF_NUMBER IN (
                            SELECT cj1.STF_NUMBER
                            FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj1
                            WHERE UPPER(cj1.NUSNET_ID) = UPPER(?)
                                OR UPPER(cj1.STF_NUMBER) = UPPER(?)
                            )
                            AND ec.START_DATE <= ?
                            AND ec.END_DATE >= ?
                            AND ec.CLAIM_TYPE = ?
                            AND ec.STF_NUMBER = cj.STF_NUMBER
                            AND ec.SF_STF_NUMBER = cj.SF_STF_NUMBER
                    `;
        const values = [endDate, startDate, nusNetId, nusNetId, endDate, startDate, claimType];
        const checkStaffIsActiveAndValidForMonthly = await cds.run(query, values);
        return checkStaffIsActiveAndValidForMonthly;
    },

    retrieveJobInfoDetails: async function (nusNetId) {
        let query = ` STF_NUMBER = SF_STF_NUMBER AND (UPPER(NUSNET_ID) = '${nusNetId.toUpperCase()}' OR UPPER(STF_NUMBER) = '${nusNetId.toUpperCase()}') AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE `;
        let retrieveJobInfoDetails = await cds.run(SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").where(query));
        return retrieveJobInfoDetails;
    },

    claimAssistantStaffLookup: async function (nusNetId, ulu, fdlu, startDate, endDate, claimType, searchValue) {
        // searchValue2,
        // searchValue3,
        // searchValue4,
        // searchValue5,
        // searchValue6,
        // searchValue7)
        const query = `SELECT
    cj.SF_STF_NUMBER,
    cj.STF_NUMBER,
    MIN(cj.START_DATE) AS START_DATE,
    MAX(cj.END_DATE) AS END_DATE,
    cj.FIRST_NM,
    cj.LAST_NM,
    cj.FULL_NM,
    cj.NUSNET_ID,
    cj.ULU_C,
    cj.ULU_T,
    cj.FDLU_C,
    cj.FDLU_T,
    cj.EMAIL,
    cj.JOIN_DATE
FROM
    NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj
INNER JOIN
    NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA ec
    ON ec.STF_NUMBER = cj.STF_NUMBER
    AND ec.SF_STF_NUMBER = cj.SF_STF_NUMBER
WHERE
    cj.START_DATE <= ?
    AND cj.END_DATE >= ?
    AND UPPER(cj.NUSNET_ID) != UPPER(?)
    AND cj.ULU_C = ?
    AND cj.FDLU_C = ?
    AND ec.START_DATE <= ?
    AND ec.END_DATE >= ?
    AND ec.CLAIM_TYPE = ?
    AND cj.EMPL_STS_C = 'A'
    AND (
        cj.STF_NUMBER LIKE ?
        OR UPPER(cj.FULL_NM) LIKE ?
        OR UPPER(cj.NUSNET_ID) LIKE ?
        OR cj.ULU_C LIKE ?
        OR cj.FDLU_C LIKE ?
        OR UPPER(cj.ULU_T) LIKE ?
        OR UPPER(cj.FDLU_T) LIKE ?
    )
GROUP BY
    cj.SF_STF_NUMBER,
    cj.STF_NUMBER,
    cj.FIRST_NM,
    cj.LAST_NM,
    cj.FULL_NM,
    cj.NUSNET_ID,
    cj.ULU_C,
    cj.ULU_T,
    cj.FDLU_C,
    cj.FDLU_T,
    cj.EMAIL,
    cj.JOIN_DATE
ORDER BY
    cj.STF_NUMBER DESC
`;
if(!searchValue){
searchValue = "";
}
        const params = [
            endDate,
            startDate,
            nusNetId,
            ulu,
            fdlu,
            endDate,
            startDate,
            claimType,
            `%${searchValue}%`,
            `%${searchValue.toUpperCase()}%`,
            `%${searchValue.toUpperCase()}%`,
            `%${searchValue}%`,
            `%${searchValue}%`,
            `%${searchValue.toUpperCase()}%`,
            `%${searchValue.toUpperCase()}%`,
        ];

        const results = await cds.run(query, params);
        return results;
    },

//     claimAssistantStaffLookup: async function (nusNetId, ulu, fdlu, startDate, endDate, claimType) {
//         const params = [endDate, startDate, nusNetId, ulu, fdlu, endDate, startDate, claimType];
//         const query = `SELECT
//     cj.SF_STF_NUMBER,
//     cj.STF_NUMBER,
//     MIN(cj.START_DATE) AS START_DATE,
//     MAX(cj.END_DATE) AS END_DATE,
//     cj.FIRST_NM,
//     cj.LAST_NM,
//     cj.FULL_NM,
//     cj.NUSNET_ID,
//     cj.ULU_C,
//     cj.ULU_T,
//     cj.FDLU_C,
//     cj.FDLU_T,
//     cj.EMAIL,
//     cj.JOIN_DATE
// FROM
//     NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj
// INNER JOIN
//     NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA ec
//     ON ec.STF_NUMBER = cj.STF_NUMBER
//     AND ec.SF_STF_NUMBER = cj.SF_STF_NUMBER
// WHERE
//     cj.START_DATE <= ?
//     AND cj.END_DATE >= ?
//     AND UPPER(cj.NUSNET_ID) != UPPER(?)
//     AND cj.ULU_C = ?
//     AND cj.FDLU_C = ?
//     AND ec.START_DATE <= ?
//     AND ec.END_DATE >= ?
//     AND ec.CLAIM_TYPE = ?
//     AND cj.EMPL_STS_C = 'A'
// GROUP BY
//     cj.SF_STF_NUMBER,
//     cj.STF_NUMBER,
//     cj.FIRST_NM,
//     cj.LAST_NM,
//     cj.FULL_NM,
//     cj.NUSNET_ID,
//     cj.ULU_C,
//     cj.ULU_T,
//     cj.FDLU_C,
//     cj.FDLU_T,
//     cj.EMAIL,
//     cj.JOIN_DATE
// ORDER BY
//     cj.STF_NUMBER DESC`;
//         const results = await cds.run(query, params);
//         return results;
//     },

    fetchStaffInfoDetails : async function(nusNetId) {
        const currentDate = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
        let query = SELECT.distinct
                .from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
                .where({
                    START_DATE: {
                        "<=": currentDate,
                    },
                    END_DATE: {
                        ">=": currentDate,
                    },
                    and: {
                        "UPPER(NUSNET_ID)": nusNetId.toUpperCase(),
                        or: { STF_NUMBER: nusNetId },
                    },
                })
                .orderBy('END_DATE desc')
            let fetchStaffInfoDetails = await cds.run(query);
        
            return fetchStaffInfoDetails;
    }
    
};
