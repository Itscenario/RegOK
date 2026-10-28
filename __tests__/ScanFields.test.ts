import { getScanFields } from '../src/screens/ServiceDetails/ServiceDetailsScreen';

const base = {
  id: '1',
  service: 'lunch' as const,
  time: '12:30',
  scannedAt: '2026-10-28T07:00:00.000Z',
};

test('shows attendee fields from a structured QR and local scan date/time', () => {
  const fields = getScanFields({
    ...base,
    value: JSON.stringify({
      name: 'Asha',
      email: 'asha@example.com',
      registration_no: 'REG-001',
      qr_code_no: 'QR-001',
    }),
  });
  expect(fields.slice(0, 4).map(field => field.value)).toEqual([
    'Asha',
    'asha@example.com',
    'REG-001',
    'QR-001',
  ]);
  expect(fields[4].value).not.toBe('Not available');
  expect(fields[5].value).not.toBe('Not available');
});

test('plain QR numbers do not fabricate attendee data', () => {
  const fields = getScanFields({ ...base, value: 'QR-123' });
  expect(fields.slice(0, 3).map(field => field.value)).toEqual([
    'Not available',
    'Not available',
    'Not available',
  ]);
  expect(fields[3].value).toBe('QR-123');
});

test('supports nested QR data and preserves registration leading zeroes', () => {
  const fields = getScanFields({
    ...base,
    value: JSON.stringify({
      attendee: { fullName: 'Asha', regNo: '00012', qrNo: 123 },
    }),
  });
  expect(fields[0].value).toBe('Asha');
  expect(fields[2].value).toBe('00012');
  expect(fields[3].value).toBe('123');
});

test.each([
  JSON.stringify({ Name: 'Asha Sharma' }),
  JSON.stringify({ Data: { 'Full Name': 'Asha Sharma' } }),
  JSON.stringify({ participant: { first_name: 'Asha', last_name: 'Sharma' } }),
  'Name: Asha Sharma\nEmail: asha@example.com\nRegistration No: 001',
])(
  'reads name from case variations, nested/split fields and labeled QR text',
  value => {
    expect(getScanFields({ ...base, value })[0].value).toBe('Asha Sharma');
  },
);
