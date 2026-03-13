const express = require('express');
const router = express.Router();
const { getStats, getUsers, getListings, toggleUserStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/listings', getListings);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
