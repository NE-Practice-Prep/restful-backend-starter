import type { NotificationType } from "@shared/generated/prisma/enums";
import type { PrismaService } from "@shared/prisma/prisma.service";

/**
 * Sends an email at most once per user + eventKey.
 * Uses the Notification table as an email delivery ledger (in-app UI disabled).
 */
export async function sendEmailOnce(
  prisma: PrismaService,
  params: {
    userId: string;
    eventKey: string;
    extinguisherId: string;
    type: NotificationType;
    title: string;
    message: string;
    send: () => Promise<{ delivered: boolean }>;
  },
): Promise<{ delivered: boolean; skipped: boolean }> {
  const existing = await prisma.notification.findUnique({
    where: {
      userId_eventKey: {
        userId: params.userId,
        eventKey: params.eventKey,
      },
    },
  });

  if (existing?.emailSentAt) {
    return { delivered: false, skipped: true };
  }

  const row =
    existing ??
    (await prisma.notification.create({
      data: {
        userId: params.userId,
        eventKey: params.eventKey,
        extinguisherId: params.extinguisherId,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    }));

  const { delivered } = await params.send();

  if (delivered) {
    await prisma.notification.update({
      where: { id: row.id },
      data: { emailSentAt: new Date() },
    });
  }

  return { delivered, skipped: false };
}
