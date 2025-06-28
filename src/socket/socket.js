// src/socket/socket.js
const Chat = require("../models/Chats");
const GroupChat = require("../models/GroupChat");
const Group = require("../models/Group");
const User = require("../models/Auth");
const { sendPushNotification } = require('../utils/sendPushNotification');
const { encrypt, decrypt } = require("../utils/encryption");

const onlineUsers = {};

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

    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      const chatData = {
        senderId,
        receiverId,
        message,
        timestamp: new Date(),
        read: false,
      };
 

      const savedMsg = await Chat.create(chatData);
      if(chatData){
         console.log("notificationnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn1");
         await sendPushNotification(receiverId, {
      title: 'New Message',
      body: message,
      url: `/chat/${senderId}`
    });
      }

      const receiverSocketId = onlineUsers[receiverId];

      if (receiverSocketId) {
        // ✅ Emit actual chat message to receiver
        io.to(receiverSocketId).emit("newMessageReceived", {
          senderId,
          receiverId,
          message,
          timestamp: savedMsg.timestamp,
        });
        await sendPushNotification(receiverId, {
      title: 'New Message',
      body: message,
      url: `/chat/${senderId}`
    });

        // ✅ Emit a lightweight notification to update chat list
        io.to(receiverSocketId).emit("newUnreadMessage", {
          from: senderId,
          message,
          timestamp: savedMsg.timestamp,
        });
        
      } else {
    // ✅ Push Notification if user is offline
    await sendPushNotification(receiverId, {
      title: 'New Message',
      body: message,
      url: `/chat/${senderId}`
    });
  }

      // (Optional) Push notification fallback if not online
    });

    // ✅ Group message handling
    socket.on(
      "sendGroupMessage",
      async ({
        groupId,
        senderId,
        message,
        messageType = "text",
        payload = {},
      }) => {
        try {
          console.log("🟢 Incoming group message", {
            groupId,
            senderId,
            message,
          });

          const group = await Group.findById(groupId);
          if (!group || !group.members.includes(senderId)) {
            console.warn("❌ Unauthorized group access");
            return socket.emit("groupError", {
              message: "Unauthorized",
              code: "NOT_MEMBER",
            });
          }

          console.log("🔐 Encrypting message...");
          const encryptedMessage = encrypt(message);

          const chatData = {
            groupId,
            senderId,
            message: encryptedMessage,
            messageType,
            payload,
            timestamp: new Date(),
          };

          console.log("💾 Saving group chat:", chatData);
          const savedMsg = await GroupChat.create(chatData);

          // group.members.forEach(memberId => {
          //   const idStr = memberId.toString();
          //   const socketId = onlineUsers[idStr];
          //   if (socketId) {
          //     io.to(socketId).emit('receiveGroupMessage', {
          //       ...savedMsg._doc,
          //       message // decrypted for frontend
          //     });
          //   }
          // });

          // With this:
          // io.to(groupId).emit("receiveGroupMessage", {
          //   ...savedMsg._doc,
          //   message, // decrypted for frontend
          // });

          socket.to(groupId).emit("receiveGroupMessage", {
            ...savedMsg._doc,
            message,
          });

          socket.emit("groupMessageSent", { success: true, data: savedMsg._doc,message });
          console.log("✅ Encrypted group message saved and emitted");
           // ✅ Send Push Notifications to offline members (excluding sender)
      for (const memberId of group.members) {
        const idStr = memberId.toString();
        const socketId = onlineUsers[idStr];

        if (!socketId && idStr !== senderId) {
              // console.log("notificationnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn1");
          await sendPushNotification(idStr, {
            title: `New message in ${group.name}`,
            body: message,
            url: `/group/${groupId}`, // Adjust if your frontend uses a different path
          });
        }
      }
        } catch (err) {
          console.error("❌ Error sending group message chat:", err);
          socket.emit("groupError", {
            message: "Internal error",
            code: "SERVER_ERROR",
          });
        }
      }
    );

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


    // 🟢 Start Call
socket.on('startCall', ({ fromUserId, toUserId, isVideo }) => {
  const targetPeer = Object.values(peers).find((p) => p.userId === toUserId);
  if (targetPeer?.socket) {
    console.log(`📞 Calling ${toUserId} from ${fromUserId}`);
    targetPeer.socket.emit('incomingCall', {
      fromUserId,
      isVideo,
    });
  } else {
    console.log('🔕 User not online or peer not found');
  }
});

// 🔴 Call Declined
socket.on('callDeclined', ({ toUserId }) => {
  const targetPeer = Object.values(peers).find((p) => p.userId === toUserId);
  if (targetPeer?.socket) {
    targetPeer.socket.emit('callDeclinedByPeer');
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

