/**
 * StatusConfigType enum - equivalent to Java StatusConfigType enum
 * Maps status codes to their corresponding types for eclaims workflow
 */
class StatusConfigType {
    constructor(value) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    /**
     * Get StatusConfigType from value
     * @param {string} value - The status value to lookup
     * @returns {StatusConfigType} The matching StatusConfigType or UNKNOWN
     */
    static fromValue(value) {
        for (const type of Object.values(StatusConfigType)) {
            if (type instanceof StatusConfigType && type.value === value) {
                return type;
            }
        }
        return StatusConfigType.UNKNOWN;
    }

    /**
     * Get all enum values
     * @returns {Array<StatusConfigType>} Array of all StatusConfigType instances
     */
    static values() {
        return [
            StatusConfigType.CLAIM_ASSISTANT,
            StatusConfigType.VERIFIER,
            StatusConfigType.ADDITIONAL_APPROVER1,
            StatusConfigType.ADDITIONAL_APPROVER2,
            StatusConfigType.APPROVER,
            StatusConfigType.UNKNOWN
        ];
    }

    /**
     * Check if this is the UNKNOWN type
     * @returns {boolean} True if this is UNKNOWN type
     */
    isUnknown() {
        return this === StatusConfigType.UNKNOWN;
    }

    /**
     * String representation
     * @returns {string} The value of this status type
     */
    toString() {
        return this.value;
    }
}

// Define the enum constants
StatusConfigType.CLAIM_ASSISTANT = new StatusConfigType("02");
StatusConfigType.VERIFIER = new StatusConfigType("03");
StatusConfigType.ADDITIONAL_APPROVER1 = new StatusConfigType("04");
StatusConfigType.ADDITIONAL_APPROVER2 = new StatusConfigType("05");
StatusConfigType.APPROVER = new StatusConfigType("06");
StatusConfigType.UNKNOWN = new StatusConfigType("unknown");

module.exports = StatusConfigType; 