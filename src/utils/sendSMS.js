// This is a simulated SMS sender. Replace console.log with Twilio logic when ready.
const mongoose = require("mongoose");

const sendSMS = async (to, message) => {
  try {
    console.log(`📲 Simulated SMS to ${to}: ${message}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
    return false;
  }
};

module.exports = sendSMS;
