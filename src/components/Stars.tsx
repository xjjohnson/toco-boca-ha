import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, radius, spacing } from '@/constants/theme';
import { useWallet } from '@/store/wallet';

const STAR = 'M12 1.5 L15 8.6 L22.6 9.2 L16.8 14.2 L18.6 21.6 L12 17.6 L5.4 21.6 L7.2 14.2 L1.4 9.2 L9 8.6 Z';

/** An original five-point star icon. */
export function StarIcon({ size = 24, dim }: { size?: number; dim?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={STAR} fill={dim ? '#E2DCEB' : '#FFD23F'} stroke={colors.border} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

/** A price tag: the star count, for buttons in the wardrobe and toy box. */
export function Price({ stars, short }: { stars: number; short?: boolean }) {
  return (
    <View style={[styles.price, short && styles.priceShort]}>
      <StarIcon size={18} />
      <Text style={styles.priceText}>{stars}</Text>
    </View>
  );
}

/** The kids' stars, top of the screen. It bounces when new stars arrive or when there aren't enough. */
export function StarCounter({ nudge }: { nudge?: number }) {
  const stars = useWallet((s) => s.stars);
  const gift = useWallet((s) => s.gift);
  const pop = useSharedValue(1);
  const [shown, setShown] = useState<number | null>(null);
  // Only celebrate stars that arrive while this counter is showing, not ones from before.
  const seen = useRef(gift?.n ?? 0);

  useEffect(() => {
    if (!gift || gift.n <= seen.current) return;
    seen.current = gift.n;
    pop.value = withSequence(withTiming(1.35, { duration: 160 }), withSpring(1, { damping: 5 }));
    setShown(gift.amount);
    const id = setTimeout(() => setShown(null), 2600);
    return () => clearTimeout(id);
  }, [gift, pop]);

  useEffect(() => {
    if (!nudge) return;
    pop.value = withSequence(withTiming(1.25, { duration: 120 }), withSpring(1, { damping: 4 }));
  }, [nudge, pop]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View>
      <Animated.View style={[styles.counter, style]} accessibilityLabel={`${stars} stars`}>
        <StarIcon size={30} />
        <Text style={styles.count}>{stars}</Text>
      </Animated.View>
      {shown !== null && (
        <View style={styles.gift} pointerEvents="none">
          <Text style={styles.giftText}>+{shown}</Text>
          <StarIcon size={26} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 3,
    borderColor: colors.border,
  },
  count: { fontSize: 24, fontWeight: '900', color: colors.text, minWidth: 20 },
  gift: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3B0',
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  giftText: { fontSize: 24, fontWeight: '900', color: colors.text },
  price: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  priceShort: { position: 'relative', right: 0, bottom: 0 },
  priceText: { fontSize: 16, fontWeight: '900', color: colors.text },
});
