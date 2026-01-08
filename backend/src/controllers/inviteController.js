const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("@getbrevo/brevo");
const Group = require("../models/Group");

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

    if (!process.env.INVITE_SECRET) {
      return res.status(500).json({ message: "Invite config missing: INVITE_SECRET" });
    }

    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({ message: "Invite config missing: FRONTEND_URL" });
    }

    const token = jwt.sign(
      { groupId, invitedBy: req.user._id },
      process.env.INVITE_SECRET,
      { expiresIn: "7d" }
    );

    const inviteLink = `${process.env.FRONTEND_URL}/join/${token}`;

    const subject = `You're invited to join ${group.name} on SplitEase`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="margin: 0 0 12px;">Join ${group.emoji} ${group.name}</h2>
        <p style="margin: 0 0 16px; color: #444;">${req.user.name} invited you to join their expense group on SplitEase.</p>
        <p style="margin: 0 0 16px;">
          <a href="${inviteLink}" style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Join Group</a>
        </p>
        <p style="color:#666;font-size:12px; margin: 0;">This invite expires in 7 days.</p>
      </div>
    `;

    // Prefer Brevo if configured (more reliable than Gmail in production)
    if (process.env.BREVO_API_KEY) {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(
        SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );

      // Match reminder behavior: allow a default sender email if env isn't provided.
      // Note: Brevo may still reject unverified senders; in that case you'll get a clear error response.
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_USER || 'samarthnagpal070@gmail.com';
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

    res.json({ message: "Invite sent successfully" });
  } catch (err) {
    console.error('Failed to send invite:', err?.response?.body || err?.message || err);
    res.status(500).json({
      message: "Failed to send invite",
      ...(process.env.NODE_ENV !== 'production' ? { error: err?.message || String(err) } : {})
    });
  }
};
