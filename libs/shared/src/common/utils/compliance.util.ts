import { ComplianceStatus } from "../../generated/prisma/enums";

const EXPIRING_SOON_DAYS = 30;

export function deriveComplianceStatus(
  expiresAt: Date,
  now: Date = new Date(),
): ComplianceStatus {
  if (expiresAt.getTime() < now.getTime()) {
    return ComplianceStatus.non_compliant;
  }

  const daysUntilExpiry =
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
    return ComplianceStatus.expiring_soon;
  }

  return ComplianceStatus.compliant;
}
