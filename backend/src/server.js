const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDb = require("../config/db");
const app = require("./index");

const PORT = process.env.PORT || 8081;

app.listen(PORT, async () => {
  await connectDb();
  console.log("=".repeat(50));
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=".repeat(50));
});
