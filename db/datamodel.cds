
namespace nusext;


type VAR_DATE      : Date;
type VAR_FLAG      : Integer;
type VAR_INT       : Integer;
type VAR_TEXT_1    : String(1);
type VAR_TEXT_2    : String(2);
type VAR_TEXT_4    : String(4);
type VAR_TEXT_5    : String(5);
type VAR_TEXT_6    : String(6);
type VAR_TEXT_8    : String(8);
type VAR_TEXT_10   : String(10);
type VAR_TEXT_12   : String(12);
type VAR_TEXT_15   : String(15);
type VAR_TEXT_20   : String(20);
type VAR_TEXT_25   : String(25);
type VAR_TEXT_30   : String(30);
type VAR_TEXT_40   : String(40);
type VAR_TEXT_50   : String(50);
type VAR_TEXT_100  : String(100);
type VAR_TEXT_120  : String(120);
type VAR_TEXT_128  : String(128);
type VAR_TEXT_150  : String(150);
type VAR_TEXT_200  : String(200);
type VAR_TEXT_250  : String(250);
type VAR_TEXT_255  : String(255);
type VAR_TEXT_256  : String(256);
type VAR_TEXT_500  : String(500);
type VAR_TEXT_1000 : String(1000);
type VAR_TEXT_1500 : String(1500);
type VAR_TEXT_2000 : String(2000);
type VAR_TEXT_2500 : String(2500);
type VAR_TEXT_5000 : String(5000);
type VAR_TIMESTAMP : Timestamp;
type VAR_DEC_10_2  : Decimal(10, 2);
type VAR_DEC_05_2  : Decimal(5, 2);
type VAR_DEC_12_2  : Decimal(12, 2);

