import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAIStore = create((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,
    threadId: null,

    // Initialize thread ID
    initThread: () => {
        let threadId = get().threadId;
        if (!threadId) {
            threadId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            set({ threadId });
        }
        return threadId;
    },

    // Ask AI a question
    askAI: async (question, userId, conversationType = null, targetId = null) => {
        set({ isLoading: true, error: null });

        // Add user message immediately
        const userMessage = { role: "user", content: question };
        set(state => ({ messages: [...state.messages, userMessage] }));

        try {
            const threadId = get().initThread();

            const res = await axiosInstance.post("/ai/ask", {
                question,
                userId,
                threadId,
                conversationType,
                targetId
            });

            // Add AI response
            const aiMessage = {
                role: "assistant",
                content: res.data.answer,
                persona: res.data.persona,
                sources: res.data.sources || []
            };

            set(state => ({
                messages: [...state.messages, aiMessage],
                isLoading: false
            }));

            return res.data;
        } catch (error) {
            const errorMessage = {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                isError: true
            };
            set(state => ({
                messages: [...state.messages, errorMessage],
                isLoading: false,
                error: error.message
            }));
            throw error;
        }
    },

    // Summarize a chat
    summarizeChat: async (userId, targetId, conversationType, timeRange = "today") => {
        set({ isLoading: true, error: null });

        try {
            const res = await axiosInstance.post("/ai/summarize", {
                userId,
                targetId,
                conversationType,
                timeRange
            });

            return res.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    // Clear conversation
    clearConversation: () => {
        const newThreadId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        set({
            messages: [],
            threadId: newThreadId,
            error: null
        });
    },

    // Clear memory on server
    clearMemory: async () => {
        try {
            const threadId = get().threadId;
            if (threadId) {
                await axiosInstance.post("/ai/clear-memory", { threadId });
            }
            get().clearConversation();
        } catch (error) {
            console.error("Error clearing memory:", error);
        }
    }
}));
