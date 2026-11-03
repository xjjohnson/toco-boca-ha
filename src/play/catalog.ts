/**
 * Everything kids can play with, as plain data. Art lives in src/art and is
 * looked up by these ids, so adding a toy is: add it here, draw it there.
 *
 * Positions are fractions of the room (0..1), so a save looks the same on a
 * phone and a tablet. A thing's x/y is where its bottom-middle (its "feet")
 * touches, which makes standing on the floor or sitting on a bed natural.
 */

export type RoomId = 'bedroom' | 'bathroom' | 'kitchen' | 'living';

/** A rectangle in room fractions. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A flat top things can rest on, like a bed or a counter. */
export interface Surface {
  /** Left and right edges and the height of the top, as room fractions. */
  x1: number;
  x2: number;
  y: number;
  /** How far down its front goes. Things dropped on the front hop up onto the top. */
  base?: number;
}

export interface RoomDef {
  id: RoomId;
  name: string;
  /** Where the wall meets the floor. Things dropped higher fall to here or a surface. */
  floorY: number;
  /** Drop something here to send it to `door.to`, tap it to walk there. */
  door: Rect & { to: RoomId };
  /** Built-in surfaces drawn as part of the room (a counter, a shelf). */
  surfaces: Surface[];
}

const LEFT_DOOR = { x: 0.02, y: 0.2, w: 0.12, h: 0.42 };
const RIGHT_DOOR = { x: 0.86, y: 0.2, w: 0.12, h: 0.42 };

/**
 * The house: two floors, two rooms each. Doors join rooms on the same floor;
 * to go up or down, pull out to the whole house and drag someone across.
 */
export const ROOMS: Record<RoomId, RoomDef> = {
  bedroom: {
    id: 'bedroom',
    name: 'Bedroom',
    floorY: 0.6,
    door: { ...RIGHT_DOOR, to: 'bathroom' },
    surfaces: [{ x1: 0.05, x2: 0.25, y: 0.32, base: 0.34 }],
  },
  bathroom: {
    id: 'bathroom',
    name: 'Bathroom',
    floorY: 0.6,
    door: { ...LEFT_DOOR, to: 'bedroom' },
    surfaces: [{ x1: 0.6, x2: 0.8, y: 0.3, base: 0.32 }],
  },
  kitchen: {
    id: 'kitchen',
    name: 'Kitchen',
    floorY: 0.6,
    door: { ...RIGHT_DOOR, to: 'living' },
    surfaces: [{ x1: 0.56, x2: 0.84, y: 0.5, base: 0.68 }],
  },
  living: {
    id: 'living',
    name: 'Living room',
    floorY: 0.6,
    door: { ...LEFT_DOOR, to: 'kitchen' },
    surfaces: [{ x1: 0.72, x2: 0.92, y: 0.3, base: 0.32 }],
  },
};

/** Where each room sits in the house, upstairs first. */
export const HOUSE_LAYOUT: Record<RoomId, { col: 0 | 1; floor: 0 | 1 }> = {
  bedroom: { col: 0, floor: 0 },
  bathroom: { col: 1, floor: 0 },
  kitchen: { col: 0, floor: 1 },
  living: { col: 1, floor: 1 },
};

export type ThingKind =
  | 'bed'
  | 'lamp'
  | 'ball'
  | 'teddy'
  | 'plant'
  | 'radio'
  | 'books'
  | 'table'
  | 'fridge'
  | 'toaster'
  | 'apple'
  | 'banana'
  | 'cake'
  | 'cup'
  | 'tub'
  | 'sink'
  | 'sofa'
  | 'tv'
  | 'duck'
  | 'blocks'
  | 'guitar'
  | 'balloon';

export interface ThingDef {
  kind: ThingKind;
  label: string;
  /** Size in design points, for a 1024x768 room. */
  w: number;
  h: number;
  /** Furniture stays put: it can be tapped but not dragged. */
  fixed?: boolean;
  /**
   * Tapping flips it on and off. Each flip is told to Home Assistant as a
   * `toybox_town_action` (or drives a real entity, for the lamp), and the
   * house can flip it back with a `toybox_town` event. This is the hook
   * step 3 hangs more house triggers on.
   */
  switchable?: boolean;
  /** Where its top is, as a fraction of its height from the bottom, if things can sit on it. */
  surfaceAt?: number;
  /** Stars it costs in the toy box. Things without a price are in the house from the start. */
  price?: number;
  /** Floats up instead of falling when let go. */
  floats?: boolean;
}

