import { eventStorageKey } from './event';
import { readQrPayload, qrField } from '../utils/qrPayload';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanRecord, ServiceId } from '../types/services';

const key = (service: ServiceId) => `@RegOK/scans/${service}`;

// Prefer the QR identifier so JSON formatting and attendee edits do not bypass duplicates.
export function qrIdentity(value: string): string {
  const text = value.trim();
  if (!text) {
    throw new Error('Empty QR code');
  }
  const identifier = qrField(
    readQrPayload(text),
    'qrCodeNo',
    'qrCode',
    'qrNo',
    'registrationNo',
    'registrationNumber',
    'regNo',
  );
  if (identifier) {
    return identifier;
  }

  return text;
}

export async function getScanHistory(
  service: ServiceId,
): Promise<ScanRecord[]> {
  const stored = await AsyncStorage.getItem(
    await eventStorageKey(key(service)),
  );
  if (!stored) {
    return [];
  }
  const parsed: unknown = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      record =>
        record &&
        typeof record === 'object' &&
        record.service === service &&
        typeof record.value === 'string' &&
        typeof record.id === 'string' &&
        typeof record.time === 'string',
    )
  ) {
    throw new Error('Unable to read scan history');
  }
  return parsed;
}

// Serialize checks and saves to prevent simultaneous callbacks recording twice.
let pending: Promise<unknown> = Promise.resolve();
export function recordScan(service: ServiceId, value: string) {
  const task = pending.then(async () => {
    const identity = qrIdentity(value);
    const history = await getScanHistory(service);
    const existing = history.find(
      record => qrIdentity(record.value) === identity,
    );
    if (existing) {
      return { status: 'duplicate' as const, record: existing, history };
    }
    const now = new Date();
    const record: ScanRecord = {
      id: `SCAN-${now.getTime()}-${history.length + 1}`,
      service,
      value: value.trim(),
      time: now.toLocaleTimeString(),
      scannedAt: now.toISOString(),
    };
    const updated = [record, ...history];
    await AsyncStorage.setItem(
      await eventStorageKey(key(service)),
      JSON.stringify(updated),
    );
    return { status: 'success' as const, record, history: updated };
  });
  pending = task.catch(() => undefined);
  return task;
}
