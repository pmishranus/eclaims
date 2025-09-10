const ProcessConfigType = require("../enum/processConfigType");
const EmailResponseDto = require('../dto/EmailResponseDto');
const AppConfigRepo = require("../repository/appConfig.repo");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const EmailConfigRepo = require("../repository/emailConfig.repo")
const EmailPlaceholderConfigRepo = require("../repository/emailPlaceholderConfig.repo")
const CommonUtils = require("../util/commonUtil");
const { getMicrosoftAccessToken } = require("../config/getMicrosoftAccessToken");
async function sendOnDemandEmails(draftId, processCode, actionCode,
    requestorGrp, loggedInUserName, remarks, role, taskName,
    nextTaskName, staffId, userInfoDetails, tx) {

    console.info("EmailServiceImpl sendOnDemandEmails start()");

    const emailResponse = new EmailResponseDto();

    const pType = ProcessConfigType.fromValue(processCode);

    switch (pType) {
        case 'PTT':
        case 'CW':
        case 'OT':
        case 'HM':
        case 'TB':
            await handleOnDemandEmailsForEClaims(
                draftId, processCode, actionCode, requestorGrp, loggedInUserName, remarks,
                role, taskName, nextTaskName
            );
            break;
        case 'CWS':
        case 'NED':
        case 'OPWN':
            await handleOnDemandEmailsForCws(
                draftId, processCode, actionCode, requestorGrp, loggedInUserName, remarks,
                role, taskName, nextTaskName, staffId
            );
            break;
        default:
            break;
    }

    console.info("EmailServiceImpl sendOnDemandEmails end()");
    return emailResponse;

}

async function handleOnDemandEmailsForEClaims(
    draftId,
    processCode,
    actionCode,
    requestorGrp,
    loggedInUserName,
    rejectionRemarks,
    role,
    taskName,
    nextTaskName
) {
    console.info("EmailServiceImpl handleOnDemandEmailsForEClaims start()");
    let emailResponse = new EmailResponseDto();

    // Fetch configured task name if role is provided and not blank
    let tempTaskName = null;
    if (CommonUtils.isNotBlank(role)) {
        tempTaskName = await AppConfigRepo.fetchConfigValue(role, processCode);
    }
    tempTaskName = CommonUtils.isNotBlank(tempTaskName) ? tempTaskName[0].CONFIG_VALUE : taskName;

    // Handle Rejection Emails
    if (CommonUtils.isNotBlank(actionCode) &&
        CommonUtils.equalsIgnoreCase(actionCode, ApplicationConstants.ACTION_REJECT)
    ) {
        if (CommonUtils.isNotBlank(rejectionRemarks)) {
            emailResponse = await emailHandler(
                draftId, processCode, actionCode, requestorGrp, loggedInUserName,
                rejectionRemarks, tempTaskName, null, null
            );
        } else {
            emailResponse.frameEmailResponse("E", "Please provide Remarks for Rejection", "ERROR");
        }
    }

    // Handle Amendment Emails
    if (CommonUtils.isNotBlank(actionCode) &&
        CommonUtils.equalsIgnoreCase(actionCode, ApplicationConstants.ACTION_CHECK)
    ) {
        emailResponse = await emailHandler(
            draftId, processCode, actionCode, requestorGrp, loggedInUserName, null,
            tempTaskName, nextTaskName, null
        );
    }

    // Handle Retract Emails
    if (CommonUtils.isNotBlank(actionCode) &&
        CommonUtils.equalsIgnoreCase(actionCode, ApplicationConstants.ACTION_RETRACT)
    ) {
        emailResponse = await emailHandler(
            draftId, processCode, actionCode, requestorGrp, loggedInUserName, null,
            tempTaskName, null, null
        );
    }

    // Handle Acknowledgement Emails
    if (CommonUtils.isNotBlank(actionCode) &&
        CommonUtils.equalsIgnoreCase(actionCode, ApplicationConstants.ACTION_SUBMIT)
    ) {
        emailResponse = await emailHandler(
            draftId, processCode, actionCode, requestorGrp, loggedInUserName, null,
            tempTaskName, null, null
        );
    }

    console.info("EmailServiceImpl handleOnDemandEmailsForEClaims end()");
    return emailResponse;
}

