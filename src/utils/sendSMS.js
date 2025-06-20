// utils/sendSMS.js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports.sendSMS = async function sendSMS(to, body) {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("✅ SMS sent via Twilio:", message.sid);
    return true;
  } catch (error) {
    console.error("❌ Twilio SMS Error:", error.message);
    return false;
  }
};

