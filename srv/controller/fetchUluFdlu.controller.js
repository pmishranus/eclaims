const AppConfigRepo = require("../repository/appConfig.repo");
const CommonRepo = require("../repository/util.repo");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ChrsUluFdluRepo = require("../repository/chrsUluFdlu.repo");
const UserUtil = require("../util/userUtil");
const { ApplicationException } = require("../util/customErrors");

/**
 * Fetches ULU/FDLU details for the given user and parameters
 * @param {object} request - The request object containing claimType, userGroup, and period
 * @returns {Promise<object>} The response object with ULU/FDLU details
 */
async function fetchUluFdlu(request) {
    console.log("FetchUluFdluController fetchUluFdlu start()");

    const responseDto = {
        message: "",
        ULU_FDLU: [],
        NUSNET_ID: "",
        error: false
    };

    try {
        // Extract and validate request parameters
        const { claimType, userGroup, period } = request.data;

        if (!claimType || !period || !userGroup) {
            const errorMsg = "Please provide valid input params - ClaimType/Period/UserGroup";
            console.error("Validation error in fetchUluFdlu:", errorMsg);
            request.reject(400, errorMsg);
            return;
        }

        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();

        console.log(`Processing request for user: ${userName}, claimType: ${claimType}, userGroup: ${userGroup}, period: ${period}`);

        // Fetch user information
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!userInfoDetails) {
            const errorMsg = `User not found for NUSNET_ID: ${upperNusNetId}`;
            console.error("User not found error:", errorMsg);
            throw new ApplicationException(errorMsg);
        }

        console.log(`User details fetched successfully for NUSNET_ID: ${userInfoDetails.NUSNET_ID}`);

        // Fetch job information
        let oChrsJobInfo;
        try {
            oChrsJobInfo = await ChrsJobInfoRepo.retrieveJobInfoDetails(userInfoDetails.NUSNET_ID);
            console.log("Job info retrieved successfully");
        } catch (jobInfoError) {
            console.error("Error fetching job info:", jobInfoError);
            throw new ApplicationException(`Failed to retrieve job information for user: ${userName}. Error: ${jobInfoError.message}`);
        }

        // Fetch ULU/FDLU details
        let uluFdluResponse = [];
        if (oChrsJobInfo && !CommonUtils.isEmptyObject(oChrsJobInfo)) {
            try {
                uluFdluResponse = await ChrsUluFdluRepo.fetchCAUluFdluDetails(oChrsJobInfo.STF_NUMBER, userGroup, claimType);
                console.log(`ULU/FDLU details fetched successfully. Count: ${uluFdluResponse.length}`);
            } catch (uluFdluError) {
                console.error("Error fetching ULU/FDLU details:", uluFdluError);
                throw new ApplicationException(`Failed to retrieve ULU/FDLU details for STF_NUMBER: ${oChrsJobInfo.STF_NUMBER}, userGroup: ${userGroup}, claimType: ${claimType}. Error: ${uluFdluError.message}`);
            }
        } else {
            console.warn(`No job information found for user: ${userName}, NUSNET_ID: ${userInfoDetails.NUSNET_ID}`);
        }

        // Prepare success response
        responseDto.message = "ULU/FDLU details fetched successfully";
        responseDto.ULU_FDLU = uluFdluResponse;
        responseDto.NUSNET_ID = userInfoDetails.NUSNET_ID;
        responseDto.error = false;

        console.log("FetchUluFdluController fetchUluFdlu end()");
        return responseDto;

    } catch (error) {
        console.error("Exception in fetchUluFdlu:", error);

        // Handle specific error types
        if (error instanceof ApplicationException) {
            responseDto.error = true;
            responseDto.message = error.message;
        } else if (error.message && error.message.includes("User not found")) {
            responseDto.error = true;
            responseDto.message = "User not found or invalid user credentials";
        } else if (error.message && error.message.includes("database")) {
            responseDto.error = true;
            responseDto.message = "Database connection error. Please try again later.";
        } else {
            responseDto.error = true;
            responseDto.message = error.message || "An unexpected error occurred while fetching ULU/FDLU details";
        }

        console.error("Error response in fetchUluFdlu:", responseDto);
        return responseDto;
    }
}

module.exports = {
    fetchUluFdlu,
};
