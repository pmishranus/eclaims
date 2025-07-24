/* eslint-disable no-use-before-define */
const CommonRepo = require("../repository/util.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
// const RequestLockDetailsRepo = require("../repository/requestLockDetails.repo");
// const ProcessParticipantsRepo = require("../repository/processParticipant.repo");
// const ElligibilityCriteriaRepo = require("../repository/eligibilityCriteria.repo");
const DateToWeekRepo = require("../repository/dateToWeek.repo");
const EclaimsItemDataRepo = require("../repository/eclaimsItemData.repo");
const CommonUtils = require("../util/commonUtil");
const DateUtils = require("../util/dateUtil");
const ValidationResultsDto = require("../dto/validationResultsDto");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const RateTypeConfig = require("../enum/rateTypeConfig");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
/**
 * Fetches the role for the mass upload request.
 * @param {Array} massUploadRequest - The mass upload request array.
 * @returns {Promise<string>} The role.
 */
async function fetchRole(massUploadRequest) {
    let rolePassed = "";
    if (Array.isArray(massUploadRequest) && massUploadRequest.length > 0) {
        for (const item of massUploadRequest) {
            if (CommonUtils.isEmpty(item.ACTION)) {
                throw new Error("No ACTION passed. Please provide valid action.");
            }
            if (CommonUtils.isNotBlank(item.ROLE)) {
                switch (item.ROLE) {
                    case ApplicationConstants.ESS:
                        rolePassed = ApplicationConstants.ESS;
                        break;
                    case ApplicationConstants.CA:
                        rolePassed = ApplicationConstants.CA;
                        break;
                    case ApplicationConstants.APPROVER:
                        rolePassed = ApplicationConstants.APPROVER;
                        break;
                    case ApplicationConstants.VERIFIER:
                        rolePassed = ApplicationConstants.VERIFIER;
                        break;
                    case ApplicationConstants.ADDITIONAL_APP_1:
                        rolePassed = ApplicationConstants.ADDITIONAL_APP_1;
                        break;
                    case ApplicationConstants.ADDITIONAL_APP_2:
                        rolePassed = ApplicationConstants.ADDITIONAL_APP_2;
                        break;
                    case ApplicationConstants.REPORTING_MGR:
                        rolePassed = ApplicationConstants.REPORTING_MGR;
                        break;
                    default:
                        rolePassed = "";
                }
            }
        }
    }
    return rolePassed;
}

/**
 * Validates eclaims data.
 * @param {Object} item - The claim item.
 * @param {string} roleFlow - The role flow.
 * @param {string} requestorGroup - The requestor group.
 * @param {Object} loggedInUserDetails - The user info.
 * @returns {Promise<Array>} The validation results.
 */
async function validateEclaimsData(item, roleFlow, requestorGroup, loggedInUserDetails) {
    let response = [];

    try {
        if (item !== null && item !== undefined) {
            response = emptyCheck(item);

            if (
                item.selectedClaimDates !== null &&
                item.selectedClaimDates !== undefined &&
                item.ACTION.toUpperCase() !== ApplicationConstants.ACTION_SAVE.toUpperCase()
            ) {
                const itemDataValidationResults = await itemDataValidation(
                    item,
                    roleFlow,
                    requestorGroup,
                    loggedInUserDetails
                );
                if (
                    itemDataValidationResults !== null &&
                    itemDataValidationResults !== undefined &&
                    itemDataValidationResults.length > 0
                ) {
                    for (const itemDataValidationResult of itemDataValidationResults) {
                        response.push(itemDataValidationResult);
                    }
                }
            }
        } else {
            const validationResultsDto = frameValidationMessage("Eclaims", "Request is empty/not valid.");
            response.push(validationResultsDto);
        }
    } catch (error) {
        if (error instanceof ApplicationException) {
            throw error;
        } else {
            throw new Error("An unexpected error occurred");
        }
    }

    return response;
}

/**
 * Checks if the item is empty.
 * @param {Object} item - The claim item.
 * @returns {boolean}
 */
function emptyCheck(item) {
    const response = [];

    if (!item.CLAIM_TYPE || item.CLAIM_TYPE.trim() === "") {
        const validationResultsDto = frameValidationMessage("CLAIM_TYPE", "Claim Type is missing.");
        response.push(validationResultsDto);
    }

    if (!item.CLAIM_MONTH || item.CLAIM_MONTH.trim() === "") {
        const validationResultsDto = frameValidationMessage("CLAIM_MONTH", "Claim Month is missing.");
        response.push(validationResultsDto);
    }

    if (!item.ULU || item.ULU.trim() === "") {
        const validationResultsDto = frameValidationMessage("ULU", "ULU is missing.");
        response.push(validationResultsDto);
    }

    if (!item.FDLU || item.FDLU.trim() === "") {
        const validationResultsDto = frameValidationMessage("FDLU", "FDLU is missing.");
        response.push(validationResultsDto);
    }

    if (!item.CLAIM_REQUEST_TYPE || item.CLAIM_REQUEST_TYPE.trim() === "") {
        const validationResultsDto = frameValidationMessage("CLAIM_REQUEST_TYPE", "ClaimRequestType is missing.");
        response.push(validationResultsDto);
    }

    if (!item.STAFF_ID || item.STAFF_ID.trim() === "") {
        const validationResultsDto = frameValidationMessage("STAFF_ID", "staffId is missing.");
        response.push(validationResultsDto);
    }

    if (!item.ACTION || item.ACTION.trim() === "") {
        const validationResultsDto = frameValidationMessage(
            "ACTION",
            "Action is missing. Please provide Action - SAVE/SUBMIT."
        );
        response.push(validationResultsDto);
    }

    if (!item.ROLE || item.ROLE.trim() === "") {
        const validationResultsDto = frameValidationMessage("ROLE", "Role is missing.");
        response.push(validationResultsDto);
    }

    if (!item.REQUEST_STATUS || item.REQUEST_STATUS.trim() === "") {
        const validationResultsDto = frameValidationMessage("REQUEST_STATUS", "Request Status is missing.");
        response.push(validationResultsDto);
    }

    if (
        (item.ACTION.toUpperCase() === ApplicationConstants.ACTION_SUBMIT.toUpperCase() ||
            item.ACTION.toUpperCase() === ApplicationConstants.ACTION_CHECK.toUpperCase() ||
            item.ACTION.toUpperCase() === ApplicationConstants.ACTION_REJECT.toUpperCase()) &&
        (!item.selectedClaimDates || item.selectedClaimDates.length === 0)
    ) {
        const validationResultsDto = frameValidationMessage("ITEM", "Please provide claim dates.");
        response.push(validationResultsDto);
    }

    return response;
}

/**
 * Validates item data for eclaims.
 * @param {Object} item - The claim item.
 * @param {string} roleFlow - The role flow.
 * @param {string} requestorGroup - The requestor group.
 * @param {Object} loggedInUserDetails - The user info.
 * @returns {Promise<Array>} The validation results.
 */
async function itemDataValidation(item, roleFlow, requestorGroup, loggedInUserDetails) {

    try{
        const response = [];

        // Section 1: Current month claim existence check
        const claimType = item.CLAIM_TYPE;
        const claimRequestTypeNumber = item.CLAIM_REQUEST_TYPE_NUMBER;
        const action = item.ACTION;
        const claimMonth = item.CLAIM_MONTH;
    
        if (
            (!CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_101) &&
                !CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102)) ||
            (CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
                CommonUtils.equalsIgnoreCase(
                    claimRequestTypeNumber,
                    ApplicationConstants.CLAIM_REQUEST_TYPE_MONTHLY_NUMBER
                ))
        ) {
            // check if claim exists for current month
            if (
                CommonUtils.equalsIgnoreCase(action, ApplicationConstants.ACTION_SUBMIT) &&
                claimMonth &&
                claimMonth.includes(ApplicationConstants.HYPHEN)
            ) {
                const [month, year] = claimMonth.split(ApplicationConstants.HYPHEN);
                // Async repository method!
                const count = await EclaimsHeaderDataRepo.fetchMonthlyClaims(month, year, item.STAFF_ID, claimType);
                if (count > 0) {
                    response.push(
                        frameItemValidationMsg(
                            claimMonth,
                            ApplicationConstants.CLAIM_EXISTS,
                            "Claim already exists for the provided month."
                        )
                    );
                }
            }
        }
    
        // Section 2: Backdated daily claims - max 2 allowed
        if (
            CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
            CommonUtils.equalsIgnoreCase(claimRequestTypeNumber, ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY_NUMBER)
        ) {
            if (
                CommonUtils.equalsIgnoreCase(action, ApplicationConstants.ACTION_SUBMIT) &&
                claimMonth &&
                claimMonth.includes(ApplicationConstants.HYPHEN)
            ) {
                const [month, year] = claimMonth.split(ApplicationConstants.HYPHEN);
                const enteredMonth = new Date(parseInt(year), parseInt(month) - 1);
                const now = new Date();
                const currentMonth = new Date(now.getFullYear(), now.getMonth());
    
                // Equivalent to enteredMonth.before(currentMonth)
                if (enteredMonth < currentMonth) {
                    // Fetch boundaries for current calendar month
                    const inputDates = DateUtils.fetchDatesFromMonthAndYear(now.getMonth() + 1, now.getFullYear());
                    // Async repository method!
                    const count = await EclaimsHeaderDataRepo.fetchMonthlyClaimsOnSubmittedOn(
                        month,
                        year,
                        item.STAFF_ID,
                        claimType,
                        inputDates[0],
                        inputDates[1]
                    );
                    if (count >= 2) {
                        response.push(
                            frameItemValidationMsg(
                                claimMonth,
                                ApplicationConstants.CLAIM_EXISTS,
                                "Only 2 backdated claims are allowed."
                            )
                        );
                    }
                }
            }
        }
    
        // Section 3: Check Reporting Manager info
        if (
            CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
            CommonUtils.isNotBlank(item.STAFF_ID)
        ) {
            const userInfoDetails = loggedInUserDetails;
            if (userInfoDetails && userInfoDetails.RM_STF_N) {
                const rmDetails = await CommonRepo.fetchLoggedInUser(userInfoDetails.RM_STF_N);
                if (rmDetails && CommonUtils.isBlank(rmDetails.STAFF_ID)) {
                    response.push(
                        frameItemValidationMsg(
                            claimMonth,
                            "REPORTING_MANAGER",
                            `Reporting Manager maintained for '${item.STAFF_ID}' staff is not present.`
                        )
                    );
                }
            }
        }
    
        // Section 4: Per-date validations
        for (let selectedClaimDates of item.selectedClaimDates || []) {
            if (selectedClaimDates) {
                // Set WEEK_NO (simulate repository call)
                const weekResult = await DateToWeekRepo.fetchWeekOfTheDay(
                    selectedClaimDates.CLAIM_START_DATE
                );
                selectedClaimDates.WEEK_NO = weekResult && weekResult.length > 0 ? weekResult[0].WEEK : null;
    
                if (CommonUtils.isBlank(selectedClaimDates.CLAIM_START_DATE)) {
                    response.push(
                        frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.CLAIM_START_DATE,
                            "Please provide StartDate."
                        )
                    );
                }
    
                if (CommonUtils.isBlank(selectedClaimDates.CLAIM_END_DATE)) {
                    response.push(
                        frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.CLAIM_END_DATE,
                            "Please provide EndDate."
                        )
                    );
                }
    
                // Start/End date compare
                let validationMessage = "";
                if (
                    CommonUtils.isNotBlank(selectedClaimDates.CLAIM_START_DATE) &&
                    CommonUtils.isNotBlank(selectedClaimDates.CLAIM_END_DATE)
                ) {
                    validationMessage = DateUtils.compareDates(
                        DateUtils.convertStringToDate(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
                        ),
                        DateUtils.convertStringToDate(
                            selectedClaimDates.CLAIM_END_DATE,
                            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
                        )
                    );
                    if (CommonUtils.isNotBlank(validationMessage)) {
                        response.push(
                            frameItemValidationMsg(
                                selectedClaimDates.CLAIM_START_DATE,
                                ApplicationConstants.CLAIM_START_DATE,
                                validationMessage
                            )
                        );
                    }
                }
    
                // Rate type required for type 101
                if (
                    CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_101) &&
                    CommonUtils.isBlank(selectedClaimDates.RATE_TYPE)
                ) {
                    response.push(
                        frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.RATE_TYPE,
                            "Please provide RateType."
                        )
                    );
                }
    
                // Hourly rate type needs start/end time
                if (
                    CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE) &&
                    CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY) &&
                    (CommonUtils.isBlank(selectedClaimDates.START_TIME) || CommonUtils.isBlank(selectedClaimDates.END_TIME))
                ) {
                    response.push(
                        frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.START_TIME_END_TIME,
                            "Please provide Start Time/End Time."
                        )
                    );
                }
    
                // Section 5: Daily claim date logic
                if (
                    CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
                    CommonUtils.equalsIgnoreCase(
                        claimRequestTypeNumber,
                        ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY_NUMBER
                    )
                ) {
                    // // Custom block for specific dates (you need to implement this function)
                    // blockClaimSubmissionFor1stTo3rdMar2024(item, response, selectedClaimDates);
    
                    if (CommonUtils.isNotBlank(claimMonth) && claimMonth.includes(ApplicationConstants.HYPHEN)) {
                        const [month, year] = claimMonth.split(ApplicationConstants.HYPHEN);
                        // Async repository call!
                        const eclaimsDataReq = await EclaimsItemDataRepo.queryDayMonthAndYearRequests(
                            String(item.STAFF_ID),
                            ApplicationConstants.CLAIM_TYPE_102,
                            month,
                            year,
                            selectedClaimDates.CLAIM_START_DATE
                        );
                        let submittedHours = 0.0;
                        for (const eclaimsData of eclaimsDataReq) {
                            if (
                                !CommonUtils.equalsIgnoreCase(eclaimsData.CLAIM_DAY_TYPE, selectedClaimDates.CLAIM_DAY_TYPE)
                            ) {
                                response.push(
                                    frameItemValidationMsg(
                                        selectedClaimDates.CLAIM_START_DATE,
                                        "Day Type",
                                        `There is already a submited request ${await EclaimsHeaderDataRepo.fetchRequestId(eclaimsData.DRAFT_ID)} with different day type for the day: ${selectedClaimDates.CLAIM_START_DATE}`
                                    )
                                );
                            }
                            if (eclaimsData.IS_PH !== selectedClaimDates.IS_PH) {
                                response.push(
                                    frameItemValidationMsg(
                                        selectedClaimDates.CLAIM_START_DATE,
                                        "Indicator",
                                        `There is already a submited request ${await EclaimsHeaderDataRepo.fetchRequestId(eclaimsData.DRAFT_ID)} with different indicator for the day: ${selectedClaimDates.CLAIM_START_DATE}`
                                    )
                                );
                            }
                            submittedHours += parseFloat(eclaimsData.HOURS_UNIT) || 0;
                        }
    
                        // Monthly data WBS check
                        const eclaimsMonthlyDataReq = await EclaimsItemDataRepo.queryMonthAndYearRequests(
                            String(item.STAFF_ID),
                            ApplicationConstants.CLAIM_TYPE_102,
                            selectedClaimDates.WEEK_NO
                        );
                        for (const eclaimsData of eclaimsMonthlyDataReq) {
                            if (!CommonUtils.equalsIgnoreCase(eclaimsData.WBS, selectedClaimDates.WBS)) {
                                response.push(
                                    frameItemValidationMsg(
                                        selectedClaimDates.CLAIM_START_DATE,
                                        "WBS",
                                        `There is already a submited request ${await EclaimsHeaderDataRepo.fetchRequestId(eclaimsData.DRAFT_ID)} with different WBS for the day :${selectedClaimDates.CLAIM_START_DATE}`
                                    )
                                );
                                break;
                            }
                        }
    
                        // group by CLAIM_START_DATE for the day
                        const groupByDay = (item.selectedClaimDates || []).reduce((acc, curr) => {
                            const key = curr.CLAIM_START_DATE;
                            if (!acc[key]) {acc[key] = [];}
                            acc[key].push(curr);
                            return acc;
                        }, {});
                        const dayList = groupByDay[selectedClaimDates.CLAIM_START_DATE] || [];
                        const hourUnitList = dayList.map(p => parseFloat(p.HOURS_UNIT) || 0);
                        const hoursUnitSum = hourUnitList.reduce((sum, val) => sum + val, 0);
                        const hoursunit = hoursUnitSum + submittedHours;
    
                        if (hoursunit > 21) {
                            response.push(
                                frameItemValidationMsg(
                                    selectedClaimDates.CLAIM_START_DATE,
                                    "Hours/Unit",
                                    `Hours unit per day should not be more than 21 hours for day : ${selectedClaimDates.CLAIM_START_DATE}`
                                )
                            );
                        }
                    }
                }
    
                // Only for claim type != 102: hours/unit required, must be numeric and > 0
                if (
                    !CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102) &&
                    (CommonUtils.isBlank(selectedClaimDates.HOURS_UNIT) ||
                        Number(selectedClaimDates.HOURS_UNIT) === 0.0 ||
                        !DateUtils.isNumeric(selectedClaimDates.HOURS_UNIT))
                ) {
                    response.push(
                        frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.HOURS_UNIT,
                            "Please provide Hours/Unit."
                        )
                    );
                }
    
                // Section 6: CA role-specific checks
                if (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.CA)) {
                    if (
                        CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_101) &&
                        (CommonUtils.isBlank(selectedClaimDates.TOTAL_AMOUNT) ||
                            CommonUtils.equalsIgnoreCase(
                                selectedClaimDates.TOTAL_AMOUNT,
                                ApplicationConstants.DEFAULT_DOUBLE_VALUE
                            ))
                    ) {
                        response.push(
                            frameItemValidationMsg(
                                selectedClaimDates.CLAIM_START_DATE,
                                ApplicationConstants.TOTAL_AMOUNT,
                                "Please provide Total Amount."
                            )
                        );
                    }
                    if (CommonUtils.isNotBlank(selectedClaimDates.WBS)) {
                        //check WBS by calling a repo
                        validationMessage = await checkWbsElement(selectedClaimDates.WBS); //pending
                        if (CommonUtils.isNotBlank(validationMessage)) {
                            response.push(
                                frameItemValidationMsg(
                                    selectedClaimDates.CLAIM_START_DATE,
                                    ApplicationConstants.WBS,
                                    validationMessage
                                )
                            );
                        }
                    }
                }
    
                // Section 7: Check for duplicate/overlapping claim
                const claimExistsMessage = await checkClaimExists(selectedClaimDates, item, roleFlow, requestorGroup);
                if (CommonUtils.isNotBlank(claimExistsMessage)) {
                    response.push(
                        frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.CLAIM_EXISTS,
                            claimExistsMessage
                        )
                    );
                }
            }
        }
    
        // Section 8: All WBS for a week must be the same
        if (CommonUtils.equalsIgnoreCase(claimType, ApplicationConstants.CLAIM_TYPE_102)) {
            // group by WEEK_NO
            const groupByWeek = (item.selectedClaimDates || []).reduce((acc, curr) => {
                const key = curr.WEEK_NO;
                if (!acc[key]) {acc[key] = [];}
                acc[key].push(curr);
                return acc;
            }, {});
    
            const allWbsSame = Object.values(groupByWeek).every(list => {
                const wbsSet = new Set(list.map(p => p.WBS));
                return wbsSet.size === 1;
            });
    
            if (!allWbsSame) {
                response.push(
                    frameItemValidationMsg("", "WBS", "Different WBS is entered for the items in the same week.")
                );
            }
        }
    
        // Section 9: Overlapping dates validation
        const overLappingValidationResult = await checkOverLapping(item);
        if (overLappingValidationResult && overLappingValidationResult.length > 0) {
            response.push(...overLappingValidationResult);
        }
    
        // Section 10: Staff validity and active check
        if (CommonUtils.equalsIgnoreCase(item.CLAIM_REQUEST_TYPE, ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY)) {
            for (const itemData of item.selectedClaimDates || []) {
                if (!CommonUtils.equalsIgnoreCase(itemData.RATE_TYPE, "18")) {
                    // Non-monthly
                    const activeValidData = await ChrsJobInfoRepo.checkStaffIsActiveAndValid(
                        item.STAFF_ID,
                        itemData.CLAIM_START_DATE,
                        itemData.CLAIM_END_DATE,
                        item.ULU,
                        item.FDLU,
                        item.CLAIM_TYPE
                    );
                    if (!activeValidData || activeValidData.length === 0) {
                        response.push(
                            frameItemValidationMsg(
                                itemData.CLAIM_START_DATE,
                                "Staff Id",
                                "Staff is not active or valid for ULU,FDLU selected."
                            )
                        );
                    }
                } else {
                    // Monthly
                    const activeValidData = await ChrsJobInfoRepo.checkStaffIsActiveAndValidForMonthly(
                        item.STAFF_ID,
                        itemData.CLAIM_START_DATE,
                        itemData.CLAIM_END_DATE,
                        item.CLAIM_TYPE
                    );
                    if (!activeValidData || activeValidData.length === 0) {
                        response.push(
                            frameItemValidationMsg(
                                itemData.CLAIM_START_DATE,
                                "Staff Id",
                                "Staff is not active or valid for ULU,FDLU selected."
                            )
                        );
                    }
                }
            }
        }
        return response;
    }catch(err){
        throw new ApplicationException(err.message)
    }
    

}

