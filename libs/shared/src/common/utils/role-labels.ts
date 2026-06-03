import { Role } from "../enums/role.enum";

/** Human-readable TZW role names shown in API and UI */
const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  editor: "Inspector",
  viewer: "User",
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
