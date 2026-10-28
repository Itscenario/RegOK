import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppText } from '../../components';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { RegistrationDetails } from '../../types/registration';
import type { ScreenProps } from '../../navigation/types';

// Demo only. Replace through route.params.details or loadRegistration API callback.
const demoRegistration: RegistrationDetails = {
  id: 'DEMO-REG-001',
  name: '',
  food: '',
  foodOptions: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
  entitlements: [
    { id: 'lunch-1', label: 'Lunch', date: '2026-09-25', enabled: null },
    { id: 'lunch-2', label: 'Lunch', date: '2026-09-26', enabled: null },
    { id: 'dinner-1', label: 'Dinner', date: '2026-09-25', enabled: null },
    { id: 'dinner-2', label: 'Dinner', date: '2026-09-26', enabled: null },
    { id: 'lunch-3', label: 'Lunch', date: '2026-09-27', enabled: null },
    { id: 'kitbag', label: 'Kitbag', enabled: null },
  ],
};

type Props = ScreenProps<'RegistrationEdit'> & {
  loadRegistration?: (id?: string) => Promise<RegistrationDetails>;
  onUpdate?: (details: RegistrationDetails) => Promise<void>;
};
type Picker = { type: 'food' } | { type: 'entitlement'; id: string };
export function formatEntitlementDate(date?: string) {
  if (!date) {
    return '';
  }
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date,
  );
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
}

