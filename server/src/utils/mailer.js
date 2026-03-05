import nodemailer from "nodemailer";

let transporterPromise = null;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !process.env.SMTP_FROM) {
    throw new Error("Missing SMTP_HOST or SMTP_FROM in environment variables.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: user && pass ? { user, pass } : undefined,
    family: 4, // 👈 FORCE IPv4
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(createTransporter());
  }
  return transporterPromise;
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM;

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your Liege-Tracker password",
    text: `You requested a password reset for Liege-Tracker. Use this link within 15 minutes: ${resetUrl}`,
    html: `
      <p>You requested a password reset for <strong>Liege-Tracker</strong>.</p>
      <p>This link is valid for <strong>15 minutes</strong>.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
    `,
  });
}

export async function sendRegisterEmail({ to, verifyUrl }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM;

  await transporter.sendMail({
    from,
    to,
    subject: "Verify your Liege-Tracker account",
    text: `Welcome to Liege-Tracker. Verify your account with this link: ${verifyUrl}`,
    html: `
      <p>Welcome to <strong>Liege-Tracker</strong>.</p>
      <p>Please verify your account to finish setup.</p>
      <p><a href="${verifyUrl}">Verify your account</a></p>
    `,
  });
}

export async function sendEmail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export const sendEmailAlert = sendEmail;
