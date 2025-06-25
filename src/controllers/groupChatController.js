const mongoose = require ("mongoose");

const GroupChatModel = require("../models/GroupChat");
const { encrypt, decrypt } = require("../utils/encryption");

// module.exports.sendGroupMessage = async (req, res) => {
//   try {
//     const { groupId, senderId, message } = req.body;

//     const messages = await GroupChatModel.create({
//       groupId,
//       senderId,
//       message,
//     });

//     res.status(201).json({ success: true, message: "Message sent", data: messages });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to send", error: error.message });
//   }
// };



module.exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId, senderId, message, messageType = 'text', payload = {} } = req.body;

    const encryptedMessage = encrypt(message); // 🔐 Encrypt the message only

    const newMessage = await GroupChatModel.create({
      groupId,
      senderId,
      message: encryptedMessage,
      messageType,
      payload,
    });

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send",
      error: error.message,
    });
  }
};



// module.exports.getGroupMessages = async (req, res) => {
//   try {
//     const { groupId } = req.params;

//     const messages = await GroupChatModel.find({ groupId }).sort({ timestamp: 1 });

//     res.status(200).json({ success: true, data: messages });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to fetch", error: error.message });
//   }
// };



module.exports.getGroupMessages = async (req, res) => {
   console.log("🔍 GET group messages hit");
  try {
    const { groupId } = req.params;

    const messages = await GroupChatModel.find({ groupId }).sort({ timestamp: 1 });

    // 🔓 Decrypt messages before returning
    const decryptedMessages = messages.map((msg) => ({
      ...msg._doc,
      message: decrypt(msg.message),
    }));

    res.status(200).json({ success: true, data: decryptedMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch", error: error.message });
  }
};