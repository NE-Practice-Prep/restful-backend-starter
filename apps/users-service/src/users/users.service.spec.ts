import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictException, NotFoundException } from "@nestjs/common";

import { UsersService } from "./users.service";
import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";

const BASE_DATE = new Date("2026-01-01T00:00:00Z");

function makeDbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Example",
    role: Role.user,
    status: UserStatus.active,
    phone: null,
    location: null,
    bio: "",
    avatarUrl: null,
    emailVerified: true,
    createdAt: BASE_DATE,
    ...overrides,
  };
}

function makePrisma() {
  return {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function makeEmail() {
  return { sendVerificationCode: vi.fn(), sendInvitation: vi.fn() };
}

describe("UsersService", () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    email = makeEmail();
    service = new UsersService(prisma as never, email as never);
  });

  describe("findAll", () => {
    it("returns paginated users", async () => {
      const users = [makeDbUser()];
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({
        q: "",
        role: undefined,
        status: undefined,
        sort: "createdAt",
        order: "desc",
        page: 1,
        limit: 5,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findByIdOrThrow", () => {
    it("throws NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByIdOrThrow("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("throws ConflictException when email already exists", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());

      await expect(
        service.create({
          firstName: "Bob",
          lastName: "Example",
          email: "alice@example.com",
          role: Role.user,
          status: UserStatus.invited,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
