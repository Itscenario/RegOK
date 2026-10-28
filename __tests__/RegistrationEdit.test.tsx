import React from 'react';
import { FlatList, Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RegistrationEditScreen from '../src/screens/RegistrationEdit/RegistrationEditScreen';
import type { RegistrationDetails } from '../src/types/registration';
import type { ScreenProps } from '../src/navigation/types';
import MainTabs from '../src/navigation/MainTabs';
import { findServiceUser } from '../src/auth/users';

const details: RegistrationDetails = {
  id: 'REG-API-01',
  name: 'Asha Mehta',
  food: 'veg',
  foodOptions: [
    { label: 'Vegetarian', value: 'veg' },
    { label: 'Jain', value: 'jain' },
  ],
  entitlements: [
    { id: 'meal-a', label: 'Lunch', date: '2027-04-12', enabled: true },
    { id: 'meal-b', label: 'Dinner', date: '2027-04-13', enabled: false },
    { id: 'kit', label: 'Kitbag', enabled: true },
  ],
};
const navigation = {} as ScreenProps<'RegistrationEdit'>['navigation'];
function control(app: ReactTestRenderer.ReactTestRenderer, label: string) {
  return app.root
    .findAll(item => typeof item.props.onPress === 'function')
    .find(item => item.props.accessibilityLabel === label)!;
}

test('renders API-provided dates and updates the chosen entitlement and food only', async () => {
  const load = jest.fn(async () => details);
  const update = jest.fn(async () => {});
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <RegistrationEditScreen
          route={{
            key: 'edit',
            name: 'RegistrationEdit',
            params: { registrationId: 'REG-API-01' },
          }}
          navigation={navigation}
          loadRegistration={load}
          onUpdate={update}
        />
      </SafeAreaProvider>,
    );
  });
  expect(load).toHaveBeenCalledWith('REG-API-01');
  expect(
    app.root
      .findAllByType(FlatList)
      .find(list => list.props.data?.[0]?.id === 'meal-a')!.props.data,
  ).toEqual(details.entitlements);
  await ReactTestRenderer.act(async () =>
    control(app, 'Edit Lunch 2027-04-12').props.onPress(),
  );
  await ReactTestRenderer.act(async () => control(app, 'No').props.onPress());
  await ReactTestRenderer.act(async () =>
    control(app, 'Select food preference').props.onPress(),
  );
  await ReactTestRenderer.act(async () => control(app, 'Jain').props.onPress());
  await ReactTestRenderer.act(async () =>
    app.root.findAllByType(TextInput)[0].props.onChangeText('  Updated Name  '),
  );
  await ReactTestRenderer.act(async () =>
    control(app, 'Update registration details').props.onPress(),
  );
  expect(update).toHaveBeenCalledWith({
    ...details,
    name: 'Updated Name',
    food: 'jain',
    entitlements: [
      { ...details.entitlements[0], enabled: false },
      ...details.entitlements.slice(1),
    ],
  });
  expect(
    app.root.findAllByType(Text).map(item => item.props.children),
  ).toContain('Registration updated');
  await ReactTestRenderer.act(async () => app.unmount());
});

test('requires a name and does not claim API save in demo mode', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <RegistrationEditScreen
          route={{ key: 'edit', name: 'RegistrationEdit', params: undefined }}
          navigation={navigation}
        />
      </SafeAreaProvider>,
    );
  });
  await ReactTestRenderer.act(async () =>
    app.root.findAllByType(TextInput)[0].props.onChangeText(' '),
  );
  await ReactTestRenderer.act(async () =>
    control(app, 'Update registration details').props.onPress(),
  );
  const text = () =>
    app.root.findAllByType(Text).map(item => item.props.children);
  expect(text()).toContain('Enter a name with 2–100 characters.');
  await ReactTestRenderer.act(async () =>
    app.root.findAllByType(TextInput)[0].props.onChangeText('Raj'),
  );
  await ReactTestRenderer.act(async () =>
    control(app, 'Select food preference').props.onPress(),
  );
  await ReactTestRenderer.act(async () => control(app, 'Yes').props.onPress());
  const rows = app.root
    .findAllByType(FlatList)
    .find(list => list.props.data?.[0]?.id === 'lunch-1')!.props
    .data as RegistrationDetails['entitlements'];
  expect(rows.every(item => item.enabled === null)).toBe(true);
  for (const item of rows) {
    await ReactTestRenderer.act(async () =>
      control(
        app,
        `Edit ${item.label}${item.date ? ` ${item.date}` : ''}`,
      ).props.onPress(),
    );
    await ReactTestRenderer.act(async () =>
      control(app, 'Yes').props.onPress(),
    );
  }

  await ReactTestRenderer.act(async () =>
    control(app, 'Update registration details').props.onPress(),
  );
  expect(text()).toContain('Changes previewed');
  expect(text()).not.toContain('Registration updated');
  await ReactTestRenderer.act(async () => app.unmount());
});

test('Badge card Edit opens selected Registration Details', async () => {
  const navigate = jest.fn();
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <MainTabs
          route={{
            key: 'Home',
            name: 'Home',
            params: { user: findServiceUser('badge_user')! },
          }}
          navigation={
            {
              navigate,
              reset: jest.fn(),
            } as unknown as ScreenProps<'Home'>['navigation']
          }
        />
      </SafeAreaProvider>,
    );
  });
  expect(navigate).not.toHaveBeenCalled();
  await ReactTestRenderer.act(async () =>
    control(app, 'Edit attendee DEMO-REG-002').props.onPress(),
  );
  expect(navigate).toHaveBeenCalledWith('RegistrationEdit', {
    registrationId: 'demo-2',
    attendeeName: 'Aarav Sharma',
    details: undefined,
  });
  await ReactTestRenderer.act(async () => app.unmount());
});

test('opens the selected badge name instead of a hardcoded attendee', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <RegistrationEditScreen
          route={{
            key: 'edit',
            name: 'RegistrationEdit',
            params: {
              registrationId: 'REG-123',
              attendeeName: 'Selected Attendee',
            },
          }}
          navigation={navigation}
        />
      </SafeAreaProvider>,
    );
  });
  expect(app.root.findAllByType(TextInput)[0].props.value).toBe(
    'Selected Attendee',
  );
  await ReactTestRenderer.act(async () => app.unmount());
});
