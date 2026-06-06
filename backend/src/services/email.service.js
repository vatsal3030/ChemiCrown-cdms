const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  }
});

exports.sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: '"ChemiCrown Support" <support@chemicrown.com>',
    to: toEmail,
    subject: 'Your Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p>We received a request to reset your password. Here is your One Time Password (OTP):</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The ChemiCrown Team</p>
      </div>
    `
  };

  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.warn("⚠️ Brevo SMTP credentials missing! Logging OTP to console instead.");
    console.log(`[DEV MODE] OTP for ${toEmail} is ${otp}`);
    return true; // Simulate success in dev if keys aren't set yet
  }

  return transporter.sendMail(mailOptions);
};
