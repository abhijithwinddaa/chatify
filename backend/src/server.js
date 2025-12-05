// backend/src/server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';

import authRoute from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import { connectDB } from './lib/db.js';
import { ENV } from './lib/env.js';



const app = express();
const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: '5mb' })); // req.body
app.use(cors({
  origin: ENV.CLIENT_URL,
  credentials: true
}))
app.use(cookieParser());

// middleware & routes
app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoutes);

// serve frontend in production
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// debug print -- helpful during deploy
console.log('NODE_ENV:', ENV.NODE_ENV);
console.log('PORT env:', ENV.PORT);

// IMPORTANT: listen on the runtime PORT and bind to all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
  connectDB();
});
