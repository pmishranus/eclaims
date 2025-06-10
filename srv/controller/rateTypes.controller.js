const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const DateUtils = require("../util/dateUtil");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ChrsCompInfoRepo = require("../repository/chrsCompInfo.repo");

/**
 *
 * @param request
 */
async function fetchRateTypes(request) {
    let approveTasksRes = [];
    try {
        // const tx = cds.tx(request);
        const user = request.user.id;
        const userName = "OT_CA9";
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }

        const inputRequest = request.data.data;
        if (!inputRequest) {return req.error(400, "Request is Empty / Not valid.");}
        const staffId = inputRequest.STAFF_ID;
        const claimMonth = inputRequest.CLAIM_MONTH;
        const ulu = inputRequest.ULU;
        const fdlu = inputRequest.FDLU;
        const processCode = inputRequest.PROCESS_CODE;
        if (!staffId || !claimMonth) {return req.error(400, "Invalid Staff id/Claim Month");}
        if (!ulu || !fdlu) {return req.error(400, "Pls provide ULU/FDLU");}

        const oResponse = {
            message: "Rate Types fetched successfully",
            error: false,
            eligibleRateTypes: [],
        };
        // Parse CLAIM_MONTH (e.g. "06-2023" as MM-YYYY)
        if (claimMonth.includes("-")) {
            const [monthStr, yearStr] = claimMonth.split("-");
            const month = parseInt(monthStr, 10);
            const year = parseInt(yearStr, 10);

            // Dates: JS months are 0-based in Date, but CAP supports ISO strings
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // day=0 of next month = last day of this month

            // Fetch from DB (adapt WHERE condition to your model/DB)
            const response = await ChrsCompInfoRepo.fetchRateTypes(
                staffId,
                DateUtils.formatDateAsString(startDate, "yyyy-MM-dd"),
                DateUtils.formatDateAsString(endDate, "yyyy-MM-dd"),
                ulu,
                fdlu,
                processCode
            );

            // Build the response map by RATE_CODE
            const responseMap = {};

            if (response && response.length) {
                for (const item of response) {
                    if (!responseMap[item.RATE_CODE]) {
                        // Clone non-child fields
                        const updatedResponseItem = {
                            RATE_CODE: item.RATE_CODE,
                            RATE_DESC: item.RATE_DESC,
                            RATE_TYPE_C: item.RATE_TYPE_C,
                            MAX_LIMIT: item.MAX_LIMIT,
                            WAGE_CODE: item.WAGE_CODE,
                            WORKING_HOURS: item.WORKING_HOURS,
                            items: [],
                        };

                        // Prepare the child item
                        const childItem = {
                            RATE_TYPE_T: item.RATE_TYPE_T,
                            AMOUNT: Number(item.AMOUNT).toFixed(2),
                            CURRENCY: item.CURRENCY,
                            FREQUENCY: item.FREQUENCY,
                            START_DATE: item.START_DATE,
                            END_DATE: item.END_DATE,
                            NUSNET_ID: item.NUSNET_ID,
                            SF_STF_NUMBER: item.SF_STF_NUMBER,
                            STF_NUMBER: item.STF_NUMBER,
                            WAGE_CODE: item.WAGE_CODE,
                            WORKING_HOURS: item.WORKING_HOURS,
                        };
                        updatedResponseItem.items.push(childItem);
                        responseMap[item.RATE_CODE] = updatedResponseItem;
                    } else {
                        // Add to existing parent
                        const childItem = {
                            RATE_TYPE_T: item.RATE_TYPE_T,
                            AMOUNT: Number(item.AMOUNT).toFixed(2),
                            CURRENCY: item.CURRENCY,
                            FREQUENCY: item.FREQUENCY,
                            START_DATE: item.START_DATE,
                            END_DATE: item.END_DATE,
                            NUSNET_ID: item.NUSNET_ID,
                            SF_STF_NUMBER: item.SF_STF_NUMBER,
                            STF_NUMBER: item.STF_NUMBER,
                            MAX_LIMIT: item.MAX_LIMIT,
                            WAGE_CODE: item.WAGE_CODE,
                            WORKING_HOURS: item.WORKING_HOURS,
                        };
                        responseMap[item.RATE_CODE].items.push(childItem);
                    }
                }
            }

            // Flatten the map into a list
            const updatedResponse = [];
            Object.values(responseMap).forEach(val => updatedResponse.push(val));

            oResponse.eligibleRateTypes = responseMap;
        }

        return oResponse;
    } catch (err) {
        // If there is a global error, rethrow or return as per your CAP error handling
        throw err;
    }
}

module.exports = {
    fetchRateTypes,
};
