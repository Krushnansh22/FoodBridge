const Listing = require('../models/Listing');
const Request = require('../models/Request');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// ─── Points Calculation ───────────────────────────────────────────────────────
const calculatePoints = (servings) => {
  if (!servings || servings <= 0) return 10; // default minimum
  if (servings < 5) return 10;
  if (servings <= 10) return 20;
  if (servings <= 20) return 50;
  return 250; // more than 20 servings
};

// Get all approved requests that need delivery
exports.getAvailableDeliveries = async (req, res) => {
  try {
    const deliveries = await Request.find({ status: 'approved' })
      .populate('listing', 'title foodType quantity pickupAddress pickupLocation expiresAt servings')
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
      { path: 'listing', select: 'title foodType quantity pickupAddress pickupLocation servings' },
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
      .populate('listing', 'title foodType quantity pickupAddress pickupLocation servings')
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
    const request = await Request.findById(req.params.id)
      .populate('donor')
      .populate('listing', 'title quantity foodType pickupAddress')
      .populate('ngo', 'name organizationName');

    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    const otp = generateOTP();
    request.pickupOTP = otp;
    request.pickupOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await request.save();

    const driverUser = await User.findById(req.user._id).select('name phone vehicleType vehicleNumber');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌉 FoodBridge</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Food Rescue Platform</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">📦 Pickup Verification OTP</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Dear <strong>${request.donor.organizationName || request.donor.name}</strong>,
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            A FoodBridge delivery driver has arrived at your location to <strong>pick up</strong> the following food donation. 
            Please share the OTP below with the driver to confirm the pickup handover.
          </p>
          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Your Pickup OTP</p>
            <h1 style="color: #22c55e; font-size: 42px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">Valid for 10 minutes</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 15px;">📋 Order Details</h3>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Item:</strong> ${request.listing?.title || 'Food Donation'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Quantity:</strong> ${request.listing?.quantity || 'N/A'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Pickup Address:</strong> ${request.listing?.pickupAddress || 'N/A'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Receiving NGO:</strong> ${request.ngo?.organizationName || request.ngo?.name || 'N/A'}</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 15px;">🚚 Driver Details</h3>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Name:</strong> ${driverUser?.name || 'FoodBridge Driver'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Phone:</strong> ${driverUser?.phone || 'N/A'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Vehicle:</strong> ${(driverUser?.vehicleType || 'bike').charAt(0).toUpperCase() + (driverUser?.vehicleType || 'bike').slice(1)} — ${driverUser?.vehicleNumber || 'N/A'}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px; text-align: center;">
            If you did not expect this, please contact FoodBridge support immediately.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} FoodBridge — Connecting surplus food with communities in need.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: request.donor.email,
        subject: '📦 FoodBridge — Pickup Verification OTP',
        message: `Your FoodBridge Pickup OTP is: ${otp}. Share this with the driver to confirm pickup. Valid for 10 minutes.`,
        html
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
    const request = await Request.findById(req.params.id)
      .populate('donor', 'name organizationName email phone')
      .populate('ngo', 'name organizationName email phone')
      .populate('listing', 'title quantity foodType pickupAddress servings');

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

    // ─── Send Thank-You Email to Donor ────────────────────────────────────────
    try {
      const donorHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌉 FoodBridge</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Thank You For Your Generosity!</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">🙏 Thank You for Your Donation!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Dear <strong>${request.donor.organizationName || request.donor.name}</strong>,
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              We are truly grateful for your generous food donation. Your contribution has been successfully picked up 
              and is now on its way to <strong>${request.ngo?.organizationName || request.ngo?.name}</strong>, 
              where it will make a real difference in the lives of those in need.
            </p>
            <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #22c55e; margin: 0 0 12px;">📋 Donation Summary</h3>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Item:</strong> ${request.listing?.title || 'Food Donation'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Quantity:</strong> ${request.listing?.quantity || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Food Type:</strong> ${(request.listing?.foodType || 'other').charAt(0).toUpperCase() + (request.listing?.foodType || 'other').slice(1)}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Pickup Address:</strong> ${request.listing?.pickupAddress || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Picked Up At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 15px;">🤝 Receiving NGO Details</h3>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Organization:</strong> ${request.ngo?.organizationName || request.ngo?.name || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Contact:</strong> ${request.ngo?.phone || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Email:</strong> ${request.ngo?.email || 'N/A'}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              Every meal you save helps reduce food waste and feeds those who need it most. 
              Together, we are building a bridge between surplus food and hungry hearts. 💚
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              Thank you for being a part of the FoodBridge community!
            </p>
            <p style="color: #4b5563;">Warm regards,<br/><strong>The FoodBridge Team</strong></p>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} FoodBridge — Connecting surplus food with communities in need.</p>
          </div>
        </div>
      `;
      await sendEmail({
        email: request.donor.email,
        subject: '🙏 FoodBridge — Thank You for Your Food Donation!',
        message: `Thank you for your generous food donation of "${request.listing?.title}". It has been picked up and is on its way to ${request.ngo?.organizationName || request.ngo?.name}.`,
        html: donorHtml
      });
    } catch (emailErr) {
      console.error('Donor thank-you email error:', emailErr.message);
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver requests OTP from NGO for delivery
exports.requestDeliveryOTP = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('ngo')
      .populate('donor', 'name organizationName')
      .populate('listing', 'title quantity foodType pickupAddress');

    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    const otp = generateOTP();
    request.deliveryOTP = otp;
    request.deliveryOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await request.save();

    const driverUser = await User.findById(req.user._id).select('name phone vehicleType vehicleNumber');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌉 FoodBridge</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Food Rescue Platform</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">✅ Delivery Verification OTP</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Dear <strong>${request.ngo.organizationName || request.ngo.name}</strong>,
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            A FoodBridge delivery driver has arrived at your location to <strong>drop off</strong> a food donation. 
            Please share the OTP below with the driver to confirm the delivery has been received.
          </p>
          <div style="background: #e3f2fd; border: 2px solid #1565C0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Your Delivery OTP</p>
            <h1 style="color: #1565C0; font-size: 42px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">Valid for 10 minutes</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 15px;">📋 Order Details</h3>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Item:</strong> ${request.listing?.title || 'Food Donation'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Quantity:</strong> ${request.listing?.quantity || 'N/A'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Donated by:</strong> ${request.donor?.organizationName || request.donor?.name || 'N/A'}</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 15px;">🚚 Driver Details</h3>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Name:</strong> ${driverUser?.name || 'FoodBridge Driver'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Phone:</strong> ${driverUser?.phone || 'N/A'}</p>
            <p style="color: #4b5563; margin: 4px 0;"><strong>Vehicle:</strong> ${(driverUser?.vehicleType || 'bike').charAt(0).toUpperCase() + (driverUser?.vehicleType || 'bike').slice(1)} — ${driverUser?.vehicleNumber || 'N/A'}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px; text-align: center;">
            If you did not expect this delivery, please contact FoodBridge support immediately.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} FoodBridge — Connecting surplus food with communities in need.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: request.ngo.email,
        subject: '✅ FoodBridge — Delivery Verification OTP',
        message: `Your FoodBridge Delivery OTP is: ${otp}. Share this with the driver to confirm delivery. Valid for 10 minutes.`,
        html
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
    const request = await Request.findById(req.params.id)
      .populate('listing', 'title quantity foodType pickupAddress servings')
      .populate('donor', 'name organizationName')
      .populate('ngo', 'name organizationName');

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

    await Listing.findByIdAndUpdate(request.listing._id || request.listing, { status: 'collected' });

    // ─── Send Acknowledgement Email to Driver ─────────────────────────────────
    try {
      const driverUser = await User.findById(req.user._id).select('name email phone');
      const servings = request.listing?.servings || 0;
      const points = calculatePoints(servings);

      const driverHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1565C0, #0d47a1); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌉 FoodBridge</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Delivery Completed Successfully!</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a1a; margin-top: 0;">🎉 Great Job, ${driverUser?.name || 'Driver'}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Thank you for your incredible effort in delivering food to those in need. 
              Your dedication to the FoodBridge mission makes a real impact in our community.
            </p>
            <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #22c55e; margin: 0 0 12px;">📋 Delivery Summary</h3>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Item:</strong> ${request.listing?.title || 'Food Donation'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Quantity:</strong> ${request.listing?.quantity || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Servings:</strong> ~${servings} people</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Donated by:</strong> ${request.donor?.organizationName || request.donor?.name || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Delivered to:</strong> ${request.ngo?.organizationName || request.ngo?.name || 'N/A'}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Delivered at:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0 0 4px; font-weight: 600;">🏆 Points Earned</p>
              <h1 style="color: #d97706; font-size: 48px; margin: 0;">+${points}</h1>
              <p style="color: #92400e; font-size: 13px; margin: 8px 0 0;">
                ${servings < 5 ? 'Small delivery (< 5 servings) — 10 points' : ''}
                ${servings >= 5 && servings <= 10 ? 'Medium delivery (5-10 servings) — 20 points' : ''}
                ${servings > 10 && servings <= 20 ? 'Large delivery (11-20 servings) — 50 points' : ''}
                ${servings > 20 ? 'Extra large delivery (20+ servings) — 250 points!' : ''}
              </p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              Every delivery you make helps reduce food waste and feeds communities in need. 
              Keep up the great work! 🚚💚
            </p>
            <p style="color: #4b5563;">With gratitude,<br/><strong>The FoodBridge Team</strong></p>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} FoodBridge — Connecting surplus food with communities in need.</p>
          </div>
        </div>
      `;

      if (driverUser?.email) {
        await sendEmail({
          email: driverUser.email,
          subject: `🎉 FoodBridge — Delivery Complete! You earned +${points} points!`,
          message: `Great job ${driverUser.name}! You successfully delivered "${request.listing?.title}" to ${request.ngo?.organizationName || request.ngo?.name}. You earned ${points} points for this delivery!`,
          html: driverHtml
        });
      }
    } catch (emailErr) {
      console.error('Driver acknowledgement email error:', emailErr.message);
      // Don't fail the request if email fails
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};