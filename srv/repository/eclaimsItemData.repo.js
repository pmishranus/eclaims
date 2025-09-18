const cds = require("@sap/cds");
const { SELECT, UPSERT, UPDATE } = require("@sap/cds/lib/ql/cds-ql");
const { ApplicationConstants } = require("../util/constant");

/**
 * Queries day, month, and year requests.
 * @param {string} staffNusNetId
 * @param {string} claimCode
 * @param {string} month
 * @param {string} year
 * @param {string} date
 * @returns {Promise<Array>}
 */
async function queryDayMonthAndYearRequests(staffNusNetId, claimCode, month, year, date) {
    const STATUS_LIST = [
        ApplicationConstants.STATUS_ECLAIMS_DRAFT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT_NON_ESS,
        ApplicationConstants.STATUS_ECLAIMS_REJECTED_BY_SYSTEM,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_ADMIN,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_BY_ECP,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT,
    ];
    const queryDayMonthAndYearRequests = await cds.run(
        SELECT.from("NUSEXT_ECLAIMS_ITEMS_DATA", "item")
            .columns("item.*")
            .join("NUSEXT_ECLAIMS_ITEMS_DATA", "ec")
            .on("ec.DRAFT_ID = item.DRAFT_ID")
            .where({ "item.IS_DELETED": "N" })
            .where({ "ec.CLAIM_TYPE": claimCode })
            .where({ "item.CLAIM_START_DATE": date })
            .where({ "ec.CLAIM_MONTH": month })
            .where({ "ec.CLAIM_YEAR": year })
            .where({ "ec.STAFF_NUSNET_ID": staffNusNetId.toUpperCase() })
            .or({ "ec.STAFF_ID": staffNusNetId })
            .where({ "ec.REQUEST_STATUS": { "not in": STATUS_LIST } })
    );
    return queryDayMonthAndYearRequests;
}
/**
 * Queries month and year requests.
 * @param {string} staffNusNetId
 * @param {string} claimCode
 * @param {string} weekNo
 * @returns {Promise<Array>}
 */
async function queryMonthAndYearRequests(staffNusNetId, claimCode, weekNo) {
    const STATUS_LIST = [
        ApplicationConstants.STATUS_ECLAIMS_DRAFT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT_NON_ESS,
        ApplicationConstants.STATUS_ECLAIMS_REJECTED_BY_SYSTEM,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_ADMIN,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_BY_ECP,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT,
    ];
    const queryMonthAndYearRequests = await cds.run(
        SELECT.from("NUSEXT_ECLAIMS_ITEMS_DATA", "item")
            .columns("item.*")
            .join("NUSEXT_ECLAIMS_ITEMS_DATA", "ec")
            .on("ec.DRAFT_ID = item.DRAFT_ID")
            .where(
                { "item.IS_DELETED": "N" },
                { "ec.CLAIM_TYPE": claimCode },
                { "ec.CLAIM_WEEK_NO": weekNo },
                cds.or(cds.fn("upper", "ec.STAFF_NUSNET_ID"), "=", staffNusNetId.toUpperCase(), {
                    "ec.STAFF_ID": staffNusNetId,
                }),
                { "ec.REQUEST_STATUS": { "not in": STATUS_LIST } }
            )
    );

    return queryMonthAndYearRequests;
}

/**
 * Checks for existing requests.
 * @param {string} staffNusNetId
 * @param {string} claimStartDate
 * @param {string} claimEndDate
 * @param {string} ulu
 * @param {string} fdlu
 * @returns {Promise<Array>}
 */
async function checkForExistingReq(staffNusNetId, claimStartDate, claimEndDate, ulu, fdlu) {
    const STATUS_LIST = [
        ApplicationConstants.STATUS_ECLAIMS_DRAFT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT_NON_ESS,
        ApplicationConstants.STATUS_ECLAIMS_REJECTED_BY_SYSTEM,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_ADMIN,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_BY_ECP,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT,
    ];
    // Use raw SQL for complex OR condition and NOT IN clause
    const query = `
        SELECT i.*, h.*
        FROM NUSEXT_ECLAIMS_ITEMS_DATA i
        JOIN NUSEXT_ECLAIMS_HEADER_DATA h ON h.DRAFT_ID = i.DRAFT_ID
        WHERE (UPPER(h.STAFF_NUSNET_ID) = ? OR h.STAFF_ID = ?)
        AND i.CLAIM_START_DATE <= ?
        AND i.CLAIM_END_DATE >= ?
        AND h.ULU = ?
        AND h.FDLU = ?
        AND i.IS_DELETED = 'N'
        AND h.REQUEST_STATUS NOT IN (${STATUS_LIST.map(() => '?').join(', ')})
    `;
    
    const values = [
        staffNusNetId.toUpperCase(),
        staffNusNetId,
        claimEndDate,
        claimStartDate,
        ulu,
        fdlu,
        ...STATUS_LIST
    ];
    
    const checkForExistingReq = await cds.run(query, values);
    return checkForExistingReq;
}

