const Group = require("../models/Group");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("@getbrevo/brevo");
const Settlement = require("../models/Settlement");
const Invite = require("../models/Invite");
const crypto = require("crypto");
const { sendNotification } = require('./notificationController');
const notificationService = require('../services/notificationService');

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
    console.error("Create group error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, emoji } = req.body;

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update only name and emoji
    if (name !== undefined) group.name = name;
    if (emoji !== undefined) group.emoji = emoji;
    group.updatedAt = new Date();

    await group.save();

    res.json({
      _id: group._id,
      name: group.name,
      emoji: group.emoji,
      updatedAt: group.updatedAt
    });
  } catch (err) {
    console.error("Update group error:", err);
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

    // Generate short 6-character code
    const code = crypto.randomBytes(3).toString('hex');

    // Create invite in database
    await Invite.create({
      code,
      groupId,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    const frontendUrl = process.env.FRONTEND_URL ||
      (process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',')[0].trim() : 'http://localhost:5173');

    const inviteLink = `${frontendUrl}/join/${code}`;

    console.log("Generated short invite link:", inviteLink);
    res.json({ inviteLink });
  } catch (err) {
    console.error("Generate invite link error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const { token } = req.body;

    let groupId;

    // Try to find invite by short code first
    const invite = await Invite.findOne({
      code: token,
      expiresAt: { $gt: new Date() }
    });

    if (invite) {
      groupId = invite.groupId;
      console.log("Joining via short code:", token);
    } else {
      // Fallback to JWT token
      try {
        const decoded = jwt.verify(token, process.env.INVITE_SECRET);
        groupId = decoded.groupId;
        console.log("Joining via JWT token");
      } catch (jwtErr) {
        return res.status(400).json({ message: "Invalid or expired invite" });
      }
    }

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isNewMember = !group.members.includes(req.user._id);

    if (isNewMember) {
      group.members.push(req.user._id);
      await group.save();

      // Emit socket event
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

        // ✅ SEND WEB PUSH TO ALL EXISTING MEMBERS ABOUT NEW MEMBER
        const existingMembers = group.members.filter(m => m.toString() !== req.user._id.toString());
        for (const memberId of existingMembers) {
          await sendNotification(
            memberId,
            `${group.emoji} New Member Joined`,
            `${req.user.name} joined "${group.name}"`,
            `/group/${groupId}`,
            io
          );
        }
      }
    }

    await group.populate('members', 'name email profileImage mobile gender');
    await group.populate('createdBy', 'name email profileImage mobile gender');

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
    console.error("Join group error:", err);
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
    console.error("Get user groups error:", err);
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

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const logoUrl = "https://res.cloudinary.com/dsp0zmfcx/image/upload/v1768331606/icon-512_g9hfoe.png";

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = `Payment Reminder: ${group.name}`;
      sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F3F4F6; padding-bottom: 40px; }
    .main-table { background-color: #FFFFFF; margin: 0 auto; width: 100%; max-width: 500px; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .button { display: inline-block; background-color: #F97316; color: #FFFFFF !important; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center; }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main-table" align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
      
      <tr>
        <td style="padding: 32px 0 0; text-align: center;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="display: inline-table;">
            <tr>
              <td valign="middle" style="padding-right: 12px;">
                <img src="${logoUrl}" alt="SplitEase" width="48" height="48" style="display: block; border-radius: 8px;">
              </td>
              <td valign="middle">
                <span style="font-size: 24px; font-weight: 700; color: #111827;">SplitEase</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 32px 40px 40px;">
          
          <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">
            Payment Reminder
          </h1>
          
          <p style="margin: 0 0 24px; font-size: 15px; color: #6B7280; text-align: center; line-height: 1.6;">
            Hi <strong>${member.name}</strong>, <strong style="color: #111827;">${req.user.name}</strong> sent a reminder for <strong>${group.name}</strong>.
          </p>

          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 20px 40px; background-color: #FFF7ED; border-radius: 8px; border: 1px solid #FFEDD5;">
                  <span style="font-size: 13px; display: block; color: #C2410C; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Amount Due</span>
                  <span style="font-size: 32px; display: block; color: #C2410C; font-weight: 700;">₹${Math.round(amount * 100) / 100}</span>
                </div>
              </td>
            </tr>
          </table>

          <p style="margin: 0 0 32px; font-size: 14px; color: #6B7280; text-align: center;">
            Please settle this amount at your earliest convenience to keep the group balances balanced!
          </p>

          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${frontendUrl}/group/${groupId}" class="button">Settle Up</a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <tr>
        <td style="background-color: #FAFAFA; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.5;">
            This is an automated reminder from <strong>${req.user.name}</strong>
          </p>
        </td>
      </tr>
    </table>

    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
      <tr>
        <td style="text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9CA3AF;">© 2026 SplitEase.</p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
      `;
      sendSmtpEmail.sender = { name: "SplitEase", email: "noreply@split-ease.app" };
      sendSmtpEmail.to = [{ email: member.email, name: member.name }];

      console.log('Attempting to send payment reminder to:', member.email);
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Payment reminder sent successfully:', result);
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

exports.sendCombinedReminder = async (req, res) => {
  try {
    const { memberId, totalAmount, groupBreakdown } = req.body;

    if (!memberId || !totalAmount || !Array.isArray(groupBreakdown) || groupBreakdown.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (!member.email) {
      return res.status(400).json({ message: "Member does not have an email address" });
    }

    // Verify all groups exist and user is a member
    for (const group of groupBreakdown) {
      const groupDoc = await Group.findById(group.groupId);
      if (!groupDoc || groupDoc.isArchived) {
        return res.status(404).json({ message: `Group ${group.groupName} not found` });
      }
      if (!groupDoc.members.includes(req.user._id)) {
        return res.status(403).json({ message: `Not authorized in group ${group.groupName}` });
      }
    }

    try {
      // Configure Brevo API
      let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const logoUrl = "https://res.cloudinary.com/dsp0zmfcx/image/upload/v1768331606/icon-512_g9hfoe.png";

      // Build group breakdown HTML
      const groupsHTML = groupBreakdown.map((group, index) => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px 0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="70%" valign="middle" style="font-size: 14px; color: #111827;">
                  <span style="font-size: 18px; margin-right: 8px; vertical-align: middle;">${group.groupEmoji || '👥'}</span>
                  <span style="font-weight: 600; vertical-align: middle;">${group.groupName}</span>
                </td>
                <td width="30%" align="right" valign="middle">
                  <div style="font-size: 14px; font-weight: 700; color: #C2410C;">₹${Math.round(group.amount * 100) / 100}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('');

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = `Payment Reminder from ${req.user.name}`;
      sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Combined Payment Reminder</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #F3F4F6; padding-bottom: 40px; }
    .main-table { background-color: #FFFFFF; margin: 0 auto; width: 100%; max-width: 500px; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .button { display: inline-block; background-color: #F97316; color: #FFFFFF !important; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center; }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main-table" align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
      
      <tr>
        <td style="padding: 32px 0 0; text-align: center;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="display: inline-table;">
            <tr>
              <td valign="middle" style="padding-right: 12px;">
                <img src="${logoUrl}" alt="SplitEase" width="48" height="48" style="display: block; border-radius: 8px;">
              </td>
              <td valign="middle">
                <span style="font-size: 24px; font-weight: 700; color: #111827;">SplitEase</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 32px 40px 40px;">
          
          <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">
            Total Balance Due
          </h1>
          
          <p style="margin: 0 0 24px; font-size: 15px; color: #6B7280; text-align: center; line-height: 1.6;">
            Hi <strong>${member.name}</strong>, you have pending settlements across <strong>${groupBreakdown.length} groups</strong>.
          </p>

          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 20px 40px; background-color: #FFF7ED; border-radius: 8px; border: 1px solid #FFEDD5;">
                  <span style="font-size: 13px; display: block; color: #C2410C; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Total To Pay</span>
                  <span style="font-size: 32px; display: block; color: #C2410C; font-weight: 700;">₹${Math.round(totalAmount * 100) / 100}</span>
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-bottom: 32px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; color: #9CA3AF; margin-bottom: 12px;">Breakdown</div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E5E7EB;">
              ${groupsHTML}
            </table>
          </div>

          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${frontendUrl}/friends" class="button">View & Settle</a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <tr>
        <td style="background-color: #FAFAFA; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.5;">
            This is an automated reminder from <strong>${req.user.name}</strong>
          </p>
        </td>
      </tr>
    </table>

    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
      <tr>
        <td style="text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9CA3AF;">© 2026 SplitEase.</p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
      `;
      sendSmtpEmail.sender = { name: "SplitEase", email: "noreply@split-ease.app" };
      sendSmtpEmail.to = [{ email: member.email, name: member.name }];

      console.log('Attempting to send combined reminder to:', member.email);
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Combined reminder sent successfully:', result);
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
    const { friendIds } = req.body;

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

        // Emit to group room
        io.to(`group:${group._id}`).emit('members:added', {
          groupId: group._id,
          addedBy: req.user._id,
          members: addedUsersWithAvatars
        });

        // Emit to all members including new ones
        group.members.forEach(memberId => {
          io.to(`user:${memberId}`).emit('members:added', {
            groupId: group._id,
            addedBy: req.user._id,
            members: addedUsersWithAvatars
          });
        });

        // Notify new members specifically
        for (const userId of newMembers) {
          // ✅ SEND WEB PUSH TO NEWLY ADDED MEMBERS
          const user = addedUsersWithAvatars.find(u => u._id.toString() === userId.toString());
          await sendNotification(
            userId,
            `${group.emoji} Added to Group`,
            `${req.user.name} added you to "${group.name}"`,
            `/group/${group._id}`,
            io
          );

          io.emit('friend:added-to-group', {
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
    const { from: fromUserId, to: toUserId, amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUserId = req.user._id.toString();
    if (fromUserId !== currentUserId && toUserId !== currentUserId) {
      return res.status(403).json({ message: "You must be involved in the settlement" });
    }

    const settlement = await Settlement.create({
      groupId,
      from: fromUserId,
      to: toUserId,
      amount: parseFloat(amount),
      note: note || 'Payment',
      settledAt: new Date()
    });

    await settlement.populate('from', 'name profileImage email mobile');
    await settlement.populate('to', 'name profileImage email mobile');

    const io = req.app.get('io');

    if (io) {
      io.to(`group:${groupId}`).emit('settlement:created', settlement);
      io.to(`user:${fromUserId}`).emit('settlement:created', settlement);
      io.to(`user:${toUserId}`).emit('settlement:created', settlement);

      const fromUser = settlement.from;
      io.to(`user:${toUserId}`).emit('notification', {
        type: 'settlement_received',
        title: `✅ Payment received in ${group.name}`,
        message: `${fromUser.name} paid you ₹${amount}`,
        groupId: groupId,
        groupName: group.name,
        groupEmoji: group.emoji,
        amount: amount,
        from: {
          _id: fromUser._id,
          name: fromUser.name,
          profileImage: fromUser.profileImage
        },
        timestamp: new Date(),
        read: false
      });
    }

    await sendNotification(
      toUserId,
      `✅ Payment received in ${group.name}`,
      `${settlement.from.name} paid you ₹${amount}`,
      `/group/${groupId}`,
      io
    );

    await notificationService.notifySettlement(
      toUserId,
      fromUserId,
      amount,
      User,
      settlement
    );

    res.status(201).json(settlement);
  } catch (err) {
    console.error("Settlement error:", err);
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
    console.error("Get settlements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = exports;