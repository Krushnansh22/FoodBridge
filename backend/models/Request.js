const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'collected'],
    default: 'pending',
  },
  driverStatus: {
    type: String,
    enum: ['none', 'accepted', 'heading_to_pickup', 'picked_up', 'delivered'],
    default: 'none',
  },
  pickupTime: { type: Date },
  collectedAt: { type: Date },
  rejectionReason: { type: String },
  ngoLocation: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  driverAcceptedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  pickupOTP: { type: String },
  pickupOTPExpire: { type: Date },
  deliveryOTP: { type: String },
  deliveryOTPExpire: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);