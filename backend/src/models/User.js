const mongoose = require("mongoose");

const user = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    select: false
  },
  googleId: String,
  profileImage: {
    type: String,
    default: null
  },
  mobile: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', null],
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

user.virtual('avatar').get(function() {
  if (this.profileImage) {
    return this.profileImage;
  }
  const seed = this.name ? this.name.replace(/\s+/g, '') : this.email;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
});

user.set('toJSON', { virtuals: true });
user.set('toObject', { virtuals: true });

module.exports = mongoose.model("User", user);
