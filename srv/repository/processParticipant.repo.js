const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

    async function fetchRole (STF_NUMBER) {
        const queryParameter = ` STAFF_ID = '${STF_NUMBER}' AND USER_DESIGNATION <> 'VERIFIER' `
        let fetchRole = await cds.run(SELECT.distinct.from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS")
        .columns("USER_DESIGNATION")
            .where(queryParameter));
        return fetchRole;
    }
    async function fetchPPNTIdDtls (draftId) {
        const queryParameter = ` REFERENCE_ID = '${draftId}'`
        let fetchPPNTIdDtls = await cds.run(SELECT.distinct.from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS")
        .columns("PPNT_ID")
            .where(queryParameter));
        return fetchPPNTIdDtls;
    }

    async function softDeleteByPPNTId(tx,ppntIds) {
        const query = ` update NUSEXT_UTILITY_PROCESS_PARTICIPANTS set IS_DELETED='Y' where PPNT_ID in ('${ppntIds}') `;
        const softDeleteByPPNTId = tx.run(query);
        return softDeleteByPPNTId;
    }
    module.exports = {
        fetchRole,
        fetchPPNTIdDtls,
        softDeleteByPPNTId
    }