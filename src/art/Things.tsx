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
  tub: (on) => (
    <G>
      <Path d="M300 64 V30 Q300 10 320 10 Q340 10 340 26" fill="none" stroke="#C7D3E0" strokeWidth={10} strokeLinecap="round" />
      <Path d="M300 64 V30 Q300 10 320 10 Q340 10 340 26" fill="none" stroke={O} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <Rect x={50} y={150} width={18} height={18} rx={4} fill="#C7D3E0" stroke={O} strokeWidth={SW} />
      <Rect x={312} y={150} width={18} height={18} rx={4} fill="#C7D3E0" stroke={O} strokeWidth={SW} />
      <Path d="M14 64 H366 V92 Q366 156 300 156 H80 Q14 156 14 92 Z" fill="#FFFFFF" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={6} y={56} width={368} height={18} rx={9} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
      <Rect x={22} y={74} width={336} height={10} fill="#8FD8FF" opacity={0.8} />
      {on && (
        <G>
          {[
            [40, 52, 18],
            [70, 44, 24],
            [104, 50, 16],
            [140, 40, 26],
            [180, 48, 20],
            [214, 42, 24],
            [252, 50, 18],
            [286, 44, 22],
            [320, 52, 16],
            [120, 22, 10],
            [236, 18, 12],
          ].map(([cx, cy, r]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke="#8FD8FF" strokeWidth={3} />
          ))}
        </G>
      )}
    </G>
  ),
  sink: () => (
    <G>
      <Path d="M58 80 H92 L86 204 H64 Z" fill="#FFFFFF" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M8 72 H142 Q142 104 112 110 H38 Q8 104 8 72 Z" fill="#FFFFFF" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={4} y={62} width={142} height={14} rx={7} fill="#FFFFFF" stroke={O} strokeWidth={SW} />
      <Path d="M75 62 V40 Q75 30 90 30 H100" fill="none" stroke="#9AA9BA" strokeWidth={8} strokeLinecap="round" />
      <Circle cx={56} cy={52} r={7} fill="#FF6B6B" stroke={O} strokeWidth={3} />
      <Circle cx={96} cy={52} r={7} fill="#4FB3FF" stroke={O} strokeWidth={3} />
    </G>
  ),
  sofa: () => (
    <G>
      <Rect x={30} y={20} width={340} height={100} rx={30} fill="#3CC48A" stroke={O} strokeWidth={SW} />
      <Rect x={44} y={96} width={312} height={50} rx={14} fill="#5FD6A1" stroke={O} strokeWidth={SW} />
      <Line x1={200} y1={100} x2={200} y2={144} stroke={O} strokeWidth={3} opacity={0.5} />
      <Rect x={6} y={70} width={56} height={96} rx={22} fill="#3CC48A" stroke={O} strokeWidth={SW} />
      <Rect x={338} y={70} width={56} height={96} rx={22} fill="#3CC48A" stroke={O} strokeWidth={SW} />
      <Rect x={30} y={140} width={340} height={30} rx={10} fill="#2DB37A" stroke={O} strokeWidth={SW} />
      <Rect x={46} y={168} width={16} height={18} rx={3} fill="#8A4B2A" stroke={O} strokeWidth={3} />
      <Rect x={338} y={168} width={16} height={18} rx={3} fill="#8A4B2A" stroke={O} strokeWidth={3} />
      <Rect x={80} y={56} width={60} height={46} rx={14} fill="#FFD23F" stroke={O} strokeWidth={SW} transform="rotate(-8 110 79)" />
      <Rect x={262} y={56} width={60} height={46} rx={14} fill="#FF8FC7" stroke={O} strokeWidth={SW} transform="rotate(8 292 79)" />
    </G>
  ),
  tv: (on) => (
    <G>
      <Rect x={20} y={150} width={190} height={52} rx={8} fill="#C98B5A" stroke={O} strokeWidth={SW} />
      <Rect x={40} y={164} width={60} height={26} rx={4} fill="none" stroke={O} strokeWidth={3} opacity={0.5} />
      <Rect x={130} y={164} width={60} height={26} rx={4} fill="none" stroke={O} strokeWidth={3} opacity={0.5} />
      <Rect x={100} y={128} width={30} height={24} fill={O} />
      <Rect x={6} y={6} width={218} height={126} rx={12} fill={O} />
      <Rect x={16} y={16} width={198} height={106} rx={6} fill={on ? '#BFE7FF' : '#3A3555'} />
      {on ? (
        <G>
          <Rect x={16} y={92} width={198} height={30} fill="#9BE07A" />
          <Circle cx={60} cy={50} r={18} fill="#FFE27A" />
          <Ellipse cx={150} cy={50} rx={26} ry={10} fill="#FFFFFF" />
          <Circle cx={120} cy={84} r={14} fill="#FF8FC7" stroke={O} strokeWidth={3} />
          <Circle cx={116} cy={80} r={2.5} fill={O} />
          <Circle cx={125} cy={80} r={2.5} fill={O} />
        </G>
      ) : (
        <Path d="M30 30 L60 24" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.25} />
      )}
    </G>
  ),
  duck: () => (
    <G>
      <Path d="M6 34 Q6 60 36 60 Q66 60 66 38 Q58 44 50 40 Q52 26 40 26 Q24 26 22 36 Z" fill="#FFD23F" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Circle cx={40} cy={22} r={16} fill="#FFD23F" stroke={O} strokeWidth={SW} />
      <Path d="M54 20 L68 24 L54 30 Z" fill="#FF8C2E" stroke={O} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={44} cy={18} r={3} fill={O} />
      <Path d="M24 44 Q34 52 44 44" fill="none" stroke={O} strokeWidth={3} strokeLinecap="round" />
    </G>
  ),
  blocks: () => (
    <G>
      <Rect x={6} y={46} width={42} height={40} rx={6} fill="#4FB3FF" stroke={O} strokeWidth={SW} />
      <Rect x={52} y={46} width={42} height={40} rx={6} fill="#FF6B6B" stroke={O} strokeWidth={SW} />
      <Rect x={29} y={6} width={42} height={40} rx={6} fill="#3CC48A" stroke={O} strokeWidth={SW} />
      <Path d="M20 76 L27 56 L34 76 M22 70 H32" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M64 56 V76 H78 Q84 76 84 70 Q84 65 78 65 H64 M64 56 H76 Q81 56 81 60.5 Q81 65 76 65" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round" />
      <Path d="M58 18 Q48 14 44 26 Q48 38 58 34" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
    </G>
  ),
  guitar: (on) => (
    <G>
      <Rect x={33} y={6} width={14} height={92} rx={4} fill="#8A4B2A" stroke={O} strokeWidth={SW} />
      <Rect x={28} y={2} width={24} height={18} rx={5} fill="#5B3420" stroke={O} strokeWidth={SW} />
      <Path d="M40 86 Q12 86 12 112 Q6 122 10 138 Q16 166 40 166 Q64 166 70 138 Q74 122 68 112 Q68 86 40 86 Z" fill="#FF8C2E" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Circle cx={40} cy={122} r={12} fill={O} />
      <Rect x={28} y={146} width={24} height={6} rx={2} fill="#5B3420" />
      <Line x1={37} y1={20} x2={37} y2={148} stroke="#FFFFFF" strokeWidth={1.5} />
      <Line x1={43} y1={20} x2={43} y2={148} stroke="#FFFFFF" strokeWidth={1.5} />
      {on && (
        <G>
          <Path d="M64 50 V30 L76 27 V46" fill="none" stroke="#7A5CFF" strokeWidth={3} />
          <Circle cx={61} cy={50} r={4} fill="#7A5CFF" />
          <Circle cx={73} cy={46} r={4} fill="#7A5CFF" />
          <Path d="M10 70 V54" stroke="#FF6FB5" strokeWidth={3} />
          <Circle cx={7} cy={70} r={4} fill="#FF6FB5" />
        </G>
      )}
    </G>
  ),
  balloon: () => (
    <G>
      <Path d="M35 86 Q28 110 38 128 Q46 144 34 158" fill="none" stroke={O} strokeWidth={2.5} />
      <Ellipse cx={35} cy={42} rx={30} ry={38} fill="#FF6B6B" stroke={O} strokeWidth={SW} />
      <Path d="M29 82 L35 78 L41 82 L38 88 H32 Z" fill="#FF6B6B" stroke={O} strokeWidth={3} strokeLinejoin="round" />
      <Ellipse cx={24} cy={28} rx={6} ry={11} fill="#FFFFFF" opacity={0.6} />
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