context ECLAIMS {

    /********************************************* Header Data @cds.persistence.exists
entity ***************************/

    @cds.persistence.exists
    entity HEADER_DATA   {
        key DRAFT_ID               : VAR_TEXT_15;
            REQUEST_ID             : VAR_TEXT_15;
            CLAIM_TYPE             : VAR_TEXT_6;
            STAFF_ID               : VAR_TEXT_20;
            STAFF_NUSNET_ID        : VAR_TEXT_100;
            CONCURRENT_STAFF_ID    : VAR_TEXT_20;
            ULU                    : VAR_TEXT_15;
            FDLU                   : VAR_TEXT_15;
            EMPLOYEE_GRP           : VAR_TEXT_20;
            DATE_JOINED            : VAR_TEXT_25;
            EMP_RATE_TYPE          : VAR_TEXT_10;
            CLAIM_YEAR             : VAR_TEXT_4;
            CLAIM_MONTH            : VAR_TEXT_2;
            REQUEST_STATUS         : VAR_TEXT_2;
            SUBMITTED_ON           : VAR_DATE;
            SUBMITTED_BY           : VAR_TEXT_20;
            SUBMITTED_BY_NID       : VAR_TEXT_100;
            REQUESTOR_GRP          : VAR_TEXT_50; // Identify the source user group
            CREATED_ON             : VAR_TIMESTAMP;
            ULU_T                  : VAR_TEXT_100;
            FULL_NM                : VAR_TEXT_250;
            CLAIM_REQUEST_TYPE     : VAR_TEXT_10;
            MODIFIED_BY            : VAR_TEXT_20;
            MODIFIED_BY_NID        : VAR_TEXT_100;
            MODIFIED_ON            : VAR_TIMESTAMP;
            WORKING_HOURS          : VAR_TEXT_100;
            STF_CLAIM_TYPE_CAT     : VAR_TEXT_10;
            APPOINTMENT_TRACK      : VAR_TEXT_10;
            ItsItemData            : Association to many ITEMS_DATA
                                         on ItsItemData.DRAFT_ID = $self.DRAFT_ID;
            ItsAttachmentData      : Association to many UTILITY.ATTACHMENTS_DATA
                                         on ItsAttachmentData.REFERENCE_ID = $self.DRAFT_ID;
            ItsRequestStatus       : Association to one UTILITY.STATUS_CONFIG
                                         on ItsRequestStatus.STATUS_CODE = $self.REQUEST_STATUS;
            ItsRemarksData         : Association to many UTILITY.REMARKS_DATA
                                         on ItsRemarksData.REFERENCE_ID = $self.DRAFT_ID;
            ItsProcessData         : Association to one UTILITY.PROCESS_DETAILS
                                         on ItsProcessData.REFERENCE_ID = $self.DRAFT_ID;
            ItsParticipantsData    : Association to many UTILITY.PROCESS_PARTICIPANTS
                                         on ItsParticipantsData.REFERENCE_ID = $self.DRAFT_ID;
            ItsNotificationLogData : Association to many UTILITY.ATTACHMENTS_DATA
                                         on ItsNotificationLogData.REFERENCE_ID = $self.DRAFT_ID
                                         or ItsNotificationLogData.REFERENCE_ID = $self.REQUEST_ID;
            ItsRequestLockData     : Association to many UTILITY.REQUEST_LOCK_DETAILS
                                         on ItsRequestLockData.REFERENCE_ID = $self.DRAFT_ID;

    };

    /********************************************* Items Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity ITEMS_DATA {
        key ITEM_ID              : VAR_TEXT_15; // Primary key of Items Data (DRAFT ID + 2 digit sequence no.)
            DRAFT_ID             : VAR_TEXT_15; // Foreign reference with the parent table
            CLAIM_START_DATE     : VAR_TEXT_15; // Claim Start Date selection
            CLAIM_END_DATE       : VAR_TEXT_15; // Claim End Date (for Consolidated submission, else it is )
            CLAIM_DAY_TYPE       : VAR_TEXT_20; // Workday or Rest Day or Public Holiday
            IS_PH                : VAR_FLAG; //Is Public Holiday Indicator
            START_TIME           : VAR_TEXT_10; // Start Time in HH:mm format entered per day wise
            END_TIME             : VAR_TEXT_10; // End Time in HH:mm format entered per day wise
            HOURS_COMPUTED       : VAR_TEXT_6; // Actual Hours Computed on the form after entering Start and End Time
            HOURS                : VAR_TEXT_6; // Same as Hours Computed. If edited by user, then capture the changed value.
            CLAIM_MONTH          : VAR_TEXT_10; // Copy the Claim Month from the Header Table
            CLAIM_WEEK_NO        : VAR_TEXT_6; // Auto-populate the Week No. of the Year and populate for showing the view of Week
            CLAIM_YEAR           : VAR_TEXT_4; // Populate the Claim Year when the month is selected for submission
            WBS                  : VAR_TEXT_20;
            WBS_DESC             : VAR_TEXT_100;
            RATE_TYPE            : VAR_TEXT_100; //Rate Type
            RATE_TYPE_AMOUNT     : VAR_DEC_10_2; //Populate Rate Type Amount or Rate Unit based on Rate Type selected
            IS_DISCREPENCY       : VAR_FLAG;
            DISC_RATETYPE_AMOUNT : VAR_TEXT_15; // Discrepency Rate Type Amount
            TOTAL_AMOUNT         : VAR_DEC_10_2;
            IS_MULTIPLE          : VAR_FLAG; // '1' if same claim day has multiple records else '0'
            IS_MARK_DELETION     : VAR_FLAG; // Used as a flag to indicate that it's marked for deletion for Audit Log Purpose
            REMARKS              : VAR_TEXT_500; //Capture remarks at each Claim Date
            UPDATED_BY           : VAR_TEXT_20; //Capture the logged in user name
            UPDATED_ON           : VAR_DATE; //Capture the timestamp of the action taken.
            CLAIM_DAY            : VAR_TEXT_20; // claim day
            RATE_UNIT            : VAR_TEXT_15;
            HOURS_UNIT           : VAR_DEC_05_2;
            IS_DELETED           : VAR_TEXT_2; // Column added for soft deleting item data
            WAGE_CODE            : VAR_TEXT_20;
            OBJECT_ID            : VAR_TEXT_15;
            OBJECT_TYPE          : VAR_TEXT_20;
            ItsHeaderData        : Association to one HEADER_DATA
                                       on ItsHeaderData.DRAFT_ID = $self.DRAFT_ID;
            ItsTaxBenType        : Association to one TAX_BFT_CLAIMS_GRP
                                       on ItsTaxBenType.BEN_TYPE = $self.OBJECT_TYPE;
    };

    /********************************************* Tax Benefits Claims @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity TAX_BFT_CLAIMS_GRP{
        key BEN_TYPE   : VAR_TEXT_2;
            START_DATE : VAR_DATE;
            END_DATE   : VAR_DATE;
            TITLE      : VAR_TEXT_250;
            BEN_GROUP  : VAR_TEXT_4;
    }
}


context CWNED {
    /********************************************* CWS Header Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity HEADER_DATA {
        key REQ_UNIQUE_ID       : VAR_TEXT_20;
            REQUEST_ID          : VAR_TEXT_20;
            PROCESS_CODE        : VAR_TEXT_5;
            TYPE                : VAR_TEXT_20;
            REQUEST_TYPE        : VAR_TEXT_10;
            START_DATE          : VAR_DATE;
            END_DATE            : VAR_DATE;
            START_DATE_CAL      : VAR_TIMESTAMP; //To populate UTC time of Start Date (can be used for OData Filter)
            END_DATE_CAL        : VAR_TIMESTAMP; //To populate UTC time of End Date (can be used for OData Filter)
            FACULTY_C           : VAR_TEXT_15; //Faculty Code on header data
            DEPT_C              : VAR_TEXT_15; // Department Code on header data
            DURATION_DAYS       : VAR_DEC_05_2;
            DURATION_HOURS      : VAR_DEC_05_2;
            SUB_TYPE            : VAR_TEXT_20;
            CLIENT_NAME         : VAR_TEXT_200;
            LOCATION            : VAR_TEXT_5;
            WORK_DETAILS        : VAR_TEXT_5000;
            WORK_HOURS          : VAR_TEXT_5;
            TIME_OFF_REQD       : VAR_TEXT_10;
            PROPERTY_USAGE      : VAR_TEXT_40;
            PROPERTY_DETAILS    : VAR_TEXT_255;
            STAFF_ID            : VAR_TEXT_20;
            CONCURRENT_STAFF_ID : VAR_TEXT_20;
            OFFLINE_APPROVAL    : VAR_TEXT_1;
            IS_REQUEST_CLOSED   : VAR_TEXT_1;
            REQUEST_STATUS      : VAR_TEXT_2;
            REQUESTOR_GRP       : VAR_TEXT_20;
            SUBMITTED_BY        : VAR_TEXT_20;
            SUBMITTED_ON        : VAR_DATE;
            MODIFIED_BY         : VAR_TEXT_20;
            MODIFIED_ON         : VAR_TIMESTAMP;
            STAFF_NUSNET_ID     : VAR_TEXT_100;
            ULU                 : VAR_TEXT_15;
            FDLU                : VAR_TEXT_15;
            SUBMITTED_ON_TS     : VAR_TIMESTAMP;
            SUBMITTED_BY_NID    : VAR_TEXT_100;
            SUBMISSION_TYPE     : VAR_TEXT_10;
            TO_DISPLAY          : VAR_TEXT_1;
            PROGRAM_NAME        : VAR_TEXT_5000;
            AMOUNT              : VAR_DEC_10_2;
            AGREED_AMOUNT       : VAR_DEC_10_2;
            CURRENCY            : VAR_TEXT_5;
            AGREED_CURRENCY     : VAR_TEXT_5;
            MIGRATED            : VAR_TEXT_5;
            MASS_REF_VAL        : VAR_TEXT_20; //This is to link between Mass Upload Request and ZIP files
            MASS_REF_UPLOAD_ID  : VAR_TEXT_20; //ZIP Upload ID Reference for the Scheduled Program
            SOURCE              : VAR_TEXT_5;
            IS_OFN_EXECUTED     : VAR_TEXT_1;
            OFN_EXTRACT_DATE    : VAR_TIMESTAMP;
            IS_WAIVED           : VAR_TEXT_1; //Y or N
            IS_ZIP_PROCESSED    : VAR_TEXT_2;
    };

    /********************************************* Year Split Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity YEAR_SPLIT_DATA {
        key SPLIT_ID             : VAR_TEXT_15;
            REFERENCE_ID         : VAR_TEXT_20;
            YEAR                 : VAR_TEXT_4;
            DURATION             : VAR_DEC_05_2;
            TOTAL_UTILIZATION_YR : VAR_DEC_05_2;
            CREATED_BY           : VAR_TEXT_20;
            CREATED_ON           : VAR_TIMESTAMP;
            MODIFIED_BY          : VAR_TEXT_20;
            MODIFIED_ON          : VAR_TIMESTAMP;
            IS_DELETED           : VAR_TEXT_2; // Column added for Soft Deletion
    };

    /********************************************* Assistance Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity ASSISTANCE_DATA {
        key ASSISTANCE_ID : VAR_TEXT_15;
            REFERENCE_ID  : VAR_TEXT_20;
            STAFF_ID      : VAR_TEXT_20;
            STAFF_NAME    : VAR_TEXT_100;
            STAFF_ULU     : VAR_TEXT_15;
            STAFF_FDLU    : VAR_TEXT_15;
            CREATED_BY    : VAR_TEXT_20;
            CREATED_ON    : VAR_TIMESTAMP;
            MODIFIED_BY   : VAR_TEXT_20;
            MODIFIED_ON   : VAR_TIMESTAMP;
            IS_DELETED    : VAR_TEXT_2; // Column added for Soft Deletion
    };

    /********************************************* WBS Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity WBS_DATA {
        key ID           : VAR_TEXT_20;
            REFERENCE_ID : VAR_TEXT_20;
            WBS          : VAR_TEXT_20;
            VALUE        : VAR_DEC_05_2;
            UNIT         : VAR_TEXT_20;
            CREATED_BY   : VAR_TEXT_20;
            CREATED_ON   : VAR_TIMESTAMP;
            MODIFIED_BY  : VAR_TEXT_20;
            MODIFIED_ON  : VAR_TIMESTAMP;
            IS_DELETED   : VAR_TEXT_2; // Column added for Soft Deletion
            WBS_CODE     : VAR_TEXT_20;
    };

    /********************************************* Payment Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity PAYMENT_DATA {
        key PAYMENT_ID         : VAR_TEXT_20;
            REFERENCE_ID       : VAR_TEXT_20;
            REQUEST_TYPE       : VAR_TEXT_10;
            YEAR               : VAR_TEXT_4;
            PAYMENT_DATE       : VAR_DATE;
            PAYMENT_DATE_CAL   : VAR_TIMESTAMP;
            PAYMENT_REF_NO     : VAR_TEXT_100;
            REMUNERATION_TYPE  : VAR_TEXT_10;
            STOCK_QNTY         : VAR_INT;
            STOCK_OPTION_QNTY  : VAR_INT;
            UNIT_TYPE          : VAR_TEXT_5;
            SHARES             : VAR_DEC_10_2;
            CURRENCY           : VAR_TEXT_5;
            AMOUNT             : VAR_DEC_10_2;
            DESCRIPTION        : VAR_TEXT_500;
            LEVY_AMOUNT        : VAR_DEC_10_2;
            IS_WAIVED          : VAR_TEXT_1; //Y or N
            BIZ_EXP_CRNCY      : VAR_TEXT_5;
            BIZ_EXP_AMT        : VAR_DEC_10_2;
            PAYMENT_REQ_STATUS : VAR_TEXT_2;
            CREATED_BY         : VAR_TEXT_20;
            CREATED_ON         : VAR_TIMESTAMP;
            MODIFIED_BY        : VAR_TEXT_20;
            MODIFIED_ON        : VAR_TIMESTAMP;
            PAYMENT_TYPE       : VAR_TEXT_2;
            IS_DELETED         : VAR_TEXT_1; // Column added for Soft Deletion
            MONTH              : VAR_TEXT_4;
            WBS                : VAR_TEXT_20;
            OBJ_KEY            : VAR_TEXT_20;
            INVOICE_NO         : VAR_TEXT_20;
            CLR_DOC_NO         : VAR_TEXT_20;
    };

    /********************************************* Payment Image Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity OPWN_PAYMENT_IMG_DATA {
        key PAYMENT_ID         : VAR_TEXT_20;
            REFERENCE_ID       : VAR_TEXT_20;
            REQ_REFERENCE_ID   : VAR_TEXT_20;
            STAFF_ID           : VAR_TEXT_20;
            MONTH              : VAR_TEXT_4;
            YEAR               : VAR_TEXT_4;
            WBS                : VAR_TEXT_20;
            ALLOTMENT_VAL      : VAR_DEC_05_2;
            PAYMENT_TYPE_R     : VAR_TEXT_2;
            PAYMENT_TYPE_C     : VAR_TEXT_10;
            AMOUNT             : VAR_DEC_10_2;
            CURRENCY           : VAR_TEXT_5;
            PAYMENT_DATE       : VAR_DATE;
            PAYMENT_DATE_CAL   : VAR_TIMESTAMP;
            PAYMENT_REQ_STATUS : VAR_TEXT_2;
            ADMIN_LAPSE        : VAR_TEXT_1;
            MODIFIED_BY        : VAR_TEXT_20;
            MODIFIED_ON        : VAR_TIMESTAMP;
            SF_SEQUENCE        : VAR_TEXT_50;
            MESSAGE_LOG        : VAR_TEXT_2000;
    };

    /********************************************* Consolidated Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity OPWN_OTP_CONSOLIDATED_DATA {
        key SF_SEQUENCE      : VAR_TEXT_50;
            STAFF_ID         : VAR_TEXT_20;
            CURRENCY         : VAR_TEXT_5;
            WBS              : VAR_TEXT_20;
            REQ_REFERENCE_ID : VAR_TEXT_500;
            REFERENCE_ID     : VAR_TEXT_500;
            PAYMENT_TYPE_C   : VAR_TEXT_10;
            PAYMENT_DATE     : VAR_TEXT_50;
            PAYMENT_DATE_CAL : VAR_TIMESTAMP;
            VALUE            : VAR_DEC_10_2;
            POSTING_STATUS   : VAR_TEXT_2;
            MODIFIED_BY      : VAR_TEXT_20;
            MODIFIED_ON      : VAR_TIMESTAMP;
            MESSAGE_LOG      : VAR_TEXT_2000;
            MONTH            : VAR_TEXT_4;
            YEAR             : VAR_TEXT_4;
    };

    /********************************************* Consolidated Error Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity OPWN_OTP_CONSOLIDATED_ERR_DATA {
        key SF_SEQUENCE      : VAR_TEXT_50;
            STAFF_ID         : VAR_TEXT_20;
            CURRENCY         : VAR_TEXT_5;
            WBS              : VAR_TEXT_20;
            REQ_REFERENCE_ID : VAR_TEXT_500;
            REFERENCE_ID     : VAR_TEXT_500;
            PAYMENT_TYPE_C   : VAR_TEXT_10;
            PAYMENT_DATE     : VAR_TEXT_50;
            PAYMENT_DATE_CAL : VAR_TIMESTAMP;
            VALUE            : VAR_DEC_10_2;
            POSTING_STATUS   : VAR_TEXT_2;
            MODIFIED_BY      : VAR_TEXT_20;
            MODIFIED_ON      : VAR_TIMESTAMP;
            MESSAGE_LOG      : VAR_TEXT_2000;
            MONTH            : VAR_TEXT_4;
            YEAR             : VAR_TEXT_4;
    };

    /******************************* Run Report Extract Data for CWS/NED/OPWN ***************************/
    @cds.persistence.exists
    entity REPORT_EXTRACT_DATA {
        key REP_EXTRACT_ID            : VAR_TEXT_20;
            REQ_UNIQUE_ID             : VAR_TEXT_20;
            PAYMENT_ID                : VAR_TEXT_20;
            REQUEST_ID                : VAR_TEXT_20;
            PROCESS_INST_ID           : VAR_TEXT_12;
            PROCESS_NAME              : VAR_TEXT_100;
            PROCESS_TITLE             : VAR_TEXT_100;
            PROCESS_CODE              : VAR_TEXT_5;
            TYPE                      : VAR_TEXT_20;
            REQUEST_TYPE              : VAR_TEXT_10;
            START_DATE                : VAR_DATE;
            END_DATE                  : VAR_DATE;
            START_DATE_CAL            : VAR_TIMESTAMP; //To populate UTC time of Start Date (can be used for OData Filter)
            END_DATE_CAL              : VAR_TIMESTAMP; //To populate UTC time of End Date (can be used for OData Filter)
            FACULTY_C                 : VAR_TEXT_15; //Faculty Code on header data
            FACULTY_T                 : VAR_TEXT_100;
            DEPT_C                    : VAR_TEXT_15; // Department Code on header data
            DEPT_T                    : VAR_TEXT_100;
            DURATION_DAYS             : VAR_DEC_05_2;
            DURATION_HOURS            : VAR_DEC_05_2;
            SUB_TYPE                  : VAR_TEXT_20;
            SUB_TYPE_T                : VAR_TEXT_50;
            CLIENT_NAME               : VAR_TEXT_200;
            LOCATION                  : VAR_TEXT_5;
            LOCATION_T                : VAR_TEXT_50;
            WORK_DETAILS              : VAR_TEXT_5000;
            WORK_HOURS                : VAR_TEXT_5;
            WORK_HOURS_T              : VAR_TEXT_20;
            TIME_OFF_REQD             : VAR_TEXT_10;
            PROPERTY_USAGE            : VAR_TEXT_40;
            PROPERTY_USAGE_T          : VAR_TEXT_100;
            PROPERTY_USAGE_R          : VAR_DEC_05_2;
            PROPERTY_DETAILS          : VAR_TEXT_255;
            STAFF_ID                  : VAR_TEXT_20;
            FULL_NM                   : VAR_TEXT_256;
            CONCURRENT_STAFF_ID       : VAR_TEXT_20;
            RM_STF_N                  : VAR_TEXT_20;
            RMM_STF_N                 : VAR_TEXT_20;
            HRP_STF_N                 : VAR_TEXT_20;
            OFFLINE_APPROVAL          : VAR_TEXT_1;
            IS_REQUEST_CLOSED         : VAR_TEXT_1;
            REQUEST_STATUS            : VAR_TEXT_2;
            REQUEST_STATUS_ALIAS      : VAR_TEXT_50;
            REQUEST_STATUS_COLOR_CODE : VAR_INT;
            REQUESTOR_GRP             : VAR_TEXT_20;
            SUBMITTED_ON              : VAR_DATE;
            MODIFIED_BY               : VAR_TEXT_20;
            MODIFIED_ON               : VAR_TIMESTAMP;
            STAFF_NUSNET_ID           : VAR_TEXT_100;
            ULU                       : VAR_TEXT_15;
            ULU_C                     : VAR_TEXT_15;
            ULU_T                     : VAR_TEXT_100;
            ENG_ULU_T                 : VAR_TEXT_100;
            FDLU                      : VAR_TEXT_15;
            FDLU_C                    : VAR_TEXT_15;
            FDLU_T                    : VAR_TEXT_100;
            ENG_FDLU_T                : VAR_TEXT_100;
            SUBMITTED_ON_TS           : VAR_TIMESTAMP;
            SUBMITTED_BY              : VAR_TEXT_20;
            SUBMITTED_BY_NID          : VAR_TEXT_100;
            SUBMITTED_BY_FULLNAME     : VAR_TEXT_100;
            SUBMISSION_TYPE           : VAR_TEXT_10;
            SUBMISSION_TYPE_T         : VAR_TEXT_20;
            SUBMISSION_TYPE_REF_T     : VAR_TEXT_50;
            TO_DISPLAY                : VAR_TEXT_1;
            PROGRAM_NAME              : VAR_TEXT_5000;
            AMOUNT_PAYABLE            : VAR_DEC_10_2;
            TOTAL_AMOUNT              : VAR_DEC_10_2;
            BALANCE_AMOUNT            : VAR_DEC_10_2;
            PAID_AMOUNT               : VAR_DEC_10_2;
            AGREED_AMOUNT             : VAR_DEC_10_2;
            CURRENCY                  : VAR_TEXT_5;
            AGREED_CURRENCY           : VAR_TEXT_5;
            MIGRATED                  : VAR_TEXT_5;
            MASS_REF_VAL              : VAR_TEXT_20; //This is to link between Mass Upload Request and ZIP files
            MASS_REF_UPLOAD_ID        : VAR_TEXT_20; //ZIP Upload ID Reference for the Scheduled Program
            SOURCE                    : VAR_TEXT_5;
            IS_WAIVED                 : VAR_TEXT_1; //Y or N
            IS_ZIP_PROCESSED          : VAR_TEXT_2;
            YEAR                      : VAR_TEXT_4;
            PAYMENT_DATE              : VAR_DATE;
            PAYMENT_DATE_CAL          : VAR_TIMESTAMP;
            PAYMENT_REF_NO            : VAR_TEXT_100;
            REMUNERATION_TYPE         : VAR_TEXT_10;
            REMUNERATION_TYPE_T       : VAR_TEXT_50;
            STOCK_QNTY                : VAR_INT;
            STOCK_OPTION_QNTY         : VAR_INT;
            UNIT_TYPE                 : VAR_TEXT_5;
            UNIT_TYPE_T               : VAR_TEXT_20;
            SHARES                    : VAR_DEC_10_2;
            PAYMENT_CURRENCY          : VAR_TEXT_5;
            AMOUNT                    : VAR_DEC_10_2;
            DESCRIPTION               : VAR_TEXT_500;
            LEVY_AMOUNT               : VAR_DEC_10_2;
            IS_PYMT_WAIVED            : VAR_TEXT_1; //Y or N
            BIZ_EXP_CRNCY             : VAR_TEXT_5;
            BIZ_EXP_AMT               : VAR_DEC_10_2;
            PAYMENT_REQ_STATUS        : VAR_TEXT_2;
            PAYMENT_REQ_STATUS_STATE  : VAR_TEXT_20;
            PAYMENT_REQ_STATUS_ALIAS  : VAR_TEXT_50;
            CREATED_BY                : VAR_TEXT_20;
            CREATED_ON                : VAR_TIMESTAMP;
            PAYMENT_TYPE              : VAR_TEXT_2;
            PAYMENT_TYPE_C            : VAR_TEXT_10;
            PAYMENT_TYPE_ALIAS        : VAR_TEXT_50;
            IS_DELETED                : VAR_TEXT_1; // Column added for Soft Deletion
            MONTH                     : VAR_TEXT_4;
            AMENDED_WBS               : VAR_TEXT_200;
            AMENDED_ALLOT_VAL         : VAR_TEXT_100;
            OBJ_KEY                   : VAR_TEXT_20;
            INVOICE_NO                : VAR_TEXT_20;
            CLR_DOC_NO                : VAR_TEXT_20;
            OFFLINE_ADJUSTMENT        : VAR_DEC_10_2;
            FS_POSTED_ON              : VAR_TIMESTAMP;
            APPROVED_BY               : VAR_TEXT_20;
            APPROVED_ON               : VAR_TIMESTAMP;
            APPROVED_BY_FULL_NAME     : VAR_TEXT_100;
            LAST_SYNCED_ON            : VAR_TIMESTAMP;
    };

}

