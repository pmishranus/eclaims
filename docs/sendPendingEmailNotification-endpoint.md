# Send Pending Email Notification Endpoint

## Overview

This endpoint implements the `/eclaims/sendPendingEmailNotification` functionality from the Java EmailController, allowing the system to send pending email notifications for various eclaims processes.

## Endpoint Details

- **URL**: `GET /eclaims/sendPendingEmailNotification`
- **Method**: GET
- **Content-Type**: `application/json` (for function parameters)

## Request Parameters

The function expects the following parameters as query parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pendingTaskName` | String | Yes | The pending task name (e.g., "APPROVER", "VERIFIER", "CLAIM_ASSISTANT") |
| `processCode` | String | Yes | The process code (e.g., "101", "102", "103", "104", "105", "106", "107", "108") |
| `noOfDaysDiff` | String | No | Number of days difference for cutoff calculation |
| `emailDate` | String | No | Email date for CWS processes |
| `ignoreDifference` | String | No | Whether to ignore difference ("Y" or "N") |
| `timeRange` | String | No | Time range for CWS processes |

## Supported Process Codes

### EClaims Processes

- **101**: PTT (Part-Time Teaching)
- **102**: CW (Casual Work)
- **103**: OT (Overtime)
- **104**: HM (Hourly Monthly)
- **105**: TB (Time Bank)

### CWS Processes

- **106**: CWS (Casual Work System)
- **107**: NED (Non-Employee Data)
- **108**: OPWN (Open Work)

## Request Examples

### EClaims Process Example

**GET Request with Query Parameters:**

```
GET /eclaims/sendPendingEmailNotification?pendingTaskName=APPROVER&processCode=101&noOfDaysDiff=3&emailDate=2024-01-15&ignoreDifference=N&timeRange=09:00-17:00
```

### CWS Process Example

**GET Request with Query Parameters:**

```
GET /eclaims/sendPendingEmailNotification?pendingTaskName=VERIFIER&processCode=106&noOfDaysDiff=2&emailDate=2024-01-15&ignoreDifference=Y&timeRange=08:00-18:00
```

## Response Format

The endpoint returns an array of email response objects:

```json
[
    {
        "status": "SUCCESS",
        "message": "Pending email notification sent for process 101, task APPROVER",
        "templateId": null,
        "error": false
    }
]
```

### Error Response

```json
[
    {
        "status": "ERROR",
        "message": "Mail sending FAILURE: [error details]",
        "templateId": null,
        "error": true
    }
]
```

## Implementation Details

- **Email Service**: Uses the existing `emailService.sendPendingTaskEmails` method
- **Process Routing**: Routes to different handlers based on process code
- **EClaims Processes**: Handled by `handlePendingEmailsForEClaims`
- **CWS Processes**: Handled by `handlePendingEmailsForCWS`
- **Transaction Context**: Passes the request object for proper transaction handling

## Java Equivalent

This endpoint replaces the Java implementation:

```java
@GetMapping(value = "/eclaims/sendPendingEmailNotification")
public ResponseEntity<List<EmailResponseDto>> sendPendingEmailNotification(
    @RequestParam(name = "pendingTaskName") String pendingTaskName,
    @RequestParam(name = "processCode") String processCode,
    @RequestParam(name = "noOfDaysDiff", required = false) String noOfDaysDiff,
    @RequestParam(name = "emailDate", required = false) String emailDate,
    @RequestParam(name = "ignoreDifference", required = false) String ignoreDifference,
    @RequestParam(required = false, name = "timeRange") String timeRange,
    @RequestHeader(name = "Authorization") String authorizationHeader
)
```

## Current Implementation Status

⚠️ **Note**: This is a foundational implementation with placeholder logic. The following components are ready for extension:

### ✅ Implemented

- Endpoint definition and routing
- Basic parameter validation
- Process code routing (EClaims vs CWS)
- Error handling and response formatting
- Transaction context support

### 🔄 TODO - Future Enhancements

- **Database Integration**: Implement actual pending task data fetching
- **Email Template Logic**: Add email template selection and processing
- **Cutoff Date Logic**: Implement date difference calculations
- **Batch Email Processing**: Add support for multiple email recipients
- **Authorization**: Add proper authorization checks (currently handled by framework)

## Files Modified

1. `srv/eclaims-service.cds` - Added action definition
2. `srv/eclaims-service.js` - Added event handler
3. `srv/controller/sendPendingEmailNotification.controller.js` - New controller implementation
4. `srv/service/emailService.js` - Added `sendPendingTaskEmails` and related methods
5. `test/sendPendingEmailNotification.test.js` - Test file with examples

## Testing

Use the test file `test/sendPendingEmailNotification.test.js` to understand the expected request/response format and test the endpoint functionality.

## Next Steps

To complete the implementation, the following areas need to be developed:

1. Database queries for fetching pending task data
2. Email template processing logic
3. Date calculation utilities
4. Batch email sending capabilities
5. Authorization and security checks
