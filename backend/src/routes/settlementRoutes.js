const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  recordSettlement,
  getGroupSettlements
} = require("../controllers/settlementController");

router.post("/", protect, recordSettlement);
router.get("/group/:groupId", protect, getGroupSettlements);

module.exports = router;
