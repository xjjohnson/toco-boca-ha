import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { CHARACTERS, pieceFor, type CharacterId, type Outfit, type Piece, type Slot } from '@/play/catalog';

/**
 * Original character art: round-headed kids drawn from simple shapes with a
 * thick friendly outline. Everything is in a 200x384 box, feet at the bottom.
 */
export const CHARACTER_VIEWBOX = '0 0 200 384';

/** Close-up crops of the character for the dress-up buttons, one per slot. */
export const SLOT_CROP: Record<Slot, string> = {
  hat: '20 0 170 120',
  top: '22 160 156 156',
  bottom: '40 240 120 120',
  shoes: '50 318 100 66',
};

const O = '#2A2340';
const SW = 4;

/** A thick limb with an outline: an outline-colored stroke under a skin-colored one. */
function Limb({ x1, y1, x2, y2, color, width = 18 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number }) {
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={O} strokeWidth={width + SW * 2} strokeLinecap="round" />
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </G>
  );
}

const ARMS = {
  left: { x1: 64, y1: 172, x2: 42, y2: 236 },
  right: { x1: 136, y1: 172, x2: 158, y2: 236 },
};

function along(arm: (typeof ARMS)['left'], t: number) {
  return { x1: arm.x1, y1: arm.y1, x2: arm.x1 + (arm.x2 - arm.x1) * t, y2: arm.y1 + (arm.y2 - arm.y1) * t };
}

function Arms({ skin, top }: { skin: string; top: Piece }) {
  const sleeve = top.style === 'dress' ? 0 : top.style === 'tee' || top.style === 'star' ? 0.35 : 0.8;
  const sleeveColor = top.style === 'stripes' ? top.accent ?? top.color : top.color;
  return (
    <G>
      {(['left', 'right'] as const).map((side) => (
        <G key={side}>
          <Limb {...ARMS[side]} color={skin} />
          {sleeve > 0 && <Limb {...along(ARMS[side], sleeve)} color={sleeveColor} width={22} />}
          <Circle cx={ARMS[side].x2} cy={ARMS[side].y2 + 4} r={12} fill={skin} stroke={O} strokeWidth={SW} />
        </G>
      ))}
    </G>
  );
}

function Legs({ skin }: { skin: string }) {
  return (
    <G>
      <Rect x={74} y={236} width={22} height={100} rx={10} fill={skin} stroke={O} strokeWidth={SW} />
      <Rect x={104} y={236} width={22} height={100} rx={10} fill={skin} stroke={O} strokeWidth={SW} />
      <Ellipse cx={82} cy={338} rx={14} ry={8} fill={skin} stroke={O} strokeWidth={SW} />
      <Ellipse cx={118} cy={338} rx={14} ry={8} fill={skin} stroke={O} strokeWidth={SW} />
    </G>
  );
}

function Bottom({ piece }: { piece: Piece }) {
  const c = piece.color;
  switch (piece.style) {
    case 'shorts':
      return <Path d="M66 228 H134 L138 284 H104 L100 262 L96 284 H62 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />;
    case 'pants':
    case 'overalls':
      return <Path d="M66 228 H134 L132 326 H104 L100 266 L96 326 H68 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />;
    case 'skirt':
      return (
        <G>
          <Path d="M70 226 H130 L150 292 H50 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Path d="M84 232 L76 290 M100 232 V290 M116 232 L124 290" stroke={O} strokeWidth={2} opacity={0.35} />
        </G>
      );
    default:
      return null;
  }
}

/** The bib and straps go over the top, so overalls draw in two parts. */
function OverallsBib({ piece }: { piece: Piece }) {
  if (piece.style !== 'overalls') return null;
  return (
    <G>
      <Line x1={80} y1={190} x2={70} y2={166} stroke={piece.color} strokeWidth={10} strokeLinecap="round" />
      <Line x1={120} y1={190} x2={130} y2={166} stroke={piece.color} strokeWidth={10} strokeLinecap="round" />
      <Rect x={76} y={186} width={48} height={50} rx={8} fill={piece.color} stroke={O} strokeWidth={SW} />
      <Rect x={88} y={198} width={24} height={16} rx={4} fill="none" stroke={O} strokeWidth={3} />
      <Circle cx={82} cy={194} r={4} fill={O} />
      <Circle cx={118} cy={194} r={4} fill={O} />
    </G>
  );
}

