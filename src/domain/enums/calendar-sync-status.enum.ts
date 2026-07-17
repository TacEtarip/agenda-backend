export enum CalendarSyncStatus {
  NOT_SYNCED = 'not_synced',
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export enum CalendarSyncOperation {
  UPSERT = 'upsert',
  DELETE = 'delete',
}
