// src/utils/sendPushNotification.js
const webPush = require('web-push');
const User = require('../models/Auth');
const dotenv = require('dotenv');
dotenv.config();
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
webPush.setVapidDetails(
  'mailto:hello@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

async function sendPushNotification(userId, data) {
  try {
    const user = await User.findById(userId);
    if (!user?.subscription) return;

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url || '/', // fallback to homepage
    });
    console.log(data.body);
    

    await webPush.sendNotification(user.subscription, payload);
  } catch (err) {
    console.error('🔴 Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };
