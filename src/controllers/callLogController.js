const CallLog = require('../routes/callLogs');

async function createCallLog(data) {
  return await CallLog.create({
    callerId: data.callerId,
    receiverId: data.receiverId,
    groupId: data.groupId || null,
    callType: data.callType,
    callMode: data.callMode,
    participants: data.participants || [],
    startTime: new Date(),
    status: 'completed'
  });
}

async function endCallLog(logId) {
  return await CallLog.findByIdAndUpdate(logId, {
    endTime: new Date(),
    status: 'completed'
  });
}

module.exports = { createCallLog, endCallLog };
