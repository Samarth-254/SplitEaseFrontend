const express = require('express');
const router = express.Router();
const { getFriends, searchUsers } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all friends
router.get('/', getFriends);

// Search users
router.get('/search', searchUsers);

module.exports = router;
