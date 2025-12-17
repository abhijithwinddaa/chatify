import cloudinary from "../lib/cloudinary.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createNotification } from "./notification.controller.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import crypto from "crypto";

/**
 * Generate a unique invite code
 */
const generateInviteCode = () => {
    return crypto.randomBytes(8).toString("hex"); // 16 character code
};

/**
 * Create a new group
 * POST /api/groups
 */
export const createGroup = async (req, res) => {
    try {
        const { name, description, memberIds, groupPic, isPublic } = req.body;
        const adminId = req.user._id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Group name is required" });
        }

        // Validate memberIds array
        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "At least one member is required" });
        }

        // Add admin to members if not already included
        const allMembers = [...new Set([adminId.toString(), ...memberIds])];

        // Check member limit
        if (allMembers.length > 50) {
            return res.status(400).json({ message: "Maximum 50 members allowed" });
        }

        // Verify all members exist
        const existingUsers = await User.find({ _id: { $in: allMembers } }).select("_id");
        if (existingUsers.length !== allMembers.length) {
            return res.status(400).json({ message: "One or more members do not exist" });
        }

        // Upload group picture if provided
        let uploadedPic = "";
        if (groupPic) {
            const uploadResponse = await cloudinary.uploader.upload(groupPic);
            uploadedPic = uploadResponse.secure_url;
        }

        // Generate unique invite code
        const inviteCode = generateInviteCode();

        const group = await Group.create({
            name: name.trim(),
            description: description?.trim() || "",
            groupPic: uploadedPic,
            admin: adminId,
            members: allMembers,
            isPublic: Boolean(isPublic),
            inviteCode,
        });


        // Populate and return the created group
        const populatedGroup = await Group.findById(group._id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify all members about new group via Socket.IO
        allMembers.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("newGroup", populatedGroup);
            }
        });

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.log("Error creating group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all groups for current user
 * GET /api/groups
 */
export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({ members: userId })
            .populate("admin", "-password")
            .populate("members", "-password")
            .sort({ updatedAt: -1 });

        // For each group, get last message and unread count
        const groupsWithMetadata = await Promise.all(groups.map(async (group) => {
            // Get last message in this group
            const lastMessage = await Message.findOne({ groupId: group._id })
                .sort({ createdAt: -1 })
                .select("text image createdAt senderId");

            // Count unread messages (messages not read by this user, excluding own messages)
            const unreadCount = await Message.countDocuments({
                groupId: group._id,
                isGroupMessage: true,
                senderId: { $ne: userId },
                readBy: { $nin: [userId] }
            });

            return {
                ...group.toObject(),
                lastMessage: lastMessage?.text || (lastMessage?.image ? "📷 Image" : ""),
                lastMessageAt: lastMessage?.createdAt || group.createdAt,
                unreadCount
            };
        }));

        // Sort by last message time (most recent first)
        groupsWithMetadata.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        res.status(200).json(groupsWithMetadata);
    } catch (error) {
        console.log("Error fetching groups:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get a single group by ID
 * GET /api/groups/:id
 */
export const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id)
            .populate("admin", "-password")
            .populate("members", "-password");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.members.some(m => m._id.toString() === userId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        res.status(200).json(group);
    } catch (error) {
        console.log("Error fetching group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update group info (admin only)
 * PUT /api/groups/:id
 */
export const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, groupPic } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only admin can update
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only admin can update group" });
        }

        // Update fields
        if (name) group.name = name.trim();
        if (description !== undefined) group.description = description.trim();

        // Upload new group picture if provided
        if (groupPic) {
            const uploadResponse = await cloudinary.uploader.upload(groupPic);
            group.groupPic = uploadResponse.secure_url;
        }

        await group.save();

        const updatedGroup = await Group.findById(id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify members about update
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error updating group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Add members to group (admin only)
 * POST /api/groups/:id/members
 */
export const addMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        if (!memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ message: "Member IDs array is required" });
        }

        // Check member limit
        const newTotal = new Set([...group.members.map(m => m.toString()), ...memberIds]).size;
        if (newTotal > group.maxMembers) {
            return res.status(400).json({ message: `Maximum ${group.maxMembers} members allowed` });
        }

        // Verify new members exist
        const existingUsers = await User.find({ _id: { $in: memberIds } }).select("_id");
        const validMemberIds = existingUsers.map(u => u._id.toString());

        // Add new members
        const updatedMembers = [...new Set([...group.members.map(m => m.toString()), ...validMemberIds])];
        group.members = updatedMembers;
        await group.save();

        const updatedGroup = await Group.findById(id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify all members
        updatedMembers.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error adding members:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Remove member from group (admin only)
 * DELETE /api/groups/:id/members/:userId
 */
export const removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        // Can't remove admin
        if (memberId === group.admin.toString()) {
            return res.status(400).json({ message: "Admin cannot be removed" });
        }

        group.members = group.members.filter(m => m.toString() !== memberId);
        await group.save();

        const updatedGroup = await Group.findById(id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify removed member
        const removedSocketId = getReceiverSocketId(memberId);
        if (removedSocketId) {
            io.to(removedSocketId).emit("removedFromGroup", { groupId: id });
        }

        // Notify remaining members
        group.members.forEach(m => {
            const socketId = getReceiverSocketId(m.toString());
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error removing member:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Leave group (for non-admin members)
 * POST /api/groups/:id/leave
 */
export const leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Admin can't leave - must delete group or transfer admin
        if (group.admin.toString() === userId.toString()) {
            return res.status(400).json({ message: "Admin cannot leave. Delete the group or transfer admin." });
        }

        group.members = group.members.filter(m => m.toString() !== userId.toString());
        await group.save();

        // Notify remaining members
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("memberLeft", { groupId: id, userId: userId.toString() });
            }
        });

        res.status(200).json({ message: "Successfully left the group" });
    } catch (error) {
        console.log("Error leaving group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete group (admin only)
 * DELETE /api/groups/:id
 */
export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only admin can delete group" });
        }

        // Notify all members before deletion
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("groupDeleted", { groupId: id });
            }
        });

        // Delete all group messages
        await Message.deleteMany({ groupId: id, isGroupMessage: true });

        // Delete the group
        await Group.findByIdAndDelete(id);

        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.log("Error deleting group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get group messages
 * GET /api/groups/:id/messages
 */
export const getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.members.some(m => m.toString() === userId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const messages = await Message.find({
            groupId: id,
            isGroupMessage: true,
            // Filter out messages deleted by current user
            deletedFor: { $ne: userId }
        })
            .populate("senderId", "-password")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error fetching group messages:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Send message to group
 * POST /api/groups/:id/messages
 */
export const sendGroupMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, image } = req.body;
        const senderId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.members.some(m => m.toString() === senderId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required" });
        }

        // Upload image if provided
        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            groupId: id,
            isGroupMessage: true,
            text,
            image: imageUrl,
            status: "sent",
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "-password");

        // Send message to all group members via Socket.IO
        group.members.forEach(memberId => {
            if (memberId.toString() !== senderId.toString()) {
                const socketId = getReceiverSocketId(memberId.toString());
                if (socketId) {
                    io.to(socketId).emit("newGroupMessage", {
                        groupId: id,
                        message: populatedMessage
                    });
                }
            }
        });

        // Update group's updatedAt
        group.updatedAt = new Date();
        await group.save();

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.log("Error sending group message:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark group messages as read
 * POST /api/groups/:id/read
 */
export const markGroupMessagesAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Verify user is member of group
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some(m => m.toString() === userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        // Add user to readBy for all unread messages (not sent by them)
        const result = await Message.updateMany(
            {
                groupId: id,
                isGroupMessage: true,
                senderId: { $ne: userId },
                readBy: { $nin: [userId] }
            },
            {
                $addToSet: { readBy: userId }
            }
        );

        res.status(200).json({
            message: "Messages marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.log("Error marking group messages as read:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all public groups
 * GET /api/groups/public
 */
export const getPublicGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({ isPublic: true })
            .populate("admin", "fullName profilePic")
            .sort({ createdAt: -1 });

        // Add isMember flag for each group
        const groupsWithMembership = groups.map(group => ({
            ...group.toObject(),
            isMember: group.members.some(m => m.toString() === userId.toString())
        }));

        res.status(200).json(groupsWithMembership);
    } catch (error) {
        console.log("Error fetching public groups:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Join a public group directly
 * POST /api/groups/:id/join
 */
export const joinPublicGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.isPublic) {
            return res.status(403).json({ message: "This is a private group. You need an invite to join." });
        }

        // Check if already a member
        if (group.members.some(m => m.toString() === userId.toString())) {
            return res.status(400).json({ message: "You are already a member of this group" });
        }

        // Check member limit
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: "Group is full" });
        }

        // Add user to group
        group.members.push(userId);
        await group.save();

        const updatedGroup = await Group.findById(id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify all members about new member
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        // Create notification for admin about new member
        const joiningUser = await User.findById(userId).select("fullName");
        await createNotification({
            userId: group.admin,
            type: "group_join",
            message: `${joiningUser.fullName} joined "${group.name}"`,
            fromUser: userId,
            groupId: id
        });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error joining group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Invite user to group (sends notification to user)
 * POST /api/groups/:id/invite
 */
export const inviteToGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: inviteeId } = req.body;
        const adminId = req.user._id;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only admin can invite
        if (group.admin.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only admin can invite users" });
        }

        // Check if user exists
        const invitee = await User.findById(inviteeId).select("fullName");
        if (!invitee) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already a member
        if (group.members.some(m => m.toString() === inviteeId)) {
            return res.status(400).json({ message: "User is already a member" });
        }

        // Check if invite already pending
        const existingInvite = await Notification.findOne({
            userId: inviteeId,
            groupId: id,
            type: "group_invite",
            actionStatus: "pending"
        });

        if (existingInvite) {
            return res.status(400).json({ message: "Invite already pending" });
        }

        // Create invite notification for the user
        const admin = await User.findById(adminId).select("fullName");
        await createNotification({
            userId: inviteeId,
            type: "group_invite",
            message: `${admin.fullName} invited you to join "${group.name}"`,
            fromUser: adminId,
            groupId: id,
            actionStatus: "pending"
        });

        res.status(200).json({ message: `Invite sent to ${invitee.fullName}` });
    } catch (error) {
        console.log("Error inviting to group:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Accept group invite
 * POST /api/groups/:id/accept-invite
 */
export const acceptInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find the pending invite notification
        const invite = await Notification.findOne({
            userId,
            groupId: id,
            type: "group_invite",
            actionStatus: "pending"
        });

        if (!invite) {
            return res.status(404).json({ message: "No pending invite found" });
        }

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if already a member
        if (group.members.some(m => m.toString() === userId.toString())) {
            // Update invite status
            invite.actionStatus = "accepted";
            await invite.save();
            return res.status(400).json({ message: "You are already a member" });
        }

        // Check member limit
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: "Group is full" });
        }

        // Add user to group
        group.members.push(userId);
        await group.save();

        // Update invite status
        invite.actionStatus = "accepted";
        invite.isRead = true;
        await invite.save();

        const updatedGroup = await Group.findById(id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify user with the new group
        const userSocketId = getReceiverSocketId(userId.toString());
        if (userSocketId) {
            io.to(userSocketId).emit("newGroup", updatedGroup);
        }

        // Notify all members about update
        group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        // Notify admin that user accepted
        const joiningUser = await User.findById(userId).select("fullName");
        await createNotification({
            userId: group.admin,
            type: "group_join",
            message: `${joiningUser.fullName} accepted your invite to "${group.name}"`,
            fromUser: userId,
            groupId: id
        });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error accepting invite:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Decline group invite
 * POST /api/groups/:id/decline-invite
 */
export const declineInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find the pending invite notification
        const invite = await Notification.findOne({
            userId,
            groupId: id,
            type: "group_invite",
            actionStatus: "pending"
        });

        if (!invite) {
            return res.status(404).json({ message: "No pending invite found" });
        }

        // Update invite status
        invite.actionStatus = "declined";
        invite.isRead = true;
        await invite.save();

        res.status(200).json({ message: "Invite declined" });
    } catch (error) {
        console.log("Error declining invite:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Regenerate group invite code (admin only)
 * POST /api/groups/:id/regenerate-invite
 */
export const regenerateInviteCode = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only admin can regenerate invite code
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only admin can regenerate invite link" });
        }

        // Generate new code
        const newCode = generateInviteCode();
        group.inviteCode = newCode;
        await group.save();

        res.status(200).json({
            message: "Invite link regenerated",
            inviteCode: newCode
        });
    } catch (error) {
        console.log("Error regenerating invite code:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get group info by invite code (for preview before joining)
 * GET /api/groups/invite/:inviteCode
 */
export const getGroupByInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({ inviteCode })
            .populate("admin", "fullName profilePic")
            .select("name description groupPic members isPublic admin");

        if (!group) {
            return res.status(404).json({ message: "Invalid or expired invite link" });
        }

        // Check if user is already a member
        const isMember = group.members.some(m => m.toString() === userId.toString());

        res.status(200).json({
            ...group.toObject(),
            memberCount: group.members.length,
            isMember
        });
    } catch (error) {
        console.log("Error getting group by invite code:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Join group using invite code
 * POST /api/groups/join/:inviteCode
 */
export const joinByInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({ inviteCode });
        if (!group) {
            return res.status(404).json({ message: "Invalid or expired invite link" });
        }

        // Check if already a member
        if (group.members.some(m => m.toString() === userId.toString())) {
            return res.status(400).json({ message: "You are already a member of this group" });
        }

        // Check member limit
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: "Group is full" });
        }

        // Add user to group
        group.members.push(userId);
        await group.save();

        // Get populated group
        const populatedGroup = await Group.findById(group._id)
            .populate("admin", "-password")
            .populate("members", "-password");

        // Notify the new member
        const socketId = getReceiverSocketId(userId.toString());
        if (socketId) {
            io.to(socketId).emit("newGroup", populatedGroup);
        }

        res.status(200).json(populatedGroup);
    } catch (error) {
        console.log("Error joining by invite code:", error);
        res.status(500).json({ message: error.message });
    }
};
