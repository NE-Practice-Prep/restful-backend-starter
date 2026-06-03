import { Role } from "../common/enums/role.enum";

/**
 * Role groups for @Roles(...ROLE_POLICY.INSPECTOR_UP) on gateway controllers.
 * DB stores admin | editor | viewer — UI labels them Administrator | Inspector | User.
 * TZW mapping: admin = Administrator, editor = Inspector, viewer = User
 */
export const ROLE_POLICY = {
  /** Any logged-in user */
  AUTHENTICATED: [Role.admin, Role.editor, Role.viewer] as Role[],
  /** Admin only — user management, delete extinguishers */
  ADMIN_ONLY: [Role.admin] as Role[],
  /** Admin + Inspector — write extinguishers, complete inspections, maintenance */
  INSPECTOR_UP: [Role.admin, Role.editor] as Role[],
  /** Admin + Inspector + User — schedule inspections */
  ALL_ROLES: [Role.admin, Role.editor, Role.viewer] as Role[],
} as const;

/** Returns true if the role may perform inspector-level actions */
export function isInspectorRole(role: Role): boolean {
  return role === Role.admin || role === Role.editor;
}

/** Returns true if the role may perform admin-only actions */
export function isAdminRole(role: Role): boolean {
  return role === Role.admin;
}

/**
 * Role created by POST /auth/register (public signup).
 * Inspectors and administrators are provisioned only by an admin via user management.
 */
export const PUBLIC_SIGNUP_ROLE = Role.viewer;
