// Camera limits and World Overview fit maths. Pure functions, no DOM, so they can be tested directly.

export const MAP_CAMERA = {
  /** Explore Mode zoom steps for the − / + buttons. */
  zoomStops: [0.5, 0.75, 1, 1.25, 1.5],
  minZoom: 0.5,
  maxZoom: 1.5,
  defaultZoom: 1,
  /** Scale used when a World Overview destination returns the player to Explore Mode. */
  focusZoom: 1,
  /** Gap kept between the fitted world and any floating interface. */
  overviewGap: 8,
} as const;

export function clampZoom(requested: number): number {
  return Math.min(MAP_CAMERA.maxZoom, Math.max(MAP_CAMERA.minZoom, requested));
}

export function nextZoomStop(current: number, direction: 1 | -1): number {
  const stops = MAP_CAMERA.zoomStops;
  if (direction > 0) return stops.find(stop => stop > current + 0.001) ?? MAP_CAMERA.maxZoom;
  return [...stops].reverse().find(stop => stop < current - 0.001) ?? MAP_CAMERA.minZoom;
}

export type Rect = { left: number; top: number; right: number; bottom: number };
export type OverviewFit = { scale: number; x: number; y: number };

/**
 * Fit the whole world inside the viewport without touching floating interface.
 * Two layouts are tried: keep clear above and below the interface, or keep clear of the
 * interface columns at the sides (better on short landscape phones). The larger one wins.
 * Returns the scale and the world's top-left corner in viewport pixels.
 */
export function fitWorld(
  viewport: { width: number; height: number },
  world: { width: number; height: number },
  obstacles: readonly Rect[],
  gap: number = MAP_CAMERA.overviewGap,
): OverviewFit {
  const { width: vw, height: vh } = viewport;
  const visible = obstacles.filter(r => r.right > 0 && r.left < vw && r.bottom > 0 && r.top < vh);
  const fit = (left: number, top: number, right: number, bottom: number) => {
    const availableWidth = Math.max(1, right - left), availableHeight = Math.max(1, bottom - top);
    const scale = Math.min(availableWidth / world.width, availableHeight / world.height);
    return {
      scale,
      x: left + (availableWidth - world.width * scale) / 2,
      y: top + (availableHeight - world.height * scale) / 2,
    };
  };

  // A: bands. Interface in the top half pushes the world down, bottom half pushes it up.
  let top = gap, bottom = vh - gap;
  for (const r of visible) {
    if ((r.top + r.bottom) / 2 < vh / 2) top = Math.max(top, r.bottom + gap);
    else bottom = Math.min(bottom, r.top - gap);
  }
  const bands = fit(gap, top, vw - gap, bottom);

  // B: columns. Only full-width interface (the header) is a band; corner items become side columns.
  let colTop = gap, colBottom = vh - gap, left = gap, right = vw - gap;
  for (const r of visible) {
    const wide = r.right - r.left > vw * 0.6;
    if (wide) {
      if ((r.top + r.bottom) / 2 < vh / 2) colTop = Math.max(colTop, r.bottom + gap);
      else colBottom = Math.min(colBottom, r.top - gap);
    } else if ((r.left + r.right) / 2 < vw / 2) left = Math.max(left, r.right + gap);
    else right = Math.min(right, r.left - gap);
  }
  // Keep the world centred: use the wider of the two side columns on both sides.
  const side = Math.max(left, vw - right);
  const columns = fit(side, colTop, vw - side, colBottom);

  return columns.scale > bands.scale ? columns : bands;
}
