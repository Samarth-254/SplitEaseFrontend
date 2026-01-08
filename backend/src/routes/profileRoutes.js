const express=require('express');
const router=express.Router();
const{getProfile,updateProfile,deleteProfileImage,uploadMiddleware}=require('../controllers/profileController');
const{protect}=require('../middleware/authMiddleware');

router.get('/',protect,getProfile);
router.put('/',protect,uploadMiddleware,updateProfile);
router.delete('/image',protect,deleteProfileImage);

module.exports=router;
