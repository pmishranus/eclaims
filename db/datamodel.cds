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
type VAR_TEXT_2000 : String(2000);
type VAR_TEXT_2500 : String(2500);
type VAR_TEXT_5000 : String(5000);
type VAR_TIMESTAMP : Timestamp;
type VAR_DEC_10_2  : Decimal(10, 2);
type VAR_DEC_05_2  : Decimal(5, 2);
type VAR_DEC_12_2  : Decimal(12, 2);


context ECLAIMS {

    /********************************************* Header Data Entity ***************************/
    @cds.persistence.exists
    entity HEADER_DATA {
        key DRAFT_ID            : VAR_TEXT_15;
            REQUEST_ID          : VAR_TEXT_15;
            CLAIM_TYPE          : VAR_TEXT_6;
            STAFF_ID            : VAR_TEXT_20;
            STAFF_NUSNET_ID     : VAR_TEXT_100;
            CONCURRENT_STAFF_ID : VAR_TEXT_20;
            ULU                 : VAR_TEXT_15;
            FDLU                : VAR_TEXT_15;
            EMPLOYEE_GRP        : VAR_TEXT_20;
            DATE_JOINED         : VAR_TEXT_25;
            EMP_RATE_TYPE       : VAR_TEXT_10;
            CLAIM_YEAR          : VAR_TEXT_4;
            CLAIM_MONTH         : VAR_TEXT_2;
            REQUEST_STATUS      : VAR_TEXT_2;
            SUBMITTED_ON        : VAR_DATE;
            SUBMITTED_BY        : VAR_TEXT_20;
            SUBMITTED_BY_NID    : VAR_TEXT_100;
            REQUESTOR_GRP       : VAR_TEXT_50; // Identify the source user group
            CREATED_ON          : VAR_TIMESTAMP;
            ULU_T               : VAR_TEXT_100;
            FULL_NM             : VAR_TEXT_250;
            CLAIM_REQUEST_TYPE  : VAR_TEXT_10;
            MODIFIED_BY         : VAR_TEXT_20;
            MODIFIED_BY_NID     : VAR_TEXT_100;
            MODIFIED_ON         : VAR_TIMESTAMP;
            WORKING_HOURS       : VAR_TEXT_100;
            STF_CLAIM_TYPE_CAT  : VAR_TEXT_10;
            APPOINTMENT_TRACK   : VAR_TEXT_10;
    };

    /********************************************* Items Data Entity ***************************/
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
    };

    /********************************************* Tax Benefits Claims Entity ***************************/
    @cds.persistence.exists
    entity TAX_BFT_CLAIMS_GRP {
        key BEN_TYPE   : VAR_TEXT_2;
            START_DATE : VAR_DATE;
            END_DATE   : VAR_DATE;
            TITLE      : VAR_TEXT_250;
            BEN_GROUP  : VAR_TEXT_4;
    }


}

context MASTER_DATA {
    @cds.persistence.exists
    entity CHRS_JOB_INFO {
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
    };
    @cds.persistence.exists
    entity CHRS_ELIG_CRITERIA {
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


    @cds.persistence.exists
    entity MASTER_CLAIM_TYPE {
        key CLAIM_TYPE_C : VAR_TEXT_100;
            CLAIM_TYPE_T : VAR_TEXT_100;
    };

    /*********************************************Rate Type Master Entity***************************/
    @cds.persistence.exists
    entity RATE_TYPE_MASTER_DATA {
        key ID        : VAR_TEXT_10;
            RATE_CODE : VAR_TEXT_5;
            RATE_DESC : VAR_TEXT_20;
            WAGE_CODE : VAR_TEXT_20;
            FREQUENCY : VAR_TEXT_30;
            MAX_LIMIT : VAR_TEXT_10;
    };

    /*********************************************ULU & FDLU Info Entity***************************/
    @cds.persistence.exists
    entity CHRS_FDLU_ULU {
        key FDLU_C : VAR_TEXT_20;
            FDLU_T : VAR_TEXT_100;
            ULU_C  : VAR_TEXT_20;
            ULU_T  : VAR_TEXT_100;
    };

}

context UTILITY {
    @cds.persistence.exists
    entity REQUEST_LOCK_DETAILS {
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

    @cds.persistence.exists
    entity PROCESS_DETAILS {
        key PROCESS_INST_ID      : VAR_TEXT_12; //Process Instance ID in the format of PS<YY><MM><6 digit no.>
            REFERENCE_ID         : VAR_TEXT_15; //Reference ID of the Process Request triggered in the system. eg. CR220600001
            PROCESS_CODE         : VAR_TEXT_6; // Process code of the request
            PROCESS_STATUS       : VAR_TEXT_2; // Store code and reference from STATUS_CONFIG - PROCESS (StatusType)
            PROCESS_START_DATE   : VAR_TIMESTAMP; //Process Start Date
            PROCESSED_BY         : VAR_TEXT_20; // Staff ID of the Requestor
            PROCESSED_BY_NID     : VAR_TEXT_100; // NUSNET ID of the Requestor
            PROCESS_EXPECTED_DOC : VAR_DATE; // Populate Process Expected Date of Completion
            PROCESS_ACTUAL_DOC   : VAR_DATE; // Actual Date of Completion of the process
    };

        /********************************************* Remarks Data Entity ***************************/
     @cds.persistence.exists
     entity REMARKS_DATA {
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
    
    
    /********************************************* Attachments Data Entity ***************************/
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

    /********************************************* Task Details Config Entity ***************************/
    @cds.persistence.exists
    entity TASK_DETAILS {
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
    };

    /********************************************* Process Participants Entity ***************************/
    @cds.persistence.exists
    entity PROCESS_PARTICIPANTS { // Populate Additional Approver and Verifier Details - Allowed for selection on the UI
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
}
