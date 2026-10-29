import { selectEvent } from '../src/storage/event';
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

test('opens event selection on a fresh install', async () => {
  expect(await restoredRoute()).toBe('EventSelection');
});

const event = { id: 'corporate-event', name: 'Corporate Event' };

test('skips event selection and opens Login after selecting once', async () => {
  await selectEvent(event);
  expect(await restoredRoute()).toBe('Login');
});

test('restores Home after restart with saved event and session', async () => {
  await selectEvent(event);
  const user = findServiceUser('kit_user')!;
  await saveLoginSession(user);
  expect(await getLoginSession()).toEqual(user);
  expect(JSON.stringify(await getLoginSession())).not.toContain('upwd');
  expect(await restoredRoute()).toBe('Home');
});

test('opens event selection when selected event cannot be read', async () => {
  jest
    .mocked(AsyncStorage.getItem)
    .mockRejectedValueOnce(new Error('unavailable'));
  expect(await restoredRoute()).toBe('EventSelection');
});

test('keeps selected event and opens Login if session storage fails', async () => {
  await selectEvent(event);
  const selected = JSON.stringify(event);
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(selected);
  jest
    .mocked(AsyncStorage.getItem)
    .mockRejectedValueOnce(new Error('unavailable'));
  expect(await restoredRoute()).toBe('Login');
});

test.each([
  'true',
  '{broken',
  JSON.stringify({ username: 'kit_user', feature: 'scan', service: 'dinner' }),
])(
  'rejects invalid session while retaining selected event: %s',
  async value => {
    await selectEvent(event);
    await AsyncStorage.setItem('@RegOK/session/event/corporate-event', value);
    expect(await restoredRoute()).toBe('Login');
  },
);

test.each(['kit', 'dinner', 'lunch'] as const)(
  'restores %s session then skips event selection after logout',
  async service => {
    await selectEvent(event);
    const user = findServiceUser(`${service}_user`)!;
    await saveLoginSession(user);
    expect(await getLoginSession()).toEqual(user);
    expect(await restoredRoute()).toBe('Home');
    await clearLoginSession();
    expect(await getLoginSession()).toBeNull();
    expect(await restoredRoute()).toBe('Login');
  },
);

test('does not reuse another event session', async () => {
  await selectEvent(event);
  await saveLoginSession(findServiceUser('kit_user')!);
  await selectEvent({ id: 'medical-conference', name: 'Medical Conference' });
  expect(await restoredRoute()).toBe('Login');
});
