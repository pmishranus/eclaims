const ChrsCostDistRepo = require("../repository/chrsCostDist.repo");
const CommonRepo = require("../repository/util.repo");
const ApproverMatrixRepo = require("../repository/approverMatrix.repo");
const { ApplicationConstants } = require("../util/constant");
const CommonUtils = require("../util/commonUtil");
const ElligibleCriteriaRepo = require("../repository/eligibilityCriteria.repo");
const { ApplicationException } = require("../util/customErrors");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
/**
 *
 * @param request
 */
async function fetchClaimantStaffInfo(request) {
    let oResClaimantStaffInfo = {}
    try {
        const tx = cds.tx(request);
        const user = request.user.id;
        const { username } = request.data;
        // const userName = "PTT_CA1";
        const upperNusNetId = username.toUpperCase();
        let userInfoDetails = await CommonRepo.fetchUserInfo(upperNusNetId);
        if (!username) {
            throw new Error("User not found..!!");
        }

        let staffInfoDetails = await fetchStaffInfoDetails(upperNusNetId)
        oResClaimantStaffInfo.isError = "false";
        oResClaimantStaffInfo.message = "Staff info fetched successfully.";
        oResClaimantStaffInfo.staffInfo = staffInfoDetails;
        return oResClaimantStaffInfo;
    } catch (err) {
        // If there is a global error, rethrow or return as per your CAP error handling
        oResClaimantStaffInfo.isError = true;
        oResClaimantStaffInfo.message = err.message || 'Application error';
        request.reject(400, {
            error: true,
            message: err.Message,
            ...oResClaimantStaffInfo,
        });
    }
}

async function fetchStaffInfoDetails(nusNetId) {
    let eclaimsJwtResponseDto = {};
    try {
        // Main assignment details
        eclaimsJwtResponseDto = await fetchClaimantAssignmentDtls(nusNetId);

        // Fetch approval matrix and mapping to ClaimAuthorizations
        const approvalMatrixList = await ApproverMatrixRepo.fetchAuthDetails(nusNetId);
        const inboxApprovalMatrixList = await ApproverMatrixRepo.fetchInboxApproverMatrix(nusNetId);

        // claimAuthorizations
        const authorizationList = Array.isArray(approvalMatrixList)
            ? approvalMatrixList.map(eam => ({
                ULU_C: eam.ULU_C,
                FDLU_C: eam.FDLU_C,
                ULU_T: eam.ULU_T,
                FDLU_T: eam.FDLU_T,
                STAFF_USER_GRP: eam.STAFF_USER_GRP,
                VALID_FROM: eam.VALID_FROM,
                VALID_TO: eam.VALID_TO,
            }))
            : [];

        eclaimsJwtResponseDto.claimAuthorizations = authorizationList;

        // approverMatrix
        const approverMatrixList = Array.isArray(approvalMatrixList)
            ? approvalMatrixList.map(eam => ({
                PROCESS_CODE: eam.PROCESS_CODE,
                STF_NUMBER: eam.STAFF_ID,
                ULU_C: eam.ULU_C,
                FDLU_C: eam.FDLU_C,
                ULU_T: eam.ULU_T,
                FDLU_T: eam.FDLU_T,
                STAFF_USER_GRP: eam.STAFF_USER_GRP,
                VALID_FROM: eam.VALID_FROM,
                VALID_TO: eam.VALID_TO,
            }))
            : [];

        eclaimsJwtResponseDto.approverMatrix = approverMatrixList;

        // inboxApproverMatrix
        const inboxApproverMatrix = Array.isArray(inboxApprovalMatrixList)
            ? inboxApprovalMatrixList.map(eam => ({
                PROCESS_CODE: eam.PROCESS_CODE,
                STF_NUMBER: eam.STAFF_ID,
                ULU_C: eam.ULU_C,
                FDLU_C: eam.FDLU_C,
                // Uncomment if needed:
                // ULU_T: eam.ULU_T,
                // FDLU_T: eam.FDLU_T,
                STAFF_USER_GRP: eam.STAFF_USER_GRP,
                VALID_FROM: eam.VALID_FROM,
                VALID_TO: eam.VALID_TO,
            }))
            : [];

        eclaimsJwtResponseDto.inboxApproverMatrix = inboxApproverMatrix;
    } catch (exception) {
        throw new ApplicationException(exception.message || exception);
    }
    return eclaimsJwtResponseDto;
}


