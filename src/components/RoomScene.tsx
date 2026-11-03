import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CharacterArt } from '@/art/Character';
import { RoomArt } from '@/art/Room';
import { ThingArt } from '@/art/Things';
import { Draggable } from '@/components/Draggable';
import { CeilingLight, lightWash, MusicNotes, VacuumBot } from '@/components/HouseEffects';
import { CHARACTER_SIZE, CHARACTERS, ROOMS, THINGS, type CharacterId, type RoomId } from '@/play/catalog';
import {
  arrivalSpot,
  clampSpot,
  depthOf,
  doorAt,
  restingSpot,
  scaleFor,
  spriteFraction,
  surfacesIn,
  type RoomSize,
} from '@/play/scene';
import { isMusicPlaying, useHouse } from '@/store/house';
import { useWorld } from '@/store/world';

/** The room the robot vacuum lives in when it's docked. */
export const VACUUM_DOCK: RoomId = 'kitchen';

interface Props {
  room: RoomId;
  size: RoomSize;
  /**
   * A small picture of the room inside the house view. Only characters can be
   * picked up (to carry them to another room); everything else is scenery.
   */
  mini?: boolean;
  /** Whether the cleaning robot vacuum is passing through this room. */
  vacuumHere?: boolean;
  onWalkTo?: (room: RoomId) => void;
  onDress?: (who: CharacterId) => void;
  /** Mini only: a character was let go at (x, y) in this room's fractions. Return where it settles here, or null if it left. */
  onCarry?: (who: CharacterId, x: number, y: number) => { x: number; y: number } | null;
  onHold?: (holding: boolean) => void;
}

/**
 * One room with everything in it: the backdrop, furniture, toys and
 * characters, plus what the real house is doing (its light, music, the
 * vacuum). Used full screen to play in, and small inside the house view.
 */
export function RoomScene({ room, size, mini, vacuumHere, onWalkTo, onDress, onCarry, onHold }: Props) {
  const world = useWorld();
  const light = useHouse((s) => s.lights[room]);
  const vacuumCleaning = useHouse((s) => s.vacuumCleaning);
  const music = useHouse(isMusicPlaying);
  const [held, setHeld] = useState<CharacterId | null>(null);
  const night = world.timeOfDay === 'night';
  const def = ROOMS[room];

  const things = useMemo(() => Object.values(world.things), [world.things]);
  const tops = useMemo(() => surfacesIn(room, things, size), [room, things, size]);
  const s = scaleFor(size);

  /**
   * Where something let go of at (x, y) ends up: through the door into the
   * next room, or resting on the floor or a top. `centerUp` is how far its
   * middle is above its feet, for the door check.
   */
  const placeDrop = (selfId: string, x: number, y: number, centerUp: number, floats = false) => {
    const through = doorAt(room, x, y - centerUp);
    if (through) return { through, spot: arrivalSpot(through) };
    if (floats) return { through: null, spot: clampSpot(x, y) };
    const others = things.filter((t) => t.id !== selfId);
    return { through: null, spot: restingSpot(room, others, size, x, y) };
  };

  const thingSprites = things
    .filter((t) => t.room === room)
    .map((t) => {
      const thing = THINGS[t.kind];
      const w = thing.w * s;
      const h = thing.h * s;
      return {
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
            inert={mini}
            fixed={thing.fixed}
            label={thing.switchable ? `${thing.label}, ${t.on ? 'on' : 'off'}` : thing.label}
            onTap={thing.switchable ? () => world.setThingOn(t.id, !t.on) : undefined}
            onDrop={(x, y) => {
              const drop = placeDrop(t.id, x, y, spriteFraction(thing, size).h / 2, thing.floats);
              if (drop.through) {
                world.moveThing(t.id, drop.spot.x, drop.spot.y, drop.through);
                onWalkTo?.(drop.through);
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
    });

  const characterSprites = Object.values(world.characters)
    .filter((c) => c.room === room)
    .map((c) => {
      const w = CHARACTER_SIZE.w * s;
      const h = CHARACTER_SIZE.h * s;
      return {
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
            dance={music && held !== c.id}
            label={mini ? CHARACTERS[c.id].name : `${CHARACTERS[c.id].name}, tap to dress up`}
            onTap={mini ? undefined : () => onDress?.(c.id)}
            onLift={(up) => {
              setHeld(up ? c.id : null);
              onHold?.(up);
            }}
            onDrop={(x, y) => {
              if (mini) return onCarry?.(c.id, x, y) ?? null;
              const drop = placeDrop(c.id, x, y, spriteFraction(CHARACTER_SIZE, size).h / 2);
              if (drop.through) {
                world.moveCharacter(c.id, drop.spot.x, drop.spot.y, drop.through);
                onWalkTo?.(drop.through);
                return null;
              }
              world.moveCharacter(c.id, drop.spot.x, drop.spot.y);
              return drop.spot;
            }}
          >
            <CharacterArt who={c.id} outfit={c.outfit} width={w} height={h} happy={held === c.id || music} />
          </Draggable>
        ),
      };
    });

  const sprites = [...thingSprites, ...characterSprites].sort((a, b) => a.depth - b.depth).map((sp, i) => sp.el(i + 1));
  const wash = lightWash(light, night);
  const door = def.door;
  const showVacuum = vacuumCleaning ? vacuumHere : room === VACUUM_DOCK;

  return (
    <View style={[styles.room, { width: size.w, height: size.h }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <RoomArt room={room} width={size.w} height={size.h} night={night} />
      </View>

      {!mini && (
        <Pressable
          onPress={() => onWalkTo?.(door.to)}
          accessibilityLabel={`Go to the ${ROOMS[door.to].name.toLowerCase()}`}
          style={[styles.abs, { left: door.x * size.w, top: door.y * size.h, width: door.w * size.w, height: door.h * size.h }]}
        />
      )}

      <CeilingLight size={size} light={light} />
      {sprites}
      {showVacuum && <VacuumBot size={size} cleaning={vacuumCleaning} />}
      {music && <MusicNotes size={size} />}

      {wash && <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wash, { backgroundColor: wash }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  room: { overflow: 'visible' },
  abs: { position: 'absolute' },
  wash: { zIndex: 15000 },
});
