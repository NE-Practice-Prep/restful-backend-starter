import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../common/enums/role.enum";
import { UserStatus } from "../common/enums/user-status.enum";
import { toCustomer } from "../common/mappers/customer.mapper";
import type { CreateCustomerDto } from "./dto/create-customer.dto";
import type { UpdateCustomerDto } from "./dto/create-customer.dto";
import type { parseListCustomersQuery } from "./dto/list-customers-query.dto";

type ListParams = ReturnType<typeof parseListCustomersQuery>;

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private readonly customerSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    address: true,
    contactNotes: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { extinguishers: true } },
  } as const;

  async findAll(params: ListParams) {
    const where = params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
            { phone: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const orderBy =
      params.sort === "name"
        ? { name: params.order }
        : { createdAt: params.order };

    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: params.limit,
        select: this.customerSelect,
      }),
    ]);

    return {
      data: rows.map(toCustomer),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async findByIdOrThrow(id: string) {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      select: this.customerSelect,
    });
    if (!row) throw new NotFoundException("Customer not found");
    return toCustomer(row);
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Customer email already exists");

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException("Email already used by a user account");

    let userId: string | undefined;

    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          phone: dto.phone,
          location: dto.address,
          passwordHash,
          role: Role.customer,
          status: UserStatus.active,
          emailVerified: true,
        },
      });
      userId = user.id;
    }

    const row = await this.prisma.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        contactNotes: dto.contactNotes ?? "",
        userId,
      },
      select: this.customerSelect,
    });

    return toCustomer(row);
  }

  async updateById(id: string, dto: UpdateCustomerDto) {
    await this.findByIdOrThrow(id);

    if (dto.email) {
      const conflict = await this.prisma.customer.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) throw new ConflictException("Customer email already exists");
    }

    const current = await this.prisma.customer.findUnique({ where: { id } });

    if (dto.password && current?.userId) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      await this.prisma.user.update({
        where: { id: current.userId },
        data: { passwordHash },
      });
    } else if (dto.password && !current?.userId) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const email = dto.email ?? current!.email;
      const name = dto.name ?? current!.name;
      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          phone: dto.phone ?? current!.phone,
          location: dto.address ?? current!.address,
          passwordHash,
          role: Role.customer,
          status: UserStatus.active,
          emailVerified: true,
        },
      });
      await this.prisma.customer.update({
        where: { id },
        data: { userId: user.id },
      });
    }

    if (current?.userId) {
      await this.prisma.user.update({
        where: { id: current.userId },
        data: {
          ...(dto.email ? { email: dto.email } : {}),
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.address !== undefined ? { location: dto.address } : {}),
        },
      });
    }

    const row = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.contactNotes !== undefined ? { contactNotes: dto.contactNotes } : {}),
      },
      select: this.customerSelect,
    });

    return toCustomer(row);
  }

  async deleteById(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }

  async getCustomerForUser(userId: string) {
    const row = await this.prisma.customer.findUnique({
      where: { userId },
      select: this.customerSelect,
    });
    if (!row) throw new NotFoundException("Customer profile not found");
    return toCustomer(row);
  }
}
