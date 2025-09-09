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
 * Controller for clearing/deleting claims by process code
 * @param {Object} request - The request object containing processCode
 */
async function clearRequestsByProcessCode(request) {
    let oResponse = {};
    try {
        const { processCode } = request.data;

        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        const upperNusNetId = userName.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);

        if (!userName) {
            throw new Error("User not found..!!");
        }

        if (!processCode) {
            throw new ApplicationException("Process code is required");
        }

        // Perform the purge operation
        const result = await purgeClaimsByProcess(processCode, userInfoDetails);

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
 * Purges claims by process code
 * @param {string} processCode - The process code to purge claims for
 * @param {Object} userInfoDetails - User information details
 * @returns {Promise<Object>} Purge operation result
 */
async function purgeClaimsByProcess(processCode, userInfoDetails) {
    const tx = cds.transaction();

    try {
        // 1. Find all process instances with the given process code
        const processInstances = await ProcessDetailsRepo.fetchProcessInstancesByProcessCode(processCode);

        if (!processInstances || processInstances.length === 0) {
            return {
                deletedProcesses: 0,
                deletedClaims: 0,
                deletedItems: 0,
                message: "No processes found with the given process code"
            };
        }

        let deletedProcesses = 0;
        let deletedClaims = 0;
        let deletedItems = 0;
        const currentDate = new Date();

        // 2. For each process instance, delete associated claims and items
        for (const processInstance of processInstances) {
            const referenceId = processInstance.REFERENCE_ID;

            if (referenceId) {
                // Delete associated eclaims items first (foreign key constraint)
                const itemDeleteResult = await EclaimsItemDataRepo.softDeleteByDraftId(
                    tx,
                    referenceId,
                    userInfoDetails.STAFF_ID,
                    DateUtils.formatDateAsString(currentDate, 'yyyy-MM-dd')
                );

                if (itemDeleteResult) {
                    deletedItems++;
                }

                // Delete the eclaims header data
                const claimDeleteResult = await EclaimsHeaderDataRepo.softDeleteByDraftId(
                    tx,
                    referenceId,
                    userInfoDetails.STAFF_ID,
                    DateUtils.formatDateAsString(currentDate, 'yyyy-MM-dd')
                );

                if (claimDeleteResult) {
                    deletedClaims++;
                }
            }

            // Delete the process instance itself
            const processDeleteResult = await ProcessDetailsRepo.softDeleteByProcessInstId(
                tx,
                processInstance.PROCESS_INST_ID,
                userInfoDetails.STAFF_ID,
                DateUtils.formatDateAsString(currentDate, 'yyyy-MM-dd')
            );

            if (processDeleteResult) {
                deletedProcesses++;
            }
        }

        await tx.commit();

        return {
            deletedProcesses,
            deletedClaims,
            deletedItems,
            message: `Successfully deleted ${deletedProcesses} processes, ${deletedClaims} claims, and ${deletedItems} items`
        };

    } catch (error) {
        await tx.rollback();
        throw new ApplicationException(`Error purging claims by process code: ${error.message}`);
    }
}

module.exports = {
    clearRequestsByProcessCode
};
