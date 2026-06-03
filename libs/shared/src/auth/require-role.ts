import { ForbiddenException } from "@nestjs/common";
import { Role } from "../common/enums/role.enum";

export function requireRole(userRole: Role | undefined, allowed: Role[]): void {
  if (!userRole || !allowed.includes(userRole)) {
    throw new ForbiddenException("You do not have permission to perform this action");
  }
}
