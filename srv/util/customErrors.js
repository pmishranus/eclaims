// customErrors.js

class BaseApplicationException extends Error {
    constructor(message, fileName = null, lineNumber = null) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date().toISOString();

        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        // Extract file and line information from stack trace
        if (!fileName || !lineNumber) {
            const stackLines = this.stack.split('\n');
            for (let i = 2; i < stackLines.length; i++) {
                const line = stackLines[i];
                // Look for file path and line number in stack trace
                const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
                if (match) {
                    this.fileName = match[2].split('/').pop(); // Get just the filename
                    this.lineNumber = parseInt(match[3]);
                    this.columnNumber = parseInt(match[4]);
                    this.fullPath = match[2];
                    break;
                }
            }
        } else {
            this.fileName = fileName;
            this.lineNumber = lineNumber;
        }
    }

    getErrorInfo() {
        return {
            name: this.name,
            message: this.message,
            fileName: this.fileName,
            lineNumber: this.lineNumber,
            columnNumber: this.columnNumber,
            fullPath: this.fullPath,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }

    getErrorSummary() {
        return `${this.name}: ${this.message} at ${this.fileName}:${this.lineNumber}`;
    }
}

class ApplicationException extends BaseApplicationException {
    constructor(message, fileName = null, lineNumber = null) {
        super(message, fileName, lineNumber);
    }
}

class DatabaseException extends BaseApplicationException {
    constructor(message, fileName = null, lineNumber = null) {
        super(message, fileName, lineNumber);
    }
}

class HttpClientErrorException extends BaseApplicationException {
    constructor(statusText, statusCode, fileName = null, lineNumber = null) {
        super(statusText, fileName, lineNumber);
        this.statusText = statusText;
        this.statusCode = statusCode;
    }
}

function createErrorWithLocation(ErrorClass, message) {
    const stack = new Error().stack;
    const stackLines = stack.split('\n');
    for (let i = 2; i < stackLines.length; i++) {
        const line = stackLines[i];
        const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
            const fileName = match[2].split('/').pop();
            const lineNumber = parseInt(match[3]);
            return new ErrorClass(message, fileName, lineNumber);
        }
    }
    return new ErrorClass(message);
}

module.exports = {
    ApplicationException,
    DatabaseException,
    HttpClientErrorException,
    createErrorWithLocation
}; 