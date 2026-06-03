import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatLoggedDuration } from '../utils/time';

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
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

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            color: #1f2937;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 13px;
            line-height: 1.45;
            margin: 32px;
          }
          h1 {
            font-size: 26px;
            margin: 0 0 6px;
          }
          h2 {
            border-bottom: 1px solid #d9e0e8;
            font-size: 16px;
            margin: 24px 0 10px;
            padding-bottom: 6px;
          }
          .meta {
            color: #64748b;
            margin-bottom: 18px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th,
          td {
            border-bottom: 1px solid #edf1f5;
            padding: 8px 6px;
            text-align: left;
            vertical-align: top;
          }
          th {
            color: #475569;
            font-weight: 700;
            width: 155px;
          }
          .notes {
            background: #f8fafc;
            border: 1px solid #d9e0e8;
            border-radius: 6px;
            min-height: 48px;
            padding: 10px;
            white-space: pre-wrap;
          }
          .photos {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .photo {
            border: 1px solid #d9e0e8;
            border-radius: 6px;
            height: 180px;
            object-fit: cover;
            width: 180px;
          }
          .muted {
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">TradieTrack Lite job report</div>

        <h2>Job Details</h2>
        <table>
          ${detailRow('Customer', job.customerName)}
          ${detailRow('Phone', job.customerPhone)}
          ${detailRow('Email', job.customerEmail)}
          ${detailRow('Address', job.address)}
          ${detailRow('Status', STATUS_LABELS[job.status] || job.status)}
          ${detailRow('Start Date', formatDate(startDate))}
          ${detailRow('End Date', formatDate(endDate))}
          ${detailRow('Total Logged Time', totalLoggedTime)}
        </table>

        <h2>Customer Notes</h2>
        <div class="notes">${escapeHtml(job.customerNotes || 'No customer notes recorded.')}</div>

        <h2>Job Notes</h2>
        <div class="notes">${escapeHtml(job.notes || 'No job notes recorded.')}</div>

        <h2>Photos</h2>
        ${photos}
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
