import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    "AZURE_OPENAI_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
    "GROQ_API_KEY",
    "TAVILY_API_KEY"
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
}

export const config = {
    // Azure OpenAI
    azure: {
        apiKey: process.env.AZURE_OPENAI_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        instanceName: process.env.AZURE_OPENAI_ENDPOINT.match(/https:\/\/(.+?)\.openai/)?.[1] || "abhijith-openai"
    },
    
    // Pinecone
    pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        indexName: process.env.PINECONE_INDEX_NAME
    },
    
    // Groq
    groq: {
        apiKey: process.env.GROQ_API_KEY
    },
    
    // Tavily
    tavily: {
        apiKey: process.env.TAVILY_API_KEY
    },
    
    // Server
    server: {
        port: process.env.PORT || 3003,
        chatifyUrl: process.env.CHATIFY_MAIN_URL || "http://localhost:3001"
    }
};

console.log("✅ Environment configuration loaded");
