const mongoose = require("mongoose");

const printJobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
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
    totalRecords: {
        type: Number,
        default: 0,
    },
    printedRecords: {
        type: Number,
        default: 0,
    },
    printedLength: {
        type: Number, // in mm
        default: 0,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    sourceData: {
        type: Array, // Stores the imported rows and mapping for re-printing
        default: [],
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

// Generate unique 5-digit job ID before validation
printJobSchema.pre("validate", function (next) {
    if (!this.jobId) {
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        this.jobId = `JOB-${randomDigits}`;
    }
    next();
});

const PrintJob = mongoose.model("PrintJob", printJobSchema);
module.exports = PrintJob;
