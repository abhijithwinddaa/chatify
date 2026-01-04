import { tavily } from "@tavily/core";
import { config } from "../config/env.js";

// Initialize Tavily client
const tvly = tavily({ apiKey: config.tavily.apiKey });

/**
 * Search the web for latest information
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return
 * @returns {string} Formatted search results
 */
export async function webSearch(query, maxResults = 5) {
    try {
        console.log(`🔍 Web search: "${query}"`);

        const response = await tvly.search(query, { maxResults });

        const formattedResults = response.results
            .map((result, i) => `[${i + 1}] ${result.title}\n${result.content}`)
            .join("\n\n");

        return formattedResults;
    } catch (error) {
        console.error("Web search error:", error.message);
        throw error;
    }
}

/**
 * Quick search for factual answers
 * @param {string} query - Search query
 * @returns {string} Answer
 */
export async function quickAnswer(query) {
    try {
        const response = await tvly.searchQNA(query);
        return response;
    } catch (error) {
        console.error("Quick answer error:", error.message);
        throw error;
    }
}

console.log("✅ Web search service initialized (Tavily)");
