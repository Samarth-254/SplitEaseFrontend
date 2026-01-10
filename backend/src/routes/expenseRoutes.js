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
const aiCategoryService = require("../services/aiCategoryService");

router.post("/", protect, addExpense);
router.get("/group/:groupId", protect, getGroupExpenses);
router.put("/:expenseId", protect, updateExpense);
router.delete("/:expenseId", protect, deleteExpense);
router.get("/group/:groupId/balances", protect, calculateBalances);

// AI category detection endpoint
router.post("/detect-category", protect, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const category = await aiCategoryService.detectCategory(description);
    
    res.json({ 
      category,
      description,
      availableCategories: aiCategoryService.getAvailableCategories()
    });
  } catch (error) {
    console.error("Error detecting category:", error);
    res.status(500).json({ 
      message: "Failed to detect category",
      error: error.message 
    });
  }
});

module.exports = router;
