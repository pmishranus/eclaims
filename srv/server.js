const cds = require("@sap/cds");
// const cov2ap = require("@sap/cds-odata-v2-adapter-proxy"); // Removed deprecated adapter
const cov2ap = require("@cap-js-community/odata-v2-adapter");
const xsenv = require("@sap/xsenv");
const xssec = require("@sap/xssec");
const passport = require("passport");
const JWTStrategy = require("@sap/xssec").JWTStrategy;
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const fs = require("fs");
const express = require("express");
const cds = require("@sap/cds");

const multer = require("multer");

cds.on("bootstrap", app => {
    app.use(cov2ap()); // Removed deprecated adapter
    xsenv.loadEnv();
    passport.use(new JWTStrategy(xsenv.getServices({ uaa: { tag: "xsuaa" } }).uaa));
    app.use(passport.initialize());
    app.use(passport.authenticate("JWT", { session: false }));

    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, '../public')));

    // Route for API documentation landing page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/api-docs.html'));
    });

    // Swagger UI Configuration
    try {
        // Load the OpenAPI specification
        const openApiSpecPath = path.join(__dirname, "../docs/EclaimsService.openapi3.json");
        if (fs.existsSync(openApiSpecPath)) {
            const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf8'));

            // Enhance the OpenAPI specification
            const enhancedSpec = {
                ...openApiSpec,
                info: {
                    title: "Eclaims Service API",
                    description: "Comprehensive API for Eclaims management system. This service provides endpoints for staff lookup, claim management, and administrative functions.",
                    version: "1.0.0",
                    contact: {
                        name: "Eclaims Development Team",
                        email: "eclaims-support@nus.edu.sg"
                    },
                    license: {
                        name: "Internal Use Only",
                        url: "https://nus.edu.sg"
                    }
                },
                servers: [
                    {
                        url: "/eclaims",
                        description: "Eclaims Service API"
                    }
                ],
                tags: [
                    {
                        name: "Staff Management",
                        description: "Operations related to staff lookup and information"
                    },
                    {
                        name: "Claims Management",
                        description: "Operations related to claim processing and management"
                    },
                    {
                        name: "Dashboard",
                        description: "Operations related to dashboard and overview data"
                    },
                    {
                        name: "Validation",
                        description: "Operations related to data validation"
                    },
                    {
                        name: "Service Operations",
                        description: "Core service operations and functions"
                    }
                ],
                components: {
                    ...openApiSpec.components,
                    securitySchemes: {
                        bearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT",
                            description: "JWT token for authentication"
                        }
                    }
                },
                security: [
                    {
                        bearerAuth: []
                    }
                ]
            };

            // Serve Swagger UI
            app.use('/api-docs', swaggerUi.serve);
            app.get('/api-docs', swaggerUi.setup(enhancedSpec, {
                explorer: true,
                customCss: '.swagger-ui .topbar { display: none }',
                customSiteTitle: "Eclaims Service API Documentation",
                customfavIcon: "/favicon.ico",
                swaggerOptions: {
                    docExpansion: 'list',
                    filter: true,
                    showRequestHeaders: true,
                    tryItOutEnabled: true,
                    requestInterceptor: (req) => {
                        // Add authorization header for try-it-out functionality
                        if (req.headers && req.headers.authorization) {
                            req.headers['Authorization'] = req.headers.authorization;
                        }
                        return req;
                    }
                }
            }));

            // Serve the raw OpenAPI specification
            app.get('/api-docs.json', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(enhancedSpec);
            });

            console.log('✅ Swagger UI is available at /api-docs');
            console.log('📄 OpenAPI specification is available at /api-docs.json');
            console.log('🏠 API Documentation landing page is available at /');
        } else {
            console.warn('⚠️  OpenAPI specification file not found at:', openApiSpecPath);
        }
    } catch (error) {
        console.error('❌ Error setting up Swagger UI:', error.message);
    }

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
