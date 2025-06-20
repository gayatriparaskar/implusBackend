const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  price: { type: Number, required: true }, 
  offerPrice: { type: Number }, 
  type: {
    type: String,
    enum: ['Free', 'Standard', 'Premium'],
    default: 'Free',
  },
  validity: { type: String, required: true }, 
  features: {
    listingPosition: { type: String }, // 'After Featured', 'TOP'
    bannerAd: { type: Boolean, default: false },
    bannerAdDuration: { type: String, default: '-' }, // '1 Year'
    businessCategories: { type: String }, // 'Limited', '3x'
    premiumSeal: { type: Boolean, default: false },
    visibility: { type: String }, // 'Basic', '2x', '10x'
    customerReach: { type: String }, // 'Limited', '5x', '10x'
    customerEnquiries: { type: String }, // 'Limited', 'UNLIMITED'
    priorityEnquiries: { type: Boolean, default: false },
    enquiriesWhatsapp: { type: Boolean, default: true },
    enquiriesSMSCalls: { type: Boolean, default: true },
    addProductsServices: { type: String }, // 'Limited', 'UNLIMITED'
    addPhotos: { type: String }, // 'Limited', 'UNLIMITED'
    deliverySystem: { type: Boolean },
    analytics: { type: Boolean },
    imageLimit: { type: Number }, // For upload restriction
    videoLimit: { type: Number }, // For upload restriction
  },
}, {
  timestamps: true,
});

const PlanModel = mongoose.model('Plan', PlanSchema);
module.exports = PlanModel;
