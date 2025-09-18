const _ = require("lodash");
// const { MESSAGE } = require("./constant");
const axios = require('axios');
const credStore = require('./credStore/credStore');
/**
 * Frames a response object.
 * @param {object} sourceObj
 * @param {string} errorCode
 * @param {string} message
 * @returns {object}
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
 * @param {object} obj
 * @returns {object}
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
 * @param {object} obj
 * @returns {boolean}
 */
function isEmptyObject(obj) {
    return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

/**
 * Copies properties from source to target, skipping specified properties.
 * @param {object} source
 * @param {object} target
 * @param {Array} skipProps
 * @returns {object}
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
 * @returns {object}
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
 * @returns {object}
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
    let credStoreBinding = JSON.parse(process.env.VCAP_SERVICES).credstore[0].credentials;

    let credPassword = {
        name: "cpi_oauth_connectivity"
    };

    let oRetCredential = await credStore.readCredential(credStoreBinding, "hana_db", "password", credPassword.name);

    if (!oRetCredential || !oRetCredential.metadata || !oRetCredential.username || !oRetCredential.value) {
        const error = new Error("Client Credentials Not Available");
        error.code = 400;
        error.statusCode = 400;
        throw error;
    }

    // Parse metadata if it's a string
    let metadata;
    if (typeof oRetCredential.metadata === 'string') {
        try {
            // Replace single quotes with double quotes and parse
            const cleanMetadata = oRetCredential.metadata
                .replace(/'/g, '"')  // Replace single quotes with double quotes
                .replace(/\\n/g, ''); // Remove escaped newlines
            metadata = JSON.parse(cleanMetadata);
        } catch (parseError) {
            throw new Error(`Failed to parse metadata: ${parseError.message}`);
        }
    } else {
        metadata = oRetCredential.metadata;
    }

    oRetCredential.metadata = metadata;

    const tokenUrl = oRetCredential.metadata.oAuth;
    const username = oRetCredential.username;
    const password = oRetCredential.value;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    const response = await axios.post(tokenUrl, null, { headers });
    return {
        "access_token" : response.data.access_token,
        ...oRetCredential
    }
}

/**
 * Generic function to call CPI APIs with authentication and error handling.
 * @param {string} apiUrl - The CPI API endpoint URL
 * @param {any} requestData - The data to send in the request body
 * @param {string} method - HTTP method (default: 'POST')
 * @param {object} additionalHeaders - Additional headers to include (optional)
 * @param {Function} callback - Callback function to process the response (optional)
 * @returns {Promise<any>} The CPI API response or callback result
 */
async function callCpiApi(apiUrl, requestData, method = 'POST', additionalHeaders = {}, callback = null) {
    try {
        // Get Bearer token
        const oRetCredentialToken = await fetchCpiBearerToken();
        const token = oRetCredentialToken.access_token;
        // Prepare headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...additionalHeaders
        };

        // Make the API call
        const config = {
            method: method.toUpperCase(),
            url: oRetCredentialToken.metadata.hostName + apiUrl,
            headers: headers,
            data: requestData,
            timeout: 300000 // 300 seconds timeout
        };

        const response = await axios.request(config);
        
        // If callback is provided, process the response through it
        if (callback && typeof callback === 'function') {
            return await callback(response.data, response.status, response.headers);
        }
        
        // Return the raw response data
        return response.data;
        
    } catch (err) {
        // Enhanced error handling
        const errorMessage = err.response 
            ? `CPI API Error: ${err.response.status} - ${err.response.statusText}`
            : `CPI API Error: ${err.message}`;
            
        console.error('CPI API call failed:', {
            url: apiUrl,
            method: method,
            error: errorMessage,
            response: err.response?.data
        });
        
        throw new Error(errorMessage);
    }
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
    fetchCpiBearerToken,
    callCpiApi
}
