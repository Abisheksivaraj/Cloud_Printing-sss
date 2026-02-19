const express = require("express");
const router = express.Router();
const LabelTemplate = require("../Models/LabelTemplate");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Get all label templates
router.get("/api/templates", authenticateToken, async (req, res) => {
    try {
        const { category, isPublic } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (isPublic !== undefined) filter.isPublic = isPublic === "true";

        const templates = await LabelTemplate.find(filter)
            .populate("createdBy", "userName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: templates.length,
            templates,
        });
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch templates",
            error: error.message,
        });
    }
});

// Get single template
router.get("/api/templates/:id", authenticateToken, async (req, res) => {
    try {
        const template = await LabelTemplate.findById(req.params.id)
            .populate("createdBy", "userName email");

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }

        res.status(200).json({
            success: true,
            template,
        });
    } catch (error) {
        console.error("Error fetching template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch template",
            error: error.message,
        });
    }
});

// Create new template (Admin only)
router.post("/api/templates", authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            dimensions,
            fields,
            elements,
            previewImage,
            isPublic,
        } = req.body;

        if (!name || !dimensions || !dimensions.width || !dimensions.height) {
            return res.status(400).json({
                success: false,
                message: "Name and dimensions are required",
            });
        }

        const newTemplate = new LabelTemplate({
            name,
            description,
            category,
            dimensions,
            fields: fields || [],
            elements: elements || [], // Accept elements directly
            previewImage,
            isPublic: isPublic !== undefined ? isPublic : true,
            createdBy: req.user.id,
        });

        await newTemplate.save();

        res.status(201).json({
            success: true,
            message: "Template created successfully",
            template: newTemplate,
        });
    } catch (error) {
        console.error("Error creating template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create template",
            error: error.message,
        });
    }
});

// Update template (Admin only)
router.put("/api/templates/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            dimensions,
            fields,
            elements,
            previewImage,
            isPublic,
        } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (category) updateData.category = category;
        if (dimensions) updateData.dimensions = dimensions;
        if (fields) updateData.fields = fields;
        if (elements) updateData.elements = elements;
        if (previewImage !== undefined) updateData.previewImage = previewImage;
        if (isPublic !== undefined) updateData.isPublic = isPublic;

        const template = await LabelTemplate.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Template updated successfully",
            template,
        });
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update template",
            error: error.message,
        });
    }
});

// Delete template (Admin only)
router.delete("/api/templates/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const template = await LabelTemplate.findByIdAndDelete(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Template deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete template",
            error: error.message,
        });
    }
});

// Increment usage count
router.post("/api/templates/:id/use", authenticateToken, async (req, res) => {
    try {
        const template = await LabelTemplate.findByIdAndUpdate(
            req.params.id,
            { $inc: { usageCount: 1 } },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Usage count updated",
            usageCount: template.usageCount,
        });
    } catch (error) {
        console.error("Error updating usage count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update usage count",
            error: error.message,
        });
    }
});

// Get popular templates
router.get("/api/templates/popular/list", authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const templates = await LabelTemplate.find({ isPublic: true })
            .sort({ usageCount: -1 })
            .limit(limit)
            .populate("createdBy", "userName");

        res.status(200).json({
            success: true,
            count: templates.length,
            templates,
        });
    } catch (error) {
        console.error("Error fetching popular templates:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch popular templates",
            error: error.message,
        });
    }
});

module.exports = router;
