import "dotenv/config";

import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  onModuleInit() {
    const transporter = this.getTransporter();
    if (transporter) {
      this.logger.log("SMTP configured — OTP emails will be sent");
      return;
    }

    const missing = [
      !(process.env.SMTP_HOST ?? "").trim() && "SMTP_HOST",
      !(process.env.SMTP_USER ?? "").trim() && "SMTP_USER",
      !(process.env.SMTP_PASS ?? "").trim() && "SMTP_PASS",
    ].filter(Boolean);

    this.logger.warn(
      `SMTP not configured (missing: ${missing.join(", ") || "unknown"}). OTP codes will be logged here only. Restart the server after updating .env.`,
    );
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = (process.env.SMTP_HOST ?? "").trim();
    const port = Number((process.env.SMTP_PORT ?? "587").trim());
    const user = (process.env.SMTP_USER ?? "").trim();
    const pass = (process.env.SMTP_PASS ?? "").trim().replace(/\s+/g, "");

    if (!host || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    const user = (process.env.SMTP_USER ?? "").trim();
    const from = (process.env.SMTP_FROM ?? user).trim();
    // Gmail only allows sending as the authenticated account unless "Send mail as" is configured.
    if (hostLooksLikeGmail(process.env.SMTP_HOST) && from !== user) {
      return user;
    }
    return from || "noreply@example.com";
  }

  private async sendMail(to: string, subject: string, text: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return;
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to,
        subject,
        text,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const subject = "Verify your email";
    const text = `Your verification code is ${code}. It expires in 15 minutes.`;

    if (!this.getTransporter()) {
      this.logger.warn(`SMTP not configured. Verification code for ${email}: ${code}`);
      return;
    }

    await this.sendMail(email, subject, text);
  }

  async sendInvitation(email: string, name: string): Promise<void> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = "You have been invited";
    const text = `Hi ${name}, you have been invited to join the workspace. Sign in at ${appUrl}/login`;

    if (!this.getTransporter()) {
      this.logger.warn(`SMTP not configured. Invitation for ${email}: ${text}`);
      return;
    }

    await this.sendMail(email, subject, text);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = "Password reset OTP";
    const text = `Your password reset code is ${code}. It expires in 15 minutes.`;

    if (!this.getTransporter()) {
      this.logger.warn(`SMTP not configured. Password reset code for ${email}: ${code}`);
      return;
    }

    await this.sendMail(email, subject, text);
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
    const text = message.trim();

    if (!this.getTransporter()) {
      this.logger.warn(
        `SMTP not configured. Notification email for ${email} — subject: ${subject}`,
      );
      return;
    }

    await this.sendMail(email, subject, text);
    this.logger.log(`Notification email sent to ${email}: ${subject}`);
  }

  async sendPasswordResetSuccess(email: string): Promise<void> {
    const subject = "Password changed successfully";
    const text =
      "Your password has been changed successfully. If this wasn't you, please contact support immediately.";

    if (!this.getTransporter()) {
      this.logger.warn(`SMTP not configured. Password reset success email for ${email}`);
      return;
    }

    await this.sendMail(email, subject, text);
  }
}

function hostLooksLikeGmail(host: string | undefined): boolean {
  return (host ?? "").trim().toLowerCase().includes("gmail");
}
