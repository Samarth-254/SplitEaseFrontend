const SibApiV3Sdk = require("@getbrevo/brevo");

/**
 * Build expense notification email HTML
 * Design: Orange Accents, Centered Branding, Clean Layout
 */
const buildExpenseEmail = (data) => {
  // Destructure with default for groupName to prevent "undefined"
  const { type, expense, balance, paidBy, amount, yourShare, settleLink, groupName = 'your group' } = data;

  // --- Assets & Colors ---
  const logoUrl = "https://res.cloudinary.com/dsp0zmfcx/image/upload/v1768331606/icon-512_g9hfoe.png";
  
  const colors = {
    bg: '#F3F4F6',          // Light gray page background
    card: '#FFFFFF',        // White card background
    textMain: '#111827',    // Deep charcoal
    textMuted: '#6B7280',   // Muted gray
    border: '#E5E7EB',      // Light borders
    
    // UPDATED: Orange Button
    buttonBg: '#F97316',    
    buttonText: '#FFFFFF',

    // Status Colors
    settleBg: '#ECFDF5',    // Mint background for settlements
    settleText: '#047857',  // Emerald text
    expenseBg: '#FFF7ED',   // Very light orange/red background for debt
    expenseText: '#C2410C', // Dark Orange/Red text
  };

  // --- Shared Layout Wrapper ---
  const wrapHtml = (content, previewText) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SplitEase Notification</title>
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: ${colors.bg}; padding-bottom: 40px; }
        .main-table { background-color: ${colors.card}; margin: 0 auto; width: 100%; max-width: 500px; border-radius: 12px; border: 1px solid ${colors.border}; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        /* Added !important and color explicitly to override email client defaults */
        .button { display: inline-block; background-color: ${colors.buttonBg}; color: ${colors.buttonText} !important; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center; box-sizing: border-box; }
        .logo-img { display: block; border: 0; outline: none; text-decoration: none; }
        @media only screen and (max-width: 600px) {
          .main-table { width: 95% !important; }
          .content-cell { padding: 24px 20px !important; }
          .button { width: 100% !important; display: block !important; }
        }
      </style>
    </head>
    <body>
      <div style="display:none; font-size:1px; color:#333333; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        ${previewText}
      </div>
      <center class="wrapper">
        <table class="main-table" align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
          
          <tr>
            <td style="padding: 32px 0 0; text-align: center;">
              <!-- UPDATED: Nested table to align Logo and Text in the same row -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="display: inline-table;">
                <tr>
                  <td valign="middle" style="padding-right: 12px;">
                    <img src="${logoUrl}" alt="SplitEase" width="48" height="48" class="logo-img" style="border-radius: 8px;">
                  </td>
                  <td valign="middle">
                    <!-- Increased font size to 24px -->
                    <span style="font-size: 24px; font-weight: 700; color: ${colors.textMain}; letter-spacing: -0.5px;">SplitEase</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${content}

          <tr>
            <td style="background-color: #FAFAFA; padding: 24px; text-align: center; border-top: 1px solid ${colors.border};">
              <p style="margin: 0; font-size: 12px; color: ${colors.textMuted}; line-height: 1.5;">
                Sent via SplitEase Notification System
              </p>
            </td>
          </tr>
        </table>
        
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">© ${new Date().getFullYear()} SplitEase.</p>
            </td>
          </tr>
        </table>
      </center>
    </body>
    </html>
  `;

 // --- 1. Expense Added (You Owe) --- 
if (type === 'you_owe') {
  const content = `
    <tr>
      <td class="content-cell" style="padding: 32px 40px 40px;">
        <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${colors.textMain}; text-align: center;">
          New Expense
        </h1>
        <p style="margin: 0 0 32px; font-size: 15px; color: ${colors.textMuted}; text-align: center;">
          Added by <strong>${paidBy.name || paidBy}</strong> in <strong>${groupName}</strong>
        </p>

        <!-- FIXED: Description LEFT + Amount EXTREME RIGHT - SINGLE ROW -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px; background-color: #FAFAFA;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="65%" valign="middle">
                    <!-- Expense description LEFT aligned -->
                    <div style="font-size: 15px; font-weight: 600; color: ${colors.textMain};">
                      ${expense?.description || 'Expense'}
                    </div>
                  </td>
                  <td width="35%" align="right" valign="middle">
                    <!-- Amount EXTREME RIGHT -->
                    <div style="font-size: 15px; font-weight: 600; color: ${colors.textMuted};">
                      ₹${(expense?.amount || 0).toFixed(2)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background-color: ${colors.expenseBg};">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; color: ${colors.expenseText};">
                      Your Share
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-size: 20px; font-weight: 700; color: ${colors.expenseText};">
                      ₹${yourShare.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${settleLink}" class="button" style="color: #FFFFFF !important;">View Details</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  return {
    subject: `New expense: ${expense?.description}`,
    html: wrapHtml(content, `Your share is ₹${yourShare.toFixed(2)}`)
  };
}



  // --- 2. Settlement Recorded ---
  if (type === 'settlement_received') {
    const content = `
      <tr>
        <td class="content-cell" style="padding: 40px 40px 40px;">
          
          <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${colors.textMain}; text-align: center;">
            Settlement Recorded
          </h1>
          
          <p style="margin: 0 0 32px; font-size: 15px; color: ${colors.textMuted}; text-align: center; line-height: 1.6;">
            <strong>${paidBy.name || paidBy}</strong> has settled their share with you.
          </p>

          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 20px 40px; background-color: ${colors.settleBg}; border-radius: 8px; border: 1px solid #A7F3D0;">
                  <span style="font-size: 13px; display: block; color: ${colors.settleText}; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Amount</span>
                  <span style="font-size: 32px; display: block; color: ${colors.settleText}; font-weight: 700;">₹${amount.toFixed(2)}</span>
                </div>
              </td>
            </tr>
          </table>

          <p style="text-align: center; margin: 0 0 32px; font-size: 14px; color: ${colors.textMuted};">
            Group: <strong>${groupName}</strong>
          </p>

          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <!-- Added inline style color: #FFFFFF -->
                <a href="${settleLink}" class="button" style="color: #FFFFFF !important;">Check Balance</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    return {
      subject: `Settlement recorded with ${paidBy.name || paidBy}`,
      html: wrapHtml(content, `${paidBy.name || paidBy} settled ₹${amount.toFixed(2)}`)
    };
  }

  // --- 3. Batch Digest ---
  if (type === 'batched') {
    const expenseRows = data.expenses.slice(0, 5).map((exp, index) => `
      <tr>
        <td style="padding: 14px 0; border-bottom: ${index === 4 ? 'none' : `1px solid ${colors.border}`};">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle" width="65%">
                <div style="font-size: 14px; font-weight: 600; color: ${colors.textMain};">
                  ${exp.description}
                </div>
                <div style="font-size: 12px; color: ${colors.textMuted};">
                  Added by ${exp.paidBy}
                </div>
              </td>
              <td valign="middle" align="right" width="35%">
                <div style="font-size: 14px; font-weight: 600; color: ${colors.textMain};">
                  ₹${exp.amount.toFixed(0)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const content = `
      <tr>
        <td class="content-cell" style="padding: 32px 40px 40px;">
          <div style="text-align: center; margin-bottom: 24px;">
             <h1 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: ${colors.textMain};">
              Group Activity
            </h1>
            <p style="margin: 0; font-size: 15px; color: ${colors.textMuted};">
              ${data.expenseCount} new items in <strong>${groupName}</strong>
            </p>
          </div>

          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid ${colors.border}; border-radius: 8px; padding: 0 16px;">
            ${expenseRows}
          </table>

          <div style="background-color: #FAFAFA; padding: 12px; border-radius: 6px; text-align: center; margin-bottom: 24px; border: 1px dashed ${colors.border};">
             <span style="font-size: 14px; color: ${colors.textMuted};">
               Net Balance: <strong style="color: ${balance > 0 ? colors.settleText : colors.expenseText}">
                 ${balance > 0 ? '+' : ''}₹${balance.toFixed(2)}
               </strong>
             </span>
           </div>

          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <!-- Added inline style color: #FFFFFF -->
                <a href="${settleLink}" class="button" style="color: #FFFFFF !important;">View All</a>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    `;

    return {
      subject: `${data.expenseCount} new expenses in ${groupName}`,
      html: wrapHtml(content, `${data.expenseCount} items added.`)
    };
  }

  return {
    subject: 'SplitEase Notification',
    html: wrapHtml(`<tr><td style="padding:40px; text-align:center;">Check app for details</td></tr>`, 'New notification')
  };
};

// Rest of the functions remain exactly the same
const sendExpenseNotification = async (email, data) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ Brevo API key not configured');
      return false;
    }

    if (!email || !email.includes('@')) {
      console.error(`❌ Invalid email: ${email}`);
      return false;
    }

    const emailContent = buildExpenseEmail(data);

    console.log(`📧 Sending expense notification to ${email.substring(0, 3)}***@${email.split('@')[1]}`);

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = emailContent.subject;
    sendSmtpEmail.htmlContent = emailContent.html;
    sendSmtpEmail.sender = { name: "SplitEase", email: "noreply@split-ease.app" };
    sendSmtpEmail.to = [{ email: email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`✅ Email sent to ${email.substring(0, 3)}***@${email.split('@')[1]}`);
    return true;

  } catch (error) {
    console.error('❌ Email send failed:', error.response?.body || error.message || error);
    return false;
  }
};

const sendBulkEmailNotifications = async (notifications) => {
  const results = await Promise.allSettled(
    notifications.map(({ email, data }) => sendExpenseNotification(email, data))
  );

  let sent = 0;
  let failed = 0;

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value === true) {
      sent++;
    } else {
      failed++;
    }
  });

  console.log(`📊 Email bulk: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};

const testConnection = async () => {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, message: 'BREVO_API_KEY not configured' };
    }

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    let accountApi = new SibApiV3Sdk.AccountApi();
    accountApi.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    await accountApi.getAccount();

    return {
      success: true,
      message: 'Brevo API connected'
    };
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  }
};

module.exports = {
  sendExpenseNotification,
  sendBulkEmailNotifications,
  testConnection
};