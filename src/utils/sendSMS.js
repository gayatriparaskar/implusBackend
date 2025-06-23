// // // utils/sendSMS.js
// // const twilio = require('twilio');

// // const client = twilio(
// //   process.env.TWILIO_ACCOUNT_SID,
// //   process.env.TWILIO_AUTH_TOKEN
// // );

// // module.exports.sendSMS = async function sendSMS(to, body) {
// //   try {
// //     const message = await client.messages.create({
// //       body,
// //       from: process.env.TWILIO_PHONE_NUMBER,
// //       to,
// //     });

// //     console.log("✅ SMS sent via Twilio:", message.sid);
// //     return true;
// //   } catch (error) {
// //     console.error("❌ Twilio SMS Error:", error.message);
// //     return false;
// //   }
// // };


// // This is a simulated SMS sender. Replace console.log with Twilio logic when ready.
// const mongoose = require("mongoose");

// const sendSMS = async (to, message) => {
//   try {
//     console.log(`📲 Simulated SMS to ${to}: ${message}`);
//     return true;
//   } catch (error) {
//     console.error("❌ Failed to send SMS:", error);
//     return false;
//   }
// };

// module.exports = sendSMS;

// src/utils/otpStore.js
const mongoose  = require ("mongoose");

const otpStore = new Map(); // phone_number => { otp, expiresAt }
module.exports = otpStore;
