import type { EventOption } from '../storage/event';
import type { RegistrationDetails } from '../types/registration';
import type { ScanRecord, ServiceId } from '../types/services';
import type { ServiceUser } from '../auth/users';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROUTES } from './routes';

export type RootStackParamList = {
  [ROUTES.REGISTRATION_EDIT]:
    | {
        registrationId?: string;
        attendeeName?: string;
        details?: RegistrationDetails;
      }
    | undefined;
  [ROUTES.SERVICE_DETAILS]: { serviceId: ServiceId; records: ScanRecord[] };
  [ROUTES.EVENT_SELECTION]: undefined;
  [ROUTES.LOGIN]: { event?: EventOption } | undefined;
  [ROUTES.HOME]: { user: ServiceUser };
};

export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
