# fetchDraftEclaimRequest.controller.js

## Overview
This controller provides the logic to fetch draft eClaim requests for a staff member, based on claim type, ULU, FDLU, period, and staff ID. It validates input, fetches user info, and retrieves draft claim data and associated items from the repository.

## Main Function
### `fetchDraftEclaimRequest(request)`
- **Purpose:** Fetches draft eClaim requests for a staff member based on claim type, ULU, FDLU, period, and staff ID.
- **Parameters:**
  - `request`: CAP request object containing claimType, ulu, fdlu, period, and staffId.
- **Returns:**
  - An object with claim data response, error status, and message.
- **Key Steps:**
  1. Validates required input parameters (claimType, ulu, fdlu, period, staffId).
  2. Fetches user info from the repository.
  3. Calls helper to check if a draft exists for the given parameters.
  4. Fetches associated item data for each draft.
  5. Returns the structured response.

## Helper Functions
- `isDraftExists(claimCode, ulu, fdlu, period, staffId, userInfoDetails)`: Checks if a draft exists and fetches associated item data.
- `validateInputParams(claimCode, ulu, fdlu, period, staffId)`: Validates required input parameters.

## Dependencies
- Repositories: `eclaimsData.repo`, `eclaimsItemData.repo`, `util.repo`
- Utilities: `constant`, `customErrors`, `commonUtil`

## Error Handling
- Throws errors for missing or invalid input and user not found.
- Returns HTTP 400 error for invalid input parameters.

## Exports
- `fetchDraftEclaimRequest` (main function) 