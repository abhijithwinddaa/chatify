import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


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

        const message = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(message);
    } catch (error) {
        console.log("Error fetching contacts:", error);
        res.status(500).json({ message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const { text, image } = req.body;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required." });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send messages to yourself." });
        }
        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        // todo: send message to receiver if user is online - socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json(newMessage);
    } catch (error) {
        console.log("Error fetching contacts:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId },
                { receiverId: loggedInUserId }
            ]
        }).sort({ createdAt: -1 });

        const chatPartnerIds = [...new Set(messages.map(message => {
            if (message.senderId.toString() === loggedInUserId.toString()) {
                return message.receiverId;
            } else {
                return message.senderId;
            }
        }))];

        const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

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