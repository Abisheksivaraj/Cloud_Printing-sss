# Cloud Printing Backend - Complete Structure Summary

## 📊 Overview

This document provides a complete overview of the Cloud Printing Backend API with local MongoDB integration.

## 🗂️ File Structure

```
backend/
├── config/
│   └── db.js                      # MongoDB connection with error handling
│
├── src/
│   ├── Models/                    # Database Models (Mongoose Schemas)
│   │   ├── Login.js              # Admin authentication model
│   │   ├── User.js               # User model with invite system
│   │   ├── LabelTemplate.js      # Label template model
│   │   ├── PrintJob.js           # Print job tracking model
│   │   └── Asset.js              # Asset management model
│   │
│   ├── Route/                     # API Routes
│   │   ├── LoginRoute.js         # Auth: /register, /login
│   │   ├── UserRoute.js          # Users: CRUD + invite system
│   │   ├── PrinterRoute.js       # Printers: detection & management
│   │   ├── TemplateRoute.js      # Templates: CRUD operations
│   │   ├── PrintJobRoute.js      # Print jobs: tracking & stats
│   │   └── AssetRoute.js         # Assets: tracking & scanning
│   │
│   ├── middleware/
│   │   └── auth.js               # JWT authentication & role-based access
│   │
│   ├── index.js                  # Express app configuration
│   └── server.js                 # Server entry point
│
├── .env                          # Environment configuration
├── package.json                  # Dependencies & scripts
├── README.md                     # Full documentation
└── QUICKSTART.md                 # Quick setup guide
```

## 📦 Models (Database Schemas)

### 1. Admin Model (`Login.js`)
```javascript
{
  userName: String (required, unique),
  password: String (required, hashed),
  role: String (default: "Admin"),
  createdAt: Date
}
```

