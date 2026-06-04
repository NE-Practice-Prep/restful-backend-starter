import { ExtinguisherStatus } from "../generated/prisma/enums";

export const EXPIRY_WARNING_DAYS = 30;
export const EXPIRY_PLANNING_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function getExpiryWindowDates(now: Date = new Date()) {
  return {
    now,
    in30Days: addDays(now, EXPIRY_WARNING_DAYS),
    in90Days: addDays(now, EXPIRY_PLANNING_DAYS),
  };
}

/** Extinguishers still tracked for compliance (excludes decommissioned). */
export const activeExtinguisherWhere = {
  status: { not: ExtinguisherStatus.decommissioned },
} as const;

export function formatExpiryDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
