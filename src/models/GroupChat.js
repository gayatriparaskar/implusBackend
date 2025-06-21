const mongoose = require('mongoose');

const GroupChatSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  senderId: { type: String, required: true },
  message: { type: String, default: "" },  // Optional for some types
  messageType: { 
    type: String,
    enum: ['text', 'visitor', 'checkin', 'checkout', 'task', 'note', 'file'],
    default: 'text'
  },
  payload: { type: mongoose.Schema.Types.Mixed }, // store extra info like visitor name, taskId, etc
  timestamp: { type: Date, default: Date.now }
});

const GroupChatModel = mongoose.model('GroupChat', GroupChatSchema)

module.exports = GroupChatModel;