# Cloud Printing Backend API

Complete backend API for Cloud Printing application with local MongoDB support.

## 📋 Features

- ✅ **Authentication & Authorization**
  - Admin and User registration/login
  - JWT-based authentication
  - Role-based access control (User, Admin, SuperAdmin)
  
- ✅ **User Management**
  - User CRUD operations
  - Invite system with token-based signup
  - Company-based user organization
  
- ✅ **Printer Management**
  - Auto-detect connected printers (Windows)
  - Printer status monitoring
  - Printer properties and preferences access
  
- ✅ **Label Templates**
  - Predefined label templates
  - Custom field configuration
  - Template usage tracking
  
- ✅ **Print Job Management**
  - Print job creation and tracking
  - Status monitoring (pending, printing, completed, failed)
  - Job statistics and history
  
- ✅ **Asset Management**
  - Asset tracking with barcode/QR codes
  - Movement history
  - Asset assignment and status tracking

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Local)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **ODM**: Mongoose

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── src/
│   ├── Models/
│   │   ├── Login.js          # Admin model
│   │   ├── User.js           # User model
│   │   ├── LabelTemplate.js  # Label template model
│   │   ├── PrintJob.js       # Print job model
│   │   └── Asset.js          # Asset model
│   ├── Route/
│   │   ├── LoginRoute.js     # Authentication routes
│   │   ├── UserRoute.js      # User management routes
│   │   ├── PrinterRoute.js   # Printer management routes
│   │   ├── TemplateRoute.js  # Template management routes
│   │   ├── PrintJobRoute.js  # Print job routes
│   │   └── AssetRoute.js     # Asset management routes
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── index.js              # Express app configuration
│   └── server.js             # Server entry point
├── .env                      # Environment variables
└── package.json              # Dependencies

```

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/

2. **MongoDB** (Local installation)
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Compass for GUI: https://www.mongodb.com/try/download/compass

### Installation Steps

1. **Clone the repository** (if not already done)
   ```bash
   cd w:\Company\Cloud_Printing-sss\backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install nodemon** (if not already installed)
   ```bash
   npm install --save-dev nodemon
   ```

4. **Configure environment variables**
   - The `.env` file is already configured for local MongoDB
   - Default settings:
     ```
     MONGO_URI=mongodb://localhost:27017/CloudPrinting
     SECRET_KEY=sdfghjkegrthgjkmnbvcfdghjnb
     PORT=8081
     FRONTEND_URL=http://localhost:5173
     ```

5. **Start MongoDB**
   
   **Option A: MongoDB Service (Windows)**
   ```bash
   # Start MongoDB service
   net start MongoDB
   ```
   
   **Option B: Manual Start**
   ```bash
   # Create data directory if not exists
   mkdir C:\data\db
   
   # Start MongoDB
   mongod --dbpath C:\data\db
   ```
   
   **Option C: MongoDB Compass**
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`

6. **Start the backend server**
   
   **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

7. **Verify the server is running**
   - Open browser: http://localhost:8081
   - You should see:
     ```json
     {
       "message": "Cloud Printing Backend API",
       "status": "running",
       "version": "1.0.0",
       "timestamp": "2026-02-17T08:06:19.000Z"
     }
     ```

## 📚 API Documentation

### Base URL
```
http://localhost:8081
```

### Authentication Endpoints

#### Register Admin
```http
POST /register
Content-Type: application/json

{
  "userName": "admin",
  "password": "admin123"
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "userName": "admin",
  "password": "admin123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "userName": "admin",
    "role": "Admin"
  }
}
```

### User Management Endpoints

All user endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

#### Get All Users (Admin only)
```http
GET /api/users
Authorization: Bearer <token>
```

#### Get Single User
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User (Admin only)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "companyName": "ABC Corp",
  "role": "user"
}
```

#### Invite User (Admin only)
```http
POST /api/users/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "companyName": "ABC Corp"
}
```

#### Accept Invitation
```http
POST /api/users/accept-invite
Content-Type: application/json

{
  "token": "invite-token-here",
  "userName": "new_user",
  "password": "password123"
}
```

### Printer Endpoints

#### Get All Connected Printers
```http
GET /api/printers
Authorization: Bearer <token>
```

#### Get Printer Info
```http
GET /api/printer/:printerName/info
Authorization: Bearer <token>
```

#### Open Printer Properties
```http
POST /api/printer/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "printerName": "HP LaserJet"
}
```

### Template Endpoints

#### Get All Templates
```http
GET /api/templates
Authorization: Bearer <token>

# With filters
GET /api/templates?category=barcode&isPublic=true
```

#### Create Template (Admin only)
```http
POST /api/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Label",
  "description": "Standard product label",
  "category": "product",
  "dimensions": {
    "width": 100,
    "height": 50,
    "unit": "mm"
  },
  "fields": [
    {
      "name": "productName",
      "type": "text",
      "x": 10,
      "y": 10,
      "fontSize": 12
    }
  ],
  "isPublic": true
}
```

