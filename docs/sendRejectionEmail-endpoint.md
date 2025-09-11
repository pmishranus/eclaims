# Send Rejection Email Endpoint

## Overview

This endpoint implements the `/eclaims/sendRejectionEmail` functionality from the Java EmailController, allowing the system to send rejection emails for eclaims.

## Endpoint Details

- **URL**: `GET /eclaims/sendRejectionEmail`
- **Method**: GET
- **Content-Type**: `application/json` (for function parameters)

## Request Parameters

The function expects the following parameters as query parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `draftId` | String | Yes | The draft ID of the claim being rejected |
| `nusNetId` | String | Yes | The NUS Net ID of the user |
| `role` | String | Yes | The role of the user (e.g., "APPROVER", "VERIFIER") |
| `rejectionRemarks` | String | Yes | The rejection remarks/message |
| `requestorGroup` | String | Yes | The requestor group (e.g., "CLAIM_ASSISTANT") |
| `taskName` | String | Yes | The task name (e.g., "APPROVER", "VERIFIER") |

## Request Example

**GET Request with Query Parameters:**

```
GET /eclaims/sendRejectionEmail?draftId=DRAFT123456&nusNetId=testuser@nus.edu.sg&role=APPROVER&rejectionRemarks=Please%20provide%20additional%20documentation&requestorGroup=CLAIM_ASSISTANT&taskName=APPROVER
```

**Function Call Parameters:**

- `draftId`: DRAFT123456
- `nusNetId`: <testuser@nus.edu.sg>
- `role`: APPROVER
- `rejectionRemarks`: Please provide additional documentation for this claim
- `requestorGroup`: CLAIM_ASSISTANT
- `taskName`: APPROVER

## Response Format

The endpoint returns an email response object:

```json
{
    "status": "SUCCESS",
    "message": "Email sent successfully",
    "templateId": "template_id_if_available",
    "error": false
}
```

### Error Response

```json
{
    "status": "ERROR",
    "message": "Mail sending FAILURE: [error details]",
    "templateId": null,
    "error": true
}
```

## Implementation Details

- **Process Code**: Hardcoded to "103" (as per Java implementation)
- **Action Code**: Hardcoded to "REJECT" (as per Java implementation)
- **Email Service**: Uses the existing `emailService.sendOnDemandEmails` method
- **Transaction Context**: Passes the request object for proper transaction handling

## Java Equivalent

This endpoint replaces the Java implementation:

```java
@GetMapping(value = "/eclaims/sendRejectionEmail")
public ResponseEntity<EmailResponseDto> sendEmailOnRejection(
    @RequestParam(name = "draftId") String draftId,
    @RequestParam(name = "nusNetId") String nusNetId,
    @RequestParam(name = "role") String role,
    @RequestParam(name = "rejectionRemarks") String rejectionRemarks,
    @RequestParam(name = "requestorGroup") String requestorGroup,
    @RequestParam(name = "taskName") String taskName
)
```

## Files Modified

1. `srv/eclaims-service.cds` - Added action definition
2. `srv/eclaims-service.js` - Added event handler
3. `srv/controller/sendRejectionEmail.controller.js` - New controller implementation
4. `test/sendRejectionEmail.test.js` - Test file with examples

## Testing

Use the test file `test/sendRejectionEmail.test.js` to understand the expected request/response format and test the endpoint functionality.
