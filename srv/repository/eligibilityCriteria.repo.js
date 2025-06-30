const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetch working hours for a staff member
 * @param {string} nusUserStfNumber - Staff number
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {string} processCode - Process code
 * @returns {Array} Array of working hours data
 */
async function fetchWorkingHours(nusUserStfNumber, startDate, endDate, processCode) {
    try {
        const query = `
            SELECT
                ec.WORKING_HOURS,
                ec.STF_CLAIM_TYPE_CAT,
                ec.APPOINTMENT_TRACK
            FROM
                NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA ec,
                NUSEXT_MASTER_DATA_MASTER_CLAIM_TYPE mct
            WHERE
                ec.STF_NUMBER = ?
                AND mct.CLAIM_TYPE_C = ec.CLAIM_TYPE
                AND ec.END_DATE >= ?
                AND ec.START_DATE <= ?
                AND ec.CLAIM_TYPE = ?
            ORDER BY
                ec.END_DATE DESC
        `;
        const values = [
            nusUserStfNumber,
            startDate,
            endDate,
            processCode,
        ];
        const fetchWorkingHours = await cds.run(query, values);
        return fetchWorkingHours;
    } catch (error) {
        console.error("Error in fetchWorkingHours:", error);
        throw new Error(`Failed to fetch working hours: ${error.message}`);
    }
}

/**
 * Fetch claim types for ECLAIMS (optimized version)
 * @param {string} staffId - Staff ID
 * @returns {Array} Array of claim types
 */
async function fetchClaimTypes(staffId) {
    try {
        const claimTypes = ["101", "103", "104"];
        
        // Optimized query with better JOIN structure
        const fetchClaimTypes = await cds.run(
            SELECT.columns(
                "ec.CLAIM_TYPE as CLAIM_TYPE_C",
                "mc.CLAIM_TYPE_T",
                "ec.STF_NUMBER",
                "ec.SF_STF_NUMBER",
                "min(ec.START_DATE) as START_DATE",
                "max(ec.END_DATE) as END_DATE",
                "max(ec.SUBMISSION_END_DATE) as SUBMISSION_END_DATE",
                "cj1.JOIN_DATE",
                "cj1.ULU_C",
                "cj1.ULU_T",
                "cj1.FDLU_C",
                "cj1.FDLU_T",
                "cj1.LEAVING_DATE"
            )
            .from("NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA as ec")
            .join("NUSEXT_MASTER_DATA_MASTER_CLAIM_TYPE as mc")
            .on("ec.CLAIM_TYPE = mc.CLAIM_TYPE_C")
            .join("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj1")
            .on("cj1.SF_STF_NUMBER = ec.SF_STF_NUMBER and cj1.END_DATE >= ec.END_DATE")
            .where([
                // Optimized subquery for staff lookup
                {
                    ref: ["cj1", "SF_STF_NUMBER"],
                    in: SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj2")
                        .columns(["SF_STF_NUMBER"])
                        .where([
                            { func: "upper", args: [{ ref: ["cj2", "NUSNET_ID"] }] },
                            "=",
                            staffId.toUpperCase(),
                            "or",
                            { ref: ["cj2", "SF_STF_NUMBER"] },
                            "=",
                            staffId,
                            "or",
                            { ref: ["cj2", "STF_NUMBER"] },
                            "=",
                            staffId,
                        ])
                },
                // Date constraints
                { ref: ["ec", "START_DATE"] },
                "<=",
                { val: new Date() },
                { ref: ["ec", "SUBMISSION_END_DATE"] },
                ">=",
                { val: new Date() },
                // Claim type filter
                { ref: ["ec", "CLAIM_TYPE"] },
                "in",
                claimTypes
            ])
            .groupBy(
                "ec.CLAIM_TYPE",
                "mc.CLAIM_TYPE_T",
                "ec.STF_NUMBER",
                "ec.SF_STF_NUMBER",
                "cj1.JOIN_DATE",
                "cj1.ULU_C",
                "cj1.ULU_T",
                "cj1.FDLU_C",
                "cj1.FDLU_T",
                "cj1.LEAVING_DATE"
            )
        );
        
        return fetchClaimTypes || [];
    } catch (error) {
        console.error("Error in fetchClaimTypes:", error);
        throw new Error(`Failed to fetch claim types: ${error.message}`);
    }
}

