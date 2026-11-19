import type { Placement } from "./learningMapArt";

export type MapPoint = readonly [x: number, y: number];
export type LandmarkLayout = readonly [x: number, y: number, scale: number, sign: MapPoint];

export const worldSize = [1760, 1370] as const;
export const stops = [
  [16, 973, 1, [234, 1295]],
  [430, 905, 1, [786, 1210]],
  [1040, 903, 1.03, [1376, 1247]],
  [943, 583, 1.22, [1357, 956]],
  [577, 447, 1.07, [990, 831]],
  [53, 458, 1.07, [244, 879]],
  [8, 111, 1.03, [151, 513]],
  [490, 101, 1.14, [822, 465]],
  [1039, 51, 1.37, [1097, 101]],
] as const satisfies readonly LandmarkLayout[];

export function mapPoint([x, y]: MapPoint, [left, top, scale]: LandmarkLayout): MapPoint {
  return [left + x * scale, top + y * scale];
}

// The route is ordered in travel direction. Only dirt legs are painted as SVG.
// The stone and stair coordinates also describe the route for future movement.
export const riverStones = [
  ["stone-a", 64, 429, 172],
  ["stone-b", 65, 377, 178],
  ["stone-a", 68, 323, 183],
  ["stone-b", 65, 270, 175],
  ["stone-a", 63, 218, 167],
] as const satisfies readonly Placement[];

const nearBank = mapPoint([455, 173], stops[3]);
const farBank = mapPoint([191, 168], stops[3]);
const stairFoot = mapPoint([280, 400], stops[8]);
export const journey = [
  { surface: "dirt", path: `M 278 1256 C 441 1340 538 1260 656 1254 C 782 1255 848 1297 991 1271 C 1063 1255 1110 1248 1203 1249 C 1485 1255 1623 1271 1660 1083 C 1681 976 1690 827 1613 808 C 1576 798 1536 800 ${nearBank.join(" ")}` },
  { surface: "stones", points: [nearBank, ...riverStones.map(([, , x, y]) => mapPoint([x, y], stops[3])), farBank] },
  { surface: "dirt", path: `M ${farBank.join(" ")} C 1130 799 1134 867 1060 877 C 975 891 899 846 802 857 C 686 872 576 909 426 884 C 216 886 110 862 94 734 C 70 597 111 517 199 491 C 283 466 368 533 477 526 C 560 517 635 550 734 532 C 855 507 927 536 1023 543 C 1090 546 1113 633 1219 639 C 1306 643 1372 643 1400 622 C 1413 614 1418 608 ${stairFoot.join(" ")}` },
  { surface: "stairs", points: [stairFoot, mapPoint([280, 178], stops[8]), mapPoint([280, 124], stops[8])] },
] as const;

export const scenery: Placement[] = [
  ["banana-plant", 270, 23, 136], ["meadow-shrub", 173, 375, 152],
  ["banana-plant", 235, 445, 224], ["rock-shrub", 166, 399, 352],
  ["banana-plant", 244, 1031, 203], ["rock-shrub", 186, 1073, 328],
  ["banana-plant", 243, 1737, 197], ["meadow-shrub", 176, 1698, 436],
  ["banana-plant", 170, 36, 496], ["rock-shrub", 137, 54, 666],
  ["banana-plant", 233, 576, 541], ["meadow-shrub", 148, 549, 659],
  ["banana-plant", 177, 1129, 570], ["rock-shrub", 155, 1220, 623],
  ["banana-plant", 197, 1631, 633], ["meadow-shrub", 184, 1729, 754],
  ["water", 103, 1253, 1001], ["rock-shrub", 137, 1320, 970],
  ["banana-plant", 239, 1756, 1168], ["meadow-shrub", 181, 1512, 1331],
  ["banana-plant", 242, 941, 971], ["rock-shrub", 175, 984, 1107],
  ["banana-plant", 230, 437, 945], ["meadow-shrub", 162, 391, 1023],
  ["banana-plant", 231, 32, 995], ["rock-shrub", 162, 17, 1275],
];

export const foreground: Placement[] = [
  ["meadow-shrub", 184, 470, 425], ["rock-shrub", 105, 239, 806],
  ["meadow-shrub", 142, 532, 841], ["rock-shrub", 134, 1045, 735],
  ["banana-plant", 231, 18, 1369], ["meadow-shrub", 145, 740, 1367],
  ["rock-shrub", 166, 1150, 1354], ["banana-plant", 232, 1749, 1366],
];

export const cascade: Placement = ["water", 143, 1258, 932, 41];
