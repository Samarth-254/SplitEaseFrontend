const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("@getbrevo/brevo");
const Group = require("../models/Group");
const Invite = require("../models/Invite");
const crypto = require("crypto");


exports.sendInviteEmail = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const group = await Group.findById(groupId);
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requesterId = req.user?._id;
    if (!requesterId || !group.members?.some((m) => String(m) === String(requesterId))) {
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

    const subject = `${req.user.name} invited you to join ${group.emoji} ${group.name}`;
const html = `
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
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ${group.emoji} ${group.name}
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">
                Group Invitation
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                <strong style="color: #1f2937; font-weight: 600;">${req.user.name}</strong> has invited you to join their expense group on <strong style="color: #f97316;">SplitEase</strong>. Start tracking and splitting expenses together!
              </p>

              <!-- Features box -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0 0 12px; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  What you can do:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 8px; font-size: 14px;">📊 Track shared expenses easily</li>
                  <li style="margin-bottom: 8px; font-size: 14px;">💰 Split bills fairly with friends</li>
                  <li style="margin-bottom: 0; font-size: 14px;">✅ Settle up with one click</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.25); transition: all 0.3s;">
                      Join ${group.name}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <p style="margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.6;">
                Button not working? Copy and paste this link into your browser:<br/>
                <a href="${inviteLink}" style="color: #f97316; word-break: break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                This invitation expires in <strong style="color: #1f2937;">7 days</strong>
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


    // Prefer Brevo if configured
    if (process.env.BREVO_API_KEY) {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(
        SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );

      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_USER || 'noreply@split-ease.app';
      const senderName = process.env.BREVO_SENDER_NAME || 'SplitEase';

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = [{ email }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } else {
      if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        return res.status(500).json({ message: "Email config missing: MAIL_USER/MAIL_PASS (or set BREVO_API_KEY)" });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject,
        html
      });
    }

    console.log("Email sent with short invite link:", inviteLink);
    res.json({ 
      message: "Invite sent successfully",
      inviteLink
    });
  } catch (err) {
    console.error('Failed to send invite:', err?.response?.body || err?.message || err);
    res.status(500).json({
      message: "Failed to send invite",
      ...(process.env.NODE_ENV !== 'production' ? { error: err?.message || String(err) } : {})
    });
  }
};


exports.getInviteInfo = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Try short code first
    const invite = await Invite.findOne({ 
      code: token,
      expiresAt: { $gt: new Date() }
    }).populate({
      path: 'groupId',
      populate: { path: 'members', select: 'name' }
    });

    if (invite && invite.groupId && !invite.groupId.isArchived) {
      const group = invite.groupId;
      const inviter = group.members.find(m => String(m._id) === String(invite.invitedBy));

      return res.json({
        groupName: group.name,
        groupEmoji: group.emoji,
        memberCount: group.members?.length || 0,
        invitedByName: inviter?.name || 'Someone'
      });
    }

    // Fallback to JWT (for backward compatibility)
    if (!process.env.INVITE_SECRET) {
      return res.status(500).json({ message: "Invite config missing" });
    }

    const decoded = jwt.verify(token, process.env.INVITE_SECRET);
    const group = await Group.findById(decoded.groupId).populate('members', 'name');
    
    if (!group || group.isArchived) {
      return res.status(404).json({ message: "Group not found or invite expired" });
    }

    const inviter = group.members.find(m => String(m._id) === String(decoded.invitedBy));

    res.json({
      groupName: group.name,
      groupEmoji: group.emoji,
      memberCount: group.members?.length || 0,
      invitedByName: inviter?.name || 'Someone'
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Invalid or expired invite link" });
    }
    console.error("Get invite info error:", err);
    res.status(500).json({ message: "Failed to get invite info" });
  }
};
