const mongoose = require("mongoose");

const printJobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    printerName: {
        type: String,
        required: true,
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabelTemplate",
        default: null,
    },
    documentName: {
        type: String,
        required: true,
    },
    documentType: {
        type: String,
        enum: ["label", "document", "barcode", "qrcode", "custom"],
        default: "label",
    },
    copies: {
        type: Number,
        default: 1,
    },
    status: {
        type: String,
        enum: ["pending", "printing", "completed", "failed", "cancelled"],
        default: "pending",
    },
    priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal",
    },
    printSettings: {
        paperSize: String,
        orientation: String,
        quality: String,
        color: Boolean,
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    errorMessage: {
        type: String,
        default: null,
    },
    startedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate unique job ID before saving
printJobSchema.pre("save", function (next) {
    if (!this.jobId) {
        this.jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

const PrintJob = mongoose.model("PrintJob", printJobSchema);
module.exports = PrintJob;
