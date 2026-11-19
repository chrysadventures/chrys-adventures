// Native WebP dimensions and landmark-relative placements. Coordinates are sprite centers.
export const spriteSize = {
  "wc-landscape": [1448, 1086],
  "wc-backdrop": [1150, 578],
  "wc-falls": [1000, 412],
  "wc-camp": [1000, 652],
  "wc-treehouse": [1000, 777],
  "wc-gathering": [655, 429],
  "wc-takeaway": [742, 445],
  "wc-sorting": [685, 481],
  "wc-orchard": [708, 478],
  "wc-summit": [1000, 648],
  "wc-market": [1000, 631],
  "wc-left-bank": [606, 302],
  "wc-right-bank": [641, 382],
  "wc-water": [681, 381],
  "wc-stone": [486, 219],
  "wc-banana": [498, 496],
  "wc-rocks": [553, 472],
  "wc-bird": [374, 290],
  "wc-frog": [466, 352],
  "wc-dragonfly": [415, 319],
  "wc-snail": [452, 310],
  "nameboard": [820, 234],
  "wicker-basket": [571, 457],
  "quantity-tray": [820, 274],
} as const;

export type MapSprite = keyof typeof spriteSize;
export type Placement = readonly [sprite: MapSprite, width: number, x: number, y: number, height?: number];

export const landmarks = {
  camp: [
    ["wc-camp", 380, 182, 180, 327],
  ],
  treehouse: [
    ["wc-treehouse", 490, 245, 229, 373],
  ],
  orchard: [
    ["wc-orchard", 531, 254, 203, 350],
  ],
  river: [
    ["wc-water", 600, 334, 180, 275],
    ["wc-left-bank", 213, 76, 133, 189],
    ["wc-right-bank", 217, 598, 133, 189],
  ],
  sorting: [
    ["wc-sorting", 495, 251, 193, 315],
  ],
  gathering: [
    ["wc-gathering", 414, 205, 179, 261],
  ],
  takeaway: [
    ["wc-takeaway", 462, 227, 200, 337],
    ["wicker-basket", 61, 321, 339],
    ["quantity-tray", 82, 155, 350],
    ["quantity-tray", 79, 357, 357],
  ],
  market: [
    ["wc-market", 526, 278, 218, 340],
  ],
  summit: [
    ["wc-summit", 669, 331, 250, 438],
  ],
} satisfies Record<string, Placement[]>;
