const { Resend } = require('resend');

let _resendClient = null;

/**
 * Lazily create and cache the Resend client.
 * Returns null when no valid API key is configured.
 */
const getResendClient = () => {
  if (_resendClient) return _resendClient;
  const key = process.env.RESEND_API_KEY;
  if (key && key !== 'YOUR_RESEND_API_KEY_HERE') {
    _resendClient = new Resend(key);
    return _resendClient;
  }
  return null;
};

// ─── Verified custom domain sender (chemicrown.site) ───
const FROM_EMAIL = 'ChemiCrown CDMS <noreply@chemicrown.site>';

// ─── Shared HTML helpers ───
const YEAR = new Date().getFullYear();

const headerBlock = (bgColor, emoji, title, subtitle) => `
  <div style="background:${bgColor};padding:40px 30px;text-align:center">
    <div style="width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:15px">
      <span style="font-size:30px">${emoji}</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-.5px">${title}</h1>
    ${subtitle ? `<p style="color:rgba(255,255,255,.7);margin-top:5px;font-size:14px">${subtitle}</p>` : ''}
  </div>
`;

const footerBlock = `
  <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">&copy; ${YEAR} ChemiCrown CDMS &mdash; <a href="https://chemicrown.site" style="color:#94a3b8">chemicrown.site</a></p>
  </div>
`;

const wrapEmail = (content) => `
  <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.05);border:1px solid #e2e8f0">
    ${content}
    ${footerBlock}
  </div>
`;

/**
 * Generic email sender. All template functions delegate here.
 * Returns { success: boolean, error?: string }
 */