export const THINGS: Record<ThingKind, ThingDef> = {
  bed: { kind: 'bed', label: 'Bed', w: 360, h: 190, fixed: true, surfaceAt: 0.55 },
  lamp: { kind: 'lamp', label: 'Lamp', w: 120, h: 240, switchable: true },
  ball: { kind: 'ball', label: 'Ball', w: 80, h: 80 },
  teddy: { kind: 'teddy', label: 'Teddy', w: 100, h: 120 },
  plant: { kind: 'plant', label: 'Plant', w: 90, h: 150 },
  radio: { kind: 'radio', label: 'Radio', w: 120, h: 96, switchable: true },
  books: { kind: 'books', label: 'Books', w: 90, h: 70 },
  table: { kind: 'table', label: 'Table', w: 300, h: 150, fixed: true, surfaceAt: 0.92 },
  fridge: { kind: 'fridge', label: 'Fridge', w: 170, h: 320, fixed: true, switchable: true },
  toaster: { kind: 'toaster', label: 'Toaster', w: 110, h: 80, switchable: true },
  apple: { kind: 'apple', label: 'Apple', w: 52, h: 58 },
  banana: { kind: 'banana', label: 'Banana', w: 80, h: 44 },
  cake: { kind: 'cake', label: 'Cake', w: 110, h: 96 },
  cup: { kind: 'cup', label: 'Cup', w: 50, h: 56 },
  tub: { kind: 'tub', label: 'Bath', w: 380, h: 170, fixed: true, switchable: true, surfaceAt: 0.62 },
  sink: { kind: 'sink', label: 'Sink', w: 150, h: 210, fixed: true, surfaceAt: 0.66 },
  sofa: { kind: 'sofa', label: 'Sofa', w: 400, h: 190, fixed: true, surfaceAt: 0.48 },
  tv: { kind: 'tv', label: 'TV', w: 230, h: 210, fixed: true, switchable: true },
  duck: { kind: 'duck', label: 'Rubber duck', w: 70, h: 62, price: 2 },
  blocks: { kind: 'blocks', label: 'Blocks', w: 100, h: 90, price: 2 },
  guitar: { kind: 'guitar', label: 'Guitar', w: 80, h: 170, price: 4, switchable: true },
  balloon: { kind: 'balloon', label: 'Balloon', w: 70, h: 160, price: 1, floats: true },
};

/** Toys kids can buy with stars, cheapest first. */
export const SHOP_TOYS: ThingKind[] = (Object.keys(THINGS) as ThingKind[])
  .filter((k) => (THINGS[k].price ?? 0) > 0)
  .sort((a, b) => (THINGS[a].price ?? 0) - (THINGS[b].price ?? 0));

export interface PlacedThing {
  /** Stable id, used in saves and Home Assistant events (e.g. "lamp"). */
  id: string;
  kind: ThingKind;
  room: RoomId;
  x: number;
  y: number;
  on?: boolean;
}

export type CharacterId = 'lulu' | 'mo' | 'bo';

export type HairStyle = 'pigtails' | 'curls' | 'spiky';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  lulu: { id: 'lulu', name: 'Lulu', skin: '#F7D2B6', hair: '#8A4B2A', hairStyle: 'pigtails' },
  mo: { id: 'mo', name: 'Mo', skin: '#8D5A3B', hair: '#231A1A', hairStyle: 'curls' },
  bo: { id: 'bo', name: 'Bo', skin: '#E3A97E', hair: '#F08A24', hairStyle: 'spiky' },
};

/** Characters are drawn this big (design points), feet at their x/y. */
export const CHARACTER_SIZE = { w: 150, h: 288 };

export type Slot = 'hat' | 'top' | 'bottom' | 'shoes';

export const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'hat', label: 'Hats' },
  { slot: 'top', label: 'Tops' },
  { slot: 'bottom', label: 'Bottoms' },
  { slot: 'shoes', label: 'Shoes' },
];

export type Outfit = Record<Slot, string>;

/** Each piece is a style the art knows how to draw, in a color. */
export interface Piece {
  id: string;
  label: string;
  style: string;
  color: string;
  accent?: string;
  /** Stars to unlock it. No price means everyone has it from the start. */
  price?: number;
}