/**
 * Checks if a WBS element is valid by calling the ECP WBS validation API
 * @param {string} wbsElement - The WBS element to validate
 * @returns {Promise<string|null>} Validation message or null if valid
 */
async function checkWbsElement(wbsElement) {
    try {
        if (CommonUtils.isBlank(wbsElement)) {
            return "No WBS Element provided.";
        }

        // Prepare the request payload similar to ecpWbsValidate
        const wbsPayload = {
            WBSRequest: {
                WBS: [wbsElement]
            }
        };

        // Call the ECP CPI API for WBS validation
        const apiUrl ='/ecpwbsvalidate_qa';
        const validationResult = await CommonUtils.callCpiApi(
            apiUrl,
            wbsPayload,
            'POST'
        );

        // Process the response according to the Java logic
        if (!validationResult) {
            return ApplicationConstants.WBS_VALIDATION_MSG;
        }

        // Check if response has EVSTATUS at root level
        if (validationResult[ApplicationConstants.EVSTATUS]) {
            const evStatus = validationResult[ApplicationConstants.EVSTATUS];
            if (CommonUtils.isNotBlank(evStatus) && 
                CommonUtils.equalsIgnoreCase(evStatus, ApplicationConstants.STATUS_E)) {
                return ApplicationConstants.WBS_VALIDATION_MSG;
            }
        } 
        // Check if response is an array
        else if (Array.isArray(validationResult)) {
            if (validationResult.length > 0) {
                const itemNode = validationResult[0];
                if (Array.isArray(itemNode)) {
                    // Handle array of arrays
                    for (const wbsNode of itemNode) {
                        if (wbsNode && wbsNode[ApplicationConstants.EVSTATUS]) {
                            const evStatus = wbsNode[ApplicationConstants.EVSTATUS];
                            if (CommonUtils.isNotBlank(evStatus) && 
                                !CommonUtils.equalsIgnoreCase(evStatus, ApplicationConstants.STATUS_E)) {
                                return ApplicationConstants.WBS_VALIDATION_MSG;
                            }
                        }
                    }
                } else {
                    // Handle single object in array
                    if (itemNode && itemNode[ApplicationConstants.EVSTATUS]) {
                        const evStatus = itemNode[ApplicationConstants.EVSTATUS];
                        if (CommonUtils.isNotBlank(evStatus) && 
                            !CommonUtils.equalsIgnoreCase(evStatus, ApplicationConstants.STATUS_E)) {
                            return ApplicationConstants.WBS_VALIDATION_MSG;
                        }
                    }
                }
            }
        } 
        // Check if response has ETOUTPUT structure
        else if (validationResult[ApplicationConstants.ETOUTPUT]) {
            const evResponse = validationResult[ApplicationConstants.ETOUTPUT];
            if (evResponse[ApplicationConstants.ITEM]) {
                const itemResponse = evResponse[ApplicationConstants.ITEM];
                
                // Check direct EVSTATUS
                if (itemResponse[ApplicationConstants.EVSTATUS]) {
                    const evStatus = itemResponse[ApplicationConstants.EVSTATUS];
                    if (CommonUtils.isNotBlank(evStatus) && 
                        CommonUtils.equalsIgnoreCase(evStatus, ApplicationConstants.STATUS_E)) {
                        return ApplicationConstants.WBS_VALIDATION_MSG;
                    }
                }
                
                // Check if ITEM is an array
                if (Array.isArray(itemResponse) && itemResponse.length > 0) {
                    const itemNode = itemResponse[0];
                    if (Array.isArray(itemNode)) {
                        // Handle array of arrays
                        for (const wbsNode of itemNode) {
                            if (wbsNode && wbsNode[ApplicationConstants.EVSTATUS]) {
                                const evStatus = wbsNode[ApplicationConstants.EVSTATUS];
                                if (CommonUtils.isNotBlank(evStatus) && 
                                    !CommonUtils.equalsIgnoreCase(evStatus, ApplicationConstants.STATUS_E)) {
                                    return ApplicationConstants.WBS_VALIDATION_MSG;
                                }
                            }
                        }
                    } else {
                        // Handle single object in array
                        if (itemNode && itemNode[ApplicationConstants.EVSTATUS]) {
                            const evStatus = itemNode[ApplicationConstants.EVSTATUS];
                            if (CommonUtils.isNotBlank(evStatus) && 
                                !CommonUtils.equalsIgnoreCase(evStatus, ApplicationConstants.STATUS_E)) {
                                return ApplicationConstants.WBS_VALIDATION_MSG;
                            }
                        }
                    }
                }
            }
        }

        // If we reach here, the WBS element is valid
        return null;

    } catch (error) {
        console.error("WBS Element validation failed:", {
            wbsElement: wbsElement,
            error: error.message,
            stack: error.stack
        });
        
        // Return validation error message on any exception
        return ApplicationConstants.WBS_VALIDATION_MSG;
    }
}

