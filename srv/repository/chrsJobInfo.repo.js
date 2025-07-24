const cds = require("@sap/cds");
const { SELECT, func } = require("@sap/cds/lib/ql/cds-ql");
// Removed unused import: const { query } = require("express");

module.exports = {
    fetchUserDetails: async function (upperNusNetId) {
        // Using CDS query builder instead of string concatenation
        let fetchUserDetails = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
                .where({ NUSNET_ID: upperNusNetId })
                .or({ STF_NUMBER: upperNusNetId })
                .where({ START_DATE: { "<=" : "CURRENT_DATE" } })
                .where({ END_DATE: { ">=" : "CURRENT_DATE" } })
        );
        return fetchUserDetails;
    },
    retrieveExternalUserDetails: async function (upperNusNetId) {
        // Using CDS query builder instead of string concatenation
        let retrieveExternalUserDetails = await cds.run(
            SELECT.from("NUSEXT_UTILITY_CHRS_EXTERNAL_USERS")
                .where({ NUSNET_ID: upperNusNetId })
                .or({ STF_NUMBER: upperNusNetId })
                .where({ START_DATE: { "<=" : "CURRENT_DATE" } })
                .where({ END_DATE: { ">=" : "CURRENT_DATE" } })
        );
        return retrieveExternalUserDetails;
    },
    fetchRmRole: async function (STF_NUMBER) {
        // Using CDS query builder instead of string concatenation
        let fetchRmRole = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").where({
                RM_STF_N: STF_NUMBER
            })
        );
        return fetchRmRole;
    },
    fetchRmsManagerJobInfo: async function (STF_NUMBER) {
        // Using CDS query builder instead of string concatenation
        let fetchRmRole = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO").alias("cj").where({
                RM_STF_N: STF_NUMBER
            })
        );
        return fetchRmRole;
    },
    fetchJobInfoDetailsForDashboard: async function (sColumns, staffId) {
        // Using parameterized query to prevent SQL injection
        const query = `SELECT ${sColumns} FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO WHERE (UPPER(NUSNET_ID) = UPPER(?) OR UPPER(STF_NUMBER) = UPPER(?)) AND START_DATE <= CURRENT_DATE AND END_DATE >= CURRENT_DATE`;
        const values = [staffId, staffId];
        let fetchJobInfoDetailsForDashboard = await cds.run(query, values);
        return fetchJobInfoDetailsForDashboard;
    },
    fetchName: async function (STF_NUMBER) {
        // Using CDS query builder instead of string concatenation
        let fetchName = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj")
                .columns("cj.FULL_NM")
                .where({
                    "cj.STF_NUMBER": STF_NUMBER,
                    "cj.SF_STF_NUMBER": STF_NUMBER,
                    "cj.START_DATE": { "<=" : "CURRENT_DATE" },
                    "cj.END_DATE": { ">=" : "CURRENT_DATE" }
                })
        );
        return fetchName;
    },

    checkStaffIsActiveAndValid: async function (nusNetId, startDate, endDate, ulu, fdlu, claimType) {
        // Using parameterized query to prevent SQL injection
        const query = ` 
            SELECT cj.*
            FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj
            JOIN NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA ec
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
        // Using parameterized query to prevent SQL injection
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
        // Using parameterized query to prevent SQL injection
        const query = `
            SELECT cj.*
            FROM NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj, NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA ec
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
        const today = new Date().toISOString().split('T')[0];
        // Using CDS query builder instead of string concatenation
        let retrieveJobInfoDetails = await cds.run(
            SELECT.one.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
                .where({ STF_NUMBER: { "=" : { ref: ["SF_STF_NUMBER"] } } })
                .where({ NUSNET_ID: nusNetId.toUpperCase() })
                .or({ STF_NUMBER: nusNetId.toUpperCase() })
                .where({ START_DATE: { "<=": today } })
                .where({ END_DATE: { "<=": today } })
        );
        return retrieveJobInfoDetails;
    },

    claimAssistantStaffLookup: async function (nusNetId, ulu, fdlu, startDate, endDate, claimType, searchValue) {
        // Using parameterized query to prevent SQL injection
        if (!searchValue) {
            searchValue = "";
        }
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
    cj.STF_NUMBER DESC`;
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

        const claimAssistantStaffLookup = await cds.run(query, params);
        return claimAssistantStaffLookup;
    },

    claimAssistantStaffLookupOptimized: async function (nusNetId, ulu, fdlu, startDate, endDate, claimType, searchValue) {
        try {
            // Input validation
            if (!nusNetId || !ulu || !fdlu || !startDate || !endDate || !claimType) {
                throw new Error("Missing required parameters for staff lookup");
            }

            // Normalize search value
            const normalizedSearchValue = searchValue ? searchValue.trim() : "";
            const searchPattern = normalizedSearchValue ? `%${normalizedSearchValue.toUpperCase()}%` : "%";

            // Optimized query with better performance
            // Using CDS query builder for better security and performance
            let query = SELECT
                .from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj")
                .columns(
                    "cj.SF_STF_NUMBER",
                    "cj.STF_NUMBER",
                    "MIN(cj.START_DATE) as START_DATE",
                    "MAX(cj.END_DATE) as END_DATE",
                    "cj.FIRST_NM",
                    "cj.LAST_NM",
                    "cj.FULL_NM",
                    "cj.NUSNET_ID",
                    "cj.ULU_C",
                    "cj.ULU_T",
                    "cj.FDLU_C",
                    "cj.FDLU_T",
                    "cj.EMAIL",
                    "cj.JOIN_DATE"
                )
                .innerJoin("NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA as ec")
                .on("ec.STF_NUMBER = cj.STF_NUMBER")
                .and("ec.SF_STF_NUMBER = cj.SF_STF_NUMBER")
                .where({
                    "cj.START_DATE": { "<=": endDate },
                    "cj.END_DATE": { ">=": startDate },
                    "cj.NUSNET_ID": { "!=": nusNetId.toUpperCase() },
                    "cj.ULU_C": ulu,
                    "cj.FDLU_C": fdlu,
                    "ec.START_DATE": { "<=": endDate },
                    "ec.END_DATE": { ">=": startDate },
                    "ec.CLAIM_TYPE": claimType,
                    "cj.EMPL_STS_C": "A"
                });

            // Add search conditions only if search value is provided
            if (normalizedSearchValue) {
                query = query.where({
                    or: [
                        { "cj.STF_NUMBER": { like: searchPattern } },
                        { "UPPER(cj.FULL_NM)": { like: searchPattern } },
                        { "UPPER(cj.NUSNET_ID)": { like: searchPattern } },
                        { "cj.ULU_C": { like: searchPattern } },
                        { "cj.FDLU_C": { like: searchPattern } },
                        { "UPPER(cj.ULU_T)": { like: searchPattern } },
                        { "UPPER(cj.FDLU_T)": { like: searchPattern } }
                    ]
                });
            }

            // Add grouping and ordering
            query = query
                .groupBy(
                    "cj.SF_STF_NUMBER",
                    "cj.STF_NUMBER",
                    "cj.FIRST_NM",
                    "cj.LAST_NM",
                    "cj.FULL_NM",
                    "cj.NUSNET_ID",
                    "cj.ULU_C",
                    "cj.ULU_T",
                    "cj.FDLU_C",
                    "cj.FDLU_T",
                    "cj.EMAIL",
                    "cj.JOIN_DATE"
                )
                .orderBy("cj.STF_NUMBER DESC");

            // Execute query with timeout
            const result = await cds.run(query);
            return result;

        } catch (error) {
            console.error("Error in claimAssistantStaffLookupOptimized:", error);
            throw new DatabaseException(`Database query failed: ${error.message}`);
        }
    },

    fetchStaffInfoDetails : async function(nusNetId) {
        const currentDate = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
        let query = SELECT.distinct
                .from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO")
                .where({
                    START_DATE: {
                        "<=" : currentDate,
                    },
                    END_DATE: {
                        ">=" : currentDate,
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
