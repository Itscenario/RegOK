import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  findServiceUser,
  registerAuthenticatedUser,
  type ServiceUser,
} from '../auth/users';

const SESSION_KEY = '@RegOK/session';

// Store the local demo login selection; never persist the password.
export async function saveLoginSession(user: ServiceUser): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function getLoginSession(): Promise<ServiceUser | null> {
  const stored = await AsyncStorage.getItem(SESSION_KEY);
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

    // Authenticated API user not in local demo assignments
    if (
      'feature' in parsed &&
      parsed.feature === 'scan' &&
      'service' in parsed &&
      typeof parsed.service === 'string' &&
      ['kit', 'dinner', 'lunch'].includes(parsed.service)
    ) {
      const restoredUser = parsed as ServiceUser;
      registerAuthenticatedUser(restoredUser);
      return restoredUser;
    }
    if (
      'feature' in parsed &&
      typeof parsed.feature === 'string' &&
      ['badge', 'spot', 'details'].includes(parsed.feature) &&
      !('service' in parsed)
    ) {
      const restoredUser = parsed as ServiceUser;
      registerAuthenticatedUser(restoredUser);
      return restoredUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearLoginSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem('@RegOK/loggedIn');
}