async function emailHandler(
    draftId,
    processCode,
    actionCode,
    requestorGrp,
    loggedInUserName,
    remarks,
    taskName,
    nextTaskName,
    staffId
) {
    let emailResponse = new EmailResponseDto();
    let emailTemplate = null;
    let emailConfig = null;
    let mailIdMap = null;
    let templateName = null;
    let emailType = null;

    try {
        if (CommonUtils.isNotBlank(actionCode)) {
            emailConfig = await EmailConfigRepo.getEmailTemplateConfiguration(processCode, taskName, actionCode);
        } else if (CommonUtils.equalsIgnoreCase(nextTaskName, ApplicationConstants.CW_APPROVED_EMAIL)) {
            emailConfig = await EmailConfigRepo.getEmailTemplateConfigurationByTemplateName(
                processCode,
                nextTaskName,
                taskName
            );
        } else if (CommonUtils.equalsIgnoreCase(nextTaskName, ApplicationConstants.OPWN_APPROVED_EMAIL)) {
            emailConfig = await EmailConfigRepo.getEmailTemplateConfigurationByTemplateName(
                processCode,
                nextTaskName,
                taskName
            );
        } else {
            // Pending email task notification handling
            const processTemplateName = CommonUtils.equalsIgnoreCase(processCode, ApplicationConstants.CLAIM_TYPE_101)
                ? EmailConstants.ECLAIM_PENDING_EMAIL
                : EmailConstants.OTHM_PENDING_EMAIL;
            emailConfig = await EmailConfigRepo.getPendingEmailTemplateConfiguration(
                processCode,
                taskName,
                processTemplateName
            );
        }

        if (emailConfig) {
            emailType = emailConfig.EMAIL_TYPE;
            emailTemplate = await EmailConfigRepo.getEmailTemplate(emailConfig.TEMPLATE_NAME);

            if (emailTemplate) {
                templateName = emailTemplate.TEMPLATE_NAME;
                emailResponse.templateId = emailTemplate.TEMPLATE_NAME;

                const emailSubject = frameEmailSubject(
                    processCode,
                    emailConfig.TEMPLATE_NAME,
                    emailTemplate.MAIL_SUBJECT,
                    draftId,
                    taskName
                );

                const emailContent = frameEmailBody(
                    emailConfig.TEMPLATE_NAME,
                    emailTemplate.MAIL_BODY,
                    draftId,
                    taskName,
                    nextTaskName,
                    remarks,
                    processCode,
                    actionCode,
                    requestorGrp,
                    loggedInUserName
                );

                mailIdMap = await populateEmailIds(
                    draftId,
                    emailConfig,
                    processCode,
                    loggedInUserName,
                    actionCode,
                    false,
                    staffId,
                    requestorGrp
                );

                // const oauthSwitch = await AppConfigRepo.fetchConfigValueByConfigKey(ApplicationConstants.OAUTH_SWITCH_STATE);
                // const smtpCredentials = await utilSvc.retrieveCredentialsEntry(ApplicationConstants.SMTP_REF);
                // const tokenResponse = await OAuth2TokenFetcher.refreshAccessToken(smtpCredentials);

                // if (CommonUtils.equalsIgnoreCase(oauthSwitch, ApplicationConstants.Y)) {
                //     await sendMailWithOauth(emailSubject, emailContent, mailIdMap, tokenResponse, smtpCredentials, false);
                // } else {
                //     await sendMail_Prod(emailSubject, emailContent, mailIdMap);
                // }

                await sendMail(emailSubject, emailContent, mailIdMap);

                emailResponse.frameEmailResponse("S", "Mail Sent Successfully", "SUCCESS");

            } else {
                emailResponse.frameEmailResponse("E", "No Mail Template Exists", "ERROR");
            }
        } else {
            emailResponse.frameEmailResponse("E", "No Mail Configuration is maintained", "ERROR");
        }

    } catch (e) {
        console.error("Exception occurred in emailHandler", e);
        emailResponse.frameEmailResponse("E", "Mail sending FAILURE " + e.message, "ERROR");
    }

    // Maintain Notification Log
    await saveNotificationLog(
        draftId,
        templateName,
        emailType,
        mailIdMap,
        loggedInUserName,
        emailResponse.status,
        emailResponse.message
    );

    return emailResponse;
}

