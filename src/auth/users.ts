import type { ServiceId } from '../types/services';

export type ScanUser = {
  username: string;
  feature: 'scan';
  service: ServiceId;
};
export type ServiceUser =
  | ScanUser
  | { username: string; feature: 'badge' }
  | { username: string; feature: 'spot' }
  | { username: string; feature: 'details' };

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
  return user ? findServiceUser(user.username) : null;
}
