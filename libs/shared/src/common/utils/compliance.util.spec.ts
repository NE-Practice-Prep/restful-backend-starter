import { describe, expect, it } from "vitest";

import { ComplianceStatus } from "../../generated/prisma/enums";
import { deriveComplianceStatus } from "./compliance.util";

describe("deriveComplianceStatus", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("returns non_compliant when expiry is in the past", () => {
    expect(deriveComplianceStatus(new Date("2025-01-01"), now)).toBe(
      ComplianceStatus.non_compliant,
    );
  });

  it("returns expiring_soon within 30 days", () => {
    expect(deriveComplianceStatus(new Date("2026-06-15"), now)).toBe(
      ComplianceStatus.expiring_soon,
    );
  });

  it("returns compliant when expiry is far in the future", () => {
    expect(deriveComplianceStatus(new Date("2030-01-01"), now)).toBe(
      ComplianceStatus.compliant,
    );
  });
});
