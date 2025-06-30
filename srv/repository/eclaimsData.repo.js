const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { ApplicationConstants } = require("../util/constant");
const DateUtils = require("../util/dateUtil");
/**
 *
 * @param staffId
 * @param statusCode
 */
async function fetchClaimStatusCountById(staffId, statusCode) {
    let fetchClaimStatusCountById = await cds.run(
        SELECT.from(" NUSEXT_ECLAIMS_HEADER_DATA as ehd").where({
            STAFF_ID: staffId,
            REQUEST_STATUS: {
                in: statusCode,
            },
            CLAIM_TYPE: {
                "!=" : "105",
            },
        })
    );
    return fetchClaimStatusCountById;
}
/**
 *
 * @param staffId
 * @param statusCode
 */
async function fetchClaimStatusCount(staffId, statusCode) {
    let fetchClaimStatusCountById = await cds.run(
        SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA").where({
            SUBMITTED_BY: staffId,
            REQUEST_STATUS: {
                in: statusCode,
            },
            CLAIM_TYPE: {
                "!=" : "105",
            },
        })
    );
    return fetchClaimStatusCountById;
}
/**
 *
 * @param staffId
 * @param status
 */
async function fetchPendingCAStatusCount(staffId, status) {
    const query = `
        SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA 
        WHERE ULU IN ( 
            SELECT ULU FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX 
            WHERE STAFF_ID = ? 
            AND VALID_FROM <= CURRENT_DATE 
            AND VALID_TO >= CURRENT_DATE 
            AND IS_DELETED = 'N' 
            AND STAFF_USER_GRP = 'CLAIM_ASSISTANT'
        ) 
        AND FDLU IN ( 
            SELECT u.FDLU_C FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u 
            WHERE STAFF_ID = ? 
            AND am.ULU = u.ULU_C 
            AND u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END 
            AND VALID_FROM <= CURRENT_DATE 
            AND VALID_TO >= CURRENT_DATE 
            AND IS_DELETED = 'N' 
            AND am.STAFF_USER_GRP = 'CLAIM_ASSISTANT'
        ) 
        AND REQUEST_STATUS IN (?) 
        AND SUBMITTED_BY <> ? 
        AND STAFF_ID <> ? 
        AND CLAIM_TYPE <> '105'
    `;
    const values = [staffId, staffId, status, staffId, staffId];
    let fetchPendingCAStatusCount = await cds.run(query, values);
    return fetchPendingCAStatusCount;
}
/**
 *
 * @param staffId
 * @param status
 */
async function fetchCAStatusCountForDraft(staffId, status) {
    const query = `
        SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA 
        WHERE ULU IN ( 
            SELECT ULU FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX 
            WHERE STAFF_ID = ? 
            AND VALID_FROM <= CURRENT_DATE 
            AND VALID_TO >= CURRENT_DATE 
            AND IS_DELETED = 'N' 
            AND STAFF_USER_GRP = 'CLAIM_ASSISTANT'
        ) 
        AND FDLU IN ( 
            SELECT u.FDLU_C FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u 
            WHERE STAFF_ID = ? 
            AND am.ULU = u.ULU_C 
            AND u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END 
            AND VALID_FROM <= CURRENT_DATE 
            AND VALID_TO >= CURRENT_DATE 
            AND IS_DELETED = 'N' 
            AND am.STAFF_USER_GRP = 'CLAIM_ASSISTANT'
        ) 
        AND REQUEST_STATUS IN (?) 
        AND STAFF_ID <> ? 
        AND CLAIM_TYPE <> '105'
    `;
    const values = [staffId, staffId, status, staffId];
    let fetchCAStatusCountForDraft = await cds.run(query, values);
    return fetchCAStatusCountForDraft;
}
/**
 *
 * @param staffId
 * @param status
 */
async function fetchCAStatusCount(staffId, status) {
    const query = `
        SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA 
        WHERE ULU IN ( 
            SELECT ULU FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX 
            WHERE STAFF_ID = ? 
            AND VALID_FROM <= CURRENT_DATE 
            AND VALID_TO >= CURRENT_DATE 
            AND IS_DELETED = 'N' 
            AND STAFF_USER_GRP = 'CLAIM_ASSISTANT'
        ) 
        AND FDLU IN ( 
            SELECT u.FDLU_C FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX am, NUSEXT_MASTER_DATA_CHRS_FDLU_ULU u 
            WHERE STAFF_ID = ? 
            AND am.ULU = u.ULU_C 
            AND u.FDLU_C = CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END 
            AND VALID_FROM <= CURRENT_DATE 
            AND VALID_TO >= CURRENT_DATE 
            AND IS_DELETED = 'N' 
            AND am.STAFF_USER_GRP = 'CLAIM_ASSISTANT'
        ) 
        AND REQUEST_STATUS IN (?) 
        AND STAFF_ID <> ? 
        AND CLAIM_TYPE <> '105'
    `;
    const values = [staffId, staffId, status, staffId];
    let fetchCAStatusCountForDraft = await cds.run(query, values);
    return fetchCAStatusCountForDraft;
}
/**
 *
 * @param staffId
 * @param statusCode
 */