/**
 * Checks for overlapping claims.
 * @param {Object} item - The claim item.
 * @returns {Promise<Array>} The validation results.
 */
async function checkOverLapping(item) {
    let validationResult = [];

    if (item && item.selectedClaimDates && item.selectedClaimDates.length > 0) {
        if (
            (item.CLAIM_REQUEST_TYPE || "").toUpperCase() ===
            ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD.toUpperCase()
        ) {
            validationResult = await checkPeriodValidation(item);
        } else if (
            (item.CLAIM_REQUEST_TYPE || "").toUpperCase() ===
            ApplicationConstants.CLAIM_REQUEST_TYPE_DAILY.toUpperCase()
        ) {
            validationResult = await checkDailyValidation(item);
        }
    }
    return validationResult;
}
/**
 * Checks period validation for claims.
 * @param {Object} item - The claim item.
 * @returns {Promise<Array>} The validation results.
 */
async function checkPeriodValidation(item) {
    const validationResult = [];
    const inputItems = [...item.selectedClaimDates]; // Clone/copy array

    // Sort by CLAIM_START_DATE
    inputItems.sort((a, b) => {
        const dateA = DateUtils.convertStringToDate(
            a.CLAIM_START_DATE,
            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
        );
        const dateB = DateUtils.convertStringToDate(
            b.CLAIM_START_DATE,
            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
        );
        return dateA - dateB;
    });

    for (let itemCount = 0; itemCount < inputItems.length; itemCount++) {
        const selectedClaimDates = inputItems[itemCount];

        const claimStartDate = DateUtils.convertStringToDate(
            selectedClaimDates.CLAIM_START_DATE,
            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
        );
        const claimEndDate = DateUtils.convertStringToDate(
            selectedClaimDates.CLAIM_END_DATE,
            ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
        );

        const rateType = selectedClaimDates.RATE_TYPE || "";

        if (
            !selectedClaimDates.CLAIM_START_DATE ||
            !selectedClaimDates.CLAIM_END_DATE ||
            selectedClaimDates.CLAIM_START_DATE.trim() === "" ||
            selectedClaimDates.CLAIM_END_DATE.trim() === ""
        ) {
            const validationResultsDto = frameItemValidationMsg(
                "",
                ApplicationConstants.CLAIM_START_DATE,
                "Claim Start/End Date is not provided."
            );
            validationResult.push(validationResultsDto);
        }

        // Inner loop
        for (let innerItemCount = 0; innerItemCount < inputItems.length; innerItemCount++) {
            const innerItemClaimDates = inputItems[innerItemCount];
            const innerRateType = innerItemClaimDates.RATE_TYPE || "";

            if (itemCount !== innerItemCount) {
                const rateTypeMatch =
                    innerItemClaimDates.RATE_TYPE &&
                    CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, innerItemClaimDates.RATE_TYPE) &&
                    CommonUtils.equalsIgnoreCase(
                        selectedClaimDates.RATE_TYPE_AMOUNT,
                        innerItemClaimDates.RATE_TYPE_AMOUNT
                    );

                if (rateTypeMatch || isHourlyMonthlyRateType(rateType, innerRateType)) {
                    const innerClaimStartDate = DateUtils.convertStringToDate(
                        innerItemClaimDates.CLAIM_START_DATE,
                        ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
                    );
                    const innerClaimEndDate = DateUtils.convertStringToDate(
                        innerItemClaimDates.CLAIM_END_DATE,
                        ApplicationConstants.INPUT_CLAIM_REQUEST_DATE_FORMAT
                    );

                    // Overlap check logic
                    if (
                        (innerClaimStartDate.getTime() === claimStartDate.getTime() &&
                            innerClaimEndDate.getTime() === claimEndDate.getTime()) ||
                        (innerClaimStartDate > claimStartDate && innerClaimStartDate < claimEndDate) ||
                        (claimStartDate > innerClaimStartDate && claimStartDate < innerClaimEndDate) ||
                        (innerClaimEndDate > claimStartDate && innerClaimEndDate < claimEndDate) ||
                        (claimEndDate > innerClaimStartDate && claimEndDate < innerClaimEndDate)
                    ) {
                        const validationResultsDto = frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.CLAIM_OVERLAP,
                            "Please check claim date(s), start time, end time provided."
                        );
                        validationResult.push(validationResultsDto);
                    }
                }
            }
        }
    }

    return validationResult;
}

