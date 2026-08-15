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
  const result = await requestGameSaveApi<{ saves: GameSaveSummary[] }>({ action: "list", pin });
  return result.saves;
}

export async function createGameSave(
  pin: string,
  fileName: string,
  playerName: string,
  lang: "en" | "ms",
  soundEnabled: boolean,
): Promise<GameSave> {
  const result = await requestGameSaveApi<{ save: GameSave }>({
    action: "create",
    pin,
    fileName,
    playerName,
    lang,
    soundEnabled,
  });
  return result.save;
}

export async function loadGameSave(pin: string, saveId: string): Promise<GameSave> {
  const result = await requestGameSaveApi<{ save: GameSave }>({ action: "load", pin, saveId });
  return result.save;
}

export async function saveGameProgress(
  pin: string,
  saveId: string,
  player: GameSavePlayer,
  lang: "en" | "ms",
  soundEnabled: boolean,
): Promise<GameSave> {
  const result = await requestGameSaveApi<{ save: GameSave }>({
    action: "save",
    pin,
    saveId,
    player,
    lang,
    soundEnabled,
  });
  return result.save;
}
