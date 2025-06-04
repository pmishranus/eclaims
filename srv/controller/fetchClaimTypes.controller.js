
const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const ApproverMatrixRepo = require("../repository/approverMatrix.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ElligibleCriteriaRepo = require("../repository/eligibilityCriteria.repo");

async function fetchClaimTypes(request) {
    let approveTasksRes = [];
    try {
        const tx = cds.tx(request);
        const user = request.user.id;
        const { staffId, userGroup } = request.data
        const userName = "PTT_CA1";
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }


        console.log("EligibilityCriteriaServiceImpl fetchClaimTypes start()");

        if (!staffId || staffId.trim() === '') {
            req.reject(400, "StaffId passed is Empty/Null. Please provide valid staffId");
            return;
        }
        if (!userGroup || userGroup.trim() === '') {
            req.reject(400, "UserGroup passed is Empty/Null. Please provide valid userGroup");
            return;
        }

        let results = [];
        let skip = false;

        if (CommonUtils.equalsIgnoreCase(userGroup, ApplicationConstants.ESS_MONTH)) {
            const eclaimsResults = await ElligibleCriteriaRepo.fetchClaimTypes(staffId);
            const cwResults = await ElligibleCriteriaRepo.fetchClaimTypesForCw(staffId);
            results = [...eclaimsResults, ...cwResults];
            skip = true;
        } else {
            results = await ApproverMatrixRepo.fetchCAClaimTypes(staffId);
        }

        let response = [];

        if (results && results.length > 0) {
            if (!skip) {
                // Deduplicate by CLAIM_TYPE_C
                const seen = new Set();
                response = results.filter(item => {
                    if (seen.has(item.CLAIM_TYPE_C)) return false;
                    seen.add(item.CLAIM_TYPE_C);
                    return true;
                });
            } else {
                response = results;
            }

            if (response && response.length > 0) {
                for (const eligibleClaims of response) {
                    const configList = await AppConfigRepo.fetchByConfigKeyAndProcessCode(
                        userGroup, eligibleClaims.CLAIM_TYPE_C
                    );
                    if (configList && configList.length > 0) {
                        eligibleClaims.PAST_MONTHS = configList[0].CONFIG_VALUE;
                    } else {
                        eligibleClaims.PAST_MONTHS = "";
                    }
                }
            }
        }

        console.log("EligibilityCriteriaServiceImpl fetchClaimTypes end()");
        return response;




    } catch (err) {
        // If there is a global error, rethrow or return as per your CAP error handling
        throw err;
    }
}

module.exports = {
    fetchClaimTypes
}