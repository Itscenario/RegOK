import ScanResult from '../src/components/ScanResult';
import HomeScreen from '../src/screens/Home/HomeScreen';
import { getScanHistory } from '../src/storage/scans';
import type { ScreenProps } from '../src/navigation/types';
/**
 * @format
 */

import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import DetailsScreen from '../src/screens/Details/DetailsScreen';
import MainTabs from '../src/navigation/MainTabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

test('kit user sees only Scan and records QR results', async () => {
  AppState.currentState = 'active';
  const navigate = jest.fn();
  let app!: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <MainTabs
          route={{
            key: 'Home',
            name: 'Home',
            params: {
              user: {
                username: 'kit_user',
                feature: 'scan' as const,
                service: 'kit',
              },
            },
          }}
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

  const control = (label: string) =>
    app.root
      .findAll(item => typeof item.props.onPress === 'function')
      .find(item => item.props.accessibilityLabel === label)!;

  expect(control('Scan tab')).toBeDefined();
  expect(control('Badge Print tab')).toBeUndefined();
  expect(control('Spot Registration tab')).toBeUndefined();
  await ReactTestRenderer.act(async () => {
    control('Scan QR for Kit').props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    const scanner = app.root.findByProps({ testID: 'qr-camera' }).props
      .codeScanner;
    scanner.onCodeScanned([{ value: 'ATTENDEE-123' }]);
    scanner.onCodeScanned([{ value: 'ATTENDEE-123' }]);
  });
  expect(await getScanHistory('kit')).toHaveLength(1);
  expect(app.root.findAllByType(DetailsScreen)).toHaveLength(0);
  expect(app.root.findByType(HomeScreen).props.scanFeedback.status).toBe(
    'success',
  );
  expect(app.root.findByType(ScanResult).props.result.status).toBe('success');
  await ReactTestRenderer.act(async () =>
    control('Scan next QR').props.onPress(),
  );
  await ReactTestRenderer.act(async () =>
    app.root
      .findByProps({ testID: 'qr-camera' })
      .props.codeScanner.onCodeScanned([{ value: 'ATTENDEE-123' }]),
  );
  expect(app.root.findByType(HomeScreen).props.scanFeedback.status).toBe(
    'duplicate',
  );
  expect(app.root.findByType(ScanResult).props.result.status).toBe('duplicate');
  await ReactTestRenderer.act(async () =>
    control('Close scan result').props.onPress(),
  );
  expect(app.root.findAllByType(ScanResult)).toHaveLength(0);
  expect(await getScanHistory('kit')).toHaveLength(1);
  expect(control('Scan tab').props.accessibilityState.selected).toBe(true);
  expect(app.root.findAllByType(DetailsScreen)).toHaveLength(0);
  expect(navigate).not.toHaveBeenCalled();
  await ReactTestRenderer.act(async () => {
    control('Scan tab').props.onPress();
  });
  expect(control('Scan QR for Kit')).toBeDefined();

  await ReactTestRenderer.act(async () => {
    app.unmount();
  });
});
