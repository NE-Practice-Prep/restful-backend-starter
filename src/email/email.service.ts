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

  async sendExpiryWarning(
    email: string,
    name: string,
    serialNumber: string,
    type: string,
    expiryDate: Date,
    daysLeft: number,
  ): Promise<void> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const expiry = expiryDate.toISOString().slice(0, 10);
    const subject = `Fire extinguisher ${serialNumber} expiring soon`;
    const text = `Hi ${name},\n\nYour fire extinguisher (${type}, serial ${serialNumber}) will expire on ${expiry} — ${daysLeft} day(s) remaining.\n\nPlease log in at ${appUrl} to request a renewal.\n\nFire Extinguisher Management`;

    await this.sendPlainEmail(email, subject, text);
  }

  async sendExpiryNotice(
    email: string,
    name: string,
    serialNumber: string,
    type: string,
    expiryDate: Date,
  ): Promise<void> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const expiry = expiryDate.toISOString().slice(0, 10);
    const subject = `Fire extinguisher ${serialNumber} has expired`;
    const text = `Hi ${name},\n\nYour fire extinguisher (${type}, serial ${serialNumber}) expired on ${expiry}.\n\nPlease log in at ${appUrl} to request a renewal immediately.\n\nFire Extinguisher Management`;

    await this.sendPlainEmail(email, subject, text);
  }

  private async sendPlainEmail(email: string, subject: string, text: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Email to ${email}: ${subject}\n${text}`);
      return;
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    await transporter.sendMail({ from, to: email, subject, text });
  }
}
