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

    if (!group.members.includes(req.user._id)) {
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

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = `💰 Payment Reminder: ${group.emoji} ${group.name}`;
      sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.2); width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">💰</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Payment Reminder
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ${group.emoji} ${group.name}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px;">
                Hi <strong>${member.name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                <strong style="color: #1f2937;">${req.user.name}</strong> sent you a friendly reminder about your outstanding balance in <strong style="color: #ef4444;">${group.emoji} ${group.name}</strong>.
              </p>

              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Amount Due
                </p>
                <p style="margin: 0; color: #dc2626; font-size: 36px; font-weight: 700; line-height: 1;">
                  ₹${Math.round(amount * 100) / 100}
                </p>
              </div>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Please settle this amount at your earliest convenience. Keeping balances up to date helps everyone track expenses better! 🙏
              </p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #166534; font-size: 13px; font-weight: 600;">
                  💡 Settling up is easy:
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px; line-height: 1.6;">
                  <li style="margin-bottom: 4px;">Open SplitEase app or website</li>
                  <li style="margin-bottom: 4px;">Go to ${group.emoji} ${group.name}</li>
                  <li style="margin-bottom: 0;">Click "Settle Up" and confirm payment</li>
                </ol>
              </div>

              <table role="presentation" style="width: 100%; margin: 32px 0 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/group/${groupId}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.25);">
                      Open Group & Settle Up
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated reminder from <strong style="color: #1f2937;">${req.user.name}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © 2026 SplitEase • Making expense splitting simple
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      sendSmtpEmail.sender = { name: "SplitEase", email: "samarthnagpal070@gmail.com" };
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

      // Build group breakdown HTML
      const groupsHTML = groupBreakdown.map(group => `
        <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="background-color: #374151; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                ${group.groupEmoji}
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; color: #f3f4f6; font-size: 15px;">${group.groupName}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 11px; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
              <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ef4444;">₹${Math.round(group.amount * 100) / 100}</p>
            </div>
          </div>
        </div>
      `).join('');

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = `💰 Payment Reminder from ${req.user.name}`;
      sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.2); width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">💰</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Payment Reminder
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ${groupBreakdown.length} Group${groupBreakdown.length > 1 ? 's' : ''}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px;">
                Hi <strong>${member.name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                <strong style="color: #1f2937;">${req.user.name}</strong> sent you a friendly reminder about your outstanding balances across multiple groups.
              </p>

              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Total Amount Due
                </p>
                <p style="margin: 0; color: #dc2626; font-size: 40px; font-weight: 700; line-height: 1;">
                  ₹${Math.round(totalAmount * 100) / 100}
                </p>
              </div>

              <div style="margin: 24px 0;">
                <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Breakdown by Group:
                </p>
                ${groupsHTML}
              </div>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Please settle these amounts at your earliest convenience. Keeping balances up to date helps everyone track expenses better! 🙏
              </p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #166534; font-size: 13px; font-weight: 600;">
                  💡 Settling up is easy:
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px; line-height: 1.6;">
                  <li style="margin-bottom: 4px;">Open SplitEase app or website</li>
                  <li style="margin-bottom: 4px;">Go to Friends tab</li>
                  <li style="margin-bottom: 0;">Click "Settle Up" and confirm payments</li>
                </ol>
              </div>

              <table role="presentation" style="width: 100%; margin: 32px 0 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/friends" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.25);">
                      Open SplitEase & Settle Up
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated reminder from <strong style="color: #1f2937;">${req.user.name}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © 2026 SplitEase • Making expense splitting simple
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      sendSmtpEmail.sender = { name: "SplitEase", email: "samarthnagpal070@gmail.com" };
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
        
        // ✅ Emit to group room
        io.to(`group:${group._id}`).emit('members:added', {
          groupId: group._id,
          addedBy: req.user._id,
          members: addedUsersWithAvatars
        });
        
        // ✅ Emit to all members including new ones
        group.members.forEach(memberId => {
          io.to(`user:${memberId}`).emit('members:added', {
            groupId: group._id,
            addedBy: req.user._id,
            members: addedUsersWithAvatars
          });
        });
        
        // Notify new members specifically
        for (const userId of newMembers) {
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

    // ✅ FIXED LINE - Pass settlement object
    await notificationService.notifySettlement(
      toUserId,
      fromUserId,
      amount,
      User,
      settlement  // ← THIS WAS MISSING!
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
