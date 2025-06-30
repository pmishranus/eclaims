# Swagger UI Guide for Eclaims Service API

## 🚀 Overview

The Eclaims Service now includes comprehensive API documentation with Swagger UI, making it easy to explore, test, and understand all available endpoints.

## 📍 Access Points

### 1. **API Documentation Landing Page**
- **URL**: `http://localhost:4004/` (or your server URL)
- **Description**: Beautiful landing page with links to all documentation resources
- **Features**: 
  - Interactive cards for easy navigation
  - API status monitoring
  - Feature highlights
  - Responsive design

### 2. **Interactive Swagger UI**
- **URL**: `http://localhost:4004/api-docs`
- **Description**: Full-featured API documentation and testing interface
- **Features**:
  - Interactive API testing
  - Request/response schemas
  - Parameter validation
  - Authentication support
  - Try-it-out functionality

### 3. **OpenAPI Specification**
- **URL**: `http://localhost:4004/api-docs.json`
- **Description**: Raw OpenAPI 3.0 specification in JSON format
- **Use Cases**:
  - Code generation
  - API client development
  - Integration with other tools
  - Import into other documentation tools

## 🔧 Getting Started

### Prerequisites
1. Ensure your eclaims service is running
2. Have proper authentication credentials (JWT token)
3. Modern web browser (Chrome, Firefox, Safari, Edge)

### Step-by-Step Guide

#### 1. Access the Documentation
```bash
# Start your service
npm start

# Open in browser
http://localhost:4004/
```

#### 2. Navigate to Swagger UI
- Click on "Open Swagger UI" card from the landing page
- Or directly navigate to `http://localhost:4004/api-docs`

#### 3. Authenticate (if required)
- Click the "Authorize" button at the top of the Swagger UI
- Enter your JWT token in the format: `Bearer <your-token>`
- Click "Authorize"

#### 4. Explore Endpoints
- Browse through different endpoint categories
- Expand endpoints to see details
- View request/response schemas
- Read parameter descriptions

## 🎯 Key Endpoints

### Staff Management
- **`caStaffLookup`** - Enhanced staff lookup with performance optimizations
- **`claimantStaffInfo`** - Get claimant staff information
- **`fetchWBS`** - Retrieve WBS information

### Claims Management
- **`fetchClaimTypes`** - Get available claim types
- **`fetchUluFdlu`** - Retrieve ULU and FDLU information
- **`draftEclaimData`** - Get draft eclaim data

### Dashboard & Validation
- **`eclaimsOverviewDashboard`** - Dashboard data
- **`rateTypes`** - Rate type information
- **`validateEclaims`** - Validate eclaims data

## 🧪 Testing with Swagger UI

### 1. **Try-It-Out Feature**
- Click on any endpoint to expand it
- Click "Try it out" button
- Fill in the required parameters
- Click "Execute"

### 2. **Parameter Examples**

#### caStaffLookup Example:
```json
{
  "claimType": "OT",
  "ulu": "ULU001",
  "fdlu": "FDLU001",
  "period": "12-2024",
  "searchValue": "john"
}
```

#### fetchClaimTypes Example:
```json
{
  "staffId": "123456",
  "userGroup": "ESS"
}
```

### 3. **Response Examples**
All endpoints show example responses in the documentation, including:
- Success responses
- Error responses
- Data schemas
- Field descriptions

## 🔐 Authentication

### JWT Token Authentication
1. **Get your JWT token** from your authentication provider
2. **Click "Authorize"** in Swagger UI
3. **Enter token** in format: `Bearer <your-jwt-token>`
4. **Click "Authorize"** to apply

### Token Format
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 API Response Codes

### Success Codes
- **200 OK** - Request successful
- **201 Created** - Resource created successfully

### Error Codes
- **400 Bad Request** - Invalid input parameters
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

## 🛠️ Advanced Features

### 1. **Filtering Endpoints**
- Use the search box to filter endpoints by name
- Filter by tags (Staff Management, Claims Management, etc.)

### 2. **Request Headers**
- View and modify request headers
- Add custom headers for testing

### 3. **Response Headers**
- View response headers for debugging
- Understand caching and security headers

### 4. **Schema Validation**
- Automatic validation of request parameters
- Real-time feedback on invalid inputs

## 🔍 Troubleshooting

### Common Issues

#### 1. **CORS Errors**
```
Error: CORS policy blocked request
```
**Solution**: Ensure your service is properly configured for CORS

#### 2. **Authentication Errors**
```
Error: 401 Unauthorized
```
**Solution**: 
- Check your JWT token is valid
- Ensure token format is correct: `Bearer <token>`
- Verify token hasn't expired

#### 3. **Parameter Validation Errors**
```
Error: 400 Bad Request
```
**Solution**:
- Check required parameters are provided
- Verify parameter formats (dates, strings, etc.)
- Review parameter descriptions in Swagger UI

#### 4. **Server Not Found**
```
Error: Cannot connect to server
```
**Solution**:
- Verify service is running on correct port
- Check firewall settings
- Ensure correct URL is being used

### Debug Tips

#### 1. **Check Console Logs**
```bash
# Monitor server logs
npm start
```

#### 2. **Verify OpenAPI Spec**
```bash
# Check if spec file exists
ls docs/EclaimsService.openapi3.json
```

#### 3. **Test Direct API Calls**
```bash
# Test API directly
curl -X GET "http://localhost:4004/eclaims/$metadata" \
  -H "Authorization: Bearer <your-token>"
```

## 📈 Performance Monitoring

### Built-in Monitoring
The enhanced `caStaffLookup` endpoint includes:
- Performance metrics logging
- Response time tracking
- Cache hit/miss monitoring
- Error rate tracking

### Viewing Metrics
```bash
# Check server logs for performance data
npm start | grep "CA Staff Lookup"
```

## 🔄 Updating Documentation

### Regenerating OpenAPI Spec
```bash
# Build the project to regenerate OpenAPI spec
cds build
```

### Adding New Endpoints
1. Add endpoint to `srv/eclaims-service.cds`
2. Add JSDoc comments for documentation
3. Rebuild the project
4. Refresh Swagger UI

### Customizing Swagger UI
Edit `srv/server.js` to customize:
- UI appearance
- Default settings
- Authentication methods
- Custom CSS

## 📚 Additional Resources

### Documentation Files
- `docs/caStaffLookup-optimization.md` - Detailed optimization guide
- `README-CA-STAFF-LOOKUP-IMPROVEMENTS.md` - Summary of improvements
- `testClient/caStaffLookup-test.http` - Test cases

### External Resources
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [SAP CAP Documentation](https://cap.cloud.sap/)

## 🆘 Support

### Getting Help
1. **Check this guide** for common issues
2. **Review server logs** for error details
3. **Test with curl** to isolate issues
4. **Contact support**: eclaims-support@nus.edu.sg

### Reporting Issues
When reporting issues, include:
- Error messages
- Request parameters
- Response data
- Server logs
- Browser console logs

## 🎉 Conclusion

The Swagger UI integration provides a powerful, user-friendly interface for exploring and testing the Eclaims Service API. With comprehensive documentation, interactive testing capabilities, and performance monitoring, developers can efficiently work with the API and understand its capabilities.

For the best experience:
1. Use the landing page for navigation
2. Leverage the interactive testing features
3. Monitor performance metrics
4. Keep documentation updated
5. Report issues promptly 