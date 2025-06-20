const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "AdvertPlan", required: true },
  title: { type: String, required: true },
  description: String,
  image: String,
  videos: [String],
  url: String,
  position: { type: String, enum: ['home_banner', 'sidebar', 'footer'] },
  status: { type: String, enum: ["pending", "active", "expired"], default: "pending" },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advertisement', advertisementSchema);


