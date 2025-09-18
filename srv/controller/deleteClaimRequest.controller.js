const cds = require("@sap/cds");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const ProcessDetailsRepo = require("../repository/processDetails.repo");
const { ApplicationException } = require("../util/customErrors");
const CommonRepo = require("../repository/util.repo");
const UserUtil = require("../util/userUtil");
const DateUtils = require("../util/dateUtil");

/**
 * Controller for deleting claim requests (draft deletion)
 * @param {object} request - The request object containing array of RequestDto objects
 */
async function deleteClaimRequest(request) {
    let oResponse = {};
    try {
        const { inputRequest } = request.data;

        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);

        if (!userName) {
            throw new Error("User not found..!!");
        }

        if (!inputRequest || !Array.isArray(inputRequest) || inputRequest.length === 0) {
            throw new ApplicationException("Input request array is required and cannot be empty");
        }

        // Perform the purge operation with isDraft = true
        const result = await purgeClaimRequest(inputRequest, true, userInfoDetails);

        oResponse.error = false;
        oResponse.message = "Draft deleted successfully.";
        oResponse.result = result;

        return oResponse;
    } catch (err) {
        oResponse.error = true;
        oResponse.message = err.message || 'Application error';

        throw new ApplicationException({
            error: true,
            ...oResponse,
        });
    }
}

/**
 * Purges claim requests based on input request array
 * @param {Array} inputRequest - Array of RequestDto objects
 * @param {boolean} isDraft - Whether this is for draft deletion (true) or clear request deletion (false)
 * @param {object} userInfoDetails - User information details
 * @returns {Promise<object>} Purge operation result
 */
async function purgeClaimRequest(inputRequest, isDraft, userInfoDetails) {
    const tx = cds.transaction();

    try {
        let deletedClaims = 0;
        let deletedItems = 0;
        let deletedProcesses = 0;
        const currentDate = new Date();
        const currentDateStr = DateUtils.formatDateAsString(currentDate, 'yyyy-MM-dd');

        // Process each request in the input array
        for (const requestDto of inputRequest) {
            if (!requestDto.DRAFT_ID && !requestDto.REQUEST_ID) {
                continue; // Skip if no valid identifier
            }

            const draftId = requestDto.DRAFT_ID;
            const requestId = requestDto.REQUEST_ID;

            // If we have a draft ID, delete by draft ID
            if (draftId) {
                // Delete associated eclaims items first (foreign key constraint)
                const itemDeleteResult = await EclaimsItemDataRepo.softDeleteByDraftId(
                    tx,
                    draftId,
                    userInfoDetails.STAFF_ID,
                    currentDateStr
                );

                if (itemDeleteResult) {
                    deletedItems++;
                }

                // Delete the eclaims header data
                const claimDeleteResult = await EclaimsHeaderDataRepo.softDeleteByDraftId(
                    tx,
                    draftId,
                    userInfoDetails.STAFF_ID,
                    currentDateStr
                );

                if (claimDeleteResult) {
                    deletedClaims++;
                }

                // Delete associated process details
                const processDeleteResult = await ProcessDetailsRepo.softDeleteByReferenceId(
                    tx,
                    draftId,
                    userInfoDetails.STAFF_ID,
                    currentDateStr
                );

                if (processDeleteResult) {
                    deletedProcesses++;
                }
            }

            // If we have a request ID and no draft ID, try to find and delete by request ID
            if (requestId && !draftId) {
                // Find the draft ID by request ID
                const headerData = await EclaimsHeaderDataRepo.fetchByRequestId(requestId);
                if (headerData && headerData.DRAFT_ID) {
                    // Delete associated eclaims items first
                    const itemDeleteResult = await EclaimsItemDataRepo.softDeleteByDraftId(
                        tx,
                        headerData.DRAFT_ID,
                        userInfoDetails.STAFF_ID,
                        currentDateStr
                    );

                    if (itemDeleteResult) {
                        deletedItems++;
                    }

                    // Delete the eclaims header data
                    const claimDeleteResult = await EclaimsHeaderDataRepo.softDeleteByDraftId(
                        tx,
                        headerData.DRAFT_ID,
                        userInfoDetails.STAFF_ID,
                        currentDateStr
                    );

                    if (claimDeleteResult) {
                        deletedClaims++;
                    }

                    // Delete associated process details
                    const processDeleteResult = await ProcessDetailsRepo.softDeleteByReferenceId(
                        tx,
                        headerData.DRAFT_ID,
                        userInfoDetails.STAFF_ID,
                        currentDateStr
                    );

                    if (processDeleteResult) {
                        deletedProcesses++;
                    }
                }
            }
        }

        await tx.commit();

        return {
            deletedClaims,
            deletedItems,
            deletedProcesses,
            message: `Successfully deleted ${deletedClaims} claims, ${deletedItems} items, and ${deletedProcesses} processes`
        };

    } catch (error) {
        await tx.rollback();
        throw new ApplicationException(`Error purging claim requests: ${error.message}`);
    }
}

module.exports = {
    deleteClaimRequest,
    purgeClaimRequest
};
