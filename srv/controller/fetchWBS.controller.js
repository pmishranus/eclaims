const { ApplicationConstants, MessageConstants } = require("../util/constant");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const { ApplicationException } = require("../util/customErrors");
const CommonRepo = require("../repository/util.repo");
const CommonUtils = require("../util/commonUtil");
const DateUtils = require("../util/dateUtil");
const UserUtil = require("../util/userUtil");
/**
 *
 * @param request
 */
async function fetchWBS(request) {
    let aWBS = [];
    let oResponse = {};
    try {
        // const tx = cds.tx(request);
        const { claimDate, staffId } = request.data;
        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }

        oResponse.aWBS = await fetchWBSPastThreeMonths(staffId, claimDate);


        return oResponse;
    } catch (err) {
        oResponse.error = true;
        oResponse.ignoreError = false;
        oResponse.message = err.message || 'Application error';
        request.reject(400, {
            error: true,
            message: err.Message,
            ...oResponse,
        });
    }
}

async function fetchWBSPastThreeMonths(staffId, claimDate) {
    // Logger.info('EligibilityCriteriaServiceImpl fetchWBSPastThreeMonths start()');
    let response = [];

    try {
        if (CommonUtils.isNotBlank(staffId) || CommonUtils.isNotBlank(claimDate)) {
            const requestClaimDate = DateUtils.convertStringToDate(claimDate, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT);
            response = await EclaimsHeaderDataRepo.fetchPastThreeMonthsWbs(staffId, requestClaimDate);

            if (response) {
                response = response.filter(w => CommonUtils.isNotBlank(w.WBS));
            }
        } else {
            throw new ApplicationException('Please pass valid staff Id / claimDate');
        }
    } catch (exception) {
        throw new ApplicationException(exception.message);
    }

    // Logger.info('EligibilityCriteriaServiceImpl fetchWBSPastThreeMonths end()');
    return response;
}




module.exports = { fetchWBS }