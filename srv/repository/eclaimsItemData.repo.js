const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { ApplicationConstants } = require("../util/constant")


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
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT
    ];
    const queryDayMonthAndYearRequests = await cds.run(
        SELECT.from('NUSEXT_ECLAIMS_ITEMS_DATA', 'item')
            .columns('item.*')
            .join('NUSEXT_ECLAIMS_ITEMS_DATA', 'ec').on('ec.DRAFT_ID = item.DRAFT_ID')
            .where(
                { 'item.IS_DELETED': 'N' },
                { 'ec.CLAIM_TYPE': claimCode },
                { 'item.CLAIM_START_DATE': date },
                { 'ec.CLAIM_MONTH': month },
                { 'ec.CLAIM_YEAR': year },
                cds.or(
                    cds.fn('upper', 'ec.STAFF_NUSNET_ID'), '=', staffNusNetId.toUpperCase(),
                    { 'ec.STAFF_ID': staffNusNetId }
                ),
                { 'ec.REQUEST_STATUS': { 'not in': STATUS_LIST } }
            )
    );

    return queryDayMonthAndYearRequests;
}
async function queryMonthAndYearRequests(staffNusNetId, claimCode,weekNo) {
    const STATUS_LIST = [
        ApplicationConstants.STATUS_ECLAIMS_DRAFT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_REJECT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT,
        ApplicationConstants.STATUS_ECLAIMS_CLAIM_ASSISTANT_RETRACT_NON_ESS,
        ApplicationConstants.STATUS_ECLAIMS_REJECTED_BY_SYSTEM,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_ADMIN,
        ApplicationConstants.STATUS_ECLAIMS_WITHDRAWN_BY_ECP,
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT
    ];
    const queryMonthAndYearRequests = await cds.run(
        SELECT.from('NUSEXT_ECLAIMS_ITEMS_DATA', 'item')
            .columns('item.*')
            .join('NUSEXT_ECLAIMS_ITEMS_DATA', 'ec').on('ec.DRAFT_ID = item.DRAFT_ID')
            .where(
                { 'item.IS_DELETED': 'N' },
                { 'ec.CLAIM_TYPE': claimCode },
                { 'ec.CLAIM_WEEK_NO': weekNo },
                cds.or(
                    cds.fn('upper', 'ec.STAFF_NUSNET_ID'), '=', staffNusNetId.toUpperCase(),
                    { 'ec.STAFF_ID': staffNusNetId }
                ),
                { 'ec.REQUEST_STATUS': { 'not in': STATUS_LIST } }
            )
    );

    return queryMonthAndYearRequests;
}

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
        ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_RETRACT
    ];
    const checkForExistingReq = await cds.run(
        SELECT.from('NUSEXT_ECLAIMS_ITEMS_DATA')
          .join('NUSEXT_ECLAIMS_HEADER_DATA')
            .on('NUSEXT_ECLAIMS_HEADER_DATA.DRAFT_ID = NUSEXT_ECLAIMS_ITEMS_DATA.DRAFT_ID')
          .where([
            cds.or(
                cds.fn('upper', { ref: ['NUSEXT_ECLAIMS_HEADER_DATA', 'STAFF_NUSNET_ID'] }), '=', staffNusNetId.toUpperCase(),
              { ref: ['NUSEXT_ECLAIMS_HEADER_DATA', 'STAFF_ID'] }, '=', staffNusNetId
            ),
            { ref: ['NUSEXT_ECLAIMS_ITEMS_DATA', 'CLAIM_START_DATE'] }, '<=', claimEndDate,
            { ref: ['NUSEXT_ECLAIMS_ITEMS_DATA', 'CLAIM_END_DATE'] }, '>=', claimStartDate,
            { ref: ['NUSEXT_ECLAIMS_HEADER_DATA', 'ULU'] }, '=', ulu,
            { ref: ['NUSEXT_ECLAIMS_HEADER_DATA', 'FDLU'] }, '=', fdlu,
            { ref: ['NUSEXT_ECLAIMS_ITEMS_DATA', 'IS_DELETED'] }, '=', 'N',
            { ref: ['NUSEXT_ECLAIMS_HEADER_DATA', 'REQUEST_STATUS'] }, 'not in', STATUS_LIST
          ])
          .columns('*') // or list specific fields you want
      );
      return checkForExistingReq;
}


module.exports = {
    queryDayMonthAndYearRequests,
    queryMonthAndYearRequests,
    checkForExistingReq
}