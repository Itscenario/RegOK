import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseUserFromApiResponse } from '../src/config/backend';
import { allowedServices, canUseFeature, resolveUser } from '../src/auth/users';
import { getLoginSession, saveLoginSession } from '../src/storage/session';
import MainTabs from '../src/navigation/MainTabs';
import type { ScreenProps } from '../src/navigation/types';

const fromRole = (role: unknown, username = 'api-staff') =>
  parseUserFromApiResponse(username, {
    Data: [{ UserName: username, role }],
  });
beforeEach(async () => {
  await AsyncStorage.clear();
});

test.each([
  [0, 'spot', []],
  [1, 'badge', []],
  [2, 'scan', ['lunch']],
  [3, 'scan', ['dinner']],
  [4, 'scan', ['kit']],
] as const)(
  'maps backend role %s to only its assigned feature',
  (role, feature, services) => {
    const user = fromRole(role);
    expect(user.feature).toBe(feature);
    expect(allowedServices(user)).toEqual(services);
    expect(canUseFeature(user, 'details')).toBe(false);
  },
);

test('server roles override username-based demo access and survive restoring the session', async () => {
  const user = fromRole('0', 'kit');
  expect(user.feature).toBe('spot');
  expect(resolveUser(user)).toEqual(user);
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
});

test.each(['', ' ', '|', '5', '99', 'kit', null])(
  'does not grant access for unsupported role %s',
  role => {
    expect(() => fromRole(role)).toThrow('No supported access role');
  },
);

test('supports multi-role permissions without granting unassigned services', async () => {
  const user = fromRole('0|1|2|3');
  expect(allowedServices(user)).toEqual(['dinner', 'lunch']);
  expect(canUseFeature(user, 'spot')).toBe(true);
  expect(canUseFeature(user, 'badge')).toBe(true);
  expect(canUseFeature(user, 'details')).toBe(false);
  const navigate = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider>
        <MainTabs
          route={{ key: 'home', name: 'Home', params: { user } }}
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
  const controls = (label: string) =>
    tree.root.findAll(
      item =>
        item.props.accessibilityLabel === label &&
        typeof item.props.onPress === 'function',
    );
  expect(controls('Scan tab').length).toBeGreaterThan(0);
  expect(controls('Badge Print tab').length).toBeGreaterThan(0);
  expect(controls('Spot Registration tab').length).toBeGreaterThan(0);
  expect(controls('Details tab')).toHaveLength(0);
  expect(controls('Scan QR for Kit')).toHaveLength(0);
  expect(controls('Scan QR for Lunch').length).toBeGreaterThan(0);
  expect(controls('Scan QR for Dinner').length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () =>
    controls('Spot Registration tab')[0].props.onPress(),
  );
  expect(
    controls('Spot Registration tab')[0].props.accessibilityState.selected,
  ).toBe(true);
  await ReactTestRenderer.act(async () => tree.unmount());
});

test.each([
  { username: 'spot', feature: 'details' },
  { username: 'bd', feature: 'spot' },
])(
  'does not restore guessed access from old API sessions: $username',
  async user => {
    await AsyncStorage.setItem('@RegOK/session', JSON.stringify(user));
    expect(await getLoginSession()).toBeNull();
  },
);

test('bd with API role 1 opens only Badge Print and restores the same access', async () => {
  const user = fromRole('1', 'bd');
  expect(user).toEqual({ username: 'bd', feature: 'badge', roles: [1] });
  expect(canUseFeature(user, 'badge')).toBe(true);
  expect(canUseFeature(user, 'spot')).toBe(false);
  expect(canUseFeature(user, 'scan')).toBe(false);
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
});

test('lunch with API role 2 opens only Lunch and restores the same access', async () => {
  const user = fromRole('2', 'lunch');
  expect(user).toEqual({
    username: 'lunch',
    feature: 'scan',
    service: 'lunch',
    roles: [2],
  });
  expect(allowedServices(user)).toEqual(['lunch']);
  expect(canUseFeature(user, 'badge')).toBe(false);
  expect(canUseFeature(user, 'spot')).toBe(false);
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
});

test('dinner with API role 3 opens only Dinner and restores the same access', async () => {
  const user = fromRole('3', 'dinner');
  expect(user).toEqual({
    username: 'dinner',
    feature: 'scan',
    service: 'dinner',
    roles: [3],
  });
  expect(allowedServices(user)).toEqual(['dinner']);
  expect(canUseFeature(user, 'badge')).toBe(false);
  expect(canUseFeature(user, 'spot')).toBe(false);
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
});

test('kit with API role 4 opens only Kit and restores the same access', async () => {
  const user = fromRole('4', 'kit');
  expect(user).toEqual({
    username: 'kit',
    feature: 'scan',
    service: 'kit',
    roles: [4],
  });
  expect(allowedServices(user)).toEqual(['kit']);
  expect(canUseFeature(user, 'badge')).toBe(false);
  expect(canUseFeature(user, 'spot')).toBe(false);
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
});
