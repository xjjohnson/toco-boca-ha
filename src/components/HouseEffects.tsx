import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Rgb } from '@/ha/inbound';
import type { RoomSize } from '@/play/scene';
import { scaleFor } from '@/play/scene';
import type { RoomLight } from '@/store/house';

/**
 * Things in the game that mirror the real house: the room's light (with its
 * color), the robot vacuum, and music notes. All original art.
 */

const O = '#2A2340';
const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r},${g},${b},${a})`;

/** The room's look for its linked light: a colored glow when on, dim when off. */
export function lightWash(light: RoomLight | undefined, night: boolean): string | null {
  if (light?.on && light.color) return rgba(light.color, 0.1 + 0.16 * (light.brightness / 255));
  if (light && !light.on) return night ? 'rgba(10,8,40,0.5)' : 'rgba(16,14,48,0.22)';
  return night ? 'rgba(16,14,48,0.28)' : null;
}

/** A pendant lamp hanging from the ceiling, lit in the real light's color. */
export function CeilingLight({ size, light }: { size: RoomSize; light: RoomLight | undefined }) {
  const s = scaleFor(size);
  const w = 90 * s;
  const h = 70 * s;
  const lit = light?.on && light.color;
  return (
    <View pointerEvents="none" style={[styles.abs, { left: size.w * 0.3 - w / 2, top: 0, width: w, height: h }]}>
      <Svg width={w} height={h} viewBox="0 0 90 70">
        {lit && <Circle cx={45} cy={44} r={26} fill={rgba(light.color!, 0.5)} />}
        <Line x1={45} y1={0} x2={45} y2={14} stroke={O} strokeWidth={4} />
        <Path d="M17 42 Q17 14 45 14 Q73 14 73 42 Z" fill="#FFFFFF" stroke={O} strokeWidth={4} strokeLinejoin="round" />
        <Ellipse cx={45} cy={46} rx={13} ry={8} fill={lit ? rgba(light.color!, 1) : '#E8E2D0'} stroke={O} strokeWidth={3} />
      </Svg>
    </View>
  );
}

/** The robot vacuum: roams back and forth across the floor while cleaning, else sits on its dock. */
export function VacuumBot({ size, cleaning }: { size: RoomSize; cleaning: boolean }) {
  const s = scaleFor(size);
  const w = 110 * s;
  const h = 46 * s;
  const t = useSharedValue(0);
  const dir = useSharedValue(1);

  useEffect(() => {
    if (!cleaning) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    const lap = 5200;
    t.value = withRepeat(withTiming(1, { duration: lap, easing: Easing.inOut(Easing.sin) }), -1, true);
    dir.value = withRepeat(withSequence(withTiming(1, { duration: 0 }), withDelay(lap, withTiming(-1, { duration: 0 })), withDelay(lap, withTiming(1, { duration: 0 }))), -1);
  }, [cleaning, t, dir]);

  const style = useAnimatedStyle(() => {
    const x = cleaning ? 0.15 + t.value * 0.7 : 0.5;
    const y = cleaning ? 0.95 - Math.sin(t.value * Math.PI * 3) * 0.03 : 0.97;
    return {
      transform: [{ translateX: x * size.w - w / 2 }, { translateY: y * size.h - h }, { scaleX: cleaning ? dir.value : 1 }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.abs, { width: w, height: h, zIndex: 9000 }, style]}>
      <Svg width={w} height={h} viewBox="0 0 110 46">
        {!cleaning && <Rect x={34} y={30} width={42} height={14} rx={4} fill="#9AA9BA" stroke={O} strokeWidth={3} />}
        <Ellipse cx={55} cy={30} rx={46} ry={14} fill="#5B6375" stroke={O} strokeWidth={4} />
        <Ellipse cx={55} cy={22} rx={42} ry={14} fill="#E9EEF5" stroke={O} strokeWidth={4} />
        <Circle cx={55} cy={18} r={7} fill={cleaning ? '#3CC48A' : '#4FB3FF'} stroke={O} strokeWidth={3} />
        <Circle cx={80} cy={21} r={3.5} fill={O} />
        <Circle cx={92} cy={22} r={3.5} fill={O} />
        {cleaning && (
          <G>
            <Line x1={4} y1={34} x2={-2} y2={30} stroke="#9AA9BA" strokeWidth={3} />
            <Line x1={4} y1={36} x2={-2} y2={40} stroke="#9AA9BA" strokeWidth={3} />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

function Note({ size, x, delay, color }: { size: RoomSize; x: number; delay: number; color: string }) {
  const s = scaleFor(size);
  const w = 40 * s;
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1));
    return () => cancelAnimation(rise);
  }, [rise, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: rise.value < 0.1 ? rise.value * 10 : 1 - (rise.value - 0.1) / 0.9,
    transform: [
      { translateX: x * size.w + Math.sin(rise.value * Math.PI * 2) * 14 * s },
      { translateY: size.h * (0.75 - rise.value * 0.5) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.abs, { width: w, height: w, zIndex: 9500 }, style]}>
      <Svg width={w} height={w} viewBox="0 0 40 40">
        <Path d="M14 30 V6 L32 2 V24" fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
        <Ellipse cx={10} cy={30} rx={6} ry={5} fill={color} />
        <Ellipse cx={28} cy={25} rx={6} ry={5} fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Music notes floating up while music plays in the house. */
export function MusicNotes({ size }: { size: RoomSize }) {
  return (
    <>
      <Note size={size} x={0.18} delay={0} color="#7A5CFF" />
      <Note size={size} x={0.42} delay={900} color="#FF6FB5" />
      <Note size={size} x={0.66} delay={1700} color="#2F6FEB" />
      <Note size={size} x={0.84} delay={500} color="#3CC48A" />
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
});
