using {nusext as db} from '../db/datamodel';

using {
  PRJ_BASE_ECLAIM_REQUEST_VIEW,
  PRJ_ECLAIM_REQUEST_VIEW,
  PRJ_TASK_ACTION_CONFIG,
  PRJ_AGG_HOURS_DAY_TYPE
} from '../db/redefinemodel';

/**
 * @title Eclaims Service API
 * @description Comprehensive API for Eclaims management system. This service provides endpoints for staff lookup, claim management, and administrative functions.
 * @version 1.0.0
 * @contact.name Eclaims Development Team
 * @contact.email eclaims-support@nus.edu.sg
 * @license.name Internal Use Only
 * @license.url https://nus.edu.sg
 */
service EclaimsService @(path: '/eclaims') {

  @open
  type object {};


  /********************************************************************* Functions ***************************************************************************************************/

  /**
   * @description Dummy function for testing purposes
   * @returns Empty object
   */
  function dummy()                                                                                                                                                                returns {};
  /**
   * @description Retrieves claim types based on staff ID and user group
   * @param staffId Staff identifier
   * @param userGroup User group for authorization
   * @returns Array of claim type objects
   */
  function fetchClaimTypes(staffId : String, userGroup : String)                                                                                                                  returns array of {};
  /**
   * @description Retrieves ULU and FDLU information for a given claim type, user group, and period
   * @param claimType Type of claim
   * @param userGroup User group for authorization
   * @param period Time period for the data
   * @returns ULU and FDLU information object
   */
  function fetchUluFdlu(claimType : String, userGroup : String, period : String)                                                                                                  returns {};
  /**
   * @description Enhanced CA Staff Lookup function with improved performance and error handling
   * @param ulu Unit Level Unit code
   * @param fdlu Faculty Department Level Unit code
   * @param claimType Type of claim
   * @param period Time period in MM-YYYY format (optional, defaults to current date)
   * @param searchValue Search term for filtering staff (optional)
   * @returns Array of staff lookup results
   */
  function caStaffLookup(ulu : String, fdlu : String, claimType : String, period : String, searchValue : String)                                                                  returns array of {};

  /**
   * @description Retrieves draft eclaim data for a specific claim type, ULU, FDLU, period, and staff ID
   * @param claimType Type of claim
   * @param ulu Unit Level Unit code
   * @param fdlu Faculty Department Level Unit code
   * @param period Time period
   * @param staffId Staff identifier
   * @returns Draft eclaim data object
   */
  function draftEclaimData(claimType : String,
                           ulu : String,
                           fdlu : String,
                           period : String,
                           staffId : String)                                                                                                                                      returns {};

  /**
   * @description Retrieves submitted eclaim data for a specific claim type, ULU, FDLU, period, and staff ID
   * @param claimType Type of claim
   * @param ulu Unit Level Unit code
   * @param fdlu Faculty Department Level Unit code
   * @param period Time period
   * @param staffId Staff identifier
   * @returns Submitted eclaim data object
   */
  function submittedEclaimData(claimType : String,
                               ulu : String,
                               fdlu : String,
                               period : String,
                               staffId : String)                                                                                                                                  returns {};

  /**
   * @description Retrieves claimant staff information for a given username
   * @param username Username to lookup
   * @returns Claimant staff information object
   */
  function claimantStaffInfo(username : String)                                                                                                                                   returns {};
  /**
   * @description Retrieves WBS (Work Breakdown Structure) information for a staff ID and claim date
   * @param staffId Staff identifier
   * @param claimDate Date of the claim
   * @returns WBS information object
   */
  function fetchWBS(staffId : String, claimDate : String)                                                                                                                         returns {};
  /**
   * @description Fetches staff compensation info from CPI using stfNumber
   * @param stfNumber Staff number to query
   * @returns Compensation info object from CPI
   */
  function fetchCompInfoFromCPI(stfNumber : String)                                                                                                                               returns object;
  /**
   * @description Retrieves eligible claim types for the logged-in user (via XSUAA)
   * @param claimMonth Claim month (MM)
   * @param claimYear Claim year (YYYY)
   * @returns Array of eligible claim type DTOs
   */
  function eligibleClaimTypes(claimMonth : String, claimYear : String)                                                                                                            returns array of {};
  /**
   * @description CA Staff Benefit Lookup for the logged-in user (via XSUAA)
   * @param claimType Type of claim
   * @param ulu Unit Level Unit code
   * @param fdlu Faculty Department Level Unit code
   * @param period Time period in MM-YYYY format (optional, defaults to current date)
   * @param searchValue Search term for filtering staff (optional)
   * @returns Array of staff lookup results for benefit management
   */
  function caStaffBenefitLookup(claimType : String, ulu : String, fdlu : String, period : String, searchValue : String)                                                           returns array of {};
  /**
   * @description Sends pending email notifications for eclaims
   * @param pendingTaskName The pending task name (e.g., "APPROVER", "VERIFIER", "CLAIM_ASSISTANT")
   * @param processCode The process code (e.g., "101", "102", "103", "104", "105", "106", "107", "108")
   * @param noOfDaysDiff Number of days difference for cutoff calculation (optional)
   * @param emailDate Email date for CWS processes (optional)
   * @param ignoreDifference Whether to ignore difference ("Y" or "N") (optional)
   * @param timeRange Time range for CWS processes (optional)
   * @returns Array of email response objects with status and message
   */
  function sendPendingEmailNotification(pendingTaskName : String, processCode : String, noOfDaysDiff : String, emailDate : String, ignoreDifference : String, timeRange : String) returns array of {};
  /**
   * @description Sends rejection email for eclaims
   * @param draftId The draft ID of the claim being rejected
   * @param nusNetId The NUS Net ID of the user
   * @param role The role of the user (e.g., "APPROVER", "VERIFIER")
   * @param rejectionRemarks The rejection remarks/message
   * @param requestorGroup The requestor group (e.g., "CLAIM_ASSISTANT")
   * @param taskName The task name (e.g., "APPROVER", "VERIFIER")
   * @returns Email response object with status and message
   */
  function sendRejectionEmail(draftId : String, nusNetId : String, role : String, rejectionRemarks : String, requestorGroup : String, taskName : String)                          returns object;

  /********************************************************************* Actions ***************************************************************************************************/

  /**
   * @description Retrieves eclaims overview dashboard data
   * @param data Dashboard configuration data
   * @returns Dashboard data as string
   */
  action   eclaimsOverviewDashboard(data : object)                                                                                                                                returns String;
  /**
   * @description Retrieves rate types information
   * @param data Rate type configuration data
   * @returns Rate types object
   */
  action   rateTypes(data : object)                                                                                                                                               returns object;
  /**
   * @description Validates eclaims data
   * @param data Eclaims data to validate
   * @returns Validation results object
   */
  action   validateEclaims(data : object)                                                                                                                                         returns object;
  /**
   * @description Validates WBS (Work Breakdown Structure) codes using ECP system
   * @param data Object containing WBSRequest with array of WBS codes
   * @returns Validation results object from ECP system
   */
  action   ecpWbsValidate(data : object)                                                                                                                                          returns object;
  // Temporary utility connectivity check
  action   utilityEcho(data : object)                                                                                                                                             returns object;
  /**
   * @description Clears/deletes claims by process code
   * @param data Object containing processCode parameter
   * @returns Response object with deletion status
   */
  action   clearRequestsByProcessCode(data : object)                                                                                                                              returns object;
  /**
   * @description Deletes claim requests (draft deletion)
   * @param data Object containing array of RequestDto objects
   * @returns Response object with deletion status
   */
  action   deleteClaimRequest(data : object)                                                                                                                                      returns object;
  /**
   * @description Deletes eclaim requests (draft deletion) - migrated from Java endpoint
   * @param data Object containing array of RequestDto objects with either DRAFT_ID or REQUEST_ID
   * @returns Response object with deletion status and deleted draft IDs
   */
  action   deleteEclaimRequest(data : object)                                                                                                                                     returns object;
  /**
   * @description Clears claim requests (clear request deletion)
   * @param data Object containing array of RequestDto objects
   * @returns Response object with deletion status
   */
  action   deleteClaimClearRequest(data : object)                                                                                                                                 returns object;
  /**
   * @description Uploads and processes Excel file for mass upload
   * @param data Object containing file, claimCode, ulu, fdlu, period, noOfHeaderRows
   * @returns Excel upload response object
   */
  action   requestUpload(data : object)                                                                                                                                           returns object;
  /**
   * @description Filters eclaims data based on staff ID and request status
   * @param data Object containing STAFF_ID and REQUEST_STATUS array
   * @returns Filter response object with REQ_ID, CLAIM_TYPE, PERIOD, STATUS, and TASK arrays
   */
  action   filterData(data : object)                                                                                                                                              returns object;


  /******************************************************************** Calculation Views Exposed *********************************************************************************/

  // @readonly
  entity v_base_eclaim_request_view   as projection on PRJ_BASE_ECLAIM_REQUEST_VIEW;
  entity v_task_action_config_view    as projection on PRJ_TASK_ACTION_CONFIG;
  entity v_agg_hours_day_type         as projection on PRJ_AGG_HOURS_DAY_TYPE;
  entity PRJ_MASTER_CLAIM_TYPE        as projection on db.MASTER_DATA.MASTER_CLAIM_TYPE;
  entity PRJ_ECLAIMS_ITEMS_DATA       as projection on db.ECLAIMS.ITEMS_DATA;
  entity PRJ_UTILITY_STATUS_CONFIG    as projection on db.UTILITY.STATUS_CONFIG;
  entity PRJ_REMARKS_DETAILS          as projection on db.UTILITY.REMARKS_DATA;
  entity PRJ_ATTACHMENT_DATA          as projection on db.UTILITY.ATTACHMENTS_DATA;
  entity PRJ_REQUEST_LOCK_DETAILS     as projection on db.UTILITY.REQUEST_LOCK_DETAILS;
  entity PRJ_CHRS_JOB_INFO            as projection on db.MASTER_DATA.CHRS_JOB_INFO;

  /**
   * @description Eclaim request views with associated master data
   */
  @readonly
  entity eclaimRequestViews           as
    projection on PRJ_ECLAIM_REQUEST_VIEW {
      *,
      ![MasterClaimTypeDetails]      : Association to many PRJ_MASTER_CLAIM_TYPE on ![MasterClaimTypeDetails].CLAIM_TYPE_C = CLAIM_TYPE,
      ![EclaimsItemDataDetails]      : Association to many PRJ_ECLAIMS_ITEMS_DATA on ![EclaimsItemDataDetails].DRAFT_ID = DRAFT_ID,
      ![StatusConfigDetails]         : Association to many PRJ_UTILITY_STATUS_CONFIG on ![StatusConfigDetails].STATUS_CODE = REQUEST_STATUS,
      ![TaskActionConfigViewDetails] : Association to many v_task_action_config_view on ![TaskActionConfigViewDetails].PROCESS_INST_ID = PROCESS_INST_ID,
      ![RemarksDataDetails]          : Association to many PRJ_REMARKS_DETAILS on ![RemarksDataDetails].REFERENCE_ID = DRAFT_ID,
      ![AttachmentsDataDetails]      : Association to many PRJ_ATTACHMENT_DATA on ![AttachmentsDataDetails].REFERENCE_ID = DRAFT_ID,
      ![RequestLockDetailsDetails]   : Association to many PRJ_REQUEST_LOCK_DETAILS on ![RequestLockDetailsDetails].REFERENCE_ID = DRAFT_ID,
      ![AggHoursDayTypeViewDetails]  : Association to many v_agg_hours_day_type on ![AggHoursDayTypeViewDetails].DRAFT_ID = DRAFT_ID
    }

  @readonly
  entity eclaimAddtionalApproverViews as
    select
      key STF_NUMBER,
      key NUSNET_ID,
          SF_STF_NUMBER,
          START_DATE,
          END_DATE,
          FULL_NM,
          ULU_C,
          ULU_T,
          FDLU_C,
          FDLU_T,
          RM_NUSNET_ID,
          RM_STF_N,
          RM_FLG
    from PRJ_CHRS_JOB_INFO
    where
          RM_FLG     =  'X'
      and START_DATE <= $now
      and END_DATE   >= $now;

  // @readonly
  // entity v_eclaim_item_view         as projection on ECLAIMS_ITEM_VIEW;

  // @readonly
  // entity v_ot_approver_lists        as projection on OT_VERIFIER_APPROVER_LIST;

  /********************************************************************************************************************************************************************************/


  /******************************************************************** Custom Views Exposed *********************************************************************************/
  // define view v_eclaim_item_cons as
  //   select from db.ECLAIMS.ITEMS_DATA as A
  //   inner join db.ECLAIMS.HEADER_DATA as B
  //     on A.![DRAFT_ID] = B.![DRAFT_ID]

  //   left outer join db.UTILITY.PROCESS_DETAILS as PROCESS
  //     on PROCESS.REFERENCE_ID = A.![DRAFT_ID]

  //   left outer join db.UTILITY.TASK_DETAILS as TASKS
  //     on  PROCESS.PROCESS_INST_ID = TASKS.PROCESS_INST_ID
  //     and TASKS.TASK_NAME         = 'APPROVER'
  //     and TASKS.ACTION_CODE       = 'APPROVE'

  //   left outer join db.UTILITY.PROCESS_PARTICIPANTS as VERIFIER
  //     on  VERIFIER.REFERENCE_ID     = A.DRAFT_ID
  //     and VERIFIER.USER_DESIGNATION = 'VERIFIER'
  //     and VERIFIER.IS_DELETED       = 'N'

  //   left outer join db.UTILITY.PROCESS_PARTICIPANTS as ADDITIONAL_APP_1
  //     on  ADDITIONAL_APP_1.REFERENCE_ID     = A.DRAFT_ID
  //     and ADDITIONAL_APP_1.USER_DESIGNATION = 'ADDITIONAL_APP_1'
  //     and ADDITIONAL_APP_1.IS_DELETED       = 'N'

  //   left outer join db.UTILITY.PROCESS_PARTICIPANTS as ADDITIONAL_APP_2
  //     on  ADDITIONAL_APP_2.REFERENCE_ID     = A.DRAFT_ID
  //     and ADDITIONAL_APP_2.USER_DESIGNATION = 'ADDITIONAL_APP_2'
  //     and ADDITIONAL_APP_2.IS_DELETED       = 'N'

  //   left outer join (
  //     select
  //       RATE_CODE,
  //       RATE_DESC
  //     from db.MASTER_DATA.RATE_TYPE_MASTER_DATA
  //   ) as RATE_TYPE
  //     on RATE_TYPE.RATE_CODE = A.RATE_TYPE

  //   left outer join db.MASTER_DATA.CHRS_FDLU_ULU as CHRS_FDLU_ULU
  //     on  CHRS_FDLU_ULU.FDLU_C = B.FDLU
  //     and CHRS_FDLU_ULU.ULU_C  = B.ULU

  //   left outer join db.MASTER_DATA.MASTER_CLAIM_TYPE as CLAIM_TYPE
  //     on CLAIM_TYPE.CLAIM_TYPE_C = B.CLAIM_TYPE

  //   left outer join db.UTILITY.STATUS_CONFIG as STATUS_CONFIG
  //     on STATUS_CONFIG.STATUS_CODE = B.![REQUEST_STATUS]
  //   {
  //         B.CLAIM_TYPE,
  //         TO_VARCHAR(
  //           B.DATE_JOINED, 'DD.MM.YYYY'
  //         )                                as DATE_JOINED  : Date,
  //         B.EMPLOYEE_GRP,
  //         B.FDLU,
  //         B.FULL_NM,
  //         B.REQUEST_ID,
  //         B.REQUEST_STATUS,
  //         B.STAFF_ID,
  //         B.ULU,
  //         B.SUBMITTED_ON,
  //         A.CLAIM_MONTH,
  //         A.CLAIM_YEAR,
  //     key A.DRAFT_ID,
  //         A.RATE_TYPE,
  //         A.WBS,
  //         A.RATE_TYPE_AMOUNT,
  //         SUM(
  //           A.HOURS_UNIT
  //         )                                as HOURS_UNIT   : Int64,
  //         SUM(
  //           A.TOTAL_AMOUNT
  //         )                                as TOTAL_AMOUNT : Decimal(10, 2),
  //         PROCESS.PROCESS_INST_ID,
  //         TASKS.TASK_COMPLETED_BY          as APPROVER_STAFF_ID,
  //         TASKS.TASK_COMPLETED_BY_NID      as APPROVER_NUSNET_ID,
  //         VERIFIER.STAFF_ID                as VERIFIER_STAFF_ID,
  //         VERIFIER.NUSNET_ID               as VERIFIER_NUSNET_ID,
  //         VERIFIER.STAFF_FULL_NAME         as VERIFIER_STAFF_FULL_NAME,
  //         ADDITIONAL_APP_1.STAFF_ID        as ADDITIONAL_APP_1_STAFF_ID,
  //         ADDITIONAL_APP_1.NUSNET_ID       as ADDITIONAL_APP_1_NUSNET_ID,
  //         ADDITIONAL_APP_1.STAFF_FULL_NAME as ADDITIONAL_APP_1_STAFF_FULL_NAME,
  //         ADDITIONAL_APP_2.STAFF_ID        as ADDITIONAL_APP_2_STAFF_ID,
  //         ADDITIONAL_APP_2.NUSNET_ID       as ADDITIONAL_APP_2_NUSNET_ID,
  //         ADDITIONAL_APP_2.STAFF_FULL_NAME as ADDITIONAL_APP_2_STAFF_FULL_NAME,
  //         RATE_TYPE.RATE_DESC,
  //         CHRS_FDLU_ULU.FDLU_T,
  //         CHRS_FDLU_ULU.ULU_T,
  //         CLAIM_TYPE.CLAIM_TYPE_T,
  //         STATUS_CONFIG.STATUS_ALIAS,
  //         STATUS_CONFIG.STATUS_COLOR_CODE,
  //         STATUS_CONFIG.STATUS_CODE
  //   }
  //   where
  //         B.REQUEST_ID              <> ''
  //     and A.IS_DELETED              =  'N'
  //     and STATUS_CONFIG.STATUS_TYPE =  'ECLAIMS'
  //   group by
  //     B.REQUEST_ID,
  //     B.CLAIM_TYPE,
  //     B.STAFF_ID,
  //     B.FULL_NM,
  //     B.ULU,
  //     B.FDLU,
  //     B.EMPLOYEE_GRP,
  //     B.DATE_JOINED,
  //     B.REQUEST_STATUS,
  //     B.SUBMITTED_ON,
  //     A.DRAFT_ID,
  //     A.CLAIM_YEAR,
  //     A.CLAIM_MONTH,
  //     A.WBS,
  //     A.RATE_TYPE,
  //     A.CLAIM_YEAR,
  //     A.RATE_TYPE_AMOUNT,
  //     PROCESS.PROCESS_INST_ID,
  //     TASKS.TASK_COMPLETED_BY,
  //     TASKS.TASK_COMPLETED_BY_NID,
  //     VERIFIER.STAFF_ID,
  //     VERIFIER.NUSNET_ID,
  //     VERIFIER.STAFF_FULL_NAME,
  //     ADDITIONAL_APP_1.STAFF_ID,
  //     ADDITIONAL_APP_1.NUSNET_ID,
  //     ADDITIONAL_APP_1.STAFF_FULL_NAME,
  //     ADDITIONAL_APP_2.STAFF_ID,
  //     ADDITIONAL_APP_2.NUSNET_ID,
  //     ADDITIONAL_APP_2.STAFF_FULL_NAME,
  //     RATE_TYPE.RATE_DESC,
  //     CHRS_FDLU_ULU.FDLU_T,
  //     CHRS_FDLU_ULU.ULU_T,
  //     CLAIM_TYPE.CLAIM_TYPE_T,
  //     STATUS_CONFIG.STATUS_ALIAS,
  //     STATUS_CONFIG.STATUS_COLOR_CODE,
  //     STATUS_CONFIG.STATUS_CODE;


  /********************************************************************************************************************************************************************************/

  @protocol: 'rest'

  action   singleRequest(data : object)                                                                                                                                           returns object;

  /**
   * @description Converted single request method from Java implementation
   * @param data Object containing mass upload request data
   * @returns Upload response object with claim data and error status
   */
  action   convertedSingleRequest(data : object)                                                                                                                                  returns object;

}
