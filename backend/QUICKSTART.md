# Cloud Printing Backend - Quick Start Guide

## Step 1: Install MongoDB

### Option A: MongoDB Community Server
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a Windows service automatically

### Option B: MongoDB Compass (GUI + Server)
1. Download from: https://www.mongodb.com/try/download/compass
2. Install and launch
3. Connect to: mongodb://localhost:27017

## Step 2: Verify MongoDB is Running

Open Command Prompt and run:
```bash
mongosh
```

If connected successfully, you'll see MongoDB shell.
Type `exit` to quit.

## Step 3: Install Backend Dependencies

Open Command Prompt in the backend folder:
```bash
cd w:\Company\Cloud_Printing-sss\backend
npm install
```

## Step 4: Start the Backend Server

### Development Mode (recommended):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

## Step 5: Test the API

Open browser and go to:
```
http://localhost:8081
```

You should see:
```json
{
  "message": "Cloud Printing Backend API",
  "status": "running",
  "version": "1.0.0"
}
```

## Step 6: Create First Admin Account

Use Postman or cURL:

### Using PowerShell:
```powershell
$body = @{
    userName = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/register" -Method Post -Body $body -ContentType "application/json"
```

### Using cURL:
```bash
curl -X POST http://localhost:8081/register -H "Content-Type: application/json" -d "{\"userName\":\"admin\",\"password\":\"admin123\"}"
```

## Step 7: Login and Get Token

### Using PowerShell:
```powershell
$body = @{
    userName = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/login" -Method Post -Body $body -ContentType "application/json"
```

Copy the token from the response.

## Troubleshooting

### MongoDB not running?
```bash
# Check if MongoDB service is running
net start MongoDB

# Or start it manually
mongod --dbpath C:\data\db
```

### Port 8081 already in use?
Change PORT in .env file:
```
PORT=8082
```

### Dependencies not installed?
```bash
npm install
```

## Next Steps

1. ✅ Backend is running
2. ✅ MongoDB is connected
3. ✅ Admin account created
4. 📱 Start the frontend application
5. 🎉 Begin using the Cloud Printing system

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server (auto-reload)
npm run dev

# Start production server
npm start

# Check MongoDB connection
mongosh

# View all databases
mongosh --eval "show dbs"

# View collections in CloudPrinting database
mongosh CloudPrinting --eval "show collections"
```

## API Endpoints Quick Reference

- POST /register - Register admin
- POST /login - Login
- GET /api/users - Get all users (requires auth)
- GET /api/printers - Get connected printers
- GET /api/templates - Get label templates
- GET /api/print-jobs - Get print jobs
- GET /api/assets - Get assets

For full API documentation, see README.md
