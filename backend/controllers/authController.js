const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, organizationName, vehicleType, vehicleNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({
      name, email, password,
      role: role || 'donor',
      phone, address, organizationName,
      vehicleType, vehicleNumber,
    });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({ success: true, token, user: { ...user.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'address', 'organizationName',
      'vehicleType', 'vehicleNumber', 'isAvailable', 'currentLocation',
      'bio', 'city', 'contactPerson', 'donorType', 'businessName',
      'typicalDonationTime', 'preferences'
    ];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Forgot Password — send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account with that email' });
    }
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send via email
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
          <img src="cid:foodbridge-logo" alt="FoodBridge Logo" style="width: 80px; height: auto; margin-bottom: 10px;" />
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">FoodBridge</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Password Reset Request</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">🔐 Password Reset OTP</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Dear <strong>${user.name}</strong>,
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset your FoodBridge account password. 
            Please use the OTP below to proceed with the password reset.
          </p>
          <div style="background: #fff3e0; border: 2px solid #fb8c00; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Your Password Reset OTP</p>
            <h1 style="color: #e65100; font-size: 42px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">Valid for 10 minutes</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            If you did not request this password reset, please ignore this email. 
            Your account remains secure.
          </p>
          <p style="color: #4b5563;">Best regards,<br/><strong>The FoodBridge Team</strong></p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} FoodBridge — Connecting surplus food with communities in need.</p>
        </div>
      </div>
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 FoodBridge — Password Reset OTP',
        message: `Your password reset OTP is: ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
        html,
        attachments: [{
          filename: 'logo.png',
          path: require('path').join(__dirname, '../../mobile/public/logo.png'),
          cid: 'foodbridge-logo'
        }]
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email',
      });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Email could not be sent', err);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    res.json({ success: true, message: 'OTP verified', email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();
    const token = signToken(user._id);
    res.json({ success: true, message: 'Password reset successful', token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};