const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Increase the JSON payload size limit to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "*",
  "https://perfectlabeler.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.split(",").map(url => url.trim()).includes(origin))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Static files middleware
app.use(
  express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
        res.setHeader("Content-Type", "image/jpeg");
      }
      if (path.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      }
    },
  }),
);

// Import routes
const loginRoute = require("./Route/LoginRoute");
const userRoute = require("./Route/UserRoute");
const printerRoute = require("./Route/PrinterRoute");
const templateRoute = require("./Route/TemplateRoute");
const printJobRoute = require("./Route/PrintJobRoute");
const assetRoute = require("./Route/AssetRoute");
const aiRoute = require("./Route/AIRoute");

// Use routes
app.use(loginRoute);
app.use(userRoute);
app.use(printerRoute);
app.use(templateRoute);
app.use(printJobRoute);
app.use(assetRoute);
app.use(aiRoute);

// Health check endpoint
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Cloud Printing Backend API",
    status: "running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  return res.status(200).json({
    message: "Cloud Printing API",
    version: "1.0.0",
    endpoints: {
      auth: ["/register", "/login"],
      users: ["/api/users", "/api/users/:id", "/api/users/invite"],
      printers: ["/api/printers", "/api/printer/:printerName/info"],
      templates: ["/api/templates", "/api/templates/:id"],
      printJobs: ["/api/print-jobs", "/api/print-jobs/:id"],
      assets: ["/api/assets", "/api/assets/:id", "/api/assets/scan/:code"],
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;
