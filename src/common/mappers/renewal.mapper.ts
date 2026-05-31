type RenewalRow = {
  id: string;
  status: string;
  adminNote: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  extinguisherId: string;
  replacementExtinguisherId: string | null;
  customer?: { id: string; name: string; email: string };
  extinguisher?: { id: string; serialNumber: string; type: string; expiryDate: Date };
  replacementExtinguisher?: {
    id: string;
    serialNumber: string;
    type: string;
    expiryDate: Date;
  } | null;
};

export function toRenewalRequest(row: RenewalRow) {
  return {
    id: row.id,
    status: row.status,
    adminNote: row.adminNote,
    customerId: row.customerId,
    extinguisherId: row.extinguisherId,
    replacementExtinguisherId: row.replacementExtinguisherId ?? undefined,
    customer: row.customer,
    extinguisher: row.extinguisher
      ? {
          id: row.extinguisher.id,
          serialNumber: row.extinguisher.serialNumber,
          type: row.extinguisher.type,
          expiryDate: row.extinguisher.expiryDate.toISOString().slice(0, 10),
        }
      : undefined,
    replacementExtinguisher: row.replacementExtinguisher
      ? {
          id: row.replacementExtinguisher.id,
          serialNumber: row.replacementExtinguisher.serialNumber,
          type: row.replacementExtinguisher.type,
          expiryDate: row.replacementExtinguisher.expiryDate.toISOString().slice(0, 10),
        }
      : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
