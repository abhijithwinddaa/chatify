import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
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

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "50mb" })); // Increased to 50MB for video messages
app.use(express.urlencoded({ limit: "50mb", extended: true })); // For form data
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(passport.initialize()); // Initialize Passport for Google OAuth

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/ai", aiRoutes);

// make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
