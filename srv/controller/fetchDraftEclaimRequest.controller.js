const { ApplicationConstants,MessageConstants } = require("../util/constant");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const {ApplicationException} = require("../util/customErrors");
const CommonRepo = require("../repository/util.repo");
const CommonUtils = require("../util/commonUtil");
/**
 *
 * @param request
 */
async function fetchDraftEclaimRequest(request) {
    let approveTasksRes = [];
    let oResponse = {};
    try {
        // const tx = cds.tx(request);
        const user = request.user.id;
        const { claimType, ulu, fdlu, period, staffId } = request.data;
        const userName = "OT_CA1";
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }

        const aExistingDraft = await isDraftExists(claimType, ulu, fdlu, period, staffId,userInfoDetails);
        oResponse.claimDataResponse = aExistingDraft;
        oResponse.error = false;
        oResponse.message = MessageConstants.ERROR_DRAFT_EXISTS
        oResponse.ignoreError = false;
       
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

/**
 *
 * @param token
 * @param claimCode
 * @param ulu
 * @param fdlu
 * @param period
 * @param staffId
 * @param userInfoDetails
 */
async function isDraftExists(claimCode, ulu, fdlu, period, staffId,userInfoDetails) {
    const oDraftResp = {};
      // 1. Validate input params
      validateInputParams(claimCode, ulu, fdlu, period, staffId);
  
      // 2. Parse period
      const [month, year] = period.split(ApplicationConstants.HYPHEN); // adjust separator if needed
  
      // 3. Fetch EclaimsData (assume returns array of objects)
    //   const nusNetId = fetchNusNetIdFromToken(token);
      const eclaimsData = await EclaimsHeaderDataRepo.fetchDraftStatusEclaimsData(
        ulu, fdlu, claimCode, month, year, staffId, userInfoDetails.NUSNET_ID
      );
  
      const eclaimsDataResDtoList = [];
      if (Array.isArray(eclaimsData) && eclaimsData.length > 0) {
        for (const draftData of eclaimsData) {
          if (draftData) {
            // Copy basic fields (shallow copy or map manually)
            const eclaimsDataResDto = { ...draftData };
  
            // 4. Fetch item data for each draft
            const savedEclaimsItemData = await EclaimsItemDataRepo.fetchByDraftId(draftData.DRAFT_ID);
            const eclaimsItemsRes = [];
            if (Array.isArray(savedEclaimsItemData) && savedEclaimsItemData.length > 0) {
              for (const itemData of savedEclaimsItemData) {
                // Copy fields (shallow copy or map manually)
                const eclaimsItemDataResDto = { ...itemData };
                eclaimsItemsRes.push(eclaimsItemDataResDto);
              }
            }
            eclaimsDataResDto.EclaimsItemDataDetails = eclaimsItemsRes;
            eclaimsDataResDtoList.push(eclaimsDataResDto);
          }
        }
      }
  
      oDraftResp.eclaimsData = eclaimsDataResDtoList;
    return oDraftResp;
  }

  function validateInputParams(claimCode, ulu, fdlu, period, staffId) {
    if (CommonUtils.isBlank(claimCode)) {
      throw new ApplicationException("Claim Type is missing");
    }
    if (CommonUtils.isBlank(ulu)) {
      throw new ApplicationException("ULU is missing");
    }
    if (CommonUtils.isBlank(fdlu)) {
      throw new ApplicationException("FDLU is missing");
    }
    if (CommonUtils.isBlank(period)) {
      throw new ApplicationException("Claim month and Claim year is missing");
    }
    if (!period.includes(ApplicationConstants.HYPHEN)) { // Replace '-' with your ApplicationConstants.HYPHEN if it's not '-'
      throw new ApplicationException("Invalid input for Claim month and Claim year");
    }
    if (CommonUtils.isBlank(staffId)) {
      throw new ApplicationException("StaffId is missing");
    }
  }

module.exports = {
    fetchDraftEclaimRequest,
};
