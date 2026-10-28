import { colors } from '../theme/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type EyeIconProps = { crossed?: boolean };

export default function EyeIcon({ crossed = false }: EyeIconProps) {
  return (
    <View style={styles.container} accessible={false} pointerEvents="none">
      <View style={styles.eye} />
      <View style={styles.pupil} />
      {crossed && <View style={styles.slash} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    width: 19,
    height: 19,
    borderWidth: 1.7,
    borderColor: colors.iconGreen,
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
    transform: [{ rotate: '45deg' }, { scale: 0.85 }],
  },
  pupil: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.7,
    borderColor: colors.iconGreen,
  },
  slash: {
    position: 'absolute',
    width: 26,
    height: 2,
    backgroundColor: colors.iconGreen,
    transform: [{ rotate: '45deg' }],
  },
});