async function fetchClaimantAssignmentDtls(staffId) {
    const eclaimsJwtResponseDto = {};
    const staffInfo = await ChrsJobInfoRepo.fetchStaffInfoDetails(staffId);
    if (Array.isArray(staffInfo) && staffInfo.length > 0) {
        const otherAssignments = [];
        let uluC = null, fdluC = null;

        for (const jobInfoDtls of staffInfo) {
            // Set main info (overwritten repeatedly, as in Java)
            eclaimsJwtResponseDto.FULL_NM = jobInfoDtls.FULL_NM;
            eclaimsJwtResponseDto.EMAIL = jobInfoDtls.EMAIL;
            eclaimsJwtResponseDto.FIRST_NM = jobInfoDtls.FIRST_NM;
            eclaimsJwtResponseDto.LAST_NM = jobInfoDtls.LAST_NM;

            if (CommonUtils.isBlank(eclaimsJwtResponseDto.BANK_INFO_FLG))
                eclaimsJwtResponseDto.BANK_INFO_FLG = ApplicationConstants.N;

            if (CommonUtils.isBlank(eclaimsJwtResponseDto.COST_DIST_FLG)) {
                eclaimsJwtResponseDto.COST_DIST_FLG = ApplicationConstants.N;
                const costDistDetails = await ChrsCostDistRepo.fetchCostDistDetails(
                    staffId,
                    jobInfoDtls.START_DATE,
                    jobInfoDtls.END_DATE
                );
                if (Array.isArray(costDistDetails) && costDistDetails.length > 0) {
                    for (const chrsCostDist of costDistDetails) {
                        if (
                            CommonUtils.isNotBlank(chrsCostDist.COST_DIST_FLG) &&
                            CommonUtils.equalsIgnoreCase(chrsCostDist.COST_DIST_FLG, ApplicationConstants.X)
              ) {
                            eclaimsJwtResponseDto.COST_DIST_FLG = ApplicationConstants.Y;
                        }
                    }
                }
            }

            const isPrimary = CommonUtils.equalsIgnoreCase(jobInfoDtls.STF_NUMBER, staffId);

            if (isPrimary) {
                if (
                    !eclaimsJwtResponseDto.PrimaryAssignment ||
                    CommonUtils.isBlank(eclaimsJwtResponseDto.PrimaryAssignment.STF_NUMBER)
                ) {
                    const staffInfoDto = frameAssignmentDetails(jobInfoDtls);

                    if (
                        CommonUtils.isNotBlank(jobInfoDtls.BANK_INFO_FLG) &&
                        CommonUtils.equalsIgnoreCase(jobInfoDtls.BANK_INFO_FLG, ApplicationConstants.X)
                    )
                        eclaimsJwtResponseDto.BANK_INFO_FLG = ApplicationConstants.Y;

                    uluC = staffInfoDto.ULU_C;
                    fdluC = staffInfoDto.FDLU_C;
                    eclaimsJwtResponseDto.PrimaryAssignment = staffInfoDto;
                } else {
                    const otherAssignment = frameAssignmentDetails(jobInfoDtls);

                    if (
                        CommonUtils.isNotBlank(jobInfoDtls.BANK_INFO_FLG) &&
                        CommonUtils.equalsIgnoreCase(jobInfoDtls.BANK_INFO_FLG, ApplicationConstants.X)
                    )
                        eclaimsJwtResponseDto.BANK_INFO_FLG = ApplicationConstants.Y;

                    otherAssignment.DuplicateUluFdlu = ApplicationConstants.N;
                    if (
                        CommonUtils.isNotBlank(uluC) && CommonUtils.isNotBlank(fdluC) &&
                        CommonUtils.equalsIgnoreCase(uluC, otherAssignment.ULU_C) &&
                        CommonUtils.equalsIgnoreCase(fdluC, otherAssignment.FDLU_C)
                    )
                        otherAssignment.DuplicateUluFdlu = ApplicationConstants.Y;

                    otherAssignments.push(otherAssignment);
                }
            } else {
                const otherAssignment = frameAssignmentDetails(jobInfoDtls);

                if (
                    CommonUtils.isNotBlank(jobInfoDtls.BANK_INFO_FLG) &&
                    CommonUtils.equalsIgnoreCase(jobInfoDtls.BANK_INFO_FLG, ApplicationConstants.X)
                )
                    eclaimsJwtResponseDto.BANK_INFO_FLG = ApplicationConstants.Y;

                otherAssignment.DuplicateUluFdlu = ApplicationConstants.N;
                if (
                    CommonUtils.isNotBlank(uluC) && CommonUtils.isNotBlank(fdluC) &&
                    CommonUtils.equalsIgnoreCase(uluC, otherAssignment.ULU_C) &&
                    CommonUtils.equalsIgnoreCase(fdluC, otherAssignment.FDLU_C)
                )
                    otherAssignment.DuplicateUluFdlu = ApplicationConstants.Y;

                otherAssignments.push(otherAssignment);
            }
        }
        eclaimsJwtResponseDto.OtherAssignments = otherAssignments;
    }
    return eclaimsJwtResponseDto;
}

/**
 * Frames the primary or other assignment details as a JS object.
 * @param {object} jobInfoDtls - The job info object (from DB)
 * @returns {object} assignmentDetails
 */
function frameAssignmentDetails(jobInfoDtls) {
    // Handle the nested 'ChrsJobInfoId' object if present
    // const id = jobInfoDtls.CHR_JOB_INFO_ID || jobInfoDtls.chrsJobInfoId || {};

    return {
        STF_NUMBER: jobInfoDtls.STF_NUMBER,
        SF_STF_NUMBER: jobInfoDtls.SF_STF_NUMBER,
        ULU_C: jobInfoDtls.ULU_C,
        ULU_T: jobInfoDtls.ULU_T,
        FDLU_C: jobInfoDtls.FDLU_C,
        FDLU_T: jobInfoDtls.FDLU_T,
        JOIN_DATE: jobInfoDtls.JOIN_DATE,
        PAYSCALE_GRP_C: jobInfoDtls.PAYSCALE_GRP_C,
        PAYSCALE_GRP_T: jobInfoDtls.PAYSCALE_GRP_T,
        JOB_LVL_C: jobInfoDtls.JOB_LVL_C,
        JOB_LVL_T: jobInfoDtls.JOB_LVL_T,
        JOB_GRD_C: jobInfoDtls.JOB_GRD_C,
        JOB_GRD_T: jobInfoDtls.JOB_GRD_T,
        NUSNET_ID: jobInfoDtls.NUSNET_ID,
        START_DATE: jobInfoDtls.START_DATE,
        END_DATE: jobInfoDtls.END_DATE
    };
}




module.exports = {
    fetchClaimantStaffInfo,
};
