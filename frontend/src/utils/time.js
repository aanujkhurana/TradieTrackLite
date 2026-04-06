export function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function getLoggedMilliseconds(startDate, endDate) {
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate);
  if (!start || !end) return null;

  const diff = end.getTime() - start.getTime();
  return diff >= 0 ? diff : null;
}

export function formatLoggedDuration(startDate, endDate) {
  const diff = getLoggedMilliseconds(startDate, endDate);
  if (diff === null) return 'Time not logged';

  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes < 1) return '<1 min';

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : '0m';
}