/**
 * Frames a validation message.
 * @param {string} field - The field name.
 * @param {string} message - The message.
 * @returns {Object}
 */
function frameValidationMessage(field, message) {
    const validationResultsDto = new ValidationResultsDto();
    validationResultsDto.setField(field);
    validationResultsDto.setMessage(message);
    // Set other properties if needed
    return validationResultsDto;
}

/**
 * Frames an item validation message.
 * @param {string} claimDate - The claim date.
 * @param {string} columnName - The column name.
 * @param {string} message - The message.
 * @returns {Object}
 */
function frameItemValidationMsg(claimDate, columnName, message) {
    const validationResultsDto = new ValidationResultsDto();
    validationResultsDto.setType(MessageConstants.ERROR);
    validationResultsDto.setDisplayIdx(claimDate);
    validationResultsDto.setsTitle(`Claim Date : ${claimDate}\n Column : ${columnName}`);
    validationResultsDto.setTitle(columnName);
    validationResultsDto.setState(MessageConstants.ERROR);
    validationResultsDto.setMessage(message);
    validationResultsDto.setIdx(claimDate);
    return validationResultsDto;
}

/**
 * Checks if a claim exists.
 * @param {Object} selectedClaimDates - The selected claim dates.
 * @param {Object} item - The claim item.
 * @param {string} roleFlow - The role flow.
 * @param {string} requestorGroup - The requestor group.
 * @returns {Promise<string|null>} The validation message or null.
 */
