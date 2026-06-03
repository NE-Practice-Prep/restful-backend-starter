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

export const FIRE_PATTERNS = {
  EXTINGUISHER_REGISTER: "fire.extinguisher.register",
  EXTINGUISHER_LIST: "fire.extinguisher.list",
  EXTINGUISHER_VIEW: "fire.extinguisher.view",
  EXTINGUISHER_UPDATE: "fire.extinguisher.update",
  EXTINGUISHER_REMOVE: "fire.extinguisher.remove",
  INSPECTION_SCHEDULE: "fire.inspection.schedule",
  INSPECTION_LIST: "fire.inspection.list",
  INSPECTION_VIEW: "fire.inspection.view",
  INSPECTION_COMPLETE: "fire.inspection.complete",
  INSPECTION_UPDATE: "fire.inspection.update",
  MAINTENANCE_LOG: "fire.maintenance.log",
  MAINTENANCE_LIST: "fire.maintenance.list",
  MAINTENANCE_VIEW: "fire.maintenance.view",
  COMPLIANCE_CHECK: "fire.compliance.check",
  COMPLIANCE_LIST: "fire.compliance.list",
  COMPLIANCE_SUMMARY: "fire.compliance.summary",
  REPORT_GENERATE: "fire.report.generate",
  REPORT_LIST: "fire.report.list",
  REPORT_VIEW: "fire.report.view",
} as const;
