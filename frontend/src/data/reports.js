import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatLoggedDuration } from '../utils/time';
import { lightTheme } from '../theme/themes';

const reportColors = lightTheme.colors;
const reportStatus = lightTheme.status;

const STATUS_LABELS = {
  pending: reportStatus.pending.label,
  in_progress: reportStatus.in_progress.label,
  completed: reportStatus.completed.label,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return 'Not set';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleString();
}

function getPhotoMimeType(uri) {
  const cleanUri = String(uri || '').split('?')[0].split('#')[0];
  const extension = cleanUri.split('.').pop()?.toLowerCase();

  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  return 'image/jpeg';
}

async function photoUriToDataUri(uri) {
  if (!uri || uri.startsWith('data:')) return uri || null;

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType?.Base64 || 'base64',
    });
    return `data:${getPhotoMimeType(uri)};base64,${base64}`;
  } catch {
    return null;
  }
}

async function buildPhotoSection(photos = []) {
  const dataUris = await Promise.all(photos.map(photoUriToDataUri));
  const imageHtml = dataUris
    .filter(Boolean)
    .map((uri) => `<img class="photo" src="${uri}" alt="Job photo" />`)
    .join('');

  if (!imageHtml) {
    return '<p class="muted">No photos attached.</p>';
  }

  return `<div class="photos">${imageHtml}</div>`;
}

function detailRow(label, value) {
  return `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value || 'Not provided')}</td>
    </tr>
  `;
}

export async function buildJobReportHtml(job) {
  const photos = await buildPhotoSection(job.photos || []);
  const startDate = job.startDate || job.createdAt || null;
  const endDate = job.endDate || null;
  const totalLoggedTime = formatLoggedDuration(startDate, endDate);
  const title = job.name || 'Untitled job';
  const statusMeta = reportStatus[job.status] || reportStatus.pending;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            color: ${reportColors.text};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
            font-size: 13px;
            line-height: 1.5;
            margin: 0;
            padding: 36px 32px;
            background: ${reportColors.background};
          }
          .container { max-width: 720px; margin: 0 auto; }
          .header {
            border: 1px solid ${reportColors.border};
            background: ${reportColors.surface};
            border-radius: 18px;
            padding: 24px;
            margin-bottom: 20px;
          }
          .eyebrow {
            color: ${reportColors.subtle};
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          h1 {
            font-size: 28px;
            line-height: 1.15;
            margin: 0 0 8px;
            color: ${reportColors.ink};
            letter-spacing: -0.4px;
            font-weight: 800;
          }
          .meta {
            color: ${reportColors.muted};
            font-size: 12px;
            margin-bottom: 14px;
          }
          .status {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: ${statusMeta.bg};
            color: ${statusMeta.fg};
            border: 1px solid ${statusMeta.border};
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .tile {
            border: 1px solid ${reportColors.border};
            background: ${reportColors.surface};
            border-radius: 14px;
            padding: 12px 14px;
          }
          .tile .label {
            color: ${reportColors.subtle};
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .tile .value {
            color: ${reportColors.ink};
            font-size: 14px;
            font-weight: 700;
            letter-spacing: -0.1px;
          }
          .section {
            border: 1px solid ${reportColors.border};
            background: ${reportColors.surface};
            border-radius: 18px;
            padding: 22px;
            margin-bottom: 14px;
          }
          h2 {
            font-size: 16px;
            margin: 0 0 14px;
            color: ${reportColors.ink};
            font-weight: 700;
            letter-spacing: -0.1px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border-bottom: 1px solid ${reportColors.borderSoft};
            padding: 10px 0;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }
          tr:last-child th, tr:last-child td { border-bottom: 0; }
          th {
            color: ${reportColors.muted};
            font-weight: 600;
            width: 160px;
          }
          td {
            color: ${reportColors.text};
            font-weight: 600;
          }
          .notes {
            background: ${reportColors.surfaceInset};
            border: 1px solid ${reportColors.borderSoft};
            border-radius: 12px;
            padding: 12px 14px;
            white-space: pre-wrap;
            color: ${reportColors.text};
          }
          .photos {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .photo {
            border: 1px solid ${reportColors.border};
            border-radius: 12px;
            height: 160px;
            object-fit: cover;
            width: 160px;
          }
          .muted {
            color: ${reportColors.muted};
          }
          .footer {
            color: ${reportColors.subtle};
            font-size: 11px;
            text-align: center;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="eyebrow">Job report</div>
            <h1>${escapeHtml(title)}</h1>
            <div class="meta">TradieTrack Lite · generated ${formatDate(new Date().toISOString())}</div>
            <span class="status">${escapeHtml(STATUS_LABELS[job.status] || job.status)}</span>
          </div>

          <div class="grid">
            <div class="tile">
              <div class="label">Customer</div>
              <div class="value">${escapeHtml(job.customerName || 'Not provided')}</div>
            </div>
            <div class="tile">
              <div class="label">Phone</div>
              <div class="value">${escapeHtml(job.customerPhone || 'Not provided')}</div>
            </div>
            <div class="tile">
              <div class="label">Start</div>
              <div class="value">${escapeHtml(formatDate(startDate))}</div>
            </div>
            <div class="tile">
              <div class="label">End</div>
              <div class="value">${escapeHtml(formatDate(endDate))}</div>
            </div>
          </div>

          <div class="section">
            <h2>Job details</h2>
            <table>
              ${detailRow('Address', job.address)}
              ${detailRow('Email', job.customerEmail)}
              ${detailRow('Total logged', totalLoggedTime)}
            </table>
          </div>

          ${job.customerNotes ? `
            <div class="section">
              <h2>Customer notes</h2>
              <div class="notes">${escapeHtml(job.customerNotes)}</div>
            </div>
          ` : ''}

          ${job.notes ? `
            <div class="section">
              <h2>Job notes</h2>
              <div class="notes">${escapeHtml(job.notes)}</div>
            </div>
          ` : ''}

          <div class="section">
            <h2>Photos</h2>
            ${photos}
          </div>

          <div class="footer">TradieTrack Lite · On this device · No account required</div>
        </div>
      </body>
    </html>
  `;
}

export async function generateJobReportPdf(job) {
  const html = await buildJobReportHtml(job);
  return Print.printToFileAsync({ html });
}

export async function shareJobReport(job) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const { uri } = await generateJobReportPdf(job);
  await Sharing.shareAsync(uri, {
    dialogTitle: 'Share job report',
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });

  return uri;
}
