const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const ApplicationConstants = require("../util/constant");

/**
 *
 * @param claimStartDate
 */
async function fetchWeekOfTheDay(claimStartDate) {
    // Using parameterized query to prevent SQL injection
    // const query = `SELECT dtw.WEEK FROM "NUSEXT_UTILITY_DATE_TO_WEEK" dtw WHERE (?) BETWEEN dtw.START_DATE AND dtw.END_DATE`;
    // const values = [claimStartDate];
    // let fetchWeek = await cds.run(query, values);
    let fetchWeek = await cds.run(
        SELECT.one.from("NUSEXT_UTILITY_DATE_TO_WEEK")
            .columns("WEEK")
            .where({
                "START_DATE": { "<=": claimStartDate },
                "END_DATE": { ">=": claimStartDate }
            })
    );
    return fetchWeek ? fetchWeek.WEEK : "";
}

module.exports = {
    fetchWeekOfTheDay
};
