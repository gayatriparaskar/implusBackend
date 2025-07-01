const Chat = require("../models/Chats");
const GroupChat = require("../models/GroupChat");
const Group = require("../models/Group");
const User = require("../models/Auth");
const { encrypt, decrypt } = require("../utils/encryption");
const { sendPushNotification } = require("../utils/sendPushNotification");

const onlineUsers = {};

async function updateUserOnlineStatus(userId, status) {
  await User.findByIdAndUpdate(userId, {
    online_status: status,
    ...(status === "offline" ? { last_seen: new Date() } : {}),
  });
}

function socketHandler(io) {
  let users = [];
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // ========================
    // ✅ Online Status Handling
    // ========================
    socket.on("userOnline", async (userId) => {
      onlineUsers[userId] = socket.id;
      await updateUserOnlineStatus(userId, "online");
      console.log(`🟢 ${userId} is online`);
    });

    socket.on("join", ({ userId }) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on("joinGroup", ({ groupId }) => {
      socket.join(groupId);
      console.log(`🟦 Joined group ${groupId}`);
    });

    // ========================
    // ✅ Personal Chat
    // ========================
    socket.on(
      "sendMessage",
      async ({
        senderId,
        receiverId,
        message,
        messageType = "text",
        payload = {},
      }) => {
        try {
          const chatData = {
            senderId,
            receiverId,
            message,
            messageType,
            payload,
            timestamp: new Date(),
            read: false,
          };

          const savedMsg = await Chat.create(chatData);

          const receiverSocketId = onlineUsers[receiverId];

          const msgPayload = {
            ...chatData,
            timestamp: savedMsg.timestamp,
          };

          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessageReceived", msgPayload);
            io.to(receiverSocketId).emit("newUnreadMessage", {
              from: senderId,
              message,
              messageType,
              payload,
              timestamp: savedMsg.timestamp,
            });
          } else {
            await sendPushNotification(receiverId, {
              title: "New Message",
              body: message,
              url: `/chat/${senderId}`,
            });
          }
        } catch (err) {
          console.error("❌ Error sending message:", err);
          socket.emit("messageError", {
            message: "Failed to send message",
            code: "MESSAGE_FAILED",
          });
        }
      }
    );

    // ========================
    // ✅ Group Chat
    // ========================
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
            message, // decrypted for frontend
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
      }
    );

    // handling calls
    console.log("User connected:", socket.id);
  users.push(socket.id);

  socket.on("offer", data => {
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", data => {
    socket.broadcast.emit("answer", data);
  });

  socket.on("candidate", data => {
    socket.broadcast.emit("candidate", data);
  });

  socket.on("disconnect", () => {
    users = users.filter(id => id !== socket.id);
    console.log("User disconnected:", socket.id);
  });
    

    // ========================
    // ✅ Disconnect Handling
    // ========================
    socket.on("disconnect", async () => {
      const disconnectedUserId = Object.keys(onlineUsers).find(
        (key) => onlineUsers[key] === socket.id
      );

      if (disconnectedUserId) {
        delete onlineUsers[disconnectedUserId];
        await updateUserOnlineStatus(disconnectedUserId, "offline");
        console.log(`❌ ${disconnectedUserId} disconnected`);
      }
    });
  });
}

module.exports = { socketHandler, onlineUsers };
