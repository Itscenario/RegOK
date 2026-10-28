import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import { colors } from '../theme/colors';
import AppText from './AppText';

type AppButtonProps = PressableProps & {
  title?: string;
  variant?: 'plain' | 'primary' | 'secondary';
  loading?: boolean;
};

export default function AppButton({
  title,
  children,
  variant = 'plain',
  loading = false,
  disabled,
  accessibilityRole = 'button',
  accessibilityState,
  style,
  ...props
}: AppButtonProps) {
  const blocked = disabled || loading;
  return (
    <Pressable
      {...props}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled: !!blocked,
        busy: loading || accessibilityState?.busy,
      }}
      disabled={blocked}
      style={state => [
        variant !== 'plain' && styles.base,
        variant !== 'plain' && styles[variant],
        typeof style === 'function' ? style(state) : style,
        (blocked || state.pressed) && styles.dimmed,
      ]}
    >
      {state =>
        loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : children ? (
          typeof children === 'function' ? (
            children(state)
          ) : (
            children
          )
        ) : (
          <AppText variant="label">{title}</AppText>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.selectedTab },
  dimmed: { opacity: 0.65 },
});
