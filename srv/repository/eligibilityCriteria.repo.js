const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 *
 * @param nusUserStfNumber
 * @param startDate
 * @param endDate
 * @param processCode
 */
async function fetchWorkingHours(nusUserStfNumber, startDate, endDate, processCode) {
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
        nusUserStfNumber, // ? for ec.STF_NUMBER
        startDate, // ? for ec.END_DATE >= ?
        endDate, // ? for ec.START_DATE <= ?
        processCode, // ? for ec.CLAIM_TYPE = ?
    ];
    const fetchWorkingHours = await cds.run(query, values);
    // result is an array of objects with WORKING_HOURS, STF_CLAIM_TYPE_CAT, and APPOINTMENT_TRACK
    return fetchWorkingHours;
}

/**
 *
 * @param staffId
 */
async function fetchClaimTypes(staffId) {
    const claimTypes = ["101", "103", "104"];
    let fetchClaimTypes = await cds.run(
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
            .where(
                `cj1.SF_STF_NUMBER in (
         select cj2.SF_STF_NUMBER from ChrsJobInfo as cj2
         where (upper(cj2.NUSNET_ID) = upper(?) or
                cj2.SF_STF_NUMBER = ? or
                cj2.STF_NUMBER = ?)
       ) and ec.START_DATE <= current_date
       and ec.SUBMISSION_END_DATE >= current_date
       and ec.CLAIM_TYPE in (?, ?, ?)`,
                staffId,
                staffId,
                staffId,
                ...claimTypes
            )
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
    return fetchClaimTypes;
}

/**
 *
 * @param staffId
 */
async function fetchClaimTypesForCw(staffId) {
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
                // staffId match using a subselect
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
                // current date constraints
                { ref: ["ec", "START_DATE"] },
                "<=",
                { val: new Date() },
                { ref: ["ec", "SUBMISSION_END_DATE"] },
                ">=",
                { val: new Date() },
                // period overlap
                { ref: ["ec", "START_DATE"] },
                "<=",
                { ref: ["cj1", "END_DATE"] },
                { ref: ["ec", "END_DATE"] },
                ">=",
                { ref: ["cj1", "START_DATE"] },
                // claim type
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

    return fetchClaimTypesForCw;
}

module.exports = {
    fetchWorkingHours,
    fetchClaimTypes,
    fetchClaimTypesForCw,
};
