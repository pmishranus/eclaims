const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { PROCESS_CODE } = require("../util/constant");

module.exports = {
    fetchHeaderList: async function (fieldType, processCode) {
        let fetchHeaderList = await cds.run(
            SELECT.from("NUSEXT_UTILITY_DASHBOARD_CONFIG").where({
                FIELD_TYPE: fieldType,
                IS_ACTIVE: "X",
                PROCESS_CODE: processCode
            })
        );
        return fetchHeaderList;
    },

    fetchHeaderDetails: async function (refKey, processCode) {
        let fetchHeaderDetails = await cds.run(
            SELECT.from("NUSEXT_UTILITY_DASHBOARD_CONFIG").where({
                REFERENCE_KEY: refKey,
                IS_ACTIVE: "X",
                PROCESS_CODE: processCode
            }).orderBy("SEQUENCE")
        );
        return fetchHeaderDetails;
    },

    fetchStatusDetailsByRoles: async function (refKey, processCode, role, rolePropertyKey) {
        let roles = [];
        if (rolePropertyKey) {
            roles = [...new Set(role.map(roleObj => roleObj[rolePropertyKey]).filter(Boolean))];
        } else {
            roles = Array.isArray(role) ? role : [role];
        }
        let fetchStatusDetailsByRoles = await cds.run(
            SELECT.distinct
                .from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .columns("CONFIG_KEY")
                .where({
                    REFERENCE_KEY: refKey,
                    ACCESS_ROLE: {
                        in: roles,
                    },
                    IS_ACTIVE: "X",
                    PROCESS_CODE: processCode,
                })
        );
        return fetchStatusDetailsByRoles;
    },

    fetchStatusDetailsByRole: async function (refKey, processCode, role, rolePropertyKey) {
        let roles = [];
        if (rolePropertyKey) {
            roles = [...new Set(role.map(roleObj => roleObj[rolePropertyKey]).filter(Boolean))];
        } else {
            roles = Array.isArray(role) ? role : [role];
        }
        let fetchStatusDetailsByRoles = await cds.run(
            SELECT.from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .where({
                    REFERENCE_KEY: refKey,
                    ACCESS_ROLE: {
                        in: roles,
                    },
                    PROCESS_CODE: processCode,
                })
                .orderBy("SEQUENCE")
        );
        return fetchStatusDetailsByRoles;
    },

    fetchHeaderListByRole: async function (fieldType, role, processCode) {
        let roles = Array.isArray(role) ? role : [role];
        let fetchHeaderListByRole = await cds.run(
            SELECT.from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .where({
                    FIELD_TYPE: fieldType,
                    ACCESS_ROLE: {
                        in: roles,
                    },
                    IS_ACTIVE: "X",
                    PROCESS_CODE: processCode,
                })
                .orderBy("SEQUENCE")
        );
        return fetchHeaderListByRole;
    },

    fetchClaimCode: async function (refKey, processCode, staffId) {
        const query = `
            SELECT dc.CONFIG_KEY, dc.CONFIG_VALUE
            FROM NUSEXT_UTILITY_DASHBOARD_CONFIG as dc
            JOIN NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA AS ec ON ec.CLAIM_TYPE = dc.CONFIG_KEY
            WHERE dc.REFERENCE_KEY = ? 
            AND dc.IS_ACTIVE = 'X'
            AND dc.PROCESS_CODE = ?
            AND ec.STF_NUMBER = ?
        `;
        const values = [refKey, processCode, staffId];
        let fetchCostDist = await cds.run(query, values);
        return fetchCostDist;
    },
};
