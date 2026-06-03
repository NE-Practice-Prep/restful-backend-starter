import type { PrismaService } from "../prisma/prisma.service";
import { Role } from "../common/enums/role.enum";
import { UserStatus } from "../common/enums/user-status.enum";

export async function notifyPersonnel(
  prisma: PrismaService,
  params: {
    type: string;
    title: string;
    message: string;
    roles?: Role[];
    userIds?: string[];
  },
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
    select: { id: true },
  });

  const uniqueIds = [...new Set(users.map((u) => u.id))];
  if (uniqueIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
    })),
  });
}
