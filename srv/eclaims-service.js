const cds = require("@sap/cds");
const eclaimsOverviewDashboardCtrl = require("./controller/eclaimsOverviewDashboard.controller");
const singleRequestCtrl = require("./controller/singleRequest.controller");
const draftEclaimRequestCtrl = require("./controller/fetchDraftEclaimRequest.controller")
const fetchClaimTypesCtrl = require("./controller/fetchClaimTypes.controller");
const rateTypesCtrl = require("./controller/rateTypes.controller");
const caStaffCtrl = require("./controller/caStaffLookup.controller");
const claimantStaffInfoCtrl = require("./controller/claimantStaffInfo.controller");
const fetchWBSCtrl = require("./controller/fetchWBS.controller");
const validateEclaimsCtrl = require("./controller/validateEclaims.controller");
const fetchUluFdluCtrl = require("./controller/fetchUluFdlu.controller");
const ecpWbsValidateCtrl = require("./controller/ecpWbsValidateCtrl.controller");

class EclaimsService extends cds.ApplicationService {
    init() {
        this.on("userInfo", req => {
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

        this.on("eclaimsOverviewDashboard", async request => {
            return await eclaimsOverviewDashboardCtrl.fetchDashBoardDetails(request);
        });

        this.on("fetchClaimTypes", async request => {
            return fetchClaimTypesCtrl.fetchClaimTypes(request);
        });

        this.on("fetchUluFdlu", async request => {
            return await fetchUluFdluCtrl.fetchUluFdlu(request);
        });

        this.on("rateTypes", async request => {
            return await rateTypesCtrl.fetchRateTypes(request);
        });

        this.on("caStaffLookup", async request => {
            return await caStaffCtrl.fetchCaStaffLookup(request);
        });

        this.on("draftEclaimData", async request => {
            return await draftEclaimRequestCtrl.fetchDraftEclaimRequest(request);
        });

        this.on("fetchWBS", async request => {
            return await fetchWBSCtrl.fetchWBS(request);
        })

        this.on("validateEclaims", async request => {
            return await validateEclaimsCtrl.fetchValidateEclaims(request);
        })

        this.on("claimantStaffInfo", async request => {
            return await claimantStaffInfoCtrl.fetchClaimantStaffInfo(request);
        });

        this.on("singleRequest", async request => {
            // Extract Authorization header (if present)
            // const token = request.headers && request.headers.authorization ? request.headers.authorization : null;
            let response = {
                error: false,
                message: null,
                claimDataResponse: null,
                ignoreError: false
            };
            try {
                // Call the main business logic (postClaims or equivalent)
                // The controller expects the request object, which contains data and user info
                const claimDataResponse = await singleRequestCtrl.postClaims(
                    request
                   
                );
                response.claimDataResponse = claimDataResponse;
                response.error = claimDataResponse && claimDataResponse.error ? true : false;
                response.message = claimDataResponse && claimDataResponse.message ? claimDataResponse.message : null;
            } catch (err) {
                // Special handling for IGNORE_REQUEST
                if (err && err.message && err.message === "IGNORE_REQUEST") {
                    response.error = true;
                    response.ignoreError = true;
                    response.message = err.message;
                } else {
                    response.error = true;
                    response.message = (err && err.message) ? err.message : "An unexpected error occurred.";
                }
            }
            // Optionally set custom headers here if needed (CAP allows this via request.reply)
            return response;
        });

        this.on("ecpWbsValidate", async request => {
            try {
                return await ecpWbsValidateCtrl.ecpWbsValidate(request);
            } catch (err) {
                return { error: true, message: err.message || "Failed to fetch WBS info" };
            }
        });

        return super.init();
    }
}

module.exports = EclaimsService;
