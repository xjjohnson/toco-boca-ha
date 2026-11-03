import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/constants/theme';

const SIZE = 90;

interface Props {
  x: number;
  y: number;
  onDrop: (x: number, y: number) => void;
}

/**
 * A ball kids can drag around the room. It proves out the drag stack
 * (gesture handler + reanimated on the UI thread) that step 2's characters
 * and dress-up will use, and saves where it was dropped.
 */
export function DraggableBall({ x, y, onDrop }: Props) {
  const posX = useSharedValue(x);
  const posY = useSharedValue(y);
  const lifted = useSharedValue(0);

  // Follow the save when it loads or is reset.
  useEffect(() => {
    posX.value = x;
    posY.value = y;
  }, [x, y, posX, posY]);

  const pan = usePanGesture({
    onActivate: () => {
      'worklet';
      lifted.value = 1;
    },
    onUpdate: (e) => {
      'worklet';
      posX.value += e.changeX;
      posY.value += e.changeY;
    },
    onDeactivate: () => {
      'worklet';
      lifted.value = 0;
      scheduleOnRN(onDrop, posX.value, posY.value);
    },
  });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value - SIZE / 2 },
      { translateY: posY.value - SIZE / 2 },
      { scale: lifted.value ? 1.15 : 1 },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.ball, style]}
        accessibilityLabel="Ball, drag to move"
      >
        <View style={styles.stripe} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.border,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stripe: { height: 18, backgroundColor: colors.lampGlow },
});
