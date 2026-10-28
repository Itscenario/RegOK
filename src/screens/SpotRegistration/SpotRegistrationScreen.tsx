import React, { useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppText } from '../../components';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const memberTypes = [
  'Faculty',
  'Delegate',
  'Accompanying',
  'Event Manager',
  'Exhibitor',
  'Past President',
  'DOS Staff',
  'Without Food',
  'Senior Citizen',
] as const;
const paymentOptions = ['Cash', 'Unpaid', 'Online Paid'] as const;
export type SpotRegistrationValues = {
  memberType: string;
  name: string;
  msno: string;
  mobile: string;
  email: string;
  amount: string;
  paymentStatus: string;
  state: string;
  notes: string;
};
type Errors = Partial<Record<keyof SpotRegistrationValues, string>>;
const emptyForm: SpotRegistrationValues = {
  memberType: '',
  name: '',
  msno: '',
  mobile: '',
  email: '',
  amount: '',
  paymentStatus: 'Cash',
  state: '',
  notes: '',
};

export function validateSpotRegistration(
  values: SpotRegistrationValues,
): Errors {
  const errors: Errors = {};
  if (!memberTypes.some(type => type === values.memberType)) {
    errors.memberType = 'Please select a member type.';
  }
  if (
    values.name.trim().length < 2 ||
    values.name.trim().length > 100 ||
    !/\p{L}/u.test(values.name) ||
    !/^[\p{L}\p{M} .’'()-]+$/u.test(values.name.trim())
  ) {
    errors.name = 'Enter a valid full name (2–100 characters).';
  }
  if (
    values.email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  ) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9 /._-]{0,39}$/.test(values.msno.trim())) {
    errors.msno =
      'Enter MSNO using letters, numbers, spaces, /, . , _ or - (up to 40 characters).';
  }
  if (
    values.state.trim().length < 2 ||
    values.state.trim().length > 100 ||
    !/\p{L}/u.test(values.state) ||
    !/^[\p{L}\p{M} .’'()-]+$/u.test(values.state.trim())
  ) {
    errors.state = 'Enter a valid state name (2–100 characters).';
  }
  if (!values.notes.trim()) {
    errors.notes = 'Please enter notes. Use N/A if there are no comments.';
  } else if (values.notes.trim().length > 1000) {
    errors.notes = 'Notes must be 1000 characters or fewer.';
  }
  const digits = values.mobile.replace(/\D/g, '');
  if (
    !/^\+?[\d\s()-]+$/.test(values.mobile.trim()) ||
    digits.length < 10 ||
    digits.length > 15
  ) {
    errors.mobile = 'Please enter a valid mobile number (10–15 digits).';
  }
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(values.amount.trim())) {
    errors.amount =
      'Enter a valid amount: up to 9 digits and 2 decimal places.';
  }
  if (!paymentOptions.some(option => option === values.paymentStatus)) {
    errors.paymentStatus = 'Please select a payment status.';
  }
  return errors;
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  maxLength?: number;
  prefix?: string;
};
function FormField({ label, error, required, prefix, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>
        {label}
        {required && <AppText style={styles.required}> *</AppText>}
      </AppText>
      <View style={[styles.inputWrap, props.multiline && styles.notesWrap]}>
        {prefix && <AppText style={styles.inputPrefix}>{prefix}</AppText>}
        <TextInput
          {...props}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
          autoCapitalize={
            props.keyboardType === 'email-address' ? 'none' : 'words'
          }
          style={[styles.input, props.multiline && styles.notesInput]}
        />
      </View>
      {!!error && (
        <AppText accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}

type Props = { onSubmit?: (values: SpotRegistrationValues) => Promise<void> };
export default function SpotRegistrationScreen({ onSubmit }: Props = {}) {
  const [form, setForm] = useState<SpotRegistrationValues>({ ...emptyForm });
  const [submitted, setSubmitted] = useState(false);
  const [picker, setPicker] = useState<'memberType' | 'paymentStatus' | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<'preview' | 'saved' | null>(null);
  const listRef = useRef<FlatList<string>>(null);
  const errors = submitted ? validateSpotRegistration(form) : {};
  function update(key: keyof SpotRegistrationValues, value: string) {
    setForm(current => ({ ...current, [key]: value }));
    setFormError('');
  }
  function openPicker(type: 'memberType' | 'paymentStatus') {
    Keyboard.dismiss();
    setPicker(type);
  }
  async function submit() {
    if (busyRef.current) {
      return;
    }
    Keyboard.dismiss();
    setSubmitted(true);
    setFormError('');
    if (Object.keys(validateSpotRegistration(form)).length) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }
    if (!onSubmit) {
      setResult('preview');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const values = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      ) as SpotRegistrationValues;
      await onSubmit(values);
      setResult('saved');
    } catch {
      setFormError(
        'Could not submit this registration. Your entries are still here. Please try again.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const pickerOptions =
    picker === 'memberType' ? [...memberTypes] : [...paymentOptions];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={listRef}
          data={['form']}
          keyExtractor={item => item}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View>
              <View style={styles.headingRow}>
                <AppText style={styles.eyebrow}>ON-SITE REGISTRATION</AppText>
                <View style={styles.headerPill}>
                  <AppText style={styles.headerPillText}>NEW ATTENDEE</AppText>
                </View>
              </View>
              <AppText style={styles.heading}>
                A warm welcome{'\n'}
                <AppText style={styles.accent}>starts here.</AppText>
              </AppText>
              <AppText style={styles.subtitle}>
                Add a spot registration in a few simple steps.
              </AppText>
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <AppText style={styles.heroIconText}>+</AppText>
                </View>
                <View style={styles.heroCopy}>
                  <AppText style={styles.heroTitle}>Spot Registration</AppText>
                  <AppText style={styles.heroNote}>
                    Attendee details, payment & you’re ready.
                  </AppText>
                </View>
              </View>
              <View style={styles.card}>
                <View style={styles.sectionHeading}>
                  <View style={styles.step}>
                    <AppText style={styles.stepText}>01</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText style={styles.sectionTitle}>
                      Member details
                    </AppText>
                    <AppText style={styles.sectionNote}>
                      Let’s get to know your attendee.
                    </AppText>
                  </View>
                </View>
                <View style={styles.field}>
                  <AppText style={styles.label}>
                    Member type<AppText style={styles.required}> *</AppText>
                  </AppText>
                  <AppButton
                    accessibilityLabel="Select member type"
                    accessibilityHint={errors.memberType}
                    onPress={() => openPicker('memberType')}
                    style={styles.select}
                  >
                    <AppText
                      style={[
                        styles.selectText,
                        !form.memberType && styles.placeholder,
                      ]}
                    >
                      {form.memberType || 'Select member type'}
                    </AppText>
                    <AppText style={styles.chevron}>⌄</AppText>
                  </AppButton>
                  {!!errors.memberType && (
                    <AppText
                      accessibilityLiveRegion="polite"
                      style={styles.error}
                    >
                      {errors.memberType}
                    </AppText>
                  )}
                </View>
                <FormField
                  label="Name"
                  required
                  placeholder="Enter full name"
                  value={form.name}
                  onChangeText={value => update('name', value)}
                  error={errors.name}
                  maxLength={100}
                />
                <FormField
                  label="MSNO"
                  required
                  placeholder="Enter membership number"
                  value={form.msno}
                  onChangeText={value => update('msno', value)}
                  error={errors.msno}
                  maxLength={40}
                />
              </View>

              <View style={styles.card}>
                <View style={styles.sectionHeading}>
                  <View style={styles.step}>
                    <AppText style={styles.stepText}>02</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText style={styles.sectionTitle}>
                      Contact information
                    </AppText>
                    <AppText style={styles.sectionNote}>
                      Keep their event details connected.
                    </AppText>
                  </View>
                </View>
                <FormField
                  label="Mobile"
                  required
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  value={form.mobile}
                  onChangeText={value => update('mobile', value)}
                  error={errors.mobile}
                  maxLength={22}
                />
                <FormField
                  label="Email"
                  required
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={value => update('email', value)}
                  error={errors.email}
                  maxLength={254}
                />
                <FormField
                  label="State"
                  required
                  placeholder="Enter state"
                  value={form.state}
                  onChangeText={value => update('state', value)}
                  error={errors.state}
                  maxLength={100}
                />
              </View>

              <View style={styles.card}>
                <View style={styles.sectionHeading}>
                  <View style={styles.step}>
                    <AppText style={styles.stepText}>03</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText style={styles.sectionTitle}>
                      Payment & notes
                    </AppText>
                    <AppText style={styles.sectionNote}>
                      Finish with the final details.
                    </AppText>
                  </View>
                </View>
                <FormField
                  label="Amount"
                  required
                  placeholder="0.00"
                  prefix="₹"
                  keyboardType="decimal-pad"
                  value={form.amount}
                  onChangeText={value => update('amount', value)}
                  error={errors.amount}
                  maxLength={12}
                />
                <View style={styles.field}>
                  <AppText style={styles.label}>
                    Payment status<AppText style={styles.required}> *</AppText>
                  </AppText>
                  <AppButton
                    accessibilityLabel="Select payment status"
                    accessibilityHint={errors.paymentStatus}
                    onPress={() => openPicker('paymentStatus')}
                    style={styles.select}
                  >
                    <View style={styles.paymentLabel}>
                      <View
                        style={[
                          styles.paymentDot,
                          form.paymentStatus === 'Unpaid' && styles.pendingDot,
                        ]}
                      />
                      <AppText style={styles.selectText}>
                        {form.paymentStatus}
                      </AppText>
                    </View>
                    <AppText style={styles.chevron}>⌄</AppText>
                  </AppButton>
                  {!!errors.paymentStatus && (
                    <AppText style={styles.error}>
                      {errors.paymentStatus}
                    </AppText>
                  )}
                </View>
                <FormField
                  label="Notes"
                  required
                  placeholder="Add comments or special requests…"
                  multiline
                  maxLength={1000}
                  value={form.notes}
                  onChangeText={value => update('notes', value)}
                  error={errors.notes}
                />
                <AppText style={styles.characterCount}>
                  {form.notes.length}/1000
                </AppText>
              </View>
              {!!formError && (
                <AppText accessibilityRole="alert" style={styles.formError}>
                  {formError}
                </AppText>
              )}
              <AppButton
                variant="primary"
                accessibilityLabel="Submit spot registration"
                loading={busy}
                onPress={submit}
                style={styles.submitButton}
              >
                <AppText style={styles.submitText}>Submit registration</AppText>
                <AppText style={styles.submitArrow}>→</AppText>
              </AppButton>
            </View>
          )}
        />
      </KeyboardAvoidingView>
      <Modal
        transparent
        visible={!!picker}
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.overlay}>
          <AppButton
            accessibilityLabel="Dismiss registration picker"
            onPress={() => setPicker(null)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText accessibilityRole="header" style={styles.modalTitle}>
                {picker === 'memberType' ? 'Member type' : 'Payment status'}
              </AppText>
              <AppButton
                accessibilityLabel="Close registration picker"
                onPress={() => setPicker(null)}
                style={styles.closeButton}
              >
                <AppText style={styles.closeText}>×</AppText>
              </AppButton>
            </View>
            <FlatList
              data={pickerOptions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <AppButton
                  accessibilityRole="radio"
                  accessibilityLabel={item}
                  accessibilityState={{
                    checked: picker ? form[picker] === item : false,
                  }}
                  onPress={() => {
                    if (picker) {
                      update(picker, item);
                    }
                    setPicker(null);
                  }}
                  style={[
                    styles.option,
                    !!picker && form[picker] === item && styles.selectedOption,
                  ]}
                >
                  <AppText style={styles.optionText}>{item}</AppText>
                  <AppText style={styles.radio}>
                    {picker && form[picker] === item ? '●' : '○'}
                  </AppText>
                </AppButton>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={!!result}
        animationType="fade"
        onRequestClose={() => setResult(null)}
      >
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.modalCard}>
            <FlatList
              data={['summary']}
              keyExtractor={item => item}
              renderItem={() => (
                <View>
                  <View style={styles.resultIcon}>
                    <AppText style={styles.resultIconText}>
                      {result === 'saved' ? '✓' : '▣'}
                    </AppText>
                  </View>
                  <AppText
                    accessibilityRole="header"
                    style={styles.resultTitle}
                  >
                    {result === 'saved'
                      ? 'Registration submitted'
                      : 'Registration preview'}
                  </AppText>
                  <AppText style={styles.resultNote}>
                    {result === 'saved'
                      ? 'Your attendee details were submitted successfully.'
                      : 'Your form is ready. API is not connected; nothing has been saved or charged.'}
                  </AppText>
                  {[
                    ['Member type', form.memberType],
                    ['Name', form.name],
                    ['MSNO', form.msno],
                    ['Mobile', form.mobile],
                    ['Email', form.email],
                    ['State', form.state],
                    ['Amount', form.amount ? `₹${form.amount}` : 'Not entered'],
                    ['Payment status', form.paymentStatus],
                    ['Notes', form.notes],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.summaryRow}>
                      <AppText style={styles.summaryLabel}>{label}</AppText>
                      <AppText selectable style={styles.summaryValue}>
                        {value || '—'}
                      </AppText>
                    </View>
                  ))}
                  <AppButton
                    variant="primary"
                    title={result === 'saved' ? 'Done' : 'Back to form'}
                    accessibilityLabel="Close registration summary"
                    onPress={() => setResult(null)}
                    style={styles.summaryButton}
                  />
                </View>
              )}
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
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  eyebrow: {
    fontSize: typography.size.s8,
    letterSpacing: 1.4,
    fontWeight: typography.weight.bold,
    color: colors.eyebrow,
  },
  headerPill: {
    backgroundColor: colors.selectedTab,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerPillText: {
    fontSize: typography.size.s7,
    letterSpacing: 0.6,
    fontWeight: typography.weight.bold,
    color: colors.headingGreen,
  },
  heading: {
    fontSize: typography.size.s33,
    lineHeight: typography.lineHeight.l40,
    letterSpacing: -1,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginTop: 22,
  },
  accent: { color: colors.headingGreen },
  subtitle: {
    color: colors.muted,
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l21,
    marginTop: 10,
  },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 25,
    marginBottom: 18,
  },
  heroIcon: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { color: colors.ink, fontSize: typography.size.s33 },
  heroCopy: { flex: 1 },
  heroTitle: {
    fontSize: typography.size.s18,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  heroNote: {
    color: colors.bannerMuted,
    fontSize: typography.size.s10,
    lineHeight: typography.lineHeight.l16,
    marginTop: 6,
  },
  requiredNote: {
    color: colors.muted,
    fontSize: typography.size.s10,
    textAlign: 'right',
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  step: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: colors.selectedTab,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: typography.size.s12,
    fontWeight: typography.weight.bold,
    color: colors.headingGreen,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.size.s16,
    fontWeight: typography.weight.bold,
  },
  sectionNote: {
    color: colors.muted,
    fontSize: typography.size.s10,
    marginTop: 5,
    lineHeight: typography.lineHeight.l16,
  },
  field: { marginBottom: 18 },
  label: {
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
    color: colors.label,
    marginBottom: 9,
  },
  required: { color: colors.headingGreen },
  inputWrap: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 13,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: typography.size.s14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputPrefix: {
    color: colors.headingGreen,
    fontSize: typography.size.s18,
    marginLeft: 14,
  },
  notesWrap: { alignItems: 'flex-start' },
  notesInput: { minHeight: 105, textAlignVertical: 'top' },
  placeholder: { color: colors.placeholder },
  select: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
  },
  selectText: {
    flexShrink: 1,
    color: colors.ink,
    fontSize: typography.size.s14,
  },
  chevron: { color: colors.headingGreen, fontSize: typography.size.s23 },
  error: {
    color: colors.error,
    fontSize: typography.size.s10,
    lineHeight: typography.lineHeight.l16,
    textAlign: 'right',
    marginTop: 6,
  },
  paymentLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
  },
  pendingDot: { backgroundColor: colors.lunchInk },
  characterCount: {
    textAlign: 'right',
    color: colors.muted,
    fontSize: typography.size.s9,
    marginTop: -9,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  submitText: {
    color: colors.buttonText,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.bold,
  },
  submitArrow: { fontSize: typography.size.s25, color: colors.buttonText },
  footerNote: {
    color: colors.muted,
    fontSize: typography.size.s10,
    lineHeight: typography.lineHeight.l16,
    textAlign: 'center',
    marginTop: 14,
  },
  formError: {
    color: colors.error,
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    marginBottom: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.size.s23,
    color: colors.ink,
    fontWeight: typography.weight.bold,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedOption: { backgroundColor: colors.selectedTab },
  optionText: { fontSize: typography.size.s14, color: colors.ink },
  radio: { fontSize: typography.size.s20, color: colors.headingGreen },
  resultIcon: {
    alignSelf: 'center',
    height: 64,
    width: 64,
    borderRadius: 22,
    backgroundColor: colors.selectedTab,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resultIconText: { color: colors.headingGreen, fontSize: typography.size.s33 },
  resultTitle: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  resultNote: {
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  summaryRow: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 5,
  },
  summaryLabel: { color: colors.muted, fontSize: typography.size.s10 },
  summaryValue: {
    color: colors.ink,
    fontSize: typography.size.s13,
    fontWeight: typography.weight.semibold,
  },
  summaryButton: { marginTop: 22 },
});
