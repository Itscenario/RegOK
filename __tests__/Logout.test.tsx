import { findServiceUser } from '../src/auth/users';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainTabs from '../src/navigation/MainTabs';
import type { ScreenProps } from '../src/navigation/types';
import { saveLoginSession, getLoginSession } from '../src/storage/session';

test('Details logout asks for confirmation, clears session and returns to Login', async () => {
  const user = findServiceUser('details_user')!;
  await saveLoginSession(user);
  const reset = jest.fn();
  let app!: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {
      app = ReactTestRenderer.create(
        <SafeAreaProvider>
          <MainTabs
            route={{ key: 'Home', name: 'Home', params: { user } }}
            navigation={
              { reset } as unknown as ScreenProps<'Home'>['navigation']
            }
          />
        </SafeAreaProvider>,
      );
    });
    const control = (label: string) =>
      app.root
        .findAll(item => typeof item.props.onPress === 'function')
        .find(item => item.props.accessibilityLabel === label)!;
    await ReactTestRenderer.act(async () => control('Log out').props.onPress());
    expect(reset).not.toHaveBeenCalled();
    expect(await getLoginSession()).toEqual(user);
    await ReactTestRenderer.act(async () =>
      control('Cancel logout').props.onPress(),
    );
    expect(reset).not.toHaveBeenCalled();
    expect(await getLoginSession()).toEqual(user);
    await ReactTestRenderer.act(async () => control('Log out').props.onPress());
    await ReactTestRenderer.act(async () => {
      await control('Confirm logout').props.onPress();
    });
    expect(await getLoginSession()).toBeNull();
    expect(reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } finally {
    await ReactTestRenderer.act(async () => app.unmount());
  }
});
