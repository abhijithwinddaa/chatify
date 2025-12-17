import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
    {
        // Owner of this template
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Template name for quick identification
        name: {
            type: String,
            required: true,
            maxLength: 50,
        },
        // The actual message text
        text: {
            type: String,
            required: true,
            maxLength: 500,
        },
        // Category for organization
        category: {
            type: String,
            enum: ["greeting", "closing", "response", "general"],
            default: "general",
        },
        // Shortcut key (optional) - e.g., "/hello" triggers this template
        shortcut: {
            type: String,
            maxLength: 20,
        },
        // Usage count for sorting by popularity
        useCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for faster lookup
templateSchema.index({ userId: 1, category: 1 });
templateSchema.index({ userId: 1, shortcut: 1 });

const Template = mongoose.models.Template || mongoose.model("Template", templateSchema);

export default Template;
