// src/utils/otpStore.js
const mongoose  = require ("mongoose");

const otpStore = new Map(); // phone_number => { otp, expiresAt }
module.exports = otpStore;
