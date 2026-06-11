# System Architecture

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │────│  Express API    │────│  PostgreSQL DB  │
│  (Web/Mobile)   │    │   (Node.js)     │    │   (Prisma)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Application Architecture Pattern

### **Model-View-Controller (MVC) Variation**
```
┌─────────────────────────────────────────────────────────────┐
│                     Express Application                    │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer (Controllers)                                │
│  ├─ auth.controller.ts     (Authentication endpoints)       │
│  ├─ article.controller.ts  (Article management)            │
│  ├─ profile.controller.ts  (User profiles & social)        │
│  └─ tag.controller.ts      (Tag management)               │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services)                           │
│  ├─ auth.service.ts       (Authentication logic)           │
│  ├─ article.service.ts    (Article operations)             │
│  ├─ profile.service.ts    (Profile operations)             │
│  └─ tag.service.ts        (Tag operations)                │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer (ORM)                                   │
│  └─ Prisma Client         (Type-safe DB operations)        │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                            │
│  └─ PostgreSQL            (Relational data storage)        │
└─────────────────────────────────────────────────────────────┘
```

## Service Architecture

### **Monolithic Single-Service Design**
- **Single Deployable Unit**: One Node.js application
- **Shared Database**: All services use the same PostgreSQL instance
- **In-Process Communication**: Direct function calls between layers
- **Sessionless Design**: RESTful HTTP communication

### **Component Responsibility Matrix**

| Component | Responsibility | Dependencies |
|-----------|----------------|--------------|
| **Auth Controller** | HTTP routing for auth endpoints | Auth Service, JWT Middleware |
| **Article Controller** | HTTP routing for articles | Article Service, Auth Middleware |
| **Profile Controller** | HTTP routing for profiles | Profile Service, Auth Middleware |
| **Tag Controller** | HTTP routing for tags | Tag Service |
| **Auth Service** | User authentication logic | Prisma, bcryptjs, jsonwebtoken |
| **Article Service** | Article business logic | Prisma, slugify |
| **Profile Service** | User profile operations | Prisma |
| **Tag Service** | Tag management | Prisma |

## Data Flow Architecture

### **Request Processing Flow**
```
HTTP Request
     │
     ▼
┌─────────────────┐
│ Express Router  │ ← Route matching
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Auth Middleware │ ← JWT validation (optional/required)
└─────────────────┘
     │
     ▼
┌─────────────────┐
│   Controller    │ ← Request validation & response formatting
└─────────────────┘
     │
     ▼
┌─────────────────┐
│    Service      │ ← Business logic execution
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Prisma Client   │ ← Database operations
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  PostgreSQL     │ ← Data persistence
└─────────────────┘
     │
     ▼
HTTP Response
```

## Database Architecture

### **Entity Relationship Diagram**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      User       │    │     Article     │    │      Comment    │
│─────────────────│    │─────────────────│    │─────────────────│
│ id (PK)         │←───│ id (PK)         │←───│ id (PK)         │
│ email (UNIQUE)  │    │ slug (UNIQUE)   │    │ created_at      │
│ username (UNIQUE)│   │ title           │    │ updated_at      │
│ password        │    │ description     │    │ body            │
│ image           │    │ body            │    │ article_id (FK) │
│ bio             │    │ created_at      │    │ author_id (FK)  │
│ demo flag       │    │ updated_at      │    └─────────────────┘
│ created_at      │    │ author_id (FK)  │           │
│ updated_at      │    └─────────────────┘           │
└─────────────────┘           │                       │
          │                    │                       │
          │                    ▼                       │
          │           ┌─────────────────┐              │
          │           │       Tag       │              │
          │           │─────────────────│              │
          │           │ id (PK)         │              │
          │           │ name (UNIQUE)   │              │
          │           └─────────────────┘              │
          │                    │                       │
          └────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │ User_Relationship│
                    │─────────────────│
                    │ follower_id (FK)│
                    │ following_id (FK)│
                    └─────────────────┘
