import { BadRequestException } from "@nestjs/common";

/**
 * Microservice payloads cross the transport as JSON, so Date fields validated
 * on the gateway arrive on the service as ISO strings. Coerce them back to a
 * real Date before any date math or persistence.
 */
export function coerceToDate(value: Date | string, field = "date"): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid date value for "${field}": ${String(value)}`);
  }
  return date;
}

export function coerceOptionalDate(
  value: Date | string | null | undefined,
  field = "date",
): Date | undefined {
  if (value === null || value === undefined) return undefined;
  return coerceToDate(value, field);
}
