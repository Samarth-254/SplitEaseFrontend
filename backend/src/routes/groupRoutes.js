const express = require("express");
const {
  createGroup,
  generateInviteLink,
  joinGroup,
  getUserGroups,
  sendPaymentReminder,
  addFriendsToGroup,
  recordSettlement,
  getGroupSettlements
} = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUserGroups);
router.post("/", protect, createGroup);
router.post("/:groupId/invite", protect, generateInviteLink);
router.post("/join", protect, joinGroup);
router.post("/:groupId/remind", protect, sendPaymentReminder);
router.post("/:groupId/add-friends", protect, addFriendsToGroup);
router.post("/:groupId/settlements", protect, recordSettlement);
router.get("/:groupId/settlements", protect, getGroupSettlements);

module.exports = router;
