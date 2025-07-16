const CommonUtils = require("../util/commonUtil");


async function ecpWbsValidate(request) {
    try {
        // const tx = cds.tx(request);
        const user = request.user.id;
        // const userName = user.split('@')[0];
        // const userName = "PTT_CA1";
        // const upperNusNetId = userName.toUpperCase();
        // let loggedInUserDetails = await CommonRepo.fetchLoggedInUser(upperNusNetId);
        // if (!userName) {
            // throw new Error("User not found..!!");
        // }
        let oWbsPaylaod = request.data.data;

        
        
    } catch (error) {
        // Logger.debug("route can not bef found for host:", tenantHost);
        return;
    }
}


module.exports = { ecpWbsValidate };