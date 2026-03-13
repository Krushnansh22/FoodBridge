const Listing = require('../models/Listing');
const Request = require('../models/Request');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Get all approved requests that need delivery
exports.getAvailableDeliveries = async (req, res) => {
  try {
    const deliveries = await Request.find({ status: 'approved' })
      .populate('listing', 'title foodType quantity pickupAddress pickupLocation expiresAt')
      .populate('donor', 'name organizationName phone address')
      .populate('ngo', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver accepts a delivery
exports.acceptDelivery = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Delivery not available' });
    }
    if (request.driver) {
      return res.status(400).json({ success: false, message: 'Delivery already taken by another driver' });
    }
    request.driver = req.user._id;
    request.driverStatus = 'accepted';
    request.driverAcceptedAt = new Date();
    await request.save();
    await request.populate([
      { path: 'listing', select: 'title foodType quantity pickupAddress pickupLocation' },
      { path: 'donor', select: 'name organizationName phone address' },
      { path: 'ngo', select: 'name organizationName phone address' },
      { path: 'driver', select: 'name phone vehicleType vehicleNumber' },
    ]);
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver updates delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['heading_to_pickup', 'picked_up', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }
    request.driverStatus = status;
    if (status === 'picked_up') request.pickedUpAt = new Date();
    if (status === 'delivered') {
      request.deliveredAt = new Date();
      request.status = 'collected';
      await Listing.findByIdAndUpdate(request.listing, { status: 'collected' });
    }
    await request.save();
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver updates their live location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { latitude, longitude },
    });
    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get driver's active deliveries
exports.getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Request.find({ driver: req.user._id })
      .populate('listing', 'title foodType quantity pickupAddress pickupLocation')
      .populate('donor', 'name organizationName phone address')
      .populate('ngo', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Driver requests OTP from Donor for pickup
exports.requestPickupOTP = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('donor');
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    const otp = generateOTP();
    // In production, encrypt or hash if necessary, but we'll save simple text since it's short lived
    request.pickupOTP = otp;
    request.pickupOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await request.save();

    const message = `Your FoodBridge Driver is requesting pickup confirmation.\n\nYour Pickup OTP is: ${otp}\nShare this with the driver to confirm pickup.`;

    try {
      await sendEmail({
        email: request.donor.email,
        subject: 'FoodBridge Pickup OTP',
        message
      });
      res.json({ success: true, message: 'OTP sent to Donor' });
    } catch (err) {
      request.pickupOTP = undefined;
      request.pickupOTPExpire = undefined;
      await request.save();
      console.error('Email error', err);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver verifies Donor's Pickup OTP
exports.verifyPickupOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    if (!request.pickupOTP || request.pickupOTP !== otp || request.pickupOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP matched, update status
    request.driverStatus = 'picked_up';
    request.pickedUpAt = new Date();
    request.pickupOTP = undefined;
    request.pickupOTPExpire = undefined;
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver requests OTP from NGO for delivery
exports.requestDeliveryOTP = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('ngo');
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    const otp = generateOTP();
    request.deliveryOTP = otp;
    request.deliveryOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await request.save();

    const message = `Your FoodBridge Driver is at the location.\n\nYour Delivery OTP is: ${otp}\nShare this with the driver to confirm delivery.`;

    try {
      await sendEmail({
        email: request.ngo.email,
        subject: 'FoodBridge Delivery OTP',
        message
      });
      res.json({ success: true, message: 'OTP sent to NGO' });
    } catch (err) {
      request.deliveryOTP = undefined;
      request.deliveryOTPExpire = undefined;
      await request.save();
      console.error('Email error', err);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver verifies NGO's Delivery OTP
exports.verifyDeliveryOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    if (!request.deliveryOTP || request.deliveryOTP !== otp || request.deliveryOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP matched, update status
    request.driverStatus = 'delivered';
    request.deliveredAt = new Date();
    request.status = 'collected';
    request.deliveryOTP = undefined;
    request.deliveryOTPExpire = undefined;
    await request.save();

    await Listing.findByIdAndUpdate(request.listing, { status: 'collected' });

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};