import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppText } from '../../components';
import { useToast } from '../../components/ToastProvider';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  getSelectedEvent,
  selectEvent,
  type EventOption,
} from '../../storage/event';
import { getLoginSession } from '../../storage/session';
import type { ScreenProps } from '../../navigation/types';
import { ROUTES } from '../../navigation/routes';

// Replace this list with the event API response when the endpoint is available.
const events: EventOption[] = [
  {
    id: 'corporate-event',
    name: 'Corporate Event',
    venue: 'Conference & networking',
  },
  {
    id: 'medical-conference',
    name: 'Medical Conference',
    venue: 'Learning & collaboration',
  },
];

type Props = ScreenProps<'EventSelection'> & { eventData?: EventOption[] };

export default function EventSelectionScreen({
  navigation,
  eventData = events,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const touched = useRef(false);
  const submitting = useRef(false);
  const showToast = useToast();
  const selected = eventData.find(item => item.id === selectedId);

  useEffect(() => {
    let active = true;
    getSelectedEvent()
      .then(event => {
        if (active && !touched.current) {
          setSelectedId(event?.id ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleContinue = async () => {
    if (!selected || submitting.current) {
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await selectEvent(selected);
      const session = await getLoginSession();
      if (session) {
        navigation.replace(ROUTES.HOME, { user: session });
      } else {
        navigation.replace(ROUTES.LOGIN, { event: selected });
      }
    } catch {
      showToast('Could not select the event. Please try again.', 'error');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const renderEventItem: ListRenderItem<EventOption> = ({ item, index }) => {
    const active = item.id === selectedId;
    return (
      <AppButton
        accessibilityLabel={`Select ${item.name}`}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        disabled={busy}
        onPress={() => {
          touched.current = true;
          setSelectedId(item.id);
        }}
        style={[styles.eventCard, active && styles.selectedCard]}
      >
        <View style={[styles.eventIcon, active && styles.selectedIcon]}>
          <AppText style={styles.eventNumber}>
            {String(index + 1).padStart(2, '0')}
          </AppText>
        </View>
        <View style={styles.eventInfo}>
          <AppText style={styles.eventName}>{item.name}</AppText>
          {!!item.venue && (
            <AppText style={styles.eventMeta}>{item.venue}</AppText>
          )}
          {!!item.dateLabel && (
            <AppText style={styles.eventMeta}>{item.dateLabel}</AppText>
          )}
        </View>
        <View style={[styles.radio, active && styles.activeRadio]}>
          {active && <View style={styles.radioDot} />}
        </View>
      </AppButton>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={eventData}
        keyExtractor={item => item.id}
        renderItem={renderEventItem}
        extraData={[selectedId, busy]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <AppText style={styles.logoText}>R</AppText>
              </View>
              <AppText style={styles.brand}>
                RegOK<AppText style={styles.accent}>.</AppText>
              </AppText>
              <View style={styles.step}>
                <AppText style={styles.stepText}>GET STARTED</AppText>
              </View>
            </View>
            <View style={styles.hero}>
              <AppText style={styles.eyebrow}>ONE APP. EVERY EVENT.</AppText>
              <AppText style={styles.title}>
                Your event.{'\n'}
                <AppText style={styles.accent}>Your workspace.</AppText>
              </AppText>
              <AppText style={styles.subtitle}>
                Choose the event you’re working at to continue.
              </AppText>
            </View>
            <View style={styles.sectionRow}>
              <AppText style={styles.sectionTitle}>Select an event</AppText>
              <AppText style={styles.count}>
                {eventData.length} available
              </AppText>
            </View>
          </>
        }
        ListEmptyComponent={
          <AppText style={styles.subtitle}>
            No events available right now.
          </AppText>
        }
        ListFooterComponent={
          <>
            {eventData === events && (
              <AppText style={styles.demoNote}>
                Sample events · Event list will be connected to the API.
              </AppText>
            )}
            <View style={styles.footer}>
              <AppButton
                title="Continue"
                variant="primary"
                accessibilityLabel="Continue to selected event"
                loading={busy}
                disabled={!selected || busy}
                onPress={handleContinue}
                style={styles.continueButton}
              />
              <AppText style={styles.hint}>
                Your access is based on the account you sign in with.
              </AppText>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundDark },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  logoText: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.extraBold,
    color: colors.ink,
  },
  brand: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.extraBold,
    color: colors.white,
  },
  accent: { color: colors.primary },
  step: {
    marginLeft: 'auto',
    backgroundColor: colors.cameraControl,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepText: {
    fontSize: typography.size.s9,
    letterSpacing: 1,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  hero: { paddingTop: 48, paddingBottom: 34 },
  eyebrow: {
    fontSize: typography.size.s10,
    letterSpacing: 2,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginBottom: 16,
  },
  title: {
    fontSize: typography.size.s34,
    lineHeight: typography.lineHeight.l40,
    letterSpacing: -1.2,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.size.s14,
    lineHeight: typography.lineHeight.l21,
    color: colors.subtitleDark,
    marginTop: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.size.s16,
    fontWeight: typography.weight.bold,
  },
  count: { color: colors.overviewMuted, fontSize: typography.size.s12 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.cameraControl,
    borderWidth: 1.5,
    borderColor: colors.dividerDark,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: colors.permissionBackground,
    borderColor: colors.primary,
  },
  eventIcon: {
    width: 44,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dividerDark,
  },
  selectedIcon: { backgroundColor: colors.iconGreen },
  eventNumber: {
    color: colors.primary,
    fontSize: typography.size.s18,
    fontWeight: typography.weight.bold,
  },
  eventInfo: { flex: 1 },
  eventName: {
    color: colors.white,
    fontSize: typography.size.s16,
    fontWeight: typography.weight.bold,
  },
  eventMeta: {
    color: colors.subtitleDark,
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l19,
    marginTop: 4,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.scannerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRadio: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  demoNote: {
    color: colors.footerText,
    fontSize: typography.size.s11,
    lineHeight: typography.lineHeight.l17,
    marginTop: 4,
  },
  footer: { marginTop: 28 },
  continueButton: { minHeight: 58, borderRadius: 16 },
  hint: {
    textAlign: 'center',
    color: colors.footerText,
    fontSize: typography.size.s11,
    lineHeight: typography.lineHeight.l17,
    marginTop: 14,
    paddingHorizontal: 16,
  },
});
