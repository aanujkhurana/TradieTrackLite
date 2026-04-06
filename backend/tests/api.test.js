/**
 * TradieTrack Lite — Backend API Tests
 * Uses: jest + supertest + mongodb-memory-server + fast-check
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const fc = require('fast-check');
jest.setTimeout(60000);

// Set test env before requiring app so mongoose.connect() is skipped
process.env.NODE_ENV = 'test';
const app = require('../index');
const Job = require('../models/Job');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await Job.deleteMany({});
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validJobArb() {
  return fc.record({
    name: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
    address: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
    notes: fc.string(),
  });
}

function validUpdateArb() {
  return fc.record({
    name: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
    address: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
    notes: fc.string(),
    status: fc.constantFrom('pending', 'in_progress', 'completed'),
  }, { requiredKeys: [] });
}

function randomObjectId() {
  // Generate a valid-format ObjectId that is not in the DB
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return Array.from({ length: 24 }, hex).join('');
}

// ---------------------------------------------------------------------------
// 3.1 Property 1: Create then list round-trip
// Validates: Requirements 1.2, 2.2
// ---------------------------------------------------------------------------

describe('Property 1: Create then list round-trip', () => {
  test('POST then GET always includes the created job (matched by name+address)', async () => {
    await fc.assert(
      fc.asyncProperty(validJobArb(), async (payload) => {
        await Job.deleteMany({});

        const postRes = await request(app).post('/api/jobs').send(payload);
        expect(postRes.status).toBe(201);

        const getRes = await request(app).get('/api/jobs');
        expect(getRes.status).toBe(200);

        const found = getRes.body.find(
          j => j.name === payload.name && j.address === payload.address
        );
        expect(found).toBeDefined();
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// 3.2 Property 2: Invalid payload rejection
// Validates: Requirements 1.5, 3.5, 8.2, 8.3, 8.4
// ---------------------------------------------------------------------------

describe('Property 2: Invalid payload rejection', () => {
  // Missing/empty name
  test('POST with missing or empty name returns 400 and does not persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.oneof(fc.constant(''), fc.constant('   ')),
          address: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
          notes: fc.string(),
        }),
        async (payload) => {
          await Job.deleteMany({});
          const before = await Job.countDocuments();
          const res = await request(app).post('/api/jobs').send(payload);
          expect(res.status).toBe(400);
          const after = await Job.countDocuments();
          expect(after).toBe(before);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Missing/empty address
  test('POST with missing or empty address returns 400 and does not persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
          address: fc.oneof(fc.constant(''), fc.constant('   ')),
          notes: fc.string(),
        }),
        async (payload) => {
          await Job.deleteMany({});
          const before = await Job.countDocuments();
          const res = await request(app).post('/api/jobs').send(payload);
          expect(res.status).toBe(400);
          const after = await Job.countDocuments();
          expect(after).toBe(before);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Invalid status on PUT
  test('PUT with invalid status returns 400 and does not persist', async () => {
    const invalidStatuses = ['PENDING', 'done', 'active', 'unknown', '123', 'null'];
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...invalidStatuses),
        async (badStatus) => {
          // Create a valid job first
          const job = await Job.create({ name: 'Test', address: '1 St' });
          const originalStatus = job.status;

          const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .send({ status: badStatus });
          expect(res.status).toBe(400);

          // Verify DB not changed
          const unchanged = await Job.findById(job._id);
          expect(unchanged.status).toBe(originalStatus);

          await Job.deleteMany({});
        }
      ),
      { numRuns: 6 }
    );
  });
});

// ---------------------------------------------------------------------------
// 3.3 Property 3: Update preserves createdAt
// Validates: Requirements 3.3, 3.7
// ---------------------------------------------------------------------------

describe('Property 3: Update preserves createdAt', () => {
  test('PUT never mutates createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(validUpdateArb(), async (updatePayload) => {
        await Job.deleteMany({});
        const job = await Job.create({ name: 'Original', address: '1 Main St' });
        const originalCreatedAt = job.createdAt.toISOString();

        const res = await request(app)
          .put(`/api/jobs/${job._id}`)
          .send(updatePayload);

        expect(res.status).toBe(200);
        expect(new Date(res.body.createdAt).toISOString()).toBe(originalCreatedAt);
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// 3.4 Property 4: Non-existent job returns 404
// Validates: Requirements 3.6, 7.7
// ---------------------------------------------------------------------------

describe('Property 4: Non-existent job returns 404', () => {
  test('PUT, DELETE, and POST /pdf for unknown ObjectId all return 404', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        async (fakeId) => {
          // Ensure this id is not in DB
          await Job.deleteMany({});

          const [putRes, delRes, pdfRes] = await Promise.all([
            request(app).put(`/api/jobs/${fakeId}`).send({ notes: 'x' }),
            request(app).delete(`/api/jobs/${fakeId}`),
            request(app).post(`/api/jobs/${fakeId}/pdf`),
          ]);

          expect(putRes.status).toBe(404);
          expect(delRes.status).toBe(404);
          expect(pdfRes.status).toBe(404);
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ---------------------------------------------------------------------------
// 3.5 Property 5: Delete removes job from list
// Validates: Requirements 4.2
// ---------------------------------------------------------------------------

describe('Property 5: Delete removes job from list', () => {
  test('After DELETE, GET /api/jobs does not include the deleted _id', async () => {
    await fc.assert(
      fc.asyncProperty(validJobArb(), async (payload) => {
        await Job.deleteMany({});

        const postRes = await request(app).post('/api/jobs').send(payload);
        expect(postRes.status).toBe(201);
        const jobId = postRes.body._id;

        const delRes = await request(app).delete(`/api/jobs/${jobId}`);
        expect(delRes.status).toBe(200);

        const getRes = await request(app).get('/api/jobs');
        const ids = getRes.body.map(j => j._id);
        expect(ids).not.toContain(jobId);
      }),
      { numRuns: 15 }
    );
  });
});

// ---------------------------------------------------------------------------
// 3.6 Property 9: Job creation defaults
// Validates: Requirements 8.5, 8.6
// ---------------------------------------------------------------------------

describe('Property 9: Job creation defaults', () => {
  test('Valid payload without status gets status=pending and a valid createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(validJobArb(), async (payload) => {
        await Job.deleteMany({});
        const before = Date.now();

        const res = await request(app).post('/api/jobs').send(payload);
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('pending');

        const createdAt = new Date(res.body.createdAt).getTime();
        expect(createdAt).toBeGreaterThanOrEqual(before - 5000); // allow 5s clock skew
        expect(createdAt).toBeLessThanOrEqual(Date.now() + 1000);
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// 3.7 Unit tests for CRUD routes
// Validates: Requirements 1.2, 1.5, 3.5, 3.6, 4.2
// ---------------------------------------------------------------------------

describe('Unit tests: CRUD routes', () => {
  test('valid POST returns 201 with job document', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ name: 'Fix Tap', address: '42 Plumber St', notes: 'Leaking badly' });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.name).toBe('Fix Tap');
    expect(res.body.address).toBe('42 Plumber St');
  });

  test('POST missing name returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ address: '42 Plumber St' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name and address/i);
  });

  test('POST missing address returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ name: 'Fix Tap' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name and address/i);
  });

  test('PUT with invalid status returns 400', async () => {
    const job = await Job.create({ name: 'Fix Tap', address: '42 Plumber St' });
    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .send({ status: 'done' });
    expect(res.status).toBe(400);
  });
  test('POST completed job without endDate auto-populates endDate', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ name: 'Finish install', address: '77 Pipe Rd', status: 'completed' });
    expect(res.status).toBe(201);
    expect(res.body.endDate).toBeDefined();
    expect(Number.isNaN(new Date(res.body.endDate).getTime())).toBe(false);
  });

  test('DELETE existing job returns { ok: true }', async () => {
    const job = await Job.create({ name: 'Fix Tap', address: '42 Plumber St' });
    const res = await request(app).delete(`/api/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('PUT unknown id returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/jobs/${fakeId}`)
      .send({ notes: 'update' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('DELETE unknown id returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/jobs/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
  test('PUT rejects endDate before startDate', async () => {
    const job = await Job.create({ name: 'Fix Tap', address: '42 Plumber St' });
    const startDate = new Date('2026-01-02T10:00:00.000Z').toISOString();
    const endDate = new Date('2026-01-02T08:00:00.000Z').toISOString();
    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .send({ startDate, endDate });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/endDate/i);
  });

  test('PUT completed status auto-sets endDate when missing', async () => {
    const job = await Job.create({ name: 'Fix Tap', address: '42 Plumber St' });
    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.endDate).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 5.2 Property 8: PDF produces non-empty URL for any valid job
// Validates: Requirements 7.3, 7.4
// ---------------------------------------------------------------------------

// Mock puppeteer to avoid slow/unreliable browser launches in CI
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockImplementation(({ path }) => {
        // Write an empty file so the route doesn't error
        require('fs').writeFileSync(path, '');
        return Promise.resolve();
      }),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('Property 8: PDF produces non-empty URL for any valid job', () => {
  test('POST /api/jobs/:id/pdf returns 200 with non-empty url for any valid job', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
          address: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
          status: fc.constantFrom('pending', 'in_progress', 'completed'),
          notes: fc.string(),
        }),
        async (payload) => {
          await Job.deleteMany({});
          const job = await Job.create(payload);

          const res = await request(app).post(`/api/jobs/${job._id}/pdf`);
          expect(res.status).toBe(200);
          expect(typeof res.body.url).toBe('string');
          expect(res.body.url.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });
});
