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

    // Debounced typing state management
    // Stores timeout IDs to manage debouncing per receiver
    _typingTimeouts: {},

    // Emit typing event with debouncing
    // Strategy: Emit "typing" immediately on first keystroke, then debounce "stopTyping"
    // This ensures the indicator appears immediately but doesn't flicker
    emitTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        const timeouts = get()._typingTimeouts;

        // Clear any existing stop-typing timeout
        if (timeouts[receiverId]) {
            clearTimeout(timeouts[receiverId]);
        }

        // Only emit "typing" if we haven't recently
        if (!timeouts[`${receiverId}_active`]) {
            socket.emit("typing", { receiverId });
            // Mark as active (prevent spam)
            timeouts[`${receiverId}_active`] = true;
        }

        // Set a timeout to emit "stopTyping" after 1 second of no activity
        timeouts[receiverId] = setTimeout(() => {
            socket.emit("stopTyping", { receiverId });
            delete timeouts[`${receiverId}_active`];
            delete timeouts[receiverId];
        }, 1000); // 1 second debounce for stop typing

        set({ _typingTimeouts: timeouts });
    },

    // Emit stop typing event (called when user clears input or sends message)
    emitStopTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        const timeouts = get()._typingTimeouts;

        // Clear any pending timeout
        if (timeouts[receiverId]) {
            clearTimeout(timeouts[receiverId]);
            delete timeouts[receiverId];
        }
        delete timeouts[`${receiverId}_active`];

        socket.emit("stopTyping", { receiverId });
        set({ _typingTimeouts: timeouts });
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
            audio: messageData.audio,
            audioDuration: messageData.audioDuration,
            video: messageData.video,
            videoDuration: messageData.videoDuration,
            file: messageData.file,
            fileName: messageData.fileName,
            fileType: messageData.fileType,
            fileSize: messageData.fileSize,
            location: messageData.location,
            disappearAfter: messageData.disappearAfter,
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
            // Update local chat's unread count to 0
            set({
                chats: get().chats.map(c =>
                    c._id === senderId ? { ...c, unreadCount: 0 } : c
                )
            });
        } catch (error) {
            console.log("Error marking messages as read:", error);
        }
    },

    // Delete a message (instant, no confirmation)
    deleteMessage: async (messageId) => {
        const { messages } = get();
        // Optimistically remove message from UI
        set({ messages: messages.filter(msg => msg._id !== messageId) });

        try {
            await axiosInstance.delete(`/messages/${messageId}`);
            // No toast - instant delete
        } catch (error) {
            // Silently fail - message already removed from UI
            console.log("Error deleting message:", error);
        }
    },

    // Clear entire chat with a user
    clearChat: async (partnerId) => {
        try {
            await axiosInstance.delete(`/messages/chat/${partnerId}`);
            // Clear messages from local state
            set({ messages: [] });
            toast.success("Chat cleared");
            // Refresh chat partners list
            get().getMyChatPartners();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to clear chat");
        }
    },

    // Edit a message
    editMessage: async (messageId, newText) => {
        const { messages } = get();
        const originalMessages = [...messages];

        // Optimistically update the message
        set({
            messages: messages.map(msg =>
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
            set({ messages: originalMessages });
            toast.error(error.response?.data?.message || "Failed to edit message");
        }
    },

    // Add/remove reaction to a message
    addReaction: async (messageId, emoji) => {
        const { messages } = get();
        const { authUser } = useAuthStore.getState();

        try {
            const res = await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
            // Update local state with new reactions
            set({
                messages: messages.map(msg =>
                    msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
                )
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add reaction");
        }
    },

    // Toggle pin on a message
    togglePin: async (messageId) => {
        const { messages } = get();

        try {
            const res = await axiosInstance.post(`/messages/${messageId}/pin`);
            set({
                messages: messages.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned: res.data.isPinned } : msg
                )
            });
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to toggle pin");
        }
    },

    // Toggle star on a message
    toggleStar: async (messageId) => {
        const { messages } = get();
        const { authUser } = useAuthStore.getState();

        try {
            const res = await axiosInstance.post(`/messages/${messageId}/star`);
            // Update starredBy in local state
            set({
                messages: messages.map(msg => {
                    if (msg._id === messageId) {
                        const starredBy = msg.starredBy || [];
                        if (res.data.isStarred) {
                            return { ...msg, starredBy: [...starredBy, authUser._id] };
                        } else {
                            return { ...msg, starredBy: starredBy.filter(id => id !== authUser._id) };
                        }
                    }
                    return msg;
                })
            });
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to toggle star");
        }
    },

    // Forward a message
    forwardMessage: async (messageId, receiverId, groupId) => {
        try {
            const res = await axiosInstance.post(`/messages/${messageId}/forward`, { receiverId, groupId });
            toast.success("Message forwarded");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to forward message");
            return null;
        }
    },

    // Search messages
    searchMessages: async (partnerId, query) => {
        try {
            const res = await axiosInstance.get(`/messages/search/${partnerId}?q=${encodeURIComponent(query)}`);
            return res.data;
        } catch (error) {
            console.log("Error searching messages:", error);
            return [];
        }
    },

    // Get pinned messages
    getPinnedMessages: async (partnerId) => {
        try {
            const res = await axiosInstance.get(`/messages/pinned/${partnerId}`);
            return res.data;
        } catch (error) {
            console.log("Error fetching pinned messages:", error);
            return [];
        }
    },

    // Get starred messages
    getStarredMessages: async () => {
        try {
            const res = await axiosInstance.get("/messages/starred");
            return res.data;
        } catch (error) {
            console.log("Error fetching starred messages:", error);
            return [];
        }
    },

    // Reply to message state
    replyingTo: null,
    setReplyingTo: (message) => set({ replyingTo: message }),
    clearReplyingTo: () => set({ replyingTo: null }),

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

        // Listen for message deleted events
        socket.on("messageDeleted", ({ messageId, chatPartnerId }) => {
            const { selectedUser } = get();
            // Only remove from current messages if viewing this chat
            if (selectedUser && selectedUser._id === chatPartnerId) {
                set({
                    messages: get().messages.filter(msg => msg._id !== messageId)
                });
            }
        });

        // Listen for message edited events
        socket.on("messageEdited", ({ messageId, text, isEdited, editedAt, chatPartnerId }) => {
            const { selectedUser } = get();
            // Only update if viewing this chat
            if (selectedUser && selectedUser._id === chatPartnerId) {
                set({
                    messages: get().messages.map(msg =>
                        msg._id === messageId
                            ? { ...msg, text, isEdited, editedAt }
                            : msg
                    )
                });
            }
        });

        // Listen for reaction events
        socket.on("messageReaction", ({ messageId, reactions }) => {
            set({
                messages: get().messages.map(msg =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                )
            });
        });

        // Listen for pin events
        socket.on("messagePinned", ({ messageId, isPinned, pinnedAt, pinnedBy }) => {
            set({
                messages: get().messages.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned, pinnedAt, pinnedBy } : msg
                )
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("messagesDelivered");
        socket.off("messagesRead");
        socket.off("userTyping");
        socket.off("userStopTyping");
        socket.off("messageDeleted");
        socket.off("messageEdited");
        socket.off("messageReaction");
        socket.off("messagePinned");
    },

    // Global subscription for updating chat list in real-time
    // This runs always, not just when a chat is open
    subscribeToGlobalMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Listen for new messages to update chat list
        socket.on("newGlobalMessage", (message) => {
            const { selectedUser, chats, isSoundEnabled } = get();
            const { authUser } = useAuthStore.getState();

            // Update chats list
            const senderId = message.senderId;
            const existingChatIndex = chats.findIndex(c => c._id === senderId);

            if (existingChatIndex !== -1) {
                // Update existing chat
                const updatedChats = [...chats];
                const chat = { ...updatedChats[existingChatIndex] };
                chat.lastMessage = message.text || (message.image ? "📷 Image" : "");
                chat.lastMessageAt = message.createdAt;

                // Increment unread count only if not currently viewing this chat
                if (!selectedUser || selectedUser._id !== senderId) {
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                }

                // Remove from current position and add to top
                updatedChats.splice(existingChatIndex, 1);
                updatedChats.unshift(chat);
                set({ chats: updatedChats });
            } else {
                // New chat partner - refresh the list
                get().getMyChatPartners();
            }

            // Play sound if not viewing this chat
            if (isSoundEnabled && (!selectedUser || selectedUser._id !== senderId)) {
                const notificationSound = new Audio("sounds/notification.mp3");
                notificationSound.play().catch((e) => console.log("Audio play failed:", e));
            }
        });
    },

    unsubscribeFromGlobalMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("newGlobalMessage");
        }
    },

}));


