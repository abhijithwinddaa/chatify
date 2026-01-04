import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { config } from "../config/env.js";

// Azure OpenAI Embeddings (1024 dimensions for text-embedding-3-small with reduced output)
export const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiKey: config.azure.apiKey,
    azureOpenAIApiInstanceName: config.azure.instanceName,
    azureOpenAIApiDeploymentName: config.azure.deployment,
    azureOpenAIApiVersion: "2024-02-01",
    dimensions: 1024  // Reduce dimensions to match Pinecone index
});


/**
 * Generate embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 512-dimensional vector
 */
export async function generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
        return null;
    }

    try {
        const vector = await embeddings.embedQuery(text);
        return vector;
    } catch (error) {
        console.error("Embedding error:", error.message);
        throw error;
    }
}

console.log("✅ Embedding service initialized (Azure OpenAI)");
