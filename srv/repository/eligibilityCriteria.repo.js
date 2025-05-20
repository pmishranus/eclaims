const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");


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
        startDate,        // ? for ec.END_DATE >= ?
        endDate,          // ? for ec.START_DATE <= ?
        processCode       // ? for ec.CLAIM_TYPE = ?
    ];
    const fetchWorkingHours = await cds.run(query, values);
    // result is an array of objects with WORKING_HOURS, STF_CLAIM_TYPE_CAT, and APPOINTMENT_TRACK
    return fetchWorkingHours;
}

module.exports = {
    fetchWorkingHours
}