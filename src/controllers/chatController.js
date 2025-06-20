const chatModel = require("../models/Chats");
const GroupChat = require("../models/GroupChat");
const Group = require("../models/Group");
const User = require("../models/Auth");
const GroupModel = require("../models/Group");

const { ObjectId } = require('mongoose').Types;

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

    // ✅ Step 1: Get all 1-to-1 chats where user is involved
    const oneOnOne = await chatModel.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    // ✅ Step 2: Extract unique contact IDs
    const contactSet = new Set();
    oneOnOne.forEach(chat => {
      if (chat.senderId !== userId) contactSet.add(chat.senderId);
      if (chat.receiverId !== userId) contactSet.add(chat.receiverId);
    });

    const contactIds = Array.from(contactSet);

    // ✅ Step 3: Fetch full user details of those contacts
    const contactDetails = await User.find({ _id: { $in: contactIds } })
      .select("_id userName dp status_message display_name nick_name email_id");

    // ✅ Step 4: Get groups where user is a member
    const groups = await GroupModel.find({ members: userId })
      .select("_id name image members");

    // ✅ Step 5: Add `type` and merge into single array
    const formattedContacts = contactDetails.map(user => ({
      type: "user",
      ...user._doc
    }));

    const formattedGroups = groups.map(group => ({
      type: "group",
      ...group._doc
    }));

    const combined = [...formattedContacts, ...formattedGroups];

    // ✅ Step 6: Return response
    res.status(200).json({
      message: "Combined contact and group list",
      data: combined
    });

  } catch (err) {
    console.error("Error fetching chat list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// // both code is merged

// module.exports.getUnifiedChatList = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const objectId = new ObjectId(userId);
//     const { withLastMessage } = req.query;

//     if (withLastMessage === "true") {
//       // ✅ WhatsApp-style Chat List with last message

//       // 1-to-1 chat summary
//       const oneToOne = await chatModel.aggregate([
//         {
//           $match: {
//             $or: [{ senderId: userId }, { receiverId: userId }],
//           },
//         },
//         {
//           $project: {
//             userWith: {
//               $cond: [
//                 { $eq: ["$senderId", userId] },
//                 "$receiverId",
//                 "$senderId",
//               ],
//             },
//             message: 1,
//             timestamp: 1,
//           },
//         },
//         { $sort: { timestamp: -1 } },
//         {
//           $group: {
//             _id: "$userWith",
//             lastMessage: { $first: "$message" },
//             lastMessageTime: { $first: "$timestamp" },
//           },
//         },
//         {
//           $lookup: {
//             from: "userdetails",
//             localField: "_id",
//             foreignField: "_id",
//             as: "user",
//           },
//         },
//         { $unwind: "$user" },
//         {
//           $project: {
//             type: { $literal: "user" },
//             chatId: "$user._id",
//             name: "$user.userName",
//             dp: "$user.dp",
//             lastMessage: 1,
//             lastMessageTime: 1,
//           },
//         },
//       ]);

//       // Group chat summary
//       const groupChats = await GroupModel.aggregate([
//         {
//           $match: {
//             members: objectId,
//           },
//         },
//         {
//           $project: {
//             type: { $literal: "group" },
//             chatId: "$_id",
//             name: "$name",
//             dp: "$image",
//             lastMessage: null,
//             lastMessageTime: null,
//           },
//         },
//       ]);

//       const combined = [...oneToOne, ...groupChats].sort((a, b) =>
//         new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
//       );

//       return res.status(200).json({
//         message: "Unified chat list with last messages",
//         data: combined,
//       });
//     } else {
//       // ✅ Simple contact + group list without messages

//       const oneOnOne = await chatModel.find({
//         $or: [{ senderId: userId }, { receiverId: userId }],
//       });

//       const contactSet = new Set();
//       oneOnOne.forEach((chat) => {
//         if (chat.senderId !== userId) contactSet.add(chat.senderId);
//         if (chat.receiverId !== userId) contactSet.add(chat.receiverId);
//       });

//       const contactIds = Array.from(contactSet);

//       const contactDetails = await User.find({ _id: { $in: contactIds } }).select(
//         "_id userName dp display_name nick_name status_message email_id"
//       );

//       const groups = await GroupModel.find({ members: objectId }).select(
//         "_id name image members"
//       );

//       return res.status(200).json({
//         message: "Basic contact and group list",
//         contacts: contactDetails,
//         groups,
//       });
//     }
//   } catch (err) {
//     console.error("Error in unified chat list:", err.stack);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };