import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DetailsScreen from '../src/screens/Details/DetailsScreen';
import ServiceDetailsScreen from '../src/screens/ServiceDetails/ServiceDetailsScreen';
import type { ScreenProps } from '../src/navigation/types';

test.each(['kit', 'dinner', 'lunch'] as const)(
  '%s card opens separate details; data stays out of overview',
  async service => {
    const onViewDetails = jest.fn();
    let app!: ReactTestRenderer.ReactTestRenderer;
    const records = [{ id: '1', service, time: '12:00', value: 'MY-QR-DATA' }];
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <DetailsScreen
            serviceId={service}
            onLogout={jest.fn()}
            isLoggingOut={false}
            records={records}
            onViewDetails={onViewDetails}
          />
        </SafeAreaProvider>,
      );
    });
    const title = service[0].toUpperCase() + service.slice(1);
    const card = app.root
      .findAll(item => typeof item.props.onPress === 'function')
      .find(item => item.props.accessibilityLabel === `${title} scan details`)!;
    await ReactTestRenderer.act(async () => card.props.onPress());
    expect(onViewDetails).toHaveBeenCalledTimes(1);
    expect(
      app.root.findAllByType(Text).map(item => item.props.children),
    ).not.toContain('MY-QR-DATA');
    await ReactTestRenderer.act(async () => app.unmount());

    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <ServiceDetailsScreen
            route={{
              key: 'details',
              name: 'ServiceDetails',
              params: {
                serviceId: service,
                records: [
                  ...records,
                  {
                    id: '2',
                    service: service === 'kit' ? 'lunch' : 'kit',
                    time: '13:00',
                    value: 'OTHER-QR-DATA',
                  },
                ],
              },
            }}
            navigation={{} as ScreenProps<'ServiceDetails'>['navigation']}
          />
        </SafeAreaProvider>,
      );
    });
    const visible = app.root
      .findAllByType(Text)
      .map(item => item.props.children);
    expect(visible).toContain('MY-QR-DATA');
    expect(visible).not.toContain('OTHER-QR-DATA');
    await ReactTestRenderer.act(async () => app.unmount());
  },
);

test('empty Lunch history shows an empty state and displays actual scans only', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  const renderScreen = (
    records: import('../src/types/services').ScanRecord[],
  ) => (
    <SafeAreaProvider>
      <ServiceDetailsScreen
        route={{
          key: 'lunch',
          name: 'ServiceDetails',
          params: { serviceId: 'lunch', records },
        }}
        navigation={{} as ScreenProps<'ServiceDetails'>['navigation']}
      />
    </SafeAreaProvider>
  );
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(renderScreen([]));
  });
  const text = () =>
    app.root.findAllByType(Text).map(item => item.props.children);
  expect(text()).toContain('No lunch scans yet');
  expect(text()).not.toContain('Aarav Sharma');
  expect(text()).toContain('00');
  await ReactTestRenderer.act(async () => {
    app.update(
      renderScreen([
        { id: 'actual', service: 'lunch', value: 'REAL-QR', time: '12:00' },
      ]),
    );
  });
  expect(text()).not.toContain('Aarav Sharma');
  expect(text()).not.toContain('SAMPLE DATA · PREVIEW ONLY');
  expect(text()).toContain('REAL-QR');
  await ReactTestRenderer.act(async () => app.unmount());
});
