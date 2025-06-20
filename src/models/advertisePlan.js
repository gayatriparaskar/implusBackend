// models/AdvertPlan.js
const mongoose = require("mongoose");

const AdvertPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number },
    validity: { type: String, required: true }, // e.g., "30 Days"
    features: {
      banner: { type: Boolean, default: false },
      bannerDuration: { type: String, default: "-" },
      visibility: { type: String }, // e.g., 'High', 'Medium', 'Low'
      promoteHomePage: { type: Boolean, default: false },
      promoteCategoryPage: { type: Boolean, default: false },
      whatsappCTA: { type: Boolean, default: true },
      enquiryLimit: { type: String }, // Limited or UNLIMITED
      imageLimit: { type: Number },
      videoLimit: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdvertPlan", AdvertPlanSchema);
