// customErrors.js
class ApplicationException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ApplicationException';
    }
}

class DatabaseException extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseException';
    }
}

module.exports = {
    ApplicationException,
    DatabaseException
};
