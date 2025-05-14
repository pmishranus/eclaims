const cds = require("@sap/cds");
const eclaimsOverviewDashboardCtrl = require("./controller/eclaimsOverviewDashboard.controller");
const singleRequestCtrl = require("./controller/singleRequest.controller");

module.exports = cds.service.impl(async (srv) => {
  const db = await cds.connect.to("db");

  srv.on("userInfo", (req) => {
    let results = {};
    results.user = req.user.id;
    if (req.user.hasOwnProperty("locale")) {
      results.locale = req.user.locale;
    }
    results.scopes = {};
    results.scopes.identified = req.user.is("identified-user");
    results.scopes.authenticated = req.user.is("authenticated-user");
    results.scopes.Viewer = req.user.is("Viewer");
    // let results = {
    //     "name" : "Eclaims"
    // }
    return results;
  });

  srv.on("eclaimsOverviewDashboard", async (request) => {
    return await eclaimsOverviewDashboardCtrl.createConnectionOverviewDashboard(request, db, srv);
  });

  srv.on("dummy", async(request) => {
    return {
      "data": {
        "error": false,
        "visible": {
          "data": true,
          "groups": false,
          "quickLinks": true,
          "claimRequestOverview": true,
          "claimAssistantRequestOverview": true,
          "taxBenRequestOverview": true,
          "previousFeedback": false,
          "uluDetails": false,
          "fdluDetails": false,
          "monthlyClaims": false,
          "resultCalendar": false,
          "taskInboxCount": true,
          "usefullLinks": true,
          "elligibleEclaims": false,
          "hrpStaffDetailsDTO": false,
          "delegationDetailsDto": false
        },
        "userProfile": {
          "applications": [
            {
              "value": "Under Eclaims",
              "title": "Approval Matrix"
            },
            {
              "value": "claimrequest",
              "title": "eClaim Request"
            },
            {
              "value": "casub",
              "title": "eClaims Request"
            },
            {
              "value": "cw_detailedreport",
              "title": "Contingent Workforce"
            },
            {
              "value": "delegationreport",
              "title": "Manage Delegation"
            },
            {
              "value": "inbox",
              "title": "Task Inbox"
            },
            {
              "value": "ot_ea_detailedreport",
              "title": "Overtime(EA)"
            },
            {
              "value": "ot_nonea_detailedreport",
              "title": "Overtime(Non-EA)"
            },
            {
              "value": "claimconsreport",
              "title": "Part-Time Teaching"
            },
            {
              "value": "pttdetailed",
              "title": "Part-Time Teaching"
            },
            {
              "value": "tbclaims",
              "title": "Taxable Benefit"
            },
            {
              "value": "tbdetailedreport",
              "title": "Taxable Benefit"
            }
          ],
          "data": {
            "staffId": "81535",
            "firstName": "Diane",
            "lastName": "Nathan",
            "workTitle": "Management Assistant Officer",
            "nusnetId": "PTT_CA1",
            "photo": "data:image/png;base64,null"
          },
          "groups": [
            {
              "title": "Personal Information",
              "items": [
                {
                  "label": "Employee Number",
                  "value": "81535"
                },
                {
                  "label": "ULU / FDLU",
                  "value": "Office of Campus Amenities(0100008800) / Retail And Dining Services(0000880002)\n\nEngineering(0260026100) / Civil And Environmental Engineering(0003020005)\n\n"
                }
              ]
            },
            {
              "title": "Manager Details",
              "items": [
                {
                  "value": {
                    "NUSNET_ID": "PTT_CA1",
                    "PREF_NM": ""
                  }
                },
                {
                  "value": {
                    "NUSNET_ID": "PTT_CA1",
                    "PREF_NM": ""
                  }
                }
              ]
            },
            {
              "title": "Verifier",
              "items": [
                {
                  "label": "ULU / FDLU",
                  "value": "College of Design and Engineering(0261046100) / Biomedical Engineering(0004680008)\n"
                }
              ]
            },
            {
              "title": "Claim Assistant",
              "items": [
                {
                  "label": "ULU / FDLU",
                  "value": "College of Design and Engineering(0261046100) / Electrical and Computer Engineering(0004630003)\nNUS Centre for the Arts(0100037500) / NUS Centre for the Arts(0003750000)\nArts & Social Sciences(0210010100) / English Language & Literature(0001030006)\nCtr for English Language Communication(0500037300) / Ctr for English Language Communication(0003730001)\nOffice of University Communications(0100004000) / Digital Communications(0000400005)\n"
                }
              ]
            }
          ],
          "quickLinks": [
            {
              "name": "Approval Matrix",
              "url": "true",
              "info": "Dept. Admin",
              "icon": "sap-icon://visits",
              "semantic": "approvermatrix",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            },
            {
              "name": "eClaim Request",
              "url": "true",
              "info": "Claimant Submission",
              "icon": "sap-icon://create-entry-time",
              "semantic": "claimrequest",
              "action": "display",
              "relativePath": null,
              "startupParameter": "CLMNT"
            },
            {
              "name": "eClaims Request",
              "url": "true",
              "info": "CA Submission",
              "icon": "sap-icon://Fiori4/F0507",
              "semantic": "casub",
              "action": "Display",
              "relativePath": null,
              "startupParameter": "CMASST"
            },
            {
              "name": "Contingent Workforce",
              "url": "true",
              "info": "Detailed Report",
              "icon": "sap-icon://Fiori5/F0708",
              "semantic": "cw_detailedreport",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            },
            {
              "name": "Manage Delegation",
              "url": "true",
              "info": "Maintain Delegation",
              "icon": "sap-icon://Fiori5/F0708",
              "semantic": "delegationreport",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            },
            {
              "name": "Task Inbox",
              "url": "true",
              "info": "Access Pending Tasks",
              "icon": "sap-icon://inbox",
              "semantic": "inbox",
              "action": "Display",
              "relativePath": null,
              "startupParameter": "default"
            },
            {
              "name": "Overtime(EA)",
              "url": "true",
              "info": "Detailed Report",
              "icon": "sap-icon://Fiori5/F0708",
              "semantic": "ot_ea_detailedreport",
              "action": "Display",
              "relativePath": null
            },
            {
              "name": "Overtime(Non-EA)",
              "url": "true",
              "info": "Detailed Report",
              "icon": "sap-icon://Fiori5/F0708",
              "semantic": "ot_nonea_detailedreport",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            },
            {
              "name": "Part-Time Teaching",
              "url": "true",
              "info": "Consolidated Report",
              "icon": "sap-icon://Fiori5/F0708",
              "semantic": "claimconsreport",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            },
            {
              "name": "Part-Time Teaching",
              "url": "true",
              "info": "Detailed Report",
              "icon": "sap-icon://Fiori2/F0021",
              "semantic": "pttdetailed",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            },
            {
              "name": "Taxable Benefit",
              "url": "true",
              "info": "Taxable Benefit",
              "icon": "sap-icon://Fiori5/F0708",
              "semantic": "tbclaims",
              "action": "display",
              "relativePath": null,
              "startupParameter": "CMASST"
            },
            {
              "name": "Taxable Benefit",
              "url": "true",
              "info": "Detailed Report",
              "icon": "sap-icon://Fiori2/F0021",
              "semantic": "tbdetailedreport",
              "action": "Display",
              "relativePath": null,
              "startupParameter": null
            }
          ],
          "claimRequestOverview": [
            {
              "name": "Draft",
              "info": 58,
              "url": true,
              "key": "Draft",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CLMNT"
            },
            {
              "name": "Rejected",
              "info": 0,
              "url": true,
              "key": "RejReq",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CLMNT"
            },
            {
              "name": "In Process",
              "info": 0,
              "url": true,
              "key": "Process",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CLMNT"
            },
            {
              "name": "Completed",
              "info": 0,
              "url": true,
              "key": "Post",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CLMNT"
            }
          ],
          "claimAssistantRequestOverview": [
            {
              "name": "Draft",
              "info": 0,
              "url": true,
              "key": "Draft",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "Pending Request",
              "info": 0,
              "url": true,
              "key": "PendReq",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "Rejected",
              "info": 0,
              "url": true,
              "key": "RejReq",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "In Process",
              "info": 0,
              "url": true,
              "key": "Process",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "Completed",
              "info": 0,
              "url": true,
              "key": "Post",
              "semantic": "claimrequest",
              "action": "display",
              "startupparameters": "CMASST"
            }
          ],
          "taxBenRequestOverview": [
            {
              "name": "Draft",
              "info": 17,
              "url": true,
              "key": "Draft",
              "semantic": "tbclaims",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "Pending Request",
              "info": 0,
              "url": true,
              "key": "PendReq",
              "semantic": "tbclaims",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "Rejected",
              "info": 9,
              "url": true,
              "key": "RejReq",
              "semantic": "tbclaims",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "In Process",
              "info": 7,
              "url": true,
              "key": "Process",
              "semantic": "tbclaims",
              "action": "display",
              "startupparameters": "CMASST"
            },
            {
              "name": "Completed",
              "info": 7,
              "url": true,
              "key": "Post",
              "semantic": "tbclaims",
              "action": "display",
              "startupparameters": "CMASST"
            }
          ],
          "usefullLinks": [
            {
              "name": "Part-Time Teaching User Guides",
              "hyperLink": "https://nusu.sharepoint.com/sites/ofn/userguides/Payroll eClaims/Forms/AllItems.aspx?id=/sites/ofn/userguides/Payroll eClaims/Part-time teaching&viewid=a56ebf4e-7e34-47ec-a67e-f511cd50bf3c",
              "url": true
            },
            {
              "name": "Part-Time Teaching FAQs",
              "hyperLink": "https://nusu.sharepoint.com/:b:/r/sites/ofn/userguides/Payroll eClaims/Part-time teaching/PTT eClaims FAQs_v1.0.pdf",
              "url": true
            },
            {
              "name": "Overtime (EA and Non EA) User Guides",
              "hyperLink": "https://nusu.sharepoint.com/:f:/r/sites/ofn/userguides/Payroll%20eClaims/Overtime%20(EA)%20and%20Overtime%20(Non%20EA)",
              "url": true
            },
            {
              "name": "Overtime (EA and Non EA) FAQs",
              "hyperLink": "https://nusu.sharepoint.com/:b:/r/sites/ofn/userguides/Payroll eClaims/Overtime (EA) and Overtime (Non EA)/Overtime EA and Non EA eClaims FAQs_v1.0.pdf",
              "url": true
            },
            {
              "name": "Department Admin Nomination Form",
              "hyperLink": "https://nus.cherwellondemand.com/CherwellPortal/NUS/Command/OneStep.LaunchOneStep?%20Scope=Global&ScopeOwner=%28None%29&Owner=Case%20Service&Name=Eclaim%20Dept%20Admin%20Creation%20Cessation",
              "url": true
            },
            {
              "name": "Contingent Workforce User Guides",
              "hyperLink": "https://nusu.sharepoint.com/:f:/r/sites/ofn/userguides/Payroll%20eClaims/Contingent%20Workforce",
              "url": true
            },
            {
              "name": "Contingent Workforce FAQs",
              "hyperLink": "https://nusu.sharepoint.com/:b:/r/sites/ofn/userguides/Payroll%20eClaims/Contingent%20Workforce/CW%20eClaims%20FAQs.pdf",
              "url": true
            },
            {
              "name": "Taxable Benefit User Guides",
              "hyperLink": "https://nusu.sharepoint.com/:f:/s/ofn/userguides/EnsM8G2P-1NIjuznk0Q72dkBOzINsgBXWaXnZHxsEhu9vQ?e=UU987g",
              "url": true
            },
            {
              "name": "Role Matrix Upload File",
              "hyperLink": "https://nusu.sharepoint.com/:x:/r/sites/ofn/userguides/Payroll eClaims/Part-time teaching/01 Department Administrator/Approval Matrix Upload template.xlsx",
              "url": true
            },
            {
              "name": "Contact Us",
              "hyperLink": "https://nusu.sharepoint.com/sites/ofn/userguides/SitePages/Payroll%20eClaims.aspx",
              "url": true
            },
            {
              "name": "PTT Claim Submission Mass Upload File",
              "hyperLink": "https://nusu.sharepoint.com/:x:/r/sites/ofn/userguides/Payroll eClaims/Part-time teaching/03 Claim Assistant/PTT Claims Upload template.xlsx",
              "url": true
            },
            {
              "name": "OT Claim Submission Mass Upload File",
              "hyperLink": "https://nusu.sharepoint.com/:x:/r/sites/ofn/userguides/Payroll eClaims/Part-time teaching/03 Claim Assistant/PTT Claims Upload template.xlsx",
              "url": true
            },
            {
              "name": "CW Claim Submission Mass Upload File",
              "hyperLink": "https://nusu.sharepoint.com/:x:/r/sites/ofn/userguides/Payroll eClaims/Contingent Workforce/03 Claim Assistant/CW Claims Submission Mass Upload file.xlsx",
              "url": true
            },
            {
              "name": "Tax Benefit Claim Submission Mass Upload File",
              "hyperLink": "https://nusu.sharepoint.com/:x:/r/sites/ofn/userguides/Payroll eClaims/Taxable Benefit/01 Claim Assistant/CA Taxable Benefit Upload Template.xlsx",
              "url": true
            }
          ],
          "dataRefreshedAt": "2025-04-17 04:32",
          "delegationDetails": [],
          "taskInboxCount": []
        }
      },
      "statusCode": 200
    }
  });

  srv.on("singleRequest", async (request) => {
    return await singleRequestCtrl.postClaims(request, db, srv);
  });
  


  
});
