import { eventStorageKey } from './event';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  findServiceUser,
  userFromRoles,
  type ServiceUser,
} from '../auth/users';

const SESSION_KEY = '@RegOK/session';

// Store the local demo login selection; never persist the password.
export async function saveLoginSession(user: ServiceUser): Promise<void> {
  await AsyncStorage.setItem(
    await eventStorageKey(SESSION_KEY),
    JSON.stringify(user),
  );
}

export async function getLoginSession(): Promise<ServiceUser | null> {
  const stored = await AsyncStorage.getItem(await eventStorageKey(SESSION_KEY));
  if (!stored) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('username' in parsed) ||
      typeof parsed.username !== 'string'
    ) {
      return null;
    }
    if ('roles' in parsed) {
      return userFromRoles(parsed.username, parsed.roles);
    }
    // Old API sessions stored guessed features without the server role.
    // Require a fresh login instead of restoring that incorrect access.
    if (!parsed.username.endsWith('_user')) {
      return null;
    }
    const user = findServiceUser(parsed.username);
    if (user) {
      if ('feature' in parsed && parsed.feature !== user.feature) {
        return null;
      }
      if (user.feature === 'scan') {
        return 'service' in parsed && parsed.service === user.service
          ? user
          : null;
      }
      return !('service' in parsed) ? user : null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function clearLoginSession(): Promise<void> {
  await AsyncStorage.removeItem(await eventStorageKey(SESSION_KEY));
  await AsyncStorage.removeItem('@RegOK/loggedIn');
}
