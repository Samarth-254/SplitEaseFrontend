const mongoose=require("mongoose");

const user=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        select:false
    },
    googleId:String,
    profileImage:{
        type:String,
        default:null
    },
    mobile:{
        type:String,
        default:null
    },
    gender:{
        type:String,
        enum:['Male','Female','Other',null],
        default:null
    },
},{timestamps:true}
);

module.exports=mongoose.model("User",user);