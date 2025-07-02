# fetchWBS.controller.js

## Overview
This controller provides the logic to fetch WBS (Work Breakdown Structure) codes for a staff member for the past three months, based on claim date and staff ID. It validates input, fetches user info, and retrieves WBS data from the repository.

## Main Function
### `fetchWBS(request)`
- **Purpose:** Fetches WBS codes for a staff member for the past three months based on claim date and staff ID.
- **Parameters:**
  - `request`: CAP request object containing claimDate and staffId.
- **Returns:**
  - An object with an array of WBS codes and error status.
- **Key Steps:**
  1. Validates required input parameters (claimDate, staffId).
  2. Fetches user info from the repository.
  3. Calls helper to fetch WBS codes for the past three months.
  4. Returns the structured response.

## Helper Functions
- `fetchWBSPastThreeMonths(staffId, claimDate)`: Fetches WBS codes for the past three months for the given staff ID and claim date.

## Dependencies
- Repositories: `eclaimsData.repo`, `eclaimsItemData.repo`, `util.repo`
- Utilities: `constant`, `customErrors`, `commonUtil`, `dateUtil`

## Error Handling
- Throws errors for missing or invalid input and user not found.
- Returns HTTP 400 error for invalid input parameters.

## Exports
- `fetchWBS` (main function) 