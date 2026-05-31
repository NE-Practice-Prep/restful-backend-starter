import {
  getExtinguisherLifecycleStatus,
  type ExtinguisherLifecycleStatus,
} from "../utils/extinguisher-status.util";

type ExtinguisherRow = {
  id: string;
  serialNumber: string;
  type: string;
  manufactureDate: Date;
  expiryDate: Date;
  status: string;
  customerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: { id: string; name: string; email: string } | null;
};

export function toExtinguisher(
  row: ExtinguisherRow,
  warningDays: number,
) {
  const lifecycleStatus: ExtinguisherLifecycleStatus = getExtinguisherLifecycleStatus(
    row.expiryDate,
    warningDays,
  );

  return {
    id: row.id,
    serialNumber: row.serialNumber,
    type: row.type,
    manufactureDate: row.manufactureDate.toISOString().slice(0, 10),
    expiryDate: row.expiryDate.toISOString().slice(0, 10),
    status: row.status,
    lifecycleStatus,
    customerId: row.customerId ?? undefined,
    customer: row.customer
      ? { id: row.customer.id, name: row.customer.name, email: row.customer.email }
      : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
