import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Chatify-AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3003";

/**
 * Index message to Chatify-AI for RAG search (non-blocking)
 */
async function indexMessageToAI(message, conversationType = "private") {
    try {
        // Only index text messages (skip images/audio only)
        if (!message.text || message.text.trim().length === 0) return;

        await fetch(`${AI_SERVICE_URL}/api/ai/index-message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messageId: message._id.toString(),
                text: message.text,
                senderId: message.senderId.toString(),
                receiverId: message.receiverId?.toString() || null,
                groupId: message.groupId?.toString() || null,
                conversationType,
                timestamp: message.createdAt
            })
        });
        console.log("✅ Message indexed to AI:", message._id);
    } catch (error) {
        // Don't fail message sending if AI service is down
        console.log("⚠️ AI indexing skipped:", error.message);
    }
}

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({
            _id: { $ne: loggedInUserId }
        }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error fetching contacts:", error);
        res.status(500).json({ message: error.message });
    }
};


export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ],
            // Filter out messages deleted by current user
            deletedFor: { $ne: myId }
        })
            .populate("replyTo", "text image senderId")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error fetching messages:", error);
        res.status(500).json({ message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const {
            text, image, audio, audioDuration, replyTo,
            // New fields
            video, videoDuration,
            file, fileName, fileType, fileSize,
            location, // { latitude, longitude, address, isLiveLocation }
            disappearAfter, // minutes: 5, 15, 60, 360, 1440
            scheduledAt // Date for scheduled messages
        } = req.body;
        const senderId = req.user._id;

        // Validate at least one content type
        if (!text && !image && !audio && !video && !file && !location) {
            return res.status(400).json({ message: "Message content is required." });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send messages to yourself." });
        }
        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        // Upload image to Cloudinary
        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        // Upload audio to Cloudinary
        let audioUrl;
        if (audio) {
            const audioUploadResponse = await cloudinary.uploader.upload(audio, {
                resource_type: 'video',
                folder: 'chatify_voice_messages'
            });
            audioUrl = audioUploadResponse.secure_url;
        }

        // Upload video to Cloudinary
        let videoUrl, videoThumbUrl;
        if (video) {
            const videoUploadResponse = await cloudinary.uploader.upload(video, {
                resource_type: 'video',
                folder: 'chatify_video_messages'
            });
            videoUrl = videoUploadResponse.secure_url;
            // Generate thumbnail from video
            videoThumbUrl = videoUploadResponse.secure_url.replace(/\.[^.]+$/, '.jpg');
        }

        // Upload file to Cloudinary
        let fileUrl;
        if (file) {
            const fileUploadResponse = await cloudinary.uploader.upload(file, {
                resource_type: 'raw',
                folder: 'chatify_files'
            });
            fileUrl = fileUploadResponse.secure_url;
        }

        // Calculate expiration time for disappearing messages
        let expiresAt = null;
        if (disappearAfter) {
            expiresAt = new Date(Date.now() + disappearAfter * 60 * 1000);
        }

        // Handle scheduled messages
        const isScheduled = !!scheduledAt && new Date(scheduledAt) > new Date();

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            audio: audioUrl,
            audioDuration: audioDuration || null,
            video: videoUrl,
            videoDuration: videoDuration || null,
            videoThumbnail: videoThumbUrl,
            file: fileUrl,
            fileName: fileName || null,
            fileType: fileType || null,
            fileSize: fileSize || null,
            location: location || null,
            replyTo: replyTo || null,
            expiresAt,
            disappearAfter: disappearAfter || null,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            isScheduled,
        });

        await newMessage.save();

        // Populate replyTo for the response
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("replyTo", "text image senderId");

        // Index to Chatify-AI for RAG (non-blocking)
        indexMessageToAI(populatedMessage, "private");

        // For scheduled messages, don't send in real-time
        if (!isScheduled) {
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", populatedMessage);
                io.to(receiverSocketId).emit("newGlobalMessage", populatedMessage);
            }
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        console.log("Error sending message:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // Get all messages involving this user (excluding group messages)
        const messages = await Message.find({
            isGroupMessage: { $ne: true },
            $or: [
                { senderId: loggedInUserId },
                { receiverId: loggedInUserId }
            ]
        }).sort({ createdAt: -1 });

        // Build a map of chat partners with their last message and unread count
        const chatPartnersMap = new Map();

        for (const message of messages) {
            const partnerId = message.senderId.toString() === loggedInUserId.toString()
                ? message.receiverId.toString()
                : message.senderId.toString();

            if (!chatPartnersMap.has(partnerId)) {
                // Count unread messages from this partner
                const unreadCount = await Message.countDocuments({
                    senderId: partnerId,
                    receiverId: loggedInUserId,
                    status: { $in: ["sent", "delivered"] }
                });

                chatPartnersMap.set(partnerId, {
                    partnerId,
                    lastMessage: message.text || (message.image ? "📷 Image" : ""),
                    lastMessageAt: message.createdAt,
                    unreadCount
                });
            }
        }

        // Get user details for all partners
        const partnerIds = Array.from(chatPartnersMap.keys());
        const users = await User.find({ _id: { $in: partnerIds } }).select("-password");

        // Combine user data with chat metadata
        const chatPartners = users.map(user => ({
            ...user.toObject(),
            lastMessage: chatPartnersMap.get(user._id.toString()).lastMessage,
            lastMessageAt: chatPartnersMap.get(user._id.toString()).lastMessageAt,
            unreadCount: chatPartnersMap.get(user._id.toString()).unreadCount
        }));

        // Sort by last message time (most recent first)
        chatPartners.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        res.status(200).json(chatPartners);
    } catch (error) {
        console.log("Error fetching chat partners:", error);
        res.status(500).json({ message: error.message });
    }
};

// Mark messages as delivered when receiver comes online
export const markAsDelivered = async (req, res) => {
    try {
        const receiverId = req.user._id;
        const { senderId } = req.params;

        // Find all undelivered messages from sender to receiver
        const result = await Message.updateMany(
            {
                senderId,
                receiverId,
                status: "sent"
            },
            {
                $set: {
                    status: "delivered",
                    deliveredAt: new Date()
                }
            }
        );

        // Notify the sender that messages were delivered via Socket.IO
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesDelivered", {
                receiverId: receiverId.toString(),
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: "Messages marked as delivered",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.log("Error marking messages as delivered:", error);
        res.status(500).json({ message: error.message });
    }
};

// Mark messages as read when receiver opens the chat
export const markAsRead = async (req, res) => {
    try {
        const receiverId = req.user._id;
        const { senderId } = req.params;

        // Find all unread messages from sender to receiver
        const result = await Message.updateMany(
            {
                senderId,
                receiverId,
                status: { $in: ["sent", "delivered"] }
            },
            {
                $set: {
                    status: "read",
                    readAt: new Date()
                }
            }
        );

        // Notify the sender that messages were read via Socket.IO
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", {
                receiverId: receiverId.toString(),
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: "Messages marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.log("Error marking messages as read:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a message (soft delete - for current user only)
 * DELETE /api/messages/:messageId
 * Any user in the conversation can delete messages from their view
 */
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Find the message
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Verify user is part of this conversation
        const isParticipant = message.senderId.equals(userId) ||
            message.receiverId?.equals(userId) ||
            (message.isGroupMessage && message.groupId);

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not part of this conversation" });
        }

        // Soft delete - add userId to deletedFor array
        await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: userId }
        });

        res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        console.log("Error deleting message:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Clear all messages in a chat (soft delete for current user)
 * DELETE /api/messages/chat/:partnerId
 */
export const clearChat = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const userId = req.user._id;

        // Update all messages in this conversation to be deleted for current user
        const result = await Message.updateMany(
            {
                $or: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId }
                ]
            },
            {
                $addToSet: { deletedFor: userId }
            }
        );

        res.status(200).json({
            message: "Chat cleared successfully",
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        console.log("Error clearing chat:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Clear all messages in a group (soft delete for current user)
 * DELETE /api/messages/group/:groupId/clear
 */
export const clearGroupChat = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Update all messages in this group to be deleted for current user
        const result = await Message.updateMany(
            { groupId: groupId, isGroupMessage: true },
            { $addToSet: { deletedFor: userId } }
        );

        res.status(200).json({
            message: "Group chat cleared successfully",
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        console.log("Error clearing group chat:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Edit a message (only sender can edit)
 * PUT /api/messages/:messageId
 */
export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message text is required" });
        }

        // Find the message
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Only sender can edit
        if (!message.senderId.equals(userId)) {
            return res.status(403).json({ message: "You can only edit your own messages" });
        }

        // Can't edit image-only messages
        if (!message.text && message.image) {
            return res.status(400).json({ message: "Cannot edit image-only messages" });
        }

        // Update the message
        message.text = text.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        // Emit real-time update via Socket.IO
        const editPayload = {
            messageId: messageId,
            text: message.text,
            isEdited: true,
            editedAt: message.editedAt
        };

        // For DM messages
        if (!message.isGroupMessage && message.receiverId) {
            const receiverSocketId = getReceiverSocketId(message.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageEdited", {
                    ...editPayload,
                    chatPartnerId: message.senderId.toString()
                });
            }
            // Notify sender's other devices
            const senderSocketId = getReceiverSocketId(message.senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageEdited", {
                    ...editPayload,
                    chatPartnerId: message.receiverId.toString()
                });
            }
        }

        // For group messages
        if (message.isGroupMessage && message.groupId) {
            // We need to notify all group members - but we don't have group data here
            // The frontend will handle this via the response
            io.emit("groupMessageEdited", {
                ...editPayload,
                groupId: message.groupId.toString()
            });
        }

        res.status(200).json({
            message: "Message updated",
            data: {
                _id: message._id,
                text: message.text,
                isEdited: message.isEdited,
                editedAt: message.editedAt
            }
        });
    } catch (error) {
        console.log("Error editing message:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Add reaction to a message
 * POST /api/messages/:messageId/reactions
 */
export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            r => r.userId.toString() === userId.toString() && r.emoji === emoji
        );

        if (existingReaction) {
            // Remove the reaction (toggle off)
            message.reactions = message.reactions.filter(
                r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
            );
        } else {
            // Add the reaction
            message.reactions.push({ emoji, userId });
        }

        await message.save();

        // Emit real-time update
        const reactionPayload = {
            messageId,
            reactions: message.reactions
        };

        // For DM messages
        if (!message.isGroupMessage && message.receiverId) {
            const receiverSocketId = getReceiverSocketId(message.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageReaction", reactionPayload);
            }
            const senderSocketId = getReceiverSocketId(message.senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageReaction", reactionPayload);
            }
        }

        // For group messages
        if (message.isGroupMessage && message.groupId) {
            io.emit("groupMessageReaction", {
                ...reactionPayload,
                groupId: message.groupId.toString()
            });
        }

        res.status(200).json({
            message: existingReaction ? "Reaction removed" : "Reaction added",
            reactions: message.reactions
        });
    } catch (error) {
        console.log("Error adding reaction:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Toggle pin on a message
 * POST /api/messages/:messageId/pin
 */
export const togglePin = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        message.isPinned = !message.isPinned;
        if (message.isPinned) {
            message.pinnedAt = new Date();
            message.pinnedBy = userId;
        } else {
            message.pinnedAt = null;
            message.pinnedBy = null;
        }

        await message.save();

        // Emit real-time update
        const pinPayload = {
            messageId,
            isPinned: message.isPinned,
            pinnedAt: message.pinnedAt,
            pinnedBy: message.pinnedBy
        };

        if (!message.isGroupMessage && message.receiverId) {
            const receiverSocketId = getReceiverSocketId(message.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messagePinned", pinPayload);
            }
            const senderSocketId = getReceiverSocketId(message.senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messagePinned", pinPayload);
            }
        }

        if (message.isGroupMessage && message.groupId) {
            io.emit("groupMessagePinned", {
                ...pinPayload,
                groupId: message.groupId.toString()
            });
        }

        res.status(200).json({
            message: message.isPinned ? "Message pinned" : "Message unpinned",
            isPinned: message.isPinned
        });
    } catch (error) {
        console.log("Error toggling pin:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Toggle star on a message
 * POST /api/messages/:messageId/star
 */
export const toggleStar = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const isStarred = message.starredBy.some(id => id.toString() === userId.toString());

        if (isStarred) {
            message.starredBy = message.starredBy.filter(id => id.toString() !== userId.toString());
        } else {
            message.starredBy.push(userId);
        }

        await message.save();

        res.status(200).json({
            message: isStarred ? "Message unstarred" : "Message starred",
            isStarred: !isStarred
        });
    } catch (error) {
        console.log("Error toggling star:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get starred messages for current user
 * GET /api/messages/starred
 */
export const getStarredMessages = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            starredBy: userId,
            deletedFor: { $ne: userId }
        })
            .populate("senderId", "fullName profilePic")
            .populate("receiverId", "fullName profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error fetching starred messages:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Forward a message to another chat
 * POST /api/messages/:messageId/forward
 */
export const forwardMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { receiverId, groupId } = req.body;
        const senderId = req.user._id;

        if (!receiverId && !groupId) {
            return res.status(400).json({ message: "Receiver or group is required" });
        }

        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Create forwarded message
        const forwardedMessage = new Message({
            senderId,
            receiverId: groupId ? null : receiverId,
            groupId: groupId || null,
            isGroupMessage: !!groupId,
            text: originalMessage.text,
            image: originalMessage.image,
            isForwarded: true,
            forwardedFrom: messageId
        });

        await forwardedMessage.save();

        // Populate sender info
        const populatedMessage = await Message.findById(forwardedMessage._id)
            .populate("senderId", "fullName profilePic");

        // Emit to receiver
        if (!groupId && receiverId) {
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", populatedMessage);
            }
        }

        // Emit to group
        if (groupId) {
            io.emit("newGroupMessage", {
                groupId,
                message: populatedMessage
            });
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.log("Error forwarding message:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Search messages in a chat
 * GET /api/messages/search/:partnerId?q=searchQuery
 */
export const searchMessages = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const { q: searchQuery } = req.query;
        const userId = req.user._id;

        if (!searchQuery || searchQuery.trim().length < 2) {
            return res.status(400).json({ message: "Search query must be at least 2 characters" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: userId }
            ],
            text: { $regex: searchQuery, $options: "i" },
            deletedFor: { $ne: userId }
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error searching messages:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get pinned messages in a chat
 * GET /api/messages/pinned/:partnerId
 */
export const getPinnedMessages = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: userId }
            ],
            isPinned: true,
            deletedFor: { $ne: userId }
        })
            .populate("senderId", "fullName profilePic")
            .sort({ pinnedAt: -1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error fetching pinned messages:", error);
        res.status(500).json({ message: error.message });
    }
};