import type { PrismaService } from "../prisma/prisma.service";
import type { EmailService } from "../email/email.service";
import { Role } from "../common/enums/role.enum";
import { UserStatus } from "../common/enums/user-status.enum";

export type NotifyParams = {
  type: string;
  title: string;
  message: string;
  roles?: Role[];
  userIds?: string[];
};

function formatEmailBody(firstName: string, lastName: string, message: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "there";
  return `Hi ${name},\n\n${message.trim()}\n\n— Fire Safety System`;
}

export async function notifyPersonnel(
  prisma: PrismaService,
  params: NotifyParams,
  emailService?: EmailService,
) {
  const roleFilter = params.roles?.length
    ? { role: { in: params.roles } }
    : {};

  const users = await prisma.user.findMany({
    where: {
      status: UserStatus.active,
      OR: [
        ...(params.userIds?.length ? [{ id: { in: params.userIds } }] : []),
        ...(params.roles?.length ? [roleFilter] : []),
      ],
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  const uniqueUsers = [
    ...new Map(users.map((user) => [user.id, user])).values(),
  ];
  if (uniqueUsers.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueUsers.map((user) => ({
      userId: user.id,
      type: params.type,
      title: params.title,
      message: params.message,
    })),
  });

  if (!emailService) return;

  await Promise.allSettled(
    uniqueUsers.map((user) =>
      emailService.sendNotificationEmail(
        user.email,
        params.title,
        formatEmailBody(user.firstName, user.lastName, params.message),
      ),
    ),
  );
}

/** Notifies the user assigned to an extinguisher (in-app + email when configured). */
export async function notifyExtinguisherAssignee(
  prisma: PrismaService,
  extinguisherId: string,
  params: NotifyParams,
  emailService?: EmailService,
  options?: { excludeUserIds?: string[] },
) {
  const extinguisher = await prisma.fireExtinguisher.findUnique({
    where: { id: extinguisherId },
    select: { assignedToId: true },
  });
  if (!extinguisher?.assignedToId) return;
  if (options?.excludeUserIds?.includes(extinguisher.assignedToId)) return;

  await notifyPersonnel(
    prisma,
    { ...params, roles: [], userIds: [extinguisher.assignedToId] },
    emailService,
  );
}

export function extinguisherLabel(serialNumber: string, location: string): string {
  return `${serialNumber} at ${location}`;
}
