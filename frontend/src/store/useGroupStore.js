import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

/**
 * Zustand store for group chat functionality
 * 
 * Manages:
 * - Group list and selected group
 * - Group messages
 * - Group CRUD operations
 * - Real-time group events
 */
export const useGroupStore = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    groupMessages: [],
    isLoadingGroups: false,
    isLoadingMessages: false,
    isCreatingGroup: false,
    groupTypingUsers: {}, // { groupId: { oderId: userInfo } }

    setSelectedGroup: (group) => set({ selectedGroup: group }),

    // Group typing indicator actions
    setGroupUserTyping: (groupId, userId, userName) => {
        const current = get().groupTypingUsers[groupId] || {};
        set({
            groupTypingUsers: {
                ...get().groupTypingUsers,
                [groupId]: { ...current, [userId]: userName }
            }
        });
    },

    setGroupUserStopTyping: (groupId, userId) => {
        const current = get().groupTypingUsers[groupId] || {};
        const newTyping = { ...current };
        delete newTyping[userId];
        set({
            groupTypingUsers: {
                ...get().groupTypingUsers,
                [groupId]: newTyping
            }
        });
    },

    // Emit group typing event
    emitGroupTyping: (groupId) => {
        const socket = useAuthStore.getState().socket;
        const authUser = useAuthStore.getState().authUser;
        if (socket && authUser) {
            socket.emit("groupTyping", { groupId, userName: authUser.fullName });
        }
    },

    // Emit group stop typing event
    emitGroupStopTyping: (groupId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.emit("groupStopTyping", { groupId });
        }
    },


    // Fetch all groups for current user
    getMyGroups: async () => {
        set({ isLoadingGroups: true });
        try {
            const res = await axiosInstance.get("/groups");
            set({ groups: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch groups");
        } finally {
            set({ isLoadingGroups: false });
        }
    },

    // Create a new group
    createGroup: async (groupData) => {
        set({ isCreatingGroup: true });
        try {
            const res = await axiosInstance.post("/groups", groupData);
            // Only add if not already in list (socket may add it first)
            const exists = get().groups.some(g => g._id === res.data._id);
            if (!exists) {
                set({ groups: [res.data, ...get().groups] });
            }
            toast.success("Group created successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
            return null;
        } finally {
            set({ isCreatingGroup: false });
        }
    },

    // Get messages for selected group
    getGroupMessages: async (groupId) => {
        set({ isLoadingMessages: true });
        try {
            const res = await axiosInstance.get(`/groups/${groupId}/messages`);
            set({ groupMessages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch messages");
        } finally {
            set({ isLoadingMessages: false });
        }
    },

    // Mark group messages as read and update local unread count
    markGroupMessagesAsRead: async (groupId) => {
        try {
            await axiosInstance.post(`/groups/${groupId}/read`);
            // Update local group's unread count to 0
            set({
                groups: get().groups.map(g =>
                    g._id === groupId ? { ...g, unreadCount: 0 } : g
                )
            });
        } catch (error) {
            console.log("Error marking group messages as read:", error);
        }
    },

    // Send message to group
    sendGroupMessage: async (groupId, messageData) => {
        const { groupMessages } = get();
        const { authUser } = useAuthStore.getState();

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            senderId: authUser,
            groupId,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };
        set({ groupMessages: [...groupMessages, optimisticMessage] });

        try {
            const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
            // Replace optimistic message with real one
            set({
                groupMessages: groupMessages.concat(res.data)
            });
        } catch (error) {
            // Remove optimistic message on error
            set({ groupMessages: groupMessages });
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    // Delete a group message (instant, for current user only)
    deleteGroupMessage: async (messageId) => {
        const { groupMessages } = get();
        // Optimistically remove from UI
        set({ groupMessages: groupMessages.filter(msg => msg._id !== messageId) });

        try {
            await axiosInstance.delete(`/messages/${messageId}`);
        } catch (error) {
            console.log("Error deleting group message:", error);
        }
    },

    // Clear all messages in a group (for current user only)
    clearGroupChat: async (groupId) => {
        try {
            await axiosInstance.delete(`/messages/group/${groupId}/clear`);
            set({ groupMessages: [] });
            toast.success("Group chat cleared");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to clear group chat");
        }
    },

    // Edit a group message
    editGroupMessage: async (messageId, newText) => {
        const { groupMessages } = get();
        const originalMessages = [...groupMessages];

        // Optimistically update the message
        set({
            groupMessages: groupMessages.map(msg =>
                msg._id === messageId
                    ? { ...msg, text: newText, isEdited: true, editedAt: new Date().toISOString() }
                    : msg
            )
        });

        try {
            await axiosInstance.put(`/messages/${messageId}`, { text: newText });
            toast.success("Message edited");
        } catch (error) {
            // Revert on error
            set({ groupMessages: originalMessages });
            toast.error(error.response?.data?.message || "Failed to edit message");
        }
    },

    // Add members to group
    addMembers: async (groupId, memberIds) => {
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberIds });
            set({
                groups: get().groups.map(g => g._id === groupId ? res.data : g),
                selectedGroup: res.data
            });
            toast.success("Members added successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add members");
            return null;
        }
    },

    // Remove member from group
    removeMember: async (groupId, memberId) => {
        try {
            const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
            set({
                groups: get().groups.map(g => g._id === groupId ? res.data : g),
                selectedGroup: res.data
            });
            toast.success("Member removed successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
            return null;
        }
    },

    // Leave group
    leaveGroup: async (groupId) => {
        try {
            await axiosInstance.post(`/groups/${groupId}/leave`);
            set({
                groups: get().groups.filter(g => g._id !== groupId),
                selectedGroup: null
            });
            toast.success("Left the group successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to leave group");
        }
    },

    // Delete group
    deleteGroup: async (groupId) => {
        try {
            await axiosInstance.delete(`/groups/${groupId}`);
            set({
                groups: get().groups.filter(g => g._id !== groupId),
                selectedGroup: null
            });
            toast.success("Group deleted successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete group");
        }
    },

    // Update group info
    updateGroup: async (groupId, updateData) => {
        try {
            const res = await axiosInstance.put(`/groups/${groupId}`, updateData);
            set({
                groups: get().groups.map(g => g._id === groupId ? res.data : g),
                selectedGroup: res.data
            });
            toast.success("Group updated successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update group");
            return null;
        }
    },

    // Get all public groups
    getPublicGroups: async () => {
        try {
            const res = await axiosInstance.get("/groups/public");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch public groups");
            return [];
        }
    },

    // Join a public group
    joinPublicGroup: async (groupId) => {
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/join`);
            // Add group to user's groups list
            set({ groups: [res.data, ...get().groups] });
            toast.success("Joined group successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to join group");
            return null;
        }
    },

    // Invite user to group (admin only)
    inviteToGroup: async (groupId, userId) => {
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/invite`, { userId });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send invite");
            return false;
        }
    },

    // Subscribe to group events
    subscribeToGroups: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newGroup", (group) => {
            // Only add if not already in list (prevents duplicate when creator receives socket event)
            const exists = get().groups.some(g => g._id === group._id);
            if (!exists) {
                set({ groups: [group, ...get().groups] });
            }
        });

        socket.on("groupUpdated", (updatedGroup) => {
            set({
                groups: get().groups.map(g => g._id === updatedGroup._id ? updatedGroup : g),
                selectedGroup: get().selectedGroup?._id === updatedGroup._id ? updatedGroup : get().selectedGroup
            });
        });

        socket.on("groupDeleted", ({ groupId }) => {
            set({
                groups: get().groups.filter(g => g._id !== groupId),
                selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup
            });
        });

        socket.on("removedFromGroup", ({ groupId }) => {
            set({
                groups: get().groups.filter(g => g._id !== groupId),
                selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup
            });
            toast.info("You were removed from a group");
        });

        socket.on("newGroupMessage", ({ groupId, message }) => {
            const { selectedGroup, groups } = get();
            const { authUser } = useAuthStore.getState();

            // If viewing this group, add message to messages list
            if (selectedGroup?._id === groupId) {
                set({ groupMessages: [...get().groupMessages, message] });
            }

            // Update groups list: last message, time, and unread count
            const groupIndex = groups.findIndex(g => g._id === groupId);
            if (groupIndex !== -1) {
                const updatedGroups = [...groups];
                const group = { ...updatedGroups[groupIndex] };

                group.lastMessage = message.text || (message.image ? "📷 Image" : "");
                group.lastMessageAt = message.createdAt;

                // Increment unread if not viewing this group and not own message
                if ((!selectedGroup || selectedGroup._id !== groupId) &&
                    message.senderId?._id !== authUser._id &&
                    message.senderId !== authUser._id) {
                    group.unreadCount = (group.unreadCount || 0) + 1;
                }

                // Move to top
                updatedGroups.splice(groupIndex, 1);
                updatedGroups.unshift(group);
                set({ groups: updatedGroups });
            }
        });
    },

    // Unsubscribe from group events
    unsubscribeFromGroups: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newGroup");
        socket.off("groupUpdated");
        socket.off("groupDeleted");
        socket.off("removedFromGroup");
        socket.off("newGroupMessage");
    },
}));
