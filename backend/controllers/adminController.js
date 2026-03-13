const User = require('../models/User');
const Listing = require('../models/Listing');
const Request = require('../models/Request');

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalListings, totalRequests, collected] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Request.countDocuments(),
      Request.countDocuments({ status: 'collected' }),
    ]);
    res.json({ success: true, stats: { totalUsers, totalListings, totalRequests, collected } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate('donor', 'name organizationName email')
      .sort('-createdAt');
    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
