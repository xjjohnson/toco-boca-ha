import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { RoomScene } from '@/components/RoomScene';
import { ROOMS, type CharacterId, type Rect as Box, type RoomId } from '@/play/catalog';
import { roomAt, type HouseLayout } from '@/play/house';
import { restingSpot, type RoomSize } from '@/play/scene';
import { useHouse } from '@/store/house';
import { useWorld } from '@/store/world';

const O = '#2A2340';
const ROOM_ORDER: RoomId[] = ['kitchen', 'living', 'bathroom', 'bedroom'];

/** While the real vacuum cleans, its little twin wanders from room to room. */
function useVacuumRoom(cleaning: boolean): RoomId {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!cleaning) return;
    const id = setInterval(() => setI((n) => (n + 1) % ROOM_ORDER.length), 10_400);
    return () => clearInterval(id);
  }, [cleaning]);
  return ROOM_ORDER[i];
}

interface Props {
  screen: RoomSize;
  layout: HouseLayout;
  onEnter: (room: RoomId) => void;
}

/**
 * The whole house, cut away so every room shows. Each room is live: lights,
 * music and the vacuum show here too. Tap a room to zoom in; pick a
 * character up and drop them in another room to move them, upstairs or down.
 */
export function HouseView({ screen, layout, onEnter }: Props) {
  const night = useWorld((s) => s.timeOfDay === 'night');
  const characters = useWorld((s) => s.characters);
  const things = useWorld((s) => s.things);
  const moveCharacter = useWorld((s) => s.moveCharacter);
  const cleaning = useHouse((s) => s.vacuumCleaning);
  const vacuumRoom = useVacuumRoom(cleaning);
  const [carrying, setCarrying] = useState<RoomId | null>(null);
  const { house, cells, roofTop, groundY, wall } = layout;

  const carry = (from: RoomId, who: CharacterId, fx: number, fy: number) => {
    const cell = cells[from];
    const px = cell.x + fx * cell.w;
    const py = cell.y + fy * cell.h;
    const to = roomAt(layout, px, py);
    const size = { w: cells[from].w, h: cells[from].h };
    if (!to) return { x: characters[who].x, y: characters[who].y };
    const target = cells[to];
    const tx = (px - target.x) / target.w;
    const ty = (py - target.y) / target.h;
    const spot = restingSpot(to, Object.values(things), size, tx, ty);
    if (to === from) {
      moveCharacter(who, spot.x, spot.y);
      return spot;
    }
    moveCharacter(who, spot.x, spot.y, to);
    return null;
  };

  const overhang = wall * 3;
  const sky = night ? '#2B2D5C' : '#BFE7FF';

  return (
    <View style={[styles.fill, { backgroundColor: sky }]}>
      <Svg width={screen.w} height={screen.h} style={StyleSheet.absoluteFill} pointerEvents="none">
        {night ? (
          <G>
            <Circle cx={screen.w * 0.86} cy={screen.h * 0.16} r={34} fill="#F4F1FF" />
            <Circle cx={screen.w * 0.86 + 14} cy={screen.h * 0.16 - 8} r={30} fill={sky} />
            {[0.1, 0.22, 0.4, 0.62, 0.74, 0.94].map((fx, i) => (
              <Circle key={fx} cx={screen.w * fx} cy={screen.h * (i % 2 ? 0.12 : 0.24)} r={3} fill="#FFFFFF" />
            ))}
          </G>
        ) : (
          <G>
            <Circle cx={screen.w * 0.88} cy={screen.h * 0.15} r={42} fill="#FFE27A" />
            <Ellipse cx={screen.w * 0.14} cy={screen.h * 0.2} rx={60} ry={20} fill="#FFFFFF" />
            <Ellipse cx={screen.w * 0.18} cy={screen.h * 0.17} rx={34} ry={20} fill="#FFFFFF" />
          </G>
        )}
        <Rect x={0} y={groundY} width={screen.w} height={screen.h - groundY} fill={night ? '#2E6B4A' : '#7FD36B'} />
        <Rect x={0} y={groundY} width={screen.w} height={8} fill={night ? '#245A3D' : '#5DBB4C'} />
        {/* A tree beside the house. */}
        {house.x > 90 && (
          <G>
            <Rect x={house.x / 2 - 10} y={groundY - 110} width={20} height={110} fill="#8A4B2A" stroke={O} strokeWidth={4} />
            <Circle cx={house.x / 2} cy={groundY - 130} r={Math.min(60, house.x / 2 - 10)} fill="#3CC48A" stroke={O} strokeWidth={4} />
          </G>
        )}
        {/* Roof, with a chimney and a round attic window. */}
        <Rect x={house.x + house.w * 0.72} y={roofTop + (house.y - roofTop) * 0.2} width={house.w * 0.07} height={(house.y - roofTop) * 0.6} fill="#D94848" stroke={O} strokeWidth={4} />
        <Path
          d={`M${house.x - overhang} ${house.y + wall} L${house.x + house.w / 2} ${roofTop} L${house.x + house.w + overhang} ${house.y + wall} Z`}
          fill="#F25C54"
          stroke={O}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <Circle cx={house.x + house.w / 2} cy={roofTop + (house.y - roofTop) * 0.55} r={(house.y - roofTop) * 0.18} fill={night ? '#FFE27A' : '#BFE7FF'} stroke={O} strokeWidth={4} />
        {/* Walls and floors between the rooms. */}
        <Rect x={house.x} y={house.y} width={house.w} height={house.h} fill="#FFD9A8" stroke={O} strokeWidth={5} />
      </Svg>

      {(Object.keys(cells) as RoomId[]).map((room) => {
        const cell: Box = cells[room];
        return (
          <Pressable
            key={room}
            onPress={() => onEnter(room)}
            accessibilityLabel={`Go into the ${ROOMS[room].name.toLowerCase()}`}
            style={[styles.cell, { left: cell.x, top: cell.y, width: cell.w, height: cell.h, zIndex: carrying === room ? 2 : 1 }]}
          >
            <RoomScene
              room={room}
              size={{ w: cell.w, h: cell.h }}
              mini
              vacuumHere={vacuumRoom === room}
              onCarry={(who, x, y) => carry(room, who, x, y)}
              onHold={(holding) => setCarrying(holding ? room : null)}
            />
            <View pointerEvents="none" style={styles.cellEdge} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  cell: { position: 'absolute' },
  cellEdge: { ...StyleSheet.absoluteFill, borderWidth: 3, borderColor: O, zIndex: 16000 },
});
