const express = require('express');
const router = express.Router();
const CallLog = require('./callLogs');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const logs = await CallLog.find({
    $or: [
      { callerId: userId },
      { receiverId: userId },
      { participants: userId }
    ]
  }).populate('callerId receiverId groupId participants').sort({ createdAt: -1 });

  res.json({ success: true, data: logs });
});

module.exports = router;
