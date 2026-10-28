import RegistrationEditScreen from '../screens/RegistrationEdit/RegistrationEditScreen';
import ServiceDetailsScreen from '../screens/ServiceDetails/ServiceDetailsScreen';
import { colors } from '../theme/colors';
import type { ServiceUser } from '../auth/users';
import React, { useEffect, useState } from 'react';
import SplashScreen from 'react-native-splash-screen';
import { getLoginSession } from '../storage/session';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Login/LoginScreen';
import MainTabs from './MainTabs';
import { ROUTES } from './routes';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Home' | null>(
    null,
  );

  const [user, setUser] = useState<ServiceUser | null>(null);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      let session: ServiceUser | null = null;
      try {
        session = await getLoginSession();
      } catch {
        // A missing or unreadable session should return to Login.
      }
      if (mounted) {
        setUser(session);
        setInitialRoute(session ? ROUTES.HOME : ROUTES.LOGIN);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialRoute !== null) {
      SplashScreen.hide();
    }
  }, [initialRoute]);

  if (initialRoute === null) {
    return null;
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.HOME}
        component={MainTabs}
        initialParams={user ? { user } : undefined}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SERVICE_DETAILS}
        component={ServiceDetailsScreen}
        options={({ route }) => ({
          title: `${route.params.serviceId[0].toUpperCase()}${route.params.serviceId.slice(
            1,
          )} details`,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        })}
      />
      <Stack.Screen
        name={ROUTES.REGISTRATION_EDIT}
        component={RegistrationEditScreen}
        options={{
          title: 'Registration Details',
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
