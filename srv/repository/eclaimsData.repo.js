const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
async function fetchClaimStatusCountById(staffId, statusCode) {
    // const queryParameter = ` ehd.STAFF_ID = '${staffId} and ehd.REQUEST_STATUS IN '${statusCode}' and ehd.CLAIM_TYPE <> '105' `;
    let fetchClaimStatusCountById = await cds.run(
        SELECT
            .from(' NUSEXT_ECLAIMS_HEADER_DATA as ehd')
            .where({
                STAFF_ID: staffId,
                REQUEST_STATUS: {
                    in: statusCode
                },
                CLAIM_TYPE: {
                    '!=': '105'
                }
            }));
    return fetchClaimStatusCountById;
}
async function fetchClaimStatusCount(staffId, statusCode) {
    // const queryParameter = ` ehd.SUBMITTED_BY = '${staffId} and ehd.REQUEST_STATUS IN '${statusCode}' and ehd.CLAIM_TYPE <> '105' `;
    let fetchClaimStatusCountById = await cds.run(
        SELECT
            .from('NUSEXT_ECLAIMS_HEADER_DATA')
            .where({
                SUBMITTED_BY: staffId,
                REQUEST_STATUS: {
                    in: statusCode
                },
                CLAIM_TYPE: {
                    '!=': '105'
                }
            }));
    return fetchClaimStatusCountById;
}
async function fetchPendingCAStatusCount(staffId, status) {
    let query = ` SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE ULU IN ( SELECT ULU FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX WHERE STAFF_ID = '${staffId}' `
        + " AND VALID_FROM <= CURRENT_DATE AND VALID_TO  >= CURRENT_DATE AND IS_DELETED='N' AND STAFF_USER_GRP = 'CLAIM_ASSISTANT') AND FDLU IN ( SELECT u.FDLU_C FROM"
        + ` NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u WHERE STAFF_ID = '${staffId}' AND am.ULU = u.ULU_C and u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END `
        + ` AND  VALID_FROM <= CURRENT_DATE and VALID_TO >= CURRENT_DATE AND IS_DELETED='N' AND am.STAFF_USER_GRP = 'CLAIM_ASSISTANT') AND REQUEST_STATUS IN ('${status}') AND SUBMITTED_BY <> '${staffId}' AND `
        + ` STAFF_ID <> '${staffId}' AND CLAIM_TYPE <> '105' `;
    let fetchPendingCAStatusCount = await cds.run(query);
    return fetchPendingCAStatusCount;
}
async function fetchCAStatusCountForDraft(staffId, status) {
    let query = ` SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE ULU IN ( SELECT ULU FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX WHERE STAFF_ID = '${staffId}' `
        + " AND VALID_FROM <= CURRENT_DATE AND VALID_TO  >= CURRENT_DATE AND IS_DELETED='N' AND STAFF_USER_GRP = 'CLAIM_ASSISTANT') AND FDLU IN ( SELECT u.FDLU_C FROM"
        + ` NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u WHERE STAFF_ID = '${staffId}' AND am.ULU = u.ULU_C and u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END `
        + ` AND  VALID_FROM <= CURRENT_DATE and VALID_TO >= CURRENT_DATE AND IS_DELETED='N' AND am.STAFF_USER_GRP = 'CLAIM_ASSISTANT') AND REQUEST_STATUS IN ('${status}') AND `
        + ` STAFF_ID <> '${staffId}' AND CLAIM_TYPE <> '105' `;
    let fetchCAStatusCountForDraft = await cds.run(query);
    return fetchCAStatusCountForDraft;
}
async function fetchCAStatusCount(staffId, status) {
    let query = ` SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE ULU IN ( SELECT ULU FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX WHERE STAFF_ID = '${staffId}' `
        + " AND VALID_FROM <= CURRENT_DATE AND VALID_TO  >= CURRENT_DATE AND IS_DELETED='N' AND STAFF_USER_GRP = 'CLAIM_ASSISTANT') AND FDLU IN ( SELECT u.FDLU_C FROM"
        + ` NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u WHERE STAFF_ID = '${staffId}' AND am.ULU = u.ULU_C and u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END `
        + ` AND  VALID_FROM <= CURRENT_DATE and VALID_TO >= CURRENT_DATE AND IS_DELETED='N' AND am.STAFF_USER_GRP = 'CLAIM_ASSISTANT') AND REQUEST_STATUS IN ('${status}') AND `
        + ` STAFF_ID <> '${staffId}' AND CLAIM_TYPE <> '105' `;
    let fetchCAStatusCountForDraft = await cds.run(query);
    return fetchCAStatusCountForDraft;
}
async function fetchTbClaimStatusCountById(staffId, statusCode) {
    let query = ` SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE REQUEST_STATUS IN (${statusCode}) AND STAFF_ID = '${staffId}' AND CLAIM_TYPE = '105' `;
    let fetchTbClaimStatusCountById = await cds.run(query);
    return fetchTbClaimStatusCountById;
}
async function fetchTbClaimStatusCount(staffId, statusCode) {
    let query = ` SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE SUBMITTED_BY = '${staffId}' AND REQUEST_STATUS IN (${statusCode}) AND STAFF_ID = '${staffId}' AND CLAIM_TYPE = '105' `;
    let fetchTbClaimStatusCount = await cds.run(query);
    return fetchTbClaimStatusCount;
}
async function fetchByDraftId(draftId) {
    let query = ` SELECT * FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE DRAFT_ID = '${draftId}'`;
    let fetchByDraftId = await cds.run(query);
    return fetchByDraftId;
}
async function fetchRequestId(draftId) {
    let query = ` SELECT REQUEST_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE DRAFT_ID = '${draftId}'`;
    let fetchRequestId = await cds.run(query);
    return fetchRequestId;
}

async function fetchMonthlyClaims(month, year, staffId, claimType) {
    let query = ` SELECT COUNT(REQUEST_ID) FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE WHERE CLAIM_MONTH = '${month}' AND CLAIM_YEAR = '${year}' AND STAFF_ID = '${staffId}' AND CLAIM_TYPE = '${claimType}' AND REQUEST_STATUS NOT IN ('07','08','10','11','12','18','19','20','15','17','16'))`;
    let fetchMonthlyClaims = await cds.run(query);
    return fetchMonthlyClaims;
}

async function fetchMonthlyClaimsOnSubmittedOn(month, year, staffId, claimType,startDate,endDate) {
    let query = ` SELECT COUNT(REQUEST_ID) FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE WHERE CLAIM_MONTH = '${month}' AND CLAIM_YEAR = '${year}' AND TO_DATE(SUBMITTED_ON) >= '${startDate}' AND TO_DATE(SUBMITTED_ON) <= '${endDate}' AND STAFF_ID = '${staffId}' AND CLAIM_TYPE = '${claimType}' AND REQUEST_STATUS NOT IN ('07','08','10','11','12','18','19','20','15','17','16'))`;
    let fetchMonthlyClaimsOnSubmittedOn = await cds.run(query);
    return fetchMonthlyClaimsOnSubmittedOn;
}

module.exports = {
    fetchByDraftId,
    fetchTbClaimStatusCount,
    fetchTbClaimStatusCountById,
    fetchCAStatusCount,
    fetchCAStatusCountForDraft,
    fetchPendingCAStatusCount,
    fetchClaimStatusCount,
    fetchClaimStatusCountById,
    fetchMonthlyClaims,
    fetchMonthlyClaimsOnSubmittedOn,
    fetchRequestId
}