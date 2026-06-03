/**
 * TCP message pattern names — shared contract between API Gateway and each microservice.
 * Gateway: proxy.send(client, AUTH_PATTERNS.LOGIN, data)
 * Service:  @MessagePattern(AUTH_PATTERNS.LOGIN)
 * Keep strings identical on both sides or calls will never reach a handler.
 */
export const AUTH_PATTERNS = {
  REGISTER: "auth.register",
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  FORGOT_PASSWORD: "auth.forgot_password",
  VERIFY_RESET_PASSWORD: "auth.verify_reset_password",
  RESET_PASSWORD: "auth.reset_password",
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
  NOTIFICATIONS_LIST: "users.notifications_list",
  NOTIFICATIONS_MARK_READ: "users.notifications_mark_read",
  NOTIFICATIONS_MARK_ALL_READ: "users.notifications_mark_all_read",
  NOTIFICATIONS_RUN_EXPIRY_CHECK: "users.notifications_run_expiry_check",
} as const;

export const EXTINGUISHERS_PATTERNS = {
  CREATE: "extinguishers.create",
  FIND_ALL: "extinguishers.find_all",
  FIND_ONE: "extinguishers.find_one",
  UPDATE: "extinguishers.update",
  DELETE: "extinguishers.delete",
} as const;

export const INSPECTIONS_PATTERNS = {
  SCHEDULE: "inspections.schedule",
  FIND_ALL: "inspections.find_all",
  FIND_ONE: "inspections.find_one",
  COMPLETE: "inspections.complete",
  CANCEL: "inspections.cancel",
  CREATE_MAINTENANCE: "inspections.create_maintenance",
  FIND_MAINTENANCE: "inspections.find_maintenance",
} as const;

export const REPORTS_PATTERNS = {
  INVENTORY: "reports.inventory",
  INSPECTIONS: "reports.inspections",
  COMPLIANCE: "reports.compliance",
  MAINTENANCE: "reports.maintenance",
  OVERVIEW: "reports.overview",
} as const;
