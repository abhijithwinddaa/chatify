import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { embeddings } from "./embedding.js";
import { config } from "../config/env.js";

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: config.pinecone.apiKey
});

// Get reference to the index
const pineconeIndex = pinecone.Index(config.pinecone.indexName);

// Initialize vector store
export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5
});

/**
 * Index a chat message for RAG
 * @param {Object} message - Message data
 */
export async function indexMessage({ messageId, text, senderId, receiverId, conversationType, timestamp, groupId }) {
    if (!text || text.trim().length === 0) {
        console.log("⚠️ Skipping empty message");
        return null;
    }

    try {
        await vectorStore.addDocuments([{
            pageContent: text,
            metadata: {
                messageId: messageId.toString(),
                senderId: senderId.toString(),
                receiverId: receiverId ? receiverId.toString() : null,
                groupId: groupId ? groupId.toString() : null,
                conversationType, // 'private' or 'group'
                timestamp: new Date(timestamp).toISOString()
            }
        }]);

        console.log(`✅ Indexed message: ${messageId}`);
        return true;
    } catch (error) {
        console.error("Index error:", error.message);
        throw error;
    }
}

/**
 * Search for relevant messages
 * @param {string} query - Search query
 * @param {string} userId - User ID for filtering
 * @param {string} conversationType - 'private' or 'group'
 * @param {string} targetId - Specific user or group ID (optional)
 * @param {number} limit - Number of results
 * @param {Object} timeRange - Time range filter { range: 'today'|'week'|'month', dateFrom, dateTo }
 */
export async function searchMessages(query, userId, conversationType = null, targetId = null, limit = 5, timeRange = null) {
    try {
        // Build filter based on conversation type
        let filter = {};

        if (conversationType === "private") {
            // Search private messages only (sent or received by user)
            filter = {
                conversationType: { $eq: "private" },
                $or: [
                    { senderId: { $eq: userId } },
                    { receiverId: { $eq: userId } }
                ]
            };

            // If targeting specific user, add that filter
            if (targetId) {
                filter = {
                    conversationType: { $eq: "private" },
                    $or: [
                        { $and: [{ senderId: { $eq: userId } }, { receiverId: { $eq: targetId } }] },
                        { $and: [{ senderId: { $eq: targetId } }, { receiverId: { $eq: userId } }] }
                    ]
                };
            }
        } else if (conversationType === "group") {
            // Search group messages only
            filter = {
                conversationType: { $eq: "group" },
                senderId: { $eq: userId }
            };

            if (targetId) {
                filter.groupId = { $eq: targetId };
            }
        } else {
            // Search all user's messages
            filter = {
                $or: [
                    { senderId: { $eq: userId } },
                    { receiverId: { $eq: userId } }
                ]
            };
        }

        // Add time range filter
        if (timeRange) {
            let dateFrom, dateTo;
            const now = new Date();

            if (timeRange.range === "today") {
                dateFrom = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                dateTo = new Date().toISOString();
            } else if (timeRange.range === "week") {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFrom = weekAgo.toISOString();
                dateTo = new Date().toISOString();
            } else if (timeRange.range === "month") {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFrom = monthAgo.toISOString();
                dateTo = new Date().toISOString();
            } else if (timeRange.dateFrom && timeRange.dateTo) {
                dateFrom = new Date(timeRange.dateFrom).toISOString();
                dateTo = new Date(timeRange.dateTo).toISOString();
            }

            if (dateFrom && dateTo) {
                // Note: Pinecone requires numeric comparison for proper timestamp filtering
                // We store as ISO string, so we compare lexicographically (works for ISO format)
                filter.timestamp = { $gte: dateFrom, $lte: dateTo };
            }
        }

        const results = await vectorStore.similaritySearch(query, limit, filter);

        return results.map(r => ({
            text: r.pageContent,
            metadata: r.metadata,
            score: r.score
        }));
    } catch (error) {
        console.error("Search error:", error.message);
        throw error;
    }
}

/**
 * Delete message from vector store
 * @param {string} messageId - Message ID to delete
 */
export async function deleteMessage(messageId) {
    try {
        await pineconeIndex.deleteOne(messageId.toString());
        console.log(`✅ Deleted message from index: ${messageId}`);
        return true;
    } catch (error) {
        console.error("Delete error:", error.message);
        throw error;
    }
}

console.log(`✅ Vector store initialized (Pinecone: ${config.pinecone.indexName})`);
