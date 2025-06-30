const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 *
 * @param STF_NUMBER
 */
async function fetchRole(STF_NUMBER) {
    let fetchRole = await cds.run(
        SELECT.distinct
            .from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS")
            .columns("USER_DESIGNATION")
            .where({
                STAFF_ID: STF_NUMBER,
                USER_DESIGNATION: { "!=": "VERIFIER" }
            })
    );
    return fetchRole;
}

/**
 *
 * @param draftId
 */
async function fetchPPNTIdDtls(draftId) {
    let fetchPPNTIdDtls = await cds.run(
        SELECT.distinct
            .from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS")
            .columns("PPNT_ID")
            .where({
                REFERENCE_ID: draftId
            })
    );
    return fetchPPNTIdDtls;
}

/**
 *
 * @param tx
 * @param ppntIds
 */
async function softDeleteByPPNTId(tx, ppntIds) {
    const query = `UPDATE NUSEXT_UTILITY_PROCESS_PARTICIPANTS SET IS_DELETED = 'Y' WHERE PPNT_ID IN (?)`;
    const values = [ppntIds];
    const softDeleteByPPNTId = await tx.run(query, values);
    return softDeleteByPPNTId;
}

module.exports = {
    fetchRole,
    fetchPPNTIdDtls,
    softDeleteByPPNTId,
    fetchProcessParticipant: async function (STF_NUMBER) {
        let fetchProcessParticipant = await cds.run(
            SELECT.from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS").where({
                STAFF_ID: STF_NUMBER,
                USER_DESIGNATION: { "!=": "VERIFIER" }
            })
        );
        return fetchProcessParticipant;
    },
    fetchProcessParticipantByDraftId: async function (draftId) {
        let fetchProcessParticipantByDraftId = await cds.run(
            SELECT.from("NUSEXT_UTILITY_PROCESS_PARTICIPANTS").where({
                REFERENCE_ID: draftId
            })
        );
        return fetchProcessParticipantByDraftId;
    },
    softDeleteProcessParticipant: async function (ppntIds) {
        const query = `UPDATE NUSEXT_UTILITY_PROCESS_PARTICIPANTS SET IS_DELETED = 'Y' WHERE PPNT_ID IN (?)`;
        const values = [ppntIds];
        let softDeleteProcessParticipant = await cds.run(query, values);
        return softDeleteProcessParticipant;
    },
};
