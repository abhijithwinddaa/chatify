import Groq from "groq-sdk";
import { config } from "../config/env.js";

// Initialize Groq client
const groq = new Groq({ apiKey: config.groq.apiKey });

/**
 * Generate response using Groq LLM (Llama 3.3 70B)
 * @param {Array} messages - Conversation messages
 * @param {Array} tools - Optional tool definitions
 * @returns {Object} LLM response
 */
export async function generateResponse(messages, tools = null) {
    try {
        const options = {
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            messages
        };

        if (tools && tools.length > 0) {
            options.tools = tools;
            options.tool_choice = "auto";
        }

        const response = await groq.chat.completions.create(options);
        return response;
    } catch (error) {
        console.error("LLM error:", error.message);
        throw error;
    }
}

/**
 * Simple completion without tools
 * @param {string} systemPrompt - System prompt
 * @param {string} userMessage - User message
 * @returns {string} AI response text
 */
export async function simpleCompletion(systemPrompt, userMessage) {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ]
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Simple completion error:", error.message);
        throw error;
    }
}

console.log("✅ LLM service initialized (Groq - Llama 3.3 70B)");
