# API Contract Documentation

## Overview
This document describes the complete API contract for the Node.js Express RealWorld Example App based on code analysis.

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token
- **API Version**: v1 (implicit)

## Authentication Patterns

### **Required Authentication**
Endpoints marked with `@auth required` need a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### **Optional Authentication**
Endpoints marked with `@auth optional` can work with or without authentication. Authentication provides personalized responses.

---

## 1. Authentication Endpoints

### **User Registration**
- **Endpoint**: `POST /users`
- **Authentication**: None
- **Description**: Creates a new user account

**Request Body**:
```json
{
  "user": {
    "username": "string",
    "email": "string", 
    "password": "string"
  }
}
```

**Response** (201):
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "image": "string",
    "bio": "string",
    "token": "jwt_token_string"
  }
}
```

### **User Login**
- **Endpoint**: `POST /users/login`
- **Authentication**: None
- **Description**: Authenticates user and returns JWT token

**Request Body**:
```json
{
  "user": {
    "email": "string",
    "password": "string"
  }
}
```

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "image": "string",
    "bio": "string",
    "token": "jwt_token_string"
  }
}
```

### **Get Current User**
- **Endpoint**: `GET /user`
- **Authentication**: Required
- **Description**: Returns the currently authenticated user

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "image": "string",
    "bio": "string",
    "token": "jwt_token_string"
  }
}
```

### **Update User**
- **Endpoint**: `PUT /user`
- **Authentication**: Required
- **Description**: Updates user profile information

**Request Body**:
```json
{
  "user": {
    "username": "string (optional)",
    "email": "string (optional)",
    "password": "string (optional)",
    "image": "string (optional)",
    "bio": "string (optional)"
  }
}
```

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "image": "string",
    "bio": "string",
    "token": "jwt_token_string"
  }
}
```

---

## 2. Articles Endpoints

### **Get Articles**
- **Endpoint**: `GET /articles`
- **Authentication**: Optional
- **Description**: Returns paginated list of articles

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| offset | number | 0 | Number of articles to skip |
| limit | number | 20 | Number of articles to return |
| tag | string | - | Filter by tag |
| author | string | - | Filter by author username |
| favorited | string | - | Filter by user who favorited |

**Response** (200):
```json
{
  "articles": [
    {
      "id": 1,
      "slug": "article-slug",
      "title": "string",
      "description": "string",
      "body": "string",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "tagList": ["tag1", "tag2"],
      "author": {
        "username": "string",
        "image": "string",
        "following": false
      },
      "favorited": false,
      "favoritesCount": 0
    }
  ],
  "articlesCount": 100
}
```

### **Get Feed Articles**
- **Endpoint**: `GET /articles/feed`
- **Authentication**: Required
- **Description**: Returns paginated feed of articles from followed users

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| offset | number | 0 | Number of articles to skip |
| limit | number | 20 | Number of articles to return |

**Response** (200): Same format as Get Articles

### **Create Article**
- **Endpoint**: `POST /articles`
- **Authentication**: Required
- **Description**: Creates a new article

**Request Body**:
```json
{
  "article": {
    "title": "string",
    "description": "string", 
    "body": "string",
    "tagList": ["tag1", "tag2"]
  }
}
```

**Response** (201):
```json
{
  "article": {
    "id": 1,
    "slug": "article-slug",
    "title": "string",
    "description": "string",
    "body": "string",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "tagList": ["tag1", "tag2"],
    "author": {
      "username": "string",
      "image": "string",
      "following": false
    },
    "favorited": false,
    "favoritesCount": 0
  }
}
```

### **Get Single Article**
- **Endpoint**: `GET /articles/:slug`
- **Authentication**: Optional
- **Description**: Returns a specific article by slug

**Response** (200): Same as single article object in Get Articles response

### **Update Article**
- **Endpoint**: `PUT /articles/:slug`
- **Authentication**: Required
- **Description**: Updates an existing article (author only)

**Request Body**:
```json
{
  "article": {
    "title": "string (optional)",
    "description": "string (optional)",
    "body": "string (optional)"
  }
}
```

**Response** (200): Same as Create Article response

### **Delete Article**
- **Endpoint**: `DELETE /articles/:slug`
- **Authentication**: Required
- **Description**: Deletes an article (author only)

**Response** (204): No content

---

## 3. Comments Endpoints

### **Get Article Comments**
- **Endpoint**: `GET /articles/:slug/comments`
- **Authentication**: Optional
- **Description**: Returns comments for a specific article

**Response** (200):
```json
{
  "comments": [
    {
      "id": 1,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "body": "string",
      "author": {
        "username": "string",
        "image": "string",
        "following": false
      }
    }
  ]
}
```

