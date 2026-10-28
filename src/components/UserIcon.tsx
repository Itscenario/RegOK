import { colors } from '../theme/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function UserIcon() {
  return (
    <View style={styles.container} accessible={false} pointerEvents="none">
      <View style={styles.head} />
      <View style={styles.shoulders} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    marginLeft: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    borderColor: colors.inputIcon,
  },
  shoulders: {
    width: 16,
    height: 9,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderWidth: 1.6,
    borderColor: colors.inputIcon,
  },
});
