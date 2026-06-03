import * as FileSystem from 'expo-file-system';

const ENTITLEMENT_FILE_NAME = 'tradietrack-ad-free-entitlement.json';
let memoryEntitlement = null;

export function createEmptyEntitlement() {
  return {
    isAdFree: false,
    source: 'none',
    provider: null,
    purchasedAt: null,
    updatedAt: null,
  };
}

export function normalizeEntitlementState(value) {
  if (!value || typeof value !== 'object') {
    return createEmptyEntitlement();
  }

  return {
    isAdFree: value.isAdFree === true,
    source: typeof value.source === 'string' ? value.source : 'none',
    provider: typeof value.provider === 'string' ? value.provider : null,
    purchasedAt: typeof value.purchasedAt === 'string' ? value.purchasedAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

function getEntitlementFileUri() {
  return FileSystem.documentDirectory
    ? `${FileSystem.documentDirectory}${ENTITLEMENT_FILE_NAME}`
    : null;
}

export async function loadAdFreeEntitlement() {
  const fileUri = getEntitlementFileUri();
  if (!fileUri) {
    return memoryEntitlement || createEmptyEntitlement();
  }

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      return createEmptyEntitlement();
    }

    const raw = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return normalizeEntitlementState(JSON.parse(raw));
  } catch {
    return createEmptyEntitlement();
  }
}

export async function saveAdFreeEntitlement(state) {
  const normalized = normalizeEntitlementState(state);
  memoryEntitlement = normalized;

  const fileUri = getEntitlementFileUri();
  if (fileUri) {
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(normalized), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  return normalized;
}

export async function resetAdFreeEntitlementForTests() {
  memoryEntitlement = null;
  const fileUri = getEntitlementFileUri();
  if (fileUri) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
}
