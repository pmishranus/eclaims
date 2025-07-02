# eclaimsOverviewDashboard.controller.js

## Overview
This controller manages the logic for the eClaims Overview Dashboard, providing endpoints and utilities to fetch and populate dashboard data for users based on their roles and process codes. It integrates with multiple repositories to gather user, process, and dashboard configuration data, and structures the dashboard response for the frontend.

## Main Functions
- **createConnectionOverviewDashboard(request, db, srv):**
  - Initializes a connection object and triggers dashboard data fetching.
- **fetchDashBoardDetails(request):**
  - Main entry point for dashboard data retrieval. Determines user, fetches user/job info, and routes to the appropriate dashboard population logic based on process code.
- **populateDashboardEclaims(chrsJobInfoList, inputRequest):**
  - Populates the dashboard data structure for eClaims, including user profile, groups, quick links, claim request overviews, and more, based on user roles and assignments.
- **populateDelegationDetails(oReturnObj, staffId, processCode):**
  - Fetches and attaches delegation details for the user to the dashboard response.

## Key Logic and Data Flow
- Validates and fetches user/job information using repositories.
- Determines dashboard type based on process code (e.g., eClaims, CWN).
- Aggregates and structures data for various dashboard widgets (profile, groups, quick links, claim overviews, delegation, etc.).
- Handles role-based visibility and data population for dashboard sections.
- Integrates with multiple repositories for user, process, and dashboard configuration data.

## Notable Dependencies
- Repositories: `chrsJobInfo.repo`, `hrpInfo.repo`, `taskInbox.repo`, `util.repo`, `processConfig.repo`, `approverMatrix.repo`, `processParticipant.repo`, `dashboardConfig.repo`, `chrsUluFdlu.repo`, `taskDelegation.repo`, `eclaimsData.repo`
- Utilities: `constant`, `customErrors`, `commonUtil`
- External: `moment-timezone`, `lodash`

## Error Handling
- Uses custom exceptions and logs errors for debugging.
- Rolls back transactions on error and returns error messages in the dashboard response.

## Exports
- Multiple dashboard-related functions, with `createConnectionOverviewDashboard` and `fetchDashBoardDetails` as main entry points. 