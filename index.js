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
const app = express();


app.use(cors());
app.use(express.json());
connectDB();


app.get("/", async (req, res) => {
    
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


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
setSocketIo(io); // 👈 this will set io inside your controller
// 👉 Initialize socket logic
socketHandler(io);

// // Store connected users
// let onlineUsers = {};

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   socket.on('join', ({ userId }) => {
//     onlineUsers[userId] = socket.id;
//   });

//   socket.on('joinGroup', ({ groupId }) => {
//     socket.join(groupId);
//     console.log(`User joined group ${groupId}`);
//   });

//   socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
//     const chatData = { senderId, receiverId, message, timestamp: new Date() };
//     await Chat.create(chatData);

//     const receiverSocket = onlineUsers[receiverId];
//     if (receiverSocket) {
//       io.to(receiverSocket).emit('receiveMessage', chatData);
//     }
//   });


  //  socket.on('sendGroupMessage', async ({ groupId, senderId, message }) => {
  //   const chatData = { groupId, senderId, message, timestamp: new Date() };
  //   await GroupChat.create(chatData);
  //   io.to(groupId).emit('receiveGroupMessage', chatData);
  // });

  // socket.on('sendGroupMessage', async ({ groupId, senderId, message }) => {
  //   try {
  //     const group = await Group.findById(groupId);

  //     // ✅ Validate sender
  //     if (!group.members.includes(senderId)) {
  //       console.log(`Blocked: ${senderId} is not in group ${groupId}`);
  //       return; // Do not store or emit
  //     }

  //     const chatData = {
  //       groupId,
  //       senderId,
  //       message,
  //       timestamp: new Date()
  //     };

  //     await GroupChat.create(chatData);

  //     io.to(groupId).emit('receiveGroupMessage', chatData);
  //   } catch (err) {
  //     console.error('Group message error:', err.message);
  //   }
  // });



//   socket.on('sendGroupMessage', async ({ groupId, senderId, message }) => {
//   const group = await Group.findById(groupId);
//   if (!group.members.includes(senderId)) {
//     socket.emit('groupError', {
//       message: `You cannot send messages to a group you're not part of.`,
//       groupId,
//       code: 'NOT_MEMBER'
//     });
//     return;
//   }

//   const chatData = { groupId, senderId, message, timestamp: new Date() };
//   await GroupChat.create(chatData);
//   io.to(groupId).emit('receiveGroupMessage', chatData);
// });



// socket.on('sendGroupMessage', async ({ groupId, senderId, message, messageType, payload }) => {
//   const group = await Group.findById(groupId);
//   if (!group || !group.members.includes(senderId)) {
//     return socket.emit('groupError', { message: "Unauthorized", code: "NOT_MEMBER" });
//   }

//   const chatData = { groupId, senderId, message, messageType, payload, timestamp: new Date() };
//   await GroupChat.create(chatData);

//   io.to(groupId).emit('receiveGroupMessage', chatData);
// });
  


//   socket.on('disconnect', () => {
//     for (let userId in onlineUsers) {
//       if (onlineUsers[userId] === socket.id) {
//         delete onlineUsers[userId];
//         console.log('User disconnected:', userId);
//         break;
//       } 
//     }
//   });
// });
// ----------- add to controller and router
// app.get('/messages/:user1/:user2', async (req, res) => {
//   const { user1, user2 } = req.params;
//   const messages = await Chat.find({
//     $or: [
//       { senderId: user1, receiverId: user2 },
//       { senderId: user2, receiverId: user1 }
//     ]
//   }).sort({ timestamp: 1 });
//   res.json(messages);
// });
// ----------- add to controller and router

// ----------- add to controller and router
// app.post('/groups', async (req, res) => {
//   const { name, members } = req.body;
//   const group = await Group.create({ name, members });
//   res.json(group);
// });

// app.get('/groups/:userId', async (req, res) => {
//   const groups = await Group.find({ members: req.params.userId });
//   res.json(groups);
// });

// app.get('/group-messages/:groupId', async (req, res) => {
//   const messages = await GroupChat.find({ groupId: req.params.groupId }).sort({ timestamp: 1 });
//   res.json(messages);
// });

// app.post('/groups/:groupId/add-member', async (req, res) => {
//   const { groupId } = req.params;
//   const { userIdToAdd } = req.body;

//   try {
//     const group = await Group.findById(groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     if (group.members.includes(userIdToAdd)) {
//       return res.status(400).json({ message: "User already a member" });
//     }

//     group.members.push(userIdToAdd);
//     await group.save();

//     // ✅ Optional: Notify sockets in the group
//     io.to(groupId).emit('groupMemberAdded', {
//       groupId,
//       newMember: userIdToAdd
//     });

//     res.json({ message: "User added", group });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error adding member" });
//   }
// });
// ----------- add to controller and router

// app.post('/groups/:groupId/add-member', async (req, res) => {
//   const { groupId } = req.params;
//   const { userIdToAdd, requestedBy } = req.body;

//   try {
//     const group = await Group.findById(groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     // ✅ Only allow admins to add
//     if (!group.admins.includes(requestedBy)) {
//       return res.status(403).json({ message: "Only admins can add members" });
//     }

//     if (group.members.includes(userIdToAdd)) {
//       return res.status(400).json({ message: "User already a member" });
//     }

//     group.members.push(userIdToAdd);
//     await group.save();

//     io.to(groupId).emit('groupMemberAdded', {
//       groupId,
//       newMember: userIdToAdd
//     });

//     res.json({ message: "User added", group });
//   } catch (err) {
//     res.status(500).json({ message: "Error adding member" });
//   }
// });



// app.post('/groups/:groupId/remove-member', async (req, res) => {
//   const { groupId } = req.params;
//   const { userIdToRemove, requestedBy } = req.body;

//   const group = await Group.findById(groupId);
//   if (!group) return res.status(404).json({ message: "Group not found" });

//   if (!group.admins.includes(requestedBy)) {
//     return res.status(403).json({ message: "Only admins can remove members" });
//   }

//   group.members = group.members.filter(id => id !== userIdToRemove);
//   await group.save();

//   res.json({ message: "User removed", group });
// });




server.listen(5000, () => {
  console.log('Server running on port 5000');
});
