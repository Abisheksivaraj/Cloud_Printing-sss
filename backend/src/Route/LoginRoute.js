const express = require("express");
const route = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const Admin = require("../Models/Admin");
const crypto = require("crypto");
const { authenticateToken } = require("../middleware/auth");

// Check system status (e.g., if superadmin exists)
route.get("/system/status", async (req, res) => {
  try {
    const superAdminExists = await Admin.exists({ role: "superadmin" });
    res.status(200).json({
      success: true,
      superAdminExists: !!superAdminExists
    });
  } catch (error) {
    console.error("System Status Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

route.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, password } = req.body;

    if (!firstName || !lastName || !email || !companyName || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required (firstName, lastName, email, companyName, password)" });
    }

    // Check if system is locked (superadmin already exists)
    const superAdminExists = await Admin.exists({ role: "superadmin" });
    if (superAdminExists) {
      return res.status(403).json({ message: "Public registration is currently disabled by the administrator" });
    }

    const existingUser = await Admin.findOne({ email }) || await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({
      firstName,
      lastName,
      userName: `${firstName}_${lastName}_${Math.floor(Math.random() * 1000)}`.toLowerCase(), // Generate a unique-ish username
      email: email.toLowerCase(),
      companyName,
      password: hashedPassword,
      role: "superadmin", // Changed to superadmin and saving to Admin model
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        companyName: newUser.companyName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

route.post("/login", async (req, res) => {
  try {
    const { email, password, forceLogin } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    let user = await Admin.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is marked as inactive. Please contact the administrator." });
    }

    // Normal login check first
    if (!user.needsPasswordSet || user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    }

    // Check for active session
    if (user.currentSessionId && !forceLogin) {
      return res.status(409).json({
        message: "Session already active on another device.",
        needsForceLogin: true
      });
    }

    // Handle first-time password set
    if (user.needsPasswordSet && !user.password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.needsPasswordSet = false;
      await user.save();

      console.log(`Password set for new user: ${email}`);
    }

    // Generate unique session ID for this successful login
    const sessionId = crypto.randomUUID();
    user.currentSessionId = sessionId;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionId },
      process.env.SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Forgot password mockup
route.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Admin.findOne({ email: email.toLowerCase() }) || await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security, but user wants functionality
      return res.status(404).json({ message: "User not found" });
    }

    // In a real app, we'd send a reset link. 
    // For this task, we'll just flag the user for a password reset on next login or similar.
    user.needsPasswordSet = true;
    user.password = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset initiated. You can now set a new password by logging in with the email."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Logout endpoint to clear session
route.post("/api/logout", authenticateToken, async (req, res) => {
  try {
    let user = await Admin.findById(req.user.id);
    if (!user) {
      user = await User.findById(req.user.id);
    }

    if (user) {
      user.currentSessionId = null;
      await user.save();
    }
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = route;
