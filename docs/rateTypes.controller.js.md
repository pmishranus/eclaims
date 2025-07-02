# rateTypes.controller.js

## Overview
This controller provides the logic to fetch eligible rate types for a staff member in the eClaims system. It validates input, fetches user and job info, and retrieves rate type data for a given claim month, ULU, FDLU, and process code.

## Main Function
### `fetchRateTypes(request)`
- **Purpose:** Fetches eligible rate types for a staff member based on staff ID, claim month, ULU, FDLU, and process code.
- **Parameters:**
  - `request`: CAP request object containing input data (STAFF_ID, CLAIM_MONTH, ULU, FDLU, PROCESS_CODE).
- **Returns:**
  - An object with a message, error status, and a map of eligible rate types.
- **Key Steps:**
  1. Validates required input parameters (staffId, claimMonth, ulu, fdlu).
  2. Parses the claim month to determine the date range.
  3. Fetches rate types from the repository for the given date range and parameters.
  4. Structures the response as a map by RATE_CODE, with child items for each rate type.
  5. Returns the structured response.

## Dependencies
- Repositories: `appConfig.repo`, `util.repo`, `chrsJobInfo.repo`, `chrsCompInfo.repo`
- Utilities: `dateUtil`, `constant`, `commonUtil`

## Error Handling
- Throws errors for missing or invalid input and user not found.
- Returns HTTP 400 error for invalid input parameters.

## Exports
- `fetchRateTypes` (main function) 