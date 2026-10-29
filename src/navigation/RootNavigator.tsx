import { getSelectedEvent, type EventOption } from '../storage/event';
import { getLoginSession } from '../storage/session';
import type { ServiceUser } from '../auth/users';
import EventSelectionScreen from '../screens/EventSelection/EventSelectionScreen';
import RegistrationEditScreen from '../screens/RegistrationEdit/RegistrationEditScreen';
import ServiceDetailsScreen from '../screens/ServiceDetails/ServiceDetailsScreen';
import { colors } from '../theme/colors';
import React, { useEffect, useState } from 'react';
import SplashScreen from 'react-native-splash-screen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Login/LoginScreen';
import MainTabs from './MainTabs';
import { ROUTES } from './routes';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [startup, setStartup] = useState<{
    route: 'EventSelection' | 'Login' | 'Home';
    event?: EventOption;
    user?: ServiceUser;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function restore() {
      let event: EventOption | null = null;
      try {
        event = await getSelectedEvent();
      } catch {
        /* Allow selection again. */
      }
      if (!event) {
        if (active) {
          setStartup({ route: ROUTES.EVENT_SELECTION });
        }
        return;
      }
      let user: ServiceUser | null = null;
      try {
        user = await getLoginSession();
      } catch {
        /* Keep the event and request login. */
      }
      if (active) {
        setStartup(
          user
            ? { route: ROUTES.HOME, event, user }
            : { route: ROUTES.LOGIN, event },
        );
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (startup) {
      SplashScreen.hide();
    }
  }, [startup]);

  if (!startup) {
    return null;
  }

  return (
    <Stack.Navigator initialRouteName={startup.route}>
      <Stack.Screen
        name={ROUTES.EVENT_SELECTION}
        component={EventSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
        initialParams={startup.event ? { event: startup.event } : undefined}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.HOME}
        component={MainTabs}
        initialParams={startup.user ? { user: startup.user } : undefined}
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
