import React from 'react';
import { FlatList, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BadgeScreen, { type Badge } from '../src/screens/Badge/BadgeScreen';

const types = [
  'Faculty',
  'Delegate',
  'Accompanying',
  'Event Manager',
  'Exhibitor',
  'Past President',
  'DOS Staff',
  'Without Food',
  'Senior Citizen',
] as const;
const badges: Badge[] = types.map((memberType, index) => ({
  id: String(index + 1),
  memberType,
  name: index === 0 ? 'Dr. Asha Mehta' : `Attendee ${index + 1}`,
  regNo: `DEMO-REG-${String(index + 1).padStart(3, '0')}`,
  email: `attendee${index + 1}@example.com`,
  printed: index % 3 === 0,
  qr: `QR-${index + 1}`,
  qrImageUrl: 'https://example.com/qr.png',
}));
const loadBadges = async () => badges;

test('searches badges by name and reg no, filters all nine member types and resets', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <BadgeScreen loadBadges={loadBadges} />
      </SafeAreaProvider>,
    );
  });
  const control = (label: string) =>
    app.root
      .findAll(item => typeof item.props.onPress === 'function')
      .find(item => item.props.accessibilityLabel === label)!;
  const input = () => app.root.findAllByType(TextInput)[0];
  const data = () =>
    app.root
      .findAllByType(FlatList)
      .find(list => list.props.testID === 'badge-results')!.props.data as {
      name: string;
      regNo: string;
      memberType: string;
    }[];
  expect(data()).toHaveLength(9);
  await ReactTestRenderer.act(async () =>
    input().props.onChangeText('  ASHA '),
  );
  await ReactTestRenderer.act(async () =>
    control('Search badges').props.onPress(),
  );
  expect(data().map(item => item.name)).toEqual(['Dr. Asha Mehta']);
  await ReactTestRenderer.act(async () =>
    input().props.onChangeText('demo-reg-002'),
  );
  await ReactTestRenderer.act(async () => input().props.onSubmitEditing());
  expect(data().map(item => item.regNo)).toEqual(['DEMO-REG-002']);
  await ReactTestRenderer.act(async () =>
    control('Clear badge filters').props.onPress(),
  );
  const displayedTypes = data().map(item => item.memberType);
  for (const type of displayedTypes) {
    await ReactTestRenderer.act(async () =>
      control('Choose member type').props.onPress(),
    );
    await ReactTestRenderer.act(async () => control(type).props.onPress());
    expect(data().map(item => item.memberType)).toEqual([type]);
  }
  await ReactTestRenderer.act(async () =>
    input().props.onChangeText('missing'),
  );
  await ReactTestRenderer.act(async () =>
    control('Search badges').props.onPress(),
  );
  expect(data()).toHaveLength(0);
  await ReactTestRenderer.act(async () =>
    control('Clear badge filters').props.onPress(),
  );
  expect(data()).toHaveLength(9);
  await ReactTestRenderer.act(async () => app.unmount());
});

test('opens real QR badge preview without pretending to print', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <BadgeScreen loadBadges={loadBadges} />
      </SafeAreaProvider>,
    );
  });
  const control = (label: string) =>
    app.root
      .findAll(
        item => typeof item.props.onPress === 'function' || item.props.disabled,
      )
      .find(item => item.props.accessibilityLabel === label)!;
  await ReactTestRenderer.act(async () =>
    control('Preview badge DEMO-REG-002').props.onPress(),
  );
  expect(control('Print badge, printer not connected').props.disabled).toBe(
    true,
  );
  const badge = app.root
    .findAllByType(FlatList)
    .find(list => list.props.testID === 'badge-results')!
    .props.data.find(
      (item: { regNo: string }) => item.regNo === 'DEMO-REG-002',
    );
  expect(badge.printed).toBe(false);
  await ReactTestRenderer.act(async () =>
    control('Close badge preview').props.onPress(),
  );
  await ReactTestRenderer.act(async () => app.unmount());
});

test('accepts API badge data after a failed load is retried', async () => {
  const loader = jest
    .fn<Promise<Badge[]>, []>()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([badges[1]]);
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <BadgeScreen loadBadges={loader} />
      </SafeAreaProvider>,
    );
  });
  const retry = app.root.findAll(
    item =>
      item.props.title === 'Retry' && typeof item.props.onPress === 'function',
  )[0];
  expect(retry).toBeDefined();
  await ReactTestRenderer.act(async () => retry.props.onPress());
  const list = app.root
    .findAllByType(FlatList)
    .find(item => item.props.testID === 'badge-results')!;
  expect(list.props.data).toEqual([badges[1]]);
  expect(loader).toHaveBeenCalledTimes(2);
  await ReactTestRenderer.act(async () => app.unmount());
});

test('shows a demo badge for each member type when no API is connected', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <BadgeScreen />
      </SafeAreaProvider>,
    );
  });
  const data = app.root
    .findAllByType(FlatList)
    .find(list => list.props.testID === 'badge-results')!.props.data as Badge[];
  expect(data.map(item => item.memberType)).toEqual([...types]);
  expect(
    data.every(
      item => item.name && item.email && item.regNo && item.qr && item.qrImage,
    ),
  ).toBe(true);
  await ReactTestRenderer.act(async () => app.unmount());
});
