// Returned payload for "me" endpoints.
export type UserMeDto = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

