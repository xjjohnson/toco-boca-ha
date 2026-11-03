import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { THINGS, type ThingKind } from '@/play/catalog';

/**
 * Original toy and furniture art, one drawing per ThingKind, each in a box
 * the size its catalog entry gives (design points). Switchable things get
 * `on` and draw both looks.
 */

const O = '#2A2340';
const SW = 4;

type Draw = (on: boolean) => ReactElement;

const ART: Record<ThingKind, Draw> = {
  bed: () => (
    <G>
      <Rect x={6} y={14} width={58} height={172} rx={22} fill="#7A5CFF" stroke={O} strokeWidth={SW} />
      <Circle cx={35} cy={52} r={10} fill="#FFE27A" stroke={O} strokeWidth={3} />
      <Rect x={300} y={70} width={52} height={116} rx={18} fill="#7A5CFF" stroke={O} strokeWidth={SW} />
      <Rect x={50} y={84} width={270} height={40} rx={12} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
      <Ellipse cx={100} cy={82} rx={36} ry={16} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
      <Path d="M140 80 H316 V144 Q228 156 140 144 Z" fill="#FF9EC4" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {[170, 210, 250, 290].map((x, i) => (
        <Circle key={x} cx={x} cy={i % 2 ? 100 : 122} r={7} fill="#FFFFFF" opacity={0.85} />
      ))}
      <Rect x={40} y={128} width={290} height={34} rx={10} fill="#B79CFF" stroke={O} strokeWidth={SW} />
      <Rect x={52} y={160} width={18} height={26} rx={4} fill="#7A5CFF" stroke={O} strokeWidth={SW} />
      <Rect x={286} y={160} width={18} height={26} rx={4} fill="#7A5CFF" stroke={O} strokeWidth={SW} />
    </G>
  ),
  lamp: (on) => (
    <G>
      {on && <Circle cx={60} cy={62} r={58} fill="#FFE27A" opacity={0.55} />}
      <Path d="M28 92 L42 22 H78 L92 92 Z" fill="#FF9EC4" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M48 92 Q60 110 72 92 Z" fill={on ? '#FFE27A' : '#E8E2D0'} stroke={O} strokeWidth={3} />
      <Rect x={55} y={96} width={10} height={120} fill={O} />
      <Ellipse cx={60} cy={222} rx={42} ry={12} fill="#7A5CFF" stroke={O} strokeWidth={SW} />
      <Line x1={74} y1={132} x2={74} y2={150} stroke={O} strokeWidth={3} />
      <Circle cx={74} cy={154} r={5} fill={on ? '#FFE27A' : '#FFFFFF'} stroke={O} strokeWidth={3} />
    </G>
  ),
  ball: () => (
    <G>
      <Circle cx={40} cy={40} r={36} fill="#FF7A59" stroke={O} strokeWidth={SW} />
      <Path d="M6 34 Q40 50 74 34 L76 48 Q40 64 4 48 Z" fill="#FFE27A" />
      <Circle cx={40} cy={40} r={36} fill="none" stroke={O} strokeWidth={SW} />
      <Ellipse cx={26} cy={22} rx={8} ry={5} fill="#FFFFFF" opacity={0.7} />
    </G>
  ),
  teddy: () => (
    <G>
      <Circle cx={26} cy={22} r={14} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Circle cx={74} cy={22} r={14} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Ellipse cx={50} cy={86} rx={34} ry={30} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Ellipse cx={50} cy={90} rx={18} ry={16} fill="#F1D3B3" />
      <Ellipse cx={22} cy={108} rx={14} ry={10} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Ellipse cx={78} cy={108} rx={14} ry={10} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Circle cx={50} cy={42} r={30} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Ellipse cx={50} cy={52} rx={13} ry={10} fill="#F1D3B3" />
      <Circle cx={39} cy={38} r={4} fill={O} />
      <Circle cx={61} cy={38} r={4} fill={O} />
      <Ellipse cx={50} cy={48} rx={5} ry={3.5} fill={O} />
      <Path d="M36 64 L50 72 L64 64 L64 76 L50 70 L36 76 Z" fill="#FF6FB5" stroke={O} strokeWidth={3} strokeLinejoin="round" />
    </G>
  ),
  plant: () => (
    <G>
      <Ellipse cx={30} cy={60} rx={14} ry={34} fill="#3CC48A" stroke={O} strokeWidth={SW} transform="rotate(-28 30 60)" />
      <Ellipse cx={60} cy={56} rx={14} ry={34} fill="#3CC48A" stroke={O} strokeWidth={SW} transform="rotate(28 60 56)" />
      <Ellipse cx={45} cy={40} rx={14} ry={38} fill="#2DB37A" stroke={O} strokeWidth={SW} />
      <Path d="M18 98 H72 L64 146 H26 Z" fill="#E07A4F" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={14} y={92} width={62} height={14} rx={5} fill="#E07A4F" stroke={O} strokeWidth={SW} />
    </G>
  ),
  radio: (on) => (
    <G>
      <Line x1={92} y1={30} x2={108} y2={4} stroke={O} strokeWidth={4} strokeLinecap="round" />
      <Path d="M32 32 Q60 6 88 32" fill="none" stroke={O} strokeWidth={6} strokeLinecap="round" />
      <Rect x={8} y={30} width={104} height={62} rx={14} fill="#3CC48A" stroke={O} strokeWidth={SW} />
      <Circle cx={40} cy={61} r={20} fill={on ? '#FFE27A' : '#2B8F66'} stroke={O} strokeWidth={SW} />
      <Circle cx={40} cy={61} r={8} fill={O} opacity={0.35} />
      <Rect x={70} y={46} width={30} height={12} rx={4} fill="#FFFFFF" stroke={O} strokeWidth={3} />
      <Line x1={80} y1={48} x2={80} y2={56} stroke="#FF7A59" strokeWidth={3} />
      <Circle cx={78} cy={76} r={6} fill="#FF7A59" stroke={O} strokeWidth={3} />
      <Circle cx={96} cy={76} r={6} fill="#FFE27A" stroke={O} strokeWidth={3} />
      {on && (
        <G>
          <Path d="M10 22 V4 L22 2 V18" fill="none" stroke="#7A5CFF" strokeWidth={3} />
          <Circle cx={7} cy={22} r={4} fill="#7A5CFF" />
          <Circle cx={19} cy={18} r={4} fill="#7A5CFF" />
          <Path d="M118 26 V8" stroke="#FF6FB5" strokeWidth={3} />
          <Circle cx={115} cy={26} r={4} fill="#FF6FB5" />
        </G>
      )}
    </G>
  ),
  books: () => (
    <G>
      <Rect x={6} y={48} width={78} height={18} rx={4} fill="#4FB3FF" stroke={O} strokeWidth={SW} />
      <Rect x={14} y={28} width={66} height={20} rx={4} fill="#FFD23F" stroke={O} strokeWidth={SW} />
      <Rect x={10} y={8} width={70} height={20} rx={4} fill="#FF6FB5" stroke={O} strokeWidth={SW} />
      <Line x1={24} y1={18} x2={60} y2={18} stroke="#FFFFFF" strokeWidth={3} />
    </G>
  ),
  table: () => (
    <G>
      <Rect x={30} y={22} width={18} height={124} rx={4} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Rect x={252} y={22} width={18} height={124} rx={4} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Rect x={6} y={10} width={288} height={22} rx={8} fill="#E0A872" stroke={O} strokeWidth={SW} />
      <Path d="M20 30 H280 L270 56 Q150 66 30 56 Z" fill="#FF8F8F" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {[60, 110, 160, 210, 250].map((x) => (
        <Rect key={x} x={x} y={36} width={14} height={14} fill="#FFFFFF" opacity={0.7} />
      ))}
    </G>
  ),
  fridge: (on) => (
    <G>
      <Rect x={8} y={6} width={154} height={308} rx={18} fill="#DDF3FF" stroke={O} strokeWidth={SW} />
      <Line x1={8} y1={104} x2={162} y2={104} stroke={O} strokeWidth={SW} />
      <Rect x={136} y={40} width={10} height={40} rx={5} fill={O} />
      {on ? (
        <G>
          <Rect x={18} y={112} width={134} height={194} rx={10} fill="#FFFBE6" stroke={O} strokeWidth={3} />
          <Line x1={18} y1={176} x2={152} y2={176} stroke={O} strokeWidth={3} />
          <Line x1={18} y1={240} x2={152} y2={240} stroke={O} strokeWidth={3} />
          <Rect x={30} y={130} width={26} height={44} rx={3} fill="#FFFFFF" stroke={O} strokeWidth={3} />
          <Rect x={30} y={130} width={26} height={12} fill="#4FB3FF" />
          <Path d="M70 172 L104 150 L104 172 Z" fill="#FFD23F" stroke={O} strokeWidth={3} strokeLinejoin="round" />
          <Circle cx={128} cy={160} r={14} fill="#F25C54" stroke={O} strokeWidth={3} />
          <Path d="M36 236 L46 200 L56 236 Z" fill="#FF8C2E" stroke={O} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M66 236 L76 200 L86 236 Z" fill="#FF8C2E" stroke={O} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={120} cy={224} rx={22} ry={14} fill="#9BE07A" stroke={O} strokeWidth={3} />
          <Rect x={40} y={262} width={90} height={32} rx={8} fill="#B79CFF" stroke={O} strokeWidth={3} />
          <Rect x={150} y={108} width={18} height={204} rx={6} fill="#C3E6FA" stroke={O} strokeWidth={SW} />
        </G>
      ) : (
        <G>
          <Rect x={136} y={130} width={10} height={70} rx={5} fill={O} />
          <Circle cx={50} cy={150} r={12} fill="#FF6FB5" stroke={O} strokeWidth={3} />
          <Rect x={40} y={190} width={36} height={28} rx={3} fill="#FFFFFF" stroke={O} strokeWidth={3} transform="rotate(-8 58 204)" />
          <Path d="M48 206 L56 198 L62 204 L70 194" fill="none" stroke="#3CC48A" strokeWidth={3} />
        </G>
      )}
    </G>
  ),
  toaster: (on) => (
    <G>
      <Rect x={28} y={on ? 4 : 22} width={24} height={30} rx={8} fill={on ? '#E9A657' : '#F6D6A0'} stroke={O} strokeWidth={3} />
      <Rect x={58} y={on ? 8 : 22} width={24} height={30} rx={8} fill={on ? '#E9A657' : '#F6D6A0'} stroke={O} strokeWidth={3} />
      <Rect x={10} y={30} width={90} height={46} rx={16} fill="#C7D3E0" stroke={O} strokeWidth={SW} />
      <Rect x={98} y={on ? 38 : 56} width={12} height={8} rx={3} fill={O} />
      <Circle cx={30} cy={56} r={5} fill={on ? '#F25C54' : '#9A94B0'} />
      <Ellipse cx={30} cy={42} rx={8} ry={3} fill="#FFFFFF" opacity={0.7} />
    </G>
  ),
  apple: () => (
    <G>
      <Path d="M26 14 Q28 4 34 2" fill="none" stroke={O} strokeWidth={4} strokeLinecap="round" />
      <Ellipse cx={36} cy={10} rx={8} ry={4} fill="#3CC48A" stroke={O} strokeWidth={2.5} />
      <Path d="M26 18 Q8 6 4 30 Q4 56 26 54 Q48 56 48 30 Q44 6 26 18 Z" fill="#F25C54" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Ellipse cx={16} cy={28} rx={4} ry={7} fill="#FFFFFF" opacity={0.6} />
    </G>
  ),
  banana: () => (
    <G>
      <Path d="M6 12 Q30 44 74 18 Q76 30 68 34 Q30 54 4 20 Z" fill="#FFD23F" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={70} y={12} width={8} height={8} rx={2} fill="#6B4A2A" />
    </G>
  ),
  cake: () => (
    <G>
      <Rect x={53} y={6} width={6} height={18} rx={2} fill="#4FB3FF" stroke={O} strokeWidth={2} />
      <Ellipse cx={56} cy={4} rx={4} ry={5} fill="#FFB43D" />
      <Rect x={26} y={24} width={60} height={30} rx={8} fill="#FFC1DD" stroke={O} strokeWidth={SW} />
      <Rect x={10} y={50} width={92} height={36} rx={10} fill="#FFF0D6" stroke={O} strokeWidth={SW} />
      <Path d="M10 60 Q22 72 34 60 Q46 72 58 60 Q70 72 82 60 Q94 72 102 60" fill="none" stroke="#FF6FB5" strokeWidth={5} strokeLinecap="round" />
      <Rect x={4} y={84} width={104} height={10} rx={5} fill="#FFFFFF" stroke={O} strokeWidth={3} />
    </G>
  ),
  cup: () => (
    <G>
      <Path d="M34 22 Q50 22 46 38 Q42 46 34 44" fill="none" stroke={O} strokeWidth={5} />
      <Path d="M6 16 H38 L34 52 H10 Z" fill="#4FB3FF" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M16 10 Q12 4 18 0 M26 10 Q22 4 28 0" fill="none" stroke="#9A94B0" strokeWidth={2.5} strokeLinecap="round" />
    </G>
  ),
};

export function ThingArt({ kind, on = false, width, height }: { kind: ThingKind; on?: boolean; width: number; height: number }) {
  const def = THINGS[kind];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${def.w} ${def.h}`}>
      {ART[kind](on)}
    </Svg>
  );
}
