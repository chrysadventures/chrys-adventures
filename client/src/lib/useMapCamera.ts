import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import { flushSync } from "react-dom";
import { clampZoom, fitWorld, MAP_CAMERA, nextZoomStop, type Rect } from "./mapCameraConfig";

export type CameraMode = "explore" | "overview";
type Point = { x: number; y: number };
type Pan = { point: Point; left: number; top: number };
type Pinch = { anchor: Point; distance: number; scale: number };
type SavedView = { scale: number; center: Point };
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Floating interface the overview must not sit under: the app header, save status and map HUD. */
const hudSelector = ".app-header, .app-save-status, [data-map-hud]";

function animate(update: () => void) {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof doc.startViewTransition !== "function") update();
  else doc.startViewTransition(update);
}

/**
 * One camera with two modes. Explore Mode pans with native scrolling and zooms by
 * scaling the track between MAP_CAMERA.minZoom and maxZoom. World Overview fits the
 * whole world into the space left by the floating interface, at whatever scale that needs.
 */
export function useMapCamera(worldUnits: readonly [number, number]) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scale = useRef<number>(MAP_CAMERA.defaultZoom);
  const [zoom, setZoom] = useState<number>(MAP_CAMERA.defaultZoom);
  const [mode, setMode] = useState<CameraMode>("explore");
  const modeRef = useRef<CameraMode>("explore");
  const saved = useRef<SavedView | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pan = useRef<Pan | null>(null);
  const pinch = useRef<Pinch | null>(null);
  const dragged = useRef(false);

  function setScale(view: HTMLDivElement, next: number) {
    scale.current = next;
    view.style.setProperty("--map-zoom", String(next));
    if (modeRef.current === "explore") setZoom(Math.round(next * 100) / 100);
  }

  function worldPoint(view: HTMLDivElement, position: Point): Point {
    return {
      x: (view.scrollLeft + position.x - (track.current?.offsetLeft ?? 0)) / scale.current,
      y: (view.scrollTop + position.y - (track.current?.offsetTop ?? 0)) / scale.current,
    };
  }

  function applyScale(view: HTMLDivElement, requested: number, position: Point, anchor: Point) {
    const next = clampZoom(requested);
    if (next !== scale.current) setScale(view, next);
    view.scrollTo(
      anchor.x * next + (track.current?.offsetLeft ?? 0) - position.x,
      anchor.y * next + (track.current?.offsetTop ?? 0) - position.y,
    );
  }

  function center(view: HTMLDivElement): Point {
    return { x: view.clientWidth / 2, y: view.clientHeight / 2 };
  }

  function zoomAtCenter(requested: number) {
    const view = viewport.current;
    if (!view || modeRef.current !== "explore") return;
    applyScale(view, requested, center(view), worldPoint(view, center(view)));
  }

  /** Track coordinates (unscaled px) of a point given in world units. */
  function trackPoint([x, y]: readonly [number, number]): Point | null {
    const world = track.current?.querySelector<HTMLElement>("[data-learning-map]");
    if (!world) return null;
    return {
      x: world.offsetLeft + x / worldUnits[0] * world.offsetWidth,
      y: world.offsetTop + y / worldUnits[1] * world.offsetHeight,
    };
  }

  function layoutOverview() {
    const view = viewport.current, trk = track.current;
    if (!view || !trk) return;
    const bounds = view.getBoundingClientRect();
    const scope = view.closest(".learning-map-frame") ?? document;
    const obstacles: Rect[] = [...scope.querySelectorAll<HTMLElement>(hudSelector)]
      .map(element => element.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0)
      .map(r => ({ left: r.left - bounds.left, top: r.top - bounds.top, right: r.right - bounds.left, bottom: r.bottom - bounds.top }));
    const fit = fitWorld(
      { width: view.clientWidth, height: view.clientHeight },
      { width: trk.offsetWidth, height: trk.offsetHeight },
      obstacles,
    );
    setScale(view, fit.scale);
    view.style.setProperty("--overview-x", `${fit.x}px`);
    view.style.setProperty("--overview-y", `${fit.y}px`);
    view.scrollTo(0, 0);
  }

  function switchMode(next: CameraMode) {
    const view = viewport.current;
    if (!view) return;
    modeRef.current = next;
    view.dataset.cameraMode = next;
    flushSync(() => setMode(next));
  }

  function enterOverview() {
    const view = viewport.current;
    if (!view || modeRef.current === "overview") return;
    saved.current = { scale: scale.current, center: worldPoint(view, center(view)) };
    pointers.current.clear();
    pan.current = pinch.current = null;
    dragged.current = false;
    delete view.dataset.dragging;
    animate(() => {
      switchMode("overview");
      layoutOverview();
    });
  }

  /** Leave World Overview: to a chosen place (world units) at a readable scale, or back to the saved view. */
  function exitOverview(target?: { point: readonly [number, number]; focus?: () => void }) {
    const view = viewport.current;
    if (!view || modeRef.current !== "overview") return;
    const previous = saved.current;
    animate(() => {
      switchMode("explore");
      const anchor = target ? trackPoint(target.point) : previous?.center;
      const nextScale = target ? MAP_CAMERA.focusZoom : previous?.scale ?? MAP_CAMERA.defaultZoom;
      setScale(view, clampZoom(nextScale));
      if (anchor) applyScale(view, nextScale, center(view), anchor);
      target?.focus?.();
    });
    saved.current = null;
  }

  useLayoutEffect(() => {
    const view = viewport.current;
    if (!view) return;
    view.dataset.cameraMode = "explore";
    view.scrollTo(0, view.scrollHeight);
  }, []);

  useEffect(() => {
    if (mode !== "overview") return;
    const view = viewport.current;
    if (!view) return;
    const observer = new ResizeObserver(() => layoutOverview());
    observer.observe(view);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") exitOverview(); };
    window.addEventListener("keydown", onKey);
    return () => { observer.disconnect(); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function localPoint(event: PointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (modeRef.current !== "explore") { dragged.current = false; return; }
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
    if (modeRef.current === "explore" && target instanceof HTMLElement && target.matches("button:focus-visible")) {
      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
  }

  return {
    viewport, track, start, move, finish, filterClick, revealFocus,
    mode, zoom, minZoom: MAP_CAMERA.minZoom, maxZoom: MAP_CAMERA.maxZoom,
    zoomOut: () => zoomAtCenter(nextZoomStop(scale.current, -1)),
    zoomIn: () => zoomAtCenter(nextZoomStop(scale.current, 1)),
    reset: () => zoomAtCenter(MAP_CAMERA.defaultZoom),
    enterOverview, exitOverview,
  };
}
