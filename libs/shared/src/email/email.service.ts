import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = (process.env.SMTP_HOST ?? "").trim();
    const port = Number((process.env.SMTP_PORT ?? "587").trim());
    const user = (process.env.SMTP_USER ?? "").trim();
    const pass = (process.env.SMTP_PASS ?? "").trim();

    if (!host || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const subject = "Verify your email";
    const text = `Your verification code is ${code}. It expires in 15 minutes.`;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Verification code for ${email}: ${code}`);
      return;
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
    });
  }

  async sendInvitation(email: string, name: string): Promise<void> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = "You have been invited";
    const text = `Hi ${name}, you have been invited to join the workspace. Sign in at ${appUrl}/login`;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Invitation for ${email}: ${text}`);
      return;
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
    });
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = "Password reset OTP";
    const text = `Your password reset code is ${code}. It expires in 15 minutes.`;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Password reset code for ${email}: ${code}`);
      return;
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();
    await transporter.sendMail({ from, to: email, subject, text });
  }

  /**
   * Sends a generic notification email. Intended for future use when
   * in-app notifications should also be delivered by email.
   */
  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const transporter = this.getTransporter();
    const text = message.trim();

    if (!transporter) {
      this.logger.warn(
        `SMTP not configured. Notification email for ${email} — subject: ${subject}`,
      );
      return;
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();
    await transporter.sendMail({ from, to: email, subject, text });
    this.logger.log(`Notification email sent to ${email}: ${subject}`);
  }

  async sendPasswordResetSuccess(email: string): Promise<void> {
    const subject = "Password changed successfully";
    const text =
      "Your password has been changed successfully. If this wasn't you, please contact support immediately.";

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Password reset success email for ${email}`);
      return;
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();
    await transporter.sendMail({ from, to: email, subject, text });
  }
}