function Shoe({ piece, cx }: { piece: Piece; cx: number }) {
  const c = piece.color;
  switch (piece.style) {
    case 'sneakers':
      return (
        <G>
          <Path d={`M${cx - 18} 344 Q${cx - 18} 326 ${cx} 326 Q${cx + 20} 326 ${cx + 22} 344 Z`} fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Rect x={cx - 20} y={342} width={44} height={8} rx={4} fill={piece.accent} stroke={O} strokeWidth={SW} />
          <Line x1={cx - 4} y1={332} x2={cx + 6} y2={332} stroke={piece.accent} strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'boots':
      return (
        <G>
          <Path d={`M${cx - 14} 296 H${cx + 12} V334 Q${cx + 24} 336 ${cx + 24} 348 H${cx - 16} Z`} fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Line x1={cx - 14} y1={306} x2={cx + 12} y2={306} stroke={O} strokeWidth={3} />
        </G>
      );
    case 'slippers':
      return (
        <G>
          <Ellipse cx={cx - 6} cy={322} rx={5} ry={12} fill={piece.accent} stroke={O} strokeWidth={3} />
          <Ellipse cx={cx + 6} cy={322} rx={5} ry={12} fill={piece.accent} stroke={O} strokeWidth={3} />
          <Ellipse cx={cx + 2} cy={340} rx={22} ry={11} fill={c} stroke={O} strokeWidth={SW} />
          <Circle cx={cx + 14} cy={338} r={2.5} fill={O} />
        </G>
      );
    default:
      return null;
  }
}

const TORSO = 'M62 168 Q100 150 138 168 L134 242 H66 Z';

function Top({ piece }: { piece: Piece }) {
  const c = piece.color;
  switch (piece.style) {
    case 'dress':
      return (
        <G>
          <Path d="M64 168 Q100 150 136 168 L152 294 H48 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Rect x={66} y={222} width={68} height={8} fill={piece.accent} opacity={0.9} />
          <Circle cx={80} cy={262} r={5} fill={piece.accent} />
          <Circle cx={104} cy={274} r={5} fill={piece.accent} />
          <Circle cx={126} cy={258} r={5} fill={piece.accent} />
        </G>
      );
    case 'stripes':
      return (
        <G>
          <Path d={TORSO} fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          {[184, 204, 224].map((y) => (
            <Line key={y} x1={68} y1={y} x2={132} y2={y} stroke={piece.accent} strokeWidth={9} />
          ))}
          <Path d={TORSO} fill="none" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
        </G>
      );
    case 'star':
      return (
        <G>
          <Path d={TORSO} fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Polygon
            points="100,180 106,196 123,196 109,206 114,222 100,212 86,222 91,206 77,196 94,196"
            fill={piece.accent}
          />
        </G>
      );
    case 'hoodie':
      return (
        <G>
          <Path d="M66 172 Q100 128 134 172 Z" fill={c} stroke={O} strokeWidth={SW} />
          <Path d={TORSO} fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Path d="M78 214 H122 L118 236 H82 Z" fill="none" stroke={O} strokeWidth={3} />
          <Line x1={92} y1={170} x2={90} y2={196} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
          <Line x1={108} y1={170} x2={110} y2={196} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    default:
      return <Path d={TORSO} fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />;
  }
}

function HairBack({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'pigtails':
      return (
        <G>
          <Circle cx={36} cy={98} r={22} fill={color} stroke={O} strokeWidth={SW} />
          <Circle cx={164} cy={98} r={22} fill={color} stroke={O} strokeWidth={SW} />
          <Circle cx={52} cy={88} r={7} fill="#FF6FB5" stroke={O} strokeWidth={3} />
          <Circle cx={148} cy={88} r={7} fill="#FF6FB5" stroke={O} strokeWidth={3} />
        </G>
      );
    case 'curls':
      return (
        <G>
          {[
            [48, 70],
            [62, 44],
            [92, 32],
            [124, 36],
            [148, 56],
            [156, 86],
            [44, 100],
            [156, 112],
          ].map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={26} fill={color} stroke={O} strokeWidth={SW} />
          ))}
        </G>
      );
    default:
      return null;
  }
}

