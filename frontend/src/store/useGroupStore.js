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

    setSelectedGroup: (group) => set({ selectedGroup: group }),

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
            set({ groups: [res.data, ...get().groups] });
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

    // Subscribe to group events
    subscribeToGroups: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newGroup", (group) => {
            set({ groups: [group, ...get().groups] });
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
            if (get().selectedGroup?._id === groupId) {
                set({ groupMessages: [...get().groupMessages, message] });
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
