const cds = require("@sap/cds");

async function fetchCostDistDetails(nusNetId, startDate, endDate) {
    let query = `SELECT * FROM NUSEXT_MASTER_DATA_CHRS_COST_DIST WHERE STF_NUMBER IN (select cj1.STF_NUMBER from NUSEXT_MASTER_DATA_CHRS_JOB_INFO cj1 WHERE (UPPER(cj1.NUSNET_ID) = UPPER(?) or cj1.STF_NUMBER = ?)) and START_DATE <= ? and END_DATE >= ?`;
    let fetchCostDistDetails = await cds.run(
        query,
        [nusNetId, nusNetId, endDate, startDate]
    )
    return fetchCostDistDetails;
}

module.exports = {
    fetchCostDistDetails
}