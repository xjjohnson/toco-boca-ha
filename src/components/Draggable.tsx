import { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

interface Props {
  /** Where its feet are, as room fractions. */
  x: number;
  y: number;
  /** Its size on screen, in points. */
  width: number;
  height: number;
  room: { w: number; h: number };
  /** Draw order among the room's sprites. */
  z: number;
  /** Furniture can be tapped but not moved. */
  fixed?: boolean;
  label: string;
  onTap?: () => void;
  /** Called with where it was let go. Return where it should settle (it springs there), or nothing to stay put. */
  onDrop?: (x: number, y: number) => { x: number; y: number } | null | void;
  /** Lets the art react while it's held, e.g. a big smile. */
  onLift?: (lifted: boolean) => void;
  children: ReactNode;
}

/**
 * Anything in a room kids can touch. Dragging runs on the UI thread (gesture
 * handler + reanimated); a tap gives a little squish and calls onTap. Big hit
 * boxes and a lift-up scale make it easy for small hands.
 */
export function Draggable({ x, y, width, height, room, z, fixed, label, onTap, onDrop, onLift, children }: Props) {
  const posX = useSharedValue(x * room.w);
  const posY = useSharedValue(y * room.h);
  const lifted = useSharedValue(0);
  const squish = useSharedValue(1);

  // Follow the save when it loads, is reset, the house moves something, or the screen resizes.
  useEffect(() => {
    posX.value = x * room.w;
    posY.value = y * room.h;
  }, [x, y, room.w, room.h, posX, posY]);

  const settle = (fx: number, fy: number) => {
    onLift?.(false);
    const spot = onDrop?.(fx, fy);
    if (spot) {
      posX.value = withSpring(spot.x * room.w, { damping: 14 });
      posY.value = withSpring(spot.y * room.h, { damping: 12, stiffness: 140 });
    }
  };

  const lift = () => onLift?.(true);

  const tapped = () => onTap?.();

  const pan = usePanGesture({
    enabled: !fixed,
    minDistance: 6,
    onActivate: () => {
      'worklet';
      lifted.value = withTiming(1, { duration: 120 });
      scheduleOnRN(lift);
    },
    onUpdate: (e) => {
      'worklet';
      posX.value += e.changeX;
      posY.value += e.changeY;
    },
    onDeactivate: () => {
      'worklet';
      lifted.value = withTiming(0, { duration: 160 });
      scheduleOnRN(settle, posX.value / room.w, posY.value / room.h);
    },
  });

  const tap = useTapGesture({
    maxDistance: 12,
    onActivate: () => {
      'worklet';
      squish.value = withSequence(withTiming(0.88, { duration: 80 }), withSpring(1, { damping: 6 }));
      scheduleOnRN(tapped);
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const style = useAnimatedStyle(() => ({
    zIndex: lifted.value > 0 ? 10000 : z,
    transform: [
      { translateX: posX.value - width / 2 },
      { translateY: posY.value - height },
      // Grow from the feet, so lifting looks like a hop.
      { translateY: height / 2 },
      { scale: (1 + lifted.value * 0.12) * squish.value },
      { translateY: -height / 2 },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.sprite, { width, height }, style]}
        accessibilityLabel={label}
        accessibilityRole={onTap ? 'button' : undefined}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute', left: 0, top: 0 },
});
