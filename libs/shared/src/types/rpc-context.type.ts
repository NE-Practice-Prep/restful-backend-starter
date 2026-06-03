import type { Role } from "../common/enums/role.enum";

/** Passed from gateway to microservices for server-side RBAC checks */
export type RpcUserContext = {
  userId: string;
  role: Role;
};
