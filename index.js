const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require("./src/config/database");
const { socketHandler } = require('./src/socket/socket');
const { callSocketHandler } = require('./src/socket/callSocket');

const authRoutes = require("./src/routes/AuthRouter");
const groupRouter = require("./src/routes/groupRouter");
const chatRouter = require("./src/routes/chatRouter");
const groupChatRouter = require("./src/routes/groupChatRouter");
const callLogRouter = require("./src/routes/callLogsRouter");
const saveSubscriptionRoute = require("./src/routes/saveSubscription");

const { setSocketIo } = require('./src/controllers/groupController');

const path = require("path");

const app = express();
connectDB();

// ✅ CORS for APIs
app.use(cors({
  origin: 'https://chat-app-wheat-two-51.vercel.app', 
  credentials: true
}));

app.use(express.json());

// ✅ Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running perfectly 🚀",
  });
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/group', groupRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chatGroup', groupChatRouter);
app.use('/api/call-logs', callLogRouter);
app.use('/api/save-subscription', saveSubscriptionRoute);

// ✅ Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ HTTP Server
const server = http.createServer(app);

// ✅ Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: 'https://chat-app-wheat-two-51.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ✅ Set Socket instance for controllers
setSocketIo(io);

// ✅ Attach socket handlers
socketHandler(io);
callSocketHandler(io);

// ✅ Port fix for Render
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
