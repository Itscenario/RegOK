import React from 'react';
import { Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from '../src/screens/Login/LoginScreen';
import { ToastProvider } from '../src/components/ToastProvider';
import { loginService } from '../src/config/backend';
import type { ScreenProps } from '../src/navigation/types';

jest.mock('../src/config/backend', () => ({
  loginService: { login: jest.fn() },
  parseUserFromApiResponse: jest.fn(() => ({
    username: 'kit',
    feature: 'scan',
    service: 'kit',
  })),
}));
beforeEach(() => jest.clearAllMocks());

test.each([true, false])(
  'shows success=%s login toast from the API result',
  async success => {
    jest.mocked(loginService.login).mockResolvedValueOnce({
      status_api: success,
      status_msg: success ? 'Login success' : 'Invalid username or password',
      Data: success ? [{ UserName: 'kit' }] : [],
    });
    const replace = jest.fn();
    let app!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <ToastProvider>
            <LoginScreen
              route={{ key: 'Login', name: 'Login', params: undefined }}
              navigation={
                { replace } as unknown as ScreenProps<'Login'>['navigation']
              }
            />
          </ToastProvider>
        </SafeAreaProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      app.root
        .findAllByType(TextInput)
        .find(item => item.props.accessibilityLabel === 'Username')!
        .props.onChangeText('kit');
      app.root
        .findAllByType(TextInput)
        .find(item => item.props.accessibilityLabel === 'Password')!
        .props.onChangeText('123');
    });
    await ReactTestRenderer.act(async () => {
      await app.root
        .findAll(
          item =>
            item.props.accessibilityLabel === 'Sign in' &&
            typeof item.props.onPress === 'function',
        )[0]
        .props.onPress();
    });
    const text = app.root.findAllByType(Text).map(item => item.props.children);
    expect(text).toContain(
      success ? 'Login successful!' : 'Invalid username or password',
    );
    if (success) {
      expect(replace).toHaveBeenCalledWith('Home', expect.any(Object));
    } else {
      expect(replace).not.toHaveBeenCalled();
    }
    await ReactTestRenderer.act(async () => app.unmount());
  },
);
