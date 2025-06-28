const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
  callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For 1-to-1
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  callType: { type: String, enum: ['audio', 'video'], required: true },
  callMode: { type: String, enum: ['one-to-one', 'group'], required: true },

  status: { type: String, enum: ['missed', 'declined', 'completed'], default: 'completed' },

  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },

  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('CallLog', CallLogSchema);
