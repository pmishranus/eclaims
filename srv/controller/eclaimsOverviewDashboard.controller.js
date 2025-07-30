const Connection = require("../config/connection.class");
const ChrsJobInfoRepo = require("../repository/chrsJobInfo.repo");
const ChrsHrpInfoRepo = require("../repository/hrpInfo.repo");
const TaskInboxRepo = require("../repository/taskInbox.repo");
const CommonRepo = require("../repository/util.repo");
const ProcessConfigRepo = require("../repository/processConfig.repo");
const ApproverMatrixRepo = require("../repository/approverMatrix.repo");
const ProcessParticipantsRepo = require("../repository/processParticipant.repo");
const DashboardConfigRepo = require("../repository/dashboardConfig.repo");
const { ApplicationConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const CommonUtils = require("../util/commonUtil");
const ChrsUluFdluRepo = require("../repository/chrsUluFdlu.repo");
const TaskDelegationDetailsRepo = require("../repository/taskDelegation.repo");
const EclaimsHeaderDataRepo = require("../repository/eclaimsData.repo");
const moment = require("moment-timezone");
const { head } = require("lodash");
const UserUtil = require("../util/userUtil");
module.exports = {
    /**
     *
     * @param {object} request CAP Request Object
     * @param {oject} db CAP DB Object
     * @param {object} srv CAP DB Object
     * @returns {Promise<object>} Result of Updated Entries in JSON
     */
    createConnectionOverviewDashboard: function (request, db, srv) {
        const oConnection = new Connection(request, db, srv);
        return this.fetchDashBoardDetails(oConnection);
    },

    fetchDashBoardDetails: async function (request) {
        const tx = cds.tx();
        let configResponse = [];
        try {
            // Extract username using utility function
            const userName = UserUtil.extractUsername(request);
            const upperNusNetId = userName.toUpperCase();
            //fetch logged in user information

            let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);

            if (!userName) {
                throw new Error("User not found..!!");
            }

            const inputRequest = request.data.data;

            let chrsJobInfoList = await ChrsJobInfoRepo.fetchUserDetails(upperNusNetId);

            if (!chrsJobInfoList || Object.keys(chrsJobInfoList).length === 0) {
                chrsJobInfoList = await ChrsJobInfoRepo.retrieveExternalUserDetails(upperNusNetId);
            }

            if (!chrsJobInfoList || Object.keys(chrsJobInfoList).length === 0) {
                return {
                    isError: true,
                    message: ApplicationConstants.ECLAIMS_DASHBOARD_SYSTEM_REFRESH_ERROR,
                };
            }

            switch (inputRequest.PROCESS_CODE) {
                case ApplicationConstants.ECLAIMS_OVERALL_PROCESS:
                    return this.populateDashboardEclaims(chrsJobInfoList, inputRequest);
                case ApplicationConstants.CW_OVERALL_PROCESS:
                    return; // CWN dashboard implementation

                default:
                    return {
                        isError: true,
                        message: ApplicationConstants.INVALID_PROCESS_CODE,
                    };
            }
        } catch (error) {
            await tx.rollback();
            if (error instanceof ApplicationException) {
            } else if (error instanceof TypeError) {
                console.error("Type Error:", error.message);
            } else {
                console.error("General Error:", error.message);
            }
        }
        tx.commit();
        return configResponse;
    },
    populateDashboardEclaims: async function (chrsJobInfoList, inputRequest) {
        let oReturnObj = {};
        oReturnObj.error = false;
        oReturnObj.visible = {
            data: false,
            groups: false,
            quickLinks: false,
            claimRequestOverview: false,
            claimAssistantRequestOverview: false,
            taxBenRequestOverview: false,
            previousFeedback: false,
            uluDetails: false,
            fdluDetails: false,
            monthlyClaims: false,
            resultCalendar: false,
            taskInboxCount: false,
            usefullLinks: false,
            elligibleEclaims: false,
            hrpStaffDetailsDTO: false,
            delegationDetailsDto: false,
        };
        oReturnObj.userProfile = {};
        oReturnObj.userProfile.applications = [];
        // fetch primary account if there are more than one account.
        let chrsJobInfo = await this.fetchPrimaryaccountDetails(chrsJobInfoList);

        // fetch user role list
        let roleList = await this.fetchUserRoles(chrsJobInfo);

        // populate populateUserProfileData
        oReturnObj.userProfile.data = await this.populateUserProfileData(chrsJobInfo, oReturnObj);
        oReturnObj.visible.data = true;

        // populate User group in key value pair
        let aEclaimGroups = await this.populateGroups(inputRequest, chrsJobInfo, chrsJobInfoList);

        // populateUluFdlu for user
        aEclaimGroups = await this.populateUluFdlu(chrsJobInfo, inputRequest, aEclaimGroups);
        oReturnObj.userProfile.groups = aEclaimGroups;
        oReturnObj.visible.groups = false;

        // Populate Application quick links
        let aQuickLinks = await this.populateQuickLinks(oReturnObj, roleList, inputRequest);
        oReturnObj.userProfile.quickLinks = aQuickLinks.length ? aQuickLinks : [];
        oReturnObj.visible.quickLinks = true;

        // Populate claim Request details for claimant
        let claimantList = await this.populateRequestDetails(
            chrsJobInfo,
            ApplicationConstants.CLAIMANT,
            inputRequest.PROCESS_CODE
        );
        oReturnObj.userProfile.claimRequestOverview = claimantList.length ? claimantList : [];
        oReturnObj.visible.claimRequestOverview = true;

        const hasClaimAssistant = roleList
            .map(role => role.STAFF_USER_GRP)
            .includes(ApplicationConstants.CLAIM_ASSISTANT);

        // Populate claim Request details for claimant Assistant
        if (hasClaimAssistant) {
            let caList = await this.populateRequestDetails(
                chrsJobInfo,
                ApplicationConstants.CLAIM_ASSISTANT,
                inputRequest.PROCESS_CODE
            );
            oReturnObj.userProfile.claimAssistantRequestOverview = caList.length ? caList : [];
            oReturnObj.visible.claimAssistantRequestOverview = true;

            // For tax ben we are populating count card on UI
            let tbList = await this.populateTbRequestDetails(
                chrsJobInfo,
                ApplicationConstants.CLAIM_ASSISTANT,
                inputRequest.PROCESS_CODE
            );
            oReturnObj.userProfile.taxBenRequestOverview = tbList.length ? tbList : [];

            let taxBenCAList = await ApproverMatrixRepo.checkForUserGrpNProcess(
                ApplicationConstants.CLAIM_TYPE_105,
                chrsJobInfo.STF_NUMBER,
                ApplicationConstants.CLAIM_ASSISTANT
            );
            oReturnObj.visible.taxBenRequestOverview = taxBenCAList.length ? true : false;
        }
        // populate tables
        await this.populateCAAndDADetails(oReturnObj, chrsJobInfoList, inputRequest);

        // populate usefull links
        await this.populateUseFullLinks(oReturnObj, roleList, inputRequest.PROCESS_CODE);
        oReturnObj.visible.usefullLinks = true;

        // populating current time stamp
        await this.populateCurrentTimestamp(oReturnObj);

        //populate delegation details
        await this.populateDelegationDetails(oReturnObj, chrsJobInfo.STF_NUMBER, inputRequest.PROCESS_CODE);

        // let statusBreakdownList = await this.getTaskTileDetails(inputRequest,chrsJobInfo);
        oReturnObj.userProfile.taskInboxCount = []; //statusBreakdownList;
        oReturnObj.visible.taskInboxCount = true;

        return oReturnObj;
    },

    // getTaskTileDetails: async function (inputRequest,chrsJobInfo) {

    //     let taskInboxStatusList = DashboardConfigRepo.fetchHeaderDetails("TASK_INBOX_STATUS", inputRequest.PROCESS_CODE);

    // 	let statusBreakdownList = [];

    // 	let aCollectiveRoleList = [];
    // 	aCollectiveRoleList = await this.fetchUserRoles(chrsJobInfo);
    // 	roleList.addAll(await this.fetchCwUserRoles(chrsJobInfo));

    // 	for (let taskInbox in taskInboxStatusList) {
    // 		taskCount = 0;
    // 		switch (taskInbox.SEQUENCE) {
    // 		case 1:
    // 			taskCount = TaskInboxRepository.getActiveTaskCountByStaff(chrsJobInfo.STF_NUMBER,taskInbox.CONFIG_VALUE);
    // 			taskCount = retrievePendingTaskGroupCount(eclaimsDashBoardRequestDTO, roleList, taskInbox, taskCount);
    // 			break;
    // 		case 3:
    // 			// Task count for Self Assigned Tasks
    // 			taskCount = taskInboxRepository.getCompletedTaskCountByStaff(eclaimsDashBoardRequestDTO.getSTF_NUMBER(),
    // 					taskInbox.CONFIG_VALUE());
    // 			taskCount = retrieveGenericTaskGroupCount(eclaimsDashBoardRequestDTO, roleList, taskInbox, taskCount);

    // 			break;
    // 		case 2:
    // 			taskCount = taskInboxRepository.fetchTaskInboxDelegationDetails(
    // 					eclaimsDashBoardRequestDTO.getSTF_NUMBER(), taskInbox.getCONFIG_VALUE(), "N");
    // 			break;
    // 		}

    // 		statusBreakdownDTO = new StatusBreakdownDTO();
    // 		statusBreakdownDTO.setName(taskInbox.getCONFIG_KEY());
    // 		statusBreakdownDTO.setInfo(taskCount);
    // 		statusBreakdownDTO.setUrl(true);
    // 		statusBreakdownDTO.setKey(taskInbox.getCONFIG_DATA());
    // 		statusBreakdownDTO.setSemantic(ApplicationConstants.INBOX);
    // 		statusBreakdownDTO.setAction(ApplicationConstants.DISPLAY);
    // 		statusBreakdownDTO.setStartupparameters(ApplicationConstants.NAV_TO_DEFAULT);
    // 		statusBreakdownList.add(statusBreakdownDTO);
    // 	}
    // 	return statusBreakdownList;

    // },

    populateDelegationDetails: async function (oReturnObj, staffId, processCode) {
        let delegationDetailsList = [];
        let taskDelegationList = await TaskDelegationDetailsRepo.fetchProcessActiveDelegationDetails(
            processCode,
            staffId
        );
        for (let taskDelegationDetails of taskDelegationList) {
            taskDelegationDetails.DELEGATED_TO_NAME = ChrsJobInfoRepo.fetchName(taskDelegationDetails.DELEGATED_TO);
            taskDelegationDetails.DELEGATED_FROM_NAME = ChrsJobInfoRepo.fetchName(taskDelegationDetails.DELEGATED_FROM);
            taskDelegationDetails.PROCESS_TYPE_DESC = ProcessConfigRepo.fetchProcessTitleByPROCESS_CODE(
                taskDelegationDetails.PROCESS_TYPE
            );
            taskDelegationDetails.CHANGED_BY_NAME = ChrsJobInfoRepo.fetchName(taskDelegationDetails.MODIFIED_BY);
            taskDelegationDetails.DELIMIT_BTN_REQ = CommonUtils.equalsIgnoreCase(
                staffId,
                taskDelegationDetails.DELEGATED_FOR
            )
                ? ApplicationConstants.Y
                : ApplicationConstants.N;
            taskDelegationDetails.IS_DELETE =
                taskDelegationDetails.VALID_FROM > new Date() ? ApplicationConstants.Y : ApplicationConstants.N;

            delegationDetailsList.push(taskDelegationDetails);
            oReturnObj.visible.delegationDetailsDto = true;
        }

        oReturnObj.userProfile.delegationDetails = delegationDetailsList;
    },
    populateCurrentTimestamp: async function (oReturnObj) {
        const currentDate = moment().format("YYYY-MM-DD HH:mm");
        const utcDate = moment.tz(currentDate, "UTC").format("YYYY-MM-DD HH:mm");
        oReturnObj.userProfile.dataRefreshedAt = utcDate;
    },
    populateUseFullLinks: async function (oReturnObj, role, processCode) {
        let roleList = role;
        roleList.push({
            STAFF_USER_GRP: "ALL",
        });
        let dashboardConfigurationList = await DashboardConfigRepo.fetchStatusDetailsByRole(
            ApplicationConstants.USEFULLINKS,
            processCode,
            role,
            "STAFF_USER_GRP"
        );

        const distinctByKey = (list, keyExtractor) => {
            const seen = new Set();
            return list.filter(item => {
                const key = keyExtractor(item);
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        };

        let filteredDashboardConfigurationList = distinctByKey(dashboardConfigurationList, item => item.CONFIG_KEY);
        let usefullLinkList = [];
        for (let dashboardConfiguration of filteredDashboardConfigurationList) {
            let usefullLink = {};
            usefullLink.name = dashboardConfiguration.CONFIG_KEY;
            usefullLink.hyperLink = dashboardConfiguration.CONFIG_VALUE;
            usefullLink.url = true;
            usefullLinkList.push(usefullLink);
        }

        oReturnObj.userProfile.usefullLinks = usefullLinkList;
    },

    populateCAAndDADetails: async function (oReturnObj, chrsJobInfoList, inputRequest) {
        let approverMatrixList = [];
        let codeDetail = [];
        let eligibility = {};
        let eclaimsList = [];
        for (let chrsJobInfo of chrsJobInfoList) {
            let ulu = chrsJobInfo.ULU_C;
            let fdlu = chrsJobInfo.FDLU_C;
            let uluText = chrsJobInfo.ULU_T;
            let fdluText = chrsJobInfo.FDLU_T;
            if (
                CommonUtils.equalsIgnoreCase(chrsJobInfo.EMP_CAT_C, ApplicationConstants.PTT_CODE) ||
                CommonUtils.equalsIgnoreCase(chrsJobInfo.EMP_CAT_C, ApplicationConstants.CW_CODE) ||
                (CommonUtils.equalsIgnoreCase(chrsJobInfo.EMP_CAT_C, ApplicationConstants.OT_CODE) &&
                    CommonUtils.equalsIgnoreCase(chrsJobInfo.APPT_TRACK_C, ApplicationConstants.APP_TRACT_CODE))
            ) {
                codeDetail = await DashboardConfigRepo.fetchClaimCode(
                    chrsJobInfo.EMP_CAT_C,
                    inputRequest.PROCESS_CODE,
                    chrsJobInfo.STF_NUMBER
                );

                let configKeyList = [...new Set(codeDetail.map(item => item.CONFIG_KEY))];

                if (configKeyList.length) {
                    approverMatrixList = await ApproverMatrixRepo.fetchCAAndDADetails(ulu, fdlu, configKeyList);
                }

                if (!CommonUtils.isEmptyObject(approverMatrixList)) {
                    eligibility.empCategoryCode(codeDetail[0].CONFIG_KEY);
                    eligibility.empCategoryText(codeDetail[0].CONFIG_VALUE);

                    for (let ap of approverMatrixList) {
                        // fetch name
                        let name = await ChrsJobInfoRepo.fetchName(ap.STAFF_ID);
                        let eclaims = {};
                        let role = CommonUtils.equalsIgnoreCase(ap.STAFF_USER_GRP, ApplicationConstants.CLAIM_ASSISTANT)
                            ? ApplicationConstants.CA_ALIAS
                            : ApplicationConstants.DEPT_ADMIN_ALIAS;
                        eclaims.setRoleName(role);
                        eclaims.setUluCode(ulu);
                        eclaims.setUluText(uluText);
                        eclaims.setFdluCode(fdlu);
                        eclaims.setFdluText(fdluText);
                        eclaims.setName(name);
                        eclaims.setLogonID(ap.STAFF_NUSNET_ID);
                        eclaimsList.push(eclaims);
                    }
                    let uniqueUserList = [...new Set(eclaimsList)];

                    eligibility.eclaims = uniqueUserList;

                    oReturnObj.userProfile.elligible = eligibility;
                    oReturnObj.visible.elligible = true;
                }
            }
        }
    },
    populateTbRequestDetails: async function (chrsJobInfo, role, processCode) {
        let statusBreakdownDTOList = [];
        let totalCount = 0;
        let staffId = chrsJobInfo.STF_NUMBER;
        let statusHeaderList = await DashboardConfigRepo.fetchHeaderListByRole(
            ApplicationConstants.REQUEST_HEADER,
            role,
            processCode
        );
        for (let headerConfig of statusHeaderList) {
            let statusCodeList = [];
            let roleList = [];
            roleList.push(role);

            let statusList = await DashboardConfigRepo.fetchStatusDetailsByRole(
                headerConfig.CONFIG_KEY,
                processCode,
                role
            );
            statusList.forEach(statusCode => {
                statusCodeList.push({
                    STATUS_CODE: statusCode.CONFIG_VALUE,
                });
            });
            let count = 0;
            let sStatusCodeListToString = CommonUtils.convertListToString(statusCodeList, "STATUS_CODE");
            if (
                CommonUtils.equalsIgnoreCase("INPROCESS_REQUEST", headerConfig.CONFIG_KEY) ||
                CommonUtils.equalsIgnoreCase("COMPLETED_REQUEST", headerConfig.CONFIG_KEY)
            ) {
                count = await EclaimsHeaderDataRepo.fetchTbClaimStatusCountById(staffId, sStatusCodeListToString);
            } else {
                count = await EclaimsHeaderDataRepo.fetchTbClaimStatusCount(staffId, sStatusCodeListToString);
            }

            count = Array.isArray(count) ? count : [];
            totalCount = totalCount + count.length;
            let statusBreakdownDto = {};
            statusBreakdownDto.name = headerConfig.CONFIG_VALUE;
            statusBreakdownDto.info = count.length;
            statusBreakdownDto.url = true;
            statusBreakdownDto.key = headerConfig.CONFIG_DATA;
            statusBreakdownDto.semantic = ApplicationConstants.TBCLAIMS;
            statusBreakdownDto.action = ApplicationConstants.d_DISPLAY;
            statusBreakdownDto.startupparameters = ApplicationConstants.ROLE_CMASST;
            statusBreakdownDTOList.push(statusBreakdownDto);
        }
        return statusBreakdownDTOList;
    },

    populateRequestDetails: async function (chrsJobInfo, role, processCode) {
        let statusBreakdownDTOList = [];
        let totalCount = 0;
        let staffId = chrsJobInfo.STF_NUMBER;
        // let sRole = CommonUtils.convertListToString(role,"STAFF_USER_GRP");
        let statusHeaderList = await DashboardConfigRepo.fetchHeaderListByRole(
            ApplicationConstants.REQUEST_HEADER,
            role,
            processCode
        );
        for (let headerConfig of statusHeaderList) {
            let statusCodeList = [];
            // let roleList = [];
            // roleList.push(role);
            let statusList = await DashboardConfigRepo.fetchStatusDetailsByRole(
                headerConfig.CONFIG_KEY,
                processCode,
                role
            );
            statusList.forEach(statusCode => {
                statusCodeList.push(statusCode.CONFIG_VALUE);
            });
            let count = 0;
            if (ApplicationConstants.CLAIMANT === role) {
                if (
                    CommonUtils.equalsIgnoreCase("INPROCESS_REQUEST", headerConfig.CONFIG_KEY) ||
                    CommonUtils.equalsIgnoreCase("COMPLETED_REQUEST", headerConfig.CONFIG_KEY)
                ) {
                    count = await EclaimsHeaderDataRepo.fetchClaimStatusCountById(staffId, statusCodeList);
                } else {
                    count = await EclaimsHeaderDataRepo.fetchClaimStatusCount(staffId, statusCodeList);
                }
            } else {
                if (CommonUtils.equalsIgnoreCase("PENDING_REQUEST", headerConfig.CONFIG_KEY)) {
                    // Start from here
                    count = await EclaimsHeaderDataRepo.fetchPendingCAStatusCount(staffId, statusCodeList);
                } else if (CommonUtils.equalsIgnoreCase("DRAFT_REQUEST", headerConfig.CONFIG_KEY)) {
                    count = await EclaimsHeaderDataRepo.fetchCAStatusCountForDraft(staffId, statusCodeList);
                } else {
                    count = await EclaimsHeaderDataRepo.fetchCAStatusCount(staffId, statusCodeList);
                }
            }

            count = Array.isArray(count) ? count : [];

            totalCount = totalCount + count.length;
            let statusBreakdownDto = {};
            statusBreakdownDto.name = headerConfig.CONFIG_VALUE;
            statusBreakdownDto.info = count.length;
            statusBreakdownDto.url = true;
            statusBreakdownDto.key = headerConfig.CONFIG_DATA;
            statusBreakdownDto.semantic = ApplicationConstants.CLAIMREQUEST;
            statusBreakdownDto.action = ApplicationConstants.d_DISPLAY;

            if (CommonUtils.equalsIgnoreCase(ApplicationConstants.CLAIMANT, role)) {
                statusBreakdownDto.startupparameters = ApplicationConstants.ROLE_CLMNT;
            } else {
                statusBreakdownDto.startupparameters = ApplicationConstants.ROLE_CMASST;
            }

            statusBreakdownDTOList.push(statusBreakdownDto);
        }
        return statusBreakdownDTOList;
    },

    fetchPrimaryaccountDetails: async function (chrsJobInfoList) {
        if (chrsJobInfoList.length === 1) {
            return chrsJobInfoList[0];
        }
        let staffPrimaryObj = {};
        for (let chrsJobInfo of chrsJobInfoList) {
            if (chrsJobInfo.STF_NUMBER === chrsJobInfo.SF_STF_NUMBER) {
                staffPrimaryObj = chrsJobInfo;
                return staffPrimaryObj;
            }
        }
        return staffPrimaryObj;
    },
    fetchUserRoles: async function (chrsJobInfo) {
        // we will get approver, verifier, CA role from approver matrix table.
        let role = await ApproverMatrixRepo.fetchEclaimsRole(chrsJobInfo.STF_NUMBER);

        // Additional approvers role is fetched from ProcessParticipants table
        let appRoleList = await ProcessParticipantsRepo.fetchRole(chrsJobInfo.STF_NUMBER);
        for (let oAppRole of appRoleList) {
            role.push(oAppRole);
        }

        // fetch reporting manager for OT
        let jobInfoList = await ChrsJobInfoRepo.fetchRmRole(chrsJobInfo.STF_NUMBER);
        if (!CommonUtils.isEmptyObject(jobInfoList)) {
            role.push({
                STAFF_USER_GRP: ApplicationConstants.REPORTING_MGR,
            });
        }

        // role is still empty then add CLAIMANT as default role
        if (CommonUtils.isEmptyObject(role)) {
            role = [];
            role.push({ STAFF_USER_GRP: ApplicationConstants.CLAIMANT });
        }

        return [...new Set(role)];
    },
    fetchCwUserRoles: async function (chrsJobInfo) {
        // we will get approver, verifier, CA role from approver matrix table.
        let role = await ApproverMatrixRepo.fetchCWRoleForDashboard(chrsJobInfo.STF_NUMBER);

        //fetch RM
        let jobInfoList = await ChrsJobInfoRepo.fetchRmRole(chrsJobInfo.STF_NUMBER);
        if (!CommonUtils.isEmptyObject(jobInfoList)) {
            role.push(ApplicationConstants.CW_REPORTING_MGR);
        }

        //fetch Manager RM
        let rmJobInfoList = await ChrsJobInfoRepo.fetchRmsManagerJobInfo(chrsJobInfo.STF_NUMBER);
        if (!CommonUtils.isEmptyObject(rmJobInfoList)) {
            role.push(ApplicationConstants.CW_MANAGERS_MGR);
        }

        //fetch Manager RM
        let chrsHrpInfoList = await ChrsHrpInfoRepo.fetchHrpStaffDetails(chrsJobInfo.STF_NUMBER);
        if (!CommonUtils.isEmptyObject(chrsHrpInfoList)) {
            role.push(ApplicationConstants.CW_HRP);
        }

        // role is still empty then add CLAIMANT as default role
        if (CommonUtils.isEmptyObject(role)) {
            role = [];
            role.push(ApplicationConstants.CW_ESS);
        }

        return [...new Set(role)];
    },
    populateUserProfileData: async function (chrsJobInfo) {
        let oData = {};
        oData.staffId = chrsJobInfo.STF_NUMBER;
        oData.firstName = chrsJobInfo.FIRST_NM;
        oData.lastName = chrsJobInfo.LAST_NM;
        oData.workTitle = chrsJobInfo.WORK_TITLE;
        oData.nusnetId = chrsJobInfo.NUSNET_ID;

        // Invoke photo API and set photo value by adding the PHOTO_PREFIX
        // employeeTimeResponse = sFPhotoAPIService.fetchEmployeePhotoById(chrsJobInfo.STF_NUMBER);
        let photoUrl = null;
        oData.photo = `${ApplicationConstants.PHOTO_PREFIX}${photoUrl}`;
        return oData;
    },
    populateGroups: async function (inputRequest, chrsJobInfo, chrsJobInfoList) {
        let headerConfigList = await DashboardConfigRepo.fetchHeaderList(
            ApplicationConstants.HEADER,
            inputRequest.PROCESS_CODE
        );
        let staffId = null;
        let aGroups = [];
        for (let headerConfig of headerConfigList) {
            let oGroups = {};
            oGroups.title = headerConfig.CONFIG_VALUE;
            let dashboardConfigDetails = await DashboardConfigRepo.fetchHeaderDetails(
                headerConfig.CONFIG_KEY,
                inputRequest.PROCESS_CODE
            );
            if (CommonUtils.equalsIgnoreCase(ApplicationConstants.MANAGER_DATA, headerConfig.CONFIG_KEY)) {
                staffId = chrsJobInfo.RM_STF_N;
            } else {
                staffId = chrsJobInfo.STF_NUMBER;
            }

            let items = [];
            if (CommonUtils.equalsIgnoreCase(headerConfig.CONFIG_KEY, ApplicationConstants.PERSONAL_INFO)) {
                let uluFdluList = [];
                let oItems = {
                    label: "Employee Number",
                    value: chrsJobInfo.STF_NUMBER,
                };
                items.push(oItems);
                chrsJobInfoList.forEach(info => {
                    const uluFdluBuilder = `${info.ULU_T}(${info.ULU_C}) / ${info.FDLU_T}(${info.FDLU_C})`;
                    uluFdluList.push(uluFdluBuilder + ApplicationConstants.NEW_LINE);
                });
                const uniqueValues = [...new Set(uluFdluList)]; // Remove duplicates
                const uluFdlu = uniqueValues.reduce((acc, e) => acc + e, ""); // Concatenate the values

                oItems = {
                    label: "ULU / FDLU",
                    value: uluFdlu,
                };
                items.push(oItems);
            } else {
                let list = await this.populateJobInfoDetails(dashboardConfigDetails, chrsJobInfo.STF_NUMBER);
                list.forEach(oList => {
                    let oItems = {
                        label: oList.CONFIG_KEY,
                        value: oList,
                    };
                    items.push(oItems);
                });
            }
            oGroups.items = items;
            aGroups.push(oGroups);
        }

        return aGroups;
    },
    populateJobInfoDetails: async function (dashboardConfigDetails, staffId) {
        let sColumns = "";
        for (let dbConfig of dashboardConfigDetails) {
            if (!CommonUtils.isEmpty(dbConfig.CONFIG_KEY)) {
                sColumns += dbConfig.CONFIG_KEY + ",";
            }
        }
        sColumns = sColumns.substring(0, sColumns.length - 1);
        let rsList = await ChrsJobInfoRepo.fetchJobInfoDetailsForDashboard(sColumns, staffId);
        rsList = rsList && rsList.length ? rsList : [];
        return rsList;
    },
    populateUluFdlu: async function (chrsJobInfo, inputRequest, aEclaimGroups) {
        let staffId = chrsJobInfo.STF_NUMBER;
        let headerConfigList = await DashboardConfigRepo.fetchHeaderList(
            ApplicationConstants.ROLE,
            inputRequest.PROCESS_CODE
        );

        for (let headerConfig of headerConfigList) {
            let uluFdlu = await this.populateApproverDetails(staffId, headerConfig.CONFIG_KEY);
            if (CommonUtils.isNotBlank(uluFdlu)) {
                let aItems = [];
                let caItems = {};
                let oGroups = {};
                caItems.label = ApplicationConstants.ULU_FDLU;
                caItems.value = uluFdlu;
                aItems.push(caItems);
                oGroups.title = headerConfig.CONFIG_VALUE;
                oGroups.items = aItems;
                aEclaimGroups.push(oGroups);
            }
        }
        return aEclaimGroups;
    },
    populateApproverDetails: async function (staffId, role) {
        let uluFdlu = "";
        let caUluAndFdluList = await ChrsUluFdluRepo.fetchUluFdluDetails(staffId, role);
        caUluAndFdluList.forEach(userDetailsDto => {
            uluFdlu += userDetailsDto.ULUFDLU + "\n"; // '\n' is for the newline character
        });
        return uluFdlu;
    },
    populateQuickLinks: async function (oReturnObj, role, inputRequest) {
        let qLinksResponse = [];
        // let sRole = CommonUtils.convertListToString(role,"STAFF_USER_GRP");
        let applicationList = await DashboardConfigRepo.fetchStatusDetailsByRoles(
            ApplicationConstants.QUICK_LINKS,
            inputRequest.PROCESS_CODE,
            role,
            "STAFF_USER_GRP"
        );
        let applicationDetailsList = [];
        let appnMap = {};
        for (let key of applicationList) {
            applicationDetailsList = await DashboardConfigRepo.fetchHeaderDetails(
                key.CONFIG_KEY,
                inputRequest.PROCESS_CODE
            );
            appnMap = {};
            let applicationsDTO = {
                value: "",
                title: "",
            };
            applicationDetailsList.forEach(applicationDetails => {
                appnMap[applicationDetails.CONFIG_KEY] = applicationDetails.CONFIG_VALUE;
                appnMap[ApplicationConstants.URL] = ApplicationConstants.TRUE;

                if (applicationDetails.CONFIG_KEY === "semantic") {
                    applicationsDTO.value = applicationDetails.CONFIG_VALUE;
                } else if (applicationDetails.CONFIG_KEY === "name") {
                    applicationsDTO.title = applicationDetails.CONFIG_VALUE;
                }
            });
            oReturnObj.userProfile.applications.push(applicationsDTO);
            qLinksResponse.push(appnMap);
        }
        return qLinksResponse;
    },
};
