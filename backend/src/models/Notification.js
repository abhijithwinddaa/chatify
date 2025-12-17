import mongoose from "mongoose";

/**
 * Notification Schema
 * 
 * Stores all user notifications for:
 * - Group invites (accept/decline actions)
 * - Group join activity
 * - System notifications
 */
const notificationSchema = new mongoose.Schema({
    // User who receives this notification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    // Notification type for handling different actions
    type: {
        type: String,
        enum: ["group_invite", "group_join", "group_added", "group_removed", "system"],
        required: true
    },

    // Display message
    message: {
        type: String,
        required: true
    },

    // User who triggered this notification (e.g., admin who invited)
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // Related group (for group notifications)
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },

    // For invite notifications - tracks if user responded
    actionStatus: {
        type: String,
        enum: ["pending", "accepted", "declined", null],
        default: null
    },

    // Read status
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
