
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 1000);
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : null);
const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
const sendError = (res, status, code, message) => {
  return res.status(status).json({ error: { code, message } });
};
const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
};

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, CORS_ORIGINS.includes(origin));
  },
}));

const rateLimitBuckets = new Map();
function rateLimiter(req, res, next) {
  const now = Date.now();
  const key = req.get('x-forwarded-for') || req.ip || req.socket.remoteAddress || 'unknown';
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return sendError(res, 429, 'RATE_LIMITED', 'Too many requests');
  }

  return next();
}

app.use(rateLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

if (process.env.NODE_ENV !== 'test') {
  if (!process.env.MONGO_URI) {
    console.error('Missing required environment variable: MONGO_URI');
    process.exit(1);
  }
  if (!AUTH_TOKEN_SECRET) {
    console.error('Missing required environment variable: AUTH_TOKEN_SECRET');
    process.exit(1);
  }

  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });
}

const Job = require('./models/Job');
const User = require('./models/User');
function parseDateValue(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizePhotoUri(uri) {
  const value = String(uri || '').trim();
  if (!/^(https?:|file:|data:image\/)/i.test(value)) return null;
  return escapeHtml(value);
}

function encodeTokenPart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signTokenPayload(encodedHeader, encodedPayload) {
  return crypto
    .createHmac('sha256', AUTH_TOKEN_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
}

function createAuthToken(user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + AUTH_TOKEN_TTL_SECONDS,
  };
  const encodedHeader = encodeTokenPart(header);
  const encodedPayload = encodeTokenPart(payload);
  const signature = signTokenPayload(encodedHeader, encodedPayload);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyAuthToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = signTokenPayload(encodedHeader, encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

async function authenticate(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required');
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }

  req.user = user;
  return next();
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
  };
}

function validateAuthPayload(req, res, next) {
  const { email, password } = req.body;

  if (!email || !String(email).trim() || !password || String(password).length < 8) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'email and password of at least 8 characters are required');
  }

  return next();
}

function validateJobId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendError(res, 400, 'INVALID_JOB_ID', 'Job id must be a valid ObjectId');
  }

  return next();
}

// Validator middleware for POST /api/jobs and PUT /api/jobs/:id
function validateJob(req, res, next) {
  const { name, address, status, reminder, startDate, endDate } = req.body;
  const isPost = req.method === 'POST';
  const isPut = req.method === 'PUT';

  // Require name and address on POST; reject empty strings on PUT if provided
  if (isPost) {
    if (!name || !name.trim() || !address || !address.trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'name and address are required');
    }
  } else if (isPut) {
    const hasName = 'name' in req.body;
    const hasAddress = 'address' in req.body;
    if ((hasName && (!name || !name.trim())) || (hasAddress && (!address || !address.trim()))) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'name and address are required');
    }
  }

  // Validate status enum when provided
  if ((isPost || isPut) && status !== undefined) {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'status must be pending, in_progress, or completed');
    }
  }
  // Validate date fields are valid ISO date strings when provided
  const dateFieldValues = [
    ['reminder', reminder],
    ['startDate', startDate],
    ['endDate', endDate],
  ];
  for (const [field, value] of dateFieldValues) {
    if (value !== undefined && value !== null) {
      const parsed = parseDateValue(value);
      if (!parsed) {
        return sendError(res, 400, 'VALIDATION_ERROR', `${field} must be a valid ISO date`);
      }
    }
  }

  if (startDate !== undefined && endDate !== undefined && startDate !== null && endDate !== null) {
    const parsedStart = parseDateValue(startDate);
    const parsedEnd = parseDateValue(endDate);
    if (parsedStart && parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'endDate cannot be before startDate');
    }
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', validateAuthPayload, asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'Email is already registered');

  const user = new User({ email });
  await user.setPassword(String(req.body.password));
  await user.save();

  res.status(201).json({ token: createAuthToken(user), user: serializeUser(user) });
}));

app.post('/api/auth/login', validateAuthPayload, asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const user = await User.findOne({ email });

  if (!user || !(await user.verifyPassword(String(req.body.password)))) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  res.json({ token: createAuthToken(user), user: serializeUser(user) });
}));

