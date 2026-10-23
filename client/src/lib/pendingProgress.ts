type Snapshot = { player: { name: string; stars: number; progress: Record<string, number> }; lang: "en" | "ms"; soundEnabled: boolean };
const key = (id: string) => `chrys-pending-progress:${id}`;
const writes = new Map<string, Promise<unknown>>();

export function stageProgress(id: string, snapshot: Snapshot) {
  // Deliberately propagate storage failures so the UI cannot claim durable recovery.
  localStorage.setItem(key(id), JSON.stringify(snapshot));
}

export function pendingProgress(id: string): Snapshot | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(id)) || "null");
    return value && value.player && typeof value.player.name === "string"
      && Number.isInteger(value.player.stars) && value.player.progress
      && (value.lang === "en" || value.lang === "ms") && typeof value.soundEnabled === "boolean" ? value : null;
  } catch { return null; }
}

export function acknowledgeProgress(id: string, snapshot: Snapshot) {
  // A late response must never erase a newer unsaved snapshot.
  if (localStorage.getItem(key(id)) === JSON.stringify(snapshot)) localStorage.removeItem(key(id));
}

export function serializeProgress<T>(id: string, write: () => Promise<T>): Promise<T> {
  const previous = writes.get(id) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(write);
  writes.set(id, next);
  const clean = () => { if (writes.get(id) === next) writes.delete(id); };
  void next.then(clean, clean);
  return next;
}
