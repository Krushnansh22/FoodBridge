const Request = require('../models/Request');
const Listing = require('../models/Listing');

// NGO requests a pickup
exports.createRequest = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Listing is not available' });
    }
    // Check for duplicate
    const existing = await Request.findOne({ listing: listing._id, ngo: req.user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending request for this listing' });
    }
    const request = await Request.create({
      listing: listing._id,
      ngo: req.user._id,
      donor: listing.donor,
      message: req.body.message,
      pickupTime: req.body.pickupTime,
    });
    // Mark listing as requested
    listing.status = 'requested';
    await listing.save();
    await request.populate([
      { path: 'listing', select: 'title foodType quantity pickupAddress expiresAt' },
      { path: 'ngo', select: 'name organizationName phone email' },
      { path: 'donor', select: 'name organizationName phone' },
    ]);
    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Donor views requests for their listings
exports.getDonorRequests = async (req, res) => {
  try {
    const requests = await Request.find({ donor: req.user._id })
      .populate('listing', 'title foodType quantity pickupAddress status')
      .populate('ngo', 'name organizationName phone email')
      .sort('-createdAt');
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// NGO views their own requests
exports.getNgoRequests = async (req, res) => {
  try {
    const requests = await Request.find({ ngo: req.user._id })
      .populate('listing', 'title foodType quantity pickupAddress expiresAt status')
      .populate('donor', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Donor approves a request
exports.approveRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('listing');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    request.status = 'approved';
    await request.save();
    // Reject all other pending requests for same listing
    await Request.updateMany(
      { listing: request.listing._id, _id: { $ne: request._id }, status: 'pending' },
      { status: 'rejected', rejectionReason: 'Another NGO was selected' }
    );
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Donor rejects a request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('listing');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    request.status = 'rejected';
    request.rejectionReason = req.body.reason || 'Request declined by donor';
    await request.save();
    // Reset listing to available if no other approved requests
    const approvedRequests = await Request.countDocuments({ listing: request.listing._id, status: 'approved' });
    if (approvedRequests === 0) {
      await Listing.findByIdAndUpdate(request.listing._id, { status: 'available' });
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// NGO marks as collected
exports.markCollected = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Request must be approved first' });
    }
    request.status = 'collected';
    request.collectedAt = new Date();
    await request.save();
    await Listing.findByIdAndUpdate(request.listing, { status: 'collected' });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
