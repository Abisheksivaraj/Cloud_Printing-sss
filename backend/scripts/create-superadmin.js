const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/Models/User');

const createSuperAdmin = async () => {
    try {
        // Assume default mongodb url if env is missing
        const dbUrl = process.env.DB_CONNECTION_STRING || "mongodb://localhost:27017/cloud_printing";
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB.");

        const email = "superadmin@atpl.com";
        const password = "SuperAdmin123!";

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log("✅ Super Admin already exists with this email!");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = new User({
            firstName: "Super",
            lastName: "Admin",
            userName: "super_admin_root",
            email: email,
            password: hashedPassword,
            companyName: "ATPL Global",
            role: "superadmin",
            isActive: true,
            needsPasswordSet: false
        });

        await superAdmin.save();
        console.log("🚀 Super Admin created successfully!");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating super admin:", error);
        process.exit(1);
    }
};

createSuperAdmin();
