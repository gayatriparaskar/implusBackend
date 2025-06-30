const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const connectDB = require('./src/config/database');
const { socketHandler } = require('./src/socket/socket');

const authRoutes = require('./src/routes/AuthRouter');
const groupRouter = require('./src/routes/groupRouter');
const chatRouter = require('./src/routes/chatRouter');
const groupChatRouter = require('./src/routes/groupChatRouter');
const saveSubscriptionRoute = require('./src/routes/saveSubscription');

const { setSocketIo } = require('./src/controllers/groupController');

const app = express();
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Static file serve (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/group', groupRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chatGroup', groupChatRouter);
app.use('/api/save-subscription', saveSubscriptionRoute);

// Test route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running perfectly 🚀',
  });
});

// Server + Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});
setSocketIo(io); // For other controllers if needed
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
