import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { AppButton, AppText } from './index';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  visible: boolean;
  isLoggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
};
export default function LogoutModal({
  visible,
  isLoggingOut,
  onClose,
  onLogout,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <AppButton
          accessibilityLabel="Close logout popup"
          disabled={isLoggingOut}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={styles.modalCard}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <View style={styles.modalIcon}>
            <AppText style={styles.modalIconText}>↪</AppText>
          </View>
          <AppText style={styles.modalEyebrow}>SEE YOU SOON</AppText>
          <AppText accessibilityRole="header" style={styles.modalTitle}>
            Log out of RegOK?
          </AppText>
          <AppText style={styles.modalDescription}>
            You’ll need to sign in again to access your assigned service.
          </AppText>
          <View style={styles.modalActions}>
            <AppButton
              title="Cancel"
              variant="secondary"
              accessibilityLabel="Cancel logout"
              disabled={isLoggingOut}
              onPress={onClose}
              style={styles.modalAction}
            />
            <AppButton
              title="Log out"
              variant="primary"
              accessibilityLabel="Confirm logout"
              loading={isLoggingOut}
              onPress={onLogout}
              style={styles.modalAction}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    backgroundColor: colors.white,
    padding: 26,
    alignItems: 'center',
  },
  modalIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  modalIconText: { fontSize: typography.size.s34, color: colors.primary },
  modalEyebrow: {
    fontSize: typography.size.s9,
    letterSpacing: 2,
    fontWeight: typography.weight.bold,
    color: colors.headingGreen,
  },
  modalTitle: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginTop: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: typography.size.s14,
    lineHeight: typography.lineHeight.l22,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    alignSelf: 'stretch',
  },
  modalAction: { flex: 1, paddingHorizontal: 10 },
});
