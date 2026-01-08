const User=require('../models/User');
const cloudinary=require('../config/cloudinary');
const multer=require('multer');

const storage=multer.memoryStorage();
const upload=multer({
  storage:storage,
  limits:{fileSize:5*1024*1024},
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    
    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

exports.uploadMiddleware=upload.single('profileImage');

exports.getProfile=async(req,res)=>{
  try{
    const user=await User.findById(req.user.id);
    if(!user)return res.status(404).json({message:'User not found'});
    res.json(user);
  }catch(error){
    res.status(500).json({message:'Server error',error:error.message});
  }
};

exports.updateProfile=async(req,res)=>{
  try{
    const{name,email,mobile,gender,profileImage}=req.body;
    const user=await User.findById(req.user.id);
    if(!user)return res.status(404).json({message:'User not found'});
    
    if(name)user.name=name;
    if(email)user.email=email;
    if(mobile!==undefined)user.mobile=mobile;
    if(gender!==undefined)user.gender=gender;
    if(profileImage!==undefined)user.profileImage=profileImage;
    
    if(req.file){
      const uploadResult=await new Promise((resolve,reject)=>{
        const uploadStream=cloudinary.uploader.upload_stream(
          {
            folder:'profile_images',
            transformation:[{width:400,height:400,crop:'fill'}],
            format: 'jpg', // Convert all formats (including HEIC) to JPEG
            quality: 'auto'
          },
          (error,result)=>{
            if(error)reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      user.profileImage=uploadResult.secure_url;
    }
    
    await user.save();
    res.json(user);
  }catch(error){
    res.status(500).json({message:'Server error',error:error.message});
  }
};

exports.deleteProfileImage=async(req,res)=>{
  try{
    const user=await User.findById(req.user.id);
    if(!user)return res.status(404).json({message:'User not found'});
    
    user.profileImage=null;
    await user.save();
    res.json({message:'Profile image deleted',user});
  }catch(error){
    res.status(500).json({message:'Server error',error:error.message});
  }
};
