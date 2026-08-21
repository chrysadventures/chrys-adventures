export type GameSavePlayer = {
  name: string;
  stars: number;
  progress: Record<string, number>;
};

export type GameSaveSummary = {
  id: string;
  fileName: string;
  playerName: string;
  stars: number;
  updatedAt: string;
};

export type GameSave = GameSaveSummary & {
  player: GameSavePlayer;
  lang: "en" | "ms";
  soundEnabled: boolean;
  createdAt: string;
};

const SUPABASE_URL = "https://qxhqdefxjnrbhiblrftd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eujRRLz7-f8OoaOZuPA0JA_DfTMb9kC";
const GAME_SAVES_ENDPOINT = `${SUPABASE_URL}/functions/v1/game-saves`;
const APPROVED_OFFLINE_PINS = new Set([
  "000000",
  "687596",
  "171259",
  "385079",
  "259511",
  "822704",
  "050616",
]);
const LOCAL_SAVE_PREFIX = "chrys-offline-saves:";

const localSaveKey = (pin: string) => `${LOCAL_SAVE_PREFIX}${pin}`;

const readLocalSaves = (pin: string): GameSave[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(localSaveKey(pin)) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed as GameSave[] : [];
  } catch {
    return [];
  }
};

const writeLocalSaves = (pin: string, saves: GameSave[]) => {
  try {
    localStorage.setItem(localSaveKey(pin), JSON.stringify(saves));
  } catch {
    // The cloud service remains the source of truth when browser storage is unavailable.
  }
};

const isOfflineFallbackAllowed = (pin: string, error: unknown) =>
  APPROVED_OFFLINE_PINS.has(pin) && error instanceof GameSaveApiError && error.status === 0;

const cacheLocalSave = (pin: string, save: GameSave) => {
  const saves = readLocalSaves(pin);
  writeLocalSaves(pin, [save, ...saves.filter((item) => item.id !== save.id)]);
};

export class GameSaveApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GameSaveApiError";
    this.status = status;
  }
}

async function requestGameSaveApi<T>(payload: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(GAME_SAVES_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new GameSaveApiError("Could not connect to the save service. Check your internet connection.", 0);
  }

  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new GameSaveApiError(result.error || "The save service could not complete this request.", response.status);
  }
  return result as T;
}

export async function listGameSaves(pin: string): Promise<GameSaveSummary[]> {
  try {
    const result = await requestGameSaveApi<{ saves: GameSaveSummary[] }>({ action: "list", pin });
    return result.saves;
  } catch (error) {
    if (!isOfflineFallbackAllowed(pin, error)) throw error;
    return readLocalSaves(pin).map(({ id, fileName, playerName, stars, updatedAt }) => ({
      id,
      fileName,
      playerName,
      stars,
      updatedAt,
    }));
  }
}

export async function createGameSave(
  pin: string,
  fileName: string,
  playerName: string,
  lang: "en" | "ms",
  soundEnabled: boolean,
): Promise<GameSave> {
  try {
    const result = await requestGameSaveApi<{ save: GameSave }>({
      action: "create",
      pin,
      fileName,
      playerName,
      lang,
      soundEnabled,
    });
    cacheLocalSave(pin, result.save);
    return result.save;
  } catch (error) {
    if (!isOfflineFallbackAllowed(pin, error)) throw error;
    const now = new Date().toISOString();
    const save: GameSave = {
      id: crypto.randomUUID(),
      fileName,
      playerName,
      stars: 0,
      updatedAt: now,
      player: { name: playerName, stars: 0, progress: {} },
      lang,
      soundEnabled,
      createdAt: now,
    };
    cacheLocalSave(pin, save);
    return save;
  }
}

export async function loadGameSave(pin: string, saveId: string): Promise<GameSave> {
  try {
    const result = await requestGameSaveApi<{ save: GameSave }>({ action: "load", pin, saveId });
    cacheLocalSave(pin, result.save);
    return result.save;
  } catch (error) {
    if (!isOfflineFallbackAllowed(pin, error)) throw error;
    const save = readLocalSaves(pin).find((item) => item.id === saveId);
    if (!save) throw new GameSaveApiError("This game file is not available offline yet.", 404);
    return save;
  }
}

export async function saveGameProgress(
  pin: string,
  saveId: string,
  player: GameSavePlayer,
  lang: "en" | "ms",
  soundEnabled: boolean,
): Promise<GameSave> {
  try {
    const result = await requestGameSaveApi<{ save: GameSave }>({
      action: "save",
      pin,
      saveId,
      player,
      lang,
      soundEnabled,
    });
    cacheLocalSave(pin, result.save);
    return result.save;
  } catch (error) {
    if (!isOfflineFallbackAllowed(pin, error)) throw error;
    const existing = readLocalSaves(pin).find((item) => item.id === saveId);
    if (!existing) throw new GameSaveApiError("This game file is not available offline yet.", 404);
    const save: GameSave = {
      ...existing,
      player,
      playerName: player.name,
      stars: player.stars,
      lang,
      soundEnabled,
      updatedAt: new Date().toISOString(),
    };
    cacheLocalSave(pin, save);
    return save;
  }
}
