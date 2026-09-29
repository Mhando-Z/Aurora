import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, text, html, replyTo }) {
  return transporter.sendMail({
    from: `"Company Support" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}
