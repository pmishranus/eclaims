// Define the enum mapping as a plain object
const ProcessConfigType = {
    PTT:      '101',
    CW:       '102',
    OT:       '103',
    HM:       '104',
    TB:       '105',
    CWS:      '201',
    NED:      '202',
    OPWN:     '203',
    INT_CWS:  '204',
    ECLAIMS:  '100',
    CWOPWN:   '200',
    UNKNOWN:  'unknown'
};

// Helper: reverse lookup from value to key name
const valueToKey = Object.entries(ProcessConfigType).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

// Simulate Java's fromValue
/**
 *
 * @param value
 */
function fromValue(value) {
    // Return the key if found, else 'UNKNOWN'
    const key = valueToKey[value];
    return key || 'UNKNOWN';
}

// Optionally, export both the enum and the fromValue function
module.exports = {
    ProcessConfigType,
    fromValue
};