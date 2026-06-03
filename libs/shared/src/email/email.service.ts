import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

import { COMPANY_NAME } from "@shared/constants/expiry.constants";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  /** True when SMTP_HOST, SMTP_USER, and SMTP_PASS are set. */
  isConfigured(): boolean {
    const host = (process.env.SMTP_HOST ?? "").trim();
    const user = (process.env.SMTP_USER ?? "").trim();
    const pass = (process.env.SMTP_PASS ?? "").trim();
    return Boolean(host && user && pass);
  }

  /** Verifies SMTP connectivity at startup. */
  async verifyConnection(): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) return false;
    try {
      await transporter.verify();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.warn(`SMTP verify failed: ${message}`);
      return false;
    }
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = (process.env.SMTP_HOST ?? "").trim();
    const port = Number((process.env.SMTP_PORT ?? "587").trim());
    const user = (process.env.SMTP_USER ?? "").trim();
    const pass = (process.env.SMTP_PASS ?? "").trim();

    if (!host || !user || !pass) {
      return null;
    }

    const secure =
      (process.env.SMTP_SECURE ?? "").trim() === "true" || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      requireTLS: (process.env.SMTP_REQUIRE_TLS ?? "true").trim() !== "false",
    });

    return this.transporter;
  }

  async sendVerificationCode(email: string, code: string): Promise<{ delivered: boolean }> {
    const subject = `${COMPANY_NAME} — verify your email`;
    const text = `Your ${COMPANY_NAME} verification code is ${code}. It expires in 15 minutes.`;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Verification code for ${email}: ${code}`);
      return { delivered: false };
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
      });
      return { delivered: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.warn(`Failed to send verification email to ${email}: ${message}`);
      this.logger.warn(`Verification code for ${email}: ${code}`);
      return { delivered: false };
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<{ delivered: boolean }> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = `${COMPANY_NAME} — reset your password`;
    const text = [
      "You requested a password reset.",
      `Your reset code is: ${code}`,
      "It expires in 15 minutes.",
      `Enter the code at ${appUrl}/verify-reset-password`,
      `If you did not request this, you can ignore this email.`,
    ].join("\n");

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Password reset code for ${email}: ${code}`);
      return { delivered: false };
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
      });
      return { delivered: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.warn(`Failed to send password reset email to ${email}: ${message}`);
      this.logger.warn(`Password reset code for ${email}: ${code}`);
      return { delivered: false };
    }
  }

  async sendInspectionScheduled(
    email: string,
    params: {
      name: string;
      extinguisherSerial: string;
      location: string;
      scheduledDate: string;
      scheduledTime: string;
    },
  ): Promise<{ delivered: boolean }> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = `${COMPANY_NAME} — inspection scheduled`;
    const text = [
      `Hi ${params.name},`,
      ``,
      `An inspection has been scheduled on ${COMPANY_NAME}.`,
      `Extinguisher: ${params.extinguisherSerial}`,
      `Location: ${params.location}`,
      `Date: ${params.scheduledDate}`,
      `Time: ${params.scheduledTime}`,
      ``,
      `View details: ${appUrl}/inspections`,
    ].join("\n");

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Inspection scheduled for ${email}: ${text}`);
      return { delivered: false };
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
      });
      return { delivered: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.warn(`Failed to send inspection email to ${email}: ${message}`);
      this.logger.warn(`Inspection scheduled for ${email}: ${text}`);
      return { delivered: false };
    }
  }

  /**
   * Admin-provisioned staff (e.g. Inspector): email includes login email + one-time password.
   */
  async sendStaffInvitation(params: {
    email: string;
    name: string;
    roleLabel: string;
    temporaryPassword: string;
  }): Promise<{ delivered: boolean }> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = `${COMPANY_NAME} — your ${params.roleLabel} account`;
    const text = [
      `Hi ${params.name},`,
      ``,
      `An administrator created a ${params.roleLabel} account for you on ${COMPANY_NAME}.`,
      ``,
      `Sign in at: ${appUrl}/login`,
      `Email: ${params.email}`,
      `Temporary password: ${params.temporaryPassword}`,
      ``,
      `Use the email address above and this password to access your portal.`,
      `For security, reset your password after signing in via "Forgot password" on the login page if you prefer your own password.`,
      ``,
      `If you did not expect this invitation, contact your administrator.`,
    ].join("\n");

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Staff invitation for ${params.email}:`);
      this.logger.warn(text);
      return { delivered: false };
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    try {
      await transporter.sendMail({
        from,
        to: params.email,
        subject,
        text,
      });
      return { delivered: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.warn(`Failed to send staff invitation to ${params.email}: ${message}`);
      this.logger.warn(text);
      return { delivered: false };
    }
  }

  async sendInspectionCompleted(
    email: string,
    params: {
      name: string;
      inspectorName: string;
      result: string;
      extinguisherSerial: string;
      location: string;
      issuesFound?: string;
      recommendations?: string;
    },
  ): Promise<{ delivered: boolean }> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = `${COMPANY_NAME} — inspection ${params.result.toLowerCase()}`;
    const text = [
      `Hi ${params.name},`,
      ``,
      `${params.inspectorName} completed an inspection (${params.result}).`,
      `Extinguisher: ${params.extinguisherSerial}`,
      `Location: ${params.location}`,
      ...(params.issuesFound ? [`Issues: ${params.issuesFound}`] : []),
      ...(params.recommendations ? [`Recommendations: ${params.recommendations}`] : []),
      ``,
      `Review: ${appUrl}/inspections`,
    ].join("\n");

    return this.sendPlainEmail(email, subject, text);
  }

  async sendExtinguisherExpiringSoon(
    email: string,
    params: {
      name: string;
      serialNumber: string;
      location: string;
      expiryDate: string;
      daysLeft: number;
    },
  ): Promise<{ delivered: boolean }> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = `${COMPANY_NAME} — extinguisher expiring soon`;
    const text = [
      `Hi ${params.name},`,
      ``,
      `A fire extinguisher in your ${COMPANY_NAME} register is approaching its expiry date.`,
      ``,
      `Serial: ${params.serialNumber}`,
      `Location: ${params.location}`,
      `Expires: ${params.expiryDate} (${params.daysLeft} day${params.daysLeft === 1 ? "" : "s"} remaining)`,
      ``,
      `Review the unit in the portal: ${appUrl}/extinguishers`,
      ``,
      `This is an automated alert from ${COMPANY_NAME}.`,
    ].join("\n");

    return this.sendPlainEmail(email, subject, text);
  }

  async sendExtinguisherExpired(
    email: string,
    params: {
      name: string;
      serialNumber: string;
      location: string;
      expiryDate: string;
    },
  ): Promise<{ delivered: boolean }> {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").trim();
    const subject = `${COMPANY_NAME} — extinguisher expired`;
    const text = [
      `Hi ${params.name},`,
      ``,
      `A fire extinguisher in your ${COMPANY_NAME} register has expired and requires attention.`,
      ``,
      `Serial: ${params.serialNumber}`,
      `Location: ${params.location}`,
      `Expired: ${params.expiryDate}`,
      ``,
      `Schedule maintenance or replace the unit: ${appUrl}/extinguishers`,
      ``,
      `This is an automated alert from ${COMPANY_NAME}.`,
    ].join("\n");

    return this.sendPlainEmail(email, subject, text);
  }

  private async sendPlainEmail(
    email: string,
    subject: string,
    text: string,
  ): Promise<{ delivered: boolean }> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured. Email for ${email}:`);
      this.logger.warn(text);
      return { delivered: false };
    }

    const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com").trim();

    try {
      await transporter.sendMail({ from, to: email, subject, text });
      return { delivered: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.warn(`Failed to send email to ${email}: ${message}`);
      this.logger.warn(text);
      return { delivered: false };
    }
  }

  /** @deprecated Use sendStaffInvitation */
  async sendInvitation(email: string, name: string): Promise<void> {
    await this.sendStaffInvitation({
      email,
      name,
      roleLabel: "team member",
      temporaryPassword: "(see administrator)",
    });
  }
}
