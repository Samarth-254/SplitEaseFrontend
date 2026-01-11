const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sharedGroups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    }]
  },
  { timestamps: true }
);

friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

friendSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { user1: userId1, user2: userId2 },
      { user1: userId2, user2: userId1 }
    ]
  });
  return !!friendship;
};

friendSchema.statics.getFriends = async function(userId) {
  const friendships = await this.find({
    $or: [
      { user1: userId },
      { user2: userId }
    ]
  }).populate('user1 user2', 'name email profileImage mobile gender');
  
  return friendships.map(friendship => {
    const friend = friendship.user1._id.toString() === userId.toString() 
      ? friendship.user2 
      : friendship.user1;
    
    return {
      ...friend.toObject(),
      friendshipId: friendship._id,
      sharedGroups: friendship.sharedGroups,
      profileImage: friend.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name.replace(/\s+/g, '')}`
    };
  });
};

module.exports = mongoose.model("Friend", friendSchema);
