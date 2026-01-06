import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./lib/passport.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import notificationRoutes from "./routes/notification.route.js";
import pollRoutes from "./routes/poll.route.js";
import templateRoutes from "./routes/template.route.js";
import aiRoutes from "./routes/ai.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "50mb" })); // Increased to 50MB for video messages
app.use(express.urlencoded({ limit: "50mb", extended: true })); // For form data
// Allow multiple origins for CORS (custom domain + Vercel)
const allowedOrigins = [
  ENV.CLIENT_URL,
  'https://chatify-rouge.vercel.app',
  'https://chatify.abhijithwinddaa.tech'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(passport.initialize()); // Initialize Passport for Google OAuth

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/ai", aiRoutes);

// Note: Frontend is deployed separately on Vercel
// This backend only serves the API

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
