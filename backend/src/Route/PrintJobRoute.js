const express = require("express");
const router = express.Router();
const PrintJob = require("../Models/PrintJob");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Get all print jobs
router.get("/api/print-jobs", authenticateToken, async (req, res) => {
    try {
        const { status, userId } = req.query;

        const filter = {};
        if (status) filter.status = status;

        // Regular users can only see their own jobs
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            filter.userId = req.user.id;
        } else if (userId) {
            filter.userId = userId;
        }

        const jobs = await PrintJob.find(filter)
            .populate("userId", "userName email")
            .populate("templateId", "name category")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error("Error fetching print jobs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch print jobs",
            error: error.message,
        });
    }
});

// Get single print job
router.get("/api/print-jobs/:id", authenticateToken, async (req, res) => {
    try {
        const job = await PrintJob.findById(req.params.id)
            .populate("userId", "userName email")
            .populate("templateId", "name category");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Print job not found",
            });
        }

        // Check if user has permission to view this job
        if (
            req.user.role !== "admin" &&
            req.user.role !== "superadmin" &&
            job.userId._id.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this job",
            });
        }

        res.status(200).json({
            success: true,
            job,
        });
    } catch (error) {
        console.error("Error fetching print job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch print job",
            error: error.message,
        });
    }
});

// Create new print job
router.post("/api/print-jobs", authenticateToken, async (req, res) => {
    try {
        const {
            printerName,
            templateId,
            documentName,
            documentType,
            copies,
            priority,
            printSettings,
            fileSize,
        } = req.body;

        if (!printerName || !documentName) {
            return res.status(400).json({
                success: false,
                message: "Printer name and document name are required",
            });
        }

        const newJob = new PrintJob({
            userId: req.user.id,
            printerName,
            templateId: templateId || null,
            documentName,
            documentType: documentType || "label",
            copies: copies || 1,
            priority: priority || "normal",
            printSettings: printSettings || {},
            fileSize: fileSize || 0,
            status: "pending",
        });

        await newJob.save();

        res.status(201).json({
            success: true,
            message: "Print job created successfully",
            job: newJob,
        });
    } catch (error) {
        console.error("Error creating print job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create print job",
            error: error.message,
        });
    }
});

// Update print job status
router.put("/api/print-jobs/:id/status", authenticateToken, async (req, res) => {
    try {
        const { status, errorMessage } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        const updateData = { status };

        if (status === "printing" && !req.body.startedAt) {
            updateData.startedAt = Date.now();
        }

        if (status === "completed" || status === "failed") {
            updateData.completedAt = Date.now();
        }

        if (errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        const job = await PrintJob.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Print job not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Print job status updated",
            job,
        });
    } catch (error) {
        console.error("Error updating print job status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update print job status",
            error: error.message,
        });
    }
});

// Cancel print job
router.post("/api/print-jobs/:id/cancel", authenticateToken, async (req, res) => {
    try {
        const job = await PrintJob.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Print job not found",
            });
        }

        // Check if user has permission to cancel this job
        if (
            req.user.role !== "admin" &&
            req.user.role !== "superadmin" &&
            job.userId.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to cancel this job",
            });
        }

        if (job.status === "completed" || job.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a completed or already cancelled job",
            });
        }

        job.status = "cancelled";
        job.completedAt = Date.now();
        await job.save();

        res.status(200).json({
            success: true,
            message: "Print job cancelled successfully",
            job,
        });
    } catch (error) {
        console.error("Error cancelling print job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel print job",
            error: error.message,
        });
    }
});

// Delete print job (Admin only)
router.delete("/api/print-jobs/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const job = await PrintJob.findByIdAndDelete(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Print job not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Print job deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting print job:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete print job",
            error: error.message,
        });
    }
});

// Get print job statistics
router.get("/api/print-jobs/stats/summary", authenticateToken, async (req, res) => {
    try {
        const filter = {};

        // Regular users can only see their own stats
        if (req.user.role !== "admin" && req.user.role !== "superadmin") {
            filter.userId = req.user.id;
        }

        const total = await PrintJob.countDocuments(filter);
        const pending = await PrintJob.countDocuments({ ...filter, status: "pending" });
        const printing = await PrintJob.countDocuments({ ...filter, status: "printing" });
        const completed = await PrintJob.countDocuments({ ...filter, status: "completed" });
        const failed = await PrintJob.countDocuments({ ...filter, status: "failed" });
        const cancelled = await PrintJob.countDocuments({ ...filter, status: "cancelled" });

        res.status(200).json({
            success: true,
            stats: {
                total,
                pending,
                printing,
                completed,
                failed,
                cancelled,
            },
        });
    } catch (error) {
        console.error("Error fetching print job statistics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message,
        });
    }
});

module.exports = router;