async function frameEmailSubject(processCode, templateName, emailSubject, draftId, taskName) {
    let subjectPHConfigs = [];
    let subjList = [];
    // Process type logic
    const pType = ProcessConfigType.fromValue(processCode);
    switch (pType) {
        case PTT:
        case CW:
        case OT:
        case HM:
        case TB:
            subjectPHConfigs = await EmailPlaceholderConfigRepo.getAllEmailPlaceHoldersForSubjectLine(templateName);
            subjList = await getClaimsData(subjectPHConfigs, draftId, false, processCode);
            break;
        case CWS:
        case NED:
        case OPWN:
            subjectPHConfigs = await EmailPlaceholderConfigRepo.getAllEmailPlaceHoldersForSubjectLine(templateName);
            subjList = await getCWData(subjectPHConfigs, draftId, false, processCode);
            break;
        case CWOPWN:
            subjectPHConfigs = await EmailPlaceholderConfigRepo.getAllEmailPlaceHoldersForSubjectLine(templateName);
            if (subjectPHConfigs.length > 0) {
                subjList = await getCWData(subjectPHConfigs, draftId, false, processCode);
            }
            break;
        default:
            // Do nothing
            break;
    }

    let subCnt = 0;

    if (subjList && subjList.length > 0) {
        subjList.forEach((item, idx) => {
            subCnt = idx + 1;
            emailSubject = emailSubject.replace(`\${SUB${subCnt}}`, item);
        });
    }

    for (let subjectConfig of subjectPHConfigs) {
        // Amend Constant values
        if (subjectConfig.FIELD_TYPE === 'Constant' && subjectConfig.TASK_NAME.toLowerCase() === taskName.toLowerCase()) {
            subCnt++;
            emailSubject = emailSubject.replace(`\${SUB${subCnt}}`, subjectConfig.FIELD_VALUE);
        }
        // Amend Reference Values (if needed)
        if (subjectConfig.FIELD_TYPE === 'Ref' && subjectConfig.FIELD_VALUE_PROP) {
            subCnt++;
            // Add logic for reference values if required
        }
    }

    // Email Subject For Constants in an Email
    let subjectPHConstantConfigs = await emailConfigRepository.getEmailPlaceHoldersForSubjectLineNTaskName(
        templateName, 'Constant', taskName
    );

    for (let phConstantConfig of subjectPHConstantConfigs) {
        if (phConstantConfig.FIELD_VALUE) {
            subCnt++;
            emailSubject = emailSubject.replace(`\${SUB${subCnt}}`, phConstantConfig.FIELD_VALUE);
        }
    }

    return emailSubject;
}
function buildSelectColumns(phConfigs) {
    return phConfigs
        .filter(ph => ph.FIELD_VALUE_PROP && ph.FIELD_TYPE !== 'Ref' && ph.FIELD_TYPE !== 'Constant')
        .map(ph => ph.FIELD_VALUE_PROP);
}

async function getClaimsData(phConfigs, draftId, isRequestRows, processCode) {
    // const db = cds.transaction(); // For transactional context; or use cds.run() if not in a service handler
    // const db = cds.connect.to("db");
    const selectColumns = buildSelectColumns(phConfigs);
    if (selectColumns.length === 0) {
        return [];
    }

    // Start building CDS query (use CQN or plain SQL if needed)
    let query = SELECT.from('NUSEXT_ECLAIMS_HEADER_DATA as EclaimsData').columns(selectColumns);

    // Joins
    query.leftJoin('NUSEXT_MASTER_DATA_MASTER_CLAIM_TYPE as MasterClaimType').on('MasterClaimType.CLAIM_TYPE_C = EclaimsData.CLAIM_TYPE');
    if (isRequestRows) {
        query.leftJoin('NUSTEXT_MASTER_DATA_CHRS_JOB_INFO as ChrsJobInfo').on('ChrsJobInfo.STF_NUMBER = EclaimsData.STAFF_ID');
    }

    // Where or group by
    if (draftId && processCode) {
        query.where({
            'EclaimsData.DRAFT_ID': draftId,
            'EclaimsData.CLAIM_TYPE': processCode
        });
    } else if (!draftId && processCode) {
        query.where({ 'EclaimsData.CLAIM_TYPE': processCode });
    } else {
        query.groupBy(...selectColumns);
    }

    // Execute
    const result = await cds.run(query);

    // Flatten the first result row's values (like in Java)
    let rsList = [];
    if (result && result.length) {
        const firstRow = result[0];
        if (Array.isArray(firstRow)) { // Might be array if raw SQL
            rsList = firstRow.map(String);
        } else if (typeof firstRow === 'object') { // CQN returns object
            rsList = selectColumns.map(col => String(firstRow[col] || ''));
        }
    }
    return rsList;
}

