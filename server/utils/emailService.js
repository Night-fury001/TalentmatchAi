const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Job Portal <no-reply@jobportal.dev>';

const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Sends an email if SMTP credentials are configured. Otherwise, logs the
 * message to the console so local development / demo environments can
 * still complete verification and password-reset flows end-to-end.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!isSmtpConfigured) {
    // eslint-disable-next-line no-console
    console.log('\n────────────────────────────────────────────');
    console.log('[emailService] SMTP not configured — logging email instead of sending it.');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('────────────────────────────────────────────\n');
    return { delivered: false, mode: 'console' };
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  return { delivered: true, mode: 'smtp' };
}

async function sendVerificationEmail(to, rawToken) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  return sendEmail({
    to,
    subject: 'Verify your Northa account',
    text: `Welcome to Northa! Verify your email by visiting: ${verifyUrl} (this link expires in 24 hours).`,
    html: `<p>Welcome to Northa!</p><p>Please verify your email by clicking the link below (expires in 24 hours):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

async function sendPasswordResetEmail(to, rawToken) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  return sendEmail({
    to,
    subject: 'Reset your Northa password',
    text: `We received a request to reset your password. Visit: ${resetUrl} (this link expires in 1 hour). If you didn't request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, isSmtpConfigured };
