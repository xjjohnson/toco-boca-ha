import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { ROOMS, type RoomId } from '@/play/catalog';

/**
 * Room backdrops: wall, floor, window, door and built-in shelves, drawn at
 * the room's real size so nothing stretches. The door is drawn where the
 * catalog says it is, so tapping and dropping line up with the picture.
 */

const O = '#2A2340';
const SW = 4;

interface Props {
  room: RoomId;
  width: number;
  height: number;
  night: boolean;
}

export function RoomArt({ room, width: W, height: H, night }: Props) {
  const def = ROOMS[room];
  const floorTop = def.floorY * H;
  const u = Math.min(W / 1024, H / 768);
  const X = (f: number) => f * W;
  const Y = (f: number) => f * H;

  const sky = night ? '#2B2D5C' : '#BFE7FF';

  const windowArt = (x: number, y: number, w: number, h: number) => (
    <G>
      <Rect x={X(x)} y={Y(y)} width={X(w)} height={Y(h)} rx={14 * u} fill={sky} stroke={O} strokeWidth={SW + 2} />
      {night ? (
        <G>
          <Circle cx={X(x + w * 0.7)} cy={Y(y + h * 0.3)} r={26 * u} fill="#F4F1FF" />
          <Circle cx={X(x + w * 0.7) + 12 * u} cy={Y(y + h * 0.3) - 8 * u} r={22 * u} fill={sky} />
          {[0.2, 0.35, 0.5, 0.85].map((fx, i) => (
            <Circle key={fx} cx={X(x + w * fx)} cy={Y(y + h * (i % 2 ? 0.7 : 0.25))} r={3 * u} fill="#FFFFFF" />
          ))}
        </G>
      ) : (
        <G>
          <Circle cx={X(x + w * 0.28)} cy={Y(y + h * 0.32)} r={28 * u} fill="#FFE27A" />
          <Ellipse cx={X(x + w * 0.68)} cy={Y(y + h * 0.62)} rx={36 * u} ry={14 * u} fill="#FFFFFF" />
          <Ellipse cx={X(x + w * 0.6)} cy={Y(y + h * 0.56)} rx={20 * u} ry={14 * u} fill="#FFFFFF" />
        </G>
      )}
      <Line x1={X(x + w / 2)} y1={Y(y)} x2={X(x + w / 2)} y2={Y(y + h)} stroke={O} strokeWidth={SW} />
      <Line x1={X(x)} y1={Y(y + h / 2)} x2={X(x + w)} y2={Y(y + h / 2)} stroke={O} strokeWidth={SW} />
      <Rect x={X(x) - 10 * u} y={Y(y + h)} width={X(w) + 20 * u} height={12 * u} rx={4 * u} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
    </G>
  );

  const d = def.door;
  const door = (
    <G>
      <Rect x={X(d.x)} y={Y(d.y)} width={X(d.w)} height={Y(d.h)} rx={10 * u} fill="#FF9F68" stroke={O} strokeWidth={SW + 2} />
      <Rect x={X(d.x + d.w * 0.18)} y={Y(d.y + d.h * 0.08)} width={X(d.w * 0.64)} height={Y(d.h * 0.36)} rx={8 * u} fill="none" stroke={O} strokeWidth={3} opacity={0.4} />
      <Rect x={X(d.x + d.w * 0.18)} y={Y(d.y + d.h * 0.52)} width={X(d.w * 0.64)} height={Y(d.h * 0.4)} rx={8 * u} fill="none" stroke={O} strokeWidth={3} opacity={0.4} />
      <Circle cx={X(d.x + (d.x < 0.5 ? d.w * 0.82 : d.w * 0.18))} cy={Y(d.y + d.h * 0.52)} r={8 * u} fill="#FFE27A" stroke={O} strokeWidth={3} />
    </G>
  );

  let details: ReactElement;
  if (room === 'bedroom') {
    const shelf = def.surfaces[0];
    const dots: ReactElement[] = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 12; col++) {
        dots.push(
          <Circle
            key={`${row}-${col}`}
            cx={X((col + (row % 2 ? 0.5 : 0)) / 11.5)}
            cy={(row + 0.5) * (floorTop / 6)}
            r={5 * u}
            fill={night ? '#5E5D92' : '#FFE3B0'}
          />,
        );
      }
    }
    details = (
      <G>
        <Rect x={0} y={0} width={W} height={floorTop} fill={night ? '#4B4A7A' : '#FFF4DA'} />
        {dots}
        <Rect x={0} y={floorTop} width={W} height={H - floorTop} fill={night ? '#8A6E57' : '#F6C98B'} />
        {[0.72, 0.84, 0.96].map((f) => (
          <Line key={f} x1={0} y1={Y(f)} x2={W} y2={Y(f)} stroke={O} strokeWidth={2} opacity={0.15} />
        ))}
        <Rect x={0} y={floorTop - 10 * u} width={W} height={14 * u} fill="#FFFFFF" stroke={O} strokeWidth={3} />
        {windowArt(0.38, 0.1, 0.2, 0.28)}
        {/* A crayon rainbow pinned to the wall. */}
        <Rect x={X(0.62)} y={Y(0.12)} width={X(0.14)} height={Y(0.16)} rx={6 * u} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
        {['#FF6B6B', '#FFD23F', '#3CC48A', '#4FB3FF'].map((c, i) => (
          <Path
            key={c}
            d={`M${X(0.64) + i * 6 * u} ${Y(0.25)} A ${X(0.05) - i * 6 * u} ${Y(0.08) - i * 6 * u} 0 0 1 ${X(0.74) - i * 6 * u} ${Y(0.25)}`}
            fill="none"
            stroke={c}
            strokeWidth={6 * u}
          />
        ))}
        <Rect x={X(shelf.x1)} y={Y(shelf.y)} width={X(shelf.x2 - shelf.x1)} height={Y(0.02)} rx={4 * u} fill="#C98B5A" stroke={O} strokeWidth={SW} />
        <Path d={`M${X(shelf.x1 + 0.03)} ${Y(shelf.y + 0.02)} l${14 * u} ${30 * u} M${X(shelf.x2 - 0.03)} ${Y(shelf.y + 0.02)} l${-14 * u} ${30 * u}`} stroke={O} strokeWidth={SW} />
        <Ellipse cx={X(0.5)} cy={Y(0.84)} rx={X(0.3)} ry={Y(0.09)} fill="#7FD1C7" stroke={O} strokeWidth={SW} />
        <Ellipse cx={X(0.5)} cy={Y(0.84)} rx={X(0.22)} ry={Y(0.06)} fill="none" stroke="#FFFFFF" strokeWidth={6 * u} />
      </G>
    );
  } else if (room === 'bathroom') {
    const shelf = def.surfaces[0];
    const tiles: ReactElement[] = [];
    const size = 48 * u;
    for (let y = 0, row = 0; y < floorTop; y += size, row++) {
      tiles.push(<Line key={`h${row}`} x1={0} y1={y} x2={W} y2={y} stroke="#FFFFFF" strokeWidth={2} />);
    }
    for (let x = 0, col = 0; x < W; x += size, col++) {
      tiles.push(<Line key={`v${col}`} x1={x} y1={0} x2={x} y2={floorTop} stroke="#FFFFFF" strokeWidth={2} />);
    }
    details = (
      <G>
        <Rect x={0} y={0} width={W} height={floorTop} fill={night ? '#3D5B7A' : '#CDEBFA'} />
        {tiles}
        <Rect x={0} y={floorTop} width={W} height={H - floorTop} fill={night ? '#6E7F95' : '#E9EEF5'} />
        {[0.7, 0.8, 0.9].map((f) => (
          <Line key={f} x1={0} y1={Y(f)} x2={W} y2={Y(f)} stroke={O} strokeWidth={2} opacity={0.1} />
        ))}
        <Rect x={0} y={floorTop - 10 * u} width={W} height={14 * u} fill="#FFFFFF" stroke={O} strokeWidth={3} />
        {windowArt(0.42, 0.1, 0.14, 0.2)}
        {/* A round mirror over the sink, and a towel on a hook. */}
        <Ellipse cx={X(0.3)} cy={Y(0.22)} rx={X(0.07)} ry={Y(0.11)} fill="#E8F7FF" stroke={O} strokeWidth={SW + 1} />
        <Path d={`M${X(0.27)} ${Y(0.16)} l${20 * u} ${-14 * u}`} stroke="#FFFFFF" strokeWidth={6 * u} strokeLinecap="round" />
        <Circle cx={X(0.88)} cy={Y(0.36)} r={6 * u} fill="#C7D3E0" stroke={O} strokeWidth={3} />
        <Rect x={X(0.85)} y={Y(0.37)} width={X(0.06)} height={Y(0.16)} rx={8 * u} fill="#FF8FC7" stroke={O} strokeWidth={SW} />
        <Line x1={X(0.85)} y1={Y(0.48)} x2={X(0.91)} y2={Y(0.48)} stroke="#FFFFFF" strokeWidth={4 * u} />
        <Rect x={X(shelf.x1)} y={Y(shelf.y)} width={X(shelf.x2 - shelf.x1)} height={Y(0.02)} rx={4 * u} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
        <Ellipse cx={X(0.38)} cy={Y(0.86)} rx={X(0.12)} ry={Y(0.05)} fill="#A9E5C9" stroke={O} strokeWidth={3} />
      </G>
    );
  } else if (room === 'living') {
    const shelf = def.surfaces[0];
    const stripes: ReactElement[] = [];
    for (let i = 0; i < 24; i += 2) {
      stripes.push(<Rect key={i} x={(i / 24) * W} y={0} width={W / 24} height={floorTop} fill={night ? '#6B4F7A' : '#FFE1EE'} />);
    }
    details = (
      <G>
        <Rect x={0} y={0} width={W} height={floorTop} fill={night ? '#5A4468' : '#FFF0F6'} />
        {stripes}
        <Rect x={0} y={floorTop} width={W} height={H - floorTop} fill={night ? '#7A5E4A' : '#E0A872'} />
        {[0.7, 0.8, 0.9].map((f) => (
          <Line key={f} x1={0} y1={Y(f)} x2={W} y2={Y(f)} stroke={O} strokeWidth={2} opacity={0.15} />
        ))}
        <Rect x={0} y={floorTop - 10 * u} width={W} height={14 * u} fill="#FFFFFF" stroke={O} strokeWidth={3} />
        {windowArt(0.44, 0.1, 0.2, 0.28)}
        {/* A framed sunflower picture. */}
        <Rect x={X(0.2)} y={Y(0.12)} width={X(0.12)} height={Y(0.18)} rx={4 * u} fill="#FFF7EC" stroke={O} strokeWidth={SW + 2} />
        <Line x1={X(0.26)} y1={Y(0.21)} x2={X(0.26)} y2={Y(0.28)} stroke="#3CC48A" strokeWidth={4 * u} />
        <Circle cx={X(0.26)} cy={Y(0.19)} r={18 * u} fill="#FFD23F" stroke={O} strokeWidth={3} />
        <Circle cx={X(0.26)} cy={Y(0.19)} r={7 * u} fill="#8A4B2A" />
        <Rect x={X(shelf.x1)} y={Y(shelf.y)} width={X(shelf.x2 - shelf.x1)} height={Y(0.02)} rx={4 * u} fill="#C98B5A" stroke={O} strokeWidth={SW} />
        <Path d={`M${X(shelf.x1 + 0.03)} ${Y(shelf.y + 0.02)} l${14 * u} ${30 * u} M${X(shelf.x2 - 0.03)} ${Y(shelf.y + 0.02)} l${-14 * u} ${30 * u}`} stroke={O} strokeWidth={SW} />
        <Ellipse cx={X(0.55)} cy={Y(0.86)} rx={X(0.32)} ry={Y(0.09)} fill="#B79CFF" stroke={O} strokeWidth={SW} />
        <Ellipse cx={X(0.55)} cy={Y(0.86)} rx={X(0.24)} ry={Y(0.06)} fill="none" stroke="#FFE27A" strokeWidth={6 * u} strokeDasharray={`${14 * u} ${10 * u}`} />
      </G>
    );
  } else {
    const counter = def.surfaces[0];
    const tiles: ReactElement[] = [];
    const size = 64 * u;
    for (let y = floorTop, row = 0; y < H; y += size, row++) {
      for (let x = 0, col = 0; x < W; x += size, col++) {
        if ((row + col) % 2) tiles.push(<Rect key={`${row}-${col}`} x={x} y={y} width={size} height={size} fill="#FFD6E0" />);
      }
    }
    details = (
      <G>
        <Rect x={0} y={0} width={W} height={floorTop} fill={night ? '#3F5A6B' : '#E4F6EC'} />
        <Rect x={0} y={floorTop} width={W} height={H - floorTop} fill="#FFFFFF" />
        {tiles}
        <Rect x={0} y={floorTop - 10 * u} width={W} height={14 * u} fill="#FFFFFF" stroke={O} strokeWidth={3} />
        {windowArt(0.2, 0.1, 0.22, 0.26)}
        <Circle cx={X(0.5)} cy={Y(0.17)} r={34 * u} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
        <Line x1={X(0.5)} y1={Y(0.17)} x2={X(0.5)} y2={Y(0.17) - 22 * u} stroke={O} strokeWidth={SW} strokeLinecap="round" />
        <Line x1={X(0.5)} y1={Y(0.17)} x2={X(0.5) + 16 * u} y2={Y(0.17)} stroke={O} strokeWidth={SW} strokeLinecap="round" />
        {/* Tiled splashback and a counter with cupboards. */}
        <Rect x={X(counter.x1)} y={Y(counter.y - 0.16)} width={X(counter.x2 - counter.x1)} height={Y(0.16)} fill="#BDE8F7" stroke={O} strokeWidth={3} />
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={f} x1={X(counter.x1 + (counter.x2 - counter.x1) * f)} y1={Y(counter.y - 0.16)} x2={X(counter.x1 + (counter.x2 - counter.x1) * f)} y2={Y(counter.y)} stroke={O} strokeWidth={2} opacity={0.3} />
        ))}
        <Rect x={X(counter.x1)} y={Y(counter.y)} width={X(counter.x2 - counter.x1)} height={Y((counter.base ?? 0.68) - counter.y)} fill="#4FB3FF" stroke={O} strokeWidth={SW} />
        <Rect x={X(counter.x1) - 6 * u} y={Y(counter.y) - 4 * u} width={X(counter.x2 - counter.x1) + 12 * u} height={14 * u} rx={4 * u} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
        <Line x1={X((counter.x1 + counter.x2) / 2)} y1={Y(counter.y + 0.03)} x2={X((counter.x1 + counter.x2) / 2)} y2={Y((counter.base ?? 0.68) - 0.01)} stroke={O} strokeWidth={3} />
        <Circle cx={X((counter.x1 + counter.x2) / 2) - 14 * u} cy={Y(counter.y + 0.09)} r={5 * u} fill="#FFE27A" stroke={O} strokeWidth={2} />
        <Circle cx={X((counter.x1 + counter.x2) / 2) + 14 * u} cy={Y(counter.y + 0.09)} r={5 * u} fill="#FFE27A" stroke={O} strokeWidth={2} />
      </G>
    );
  }

  return (
    <Svg width={W} height={H}>
      {details}
      {door}
    </Svg>
  );
}
