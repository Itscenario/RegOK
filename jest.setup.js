/* global jest */
jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-vision-camera', () => {
  const { View } = require('react-native');
  return {
    Camera: Object.assign(View, {
      getCameraPermissionStatus: jest.fn(() => 'granted'),
    }),
    useCameraDevice: () => ({ id: 'back', hasTorch: true }),
    useCameraPermission: () => ({
      hasPermission: true,
      requestPermission: jest.fn(async () => true),
    }),
    useCodeScanner: config => config,
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
