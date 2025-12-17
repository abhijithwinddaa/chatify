import Notification from "../models/Notification.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/**
 * Get all notifications for current user
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ userId })
            .populate("fromUser", "fullName profilePic")
            .populate("groupId", "name groupPic")
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error in getNotifications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({
            userId,
            isRead: false
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error("Error in getUnreadCount:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error("Error in markAsRead:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error in markAllAsRead:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Error in deleteNotification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ userId });

        res.status(200).json({ message: "All notifications cleared" });
    } catch (error) {
        console.error("Error in clearAllNotifications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Helper function to create and emit notification
 */
export const createNotification = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();

        // Populate for socket emission
        await notification.populate("fromUser", "fullName profilePic");
        await notification.populate("groupId", "name groupPic");

        // Emit real-time notification
        const receiverSocketId = getReceiverSocketId(data.userId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newNotification", notification);
        }

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
};
