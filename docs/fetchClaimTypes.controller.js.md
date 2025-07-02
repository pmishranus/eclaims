# fetchClaimTypes.controller.js

## Overview
This controller provides the logic to fetch eligible claim types for a user in the eClaims system. It optimizes performance by batching configuration fetches and deduplicating results, and handles different user groups and claim type sources.

## Main Function
### `fetchClaimTypes(request)`
- **Purpose:** Fetches eligible claim types for a user, with configuration details, based on staff ID and user group.
- **Parameters:**
  - `request`: CAP request object containing staffId and userGroup.
- **Returns:**
  - An array of eligible claim types, each with configuration details (e.g., PAST_MONTHS).
- **Key Steps:**
  1. Validates required input parameters (staffId, userGroup).
  2. Determines which queries to execute based on user group (ESS_MONTH or others).
  3. Fetches claim types from eligibility or approver matrix repositories.
  4. Deduplicates results if needed.
  5. Batches configuration fetches to avoid N+1 query problem.
  6. Applies configuration values to the result set.
  7. Handles and logs errors, returning empty arrays or error messages as appropriate.

## Dependencies
- Repositories: `appConfig.repo`, `util.repo`, `approverMatrix.repo`, `eligibilityCriteria.repo`
- Utilities: `constant`, `commonUtil`, `performanceMonitor`

## Error Handling
- Throws errors for missing or invalid input.
- Logs and returns errors for failed fetches or empty results.

## Exports
- `fetchClaimTypes` (main function) 