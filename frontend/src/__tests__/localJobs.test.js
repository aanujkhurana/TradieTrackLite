jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(),
}));

import { createInMemoryJobsRepository } from '../data/jobs';

function buildRepository() {
  const times = [
    '2026-01-01T00:00:00.000Z',
    '2026-01-02T00:00:00.000Z',
    '2026-01-03T00:00:00.000Z',
    '2026-01-04T00:00:00.000Z',
  ];
  let nextId = 1;

  return createInMemoryJobsRepository({
    getNow: () => times.shift() || '2026-01-05T00:00:00.000Z',
    getId: () => `job-${nextId++}`,
  });
}

describe('local job repository', () => {
  it('creates and lists local jobs newest first', async () => {
    const repo = buildRepository();

    const first = await repo.create({ name: 'Fix tap', address: '1 Test St' });
    const second = await repo.create({
      name: 'Install vanity',
      customerName: 'Sarah',
      address: '2 Test St',
      status: 'in_progress',
    });

    const jobs = await repo.list();

    expect(jobs).toHaveLength(2);
    expect(jobs.map((job) => job._id)).toEqual([second._id, first._id]);
    expect(jobs[0]).toEqual(expect.objectContaining({
      name: 'Install vanity',
      customerName: 'Sarah',
      status: 'in_progress',
      photos: [],
    }));
  });

  it('updates local jobs and auto-sets endDate when completed', async () => {
    const repo = buildRepository();
    const job = await repo.create({ name: 'Fix tap', address: '1 Test St' });

    const updated = await repo.update(job._id, {
      name: 'Fix leaking tap',
      status: 'completed',
    });

    expect(updated.name).toBe('Fix leaking tap');
    expect(updated.status).toBe('completed');
    expect(updated.endDate).toBe('2026-01-02T00:00:00.000Z');
  });

  it('stores local reminder date and notification id on the job record', async () => {
    const repo = buildRepository();
    const job = await repo.create({
      name: 'Fix tap',
      address: '1 Test St',
      reminder: '2026-02-01T09:30:00.000Z',
      reminderNotificationId: 'notification-1',
    });

    expect(job.reminder).toBe('2026-02-01T09:30:00.000Z');
    expect(job.reminderNotificationId).toBe('notification-1');

    const updated = await repo.update(job._id, {
      reminder: '2026-02-02T10:00:00.000Z',
      reminderNotificationId: 'notification-2',
    });

    expect(updated.reminder).toBe('2026-02-02T10:00:00.000Z');
    expect(updated.reminderNotificationId).toBe('notification-2');
  });

  it('appends and deletes local photo paths on a job record', async () => {
    const repo = buildRepository();
    const job = await repo.create({ name: 'Fix tap', address: '1 Test St' });

    const withPhotos = await repo.update(job._id, {
      photos: ['file:///app/Documents/job-photos/photo-1.jpg'],
    });
    const afterAppend = await repo.update(job._id, {
      photos: [...withPhotos.photos, 'file:///app/Documents/job-photos/photo-2.jpg'],
    });
    const afterDelete = await repo.update(job._id, {
      photos: afterAppend.photos.filter((photo) => photo !== 'file:///app/Documents/job-photos/photo-1.jpg'),
    });

    expect(afterAppend.photos).toEqual([
      'file:///app/Documents/job-photos/photo-1.jpg',
      'file:///app/Documents/job-photos/photo-2.jpg',
    ]);
    expect(afterDelete.photos).toEqual(['file:///app/Documents/job-photos/photo-2.jpg']);
    await expect(repo.get(job._id)).resolves.toEqual(expect.objectContaining({
      photos: ['file:///app/Documents/job-photos/photo-2.jpg'],
    }));
  });

  it('deletes local jobs', async () => {
    const repo = buildRepository();
    const job = await repo.create({ name: 'Fix tap', address: '1 Test St' });

    await expect(repo.remove(job._id)).resolves.toBe(true);
    await expect(repo.get(job._id)).resolves.toBeNull();
    await expect(repo.list()).resolves.toEqual([]);
  });

  it('rejects invalid local job writes', async () => {
    const repo = buildRepository();

    await expect(repo.create({ name: '', address: '1 Test St' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(repo.create({ name: 'Fix tap', address: '' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
