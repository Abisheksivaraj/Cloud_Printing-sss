const mongoose = require("mongoose");

const labelTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    category: {
        type: String,
        enum: ["barcode", "qr", "shipping", "product", "custom"],
        default: "custom",
    },
    dimensions: {
        width: {
            type: Number,
            required: true,
        },
        height: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ["mm", "inch", "px"],
            default: "mm",
        },
    },
    // Flexible elements array to store full designer state
    elements: {
        type: Array,
        default: [],
    },
    // Keep structured fields for backward compatibility or searching if needed
    fields: [
        {
            name: String,
            type: {
                type: String,
                enum: ["text", "barcode", "qrcode", "image", "date", "number"],
            },
            x: Number,
            y: Number,
            width: Number,
            height: Number,
            fontSize: Number,
            fontFamily: String,
            alignment: String,
            defaultValue: String,
        },
    ],
    previewImage: {
        type: String,
        default: null,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        required: true,
    },
    usageCount: {
        type: Number,
        default: 0,
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

labelTemplateSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const LabelTemplate = mongoose.model("LabelTemplate", labelTemplateSchema);
module.exports = LabelTemplate;
