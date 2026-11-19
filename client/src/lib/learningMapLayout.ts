import type { Placement } from "./learningMapArt";

export type MapPoint = readonly [x: number, y: number];
export type LandmarkLayout = readonly [x: number, y: number, scale: number, sign: MapPoint];

export const worldSize = [1940, 1520] as const;
export const stops = [
  [70, 1080, 1, [238, 1426]],
  [410, 1010, 1, [687, 1382]],
  [1260, 1050, 1, [1510, 1390]],
  [1230, 743, 1, [1650, 1061]],
  [755, 605, 1, [1000, 957]],
  [265, 566, 1, [466, 870]],
  [68, 193, 1, [164, 453]],
  [1266, 166, 1, [1590, 559]],
  [638, 32, 1, [704, 480]],
] as const satisfies readonly LandmarkLayout[];

export function mapPoint([x, y]: MapPoint, [left, top, scale]: LandmarkLayout): MapPoint {
  return [left + x * scale, top + y * scale];
}

export const riverStones = [
  ["wc-stone", 77, 468, 176, 52],
  ["wc-stone", 76, 402, 183, 52],
  ["wc-stone", 81, 334, 189, 55],
  ["wc-stone", 76, 268, 183, 52],
  ["wc-stone", 78, 201, 175, 52],
] as const satisfies readonly Placement[];

const nearBank = mapPoint([506, 176], stops[3]);
const farBank = mapPoint([162, 175], stops[3]);
const stairFoot = mapPoint([331, 467], stops[8]);
const summitEntrance = mapPoint([331, 198], stops[8]);

// Arrival and departure points lie on the terrain path, in curriculum order.
export const stationAnchors = [
  { id: "camp", arrival: [263, 1404], departure: [320, 1413] },
  { id: "treehouse", arrival: [610, 1422], departure: [765, 1405] },
  { id: "orchard", arrival: [1320, 1431], departure: [1510, 1412] },
  { id: "river", arrival: nearBank, departure: farBank },
  { id: "sorting", arrival: [1128, 983], departure: [909, 1002] },
  { id: "gathering", arrival: [639, 916], departure: [423, 888] },
  { id: "takeaway", arrival: [289, 579], departure: [398, 576] },
  { id: "market", arrival: [1588, 584], departure: [1502, 518] },
  { id: "summit", arrival: stairFoot, departure: summitEntrance },
] as const;

const point = (p: MapPoint) => p.join(" ");
const [camp, tree, orchard, , sorting, gathering, takeaway, market] = stationAnchors;

export const journey = [
  { surface: "dirt", path:
    `M ${point(camp.arrival)} Q 286 1413 ${point(camp.departure)}
    C 435 1450 544 1450 ${point(tree.arrival)} Q 688 1393 ${point(tree.departure)}
    C 910 1418 1130 1488 ${point(orchard.arrival)} Q 1420 1411 ${point(orchard.departure)}
    C 1700 1432 1832 1349 1850 1195 C 1871 1042 1858 919 ${point(nearBank)}` },
  { surface: "stones", points: [nearBank, ...riverStones.map(([, , x, y]) => mapPoint([x, y], stops[3])), farBank] },
  { surface: "dirt", path:
    `M ${point(farBank)} C 1271 910 1300 987 ${point(sorting.arrival)}
    Q 1010 1006 ${point(sorting.departure)} C 783 1030 745 967 ${point(gathering.arrival)}
    Q 568 870 ${point(gathering.departure)} C 240 903 178 810 210 707
    C 221 642 233 602 ${point(takeaway.arrival)} Q 343 550 ${point(takeaway.departure)}
    C 570 648 736 634 907 641 C 1095 655 1435 694 ${point(market.arrival)}
    C 1664 530 1587 509 ${point(market.departure)} C 1378 501 1250 511 1188 538
    C 1099 570 1012 548 ${point(stairFoot)}` },
  { surface: "stairs", points: [stairFoot, summitEntrance] },
] as const;

export const scenery: Placement[] = [
  ["wc-falls", 183, 1455, 1060],
  ["wc-banana", 237, 95, 630], ["wc-banana", 208, 64, 1049],
  ["wc-rocks", 190, 374, 1068], ["wc-banana", 218, 708, 1110],
  ["wc-banana", 160, 1160, 1207], ["wc-rocks", 206, 1218, 1165],
  ["wc-banana", 226, 1797, 1375], ["wc-rocks", 195, 1815, 1065],
  ["wc-banana", 175, 1875, 659], ["wc-rocks", 201, 1769, 679],
  ["wc-banana", 230, 1213, 712], ["wc-rocks", 166, 723, 636],
  ["wc-banana", 208, 546, 536], ["wc-rocks", 185, 99, 467],
  ["wc-banana", 181, 596, 319], ["wc-banana", 216, 1850, 274],
  ["wc-rocks", 196, 1149, 671], ["wc-rocks", 156, 185, 922],
  ["wc-banana", 180, 177, 1451],
];

export const foreground: Placement[] = [
  ["wc-rocks", 175, 334, 1480], ["wc-rocks", 224, 982, 1468],
  ["wc-banana", 157, 52, 1473], ["wc-rocks", 223, 1911, 1417],
  ["wc-bird", 59, 472, 1126], ["wc-frog", 65, 1749, 976],
  ["wc-dragonfly", 52, 1542, 815], ["wc-snail", 57, 1017, 1437],
];
