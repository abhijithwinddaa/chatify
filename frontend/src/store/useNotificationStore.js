import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

/**
 * Zustand store for notifications
 * 
 * Manages:
 * - Notification list
 * - Unread count
 * - Accept/decline invites
 * - Real-time updates
 */
export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    // Fetch all notifications
    getNotifications: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/notifications");
            set({ notifications: res.data });
            // Update unread count
            const unread = res.data.filter(n => !n.isRead).length;
            set({ unreadCount: unread });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch notifications");
        } finally {
            set({ isLoading: false });
        }
    },

    // Get unread count only
    getUnreadCount: async () => {
        try {
            const res = await axiosInstance.get("/notifications/unread-count");
            set({ unreadCount: res.data.count });
        } catch (error) {
            console.log("Error fetching unread count:", error);
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            await axiosInstance.patch(`/notifications/${notificationId}/read`);
            set({
                notifications: get().notifications.map(n =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, get().unreadCount - 1)
            });
        } catch (error) {
            console.log("Error marking as read:", error);
        }
    },

    // Mark all as read
    markAllAsRead: async () => {
        try {
            await axiosInstance.patch("/notifications/read-all");
            set({
                notifications: get().notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            });
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        try {
            await axiosInstance.delete(`/notifications/${notificationId}`);
            const notif = get().notifications.find(n => n._id === notificationId);
            set({
                notifications: get().notifications.filter(n => n._id !== notificationId),
                unreadCount: notif && !notif.isRead ? get().unreadCount - 1 : get().unreadCount
            });
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    },

    // Clear all notifications
    clearAllNotifications: async () => {
        try {
            await axiosInstance.delete("/notifications");
            set({ notifications: [], unreadCount: 0 });
            toast.success("All notifications cleared");
        } catch (error) {
            toast.error("Failed to clear notifications");
        }
    },

    // Accept group invite
    acceptInvite: async (groupId) => {
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/accept-invite`);
            // Update notification status
            set({
                notifications: get().notifications.map(n =>
                    n.groupId?._id === groupId && n.type === "group_invite"
                        ? { ...n, actionStatus: "accepted", isRead: true }
                        : n
                )
            });
            toast.success("Joined the group!");
            return res.data; // Returns the group
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept invite");
            return null;
        }
    },

    // Decline group invite
    declineInvite: async (groupId) => {
        try {
            await axiosInstance.post(`/groups/${groupId}/decline-invite`);
            // Update notification status
            set({
                notifications: get().notifications.map(n =>
                    n.groupId?._id === groupId && n.type === "group_invite"
                        ? { ...n, actionStatus: "declined", isRead: true }
                        : n
                )
            });
            toast.success("Invite declined");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to decline invite");
        }
    },

    // Add new notification (called from socket)
    addNotification: (notification) => {
        set({
            notifications: [notification, ...get().notifications],
            unreadCount: get().unreadCount + 1
        });
    },

    // Subscribe to notification events
    subscribeToNotifications: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newNotification", (notification) => {
            get().addNotification(notification);
            // Show toast for important notifications
            if (notification.type === "group_invite") {
                toast(`📬 ${notification.message}`, { icon: "🔔" });
            }
        });
    },

    // Unsubscribe from notification events
    unsubscribeFromNotifications: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newNotification");
    },
}));
