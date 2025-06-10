const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { fetchUluFdlu } = require("./util.repo");
const { CQL } = cds;

/**
 *
 * @param staffId
 * @param userGroup
 */
async function fetchUluFdluDetails(staffId, userGroup) {
    const query = ` SELECT DISTINCT * from APPROVERMATRIX_STAFF_BASED_USERGROUP_ULU_FDLU(?,?)`;
    let fetchUluFdluDetails = await cds.run(query, [staffId, userGroup]);
    return fetchUluFdluDetails;
}

/**
 *
 * @param staffID
 * @param userGroup
 * @param claimType
 */
async function fetchCAUluFdluDetails(staffID, userGroup, claimType) {
    const currentDate = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    // let checkfdlu = cds.parse.expr("CASE WHEN am.FDLU = 'ALL' THEN u.FDLU_C ELSE am.FDLU END");
    let query = SELECT.distinct
        .from("NUSEXT_UTILITY_CHRS_APPROVER_MATRIX")
        .alias("am")
        .join("NUSEXT_MASTER_DATA_CHRS_FDLU_ULU as u")
        .on("am.ULU = u.ULU_C and am.FDLU = u.FDLU_C")
        .where({
            "am.PROCESS_CODE": claimType,
            "am.STAFF_USER_GRP": userGroup,
            "am.VALID_FROM": {
                "<=": currentDate,
            },
            "am.VALID_TO": {
                ">=": currentDate,
            },
            "am.IS_DELETED": "N",
            and: {
                "UPPER(am.STAFF_NUSNET_ID)": staffID.toUpperCase(),
                or: { "am.STAFF_ID": staffID },
            },
        })
        .columns("u.ULU_C", "u.ULU_T", "u.FDLU_C", "u.FDLU_T", "am.VALID_FROM", "am.VALID_TO", "STAFF_NUSNET_ID");
    let fetchCAUluFdluDetails = await cds.run(query);

    return fetchCAUluFdluDetails;

    // return fetchCAUluFdluDetails.filter(
    //     row =>
    //       row.FDLU_C === (row.FDLU === 'ALL' ? row.FDLU_C : row.FDLU)
    //   );
}

module.exports = {
    fetchUluFdluDetails,
    fetchCAUluFdluDetails,
};
