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
    try {
        const { claimType, userGroup, period } = request.data;
        const userName = "OT_CA1";
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }

        console.log("EligibilityCriteriaServiceImpl fetchUluFdlu start()");

        if (!claimType || !period || !userGroup) {
            request.reject(400, "Please provide valid input params - ClaimType/Period/UserGroup");
            return;
        }

        // Parallelize job info and CA ULU/FDLU fetch
        const [oChrsJobInfo] = await Promise.all([
            ChrsJobInfoRepo.retrieveJobInfoDetails(userInfoDetails.NUSNET_ID)
        ]);

        let response = [];
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
        throw err;
    }
}

module.exports = {
    fetchUluFdlu,
};
