import { typography } from '../../theme/typography';
import { AppText, AppButton } from '../../components';
import { colors } from '../../theme/colors';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import type { ServiceId } from '../../types/services';

const serviceTitles: Record<ServiceId, string> = {
  kit: 'Kit',
  dinner: 'Dinner',
  lunch: 'Lunch',
};

type Props = {
  service: ServiceId;
  onClose: () => void;
  onScan: (value: string) => void;
};
export default function ScannerScreen({ service, onClose, onScan }: Props) {
  const title = serviceTitles[service];
  const device = useCameraDevice('back');
  const { requestPermission } = useCameraPermission();
  const [permission, setPermission] = useState(
    Camera.getCameraPermissionStatus(),
  );
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const scanned = useRef(false);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      setActive(state === 'active');
      if (state === 'active') {
        setPermission(Camera.getCameraPermissionStatus());
      }
    });
    return () => listener.remove();
  }, []);

  async function allowCamera() {
    try {
      await requestPermission();
      setPermission(Camera.getCameraPermissionStatus());
      setError(null);
    } catch {
      setError('Unable to request camera access. Please check app settings.');
    }
  }

  const allowed = permission === 'granted';
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      const value = codes.find(code => code.value?.trim())?.value;
      if (!active || !allowed || error || scanned.current || !value) {
        return;
      }
      scanned.current = true;
      setActive(false);
      onScan(value);
    },
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <AppButton
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          onPress={onClose}
          style={styles.close}
        >
          <AppText style={styles.closeText}>×</AppText>
        </AppButton>
        <AppText style={styles.headerTitle}>Scan QR code</AppText>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>
            {title.toUpperCase()} COLLECTION
          </AppText>
        </View>
        <AppText style={styles.heading}>Point. Scan. Done.</AppText>
        <AppText style={styles.description}>
          Place the attendee’s QR code inside the frame.
        </AppText>
        <View style={styles.frame}>
          {allowed && device && !error ? (
            <Camera
              testID="qr-camera"
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={active}
              codeScanner={codeScanner}
              torch={torch && device.hasTorch ? 'on' : 'off'}
              onError={() =>
                setError(
                  'Camera could not start. Close the scanner and try again.',
                )
              }
            />
          ) : (
            <View style={styles.cameraMessage}>
              <AppText style={styles.cameraMessageTitle}>
                {!allowed
                  ? 'Camera access needed'
                  : !device
                  ? 'No camera found'
                  : 'Camera unavailable'}
              </AppText>
              <AppText style={styles.cameraMessageText}>
                {error ||
                  (!allowed
                    ? 'Allow camera access to scan a QR code.'
                    : 'Try scanning on a device with a rear camera.')}
              </AppText>
            </View>
          )}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {allowed && device && !error && (
              <View style={styles.liveScanLine} />
            )}
          </View>
        </View>
        <View style={styles.hint}>
          <View style={styles.dot} />
          <AppText style={styles.hintText}>
            {allowed
              ? 'QR code will be detected automatically'
              : 'Only camera access is required'}
          </AppText>
        </View>
      </View>
      <View style={styles.footer}>
        {!allowed ? (
          <AppButton
            accessibilityRole="button"
            accessibilityLabel={
              permission === 'denied' || permission === 'restricted'
                ? 'Open camera settings'
                : 'Allow camera'
            }
            onPress={() => {
              if (permission === 'denied' || permission === 'restricted') {
                Linking.openSettings().catch(() =>
                  setError(
                    'Could not open settings. Open RegOK permissions from your device settings.',
                  ),
                );
              } else {
                allowCamera();
              }
            }}
            variant="primary"
            style={styles.button}
          >
            <AppText style={styles.buttonText}>
              {permission === 'denied' || permission === 'restricted'
                ? 'Open settings'
                : 'Allow camera'}
            </AppText>
            <AppText style={styles.arrow}>→</AppText>
          </AppButton>
        ) : device?.hasTorch && !error ? (
          <AppButton
            accessibilityRole="button"
            accessibilityLabel={
              torch ? 'Turn flashlight off' : 'Turn flashlight on'
            }
            onPress={() => setTorch(value => !value)}
            variant="primary"
            style={styles.button}
          >
            <AppText style={styles.buttonText}>
              {torch ? 'Flashlight ON' : 'Flashlight OFF'}
            </AppText>
            <AppText style={styles.arrow}>☀</AppText>
          </AppButton>
        ) : null}
        <AppText style={styles.footerNote}>
          Scanned QR content will appear in your Details tab.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraMessage: { padding: 20, alignItems: 'center' },
  cameraMessageTitle: {
    color: colors.white,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  cameraMessageText: {
    color: colors.scannerMuted,
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l19,
    textAlign: 'center',
    marginTop: 10,
  },
  liveScanLine: {
    position: 'absolute',
    top: '50%',
    left: '5%',
    width: '90%',
    height: 2,
    backgroundColor: colors.primary,
  },
  screen: { flex: 1, backgroundColor: colors.backgroundDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.cameraControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.white, fontSize: typography.size.s28 },
  headerTitle: {
    color: colors.white,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.semibold,
  },
  spacer: { width: 44 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  badge: {
    backgroundColor: colors.permissionBackground,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  badgeText: {
    color: colors.primary,
    fontSize: typography.size.s9,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.5,
  },
  heading: {
    color: colors.white,
    fontSize: typography.size.s29,
    fontWeight: typography.weight.bold,
    marginTop: 21,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  description: {
    color: colors.scannerMuted,
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    textAlign: 'center',
    marginTop: 9,
  },
  frame: {
    width: '78%',
    maxWidth: 275,
    aspectRatio: 1,
    marginVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cameraBackground,
    borderRadius: 22,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    height: 36,
    width: 36,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 20,
  },
  qr: {
    fontSize: typography.size.s170,
    color: colors.cameraMuted,
    lineHeight: typography.lineHeight.l190,
  },
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: colors.primary,
  },
  previewBadge: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: colors.cameraBadge,
    borderRadius: 6,
    padding: 7,
  },
  previewText: {
    fontSize: typography.size.s7,
    color: colors.scannerPreview,
    letterSpacing: 1.6,
  },
  hint: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: {
    height: 5,
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  hintText: { color: colors.scannerMuted, fontSize: typography.size.s11 },
  footer: { padding: 24, maxWidth: 540, width: '100%', alignSelf: 'center' },
  note: {
    color: colors.scannerMuted,
    fontSize: typography.size.s11,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    borderRadius: 15,
    paddingHorizontal: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: typography.size.s15,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  arrow: { fontSize: typography.size.s25, color: colors.ink },
  pressed: { opacity: 0.7 },
  footerNote: {
    fontSize: typography.size.s10,
    textAlign: 'center',
    color: colors.scannerFooter,
    marginTop: 13,
  },
});
