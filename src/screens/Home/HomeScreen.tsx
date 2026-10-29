import { allowedServices, type ServiceUser } from '../../auth/users';
import { typography } from '../../theme/typography';
import { AppText, AppButton } from '../../components';
import { colors } from '../../theme/colors';
import React from 'react';
import { StyleSheet, FlatList, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ScanFeedback, ServiceId } from '../../types/services';

const services = [
  {
    id: 'kit',
    title: 'Kit',
    subtitle: 'A great start, all packed.',
    tag: 'EVENT ESSENTIALS',
    icon: '▣',
    color: colors.kitBackground,
    ink: colors.kitInk,
  },
  {
    id: 'dinner',
    title: 'Dinner',
    subtitle: 'End the day on a good note.',
    tag: 'EVENING DINING',
    icon: '☾',
    color: colors.dinnerBackground,
    ink: colors.dinnerInk,
  },
  {
    id: 'lunch',
    title: 'Lunch',
    subtitle: 'A little break. A fresh start.',
    tag: 'MIDDAY DINING',
    icon: '☀',
    color: colors.lunchBackground,
    ink: colors.lunchInk,
  },
] as const;

type Props = {
  user: ServiceUser;
  onSelect: (service: ServiceId) => void;
  count: number;
  onAccountPress: () => void;
  scanFeedback?: ScanFeedback | null;
  onDismissFeedback?: () => void;
};
export default function HomeScreen({
  user,
  onSelect,
  count,
  onAccountPress,
  scanFeedback,
  onDismissFeedback,
}: Props) {
  const visibleServices = allowedServices(user);
  const multipleServices = visibleServices.length > 1;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={services.filter(item => visibleServices.includes(item.id))}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <AppText style={styles.brand}>
                RegOK<AppText style={styles.brandDot}>.</AppText>
              </AppText>
              <AppButton
                accessibilityLabel="Open account"
                onPress={onAccountPress}
                style={styles.avatar}
              >
                <AppText style={styles.avatarText}>R</AppText>
              </AppButton>
            </View>
            <View style={styles.greetingRow}>
              <View style={styles.greenDot} />
              <AppText style={styles.eyebrow}>
                {user.username} ·{' '}
                {multipleServices
                  ? `${visibleServices.length} SERVICES`
                  : `${visibleServices[0]?.toUpperCase() ?? 'SCAN'} STAFF`}
              </AppText>
            </View>
            <AppText style={styles.heading}>
              Less waiting.{'\n'}More{' '}
              <AppText style={styles.headingAccent}>experiencing.</AppText>
            </AppText>
            <AppText style={styles.description}>
              {multipleServices
                ? 'All event services, a scan away.'
                : 'Your assigned service, a scan away.'}
            </AppText>
            {scanFeedback && (
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={[
                  styles.scanMessage,
                  scanFeedback.status === 'success'
                    ? styles.scanSuccess
                    : styles.scanWarning,
                ]}
              >
                <AppText style={styles.scanMessageTitle}>
                  {scanFeedback.status === 'success' ? '✓ ' : '! '}
                  {scanFeedback.title}
                </AppText>
                <AppText style={styles.scanMessageText}>
                  {scanFeedback.message}
                </AppText>
                <AppButton
                  title="Dismiss"
                  accessibilityLabel="Dismiss scan message"
                  onPress={onDismissFeedback}
                  style={styles.dismissMessage}
                />
              </View>
            )}
            <View style={styles.banner}>
              <View style={styles.bannerCopy}>
                <AppText style={styles.bannerTag}>YOUR SERVICE DESK</AppText>
                <AppText style={styles.bannerTitle}>
                  Scan. Collect.{'\n'}You’re good to go.
                </AppText>
                <AppText style={styles.bannerSubtitle}>
                  {multipleServices
                    ? 'Choose any service to scan a QR code.'
                    : 'Scan a QR code for your assigned service.'}
                </AppText>
              </View>
              <View style={styles.qrTile}>
                <AppText style={styles.qrGlyph}>▦</AppText>
                <View style={styles.scanLine} />
              </View>
            </View>
            <View style={styles.sectionRow}>
              <AppText style={styles.sectionTitle}>
                {multipleServices ? 'Your services' : 'Your assigned service'}
              </AppText>
              <AppText style={styles.sectionCount}>
                {`${String(visibleServices.length).padStart(2, '0')} ${
                  multipleServices ? 'SERVICES' : 'SERVICE'
                }`}
              </AppText>
            </View>
          </View>
        }
        renderItem={({ item: service }) => (
          <AppButton
            accessibilityRole="button"
            accessibilityLabel={`Scan QR for ${service.title}`}
            onPress={() => onSelect(service.id)}
            style={({ pressed }) => [styles.service, pressed && styles.pressed]}
          >
            <View
              style={[styles.serviceIcon, { backgroundColor: service.color }]}
            >
              <AppText style={[styles.serviceGlyph, { color: service.ink }]}>
                {service.icon}
              </AppText>
            </View>
            <View style={styles.serviceCopy}>
              <AppText style={styles.serviceTag}>{service.tag}</AppText>
              <AppText style={styles.serviceTitle}>{service.title}</AppText>
              <AppText style={styles.serviceSubtitle}>
                {service.subtitle}
              </AppText>
            </View>
            <View style={styles.arrowCircle}>
              <AppText style={styles.arrow}>↗</AppText>
            </View>
          </AppButton>
        )}
        ListFooterComponent={
          <View>
            <View style={styles.summary}>
              <View style={styles.summaryDot} />
              <AppText style={styles.summaryText}>
                {count
                  ? `${count} ${
                      count === 1 ? 'scan' : 'scans'
                    } in your activity`
                  : 'Ready when you are. Scan to start.'}
              </AppText>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scanMessage: { padding: 18, borderRadius: 18, marginTop: 20 },
  scanSuccess: { backgroundColor: colors.successBackground },
  scanWarning: { backgroundColor: colors.lunchBackground },
  scanMessageTitle: {
    fontSize: typography.size.s15,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  scanMessageText: {
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    marginTop: 8,
    color: colors.ink,
  },
  dismissMessage: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
  },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    paddingBottom: 28,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  brand: {
    fontSize: typography.size.s27,
    fontWeight: typography.weight.extraBold,
    color: colors.ink,
    letterSpacing: -1,
  },
  brandDot: { color: colors.brandAccent },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.s14,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
  },
  eyebrow: {
    color: colors.eyebrow,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.s9,
    letterSpacing: 1.8,
  },
  heading: {
    fontSize: typography.size.s33,
    lineHeight: typography.lineHeight.l40,
    letterSpacing: -1.2,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginTop: 13,
  },
  headingAccent: { color: colors.headingGreen },
  description: {
    fontSize: typography.size.s14,
    color: colors.muted,
    marginTop: 10,
  },
  banner: {
    backgroundColor: colors.ink,
    borderRadius: 23,
    padding: 22,
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerCopy: { flex: 1 },
  bannerTag: {
    fontSize: typography.size.s8,
    letterSpacing: 1.5,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: typography.size.s23,
    lineHeight: typography.lineHeight.l29,
    fontWeight: typography.weight.semibold,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: typography.size.s11,
    color: colors.bannerMuted,
    marginTop: 12,
    lineHeight: typography.lineHeight.l17,
  },
  qrTile: {
    height: 84,
    width: 74,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '8deg' }],
  },
  qrGlyph: {
    fontSize: typography.size.s66,
    lineHeight: typography.lineHeight.l74,
    color: colors.ink,
  },
  scanLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.scanLine,
    width: 64,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 29,
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: typography.size.s18,
    color: colors.ink,
    fontWeight: typography.weight.bold,
    flex: 1,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: typography.size.s8,
    letterSpacing: 1.4,
    fontWeight: typography.weight.semibold,
  },
  service: {
    backgroundColor: colors.white,
    borderRadius: 19,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.65 },
  serviceIcon: {
    width: 52,
    height: 59,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceGlyph: { fontSize: typography.size.s29 },
  serviceCopy: { flex: 1 },
  serviceTag: {
    fontSize: typography.size.s7,
    letterSpacing: 1.2,
    color: colors.muted,
    fontWeight: typography.weight.semibold,
  },
  serviceTitle: {
    fontSize: typography.size.s20,
    color: colors.ink,
    fontWeight: typography.weight.bold,
    marginTop: 3,
  },
  serviceSubtitle: {
    fontSize: typography.size.s10,
    color: colors.muted,
    marginTop: 4,
    lineHeight: typography.lineHeight.l15,
  },
  arrowCircle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: colors.arrowBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: { fontSize: typography.size.s20, color: colors.ink },
  summary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  summaryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.summaryDot,
  },
  summaryText: {
    fontSize: typography.size.s10,
    color: colors.muted,
    flexShrink: 1,
  },
});