### Print Job Endpoints

#### Get All Print Jobs
```http
GET /api/print-jobs
Authorization: Bearer <token>

# With filters
GET /api/print-jobs?status=completed&userId=123
```

#### Create Print Job
```http
POST /api/print-jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "printerName": "HP LaserJet",
  "documentName": "Label_001",
  "documentType": "label",
  "copies": 5,
  "priority": "normal"
}
```

#### Update Job Status
```http
PUT /api/print-jobs/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Get Print Job Statistics
```http
GET /api/print-jobs/stats/summary
Authorization: Bearer <token>
```

### Asset Endpoints

#### Get All Assets
```http
GET /api/assets
Authorization: Bearer <token>

# With filters
GET /api/assets?status=active&assetType=equipment
```

#### Scan Asset (by barcode/QR)
```http
GET /api/assets/scan/:code
Authorization: Bearer <token>
```

#### Create Asset
```http
POST /api/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": "AST-001",
  "assetName": "Laptop Dell XPS",
  "assetType": "equipment",
  "barcode": "123456789",
  "location": "Office A",
  "status": "active"
}
```

#### Move Asset
```http
POST /api/assets/:id/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "toLocation": "Office B",
  "notes": "Transferred to new department"
}
```

## 🗄️ Database Collections

### 1. admins
- Admin user accounts
- Fields: userName, password (hashed), role, createdAt

### 2. users
- Regular user accounts
- Fields: userName, email, password, companyName, role, isActive, inviteToken, etc.

### 3. labeltemplates
- Predefined label templates
- Fields: name, description, category, dimensions, fields, previewImage, etc.

### 4. printjobs
- Print job tracking
- Fields: jobId, userId, printerName, status, copies, printSettings, etc.

### 5. assets
- Asset management
- Fields: assetId, assetName, barcode, qrCode, location, status, movementHistory, etc.

## 🔐 Authentication & Authorization

### Roles
1. **user** - Regular user with limited access
2. **admin** - Administrator with full access
3. **superadmin** - Super administrator with highest privileges

### Middleware
- `authenticateToken` - Verifies JWT token
- `isAdmin` - Checks for admin/superadmin role
- `isSuperAdmin` - Checks for superadmin role only

## 🧪 Testing the API

### Using Postman

1. **Register an admin**
   - POST http://localhost:8081/register
   - Body: `{"userName": "admin", "password": "admin123"}`

2. **Login**
   - POST http://localhost:8081/login
   - Body: `{"userName": "admin", "password": "admin123"}`
   - Copy the token from response

3. **Test protected routes**
   - Add header: `Authorization: Bearer <your-token>`
   - GET http://localhost:8081/api/users

### Using cURL

```bash
# Register
curl -X POST http://localhost:8081/register \
  -H "Content-Type: application/json" \
  -d "{\"userName\":\"admin\",\"password\":\"admin123\"}"

# Login
curl -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d "{\"userName\":\"admin\",\"password\":\"admin123\"}"

# Get users (replace TOKEN with actual token)
curl -X GET http://localhost:8081/api/users \
  -H "Authorization: Bearer TOKEN"
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error: "MongoDB connection error"**

1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Or check services
   services.msc
   ```

2. Verify MongoDB is listening on port 27017:
   ```bash
   netstat -an | findstr 27017
   ```

3. Test connection with MongoDB Compass:
   - Connect to: `mongodb://localhost:27017`

### Port Already in Use

**Error: "Port 8081 is already in use"**

1. Find process using port 8081:
   ```bash
   netstat -ano | findstr :8081
   ```

2. Kill the process:
   ```bash
   taskkill /PID <process-id> /F
   ```

3. Or change port in `.env`:
   ```
   PORT=8082
   ```

### JWT Token Issues

**Error: "Invalid or expired token"**

1. Make sure you're including the token in the header:
   ```
   Authorization: Bearer <your-token>
   ```

2. Token expires after 1 day - login again to get a new token

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/CloudPrinting` |
| `SECRET_KEY` | JWT secret key | `sdfghjkegrthgjkmnbvcfdghjnb` |
| `PORT` | Server port | `8081` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🔄 Development Workflow

1. Make changes to code
2. Server auto-reloads (if using `npm run dev`)
3. Test endpoints with Postman/cURL
4. Check MongoDB data with MongoDB Compass

## 📦 Production Deployment

For production deployment:

1. Update `.env`:
   ```
   NODE_ENV=production
   MONGO_URI=<your-production-mongodb-uri>
   FRONTEND_URL=<your-production-frontend-url>
   SECRET_KEY=<generate-strong-secret-key>
   ```

2. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name cloud-printing-api
   ```

## 📞 Support

For issues or questions, please check:
1. MongoDB is running
2. All dependencies are installed (`npm install`)
3. Environment variables are correctly set
4. Port 8081 is available

## 📄 License

ISC
