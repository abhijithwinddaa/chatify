import express from 'express';
import { getAllContacts, getMessagesByUserId, sendMessage, getChatPartners, markAsDelivered, markAsRead } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { arcjetProjection } from '../middleware/arcjet.middleware.js';

const router = express.Router();

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.

router.use(arcjetProjection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId)
router.post("/send/:id", sendMessage);

// Message status routes
router.put("/delivered/:senderId", markAsDelivered);  // Mark messages from sender as delivered
router.put("/read/:senderId", markAsRead);            // Mark messages from sender as read

export default router;