const jwt=require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client }=require("google-auth-library");
const User=require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Generate default avatar if no profile image
    const profileImage = user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s+/g, '')}`;

    res.json({ 
      token: jwtToken, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage,
        mobile: user.mobile,
        gender: user.gender
      }
    });

  } catch (err) {
    res.status(401).json({ message: "Google auth failed" });
  }
};

const normalLogin=async(req,res)=>{
    try{
    const {email,password}=req.body;

    if(!email){
        return res.status(400).json({ message: "Email is required" });
    }
    if(!password){
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user=await User.findOne({ email }).select('+password');
    if(!user){
        return res.status(401).json({message:"User not found"});
    }
    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google login. Please continue with Google."
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token=jwt.sign(
        {id:user._id},
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    // Generate default avatar if no profile image
    const profileImage = user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s+/g, '')}`;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profileImage,
        mobile: user.mobile,
        gender: user.gender
      }
    });
}catch(err){
    console.log(err);
    res.status(500).json({ message: "Server error" });
}

}
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Generate default avatar if no profile image
    const profileImage = user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s+/g, '')}`;

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage,
        mobile: user.mobile,
        gender: user.gender
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate default avatar if no profile image
    const profileImage = user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s+/g, '')}`;
    
    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage,
        mobile: user.mobile,
        gender: user.gender
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports={googleLogin, normalLogin, register, getMe};