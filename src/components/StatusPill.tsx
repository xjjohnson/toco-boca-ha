import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { useConnection } from '@/store/connection';
import { useSyncQueue } from '@/store/syncQueue';

/** A small badge: is the house connected, and is anything waiting to send? */
export function StatusPill() {
  const online = useConnection((s) => s.online);
  const ha = useConnection((s) => s.ha);
  const waiting = useSyncQueue((s) => s.items.length);

  let label: string;
  let dot: string;
  if (!online) {
    label = 'Playing offline';
    dot = colors.off;
  } else if (ha === 'connected') {
    label = 'House connected';
    dot = colors.good;
  } else {
    label = ha === 'connecting' ? 'Finding the house…' : 'House asleep';
    dot = colors.waiting;
  }
  if (waiting > 0) label += ` · ${waiting} waiting`;

  return (
    <View style={styles.pill} accessibilityRole="text" accessibilityLabel={label}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
