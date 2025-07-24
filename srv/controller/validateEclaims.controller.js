const CommonRepo = require("../repository/util.repo");
const EclaimService = require("../util/eclaimService");
const CommonUtils = require("../util/commonUtil");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const { ApplicationException, HttpClientErrorException } = require("../util/customErrors");
/**
 *
 * @param request
 */
async function fetchValidateEclaims(request) {
    // Response object
    let uploadResponseDto = {
        claimDataResponse: {},
    };
    try {
        const user = request.user.id;
        // const userName = user.split('@')[0];
        const userName = "PTT_CA9";
        const upperNusNetId = userName.toUpperCase();
        let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);
        if (!userName) {
            throw new Error("User not found..!!");
        }
        let massUploadRequest = request.data.data;

        let responseHeaders = {}; // CAP automatically handles headers, but you can set via req.res.setHeader

        let responseDto = await validateEclaims(massUploadRequest, loggedInUserDetails);

        uploadResponseDto.error = responseDto.error;
        uploadResponseDto.message = responseDto.message;
        uploadResponseDto.claimDataResponse = responseDto.eclaimsData;

        return uploadResponseDto;
    } catch (error) {
        uploadResponseDto.isError = true;
        console.error(error.getErrorInfo());
        if (error instanceof HttpClientErrorException) {
            uploadResponseDto.message = error.statusText;
            // In CAP, you can set HTTP status via request.reject()
            request.reject(error.statusCode, uploadResponseDto.message);
        } else if (error instanceof ApplicationException) {
            console.error("Exception Occurred in validateEclaims:", error.message);
            uploadResponseDto.message = ApplicationConstants.GENERIC_EXCEPTION;
            
            request.reject(400, uploadResponseDto.message);
        } else {
            // Fallback for unhandled errors
            uploadResponseDto.message = "Internal server error";
            request.reject(500, uploadResponseDto.message);
        }
        // return;
    }
}

async function validateEclaims(massUploadRequest, userInfoDetails) {
    try {
        let massUploadResponseDto = { eclaimsData: [], error: false, message: "" };
        let eclaimsDataResDtoList = [];

        let roleFlow = await EclaimService.fetchRole(massUploadRequest); // implement/fetch as needed
        let requestorGroup = "";

        if (massUploadRequest && massUploadRequest.length > 0) {
            for (const item of massUploadRequest) {
                let eclaimsDataResDto = { validationResults: [], ERROR_STATE: false };
                let validationResults = [];

                let savedData = null;
                if (CommonUtils.isNotBlank(item.DRAFT_ID)) {
                    savedData = await EclaimsHeaderDataRepo.fetchByDraftId(item.DRAFT_ID);
                }
                if (savedData) {
                    requestorGroup = savedData.REQUESTOR_GRP;
                }

                if (CommonUtils.isBlank(requestorGroup)) {
                    if (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.ESS)) {
                        requestorGroup = ApplicationConstants.NUS_CHRS_ECLAIMS_ESS;
                    } else {
                        requestorGroup = ApplicationConstants.CLAIM_ASSISTANT;
                    }
                }

                validationResults = await EclaimService.validateEclaimsData(
                    item,
                    roleFlow,
                    requestorGroup,
                    userInfoDetails
                );
                if (validationResults && validationResults.length > 0) {
                    eclaimsDataResDto.validationResults = validationResults;
                    eclaimsDataResDto.ERROR_STATE = true;
                }
                if (eclaimsDataResDto.ERROR_STATE) {
                    massUploadResponseDto.message = MessageConstants.VALIDATION_RESULT_MESSAGE;
                    massUploadResponseDto.error = true;
                }
                eclaimsDataResDtoList.push(eclaimsDataResDto);
            }
        }
        massUploadResponseDto.eclaimsData = eclaimsDataResDtoList;
        return massUploadResponseDto;
    } catch (error) {
        if (error instanceof ApplicationException) {
            throw error;
        } else {
            throw new ApplicationException(error.message);
        }
    }
}

module.exports = {
    fetchValidateEclaims,
};
