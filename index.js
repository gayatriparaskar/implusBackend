const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require("./src/config/database");
const {socketHandler} = require('./src/socket/socket');
const authRoutes = require("./src/routes/AuthRouter");
const groupRouter = require("./src/routes/groupRouter");
const chatRouter = require("./src/routes/chatRouter");
const { setSocketIo } = require('./src/controllers/groupController');
const groupChatRouter = require("./src/routes/groupChatRouter");
const path = require("path");
const webpush = require('web-push');
const app = express();
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const saveSubscriptionRoute = require("./src/routes/saveSubscription");
app.use(cors());
app.use(express.json());
connectDB();


app.get("/", async (req, res) => {
    
      console.log(res);
      
      res.status(200).json({
        success: "Hello from the server",
        message: "Server is running perfectly",
      });

});
app.use('/api/auth', authRoutes);
app.use('/api/group', groupRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chatGroup', groupChatRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve files statically
app.use('/api/save-subscription', saveSubscriptionRoute);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
setSocketIo(io); // 👈 this will set io inside your controller
// 👉 Initialize socket logic
socketHandler(io);
// webpush.setVapidDetails(
//   'mailto:hello@example.com',
//   vapidPublicKey,       // ✅ public key first
//   vapidPrivateKey       // ✅ private key second
// );

// // ✅ This route handles user subscription from frontend
// app.post('/subscribe', (req, res) => {
//   const subscription = req.body;

//   // You can store this in DB for later use
//   console.log('New Subscription:', subscription);

//   const payload = JSON.stringify({
//     title: 'Thanks for Subscribing!',
//     body: 'You will now receive updates from us.',
//   });

//   // Send notification
//   webpush.sendNotification(subscription, payload).catch(err => console.error(err));

//   res.status(201).json({ message: 'Notification sent' });
// });


server.listen(5000, () => {
  console.log('Server running on port 5000');
});
