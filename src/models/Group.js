const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true }], // ✅ list of admin userIds
  createdAt: { type: Date, default: Date.now },
  timestamps:true
});

 const GroupModel = mongoose.model('Group', GroupSchema);

module.exports = GroupModel;