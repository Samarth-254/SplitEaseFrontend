const express=require("express");
const {googleLogin, normalLogin, register, getMe}=require("../controllers/authController");
const {protect}=require("../middleware/authMiddleware");

const router=express.Router();

router.post("/google-login",googleLogin);
router.post("/login", normalLogin);
router.post("/register", register);
router.get("/me", protect, getMe);

module.exports=router;