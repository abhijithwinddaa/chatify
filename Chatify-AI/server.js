import express from "express";
import cors from "cors";
import { config } from "./src/config/env.js";
import aiRoutes from "./src/routes/ai.routes.js";

const app = express();

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",  // Vite dev
        "http://localhost:3001",  // CHATIFY backend
        config.server.chatifyUrl
    ],
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/ai", aiRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        name: "Chatify-AI Microservice",
        version: "1.0.0",
        endpoints: [
            "GET  /api/ai/health",
            "POST /api/ai/ask",
            "POST /api/ai/index-message",
            "DELETE /api/ai/delete-message/:id",
            "POST /api/ai/summarize",
            "POST /api/ai/clear-memory"
        ]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`
🤖 ═══════════════════════════════════════════════════════
   CHATIFY-AI MICROSERVICE
   Running on http://localhost:${PORT}
═══════════════════════════════════════════════════════

📡 Endpoints:
   • GET  /api/ai/health         - Health check
   • POST /api/ai/ask            - Ask AI
   • POST /api/ai/index-message  - Index new message
   • DELETE /api/ai/delete-message/:id - Delete from index
   • POST /api/ai/summarize      - Summarize chat
   • POST /api/ai/clear-memory   - Clear AI memory

🔌 Connected to:
   • Azure OpenAI (embeddings)
   • Pinecone (vector store: ${config.pinecone.indexName})
   • Groq (LLM)
   • Tavily (web search)
═══════════════════════════════════════════════════════
    `);
});
