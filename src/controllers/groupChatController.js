const mongoose = require ("mongoose");

const GroupChatModel = require("../models/GroupChat");

module.exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId, senderId, message } = req.body;

    const messages = await GroupChatModel.create({
      groupId,
      senderId,
      message,
    });

    res.status(201).json({ success: true, message: "Message sent", data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send", error: error.message });
  }
};

module.exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await GroupChatModel.find({ groupId }).sort({ timestamp: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch", error: error.message });
  }
};
