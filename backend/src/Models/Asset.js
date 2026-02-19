const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
    assetId: {
        type: String,
        required: true,
        unique: true,
    },
    assetName: {
        type: String,
        required: true,
    },
    assetType: {
        type: String,
        enum: ["equipment", "inventory", "tool", "vehicle", "other"],
        default: "equipment",
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true,
    },
    qrCode: {
        type: String,
        unique: true,
        sparse: true,
    },
    description: {
        type: String,
        default: "",
    },
    location: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["active", "inactive", "maintenance", "retired"],
        default: "active",
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        required: true,
    },
    movementHistory: [
        {
            fromLocation: String,
            toLocation: String,
            movedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            movedAt: {
                type: Date,
                default: Date.now,
            },
            notes: String,
        },
    ],
    metadata: {
        type: Map,
        of: String,
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

assetSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Asset = mongoose.model("Asset", assetSchema);
module.exports = Asset;
