const express = require('express');
const router = express.Router();
const {
  createListing, getAvailableListings, getMyListings,
  getListing, updateListing, deleteListing, getExpiredListings
} = require('../controllers/listingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/expired', protect, authorize('admin', 'donor'), getExpiredListings);
router.get('/', protect, getAvailableListings);
router.get('/mine', protect, authorize('donor'), getMyListings);
router.get('/:id', protect, getListing);
router.post('/', protect, authorize('donor'), createListing);
router.put('/:id', protect, authorize('donor'), updateListing);
router.delete('/:id', protect, authorize('donor'), deleteListing);

module.exports = router;
