const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const ApplicationConstants = require("../util/constant");

/**
 *
 * @param claimStartDate
 */
async function fetchWeekOfTheDay(claimStartDate) {
    // Using parameterized query to prevent SQL injection
    const query = `SELECT dtw.WEEK FROM DateToWeek dtw WHERE (?) BETWEEN dtw.START_DATE AND dtw.END_DATE`;
    const values = [claimStartDate];
    let fetchWeek = await cds.run(query, values);
    return fetchWeek;
}

module.exports = {
    fetchWeekOfTheDay
};
