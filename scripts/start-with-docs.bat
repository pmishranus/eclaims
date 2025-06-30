@echo off
REM Eclaims Service Startup Script with Documentation
REM This script builds the project and starts the service with Swagger UI

echo 🚀 Starting Eclaims Service with API Documentation...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules not found. Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully
)

REM Build the project
echo [INFO] Building the project...
cds build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [SUCCESS] Project built successfully

REM Check if OpenAPI spec was generated
if not exist "docs\EclaimsService.openapi3.json" (
    echo [WARNING] OpenAPI specification not found. It will be generated on first run.
)

REM Start the service
echo [INFO] Starting the service...
echo [INFO] Service will be available at:
echo   🏠 Landing Page: http://localhost:4004/
echo   📖 Swagger UI: http://localhost:4004/api-docs
echo   📄 OpenAPI Spec: http://localhost:4004/api-docs.json
echo   🔗 API Base: http://localhost:4004/eclaims
echo.
echo [INFO] Press Ctrl+C to stop the service
echo.

REM Start the service
npm start 