import mongoose from "mongoose";

/**
 * Group Schema
 * 
 * Represents a chat group with:
 * - name: Group display name
 * - description: Optional group description
 * - groupPic: Group avatar/image
 * - admin: The user who created the group (has special permissions)
 * - members: Array of user IDs who are in the group
 * - maxMembers: Maximum allowed members (default 50, max 250)
 */
const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        groupPic: {
            type: String,
            default: "",
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        maxMembers: {
            type: Number,
            default: 50,
            max: 250,
        },
    },
    { timestamps: true }
);

// Index for faster querying of user's groups
groupSchema.index({ members: 1 });
groupSchema.index({ admin: 1 });

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;
