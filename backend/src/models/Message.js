import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // Not required for group messages
        },
        // Group message support
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },
        isGroupMessage: {
            type: Boolean,
            default: false,
        },
        text: {
            type: String,
            trim: true,
            maxLength: 2000,
        },
        image: {
            type: String,
        },
        // Voice message support
        audio: {
            type: String, // Cloudinary URL for audio file
        },
        audioDuration: {
            type: Number, // Duration in seconds
        },
        // Message status: sent → delivered → read
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },
        deliveredAt: {
            type: Date,
        },
        readAt: {
            type: Date,
        },
        // For group messages: track which users have read this message
        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        // Track which users have deleted this message from their view (soft delete)
        deletedFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        // Track if message has been edited
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
        },
        // Message reactions (emoji reactions from users)
        reactions: [{
            emoji: { type: String, required: true },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        }],
        // Reply to another message
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        // Pin message in chat
        isPinned: {
            type: Boolean,
            default: false,
        },
        pinnedAt: {
            type: Date,
        },
        pinnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        // Starred/Bookmarked by users
        starredBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        // Forwarded message
        isForwarded: {
            type: Boolean,
            default: false,
        },
        forwardedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },

        // ========== NEW FEATURES ==========

        // Video message support
        video: {
            type: String, // Cloudinary URL for video file
        },
        videoDuration: {
            type: Number, // Duration in seconds
        },
        videoThumbnail: {
            type: String, // Thumbnail image URL
        },

        // File attachment support (PDF, DOC, etc.)
        file: {
            type: String, // Cloudinary URL for file
        },
        fileName: {
            type: String, // Original file name
        },
        fileType: {
            type: String, // MIME type (application/pdf, etc.)
        },
        fileSize: {
            type: Number, // Size in bytes
        },

        // Disappearing messages (5min to 24hr)
        expiresAt: {
            type: Date, // When message should be deleted
            index: { expires: 0 } // TTL index - MongoDB auto-deletes
        },
        disappearAfter: {
            type: Number, // Duration in minutes (5, 15, 60, 360, 1440)
        },

        // Scheduled messages
        scheduledAt: {
            type: Date, // When to send the message
        },
        isScheduled: {
            type: Boolean,
            default: false,
        },

        // Location sharing
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String }, // Optional address text
            isLiveLocation: { type: Boolean, default: false },
            liveUntil: { type: Date }, // When live location expires
        },

        // Translation support
        translatedText: {
            type: String, // Translated version of text
        },
        originalLanguage: {
            type: String, // Detected language code (en, hi, etc.)
        },
        translatedTo: {
            type: String, // Language code it was translated to
        },
    },
    { timestamps: true }
);

// Index for faster querying
messageSchema.index({ groupId: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;

