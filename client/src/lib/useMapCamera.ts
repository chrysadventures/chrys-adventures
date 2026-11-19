import { useLayoutEffect, useRef, type FocusEvent, type MouseEvent, type PointerEvent } from "react";

export function useMapCamera() {
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const dragged = useRef(false);

  useLayoutEffect(() => {
    const view = viewport.current;
    if (!view) return;
    view.scrollTo(0, view.scrollHeight);
  }, []);

  function start(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    dragged.current = false;
    if (event.pointerType === "touch" || event.button !== 0) return;
    const view = event.currentTarget;
    gesture.current = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      left: view.scrollLeft, top: view.scrollTop, moved: false,
    };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      finish(event);
      return;
    }
    const view = event.currentTarget;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (!active.moved) {
      if (Math.hypot(dx, dy) < 7) return;
      active.moved = true;
      dragged.current = true;
      view.setPointerCapture(event.pointerId);
      view.dataset.dragging = "true";
    }
    event.preventDefault();
    view.scrollTo(active.left - dx, active.top - dy);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  function filterClick(event: MouseEvent<HTMLDivElement>) {
    if (!dragged.current || event.detail === 0) return;
    dragged.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function revealFocus(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.matches("button:focus-visible")) {
      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
  }

  return { viewport, start, move, finish, filterClick, revealFocus };
}
