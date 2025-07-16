# ECP WBS Validation Implementation

## Overview

The `ecpWbsValidate` action validates Work Breakdown Structure (WBS) codes using the ECP (Enterprise Central Procurement) system through CPI (Cloud Platform Integration).

## Implementation Details

### 1. CDS Service Definition

The action is defined in `srv/eclaims-service.cds`:

```cds
/**
 * @description Validates WBS (Work Breakdown Structure) codes using ECP system
 * @param data Object containing WBSRequest with array of WBS codes
 * @returns Validation results object from ECP system
 */
action ecpWbsValidate(data : object) returns object;
```

### 2. Enhanced Generic CPI Function

The existing `callCpiApi` function in `srv/util/commonUtil.js` has been enhanced to support both regular CPI calls and ECP CPI calls:

- Accepts either a URL string (for regular CPI) or a config object with `relativePath` (for ECP CPI)
- Dynamically reads credentials from the credential store for ECP calls
- Parses metadata to extract OAuth URL and hostname
- Constructs the full API URL by combining hostname and relative path
- Uses the same authentication and error handling for both types of calls

### 3. Controller Implementation

The controller in `srv/controller/ecpWbsValidateCtrl.controller.js`:

- Validates input payload format
- Calls the ECP CPI API with the relative path `/ecpwbsvalidate_qa`
- Returns structured response with validation results

## Usage

### Request Format

```json
{
  "data": {
    "WBSRequest": {
      "WBS": ["A-0003975"]
    }
  }
}
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "WBS validation completed successfully",
  "data": {
    // Response from ECP system
  },
  "validatedBy": "user@domain.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Credential Store Configuration

The implementation expects the credential store to contain:

- **Service**: `credstore`
- **Credential Name**: `hana_login_password`
- **Metadata Format**:

```json
{
  "oAuth": "https://oauthasservices-c10247e87.ap1.hana.ondemand.com/oauth2/api/v1/token?grant_type=client_credentials",
  "hostName": "https://e200226-iflmap.hcisbt.ap1.hana.ondemand.com/http"
}
```

## API Endpoint

- **URL**: `POST /eclaims/ecpWbsValidate`
- **Relative Path**: `/ecpwbsvalidate_qa`
- **Full URL**: `https://e200226-iflmap.hcisbt.ap1.hana.ondemand.com/http/ecpwbsvalidate_qa`

## Error Handling

The implementation includes comprehensive error handling for:

- Invalid payload format
- Empty WBS array
- Missing credentials
- Invalid metadata format
- CPI API errors
- Network timeouts

## Testing

Use the test file `testClient/ecpWbsValidate-test.http` to test the implementation with various scenarios:

- Single WBS code validation
- Multiple WBS codes validation
- Error cases (empty array, invalid format)

## Dependencies

- `srv/util/commonUtil.js` - Contains the generic CPI calling functions
- `srv/util/credStore/credStore.js` - Credential store utilities
- `axios` - HTTP client for API calls
