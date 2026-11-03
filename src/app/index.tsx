import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePinchGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path, Rect } from 'react-native-svg';

import { HouseView } from '@/components/HouseView';
import { RoomScene } from '@/components/RoomScene';
import { StarCounter } from '@/components/Stars';
import { StatusPill } from '@/components/StatusPill';
import { ToyBox } from '@/components/ToyBox';
import { Wardrobe } from '@/components/Wardrobe';
import { colors, radius, spacing } from '@/constants/theme';
import type { CharacterId, RoomId } from '@/play/catalog';
import { houseLayout, roomAt, zoomInto } from '@/play/house';
import type { RoomSize } from '@/play/scene';
import { useWorld } from '@/store/world';

const ZOOM_MS = 420;

/**
 * The game: the whole cutaway house, and each room up close. Tap a room (or
 * spread two fingers on it) to zoom in; pinch, or tap the house button, to
 * pull back out.
 */
export default function Play() {
  const world = useWorld();
  const [screen, setScreen] = useState<RoomSize | null>(null);
  /** null = looking at the whole house. */
  const [inside, setInside] = useState<RoomId | null>(null);
  /** The room the zoom animation heads into or comes out of. */
  const [focus, setFocus] = useState<RoomId>(world.room);
  const [dressing, setDressing] = useState<CharacterId | null>(null);
  const [shopping, setShopping] = useState(false);
  const hooray = useHooray(world.celebrations);

  const zoom = useSharedValue(0);
  const pinch = useSharedValue(1);
  const busy = useRef(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setScreen({ w: width, h: height });
  };

  const layout = useMemo(() => (screen ? houseLayout(screen) : null), [screen]);
  const target = layout && screen ? zoomInto(layout.cells[focus], screen) : { scale: 1, tx: 0, ty: 0 };

  const arrive = (room: RoomId) => {
    busy.current = false;
    world.goTo(room);
    setInside(room);
  };

  const enter = (room: RoomId) => {
    if (busy.current || inside) return;
    busy.current = true;
    setFocus(room);
    // Let the focus render, then fly in.
    requestAnimationFrame(() => {
      zoom.value = withTiming(1, { duration: ZOOM_MS, easing: Easing.inOut(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(arrive, room);
      });
    });
  };

  const leave = () => {
    if (busy.current || !inside) return;
    busy.current = true;
    setFocus(inside);
    setInside(null);
    zoom.value = 1;
    zoom.value = withTiming(0, { duration: ZOOM_MS, easing: Easing.inOut(Easing.cubic) }, () => {
      scheduleOnRN(() => {
        busy.current = false;
      });
    });
  };

  // Walking through a door keeps the zoom pointed at the room you're in.
  const walkTo = (room: RoomId) => {
    world.goTo(room);
    setInside(room);
    setFocus(room);
  };

  const pinchEnd = (scale: number, fx: number, fy: number) => {
    if (inside && scale < 0.85) leave();
    else if (!inside && scale > 1.2 && layout) {
      const room = roomAt(layout, fx, fy);
      if (room) enter(room);
    }
  };

  const pinchGesture = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      pinch.value = Math.min(1.5, Math.max(0.7, e.scale));
    },
    onDeactivate: (e) => {
      'worklet';
      scheduleOnRN(pinchEnd, e.scale, e.focalX, e.focalY);
      pinch.value = withSpring(1, { damping: 15 });
    },
  });

  const houseStyle = useAnimatedStyle(() => {
    const p = zoom.value;
    return {
      transform: [
        { translateX: target.tx * p },
        { translateY: target.ty * p },
        { scale: (1 + (target.scale - 1) * p) * pinch.value },
      ],
    };
  });

  const roomStyle = useAnimatedStyle(() => ({ transform: [{ scale: Math.min(1, pinch.value) }] }));

  return (
    <View style={styles.screen} onLayout={onLayout}>
      {screen && layout && (
        <GestureDetector gesture={pinchGesture}>
          <View style={StyleSheet.absoluteFill}>
            {inside ? (
              <Animated.View style={[StyleSheet.absoluteFill, roomStyle]}>
                <RoomScene room={inside} size={screen} onWalkTo={walkTo} onDress={setDressing} />
              </Animated.View>
            ) : (
              <Animated.View style={[StyleSheet.absoluteFill, houseStyle]}>
                <HouseView screen={screen} layout={layout} onEnter={enter} />
              </Animated.View>
            )}
          </View>
        </GestureDetector>
      )}

      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.row} pointerEvents="box-none">
          {/* A long press keeps little fingers out of the grown-ups screen. */}
          <Pressable
            onLongPress={() => router.push('/grown-ups')}
            delayLongPress={1200}
            accessibilityLabel="Grown-ups, press and hold"
            style={styles.grownUps}
          >
            <Text style={styles.grownUpsText}>⚙︎</Text>
          </Pressable>
          {inside && (
            <Pressable onPress={leave} accessibilityLabel="See the whole house" style={styles.bigButton}>
              <HouseIcon />
            </Pressable>
          )}
        </View>
        <StarCounter />
        <StatusPill />
      </View>

      {inside && (
        <Pressable onPress={() => setShopping(true)} accessibilityLabel="Toy box" style={[styles.bigButton, styles.toyBox]}>
          <ToyBoxIcon />
        </Pressable>
      )}

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

      {dressing && (
        <Wardrobe
          who={dressing}
          outfit={world.characters[dressing].outfit}
          onWear={(slot, piece) => world.wear(dressing, slot, piece)}
          onDone={() => setDressing(null)}
        />
      )}

      {shopping && inside && <ToyBox room={inside} onDone={() => setShopping(false)} />}
    </View>
  );
}

function HouseIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Path d="M4 20 L20 5 L36 20 Z" fill="#F25C54" stroke={colors.border} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={9} y={19} width={22} height={17} fill="#FFD9A8" stroke={colors.border} strokeWidth={3} />
      <Rect x={17} y={25} width={7} height={11} fill="#FF9F68" stroke={colors.border} strokeWidth={2} />
    </Svg>
  );
}

function ToyBoxIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Path d="M10 6 Q16 2 20 10" fill="none" stroke="#FF6FB5" strokeWidth={4} strokeLinecap="round" />
      <Rect x={22} y={4} width={12} height={12} rx={2} fill="#4FB3FF" stroke={colors.border} strokeWidth={2.5} />
      <Rect x={4} y={18} width={40} height={26} rx={5} fill="#FF9F68" stroke={colors.border} strokeWidth={3} />
      <Rect x={2} y={14} width={44} height={8} rx={3} fill="#FFD23F" stroke={colors.border} strokeWidth={3} />
      <Path d="M24 26 L26 30.5 L31 31 L27.2 34.2 L28.4 39 L24 36.4 L19.6 39 L20.8 34.2 L17 31 L22 30.5 Z" fill="#FFF3B0" stroke={colors.border} strokeWidth={1.5} />
    </Svg>
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
  screen: { flex: 1, overflow: 'hidden', backgroundColor: colors.daySky },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 16000,
  },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  grownUps: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grownUpsText: { fontSize: 24, color: colors.text },
  bigButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toyBox: { position: 'absolute', right: spacing.md, bottom: spacing.md, zIndex: 16000 },
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
    zIndex: 16000,
  },
  hooray: { position: 'absolute', top: '30%', alignSelf: 'center', zIndex: 16000 },
  hoorayText: { fontSize: 72, fontWeight: '900', color: colors.primary },
  bannerText: { fontSize: 24, fontWeight: '800', color: colors.text },
});
