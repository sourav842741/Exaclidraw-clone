import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.nodeEnv === 'test') {
    transporter = nodemailer.createTransport({ streamTransport: true, newline: 'unix' });
  } else {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : undefined,
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
    return null;
  }
}

const layout = (title, body) => `
  <div style="font-family:Inter,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <div style="width:10px;height:10px;border-radius:50%;background:#6366f1"></div>
      <strong style="font-size:18px">VectorShare AI</strong>
    </div>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px">
      <h2 style="margin:0 0 12px;font-size:20px">${title}</h2>
      ${body}
    </div>
    <p style="font-size:12px;color:#9ca3af;margin-top:20px">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
`;

export const mailService = {
  sendVerificationEmail(to, name, token) {
    const link = `${env.appUrl}/verify-email?token=${token}`;
    return sendMail({
      to,
      subject: 'Verify your email — VectorShare AI',
      html: layout('Verify your email', `
        <p>Hi ${name},</p>
        <p>Welcome to VectorShare AI. Please confirm your email address to activate your account.</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a>
        <p style="margin-top:16px;font-size:13px;color:#6b7280">Or paste this link: <a href="${link}">${link}</a></p>
      `),
    });
  },

  sendPasswordResetEmail(to, name, token) {
    const link = `${env.appUrl}/reset-password?token=${token}`;
    return sendMail({
      to,
      subject: 'Reset your password — VectorShare AI',
      html: layout('Reset your password', `
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="margin-top:16px;font-size:13px;color:#6b7280">If you didn't request this, ignore this email.</p>
      `),
    });
  },

  sendTeamInviteEmail(to, inviter, team, token) {
    const link = `${env.appUrl}/invite/${token}`;
    return sendMail({
      to,
      subject: `${inviter} invited you to ${team.name}`,
      html: layout('Team invitation', `
        <p><strong>${inviter}</strong> invited you to join the team <strong>${team.name}</strong> on VectorShare AI.</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invite</a>
      `),
    });
  },

  sendNotificationEmail(to, name, title, message) {
    return sendMail({
      to,
      subject: title,
      html: layout(title, `
        <p>Hi ${name},</p>
        <p>${message}</p>
      `),
    });
  },
};