async function fetchTbClaimStatusCountById(staffId, statusCode) {
    const query = `SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE REQUEST_STATUS IN (?) AND STAFF_ID = ? AND CLAIM_TYPE = '105'`;
    const values = [statusCode, staffId];
    let fetchTbClaimStatusCountById = await cds.run(query, values);
    return fetchTbClaimStatusCountById;
}
/**
 *
 * @param staffId
 * @param statusCode
 */
async function fetchTbClaimStatusCount(staffId, statusCode) {
    const query = `SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE SUBMITTED_BY = ? AND REQUEST_STATUS IN (?) AND STAFF_ID = ? AND CLAIM_TYPE = '105'`;
    const values = [staffId, statusCode, staffId];
    let fetchTbClaimStatusCount = await cds.run(query, values);
    return fetchTbClaimStatusCount;
}
/**
 *
 * @param draftId
 */
async function fetchByDraftId(draftId) {
    // Using parameterized query to prevent SQL injection
    const query = `SELECT * FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    let fetchByDraftId = await cds.run(query, values);
    return fetchByDraftId;
}
/**
 *
 * @param draftId
 */
async function fetchRequestId(draftId) {
    const query = `SELECT REQUEST_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    let fetchRequestId = await cds.run(query, values);
    return fetchRequestId;
}
/**
 *
 * @param month
 * @param year
 * @param staffId
 * @param claimType
 */
async function fetchMonthlyClaims(month, year, staffId, claimType) {
    // Fixed double WHERE clause and using parameterized query
    const query = `SELECT COUNT(REQUEST_ID) FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE CLAIM_MONTH = ? AND CLAIM_YEAR = ? AND STAFF_ID = ? AND CLAIM_TYPE = ? AND REQUEST_STATUS NOT IN ('07','08','10','11','12','18','19','20','15','17','16')`;
    const values = [month, year, staffId, claimType];
    let fetchMonthlyClaims = await cds.run(query, values);
    return fetchMonthlyClaims;
}
/**
 *
 * @param month
 * @param year
 * @param staffId
 * @param claimType
 * @param startDate
 * @param endDate
 */
async function fetchMonthlyClaimsOnSubmittedOn(month, year, staffId, claimType, startDate, endDate) {
    // Fixed double WHERE clause and using parameterized query
    const query = `SELECT COUNT(REQUEST_ID) FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE CLAIM_MONTH = ? AND CLAIM_YEAR = ? AND TO_DATE(SUBMITTED_ON) >= ? AND TO_DATE(SUBMITTED_ON) <= ? AND STAFF_ID = ? AND CLAIM_TYPE = ? AND REQUEST_STATUS NOT IN ('07','08','10','11','12','18','19','20','15','17','16')`;
    const values = [month, year, startDate, endDate, staffId, claimType];
    let fetchMonthlyClaimsOnSubmittedOn = await cds.run(query, values);
    return fetchMonthlyClaimsOnSubmittedOn;
}
/**
 *
 * @param ULU
 * @param FDLU
 * @param CLAIM_TYPE
 * @param CLAIM_MONTH
 * @param CLAIM_YEAR
 * @param STAFF_ID
 * @param NUSNET_ID
 */
async function fetchDraftStatusEclaimsData(ULU, FDLU, CLAIM_TYPE, CLAIM_MONTH, CLAIM_YEAR, STAFF_ID, NUSNET_ID) {
    let query = SELECT.distinct
        .from("NUSEXT_ECLAIMS_HEADER_DATA")
        .where({
            ULU,
            FDLU,
            CLAIM_TYPE,
            CLAIM_MONTH,
            CLAIM_YEAR,
            REQUEST_STATUS: '01',
            and: {
                STAFF_ID: STAFF_ID.toUpperCase(),
                or: { STAFF_NUSNET_ID: STAFF_ID.toUpperCase() }
            },
            SUBMITTED_BY_NID: NUSNET_ID.toUpperCase()
        });
    let fetchDraftStatusEclaimsData = await cds.run(query);
    return fetchDraftStatusEclaimsData || [];
}
async function fetchPastThreeMonthsWbs(stfNumber, requestClaimDate) {
    const pastThreeMonthsDate = new Date(requestClaimDate);
    pastThreeMonthsDate.setDate(pastThreeMonthsDate.getDate() - 90);
    const pastThreeMonthsDateFormat = DateUtils.formatDateAsString(pastThreeMonthsDate, ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT);
    const results = await cds.run(
        SELECT.from('NUSEXT_ECLAIMS_ITEMS_DATA as itmdata')
            .join('NUSEXT_ECLAIMS_HEADER_DATA as hdrdata').on('hdrdata.DRAFT_ID = itmdata.DRAFT_ID')
            .where({
                'hdrdata.STAFF_ID': stfNumber,
                'hdrdata.SUBMITTED_ON': { '>=': pastThreeMonthsDateFormat },
                'hdrdata.REQUEST_STATUS': { '>=': ApplicationConstants.STATUS_ECLAIMS_APPROVED }
            })
            .columns('WBS', 'WBS_DESC')
            .groupBy('WBS', 'WBS_DESC')
    );
    return results || [];
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
    fetchRequestId,
    fetchDraftStatusEclaimsData,
    fetchPastThreeMonthsWbs
};
