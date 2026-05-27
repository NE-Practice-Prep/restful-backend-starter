import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../common/enums/role.enum";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateMeDto } from "./dto/update-me.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: this.publicUserSelect,
    });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicUserSelect,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name ?? null,
        passwordHash,
        roles: (dto.roles ?? [Role.USER]) as unknown as Role[],
        isActive: dto.isActive ?? true,
      },
      select: this.publicUserSelect,
    });
  }

  async updateById(id: string, dto: UpdateUserDto) {
    await this.findByIdOrThrow(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        roles: dto.roles as unknown as Role[] | undefined,
        isActive: dto.isActive,
      },
      select: this.publicUserSelect,
    });
  }

  async setRoles(id: string, roles: Role[]) {
    await this.findByIdOrThrow(id);

    return this.prisma.user.update({
      where: { id },
      data: { roles: roles as unknown as Role[] },
      select: this.publicUserSelect,
    });
  }

  async deactivate(id: string) {
    await this.findByIdOrThrow(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: this.publicUserSelect,
    });
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
      select: this.publicUserSelect,
    });
  }

  private get publicUserSelect() {
    return {
      id: true,
      email: true,
      name: true,
      roles: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
