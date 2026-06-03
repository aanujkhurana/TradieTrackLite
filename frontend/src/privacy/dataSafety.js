export const DATA_SAFETY_MESSAGES = {
  localStorageNote: 'Job records, reminders, and photos are stored on this device.',
  deleteWarning: 'Deleting the app may delete app data, including jobs and stored photos.',
  backupReminder: 'Export a backup regularly and keep it somewhere safe.',
  backendNotice: 'Normal job workflows do not send job or customer details to a backend.',
  analyticsNotice: 'Analytics are not enabled. If added later, they should be anonymous and minimal.',
};

export function getDataSafetySummary() {
  return [
    DATA_SAFETY_MESSAGES.localStorageNote,
    DATA_SAFETY_MESSAGES.deleteWarning,
    DATA_SAFETY_MESSAGES.backupReminder,
  ];
}
