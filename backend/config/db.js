const mongoose = require("mongoose");
require("dotenv").config();

const connectDb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://archerytechnocratspvtltd_db_user:4iXTmb4io5ThbFp6@ac-e15b8cm-shard-00-00.r6nfrfp.mongodb.net:27017,ac-e15b8cm-shard-00-01.r6nfrfp.mongodb.net:27017,ac-e15b8cm-shard-00-02.r6nfrfp.mongodb.net:27017/?ssl=true&replicaSet=atlas-cikqkm-shard-0&authSource=admin&appName=ShanthiGears";
    
    // Connection options for better stability
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);
    
    console.log("✅ MongoDB connected successfully");
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("💡 Make sure MongoDB is running on your system");
    console.error("💡 Run: mongod --dbpath <your-data-path>");
    process.exit(1);
  }
};

module.exports = connectDb;