import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { CharacterArt, SLOT_CROP } from '@/art/Character';
import { colors, radius, spacing } from '@/constants/theme';
import { Price, StarCounter } from '@/components/Stars';
import { CHARACTERS, SLOTS, WARDROBE, type CharacterId, type Outfit, type Piece, type Slot } from '@/play/catalog';
import { isOwned, useWallet } from '@/store/wallet';

interface Props {
  who: CharacterId;
  outfit: Outfit;
  onWear: (slot: Slot, piece: string) => void;
  onDone: () => void;
}

/**
 * Dress-up: the character big on one side, the wardrobe on the other. Pick a
 * drawer (hats, tops, bottoms, shoes), then tap something to put it on. Every
 * button shows the character wearing it, so no reading is needed. Some
 * things cost stars: tapping one with enough stars buys it and puts it on.
 */
export function Wardrobe({ who, outfit, onWear, onDone }: Props) {
  const [slot, setSlot] = useState<Slot>('top');
  const [happy, setHappy] = useState(false);
  const [nudge, setNudge] = useState(0);
  const wallet = useWallet();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const figureH = Math.min(wide ? height * 0.78 : height * 0.42, 560);
  const tile = Math.max(84, Math.min(120, (wide ? width * 0.5 : width) / 4.6));

  const wear = (piece: Piece) => {
    const price = piece.price ?? 0;
    if (!isOwned(wallet, piece.id, price) && !wallet.buy(piece.id, price)) {
      // Not enough stars: the star counter wiggles to say so.
      setNudge((n) => n + 1);
      return;
    }
    onWear(slot, piece.id);
    setHappy(true);
    setTimeout(() => setHappy(false), 700);
  };

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { flexDirection: wide ? 'row' : 'column' }]}>
        <View style={styles.figure}>
          <View style={styles.spotlight} />
          <View style={styles.onTop}>
            <CharacterArt who={who} outfit={outfit} width={figureH * 0.52} height={figureH} happy={happy} />
          </View>
          <Text style={styles.name}>{CHARACTERS[who].name}</Text>
        </View>

        <View style={styles.closet}>
          <View style={styles.drawers}>
            {SLOTS.map(({ slot: s, label }) => (
              <Pressable
                key={s}
                onPress={() => setSlot(s)}
                accessibilityLabel={label}
                accessibilityState={{ selected: s === slot }}
                style={[styles.drawer, s === slot && styles.drawerOn]}
              >
                <CharacterArt who={who} outfit={outfit} width={56} height={56} viewBox={SLOT_CROP[s]} />
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.grid}>
            {WARDROBE[slot].map((piece) => {
              const on = outfit[slot] === piece.id;
              const locked = !isOwned(wallet, piece.id, piece.price);
              return (
                <Pressable
                  key={piece.id}
                  onPress={() => wear(piece)}
                  accessibilityLabel={locked ? `${piece.label}, ${piece.price} stars` : piece.label}
                  accessibilityState={{ selected: on }}
                  style={[
                    styles.tile,
                    { width: tile, height: tile },
                    on && styles.tileOn,
                    locked && styles.tileLocked,
                    locked && (piece.price ?? 0) > wallet.stars && styles.tileTooDear,
                  ]}
                >
                  <CharacterArt
                    who={who}
                    outfit={{ ...outfit, [slot]: piece.id }}
                    width={tile - 16}
                    height={tile - 16}
                    viewBox={SLOT_CROP[slot]}
                  />
                  {locked && <Price stars={piece.price ?? 0} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.stars} pointerEvents="none">
          <StarCounter nudge={nudge} />
        </View>

        <Pressable onPress={onDone} accessibilityLabel="Done" style={styles.done}>
          <Text style={styles.doneText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42,35,64,0.55)',
    padding: spacing.md,
    justifyContent: 'center',
    zIndex: 20000,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF7EC',
    borderRadius: radius.lg,
    borderWidth: 5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  figure: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  spotlight: {
    position: 'absolute',
    width: '80%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#FFE9B8',
  },
  onTop: { zIndex: 1 },
  name: { zIndex: 1, fontSize: 28, fontWeight: '900', color: colors.text, marginTop: spacing.sm },
  closet: { flex: 1.15, backgroundColor: '#FFE1EE', padding: spacing.md, gap: spacing.md },
  drawers: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  drawer: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOn: { borderColor: colors.border, backgroundColor: '#FFF3B0' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', paddingBottom: spacing.xl },
  tile: {
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: { borderColor: colors.primary, backgroundColor: '#FFF3B0' },
  tileLocked: { backgroundColor: '#F4EEFF' },
  tileTooDear: { opacity: 0.6 },
  stars: { position: 'absolute', top: spacing.md, left: spacing.md },
  done: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.good,
    borderWidth: 4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
});
