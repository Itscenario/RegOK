import ScanResult from '../components/ScanResult';
import {
  resolveUser,
  allowedServices,
  canUseFeature,
  type ServiceUser,
} from '../auth/users';
import LogoutModal from '../components/LogoutModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpotRegistrationScreen from '../screens/SpotRegistration/SpotRegistrationScreen';
import { getScanHistory, recordScan } from '../storage/scans';
import type { ScreenProps } from './types';
import { ROUTES } from './routes';
import { clearLoginSession } from '../storage/session';
import { typography } from '../theme/typography';
import { AppText, AppButton } from '../components';
import { colors } from '../theme/colors';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/Home/HomeScreen';
import BadgeScreen from '../screens/Badge/BadgeScreen';
import DetailsScreen from '../screens/Details/DetailsScreen';
import ScannerScreen from '../screens/Scanner/ScannerScreen';
import type { ScanFeedback, ScanRecord, ServiceId } from '../types/services';

export default function MainTabs({ route, navigation }: ScreenProps<'Home'>) {
  const user = resolveUser(route?.params?.user);
  const validUser = user !== null;
  useEffect(() => {
    if (!validUser) {
      navigation.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
    }
  }, [validUser, navigation]);
  if (!user) {
    return null;
  }
  return (
    <FeatureTabs key={user.username} user={user} navigation={navigation} />
  );
}

