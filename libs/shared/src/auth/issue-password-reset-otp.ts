import type { PrismaService } from "@shared/prisma/prisma.service";

export const PASSWORD_RESET_OTP_TTL_MS = 15 * 60 * 1000;

export function generatePasswordResetOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export type IssuePasswordResetOtpOptions = {
  sendEmail: (email: string, code: string) => Promise<void>;
  createNotification?: boolean;
  notificationMessage?: string;
};

export async function issuePasswordResetOtp(
  prisma: PrismaService,
  userId: string,
  email: string,
  options: IssuePasswordResetOtpOptions,
): Promise<string> {
  const code = generatePasswordResetOtp();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetCode: code,
      passwordResetExpiresAt: expiresAt,
    },
  });

  const tasks: Promise<unknown>[] = [options.sendEmail(email, code)];

  if (options.createNotification !== false) {
    tasks.push(
      prisma.notification.create({
        data: {
          userId,
          type: "password_reset_requested",
          title: "Password reset requested",
          message:
            options.notificationMessage ??
            "We sent an OTP code to your email. Use it to verify and reset your password.",
        },
      }),
    );
  }

  await Promise.all(tasks);
  return code;
}
