import { Role } from "../enums/role.enum";
import { UserStatus } from "../enums/user-status.enum";
import { getRoleLabel } from "../utils/role-labels";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  phone: string | null;
  location: string | null;
  bio: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
};

export type WorkspaceUserDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  location?: string;
  createdAt: string;
};

export type CurrentUserDto = {
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio: string;
  location: string;
  phone: string;
};

const DEFAULT_AVATAR = "";

export function toWorkspaceUser(user: DbUser): WorkspaceUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.location ? { location: user.location } : {}),
    createdAt: user.createdAt.toISOString(),
  };
}

export function toCurrentUser(user: DbUser): CurrentUserDto {
  return {
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl ?? DEFAULT_AVATAR,
    role: getRoleLabel(user.role),
    bio: user.bio,
    location: user.location ?? "",
    phone: user.phone ?? "",
  };
}
