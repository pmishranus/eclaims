#!/bin/bash

# Eclaims Service Startup Script with Documentation
# This script builds the project and starts the service with Swagger UI

echo "🚀 Starting Eclaims Service with API Documentation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed successfully"
fi

# Build the project
print_status "Building the project..."
cds build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi
print_success "Project built successfully"

# Check if OpenAPI spec was generated
if [ ! -f "docs/EclaimsService.openapi3.json" ]; then
    print_warning "OpenAPI specification not found. It will be generated on first run."
fi

# Start the service
print_status "Starting the service..."
print_status "Service will be available at:"
echo -e "  ${GREEN}🏠 Landing Page:${NC} http://localhost:4004/"
echo -e "  ${GREEN}📖 Swagger UI:${NC} http://localhost:4004/api-docs"
echo -e "  ${GREEN}📄 OpenAPI Spec:${NC} http://localhost:4004/api-docs.json"
echo -e "  ${GREEN}🔗 API Base:${NC} http://localhost:4004/eclaims"
echo ""
print_status "Press Ctrl+C to stop the service"
echo ""

# Start the service
npm start 