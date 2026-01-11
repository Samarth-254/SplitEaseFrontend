const Friend = require('../models/Friend');
const Group = require('../models/Group');

/**
 * Auto-detect and create friendships when users are in the same group
 * @param {String} groupId - The group ID
 * @param {Array} memberIds - Array of member IDs in the group
 */
const autoDetectFriends = async (groupId, memberIds) => {
  try {
    // For each pair of members in the group
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const user1 = memberIds[i].toString();
        const user2 = memberIds[j].toString();
        
        // Check if friendship already exists
        const existingFriendship = await Friend.findOne({
          $or: [
            { user1, user2 },
            { user1: user2, user2: user1 }
          ]
        });
        
        if (existingFriendship) {
          // Add this group to shared groups if not already there
          if (!existingFriendship.sharedGroups.includes(groupId)) {
            existingFriendship.sharedGroups.push(groupId);
            await existingFriendship.save();
          }
        } else {
          // Create new friendship
          await Friend.create({
            user1,
            user2,
            sharedGroups: [groupId]
          });
        }
      }
    }
  } catch (error) {
    console.error('Error auto-detecting friends:', error);
    throw error;
  }
};

/**
 * Remove group from shared groups when a member leaves
 * @param {String} groupId - The group ID
 * @param {String} userId - The user ID who left
 */
const updateFriendsOnLeave = async (groupId, userId) => {
  try {
    // Find all friendships involving this user with this group
    const friendships = await Friend.find({
      $or: [{ user1: userId }, { user2: userId }],
      sharedGroups: groupId
    });
    
    for (const friendship of friendships) {
      // Remove the group from shared groups
      friendship.sharedGroups = friendship.sharedGroups.filter(
        g => g.toString() !== groupId.toString()
      );
      
      // If no shared groups remain, delete the friendship
      if (friendship.sharedGroups.length === 0) {
        await Friend.deleteOne({ _id: friendship._id });
      } else {
        await friendship.save();
      }
    }
  } catch (error) {
    console.error('Error updating friends on leave:', error);
    throw error;
  }
};

/**
 * Get all friends for a user
 * @param {String} userId - The user ID
 */
const getUserFriends = async (userId) => {
  try {
    return await Friend.getFriends(userId);
  } catch (error) {
    console.error('Error getting user friends:', error);
    throw error;
  }
};

module.exports = {
  autoDetectFriends,
  updateFriendsOnLeave,
  getUserFriends
};
