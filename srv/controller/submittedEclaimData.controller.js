const { ApplicationConstants, MessageConstants } = require("../util/constant");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const { ApplicationException } = require("../util/customErrors");
const CommonRepo = require("../repository/util.repo");
const CommonUtils = require("../util/commonUtil");
const UserUtil = require("../util/userUtil");

/**
 * Controller for fetching submitted eclaim data
 * @param {Object} request - The request object containing claimType, ulu, fdlu, period, staffId
 */
async function fetchSubmittedEclaimData(request) {
    let oResponse = {};
    try {
        const { claimType, ulu, fdlu, period, staffId } = request.data;

        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);

        if (!userName) {
            throw new Error("User not found..!!");
        }

        const aSubmittedData = await isSubmittedExists(claimType, ulu, fdlu, period, staffId, userInfoDetails);
        oResponse.claimDataResponse = aSubmittedData;
        oResponse.error = false;
        oResponse.message = "Submitted eclaims data for the provided inputs.";
        oResponse.ignoreError = false;

        return oResponse;
    } catch (err) {
        oResponse.error = true;
        oResponse.ignoreError = false;
        oResponse.message = err.message || 'Application error';

        throw new ApplicationException({
            error: true,
            ...oResponse,
        });
    }
}

/**
 * Checks if submitted eclaim data exists for the given parameters
 * @param {string} claimCode - The claim type code
 * @param {string} ulu - Unit Level Unit code
 * @param {string} fdlu - Faculty Department Level Unit code
 * @param {string} period - Time period in MM-YYYY format
 * @param {string} staffId - Staff identifier
 * @param {Object} userInfoDetails - User information details
 * @returns {Promise<Object>} Submitted eclaim data response
 */
async function isSubmittedExists(claimCode, ulu, fdlu, period, staffId, userInfoDetails) {
    const oSubmittedResp = {};

    // 1. Validate input params
    validateInputParams(claimCode, ulu, fdlu, period, staffId);

    // 2. Parse period
    const [month, year] = period.split(ApplicationConstants.HYPHEN);

    // 3. Fetch Submitted EclaimsData (status = "02" for submitted)
    const eclaimsData = await EclaimsHeaderDataRepo.fetchSubmittedStatusEclaimsData(
        ulu, fdlu, claimCode, month, year, staffId, userInfoDetails.NUSNET_ID
    );

    const eclaimsDataResDtoList = [];
    if (Array.isArray(eclaimsData) && eclaimsData.length > 0) {
        for (const submittedData of eclaimsData) {
            if (submittedData) {
                // Copy basic fields
                const eclaimsDataResDto = { ...submittedData };

                // 4. Fetch item data for each submitted claim
                const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(submittedData.DRAFT_ID);
                const eclaimsItemsRes = [];
                if (Array.isArray(savedEclaimsItemData) && savedEclaimsItemData.length > 0) {
                    for (const itemData of savedEclaimsItemData) {
                        // Copy fields
                        const eclaimsItemDataResDto = { ...itemData };
                        eclaimsItemsRes.push(eclaimsItemDataResDto);
                    }
                }
                eclaimsDataResDto.EclaimsItemDataDetails = eclaimsItemsRes;
                eclaimsDataResDtoList.push(eclaimsDataResDto);
            }
        }
    }

    oSubmittedResp.eclaimsData = eclaimsDataResDtoList;
    return oSubmittedResp;
}

/**
 * Validates input parameters
 * @param {string} claimCode - The claim type code
 * @param {string} ulu - Unit Level Unit code
 * @param {string} fdlu - Faculty Department Level Unit code
 * @param {string} period - Time period
 * @param {string} staffId - Staff identifier
 */
function validateInputParams(claimCode, ulu, fdlu, period, staffId) {
    if (!claimCode || !ulu || !fdlu || !period || !staffId) {
        throw new ApplicationException("Missing required parameters: claimType, ulu, fdlu, period, staffId");
    }

    // Validate period format (MM-YYYY)
    const periodRegex = /^\d{2}-\d{4}$/;
    if (!periodRegex.test(period)) {
        throw new ApplicationException("Invalid period format. Expected format: MM-YYYY");
    }
}

module.exports = {
    fetchSubmittedEclaimData
};
