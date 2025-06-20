const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  images: [{ type: String }],   // URLs
videos: [{ type: String }],
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    review: String,
    date: { type: Date, default: Date.now }
  }],
  specility:{type:String},
  block:{type:String},
  features:[String],
  keyWords:[String],
  lead:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const BussinessModel= mongoose.model('Business', businessSchema);

module.exports = BussinessModel ;