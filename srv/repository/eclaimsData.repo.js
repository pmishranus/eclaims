const cds = require("@sap/cds");
const { SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");
const { ApplicationConstants } = require("../util/constant");
const DateUtils = require("../util/dateUtil");
/**
 * Fetches claim status count by staff ID and status code.
 * @param {string} staffId
 * @param {string} statusCode
 * @returns {Promise<number>}
 */
async function fetchClaimStatusCountById(staffId, statusCode) {
    let fetchClaimStatusCountById = await cds.run(
        SELECT.from(" NUSEXT_ECLAIMS_HEADER_DATA as ehd").where({
            STAFF_ID: staffId,
            REQUEST_STATUS: {
                in: statusCode,
            },
            CLAIM_TYPE: {
                "!=": "105",
            },
        })
    );
    return fetchClaimStatusCountById;
}
/**
 * Fetches claim status count by staff ID and status code.
 * @param {string} staffId
 * @param {string} statusCode
 * @returns {Promise<number>}
 */
async function fetchClaimStatusCount(staffId, statusCode) {
    let fetchClaimStatusCountById = await cds.run(
        SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA").where({
            SUBMITTED_BY: staffId,
            REQUEST_STATUS: {
                in: statusCode,
            },
            CLAIM_TYPE: {
                "!=": "105",
            },
        })
    );
    return fetchClaimStatusCountById;
}
/**
 * Fetches pending CA status count by staff ID and status.
 * @param {string} staffId
 * @param {string} status
 * @returns {Promise<number>}
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
 * Fetches CA status count for draft by staff ID and status.
 * @param {string} staffId
 * @param {string} status
 * @returns {Promise<number>}
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
 * Fetches CA status count by staff ID and status.
 * @param {string} staffId
 * @param {string} status
 * @returns {Promise<number>}
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
 * Fetches TB claim status count by staff ID and status code.
 * @param {string} staffId
 * @param {string} statusCode
 * @returns {Promise<number>}
 */
async function fetchTbClaimStatusCountById(staffId, statusCode) {
    const query = `SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE REQUEST_STATUS IN (?) AND STAFF_ID = ? AND CLAIM_TYPE = '105'`;
    const values = [statusCode, staffId];
    let fetchTbClaimStatusCountById = await cds.run(query, values);
    return fetchTbClaimStatusCountById;
}
/**
 * Fetches TB claim status count by staff ID and status code.
 * @param {string} staffId
 * @param {string} statusCode
 * @returns {Promise<number>}
 */
async function fetchTbClaimStatusCount(staffId, statusCode) {
    const query = `SELECT DISTINCT DRAFT_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE SUBMITTED_BY = ? AND REQUEST_STATUS IN (?) AND STAFF_ID = ? AND CLAIM_TYPE = '105'`;
    const values = [staffId, statusCode, staffId];
    let fetchTbClaimStatusCount = await cds.run(query, values);
    return fetchTbClaimStatusCount;
}
/**
 * Fetches claim data by draft ID.
 * @param {string} draftId
 * @returns {Promise<Object>}
 */
async function fetchByDraftId(draftId, tx = null) {
    // Using parameterized query to prevent SQL injection
    const query = `SELECT * FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    const result = tx ? await tx.run(query, values) : await cds.run(query, values);
    return result;
}
/**
 * Fetches request ID by draft ID.
 * @param {string} draftId
 * @returns {Promise<string>}
 */
async function fetchRequestId(draftId) {
    const query = `SELECT REQUEST_ID FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    let fetchRequestId = await cds.run(query, values);
    return fetchRequestId;
}
/**
 * Fetches monthly claims.
 * @param {string} month
 * @param {string} year
 * @param {string} staffId
 * @param {string} claimType
 * @returns {Promise<Array>}
 */
async function fetchMonthlyClaims(month, year, staffId, claimType) {
    // Fixed double WHERE clause and using parameterized query
    const query = `SELECT COUNT(REQUEST_ID) FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE CLAIM_MONTH = ? AND CLAIM_YEAR = ? AND STAFF_ID = ? AND CLAIM_TYPE = ? AND REQUEST_STATUS NOT IN ('07','08','10','11','12','18','19','20','15','17','16')`;
    const values = [month, year, staffId, claimType];
    let fetchMonthlyClaims = await cds.run(query, values);
    return fetchMonthlyClaims;
}
/**
 * Fetches monthly claims on submitted on.
 * @param {string} month
 * @param {string} year
 * @param {string} staffId
 * @param {string} claimType
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Array>}
 */
async function fetchMonthlyClaimsOnSubmittedOn(month, year, staffId, claimType, startDate, endDate) {
    // Fixed double WHERE clause and using parameterized query
    const query = `SELECT COUNT(REQUEST_ID) FROM NUSEXT_ECLAIMS_HEADER_DATA WHERE CLAIM_MONTH = ? AND CLAIM_YEAR = ? AND TO_DATE(SUBMITTED_ON) >= ? AND TO_DATE(SUBMITTED_ON) <= ? AND STAFF_ID = ? AND CLAIM_TYPE = ? AND REQUEST_STATUS NOT IN ('07','08','10','11','12','18','19','20','15','17','16')`;
    const values = [month, year, startDate, endDate, staffId, claimType];
    let fetchMonthlyClaimsOnSubmittedOn = await cds.run(query, values);
    return fetchMonthlyClaimsOnSubmittedOn;
}
/**
 * Fetches draft status eclaims data.
 * @param {string} ULU
 * @param {string} FDLU
 * @param {string} CLAIM_TYPE
 * @param {string} CLAIM_MONTH
 * @param {string} CLAIM_YEAR
 * @param {string} STAFF_ID
 * @param {string} NUSNET_ID
 * @returns {Promise<Array>}
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
/**
 * Fetches past three months WBS.
 * @param {string} stfNumber
 * @param {string} requestClaimDate
 * @returns {Promise<Array>}
 */
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

/**
 * Upserts eclaims data
 * @param {Object} eclaimsData - The eclaims data object
 * @returns {Promise<Object>} The upsert result
 */
async function upsertEclaimsData(eclaimsData) {
    const result = await cds.run(
        UPSERT.into("NUSEXT_ECLAIMS_HEADER_DATA")
            .entries(eclaimsData)
    );
    return result;
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
    fetchPastThreeMonthsWbs,
    upsertEclaimsData
};
