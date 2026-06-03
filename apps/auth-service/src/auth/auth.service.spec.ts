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
    sendVerificationCode: vi.fn(),
    sendInvitation: vi.fn(),
    sendPasswordResetCode: vi.fn(),
    sendPasswordResetSuccess: vi.fn(),
  };
}

const BASE_DATE = new Date("2026-01-01T00:00:00Z");

function makeDbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Example",
    passwordHash: "hashed_pw",
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
          lastName: "Example",
          email: "alice@example.com",
          password: "Password1!",
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
        lastName: "Example",
        email: "bob@example.com",
        password: "Password1!",
        acceptTerms: true,
      });

      expect(result.accessToken).toBe("jwt-token");
      expect(result.emailVerified).toBe(false);
      expect(email.sendVerificationCode).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("throws UnauthorizedException when user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@example.com", password: "Password1!" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns an access token for valid credentials", async () => {
      const user = makeDbUser({ passwordHash: "hashed_pw" });
      prisma.user.findUnique.mockResolvedValue(user);
      mockBcryptCompare.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue("jwt-token");

      const result = await service.login({ email: "alice@example.com", password: "Password1!" });

      expect(result.accessToken).toBe("jwt-token");
    });
  });

  describe("changePassword", () => {
    const currentUser = { sub: "user-1", email: "alice@example.com", role: Role.user };

    it("updates password hash and returns { ok: true } on success", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "old_hash" });
      mockBcryptCompare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      mockBcryptHash.mockResolvedValue("new_hash");
      prisma.user.update.mockResolvedValue(makeDbUser());

      const result = await service.changePassword(currentUser, {
        currentPassword: "OldPass1!",
        newPassword: "NewPass2!",
      });

      expect(result).toEqual({ ok: true });
    });

    it("rejects when new password matches current password", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "old_hash" });
      mockBcryptCompare.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      await expect(
        service.changePassword(currentUser, {
          currentPassword: "SamePass1!",
          newPassword: "SamePass1!",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("verifyPasswordResetOtp", () => {
    it("throws NotFoundException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyPasswordResetOtp({ email: "missing@example.com", code: "1234" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("resetPassword", () => {
    it("rejects reusing the current password", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "existing_hash",
        passwordResetCode: "1234",
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });
      mockBcryptCompare.mockResolvedValue(true);

      await expect(
        service.resetPassword({
          email: "alice@example.com",
          code: "1234",
          newPassword: "SamePass1!",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
