import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { ThingArt } from '@/art/Things';
import { Price, StarCounter } from '@/components/Stars';
import { colors, radius, spacing } from '@/constants/theme';
import { SHOP_TOYS, THINGS, type RoomId, type ThingKind } from '@/play/catalog';
import { useWallet } from '@/store/wallet';
import { useWorld } from '@/store/world';

/**
 * The toy box: toys to buy with stars. A bought toy pops into the room
 * you're in; tapping one you already have brings it here from wherever it is.
 */
export function ToyBox({ room, onDone }: { room: RoomId; onDone: () => void }) {
  const wallet = useWallet();
  const bringToy = useWorld((s) => s.bringToy);
  const [nudge, setNudge] = useState(0);

  const pick = (kind: ThingKind) => {
    const price = THINGS[kind].price ?? 0;
    if (wallet.owned.includes(kind) || wallet.buy(kind, price)) {
      bringToy(kind, room);
      onDone();
    } else {
      setNudge((n) => n + 1);
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <View style={styles.header}>
          <StarCounter nudge={nudge} />
          <Pressable onPress={onDone} accessibilityLabel="Close" style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {SHOP_TOYS.map((kind) => (
            <ToyTile
              key={kind}
              kind={kind}
              owned={wallet.owned.includes(kind)}
              affordable={wallet.stars >= (THINGS[kind].price ?? 0)}
              onPress={() => pick(kind)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function ToyTile({ kind, owned, affordable, onPress }: { kind: ThingKind; owned: boolean; affordable: boolean; onPress: () => void }) {
  const def = THINGS[kind];
  const shake = useSharedValue(0);
  const fit = Math.min(110 / def.w, 110 / def.h);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  return (
    <Pressable
      onPress={() => {
        if (!owned && !affordable) {
          shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 }));
        }
        onPress();
      }}
      accessibilityLabel={owned ? `${def.label}, bring it here` : `${def.label}, ${def.price} stars`}
    >
      <Animated.View style={[styles.tile, owned && styles.tileOwned, !owned && !affordable && styles.tileTooDear, style]}>
        <ThingArt kind={kind} width={def.w * fit} height={def.h * fit} />
        {!owned && <Price stars={def.price ?? 0} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42,35,64,0.55)',
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20000,
  },
  card: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '100%',
    backgroundColor: '#FFF1D6',
    borderRadius: radius.lg,
    borderWidth: 5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 28, fontWeight: '900', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', paddingBottom: spacing.md },
  tile: {
    width: 140,
    height: 140,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOwned: { backgroundColor: '#E3F7EE' },
  tileTooDear: { opacity: 0.6 },
});
