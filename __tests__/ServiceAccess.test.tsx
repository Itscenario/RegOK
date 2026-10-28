import { getScanHistory } from '../src/storage/scans';
import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainTabs from '../src/navigation/MainTabs';
import HomeScreen from '../src/screens/Home/HomeScreen';
import DetailsScreen from '../src/screens/Details/DetailsScreen';
import { findServiceUser } from '../src/auth/users';
import type { ScreenProps } from '../src/navigation/types';
import type { ServiceId } from '../src/types/services';

test.each(['kit', 'dinner', 'lunch'] as const)(
  '%s staff can see and scan only their service',
  async service => {
    AppState.currentState = 'active';
    const user = findServiceUser(`${service}_user`)!;
    let app!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <MainTabs
            route={{ key: 'Home', name: 'Home', params: { user } }}
            navigation={
              {
                reset: jest.fn(),
              } as unknown as ScreenProps<'Home'>['navigation']
            }
          />
        </SafeAreaProvider>,
      );
    });
    const controls = () =>
      app.root.findAll(item => typeof item.props.onPress === 'function');
    const labels = new Set(
      controls()
        .map(item => item.props.accessibilityLabel)
        .filter(
          (label: unknown) =>
            typeof label === 'string' && label.startsWith('Scan QR for'),
        ),
    );
    expect([...labels]).toEqual([
      `Scan QR for ${service[0].toUpperCase()}${service.slice(1)}`,
    ]);
    const other: ServiceId = service === 'kit' ? 'lunch' : 'kit';
    await ReactTestRenderer.act(async () =>
      app.root.findByType(HomeScreen).props.onSelect(other),
    );
    expect(app.root.findAllByProps({ testID: 'qr-camera' })).toHaveLength(0);
    await ReactTestRenderer.act(async () =>
      app.root.findByType(HomeScreen).props.onSelect(service),
    );
    await ReactTestRenderer.act(async () =>
      app.root
        .findByProps({ testID: 'qr-camera' })
        .props.codeScanner.onCodeScanned([{ value: 'ATTENDEE-1' }]),
    );
    expect(app.root.findAllByType(DetailsScreen)).toHaveLength(0);
    expect((await getScanHistory(service))[0].service).toBe(service);
    await ReactTestRenderer.act(async () => app.unmount());
  },
);

test('unknown users do not receive an assignment', () => {
  expect(findServiceUser('unknown')).toBeNull();
  expect(findServiceUser('constructor')).toBeNull();
  expect(findServiceUser(' KIT_USER ')).toEqual({
    username: 'kit_user',
    feature: 'scan' as const,
    service: 'kit',
  });
});
