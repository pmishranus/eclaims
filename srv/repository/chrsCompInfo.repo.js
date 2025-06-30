const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 *
 * @param nusNetId
 * @param startDate
 * @param endDate
 * @param ulu
 * @param fdlu
 * @param processCode
 */
async function fetchRateTypes(nusNetId, startDate, endDate, ulu, fdlu, processCode) {
    // Using parameterized query to prevent SQL injection
    const query = `SELECT 
	cc.RATE_TYPE_C,
	cc.RATE_TYPE_T,
	rm.RATE_CODE,
	rm.RATE_DESC,
	cc.AMOUNT,
	cc.CURRENCY,
	cc.FREQUENCY,
	cc.START_DATE,
	cc.END_DATE,
	cj.NUSNET_ID,
	cc.SF_STF_NUMBER,
	cc.STF_NUMBER,
	rm.MAX_LIMIT,
	rm.WAGE_CODE,
	ec.WORKING_HOURS,
	ec.APPOINTMENT_TRACK
FROM 
	"NUSEXT_MASTER_DATA_CHRS_COMP_INFO" AS cc
	INNER JOIN
	"NUSEXT_MASTER_DATA_CHRS_JOB_INFO" AS cj
	ON cj.STF_NUMBER = cc.STF_NUMBER
		AND cj.SF_STF_NUMBER = cc.SF_STF_NUMBER
	INNER JOIN
	"NUSEXT_MASTER_DATA_RATE_TYPE_MASTER_DATA" AS rm
	ON rm.WAGE_CODE = cc.RATE_TYPE_C
	INNER JOIN
	"NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA" AS ec
	ON ec.STF_NUMBER = cj.STF_NUMBER
WHERE (cj.STF_NUMBER IN (SELECT cj1.STF_NUMBER
		FROM "NUSEXT_MASTER_DATA_CHRS_JOB_INFO" AS cj1
		WHERE (UPPER(cj1.NUSNET_ID) = UPPER(?)
			OR cj1.STF_NUMBER = ?)))
	AND cc.START_DATE <= ?
	AND cc.END_DATE >= ?
	AND cj.STF_NUMBER = cc.STF_NUMBER
	AND cj.SF_STF_NUMBER = cc.SF_STF_NUMBER
	AND cj.ULU_C = ?
	AND cj.FDLU_C = ?
	AND cj.START_DATE <= ?
	AND cj.END_DATE >= ?
	AND rm.WAGE_CODE = cc.RATE_TYPE_C
	AND (( cc.RATE_TYPE_C <> 'A002' )
		OR (cc.RATE_TYPE_C = 'A002'
		AND rm.FREQUENCY = cc.FREQUENCY))
	AND ec.START_DATE <= ?
	AND ec.END_DATE >= ?
	AND ec.STF_NUMBER = cj.STF_NUMBER
	AND ec.CLAIM_TYPE = ?`;

    const values = [
        nusNetId, nusNetId, // For both UPPER(cj1.NUSNET_ID) and cj1.STF_NUMBER
        endDate, startDate, // For cc.START_DATE and cc.END_DATE
        ulu, fdlu, // For cj.ULU_C and cj.FDLU_C
        endDate, startDate, // For cj.START_DATE and cj.END_DATE
        endDate, startDate, // For ec.START_DATE and ec.END_DATE
        processCode // For ec.CLAIM_TYPE
    ];

    let fetchRateTypes = await cds.run(query, values);
    return fetchRateTypes;
}

module.exports = {
    fetchRateTypes,
};
