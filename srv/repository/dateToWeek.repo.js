const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const ApplicationConstants = require("../util/constant");

/**
 *
 * @param claimStartDate
 */
async function fetchWeekOfTheDay(claimStartDate) {
    let query = ` select dtw.WEEK from NUSEXT_UTILITY_DATE_TO_WEEK dtw where ('${claimStartDate}' BETWEEN dtw.START_DATE and dtw.END_DATE)`;
    let fetchWeekOfTheDay = await cds.run(query);
    return fetchWeekOfTheDay;
}

module.exports = {
    fetchWeekOfTheDay,
};
