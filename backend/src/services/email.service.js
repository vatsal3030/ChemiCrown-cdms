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

// Resend free-tier: use onboarding@resend.dev (only sends to account-owner email).
// Once you verify a custom domain in Resend dashboard, change this to your domain.
const FROM_EMAIL = 'ChemiCrown CDMS <onboarding@resend.dev>';

/**
 * Send a password-reset OTP email.
 * Returns { success: boolean, error?: string }
 */
exports.sendOtpEmail = async (toEmail, otp) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn('⚠️  Resend API Key missing — logging OTP to console.');
    console.log(`[DEV MODE] OTP for ${toEmail}: ${otp}`);
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: 'Your Password Reset Security Code — ChemiCrown',
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.05);border:1px solid #e2e8f0">
          <div style="background:#4f46e5;padding:30px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-.5px">ChemiCrown</h1>
            <p style="color:#c7d2fe;margin-top:5px;font-size:14px">CDMS Security Portal</p>
          </div>
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
          <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="color:#94a3b8;font-size:12px;margin:0">&copy; ${new Date().getFullYear()} ChemiCrown CDMS. All rights reserved.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend API Error (OTP):', JSON.stringify(error));
      return { success: false, error: error.message || 'Email delivery failed' };
    }
    console.log(`✅ OTP email sent to ${toEmail} (id: ${data?.id})`);
    return { success: true };
  } catch (err) {
    console.error('Failed to send OTP email via Resend:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send a welcome email with login credentials to a newly added employee.
 * Returns { success: boolean, error?: string }
 */
exports.sendWelcomeEmail = async (toEmail, password, firstName) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn('⚠️  Resend API Key missing — logging welcome info to console.');
    console.log(`[DEV MODE] Welcome email for ${toEmail}. Temp password: ${password}`);
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: 'Welcome to ChemiCrown CDMS — Your Account Details',
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.05);border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center">
            <div style="width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:15px">
              <span style="font-size:30px">👋</span>
            </div>
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-.5px">Welcome to ChemiCrown</h1>
          </div>
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
            <p style="color:#64748b;font-size:14px;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:20px">
              If you experience any issues logging in, please contact the HR or IT department.
            </p>
          </div>
          <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="color:#94a3b8;font-size:12px;margin:0">&copy; ${new Date().getFullYear()} ChemiCrown CDMS. All rights reserved.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend API Error (Welcome):', JSON.stringify(error));
      return { success: false, error: error.message || 'Email delivery failed' };
    }
    console.log(`✅ Welcome email sent to ${toEmail} (id: ${data?.id})`);
    return { success: true };
  } catch (err) {
    console.error('Failed to send Welcome email via Resend:', err.message);
    return { success: false, error: err.message };
  }
};
