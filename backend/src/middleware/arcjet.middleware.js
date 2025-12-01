import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProjection = async (req, res, next) => {
  try {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit())
        return res
          .status(429)
          .json({ message: "Too many requests. Please try again later." });
      else if (decision.reason.isBot()) {
        return res.status(403).json({ message: "Bot access denied." });
      } else {
        return res
          .status(403)
          .json({ message: "Access denied by security policy." });
      }
    }

    // check for spoofed bots
    if (decision.results && decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        error: "Spoofed bot detected",
        message: "Spoofed bot access denied.",
      });
    }

    next();
  } catch (error) {
    console.log("Arcjet projection error:", error);
    next();
  }
};
