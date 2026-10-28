import { findServiceUser } from '../src/auth/users';
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from '../src/navigation/RootNavigator';
import {
  saveLoginSession,
  getLoginSession,
  clearLoginSession,
} from '../src/storage/session';

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ initialRouteName }: { initialRouteName: string }) => {
      const ReactNative = require('react-native');
      return <ReactNative.Text>{initialRouteName}</ReactNative.Text>;
    },
    Screen: () => null,
  }),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

async function restoredRoute() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator />);
  });
  const route = tree.root.findByType(Text).props.children;
  await ReactTestRenderer.act(async () => tree.unmount());
  return route;
}

test('opens Login on a fresh install', async () => {
  expect(await restoredRoute()).toBe('Login');
});

test('restores Home on a new app mount after login without saving credentials', async () => {
  const user = findServiceUser('kit')!;
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
  expect(JSON.stringify(await getLoginSession())).not.toContain('upwd');
  expect(await restoredRoute()).toBe('Home');
});

test('opens Login when storage cannot be read', async () => {
  jest
    .mocked(AsyncStorage.getItem)
    .mockRejectedValueOnce(new Error('unavailable'));
  expect(await restoredRoute()).toBe('Login');
});

test.each([
  'true',
  '{broken',
  JSON.stringify({
    username: 'kit_user',
    feature: 'scan' as const,
    service: 'dinner',
  }),
])('rejects incomplete or mismatched session %s', async value => {
  await AsyncStorage.setItem('@RegOK/session', value);
  expect(await restoredRoute()).toBe('Login');
});

test.each(['kit', 'dinner', 'lunch'] as const)(
  'restores the assigned %s service after restart',
  async service => {
    const user = findServiceUser(service)!;
    await saveLoginSession(user);
    expect(await getLoginSession()).toEqual(user);
    await clearLoginSession();
    expect(await getLoginSession()).toBeNull();
    expect(await restoredRoute()).toBe('Login');
  },
);

test('local demo login is restored without an API', async () => {
  await AsyncStorage.setItem(
    '@RegOK/session',
    JSON.stringify({ username: 'kit_user', feature: 'scan', service: 'kit' }),
  );
  expect(await restoredRoute()).toBe('Home');
});
