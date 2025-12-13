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
    },
    { timestamps: true }
);

// Index for faster querying
messageSchema.index({ groupId: 1, createdAt: 1 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;

