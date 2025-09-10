const cds = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

/**
 * Email Configuration Repository
 * Handles email template configuration and email template data
 */

/**
 * Get email template configuration by process code, task name, and action code
 * @param {string} processCode - The process code
 * @param {string} taskName - The task name
 * @param {string} actionCode - The action code
 * @returns {Promise<Object|null>} Email configuration object or null
 */
async function getEmailTemplateConfiguration(processCode, taskName, actionCode) {
    console.log("EmailConfigRepo getEmailTemplateConfiguration - processCode:", processCode, "taskName:", taskName, "actionCode:", actionCode);

    try {
        const config = await cds.run(
            SELECT.from("NUSEXT_UTILITY_EMAIL_CONFIGS")
                .where({
                    PROCESS_CODE: processCode,
                    TASK_NAME: taskName,
                    ACTION_CODE: actionCode
                })
        );

        return config && config.length > 0 ? config[0] : null;
    } catch (error) {
        console.error("Error in getEmailTemplateConfiguration:", error);
        return null;
    }
}

/**
 * Get email template configuration by template name
 * @param {string} processCode - The process code
 * @param {string} templateName - The template name
 * @param {string} taskName - The task name
 * @returns {Promise<Object|null>} Email configuration object or null
 */
async function getEmailTemplateConfigurationByTemplateName(processCode, templateName, taskName) {
    console.log("EmailConfigRepo getEmailTemplateConfigurationByTemplateName - processCode:", processCode, "templateName:", templateName, "taskName:", taskName);

    try {
        const config = await cds.run(
            SELECT.from("NUSEXT_UTILITY_EMAIL_CONFIGS")
                .where({
                    PROCESS_CODE: processCode,
                    TEMPLATE_NAME: templateName,
                    TASK_NAME: taskName
                })
        );

        return config && config.length > 0 ? config[0] : null;
    } catch (error) {
        console.error("Error in getEmailTemplateConfigurationByTemplateName:", error);
        return null;
    }
}

/**
 * Get pending email template configuration
 * @param {string} processCode - The process code
 * @param {string} taskName - The task name
 * @param {string} processTemplateName - The process template name
 * @returns {Promise<Object|null>} Email configuration object or null
 */
async function getPendingEmailTemplateConfiguration(processCode, taskName, processTemplateName) {
    console.log("EmailConfigRepo getPendingEmailTemplateConfiguration - processCode:", processCode, "taskName:", taskName, "processTemplateName:", processTemplateName);

    try {
        const config = await cds.run(
            SELECT.from("NUSEXT_UTILITY_EMAIL_CONFIGS")
                .where({
                    PROCESS_CODE: processCode,
                    TASK_NAME: taskName,
                    TEMPLATE_NAME: processTemplateName
                })
        );

        return config && config.length > 0 ? config[0] : null;
    } catch (error) {
        console.error("Error in getPendingEmailTemplateConfiguration:", error);
        return null;
    }
}

/**
 * Get email template by template name
 * @param {string} templateName - The template name
 * @returns {Promise<Object|null>} Email template object or null
 */
async function getEmailTemplate(templateName) {
    console.log("EmailConfigRepo getEmailTemplate - templateName:", templateName);

    try {
        const template = await cds.run(
            SELECT.from("NUSEXT_UTILITY_EMAIL_TEMPLATES")
                .where({
                    TEMPLATE_NAME: templateName
                })
        );

        return template && template.length > 0 ? template[0] : null;
    } catch (error) {
        console.error("Error in getEmailTemplate:", error);
        return null;
    }
}

module.exports = {
    getEmailTemplateConfiguration,
    getEmailTemplateConfigurationByTemplateName,
    getPendingEmailTemplateConfiguration,
    getEmailTemplate
};
