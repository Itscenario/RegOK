import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EventSelectionScreen from '../src/screens/EventSelection/EventSelectionScreen';
import { ToastProvider } from '../src/components/ToastProvider';
import { getSelectedEvent, selectEvent } from '../src/storage/event';
import { getLoginSession, saveLoginSession } from '../src/storage/session';
import { getScanHistory, recordScan } from '../src/storage/scans';
import type { ScreenProps } from '../src/navigation/types';

const first = { id: 'event-a', name: 'Event A' };
const second = { id: 'event-b', name: 'Event B' };
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

test('keeps login and duplicate QR history separate for each event', async () => {
  const user = {
    username: 'kit',
    feature: 'scan' as const,
    service: 'kit' as const,
    roles: [4 as const],
  };
  await selectEvent(first);
  await saveLoginSession(user);
  expect((await recordScan('kit', 'QR-001')).status).toBe('success');
  await selectEvent(second);
  expect(await getLoginSession()).toBeNull();
  expect(await getScanHistory('kit')).toEqual([]);
  expect((await recordScan('kit', 'QR-001')).status).toBe('success');
  await selectEvent(first);
  expect(await getLoginSession()).toEqual(user);
  expect((await recordScan('kit', 'QR-001')).status).toBe('duplicate');
});

test.each([false, true])(
  'selects an event and resumes saved session=%s',
  async loggedIn => {
    const user = {
      username: 'lunch',
      feature: 'scan' as const,
      service: 'lunch' as const,
      roles: [2 as const],
    };
    if (loggedIn) {
      await selectEvent(first);
      await saveLoginSession(user);
    }
    const navigate = jest.fn();
    const replace = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <SafeAreaProvider>
          <ToastProvider>
            <EventSelectionScreen
              eventData={[first, second]}
              route={{
                key: 'events',
                name: 'EventSelection',
                params: undefined,
              }}
              navigation={
                {
                  navigate,
                  replace,
                } as unknown as ScreenProps<'EventSelection'>['navigation']
              }
            />
          </ToastProvider>
        </SafeAreaProvider>,
      );
    });
    const control = (label: string) =>
      tree.root.findAll(
        item =>
          item.props.accessibilityLabel === label &&
          typeof item.props.onPress === 'function',
      )[0];
    if (!loggedIn) {
      expect(control('Continue to selected event').props.disabled).toBe(true);
    }
    await ReactTestRenderer.act(async () => {
      control('Select Event A').props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      await control('Continue to selected event').props.onPress();
    });
    expect(await getSelectedEvent()).toEqual(first);
    if (loggedIn) {
      expect(replace).toHaveBeenCalledWith('Home', { user });
    } else {
      expect(replace).toHaveBeenCalledWith('Login', { event: first });
    }
    expect(
      tree.root
        .findAllByType(Text)
        .some(item => item.props.children === 'Select an event'),
    ).toBe(true);
    await ReactTestRenderer.act(async () => tree.unmount());
  },
);
