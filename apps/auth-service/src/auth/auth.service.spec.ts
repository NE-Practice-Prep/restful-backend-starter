import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { AuthService } from "./auth.service";
import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";

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

function makeEmail() {
  return {
    sendVerificationCode: vi.fn().mockResolvedValue({ delivered: true }),
    sendPasswordResetCode: vi.fn().mockResolvedValue({ delivered: true }),
    sendInvitation: vi.fn(),
  };
}

const BASE_DATE = new Date("2026-01-01T00:00:00Z");

function makeDbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "alice@example.com",
    name: "Alice",
    passwordHash: "hashed_pw",
    role: Role.viewer,
    status: UserStatus.active,
    phone: null,
    location: null,
    bio: "",
    avatarUrl: null,
    emailVerified: true,
    emailVerificationCode: null,
    emailVerificationExpiresAt: null,
    passwordResetCode: null,
    passwordResetExpiresAt: null,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    createdAt: BASE_DATE,
    ...overrides,
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: ReturnType<typeof makeJwt>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    jwt = makeJwt();
    email = makeEmail();
    service = new AuthService(prisma as never, jwt as never, email as never);
  });

  describe("register", () => {
    it("throws ConflictException when email is already registered", async () => {
      prisma.user.findUnique.mockResolvedValue(makeDbUser());

      await expect(
        service.register({
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          password: "password123",
          acceptTerms: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("creates a new user and returns an access token", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue("hashed_pw");

      const created = makeDbUser({ id: "user-2", email: "bob@example.com", emailVerified: false });
      prisma.user.create.mockResolvedValue(created);
      jwt.signAsync.mockResolvedValue("jwt-token");

      const result = await service.register({
        firstName: "Bob",
        lastName: "Jones",
        email: "bob@example.com",
        password: "password123",
        acceptTerms: true,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: Role.viewer }),
        }),
      );
      expect(result.accessToken).toBe("jwt-token");
      expect(result.emailVerified).toBe(false);
      expect(email.sendVerificationCode).toHaveBeenCalledWith(
        "bob@example.com",
        expect.stringMatching(/^\d{6}$/),
      );
    });
  });

  describe("login", () => {
    it("throws UnauthorizedException when user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@example.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns an access token for valid credentials", async () => {
      const user = makeDbUser({ passwordHash: "hashed_pw" });
      prisma.user.findUnique.mockResolvedValue(user);
      mockBcryptCompare.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue("jwt-token");

      const result = await service.login({ email: "alice@example.com", password: "password123" });

      expect(result.accessToken).toBe("jwt-token");
    });
  });

  describe("forgotPassword", () => {
    it("throws NotFoundException when the email has no account", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.forgotPassword({ email: "nobody@example.com" })).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(email.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it("stores a reset code and emails it for an existing user", async () => {
      const user = makeDbUser({
        id: "user-1",
        email: "alice@example.com",
        emailVerificationCode: "123456",
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.forgotPassword({ email: "alice@example.com" });
      const updateData = prisma.user.update.mock.calls[0]?.[0]?.data;

      expect(result.ok).toBe(true);
      expect(result.devResetCode).toBeUndefined();
      expect(updateData.passwordResetCode).toMatch(/^\d{6}$/);
      expect(updateData.passwordResetCode).not.toBe("123456");
      expect(updateData.passwordResetExpiresAt).toBeInstanceOf(Date);
      expect(updateData.passwordResetToken).toBeNull();
      expect(updateData.passwordResetTokenExpiresAt).toBeNull();
      expect(email.sendPasswordResetCode).toHaveBeenCalledWith(
        "alice@example.com",
        updateData.passwordResetCode,
      );
    });

    it("returns devResetCode when SMTP delivery fails", async () => {
      email.sendPasswordResetCode.mockResolvedValueOnce({ delivered: false });
      prisma.user.findUnique.mockResolvedValue(
        makeDbUser({ email: "inspector@tzw.local" }),
      );
      prisma.user.update.mockResolvedValue(makeDbUser());

      const result = await service.forgotPassword({ email: "inspector@tzw.local" });

      expect(result.devResetCode).toMatch(/^\d{6}$/);
    });
  });

  describe("verifyResetPassword", () => {
    it("verifies the reset code and returns a reset session token", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        passwordResetCode: "123456",
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.update.mockResolvedValue(makeDbUser());

      const result = await service.verifyResetPassword({
        email: "alice@example.com",
        code: "123456",
      });

      expect(result.ok).toBe(true);
      expect(result.resetToken).toMatch(/^[a-f0-9]{64}$/);
      const updateData = prisma.user.update.mock.calls[0]?.[0]?.data;
      expect(updateData.passwordResetCode).toBeNull();
      expect(updateData.passwordResetExpiresAt).toBeNull();
      expect(updateData.passwordResetToken).toBe(result.resetToken);
      expect(updateData.passwordResetTokenExpiresAt).toBeInstanceOf(Date);
    });

    it("throws BadRequestException for an invalid reset code", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        passwordResetCode: "123456",
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.verifyResetPassword({
          email: "alice@example.com",
          code: "654321",
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("updates password hash and clears reset fields on success", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        passwordResetToken: "reset-token",
        passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
      });
      mockBcryptHash.mockResolvedValue("new_hash");
      prisma.user.update.mockResolvedValue(makeDbUser());

      const result = await service.resetPassword({
        email: "alice@example.com",
        token: "reset-token",
        newPassword: "new_pass23",
      });

      expect(result).toEqual({ ok: true });
      expect(mockBcryptHash).toHaveBeenCalledWith("new_pass23", 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          passwordHash: "new_hash",
          passwordResetCode: null,
          passwordResetExpiresAt: null,
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
        },
      });
    });

    it("throws BadRequestException for an invalid reset session", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        passwordResetToken: "reset-token",
        passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword({
          email: "alice@example.com",
          token: "wrong-token",
          newPassword: "new_pass23",
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    const currentUser = { sub: "user-1", email: "alice@example.com", role: Role.viewer };

    it("updates password hash and returns { ok: true } on success", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "old_hash" });
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("new_hash");
      prisma.user.update.mockResolvedValue(makeDbUser());

      const result = await service.changePassword(currentUser, {
        currentPassword: "old_pass1",
        newPassword: "new_pass23",
      });

      expect(result).toEqual({ ok: true });
    });
  });
});
