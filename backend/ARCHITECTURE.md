# Cloud Printing Backend - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React/Vite App)                              │
│                   http://localhost:5173                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │ (JWT Token in Headers)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                             │
│                   http://localhost:8081                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  MIDDLEWARE LAYER                        │   │
│  │  • CORS Configuration                                    │   │
│  │  • JSON Body Parser (50MB limit)                         │   │
│  │  • Static File Serving                                   │   │
│  │  • JWT Authentication (authenticateToken)                │   │
│  │  • Role-Based Access Control (isAdmin, isSuperAdmin)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ROUTE LAYER                           │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ LoginRoute   │  │  UserRoute   │  │ PrinterRoute │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │ /register    │  │ /api/users   │  │ /api/printers│  │   │
│  │  │ /login       │  │ /api/users/* │  │ /api/printer*│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │TemplateRoute │  │PrintJobRoute │  │  AssetRoute  │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │/api/templates│  │/api/print-   │  │ /api/assets  │  │   │
│  │  │              │  │     jobs     │  │ /api/assets/*│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MODEL LAYER                           │   │
│  │                  (Mongoose Schemas)                      │   │
│  │                                                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  Admin   │ │   User   │ │ Template │ │ PrintJob │   │   │
│  │  │  Model   │ │  Model   │ │  Model   │ │  Model   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                           │   │
│  │  ┌──────────┐                                            │   │
│  │  │  Asset   │                                            │   │
│  │  │  Model   │                                            │   │
│  │  └──────────┘                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                              │
│                 mongodb://localhost:27017                        │
│                   Database: CloudPrinting                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    COLLECTIONS                           │   │
│  │                                                           │   │
│  │  • admins          - Admin accounts                      │   │
│  │  • users           - User accounts                       │   │
│  │  • labeltemplates  - Label templates                     │   │
│  │  • printjobs       - Print job records                   │   │
│  │  • assets          - Asset tracking                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

### 1. Authentication Flow
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /login
     │ { userName, password }
     ▼
┌────────────────┐
│  LoginRoute    │
└────┬───────────┘
     │
     │ 1. Find user in DB
     │ 2. Compare password (bcrypt)
     ▼
┌────────────────┐
│  Admin Model   │
└────┬───────────┘
     │
     │ 3. Generate JWT token
     │ 4. Return token + user info
     ▼
┌──────────┐
│  Client  │ (Store token)
└──────────┘
```

### 2. Protected Route Access Flow
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ GET /api/users
     │ Authorization: Bearer <token>
     ▼
┌────────────────────┐
│ authenticateToken  │ (Middleware)
└────┬───────────────┘
     │
     │ 1. Extract token
     │ 2. Verify JWT
     │ 3. Decode user info
     ▼
┌────────────────┐
│    isAdmin     │ (Middleware)
└────┬───────────┘
     │
     │ 4. Check user role
     ▼
┌────────────────┐
│   UserRoute    │
└────┬───────────┘
     │
     │ 5. Query database
     ▼
┌────────────────┐
│   User Model   │
└────┬───────────┘
     │
     │ 6. Return data
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

### 3. Print Job Creation Flow
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /api/print-jobs
     │ { printerName, documentName, ... }
     ▼
┌────────────────────┐
│ authenticateToken  │
└────┬───────────────┘
     │
     ▼
┌────────────────┐
│ PrintJobRoute  │
└────┬───────────┘
     │
     │ 1. Validate input
     │ 2. Create job object
     │ 3. Generate jobId
     ▼
┌────────────────┐
│ PrintJob Model │
└────┬───────────┘
     │
     │ 4. Save to MongoDB
     │ 5. Return job details
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

### 4. Asset Scanning Flow
```
┌──────────┐
│  Client  │ (Scan barcode/QR)
└────┬─────┘
     │
     │ GET /api/assets/scan/123456789
     ▼
┌────────────────────┐
│ authenticateToken  │
└────┬───────────────┘
     │
     ▼
┌────────────────┐
│  AssetRoute    │
└────┬───────────┘
     │
     │ 1. Search by barcode/qrCode
     ▼
┌────────────────┐
│  Asset Model   │
└────┬───────────┘
     │
     │ 2. Populate references
     │ 3. Return asset details
     ▼
┌──────────┐
│  Client  │ (Display asset info)
└──────────┘
```

## Data Relationships

```
┌─────────────┐
│    Admin    │
└──────┬──────┘
       │
       │ createdBy
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐      ┌─────────────┐
│   User      │      │  Template   │
└──────┬──────┘      └──────┬──────┘
       │                    │
       │ userId             │ templateId
       │                    │
       ├────────────────────┤
       │                    │
       ▼                    ▼
┌─────────────────────────────┐
│        PrintJob             │
└─────────────────────────────┘

┌─────────────┐
│    Admin    │
└──────┬──────┘
       │
       │ companyId
       │
       ▼
┌─────────────┐
│    Asset    │◄───┐
└──────┬──────┘    │
       │           │
       │ assignedTo│
       │           │
       ▼           │
┌─────────────┐    │
│    User     │────┘
└─────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         Layer 1: CORS Protection        │
│  • Allowed origins configuration        │
│  • Credentials support                  │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│    Layer 2: JWT Authentication          │
│  • Token verification                   │
│  • Expiry check (1 day)                 │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  Layer 3: Role-Based Authorization      │
│  • User role verification               │
│  • Permission checks                    │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│     Layer 4: Input Validation           │
│  • Required field checks                │
│  • Data type validation                 │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│    Layer 5: Database Constraints        │
│  • Unique indexes                       │
│  • Required fields                      │
│  • Data integrity                       │
└─────────────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────┐
│           Runtime Environment           │
│              Node.js v14+               │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│          Web Framework                  │
│            Express.js 5.x               │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│         Database & ODM                  │
│    MongoDB 6.x + Mongoose 8.x           │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│      Authentication & Security          │
│  • jsonwebtoken (JWT)                   │
│  • bcryptjs (Password hashing)          │
│  • cors (CORS protection)               │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Development Environment         │
│  • Local MongoDB (localhost:27017)      │
│  • Node.js dev server (nodemon)         │
│  • Frontend dev server (Vite)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        Production Environment           │
│                                          │
│  ┌────────────────────────────────┐    │
│  │      Reverse Proxy (Nginx)     │    │
│  │         Port 80/443             │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │    Node.js App (PM2)           │    │
│  │      Port 8081                 │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │    MongoDB Atlas/Self-hosted   │    │
│  │      Port 27017                │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

**Legend:**
- `┌─┐` = Component/Layer
- `│` = Connection/Flow
- `▼` = Direction of flow
- `◄─►` = Bidirectional relationship
