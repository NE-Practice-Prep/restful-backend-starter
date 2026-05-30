import { Role } from "../../common/enums/role.enum";

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: Role;
};
