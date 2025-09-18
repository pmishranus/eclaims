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
 * @param tx
 * @returns {Promise<object>}
 */
async function fetchByDraftId(draftId, tx = null) {
    let query = SELECT.one.from("NUSEXT_ECLAIMS_HEADER_DATA").where({
        DRAFT_ID: draftId,
    });
    const result = tx ? await tx.run(query) : await cds.run(query);
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
 * Fetches eclaims header data by request ID.
 * @param {string} requestId
 * @returns {Promise<object>}
 */
async function fetchByRequestId(requestId) {
    let query = SELECT.one.from("NUSEXT_ECLAIMS_HEADER_DATA").where({
        REQUEST_ID: requestId,
        IS_DELETED: "N"
    });
    const result = await cds.run(query);
    return result;
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
    let query = SELECT.distinct.from("NUSEXT_ECLAIMS_HEADER_DATA").where({
        ULU,
        FDLU,
        CLAIM_TYPE,
        CLAIM_MONTH,
        CLAIM_YEAR,
        REQUEST_STATUS: "01",
        and: {
            STAFF_ID: STAFF_ID.toUpperCase(),
            or: { STAFF_NUSNET_ID: STAFF_ID.toUpperCase() },
        },
        SUBMITTED_BY_NID: NUSNET_ID.toUpperCase(),
    });
    let fetchDraftStatusEclaimsData = await cds.run(query);
    return fetchDraftStatusEclaimsData || [];
}

/**
 * Fetches submitted status eclaims data.
 * @param {string} ULU
 * @param {string} FDLU
 * @param {string} CLAIM_TYPE
 * @param {string} CLAIM_MONTH
 * @param {string} CLAIM_YEAR
 * @param {string} STAFF_ID
 * @param {string} NUSNET_ID
 * @returns {Promise<Array>}
 */
async function fetchSubmittedStatusEclaimsData(ULU, FDLU, CLAIM_TYPE, CLAIM_MONTH, CLAIM_YEAR, STAFF_ID, NUSNET_ID) {
    let query = SELECT.distinct.from("NUSEXT_ECLAIMS_HEADER_DATA").where({
        ULU,
        FDLU,
        CLAIM_TYPE,
        CLAIM_MONTH,
        CLAIM_YEAR,
        REQUEST_STATUS: ApplicationConstants.STATUS_ECLAIMS_CLAIMANT_SUBMITTED, // "02"
        and: {
            STAFF_ID: STAFF_ID.toUpperCase(),
            or: { STAFF_NUSNET_ID: STAFF_ID.toUpperCase() },
        },
        SUBMITTED_BY_NID: NUSNET_ID.toUpperCase(),
    });
    let fetchSubmittedStatusEclaimsData = await cds.run(query);
    return fetchSubmittedStatusEclaimsData || [];
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
    const pastThreeMonthsDateFormat = DateUtils.formatDateAsString(
        pastThreeMonthsDate,
        ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
    );
    const results = await cds.run(
        SELECT.from("NUSEXT_ECLAIMS_ITEMS_DATA as itmdata")
            .join("NUSEXT_ECLAIMS_HEADER_DATA as hdrdata")
            .on("hdrdata.DRAFT_ID = itmdata.DRAFT_ID")
            .where({
                "hdrdata.STAFF_ID": stfNumber,
                "hdrdata.SUBMITTED_ON": { ">=": pastThreeMonthsDateFormat },
                "hdrdata.REQUEST_STATUS": { ">=": ApplicationConstants.STATUS_ECLAIMS_APPROVED },
            })
            .columns("WBS", "WBS_DESC")
            .groupBy("WBS", "WBS_DESC")
    );
    return results || [];
}

/**
 * Upserts eclaims data
 * @param {object} eclaimsData - The eclaims data object
 * @returns {Promise<object>} The upsert result
 */
async function upsertEclaimsData(eclaimsData) {
    const result = await cds.run(UPSERT.into("NUSEXT_ECLAIMS_HEADER_DATA").entries(eclaimsData));
    return result;
}

/**
 * Updates request status on task completion
 * @param {object} tx - The CDS transaction object
 * @param {string} toBeRequestStatus - The to be request status
 * @param {string} draftId - The draft ID
 * @param {string} stfNumber - The staff number
 * @param {string} nusNetId - The NUSNET ID
 * @returns {Promise<void>}
 */
async function updateRequestStatusOnTaskCompletion(tx, toBeRequestStatus, draftId, stfNumber, nusNetId) {
    const { UPDATE } = require("@sap/cds/lib/ql/cds-ql");

    const query = UPDATE("NUSEXT_ECLAIMS_HEADER_DATA")
        .set({
            REQUEST_STATUS: toBeRequestStatus,
            MODIFIED_BY: stfNumber,
            MODIFIED_BY_NID: nusNetId,
            MODIFIED_ON: new Date()
        })
        .where({ DRAFT_ID: draftId });

    await tx.run(query);
}

/**
 * Soft deletes eclaims header data by draft ID
 * @param {object} tx - The transaction object
 * @param {string} draftId - The draft ID
 * @param {string} modifiedBy - The user who modified the record
 * @param {string} modifiedOn - The modification date
 * @returns {Promise<object>} Delete result
 */
async function softDeleteByDraftId(tx, draftId, modifiedBy, modifiedOn) {
    const { UPDATE } = require("@sap/cds/lib/ql/cds-ql");

    const query = UPDATE("NUSEXT_ECLAIMS_HEADER_DATA")
        .set({
            IS_DELETED: "Y",
            MODIFIED_BY: modifiedBy,
            MODIFIED_ON: modifiedOn
        })
        .where({ DRAFT_ID: draftId });

    const result = await tx.run(query);
    return result;
}

/**
 * Filters request ID and status data
 * @param {string} staffId - Staff ID or NUSNET ID
 * @param {Array} statusList - Optional list of status codes to filter by
 * @returns {Promise<Array>} Array of RequestIdFilterDto objects
 */
async function filterQueryRequestIdAndStatus(staffId, statusList = null) {
    try {
        let query;

        if (statusList && statusList.length > 0) {
            // Filter by specific status codes
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA")
                .columns("REQUEST_ID", "REQUEST_STATUS")
                .where({
                    and: {
                        STAFF_ID: staffId.toUpperCase(),
                        or: { STAFF_NUSNET_ID: staffId.toUpperCase() },
                        REQUEST_STATUS: { in: statusList },
                        IS_DELETED: ApplicationConstants.N
                    }
                })
                .groupBy("REQUEST_ID", "REQUEST_STATUS")
                .orderBy({ REQUEST_ID: "desc" });
        } else {
            // Get all statuses
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA")
                .columns("REQUEST_ID", "REQUEST_STATUS")
                .where({
                    and: {
                        STAFF_ID: staffId.toUpperCase(),
                        or: { STAFF_NUSNET_ID: staffId.toUpperCase() },
                        IS_DELETED: ApplicationConstants.N
                    }
                })
                .groupBy("REQUEST_ID", "REQUEST_STATUS")
                .orderBy({ REQUEST_ID: "desc" });
        }

        const result = await cds.run(query);
        return result || [];

    } catch (error) {
        console.error('Error in filterQueryRequestIdAndStatus:', error);
        return [];
    }
}

/**
 * Filters claim type data
 * @param {string} staffId - Staff ID or NUSNET ID
 * @param {Array} statusList - Optional list of status codes to filter by
 * @returns {Promise<Array>} Array of ClaimFilterDto objects
 */
async function filterQueryClaimType(staffId, statusList = null) {
    try {
        let query;

        if (statusList && statusList.length > 0) {
            // Filter by specific status codes
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA as ec")
                .columns("ec.CLAIM_TYPE", "mct.CLAIM_TYPE_T")
                .join("NUSEXT_MASTER_CLAIM_TYPE as mct").on("ec.CLAIM_TYPE = mct.CLAIM_TYPE_C")
                .where({
                    and: {
                        "ec.STAFF_ID": staffId.toUpperCase(),
                        or: { "ec.STAFF_NUSNET_ID": staffId.toUpperCase() },
                        "ec.REQUEST_STATUS": { in: statusList },
                        "ec.IS_DELETED": ApplicationConstants.N
                    }
                })
                .groupBy("ec.CLAIM_TYPE", "mct.CLAIM_TYPE_T");
        } else {
            // Get all claim types
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA as ec")
                .columns("ec.CLAIM_TYPE", "mct.CLAIM_TYPE_T")
                .join("NUSEXT_MASTER_CLAIM_TYPE as mct").on("ec.CLAIM_TYPE = mct.CLAIM_TYPE_C")
                .where({
                    and: {
                        "ec.STAFF_ID": staffId.toUpperCase(),
                        or: { "ec.STAFF_NUSNET_ID": staffId.toUpperCase() },
                        "ec.IS_DELETED": ApplicationConstants.N
                    }
                })
                .groupBy("ec.CLAIM_TYPE", "mct.CLAIM_TYPE_T");
        }

        const result = await cds.run(query);
        return result || [];

    } catch (error) {
        console.error('Error in filterQueryClaimType:', error);
        return [];
    }
}

/**
 * Filters month and year data
 * @param {string} staffId - Staff ID or NUSNET ID
 * @param {Array} statusList - Optional list of status codes to filter by
 * @returns {Promise<Array>} Array of PeriodFilterDto objects
 */
async function filterQueryMonthAndYear(staffId, statusList = null) {
    try {
        let query;

        if (statusList && statusList.length > 0) {
            // Filter by specific status codes
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA")
                .columns("CLAIM_MONTH", "CLAIM_YEAR")
                .where({
                    and: {
                        STAFF_ID: staffId.toUpperCase(),
                        or: { STAFF_NUSNET_ID: staffId.toUpperCase() },
                        REQUEST_STATUS: { in: statusList },
                        IS_DELETED: ApplicationConstants.N
                    }
                })
                .groupBy("CLAIM_MONTH", "CLAIM_YEAR");
        } else {
            // Get all periods
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA")
                .columns("CLAIM_MONTH", "CLAIM_YEAR")
                .where({
                    and: {
                        STAFF_ID: staffId.toUpperCase(),
                        or: { STAFF_NUSNET_ID: staffId.toUpperCase() },
                        IS_DELETED: ApplicationConstants.N
                    }
                })
                .groupBy("CLAIM_MONTH", "CLAIM_YEAR");
        }

        const result = await cds.run(query);
        return result || [];

    } catch (error) {
        console.error('Error in filterQueryMonthAndYear:', error);
        return [];
    }
}

/**
 * Filters status data
 * @param {string} staffId - Staff ID or NUSNET ID
 * @param {Array} statusList - Optional list of status codes to filter by
 * @returns {Promise<Array>} Array of StatusFilterDto objects
 */
async function filterQueryStatus(staffId, statusList = null) {
    try {
        let query;

        if (statusList && statusList.length > 0) {
            // Filter by specific status codes
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA as ec")
                .columns("ec.REQUEST_STATUS", "sc.STATUS_ALIAS")
                .join("NUSEXT_UTILITY_STATUS_CONFIG as sc").on("ec.REQUEST_STATUS = sc.STATUS_CODE")
                .where({
                    and: {
                        "ec.STAFF_ID": staffId.toUpperCase(),
                        or: { "ec.STAFF_NUSNET_ID": staffId.toUpperCase() },
                        "ec.REQUEST_STATUS": { in: statusList },
                        "ec.IS_DELETED": ApplicationConstants.N,
                        "sc.STATUS_TYPE": "ECLAIMS"
                    }
                })
                .groupBy("ec.REQUEST_STATUS", "sc.STATUS_ALIAS");
        } else {
            // Get all statuses
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA as ec")
                .columns("ec.REQUEST_STATUS", "sc.STATUS_ALIAS")
                .join("NUSEXT_UTILITY_STATUS_CONFIG as sc").on("ec.REQUEST_STATUS = sc.STATUS_CODE")
                .where({
                    and: {
                        "ec.STAFF_ID": staffId.toUpperCase(),
                        or: { "ec.STAFF_NUSNET_ID": staffId.toUpperCase() },
                        "ec.IS_DELETED": ApplicationConstants.N,
                        "sc.STATUS_TYPE": "ECLAIMS"
                    }
                })
                .groupBy("ec.REQUEST_STATUS", "sc.STATUS_ALIAS");
        }

        const result = await cds.run(query);
        return result || [];

    } catch (error) {
        console.error('Error in filterQueryStatus:', error);
        return [];
    }
}

/**
 * Filters task details data
 * @param {string} staffId - Staff ID or NUSNET ID
 * @param {Array} statusList - Optional list of status codes to filter by
 * @returns {Promise<Array>} Array of TaskFilterDto objects
 */
async function filterQueryTaskDetails(staffId, statusList = null) {
    try {
        let query;

        if (statusList && statusList.length > 0) {
            // Filter by specific status codes
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA as ec")
                .columns("td.TASK_INST_ID", "td.TASK_NAME", "td.TASK_STATUS")
                .join("NUSEXT_UTILITY_PROCESS_DETAILS as pd").on("ec.DRAFT_ID = pd.REFERENCE_ID")
                .join("NUSEXT_UTILITY_TASK_DETAILS as td").on("pd.PROCESS_INST_ID = td.PROCESS_INST_ID")
                .where({
                    and: {
                        "ec.STAFF_ID": staffId.toUpperCase(),
                        or: { "ec.STAFF_NUSNET_ID": staffId.toUpperCase() },
                        "ec.REQUEST_STATUS": { in: statusList },
                        "ec.IS_DELETED": ApplicationConstants.N,
                        "pd.IS_DELETED": ApplicationConstants.N,
                        "td.IS_DELETED": ApplicationConstants.N
                    }
                })
                .groupBy("td.TASK_INST_ID", "td.TASK_NAME", "td.TASK_STATUS");
        } else {
            // Get all task details
            query = SELECT.from("NUSEXT_ECLAIMS_HEADER_DATA as ec")
                .columns("td.TASK_INST_ID", "td.TASK_NAME", "td.TASK_STATUS")
                .join("NUSEXT_UTILITY_PROCESS_DETAILS as pd").on("ec.DRAFT_ID = pd.REFERENCE_ID")
                .join("NUSEXT_UTILITY_TASK_DETAILS as td").on("pd.PROCESS_INST_ID = td.PROCESS_INST_ID")
                .where({
                    and: {
                        "ec.STAFF_ID": staffId.toUpperCase(),
                        or: { "ec.STAFF_NUSNET_ID": staffId.toUpperCase() },
                        "ec.IS_DELETED": ApplicationConstants.N,
                        "pd.IS_DELETED": ApplicationConstants.N,
                        "td.IS_DELETED": ApplicationConstants.N
                    }
                })
                .groupBy("td.TASK_INST_ID", "td.TASK_NAME", "td.TASK_STATUS");
        }

        const result = await cds.run(query);
        return result || [];

    } catch (error) {
        console.error('Error in filterQueryTaskDetails:', error);
        return [];
    }
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
    fetchByRequestId,
    fetchDraftStatusEclaimsData,
    fetchSubmittedStatusEclaimsData,
    fetchPastThreeMonthsWbs,
    upsertEclaimsData,
    updateRequestStatusOnTaskCompletion,
    softDeleteByDraftId,
    filterQueryRequestIdAndStatus,
    filterQueryClaimType,
    filterQueryMonthAndYear,
    filterQueryStatus,
    filterQueryTaskDetails,
};
