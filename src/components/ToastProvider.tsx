import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type ToastType = 'success' | 'error';
type Toast = { message: string; type: ToastType };
const ToastContext = createContext<
  ((message: string, type: ToastType) => void) | null
>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const generation = useRef(0);
  const dismissToast = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const current = generation.current;
    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && current === generation.current) {
        setToast(null);
      }
    });
  }, [animation]);
  const showToast = useCallback(
    (message: string, type: ToastType) => {
      generation.current += 1;
      if (timer.current) {
        clearTimeout(timer.current);
      }
      animation.stopAnimation();
      animation.setValue(0);
      setToast({ message, type });
      Animated.timing(animation, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(dismissToast, 3500);
    },
    [animation, dismissToast],
  );
  useEffect(
    () => () => {
      generation.current += 1;
      if (timer.current) {
        clearTimeout(timer.current);
      }
      animation.stopAnimation();
    },
    [animation],
  );

  return (
    <ToastContext.Provider value={showToast}>
      <View style={styles.container}>
        {children}
        {toast && (
          <View
            pointerEvents="none"
            style={[styles.overlay, { top: insets.top + 12 }]}
          >
            <Animated.View
              testID="app-toast"
              accessibilityRole="alert"
              accessibilityLiveRegion={
                toast.type === 'error' ? 'assertive' : 'polite'
              }
              style={[
                styles.toast,
                toast.type === 'success' ? styles.success : styles.error,
                {
                  opacity: animation,
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  toast.type === 'success'
                    ? styles.successIcon
                    : styles.errorIcon,
                ]}
              >
                <AppText
                  style={[
                    styles.icon,
                    toast.type === 'error' && styles.errorText,
                  ]}
                >
                  {toast.type === 'success' ? '✓' : '!'}
                </AppText>
              </View>
              <AppText style={styles.message}>{toast.message}</AppText>
            </Animated.View>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return showToast;
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
    elevation: 20,
  },
  toast: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  success: { borderLeftColor: colors.success },
  error: { borderLeftColor: colors.error },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: { backgroundColor: colors.successBackground },
  errorIcon: { backgroundColor: colors.toastErrorBackground },
  icon: {
    color: colors.success,
    fontSize: typography.size.s18,
    fontWeight: typography.weight.bold,
  },
  errorText: { color: colors.error },
  message: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l20,
    fontWeight: typography.weight.medium,
  },
});
