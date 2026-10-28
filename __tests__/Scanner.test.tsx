import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'react-native-vision-camera';
import ScannerScreen from '../src/screens/Scanner/ScannerScreen';

test('keeps camera closed when permission is denied and offers settings', async () => {
  const permission = jest
    .spyOn(Camera, 'getCameraPermissionStatus')
    .mockReturnValue('denied');
  let app!: ReactTestRenderer.ReactTestRenderer;
  const onScan = jest.fn();
  try {
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <ScannerScreen service="lunch" onClose={jest.fn()} onScan={onScan} />
        </SafeAreaProvider>,
      );
    });
    expect(app.root.findAllByProps({ testID: 'qr-camera' })).toHaveLength(0);
    expect(
      app.root.findAllByProps({ accessibilityLabel: 'Open camera settings' })
        .length,
    ).toBeGreaterThan(0);
    expect(onScan).not.toHaveBeenCalled();
  } finally {
    await ReactTestRenderer.act(async () => app.unmount());
    permission.mockRestore();
  }
});

test('does not capture QR codes while app is in the background', async () => {
  jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue('granted');
  AppState.currentState = 'background';
  const onScan = jest.fn();
  let app!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <ScannerScreen service="dinner" onClose={jest.fn()} onScan={onScan} />
      </SafeAreaProvider>,
    );
  });
  const camera = app.root.findByProps({ testID: 'qr-camera' });
  expect(camera.props.isActive).toBe(false);
  camera.props.codeScanner.onCodeScanned([{ value: 'QR-123' }]);
  expect(onScan).not.toHaveBeenCalled();
  await ReactTestRenderer.act(async () => app.unmount());
  AppState.currentState = 'active';
});
