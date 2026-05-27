import { Role } from "../common/enums/role.enum";

export type JwtPayload = {
  sub: string;
  email: string;
  roles: Role[];
};

