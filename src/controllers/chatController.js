const chatModel = require("../models/Chats");
const GroupChat = require("../models/GroupChat");
const Group = require("../models/Group");
const User = require("../models/Auth");
const GroupModel = require("../models/Group");

const { ObjectId } = require("mongoose").Types;

// app.get('/messages/:user1/:user2', async (req, res) => {
module.exports.sendMessage = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await chatModel
      .find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      })
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// get chat list all
module.exports.getchatList = async (req, res) => {
  try {
    const userId = req.params.userId;

    // ✅ Step 1: Fetch all 1-to-1 chats
    const oneOnOne = await chatModel.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    const contactSet = new Set();
    oneOnOne.forEach((chat) => {
      if (chat.senderId.toString() !== userId) contactSet.add(chat.senderId.toString());
      if (chat.receiverId.toString() !== userId) contactSet.add(chat.receiverId.toString());
    });

    const contactIds = Array.from(contactSet);

    // ✅ Step 2: Fetch contact details
    const contactDetails = await User.find({ _id: { $in: contactIds } }).select(
      "_id userName dp status_message display_name nick_name email_id last_seen"
    );

    // ✅ Step 3: Fetch groups where user is a member
    const groups = await GroupModel.find({ members: userId }).select(
      "_id name image members group_status_message"
    );

    // ✅ Step 4: Format user chats
    const formattedContacts = await Promise.all(
      contactDetails.map(async (user) => {
        const lastMsg = await chatModel
          .findOne({
            $or: [
              { senderId: userId, receiverId: user._id.toString() },
              { senderId: user._id.toString(), receiverId: userId },
            ],
          })
          .sort({ timestamp: -1 });

        const unreadCount = await chatModel.countDocuments({
          senderId: user._id.toString(),
          receiverId: userId,
          read: false,
        });

        let lastMsgRead = true;
        if (lastMsg && lastMsg.receiverId.toString() === userId && !lastMsg.read) {
          lastMsgRead = false;
        }

        return {
          type: "user",
          ...user._doc,
          lastMsg: lastMsg ? lastMsg.message : null,
          lastMsgAt: lastMsg ? lastMsg.timestamp : null,
          lastMsgRead,
          unreadCount,
        };
      })
    );

    // ✅ Step 5: Format group chats
    const formattedGroups = await Promise.all(
      groups.map(async (group) => {
        const lastGroupMsg = await GroupModel
          .findOne({ groupId: group._id })
          .sort({ timestamp: -1 });

        const unreadCount = await GroupModel.countDocuments({
          groupId: group._id,
          "seenBy.userId": { $ne: userId },
        });

        let lastMsgRead = true;
        if (
          lastGroupMsg &&
          (!lastGroupMsg.seenBy ||
            !lastGroupMsg.seenBy.some((entry) => entry.userId.toString() === userId))
        ) {
          lastMsgRead = false;
        }

        return {
          type: "group",
          ...group._doc,
          lastMsg: lastGroupMsg ? lastGroupMsg.message : null,
          lastMsgAt: lastGroupMsg ? lastGroupMsg.timestamp : null,
          last_activity: lastGroupMsg ? lastGroupMsg.timestamp : null,
          group_status_message: group.group_status_message || "No group status set",
          lastMsgRead,
          unreadCount,
        };
      })
    );

    // ✅ Step 6: Merge and respond
    const combined = [...formattedContacts, ...formattedGroups];

    res.status(200).json({
      message: "Chat list with all info",
      data: combined,
    });
  } catch (err) {
    console.error("Error fetching chat list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// // both code is merged

module.exports.getUnifiedChatList = async (req, res) => {
  try {
    const userId = req.params.userId;
    const objectId = new ObjectId(userId);
    const { withLastMessage } = req.query;

    if (withLastMessage === "true") {
      // ✅ 1-to-1 chat summary with last message, unread count & seen status
      const oneToOne = await chatModel.aggregate([
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }],
          },
        },
        {
          $addFields: {
            userWith: {
              $cond: [
                { $eq: ["$senderId", userId] },
                "$receiverId",
                "$senderId",
              ],
            },
          },
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$userWith",
            lastMessage: { $first: "$message" },
            lastMessageTime: { $first: "$timestamp" },
            senderId: { $first: "$senderId" },
            seenBy: { $first: "$seenBy" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$senderId", userId] },
                      { $not: { $in: [userId, "$seenBy"] } },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "userdetails",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            type: { $literal: "user" },
            chatId: "$user._id",
            name: "$user.userName",
            dp: "$user.dp",
            lastMessage: 1,
            lastMessageTime: 1,
            unreadCount: 1,
            seen: { $in: [userId, "$seenBy"] },
            online_status: "$user.online_status",
          },
        },
      ]);

      // ✅ Group chat summary with latest message and unread count
      const groupChatSummary = await GroupModel.aggregate([
        {
          $match: {
            members: objectId,
          },
        },
        {
          $lookup: {
            from: "groupchats",
            let: { groupId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$groupId", "$$groupId"] } } },
              { $sort: { timestamp: -1 } },
              {
                $group: {
                  _id: "$groupId",
                  lastMessage: { $first: "$message" },
                  lastMessageTime: { $first: "$timestamp" },
                  unreadCount: {
                    $sum: {
                      $cond: [
                        {
                          $not: { $in: [userId, "$seenBy"] },
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "lastMsg",
          },
        },
        {
          $addFields: {
            lastMsg: { $arrayElemAt: ["$lastMsg", 0] },
          },
        },
        {
          $project: {
            type: { $literal: "group" },
            chatId: "$_id",
            name: "$name",
            dp: "$image",
            lastMessage: "$lastMsg.lastMessage",
            lastMessageTime: "$lastMsg.lastMessageTime",
            unreadCount: "$lastMsg.unreadCount",
          },
        },
      ]);

      const combined = [...oneToOne, ...groupChatSummary].sort(
        (a, b) =>
          new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
      );

      return res.status(200).json({
        message: "Unified chat list with last messages",
        data: combined,
      });
    } else {
      // ✅ If no message history is needed — just contacts & groups
      const oneOnOne = await chatModel.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      });

      const contactSet = new Set();
      oneOnOne.forEach((chat) => {
        if (chat.senderId !== userId) contactSet.add(chat.senderId);
        if (chat.receiverId !== userId) contactSet.add(chat.receiverId);
      });

      const contactIds = Array.from(contactSet);

      const contactDetails = await User.find({
        _id: { $in: contactIds },
      }).select(
        "_id userName dp display_name nick_name status_message email_id online_status last_seen"
      );

      const groups = await GroupModel.find({ members: objectId }).select(
        "_id name image members"
      );

      const formattedContacts = contactDetails.map((user) => ({
        type: "user",
        chatId: user._id,
        name: user.userName,
        dp: user.dp,
        online_status: user.online_status,
        last_seen: user.last_seen,
      }));

      const formattedGroups = groups.map((group) => ({
        type: "group",
        chatId: group._id,
        name: group.name,
        dp: group.image,
      }));

      return res.status(200).json({
        message: "Basic contact and group list",
        data: [...formattedContacts, ...formattedGroups],
      });
    }
  } catch (err) {
    console.error("Error in unified chat list:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
