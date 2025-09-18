/**
 * User Utility Functions
 * Handles username extraction from various sources
 */

const { ApplicationException } = require("./customErrors");

// Centralized fallback username - can be modified here for different environments
let FALLBACK_USERNAME = "PTT_CA9";

/**
 * Extracts username from request object with centralized fallback
 * Priority order:
 * 1. Request data (username parameter)
 * 2. Request headers (X-User-Id, etc.)
 * 3. XSUAA user information
 * 4. Request parameters from data
 * 5. Centralized fallback username
 * @param {object} request - The CAP request object
 * @returns {string} The extracted username
 * @throws {ApplicationException} If no valid username is found
 */
function extractUsername(request) {
    let username = null;

    // 1. Try to get username from request data
    if (request.data && request.data.username) {
        username = request.data.username;
    }

    // 2. Try to get username from request headers
    if (!username && request.headers) {
        // Check common header names
        const commonHeaders = ['x-user-id', 'x-username', 'user-id', 'username', 'X-User-Id'];
        for (const header of commonHeaders) {
            if (request.headers[header]) {
                username = request.headers[header];
                break;
            }
        }
    }

    // 3. Try to get username from XSUAA user information
    if (!username && request.user) {
        if (request.user.id) {
            // Extract username from email format (user@domain.com -> user)
            username = request.user.id.split('@')[0];
        } else if (request.user.name) {
            username = request.user.name;
        }
    }

    // 4. Try to get username from request parameters in data
    if (!username && request.data) {
        const possibleParams = ['user', 'userId', 'userName', 'user_name'];
        for (const param of possibleParams) {
            if (request.data[param]) {
                username = request.data[param];
                break;
            }
        }
    }

    // 5. Fallback to centralized username
    if (!username) {
        console.warn(`Using centralized fallback username: ${FALLBACK_USERNAME}`);
        username = FALLBACK_USERNAME;
    }

    // Validate username
    if (!username || username.trim() === '') {
        throw new ApplicationException('No valid username found in request');
    }

    return username.trim().toUpperCase();
}

/**
 * Gets user information with username extraction
 * @param {object} request - The CAP request object
 * @returns {object} Object containing username and user details
 */
async function getUserInfo(request) {
    const username = extractUsername(request);

    // You can add additional user info fetching logic here
    // For example, fetching from database, external services, etc.

    return {
        username: username,
        upperNusNetId: username.toUpperCase(),
        // Add other user information as needed
    };
}

/**
 * Validates if a username is in the correct format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }

    // Basic validation - adjust according to your requirements
    const trimmed = username.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * Sets the centralized fallback username
 * @param {string} username - The fallback username to set
 */
function setFallbackUsername(username) {
    if (username && typeof username === 'string' && username.trim() !== '') {
        FALLBACK_USERNAME = username.trim().toUpperCase();
        console.log(`Fallback username updated to: ${FALLBACK_USERNAME}`);
    } else {
        throw new ApplicationException('Invalid fallback username provided');
    }
}

/**
 * Gets the current centralized fallback username
 * @returns {string} The current fallback username
 */
function getFallbackUsername() {
    return FALLBACK_USERNAME;
}

/**
 * Extracts username from authorization token
 * @param {string} token - The authorization token
 * @returns {string} The extracted username
 */
function extractUsernameFromToken(token) {
    if (!token) {
        throw new ApplicationException('Authorization token is required');
    }

    try {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace(/^Bearer\s+/i, '');

        // For JWT tokens, we would typically decode the token
        // For now, we'll use a simple extraction method
        // In a real implementation, you would decode the JWT and extract the username

        // This is a placeholder implementation
        // You should implement proper JWT decoding here
        console.warn('extractUsernameFromToken: Using fallback username - implement proper JWT decoding');
        return FALLBACK_USERNAME;

    } catch (error) {
        console.error('Error extracting username from token:', error);
        throw new ApplicationException('Invalid authorization token');
    }
}

module.exports = {
    extractUsername,
    getUserInfo,
    isValidUsername,
    setFallbackUsername,
    getFallbackUsername,
    extractUsernameFromToken
}; 