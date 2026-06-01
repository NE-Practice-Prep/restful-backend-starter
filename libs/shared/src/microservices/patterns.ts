export const AUTH_PATTERNS = {
  REGISTER: "auth.register",
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  VERIFY_EMAIL: "auth.verify_email",
  RESEND_VERIFICATION: "auth.resend_verification",
  CHANGE_PASSWORD: "auth.change_password",
} as const;

export const USERS_PATTERNS = {
  ME: "users.me",
  UPDATE_ME: "users.update_me",
  CHANGE_PASSWORD: "users.change_password",
  FIND_ALL: "users.find_all",
  FIND_ONE: "users.find_one",
  CREATE: "users.create",
  UPDATE: "users.update",
  DELETE: "users.delete",
  UPLOAD_AVATAR: "users.upload_avatar",
  REMOVE_AVATAR: "users.remove_avatar",
} as const;
