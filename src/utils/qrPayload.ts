const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

export function readQrPayload(text: string): Record<string, string> {
  const fields: Record<string, string> = Object.create(null);
  function collect(value: unknown, depth = 0) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      depth > 4
    ) {
      return;
    }
    const data = value as Record<string, unknown>;
    for (const [key, item] of Object.entries(data)) {
      const normalized = normalizeKey(key);
      if (typeof item === 'string' && item.trim()) {
        fields[normalized] ??= item.trim();
      }
      if (typeof item === 'number' && Number.isFinite(item)) {
        fields[normalized] ??= String(item);
      }
    }
    for (const [key, item] of Object.entries(data)) {
      if (
        [
          'attendee',
          'data',
          'user',
          'participant',
          'delegate',
          'registration',
          'profile',
          'details',
        ].includes(normalizeKey(key))
      ) {
        collect(item, depth + 1);
      }
    }
  }
  try {
    collect(JSON.parse(text));
  } catch {
    // Also accept labeled QR text, e.g. Name: Asha\nEmail: asha@example.com.
    for (const line of text.split(/\r?\n|\|/)) {
      const pair = line
        .trim()
        .match(/^([A-Za-z][A-Za-z _-]{0,40})\s*[:=]\s*(.+)$/);
      if (
        pair &&
        [
          'name',
          'fullname',
          'attendeename',
          'participantname',
          'delegatename',
          'displayname',
          'firstname',
          'givenname',
          'lastname',
          'surname',
          'familyname',
          'fn',
          'email',
          'emailaddress',
          'registrationno',
          'registrationnumber',
          'regno',
          'qrcodeno',
          'qrcode',
          'qrno',
        ].includes(normalizeKey(pair[1]))
      ) {
        fields[normalizeKey(pair[1])] ??= pair[2].trim();
      }
    }
  }
  return fields;
}

export function qrField(
  payload: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = payload[normalizeKey(key)];
    if (value) {
      return value;
    }
  }
  return undefined;
}