app.get('/api/auth/me', asyncHandler(authenticate), (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

app.get('/api/jobs', asyncHandler(authenticate), asyncHandler(async (req, res) => {
  res.json(await Job.find({ userId: req.user._id }));
}));

app.post('/api/jobs', asyncHandler(authenticate), validateJob, asyncHandler(async (req, res) => {
  const payload = { ...req.body, userId: req.user._id };

  if (payload.status === 'completed' && !payload.endDate) {
    payload.endDate = new Date().toISOString();
  }

  const job = new Job(payload);
  await job.save();
  res.status(201).json(job);
}));

app.put('/api/jobs/:id', asyncHandler(authenticate), validateJobId, validateJob, asyncHandler(async (req, res) => {
  const existing = await Job.findOne({ _id: req.params.id, userId: req.user._id });
  if (!existing) return sendError(res, 404, 'JOB_NOT_FOUND', 'Job not found');

  // Strip createdAt from update payload to prevent mutation
  const update = { ...req.body };
  delete update.createdAt;
  delete update.userId;
  // Auto-set endDate when marking completed for the first time
  if (update.status === 'completed') {
    const hasCurrentEndDate = update.endDate !== undefined ? update.endDate : existing.endDate;
    if (!hasCurrentEndDate) {
      update.endDate = new Date().toISOString();
    }
  }

  const effectiveStartDate = update.startDate !== undefined ? update.startDate : existing.startDate;
  const effectiveEndDate = update.endDate !== undefined ? update.endDate : existing.endDate;
  if (effectiveStartDate && effectiveEndDate) {
    const parsedStart = parseDateValue(effectiveStartDate);
    const parsedEnd = parseDateValue(effectiveEndDate);
    if (parsedStart && parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'endDate cannot be before startDate');
    }
  }

  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    update,
    { new: true }
  );
  res.json(job);
}));

app.delete('/api/jobs/:id', asyncHandler(authenticate), validateJobId, asyncHandler(async (req, res) => {
  const existing = await Job.findOne({ _id: req.params.id, userId: req.user._id });
  if (!existing) return sendError(res, 404, 'JOB_NOT_FOUND', 'Job not found');

  await Job.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ ok: true });
}));

const puppeteer = require('puppeteer');
const fs = require('fs');

app.post('/api/jobs/:id/pdf', asyncHandler(authenticate), validateJobId, asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, userId: req.user._id });
  if (!job) return sendError(res, 404, 'JOB_NOT_FOUND', 'Job not found');

  const pdfPath = `/tmp/${Date.now()}.pdf`;

  try {
    const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });

    const photoThumbnails = (job.photos || [])
      .map(sanitizePhotoUri)
      .filter(Boolean)
      .map(uri => `<img src="${uri}" alt="Job photo" style="width:120px;height:90px;object-fit:cover;border-radius:4px;border:1px solid #ddd;" />`)
      .join('');

    const statusColour = { pending: '#888', in_progress: '#2196F3', completed: '#4CAF50' }[job.status] || '#888';
    const safeName = escapeHtml(job.name);
    const safeAddress = escapeHtml(job.address || '—');
    const safeStatus = escapeHtml(job.status);
    const safeNotes = escapeHtml(job.notes || '—');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #222;
      padding: 40px;
      width: 210mm;
    }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
    .section { margin-bottom: 18px; }
    .label { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #777; margin-bottom: 4px; }
    .value { font-size: 13px; }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      background: ${statusColour};
    }
    .photos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .footer { margin-top: 40px; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>${safeName}</h1>
  <div class="meta">Generated: ${timestamp}</div>

  <div class="section">
    <div class="label">Address</div>
    <div class="value">${safeAddress}</div>
  </div>

  <div class="section">
    <div class="label">Status</div>
    <span class="status-badge">${safeStatus}</span>
  </div>

  <div class="section">
    <div class="label">Notes</div>
    <div class="value">${safeNotes}</div>
  </div>

  ${photoThumbnails ? `
  <div class="section">
    <div class="label">Photos</div>
    <div class="photos">${photoThumbnails}</div>
  </div>` : ''}

  <div class="footer">TradieTrack Lite &mdash; Job Report</div>
</body>
</html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();

    res.json({ url: pdfPath });
  } catch (err) {
    return sendError(res, 500, 'PDF_GENERATION_FAILED', 'PDF generation failed');
  } finally {
    // Clean up temp file after response is sent
    fs.unlink(pdfPath, () => {});
  }
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
