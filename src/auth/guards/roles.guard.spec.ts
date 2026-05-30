import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RolesGuard } from "./roles.guard";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";

function makeContext(userRoles: Role[] | undefined, handlerFn = () => {}): ExecutionContext {
  return {
    getHandler: vi.fn().mockReturnValue(handlerFn),
    getClass: vi.fn().mockReturnValue(class {}),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({
        user: userRoles !== undefined ? { roles: userRoles } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    vi.spyOn(reflector, "getAllAndOverride");
    guard = new RolesGuard(reflector);
  });

  it("allows access when no roles are required", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);

    expect(guard.canActivate(makeContext([Role.USER]))).toBe(true);
  });

  it("allows access when the required roles list is empty", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([]);

    expect(guard.canActivate(makeContext([Role.USER]))).toBe(true);
  });

  it("allows access when the user has the required role", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(makeContext([Role.ADMIN]))).toBe(true);
  });

  it("allows access when the user has one of multiple required roles", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN, Role.MODERATOR]);

    expect(guard.canActivate(makeContext([Role.MODERATOR]))).toBe(true);
  });

  it("allows access when the user has multiple roles and one matches", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(makeContext([Role.USER, Role.ADMIN]))).toBe(true);
  });

  it("denies access when the user has no roles", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(makeContext([]))).toBe(false);
  });

  it("denies access when the user lacks the required role", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(makeContext([Role.USER]))).toBe(false);
  });

  it("denies access when no user is present on the request", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(makeContext(undefined))).toBe(false);
  });

  it("reads metadata using the correct key from handler and class", () => {
    const handler = () => {};
    const klass = class {};
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);

    const context = {
      getHandler: vi.fn().mockReturnValue(handler),
      getClass: vi.fn().mockReturnValue(klass),
      switchToHttp: vi.fn().mockReturnValue({ getRequest: vi.fn().mockReturnValue({ user: { roles: [Role.USER] } }) }),
    } as unknown as ExecutionContext;

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [handler, klass]);
  });
});