/**
 * Fetches item count by draft ID.
 * @param {string} draftId
 * @returns {Promise<Array>}
 */
async function fetchItemCount(draftId) {
    const query = `SELECT * FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    let fetchItemCount = await cds.run(query, values);
    return fetchItemCount;
}

/**
 * Fetches items by draft ID.
 * @param {string} draftId
 * @returns {Promise<Array>}
 */
async function fetchByDraftId(draftId) {
    const query = `SELECT * FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    let fetchByDraftId = await cds.run(query, values);
    return fetchByDraftId;
}

/**
 * Fetches item IDs by draft ID.
 * @param {string} draftId
 * @returns {Promise<Array>}
 */
async function fetchItemIds(draftId) {
    const query = `SELECT ITEM_ID FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = ?`;
    const values = [draftId];
    let fetchItemIds = await cds.run(query, values);
    return fetchItemIds;
}

/**
 * Soft deletes items by item IDs.
 * @param {object} tx
 * @param {Array} itemIds
 * @param itemIdsObj
 * @param {string} nusNetId
 * @param {Date} date
 * @returns {Promise<object>}
 */
async function softDeleteByItemIdOld(tx, itemIdsObj, nusNetId, date) {
    const itemIds = itemIdsObj.map(item => item.ITEM_ID);
    const query = await UPDATE.entity("NUSEXT_ECLAIMS_ITEMS_DATA")
        .set({
            IS_DELETED: "Y",
            UPDATED_BY: nusNetId,
            UPDATED_ON: date,
        })
        .where({ ITEM_ID: { in: itemIds } });

    const result = await tx.run(query);

    return result;
}

/**
 *
 * @param tx
 * @param itemIdsObj
 * @param nusNetId
 * @param date
 */
async function softDeleteByItemId(tx, itemIdsObj, nusNetId, date) {
    const itemIds = itemIdsObj.map(item => item.ITEM_ID);
  
    const result = await tx.run(
      UPDATE('NUSEXT_ECLAIMS_ITEMS_DATA')
        .set({
          IS_DELETED: "Y",
          UPDATED_BY: nusNetId,
          UPDATED_ON: date,
        })
        .where({ ITEM_ID: { in: itemIds } })
    );
  
    return result;
  }
  

/**
 * Soft deletes items by draft ID.
 * @param {object} tx
 * @param {string} draftId
 * @param {string} nusNetId
 * @param {Date} date
 * @returns {Promise<object>}
 */
async function softDeleteByDraftId(tx, draftId, nusNetId, date) {
    const query = `
        UPDATE NUSEXT_ECLAIMS_ITEMS_DATA
        SET IS_DELETED = 'Y', UPDATED_BY = ?, UPDATED_ON = ?
        WHERE ITEM_ID IN (SELECT ITEM_ID FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = ? AND IS_DELETED = 'N')
    `;
    const values = [nusNetId, date, draftId];
    const result = await tx.run(query, values);

    return result;
}

/**
 * Upserts eclaims item data
 * @param {object} eclaimsItemData - The eclaims item data object
 * @returns {Promise<object>} The upsert result
 */
async function upsertEclaimsItemData(eclaimsItemData) {
    const result = await cds.run(UPSERT.into("NUSEXT_ECLAIMS_ITEMS_DATA").entries(eclaimsItemData));
    return result;
}

module.exports = {
    queryDayMonthAndYearRequests,
    queryMonthAndYearRequests,
    checkForExistingReq,
    fetchItemCount,
    fetchByDraftId,
    fetchItemIds,
    softDeleteByItemId,
    softDeleteByDraftId,
    upsertEclaimsItemData,
};
