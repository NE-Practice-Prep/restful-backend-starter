import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { AuthService } from "./auth.service";
import { Role } from "../common/enums/role.enum";

vi.mock("bcrypt");

const mockBcryptHash = vi.mocked(bcrypt.hash as (data: string, saltOrRounds: number) => Promise<string>);
const mockBcryptCompare = vi.mocked(bcrypt.compare as (data: string, encrypted: string) => Promise<boolean>);

function makePrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

function makeJwt() {
  return { signAsync: vi.fn() };
}

const BASE_DATE = new Date("2026-01-01T00:00:00Z");

function makeDbUser(overrides: Partial<{
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: "user-1",
    email: "alice@example.com",
    name: "Alice",
    passwordHash: "hashed_pw",
    roles: [Role.USER],
    isActive: true,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: ReturnType<typeof makeJwt>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    jwt = makeJwt();
    service = new AuthService(prisma as never, jwt as never);
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe("register", () => {
    it("throws BadRequestException when email is already registered", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());

      await expect(
        service.register({ email: "alice@example.com", password: "password123" }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("creates a new user and returns an access token", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");

      const created = makeDbUser({ id: "user-2", email: "bob@example.com", name: null });
      prisma.user.create.mockResolvedValue(created);
      jwt.signAsync.mockResolvedValue("jwt-token");

      const result = await service.register({ email: "bob@example.com", password: "password123" });

      expect(mockBcryptHash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "bob@example.com", passwordHash: "hashed_pw" }),
        }),
      );
      expect(result).toEqual({
        accessToken: "jwt-token",
        user: { sub: "user-2", email: "bob@example.com", roles: [Role.USER] },
      });
    });

    it("stores the optional name when provided", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue(makeDbUser({ name: "Bob" }));
      jwt.signAsync.mockResolvedValue("jwt-token");

      await service.register({ email: "bob@example.com", name: "Bob", password: "password123" });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: "Bob" }) }),
      );
    });

    it("stores null for name when not provided", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue(makeDbUser({ name: null }));
      jwt.signAsync.mockResolvedValue("jwt-token");

      await service.register({ email: "bob@example.com", password: "password123" });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: null }) }),
      );
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe("login", () => {
    it("throws UnauthorizedException when user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@example.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when user account is inactive", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser({ isActive: false }));

      await expect(
        service.login({ email: "alice@example.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when user has no password hash", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser({ passwordHash: null }));

      await expect(
        service.login({ email: "alice@example.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when password does not match", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: "alice@example.com", password: "wrong_password" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns an access token for valid credentials", async () => {
      const user = makeDbUser();
      prisma.user.findUnique.mockResolvedValue(user);
      mockBcryptCompare.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue("jwt-token");

      const result = await service.login({ email: "alice@example.com", password: "password123" });

      expect(mockBcryptCompare).toHaveBeenCalledWith("password123", "hashed_pw");
      expect(result).toEqual({
        accessToken: "jwt-token",
        user: { sub: "user-1", email: "alice@example.com", roles: [Role.USER] },
      });
    });
  });

  // ── changePassword ────────────────────────────────────────────────────────

  describe("changePassword", () => {
    const currentUser = { sub: "user-1", email: "alice@example.com", roles: [Role.USER] };

    it("throws UnauthorizedException when user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(currentUser, { currentPassword: "old_pass1", newPassword: "new_pass2" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when user has no password hash", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: null });

      await expect(
        service.changePassword(currentUser, { currentPassword: "old_pass1", newPassword: "new_pass2" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when current password is incorrect", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "hashed_pw" });
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        service.changePassword(currentUser, { currentPassword: "wrong_pass", newPassword: "new_pass2" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("updates password hash and returns { ok: true } on success", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "old_hash" });
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("new_hash");
      prisma.user.update.mockResolvedValue(makeDbUser());

      const result = await service.changePassword(currentUser, {
        currentPassword: "old_pass1",
        newPassword: "new_pass23",
      });

      expect(mockBcryptCompare).toHaveBeenCalledWith("old_pass1", "old_hash");
      expect(mockBcryptHash).toHaveBeenCalledWith("new_pass23", 10);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { passwordHash: "new_hash" } }),
      );
      expect(result).toEqual({ ok: true });
    });
  });

  // ── signAccessToken ───────────────────────────────────────────────────────

  describe("signAccessToken", () => {
    it("signs a payload and returns the token with the payload echoed as user", async () => {
      jwt.signAsync.mockResolvedValue("signed-jwt");

      const payload = { sub: "user-1", email: "alice@example.com", roles: [Role.USER] };
      const result = await service.signAccessToken(payload);

      expect(jwt.signAsync).toHaveBeenCalledWith(payload);
      expect(result).toEqual({
        accessToken: "signed-jwt",
        user: payload,
      });
    });

    it("includes all roles in the echoed user payload", async () => {
      jwt.signAsync.mockResolvedValue("admin-jwt");

      const payload = { sub: "admin-1", email: "admin@example.com", roles: [Role.ADMIN, Role.MODERATOR] };
      const result = await service.signAccessToken(payload);

      expect(result.user.roles).toEqual([Role.ADMIN, Role.MODERATOR]);
    });
  });
});