const sendEmail = async (to, subject, html, tag) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`⚠️  Resend API Key missing — skipping [${tag}] email to ${to}`);
    return { success: true }; // Don't fail app logic when email is unconfigured
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });

    if (error) {
      console.error(`Resend API Error [${tag}]:`, JSON.stringify(error));
      return { success: false, error: error.message || 'Email delivery failed' };
    }
    console.log(`✅ [${tag}] email sent to ${to} (id: ${data?.id})`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to send [${tag}] email via Resend:`, err.message);
    return { success: false, error: err.message };
  }
};


// ════════════════════════════════════════════════════════
//  1.  PASSWORD RESET OTP
// ════════════════════════════════════════════════════════

exports.sendOtpEmail = async (toEmail, otp) => {
  const html = wrapEmail(`
    ${headerBlock('#4f46e5', '🔐', 'ChemiCrown', 'CDMS Security Portal')}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Password Reset Request</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:25px">
        We received a request to reset the password associated with your ChemiCrown CDMS account. Use the verification code below:
      </p>
      <div style="background:#f1f5f9;padding:25px;border-radius:12px;text-align:center;margin:30px 0;border:1px dashed #cbd5e1">
        <span style="font-family:monospace;font-size:32px;font-weight:800;color:#4f46e5;letter-spacing:8px">${otp}</span>
      </div>
      <p style="color:#ef4444;font-size:14px;font-weight:600;text-align:center;margin-bottom:30px">
        ⏱️ This code expires in 10 minutes.
      </p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        If you did not request this reset, please ignore this email or contact your IT administrator. Your account remains secure.
      </p>
    </div>
  `);

  return sendEmail(toEmail, 'Your Password Reset Security Code — ChemiCrown', html, 'OTP');
};


// ════════════════════════════════════════════════════════
//  2.  WELCOME EMAIL (new employee)
// ════════════════════════════════════════════════════════

exports.sendWelcomeEmail = async (toEmail, password, firstName) => {
  const html = wrapEmail(`
    ${headerBlock('linear-gradient(135deg,#10b981 0%,#059669 100%)', '👋', 'Welcome to ChemiCrown', null)}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Hello ${firstName},</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:25px">
        We're thrilled to have you on board! Your account on the <b>ChemiCrown CDMS</b> has been created by the HR department.
      </p>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:15px">
        Here are your login credentials. Please change your password after first login.
      </p>
      <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #10b981">
        <p style="margin:0 0 10px;color:#334155;font-size:15px"><strong>Email (Login ID):</strong> <span style="color:#0f172a">${toEmail}</span></p>
        <p style="margin:0;color:#334155;font-size:15px"><strong>Temporary Password:</strong> <span style="font-family:monospace;font-weight:bold;background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a">${password}</span></p>
      </div>
      <div style="text-align:center;margin:30px 0">
        <a href="https://chemicrown.site" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px">Login to ChemiCrown →</a>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        If you experience any issues logging in, please contact the HR or IT department.
      </p>
    </div>
  `);

  return sendEmail(toEmail, 'Welcome to ChemiCrown CDMS — Your Account Details', html, 'WELCOME');
};


// ════════════════════════════════════════════════════════
//  3.  LOGIN NOTIFICATION (employees/admins only)
// ════════════════════════════════════════════════════════

exports.sendLoginNotificationEmail = async (toEmail, firstName, loginTime) => {
  const formattedTime = new Date(loginTime).toLocaleString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  });

  const html = wrapEmail(`
    ${headerBlock('linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)', '🔑', 'Login Alert', 'ChemiCrown CDMS')}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Welcome back, ${firstName}!</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px">
        A successful login to your ChemiCrown CDMS account was detected.
      </p>
      <div style="background:#eff6ff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #3b82f6">
        <p style="margin:0 0 8px;color:#334155;font-size:15px"><strong>🕐 Time:</strong> ${formattedTime}</p>
        <p style="margin:0;color:#334155;font-size:15px"><strong>📧 Account:</strong> ${toEmail}</p>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        If this wasn't you, please change your password immediately and contact your administrator.
      </p>
    </div>
  `);

  return sendEmail(toEmail, `Login Notification — ChemiCrown CDMS`, html, 'LOGIN');
};


// ════════════════════════════════════════════════════════
//  4.  ORDER CONFIRMATION (customer)
// ════════════════════════════════════════════════════════

exports.sendOrderConfirmationEmail = async (toEmail, firstName, orderId, orderTotal, items = []) => {
  const shortId = orderId.substring(0, 8).toUpperCase();
  const itemsHtml = items.length > 0
    ? items.map(item => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px">${item.name || 'Chemical'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;text-align:right">₹${(item.price || 0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
    : '';

  const html = wrapEmail(`
    ${headerBlock('linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', '📦', 'Order Confirmed!', `Order #${shortId}`)}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Thank you, ${firstName}!</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px">
        Your order has been placed successfully. We'll begin processing it right away.
      </p>
      <div style="background:#fffbeb;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b">
        <p style="margin:0 0 8px;color:#334155;font-size:15px"><strong>Order ID:</strong> #${shortId}</p>
        <p style="margin:0;color:#334155;font-size:15px"><strong>Total:</strong> <span style="font-weight:800;color:#0f172a">₹${Number(orderTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
      </div>
      ${itemsHtml ? `
        <table style="width:100%;border-collapse:collapse;margin:25px 0">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.5px">Item</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.5px">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.5px">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      ` : ''}
      <div style="text-align:center;margin:30px 0">
        <a href="https://chemicrown.site/orders" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px">Track Your Order →</a>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        You can track the status of your order anytime from your dashboard.
      </p>
    </div>
  `);

  return sendEmail(toEmail, `Order Confirmed #${shortId} — ChemiCrown`, html, 'ORDER_CONFIRM');
};


// ════════════════════════════════════════════════════════
//  5.  ORDER STATUS UPDATE (customer)
// ════════════════════════════════════════════════════════

const STATUS_LABELS = {
  REQUESTED: { label: 'Requested', color: '#3b82f6', emoji: '📋' },
  PENDING: { label: 'Pending', color: '#f59e0b', emoji: '⏳' },
  CONFIRMED: { label: 'Confirmed', color: '#10b981', emoji: '✅' },
  PROCESSING: { label: 'Processing', color: '#8b5cf6', emoji: '⚙️' },
  READY: { label: 'Ready for Dispatch', color: '#06b6d4', emoji: '📤' },
  SHIPPED: { label: 'Shipped', color: '#3b82f6', emoji: '🚚' },
  DELIVERED: { label: 'Delivered', color: '#10b981', emoji: '🎉' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', emoji: '❌' },
  REFUNDED: { label: 'Refunded', color: '#64748b', emoji: '💰' },
};

exports.sendOrderStatusUpdateEmail = async (toEmail, firstName, orderId, newStatus) => {
  const shortId = orderId.substring(0, 8).toUpperCase();
  const cfg = STATUS_LABELS[newStatus] || { label: newStatus, color: '#64748b', emoji: '📦' };

  const html = wrapEmail(`
    ${headerBlock(cfg.color, cfg.emoji, 'Order Update', `#${shortId}`)}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Hi ${firstName},</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px">
        Your order <strong>#${shortId}</strong> has a new status update:
      </p>
      <div style="text-align:center;margin:30px 0">
        <span style="display:inline-block;background:${cfg.color};color:#fff;font-weight:800;padding:14px 36px;border-radius:50px;font-size:18px;letter-spacing:.5px">
          ${cfg.emoji} ${cfg.label}
        </span>
      </div>
      <div style="text-align:center;margin:30px 0">
        <a href="https://chemicrown.site/orders/${orderId}" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px">View Order Details →</a>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        If you have any questions about this update, please contact our support team.
      </p>
    </div>
  `);

  return sendEmail(toEmail, `Order #${shortId} — ${cfg.label} | ChemiCrown`, html, 'ORDER_STATUS');
};


// ════════════════════════════════════════════════════════
//  6.  PASSWORD RESET SUCCESS
// ════════════════════════════════════════════════════════

exports.sendPasswordResetSuccessEmail = async (toEmail, firstName) => {
  const html = wrapEmail(`
    ${headerBlock('linear-gradient(135deg,#10b981 0%,#059669 100%)', '🔒', 'Password Changed', 'ChemiCrown CDMS')}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Hi ${firstName || 'there'},</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px">
        Your password for ChemiCrown CDMS has been successfully reset. You can now log in with your new password.
      </p>
      <div style="background:#f0fdf4;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981">
        <p style="margin:0;color:#166534;font-size:15px;font-weight:600">✅ Password reset was successful.</p>
      </div>
      <div style="text-align:center;margin:30px 0">
        <a href="https://chemicrown.site/login" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px">Login Now →</a>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        If you did not make this change, please contact your administrator immediately — your account may have been compromised.
      </p>
    </div>
  `);

  return sendEmail(toEmail, 'Your Password Has Been Reset — ChemiCrown', html, 'PW_RESET_SUCCESS');
};


// ════════════════════════════════════════════════════════
//  7.  CUSTOMER ACCOUNT VERIFIED
// ════════════════════════════════════════════════════════

exports.sendCustomerVerificationEmail = async (toEmail, firstName) => {
  const html = wrapEmail(`
    ${headerBlock('linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)', '🎉', 'Account Approved!', 'ChemiCrown CDMS')}
    <div style="padding:40px 30px;background:#fff">
      <h2 style="color:#0f172a;font-size:20px;margin-top:0;font-weight:700">Great news, ${firstName}!</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px">
        Your ChemiCrown CDMS customer account has been verified and approved by our team. You now have full access to place orders.
      </p>
      <div style="background:#f5f3ff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #8b5cf6">
        <p style="margin:0 0 8px;color:#334155;font-size:15px"><strong>📧 Login Email:</strong> ${toEmail}</p>
        <p style="margin:0;color:#334155;font-size:15px"><strong>🛒 Status:</strong> <span style="color:#10b981;font-weight:700">Active — Ready to Order</span></p>
      </div>
      <div style="text-align:center;margin:30px 0">
        <a href="https://chemicrown.site/login" style="display:inline-block;background:#8b5cf6;color:#fff;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px">Start Ordering →</a>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
        Welcome to the ChemiCrown family! If you need any help getting started, our support team is here for you.
      </p>
    </div>
  `);

  return sendEmail(toEmail, 'Your Account is Verified — Welcome to ChemiCrown!', html, 'CUSTOMER_VERIFIED');
};
