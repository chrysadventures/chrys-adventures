import { useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from "react";

const zoomStops = [0.5, 0.75, 1, 1.25, 1.5] as const;
const descendingZoomStops = [...zoomStops].reverse();
const defaultZoom = 1;
const maxZoom = zoomStops[zoomStops.length - 1];

type Point = { x: number; y: number };
type Pan = { point: Point; left: number; top: number };
type Pinch = { anchor: Point; distance: number; scale: number };
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function useMapCamera() {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scale = useRef(defaultZoom);
  const minimum = useRef<number>(zoomStops[0]);
  const [zoom, setZoom] = useState(defaultZoom);
  const [minZoom, setMinZoom] = useState<number>(zoomStops[0]);
  const pointers = useRef(new Map<number, Point>());
  const pan = useRef<Pan | null>(null);
  const pinch = useRef<Pinch | null>(null);
  const dragged = useRef(false);

  function worldPoint(view: HTMLDivElement, position: Point): Point {
    return { x: (view.scrollLeft + position.x) / scale.current, y: (view.scrollTop + position.y) / scale.current };
  }

  function applyScale(view: HTMLDivElement, requested: number, position: Point, anchor: Point) {
    const next = Math.min(maxZoom, Math.max(minimum.current, requested));
    if (next !== scale.current) {
      scale.current = next;
      view.style.setProperty("--map-zoom", String(next));
      setZoom(Math.round(next * 100) / 100);
    }
    view.scrollTo(anchor.x * next - position.x, anchor.y * next - position.y);
  }

  function zoomAtCenter(requested: number) {
    const view = viewport.current;
    if (!view) return;
    const center = { x: view.clientWidth / 2, y: view.clientHeight / 2 };
    applyScale(view, requested, center, worldPoint(view, center));
  }

  useLayoutEffect(() => {
    const view = viewport.current;
    const world = track.current;
    if (!view || !world) return;
    function updateBounds() {
      if (!view || !world) return;
      const width = world.offsetWidth;
      const height = world.offsetHeight;
      if (width === 0 || height === 0) return;
      const fit = Math.max(zoomStops[0], view.clientWidth / width, view.clientHeight / height);
      const nextMin = Math.ceil(fit * 100) / 100;
      minimum.current = nextMin;
      setMinZoom(nextMin);
      if (scale.current < nextMin) zoomAtCenter(nextMin);
    }
    const observer = new ResizeObserver(updateBounds);
    updateBounds();
    observer.observe(view);
    observer.observe(world);
    view.scrollTo(0, view.scrollHeight);
    return () => observer.disconnect();
  }, []);

  function localPoint(event: PointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || pointers.current.size >= 2) return;
    const view = event.currentTarget;
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      dragged.current = false;
      pan.current = { point, left: view.scrollLeft, top: view.scrollTop };
    } else {
      const [a, b] = pointers.current.values();
      pinch.current = { anchor: worldPoint(view, midpoint(a, b)), distance: Math.max(1, distance(a, b)), scale: scale.current };
      dragged.current = true;
      view.dataset.dragging = "true";
      for (const id of pointers.current.keys()) view.setPointerCapture(id);
    }
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    if (event.pointerType === "mouse" && !(event.buttons & 1)) {
      finish(event);
      return;
    }
    const view = event.currentTarget;
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    if (pinch.current) {
      const [a, b] = pointers.current.values();
      const active = pinch.current;
      event.preventDefault();
      applyScale(view, active.scale * distance(a, b) / active.distance, midpoint(a, b), active.anchor);
    } else if (pan.current) {
      const active = pan.current;
      if (!dragged.current && distance(point, active.point) < 7) return;
      if (!dragged.current) {
        dragged.current = true;
        view.setPointerCapture(event.pointerId);
        view.dataset.dragging = "true";
      }
      event.preventDefault();
      view.scrollTo(active.left + active.point.x - point.x, active.top + active.point.y - point.y);
    }
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (event.type === "lostpointercapture" && event.target !== event.currentTarget) return;
    if (!pointers.current.delete(event.pointerId)) return;
    const view = event.currentTarget;
    pinch.current = null;
    const [point] = pointers.current.values();
    pan.current = point ? { point, left: view.scrollLeft, top: view.scrollTop } : null;
    if (!point) delete view.dataset.dragging;
  }

  function filterClick(event: MouseEvent<HTMLDivElement>) {
    if (!dragged.current || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function revealFocus(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.matches("button:focus-visible")) {
      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
  }

  return {
    viewport, track, start, move, finish, filterClick, revealFocus,
    zoom, minZoom, maxZoom,
    zoomOut: () => zoomAtCenter(descendingZoomStops.find(stop => stop < scale.current - 0.001) ?? minZoom),
    zoomIn: () => zoomAtCenter(zoomStops.find(stop => stop > scale.current + 0.001) ?? maxZoom),
    reset: () => zoomAtCenter(defaultZoom),
  };
}
