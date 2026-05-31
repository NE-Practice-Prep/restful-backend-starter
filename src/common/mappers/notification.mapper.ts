type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  extinguisherId: string | null;
  renewalRequestId: string | null;
  createdAt: Date;
};

export function toNotification(row: NotificationRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    extinguisherId: row.extinguisherId ?? undefined,
    renewalRequestId: row.renewalRequestId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
