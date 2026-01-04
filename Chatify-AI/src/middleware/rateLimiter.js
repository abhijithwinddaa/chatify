import rateLimit from "express-rate-limit";

/**
 * Rate limiter for AI ask endpoint
 * Limits: 20 requests per minute per user
 */
export const askLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: {
        error: "Too many AI requests. Please wait a moment before trying again.",
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use userId from body if available, otherwise IP
        return req.body?.userId || req.ip;
    }
});

/**
 * Rate limiter for index endpoint
 * Limits: 100 requests per minute (for message indexing)
 */
export const indexLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 messages per minute
    message: {
        error: "Too many index requests",
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter for summarize endpoint
 * Limits: 10 requests per minute (expensive operation)
 */
export const summarizeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 summarize requests per minute
    message: {
        error: "Too many summarize requests. Please wait.",
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body?.userId || req.ip
});

console.log("✅ Rate limiters initialized");
