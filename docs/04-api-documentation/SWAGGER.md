# Swagger & OpenAPI Configuration

## Overview

This document describes the Swagger/OpenAPI configuration and setup for the Node.js Express RealWorld Example App.

## Architecture

### Components Used
- **swagger-ui-express**: Middleware to serve Swagger UI
- **swagger-jsdoc**: Generates OpenAPI spec from JSDoc comments
- **OpenAPI 3.0.3**: API specification standard

### File Structure
```
src/
├── config/
│   └── swagger.ts          # Swagger configuration and setup
├── main.ts                # Application entry point with Swagger integration
└── app/routes/            # API endpoints with JSDoc documentation
    ├── auth/
    ├── article/
    ├── profile/
    └── tag/
```

## Configuration Details

### Swagger Configuration (`src/config/swagger.ts`)

```typescript
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.3',
    info: { /* ... */ },
    servers: [ /* ... */ ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer', 
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../app/routes/**/*.ts'),
    path.join(__dirname, '../app/routes/**/*.js')
  ]
};
```

### Key Configuration Elements

#### OpenAPI Definition
- **Version**: 3.0.3
- **Title**: Node.js Express RealWorld Example App
- **Version**: 1.0.0
- **Description**: Comprehensive API description

#### Servers
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.example.com/api` (configurable)

#### Security
- **Scheme**: Bearer Token (JWT)
- **Type**: HTTP authentication
- **Format**: JWT

### Swagger UI Options

```typescript
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b4151 }
  `,
  customSiteTitle: 'RealWorld API Documentation',
  customfavIcon: '/assets/favicon.ico'
};
```

#### Custom Features
- **Removed Top Bar**: Cleaner interface
- **Custom Styling**: Title color customization
- **Custom Title**: Branded documentation
- **Favicon**: Application icon support

## Integration with Express

### Main Application Setup (`src/main.ts`)

```typescript
import { setupSwagger } from './config/swagger';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

// Setup Swagger documentation
setupSwagger(app);
```

### Middleware Chain Order
1. CORS middleware
2. Body parsing middleware
3. Application routes
4. Swagger configuration
5. Static file serving
6. Error handling middleware

## Available Endpoints

### Documentation Endpoints
- **Swagger UI**: `GET /api-docs`
- **OpenAPI Spec**: `GET /api-docs.json`
- **Health Check**: `GET /api-docs/health`
- **Application Info**: `GET /` (includes documentation links)

### Health Check Response
```json
{
  "status": "ok",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "swagger": "available",
  "endpoints": {
    "ui": "/api-docs",
    "json": "/api-docs.json"
  }
}
```

## Documentation Generation Process

### 1. JSDoc Comments in Controllers

Each route handler includes JSDoc comments:

```typescript
/**
 * Get paginated articles
 * @auth optional
 * @route {GET} /articles
 * @queryparam offset number of articles dismissed from the first one
 * @queryparam limit number of articles returned
 * @queryparam tag
 * @queryparam author
 * @queryparam favorited
 * @returns articles: list of articles
 */
router.get('/articles', auth.optional, async (req, res, next) => {
  // Route implementation
});
```

#### Supported JSDoc Tags
- `@route {METHOD} /path` - HTTP method and path
- `@auth required|optional` - Authentication requirement
- `@queryparam name description` - Query parameter
- `@param name description` - Path parameter  
- `@bodyparam name description` - Request body field
- `@returns description` - Response description

### 2. swagger-jsdoc Processing

The `swagger-jsdoc` package:
1. Scans specified file paths for JSDoc comments
2. Parses route information from comments
3. Generates OpenAPI specification object
4. Applies global configuration from `options.definition`

### 3. swagger-ui-express Serving

The `swagger-ui-express` middleware:
1. Serves interactive Swagger UI at `/api-docs`
2. Provides API testing interface
3. Renders OpenAPI specification as HTML interface
4. Enables "Try it out" functionality

## Authentication in Swagger

### JWT Token Setup
1. Go to `http://localhost:3000/api-docs`
2. Click the "Authorize" button (top right)
3. Enter: `Bearer your_jwt_token`
4. Click "Authorize" to confirm
5. Token applied to all subsequent requests