```

### **Indexing Strategy**
- Primary keys: Auto-increment integers
- Unique constraints: email, username, slug, tag name
- Foreign keys: Proper indexing for JOIN operations

## Security Architecture

### **Authentication Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                   Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│  Network Layer     │ CORS Configuration                   │
├─────────────────────────────────────────────────────────────┤
│  Application Layer │ Express.js Security Middleware       │
├─────────────────────────────────────────────────────────────┤
│  Authentication   │ JWT Middleware (optional/required)   │
├─────────────────────────────────────────────────────────────┤
│  Authorization     │ Role-based endpoint protection       │
├─────────────────────────────────────────────────────────────┤
│  Data Protection   │ bcryptjs password hashing           │
├─────────────────────────────────────────────────────────────┤
│  Database Security│ Prisma ORM (SQL injection prevention) │
└─────────────────────────────────────────────────────────────┘
```

### **JWT Token Flow**
```
Login Request → Validate Credentials → Generate JWT → Return Token
                                               │
                                               ▼
API Request → Validate JWT → Extract User Info → Process Request
```

## Error Handling Architecture

### **Centralized Error Handling**
```
┌─────────────────────────────────────────────────────────────┐
│                Error Handling Flow                          │
├─────────────────────────────────────────────────────────────┤
│  Error Occurs │ Route Handler or Service Layer              │
├─────────────────────────────────────────────────────────────┤
│  Error Bubbles │ throw new Error() or HttpException         │
├─────────────────────────────────────────────────────────────┤
│  Error Capture │ Express Error Middleware                   │
├─────────────────────────────────────────────────────────────┤
│  Error Class   │ UnauthorizedError vs HttpException        │
├─────────────────────────────────────────────────────────────┤
│  Response      │ Proper HTTP status + JSON error message   │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Architecture

### **Environment-Based Configuration**
```
Development Environment
├─ DATABASE_URL (local PostgreSQL)
├─ JWT_SECRET (development key)
├─ NODE_ENV=development
└─ PORT=3000

Production Environment
├─ DATABASE_URL (production PostgreSQL)
├─ JWT_SECRET (secure production key)
├─ NODE_ENV=production
└─ PORT (configured by hosting provider)
```

### **Configuration Management**
- **Runtime Configuration**: Environment variables
- **Database Configuration**: Prisma schema
- **Build Configuration**: Nx workspace
- **Test Configuration**: Jest configuration

## API Design Architecture

### **RESTful API Principles**
- **Resource-Based URLs**: `/articles`, `/users`, `/profiles`, `/tags`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**: Proper HTTP status code usage (200, 201, 204, 400, 401, 404, 500)
- **Content Negotiation**: JSON response format

### **Response Format Standardization**
```json
{
  "article": { ... },           // Single resource
  "articles": [ ... ],         // Resource collection
  "user": { ... },             // User resource
  "profile": { ... },          // Profile resource
  "tags": [ ... ]              // Tag collection
}
```

## Development Architecture

### **Build Pipeline**
```
Source Code (TypeScript)
         │
         ▼
TypeScript Compilation
         │
         ▼
JavaScript Bundling (esbuild)
         │
         ▼
Production Build
         │
         ▼
Deployment Package
```

### **Testing Architecture**
```
Test Pyramid
┌─────────────────┐
│   E2E Tests     │ ← End-to-end API testing
├─────────────────┤
│ Integration     │ ← Service layer testing
├─────────────────┤
│ Unit Tests      │ ← Individual component testing
└─────────────────┘
```

## Deployment Architecture

### **Single Instance Deployment**
```
┌─────────────────────────────────────────────────────────────┐
│                  Deployment Pattern                        │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer     │ (Optional, for scaling)               │
├─────────────────────────────────────────────────────────────┤
│  Node.js App       │ Single instance of Express app         │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL        │ Shared database instance              │
├─────────────────────────────────────────────────────────────┤
│  File System       │ Static assets serving                  │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### **Current Architecture Limitations**
- **Single Database**: potential bottleneck under high load
- **No Caching**: repeated database queries
- **No Connection Pooling**: not explicitly configured
- **Synchronous Processing**: no background job processing

### **Potential Scaling Points**
- **Horizontal Scaling**: Multiple app instances behind load balancer
- **Database Scaling**: Read replicas, connection pooling
- **Caching Layer**: Redis for frequently accessed data
- **CDN Integration**: Static asset delivery optimization

## Integration Architecture

### **External Dependencies**
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Self-contained JWT implementation
- **File Storage**: Local filesystem for static assets
- **Email Services**: Not implemented (potential future need)

### **API Integration Points**
- **Client Applications**: Web/Mobile apps via REST API
- **Third-party Services**: None currently integrated
- **External APIs**: No external API calls in current implementation