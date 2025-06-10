const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const DateUtils = require("../util/dateUtil");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ChrsCompInfoRepo = require("../repository/chrsCompInfo.repo");
const { yaml } = require("@sap/cds/lib/compile/load");

async function fetchCaStaffLookup(request) {
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

        const { claimType, ulu, fdlu, period, searchValue } = request.data;



        if (!claimType || !period || !ulu || !fdlu)
            return request.error(400, "Pls provide valid inputs - claimCode, ULU, FDLU , Period");

        let staffLookup = [];
        if (period.includes(ApplicationConstants.HYPHEN)) {
            // MM-YYYY
            const [monthStr, yearStr] = period.split(ApplicationConstants.HYPHEN);
            const month = parseInt(monthStr, 10);
            const year = parseInt(yearStr, 10);
            let inputDates = DateUtils.fetchDatesFromMonthAndYear(month, year);
            let startDate = inputDates[0];
            let endDate = inputDates[1];
            if (CommonUtils.isNotBlank(searchValue)) {
                staffLookup = await ChrsJobInfoRepo.claimAssistantStaffLookup(userInfoDetails.NUSNET_ID, ulu, fdlu, startDate, endDate, claimType, searchValue);
            } else {
                staffLookup = await ChrsJobInfoRepo.claimAssistantStaffLookup(userInfoDetails.NUSNET_ID, ulu, fdlu, startDate, endDate, claimType);
            }
        } else {
            let startDate = DateUtils.formatDateAsString(new Date(), 'yyyy-MM-dd');
            let endDate = DateUtils.formatDateAsString(new Date(), 'yyyy-MM-dd');
            if (CommonUtils.isNotBlank(searchValue)) {
                staffLookup = await ChrsJobInfoRepo.claimAssistantStaffLookup(userInfoDetails.NUSNET_ID, ulu, fdlu, startDate, endDate, claimType, searchValue);
            } else {
                staffLookup = await ChrsJobInfoRepo.claimAssistantStaffLookup(userInfoDetails.NUSNET_ID, ulu, fdlu, startDate, endDate, claimType);
            }
        }

        let updatedStaffLookup = [];

        if (staffLookup && staffLookup.length > 0) {
            // Deduplicate by STF_NUMBER
            const byStfNumber = new Map();
            for (const staff of staffLookup) {
                byStfNumber.set(staff.STF_NUMBER, staff); // last occurrence kept, as in Java
            }
            updatedStaffLookup = Array.from(byStfNumber.values());

            // Sort by STF_NUMBER (ascending)
            updatedStaffLookup.sort((a, b) => {
                // If STF_NUMBER is string, use localeCompare; if number, use subtraction
                return String(a.STF_NUMBER).localeCompare(String(b.STF_NUMBER));
                // If STF_NUMBER is always a number: a.STF_NUMBER - b.STF_NUMBER
            });
        }



        return updatedStaffLookup;




    } catch (err) {
        // If there is a global error, rethrow or return as per your CAP error handling
        throw err;
    }
}


module.exports = {
    fetchCaStaffLookup
}