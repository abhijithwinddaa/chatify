import { searchMessages } from "./vectorStore.js";
import { generateResponse, simpleCompletion } from "./llm.js";
import { webSearch } from "./webSearch.js";
import { getMemory, saveMemory, addToMemory } from "./memory.js";
import { detectPersona, PERSONAS } from "./persona.js";

// Web search tool definition for function calling
const WEB_SEARCH_TOOL = {
    type: "function",
    function: {
        name: "webSearch",
        description: "Search the web for latest information, news, or current events. Use when chat history doesn't have the answer.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query for web search"
                }
            },
            required: ["query"]
        }
    }
};

// Chat search tool definition
const CHAT_SEARCH_TOOL = {
    type: "function",
    function: {
        name: "searchChats",
        description: "Search the user's chat history for relevant messages. Use to find past conversations, messages, or information discussed in chats.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "What to search for in chat history"
                },
                conversationType: {
                    type: "string",
                    enum: ["private", "group", "all"],
                    description: "Type of chats to search (default: all)"
                }
            },
            required: ["query"]
        }
    }
};

/**
 * Main RAG function - Ask AI with context from chat history
 * @param {Object} params
 * @param {string} params.question - User's question
 * @param {string} params.userId - User ID for filtering
 * @param {string} params.threadId - AI conversation thread ID
 * @param {string} params.conversationType - 'private' | 'group' | null
 * @param {string} params.targetId - Specific chat/group ID (optional)
 */
export async function askWithRAG({ question, userId, threadId, conversationType = null, targetId = null }) {
    // Detect persona from question
    const { persona, cleanMessage } = detectPersona(question);

    // Get AI conversation memory
    let messages = getMemory(threadId);

    // If new conversation, add system prompt
    if (messages.length === 0) {
        messages.push({
            role: "system",
            content: persona.systemPrompt
        });
    }

    // Search chat history for relevant context
    const chatResults = await searchMessages(cleanMessage, userId, conversationType, targetId, 5);

    // Build context from search results
    let chatContext = "";
    if (chatResults.length > 0) {
        chatContext = "\n\n📨 RELEVANT MESSAGES FROM CHAT HISTORY:\n" +
            chatResults.map((r, i) =>
                `[${i + 1}] "${r.text}" (${r.metadata.conversationType}, ${new Date(r.metadata.timestamp).toLocaleDateString()})`
            ).join("\n");
    } else {
        chatContext = "\n\n📨 No relevant messages found in chat history.";
    }

    // Add user message with context
    messages.push({
        role: "user",
        content: cleanMessage + chatContext
    });

    // Call LLM with tools
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        retries++;

        const response = await generateResponse(messages, [WEB_SEARCH_TOOL]);
        const assistantMessage = response.choices[0].message;

        messages.push(assistantMessage);

        // Check for tool calls
        const toolCalls = assistantMessage.tool_calls;

        if (!toolCalls) {
            // No tool calls, return response
            saveMemory(threadId, messages);

            return {
                answer: assistantMessage.content,
                persona: persona.name,
                sources: chatResults.map(r => ({
                    text: r.text,
                    sender: r.metadata.senderId,
                    timestamp: r.metadata.timestamp,
                    type: r.metadata.conversationType
                }))
            };
        }

        // Execute tool calls
        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            let toolResult = "";

            if (functionName === "webSearch") {
                console.log(`🔍 Executing web search: ${args.query}`);
                toolResult = await webSearch(args.query);
            }

            messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: toolResult
            });
        }
    }

    // Max retries reached
    return {
        answer: "I apologize, but I couldn't complete your request. Please try again.",
        persona: persona.name,
        sources: []
    };
}

/**
 * Quick summarize conversation
 * @param {string} userId - User ID
 * @param {string} targetId - Target user or group ID
 * @param {string} conversationType - 'private' or 'group'
 * @param {string} timeRange - 'today' | 'week' | 'month'
 */
export async function summarizeChat(userId, targetId, conversationType, timeRange = "today") {
    // Search for recent messages
    const messages = await searchMessages(
        `conversation ${timeRange}`,
        userId,
        conversationType,
        targetId,
        20
    );

    if (messages.length === 0) {
        return {
            summary: "No messages found for the specified time range.",
            messageCount: 0
        };
    }

    const context = messages.map(m => m.text).join("\n");

    const summary = await simpleCompletion(
        PERSONAS.summarizer.systemPrompt,
        `Summarize these chat messages:\n\n${context}`
    );

    return {
        summary,
        messageCount: messages.length
    };
}

console.log("✅ Chat RAG service initialized");
