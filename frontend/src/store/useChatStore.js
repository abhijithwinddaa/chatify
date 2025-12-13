import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";


const notificationSound = new Audio("sounds/notification.mp3");

export const useChatStore = create((set, get) => ({
    allContacts: [],
    chats: [],
    messages: [],
    activeTab: "chats",
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
    typingUsers: {}, // { oderId: true } - tracks which users are currently typing

    toggleSound: () => {
        localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
        set({ isSoundEnabled: !get().isSoundEnabled });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedUser: (selectedUser) => set({ selectedUser }),

    // Typing indicator actions
    setUserTyping: (userId) => {
        set({ typingUsers: { ...get().typingUsers, [userId]: true } });
    },

    setUserStopTyping: (userId) => {
        const newTypingUsers = { ...get().typingUsers };
        delete newTypingUsers[userId];
        set({ typingUsers: newTypingUsers });
    },

    // Emit typing event to receiver
    emitTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.emit("typing", { receiverId });
        }
    },

    // Emit stop typing event to receiver
    emitStopTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.emit("stopTyping", { receiverId });
        }
    },

    getAllContacts: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/contacts");
            set({ allContacts: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ isUsersLoading: false });
        }
    },
    getMyChatPartners: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/chats");
            set({ chats: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessagesByUserId: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        const { authUser } = useAuthStore.getState();

        const tempId = `temp-${Date.now()}`;

        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            status: "sent",
            isOptimistic: true,
        };
        // immediately update the UI by adding the message
        set({ messages: [...messages, optimisticMessage] });

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: messages.concat(res.data) });
        } catch (error) {
            set({ messages: messages })
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    },

    // Mark messages from sender as read when opening chat
    markAsRead: async (senderId) => {
        try {
            await axiosInstance.put(`/messages/read/${senderId}`);
        } catch (error) {
            console.log("Error marking messages as read:", error);
        }
    },

    // Update message statuses in the current messages array
    updateMessageStatuses: (senderId, newStatus) => {
        const { messages } = get();
        const { authUser } = useAuthStore.getState();

        const updatedMessages = messages.map(msg => {
            // Only update messages sent BY the current user TO the receiver
            if (msg.senderId === authUser._id && msg.receiverId === senderId) {
                return { ...msg, status: newStatus };
            }
            return msg;
        });

        set({ messages: updatedMessages });
    },

    subscribeToMessages: () => {
        const { selectedUser, isSoundEnabled } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            const currentMessages = get().messages;
            set({ messages: [...currentMessages, newMessage] });


            if (isSoundEnabled) {
                notificationSound.currentTime = 0; // reset to start
                notificationSound.play().catch((e) => console.log("Audio play failed:", e));
            }
        });

        // Listen for message delivered status updates
        socket.on("messagesDelivered", ({ receiverId }) => {
            get().updateMessageStatuses(receiverId, "delivered");
        });

        // Listen for message read status updates
        socket.on("messagesRead", ({ receiverId }) => {
            get().updateMessageStatuses(receiverId, "read");
        });

        // Listen for typing indicator events
        socket.on("userTyping", ({ userId }) => {
            get().setUserTyping(userId);
        });

        socket.on("userStopTyping", ({ userId }) => {
            get().setUserStopTyping(userId);
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("messagesDelivered");
        socket.off("messagesRead");
        socket.off("userTyping");
        socket.off("userStopTyping");
    },

}));


