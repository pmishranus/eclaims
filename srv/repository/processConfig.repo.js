const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetches process configuration by process code
 * @param {string} processCode - The process code
 * @returns {Promise<object|null>} The process configuration
 */
async function fetchProcessConfigByProcessCode(processCode) {
    const query = SELECT.one
        .from("NUSEXT_UTILITY_PROCESS_CONFIG")
        .where({ PROCESS_CODE: processCode });

    const result = await cds.run(query);
    return result || null;
}

module.exports = {
    fetchProcessConfigByProcessCode
};