function FeatureTabs({
  user,
  navigation,
}: {
  user: ServiceUser;
  navigation: ScreenProps<'Home'>['navigation'];
}) {
  const services = allowedServices(user);
  const servicesKey = services.join('|');
  type TabName = 'Scan' | 'Badge Print' | 'Spot Registration' | 'Details';
  const visibleTabs: TabName[] = [];
  if (canUseFeature(user, 'scan')) {
    visibleTabs.push('Scan');
  }
  if (canUseFeature(user, 'badge')) {
    visibleTabs.push('Badge Print');
  }
  if (canUseFeature(user, 'spot')) {
    visibleTabs.push('Spot Registration');
  }
  if (canUseFeature(user, 'details')) {
    visibleTabs.push('Details');
  }
  const defaultTab = user.feature === 'details' ? 'Details' : visibleTabs[0];
  const [selectedTab, setSelectedTab] = useState<TabName>(defaultTab);
  const tab = visibleTabs.includes(selectedTab) ? selectedTab : defaultTab;
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [service, setService] = useState<ServiceId | null>(null);
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const logoutInProgress = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const insets = useSafeAreaInsets();

  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const historyReady = useRef(false);
  const processingScan = useRef(false);

  useEffect(() => {
    let mounted = true;
    historyReady.current = false;
    const servicesToLoad = servicesKey
      .split('|')
      .filter(Boolean) as ServiceId[];
    if (!servicesToLoad.length) {
      return;
    }
    Promise.all(servicesToLoad.map(getScanHistory))
      .then(groups => groups.flat())
      .then(history => {
        if (mounted) {
          setRecords(history);
          historyReady.current = true;
        }
      })
      .catch(() => {
        if (mounted) {
          Alert.alert(
            'Scan history unavailable',
            'Please reopen the app to retry. Scanning is paused to avoid duplicate entries.',
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, [servicesKey]);

  async function addScan(value: string) {
    if (
      !service ||
      !services.includes(service) ||
      processingScan.current ||
      !historyReady.current
    ) {
      return;
    }
    processingScan.current = true;
    const selected = service;
    try {
      const result = await recordScan(selected, value);
      setRecords(current => [
        ...result.history,
        ...current.filter(record => record.service !== selected),
      ]);
      setScanFeedback(
        result.status === 'success'
          ? {
              status: 'success',
              title: 'Scan recorded successfully',
              message: `QR saved for ${selected}. Collection has been recorded.`,
            }
          : {
              status: 'duplicate',
              title: 'Duplicate QR code',
              message: `This QR was already scanned for ${selected}${
                result.record.scannedAt
                  ? ` on ${new Date(result.record.scannedAt).toLocaleString()}`
                  : ''
              }. No new entry was added.`,
            },
      );
    } catch {
      setScanFeedback({
        status: 'error',
        title: 'Scan not saved',
        message: 'Could not check or save this QR. Please try again.',
      });
    } finally {
      processingScan.current = false;
    }
  }

  function openScanner(selected: ServiceId) {
    if (!historyReady.current || processingScan.current) {
      Alert.alert(
        'Please wait',
        'Scan history is not ready yet. Please try again.',
      );
      return;
    }
    setScanFeedback(null);
    if (services.includes(selected)) {
      setService(selected);
    }
  }

  async function logout() {
    if (logoutInProgress.current) {
      return;
    }
    logoutInProgress.current = true;
    setIsLoggingOut(true);
    try {
      await clearLoginSession();
      navigation.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
    } catch {
      Alert.alert('Unable to sign out', 'Please try again.');
    } finally {
      logoutInProgress.current = false;
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      {(tab === 'Badge Print' || tab === 'Spot Registration') && (
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={styles.accountHeader}
        >
          <AppButton
            title="Log out"
            variant="secondary"
            accessibilityLabel="Log out"
            onPress={() => setLogoutVisible(true)}
            style={styles.accountLogout}
          />
        </SafeAreaView>
      )}
      {tab === 'Spot Registration' ? (
        <SpotRegistrationScreen />
      ) : tab === 'Badge Print' ? (
        <BadgeScreen
          onEditBadge={item => {
            if (!canUseFeature(user, 'badge')) {
              return;
            }
            navigation.navigate(ROUTES.REGISTRATION_EDIT, {
              registrationId: item.id,
              attendeeName: item.name,
              details: item.registrationDetails,
            });
          }}
        />
      ) : canUseFeature(user, 'scan') && tab === 'Scan' ? (
        <HomeScreen
          user={user}
          onSelect={openScanner}
          count={records.length}
          onAccountPress={() => setLogoutVisible(true)}
          scanFeedback={scanFeedback}
          onDismissFeedback={() => setScanFeedback(null)}
        />
      ) : (
        <DetailsScreen
          onViewDetails={selected => {
            if (!canUseFeature(user, 'details')) {
              return;
            }
            navigation.navigate(ROUTES.SERVICE_DETAILS, {
              serviceId: selected,
              records: records.filter(record => record.service === selected),
            });
          }}
          onLogout={logout}
          isLoggingOut={isLoggingOut}
          records={records}
        />
      )}
      <View
        style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        {visibleTabs.map(name => (
          <AppButton
            key={name}
            accessibilityRole="tab"
            accessibilityLabel={`${name} tab`}
            accessibilityState={{ selected: tab === name }}
            onPress={() => {
              setSelectedTab(name);
            }}
            style={styles.tab}
          >
            <View style={[styles.tabInner, tab !== name && styles.inactiveTab]}>
              <AppText
                style={[styles.icon, tab !== name && styles.inactiveText]}
              >
                {name === 'Scan'
                  ? '▦'
                  : name === 'Badge Print'
                  ? '▣'
                  : name === 'Details'
                  ? '▤'
                  : '+'}
              </AppText>
              <AppText
                style={[styles.label, tab !== name && styles.inactiveText]}
              >
                {name}
              </AppText>
            </View>
          </AppButton>
        ))}
      </View>
      <LogoutModal
        visible={logoutVisible}
        isLoggingOut={isLoggingOut}
        onClose={() => {
          if (!isLoggingOut) {
            setLogoutVisible(false);
          }
        }}
        onLogout={logout}
      />
      <Modal
        visible={service !== null}
        animationType="slide"
        onRequestClose={() => {
          if (!processingScan.current) {
            setService(null);
          }
        }}
        presentationStyle="fullScreen"
      >
        {service &&
          (scanFeedback ? (
            <ScanResult
              result={scanFeedback}
              onDone={() => setService(null)}
              onScanNext={() => setScanFeedback(null)}
            />
          ) : (
            <ScannerScreen
              service={service}
              onClose={() => {
                if (!processingScan.current) {
                  setService(null);
                }
              }}
              onScan={addScan}
            />
          ))}
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  accountHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  accountLogout: { minHeight: 44, paddingHorizontal: 14 },
  container: { flex: 1, backgroundColor: colors.background },
  inactiveTab: { backgroundColor: colors.white },
  inactiveText: { color: colors.inactiveTab },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  tabInner: {
    width: '100%',
    maxWidth: 180,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: colors.selectedTab,
  },
  icon: {
    fontSize: typography.size.s24,
    lineHeight: typography.lineHeight.l28,
    color: colors.activeTabText,
  },
  label: {
    fontSize: typography.size.s10,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    color: colors.activeTabText,
  },
});
