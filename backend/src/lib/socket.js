import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// Allow same origins as Express CORS
const allowedOrigins = [
    ENV.CLIENT_URL,
    'https://chatify-rouge.vercel.app',
    'https://chatify.abhijithwinddaa.tech'
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// this is for storing online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
    console.log("A user connected", socket.user.fullName);

    const userId = socket.userId;
    userSocketMap[userId] = socket.id;

    // io.emit() is used to send events to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Typing indicator: when user starts typing
    socket.on("typing", ({ receiverId }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", { userId: socket.userId });
        }
    });

    // Typing indicator: when user stops typing
    socket.on("stopTyping", ({ receiverId }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStopTyping", { userId: socket.userId });
        }
    });

    // Group typing indicator: when user starts typing in a group
    socket.on("groupTyping", ({ groupId, userName }) => {
        // Broadcast to all connected users (they'll filter by groupId)
        socket.broadcast.emit("groupUserTyping", {
            groupId,
            userId: socket.userId,
            userName
        });
    });

    // Group typing indicator: when user stops typing in a group
    socket.on("groupStopTyping", ({ groupId }) => {
        socket.broadcast.emit("groupUserStopTyping", {
            groupId,
            userId: socket.userId
        });
    });

    // ========== WebRTC Calling Signaling ==========

    // Initiate a call
    socket.on("call-user", ({ to, offer, callType }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incoming-call", {
                from: socket.userId,
                callerName: socket.user.fullName,
                callerPic: socket.user.profilePic,
                offer,
                callType // "audio" or "video"
            });
        } else {
            // User offline
            socket.emit("call-failed", { reason: "User is offline" });
        }
    });

    // Call accepted - send answer back
    socket.on("call-accepted", ({ to, answer }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-answered", { answer });
        }
    });

    // ICE candidate exchange
    socket.on("ice-candidate", ({ to, candidate }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("ice-candidate", {
                from: socket.userId,
                candidate
            });
        }
    });

    // End call
    socket.on("end-call", ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended", { from: socket.userId });
        }
    });

    // Reject call
    socket.on("call-rejected", ({ to }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-rejected", { by: socket.userId });
        }
    });

    // with socket.on we listen for events from clients
    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.user.fullName);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };
