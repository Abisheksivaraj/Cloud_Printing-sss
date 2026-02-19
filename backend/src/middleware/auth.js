const jwt = require("jsonwebtoken");


// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid or expired token.",
                });
            }

            req.user = decoded;
            console.log("Auth Middleware - Decoded User:", JSON.stringify(req.user, null, 2));
            next();
        });
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during authentication.",
        });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    console.log("isAdmin Check - User Role:", req.user?.role);
    // Normalized check
    const role = req.user?.role?.toLowerCase();

    if (role === "admin" || role === "superadmin") {
        next();
    } else {
        console.log("isAdmin Failed - Role mismatch:", req.user?.role);
        res.status(403).json({
            success: false,
            message: `Access denied. Admin privileges required. Current role: ${req.user?.role}`,
        });
    }
};

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === "superadmin") {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: "Access denied. Super admin privileges required.",
        });
    }
};

module.exports = {
    authenticateToken,
    isAdmin,
    isSuperAdmin,
};