async function checkClaimExists(selectedClaimDates, item, roleFlow, requestorGroup) {
    let validationMessage = null;

    // Assuming isValidFlowCheck is synchronous or asynchronous as needed
    const flowValid = isValidFlowCheck(roleFlow, requestorGroup);

    if (
        flowValid &&
        CommonUtils.isNotBlank(selectedClaimDates.CLAIM_START_DATE) &&
        CommonUtils.isNotBlank(selectedClaimDates.CLAIM_END_DATE) &&
        CommonUtils.isNotBlank(item.ULU) &&
        CommonUtils.isNotBlank(item.FDLU) &&
        CommonUtils.isNotBlank(item.STAFF_ID) &&
        CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE)
    ) {
        // Make sure this repository returns a Promise (async)
        const eclaimsItemData = await EclaimsItemDataRepo.checkForExistingReq(
            item.STAFF_ID,
            selectedClaimDates.CLAIM_START_DATE,
            selectedClaimDates.CLAIM_END_DATE,
            item.ULU,
            item.FDLU
        );
        // frameClaimExistMessage should also be implemented/reused in Node
        validationMessage = frameClaimExistMessage(eclaimsItemData, selectedClaimDates, item.CLAIM_REQUEST_TYPE);
    }
    return validationMessage;
}

