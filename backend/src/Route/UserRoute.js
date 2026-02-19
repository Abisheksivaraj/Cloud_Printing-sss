const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../Models/User");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const crypto = require("crypto");

// Get all users (Admin only)
router.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate("invitedBy", "userName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
});

// Get single user by ID
router.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("invitedBy", "userName email");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message,
        });
    }
});

// Create user (Admin only)
router.post("/api/users", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userName, email, password, companyName, role } = req.body;

        // Validation
        if (!userName || !email || !password || !companyName) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { userName }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email or username already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            userName,
            email,
            password: hashedPassword,
            companyName,
            role: role || "user",
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: newUser._id,
                userName: newUser.userName,
                email: newUser.email,
                companyName: newUser.companyName,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: error.message,
        });
    }
});

// Invite user (Admin only)
router.post("/api/users/invite", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { email, companyName } = req.body;

        if (!email || !companyName) {
            return res.status(400).json({
                success: false,
                message: "Email and company name are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString("hex");
        const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create user with invite token
        const newUser = new User({
            email,
            companyName,
            userName: email.split("@")[0], // Temporary username
            password: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10), // Temporary password
            invitedBy: req.user.id,
            inviteToken,
            inviteExpires,
            isActive: false,
        });

        await newUser.save();

        // In production, send email with invite link
        const inviteLink = `${process.env.FRONTEND_URL}/signup?token=${inviteToken}&email=${email}`;

        res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            inviteLink, // Remove this in production
            inviteToken,
        });
    } catch (error) {
        console.error("Error inviting user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send invitation",
            error: error.message,
        });
    }
});

// Accept invitation and complete signup
router.post("/api/users/accept-invite", async (req, res) => {
    try {
        const { token, userName, password } = req.body;

        if (!token || !userName || !password) {
            return res.status(400).json({
                success: false,
                message: "Token, username, and password are required",
            });
        }

        // Find user by invite token
        const user = await User.findOne({
            inviteToken: token,
            inviteExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired invitation token",
            });
        }

        // Update user
        user.userName = userName;
        user.password = await bcrypt.hash(password, 10);
        user.isActive = true;
        user.inviteToken = null;
        user.inviteExpires = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Account activated successfully",
        });
    } catch (error) {
        console.error("Error accepting invitation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to accept invitation",
            error: error.message,
        });
    }
});

// Update user
router.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
        const { userName, email, companyName, isActive } = req.body;

        // Check if user can update (self or admin)
        if (req.user.id !== req.params.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this user",
            });
        }

        const updateData = {};
        if (userName) updateData.userName = userName;
        if (email) updateData.email = email;
        if (companyName) updateData.companyName = companyName;
        if (typeof isActive !== "undefined" && req.user.role === "admin") {
            updateData.isActive = isActive;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message,
        });
    }
});

// Delete user (Admin only)
router.delete("/api/users/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message,
        });
    }
});

// Update last login
router.post("/api/users/:id/login", authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, {
            lastLogin: Date.now(),
        });

        res.status(200).json({
            success: true,
            message: "Last login updated",
        });
    } catch (error) {
        console.error("Error updating last login:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update last login",
            error: error.message,
        });
    }
});

module.exports = router;
