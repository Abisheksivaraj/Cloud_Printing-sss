const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./src/Models/User");
const Admin = require("./src/Models/Admin");

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not defined in .env! Tried path:", path.join(__dirname, ".env"));
    process.exit(1);
  }
  
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");
    
    console.log("\n--- ADMINS ---");
    const admins = await Admin.find({}, { password: 0 });
    console.log(JSON.stringify(admins, null, 2));
    
    console.log("\n--- USERS ---");
    const users = await User.find({}, { password: 0 });
    console.log(JSON.stringify(users, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
