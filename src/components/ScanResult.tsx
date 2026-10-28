import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import AppText from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { ScanFeedback } from '../types/services';

type Props = {
  result: ScanFeedback;
  onDone: () => void;
  onScanNext: () => void;
};
export default function ScanResult({ result, onDone, onScanNext }: Props) {
  const success = result.status === 'success';
  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={styles.card}
        accessibilityViewIsModal
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <View style={[styles.iconBox, !success && styles.warning]}>
          <AppText style={styles.icon}>{success ? '✓' : '!'}</AppText>
        </View>
        <AppText style={styles.eyebrow}>SCAN RESULT</AppText>
        <AppText accessibilityRole="header" style={styles.title}>
          {success
            ? 'Scan successful!'
            : result.status === 'duplicate'
            ? 'Duplicate QR code'
            : 'Scan failed'}
        </AppText>
        <AppText style={styles.message}>{result.message}</AppText>
        <AppButton
          variant="primary"
          title="Scan next QR"
          accessibilityLabel="Scan next QR"
          onPress={onScanNext}
          style={styles.button}
        />
        <AppButton
          variant="secondary"
          title="Done"
          accessibilityLabel="Close scan result"
          onPress={onDone}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    padding: 26,
    borderRadius: 28,
    alignItems: 'center',
  },
  iconBox: {
    height: 80,
    width: 80,
    borderRadius: 28,
    backgroundColor: colors.successBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  warning: { backgroundColor: colors.lunchBackground },
  icon: {
    fontSize: typography.size.s40,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  eyebrow: {
    fontSize: typography.size.s9,
    fontWeight: typography.weight.bold,
    color: colors.headingGreen,
    letterSpacing: 1.8,
  },
  title: {
    fontSize: typography.size.s27,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 12,
  },
  message: {
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l21,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 18,
  },
  button: { alignSelf: 'stretch', marginTop: 10 },
});