### **Add Comment**
- **Endpoint**: `POST /articles/:slug/comments`
- **Authentication**: Required
- **Description**: Adds a comment to an article

**Request Body**:
```json
{
  "comment": {
    "body": "string"
  }
}
```

**Response** (200):
```json
{
  "comment": {
    "id": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "body": "string",
    "author": {
      "username": "string",
      "image": "string",
      "following": false
    }
  }
}
```

### **Delete Comment**
- **Endpoint**: `DELETE /articles/:slug/comments/:id`
- **Authentication**: Required
- **Description**: Deletes a comment (author only)

**Response** (200): Empty object
```json
{}
```

---

## 4. Favorites Endpoints

### **Favorite Article**
- **Endpoint**: `POST /articles/:slug/favorite`
- **Authentication**: Required
- **Description**: Favorites an article

**Response** (200): Same as Get Single Article response

### **Unfavorite Article**
- **Endpoint**: `DELETE /articles/:slug/favorite`
- **Authentication**: Required
- **Description**: Unfavorites an article

**Response** (200): Same as Get Single Article response

---

## 5. Profiles Endpoints

### **Get Profile**
- **Endpoint**: `GET /profiles/:username`
- **Authentication**: Optional
- **Description**: Returns a user's profile

**Response** (200):
```json
{
  "profile": {
    "username": "string",
    "image": "string",
    "bio": "string",
    "following": false
  }
}
```

### **Follow User**
- **Endpoint**: `POST /profiles/:username/follow`
- **Authentication**: Required
- **Description**: Follows a user

**Response** (200):
```json
{
  "profile": {
    "username": "string",
    "image": "string",
    "bio": "string",
    "following": true
  }
}
```

### **Unfollow User**
- **Endpoint**: `DELETE /profiles/:username/follow`
- **Authentication**: Required
- **Description**: Unfollows a user

**Response** (200): Same as Follow User response

---

## 6. Tags Endpoints

### **Get Tags**
- **Endpoint**: `GET /tags`
- **Authentication**: Optional
- **Description**: Returns list of popular tags (top 10)

**Response** (200):
```json
{
  "tags": ["tag1", "tag2", "tag3"]
}
```

---

## Error Responses

### **Unauthorized** (401)
```json
{
  "status": "error",
  "message": "missing authorization credentials"
}
```

### **Not Found** (404)
```json
{
  "error": {
    "message": "Resource not found"
  }
}
```

### **Validation Error** (400)
```json
{
  "error": {
    "message": "Validation failed"
  }
}
```

### **Server Error** (500)
```json
{
  "error": {
    "message": "Internal server error"
  }
}
```

---

## Data Types

### **User Object**
```json
{
  "id": "number",
  "username": "string",
  "email": "string", 
  "password": "string (write-only)",
  "image": "string (nullable)",
  "bio": "string (nullable)",
  "token": "string (authenticated context only)",
  "demo": "boolean"
}
```

### **Article Object**
```json
{
  "id": "number",
  "slug": "string",
  "title": "string",
  "description": "string",
  "body": "string",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime", 
  "tagList": "array of strings",
  "author": "Profile object",
  "favorited": "boolean",
  "favoritesCount": "number"
}
```

### **Comment Object**
```json
{
  "id": "number",
  "body": "string",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime",
  "author": "Profile object"
}
```

### **Profile Object**
```json
{
  "username": "string",
  "image": "string (nullable)",
  "bio": "string (nullable)", 
  "following": "boolean"
}
```

---

## Business Rules

### **Article Management**
- Only article authors can update/delete their articles
- Slugs are automatically generated from titles
- Tag lists are deduplicated
- Articles include author information by default

### **Authentication**
- Passwords are hashed using bcryptjs
- JWT tokens include user ID and expiration
- Token expiration is configurable via JWT_SECRET

### **Social Features**
- Users can follow/unfollow other users
- Users can favorite/unfavorite articles
- Feed shows articles from followed users only
- Following status is contextual to current user

### **Comments**
- Only comment authors can delete their comments
- Comments are ordered by creation date (newest first)
- Comments are automatically deleted when articles are deleted

---

## Rate Limiting & Constraints

### **Pagination Limits**
- Default limit: 20 articles
- Maximum limit: Not explicitly enforced
- Offset/limit combinations for navigation

### **Character Limits**
- Username: Based on database constraints
- Email: Standard email validation
- Password: Minimum length via validation
- Article content: Limited by database field size

### **Query Ordering**
- Articles: Ordered by creation date (newest first)
- Comments: Ordered by creation date (newest first)
- Tags: Alphabetical ordering