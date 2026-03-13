const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  foodType: {
    type: String,
    enum: ['cooked', 'raw', 'packaged', 'beverages', 'bakery', 'other'],
    required: true,
  },
  quantity: { type: String, required: true },
  servings: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  pickupAddress: { type: String, required: true },
  pickupLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  status: {
    type: String,
    enum: ['available', 'requested', 'collected', 'expired', 'cancelled'],
    default: 'available',
  },
  images: [{ type: String }],
  allergens: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);