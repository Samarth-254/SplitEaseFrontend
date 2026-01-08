const express = require("express");
const { sendInviteEmail } = require("../controllers/inviteController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/:groupId/email", protect, sendInviteEmail);

module.exports = router;
