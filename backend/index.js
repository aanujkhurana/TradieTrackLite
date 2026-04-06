
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });
}

const Job = require('./models/Job');
function parseDateValue(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Validator middleware for POST /api/jobs and PUT /api/jobs/:id
function validateJob(req, res, next) {
  const { name, address, status, reminder, startDate, endDate } = req.body;
  const isPost = req.method === 'POST';
  const isPut = req.method === 'PUT';

  // Require name and address on POST; reject empty strings on PUT if provided
  if (isPost) {
    if (!name || !name.trim() || !address || !address.trim()) {
      return res.status(400).json({ error: 'name and address are required' });
    }
  } else if (isPut) {
    const hasName = 'name' in req.body;
    const hasAddress = 'address' in req.body;
    if ((hasName && (!name || !name.trim())) || (hasAddress && (!address || !address.trim()))) {
      return res.status(400).json({ error: 'name and address are required' });
    }
  }

  // Validate status enum when provided
  if ((isPost || isPut) && status !== undefined) {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'status must be pending, in_progress, or completed' });
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
        return res.status(400).json({ error: `${field} must be a valid ISO date` });
      }
    }
  }

  if (startDate !== undefined && endDate !== undefined && startDate !== null && endDate !== null) {
    const parsedStart = parseDateValue(startDate);
    const parsedEnd = parseDateValue(endDate);
    if (parsedStart && parsedEnd && parsedEnd.getTime() < parsedStart.getTime()) {
      return res.status(400).json({ error: 'endDate cannot be before startDate' });
    }
  }
  next();
}

app.get('/api/jobs', async (req, res) => {
  res.json(await Job.find());
});

app.post('/api/jobs', validateJob, async (req, res) => {
  const payload = { ...req.body };

  if (payload.status === 'completed' && !payload.endDate) {
    payload.endDate = new Date().toISOString();
  }

  const job = new Job(payload);
  await job.save();
  res.status(201).json(job);
});

app.put('/api/jobs/:id', validateJob, async (req, res) => {
  const existing = await Job.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Job not found' });

  // Strip createdAt from update payload to prevent mutation
  const update = { ...req.body };
  delete update.createdAt;
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
      return res.status(400).json({ error: 'endDate cannot be before startDate' });
    }
  }

  const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(job);
});

app.delete('/api/jobs/:id', async (req, res) => {
  const existing = await Job.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Job not found' });

  await Job.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

const puppeteer = require('puppeteer');
const fs = require('fs');

app.post('/api/jobs/:id/pdf', async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const pdfPath = `/tmp/${Date.now()}.pdf`;

  try {
    const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });

    const photoThumbnails = (job.photos || [])
      .map(uri => `<img src="${uri}" alt="Job photo" style="width:120px;height:90px;object-fit:cover;border-radius:4px;border:1px solid #ddd;" />`)
      .join('');

    const statusColour = { pending: '#888', in_progress: '#2196F3', completed: '#4CAF50' }[job.status] || '#888';

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
  <h1>${job.name}</h1>
  <div class="meta">Generated: ${timestamp}</div>

  <div class="section">
    <div class="label">Address</div>
    <div class="value">${job.address || '—'}</div>
  </div>

  <div class="section">
    <div class="label">Status</div>
    <span class="status-badge">${job.status}</span>
  </div>

  <div class="section">
    <div class="label">Notes</div>
    <div class="value">${job.notes || '—'}</div>
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
    return res.status(500).json({ error: 'PDF generation failed' });
  } finally {
    // Clean up temp file after response is sent
    fs.unlink(pdfPath, () => {});
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(4000, () => console.log('Server running on port 4000'));
}

module.exports = app;
