const express = require("express");
const { 
  googleLogin, 
  normalLogin, 
  register, 
  getMe, 
  forgotPassword, 
  resetPassword 
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/google-login", googleLogin);
router.post("/login", normalLogin);
router.post("/register", register);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
