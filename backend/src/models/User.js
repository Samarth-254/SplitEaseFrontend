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

// Virtual to get profile image or generate default
user.virtual('avatar').get(function() {
    if (this.profileImage) {
        return this.profileImage;
    }
    // Generate default avatar from name
    const seed = this.name ? this.name.replace(/\s+/g, '') : this.email;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
});

// Ensure virtuals are included in JSON
user.set('toJSON', { virtuals: true });
user.set('toObject', { virtuals: true });

module.exports=mongoose.model("User",user);