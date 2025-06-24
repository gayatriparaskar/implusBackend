const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  fileUrl: { type: String }, // ✅ Stores URL/path to uploaded file
  timestamp: { type: Date, default: Date.now },
  seenBy: [String], // ✅ userIds who have seen it
  deliveredTo: [String], // optional
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  }, // optional
   read: { type: Boolean, default: false }, // ✅ This must exist
});

const chatModel = mongoose.model("Chat", ChatSchema);
module.exports = chatModel;
