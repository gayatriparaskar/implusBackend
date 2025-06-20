// src/socket/socket.js
const Chat = require('../models/Chats');
const GroupChat = require('../models/GroupChat');
const Group = require('../models/Group');

const onlineUsers = {};

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', ({ userId }) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on('joinGroup', ({ groupId }) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
      const chatData = { senderId, receiverId, message, timestamp: new Date() };
      await Chat.create(chatData);

      const receiverSocket = onlineUsers[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', chatData);
      }
    });

    socket.on('sendGroupMessage', async ({ groupId, senderId, message, messageType, payload }) => {
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(senderId)) {
        return socket.emit('groupError', { message: "Unauthorized", code: "NOT_MEMBER" });
      }

      const chatData = { groupId, senderId, message, messageType, payload, timestamp: new Date() };
      await GroupChat.create(chatData);
      io.to(groupId).emit('receiveGroupMessage', chatData);
    });

    socket.on('disconnect', () => {
      for (let userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
          console.log('User disconnected:', userId);
          break;
        }
      }
    });
  });
}

module.exports = socketHandler;
