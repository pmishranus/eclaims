# initiateLockProcessDetails Implementation

## Overview

The `initiateLockProcessDetails` function has been successfully implemented in the `eclaimService.js` file. This function is responsible for creating and managing lock details for draft requests in the eclaims system.

## Implementation Details

### Function Signature

```javascript
async function initiateLockProcessDetails(draftId, staffNusNetId, requestorGrp, claimType, loggedInUserDetails = null)
```

### Parameters

- `draftId` (string): The draft ID of the claim request
- `staffNusNetId` (string): The NUSNET ID of the staff member
- `requestorGrp` (string): The requestor group (e.g., 'CLAIM_ASSISTANT', 'NUS_CHRS_ECLAIMS_ESS')
- `claimType` (string): The claim type (e.g., '101', '102')
- `loggedInUserDetails` (Object, optional): The logged in user details for optimization (avoids additional database call)

### Implementation Steps

1. **Staff Information Resolution**
   - **Optimized**: Uses provided `loggedInUserDetails` if available (avoids database call)
   - **Fallback**: Uses `CommonRepo.fetchLoggedInUser(staffNusNetId)` only if user details not provided
   - Extracts `STAFF_ID` or `STF_NUMBER` from the result, falls back to `staffNusNetId` if not found

2. **Generate Lock Instance ID**
   - Creates a unique `LOCK_INST_ID` using the sequence pattern: `LOCK + YYMM + sequence number`
   - Uses `CommonRepo.fetchSequenceNumber()` with pattern and digit configuration

3. **Prepare Lock Details**
   - Creates a lock details object with all required fields:
     - `LOCK_INST_ID`: Generated unique identifier
     - `REFERENCE_ID`: The draft ID
     - `PROCESS_CODE`: The claim type
     - `IS_LOCKED`: Set to 'X' (locked)
     - `LOCKED_BY_USER_NID`: Staff ID
     - `STAFF_USER_GRP`: Requestor group
     - `REQUEST_STATUS`: Set to 'UNLOCK'
     - `LOCKED_ON`: Current timestamp
     - `UPDATED_ON`: Current timestamp
     - `UPDATED_BY`: Staff ID
     - `UPDATED_BY_NID`: Staff NUSNET ID

4. **Persist Lock Details**
   - Uses `RequestLockDetailsRepo.upsertLockDetails()` to upsert the lock details
   - Handles both insert and update scenarios

### Error Handling

- Comprehensive try-catch block with detailed error logging
- Throws `ApplicationException` with descriptive error messages
- Logs all relevant parameters for debugging

## Repository Updates

### requestLockDetails.repo.js

Added `upsertLockDetails` method:

```javascript
async function upsertLockDetails(lockDetails) {
    const result = await cds.run(
        UPSERT.into("NUSEXT_UTILITY_REQUEST_LOCK_DETAILS")
        .entries(lockDetails)
    );
    return result;
}
```

## Usage Examples

### Basic Usage

```javascript
const { initiateLockProcessDetails } = require('./srv/util/eclaimService');

// Option 1: With loggedInUserDetails (optimized - no additional DB call)
try {
    await initiateLockProcessDetails(
        'DT2401001',           // draftId
        'user123',             // staffNusNetId  
        'CLAIM_ASSISTANT',     // requestorGrp
        '101',                 // claimType
        loggedInUserDetails    // user details from API
    );
    console.log('Lock process details initiated successfully');
} catch (error) {
    console.error('Error:', error.message);
}

// Option 2: Without loggedInUserDetails (fallback - makes DB call)
try {
    await initiateLockProcessDetails(
        'DT2401001',           // draftId
        'user123',             // staffNusNetId  
        'CLAIM_ASSISTANT',     // requestorGrp
        '101'                  // claimType
    );
    console.log('Lock process details initiated successfully');
} catch (error) {
    console.error('Error:', error.message);
}
```

### Integration with Mass Upload Flow

The function is called in various mass upload flows:

- Claimant submission flow
- Claim assistant submission flow
- Verifier submission flow
- Approver submission flow

## Database Operations

### Tables Involved

1. **NUSEXT_MASTER_DATA_CHRS_JOB_INFO**: For staff information lookup
2. **NUSEXT_UTILITY_REQUEST_LOCK_DETAILS**: For lock details storage

### Sequence Generation

- Uses `SEQ_NUMBER_GENERATION` stored procedure
- Pattern: `LOCK + YYMM` (e.g., LOCK2401)
- Digits: 4 (configurable via constants)

## Constants Used

- `ApplicationConstants.X`: Lock indicator ('X')
- `ApplicationConstants.UNLOCK`: Request status ('UNLOCK')
- `ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_LOCK_ID_PATTERN`: 'LOCK'
- `ApplicationConstants.SEQUENCE_PATTERN.SEQUENCE_REQUEST_LOCK_ID_DIGITS`: 4

## Testing

A test file has been created at `testClient/initiateLockProcessDetails-test.http` with usage examples and expected behavior documentation.

## Migration from Java

This implementation successfully migrates the Java `initiateLockProcessDetails` method from `MassUploadServiceImpl.java` to Node.js, maintaining the same functionality and behavior while following Node.js and CDS best practices.

## Performance Optimization

The implementation includes a performance optimization by accepting an optional `loggedInUserDetails` parameter. This allows the calling code to pass the already-fetched user details, avoiding an unnecessary database call to `CommonRepo.fetchLoggedInUser()`. This is particularly beneficial in mass upload scenarios where user details are already available from the API implementation.

## Dependencies

- `@sap/cds`: For database operations
- `CommonRepo`: For staff info lookup and sequence generation
- `RequestLockDetailsRepo`: For lock details persistence
- `ApplicationConstants`: For configuration constants
- `ApplicationException`: For error handling
