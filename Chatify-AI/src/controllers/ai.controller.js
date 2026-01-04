import { indexMessage, deleteMessage, searchMessages } from "../services/vectorStore.js";
import { askWithRAG, summarizeChat } from "../services/chatRAG.js";
import { clearMemory } from "../services/memory.js";
import { simpleCompletion } from "../services/llm.js";

/**
 * Health check
 */
export function healthCheck(req, res) {
    res.json({
        status: "ok",
        service: "Chatify-AI",
        timestamp: new Date().toISOString()
    });
}

/**
 * Ask AI (main endpoint)
 * POST /api/ai/ask
 */
export async function ask(req, res) {
    try {
        const { question, userId, threadId, conversationType, targetId } = req.body;

        if (!question || !userId || !threadId) {
            return res.status(400).json({
                error: "Missing required fields: question, userId, threadId"
            });
        }

        console.log(`📥 AI Query: "${question}" (user: ${userId})`);

        const result = await askWithRAG({
            question,
            userId,
            threadId,
            conversationType,
            targetId
        });

        res.json(result);
    } catch (error) {
        console.error("❌ Ask error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Index a new message
 * POST /api/ai/index-message
 */
export async function indexNewMessage(req, res) {
    try {
        const { messageId, text, senderId, receiverId, conversationType, timestamp, groupId } = req.body;

        if (!messageId || !senderId) {
            return res.status(400).json({
                error: "Missing required fields: messageId, senderId"
            });
        }

        // Skip indexing for messages without text
        if (!text || text.trim().length === 0) {
            return res.json({ indexed: false, reason: "No text content" });
        }

        await indexMessage({
            messageId,
            text,
            senderId,
            receiverId,
            conversationType: conversationType || "private",
            timestamp: timestamp || new Date(),
            groupId
        });

        res.json({ indexed: true, messageId });
    } catch (error) {
        console.error("❌ Index error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete message from index
 * DELETE /api/ai/delete-message/:id
 */
export async function deleteMessageFromIndex(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Message ID required" });
        }

        await deleteMessage(id);
        res.json({ deleted: true, messageId: id });
    } catch (error) {
        console.error("❌ Delete error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Summarize a conversation
 * POST /api/ai/summarize
 */
export async function summarize(req, res) {
    try {
        const { userId, targetId, conversationType, timeRange } = req.body;

        if (!userId || !targetId || !conversationType) {
            return res.status(400).json({
                error: "Missing required fields: userId, targetId, conversationType"
            });
        }

        const result = await summarizeChat(userId, targetId, conversationType, timeRange);
        res.json(result);
    } catch (error) {
        console.error("❌ Summarize error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Clear AI conversation memory
 * POST /api/ai/clear-memory
 */
export async function clearAIMemory(req, res) {
    try {
        const { threadId } = req.body;

        if (!threadId) {
            return res.status(400).json({ error: "threadId required" });
        }

        clearMemory(threadId);
        res.json({ cleared: true, threadId });
    } catch (error) {
        console.error("❌ Clear memory error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get AI suggested replies based on recent messages
 * POST /api/ai/suggested-replies
 */
export async function getSuggestedReplies(req, res) {
    try {
        const { userId, targetId, conversationType, recentMessages } = req.body;

        if (!userId || !recentMessages || recentMessages.length === 0) {
            return res.status(400).json({
                error: "Missing required fields: userId, recentMessages"
            });
        }

        // Format recent messages for context
        const context = recentMessages
            .slice(-5) // Last 5 messages
            .map(m => `${m.isOwn ? "You" : "Them"}: ${m.text}`)
            .join("\n");

        const systemPrompt = `You are a reply suggestion assistant. Based on the conversation below, suggest 3 short, natural reply options.

Rules:
- Keep replies under 20 words each
- Match the conversation's tone and language
- Provide variety: one short, one medium, one detailed
- Return ONLY the 3 suggestions, numbered 1-3
- No explanations, just the replies`;

        const suggestions = await simpleCompletion(
            systemPrompt,
            `Conversation:\n${context}\n\nSuggest 3 replies:`
        );

        // Parse the suggestions
        const lines = suggestions.split("\n").filter(l => l.trim());
        const replies = lines
            .map(l => l.replace(/^[0-9]+[\.\)]\s*/, "").trim())
            .filter(l => l.length > 0)
            .slice(0, 3);

        res.json({ suggestions: replies });
    } catch (error) {
        console.error("❌ Suggested replies error:", error);
        res.status(500).json({ error: error.message });
    }
}

