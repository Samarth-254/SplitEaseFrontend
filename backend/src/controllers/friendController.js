const Group = require('../models/Group');
const User = require('../models/User');

// Get all friends for the current user (all unique users from their groups)
exports.getFriends = async (req, res) => {
  try {
    // Get all groups the user is a member of
    const groups = await Group.find({
      members: req.user._id,
      isArchived: false
    }).populate('members', 'name email profileImage mobile gender');

    // Collect all unique users (excluding current user)
    const friendsMap = new Map();
    
    groups.forEach(group => {
      group.members.forEach(member => {
        const memberId = member._id.toString();
        // Skip current user
        if (memberId !== req.user._id.toString() && !friendsMap.has(memberId)) {
          friendsMap.set(memberId, {
            _id: member._id,
            name: member.name,
            email: member.email,
            profileImage: member.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name.replace(/\s+/g, '')}`,
            mobile: member.mobile,
            gender: member.gender
          });
        }
      });
    });

    const friends = Array.from(friendsMap.values());
    res.json(friends);
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search for potential friends (users who aren't already friends)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    // Search users by name or email
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email profileImage mobile gender').limit(10);

    // Add default avatars
    const usersWithAvatars = users.map(user => ({
      ...user.toObject(),
      profileImage: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s+/g, '')}`
    }));

    res.json(usersWithAvatars);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