### Example Token Format
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Testing Features

### "Try it out" Functionality
- **Parameters**: Input fields for all parameters
- **Authentication**: Uses configured JWT token
- **Responses**: Displays full response with headers
- **Code Examples**: curl, JavaScript, Python examples

### Request/Response Examples
Swagger UI generates examples from:
1. JSDoc comment examples
2. Schema default values
3. Response object structure
4. OpenAPI specification examples

## Customization Options

### UI Customization
```typescript
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b4151 }
    .swagger-ui .scheme-container { margin: 10px 0 }
  `,
  customSiteTitle: 'Custom API Documentation',
  customfavIcon: '/path/to/favicon.ico',
  customJs: '/path/to/custom.js',
  customCssUrl: '/path/to/custom.css'
};
```

### Specification Customization
Update `options.definition` in `src/config/swagger.ts`:
- Add/remove servers
- Update contact information
- Add external documentation
- Configure security schemes
- Define global parameters

## Performance Considerations

### Caching
- OpenAPI specification is generated at startup
- No runtime overhead during API operations
- Browser caching for Swagger UI assets

### Memory Usage
- swagger-jsdoc processes files during initialization
- Negligible runtime memory impact
- Efficient caching in development

## Security

### Information Exposure
- Production endpoints may include sensitive information
- Consider disabling detailed errors in production
- Restrict access to documentation endpoints if needed

### Security Headers
```typescript
// Potential production security middleware
app.use('/api-docs', helmet()); // Add security headers
```

### Access Control (Optional)
```typescript
// Restrict documentation access
app.use('/api-docs', (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !isAllowedIP(req.ip)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});
```

## Troubleshooting

### Common Issues

#### Documentation Not Loading
```
Cause: swagger-jsdoc not finding route files
Solution: Verify file paths in config.apis array
```

#### Route Not Documenting
```  
Cause: Missing or incorrect JSDoc comments
Solution: Check comment syntax and @route tag format
```

#### Authentication Issues
```
Cause: JWT token not properly formatted
Solution: Include "Bearer " prefix in authorization header
```

#### Styles Not Applying
```
Cause: customCss syntax errors
Solution: Validate CSS syntax and class names
```

### Debug Steps

1. **Check Configuration**: Verify swagger.ts settings
2. **Console Logs**: Look for swagger-jsdoc processing messages
3. **Network Tab**: Check for resource loading errors
4. **File Paths**: Ensure all route files are accessible
5. **JSDoc Syntax**: Validate comment format using JSDoc tools

## Development Workflow

### Adding New Endpoints
1. Implement route handler in appropriate controller
2. Add JSDoc comments with proper tags
3. Test endpoint functionality
4. Verify documentation in Swagger UI
5. Update OpenAPI spec if needed

### Updating Documentation
1. Modify JSDoc comments or swagger config
2. Restart server for changes to apply
3. Test updated documentation in Swagger UI
4. Validate OpenAPI specification consistency

### Validation
```bash
# Test that docs are accessible
curl http://localhost:3000/api-docs/health

# Download OpenAPI spec
curl http://localhost:3000/api-docs.json -o openapi.json

# Validate OpenAPI spec
npm install -g @apidevtools/swagger-parser
swagger-parser validate openapi.json
```

## Future Enhancements

### Potential Improvements
1. **Redoc Integration**: Alternative documentation UI
2. **API Versioning**: Multiple spec versions
3. **Code Generation**: Client SDK generation
4. **Documentation Tests**: Automated API contract testing
5. **Custom Theme**: Branded Swagger UI design

### Integration Options
1. **API Gateway**: Document through proxy layer
2. **Container Orchestration**: Include in service discovery
3. **CI/CD**: Automated documentation updates
4. **Monitoring**: Documentation usage analytics

## Resources

### Documentation
- [OpenAPI 3.0.3 Specification](https://swagger.io/specification/)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)

### Tools
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Postman OpenAPI Import](https://learning.postman.com/docs/api-design/openapi/)