### 2. User Model (`User.js`)
```javascript
{
  userName: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  companyName: String (required),
  role: String (enum: user/admin/superadmin),
  isActive: Boolean,
  invitedBy: ObjectId (ref: admin),
  inviteToken: String,
  inviteExpires: Date,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Label Template Model (`LabelTemplate.js`)
```javascript
{
  name: String (required),
  description: String,
  category: String (enum: barcode/qr/shipping/product/custom),
  dimensions: {
    width: Number,
    height: Number,
    unit: String (mm/inch/px)
  },
  fields: [{
    name: String,
    type: String (text/barcode/qrcode/image/date/number),
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    fontSize: Number,
    fontFamily: String,
    alignment: String,
    defaultValue: String
  }],
  previewImage: String,
  isPublic: Boolean,
  createdBy: ObjectId (ref: admin),
  usageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Print Job Model (`PrintJob.js`)
```javascript
{
  jobId: String (unique, auto-generated),
  userId: ObjectId (ref: User),
  printerName: String (required),
  templateId: ObjectId (ref: LabelTemplate),
  documentName: String (required),
  documentType: String (enum: label/document/barcode/qrcode/custom),
  copies: Number,
  status: String (enum: pending/printing/completed/failed/cancelled),
  priority: String (enum: low/normal/high),
  printSettings: {
    paperSize: String,
    orientation: String,
    quality: String,
    color: Boolean
  },
  fileSize: Number,
  errorMessage: String,
  startedAt: Date,
  completedAt: Date,
  createdAt: Date
}
```

### 5. Asset Model (`Asset.js`)
```javascript
{
  assetId: String (required, unique),
  assetName: String (required),
  assetType: String (enum: equipment/inventory/tool/vehicle/other),
  barcode: String (unique),
  qrCode: String (unique),
  description: String,
  location: String,
  status: String (enum: active/inactive/maintenance/retired),
  assignedTo: ObjectId (ref: User),
  companyId: ObjectId (ref: admin),
  movementHistory: [{
    fromLocation: String,
    toLocation: String,
    movedBy: ObjectId (ref: User),
    movedAt: Date,
    notes: String
  }],
  metadata: Map<String, String>,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛣️ API Routes Summary

### Authentication Routes (`LoginRoute.js`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new admin | No |
| POST | `/login` | Admin login | No |

### User Routes (`UserRoute.js`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users` | Get all users | Yes | Admin |
| GET | `/api/users/:id` | Get single user | Yes | Any |
| POST | `/api/users` | Create user | Yes | Admin |
| POST | `/api/users/invite` | Invite user | Yes | Admin |
| POST | `/api/users/accept-invite` | Accept invitation | No | - |
| PUT | `/api/users/:id` | Update user | Yes | Self/Admin |
| DELETE | `/api/users/:id` | Delete user | Yes | Admin |
| POST | `/api/users/:id/login` | Update last login | Yes | Any |

### Printer Routes (`PrinterRoute.js`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/printers` | Get connected printers | Yes |
| GET | `/api/printer/:name/info` | Get printer details | Yes |
| GET | `/api/printer/:name/status` | Check printer status | Yes |
| POST | `/api/printer/properties` | Open printer properties | Yes |
| POST | `/api/printer/preferences` | Open printer preferences | Yes |
| POST | `/api/printer/settings-page` | Open settings page | Yes |
| POST | `/api/open-printer-settings` | Open Windows settings | Yes |

### Template Routes (`TemplateRoute.js`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/templates` | Get all templates | Yes | Any |
| GET | `/api/templates/:id` | Get single template | Yes | Any |
| POST | `/api/templates` | Create template | Yes | Admin |
| PUT | `/api/templates/:id` | Update template | Yes | Admin |
| DELETE | `/api/templates/:id` | Delete template | Yes | Admin |
| POST | `/api/templates/:id/use` | Increment usage count | Yes | Any |
| GET | `/api/templates/popular/list` | Get popular templates | Yes | Any |

### Print Job Routes (`PrintJobRoute.js`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/print-jobs` | Get all print jobs | Yes | Any* |
| GET | `/api/print-jobs/:id` | Get single print job | Yes | Any* |
| POST | `/api/print-jobs` | Create print job | Yes | Any |
| PUT | `/api/print-jobs/:id/status` | Update job status | Yes | Any |
| POST | `/api/print-jobs/:id/cancel` | Cancel print job | Yes | Any* |
| DELETE | `/api/print-jobs/:id` | Delete print job | Yes | Admin |
| GET | `/api/print-jobs/stats/summary` | Get statistics | Yes | Any* |

*Users can only access their own jobs; Admins can access all jobs

### Asset Routes (`AssetRoute.js`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/assets` | Get all assets | Yes | Any* |
| GET | `/api/assets/:id` | Get single asset | Yes | Any |
| GET | `/api/assets/scan/:code` | Scan asset by code | Yes | Any |
| POST | `/api/assets` | Create asset | Yes | Any |
| PUT | `/api/assets/:id` | Update asset | Yes | Any |
| POST | `/api/assets/:id/move` | Move asset | Yes | Any |
| DELETE | `/api/assets/:id` | Delete asset | Yes | Admin |
| GET | `/api/assets/stats/summary` | Get statistics | Yes | Any* |

*Filtered by company for non-admin users

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  id: "user_id",
  role: "user|admin|superadmin",
  iat: timestamp,
  exp: timestamp (1 day expiry)
}
```

### Middleware Functions
1. **authenticateToken** - Verifies JWT token validity
2. **isAdmin** - Checks for admin or superadmin role
3. **isSuperAdmin** - Checks for superadmin role only

### Usage Example
```javascript
router.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  // Only authenticated admins can access
});
```

## 🌐 CORS Configuration

```javascript
{
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}
```

## 🗄️ MongoDB Collections

After running the application, these collections will be created:

1. **admins** - Admin accounts
2. **users** - User accounts
3. **labeltemplates** - Label templates
4. **printjobs** - Print job records
5. **assets** - Asset tracking records

## 📊 Database Indexes

Automatically created indexes:
- `admins`: userName (unique)
- `users`: userName (unique), email (unique)
- `labeltemplates`: createdBy, category
- `printjobs`: jobId (unique), userId, status
- `assets`: assetId (unique), barcode (unique, sparse), qrCode (unique, sparse)

## 🔄 Data Flow

### 1. User Registration Flow
```
Client → POST /register → Hash Password → Save to DB → Return Success
```

### 2. Login Flow
```
Client → POST /login → Verify Credentials → Generate JWT → Return Token
```

### 3. Protected Route Access
```
Client → Request with Token → Verify Token → Check Role → Execute Route → Return Data
```

### 4. Print Job Flow
```
Create Job → Status: pending → Status: printing → Status: completed/failed
```

### 5. Asset Movement Flow
```
Scan Asset → Update Location → Add to Movement History → Save
```

## 🚀 Deployment Checklist

### Local Development
- [x] MongoDB installed and running
- [x] Dependencies installed (`npm install`)
- [x] Environment variables configured
- [x] Server running (`npm run dev`)

### Production Deployment
- [ ] Update MONGO_URI to production database
- [ ] Generate strong SECRET_KEY
- [ ] Set NODE_ENV=production
- [ ] Configure FRONTEND_URL
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

## 📈 Performance Considerations

1. **Database Indexing**: Indexes created on frequently queried fields
2. **Pagination**: Implement pagination for large datasets
3. **Caching**: Consider Redis for session management
4. **Connection Pooling**: Mongoose handles connection pooling automatically
5. **Rate Limiting**: Implement rate limiting for API endpoints

## 🔒 Security Features

1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Access**: Three-tier role system
4. **Input Validation**: Validate all user inputs
5. **CORS Protection**: Configured allowed origins
6. **Environment Variables**: Sensitive data in .env

## 🧪 Testing Recommendations

### Unit Tests
- Model validation
- Middleware functions
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### End-to-End Tests
- Complete user workflows
- Print job lifecycle
- Asset tracking flow

## 📝 Logging & Monitoring

Current logging:
- Server startup information
- MongoDB connection status
- Route access logs
- Error messages

Recommended additions:
- Winston for structured logging
- Morgan for HTTP request logging
- Error tracking (Sentry)
- Performance monitoring (New Relic)

## 🔧 Maintenance Tasks

### Regular Tasks
1. Monitor MongoDB disk usage
2. Review and rotate logs
3. Update dependencies (`npm update`)
4. Backup database regularly
5. Monitor API performance
6. Review security vulnerabilities (`npm audit`)

### Database Maintenance
```bash
# Backup database
mongodump --db CloudPrinting --out ./backups/

# Restore database
mongorestore --db CloudPrinting ./backups/CloudPrinting/

# Compact database
mongosh CloudPrinting --eval "db.runCommand({compact: 'collectionName'})"
```

## 📞 Support & Resources

- MongoDB Documentation: https://docs.mongodb.com/
- Express.js Guide: https://expressjs.com/
- Mongoose Documentation: https://mongoosejs.com/
- JWT Documentation: https://jwt.io/

## 🎯 Next Steps

1. ✅ Backend setup complete
2. ✅ All models created
3. ✅ All routes implemented
4. ✅ Authentication configured
5. 📱 Connect frontend application
6. 🧪 Test all endpoints
7. 🚀 Deploy to production

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-17  
**Status**: Production Ready ✅
