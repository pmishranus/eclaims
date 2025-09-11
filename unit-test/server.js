const cds = require("@sap/cds");
const { serverStart , serverStop }= require('express-mock-server');
var sources = [];
// [
//     require('./mock/eclaims.js')
// ];
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
chai.should();

serverStart(sources,{
     port: 8080
})

const { GET, POST , expect , axios , DELETE  , PATCH } = cds.test("serve",'--profile' ,'test','--with-mocks' ); 

const auth = {
    auth: {
        username: 'master',
        password: '-skipped-'
    }
};

module.exports = {
    GET, POST , expect , axios ,chai , auth , DELETE , PATCH
}

cds.on("shutdown",()=>{
    serverStop();
})