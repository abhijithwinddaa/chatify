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
    markGroupMessagesAsRead,
    getPublicGroups,
    joinPublicGroup,
    inviteToGroup,
    acceptInvite,
    declineInvite,
    regenerateInviteCode,
    getGroupByInviteCode,
    joinByInviteCode,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProjection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// PUBLIC ROUTES (no auth required)
// Invite link preview - allows anyone to see group info before logging in
router.get("/invite/:inviteCode", arcjetProjection, getGroupByInviteCode);

// PROTECTED ROUTES (auth required)
router.use(arcjetProjection, protectRoute);

// Public groups route (must be before /:id to avoid conflict)
router.get("/public", getPublicGroups);         // Get all public groups

// Join by invite code (requires auth to actually join)
router.post("/join-by-code/:inviteCode", joinByInviteCode); // Join group via invite code

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

// Public group join route
router.post("/:id/join", joinPublicGroup);          // Join public group directly

// Invite routes
router.post("/:id/invite", inviteToGroup);          // Admin invites user
router.post("/:id/accept-invite", acceptInvite);    // User accepts invite
router.post("/:id/decline-invite", declineInvite);  // User declines invite
router.post("/:id/regenerate-invite", regenerateInviteCode); // Regenerate invite code (admin)

// Group messaging routes
router.get("/:id/messages", getGroupMessages);      // Get group messages
router.post("/:id/messages", sendGroupMessage);     // Send message to group
router.post("/:id/read", markGroupMessagesAsRead);  // Mark group messages as read

export default router;

