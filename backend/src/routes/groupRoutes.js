const express = require("express");
const {
  createGroup,
  generateInviteLink,
  joinGroup,
  getUserGroups,
  sendPaymentReminder
} = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUserGroups);
router.post("/", protect, createGroup);
router.post("/:groupId/invite", protect, generateInviteLink);
router.post("/join", protect, joinGroup);
router.post("/:groupId/remind", protect, sendPaymentReminder);

module.exports = router;
