const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
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
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin", "superadmin"],
        default: "user",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        default: null,
    },
    inviteToken: {
        type: String,
        default: null,
    },
    inviteExpires: {
        type: Date,
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
});

// Update the updatedAt timestamp before saving
userSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
