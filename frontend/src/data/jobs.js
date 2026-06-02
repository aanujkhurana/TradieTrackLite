import * as SQLite from 'expo-sqlite';

export const JOB_STATUSES = ['pending', 'in_progress', 'completed'];

const DATABASE_NAME = 'tradietrack_lite.db';
let sqliteRepository;

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeRequiredText(value, fieldName) {
  const text = normalizeOptionalText(value).trim();
  if (!text) {
    const err = new Error(`${fieldName} is required.`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return text;
}

function normalizeStatus(value) {
  return JOB_STATUSES.includes(value) ? value : 'pending';
}

function normalizeDate(value, fallback = null) {
  if (value === null) return null;
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizePhotos(value) {
  return Array.isArray(value) ? value.filter((uri) => typeof uri === 'string') : [];
}

function normalizeReminderNotificationId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeJobForCreate(input, getNow = nowIso, getId = createId) {
  const timestamp = getNow();
  const status = normalizeStatus(input.status);
  const startDate = normalizeDate(input.startDate, timestamp);
  let endDate = normalizeDate(input.endDate, null);

  if (status === 'completed' && !endDate) {
    endDate = timestamp;
  }

  return {
    id: input.id || input._id || getId(),
    name: normalizeRequiredText(input.name, 'Job name'),
    customerName: normalizeOptionalText(input.customerName).trim(),
    customerPhone: normalizeOptionalText(input.customerPhone).trim(),
    customerEmail: normalizeOptionalText(input.customerEmail).trim(),
    customerNotes: normalizeOptionalText(input.customerNotes),
    address: normalizeRequiredText(input.address, 'Address'),
    notes: normalizeOptionalText(input.notes),
    status,
    photos: normalizePhotos(input.photos),
    startDate,
    endDate,
    reminder: normalizeDate(input.reminder, null),
    reminderNotificationId: normalizeReminderNotificationId(input.reminderNotificationId),
    createdAt: normalizeDate(input.createdAt, timestamp),
    updatedAt: timestamp,
  };
}

function normalizeJobForUpdate(existing, patch, getNow = nowIso) {
  const merged = { ...existing, ...patch };
  const timestamp = getNow();
  const status = normalizeStatus(merged.status);
  let endDate = normalizeDate(merged.endDate, null);

  if (status === 'completed' && !endDate) {
    endDate = timestamp;
  }

  return {
    ...existing,
    name: normalizeRequiredText(merged.name, 'Job name'),
    customerName: normalizeOptionalText(merged.customerName).trim(),
    customerPhone: normalizeOptionalText(merged.customerPhone).trim(),
    customerEmail: normalizeOptionalText(merged.customerEmail).trim(),
    customerNotes: normalizeOptionalText(merged.customerNotes),
    address: normalizeRequiredText(merged.address, 'Address'),
    notes: normalizeOptionalText(merged.notes),
    status,
    photos: normalizePhotos(merged.photos),
    startDate: normalizeDate(merged.startDate, existing.startDate),
    endDate,
    reminder: normalizeDate(merged.reminder, null),
    reminderNotificationId: normalizeReminderNotificationId(merged.reminderNotificationId),
    updatedAt: timestamp,
  };
}

function withPublicId(job) {
  return { ...job, _id: job.id };
}

function rowToJob(row) {
  let photos = [];
  try {
    photos = row.photos ? JSON.parse(row.photos) : [];
  } catch {
    photos = [];
  }

  return withPublicId({
    id: row.id,
    name: row.name,
    customerName: row.customerName || '',
    customerPhone: row.customerPhone || '',
    customerEmail: row.customerEmail || '',
    customerNotes: row.customerNotes || '',
    address: row.address,
    notes: row.notes || '',
    status: normalizeStatus(row.status),
    photos,
    startDate: row.startDate,
    endDate: row.endDate || null,
    reminder: row.reminder || null,
    reminderNotificationId: row.reminderNotificationId || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function rowsToArray(rows) {
  const items = [];
  for (let index = 0; index < rows.length; index += 1) {
    items.push(rows.item(index));
  }
  return items;
}

function createSQLiteJobsRepository(db) {
  const execute = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(sql, params, (_tx, result) => resolve(result), (_tx, error) => {
          reject(error);
          return true;
        });
      });
    });

  const initialize = async () => {
    await execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        customerName TEXT NOT NULL DEFAULT '',
        customerPhone TEXT NOT NULL DEFAULT '',
        customerEmail TEXT NOT NULL DEFAULT '',
        customerNotes TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        photos TEXT NOT NULL DEFAULT '[]',
        startDate TEXT NOT NULL,
        endDate TEXT,
        reminder TEXT,
        reminderNotificationId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    const tableInfo = await execute('PRAGMA table_info(jobs);');
    const columnNames = rowsToArray(tableInfo.rows).map((row) => row.name);
    if (!columnNames.includes('reminderNotificationId')) {
      await execute('ALTER TABLE jobs ADD COLUMN reminderNotificationId TEXT;');
    }
    await execute('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);');
    await execute('CREATE INDEX IF NOT EXISTS idx_jobs_reminder ON jobs(reminder);');
    await execute('CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(createdAt DESC);');
  };

  const list = async () => {
    await initialize();
    const result = await execute('SELECT * FROM jobs ORDER BY createdAt DESC;');
    return rowsToArray(result.rows).map(rowToJob);
  };

  const get = async (id) => {
    await initialize();
    const result = await execute('SELECT * FROM jobs WHERE id = ? LIMIT 1;', [id]);
    const row = result.rows.length ? result.rows.item(0) : null;
    return row ? rowToJob(row) : null;
  };

  const create = async (input) => {
    await initialize();
    const job = normalizeJobForCreate(input);
    await execute(
      `INSERT INTO jobs (
        id, name, customerName, customerPhone, customerEmail, customerNotes,
        address, notes, status, photos, startDate, endDate, reminder,
        reminderNotificationId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        job.id,
        job.name,
        job.customerName,
        job.customerPhone,
        job.customerEmail,
        job.customerNotes,
        job.address,
        job.notes,
        job.status,
        JSON.stringify(job.photos),
        job.startDate,
        job.endDate,
        job.reminder,
        job.reminderNotificationId,
        job.createdAt,
        job.updatedAt,
      ]
    );
    return withPublicId(job);
  };

  const update = async (id, patch) => {
    await initialize();
    const existing = await get(id);
    if (!existing) {
      const err = new Error('Job not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const job = normalizeJobForUpdate(existing, patch);
    await execute(
      `UPDATE jobs SET
        name = ?,
        customerName = ?,
        customerPhone = ?,
        customerEmail = ?,
        customerNotes = ?,
        address = ?,
        notes = ?,
        status = ?,
        photos = ?,
        startDate = ?,
        endDate = ?,
        reminder = ?,
        reminderNotificationId = ?,
        updatedAt = ?
      WHERE id = ?;`,
      [
        job.name,
        job.customerName,
        job.customerPhone,
        job.customerEmail,
        job.customerNotes,
        job.address,
        job.notes,
        job.status,
        JSON.stringify(job.photos),
        job.startDate,
        job.endDate,
        job.reminder,
        job.reminderNotificationId,
        job.updatedAt,
        id,
      ]
    );
    return withPublicId(job);
  };

  const remove = async (id) => {
    await initialize();
    const result = await execute('DELETE FROM jobs WHERE id = ?;', [id]);
    return result.rowsAffected > 0;
  };

  const clear = async () => {
    await initialize();
    await execute('DELETE FROM jobs;');
  };

  return { initialize, list, get, create, update, remove, clear };
}

export function createInMemoryJobsRepository({ getNow = nowIso, getId = createId } = {}) {
  const jobs = new Map();

  const sortJobs = () =>
    Array.from(jobs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((job) => withPublicId({ ...job, photos: [...job.photos] }));

  return {
    initialize: asyncNoop,
    list: async () => sortJobs(),
    get: async (id) => {
      const job = jobs.get(id);
      return job ? withPublicId({ ...job, photos: [...job.photos] }) : null;
    },
    create: async (input) => {
      const job = normalizeJobForCreate(input, getNow, getId);
      jobs.set(job.id, job);
      return withPublicId({ ...job, photos: [...job.photos] });
    },
    update: async (id, patch) => {
      const existing = jobs.get(id);
      if (!existing) {
        const err = new Error('Job not found.');
        err.code = 'NOT_FOUND';
        throw err;
      }

      const job = normalizeJobForUpdate(existing, patch, getNow);
      jobs.set(id, job);
      return withPublicId({ ...job, photos: [...job.photos] });
    },
    remove: async (id) => jobs.delete(id),
    clear: async () => jobs.clear(),
  };
}

async function asyncNoop() {}

function getSQLiteRepository() {
  if (!sqliteRepository) {
    sqliteRepository = createSQLiteJobsRepository(SQLite.openDatabase(DATABASE_NAME));
  }
  return sqliteRepository;
}

export function initializeJobStore() {
  return getSQLiteRepository().initialize();
}

export function listJobs() {
  return getSQLiteRepository().list();
}

export function getJob(id) {
  return getSQLiteRepository().get(id);
}

export function createJob(input) {
  return getSQLiteRepository().create(input);
}

export function updateJob(id, patch) {
  return getSQLiteRepository().update(id, patch);
}

export function deleteJob(id) {
  return getSQLiteRepository().remove(id);
}

export function resetJobStoreForTests() {
  return getSQLiteRepository().clear();
}