/**
 * Fetch claim types for CW (optimized version)
 * @param {string} staffId - Staff ID
 * @returns {Array} Array of claim types
 */
async function fetchClaimTypesForCw(staffId) {
    try {
        const fetchClaimTypesForCw = await cds.run(
            SELECT.from("NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA as ec")
                .columns(
                    "ec.CLAIM_TYPE as CLAIM_TYPE_C",
                    "mc.CLAIM_TYPE_T",
                    "ec.STF_NUMBER",
                    "ec.SF_STF_NUMBER",
                    "min(ec.START_DATE) as START_DATE",
                    "max(ec.END_DATE) as END_DATE",
                    "max(ec.SUBMISSION_END_DATE) as SUBMISSION_END_DATE",
                    "cj1.JOIN_DATE",
                    "cj1.ULU_C",
                    "cj1.ULU_T",
                    "cj1.FDLU_C",
                    "cj1.FDLU_T",
                    "cj1.LEAVING_DATE"
                )
                .join("NUSEXT_MASTER_DATA_MASTER_CLAIM_TYPE as mc")
                .on("ec.CLAIM_TYPE = mc.CLAIM_TYPE_C")
                .join("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj1")
                .on("cj1.SF_STF_NUMBER = ec.SF_STF_NUMBER and cj1.END_DATE >= ec.END_DATE")
                .where([
                    // Optimized staff lookup
                    {
                        ref: ["cj1", "SF_STF_NUMBER"],
                        in: SELECT.from("NUSEXT_MASTER_DATA_CHRS_JOB_INFO as cj2")
                            .columns(["SF_STF_NUMBER"])
                            .where([
                                { func: "upper", args: [{ ref: ["cj2", "NUSNET_ID"] }] },
                                "=",
                                staffId.toUpperCase(),
                                "or",
                                { ref: ["cj2", "SF_STF_NUMBER"] },
                                "=",
                                staffId,
                                "or",
                                { ref: ["cj2", "STF_NUMBER"] },
                                "=",
                                staffId,
                            ]),
                    },
                    // Date constraints
                    { ref: ["ec", "START_DATE"] },
                    "<=",
                    { val: new Date() },
                    { ref: ["ec", "SUBMISSION_END_DATE"] },
                    ">=",
                    { val: new Date() },
                    // Period overlap check
                    { ref: ["ec", "START_DATE"] },
                    "<=",
                    { ref: ["cj1", "END_DATE"] },
                    { ref: ["ec", "END_DATE"] },
                    ">=",
                    { ref: ["cj1", "START_DATE"] },
                    // Claim type filter
                    { ref: ["ec", "CLAIM_TYPE"] },
                    "=",
                    "102",
                ])
                .groupBy(
                    "ec.CLAIM_TYPE",
                    "mc.CLAIM_TYPE_T",
                    "ec.STF_NUMBER",
                    "ec.SF_STF_NUMBER",
                    "cj1.JOIN_DATE",
                    "cj1.ULU_C",
                    "cj1.ULU_T",
                    "cj1.FDLU_C",
                    "cj1.FDLU_T",
                    "cj1.LEAVING_DATE"
                )
        );

        return fetchClaimTypesForCw || [];
    } catch (error) {
        console.error("Error in fetchClaimTypesForCw:", error);
        throw new Error(`Failed to fetch CW claim types: ${error.message}`);
    }
}

module.exports = {
    fetchWorkingHours,
    fetchClaimTypes,
    fetchClaimTypesForCw,
};
