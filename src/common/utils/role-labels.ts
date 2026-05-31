import { Role } from "../enums/role.enum";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
  customer: "Customer",
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
