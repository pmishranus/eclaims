const cds = require("@sap/cds");
const eclaimsOverviewDashboardCtrl = require("./controller/eclaimsOverviewDashboard.controller");
const singleRequestCtrl = require("./controller/singleRequest.controller");
const fetchClaimTypesCtrl = require("./controller/fetchClaimTypes.controller");
const fetchUluFdluCtrl = require("./controller/fetchUluFdlu.controller");

class EclaimsService extends cds.ApplicationService {
  init() {
    this.on("userInfo", (req) => {
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

    this.on("eclaimsOverviewDashboard", async (request) => {
      return await eclaimsOverviewDashboardCtrl.fetchDashBoardDetails(request);
    });

    this.on("fetchClaimTypes", async (request) => {
      return await fetchClaimTypesCtrl.fetchClaimTypes(request);
    });

    this.on("fetchUluFdlu", async (request) => {
      return await fetchUluFdluCtrl.fetchUluFdlu(request);
    });
    
    
  
    this.on("singleRequest", async (request) => {
      return await singleRequestCtrl.postClaims(request);
    });
    
  
    return super.init()
  } 
}

module.exports = EclaimsService;
