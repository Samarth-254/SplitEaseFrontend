const Group = require("../models/Group");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("@getbrevo/brevo");
const Settlement = require("../models/Settlement");


exports.createGroup = async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name required" });
    }

    const group = await Group.create({
      name,
      emoji,
      createdBy: req.user._id,
      members: [req.user._id]
    });

    await group.populate('members', 'name email profileImage mobile gender');
    await group.populate('createdBy', 'name email profileImage mobile gender');

    // Add default avatars for members without profile images
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      profileImage: member.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name.replace(/\s+/g, '')}`
    }));
    if (groupObj.createdBy) {
      groupObj.createdBy.profileImage = groupObj.createdBy.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupObj.createdBy.name.replace(/\s+/g, '')}`;
    }

    res.status(201).json(groupObj);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.generateInviteLink = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const token = jwt.sign(
      { groupId, invitedBy: req.user._id },
      process.env.INVITE_SECRET,
      { expiresIn: "7d" }
    );

    const inviteLink = `${process.env.FRONTEND_URL}/join/${token}`;

    res.json({ inviteLink });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.INVITE_SECRET);

    const group = await Group.findById(decoded.groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id)) {
      group.members.push(req.user._id);
      await group.save();
      
      // Emit socket event to notify all members
      const io = req.app.get('io');
      if (io) {
        io.to(`group:${group._id}`).emit('member-joined', {
          groupId: group._id,
          userId: req.user._id,
          user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            profileImage: req.user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user.name.replace(/\s+/g, '')}`
          }
        });
      }
    }

    await group.populate('members', 'name email profileImage mobile gender');
    await group.populate('createdBy', 'name email profileImage mobile gender');

    // Add default avatars for members without profile images
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      profileImage: member.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name.replace(/\s+/g, '')}`
    }));
    if (groupObj.createdBy) {
      groupObj.createdBy.profileImage = groupObj.createdBy.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupObj.createdBy.name.replace(/\s+/g, '')}`;
    }

    res.json(groupObj);
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired invite" });
  }
};

exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
      isArchived: false
    })
      .populate('members', 'name email profileImage mobile gender')
      .populate('createdBy', 'name email profileImage mobile gender')
      .sort({ updatedAt: -1 });

    // Add default avatars for members without profile images
    const groupsWithAvatars = groups.map(group => {
      const groupObj = group.toObject();
      groupObj.members = groupObj.members.map(member => ({
        ...member,
        profileImage: member.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name.replace(/\s+/g, '')}`
      }));
      if (groupObj.createdBy) {
        groupObj.createdBy.profileImage = groupObj.createdBy.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupObj.createdBy.name.replace(/\s+/g, '')}`;
      }
      return groupObj;
    });

    res.json(groupsWithAvatars);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendPaymentReminder = async (req, res) => {
  try {
    const { groupId, memberId, amount } = req.body;

    if (!groupId || !memberId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const group = await Group.findById(groupId).populate('members', 'name email profileImage mobile gender');
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (!member.email) {
      return res.status(400).json({ message: "Member does not have an email address" });
    }

    try {
      // Configure Brevo API
      let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = `Payment Reminder from ${req.user.name} - ${group.name}`;
      sendSmtpEmail.htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Payment Reminder</h2>
            <p>Hi ${member.name},</p>
            <p><strong>${req.user.name}</strong> is sending you a friendly reminder about your outstanding balance in the group <strong>${group.emoji || ''} ${group.name}</strong>.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #991b1b;">
                Amount Due: ₹${Math.round(amount * 100) / 100}
              </p>
            </div>
            <p>Please settle this amount at your earliest convenience.</p>
            <p style="margin-top: 30px; color: #666;">
              Best regards,<br/>
              SplitEase Team
            </p>
          </div>
      `;
      sendSmtpEmail.sender = { name: "SplitEase", email: "samarthnagpal070@gmail.com" };
      sendSmtpEmail.to = [{ email: member.email, name: member.name }];

      console.log('Attempting to send email to:', member.email);
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Email sent successfully:', result);
      res.json({ message: "Reminder sent successfully" });
    } catch (emailErr) {
      console.error("Email error details:", emailErr.response?.body || emailErr.message || emailErr);
      res.status(500).json({ message: "Failed to send email", error: emailErr.message });
    }
  } catch (err) {
    console.error("Reminder error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addFriendsToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { friendIds } = req.body; // Array of friend user IDs

    if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
      return res.status(400).json({ message: "Friend IDs required" });
    }

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newMembers = [];
    for (const friendId of friendIds) {
      if (!group.members.includes(friendId)) {
        group.members.push(friendId);
        newMembers.push(friendId);
      }
    }

    if (newMembers.length > 0) {
      await group.save();
      
      const io = req.app.get('io');
      if (io) {
        const addedUsers = await User.find({ _id: { $in: newMembers } }).select('name email profileImage mobile gender');
        const addedUsersWithAvatars = addedUsers.map(user => ({
          ...user.toObject(),
          profileImage: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s+/g, '')}`
        }));
        
        io.to(`group:${group._id}`).emit('members-added', {
          groupId: group._id,
          addedBy: req.user._id,
          members: addedUsersWithAvatars
        });
        
        for (const userId of newMembers) {
          io.emit('friend-added-to-group', {
            userId,
            groupId: group._id,
            groupName: group.name,
            groupEmoji: group.emoji
          });
        }
      }
    }

    await group.populate('members', 'name email profileImage mobile gender');
    await group.populate('createdBy', 'name email profileImage mobile gender');

    // Add default avatars
    const groupObj = group.toObject();
    groupObj.members = groupObj.members.map(member => ({
      ...member,
      profileImage: member.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name.replace(/\s+/g, '')}`
    }));
    if (groupObj.createdBy) {
      groupObj.createdBy.profileImage = groupObj.createdBy.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupObj.createdBy.name.replace(/\s+/g, '')}`;
    }

    res.json(groupObj);
  } catch (err) {
    console.error("Add friends error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.recordSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { from: fromUserId, to: toUserId, amount, note } = req.body;  // ✅ Accept 'from'

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // ✅ Verify current user is involved
    const currentUserId = req.user._id.toString();
    if (fromUserId !== currentUserId && toUserId !== currentUserId) {
      return res.status(403).json({ message: "You must be involved in the settlement" });
    }

    const settlement = await Settlement.create({
      groupId,
      from: fromUserId,  // ✅ Use provided fromUserId
      to: toUserId,
      amount: parseFloat(amount),
      note: note || 'Payment',
      settledAt: new Date()
    });

    await settlement.populate('from', 'name profileImage');
    await settlement.populate('to', 'name profileImage');

    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupId}`).emit('settlement-created', settlement);
    }

    res.status(201).json(settlement);
  } catch (err) {
    console.error("❌ Settlement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const settlements = await Settlement.find({ groupId })
      .populate('from', 'name profileImage')
      .populate('to', 'name profileImage')
      .sort({ settledAt: -1 });
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

