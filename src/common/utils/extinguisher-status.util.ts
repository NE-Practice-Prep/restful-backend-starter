export type ExtinguisherLifecycleStatus = "active" | "expiring_soon" | "expired";

export function getExtinguisherLifecycleStatus(
  expiryDate: Date,
  warningDays: number,
  now = new Date(),
): ExtinguisherLifecycleStatus {
  const today = startOfDay(now);
  const expiry = startOfDay(expiryDate);
  const warningStart = new Date(today);
  warningStart.setDate(warningStart.getDate() + warningDays);

  if (expiry < today) return "expired";
  if (expiry <= warningStart) return "expiring_soon";
  return "active";
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntilExpiry(expiryDate: Date, now = new Date()): number {
  const today = startOfDay(now);
  const expiry = startOfDay(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
