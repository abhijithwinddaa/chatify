import express from 'express';
import {
    getAllContacts,
    getMessagesByUserId,
    sendMessage,
    getChatPartners,
    markAsDelivered,
    markAsRead,
    deleteMessage,
    clearChat,
    clearGroupChat,
    editMessage,
    addReaction,
    togglePin,
    toggleStar,
    getStarredMessages,
    forwardMessage,
    searchMessages,
    getPinnedMessages
} from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { arcjetProjection } from '../middleware/arcjet.middleware.js';

const router = express.Router();

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.

router.use(arcjetProjection, protectRoute);

// Core routes
router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/starred", getStarredMessages);              // Get starred messages
router.get("/search/:partnerId", searchMessages);        // Search messages in chat
router.get("/pinned/:partnerId", getPinnedMessages);     // Get pinned messages in chat
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

// Message status routes
router.put("/delivered/:senderId", markAsDelivered);     // Mark messages from sender as delivered
router.put("/read/:senderId", markAsRead);               // Mark messages from sender as read

// Message action routes
router.post("/:messageId/reactions", addReaction);       // Add/remove reaction
router.post("/:messageId/pin", togglePin);               // Toggle pin
router.post("/:messageId/star", toggleStar);             // Toggle star
router.post("/:messageId/forward", forwardMessage);      // Forward message
router.put("/:messageId", editMessage);                  // Edit a message

// Delete routes
router.delete("/chat/:partnerId", clearChat);            // Clear entire chat with a user
router.delete("/group/:groupId/clear", clearGroupChat);  // Clear all messages in a group
router.delete("/:messageId", deleteMessage);             // Delete single message

export default router;