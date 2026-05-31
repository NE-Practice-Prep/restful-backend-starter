type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  contactNotes: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { extinguishers: number };
};

export function toCustomer(row: CustomerRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    contactNotes: row.contactNotes,
    userId: row.userId ?? undefined,
    extinguisherCount: row._count?.extinguishers ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
