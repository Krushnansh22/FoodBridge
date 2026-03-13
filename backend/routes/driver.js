const express = require('express');
const router = express.Router();
const {
  getAvailableDeliveries, acceptDelivery,
  updateDeliveryStatus, updateLocation, getMyDeliveries,
  requestPickupOTP, verifyPickupOTP, requestDeliveryOTP, verifyDeliveryOTP
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('driver'));

router.get('/deliveries', getAvailableDeliveries);
router.get('/deliveries/mine', getMyDeliveries);
router.put('/deliveries/:id/accept', acceptDelivery);
router.put('/deliveries/:id/status', updateDeliveryStatus);
router.put('/location', updateLocation);

router.post('/deliveries/:id/pickup-otp', requestPickupOTP);
router.post('/deliveries/:id/verify-pickup-otp', verifyPickupOTP);
router.post('/deliveries/:id/delivery-otp', requestDeliveryOTP);
router.post('/deliveries/:id/verify-delivery-otp', verifyDeliveryOTP);

module.exports = router;