/**
 * Checks if the flow is valid.
 * @param {string} roleFlow - The role flow.
 * @param {string} requestorGroup - The requestor group.
 * @returns {boolean}
 */
function isValidFlowCheck(roleFlow, requestorGroup) {
    // Helper for case-insensitive comparison

    return (
        (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.CA) &&
            CommonUtils.equalsIgnoreCase(requestorGroup, ApplicationConstants.CLAIM_ASSISTANT)) ||
        (CommonUtils.equalsIgnoreCase(roleFlow, ApplicationConstants.ESS) &&
            CommonUtils.equalsIgnoreCase(requestorGroup, ApplicationConstants.NUS_CHRS_ECLAIMS_ESS))
    );
}


/**
 * Frames a claim exist message.
 * @param {Array} eclaimsItemData - The eclaims item data.
 * @param {Object} selectedClaimDates - The selected claim dates.
 * @param {string} claimRequestType - The claim request type.
 * @returns {string|null}
 */
function frameClaimExistMessage(eclaimsItemData, selectedClaimDates, claimRequestType) {
    let validationMessage = null;

    if (eclaimsItemData && eclaimsItemData.length > 0) {
        for (const eclaimsItemSavedData of eclaimsItemData) {
            if (
                CommonUtils.isNotBlank(eclaimsItemSavedData.RATE_TYPE) &&
                CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE) &&
                CommonUtils.equalsIgnoreCase(eclaimsItemSavedData.RATE_TYPE, selectedClaimDates.RATE_TYPE)
            ) {
                // Fix for mass upload validation issue - Hourly check not required for Period
                if (
                    (CommonUtils.equalsIgnoreCase(
                        eclaimsItemSavedData.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY
                    ) ||
                        CommonUtils.equalsIgnoreCase(
                            eclaimsItemSavedData.RATE_TYPE,
                            ApplicationConstants.RATE_TYPE_HOURLY_19
                        )) &&
                    !CommonUtils.equalsIgnoreCase(claimRequestType, ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD)
                ) {
                    // Assume DateUtils.frameLocalDateTime returns a JS Date or dayjs object
                    const claimStartDateTime = DateUtils.frameLocalDateTime(
                        selectedClaimDates.CLAIM_START_DATE,
                        selectedClaimDates.START_TIME
                    );
                    const claimEndDateTime = DateUtils.frameLocalDateTime(
                        selectedClaimDates.CLAIM_END_DATE,
                        selectedClaimDates.END_TIME
                    );
                    const savedStartDateTime = DateUtils.frameLocalDateTime(
                        eclaimsItemSavedData.CLAIM_START_DATE,
                        eclaimsItemSavedData.START_TIME
                    );
                    const savedEndDateTime = DateUtils.frameLocalDateTime(
                        eclaimsItemSavedData.CLAIM_END_DATE,
                        eclaimsItemSavedData.END_TIME
                    );

                    // JavaScript Date comparison
                    if (
                        (savedStartDateTime.getTime() === claimStartDateTime.getTime() &&
                            savedEndDateTime.getTime() === claimEndDateTime.getTime()) ||
                        (claimStartDateTime < savedEndDateTime && savedStartDateTime < claimEndDateTime) ||
                        (claimStartDateTime > savedStartDateTime && claimStartDateTime < savedEndDateTime) ||
                        (savedEndDateTime > claimEndDateTime && savedEndDateTime < claimEndDateTime) ||
                        (claimEndDateTime > savedStartDateTime && claimEndDateTime < savedEndDateTime)
                    ) {
                        validationMessage = "Claim already exists for the provided Start and End Date/Time.";
                        break;
                    }
                } else {
                    if (
                        CommonUtils.equalsIgnoreCase(claimRequestType, ApplicationConstants.CLAIM_REQUEST_TYPE_PERIOD)
                    ) {
                        // Checking for Rate Amount validation also
                        if (
                            CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE_AMOUNT) &&
                            Number(Number(selectedClaimDates.RATE_TYPE_AMOUNT).toFixed(2)) ===
                                Number(Number(eclaimsItemSavedData.RATE_TYPE_AMOUNT).toFixed(2))
                        ) {
                            validationMessage = "Claim already exists for the provided Start and End Date.";
                            break;
                        }
                    } else {
                        validationMessage = "Claim already exists for the provided Start and End Date.";
                        break;
                    }
                }
            } else if (
                CommonUtils.isNotBlank(eclaimsItemSavedData.RATE_TYPE) &&
                CommonUtils.isNotBlank(selectedClaimDates.RATE_TYPE) &&
                (CommonUtils.equalsIgnoreCase(selectedClaimDates.RATE_TYPE, ApplicationConstants.RATE_TYPE_HOURLY_20) ||
                    CommonUtils.equalsIgnoreCase(
                        selectedClaimDates.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY_21
                    ))
            ) {
                // Fix for mass upload validation issue - Hourly check not required for Period
                if (
                    CommonUtils.equalsIgnoreCase(
                        eclaimsItemSavedData.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY_20
                    ) ||
                    CommonUtils.equalsIgnoreCase(
                        eclaimsItemSavedData.RATE_TYPE,
                        ApplicationConstants.RATE_TYPE_HOURLY_21
                    )
                ) {
                    validationMessage =
                        "Rate Type T-2 courses Learning Per Sem and T->2 courses Learning Per Sem cannot be selected for same day.";
                    break;
                }
            }
        }
    }
    return validationMessage;
}
/**
 * Checks if the rate type is hourly or monthly.
 * @param {string} rateType - The rate type.
 * @param {string} innerRateType - The inner rate type.
 * @returns {boolean}
 */
