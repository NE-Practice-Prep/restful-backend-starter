export const AUTH_PATTERNS = {
  REGISTER: "auth.register",
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  VERIFY_EMAIL: "auth.verify_email",
  RESEND_VERIFICATION: "auth.resend_verification",
  CHANGE_PASSWORD: "auth.change_password",
  REQUEST_PASSWORD_RESET: "auth.request_password_reset",
  VERIFY_PASSWORD_RESET_OTP: "auth.verify_password_reset_otp",
  RESET_PASSWORD: "auth.reset_password",
  RESEND_PASSWORD_RESET: "auth.resend_password_reset",
} as const;

export const NOTIFICATIONS_PATTERNS = {
  LIST: "notifications.list",
  MARK_READ: "notifications.mark_read",
  MARK_UNREAD: "notifications.mark_unread",
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
