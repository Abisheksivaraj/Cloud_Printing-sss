const express = require("express");
const router = express.Router();
const Asset = require("../Models/Asset");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Get all assets
router.get("/api/assets", authenticateToken, async (req, res) => {
    try {
        const { status, assetType, companyId } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (assetType) filter.assetType = assetType;

        // Filter by company if not admin
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            filter.companyId = req.user.id;
        } else if (companyId) {
            filter.companyId = companyId;
        }

        const assets = await Asset.find(filter)
            .populate("assignedTo", "userName email")
            .populate("companyId", "userName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: assets.length,
            assets,
        });
    } catch (error) {
        console.error("Error fetching assets:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assets",
            error: error.message,
        });
    }
});

// Get single asset
router.get("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate("assignedTo", "userName email")
            .populate("companyId", "userName")
            .populate("movementHistory.movedBy", "userName");

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found",
            });
        }

        res.status(200).json({
            success: true,
            asset,
        });
    } catch (error) {
        console.error("Error fetching asset:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch asset",
            error: error.message,
        });
    }
});

// Get asset by barcode or QR code
router.get("/api/assets/scan/:code", authenticateToken, async (req, res) => {
    try {
        const { code } = req.params;

        const asset = await Asset.findOne({
            $or: [{ barcode: code }, { qrCode: code }],
        })
            .populate("assignedTo", "userName email")
            .populate("companyId", "userName")
            .populate("movementHistory.movedBy", "userName");

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found with this code",
            });
        }

        res.status(200).json({
            success: true,
            asset,
        });
    } catch (error) {
        console.error("Error scanning asset:", error);
        res.status(500).json({
            success: false,
            message: "Failed to scan asset",
            error: error.message,
        });
    }
});

// Create new asset
router.post("/api/assets", authenticateToken, async (req, res) => {
    try {
        const {
            assetId,
            assetName,
            assetType,
            barcode,
            qrCode,
            description,
            location,
            status,
            assignedTo,
            metadata,
        } = req.body;

        if (!assetId || !assetName) {
            return res.status(400).json({
                success: false,
                message: "Asset ID and name are required",
            });
        }

        // Check if asset ID already exists
        const existingAsset = await Asset.findOne({ assetId });
        if (existingAsset) {
            return res.status(400).json({
                success: false,
                message: "Asset with this ID already exists",
            });
        }

        const newAsset = new Asset({
            assetId,
            assetName,
            assetType: assetType || "equipment",
            barcode,
            qrCode,
            description,
            location,
            status: status || "active",
            assignedTo: assignedTo || null,
            companyId: req.user.id,
            metadata: metadata || {},
        });

        await newAsset.save();

        res.status(201).json({
            success: true,
            message: "Asset created successfully",
            asset: newAsset,
        });
    } catch (error) {
        console.error("Error creating asset:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create asset",
            error: error.message,
        });
    }
});

// Update asset
router.put("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
        const {
            assetName,
            assetType,
            barcode,
            qrCode,
            description,
            location,
            status,
            assignedTo,
            metadata,
        } = req.body;

        const updateData = {};
        if (assetName) updateData.assetName = assetName;
        if (assetType) updateData.assetType = assetType;
        if (barcode !== undefined) updateData.barcode = barcode;
        if (qrCode !== undefined) updateData.qrCode = qrCode;
        if (description !== undefined) updateData.description = description;
        if (location !== undefined) updateData.location = location;
        if (status) updateData.status = status;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
        if (metadata) updateData.metadata = metadata;

        const asset = await Asset.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        });

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Asset updated successfully",
            asset,
        });
    } catch (error) {
        console.error("Error updating asset:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update asset",
            error: error.message,
        });
    }
});

// Move asset (add to movement history)
router.post("/api/assets/:id/move", authenticateToken, async (req, res) => {
    try {
        const { toLocation, notes } = req.body;

        if (!toLocation) {
            return res.status(400).json({
                success: false,
                message: "Destination location is required",
            });
        }

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found",
            });
        }

        const movement = {
            fromLocation: asset.location || "Unknown",
            toLocation,
            movedBy: req.user.id,
            movedAt: Date.now(),
            notes: notes || "",
        };

        asset.movementHistory.push(movement);
        asset.location = toLocation;

        await asset.save();

        res.status(200).json({
            success: true,
            message: "Asset moved successfully",
            asset,
        });
    } catch (error) {
        console.error("Error moving asset:", error);
        res.status(500).json({
            success: false,
            message: "Failed to move asset",
            error: error.message,
        });
    }
});

// Delete asset (Admin only)
router.delete("/api/assets/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Asset deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting asset:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete asset",
            error: error.message,
        });
    }
});

// Get asset statistics
router.get("/api/assets/stats/summary", authenticateToken, async (req, res) => {
    try {
        const filter = {};

        // Filter by company if not admin
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            filter.companyId = req.user.id;
        }

        const total = await Asset.countDocuments(filter);
        const active = await Asset.countDocuments({ ...filter, status: "active" });
        const inactive = await Asset.countDocuments({ ...filter, status: "inactive" });
        const maintenance = await Asset.countDocuments({ ...filter, status: "maintenance" });
        const retired = await Asset.countDocuments({ ...filter, status: "retired" });

        res.status(200).json({
            success: true,
            stats: {
                total,
                active,
                inactive,
                maintenance,
                retired,
            },
        });
    } catch (error) {
        console.error("Error fetching asset statistics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message,
        });
    }
});

module.exports = router;
