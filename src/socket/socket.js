// src/socket/socket.js
const Chat = require("../models/Chats");
const GroupChat = require("../models/GroupChat");
const Group = require("../models/Group");
const User = require("../models/Auth");
const { sendPushNotification } = require('../utils/sendPushNotification');
const { encrypt, decrypt } = require("../utils/encryption");

const onlineUsers = {};

// ✅ Update user status (online/offline)
async function updateUserOnlineStatus(userId, status) {
  await User.findByIdAndUpdate(userId, {
    online_status: status,
    ...(status === "offline" ? { last_seen: new Date() } : {}),
  });
}

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Handle user online status
    socket.on("userOnline", async (userId) => {
      onlineUsers[userId] = socket.id;
      await updateUserOnlineStatus(userId, "online");
      console.log(`User ${userId} is now online`);
    });

    socket.on("join", ({ userId }) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on("joinGroup", ({ groupId }) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });

    // ✅ 1-to-1 message
    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      const chatData = {
        senderId,
        receiverId,
        message,
        timestamp: new Date(),
        read: false,
      };

      const savedMsg = await Chat.create(chatData);
      const receiverSocketId = onlineUsers[receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessageReceived", {
          senderId,
          receiverId,
          message,
          timestamp: savedMsg.timestamp,
        });

        io.to(receiverSocketId).emit("newUnreadMessage", {
          from: senderId,
          message,
          timestamp: savedMsg.timestamp,
        });

        await sendPushNotification(receiverId, {
          title: 'New Message',
          body: message,
          url: `/chat/${senderId}`
        });

      } else {
        await sendPushNotification(receiverId, {
          title: 'New Message',
          body: message,
          url: `/chat/${senderId}`
        });
      }
    });

    // ✅ Group message
    socket.on("sendGroupMessage", async ({
      groupId,
      senderId,
      message,
      messageType = "text",
      payload = {},
    }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(senderId)) {
          return socket.emit("groupError", {
            message: "Unauthorized",
            code: "NOT_MEMBER",
          });
        }

        const encryptedMessage = encrypt(message);

        const chatData = {
          groupId,
          senderId,
          message: encryptedMessage,
          messageType,
          payload,
          timestamp: new Date(),
        };

        const savedMsg = await GroupChat.create(chatData);

        socket.to(groupId).emit("receiveGroupMessage", {
          ...savedMsg._doc,
          message,
        });

        socket.emit("groupMessageSent", {
          success: true,
          data: savedMsg._doc,
          message,
        });

        for (const memberId of group.members) {
          const idStr = memberId.toString();
          const socketId = onlineUsers[idStr];

          if (!socketId && idStr !== senderId) {
            await sendPushNotification(idStr, {
              title: `New message in ${group.name}`,
              body: message,
              url: `/group/${groupId}`,
            });
          }
        }
      } catch (err) {
        console.error("❌ Error sending group message:", err);
        socket.emit("groupError", {
          message: "Internal error",
          code: "SERVER_ERROR",
        });
      }
    });

    // ✅ Mark group messages as read
    socket.on("markGroupMessagesRead", async ({ userId, groupId }) => {
      try {
        await GroupChat.updateMany(
          {
            groupId,
            "seenBy.userId": { $ne: userId },
          },
          {
            $push: { seenBy: { userId, timestamp: new Date() } },
          }
        );
        console.log(
          `Marked messages as read in group ${groupId} for user ${userId}`
        );
      } catch (err) {
        console.error("Failed to mark group messages as read", err);
      }
    });

    // ✅ Mark 1-to-1 messages as read
    socket.on("markMessagesRead", async ({ userId, otherUserId }) => {
      try {
        await Chat.updateMany(
          {
            senderId: otherUserId,
            receiverId: userId,
            read: false,
          },
          {
            $set: { read: true },
          }
        );
        console.log(`Marked messages from ${otherUserId} as read by ${userId}`);
      } catch (err) {
        console.error("Failed to mark 1-to-1 messages read", err);
      }
    });

    // 🔥🔥🔥 Audio/Video Call Signaling 🔥🔥🔥

    // 🟢 Start Call
    socket.on('startCall', ({ fromUserId, toUserId, isVideo }) => {
      const targetSocketId = onlineUsers[toUserId];

      if (targetSocketId) {
        console.log(`📞 Calling ${toUserId} from ${fromUserId}`);
        io.to(targetSocketId).emit('incomingCall', {
          fromUserId,
          isVideo,
        });
      } else {
        console.log('🔕 User not online');
      }
    });

    // 🔄 Send WebRTC Offer
    socket.on('webrtc-offer', ({ fromUserId, toUserId, offer }) => {
      const targetSocketId = onlineUsers[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-offer', { offer, fromUserId });
      }
    });

    // 🔄 Send WebRTC Answer
    socket.on('webrtc-answer', ({ fromUserId, toUserId, answer }) => {
      const targetSocketId = onlineUsers[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-answer', { answer, fromUserId });
      }
    });

    // 🔁 ICE Candidate Exchange
    socket.on('webrtc-ice-candidate', ({ fromUserId, toUserId, candidate }) => {
      const targetSocketId = onlineUsers[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-ice-candidate', {
          candidate,
          fromUserId,
        });
      }
    });

    // 🔴 Call Declined
    socket.on('callDeclined', ({ fromUserId, toUserId }) => {
      const targetSocketId = onlineUsers[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit('callDeclinedByPeer', {
          fromUserId,
        });
      }
    });

    // 🔚 Call Ended
    socket.on('endCall', ({ fromUserId, toUserId }) => {
      const targetSocketId = onlineUsers[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit('callEnded', {
          fromUserId,
        });
      }
    });

    // ✅ Handle user disconnect and mark offline
    socket.on("disconnect", async () => {
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
        console.log("User disconnected:", disconnectedUserId);
      }
    });
  });
}

module.exports = { socketHandler, onlineUsers };
