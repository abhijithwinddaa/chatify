import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Chatify-AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3003";

/**
 * Proxy all AI requests to Chatify-AI microservice
 * This keeps authentication in main backend while forwarding to AI service
 */

// Ask AI
router.post("/ask", protectRoute, async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("AI service error:", error);
        res.status(503).json({ error: "AI service unavailable" });
    }
});

// Index message (called internally by message controllers)
router.post("/index-message", async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/index-message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("AI index error:", error);
        res.status(503).json({ error: "AI service unavailable" });
    }
});

// Summarize chat
router.post("/summarize", protectRoute, async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/summarize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("AI summarize error:", error);
        res.status(503).json({ error: "AI service unavailable" });
    }
});

// Clear AI memory
router.post("/clear-memory", protectRoute, async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/clear-memory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("AI clear memory error:", error);
        res.status(503).json({ error: "AI service unavailable" });
    }
});

// Get suggested replies
router.post("/suggested-replies", protectRoute, async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/suggested-replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("AI suggested replies error:", error);
        res.status(503).json({ error: "AI service unavailable" });
    }
});

// Health check (public)
router.get("/health", async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/health`);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(503).json({ status: "unavailable", error: "AI service not running" });
    }
});

export default router;
