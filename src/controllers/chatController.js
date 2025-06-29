const chatModel = require("../models/Chats");
const GroupChat = require("../models/GroupChat");
const Group = require("../models/Group");
const User = require("../models/Auth");
const GroupModel = require("../models/Group");

const { ObjectId } = require("mongoose").Types;

const { onlineUsers } = require("../socket/socket");
const { login } = require("./AuthController");
const { encrypt, decrypt } = require("../utils/encryption");

// app.get('/messages/:user1/:user2', async (req, res) => {
// module.exports.sendMessage = async (req, res) => {
//   const { user1, user2 } = req.params;
//   try {
//     // ✅ Step 1: Mark unread messages from user2 → user1 as read
//     await chatModel.updateMany(
//       {
//         senderId: user2, // user2 sent the message
//         receiverId: user1, // user1 is now opening the chat
//         read: false,
//       },
//       { $set: { read: true } }
//     );

//     // ✅ Step 2: Fetch all messages between user1 and user2
//     const messages = await chatModel
//       .find({
//         $or: [
//           { senderId: user1, receiverId: user2 },
//           { senderId: user2, receiverId: user1 },
//         ],
//       })
//       .sort({ timestamp: 1 });

//     res.json(messages);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// };

module.exports.sendMessage = async (req, res) => {
  const { user1, user2 } = req.params;
  const { message } = req.body;

  try {
    const encryptedMessage = encrypt(message); // 🔐 Encrypt before saving

    const newMsg = await chatModel.create({
      senderId: user1,
      receiverId: user2,
      message: encryptedMessage,
    });

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: newMsg,
    });
  } catch (err) {
    console.error("Send message failed", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

module.exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.params;

  console.log("📥 Fetching messages between:", user1, user2);

  try {
    // ✅ Mark messages from user2 → user1 as read
    await chatModel.updateMany(
      {
        senderId: user2,
        receiverId: user1,
        read: false,
      },
      { $set: { read: true } }
    );

    // ✅ Fetch chat messages
    const messages = await chatModel
      .find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      })
      .sort({ timestamp: 1 });

    console.log(`🗃 Total messages fetched: ${messages.length}`);

    // ✅ Decrypt each message
    const decryptedMessages = messages.map((msg) => {
      try {
        // Basic format check before trying to decrypt
        if (!msg.message.includes(":")) {
          console.warn("⚠️ Skipping unencrypted message:", msg.message);
          return {
            ...msg._doc,
            message: msg.message, // return plain text fallback
          };
        }

        const decrypted = decrypt(msg.message);
        return {
          ...msg._doc,
          message: decrypted || "[Encrypted format error]",
        };
      } catch (err) {
        console.error(
          "❌ Decryption failed:",
          err.message,
          "Raw:",
          msg.message
        );
        return {
          ...msg._doc,
          message: "[Failed to decrypt]",
        };
      }
    });

    // ✅ Send response
    res.status(200).json({
      success: true,
      totalMessages: decryptedMessages.length,
      participants: { user1, user2 },
      data: decryptedMessages,
    });
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// get chat list all
module.exports.getchatList = async (req, res) => {
  try {
    const userId = req.params.userId;
    const markRead = req.query.markRead === "true";
    // Step 1: Fetch all 1-to-1 chats
    const oneOnOne = await chatModel.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    // Step 2: Extract unique contact IDs
    const contactSet = new Set();
    oneOnOne.forEach((chat) => {
      if (chat.senderId.toString() !== userId)
        contactSet.add(chat.senderId.toString());
      if (chat.receiverId.toString() !== userId)
        contactSet.add(chat.receiverId.toString());
    });

    const contactIds = Array.from(contactSet);

    // Step 3: Fetch contact details
    const contactDetails = await User.find({ _id: { $in: contactIds } }).select(
      "_id userName dp status_message display_name nick_name email_id last_seen"
    );

    // Step 4: Fetch groups where user is a member
    const groups = await GroupModel.find({
      members: new ObjectId(userId),
    }).select("_id name image members group_status_message");

    console.log("groups", groups);

    // Optional Step 4.5: If markRead is true, mark all messages read/seen

    // if (markRead) {
    //   // 1-to-1 messages: mark as read
    //   await chatModel.updateMany(
    //     {
    //       receiverId: userId,
    //       read: false,
    //     },
    //     { $set: { read: true } }
    //   );

    //   // Group messages: push user to seenBy
    //   await GroupChat.updateMany(
    //     {
    //       groupId: { $in: groups.map((g) => g._id) },
    //       $or: [
    //         { seenBy: { $exists: false } },
    //         {
    //           seenBy: {
    //             $not: {
    //               $elemMatch: {
    //                 userId: new ObjectId(userId),
    //               },
    //             },
    //           },
    //         },
    //       ],
    //     },
    //     {
    //       $push: {
    //         seenBy: {
    //           userId: new ObjectId(userId),
    //           timestamp: new Date(),
    //         },
    //       },
    //     }
    //   );
    // }

    // Step 5: Format user contacts
    const formattedContacts = await Promise.all(
      contactDetails.map(async (user) => {
        const otherUserId = user._id.toString();

        const lastMsg = await chatModel
          .findOne({
            $or: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          })
          .sort({ timestamp: -1 });

        let decryptedLastMsg = null;
        if (lastMsg) {
          try {
            decryptedLastMsg = {
              ...lastMsg._doc,
              message: lastMsg.message.includes(":")
                ? decrypt(lastMsg.message)
                : lastMsg.message,
            };
          } catch (err) {
            decryptedLastMsg = {
              ...lastMsg._doc,
              message: "[Failed to decrypt]",
            };
          }
        }

        const unreadCount = await chatModel.countDocuments({
          senderId: otherUserId,
          receiverId: userId,
          $or: [{ read: false }, { read: { $exists: false } }],
        });

        const lastMsgRead =
          !lastMsg ||
          lastMsg.senderId.toString() !== otherUserId ||
          lastMsg.read === true;

        return {
          type: "user",
          ...user._doc,
          online: !!onlineUsers[otherUserId], // You must define `onlineUsers` from sockets
          lastMsg: decryptedLastMsg,
          lastMsgAt: decryptedLastMsg ? decryptedLastMsg.timestamp : null,

          lastMsgRead,
          unreadCount,
        };
      })
    );

    // Step 6: Format group chats
    const formattedGroups = await Promise.all(
      groups.map(async (group) => {
        const lastGroupMsg = await GroupChat.findOne({
          groupId: group._id,
        }).sort({ timestamp: -1 });

        let decryptedGroupMsg = null;
        if (lastGroupMsg) {
          try {
            decryptedGroupMsg = {
              ...lastGroupMsg._doc,
              message: lastGroupMsg.message.includes(":")
                ? decrypt(lastGroupMsg.message)
                : lastGroupMsg.message,
            };
          } catch (err) {
            decryptedGroupMsg = {
              ...lastGroupMsg._doc,
              message: "[Failed to decrypt]",
            };
          }
        }
        // const unreadCount = await GroupChat.countDocuments({
        //   groupId: group._id,
        //   $or: [
        //     { seenBy: { $exists: false } }, // no seenBy at all
        //     {
        //       seenBy: {
        //         $not: {
        //           $elemMatch: {
        //             userId: new ObjectId(userId),
        //           },
        //         },
        //       },
        //     },
        //   ],
        // });

        // Step 1: Get user's last seen timestamp for this group
        let lastSeenEntry = null;
        if (lastGroupMsg?.seenBy) {
          lastSeenEntry = lastGroupMsg.seenBy.find(
            (entry) => entry.userId.toString() === userId
          );
        }

        // let unreadCount = 0;

        // if (lastSeenEntry && lastSeenEntry.timestamp) {
        //   // Count messages sent AFTER last seen
        //   unreadCount = await GroupChat.countDocuments({
        //     groupId: group._id,
        //     timestamp: { $gt: lastSeenEntry.timestamp },
        //   });
        // } else {
        //   // User never saw any messages → count all
        //   unreadCount = await GroupChat.countDocuments({
        //     groupId: group._id,
        //   });
        // }

        const unreadCount = await GroupChat.countDocuments({
          groupId: group._id,
          seenBy: {
            $not: {
              $elemMatch: {
                userId: new ObjectId(userId),
              },
            },
          },
        });

        let lastMsgRead = true;
        if (
          lastGroupMsg &&
          (!lastGroupMsg.seenBy ||
            !lastGroupMsg.seenBy.some(
              (entry) => entry.userId.toString() === userId
            ))
        ) {
          lastMsgRead = false;
        }

        return {
          type: "group",
          ...group._doc,
          lastMsg: decryptedGroupMsg,
          lastMsgAt: decryptedGroupMsg
            ? decryptedGroupMsg.timestamp
            : group.createdAt,
          last_activity: decryptedGroupMsg
            ? decryptedGroupMsg.timestamp
            : group.createdAt,

          group_status_message:
            group.group_status_message || "No group status set",
          lastMsgRead,
          unreadCount, // ✅ include it here
        };
      })
    );

    // Step 7: Combine and sort by lastMsgAt
    const combined = [...formattedContacts, ...formattedGroups].sort((a, b) => {
      const timeA = new Date(a.lastMsgAt || 0).getTime();
      const timeB = new Date(b.lastMsgAt || 0).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      message: "Chat list with all info, sorted by lastMsgAt",
      data: combined,
    });
  } catch (err) {
    console.error("Error fetching chat list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.markMessagesAsRead = async (req, res) => {
  try {
    const { userId, groupId } = req.params;

    if (!groupId) {
      // ✅ 1-ON-1 CHAT FLOW
      await chatModel.updateMany(
        {
          receiverId: new ObjectId(userId),
          $or: [{ read: false }, { read: { $exists: false } }],
        },
        { $set: { read: true } }
      );

      return res.status(200).json({
        message: `1-on-1 messages marked as read for user ${userId}`,
      });
    } else {
      // ✅ GROUP CHAT FLOW
      // Step 1: Remove old seenBy entry if exists
      await GroupChat.updateMany(
        {
          groupId: new ObjectId(groupId),
          "seenBy.userId": new ObjectId(userId),
        },
        {
          $pull: {
            seenBy: { userId: new ObjectId(userId) },
          },
        }
      );

      // Step 2: Add new seenBy entry
      await GroupChat.updateMany(
        {
          groupId: new ObjectId(groupId),
        },
        {
          $push: {
            seenBy: {
              userId: new ObjectId(userId),
              timestamp: new Date(),
            },
          },
        }
      );

      return res.status(200).json({
        message: `Group ${groupId} messages marked as seen by user ${userId}`,
      });
    }
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
