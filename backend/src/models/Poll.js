import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
    {
        // The group this poll belongs to
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        // Who created the poll
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Poll question
        question: {
            type: String,
            required: true,
            maxLength: 300,
        },
        // Poll options
        options: [{
            text: {
                type: String,
                required: true,
                maxLength: 100,
            },
            votes: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }]
        }],
        // Poll settings
        allowMultipleVotes: {
            type: Boolean,
            default: false,
        },
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        // Poll end time (optional)
        endsAt: {
            type: Date,
        },
        // Poll status
        isEnded: {
            type: Boolean,
            default: false,
        },
        endedAt: {
            type: Date,
        },
        // Total vote count (for quick access)
        totalVotes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for faster queries
pollSchema.index({ groupId: 1, createdAt: -1 });

const Poll = mongoose.models.Poll || mongoose.model("Poll", pollSchema);

export default Poll;
