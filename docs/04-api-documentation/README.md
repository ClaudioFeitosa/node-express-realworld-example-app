# API Documentation

## Overview

This document provides comprehensive API documentation for the Node.js Express RealWorld Example App. The API follows REST principles and the RealWorld specification, providing a full-featured social blogging platform with user authentication, article management, and social interactions.

## Accessing the Documentation

### Swagger UI (Interactive Documentation)
- **URL**: `http://localhost:3000/api-docs`
- **Description**: Interactive API documentation with testing capabilities
- **Features**: 
  - Test API endpoints directly from the browser
  - View request/response schemas
  - Authentication support with JWT tokens
  - Code examples in multiple languages

### OpenAPI Specification (Raw)
- **URL**: `http://localhost:3000/api-docs.json`
- **Description**: Raw OpenAPI 3.0.3 specification
- **Usage**: Import into API clients, documentation generators, or testing tools

### Documentation Health Check
- **URL**: `http://localhost:3000/api-docs/health`
- **Description**: Verify that Swagger documentation is accessible

## Authentication

The API uses JWT (JSON Web Token) authentication:

### Required Authentication
Endpoints requiring authentication need the following header:
```
Authorization: Bearer <your_jwt_token>
```

### Optional Authentication
Some endpoints work with or without authentication. When authenticated, they provide personalized responses (e.g., user's following status).

### Getting a Token
1. Register a user: `POST /users`
2. Log in: `POST /users/login`
3. Use the returned `token` in subsequent requests

## API Resources

### Authentication & User Management
- `POST /users` - User registration
- `POST /users/login` - User login
- `GET /user` - Get current user (requiring authentication)
- `PUT /user` - Update user profile (requiring authentication)

### Articles
- `GET /articles` - Get articles (with pagination and filtering)
- `POST /articles` - Create article (requiring authentication)
- `GET /articles/feed` - Get user's feed (requiring authentication)
- `GET /articles/:slug` - Get single article
- `PUT /articles/:slug` - Update article (author only, requiring authentication)
- `DELETE /articles/:slug` - Delete article (author only, requiring authentication)

### Comments
- `GET /articles/:slug/comments` - Get article comments
- `POST /articles/:slug/comments` - Add comment (requiring authentication)
- `DELETE /articles/:slug/comments/:id` - Delete comment (author only, requiring authentication)

### Profiles & Social Features
- `GET /profiles/:username` - Get user profile
- `POST /profiles/:username/follow` - Follow user (requiring authentication)
- `DELETE /profiles/:username/follow` - Unfollow user (requiring authentication)

### Article Favorites
- `POST /articles/:slug/favorite` - Favorite article (requiring authentication)
- `DELETE /articles/:slug/favorite` - Unfavorite article (requiring authentication)

### Tags
- `GET /tags` - Get popular tags

## Response Format

### Success Responses
Most endpoints return responses in the following format:

```json
{
  "article": { ... },     // Single resource
  "articles": [ ... ],     // Resource collection  
  "user": { ... },        // User resource
  "profile": { ... },     // Profile resource
  "tags": [ ... ]         // Tag collection
}
```

### Error Responses
Errors follow a consistent structure:

```json
{
  "error": {
    "message": "Human-readable error description"
  }
}
```

Common HTTP status codes:
- `200 OK` - Successful operation
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Business logic validation error
- `500 Internal Server Error` - Server error

## Pagination

List endpoints support pagination using these query parameters:

- `offset` (default: 0) - Number of items to skip
- `limit` (default: 20, max: 100) - Number of items to return

Example: `GET /articles?offset=10&limit=5`

## Filtering

### Articles
The `/articles` endpoint supports these filters:

- `tag` - Filter by tag name
- `author` - Filter by author username  
- `favorited` - Filter by user who favorited

You can combine multiple filters:
`GET /articles?tag=react&author=john&favorited=alice`

## Data Types

### User Object
```json
{
  "id": 1,
  "username": "johndoe", 
  "email": "john@example.com",
  "bio": "Software developer",
  "image": "https://example.com/avatar.jpg",
  "token": "jwt_token_here",
  "demo": false
}
```

### Article Object
```json
{
  "id": 1,
  "slug": "how-to-build-apis",
  "title": "How to Build APIs",
  "description": "A comprehensive guide",
  "body": "Article content here...",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "tagList": ["API", "Node.js", "Express"],
  "author": {
    "username": "johndoe",
    "image": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "following": false
  },
  "favorited": false,
  "favoritesCount": 42
}
```

### Profile Object
```json
{
  "username": "johndoe",
  "image": "https://example.com/avatar.jpg", 
  "bio": "Software developer",
  "following": false
}
```

### Comment Object
```json
{
  "id": 1,
  "body": "Great article!",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "author": {
    "username": "jane",
    "image": "https://example.com/avatar2.jpg",
    "bio": null,
    "following": true
  }
}
```

## Testing the API

### Using Swagger UI
1. Navigate to `http://localhost:3000/api-docs`
2. Expand any endpoint
3. Click "Try it out"
4. Fill in parameters and request body
5. Click "Execute" to test

### Using curl Examples
```bash
# Register a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"user":{"username":"johndoe","email":"john@example.com","password":"password123"}}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"john@example.com","password":"password123"}}'

# Get articles with auth
curl -X GET http://localhost:3000/api/articles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Rate Limiting

Currently, rate limiting is not implemented. Consider adding rate limiting middleware for production use.

## CORS

Cross-Origin Resource Sharing (CORS) is enabled for all origins. Consider restricting this in production environments.

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Development

### Starting the Server
```bash
npm start
# or
npm run dev
```

### Accessing Documentation
Once the server is running:
- API endpoints: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI spec: `http://localhost:3000/api-docs.json`

## Maintenance

### Keeping Documentation Updated
The Swagger documentation is automatically generated from:
1. JSDoc comments in controller files
2. The OpenAPI configuration in `src/config/swagger.ts`
3. Type definitions for requests/responses

When adding new endpoints:
1. Add proper JSDoc comments describing the endpoint
2. Include parameter and response descriptions
3. Update the OpenAPI specification if needed
4. Test the documentation in Swagger UI

### Documentation Standards
- Every public endpoint should be documented
- Include authentication requirements
- Provide clear descriptions of parameters
- Document error responses
- Include realistic examples

## Troubleshooting

### Common Issues
1. **Swagger UI not loading**: Check that the server is running and accessible
2. **Missing endpoints**: Verify JSDoc comments and route registration order
3. **Authentication errors**: Ensure JWT tokens are properly formatted and not expired
4. **CORS issues**: Check CORS configuration if accessing from different origins

### Getting Help
- Check the server logs for detailed error messages
- Use the health check endpoint: `GET /api-docs/health`
- Review the test cases in `/src/tests/integration/` for expected behavior

## Related Documentation

- [API Contract](../01-discovery/API-CONTRACT.md) - Detailed API specifications
- [Integration Tests](../03-integration-tests/BASELINE-RESULTS.md) - Test coverage and validation
- [Architecture](../01-discovery/ARCHITECTURE.md) - System architecture overview