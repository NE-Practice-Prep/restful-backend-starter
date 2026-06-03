import { Role } from "../enums/role.enum";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  inspector: "Inspector",
  user: "User",
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
