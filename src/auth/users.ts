import type { ServiceId } from '../types/services';

export type RoleId = 0 | 1 | 2 | 3 | 4;
type ApiAccess = { roles?: RoleId[] };

export type ScanUser = ApiAccess & {
  username: string;
  feature: 'scan';
  service: ServiceId;
};
export type ServiceUser = ApiAccess &
  (
    | ScanUser
    | { username: string; feature: 'badge' }
    | { username: string; feature: 'spot' }
    | { username: string; feature: 'details' }
  );

// Local demo accounts only. Replace with authenticated roles when APIs are connected.
const assignments: Record<
  string,
  | Omit<ScanUser, 'username'>
  | { feature: 'badge' }
  | { feature: 'spot' }
  | { feature: 'details' }
> = {
  kit_user: { feature: 'scan', service: 'kit' },
  dinner_user: { feature: 'scan', service: 'dinner' },
  lunch_user: { feature: 'scan', service: 'lunch' },
  badge_user: { feature: 'badge' },
  spot_user: { feature: 'spot' },
  details_user: { feature: 'details' },
  kit: { feature: 'scan', service: 'kit' },
  lunch: { feature: 'scan', service: 'lunch' },
  dinner: { feature: 'scan', service: 'dinner' },
  razaul: { feature: 'details' },
};

const dynamicUsers: Record<
  string,
  | Omit<ScanUser, 'username'>
  | { feature: 'badge' }
  | { feature: 'spot' }
  | { feature: 'details' }
> = {};

export function registerAuthenticatedUser(user: ServiceUser): void {
  const normalized = user.username.trim().toLowerCase();
  if (user.feature === 'scan') {
    dynamicUsers[normalized] = { feature: 'scan', service: user.service };
  } else {
    dynamicUsers[normalized] = { feature: user.feature };
  }
}

export function findServiceUser(username: string): ServiceUser | null {
  const normalized = username.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(assignments, normalized)) {
    return { username: normalized, ...assignments[normalized] };
  }
  if (Object.prototype.hasOwnProperty.call(dynamicUsers, normalized)) {
    return { username: normalized, ...dynamicUsers[normalized] };
  }
  return null;
}

// Resolve locally assigned demo access or authenticated API users.
export function resolveUser(user: ServiceUser | undefined): ServiceUser | null {
  if (!user) {
    return null;
  }
  if (user.roles) {
    try {
      return userFromRoles(user.username, user.roles);
    } catch {
      return null;
    }
  }
  return findServiceUser(user.username);
}

// Backend role IDs: 0 Spot Registration, 1 Badge Print, 2 Lunch, 3 Dinner, 4 Kitbag.
export function userFromRoles(username: string, value: unknown): ServiceUser {
  const parts = Array.isArray(value) ? value : String(value ?? '').split('|');
  const roles = [
    ...new Set(
      parts
        .filter(
          part =>
            (typeof part === 'string' || typeof part === 'number') &&
            String(part).trim() !== '',
        )
        .map(part => Number(String(part).trim())),
    ),
  ].filter((role): role is RoleId => [0, 1, 2, 3, 4].includes(role));
  if (!username.trim() || !roles.length) {
    throw new Error(
      `No supported access role assigned to this account (role: ${String(
        value ?? 'missing',
      )}). Please contact your administrator.`,
    );
  }
  const services = servicesForRoles(roles);
  const common = { username: username.trim().toLowerCase(), roles };
  if (services.length) {
    return { ...common, feature: 'scan', service: services[0] };
  }
  return { ...common, feature: roles.includes(1) ? 'badge' : 'spot' };
}

function servicesForRoles(roles: RoleId[]): ServiceId[] {
  return (
    [
      ['kit', 4],
      ['dinner', 3],
      ['lunch', 2],
    ] as const
  )
    .filter(([, role]) => roles.includes(role))
    .map(([service]) => service);
}

export function allowedServices(user: ServiceUser): ServiceId[] {
  if (user.roles) {
    return servicesForRoles(user.roles);
  }
  if (user.feature === 'details') {
    return ['kit', 'dinner', 'lunch'];
  }
  return user.feature === 'scan' ? [user.service] : [];
}

export function canUseFeature(
  user: ServiceUser,
  feature: 'scan' | 'badge' | 'spot' | 'details',
): boolean {
  if (user.roles) {
    if (feature === 'scan') {
      return allowedServices(user).length > 0;
    }
    if (feature === 'badge') {
      return user.roles.includes(1);
    }
    if (feature === 'spot') {
      return user.roles.includes(0);
    }
    return false;
  }
  return user.feature === 'details' || user.feature === feature;
}
