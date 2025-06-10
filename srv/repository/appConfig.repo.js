const cds = require("@sap/cds");

/**
 *
 * @param CONFIG_KEY
 * @param PROCESS_CODE
 */
async function fetchByConfigKeyAndProcessCode(CONFIG_KEY, PROCESS_CODE) {
    const fetchByConfigKeyAndProcessCode = await cds.run(
        SELECT.from("NUSEXT_UTILITY_APP_CONFIGS").where({ CONFIG_KEY, PROCESS_CODE })
    );
    return fetchByConfigKeyAndProcessCode || null;
}

module.exports = {
    fetchByConfigKeyAndProcessCode,
};
