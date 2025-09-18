const { ApplicationConstants } = require("../util/constant");
const EclaimsDataRepo = require("../repository/eclaimsData.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const ProcessDetailsRepo = require("../repository/processDetails.repo");
const ProcessParticipantRepo = require("../repository/processParticipant.repo");
const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
const UserUtil = require("../util/userUtil");

/**
 * Deletes eclaim requests (draft deletion) - migrated from Java implementation
 * This function replicates the Java purgeClaimRequest method with isDraft=true
 * Uses CAP transactions to ensure atomicity - all deletions succeed or all rollback
 * @param {object} request - The request object containing data array
 * @returns {object} Response object with deletion status and deleted draft IDs
 */
async function deleteEclaimRequest(request) {
    const cds = require("@sap/cds");
    
    // Use CAP transaction for atomicity
    return await cds.tx(request, async (tx) => {
        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        if (!userName) {
            throw new Error("User not found..!!");
        }

        const inputRequest = request.data.data;
        if (!inputRequest || !Array.isArray(inputRequest) || inputRequest.length === 0) {
            throw new Error("Input is not valid.");
        }

        const overAllRequests = [];
        
        // Process each request item and validate all before deletion
        for (const requestDto of inputRequest) {
            let draftId = null;
            let eclaimsData = null;

            if (requestDto.DRAFT_ID) {
                draftId = requestDto.DRAFT_ID;
                // Fetch eclaim data by draft ID using transaction context
                eclaimsData = await EclaimsDataRepo.fetchByDraftId(draftId, tx);
            } else if (requestDto.REQUEST_ID) {
                // Fetch eclaim data by request ID and extract draft ID
                eclaimsData = await EclaimsDataRepo.fetchByRequestId(requestDto.REQUEST_ID);
                if (eclaimsData) {
                    draftId = eclaimsData.DRAFT_ID;
                }
            } else {
                throw new Error("Either DRAFT_ID or REQUEST_ID is required for deletion.");
            }
            
            if (!eclaimsData) {
                throw new Error("Selected Claim(s) doesn't exists.");
            }

            // Check if the request is in draft status (can only delete drafts)
            if (!eclaimsData.REQUEST_STATUS || 
                eclaimsData.REQUEST_STATUS === ApplicationConstants.STATUS_ECLAIMS_DRAFT) {
                overAllRequests.push(draftId);
            } else {
                throw new Error("Claim(s) in draft status can only be deleted.");
            }
        }

        // Perform Deletion Operation only if all requests are valid
        if (overAllRequests.length > 0 && overAllRequests.length === inputRequest.length) {
            // Delete all draft IDs within the same transaction
            for (const draftId of overAllRequests) {
                await performDeletion(draftId, tx, userName);
            }

            // If we reach here, all deletions succeeded
            return {
                error: false,
                message: "Draft deleted successfully.",
                draftIds: overAllRequests
            };
        } else {
            throw new Error("Claim(s) in draft status can only be deleted.");
        }
    });
}

/**
 * Performs the actual deletion of all related records for a draft ID
 * @param {string} draftId - The draft ID to delete
 * @param {object} tx - The transaction context
 * @param {string} userName - The user performing the deletion
 */
async function performDeletion(draftId, tx, userName) {
    try {
        const currentDate = new Date();
        
        // Delete in the same order as Java implementation
        // All operations use the same transaction context for atomicity
        
        // 1. Delete eclaims item data
        // softDeleteByDraftId(tx, draftId, nusNetId, date)
        await EclaimsItemDataRepo.softDeleteByDraftId(tx, draftId, userName, currentDate);
        
        // 2. Delete process participants
        // First fetch PPNT_IDs for this draft, then delete them
        const ppntDetails = await ProcessParticipantRepo.fetchPPNTIdDtls(draftId);
        if (ppntDetails && ppntDetails.length > 0) {
            const ppntIds = ppntDetails.map(item => item.PPNT_ID);
            await ProcessParticipantRepo.softDeleteByPPNTId(tx, ppntIds);
        }
        
        // 3. Delete process details
        // softDeleteByReferenceId(tx, referenceId, modifiedBy, modifiedOn)
        await ProcessDetailsRepo.softDeleteByReferenceId(tx, draftId, userName, currentDate);
        
        // 4. Delete remarks (hard delete)
        await deleteRemarksByDraftIdWithTx(draftId, tx);
        
        // 5. Delete request lock details
        await RequestLockDetailsRepo.deleteByDraftId(draftId, tx);
        
        // 6. Delete task details (if method exists)
        // Note: TaskDetails repository doesn't have delete method in current implementation
        // This may need to be added if required
        
        // 7. Delete attachment references (if repository exists)
        // Note: Attachment repository doesn't exist in current implementation
        // This may need to be added if required
        
        // 8. Finally delete the main eclaims header data
        await deleteEclaimsHeaderData(draftId, tx);
        
    } catch (error) {
        throw new Error(`Failed to delete draft ${draftId}: ${error.message}`);
    }
}

/**
 * Deletes the main eclaims header data
 * @param {string} draftId - The draft ID to delete
 * @param {object} tx - The transaction context
 */
async function deleteEclaimsHeaderData(draftId, tx) {
    const { DELETE } = require("@sap/cds/lib/ql/cds-ql");
    
    const query = DELETE.from("NUSEXT_ECLAIMS_HEADER_DATA").where({ DRAFT_ID: draftId });
    await tx.run(query);
}

/**
 * Deletes remarks by draft ID using transaction context
 * @param {string} draftId - The draft ID
 * @param {object} tx - The transaction context
 */
async function deleteRemarksByDraftIdWithTx(draftId, tx) {
    const query = `DELETE FROM NUSEXT_UTILITY_REMARKS_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    await tx.run(query, values);
}

/**
 * Helper function to fetch draft ID by request ID (if needed in future)
 * Uses existing repository method
 * @param {string} requestId - The request ID
 * @returns {string} The corresponding draft ID
 */
async function fetchDraftIdByRequestId(requestId) {
    const eclaimsData = await EclaimsDataRepo.fetchByRequestId(requestId);
    return eclaimsData ? eclaimsData.DRAFT_ID : null;
}

module.exports = {
    deleteEclaimRequest,
};
