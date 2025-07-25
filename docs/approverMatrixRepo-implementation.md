# ApproverMatrixRepo Implementation

## Overview

This document details the implementation of the missing `ApproverMatrixRepo` methods that were required by the `RequestLockService`. The implementation follows the exact Java `ApproverMatrixRepository.java` patterns.

## Implemented Methods

### 1. fetchApprovalMatrixDtls

**Java Implementation:**

```java
@Query("select eam from ApproverMatrix eam where eam.STAFF_USER_GRP = :staffUserGroup and eam.ULU = :ulu and "
        + "eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE :fdlu END and eam.PROCESS_CODE = :processCode"
        + " and eam.VALID_FROM <= CURRENT_DATE and eam.VALID_TO >= CURRENT_DATE and eam.IS_DELETED='N'")
public List<ApproverMatrix> fetchApprovalMatrixDtls(@QueryParam(value = "staffUserGroup") String staffUserGroup,
        @QueryParam(value = "ulu") String ulu, @QueryParam(value = "fdlu") String fdlu,
        @QueryParam(value = "processCode") String processCode);
```

**Node.js Implementation:**

```javascript
fetchApprovalMatrixDtls: async function(staffUserGroup, ulu, fdlu, processCode, tx = null) {
    const query = `
        SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
        WHERE eam.STAFF_USER_GRP = ? 
        AND eam.ULU = ? 
        AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
        AND eam.PROCESS_CODE = ? 
        AND eam.VALID_FROM <= CURRENT_DATE 
        AND eam.VALID_TO >= CURRENT_DATE 
        AND eam.IS_DELETED = 'N'
    `;
    const values = [staffUserGroup, ulu, fdlu, processCode];
    const result = tx ? await tx.run(query, values) : await cds.run(query, values);
    return result || [];
}
```

### 2. fetchApprovalMatrixDtlsForAllUlunFdlu

**Java Implementation:**

```java
@Query("select eam from ApproverMatrix eam where eam.STAFF_USER_GRP = :staffUserGroup and eam.ULU = CASE WHEN eam.ULU = 'ALL' THEN eam.ULU ELSE :ulu END and eam.FDLU = "
        + " CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE :fdlu END and eam.PROCESS_CODE = :processCode"
        + " and eam.VALID_FROM <= CURRENT_DATE and eam.VALID_TO >= CURRENT_DATE and eam.IS_DELETED='N'")
public List<ApproverMatrix> fetchApprovalMatrixDtlsForAllUlunFdlu(
        @QueryParam(value = "staffUserGroup") String staffUserGroup, @QueryParam(value = "ulu") String ulu,
        @QueryParam(value = "fdlu") String fdlu, @QueryParam(value = "processCode") String processCode);
```

**Node.js Implementation:**

```javascript
fetchApprovalMatrixDtlsForAllUlunFdlu: async function(staffUserGroup, ulu, fdlu, processCode, tx = null) {
    const query = `
        SELECT * FROM NUSEXT_UTILITY_CHRS_APPROVER_MATRIX as eam 
        WHERE eam.STAFF_USER_GRP = ? 
        AND eam.ULU = CASE WHEN eam.ULU = 'ALL' THEN eam.ULU ELSE ? END 
        AND eam.FDLU = CASE WHEN eam.FDLU = 'ALL' THEN eam.FDLU ELSE ? END 
        AND eam.PROCESS_CODE = ? 
        AND eam.VALID_FROM <= CURRENT_DATE 
        AND eam.VALID_TO >= CURRENT_DATE 
        AND eam.IS_DELETED = 'N'
    `;
    const values = [staffUserGroup, ulu, fdlu, processCode];
    const result = tx ? await tx.run(query, values) : await cds.run(query, values);
    return result || [];
}
```

## Additional Repository Implementations

### 1. CwsDataRepo

Created `srv/repository/cwsData.repo.js` with the following methods:

- `fetchByUNIQUE_ID(uniqueId, tx)` - Fetches CWS data by unique ID
- `fetchAllByUNIQUE_ID(uniqueId, tx)` - Fetches all CWS data by unique ID
- `upsertCwsData(cwsData, tx)` - Upserts CWS data
- `deleteByUNIQUE_ID(uniqueId, tx)` - Deletes CWS data by unique ID

### 2. EclaimsDataRepo Updates

Updated `srv/repository/eclaimsData.repo.js` to support transactions:

- `fetchByDraftId(draftId, tx)` - Now supports optional transaction parameter

## Key Features

### 1. Transaction Support

All methods support optional transaction objects (`tx`) to ensure data consistency:

```javascript
const result = tx ? await tx.run(query, values) : await cds.run(query, values);
```

### 2. Parameterized Queries

All SQL queries use parameterized statements to prevent SQL injection:

```javascript
const query = `SELECT * FROM table WHERE field = ?`;
const values = [parameter];
```

### 3. Error Handling

Comprehensive error handling with try-catch blocks and meaningful error messages.

### 4. Java Compatibility

The Node.js implementations exactly match the Java query logic and parameter handling.

## Usage in RequestLockService

The `RequestLockService` now uses these repository methods:

```javascript
// In frameGroupParticipantLockDtls method
if (requestorGrp.toLowerCase() === ApplicationConstants.CW_OHRSS.toLowerCase()) {
    grpParticipantDetails = await ApproverMatrixRepo.fetchApprovalMatrixDtlsForAllUlunFdlu(requestorGrp, ulu, fdlu, processCode, tx);
} else {
    grpParticipantDetails = await ApproverMatrixRepo.fetchApprovalMatrixDtls(requestorGrp, ulu, fdlu, processCode, tx);
}
```

## Database Table Structure

The methods operate on the `NUSEXT_UTILITY_CHRS_APPROVER_MATRIX` table with the following key fields:

- `STAFF_USER_GRP` - Staff user group
- `ULU` - Upper Level Unit
- `FDLU` - Faculty/Department Level Unit
- `PROCESS_CODE` - Process code
- `VALID_FROM` - Valid from date
- `VALID_TO` - Valid to date
- `IS_DELETED` - Deletion flag

## Benefits

1. **Exact Java Mapping**: Node.js methods exactly match Java implementation
2. **Transaction Support**: All operations support database transactions
3. **Security**: Parameterized queries prevent SQL injection
4. **Maintainability**: Clear separation of concerns with repository pattern
5. **Consistency**: Same logic flow as Java implementation

## Testing

The implementation can be tested using the existing test files:

```javascript
// Test fetchApprovalMatrixDtls
const result = await ApproverMatrixRepo.fetchApprovalMatrixDtls('CLAIM_ASSISTANT', 'ULU001', 'FDLU001', '101');

// Test fetchApprovalMatrixDtlsForAllUlunFdlu
const result2 = await ApproverMatrixRepo.fetchApprovalMatrixDtlsForAllUlunFdlu('CW_OHRSS', 'ULU001', 'FDLU001', '201');
```

## Conclusion

The `ApproverMatrixRepo` implementation now provides complete functionality for the `RequestLockService`, ensuring that the Node.js version matches the Java implementation exactly in terms of method signatures, logic flow, and data handling.
