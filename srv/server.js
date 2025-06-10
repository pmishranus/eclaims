const cds = require("@sap/cds");
const cov2ap = require("@sap/cds-odata-v2-adapter-proxy");
const xsenv = require("@sap/xsenv");
const xssec = require("@sap/xssec");
const passport = require("passport");
const JWTStrategy = require("@sap/xssec").JWTStrategy;

const multer = require("multer");
const path = require("path");

cds.on("bootstrap", app => {
    app.use(cov2ap());
    xsenv.loadEnv();
    passport.use(new JWTStrategy(xsenv.getServices({ uaa: { tag: "xsuaa" } }).uaa));
    app.use(passport.initialize());
    app.use(passport.authenticate("JWT", { session: false }));

    // // Configure Multer for file uploads
    // const upload = multer({ dest: 'uploads/' });

    // // Middleware to handle multipart/form-data
    // app.post('/approvermatrix/matrixReqUploads', upload.single('matrixFile'), async (req, res, next) => {
    //   const file = req.file;
    //   const { requestorGrp, ulu, fdlu, processCode, noOfHeaderRows } = req.body;

    //   // Call CAPM action with req.data
    //   const srv = await cds.connect.to('ApproverMatrix');
    //   try {
    //     const result = await srv.tx(req).run(
    //       srv.actions.matrixReqUpload({
    //         matrixFile: file,
    //         requestorGrp,
    //         ulu,
    //         fdlu,
    //         processCode,
    //         noOfHeaderRows
    //       })
    //     );
    //     res.status(200).json(result);
    //   } catch (error) {
    //     next(error);
    //   }
    // });
});

module.exports = cds.server;
