import { AppState } from 'react-native';
import { recordScan } from '../src/storage/scans';
import DetailsScreen from '../src/screens/Details/DetailsScreen';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainTabs from '../src/navigation/MainTabs';
import BadgeScreen from '../src/screens/Badge/BadgeScreen';
import HomeScreen from '../src/screens/Home/HomeScreen';
import SpotRegistrationScreen from '../src/screens/SpotRegistration/SpotRegistrationScreen';
import { findServiceUser } from '../src/auth/users';
import type { ScreenProps } from '../src/navigation/types';

test.each([
  ['kit_user', 'Scan'],
  ['dinner_user', 'Scan'],
  ['lunch_user', 'Scan'],
  ['badge_user', 'Badge Print'],
  ['spot_user', 'Spot Registration'],
  ['details_user', 'Details'],
])('%s sees only its assigned %s tab', async (username, expectedTab) => {
  const user = findServiceUser(username)!;
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <MainTabs
          route={{ key: 'Home', name: 'Home', params: { user } }}
          navigation={
            { reset: jest.fn() } as unknown as ScreenProps<'Home'>['navigation']
          }
        />
      </SafeAreaProvider>,
    );
  });
  const tabLabels = new Set(
    app.root
      .findAll(item => item.props.accessibilityRole === 'tab')
      .map(item => item.props.accessibilityLabel),
  );
  expect([...tabLabels]).toEqual(
    user.feature === 'details'
      ? ['Scan tab', 'Badge Print tab', 'Spot Registration tab', 'Details tab']
      : [`${expectedTab} tab`],
  );
  expect(app.root.findAllByType(HomeScreen)).toHaveLength(
    user.feature === 'scan' ? 1 : 0,
  );
  expect(app.root.findAllByType(BadgeScreen)).toHaveLength(
    user.feature === 'badge' ? 1 : 0,
  );
  expect(app.root.findAllByType(SpotRegistrationScreen)).toHaveLength(
    user.feature === 'spot' ? 1 : 0,
  );
  expect(app.root.findAllByType(DetailsScreen)).toHaveLength(
    user.feature === 'details' ? 1 : 0,
  );
  await ReactTestRenderer.act(async () => app.unmount());
});

test.each([
  { username: 'lunch_user', service: 'lunch' },
  { username: 'lunch_user', feature: 'spot' },
])(
  'migrates stale Lunch route params instead of showing Spot Registration',
  async staleUser => {
    let app!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <MainTabs
            route={{
              key: 'Home',
              name: 'Home',
              params: {
                user: staleUser as ScreenProps<'Home'>['route']['params']['user'],
              },
            }}
            navigation={
              {
                reset: jest.fn(),
              } as unknown as ScreenProps<'Home'>['navigation']
            }
          />
        </SafeAreaProvider>,
      );
    });
    expect(app.root.findByType(HomeScreen).props.user).toEqual({
      username: 'lunch_user',
      feature: 'scan',
      service: 'lunch',
    });
    const labels = new Set(
      app.root
        .findAll(item => item.props.accessibilityRole === 'tab')
        .map(item => item.props.accessibilityLabel),
    );
    expect([...labels]).toEqual(['Scan tab']);
    expect(app.root.findAllByType(SpotRegistrationScreen)).toHaveLength(0);
    await ReactTestRenderer.act(async () => app.unmount());
  },
);

test('unknown route user returns to Login without showing another feature', async () => {
  const reset = jest.fn();
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <MainTabs
        route={{
          key: 'Home',
          name: 'Home',
          params: { user: { username: 'unknown', feature: 'spot' } },
        }}
        navigation={{ reset } as unknown as ScreenProps<'Home'>['navigation']}
      />,
    );
  });
  expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Login' }] });
  expect(app.root.findAllByType(SpotRegistrationScreen)).toHaveLength(0);
  await ReactTestRenderer.act(async () => app.unmount());
});

test('Details user sees stored scans and opens only the chosen service data', async () => {
  await recordScan('lunch', 'LUNCH-DETAILS-TEST');
  await recordScan('kit', 'KIT-DETAILS-TEST');
  const navigate = jest.fn();
  const user = findServiceUser('details_user')!;
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <MainTabs
          route={{ key: 'Home', name: 'Home', params: { user } }}
          navigation={
            {
              reset: jest.fn(),
              navigate,
            } as unknown as ScreenProps<'Home'>['navigation']
          }
        />
      </SafeAreaProvider>,
    );
  });
  const detailProps = app.root.findByType(DetailsScreen).props;
  expect(detailProps.records).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ value: 'LUNCH-DETAILS-TEST' }),
      expect.objectContaining({ value: 'KIT-DETAILS-TEST' }),
    ]),
  );
  expect(app.root.findAllByType(HomeScreen)).toHaveLength(0);
  const card = app.root
    .findAll(item => typeof item.props.onPress === 'function')
    .find(item => item.props.accessibilityLabel === 'Lunch scan details')!;
  await ReactTestRenderer.act(async () => card.props.onPress());
  expect(navigate).toHaveBeenCalledWith('ServiceDetails', {
    serviceId: 'lunch',
    records: expect.arrayContaining([
      expect.objectContaining({ value: 'LUNCH-DETAILS-TEST' }),
    ]),
  });
  expect(
    navigate.mock.calls[0][1].records.every(
      (item: { service: string }) => item.service === 'lunch',
    ),
  ).toBe(true);
  await ReactTestRenderer.act(async () => app.unmount());
});

test('Details user can switch across all features and scan every service without losing history', async () => {
  AppState.currentState = 'active';
  await recordScan('kit', 'ADMIN-EXISTING-KIT');
  const user = findServiceUser('details_user')!;
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <MainTabs
          route={{ key: 'Home', name: 'Home', params: { user } }}
          navigation={
            {
              reset: jest.fn(),
              navigate: jest.fn(),
            } as unknown as ScreenProps<'Home'>['navigation']
          }
        />
      </SafeAreaProvider>,
    );
  });
  const control = (label: string) =>
    app.root
      .findAll(item => typeof item.props.onPress === 'function')
      .find(item => item.props.accessibilityLabel === label)!;
  await ReactTestRenderer.act(async () => control('Scan tab').props.onPress());
  for (const title of ['Kit', 'Dinner', 'Lunch']) {
    expect(control(`Scan QR for ${title}`)).toBeDefined();
  }
  await ReactTestRenderer.act(async () =>
    control('Scan QR for Lunch').props.onPress(),
  );
  await ReactTestRenderer.act(async () =>
    app.root
      .findByProps({ testID: 'qr-camera' })
      .props.codeScanner.onCodeScanned([{ value: 'ADMIN-LUNCH-SCAN' }]),
  );
  expect(app.root.findByType(HomeScreen).props.scanFeedback.status).toBe(
    'success',
  );
  await ReactTestRenderer.act(async () =>
    control('Details tab').props.onPress(),
  );
  expect(app.root.findByType(DetailsScreen).props.records).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ service: 'kit', value: 'ADMIN-EXISTING-KIT' }),
      expect.objectContaining({ service: 'lunch', value: 'ADMIN-LUNCH-SCAN' }),
    ]),
  );
  await ReactTestRenderer.act(async () =>
    control('Badge Print tab').props.onPress(),
  );
  expect(app.root.findAllByType(BadgeScreen)).toHaveLength(1);
  await ReactTestRenderer.act(async () =>
    control('Spot Registration tab').props.onPress(),
  );
  expect(app.root.findAllByType(SpotRegistrationScreen)).toHaveLength(1);
  await ReactTestRenderer.act(async () => app.unmount());
});
