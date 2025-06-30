// customErrors.js
class ApplicationException extends Error {
    constructor(message) {
        super(message);
        this.name = "ApplicationException";
    }
}

class DatabaseException extends Error {
    constructor(message) {
        super(message);
        this.name = "DatabaseException";
    }
}
class HttpClientErrorException extends Error {
    constructor(statusText, statusCode) {
        super(statusText);
        this.name = 'HttpClientErrorException';
        this.statusText = statusText;
        this.statusCode = statusCode;
    }
}

module.exports = {
    ApplicationException,
    DatabaseException,
    HttpClientErrorException
};
