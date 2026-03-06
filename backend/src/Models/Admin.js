const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: false,
        unique: true,
        trim: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false,
        default: null,
    },
    mobileNumber: {
        type: String,
        required: false,
    },
    companyName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "superadmin"],
        default: "superadmin",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    currentSessionId: {
        type: String,
        default: null,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'admins' });

adminSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
