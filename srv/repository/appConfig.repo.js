const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Fetch configuration by config key and process code
 * @param {string} CONFIG_KEY - Configuration key
 * @param {string} PROCESS_CODE - Process code
 * @returns {Object|null} Configuration object or null
 */
async function fetchByConfigKeyAndProcessCode(CONFIG_KEY, PROCESS_CODE) {
    const fetchByConfigKeyAndProcessCode = await cds.run(
        SELECT.from("NUSEXT_UTILITY_APP_CONFIGS").where({ CONFIG_KEY, PROCESS_CODE })
    );
    return fetchByConfigKeyAndProcessCode || null;
}

/**
 * Batch fetch configurations by config keys and process codes
 * @param {string} CONFIG_KEY - Configuration key
 * @param {Array<string>} PROCESS_CODES - Array of process codes
 * @returns {Object} Map of process code to configuration
 */
async function fetchConfigsByKeysAndProcessCodes(CONFIG_KEY, PROCESS_CODES) {
    if (!PROCESS_CODES || PROCESS_CODES.length === 0) {
        return {};
    }

    const configs = await cds.run(
        SELECT.from("NUSEXT_UTILITY_APP_CONFIGS")
            .where({
                CONFIG_KEY: CONFIG_KEY,
                PROCESS_CODE: { in: PROCESS_CODES }
            })
    );

    // Create a map for quick lookup
    const configMap = {};
    if (configs && configs.length > 0) {
        configs.forEach(config => {
            configMap[config.PROCESS_CODE] = config;
        });
    }

    return configMap;
}

module.exports = {
    fetchByConfigKeyAndProcessCode,
    fetchConfigsByKeysAndProcessCodes,
};
