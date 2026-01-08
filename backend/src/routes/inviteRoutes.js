const express = require("express");
const { sendInviteEmail, getInviteInfo } = require("../controllers/inviteController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/:groupId/email", protect, sendInviteEmail);
router.post("/info", getInviteInfo);

module.exports = router;
