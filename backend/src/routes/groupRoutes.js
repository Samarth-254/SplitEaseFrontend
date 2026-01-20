const express = require("express");
const {
  createGroup,
  updateGroup,
  generateInviteLink,
  joinGroup,
  getUserGroups,
  sendPaymentReminder,
  addFriendsToGroup,
  recordSettlement,
  getGroupSettlements,
  sendCombinedReminder
} = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUserGroups);
router.post("/", protect, createGroup);
router.put("/:groupId", protect, updateGroup);
router.post("/:groupId/invite", protect, generateInviteLink);
router.post("/join", protect, joinGroup);
router.post("/:groupId/remind", protect, sendPaymentReminder);
router.post("/:groupId/add-friends", protect, addFriendsToGroup);
router.post("/:groupId/settlements", protect, recordSettlement);
router.get("/:groupId/settlements", protect, getGroupSettlements);
router.post("/remind/combined", protect, sendCombinedReminder);

module.exports = router;
