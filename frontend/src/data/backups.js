import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BACKUP_VERSION = 1;

function normalizeTimestampForFile(value) {
  return value.replace(/[:.]/g, '-');
}

function toBackupJob(job) {
  return {
    id: job.id || job._id,
    name: job.name || '',
    customerName: job.customerName || '',
    customerPhone: job.customerPhone || '',
    customerEmail: job.customerEmail || '',
    customerNotes: job.customerNotes || '',
    address: job.address || '',
    notes: job.notes || '',
    status: job.status || 'pending',
    photos: Array.isArray(job.photos) ? job.photos : [],
    startDate: job.startDate || null,
    endDate: job.endDate || null,
    reminder: job.reminder || null,
    reminderNotificationId: job.reminderNotificationId || null,
    createdAt: job.createdAt || null,
    updatedAt: job.updatedAt || null,
  };
}

export function buildJobsBackupPayload(jobs, exportedAt = new Date().toISOString()) {
  return {
    app: 'TradieTrack Lite',
    version: BACKUP_VERSION,
    exportedAt,
    note: 'Job records are local-first. Photo entries are local file paths on this device.',
    jobs: jobs.map(toBackupJob),
  };
}

export async function exportJobsBackup(jobs) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const exportedAt = new Date().toISOString();
  const payload = buildJobsBackupPayload(jobs, exportedAt);
  const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;

  if (!directory) {
    throw new Error('Local file export is unavailable on this device.');
  }

  const fileUri = `${directory}tradietrack-lite-backup-${normalizeTimestampForFile(exportedAt)}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
  });
  await Sharing.shareAsync(fileUri, {
    dialogTitle: 'Share TradieTrack backup',
    mimeType: 'application/json',
    UTI: 'public.json',
  });

  return fileUri;
}
