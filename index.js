const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');

// Database Connection
const connectDB = require("./src/config/database");

// Socket Handlers
const { socketHandler } = require('./src/socket/socket');
const { callSocketHandler } = require('./src/socket/callSocket');
const { setSocketIo } = require('./src/controllers/groupController');

// API Routes
const authRoutes = require("./src/routes/AuthRouter");
const groupRouter = require("./src/routes/groupRouter");
const chatRouter = require("./src/routes/chatRouter");
const groupChatRouter = require("./src/routes/groupChatRouter");
const callLogRouter = require("./src/routes/callLogsRouter");
const saveSubscriptionRoute = require("./src/routes/saveSubscription");

// Initialize Express
const app = express();
connectDB();

// ✅ Middlewares
app.use(cors({
  origin: '*', // Or replace with frontend URL in production
  credentials: true,
}));
app.use(express.json());

// ✅ Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// ✅ Create HTTP Server
const server = http.createServer(app);

// ✅ Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your frontend URL for production
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ✅ Set Socket IO instance for use in controllers
setSocketIo(io);

// ✅ Initialize Socket Logic
socketHandler(io);
callSocketHandler(io);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
