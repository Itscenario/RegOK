import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type AppTextProps = TextProps & {
  variant?: 'heading' | 'title' | 'body' | 'caption' | 'label';
};

// No default variant: nested text continues to inherit its parent's style.
export default function AppText({ variant, style, ...props }: AppTextProps) {
  return <Text {...props} style={[variant && variants[variant], style]} />;
}

const variants = StyleSheet.create({
  heading: {
    fontSize: typography.size.s34,
    fontWeight: typography.weight.bold,
    color: colors.ink,
  },
  title: {
    fontSize: typography.size.s23,
    fontWeight: typography.weight.semibold,
    color: colors.ink,
  },
  body: { fontSize: typography.size.s14, color: colors.ink },
  caption: { fontSize: typography.size.s12, color: colors.muted },
  label: {
    fontSize: typography.size.s13,
    fontWeight: typography.weight.semibold,
    color: colors.label,
  },
});
