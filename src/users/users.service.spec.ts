import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { UsersService } from "./users.service";
import { Role } from "../common/enums/role.enum";

vi.mock("bcrypt");

const mockBcryptHash = vi.mocked(bcrypt.hash as (data: string, saltOrRounds: number) => Promise<string>);

const BASE_DATE = new Date("2026-01-01T00:00:00Z");

function makeDbUser(overrides: Partial<{
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: "user-1",
    email: "alice@example.com",
    name: "Alice",
    roles: [Role.USER],
    isActive: true,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  };
}

function makePrisma() {
  return {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("UsersService", () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new UsersService(prisma as never);
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe("findAll", () => {
    it("returns the list of users from Prisma", async () => {
      const users = [makeDbUser(), makeDbUser({ id: "user-2", email: "bob@example.com" })];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, orderBy: { createdAt: "desc" } }),
      );
    });

    it("returns an empty array when no users exist", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findByIdOrThrow ───────────────────────────────────────────────────────

  describe("findByIdOrThrow", () => {
    it("returns the user when found", async () => {
      const user = makeDbUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByIdOrThrow("user-1");

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" } }),
      );
    });

    it("throws NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByIdOrThrow("non-existent")).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("throws BadRequestException when email is already taken", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());

      await expect(
        service.create({ email: "alice@example.com", password: "password123" }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("hashes password and creates the user with default USER role", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");
      const created = makeDbUser({ email: "new@example.com" });
      prisma.user.create.mockResolvedValue(created);

      const result = await service.create({ email: "new@example.com", password: "password123" });

      expect(mockBcryptHash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "new@example.com",
            passwordHash: "hashed_pw",
            roles: [Role.USER],
            isActive: true,
          }),
        }),
      );
      expect(result).toEqual(created);
    });

    it("uses the provided roles when specified", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue(makeDbUser({ roles: [Role.ADMIN] }));

      await service.create({ email: "admin@example.com", password: "password123", roles: [Role.ADMIN] });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roles: [Role.ADMIN] }),
        }),
      );
    });

    it("uses the provided isActive flag when specified", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue(makeDbUser({ isActive: false }));

      await service.create({ email: "inactive@example.com", password: "password123", isActive: false });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it("stores null for name when not provided", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue(makeDbUser({ name: null }));

      await service.create({ email: "noname@example.com", password: "password123" });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: null }) }),
      );
    });
  });

  // ── updateById ────────────────────────────────────────────────────────────

  describe("updateById", () => {
    it("throws NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateById("non-existent", { email: "new@example.com" }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("calls prisma.update with the provided fields and returns the updated user", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());
      const updated = makeDbUser({ email: "updated@example.com" });
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateById("user-1", { email: "updated@example.com" });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({ email: "updated@example.com" }),
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  // ── setRoles ──────────────────────────────────────────────────────────────

  describe("setRoles", () => {
    it("throws NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.setRoles("non-existent", [Role.ADMIN])).rejects.toThrow(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("updates the user roles and returns the updated user", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());
      const updated = makeDbUser({ roles: [Role.ADMIN, Role.MODERATOR] });
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.setRoles("user-1", [Role.ADMIN, Role.MODERATOR]);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { roles: [Role.ADMIN, Role.MODERATOR] },
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  // ── deactivate ────────────────────────────────────────────────────────────

  describe("deactivate", () => {
    it("throws NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivate("non-existent")).rejects.toThrow(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("sets isActive to false and returns the updated user", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());
      const deactivated = makeDbUser({ isActive: false });
      prisma.user.update.mockResolvedValue(deactivated);

      const result = await service.deactivate("user-1");

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { isActive: false },
        }),
      );
      expect(result).toEqual(deactivated);
    });
  });

  // ── updateMe ──────────────────────────────────────────────────────────────

  describe("updateMe", () => {
    it("updates the user name and returns the updated user", async () => {
      const updated = makeDbUser({ name: "New Name" });
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateMe("user-1", { name: "New Name" });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { name: "New Name" },
        }),
      );
      expect(result).toEqual(updated);
    });

    it("can set name to undefined to remove it", async () => {
      const updated = makeDbUser({ name: null });
      prisma.user.update.mockResolvedValue(updated);

      await service.updateMe("user-1", {});

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: undefined } }),
      );
    });
  });
});
