// src/utils/sendPushNotification.js
const webPush = require('web-push');
const User = require('../models/Auth');

webPush.setVapidDetails(
  'mailto:hello@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
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

    await webPush.sendNotification(user.subscription, payload);
  } catch (err) {
    console.error('🔴 Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };
