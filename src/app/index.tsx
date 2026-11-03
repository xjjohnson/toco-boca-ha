import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DraggableBall } from '@/components/DraggableBall';
import { Lamp } from '@/components/Lamp';
import { StatusPill } from '@/components/StatusPill';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorld } from '@/store/world';
import { tellHome } from '@/sync';

/** The custom event the game fires so Home Assistant automations can react. */
const ACTION_EVENT = 'toybox_town_action';

export default function Playroom() {
  const world = useWorld();
  const night = world.timeOfDay === 'night';
  const hooray = useHooray(world.celebrations);

  const toggleLamp = () => {
    const on = !world.lampOn;
    world.setLamp(on);
    // Only the newest lamp state matters, so repeated taps while offline collapse into one.
    tellHome({ kind: 'fireEvent', eventType: ACTION_EVENT, data: { toy: 'lamp', on } }, 'lamp');
  };

  return (
    <View style={[styles.room, { backgroundColor: night ? colors.wallNight : colors.wall }]}>
      <View style={[styles.window, { backgroundColor: night ? colors.nightSky : colors.daySky }]}>
        <View style={[styles.sun, night && styles.moon]} />
      </View>
      <View style={[styles.floor, { backgroundColor: night ? colors.floorNight : colors.floor }]} />

      <View style={styles.lamp}>
        <Lamp on={world.lampOn} onToggle={toggleLamp} />
      </View>

      <DraggableBall x={world.ball.x} y={world.ball.y} onDrop={world.moveBall} />

      <View style={styles.topBar} pointerEvents="box-none">
        {/* A long press keeps little fingers out of the grown-ups screen. */}
        <Pressable
          onLongPress={() => router.push('/grown-ups')}
          delayLongPress={1200}
          accessibilityLabel="Grown-ups, press and hold"
          style={styles.grownUps}
        >
          <Text style={styles.grownUpsText}>⚙︎</Text>
        </Pressable>
        <StatusPill />
      </View>

      {hooray && (
        <View style={styles.hooray} pointerEvents="none">
          <Text style={styles.hoorayText}>Hooray!</Text>
        </View>
      )}

      {world.visitor && (
        <Pressable style={styles.banner} onPress={world.dismissVisitor}>
          <Text style={styles.bannerText}>Knock knock! {world.visitor} is at the door</Text>
        </Pressable>
      )}
    </View>
  );
}

/** True for a few seconds after each new celebration (not on app start). */
function useHooray(count: number): boolean {
  const seen = useRef(count);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (count <= seen.current) {
      seen.current = count;
      return;
    }
    seen.current = count;
    setShow(true);
    const id = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(id);
  }, [count]);
  return show;
}

const styles = StyleSheet.create({
  room: { flex: 1, overflow: 'hidden' },
  window: {
    position: 'absolute',
    top: 70,
    left: '55%',
    width: 200,
    height: 150,
    borderRadius: radius.md,
    borderWidth: 6,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.lampGlow,
  },
  moon: { backgroundColor: '#F4F1FF', left: 120 },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' },
  lamp: { position: 'absolute', left: '12%', bottom: '18%' },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grownUps: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grownUpsText: { fontSize: 24, color: colors.text },
  banner: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  hooray: { position: 'absolute', top: '30%', alignSelf: 'center' },
  hoorayText: { fontSize: 72, fontWeight: '900', color: colors.primary },
  bannerText: { fontSize: 24, fontWeight: '800', color: colors.text },
});
