# RequestLockService Integration with Java Implementation

## Overview

This document explains how the Node.js `RequestLockService` has been integrated to match the Java `eclaimsRequestLockService.requestLock()` functionality in the `MassUploadServiceImpl.java`.

## Java Implementation Analysis

### Java Flow in MassUploadServiceImpl.java

1. **claimAssistantSubmissionFlow method (lines 563-646)**:

   ```java
   // After successful claimantCASaveSubmit
   initiateLockProcessDetails(eclaimsDataResDto.getDRAFT_ID(),
       eclaimsJWTTokenUtil.fetchNusNetIdFromToken(token), lockRequestorGrp,
       eclaimsDataResDto.getCLAIM_TYPE());
   ```

2. **initiateLockProcessDetails method (lines 2591-2609)**:

   ```java
   private void initiateLockProcessDetails(String draftId, String staffNusNetId, String requestorGrp, String claimType)
           throws ApplicationException {
       ChrsJobInfo chrsJobInfo = chrsJobInfoRepository.retrieveJobInfoDetails(staffNusNetId);
       String staffId = (!Objects.isNull(chrsJobInfo) && !Objects.isNull(chrsJobInfo.getChrsJobInfoId()))
               ? chrsJobInfo.getChrsJobInfoId().getSTF_NUMBER()
               : staffNusNetId;
       
       // Create RequestDto and call eclaimsRequestLockService.requestLock
       RequestDto requestDto = new RequestDto();
       requestDto.setDRAFT_ID(draftId);
       requestDto.setRequestorFormFlow(true);
       requestDto.setNUSNET_ID(staffId);
       requestDto.setREQUEST_STATUS(ApplicationConstants.UNLOCK);
       requestDto.setREQUESTOR_GRP(requestorGrp);
       requestDto.setPROCESS_CODE(claimType);
       eclaimsRequestLockService.requestLock(requestDto);
   }
   ```

## Node.js Implementation

### Updated Flow in convertedSingleRequest.controller.js

1. **claimAssistantSubmissionFlow method (lines 241-357)**:

   ```javascript
   // After successful claimantCASaveSubmit
   await initiateLockProcessDetails(
       tx,
       eclaimsDataResDto.DRAFT_ID,
       loggedInUserDetails.NUSNET_ID,
       lockRequestorGrp,
       eclaimsDataResDto.CLAIM_TYPE,
       loggedInUserDetails
   );
   ```

2. **Updated initiateLockProcessDetails method (lines 1298-1351)**:

   ```javascript
   async function initiateLockProcessDetails(tx, draftId, staffNusNetId, requestorGrp, claimType, loggedInUserDetails) {
       try {
           // Use provided loggedInUserDetails or fetch if not provided
           let staffId = staffNusNetId;
           if (loggedInUserDetails && loggedInUserDetails.STAFF_ID) {
               staffId = loggedInUserDetails.STAFF_ID;
           } else if (loggedInUserDetails && loggedInUserDetails.STF_NUMBER) {
               staffId = loggedInUserDetails.STF_NUMBER;
           } else {
               // Fallback: Fetch staff info from CHRS job info only if not provided
               const chrsJobInfo = await CommonRepo.fetchLoggedInUser(staffNusNetId);
               staffId = (chrsJobInfo && chrsJobInfo.STF_NUMBER) ? chrsJobInfo.STF_NUMBER : staffNusNetId;
           }

           // Create RequestDto object (matches Java implementation)
           const requestDto = {
               DRAFT_ID: draftId,
               NUSNET_ID: staffId,
               REQUESTOR_GRP: requestorGrp,
               PROCESS_CODE: claimType,
               REQUEST_STATUS: ApplicationConstants.UNLOCK
           };

           // Use RequestLockService.requestLock() (matches Java eclaimsRequestLockService.requestLock)
           await RequestLockService.requestLock(requestDto, tx);

       } catch (error) {
           console.error("Error in initiateLockProcessDetails:", {
               draftId: draftId,
               staffNusNetId: staffNusNetId,
               requestorGrp: requestorGrp,
               claimType: claimType,
               error: error.message,
               stack: error.stack
           });
           throw new ApplicationException(`Failed to initiate lock process details: ${error.message}`);
       }
   }
   ```

