import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScanHistory, recordScan } from '../src/storage/scans';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('saves first scan and rejects a repeat, even after re-reading saved history', async () => {
  expect((await recordScan('lunch', 'QR-001')).status).toBe('success');
  expect(await getScanHistory('lunch')).toHaveLength(1);
  const duplicate = await recordScan('lunch', ' QR-001 ');
  expect(duplicate.status).toBe('duplicate');
  expect(duplicate.history).toHaveLength(1);
});

test('same QR can be used for a different service', async () => {
  await recordScan('lunch', 'QR-001');
  expect((await recordScan('kit', 'QR-001')).status).toBe('success');
});

test('matching QR numbers in differently formatted payloads are duplicates', async () => {
  await recordScan(
    'lunch',
    JSON.stringify({ name: 'Asha', qrCodeNo: 'QR-001' }),
  );
  expect(
    (
      await recordScan(
        'lunch',
        JSON.stringify({ data: { qr_code_no: 'QR-001', name: 'Updated' } }),
      )
    ).status,
  ).toBe('duplicate');
  expect((await recordScan('lunch', 'QR-001')).status).toBe('duplicate');
});

test('simultaneous callbacks create only one entry', async () => {
  const results = await Promise.all([
    recordScan('lunch', 'QR-001'),
    recordScan('lunch', 'QR-001'),
  ]);
  expect(results.map(result => result.status)).toEqual([
    'success',
    'duplicate',
  ]);
  expect(await getScanHistory('lunch')).toHaveLength(1);
});

test('save failure does not report success and can be retried', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('full'));
  await expect(recordScan('lunch', 'QR-001')).rejects.toThrow('full');
  expect(await getScanHistory('lunch')).toHaveLength(0);
  expect((await recordScan('lunch', 'QR-001')).status).toBe('success');
});

test('empty QR and corrupt history are not accepted', async () => {
  await expect(recordScan('lunch', '  ')).rejects.toThrow();
  await AsyncStorage.setItem('@RegOK/scans/lunch', '{corrupt');
  await expect(recordScan('lunch', 'QR-001')).rejects.toThrow();
});
