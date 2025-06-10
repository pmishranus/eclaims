const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ChrsUluFdluRepo = require("../repository/chrsUluFdlu.repo");

/**
 *
 * @param request
 */
async function fetchUluFdlu(request) {
    let approveTasksRes = [];
    try {
        // const tx = cds.tx(request);
        const user = request.user.id;
        const { claimType, userGroup, period } = request.data;
        const userName = "OT_CA1";
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }

        console.log("EligibilityCriteriaServiceImpl fetchUluFdlu start()");

        if (!claimType || !period || !userGroup) {
            req.reject(400, "Please provide valid input params - ClaimType/Period/UserGroup");
            return;
        }

        let oChrsJobInfo = await ChrsJobInfoRepo.retrieveJobInfoDetails(userInfoDetails.NUSNET_ID);

        var response = [];
        if (oChrsJobInfo && !CommonUtils.isEmptyObject(oChrsJobInfo)) {
            response = await ChrsUluFdluRepo.fetchCAUluFdluDetails(oChrsJobInfo.STF_NUMBER, userGroup, claimType);
        }

        let oResponse = {
            message: "User Details fetched successfully",
            ULU_FDLU: response,
            NUSNET_ID: userInfoDetails.NUSNET_ID,
        };

        console.log("EligibilityCriteriaServiceImpl fetchUluFdlu end()");
        return oResponse;
    } catch (err) {
        // If there is a global error, rethrow or return as per your CAP error handling
        throw err;
    }
}

module.exports = {
    fetchUluFdlu,
};
