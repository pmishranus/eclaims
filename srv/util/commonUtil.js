const _ = require("lodash");
const { MESSAGE } = require("./constant");
const axios = require('axios');
/**
 * Frames a response object.
 * @param {Object} sourceObj
 * @param {string} errorCode
 * @param {string} message
 * @returns {Object}
 */
function frameResponse(sourceObj, errorCode, message) {
    sourceObj.STATUS_CODE = errorCode;
    sourceObj.MESSAGE = message;
    return sourceObj;
}

/**
 * Checks if two strings are equal, ignoring case.
 * @param {string} str1 - The first string to compare.
 * @param {string} str2 - The second string to compare.
 * @returns {boolean} - True if the strings are equal (case-insensitive), false otherwise.
 */
function equalsIgnoreCase(str1, str2) {
    if (typeof str1 === "string" && typeof str2 === "string") {
        return str1.toLowerCase() === str2.toLowerCase();
    }
    return false;
}

/**
 * Checks if two strings are not equal ignoring case.
 * @param {string} str1
 * @param {string} str2
 * @returns {boolean}
 */
function notEqualsIgnoreCase(str1, str2) {
    if (typeof str1 === "string" && typeof str2 === "string") {
        return str1.toLowerCase() !== str2.toLowerCase();
    }
    return false;
}

/**
 * Gets a value or a default if it's empty.
 * @param {*} value
 * @param {*} defaultValue
 * @returns {*}
 */
function getOrDefault(value, defaultValue) {
    return _.isEmpty(value) ? defaultValue : value;
}

/**
 * Checks if a value is empty.
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
    return _.isEmpty(value);
}

/**
 * Checks if a value is not blank.
 * @param {*} value
 * @returns {boolean}
 */
function isNotBlank(value) {
    return !_.isEmpty(value);
}

/**
 * Checks if a value is blank.
 * @param {*} value
 * @returns {boolean}
 */
function isBlank(value) {
    return _.isEmpty(value);
}

/**
 * Checks if a string is null or empty.
 * @param {string} str
 * @returns {boolean}
 */
function isNullOrEmpty(str) {
    return str === null || str === undefined || str.trim().length === 0;
}

/**
 * Checks if a string is not null or empty.
 * @param {string} str
 * @returns {boolean}
 */
function isNotNullOrEmpty(str) {
    return !(str === null || str === undefined || str.trim().length === 0);
}

/**
 * Capitalizes words in a string.
 * @param {string} str
 * @returns {string}
 */
function capitalizeWords(str) {
    if (typeof str !== "string") {return "";}
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Deep clones an object.
 * @param {Object} obj
 * @returns {Object}
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Formats a date.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    if (!(date instanceof Date)) {return "";}
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Gets a random integer between min and max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if an object is empty.
 * @param {Object} obj
 * @returns {boolean}
 */
function isEmptyObject(obj) {
    return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

/**
 * Copies properties from source to target, skipping specified properties.
 * @param {Object} source
 * @param {Object} target
 * @param {Array} skipProps
 * @returns {Object}
 */
function copyObjectProperties(source, target, skipProps = []) {
    const skipSet = new Set(skipProps);

    for (const key in source) {
        if (source.hasOwnProperty(key) && !skipSet.has(key)) {
            target[key] = source[key];
        }
    }

    return target;
}

const checkIsNumericOptional = /^\d*$/;
const checkIsStringOptional = /^[a-zA-Z]*$/;
const checkIsNumericMandatory = /^\d+$/;
const checkIsStringMandatory = /^[a-zA-Z]+$/;

/**
 * Converts a number to text.
 * @param {number} number
 * @returns {string}
 */
function numberToText(number) {
    if (number === null || number === undefined) {
        return "";
    }
    return number.toString();
}

/**
 * Groups an array by a specified key.
 * @param {Array} array
 * @param {string} key
 * @returns {Object}
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const value = item[key];
        if (!result[value]) {
            result[value] = [];
        }
        result[value].push(item);
        return result;
    }, {});
}

/**
 * Frames a validation message.
 * @param {string} type
 * @param {string} message
 * @returns {Object}
 */
function frameValidationMessage(type, message) {
    return {
        type: type,
        message: message,
    };
}

/**
 * Converts a list to a string by key.
 * @param {Array} arr
 * @param {string} key
 * @returns {string}
 */
function convertListToString(arr, key) {
    if (!Array.isArray(arr) || typeof key !== "string") {return "";}

    const uniqueValues = [
        ...new Set(arr.map(item => item[key]).filter(value => typeof value === "string" && value.trim() !== "")),
    ];

    return uniqueValues.map(v => `'${v}'`).join(",");
}

/**
 * Fetches a Bearer token from the CPI OAuth endpoint.
 * @returns {Promise<string>} The Bearer token.
 */
async function fetchCpiBearerToken() {
    const tokenUrl = 'https://oauthasservices-c10247e87.ap1.hana.ondemand.com/oauth2/api/v1/token?grant_type=client_credentials';
    const username = 'apicfconnectivity';
    const password = 'Sap@12345678';
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    const response = await axios.post(tokenUrl, null, { headers });
    return response.data.access_token;
}

/**
 * Fetches compensation info from CPI for a given staff number.
 * @param {string} stfNumber - The staff number.
 * @returns {Promise<object>} The CPI API response.
 */
async function getCpiCompInfo(stfNumber) {
    const token = await fetchCpiBearerToken();
    const apiUrl = 'https://e200226-iflmap.hcisbt.ap1.hana.ondemand.com/http/EC_To_BTP_Comp_Info_AdRun_StaffID_QA';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    const response = await axios.post(apiUrl, { stfNumber }, { headers });
    return response.data;
}

module.exports = {
    frameResponse,
    equalsIgnoreCase,
    notEqualsIgnoreCase,
    isNullOrEmpty,
    isNotNullOrEmpty,
    capitalizeWords,
    deepClone,
    formatDate,
    getRandomInt,
    isEmptyObject,
    copyObjectProperties,
    getOrDefault,
    isEmpty,
    isNotBlank,
    checkIsNumericOptional,
    checkIsStringOptional,
    checkIsNumericMandatory,
    checkIsStringMandatory,
    numberToText,
    groupBy,
    frameValidationMessage,
    convertListToString,
    isBlank,
    getCpiCompInfo
};
