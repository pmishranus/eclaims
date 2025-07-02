# claimantStaffInfo.controller.js

## Overview
This controller provides the logic to fetch staff information for a claimant in the eClaims system. It validates input, fetches user and job info, and retrieves assignment, authorization, and approval matrix details for the claimant.

## Main Function
### `fetchClaimantStaffInfo(request)`
- **Purpose:** Fetches staff information for a claimant based on username.
- **Parameters:**
  - `request`: CAP request object containing username.
- **Returns:**
  - An object with error status, message, and staff info details.
- **Key Steps:**
  1. Validates required input parameter (username).
  2. Fetches user info from the repository.
  3. Calls helper to fetch staff info details, including assignments and authorizations.
  4. Returns the structured response.

## Helper Functions
- `fetchStaffInfoDetails(nusNetId)`: Fetches assignment, authorization, and approval matrix details for the claimant.
- `frameAssignmentDetails(jobInfoDtls)`: Frames assignment details as a JS object.

## Dependencies
- Repositories: `chrsCostDist.repo`, `util.repo`, `approverMatrix.repo`, `eligibilityCriteria.repo`, `chrsJobInfo.repo`
- Utilities: `constant`, `commonUtil`, `customErrors`

## Error Handling
- Throws errors for missing or invalid input and user not found.
- Returns HTTP 400 error for invalid input parameters.

## Exports
- `fetchClaimantStaffInfo` (main function) 