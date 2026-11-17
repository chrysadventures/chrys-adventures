export type RoutePoint = { x: number; y: number };

// Connect stops in curriculum order, using the outside verge for row changes.
// Coordinates come from the rendered markers, so translated text can grow freely.
export function adventureRoute(points: RoutePoint[], width: number, vertical: boolean): string {
  if (!points.length) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (vertical) {
      const middle = (a.y + b.y) / 2;
      path += ` C ${a.x} ${middle}, ${b.x} ${middle}, ${b.x} ${b.y}`;
    } else if (Math.abs(a.y - b.y) < 90) {
      const middle = (a.x + b.x) / 2;
      path += ` C ${middle} ${a.y - 16}, ${middle} ${b.y + 16}, ${b.x} ${b.y}`;
    } else {
      const edge = a.x > width / 2 ? width - 18 : 18;
      path += ` C ${edge} ${a.y}, ${edge} ${a.y + 60}, ${edge} ${(a.y + b.y) / 2}`;
      path += ` C ${edge} ${b.y - 30}, ${edge} ${b.y}, ${b.x} ${b.y}`;
    }
  }
  return path;
}
