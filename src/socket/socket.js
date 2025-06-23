// src/socket/socket.js
const Chat = require('../models/Chats');
const GroupChat = require('../models/GroupChat');
const Group = require('../models/Group');
const User = require('../models/Auth');

const onlineUsers = {};

async function updateUserOnlineStatus(userId, status) {
  await User.findByIdAndUpdate(userId, {
    online_status: status,
    ...(status === "offline" ? { last_seen: new Date() } : {})
  });
}

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

 // ✅ Handle user online status
    socket.on('userOnline', async (userId) => {
      onlineUsers[userId] = socket.id;
      await updateUserOnlineStatus(userId, "online");
      console.log(`User ${userId} is now online`);
    });

    socket.on('join', ({ userId }) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on('joinGroup', ({ groupId }) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
      const chatData = { senderId, receiverId, message, timestamp: new Date(),
      };
      await Chat.create(chatData);

      const receiverSocket = onlineUsers[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', chatData);
      }
    });

     // Echo back to sender
  // const senderSocket = onlineUsers[senderId];
  // if (senderSocket) {
  //   io.to(senderSocket).emit('receiveMessage', chatData);
  // }

  // Debug log
  console.log('Sent message from', senderId, 'to', receiverId);

    socket.on('sendGroupMessage', async ({ groupId, senderId, message, messageType, payload }) => {
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(senderId)) {
        return socket.emit('groupError', { message: "Unauthorized", code: "NOT_MEMBER" });
      }

      const chatData = { groupId, senderId, message, messageType, payload, timestamp: new Date() };
      await GroupChat.create(chatData);
      io.to(groupId).emit('receiveGroupMessage', chatData);
    });

    // ✅ Handle user disconnect and mark offline
    socket.on('disconnect', async () => {
      let disconnectedUserId = null;

      for (let userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          disconnectedUserId = userId;
          delete onlineUsers[userId];
          break;
        }
      }

      if (disconnectedUserId) {
        await updateUserOnlineStatus(disconnectedUserId, "offline");
        console.log('User disconnected:', disconnectedUserId);
      }
    });
  });
}

module.exports = {socketHandler , onlineUsers} ;
