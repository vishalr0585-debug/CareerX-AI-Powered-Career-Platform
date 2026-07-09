const nodemailer = require("nodemailer");

/**
 * Create reusable transporter.
 *
 * In production, configure SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in .env
 * to use a real provider (SendGrid, AWS SES, Mailgun, etc.).
 *
 * In development, if no SMTP vars are set the mailer uses Ethereal (free
 * catch-all test service) so no emails are actually delivered but you can
 * preview them via the URL logged to the console.
 */
let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  // Production / custom SMTP
  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return _transporter;
  }

  // Development — Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  _transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log(`📧 Ethereal mail account: ${testAccount.user}`);
  return _transporter;
};

/**
 * Send an email.
 * @param {{ to: string, subject: string, text?: string, html?: string }} options
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || '"CareerX" <noreply@careerx.dev>';

  const info = await transporter.sendMail({ from, to, subject, text, html });

  // In dev with Ethereal, log the preview URL
  if (!process.env.SMTP_HOST) {
    console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

/**
 * Send a password-reset email.
 * @param {string} email
 * @param {string} resetToken — raw (un-hashed) token
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetURL = `${clientUrl}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1117;border-radius:16px;color:#e4e4e7">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);width:48px;height:48px;border-radius:12px;line-height:48px;color:#fff;font-weight:bold;font-size:20px">C</div>
      </div>
      <h2 style="text-align:center;color:#fff;margin:0 0 8px">Reset Your Password</h2>
      <p style="text-align:center;color:#a1a1aa;font-size:14px;margin:0 0 24px">
        We received a request to reset the password for your CareerX account.
      </p>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${resetURL}"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px">
          Reset Password
        </a>
      </div>
      <p style="color:#71717a;font-size:12px;text-align:center">
        This link expires in 30 minutes. If you didn&apos;t request a password reset, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #27272a;margin:24px 0" />
      <p style="color:#52525b;font-size:11px;text-align:center">&copy; ${new Date().getFullYear()} CareerX. All rights reserved.</p>
    </div>
  `;

  const text = `Reset your CareerX password by visiting: ${resetURL}\n\nThis link expires in 30 minutes.`;

  await sendEmail({
    to: email,
    subject: "CareerX — Reset Your Password",
    text,
    html,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail };
