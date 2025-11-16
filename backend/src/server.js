import express from 'express';
import dotenv from 'dotenv';

import authRoute from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoute)
app.use("/api/messages", messageRoutes)

app.listen(3000, () => {
  console.log('Server is running on port: ' + PORT);
});