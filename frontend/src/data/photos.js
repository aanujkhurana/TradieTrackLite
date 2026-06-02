import * as FileSystem from 'expo-file-system';

const PHOTO_DIRECTORY_NAME = 'job-photos';
const PHOTO_DIRECTORY = `${FileSystem.documentDirectory || ''}${PHOTO_DIRECTORY_NAME}/`;

function getFileExtension(uri) {
  const cleanUri = uri.split('?')[0].split('#')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

function createPhotoFileName(sourceUri, getTimestamp = Date.now) {
  const extension = getFileExtension(sourceUri);
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `job_photo_${getTimestamp()}_${randomSuffix}.${extension}`;
}

export function isLocalJobPhotoUri(uri) {
  return typeof uri === 'string' && Boolean(PHOTO_DIRECTORY) && uri.startsWith(PHOTO_DIRECTORY);
}

export async function ensurePhotoDirectory() {
  if (!PHOTO_DIRECTORY) {
    throw new Error('Local photo storage is unavailable on this device.');
  }

  const info = await FileSystem.getInfoAsync(PHOTO_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });
  }
}

export async function storeJobPhoto(sourceUri) {
  if (!sourceUri) {
    throw new Error('Photo URI is required.');
  }

  await ensurePhotoDirectory();
  const destinationUri = `${PHOTO_DIRECTORY}${createPhotoFileName(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
  return destinationUri;
}

export async function deleteStoredJobPhoto(uri) {
  if (!isLocalJobPhotoUri(uri)) {
    return false;
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return false;
  }

  await FileSystem.deleteAsync(uri, { idempotent: true });
  return true;
}

export async function cleanupStoredJobPhotos(uris = []) {
  if (!Array.isArray(uris)) {
    return 0;
  }

  const results = await Promise.allSettled(
    uris.filter(isLocalJobPhotoUri).map((uri) => deleteStoredJobPhoto(uri))
  );

  return results.filter((result) => result.status === 'fulfilled' && result.value).length;
}

export function appendPhotoUri(photos, uri) {
  return [...photos, uri];
}

export function removePhotoUriAtIndex(photos, removeIndex) {
  return photos.filter((_photo, index) => index !== removeIndex);
}
