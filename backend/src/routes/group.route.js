import express from "express";
import {
    createGroup,
    getMyGroups,
    getGroupById,
    updateGroup,
    addMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    getGroupMessages,
    sendGroupMessage,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProjection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// Apply rate limiting and authentication to all group routes
router.use(arcjetProjection, protectRoute);

// Group CRUD routes
router.post("/", createGroup);               // Create new group
router.get("/", getMyGroups);                // Get all user's groups
router.get("/:id", getGroupById);            // Get group by ID
router.put("/:id", updateGroup);             // Update group (admin only)
router.delete("/:id", deleteGroup);          // Delete group (admin only)

// Member management routes
router.post("/:id/members", addMembers);            // Add members (admin only)
router.delete("/:id/members/:memberId", removeMember);  // Remove member (admin only)
router.post("/:id/leave", leaveGroup);              // Leave group (for non-admin)

// Group messaging routes
router.get("/:id/messages", getGroupMessages);      // Get group messages
router.post("/:id/messages", sendGroupMessage);     // Send message to group

export default router;
