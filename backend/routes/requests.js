const express = require('express');
const router = express.Router();
const {
  createRequest, getDonorRequests, getNgoRequests,
  approveRequest, rejectRequest, markCollected
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

router.post('/listing/:listingId', protect, authorize('ngo'), createRequest);
router.get('/donor', protect, authorize('donor'), getDonorRequests);
router.get('/ngo', protect, authorize('ngo'), getNgoRequests);
router.put('/:id/approve', protect, authorize('donor'), approveRequest);
router.put('/:id/reject', protect, authorize('donor'), rejectRequest);
router.put('/:id/collect', protect, authorize('ngo'), markCollected);

module.exports = router;
