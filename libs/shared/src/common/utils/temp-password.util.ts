import { randomBytes } from "node:crypto";

/** Avoid ambiguous characters (0/O, 1/l/I) for emailed passwords */
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** One-time password for admin-provisioned accounts (inspectors, etc.) */
export function generateTemporaryPassword(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length]).join("");
}

export function shouldExposeDevCredentials(emailDelivered: boolean): boolean {
  return !emailDelivered && process.env.NODE_ENV !== "production";
}
