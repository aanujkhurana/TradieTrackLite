export const JOB_STATUS_KEYS = ['pending', 'in_progress', 'completed'];

export const STATUS_LABELS = {
  pending: 'To do',
  in_progress: 'In progress',
  completed: 'Done',
};

export const STATUS_SHORT_LABELS = {
  pending: 'To do',
  in_progress: 'Active',
  completed: 'Done',
};

export const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Done' },
];

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getReminderState(job, now = new Date()) {
  const reminderDate = parseDate(job?.reminder);
  if (!reminderDate) {
    return {
      key: 'none',
      label: 'No reminder set',
      detail: 'No reminder scheduled',
      isOverdue: false,
    };
  }

  const labelDate = reminderDate.toLocaleString();
  const isCompleted = job?.status === 'completed';
  const isOverdue = !isCompleted && reminderDate.getTime() < now.getTime();

  if (isCompleted) {
    return {
      key: 'completed',
      label: `Reminder was set for ${labelDate}`,
      detail: 'Job completed',
      isOverdue: false,
    };
  }

  if (isOverdue) {
    return {
      key: 'overdue',
      label: `Overdue since ${labelDate}`,
      detail: 'Reminder overdue',
      isOverdue: true,
    };
  }

  return {
    key: 'scheduled',
    label: `Scheduled for ${labelDate}`,
    detail: 'Reminder scheduled',
    isOverdue: false,
  };
}

export function isReminderOverdue(job, now = new Date()) {
  return getReminderState(job, now).isOverdue;
}

export function filterJobsByWorkflow(jobs, statusFilter = 'all', searchTerm = '') {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return jobs.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      job.name,
      job.customerName,
      job.address,
      job.notes,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  });
}
