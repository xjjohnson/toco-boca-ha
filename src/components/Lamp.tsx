import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

/** A tappable toy lamp drawn from simple shapes (original art). */
export function Lamp({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      role="switch"
      aria-checked={on}
      aria-label="Lamp"
      style={styles.hit}
    >
      {on && <View style={styles.glow} />}
      <View style={styles.shade} />
      <View style={[styles.bulb, { backgroundColor: on ? colors.lampGlow : '#E8E2D0' }]} />
      <View style={styles.pole} />
      <View style={styles.base} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: 140, height: 220, alignItems: 'center', justifyContent: 'flex-end' },
  glow: {
    position: 'absolute',
    top: 0,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.lampGlow,
    opacity: 0.45,
  },
  shade: {
    width: 110,
    height: 70,
    backgroundColor: colors.lampShade,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 4,
    borderColor: colors.border,
  },
  bulb: {
    width: 34,
    height: 22,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: colors.border,
  },
  pole: { width: 12, height: 70, backgroundColor: colors.border },
  base: {
    width: 90,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lampBase,
    borderWidth: 4,
    borderColor: colors.border,
  },
});
