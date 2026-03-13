const Listing = require('../models/Listing');
const Request = require('../models/Request');

// Create listing (donor)
exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({ ...req.body, donor: req.user._id });
    await listing.populate('donor', 'name email organizationName phone');
    res.status(201).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all available listings (for NGOs to browse)
exports.getAvailableListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'available', expiresAt: { $gt: new Date() } })
      .populate('donor', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get expired listings (for Admin)
exports.getExpiredListings = async (req, res) => {
  try {
    const listings = await Listing.find({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { status: 'expired' }
      ]
    })
      .populate('donor', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get donor's own listings
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ donor: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single listing
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('donor', 'name organizationName phone address');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update listing (donor)
exports.updateListing = async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete listing (donor)
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
