import { getSelectedEvent, type EventOption } from '../../storage/event';
import { useToast } from '../../components/ToastProvider';
import { loginService, parseUserFromApiResponse } from '../../config/backend';
import { typography } from '../../theme/typography';
import { AppText, AppButton } from '../../components';
import { colors } from '../../theme/colors';
import UserIcon from '../../components/UserIcon';
import EyeIcon from '../../components/EyeIcon';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveLoginSession } from '../../storage/session';
import { ROUTES } from '../../navigation/routes';
import type { ScreenProps } from '../../navigation/types';

export default function LoginScreen({
  navigation,
  route,
}: ScreenProps<'Login'>) {
  const showToast = useToast();
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(
    route.params?.event ?? null,
  );
  useEffect(() => {
    let active = true;
    getSelectedEvent()
      .then(event => {
        if (active) {
          setSelectedEvent(event);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState<'username' | 'password' | null>(null);
  const [, setAccountError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const handleLogin = async () => {
    const trimmedEmail = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    if (submittingRef.current) {
      return;
    }
    setAccountError('');
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await loginService.login(trimmedEmail, trimmedPassword);
      console.log('login Respones', response);

      if (response && response.status_api) {
        const user = parseUserFromApiResponse(trimmedEmail, response);
        console.log('Login access:', {
          username: user.username,
          roles: user.roles,
          feature: user.feature,
        });
        if (response.Data) {
          await AsyncStorage.setItem('userdata', JSON.stringify(response.Data));
        }
        if (user) {
          await saveLoginSession(user);
        }
        showToast('Login successful!', 'success');
        navigation.replace(ROUTES.HOME, { user });
      } else {
        const message = response?.status_msg || 'Invalid username or password.';
        setAccountError(message);
        showToast(message, 'error');
      }
    } catch (error) {
      console.log('Login error:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Unable to log in. Please try again.',
        'error',
      );
      setAccountError('Something went wrong. Please try again.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={['login']}
          keyExtractor={item => item}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <>
              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <AppText style={styles.brandSymbol}>8</AppText>
                </View>
                <AppText style={styles.brandName}>
                  RegOK<AppText style={styles.brandDot}>.</AppText>
                </AppText>
              </View>

              <View style={styles.hero}>
                <View style={styles.eyebrow}>
                  <View style={styles.dot} />
                  <AppText style={styles.eyebrowText}>
                    YOUR NEXT CHAPTER
                  </AppText>
                </View>
                <AppText style={styles.headline}>
                  Good to{'\n'}have you{' '}
                  <AppText style={styles.accent}>back.</AppText>
                </AppText>
                <View style={styles.heroDecoration} accessible={false}>
                  <View style={styles.orbit} />
                  <View style={styles.orbitInner} />
                  <AppText style={styles.spark}>✦</AppText>
                </View>
              </View>

              {!!selectedEvent && (
                <View style={styles.eventRow}>
                  <View style={styles.eventInfo}>
                    <AppText style={styles.eventLabel}>SELECTED EVENT</AppText>
                    <AppText style={styles.eventName}>
                      {selectedEvent.name}
                    </AppText>
                  </View>
                  <AppButton
                    title="Change"
                    accessibilityLabel="Change event"
                    disabled={isSubmitting}
                    onPress={() => navigation.replace(ROUTES.EVENT_SELECTION)}
                    style={styles.changeEvent}
                  />
                </View>
              )}

              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <View>
                    <AppText style={styles.cardTitle}>Sign in</AppText>
                    <AppText style={styles.cardSubtitle}>
                      Your space. Your possibilities.
                    </AppText>
                  </View>
                  <View style={styles.headingBadge}>
                    <AppText style={styles.headingArrow}>↗</AppText>
                  </View>
                </View>

                {/* */}
                <AppText nativeID="username-label" style={styles.label}>
                  Username
                </AppText>
                <View
                  style={[
                    styles.inputWrap,
                    focused === 'username' && styles.inputFocused,
                  ]}
                >
                  <UserIcon />
                  <TextInput
                    accessibilityLabel="Username"
                    accessibilityLabelledBy="username-label"
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor={colors.placeholder}
                    value={username}
                    onChangeText={value => {
                      setUsername(value);
                      setAccountError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setFocused('username')}
                    onBlur={() => setFocused(null)}
                  />
                </View>

                <AppText nativeID="password-label" style={styles.label}>
                  Password
                </AppText>
                <View
                  style={[
                    styles.inputWrap,
                    focused === 'password' && styles.inputFocused,
                  ]}
                >
                  <AppText style={styles.inputIcon} accessible={false}>
                    ※
                  </AppText>
                  <TextInput
                    ref={passwordRef}
                    accessibilityLabel="Password"
                    accessibilityLabelledBy="password-label"
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                  />
                  <AppButton
                    accessibilityRole="button"
                    accessibilityLabel={
                      visible ? 'Hide password' : 'Show password'
                    }
                    onPress={() => setVisible(value => !value)}
                    style={styles.visibilityButton}
                  >
                    <EyeIcon crossed={visible} />
                  </AppButton>
                </View>

                <AppButton
                  accessibilityRole="button"
                  variant="primary"
                  accessibilityLabel="Sign in"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  accessibilityState={{
                    disabled: isSubmitting,
                    busy: isSubmitting,
                  }}
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.submit,
                    isSubmitting && styles.submitLoading,
                    pressed && styles.submitPressed,
                  ]}
                >
                  <AppText style={styles.submitText}>
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                  </AppText>
                  <AppText style={styles.submitArrow}>→</AppText>
                </AppButton>
              </View>
              <View style={styles.footer} />
            </>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.backgroundDark },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: 'center',
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  brandSymbol: {
    color: colors.backgroundDark,
    fontSize: typography.size.s28,
    fontWeight: typography.weight.black,
  },
  brandName: {
    color: colors.white,
    fontWeight: typography.weight.extraBold,
    fontSize: typography.size.s21,
    letterSpacing: 2,
  },
  brandDot: { color: colors.primary },
  hero: {
    paddingTop: 42,
    paddingBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  eyebrowText: {
    color: colors.primary,
    fontSize: typography.size.s10,
    fontWeight: typography.weight.bold,
    letterSpacing: 2.2,
  },
  headline: {
    color: colors.textLight,
    fontSize: typography.size.s44,
    lineHeight: typography.lineHeight.l50,
    fontWeight: typography.weight.bold,
    letterSpacing: -1.8,
  },
  accent: { color: colors.primary },
  subtitle: {
    color: colors.subtitleDark,
    fontSize: typography.size.s14,
    lineHeight: typography.lineHeight.l22,
    marginTop: 16,
  },
  heroDecoration: {
    position: 'absolute',
    right: -48,
    top: 4,
    width: 130,
    height: 130,
    opacity: 0.3,
  },
  orbit: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  orbitInner: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 89,
    height: 89,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  spark: {
    position: 'absolute',
    top: 37,
    left: 40,
    color: colors.primary,
    fontSize: typography.size.s40,
  },
  card: { backgroundColor: colors.white, borderRadius: 26, padding: 24 },
  cardHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  cardTitle: {
    fontSize: typography.size.s26,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  cardSubtitle: {
    fontSize: typography.size.s12,
    color: colors.secondary,
    marginTop: 5,
  },
  headingBadge: {
    backgroundColor: colors.badgeBackground,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingArrow: { fontSize: typography.size.s24, color: colors.badgeInk },
  label: {
    color: colors.label,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.s13,
    marginBottom: 9,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 13,
    backgroundColor: colors.inputBackground,
    minHeight: 56,
  },
  inputFocused: { backgroundColor: colors.white },
  inputIcon: {
    color: colors.inputIcon,
    fontSize: typography.size.s20,
    marginLeft: 15,
    width: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    fontSize: typography.size.s14,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  visibilityButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 12,
  },
  error: {
    textAlign: 'right',
    color: colors.error,
    fontSize: typography.size.s11,
    lineHeight: typography.lineHeight.l16,
    marginTop: 5,
    marginBottom: 12,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  eventInfo: { flex: 1 },
  eventLabel: {
    color: colors.primary,
    fontSize: typography.size.s9,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  eventName: {
    color: colors.white,
    fontSize: typography.size.s16,
    fontWeight: typography.weight.bold,
  },
  changeEvent: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitPressed: { opacity: 0.75 },
  submitLoading: { justifyContent: 'center' },
  submitText: {
    color: colors.buttonText,
    fontSize: typography.size.s16,
    fontWeight: typography.weight.extraBold,
  },
  submitArrow: { color: colors.buttonText, fontSize: typography.size.s26 },
  demoNote: {
    color: colors.note,
    fontSize: typography.size.s10,
    textAlign: 'center',
    marginTop: 17,
    lineHeight: typography.lineHeight.l16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
  },
  footerLine: { height: 1, flex: 1, backgroundColor: colors.dividerDark },
  footerText: {
    fontSize: typography.size.s8,
    letterSpacing: 1.6,
    color: colors.footerText,
    fontWeight: typography.weight.semibold,
  },
});
