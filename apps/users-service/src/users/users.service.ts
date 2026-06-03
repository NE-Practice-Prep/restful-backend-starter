import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { getRoleLabel } from "@shared/common/utils/role-labels";
import {
  generateTemporaryPassword,
  shouldExposeDevCredentials,
} from "@shared/common/utils/temp-password.util";

import { PrismaService } from "@shared/prisma/prisma.service";
import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";
import { EmailService } from "@shared/email/email.service";
import { toCurrentUser, toWorkspaceUser } from "@shared/common/mappers/user.mapper";
import type { ChangePasswordDto } from "@shared/dto/change-password.dto";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateMeDto } from "./dto/update-me.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { parseListUsersQuery } from "./dto/list-users-query.dto";
import type { AvatarFilePayload } from "@shared/types/avatar-file.type";

type ListUsersParams = ReturnType<typeof parseListUsersQuery>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  async findAll(params: ListUsersParams) {
    const where = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" as const } },
              { email: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const orderBy = { createdAt: params.order };
    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: params.limit,
        select: this.workspaceUserSelect,
      }),
    ]);

    const data = rows.map(toWorkspaceUser);
    const totalPages = Math.max(1, Math.ceil(total / params.limit));

    return {
      data,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
      },
    };
  }

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.workspaceUserSelect,
    });
    if (!user) throw new NotFoundException("User not found");
    return toWorkspaceUser(user);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.profileSelect,
    });
    if (!user) throw new NotFoundException("User not found");
    return toCurrentUser(user);
  }

  /**
   * Admin-only (gateway @Roles admin).
   * 1) Generates a one-time password and hashes it.
   * 2) Sets emailVerified true (no public signup OTP flow).
   * 3) Emails sendStaffInvitation with email + temporary password.
   * Inspectors use /login; they can later use /forgot-password to choose their own password.
   */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already registered");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Admin-provisioned accounts (inspectors, etc.) skip public signup verification
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim(),
        name: dto.name.trim(),
        role: dto.role,
        status: dto.status,
        phone: dto.phone?.trim() || null,
        location: dto.location?.trim() || null,
        passwordHash,
        emailVerified: true,
      },
      select: this.workspaceUserSelect,
    });

    const { delivered } = await this.email.sendStaffInvitation({
      email: user.email,
      name: user.name,
      roleLabel: getRoleLabel(dto.role),
      temporaryPassword,
    });

    return {
      ...toWorkspaceUser(user),
      invitationEmailSent: delivered,
      ...(shouldExposeDevCredentials(delivered)
        ? { devTemporaryPassword: temporaryPassword }
        : {}),
    };
  }

  async updateById(id: string, dto: UpdateUserDto) {
    await this.findByIdOrThrow(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException("Email already in use");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        email: dto.email?.trim(),
        role: dto.role,
        status: dto.status,
        phone: dto.phone === undefined ? undefined : dto.phone.trim() || null,
        location: dto.location === undefined ? undefined : dto.location.trim() || null,
      },
      select: this.workspaceUserSelect,
    });

    return toWorkspaceUser(user);
  }

  async deleteById(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException("Email already in use");
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim(),
        email: dto.email?.trim(),
        bio: dto.bio,
        location: dto.location?.trim(),
        phone: dto.phone?.trim(),
      },
      select: this.profileSelect,
    });

    return toCurrentUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) throw new BadRequestException("Password not set");

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException("Current password is incorrect");

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { ok: true };
  }

  async uploadAvatar(userId: string, file: AvatarFilePayload) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException("Unsupported image type");
    }

    const uploadsDir = join(process.cwd(), "uploads", "avatars");
    await mkdir(uploadsDir, { recursive: true });

    const ext = extname(file.originalname) || ".jpg";
    const filename = `${userId}-${randomUUID()}${ext}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: this.profileSelect,
    });

    return { avatar: avatarUrl, user: toCurrentUser(user) };
  }

  async removeAvatar(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (existing?.avatarUrl?.startsWith("/uploads/")) {
      const filepath = join(process.cwd(), existing.avatarUrl);
      await unlink(filepath).catch(() => undefined);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: this.profileSelect,
    });

    return { user: toCurrentUser(user) };
  }

  private get workspaceUserSelect() {
    return {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      phone: true,
      location: true,
      bio: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    } as const;
  }

  private get profileSelect() {
    return this.workspaceUserSelect;
  }
}
