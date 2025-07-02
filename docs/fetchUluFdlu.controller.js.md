# fetchUluFdlu.controller.js

## Overview
This controller provides the logic to fetch ULU (Unit Level Unit) and FDLU (Functional Department Level Unit) details for a user in the eClaims system. It validates input, fetches user and job info, and retrieves ULU/FDLU data relevant to the claim type and user group.

## Main Function
### `fetchUluFdlu(request)`
- **Purpose:** Fetches ULU/FDLU details for a user based on claim type, user group, and period.
- **Parameters:**
  - `request`: CAP request object containing claimType, userGroup, and period.
- **Returns:**
  - An object with a message, ULU/FDLU details, and the user's NUSNET_ID.
- **Key Steps:**
  1. Validates required input parameters (claimType, userGroup, period).
  2. Fetches user info from the repository.
  3. Retrieves job info for the user.
  4. Fetches ULU/FDLU details using the job info and input parameters.
  5. Returns a structured response with the fetched data.

## Dependencies
- Repositories: `appConfig.repo`, `util.repo`, `chrsJobInfo.repo`, `chrsUluFdlu.repo`
- Utilities: `constant`, `commonUtil`

## Error Handling
- Throws errors for missing or invalid input and user not found.
- Returns HTTP 400 error for invalid input parameters.

## Exports
- `fetchUluFdlu` (main function) 