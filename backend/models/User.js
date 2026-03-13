const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['donor', 'ngo', 'admin', 'driver'], default: 'donor' },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  organizationName: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  // Donor specific
  bio: { type: String, trim: true },
  city: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  donorType: { type: String, trim: true },
  businessName: { type: String, trim: true },
  typicalDonationTime: { type: String, trim: true },
  profilePhoto: { type: String },
  // Driver specific
  vehicleType: { type: String, enum: ['bike', 'car', 'van', 'truck'], default: 'bike' },
  vehicleNumber: { type: String },
  isAvailable: { type: Boolean, default: true },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  // Preferences
  preferences: {
    pushNotifications: { type: Boolean, default: true },
    urgentRescueAlerts: { type: Boolean, default: false },
  },
  // Stats
  stats: {
    mealsSaved: { type: Number, default: 0 },
    pickupsDone: { type: Number, default: 0 },
  },
  verificationStatus: { type: String, default: 'Pending Verification' },
  // Forgot password
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpire: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOTP = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordOTP;
  delete obj.resetPasswordOTPExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);