## Key Changes Made

### 1. Created RequestLockService (srv/util/requestLockService.js)

The service provides the `requestLock()` method that mirrors the Java `eclaimsRequestLockService.requestLock()`:

```javascript
static async requestLock(requestDto, tx = null) {
    // Validate request DTO
    // Check if already locked by another user
    // Generate LOCK_INST_ID
    // Prepare lock details for upsert
    // Use transaction or direct CDS operation
    // Return lock details
}
```

### 2. Updated Controller Imports

Added the RequestLockService import:

```javascript
const RequestLockService = require("../util/requestLockService");
```

### 3. Modified initiateLockProcessDetails Method

**Before (Direct Database Persistence)**:

```javascript
// Generate LOCK_INST_ID
const lockInstId = await CommonRepo.fetchSequenceNumber(lockIdPattern, digits);

// Prepare lock details for upsert
const lockDetails = {
    LOCK_INST_ID: lockInstId,
    REFERENCE_ID: draftId,
    // ... other fields
};

// Use transaction to upsert lock details
await CommonRepo.upsertOperationChained(tx, "NUSEXT_UTILITY_REQUEST_LOCK_DETAILS", lockDetails);
```

**After (Using RequestLockService)**:

```javascript
// Create RequestDto object (matches Java implementation)
const requestDto = {
    DRAFT_ID: draftId,
    NUSNET_ID: staffId,
    REQUESTOR_GRP: requestorGrp,
    PROCESS_CODE: claimType,
    REQUEST_STATUS: ApplicationConstants.UNLOCK
};

// Use RequestLockService.requestLock() (matches Java eclaimsRequestLockService.requestLock)
await RequestLockService.requestLock(requestDto, tx);
```

## Mapping Between Java and Node.js

| Java Component | Node.js Component | Purpose |
|----------------|-------------------|---------|
| `RequestDto` | `requestDto` object | Data transfer object for lock details |
| `eclaimsRequestLockService.requestLock(requestDto)` | `RequestLockService.requestLock(requestDto, tx)` | Main lock creation method |
| `ChrsJobInfoRepository.retrieveJobInfoDetails()` | `CommonRepo.fetchLoggedInUser()` | Fetch user job information |
| `ApplicationConstants.UNLOCK` | `ApplicationConstants.UNLOCK` | Constants for request status |
| `RequestLockDetailsRepository` | Direct CDS operations | Database persistence |

## Benefits of This Integration

1. **Consistency**: The Node.js implementation now follows the same pattern as the Java code
2. **Maintainability**: Lock logic is centralized in the RequestLockService
3. **Reusability**: The RequestLockService can be used by other controllers
4. **Validation**: Proper validation of request DTOs before processing
5. **Error Handling**: Consistent error handling across the application
6. **Transaction Support**: Proper transaction management for database operations

## Testing

Use the provided test file `testClient/requestLockService-integration-test.http` to verify:

1. **Claim Assistant Submission Flow**: Tests that the `initiateLockProcessDetails` method calls `RequestLockService.requestLock()`
2. **Request DTO Creation**: Verifies that the RequestDto object is created correctly
3. **Lock Persistence**: Confirms that lock details are properly stored in the database
4. **Concurrent Access**: Tests proper locking behavior for concurrent requests

## Verification Steps

1. **Check Application Logs**: Look for `RequestLockService.requestLock()` calls in the logs
2. **Database Verification**: Confirm lock records are created in `NUSEXT_UTILITY_REQUEST_LOCK_DETAILS`
3. **Flow Comparison**: Verify the Node.js flow matches the Java implementation
4. **Error Scenarios**: Test error conditions and ensure proper error handling

## Conclusion

The Node.js implementation now properly mirrors the Java `eclaimsRequestLockService.requestLock()` functionality, ensuring consistency between the two codebases and providing a robust, reusable lock management service.
