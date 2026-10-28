import React from 'react';
import { FlatList, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ServiceDetailsScreen from '../src/screens/ServiceDetails/ServiceDetailsScreen';
import type { ScreenProps } from '../src/navigation/types';

test('filters assigned-service records by partial name, handles no match and clears', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <ServiceDetailsScreen
          route={{
            key: 'details',
            name: 'ServiceDetails',
            params: {
              serviceId: 'lunch',
              records: [
                {
                  id: '1',
                  service: 'lunch',
                  name: 'Asha Sharma',
                  value: 'QR-1',
                  time: '12:00',
                },
                {
                  id: '2',
                  service: 'lunch',
                  value: JSON.stringify({
                    attendee: { full_name: 'Ravi Kumar' },
                  }),
                  time: '12:00',
                },
                { id: '3', service: 'lunch', value: 'QR-3', time: '12:00' },
                {
                  id: '4',
                  service: 'kit',
                  name: 'Asha Sharma',
                  value: 'QR-4',
                  time: '12:00',
                },
              ],
            },
          }}
          navigation={{} as ScreenProps<'ServiceDetails'>['navigation']}
        />
      </SafeAreaProvider>,
    );
  });
  const input = () =>
    app.root
      .findAllByType(TextInput)
      .find(item => item.props.accessibilityLabel === 'Filter scans by name')!;
  const button = (label: string) =>
    app.root
      .findAll(item => typeof item.props.onPress === 'function')
      .find(item => item.props.accessibilityLabel === label)!;
  const ids = () =>
    app.root
      .findByType(FlatList)
      .props.data.map((item: { id: string }) => item.id);
  expect(ids()).toEqual(['1', '2', '3']);
  await ReactTestRenderer.act(async () =>
    input().props.onChangeText('  SHAR  '),
  );
  await ReactTestRenderer.act(async () =>
    button('Apply name filter').props.onPress(),
  );
  expect(ids()).toEqual(['1']);
  await ReactTestRenderer.act(async () => input().props.onChangeText('kumar'));
  await ReactTestRenderer.act(async () => input().props.onSubmitEditing());
  expect(ids()).toEqual(['2']);
  await ReactTestRenderer.act(async () =>
    input().props.onChangeText('missing'),
  );
  await ReactTestRenderer.act(async () =>
    button('Apply name filter').props.onPress(),
  );
  expect(ids()).toEqual([]);
  await ReactTestRenderer.act(async () =>
    button('Clear name filter').props.onPress(),
  );
  expect(ids()).toEqual(['1', '2', '3']);
  await ReactTestRenderer.act(async () => app.unmount());
});
