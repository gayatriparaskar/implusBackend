const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
 
const chatModel = mongoose.model('Chat', ChatSchema);
module.exports = chatModel;