const cds = require('@sap/cds');

async function getCWData(phConfigs, draftId, isRequestRows, processCode) {

    // Build select columns
    const selectColumns = phConfigs
        .filter(ph => ph.FIELD_VALUE_PROP)
        .map(ph => ph.FIELD_VALUE_PROP);

    if (selectColumns.length === 0) return [];

    // Start query
    let query = SELECT.from('NUSEXT_CWNED_HEADER_DATA as CwsData').columns(selectColumns);

    // Joins
    query.leftJoin('NUSTEXT_MASTER_DATA_CHRS_JOB_INFO AS ChrsJobInfo').on('ChrsJobInfo.chrsJobInfoId.SF_STF_NUMBER = CwsData.STAFF_ID');
    query.leftJoin('NUSEXT_UTILITY_CWS_APP_CONFIGS as cwcfg_rtype').on('cwcfg_rtype.CONFIG_KEY = CwsData.REQUEST_TYPE');
    query.leftJoin('NUSEXT_UTILITY_CWS_APP_CONFIGS as cwcfg_subtype').on('cwcfg_subtype.CONFIG_KEY = CwsData.SUB_TYPE');

    if (isRequestRows) {
        query.leftJoin('NUSEXT_CWNED_PAYMENT_DATA AS CwsPayments').on('CwsPayments.REFERENCE_ID = CwsData.REQ_UNIQUE_ID');
        query.leftJoin('NUSTEXT_MASTER_DATA_CHRS_FDLU_ULU AS ChrsFdluUlu').on('CwsData.FDLU = ChrsFdluUlu.FDLU_C');
    }

    // Where/group by logic
    if (draftId) {
        query.where({ 'CwsData.REQ_UNIQUE_ID': draftId });
    } else if (processCode) {
        query.where({ 'CwsData.PROCESS_CODE': processCode });
    } else {
        query.groupBy(...selectColumns);
    }

    // Execute
    const result = await db.run(query);
    if (!result || result.length === 0) return [];

    // Filter null/undefined rows
    let filterTempList = result.filter(row => row);

    // Take first non-null row
    if (filterTempList.length === 0) return [];

    let firstRow = filterTempList[0];
    let rsList = [];

    // If row is array (unlikely with CQN), flatten; otherwise, handle as object
    if (Array.isArray(firstRow)) {
        // Some DB drivers may return rows as arrays
        rsList = firstRow.map(value => {
            if (value instanceof Date) return formatDateToDDMMMYYYY(value);
            if (typeof value === 'number') return value.toString();
            return value ? value.toString() : '';
        });
    } else if (typeof firstRow === 'object') {
        rsList = selectColumns.map(col => {
            let value = firstRow[col];
            if (value instanceof Date) return formatDateToDDMMMYYYY(value);
            if (typeof value === 'number') return value.toString();
            return value ? value.toString() : '';
        });
    }
    return rsList;
}


async function sendMail(subject, content, emailIdMap) {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const senderEmail = process.env.SENDER_EMAIL;
    // Fetch access token
    const accessToken = await getMicrosoftAccessToken(tenantId, clientId, clientSecret, senderEmail);

    // Create transport
    let transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false, // TLS
        auth: {
            type: 'OAuth2',
            user: senderEmail,
            accessToken: accessToken,
            clientId: clientId,
            clientSecret: clientSecret,
            refreshToken: '', // Not required for client_credentials
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    // Send mail
    let info = await transporter.sendMail({
        from: senderEmail,
        emailIdMap,
        subject,
        content,
    });

    console.log("Message sent: %s", info.messageId);

}


module.exports = {
    sendOnDemandEmails
}