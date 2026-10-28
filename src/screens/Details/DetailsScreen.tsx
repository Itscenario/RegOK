import LogoutModal from '../../components/LogoutModal';
import { typography } from '../../theme/typography';
import { AppText, AppButton } from '../../components';
import { colors } from '../../theme/colors';
import React, { useState } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ScanFeedback, ScanRecord, ServiceId } from '../../types/services';

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

export default function DetailsScreen({
  records,
  serviceId,
  onLogout,
  isLoggingOut,
  onViewDetails,
  scanFeedback,
  onDismissFeedback,
  onBackToScan,
}: {
  records: ScanRecord[];
  serviceId?: ServiceId;
  onLogout: () => void;
  isLoggingOut: boolean;
  onViewDetails: (serviceId: ServiceId) => void;
  scanFeedback?: ScanFeedback | null;
  onDismissFeedback?: () => void;
  onBackToScan?: () => void;
}) {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const closeLogout = () => {
    if (!isLoggingOut) {
      setLogoutVisible(false);
    }
  };
  const assignedRecords = records.filter(
    record => !serviceId || record.service === serviceId,
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        data={services.filter(item => !serviceId || item.id === serviceId)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {onBackToScan && (
              <AppButton
                title="← Back to Scan"
                accessibilityLabel="Back to Scan"
                onPress={onBackToScan}
                style={styles.backButton}
              />
            )}
            <AppText style={styles.eyebrow}>EVERY SCAN, IN ONE PLACE</AppText>
            <AppText style={styles.heading}>
              Your details<AppText style={styles.accent}>.</AppText>
            </AppText>
            <AppText style={styles.subtitle}>
              A little overview of your event essentials.
            </AppText>
            {scanFeedback && (
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={[
                  styles.feedback,
                  scanFeedback.status === 'success'
                    ? styles.feedbackSuccess
                    : styles.feedbackWarning,
                ]}
              >
                <View style={styles.feedbackHeading}>
                  <AppText style={styles.feedbackIcon}>
                    {scanFeedback.status === 'success' ? '✓' : '!'}
                  </AppText>
                  <AppText style={styles.feedbackTitle}>
                    {scanFeedback.title}
                  </AppText>
                  <AppButton
                    accessibilityLabel="Dismiss scan message"
                    onPress={onDismissFeedback}
                    style={styles.feedbackClose}
                  >
                    <AppText style={styles.feedbackCloseText}>×</AppText>
                  </AppButton>
                </View>
                <AppText style={styles.feedbackMessage}>
                  {scanFeedback.message}
                </AppText>
              </View>
            )}
            <View style={styles.overview}>
              <AppText style={styles.overviewLabel}>ACTIVITY OVERVIEW</AppText>
              <View style={styles.statRow}>
                <AppText style={styles.number}>
                  {String(assignedRecords.length).padStart(2, '0')}
                </AppText>
                <AppText style={styles.statText}>
                  scans{'\n'}
                  {serviceId
                    ? 'for your assigned service'
                    : 'across all services'}
                </AppText>
                <AppText style={styles.overviewIcon}>↗</AppText>
              </View>
              <AppText style={styles.overviewNote}>
                Scan history is saved on this device.
              </AppText>
            </View>
            <AppText style={styles.sectionTitle}>Service overview</AppText>
          </View>
        }
        renderItem={({ item: service }) => (
          <View style={styles.serviceCard}>
            <AppButton
              accessibilityLabel={`${service.title} scan details`}
              accessibilityHint="Open scan history on a separate screen"
              onPress={() => onViewDetails(service.id)}
              style={[styles.service, styles.serviceHeader]}
            >
              <View
                style={[styles.iconBox, { backgroundColor: service.color }]}
              >
                <AppText style={[styles.icon, { color: service.ink }]}>
                  {service.icon}
                </AppText>
              </View>
              <View style={styles.serviceCopy}>
                <AppText style={styles.serviceTitle}>{service.title}</AppText>
                <AppText style={styles.serviceNote}>
                  {
                    records.filter(record => record.service === service.id)
                      .length
                  }{' '}
                  scans · Tap to view details
                </AppText>
              </View>
              <AppText style={styles.expandIcon}>→</AppText>
            </AppButton>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.logoutCard}>
            <View style={styles.logoutHeading}>
              <View style={styles.logoutIcon}>
                <AppText style={styles.logoutIconText}>↪</AppText>
              </View>
              <View style={styles.serviceCopy}>
                <AppText style={styles.logoutEyebrow}>YOUR ACCOUNT</AppText>
                <AppText style={styles.logoutTitle}>Wrapping up?</AppText>
              </View>
            </View>
            <AppText style={styles.logoutDescription}>
              Sign out of this account when you’re done. You can sign back in
              anytime.
            </AppText>
            <AppButton
              variant="primary"
              accessibilityLabel="Log out"
              loading={isLoggingOut}
              style={styles.logoutButton}
              onPress={() => setLogoutVisible(true)}
            >
              <AppText style={styles.logoutButtonText}>Log out</AppText>
              <AppText style={styles.logoutArrow}>→</AppText>
            </AppButton>
          </View>
        }
      />
      <LogoutModal
        visible={logoutVisible}
        isLoggingOut={isLoggingOut}
        onClose={closeLogout}
        onLogout={onLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 12,
  },
  feedback: { borderRadius: 18, padding: 16, marginTop: 22 },
  feedbackSuccess: { backgroundColor: colors.successBackground },
  feedbackWarning: { backgroundColor: colors.lunchBackground },
  feedbackHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackIcon: {
    fontSize: typography.size.s24,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  feedbackTitle: {
    flex: 1,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  feedbackClose: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCloseText: { fontSize: typography.size.s24, color: colors.ink },
  feedbackMessage: {
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    color: colors.ink,
    marginTop: 8,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  serviceHeader: { borderWidth: 0, marginBottom: 0 },
  expandedContent: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  expandIcon: {
    color: colors.headingGreen,
    fontSize: typography.size.s24,
    paddingHorizontal: 6,
  },
  logoutCard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 22,
    marginTop: 28,
  },
  logoutHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoutIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.cameraControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconText: { fontSize: typography.size.s27, color: colors.primary },
  logoutEyebrow: {
    fontSize: typography.size.s8,
    letterSpacing: 1.6,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  logoutTitle: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.semibold,
    color: colors.white,
    marginTop: 5,
  },
  logoutDescription: {
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    color: colors.bannerMuted,
    marginTop: 16,
    marginBottom: 20,
  },
  logoutButton: { flexDirection: 'row', justifyContent: 'space-between' },
  logoutButtonText: {
    fontSize: typography.size.s15,
    fontWeight: typography.weight.bold,
    color: colors.buttonText,
  },
  logoutArrow: { fontSize: typography.size.s25, color: colors.buttonText },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: typography.size.s9,
    letterSpacing: 1.8,
    color: colors.eyebrow,
    fontWeight: typography.weight.bold,
    marginTop: 15,
  },
  heading: {
    fontSize: typography.size.s34,
    fontWeight: typography.weight.bold,
    letterSpacing: -1.2,
    color: colors.ink,
    marginTop: 12,
  },
  accent: { color: colors.brandAccent },
  subtitle: {
    fontSize: typography.size.s13,
    color: colors.muted,
    marginTop: 10,
    lineHeight: typography.lineHeight.l21,
  },
  overview: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 24,
    marginTop: 27,
    marginBottom: 28,
  },
  overviewLabel: {
    color: colors.primary,
    fontSize: typography.size.s9,
    letterSpacing: 1.6,
    fontWeight: typography.weight.bold,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  number: {
    color: colors.white,
    fontSize: typography.size.s58,
    letterSpacing: -3,
    fontWeight: typography.weight.semibold,
  },
  statText: {
    color: colors.statText,
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    flex: 1,
  },
  overviewIcon: { color: colors.primary, fontSize: typography.size.s38 },
  overviewNote: {
    color: colors.overviewMuted,
    fontSize: typography.size.s10,
    lineHeight: typography.lineHeight.l17,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: typography.size.s18,
    color: colors.ink,
    fontWeight: typography.weight.bold,
    marginBottom: 14,
  },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    marginBottom: 10,
    gap: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 43,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: typography.size.s25 },
  serviceCopy: { flex: 1 },
  serviceTitle: {
    color: colors.ink,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.semibold,
  },
  serviceNote: {
    color: colors.muted,
    fontSize: typography.size.s11,
    marginTop: 5,
  },
  badge: {
    backgroundColor: colors.pendingBackground,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  activeBadge: { backgroundColor: colors.successBackground },
  badgeText: {
    color: colors.statusText,
    fontSize: typography.size.s7,
    letterSpacing: 1,
    fontWeight: typography.weight.bold,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  count: { color: colors.muted, fontSize: typography.size.s12 },
  empty: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: typography.size.s40,
    color: colors.emptyIcon,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: typography.size.s15,
    color: colors.ink,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
  },
  activityDot: {
    height: 9,
    width: 9,
    borderRadius: 5,
    backgroundColor: colors.activityDot,
  },
  recordId: { color: colors.muted, fontSize: typography.size.s9, marginTop: 7 },
  check: { color: colors.success, fontSize: typography.size.s19 },
});
