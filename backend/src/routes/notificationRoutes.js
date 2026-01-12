const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { subscribe, unsubscribe,checkSubscription} = require('../controllers/notificationController');

router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.post('/notifications/check', protect, checkSubscription);

module.exports = router;
