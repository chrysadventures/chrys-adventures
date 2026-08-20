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
const TESTING_PIN = "000000";
const LOCAL_TESTING_SAVES_KEY = "chrys-adventures-testing-saves-v1";

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

function readLocalTestingSaves(): GameSave[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_TESTING_SAVES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalTestingSaves(saves: GameSave[]) {
  localStorage.setItem(LOCAL_TESTING_SAVES_KEY, JSON.stringify(saves));
}

function canUseTestingFallback(pin: string, error: unknown) {
  return pin === TESTING_PIN && error instanceof GameSaveApiError && error.status === 0;
}

function localSaveSummary(save: GameSave): GameSaveSummary {
  return {
    id: save.id,
    fileName: save.fileName,
    playerName: save.playerName,
    stars: save.stars,
    updatedAt: save.updatedAt,
  };
}

export async function listGameSaves(pin: string): Promise<GameSaveSummary[]> {
  try {
    const result = await requestGameSaveApi<{ saves: GameSaveSummary[] }>({ action: "list", pin });
    return result.saves;
  } catch (error) {
    if (!canUseTestingFallback(pin, error)) throw error;
    return readLocalTestingSaves()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(localSaveSummary);
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
    return result.save;
  } catch (error) {
    if (!canUseTestingFallback(pin, error)) throw error;
    const saves = readLocalTestingSaves();
    const normalizedName = fileName.trim().toLocaleLowerCase();
    if (saves.some((save) => save.fileName.trim().toLocaleLowerCase() === normalizedName)) {
      throw new GameSaveApiError("A game file with that name already exists on this device.", 409);
    }
    const now = new Date().toISOString();
    const save: GameSave = {
      id: crypto.randomUUID(),
      fileName: fileName.trim(),
      playerName: playerName.trim(),
      stars: 0,
      updatedAt: now,
      player: { name: playerName.trim(), stars: 0, progress: {} },
      lang,
      soundEnabled,
      createdAt: now,
    };
    writeLocalTestingSaves([save, ...saves]);
    return save;
  }
}

export async function loadGameSave(pin: string, saveId: string): Promise<GameSave> {
  try {
    const result = await requestGameSaveApi<{ save: GameSave }>({ action: "load", pin, saveId });
    return result.save;
  } catch (error) {
    if (!canUseTestingFallback(pin, error)) throw error;
    const save = readLocalTestingSaves().find((item) => item.id === saveId);
    if (!save) throw new GameSaveApiError("Game file not found on this device.", 404);
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
    return result.save;
  } catch (error) {
    if (!canUseTestingFallback(pin, error)) throw error;
    const saves = readLocalTestingSaves();
    const index = saves.findIndex((item) => item.id === saveId);
    if (index < 0) throw new GameSaveApiError("Game file not found on this device.", 404);
    const updated: GameSave = {
      ...saves[index],
      player,
      playerName: player.name,
      stars: player.stars,
      lang,
      soundEnabled,
      updatedAt: new Date().toISOString(),
    };
    saves[index] = updated;
    writeLocalTestingSaves(saves);
    return updated;
  }
}