function isHourlyMonthlyRateType(rateType, innerRateType) {
    const rateTypeObj = RateTypeConfig.fromValue(rateType);
    const innerRateTypeObj = RateTypeConfig.fromValue(innerRateType);

    const unknownValue = RateTypeConfig.UNKNOWN.getValue();
    const hourlyValue = RateTypeConfig.HOURLY.getValue();
    const monthlyValue = RateTypeConfig.MONTHLY.getValue();

    if (
        CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), unknownValue) &&
        CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), unknownValue)
    ) {
        if (
            (CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), hourlyValue) &&
                CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), monthlyValue)) ||
            (CommonUtils.equalsIgnoreCase(rateTypeObj.getValue(), monthlyValue) &&
                CommonUtils.equalsIgnoreCase(innerRateTypeObj.getValue(), hourlyValue))
        ) {
            return true;
        }
    }
    return false;
}


/**
 * Checks daily validation for claim items.
 * @param {Object} item - The claim item.
 * @returns {Promise<Array>} The validation results.
 */
async function checkDailyValidation(item) {
    const validationResult = [];
    // Clone and sort inputItems by CLAIM_START_DATE
    const inputItems = [...item.selectedClaimDates].sort((a, b) => {
        const dateA = DateUtils.frameLocalDateTime(a.CLAIM_START_DATE, a.START_TIME);
        const dateB = DateUtils.frameLocalDateTime(b.CLAIM_START_DATE, b.START_TIME);
        return dateA - dateB;
    });

    for (let itemCount = 0; itemCount < inputItems.length; itemCount++) {
        const selectedClaimDates = inputItems[itemCount];

        const claimStartDateTime = DateUtils.frameLocalDateTime(
            selectedClaimDates.CLAIM_START_DATE,
            selectedClaimDates.START_TIME
        );
        const claimEndDateTime = DateUtils.frameLocalDateTime(
            selectedClaimDates.CLAIM_END_DATE,
            selectedClaimDates.END_TIME
        );

        const rateType = selectedClaimDates.RATE_TYPE || "";

        for (let innerItemCount = 0; innerItemCount < inputItems.length; innerItemCount++) {
            const innerItemClaimDates = inputItems[innerItemCount];
            const innerRateType = innerItemClaimDates.RATE_TYPE || "";

            if (
                !innerItemClaimDates.CLAIM_START_DATE ||
                !innerItemClaimDates.CLAIM_END_DATE ||
                innerItemClaimDates.CLAIM_START_DATE.trim() === "" ||
                innerItemClaimDates.CLAIM_END_DATE.trim() === ""
            ) {
                const validationResultsDto = frameItemValidationMsg(
                    "",
                    ApplicationConstants.CLAIM_START_DATE,
                    "Claim Start/End Date is not provided."
                );
                validationResult.push(validationResultsDto);
            }

            if (itemCount !== innerItemCount) {
                const rateTypeMatch =
                    selectedClaimDates.RATE_TYPE &&
                    innerItemClaimDates.RATE_TYPE &&
                    selectedClaimDates.RATE_TYPE.toUpperCase() === innerItemClaimDates.RATE_TYPE.toUpperCase();

                if (
                    (rateTypeMatch && selectedClaimDates.RATE_TYPE.trim() !== "") ||
                    isHourlyMonthlyRateType(rateType, innerRateType)
                ) {
                    const innerClaimStartDateTime = DateUtils.frameLocalDateTime(
                        innerItemClaimDates.CLAIM_START_DATE,
                        innerItemClaimDates.START_TIME
                    );
                    const innerClaimEndDateTime = DateUtils.frameLocalDateTime(
                        innerItemClaimDates.CLAIM_END_DATE,
                        innerItemClaimDates.END_TIME
                    );

                    // Overlap check logic using date comparisons
                    if (
                        (innerClaimStartDateTime.getTime() === claimStartDateTime.getTime() &&
                            innerClaimEndDateTime.getTime() === claimEndDateTime.getTime()) ||
                        (innerClaimStartDateTime > claimStartDateTime && innerClaimStartDateTime < claimEndDateTime) ||
                        (claimStartDateTime > innerClaimStartDateTime && claimStartDateTime < innerClaimEndDateTime) ||
                        (innerClaimEndDateTime > claimEndDateTime && innerClaimEndDateTime < claimEndDateTime) ||
                        (claimEndDateTime > innerClaimStartDateTime && claimEndDateTime < innerClaimEndDateTime)
                    ) {
                        const validationResultsDto = frameItemValidationMsg(
                            selectedClaimDates.CLAIM_START_DATE,
                            ApplicationConstants.CLAIM_OVERLAP,
                            "Please check claim date(s), start time, end time provided."
                        );
                        validationResult.push(validationResultsDto);
                    }
                }
            }
        }
    }
    return validationResult;
}

module.exports = {
    fetchRole,
    validateEclaimsData,
    frameValidationMessage,
    frameItemValidationMsg,
    emptyCheck,
    itemDataValidation,
    checkOverLapping,
    checkPeriodValidation,
    checkClaimExists,
    isValidFlowCheck,
    frameClaimExistMessage,
    checkDailyValidation,
    isHourlyMonthlyRateType,
    checkWbsElement
};