export default function RegistrationEditScreen({
  route,
  loadRegistration,
  onUpdate,
}: Props) {
  const initialData = route.params?.details;
  const registrationId = route.params?.registrationId;
  const attendeeName = route.params?.attendeeName;
  const demoMode = !initialData && !loadRegistration;
  const [registration, setRegistration] = useState<RegistrationDetails>(
    initialData ?? {
      ...demoRegistration,
      id: registrationId ?? demoRegistration.id,
      name: attendeeName ?? '',
    },
  );
  const [loading, setLoading] = useState(!!loadRegistration);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<'preview' | 'updated' | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const nameError =
    registration.name.trim().length < 2 || registration.name.trim().length > 100
      ? 'Enter a name with 2–100 characters.'
      : '';
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!loadRegistration) {
        setRegistration(
          initialData ?? {
            ...demoRegistration,
            id: registrationId ?? demoRegistration.id,
            name: attendeeName ?? '',
          },
        );
        setLoading(false);
        setLoadError(false);
        return;
      }
      setLoading(true);
      setLoadError(false);
      try {
        const response = await loadRegistration(registrationId);
        if (mounted) {
          setRegistration(response);
        }
      } catch {
        if (mounted) {
          setLoadError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [initialData, loadRegistration, registrationId, attendeeName, retryKey]);

  async function update() {
    if (loading || loadError || busyRef.current) {
      return;
    }
    Keyboard.dismiss();
    setSubmitted(true);
    setError('');
    if (registration.entitlements.some(item => item.enabled == null)) {
    }
    if (
      nameError ||
      registration.entitlements.some(item => item.enabled == null)
    ) {
      return;
    }
    if (!onUpdate || demoMode) {
      setNotice('preview');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await onUpdate({ ...registration, name: registration.name.trim() });
      setNotice('updated');
    } catch {
      setError(
        'Could not update the registration. Your changes are still here. Please try again.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const options = [
    { label: 'Please select', value: '' },
    ...(picker?.type === 'food'
      ? registration.foodOptions.filter(option => option.value !== '')
      : [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ]),
  ];
  const selectedEntitlement =
    picker?.type === 'entitlement'
      ? registration.entitlements.find(item => item.id === picker.id)?.enabled
      : null;
  const selectedValue =
    picker?.type === 'food'
      ? registration.food
      : selectedEntitlement === true
      ? 'yes'
      : selectedEntitlement === false
      ? 'no'
      : '';
  function select(value: string) {
    if (!picker) {
      return;
    }
    setRegistration(current =>
      picker.type === 'food'
        ? { ...current, food: value }
        : {
            ...current,
            entitlements: current.entitlements.map(item =>
              item.id === picker.id
                ? { ...item, enabled: value === '' ? null : value === 'yes' }
                : item,
            ),
          },
    );
    setPicker(null);
    setError('');
  }
  function openPicker(next: Picker) {
    Keyboard.dismiss();
    setPicker(next);
  }
  const enabledCount = registration.entitlements.filter(
    item => item.enabled,
  ).length;

  // API row binding: item.id, item.label, item.date and item.enabled.
  const renderRegistrationItem = ({
    item,
  }: ListRenderItemInfo<RegistrationDetails['entitlements'][number]>) => (
    <View style={styles.entitlementCard}>
      <View
        style={[styles.entitlementIcon, !item.enabled && styles.disabledIcon]}
      >
        <AppText style={styles.entitlementGlyph}>
          {item.label.toLowerCase().includes('dinner')
            ? '☾'
            : item.label.toLowerCase().includes('lunch')
            ? '☀'
            : '▣'}
        </AppText>
      </View>
      <View style={styles.entitlementCopy}>
        <AppText style={styles.entitlementTitle}>{item.label}</AppText>
        <AppText style={styles.entitlementDate}>
          {item.date ? formatEntitlementDate(item.date) : 'Event essentials'}
        </AppText>
      </View>
      <AppButton
        accessibilityLabel={`Edit ${item.label}${
          item.date ? ` ${item.date}` : ''
        }`}
        disabled={busy}
        onPress={() => openPicker({ type: 'entitlement', id: item.id })}
        style={[styles.yesNo, !item.enabled && styles.noButton]}
      >
        <AppText
          style={[styles.yesNoText, item.enabled == null && styles.placeholder]}
        >
          {item.enabled === true
            ? 'Yes'
            : item.enabled === false
            ? 'No'
            : 'Please select'}
        </AppText>
        <AppText style={styles.yesNoArrow}>⌄</AppText>
      </AppButton>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading || loadError ? (
          <View style={styles.loadState}>
            <AppText style={styles.loadTitle}>
              {loading
                ? 'Loading registration…'
                : 'Unable to load registration'}
            </AppText>
            {loadError && (
              <AppButton
                title="Retry"
                variant="primary"
                onPress={() => setRetryKey(value => value + 1)}
                style={styles.retryButton}
              />
            )}
          </View>
        ) : (
          <FlatList
            data={registration.entitlements}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            extraData={registration}
            ListHeaderComponent={
              <View>
                <View style={styles.topRow}>
                  <AppText style={styles.eyebrow}>ATTENDEE SETTINGS</AppText>
                  {demoMode && (
                    <View style={styles.demoPill}>
                      <AppText style={styles.demoText}>DEMO PREVIEW</AppText>
                    </View>
                  )}
                </View>
                <AppText style={styles.heading}>
                  Every detail,{'\n'}
                  <AppText style={styles.accent}>just right.</AppText>
                </AppText>
                <AppText style={styles.subtitle}>
                  Update attendee details, meals and kit eligibility.
                </AppText>
                <View style={styles.hero}>
                  <View style={styles.heroIcon}>
                    <AppText style={styles.heroIconText}>▣</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText style={styles.heroTitle}>
                      Registration Details
                    </AppText>
                  </View>
                </View>
                <View style={styles.profileCard}>
                  <AppText style={styles.sectionTitle}>
                    Attendee information
                  </AppText>
                  <AppText style={styles.label}>
                    Name<AppText style={styles.required}> *</AppText>
                  </AppText>
                  <TextInput
                    accessibilityLabel="Registration name"
                    value={registration.name}
                    onChangeText={name => {
                      setRegistration(current => ({ ...current, name }));
                      setError('');
                    }}
                    placeholder="Enter attendee name"
                    placeholderTextColor={colors.placeholder}
                    autoCorrect={false}
                    maxLength={100}
                    style={styles.input}
                    editable={!busy}
                  />
                  {submitted && !!nameError && (
                    <AppText
                      accessibilityLiveRegion="polite"
                      style={styles.error}
                    >
                      {nameError}
                    </AppText>
                  )}
                  <AppText style={[styles.label, styles.foodLabel]}>
                    Food<AppText style={styles.required}> *</AppText>
                  </AppText>
                  <AppButton
                    accessibilityLabel="Select food preference"
                    disabled={busy}
                    onPress={() => openPicker({ type: 'food' })}
                    style={styles.foodSelect}
                  >
                    <AppText
                      style={[
                        styles.foodText,
                        !registration.food && styles.placeholder,
                      ]}
                    >
                      {registration.foodOptions.find(
                        option => option.value === registration.food,
                      )?.label || 'Please select'}
                    </AppText>
                    <AppText style={styles.chevron}>⌄</AppText>
                  </AppButton>
                </View>
                <View style={styles.sectionRow}>
                  <View>
                    <AppText style={styles.sectionTitle}>Meals & kit</AppText>
                    <AppText style={styles.sectionNote}>
                      Choose what’s included for this attendee.
                    </AppText>
                  </View>
                  <View style={styles.counter}>
                    <AppText style={styles.counterText}>
                      {enabledCount}/{registration.entitlements.length}
                    </AppText>
                  </View>
                </View>
              </View>
            }
            renderItem={renderRegistrationItem}
            ListFooterComponent={
              <View style={styles.footer}>
                {!!error && (
                  <AppText accessibilityRole="alert" style={styles.error}>
                    {error}
                  </AppText>
                )}
                <AppButton
                  variant="primary"
                  accessibilityLabel="Update registration details"
                  loading={busy}
                  onPress={update}
                  style={styles.updateButton}
                >
                  <AppText style={styles.updateText}>
                    Update registration
                  </AppText>
                  <AppText style={styles.updateArrow}>→</AppText>
                </AppButton>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
      <Modal
        transparent
        visible={!!picker}
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.overlay}>
          <AppButton
            accessibilityLabel="Dismiss registration options"
            onPress={() => setPicker(null)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <AppText accessibilityRole="header" style={styles.modalTitle}>
                {picker?.type === 'food'
                  ? 'Food preference'
                  : 'Included for attendee?'}
              </AppText>
              <AppButton
                accessibilityLabel="Close registration options"
                onPress={() => setPicker(null)}
                style={styles.closeButton}
              >
                <AppText style={styles.closeText}>×</AppText>
              </AppButton>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <AppButton
                  accessibilityRole="radio"
                  accessibilityLabel={item.label}
                  accessibilityState={{ checked: selectedValue === item.value }}
                  onPress={() => select(item.value)}
                  style={[
                    styles.option,
                    selectedValue === item.value && styles.selectedOption,
                  ]}
                >
                  <AppText style={styles.optionText}>{item.label}</AppText>
                  <AppText style={styles.radio}>
                    {selectedValue === item.value ? '●' : '○'}
                  </AppText>
                </AppButton>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={!!notice}
        animationType="fade"
        onRequestClose={() => setNotice(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.noticeIcon}>
              <AppText style={styles.noticeIconText}>
                {notice === 'updated' ? '✓' : '▣'}
              </AppText>
            </View>
            <AppText accessibilityRole="header" style={styles.noticeTitle}>
              {notice === 'updated'
                ? 'Registration updated'
                : 'Changes previewed'}
            </AppText>
            <AppText style={styles.noticeText}>
              {notice === 'updated'
                ? 'Your registration changes were submitted successfully.'
                : 'Your selections are shown in this form. Update API is not connected; nothing has been saved.'}
            </AppText>
            <AppButton
              title="Back to details"
              variant="primary"
              accessibilityLabel="Close update message"
              onPress={() => setNotice(null)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    paddingBottom: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  eyebrow: {
    color: colors.eyebrow,
    fontSize: typography.size.s9,
    letterSpacing: 1.5,
    fontWeight: typography.weight.bold,
  },
  demoPill: {
    borderRadius: 7,
    backgroundColor: colors.selectedTab,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  demoText: {
    color: colors.headingGreen,
    fontSize: typography.size.s7,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  heading: {
    color: colors.ink,
    fontSize: typography.size.s33,
    lineHeight: typography.lineHeight.l40,
    fontWeight: typography.weight.bold,
    letterSpacing: -1,
    marginTop: 20,
  },
  accent: { color: colors.headingGreen },
  subtitle: {
    color: colors.muted,
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l21,
    marginTop: 10,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.ink,
    padding: 20,
    borderRadius: 22,
    marginVertical: 25,
  },
  heroIcon: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { color: colors.ink, fontSize: typography.size.s28 },
  heroTitle: {
    color: colors.white,
    fontSize: typography.size.s18,
    fontWeight: typography.weight.semibold,
  },
  heroNote: {
    color: colors.bannerMuted,
    fontSize: typography.size.s11,
    marginTop: 6,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: typography.size.s18,
    color: colors.ink,
    fontWeight: typography.weight.bold,
  },
  label: {
    color: colors.label,
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
    marginTop: 20,
    marginBottom: 9,
  },
  required: { color: colors.headingGreen },
  input: {
    color: colors.ink,
    fontSize: typography.size.s14,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 54,
  },
  foodLabel: { marginTop: 18 },
  foodSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 13,
  },
  foodText: { flex: 1, fontSize: typography.size.s14, color: colors.ink },
  placeholder: { color: colors.placeholder },
  chevron: { color: colors.headingGreen, fontSize: typography.size.s23 },
  error: {
    color: colors.error,
    fontSize: typography.size.s11,
    lineHeight: typography.lineHeight.l16,
    textAlign: 'right',
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  sectionNote: {
    fontSize: typography.size.s10,
    lineHeight: typography.lineHeight.l16,
    color: colors.muted,
    marginTop: 5,
  },
  counter: {
    backgroundColor: colors.selectedTab,
    borderRadius: 10,
    padding: 10,
  },
  counterText: {
    fontSize: typography.size.s12,
    color: colors.headingGreen,
    fontWeight: typography.weight.bold,
  },
  entitlementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginBottom: 12,
  },
  entitlementIcon: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.lunchBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledIcon: { backgroundColor: colors.pendingBackground },
  entitlementGlyph: { fontSize: typography.size.s25, color: colors.lunchInk },
  entitlementCopy: { flex: 1 },
  entitlementTitle: {
    color: colors.ink,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.semibold,
  },
  entitlementDate: {
    fontSize: typography.size.s11,
    color: colors.muted,
    marginTop: 5,
  },
  yesNo: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: colors.successBackground,
  },
  noButton: { backgroundColor: colors.pendingBackground },
  yesNoText: {
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
    color: colors.ink,
  },
  yesNoArrow: { fontSize: typography.size.s18, color: colors.headingGreen },
  footer: { marginTop: 12 },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateText: {
    fontSize: typography.size.s15,
    fontWeight: typography.weight.bold,
    color: colors.buttonText,
  },
  updateArrow: { fontSize: typography.size.s25, color: colors.buttonText },
  footerNote: {
    color: colors.muted,
    fontSize: typography.size.s10,
    lineHeight: typography.lineHeight.l16,
    textAlign: 'center',
    marginTop: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    maxHeight: '85%',
    maxWidth: 440,
    width: '100%',
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    flex: 1,
  },
  closeButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: typography.size.s27, color: colors.ink },
  option: {
    minHeight: 52,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedOption: { backgroundColor: colors.selectedTab },
  optionText: { color: colors.ink, fontSize: typography.size.s14 },
  radio: { fontSize: typography.size.s20, color: colors.headingGreen },
  noticeIcon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    backgroundColor: colors.selectedTab,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noticeIconText: { color: colors.headingGreen, fontSize: typography.size.s33 },
  noticeTitle: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  noticeText: {
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l21,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 18,
  },
  loadState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadTitle: { color: colors.ink, fontSize: typography.size.s16 },
  retryButton: { marginTop: 20 },
});
