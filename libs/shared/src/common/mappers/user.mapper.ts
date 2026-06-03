import { Role } from "../enums/role.enum";
import { UserStatus } from "../enums/user-status.enum";
import { formatUserFullName } from "../utils/user-name.util";
import { getRoleLabel } from "../utils/role-labels";

export type DbUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  location?: string;
  createdAt: string;
};

export type CurrentUserDto = {
  firstName: string;
  lastName: string;
  fullName: string;
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
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: formatUserFullName(user.firstName, user.lastName),
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
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: formatUserFullName(user.firstName, user.lastName),
    email: user.email,
    avatar: user.avatarUrl ?? DEFAULT_AVATAR,
    role: getRoleLabel(user.role),
    bio: user.bio,
    location: user.location ?? "",
    phone: user.phone ?? "",
  };
}