context UTILITY {
    /********************************************* Sequence generator @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity SEQ_GEN {
        key PATTERN   : VAR_TEXT_50;
            RUNNINGNO : VAR_INT;
    };

    /********************************************* BTP Credentials Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity BTP_CREDENTIALS{
        key CID           : VAR_TEXT_15;
            ACC_TYPE      : VAR_TEXT_20;
            END_POINT     : VAR_TEXT_100;
            ACC_NAME      : VAR_TEXT_50;
            ACC_SECRET    : VAR_TEXT_1000;
            CUSTOM_ATTR_1 : VAR_TEXT_1500;
            CUSTOM_ATTR_2 : VAR_TEXT_1500;
            CUSTOM_ATTR_3 : VAR_TEXT_1500;
            CUSTOM_ATTR_4 : VAR_TEXT_1500;
    };

    /********************************************* Email Templates Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity EMAIL_TEMPLATES{
        key TEMPLATE_NAME  : VAR_TEXT_100;
            MAIL_SUBJECT   : VAR_TEXT_250;
            MAIL_BODY      : VAR_TEXT_2000;
            CONTENT_TYPE   : VAR_TEXT_20;
            UPDATED_BY     : VAR_TEXT_20;
            UPDATED_BY_NID : VAR_TEXT_100;
            UPDATED_ON     : VAR_DATE;
            PROCESS_CODE   : VAR_TEXT_20;
            TEMPLATE_DESC  : VAR_TEXT_500;
    };

    /********************************************* Email Configs @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity EMAIL_CONFIGS{
        key ECONFIG_ID     : VAR_TEXT_20;
            TEMPLATE_NAME  : VAR_TEXT_100;
            EMAIL_DESC     : VAR_TEXT_200;
            PROCESS_CODE   : VAR_TEXT_20;
            TASK_NAME      : VAR_TEXT_40;
            ACTION_CODE    : VAR_TEXT_40;
            REQUEST_STATUS : VAR_TEXT_2;
            EMAIL_TYPE     : VAR_TEXT_1;
            RECIPIENT_TYPE : VAR_TEXT_4;
            RECIPIENT_LIST : VAR_TEXT_250;
            EMAIL_STATUS   : VAR_TEXT_2;
            EMAIL_API_NAME : VAR_TEXT_100;
            UPDATED_BY     : VAR_TEXT_20;
            UPDATED_BY_NID : VAR_TEXT_100;
            UPDATED_ON     : VAR_DATE;
            RECIPIENT_CC   : VAR_TEXT_100;

    };

    /********************************************* Email Placeholder Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity EMAIL_PLACEHOLDER_CONFIG{
        key EPH_ID           : VAR_TEXT_20;
            TEMPLATE_NAME    : VAR_TEXT_100;
            TASK_NAME        : VAR_TEXT_40;
            PH_TYPE          : VAR_TEXT_10;
            FIELD_TYPE       : VAR_TEXT_10;
            FIELD_KEY        : VAR_TEXT_50;
            FIELD_VALUE      : VAR_TEXT_500;
            FIELD_VALUE_PROP : VAR_TEXT_100;
            DISPLAY_SEQ      : VAR_INT;
            UPDATED_BY       : VAR_TEXT_20;
            UPDATED_BY_NID   : VAR_TEXT_100;
            UPDATED_ON       : VAR_DATE;
    };

    /********************************************* Audit Log Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity AUDIT_LOG_DATA{
        key AUDIT_ID       : VAR_INT;
            REFERENCE_ID   : VAR_TEXT_100;
            CHANGED_ON     : VAR_TIMESTAMP;
            CHANGED_BY     : VAR_TEXT_20;
            SECTION        : VAR_TEXT_100;
            IDENTITY       : VAR_TEXT_100;
            SUB_SECTION    : VAR_TEXT_100;
            FIELD_LABEL    : VAR_TEXT_100;
            OLD_VALUE      : VAR_TEXT_1500;
            OLD_VALUE_DESC : VAR_TEXT_1500;
            NEW_VALUE      : VAR_TEXT_1500;
            NEW_VALUE_DESC : VAR_TEXT_1500;
            FIELD_TYPE     : VAR_TEXT_20;
            ACTION_TYPE    : VAR_TEXT_10;
            CUSTOM_ATTR_1  : VAR_TEXT_100;
            CUSTOM_ATTR_2  : VAR_TEXT_100;

    };

    /********************************************* Attachments Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity ATTACHMENTS_DATA {
        key ATTCHMNT_ID      : VAR_TEXT_20; //Pattern ATYYMM<4digit seq no>
            REFERENCE_ID     : VAR_TEXT_50;
            HIERARCHY        : VAR_INT;
            SOURCE_TYPE      : VAR_TEXT_20;
            OPNTXT_ID        : VAR_TEXT_15;
            ATTACHMENT_TYPE  : VAR_TEXT_50;
            ATTACHMENT_NAME  : VAR_TEXT_100;
            ATTACHMENT_URL   : VAR_TEXT_250;
            MEDIA_TYPE       : VAR_TEXT_250;
            EXPIRY_DATE      : VAR_TEXT_20;
            UPLOADED_BY      : VAR_TEXT_20;
            UPDATED_BY_NID   : VAR_TEXT_100;
            UPLOADED_ON      : VAR_TEXT_40;
            IS_DELETED       : VAR_TEXT_2; // Column added for soft deleting data
            MODIFIED_BY      : VAR_TEXT_20;
            MODIFIED_BY_NID  : VAR_TEXT_100;
            MODIFIED_ON      : VAR_TIMESTAMP;
            IS_ZIP_PROCESSED : VAR_TEXT_2;
    };

    /********************************************* Notification Log Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity NOTIFICATION_LOG_DATA{
        key NOTIF_ID          : VAR_TEXT_20; //Patter NTYYMM<4 digit seq no>
            REFERENCE_ID      : VAR_TEXT_20; //Unique Request No. of the source request
            NOTIF_TEMPLATE_ID : VAR_TEXT_50; // Notification Template ID triggered from EMAIL_TEMPLATES table
            NOTIF_TYPE        : VAR_TEXT_1; //Manual (M) or System (S)
            RECIPIENT_LIST    : VAR_TEXT_500; //Recipient List with CSV or ";" separated
            RECIPIENT_TYPE    : VAR_TEXT_1; //Store Group (G) or Role (R) or Individual (I)
            NOTIF_STATUS      : VAR_TEXT_1; //Success (S) or Error (E) or Critical (C)
            NOTIF_STATUS_MSG  : VAR_TEXT_500; //Capture the Notification Error or Success Message
            SENT_BY           : VAR_TEXT_20; //Sent by Staff ID (User or Manual)
            SENT_BY_NUSNET_ID : VAR_TEXT_100; //Capture NUSNET ID of the User who sent
            SENT_ON           : VAR_TIMESTAMP; // Timestamp of Notification Triggered
            PROCESS_CODE      : VAR_TEXT_15;
            TASK_NAME         : VAR_TEXT_50;
    };

    /********************************************* Status Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity STATUS_CONFIG {
        key STATUS_CODE       : VAR_TEXT_2; // Status Code maintained as a 2 digit Numeric value
            STATUS_TYPE       : VAR_TEXT_10; // Populate "Process Code" or "Application Name"
            STATUS_ALIAS      : VAR_TEXT_100; //Display Text for each of the status maintained.
            STATUS_COLOR_CODE : VAR_INT; //Color code used in the application level. Common utility across various applications
            STATUS_DESC       : VAR_TEXT_100; //Maintain Status Description
            STATUS_STATE      : VAR_TEXT_20; //Maintain Status State
            SHOW_INBOX        : VAR_TEXT_1; //Flag to seggregate if Request to be shown in Inbox
    };

    /********************************************* Remarks Data @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity REMARKS_DATA{
        key ID                : VAR_TEXT_20;
            REFERENCE_ID      : VAR_TEXT_20;
            REMARKS           : VAR_TEXT_5000;
            STAFF_ID          : VAR_TEXT_20;
            STAFF_NAME        : VAR_TEXT_100;
            STAFF_USER_TYPE   : VAR_TEXT_40; // Capture user type, if Approver / Requestor / Verifier, etc.
            REMARKS_UPDATE_ON : VAR_TEXT_40; // Remarks entered timestamp
            REMARKS_TYPE      : VAR_TEXT_15; // Capture the action associated with that remark.
            NUSNET_ID         : VAR_TEXT_100;
            IS_EDITABLE       : VAR_INT; //Flag to allow for edit of remarks on the screen
    };

    /********************************************* Process Details @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity PROCESS_DETAILS{
        key PROCESS_INST_ID      : VAR_TEXT_12; //Process Instance ID in the format of PS<YY><MM><6 digit no.>
            REFERENCE_ID         : VAR_TEXT_15; //Reference ID of the Process Request triggered in the system. eg. CR220600001
            PROCESS_CODE         : VAR_TEXT_6; // Process code of the request
            PROCESS_STATUS       : VAR_TEXT_2; // Store code and reference from STATUS_CONFIG - PROCESS (StatusType)
            PROCESS_START_DATE   : VAR_TIMESTAMP; //Process Start Date
            PROCESSED_BY         : VAR_TEXT_20; // Staff ID of the Requestor
            PROCESSED_BY_NID     : VAR_TEXT_100; // NUSNET ID of the Requestor
            PROCESS_EXPECTED_DOC : VAR_DATE; // Populate Process Expected Date of Completion
            PROCESS_ACTUAL_DOC   : VAR_DATE; // Actual Date of Completion of the process
            ItsTaskDetails       : Association to many TASK_DETAILS
                                       on ItsTaskDetails.PROCESS_INST_ID = $self.PROCESS_INST_ID;
            ItsClaimData         : Association to one ECLAIMS.HEADER_DATA
                                       on ItsClaimData.DRAFT_ID = $self.REFERENCE_ID;
            ItsProcessStatus     : Association to one STATUS_CONFIG
                                       on ItsProcessStatus.STATUS_CODE = $self.PROCESS_STATUS;
            ItsProcessConfig     : Association to one PROCESS_CONFIG
                                       on ItsProcessConfig.PROCESS_CODE = $self.PROCESS_CODE;
    };

    /********************************************* Task Details Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity TASK_DETAILS   {
        key TASK_INST_ID             : VAR_TEXT_12; //Task Instance ID in the format of TK<YY><MM><6 digit no.>
            PROCESS_INST_ID          : VAR_TEXT_12; //Process Instance ID in the format of PS<YY><MM><6 digit no.>
            TASK_NAME                : VAR_TEXT_40; // Task Technical Name
            TASK_STATUS              : VAR_TEXT_2; // Store code and reference from STATUS_CONFIG - TASK (StatusType)
            TASK_CREATED_ON          : VAR_TIMESTAMP; //Task Start Date
            TASK_CREATED_BY          : VAR_TEXT_20; // Staff ID of the Requestor
            TASK_ASSGN_TO            : VAR_TEXT_20; //Task Assigned to Staff ID
            TASK_ASSGN_GRP           : VAR_TEXT_40; // INDIVIDUAL or GROUP
            TASK_COMPLETED_BY        : VAR_TEXT_20; //Task Assigned to Staff ID
            TASK_COMPLETED_BY_NID    : VAR_TEXT_100;
            TASK_EXPECTED_DOC        : VAR_TIMESTAMP; // Populate Task Expected Date of Completion
            TASK_ACTUAL_DOC          : VAR_TIMESTAMP; // Actual Date of Completion of the task
            TASK_SEQUENCE            : VAR_INT; //Populate Current Task Sequence
            ACTION_CODE              : VAR_TEXT_40; //Action Code
            TO_BE_TASK_SEQUENCE      : VAR_INT; //Upon Taking Action, Populate TO be Task Sequence from Task Completion
            TASK_ASSGN_TO_STF_NUMBER : VAR_TEXT_20; //Task Assigned to Staff ID
            TASK_CREATED_BY_NID      : VAR_TEXT_100; //Task Created By NID
            ItsProcessData           : Association to one PROCESS_DETAILS
                                           on ItsProcessData.PROCESS_INST_ID = $self.PROCESS_INST_ID;
            ItsTaskStatus            : Association to one STATUS_CONFIG
                                           on ItsTaskStatus.STATUS_CODE = $self.TASK_STATUS;
    };

    /********************************************* Process Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity PROCESS_CONFIG{
        key PROCESS_CODE     : VAR_TEXT_6;
            PROCESS_NAME     : VAR_TEXT_50;
            PROCESS_TITLE    : VAR_TEXT_100;
            PROCESS_SLA_DAYS : VAR_INT; // SLA of Process completion
            REFERENCE_KEY    : VAR_TEXT_6;
    };

    /********************************************* Tasks Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity TASKS_CONFIG{
        key TCFG_ID             : VAR_TEXT_15; //Primary Key for Table - stored in the pattern of TSKCFG<2 digit no.>
            PROCESS_CODE        : VAR_TEXT_6; // Populate Process Code for each Project Type
            REQUESTOR_GRP       : VAR_TEXT_50; // Identify the source user group
            TASK_NAME           : VAR_TEXT_40; // Task Technical Name
            TASK_ALIAS          : VAR_TEXT_50; //Task Description to display on the Application
            TASK_SEQUENCE       : VAR_INT; // Step in the process. eg. 2nd step - 2, etc.
            TASK_SLA_DAYS       : VAR_INT; // SLA of Task completion
            IS_MANDATORY        : VAR_FLAG; // Boolean value to store if the Step is mandatory or not
            SOURCE_ACCESS       : VAR_TEXT_1; //Define the Source task Access - "I" for Inbox and "R" for Requestor
            TASK_GRP            : VAR_TEXT_50; // Target Task Group Name
            TASK_REQUEST_STATUS : VAR_TEXT_2; //Request Status column - use a map between Task and Status Name
    };

    /********************************************* Task Action Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity TASK_ACTION_CONFIG{
        key TACTION_ID            : VAR_TEXT_15; //Primary Key for Table - stored in the pattern of TACTCFG<2 digit no.>
            REQUESTOR_GRP         : VAR_TEXT_50; //Identify the source user group
            TASK_NAME             : VAR_TEXT_40; // Task Technical Name
            ACTION_CODE           : VAR_TEXT_40; //Action Code
            ACTION_NAME           : VAR_TEXT_50; //Action Name
            CURRENT_TASK_SEQUENCE : VAR_INT;
            TO_BE_TASK_SEQUENCE   : VAR_INT; //Upon Taking Action, To be Task Sequence to refer to the Task Config Table
            TO_BE_PROCESS_STATUS  : VAR_TEXT_2; // Upon Taking Action, target Process status to update
            TO_BE_REQUEST_STATUS  : VAR_TEXT_2; // Upon Taking Action, target Task status to update
            BUTTON_TYPE           : VAR_TEXT_20; //Button Type to be displayed on the Inbox Screen
            DISPLAY_ICON          : VAR_TEXT_40; //Button Icon to Display on the Inbox Screen
            SEQUENCE_ORDER        : VAR_INT; // Sequence ORder to display on the form
            DISPLAY_REQD          : VAR_TEXT_1; // "Y" - Display in Inbox, "N" - Not required in Inbox
            PROCESS_CODE          : VAR_TEXT_6; // Populate Process Code for each Project Type
            ACTION_ALIAS          : VAR_TEXT_100; //Alias name of the action
            SUBMISSION_TYPE       : VAR_TEXT_15;
            UPDATED_BY            : VAR_TEXT_20;
            UPDATED_BY_NID        : VAR_TEXT_100;
            UPDATED_ON            : VAR_TIMESTAMP;
    };

    /********************************************* Claim Request Duration Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity CLAIM_REQUEST_DURATION_CONFIG {
        key CONFIG_ID            : VAR_TEXT_10;
            CLAIM_TYPE_C         : VAR_TEXT_6;
            CLAIM_TYPE_T         : VAR_TEXT_100;
            REQUESTOR_GRP        : VAR_TEXT_50;
            REQUEST_RANGE_MONTHS : VAR_INT;
            CREATED_BY           : VAR_TEXT_20;
            CREATED_ON           : VAR_DATE;
            UPDATED_BY           : VAR_TEXT_20;
            UPDATED_ON           : VAR_DATE;
    };

    /********************************************* Process Participants @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity PROCESS_PARTICIPANTS{ // Populate Additional Approver and Verifier Details - Allowed for selection on the UI
        key PPNT_ID          : VAR_TEXT_15; // Primary key of Items Data (PPNT + YY + MM + 4 digit)
            REFERENCE_ID     : VAR_TEXT_15; // Populate the source Unique ID (Request ID or Item ID)
            USER_DESIGNATION : VAR_TEXT_20; // Populate applicable Task Names (Refer to Task Config Table) - Reference with Task Details based on TASK_NAME
            STAFF_ID         : VAR_TEXT_20; // Participant's Staff ID
            NUSNET_ID        : VAR_TEXT_100; // Participant NUSNET ID
            UPDATED_BY       : VAR_TEXT_20; //Capture the logged in user name
            UPDATED_BY_NID   : VAR_TEXT_100;
            UPDATED_ON       : VAR_DATE; //Capture the timestamp of the action taken.
            STAFF_FULL_NAME  : VAR_TEXT_100;
            IS_DELETED       : VAR_TEXT_2; // Column added for soft deleting data
    };

    /********************************************* Task Delegation @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity TASK_DELEGATION_DETAILS{
        key ID                : VAR_TEXT_20;
            TASK_NAME         : VAR_TEXT_40; // Task Technical Name
            DELEGATED_TO      : VAR_TEXT_20;
            DELEGATED_TO_NID  : VAR_TEXT_100;
            PROCESS_TYPE      : VAR_TEXT_20;
            VALID_FROM        : VAR_DATE; // Valid From
            VALID_TO          : VAR_DATE; // Valid To
            CREATED_BY        : VAR_TEXT_20;
            CREATED_ON        : VAR_DATE;
            CREATED_BY_NID    : VAR_TEXT_100;
            ASSIGNED_TO       : VAR_TEXT_20;
            DELEGATED_FOR     : VAR_TEXT_20;
            DELEGATED_FOR_NID : VAR_TEXT_100;
            MODIFIED_BY       : VAR_TEXT_20;
            MODIFIED_ON       : VAR_DATE;
            MODIFIED_BY_NID   : VAR_TEXT_100;
            IS_DELETE         : VAR_TEXT_1;
            PROCESS_CODE      : VAR_TEXT_10;
            DELIMIT_IND       : VAR_TEXT_10;
    };

    /********************************************* App Configs @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity APP_CONFIGS{
        key ACFG_ID          : VAR_TEXT_10;
            PROCESS_CODE     : VAR_TEXT_10;
            CONFIG_DESC      : VAR_TEXT_500;
            CONFIG_KEY       : VAR_TEXT_100;
            CONFIG_VALUE     : VAR_TEXT_500;
            IS_MAINT_BY_USER : VAR_FLAG;
            UPDATED_BY       : VAR_TEXT_20;
            UPDATED_BY_NID   : VAR_TEXT_100;
            UPDATED_ON       : VAR_DATE;
    };

    /********************************************* CWS App Configs ***************************/
    @cds.persistence.exists
    entity CWS_APP_CONFIGS {
        key CWS_ACFG_ID     : VAR_TEXT_10;
            PROCESS_CODE    : VAR_TEXT_10;
            REFERENCE_KEY   : VAR_TEXT_50;
            CONFIG_KEY      : VAR_TEXT_50;
            CONFIG_VALUE    : VAR_TEXT_250;
            REFERENCE_VALUE : VAR_TEXT_50;
            CONFIG_DESC     : VAR_TEXT_1000;
            CFG_TYPE        : VAR_TEXT_4; // A - Application, S - System, I - IT Team
            IS_ACTIVE       : VAR_TEXT_1;
            CREATED_BY      : VAR_TEXT_20;
            CREATED_ON      : VAR_TIMESTAMP;
            MODIFIED_BY     : VAR_TEXT_20;
            MODIFIED_ON     : VAR_TIMESTAMP;
    };

    /********************************************* ULU Email Config @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity CWS_ULU_EMAIL_CONFIG {
        key CWS_ACFG_ID : VAR_TEXT_10;
            ULU         : VAR_TEXT_15;
            GRP_EMAIL   : VAR_TEXT_50;
            IS_ACTIVE   : VAR_TEXT_1;
            CREATED_BY  : VAR_TEXT_20;
            CREATED_ON  : VAR_TIMESTAMP;
    };

    /********************************************* Role Master @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity CHRS_ROLE_MASTER { //CHRS Approver Matrix Table
        key ROLE_ID       : VAR_TEXT_15; //Role ID will be in patter RLAUTHYY<4 digit sequence no.>
            PROCESS_CODE  : VAR_TEXT_6;
            ROLE_CODE     : VAR_TEXT_50; // Store the Role Code configured
            ROLE_CODE_LBL : VAR_TEXT_100; // Store the Role Code Label configured
            IS_ACTIVE     : VAR_FLAG; // Is Active or not
            MODIFIED_BY   : VAR_TEXT_20;
            MODIFIED_ON   : VAR_TIMESTAMP;
    };

    /********************************************* Approver Matrix @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity CHRS_APPROVER_MATRIX { //CHRS Approver Matrix Table
        key AUTH_ID         : VAR_TEXT_15; //Authorization ID will be in patter AUTHYY<4 digit sequence no.>
            PROCESS_CODE    : VAR_TEXT_6; // Claim Type Code Configuration
            ULU             : VAR_TEXT_15; // Store the ULU configured
            FDLU            : VAR_TEXT_15; // Store the FDLU configured
            STAFF_USER_GRP  : VAR_TEXT_50; // Store the Staff User Group
            STAFF_NUSNET_ID : VAR_TEXT_100; // Staff NUSNET ID
            STAFF_ID        : VAR_TEXT_20; //Staff ID
            VALID_FROM      : VAR_DATE; // Valid From
            VALID_TO        : VAR_DATE; // Valid To
            IS_EXCLUDED     : VAR_FLAG; //Exclusion Flag to provision the Excluding rule principal
            UPDATED_BY      : VAR_TEXT_20; //Capture the logged in user name
            UPDATED_BY_NID  : VAR_TEXT_100;
            UPDATED_ON      : VAR_TIMESTAMP; //Capture the timestamp of the action taken.
            IS_DELETED      : VAR_TEXT_2; // Column added for soft deleting Approver Matrix data
            APM_VALID_FROM  : VAR_TIMESTAMP; // Calendar Instance Valid From
            APM_VALID_TO    : VAR_TIMESTAMP; // Calendar Instance Valid To
            PROCESS_TYPE    : VAR_TEXT_20; // Process Grouping
    };

    /********************************************* Request LOCK @cds.persistence.exists
entity ***************************/
    @cds.persistence.exists
    entity REQUEST_LOCK_DETAILS{
        key LOCK_INST_ID       : VAR_TEXT_15; //Lock Instance ID in the format of LOCK<YY><MM><4 digit no.>
            REFERENCE_ID       : VAR_TEXT_15; //Reference ID of the Process Request triggered in the system. eg. DT220800001
            PROCESS_CODE       : VAR_TEXT_20; // Process code of the request
            ULU                : VAR_TEXT_15; // Store the ULU configured
            FDLU               : VAR_TEXT_15; // Store the FDLU configured
            IS_LOCKED          : VAR_TEXT_2; // X or empty or null
            LOCKED_BY_USER_NID : VAR_TEXT_100; // NUSNET ID of the Requestor
            VALID_FROM         : VAR_DATE; // Valid From - task delegation detail valid_from
            VALID_TO           : VAR_DATE; // Valid To - task delegation detail valid_To
            STAFF_USER_GRP     : VAR_TEXT_50; // Store the Staff User Group
            REQUEST_STATUS     : VAR_TEXT_2; //Request status
            LOCKED_ON          : VAR_DATE; // Valid From - task delegation detail valid_from
    };

    /*********************************************Dashboard table for listing all dashboard config***************************/
    @cds.persistence.exists
    entity DASHBOARD_CONFIG{
        key DS_ACFG_ID    : VAR_TEXT_10;
            ACCESS_ROLE   : VAR_TEXT_50;
            REFERENCE_KEY : VAR_TEXT_50;
            SEQUENCE      : VAR_INT;
            CONFIG_KEY    : VAR_TEXT_50;
            CONFIG_VALUE  : VAR_TEXT_500;
            FIELD_TYPE    : VAR_TEXT_100;
            IS_ACTIVE     : VAR_TEXT_1;
            CREATED_BY    : VAR_TEXT_20;
            MODIFIED_BY   : VAR_TEXT_20;
            CONFIG_DATA   : VAR_TEXT_250;
            PROCESS_CODE  : VAR_TEXT_20;
    };

    /*********************************************Feedback table for recording user feedback***************************/
    @cds.persistence.exists
    entity FEEDBACK_DETAILS {
        key SEQ_NO     : VAR_INT;
            STF_NO     : VAR_TEXT_20;
            STF_NAME   : VAR_TEXT_100;
            ISSUE_DATE : VAR_TEXT_50;
            APP_NAME   : VAR_TEXT_50;
            REMARKS    : VAR_TEXT_1000;
            CREATED_BY : VAR_TEXT_20;
            CREATED_ON : VAR_DATE;
    };

    /*********************************************Holiday List table***************************/
    @cds.persistence.exists
    entity NUS_CHRS_HOLIDAYS {
        key SEQ_NO       : VAR_INT;
            DATE         : VAR_DATE;
            DAY          : VAR_TEXT_50;
            MONTH        : VAR_TEXT_50;
            YEAR         : VAR_TEXT_50;
            HOLIDAY_TYPE : VAR_TEXT_10;
            HOLIDAY_NAME : VAR_TEXT_50;
            HOLIDAY_DESC : VAR_TEXT_50;
            PTT          : VAR_TEXT_50;
            OT           : VAR_TEXT_50;
            CW           : VAR_TEXT_50;
    };

    /***Day and Week Table****/
    @cds.persistence.exists
    entity DATE_TO_WEEK {
        key WEEK       : VAR_TEXT_6;
            START_DATE : VAR_DATE;
            END_DATE   : VAR_DATE;
    };

    /***External User Table and maintenance****/
    @cds.persistence.exists
    entity CHRS_EXTERNAL_USERS {
        key STF_NUMBER     : VAR_TEXT_100;
        key SF_STF_NUMBER  : VAR_TEXT_100;
        key START_DATE     : VAR_DATE;
        key END_DATE       : VAR_DATE;
            NUSNET_ID      : VAR_TEXT_100;
            FIRST_NM       : VAR_TEXT_50;
            LAST_NM        : VAR_TEXT_50;
            PREF_NM        : VAR_TEXT_50;
            FULL_NM        : VAR_TEXT_100;
            EMP_GP_C       : VAR_TEXT_4;
            EMP_GP_T       : VAR_TEXT_50;
            EMP_CAT_C      : VAR_TEXT_4;
            EMP_CAT_T      : VAR_TEXT_50;
            ULU_C          : VAR_TEXT_50;
            ULU_T          : VAR_TEXT_100;
            FDLU_C         : VAR_TEXT_50;
            FDLU_T         : VAR_TEXT_100;
            COMPANY_C      : VAR_TEXT_6;
            COMPANY_T      : VAR_TEXT_50;
            SAP_FAC_C      : VAR_TEXT_6;
            SAP_FAC_T      : VAR_TEXT_50;
            SAP_DEPT_C     : VAR_TEXT_6;
            SAP_DEPT_T     : VAR_TEXT_50;
            EMAIL          : VAR_TEXT_100;
            RM_NUSNET_ID   : VAR_TEXT_100;
            RM_STF_N       : VAR_TEXT_20;
            WK_SCHD_C      : VAR_TEXT_20;
            WK_SCHD_T      : VAR_TEXT_50;
            STD_HOURS      : VAR_TEXT_6;
            APPT_TRACK_C   : VAR_TEXT_6;
            APPT_TRACK_T   : VAR_TEXT_50;
            JOB_LVL_C      : VAR_TEXT_6;
            JOB_LVL_T      : VAR_TEXT_50;
            JOB_GRD_C      : VAR_TEXT_10;
            JOB_GRD_T      : VAR_TEXT_100;
            WORK_TITLE     : VAR_TEXT_100;
            EMPL_STS_C     : VAR_TEXT_4;
            EMPL_STS_T     : VAR_TEXT_50;
            CONTEXP_DATE   : VAR_DATE;
            JOIN_DATE      : VAR_DATE;
            LEAVING_DATE   : VAR_DATE;
            BANK_INFO_FLG  : VAR_TEXT_2;
            RM_FLG         : VAR_TEXT_2;
            PAYSCALE_GRP_C : VAR_TEXT_50;
            PAYSCALE_GRP_T : VAR_TEXT_50;
            CAPACITY_UTIL  : VAR_DEC_12_2;
            MODIFIED_BY    : VAR_TEXT_20;
            REMARKS        : VAR_TEXT_100;
            MODIFIED_ON    : VAR_TIMESTAMP;
    };

    @cds.persistence.exists
    entity TICKET_MGMT_DETAILS{
        key TCKT_ID          : VAR_TEXT_20; //Pattern TCKT<4digit seq no>
            PROCESS_CODE     : VAR_TEXT_6; // Process code of the request
            REFERENCE_TCKTNO : VAR_TEXT_50; //Reference Ticket No. from Remedy System
            REFERENCE_ID     : VAR_TEXT_500; //CSV Separated Request IDs
            TICKET_DESC      : VAR_TEXT_1000; // Ticket Desc provided during Ticket Assignment and creation
            TCKT_ASSGN_TO    : VAR_TEXT_20; //Ticket Assigned to Staff ID
            VALID_FROM       : VAR_DATE; // Valid From
            VALID_TO         : VAR_DATE; // Valid To
            TCK_VALID_FROM   : VAR_TIMESTAMP; // Calendar Instance Valid From
            TCK_VALID_TO     : VAR_TIMESTAMP; // Calendar Instance Valid To
            TCKT_STATUS      : VAR_TEXT_2; //Ticket Status
            IS_DELETED       : VAR_TEXT_2; // Column added for soft deleting Ticket data
            CREATED_BY       : VAR_TEXT_20;
            CREATED_ON       : VAR_TIMESTAMP;
            UPDATED_BY       : VAR_TEXT_20; //Capture the logged in user name
            UPDATED_ON       : VAR_TIMESTAMP; //Capture the timestamp of the action taken.
            TCKT_IT_NOTES    : VAR_TEXT_2500; // Capture the IT Notes during Ticket Execution
    };
}

