const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");
const { PROCESS_CODE } = require("../util/constant");
module.exports = {
    fetchHeaderList: async function (fieldType, processCode) {
        const queryParameter = ` FIELD_TYPE = '${fieldType}' AND IS_ACTIVE = 'X' AND PROCESS_CODE = '${processCode}' `
        let fetchHeaderList = await cds.run(
            SELECT
                .from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .where(queryParameter));
        return fetchHeaderList;
    },
    fetchHeaderDetails: async function (refKey, processCode) {
        const queryParameter = ` REFERENCE_KEY = '${refKey}' AND IS_ACTIVE = 'X' AND PROCESS_CODE = '${processCode}' `
        let fetchHeaderDetails = await cds.run(
            SELECT
                .from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .where(queryParameter)
                .orderBy("SEQUENCE")
        );
        return fetchHeaderDetails;
    },
    fetchStatusDetailsByRoles: async function (refKey, processCode, role,rolePropertyKey) {
        let roles = [];
        if(rolePropertyKey){
            roles = [
                ...new Set(
                    role
                        .map(roleObj => roleObj[rolePropertyKey])
                        .filter(Boolean)
                )
            ];
        }else{
            roles = Array.isArray(role) ? role : [role];
        }
        // let roles = Array.isArray(role) ? role : [role];
        // const queryParameter = ` REFERENCE_KEY = '${refKey}' AND ACCESS_ROLE in (${role}) AND IS_ACTIVE = 'X' AND PROCESS_CODE = '${processCode}' `
        let fetchStatusDetailsByRoles = await cds.run(
            SELECT
                .distinct
                .from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .columns('CONFIG_KEY' )
                .where({
                    REFERENCE_KEY : refKey,
                    ACCESS_ROLE: {
                        in : roles
                    },
                    IS_ACTIVE : 'X',
                    PROCESS_CODE : processCode
                })
                // .orderBy("SEQUENCE")
        );
        return fetchStatusDetailsByRoles;
    },
    fetchStatusDetailsByRole: async function (refKey, processCode, role,rolePropertyKey) {
        let roles = [];
        if(rolePropertyKey){
            roles = [
                ...new Set(
                    role
                        .map(roleObj => roleObj[rolePropertyKey])
                        .filter(Boolean)
                )
            ];
        }else{
            roles = Array.isArray(role) ? role : [role];
        }
        // const queryParameter = ` REFERENCE_KEY = '${refKey}' AND ACCESS_ROLE in ('${role}') AND PROCESS_CODE = '${processCode}' `
        let fetchStatusDetailsByRoles = await cds.run(
            SELECT
                .from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .where({
                    REFERENCE_KEY : refKey,
                    ACCESS_ROLE: {
                        in : roles
                    },
                    PROCESS_CODE : processCode
                })
                .orderBy("SEQUENCE")
        );
        return fetchStatusDetailsByRoles;
    },
    fetchHeaderListByRole: async function (fieldType, role, processCode) {
        let roles = Array.isArray(role) ? role : [role];
        let fetchHeaderListByRole = await cds.run(
            SELECT
                .from("NUSEXT_UTILITY_DASHBOARD_CONFIG")
                .where({
                    FIELD_TYPE : fieldType,
                    ACCESS_ROLE: {
                        in : roles
                    },
                    IS_ACTIVE : 'X',
                    PROCESS_CODE : processCode
                })
                .orderBy("SEQUENCE")
        );
        return fetchHeaderListByRole;
    },
    fetchClaimCode: async function (refKey, processCode, staffId) {
        const queryParameter = ` dc.REFERENCE_KEY = '${refKey}' AND dc.IS_ACTIVE = 'X'AND dc.PROCESS_CODE = '${processCode}' AND ec.STF_NUMBER = '${staffId}'`;
        let fetchCostDist = await cds.run(
            SELECT
                .from(' NUSEXT_UTILITY_DASHBOARD_CONFIG  as dc ')
                .columns('dc.CONFIG_KEY', 'dc.CONFIG_VALUE' )
                .join(' NUSEXT_MASTER_DATA_CHRS_ELIG_CRITERIA AS ec ')
                .on(' ec.CLAIM_TYPE = dc.CONFIG_KEY ')
                .where(queryParameter)
        );
        return fetchCostDist;
    }
}