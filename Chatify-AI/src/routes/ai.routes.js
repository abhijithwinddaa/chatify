import express from "express";
import {
    healthCheck,
    ask,
    indexNewMessage,
    deleteMessageFromIndex,
    summarize,
    clearAIMemory,
    getSuggestedReplies
} from "../controllers/ai.controller.js";
import { askLimiter, indexLimiter, summarizeLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Health check
router.get("/health", healthCheck);

// Main AI endpoints (with rate limiting)
router.post("/ask", askLimiter, ask);
router.post("/index-message", indexLimiter, indexNewMessage);
router.delete("/delete-message/:id", deleteMessageFromIndex);
router.post("/summarize", summarizeLimiter, summarize);
router.post("/clear-memory", clearAIMemory);

// Suggested replies
router.post("/suggested-replies", askLimiter, getSuggestedReplies);

export default router;

