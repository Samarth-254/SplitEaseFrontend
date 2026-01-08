const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addExpense,
  getGroupExpenses,
  deleteExpense,
  updateExpense,
  calculateBalances
} = require("../controllers/expenseController");

router.post("/", protect, addExpense);
router.get("/group/:groupId", protect, getGroupExpenses);
router.put("/:expenseId", protect, updateExpense);
router.delete("/:expenseId", protect, deleteExpense);
router.get("/group/:groupId/balances", protect, calculateBalances);

module.exports = router;