context MASTER_DATA {
    /*********************************************Company Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_COMP_INFO{
        key SF_STF_NUMBER : VAR_TEXT_100;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
        key RATE_TYPE_C   : VAR_TEXT_100;
            RATE_TYPE_T   : VAR_TEXT_100;
            FREQUENCY     : VAR_TEXT_30;
            STF_NUMBER    : VAR_TEXT_100;
            AMOUNT        : VAR_DEC_12_2;
            CURRENCY      : VAR_TEXT_10;
    };

    /*********************************************Eligibility Criteria Entity***************************/
    @cds.persistence.exists
    entity CHRS_ELIG_CRITERIA{
        key STF_NUMBER          : VAR_TEXT_100;
        key SF_STF_NUMBER       : VAR_TEXT_100;
        key CLAIM_TYPE          : VAR_TEXT_100;
        key START_DATE          : VAR_DATE;
        key END_DATE            : VAR_DATE;
            SUBMISSION_END_DATE : VAR_DATE;
            MODIFIED_BY         : VAR_TEXT_20;
            REMARKS             : VAR_TEXT_150;
            MODIFIED_ON         : VAR_TEXT_50;
        key STF_CLAIM_TYPE_CAT  : VAR_TEXT_10 default 'NA';
            WORKING_HOURS       : VAR_TEXT_100;
            APPOINTMENT_TRACK   : VAR_TEXT_10;
    };

    /*********************************************Cost Distribution Entity***************************/
    @cds.persistence.exists
    entity CHRS_COST_DIST{
        key STF_NUMBER    : VAR_TEXT_100;
        key SF_STF_NUMBER : VAR_TEXT_100;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
            COST_DIST_FLG : VAR_TEXT_10;
    };

    /*********************************************ULU & FDLU Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_FDLU_ULU{
        key FDLU_C : VAR_TEXT_20;
            FDLU_T : VAR_TEXT_100;
            ULU_C  : VAR_TEXT_20;
            ULU_T  : VAR_TEXT_100;
    };

    /*********************************************ULU, FDLU, PA and PSA Entity***************************/
    @cds.persistence.exists
    entity CHRS_ULU_FDLU_PA_PSA{
        key EXTERNAL_CODE : VAR_TEXT_20;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
            ULU_C         : VAR_TEXT_20;
            FDLU_C        : VAR_TEXT_20;
            PA_C          : VAR_TEXT_10;
            PA_T          : VAR_TEXT_50;
            PSA_C         : VAR_TEXT_10;
            PSA_T         : VAR_TEXT_50;
    };

    /*********************************************Payroll Area Entity***************************/
    @cds.persistence.exists
    entity CHRS_PAYROLL_AREA{
        key STF_NUMBER    : VAR_TEXT_100;
        key SF_STF_NUMBER : VAR_TEXT_100;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
            PY_AREA_C     : VAR_TEXT_10;
            PY_AREA_T     : VAR_TEXT_100;
    };

    /*********************************************HRP Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_HRP_INFO{
        key STF_NUMBER    : VAR_TEXT_100;
        key SF_STF_NUMBER : VAR_TEXT_100;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
            HRP_STF_N     : VAR_TEXT_100;
            HRP_NUSNET_ID : VAR_TEXT_100;
    };

    /*********************************************Master Claim Type Entity***************************/
    @cds.persistence.exists
    entity MASTER_CLAIM_TYPE{
        key CLAIM_TYPE_C : VAR_TEXT_100;
            CLAIM_TYPE_T : VAR_TEXT_100;
    };

    /*********************************************Job Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_JOB_INFO{
        key STF_NUMBER     : VAR_TEXT_100;
        key SF_STF_NUMBER  : VAR_TEXT_100;
        key SEQ_NUMBER     : VAR_TEXT_10;
        key START_DATE     : VAR_DATE;
        key END_DATE       : VAR_DATE;
            FIRST_NM       : VAR_TEXT_128;
            LAST_NM        : VAR_TEXT_128;
            PREF_NM        : VAR_TEXT_128;
            FULL_NM        : VAR_TEXT_256;
            NUSNET_ID      : VAR_TEXT_100;
            EMP_GP_C       : VAR_TEXT_100;
            EMP_GP_T       : VAR_TEXT_100;
            EMP_CAT_C      : VAR_TEXT_100;
            EMP_CAT_T      : VAR_TEXT_100;
            ULU_C          : VAR_TEXT_100;
            ULU_T          : VAR_TEXT_100;
            FDLU_C         : VAR_TEXT_100;
            FDLU_T         : VAR_TEXT_100;
            COMPANY_C      : VAR_TEXT_100;
            COMPANY_T      : VAR_TEXT_100;
            SAP_FAC_C      : VAR_TEXT_100;
            SAP_FAC_T      : VAR_TEXT_100;
            SAP_DEPT_C     : VAR_TEXT_100;
            SAP_DEPT_T     : VAR_TEXT_100;
            EMAIL          : VAR_TEXT_128;
            RM_NUSNET_ID   : VAR_TEXT_100;
            RM_STF_N       : VAR_TEXT_20;
            WK_SCHD_C      : VAR_TEXT_100;
            WK_SCHD_T      : VAR_TEXT_100;
            STD_HOURS      : VAR_TEXT_100;
            APPT_TRACK_C   : VAR_TEXT_100;
            APPT_TRACK_T   : VAR_TEXT_100;
            JOB_LVL_C      : VAR_TEXT_100;
            JOB_LVL_T      : VAR_TEXT_100;
            RELIGION_C     : VAR_TEXT_100;
            RELIGION_T     : VAR_TEXT_100;
            RACE_C         : VAR_TEXT_100;
            RACE_T         : VAR_TEXT_100;
            JOB_GRD_C      : VAR_TEXT_100;
            JOB_GRD_T      : VAR_TEXT_100;
            WORK_TITLE     : VAR_TEXT_256;
            EMPL_STS_C     : VAR_TEXT_100;
            EMPL_STS_T     : VAR_TEXT_100;
            CONTEXP_DATE   : VAR_DATE;
            JOIN_DATE      : VAR_DATE;
            LEAVING_DATE   : VAR_DATE;
            BANK_INFO_FLG  : VAR_TEXT_10;
            RM_FLG         : VAR_TEXT_10;
            PAYSCALE_GRP_C : VAR_TEXT_100;
            PAYSCALE_GRP_T : VAR_TEXT_100;
            CAPACITY_UTIL  : VAR_DEC_12_2;
            MODIFIED_BY    : VAR_TEXT_100;
            REMARKS        : VAR_TEXT_150;
            MODIFIED_ON    : VAR_TEXT_50;
            WORKING_HOURS  : VAR_TEXT_100;
    };

    /*********************************************Rate Type Master Entity***************************/
    @cds.persistence.exists
    entity RATE_TYPE_MASTER_DATA{
        key ID        : VAR_TEXT_10;
            RATE_CODE : VAR_TEXT_5;
            RATE_DESC : VAR_TEXT_50;
            WAGE_CODE : VAR_TEXT_20;
            FREQUENCY : VAR_TEXT_30;
            MAX_LIMIT : VAR_TEXT_10;
    };

    /*********************************************Employee Listing Concur Entity***************************/
    @cds.persistence.exists
    entity EMPLOYEE_LISTING_CONCUR{
        key CONCUR_EMPLOYEE_NUMBER : Integer;
            EMPLOYEE_NUMBER        : Integer;
            BURSTING_ID            : VAR_TEXT_12;
            BURSTING_VALUE         : VAR_TEXT_120;
            HOD_CODE               : Integer;
            HOD_TYPE               : VAR_TEXT_120;
            PERSONNEL_AREA_CODE    : VAR_TEXT_5;
            PERSONNEL_SUBAREA_CODE : VAR_TEXT_8;
            CREATED_ON             : VAR_DATE;
    }

    /*********************************************Employee List Entity***************************/
    @cds.persistence.exists
    entity EMPLOYEE_LIST {
        key CONCUR_EMPLOYEE_NUMBER : VAR_INT;
            IN_USE                 : VAR_TEXT_1;
    }

    /*********************************************Replication Job Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_REPLICATION_JOB_INFO{
        key STF_NUMBER     : VAR_TEXT_100;
        key SF_STF_NUMBER  : VAR_TEXT_100;
        key SEQ_NUMBER     : VAR_TEXT_10;
        key START_DATE     : VAR_DATE;
        key END_DATE       : VAR_DATE;
        key MODIFIED_ON    : VAR_TEXT_50;
            FIRST_NM       : VAR_TEXT_128;
            LAST_NM        : VAR_TEXT_128;
            PREF_NM        : VAR_TEXT_128;
            FULL_NM        : VAR_TEXT_256;
            NUSNET_ID      : VAR_TEXT_100;
            EMP_GP_C       : VAR_TEXT_100;
            EMP_GP_T       : VAR_TEXT_100;
            EMP_CAT_C      : VAR_TEXT_100;
            EMP_CAT_T      : VAR_TEXT_100;
            ULU_C          : VAR_TEXT_100;
            ULU_T          : VAR_TEXT_100;
            FDLU_C         : VAR_TEXT_100;
            FDLU_T         : VAR_TEXT_100;
            COMPANY_C      : VAR_TEXT_100;
            COMPANY_T      : VAR_TEXT_100;
            SAP_FAC_C      : VAR_TEXT_100;
            SAP_FAC_T      : VAR_TEXT_100;
            SAP_DEPT_C     : VAR_TEXT_100;
            SAP_DEPT_T     : VAR_TEXT_100;
            EMAIL          : VAR_TEXT_128;
            RM_NUSNET_ID   : VAR_TEXT_100;
            RM_STF_N       : VAR_TEXT_20;
            WK_SCHD_C      : VAR_TEXT_100;
            WK_SCHD_T      : VAR_TEXT_100;
            STD_HOURS      : VAR_TEXT_100;
            APPT_TRACK_C   : VAR_TEXT_100;
            APPT_TRACK_T   : VAR_TEXT_100;
            JOB_LVL_C      : VAR_TEXT_100;
            JOB_LVL_T      : VAR_TEXT_100;
            RELIGION_C     : VAR_TEXT_100;
            RELIGION_T     : VAR_TEXT_100;
            RACE_C         : VAR_TEXT_100;
            RACE_T         : VAR_TEXT_100;
            JOB_GRD_C      : VAR_TEXT_100;
            JOB_GRD_T      : VAR_TEXT_100;
            WORK_TITLE     : String(256);
            EMPL_STS_C     : VAR_TEXT_100;
            EMPL_STS_T     : VAR_TEXT_100;
            CONTEXP_DATE   : VAR_DATE;
            JOIN_DATE      : VAR_DATE;
            LEAVING_DATE   : VAR_DATE;
            BANK_INFO_FLG  : VAR_TEXT_10;
            RM_FLG         : VAR_TEXT_10;
            PAYSCALE_GRP_C : VAR_TEXT_100;
            PAYSCALE_GRP_T : VAR_TEXT_100;
            CAPACITY_UTIL  : VAR_DEC_12_2;
            MODIFIED_BY    : VAR_TEXT_100;
            REMARKS        : VAR_TEXT_150;
    };


    /*********************************************Replication HRP Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_REPLICATION_HRP_INFO{
        key STF_NUMBER    : VAR_TEXT_100;
        key SF_STF_NUMBER : VAR_TEXT_100;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
        key MODIFIED_ON   : VAR_TEXT_50;
            HRP_STF_N     : VAR_TEXT_100;
            HRP_NUSNET_ID : VAR_TEXT_100;
            MODIFIED_BY   : VAR_TEXT_20;
            REMARKS       : VAR_TEXT_150;
    };

    /*********************************************Replication Company Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_REPLICATION_COMP_INFO{
        key SF_STF_NUMBER : VAR_TEXT_20;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
        key RATE_TYPE_C   : VAR_TEXT_100;
        key MODIFIED_ON   : VAR_TEXT_50;
            RATE_TYPE_T   : VAR_TEXT_100;
            FREQUENCY     : String(30);
            STF_NUMBER    : VAR_TEXT_100;
            AMOUNT        : VAR_DEC_12_2;
            CURRENCY      : VAR_TEXT_10;
            MODIFIED_BY   : VAR_TEXT_20;
            REMARKS       : VAR_TEXT_150;
    };

    /*********************************************Replication Cost Distribution Entity***************************/
    @cds.persistence.exists
    entity CHRS_REPLICATION_COST_DIST{
        key STF_NUMBER    : VAR_TEXT_100;
        key SF_STF_NUMBER : VAR_TEXT_100;
        key START_DATE    : VAR_DATE;
        key END_DATE      : VAR_DATE;
        key MODIFIED_ON   : VAR_TEXT_50;
            COST_DIST_FLG : VAR_TEXT_10;
            MODIFIED_BY   : VAR_TEXT_20;
            REMARKS       : VAR_TEXT_150;
    };

    /*********************************************Param Entitites Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_PARAM_ENTRIES{
        key REF_KEY : VAR_TEXT_100;
            REF_VAL : VAR_TEXT_50;
    };


}
