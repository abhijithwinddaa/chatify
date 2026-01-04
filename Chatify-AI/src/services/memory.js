import NodeCache from "node-cache";

// 24-hour TTL for conversation memory
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });

/**
 * Get conversation history for a thread
 * @param {string} threadId - Unique conversation ID
 * @returns {Array} Message history
 */
export function getMemory(threadId) {
    return cache.get(threadId) || [];
}

/**
 * Save conversation history
 * @param {string} threadId - Unique conversation ID
 * @param {Array} messages - Message history
 */
export function saveMemory(threadId, messages) {
    cache.set(threadId, messages);
}

/**
 * Add message to conversation
 * @param {string} threadId - Unique conversation ID
 * @param {Object} message - Message to add
 */
export function addToMemory(threadId, message) {
    const messages = getMemory(threadId);
    messages.push(message);
    saveMemory(threadId, messages);
}

/**
 * Clear conversation memory
 * @param {string} threadId - Unique conversation ID
 */
export function clearMemory(threadId) {
    cache.del(threadId);
}

/**
 * Check if thread has memory
 * @param {string} threadId - Unique conversation ID
 * @returns {boolean}
 */
export function hasMemory(threadId) {
    return cache.has(threadId);
}

console.log("✅ Memory service initialized (NodeCache - 24h TTL)");
