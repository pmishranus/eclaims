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
    let query = `SELECT 
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
		WHERE (UPPER(cj1.NUSNET_ID) = UPPER('${nusNetId}')
			OR cj1.STF_NUMBER = '${nusNetId}')))
	AND cc.START_DATE <= '${endDate}'
	AND cc.END_DATE >= '${startDate}'
	AND cj.STF_NUMBER = cc.STF_NUMBER
	AND cj.SF_STF_NUMBER = cc.SF_STF_NUMBER
	AND cj.ULU_C = '${ulu}'
	AND cj.FDLU_C = '${fdlu}'
	AND cj.START_DATE <= '${endDate}'
	AND cj.END_DATE >= '${startDate}'
	AND rm.WAGE_CODE = cc.RATE_TYPE_C
	AND (( cc.RATE_TYPE_C <> 'A002' )
		OR (cc.RATE_TYPE_C = 'A002'
		AND rm.FREQUENCY = cc.FREQUENCY))
	AND ec.START_DATE <= '${endDate}'
	AND ec.END_DATE >= '${startDate}'
	AND ec.STF_NUMBER = cj.STF_NUMBER
	AND ec.CLAIM_TYPE = '${processCode}';
`;

    let fetchRateTypes = await cds.run(query);
    return fetchRateTypes;
}

module.exports = {
    fetchRateTypes,
};
