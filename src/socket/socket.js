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
      const chatData = { senderId, receiverId, message, timestamp: new Date(),read :false
      };
      await Chat.create(chatData);

     // Emit to receiver only
  const receiverSocketId = onlineUsers[receiverId];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('newMessageReceived', {
      senderId,
      message,
      timestamp: new Date()
    });
   }
  });

    

//     socket.on('sendGroupMessage', async ({ groupId, senderId, message, messageType, payload }) => {
//   try {
//     const group = await Group.findById(groupId);

//     // ✅ Check if sender is part of the group
//     if (!group || !group.members.map(id => id.toString()).includes(senderId.toString())) {
//       return socket.emit('groupError', { message: "Unauthorized", code: "NOT_MEMBER" });
//     }

//     // ✅ Create message entry
//     const chatData = {
//       groupId,
//       senderId,
//       message,
//       messageType,
//       payload,
//       timestamp: new Date(),
//       seenBy: [{ userId: senderId, timestamp: new Date() }] // optional
//     };

//     const savedMsg = await GroupChat.create(chatData);

//     // ✅ Emit to each group member (except sender)
//     group.members.forEach(memberId => {
//       const idStr = memberId.toString();
//       if (idStr !== senderId.toString()) {
//         const socketId = onlineUsers[idStr];
//         if (socketId) {
//           io.to(socketId).emit('receiveGroupMessage', savedMsg);
//         }
//         console.log("Group members:", group.members.map(m => m.toString()));
//         console.log("Online users:", onlineUsers);

//       }
//     });

//     // ✅ Acknowledge sender
//     socket.emit('groupMessageSent', { success: true, data: savedMsg });

//   } catch (err) {
//     console.error("Group message error:", err);
//     socket.emit('groupError', { message: "Server error", error: err.message });
//   }
// });


ocket.on('sendGroupMessage', async ({ groupId, senderId, message, messageType = "text", payload = {} }) => {
  try {
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(senderId)) {
      return socket.emit('groupError', { message: "Unauthorized", code: "NOT_MEMBER" });
    }

    // 🔐 Encrypt the message before saving
    const encryptedMessage = encrypt(message);

    const chatData = {
      groupId,
      senderId,
      message: encryptedMessage, // Save encrypted version
      messageType,
      payload,
      timestamp: new Date()
    };

    const saved = await GroupChat.create(chatData);

    // ✅ Emit to group with decrypted message (for frontend use)
    io.to(groupId).emit('receiveGroupMessage', {
      ...saved._doc,
      message // decrypted version for frontend
    });

      console.log("✅ Encrypted group message saved and emitted");
    } catch (err) {
      console.error("❌ Error sending group message:", err.message);
      socket.emit("groupError", { message: "Internal error", code: "SERVER_ERROR" });
    }
  });



    // ✅ ✅ NEW: Mark group messages as read when user opens the group chat
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


     // ✅ ✅ NEW: Mark 1-to-1 messages as read
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

module.exports = {socketHandler , onlineUsers} ;
