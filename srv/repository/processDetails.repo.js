const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
async function fetchByReferenceId(referenceId,processCode) {
    let query = ` SELECT * FROM NUSEXT_UTILITY_PROCESS_DETAILS WHERE REFERENCE_ID = ? AND PROCESS_CODE = ? `;
    let fetchByReferenceId = await cds.run(query,[referenceId,processCode]);
    return fetchByReferenceId;
}

module.exports = {
    fetchByReferenceId
};