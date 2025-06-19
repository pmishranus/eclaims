const cds = require("@sap/cds");
const { ApplicationConstants } = require("../util/constant");

/**
 *
 * @param staffNusNetId
 * @param claimCode
 * @param month
 * @param year
 * @param date
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
            .where(
                { "item.IS_DELETED": "N" },
                { "ec.CLAIM_TYPE": claimCode },
                { "item.CLAIM_START_DATE": date },
                { "ec.CLAIM_MONTH": month },
                { "ec.CLAIM_YEAR": year },
                cds.or(cds.fn("upper", "ec.STAFF_NUSNET_ID"), "=", staffNusNetId.toUpperCase(), {
                    "ec.STAFF_ID": staffNusNetId,
                }),
                { "ec.REQUEST_STATUS": { "not in": STATUS_LIST } }
            )
    );

    return queryDayMonthAndYearRequests;
}
/**
 *
 * @param staffNusNetId
 * @param claimCode
 * @param weekNo
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
 *
 * @param staffNusNetId
 * @param claimStartDate
 * @param claimEndDate
 * @param ulu
 * @param fdlu
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
    const checkForExistingReq = await cds.run(
        SELECT.from("NUSEXT_ECLAIMS_ITEMS_DATA")
            .join("NUSEXT_ECLAIMS_HEADER_DATA")
            .on("NUSEXT_ECLAIMS_HEADER_DATA.DRAFT_ID = NUSEXT_ECLAIMS_ITEMS_DATA.DRAFT_ID")
            .where([
                cds.or(
                    cds.fn("upper", { ref: ["NUSEXT_ECLAIMS_HEADER_DATA", "STAFF_NUSNET_ID"] }),
                    "=",
                    staffNusNetId.toUpperCase(),
                    { ref: ["NUSEXT_ECLAIMS_HEADER_DATA", "STAFF_ID"] },
                    "=",
                    staffNusNetId
                ),
                { ref: ["NUSEXT_ECLAIMS_ITEMS_DATA", "CLAIM_START_DATE"] },
                "<=",
                claimEndDate,
                { ref: ["NUSEXT_ECLAIMS_ITEMS_DATA", "CLAIM_END_DATE"] },
                ">=",
                claimStartDate,
                { ref: ["NUSEXT_ECLAIMS_HEADER_DATA", "ULU"] },
                "=",
                ulu,
                { ref: ["NUSEXT_ECLAIMS_HEADER_DATA", "FDLU"] },
                "=",
                fdlu,
                { ref: ["NUSEXT_ECLAIMS_ITEMS_DATA", "IS_DELETED"] },
                "=",
                "N",
                { ref: ["NUSEXT_ECLAIMS_HEADER_DATA", "REQUEST_STATUS"] },
                "not in",
                STATUS_LIST,
            ])
            .columns("*") // or list specific fields you want
    );
    return checkForExistingReq;
}

/**
 *
 * @param draftId
 */
async function fetchItemCount(draftId) {
    let query = ` SELECT * FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = '${draftId}'`;
    let fetchItemCount = await cds.run(query);
    return fetchItemCount;
}

/**
 *
 * @param draftId
 */
async function fetchByDraftId(draftId) {
    let query = ` SELECT * FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = '${draftId}'`;
    let fetchByDraftId = await cds.run(query);
    return fetchByDraftId;
}

/**
 *
 * @param draftId
 */
async function fetchItemIds(draftId) {
    let query = ` SELECT ITEM_ID FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = '${draftId}'`;
    let fetchItemIds = await cds.run(query);
    return fetchItemIds;
}

/**
 *
 * @param tx
 * @param itemIds
 * @param nusNetId
 * @param date
 */
async function softDeleteByItemId(tx, itemIds, nusNetId, date) {
    const query = ` UPDATE NUSEXT_ECLAIMS_ITEMS_DATA set IS_DELETED = 'Y', UPDATED_BY = ?, UPDATED_ON = ? where ITEM_ID in ('${itemIds})`;
    const values = [nusNetId, date];
    const result = await tx.run(query, values);

    // result will be an object; affected rows may be in result.affectedRows or result.length
    return result;
}

/**
 *
 * @param tx
 * @param draftId
 * @param nusNetId
 * @param date
 */
async function softDeleteByDraftId(tx, draftId, nusNetId, date) {
    const placeholders = itemIds.map(() => "?").join(", ");
    const query = `
      UPDATE NUSEXT_ECLAIMS_ITEMS_DATA
      SET IS_DELETED='Y', UPDATED_BY=?, UPDATED_ON=?
      WHERE ITEM_ID IN (SELECT ITEM_ID FROM NUSEXT_ECLAIMS_ITEMS_DATA WHERE DRAFT_ID = '${draftId}' AND IS_DELETED = 'N')
    `;
    const values = [nusNetId, date];
    const result = await tx.run(query, values);

    // result will be an object; affected rows may be in result.affectedRows or result.length
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
};
