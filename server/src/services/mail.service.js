import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

/** SMTP is optional — without SMTP_HOST the app keeps its dev fallback (console + dev payload). */
export function isMailConfigured() {
  return Boolean(env.SMTP_HOST);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true" || env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

async function send({ to, subject, html, text }) {
  if (!isMailConfigured()) return { sent: false, reason: "SMTP not configured" };
  try {
    await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, html, text });
    console.log(`[MAIL] "${subject}" -> ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[MAIL FAILED] "${subject}" -> ${to}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

function shell(title, bodyHtml, footerNote) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f4f4f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:24px auto;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#18181b;padding:20px 28px;">
      <span style="font-size:18px;font-weight:700;color:#fbbf24;">&#9679; Campus Coin</span>
      <span style="font-size:12px;color:#a1a1aa;margin-left:10px;">Student Budget Tracker</span>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 14px;font-size:20px;color:#18181b;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:26px;font-size:12px;color:#71717a;line-height:1.6;">${footerNote}</p>
    </div>
  </div>
</body>
</html>`;
}

export function sendOtpEmail(to, otp, expiresInMin = 10) {
  const html = shell(
    "Your verification code",
    `<p style="font-size:14px;color:#3f3f46;margin:0 0 18px;">
       Use this code to verify your email address. It expires in
       <strong>${expiresInMin} minutes</strong>.
     </p>
     <div style="text-align:center;background:#fefce8;border:1px dashed #fcd34d;border-radius:12px;padding:18px 10px;margin:6px 0 4px;">
       <span style="font-family:Consolas,Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#b45309;padding-left:10px;">${otp}</span>
     </div>`,
    "If you didn&apos;t request this code, you can safely ignore this email — only someone with access to this inbox can verify it."
  );
  const text = `Your Campus Coin verification code is: ${otp} (expires in ${expiresInMin} minutes). If you didn't request it, ignore this email.`;
  return send({ to, subject: `Campus Coin verification code: ${otp}`, html, text });
}

export function sendResetEmail(to, resetUrl) {
  const html = shell(
    "Reset your password",
    `<p style="font-size:14px;color:#3f3f46;margin:0 0 20px;">
       We received a request to reset your Campus Coin password. The link below is valid for
       <strong>30 minutes</strong> and can be used once.
     </p>
     <div style="text-align:center;margin:8px 0 18px;">
       <a href="${resetUrl}"
          style="display:inline-block;background:#f59e0b;color:#18181b;font-weight:700;font-size:15px;text-decoration:none;padding:13px 30px;border-radius:10px;">
         Reset password
       </a>
     </div>
     <p style="font-size:12px;color:#71717a;word-break:break-all;margin:0;">
       Button not working? Paste this link into your browser:<br/>
       <a href="${resetUrl}" style="color:#b45309;">${resetUrl}</a>
     </p>`,
    "If you didn&apos;t request a password reset, ignore this email — your password has not changed."
  );
  const text = `Reset your Campus Coin password (valid 30 minutes): ${resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return send({ to, subject: "Campus Coin — reset your password", html, text });
}
