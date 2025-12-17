import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
} from "../controllers/notification.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get all notifications
router.get("/", getNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.patch("/:notificationId/read", markAsRead);

// Mark all as read
router.patch("/read-all", markAllAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

// Clear all notifications
router.delete("/", clearAllNotifications);

export default router;
