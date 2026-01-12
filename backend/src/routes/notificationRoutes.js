const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  subscribe, 
  unsubscribe, 
  checkSubscription,
  verifySubscription,     
  getVapidPublicKey       
} = require('../controllers/notificationController');

router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.post('/notifications/check', protect, checkSubscription);
router.post('/notifications/verify', protect, verifySubscription);
router.get('/notifications/vapid-public-key', getVapidPublicKey); 

module.exports = router;
