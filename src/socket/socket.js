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
  const chatData = {
    senderId,
    receiverId,
    message,
    timestamp: new Date(),
    read: false
  };

  const savedMsg = await Chat.create(chatData);

  const receiverSocketId = onlineUsers[receiverId];

  if (receiverSocketId) {
    // ✅ Emit actual chat message to receiver
    io.to(receiverSocketId).emit('newMessageReceived', {
      senderId,
      receiverId,
      message,
      timestamp: savedMsg.timestamp
    });

    // ✅ Emit a lightweight notification to update chat list
    io.to(receiverSocketId).emit('newUnreadMessage', {
      from: senderId,
      message,
      timestamp: savedMsg.timestamp
    });
  }

  // (Optional) Push notification fallback if not online
});

    // ✅ Group message handling
  socket.on('sendGroupMessage', async ({ groupId, senderId, message, messageType = "text", payload = {} }) => {
  try {
    console.log("🟢 Incoming group message", { groupId, senderId, message });

    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(senderId)) {
      console.warn("❌ Unauthorized group access");
      return socket.emit('groupError', { message: "Unauthorized", code: "NOT_MEMBER" });
    }

    console.log("🔐 Encrypting message...");
    const encryptedMessage = encrypt(message);

    const chatData = {
      groupId,
      senderId,
      message: encryptedMessage,
      messageType,
      payload,
      timestamp: new Date()
    };

    console.log("💾 Saving group chat:", chatData);
    const savedMsg = await GroupChat.create(chatData);

    group.members.forEach(memberId => {
      const idStr = memberId.toString();
      const socketId = onlineUsers[idStr];
      if (socketId) {
        io.to(socketId).emit('receiveGroupMessage', {
          ...savedMsg._doc,
          message // decrypted for frontend
        });
      }
    });

    socket.emit('groupMessageSent', { success: true, data: savedMsg });
    console.log("✅ Encrypted group message saved and emitted");
  } catch (err) {
    console.error("❌ Error sending group message:", err);
    socket.emit("groupError", { message: "Internal error", code: "SERVER_ERROR" });
  }
});


    // ✅ Mark group messages as read
    socket.on('markGroupMessagesRead', async ({ userId, groupId }) => {
      try {
        await GroupChat.updateMany(
          {
            groupId,
            'seenBy.userId': { $ne: userId }
          },
          {
            $push: { seenBy: { userId, timestamp: new Date() } }
          }
        );
        console.log(`Marked messages as read in group ${groupId} for user ${userId}`);
      } catch (err) {
        console.error("Failed to mark group messages as read", err);
      }
    });

    // ✅ Mark 1-to-1 messages as read
    socket.on('markMessagesRead', async ({ userId, otherUserId }) => {
      try {
        await Chat.updateMany(
          {
            senderId: otherUserId,
            receiverId: userId,
            read: false
          },
          {
            $set: { read: true }
          }
        );
        console.log(`Marked messages from ${otherUserId} as read by ${userId}`);
      } catch (err) {
        console.error("Failed to mark 1-to-1 messages read", err);
      }
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

module.exports = { socketHandler, onlineUsers };