export const WARDROBE: Record<Slot, Piece[]> = {
  hat: [
    { id: 'none', label: 'No hat', style: 'none', color: 'transparent' },
    { id: 'cap-red', label: 'Red cap', style: 'cap', color: '#F25C54' },
    { id: 'crown', label: 'Crown', style: 'crown', color: '#FFD23F', accent: '#FF6FB5', price: 5 },
    { id: 'bow-pink', label: 'Pink bow', style: 'bow', color: '#FF8FC7' },
    { id: 'party', label: 'Party hat', style: 'party', color: '#7A5CFF', accent: '#FFE27A', price: 3 },
    { id: 'beanie-green', label: 'Green beanie', style: 'beanie', color: '#3CC48A', accent: '#FFFFFF', price: 2 },
  ],
  top: [
    { id: 'tee-coral', label: 'Coral tee', style: 'tee', color: '#FF7A59' },
    { id: 'tee-sky', label: 'Sky tee', style: 'tee', color: '#4FB3FF' },
    { id: 'stripes', label: 'Stripy shirt', style: 'stripes', color: '#FFFFFF', accent: '#2F6FEB' },
    { id: 'star', label: 'Star shirt', style: 'star', color: '#2A2340', accent: '#FFD23F', price: 3 },
    { id: 'hoodie-green', label: 'Green hoodie', style: 'hoodie', color: '#3CC48A', price: 3 },
    { id: 'dress-purple', label: 'Purple dress', style: 'dress', color: '#A57CFF', accent: '#FFFFFF' },
  ],
  bottom: [
    { id: 'shorts-blue', label: 'Blue shorts', style: 'shorts', color: '#2F6FEB' },
    { id: 'pants-denim', label: 'Jeans', style: 'pants', color: '#4A6FA5' },
    { id: 'pants-red', label: 'Red trousers', style: 'pants', color: '#D94848', price: 2 },
    { id: 'skirt-pink', label: 'Pink skirt', style: 'skirt', color: '#FF8FC7', price: 2 },
    { id: 'overalls-yellow', label: 'Yellow overalls', style: 'overalls', color: '#FFC83D' },
  ],
  shoes: [
    { id: 'sneakers-red', label: 'Red sneakers', style: 'sneakers', color: '#F25C54', accent: '#FFFFFF' },
    { id: 'boots-yellow', label: 'Rain boots', style: 'boots', color: '#FFD23F' },
    { id: 'slippers-pink', label: 'Bunny slippers', style: 'slippers', color: '#FFC1DD', accent: '#FFFFFF' },
    { id: 'bare', label: 'Bare feet', style: 'none', color: 'transparent' },
  ],
};

export function pieceFor(slot: Slot, id: string): Piece {
  return WARDROBE[slot].find((p) => p.id === id) ?? WARDROBE[slot][0];
}

export interface CharacterSave {
  id: CharacterId;
  room: RoomId;
  x: number;
  y: number;
  outfit: Outfit;
}

/** A fresh world: who's where on day one. */
export const START_THINGS: PlacedThing[] = [
  { id: 'bed', kind: 'bed', room: 'bedroom', x: 0.27, y: 0.86 },
  { id: 'lamp', kind: 'lamp', room: 'bedroom', x: 0.56, y: 0.7, on: false },
  { id: 'ball', kind: 'ball', room: 'bedroom', x: 0.7, y: 0.9 },
  { id: 'teddy', kind: 'teddy', room: 'bedroom', x: 0.32, y: 0.71 },
  { id: 'plant', kind: 'plant', room: 'bedroom', x: 0.79, y: 0.66 },
  { id: 'radio', kind: 'radio', room: 'bedroom', x: 0.11, y: 0.32, on: false },
  { id: 'books', kind: 'books', room: 'bedroom', x: 0.2, y: 0.32 },
  { id: 'table', kind: 'table', room: 'kitchen', x: 0.38, y: 0.9 },
  { id: 'fridge', kind: 'fridge', room: 'kitchen', x: 0.11, y: 0.7, on: false },
  { id: 'toaster', kind: 'toaster', room: 'kitchen', x: 0.62, y: 0.5, on: false },
  { id: 'apple', kind: 'apple', room: 'kitchen', x: 0.3, y: 0.71 },
  { id: 'banana', kind: 'banana', room: 'kitchen', x: 0.39, y: 0.71 },
  { id: 'cake', kind: 'cake', room: 'kitchen', x: 0.76, y: 0.5 },
  { id: 'cup', kind: 'cup', room: 'kitchen', x: 0.47, y: 0.71 },
  { id: 'tub', kind: 'tub', room: 'bathroom', x: 0.66, y: 0.9, on: false },
  { id: 'sink', kind: 'sink', room: 'bathroom', x: 0.3, y: 0.78 },
  { id: 'plant-bath', kind: 'plant', room: 'bathroom', x: 0.94, y: 0.68 },
  { id: 'sofa', kind: 'sofa', room: 'living', x: 0.58, y: 0.88 },
  { id: 'tv', kind: 'tv', room: 'living', x: 0.27, y: 0.8, on: false },
  { id: 'lamp-living', kind: 'lamp', room: 'living', x: 0.92, y: 0.76, on: false },
  { id: 'books-living', kind: 'books', room: 'living', x: 0.8, y: 0.3 },
];

export const START_CHARACTERS: CharacterSave[] = [
  {
    id: 'lulu',
    room: 'bedroom',
    x: 0.45,
    y: 0.88,
    outfit: { hat: 'bow-pink', top: 'dress-purple', bottom: 'shorts-blue', shoes: 'slippers-pink' },
  },
  {
    id: 'mo',
    room: 'living',
    x: 0.45,
    y: 0.95,
    outfit: { hat: 'none', top: 'stripes', bottom: 'pants-denim', shoes: 'sneakers-red' },
  },
  {
    id: 'bo',
    room: 'kitchen',
    x: 0.6,
    y: 0.92,
    outfit: { hat: 'cap-red', top: 'tee-sky', bottom: 'overalls-yellow', shoes: 'boots-yellow' },
  },
];
