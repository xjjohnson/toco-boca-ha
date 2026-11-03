import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { CharacterArt } from '@/art/Character';
import { RoomArt } from '@/art/Room';
import { ThingArt } from '@/art/Things';
import { Draggable } from '@/components/Draggable';
import { StatusPill } from '@/components/StatusPill';
import { Wardrobe } from '@/components/Wardrobe';
import { colors, radius, spacing } from '@/constants/theme';
import { CHARACTER_SIZE, CHARACTERS, ROOMS, THINGS, type CharacterId, type RoomId } from '@/play/catalog';
import {
  arrivalSpot,
  depthOf,
  doorAt,
  restingSpot,
  scaleFor,
  spriteFraction,
  surfacesIn,
  type RoomSize,
} from '@/play/scene';
import { useWorld } from '@/store/world';

export default function Playroom() {
  const world = useWorld();
  const [size, setSize] = useState<RoomSize | null>(null);
  const [dressing, setDressing] = useState<CharacterId | null>(null);
  const [held, setHeld] = useState<CharacterId | null>(null);
  const night = world.timeOfDay === 'night';
  const hooray = useHooray(world.celebrations);
  const room = ROOMS[world.room];

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };

  const things = useMemo(() => Object.values(world.things), [world.things]);
  const tops = useMemo(() => (size ? surfacesIn(world.room, things, size) : []), [world.room, things, size]);

  /**
   * Where something let go of at (x, y) ends up: through the door into the
   * next room (and the view follows), or resting on the floor or a top.
   * `centerUp` is how far its middle is above its feet, for the door check.
   */
  const placeDrop = (selfId: string, x: number, y: number, centerUp: number) => {
    if (!size) return null;
    const through = doorAt(world.room, x, y - centerUp);
    if (through) return { through, spot: arrivalSpot(through) };
    const others = things.filter((t) => t.id !== selfId);
    return { through: null, spot: restingSpot(world.room, others, size, x, y) };
  };

  const toggle = (id: string) => {
    const thing = world.things[id];
    const on = !thing.on;
    world.setThingOn(id, on);
  };

  const walkTo = (to: RoomId) => world.goTo(to);

  const lampLit = things.some((t) => t.room === world.room && t.kind === 'lamp' && t.on);

  const sprites = size
    ? [
        ...things
          .filter((t) => t.room === world.room)
          .map((t) => {
            const def = THINGS[t.kind];
            const s = scaleFor(size);
            const w = def.w * s;
            const h = def.h * s;
            return {
              key: `thing:${t.id}`,
              depth: depthOf(t.y, t.x, tops),
              el: (z: number) => (
                <Draggable
                  key={`thing:${t.id}`}
                  x={t.x}
                  y={t.y}
                  width={w}
                  height={h}
                  room={size}
                  z={z}
                  fixed={def.fixed}
                  label={def.switchable ? `${def.label}, ${t.on ? 'on' : 'off'}` : def.label}
                  onTap={def.switchable ? () => toggle(t.id) : undefined}
                  onDrop={(x, y) => {
                    const drop = placeDrop(t.id, x, y, spriteFraction(def, size).h / 2);
                    if (!drop) return null;
                    if (drop.through) {
                      world.moveThing(t.id, drop.spot.x, drop.spot.y, drop.through);
                      walkTo(drop.through);
                      return null;
                    }
                    world.moveThing(t.id, drop.spot.x, drop.spot.y);
                    return drop.spot;
                  }}
                >
                  <ThingArt kind={t.kind} on={t.on} width={w} height={h} />
                </Draggable>
              ),
            };
          }),
        ...Object.values(world.characters)
          .filter((c) => c.room === world.room)
          .map((c) => {
            const s = scaleFor(size);
            const w = CHARACTER_SIZE.w * s;
            const h = CHARACTER_SIZE.h * s;
            return {
              key: `who:${c.id}`,
              depth: depthOf(c.y, c.x, tops),
              el: (z: number) => (
                <Draggable
                  key={`who:${c.id}`}
                  x={c.x}
                  y={c.y}
                  width={w}
                  height={h}
                  room={size}
                  z={z}
                  label={`${CHARACTERS[c.id].name}, tap to dress up`}
                  onTap={() => setDressing(c.id)}
                  onLift={(up) => setHeld(up ? c.id : null)}
                  onDrop={(x, y) => {
                    const drop = placeDrop(c.id, x, y, spriteFraction(CHARACTER_SIZE, size).h / 2);
                    if (!drop) return null;
                    if (drop.through) {
                      world.moveCharacter(c.id, drop.spot.x, drop.spot.y, drop.through);
                      walkTo(drop.through);
                      return null;
                    }
                    world.moveCharacter(c.id, drop.spot.x, drop.spot.y);
                    return drop.spot;
                  }}
                >
                  <CharacterArt who={c.id} outfit={c.outfit} width={w} height={h} happy={held === c.id} />
                </Draggable>
              ),
            };
          }),
      ]
        .sort((a, b) => a.depth - b.depth)
        .map((sprite, i) => sprite.el(i + 1))
    : null;

  const door = room.door;
  const dressingWho = dressing ? world.characters[dressing] : null;
  const closeWardrobe = () => setDressing(null);

  return (
    <View style={styles.room} onLayout={onLayout}>
      {size && (
        <>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <RoomArt room={world.room} width={size.w} height={size.h} night={night} />
          </View>

          <Pressable
            onPress={() => walkTo(door.to)}
            accessibilityLabel={`Go to the ${ROOMS[door.to].name.toLowerCase()}`}
            style={[
              styles.door,
              { left: door.x * size.w, top: door.y * size.h, width: door.w * size.w, height: door.h * size.h },
            ]}
          />

          {sprites}

          {night && (
            <View
              pointerEvents="none"
              style={[styles.night, { backgroundColor: lampLit ? 'rgba(255,200,90,0.08)' : 'rgba(16,14,48,0.28)' }]}
            />
          )}
        </>
      )}

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

      {dressingWho && (
        <Wardrobe
          who={dressingWho.id}
          outfit={dressingWho.outfit}
          onWear={(slot, piece) => world.wear(dressingWho.id, slot, piece)}
          onDone={closeWardrobe}
        />
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
  room: { flex: 1, overflow: 'hidden', backgroundColor: colors.wall },
  door: { position: 'absolute' },
  night: { ...StyleSheet.absoluteFill, zIndex: 15000 },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 16000,
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
    zIndex: 16000,
  },
  hooray: { position: 'absolute', top: '30%', alignSelf: 'center', zIndex: 16000 },
  hoorayText: { fontSize: 72, fontWeight: '900', color: colors.primary },
  bannerText: { fontSize: 24, fontWeight: '800', color: colors.text },
});