function HairFront({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'pigtails':
      return <Path d="M44 92 Q46 36 100 36 Q154 36 156 92 Q132 66 100 70 Q68 66 44 92 Z" fill={color} stroke={O} strokeWidth={SW} strokeLinejoin="round" />;
    case 'curls':
      return (
        <G>
          {[66, 88, 112, 134].map((cx, i) => (
            <Circle key={cx} cx={cx} cy={i % 2 ? 54 : 60} r={16} fill={color} />
          ))}
        </G>
      );
    case 'spiky':
      return (
        <Path
          d="M44 92 L38 58 L60 64 L62 32 L84 50 L100 20 L116 50 L138 32 L140 64 L162 58 L156 92 Q130 66 100 70 Q70 66 44 92 Z"
          fill={color}
          stroke={O}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

function Hat({ piece }: { piece: Piece }) {
  const c = piece.color;
  switch (piece.style) {
    case 'cap':
      return (
        <G>
          <Path d="M46 76 Q48 26 100 26 Q152 26 154 76 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Path d="M118 76 Q168 68 188 82 Q164 92 118 84 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Circle cx={100} cy={26} r={6} fill={c} stroke={O} strokeWidth={3} />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Path d="M58 62 L60 16 L80 38 L100 8 L120 38 L140 16 L142 62 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Circle cx={100} cy={46} r={7} fill={piece.accent} stroke={O} strokeWidth={3} />
          <Circle cx={74} cy={50} r={5} fill="#4FB3FF" stroke={O} strokeWidth={3} />
          <Circle cx={126} cy={50} r={5} fill="#3CC48A" stroke={O} strokeWidth={3} />
        </G>
      );
    case 'bow':
      return (
        <G>
          <Path d="M136 40 L108 22 L110 58 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Path d="M136 40 L164 22 L162 58 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Circle cx={136} cy={40} r={9} fill={c} stroke={O} strokeWidth={SW} />
        </G>
      );
    case 'party':
      return (
        <G>
          <Path d="M70 52 L104 2 L132 52 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Circle cx={92} cy={38} r={4} fill={piece.accent} />
          <Circle cx={110} cy={26} r={4} fill={piece.accent} />
          <Circle cx={116} cy={44} r={4} fill={piece.accent} />
          <Circle cx={104} cy={4} r={8} fill={piece.accent} stroke={O} strokeWidth={3} />
        </G>
      );
    case 'beanie':
      return (
        <G>
          <Path d="M46 78 Q46 24 100 24 Q154 24 154 78 Z" fill={c} stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Rect x={42} y={66} width={116} height={18} rx={9} fill={c} stroke={O} strokeWidth={SW} />
          <Circle cx={100} cy={20} r={12} fill={piece.accent} stroke={O} strokeWidth={SW} />
        </G>
      );
    default:
      return null;
  }
}

function Face({ happy }: { happy?: boolean }) {
  return (
    <G>
      <Circle cx={80} cy={100} r={7.5} fill={O} />
      <Circle cx={120} cy={100} r={7.5} fill={O} />
      <Circle cx={82.5} cy={97.5} r={2.5} fill="#FFFFFF" />
      <Circle cx={122.5} cy={97.5} r={2.5} fill="#FFFFFF" />
      <Ellipse cx={66} cy={118} rx={9} ry={6} fill="#FF7FA8" opacity={0.55} />
      <Ellipse cx={134} cy={118} rx={9} ry={6} fill="#FF7FA8" opacity={0.55} />
      {happy ? (
        <Path d="M86 118 Q100 140 114 118 Z" fill="#B83A5A" stroke={O} strokeWidth={3.5} strokeLinejoin="round" />
      ) : (
        <Path d="M88 120 Q100 132 112 120" fill="none" stroke={O} strokeWidth={4} strokeLinecap="round" />
      )}
    </G>
  );
}

interface Props {
  who: CharacterId;
  outfit: Outfit;
  width: number;
  height: number;
  /** A big open smile, for being picked up or trying something on. */
  happy?: boolean;
  /** Crop to part of the character, e.g. SLOT_CROP.hat for a dress-up button. */
  viewBox?: string;
}

export function CharacterArt({ who, outfit, width, height, happy, viewBox = CHARACTER_VIEWBOX }: Props) {
  const def = CHARACTERS[who];
  const top = pieceFor('top', outfit.top);
  const bottom = pieceFor('bottom', outfit.bottom);
  const shoes = pieceFor('shoes', outfit.shoes);
  const hat = pieceFor('hat', outfit.hat);
  // Hats sit over the hair, but a bow sits beside it, so pigtails stay visible either way.
  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      <G transform="translate(0 24)">
        <HairBack style={def.hairStyle} color={def.hair} />
        <Legs skin={def.skin} />
        <Bottom piece={bottom} />
        <Shoe piece={shoes} cx={84} />
        <Shoe piece={shoes} cx={118} />
        <Rect x={90} y={138} width={20} height={24} fill={def.skin} stroke={O} strokeWidth={SW} />
        <Arms skin={def.skin} top={top} />
        <Top piece={top} />
        <OverallsBib piece={bottom} />
        <Circle cx={100} cy={96} r={58} fill={def.skin} stroke={O} strokeWidth={SW} />
        <Face happy={happy} />
        <HairFront style={def.hairStyle} color={def.hair} />
        <Hat piece={hat} />
      </G>
    </Svg>
  );
}
