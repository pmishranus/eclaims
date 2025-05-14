const _ = require('lodash');
const { MESSAGE } = require('./constant');
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
  if (typeof str1 === 'string' && typeof str2 === 'string') {
    return str1.toLowerCase() === str2.toLowerCase();
  }
  return false;
}

// Example utility function to get a value or a default if it's empty
function getOrDefault(value, defaultValue) {
  return _.isEmpty(value) ? defaultValue : value;
}

function isEmpty(value) {
  return _.isEmpty(value);
}

function isNotBlank(value) {
  return !_.isEmpty(value)
}


/**
 * Checks if a string is null, undefined, or empty.
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string is null, undefined, or empty, false otherwise.
 */
function isNullOrEmpty(str) {
  return str === null || str === undefined || str.trim().length === 0;
}

function isNotNullOrEmpty(str) {
  return !(str === null || str === undefined || str.trim().length === 0)
}

/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
function capitalizeWords(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Deep clones an object or array.
 * @param {Object|Array} obj - The object or array to clone.
 * @returns {Object|Array} - A deep clone of the input.
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Formats a date object into a string (YYYY-MM-DD).
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
function formatDate(date) {
  if (!(date instanceof Date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a random integer between two values (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} - A random integer between min and max.
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if an object is empty (has no enumerable properties).
 * @param {Object} obj - The object to check.
 * @returns {boolean} - True if the object is empty, false otherwise.
 */
function isEmptyObject(obj) {
  return obj === null || obj === undefined || Object.keys(obj).length === 0;
}
/**
* Copies properties from the source object to the target object,
* skipping any properties specified in the skipProps array.
* 
* @param {Object} source - The source object to copy properties from.
* @param {Object} target - The target object to copy properties to.
* @param {Array<string>} [skipProps] - Optional array of properties to skip.
* @return {Object} The modified target object with copied properties.
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

function numberToText(number) {
  if (number === null || number === undefined) {
    return '';
  }
  return number.toString();
}

// Helper function to group by a specified key
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

// Validation utility function
function frameValidationMessage(type, message) {
  return {
    type: type,
    message: message
  };
}
//extractUniqueValuesAsString
function convertListToString(arr, key) {
  if (!Array.isArray(arr) || typeof key !== 'string') return '';

  const uniqueValues = [
      ...new Set(
          arr
              .map(item => item[key])
              .filter(value => typeof value === 'string' && value.trim() !== '')
      )
  ];

  return uniqueValues.map(v => `'${v}'`).join(',');
}




module.exports = {
  frameResponse,
  equalsIgnoreCase,
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
  convertListToString
};
