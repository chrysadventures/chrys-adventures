import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const LIVE_ORIGIN = "https://jaredtehyh-cell.github.io";

const allowedOrigin = (origin: string | null) => {
  if (!origin) return LIVE_ORIGIN;
  if (origin === LIVE_ORIGIN || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return LIVE_ORIGIN;
};

const corsHeaders = (request: Request) => ({
  "Access-Control-Allow-Origin": allowedOrigin(request.headers.get("origin")),
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const cleanName = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  if (clean.length < 1 || clean.length > maxLength) return null;
  return clean;
};

const hashPin = async (pin: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const toSummary = (row: Record<string, unknown>) => ({
  id: row.id,
  fileName: row.file_name,
  playerName: row.player_name,
  stars: row.stars,
  updatedAt: row.updated_at,
});

const toGame = (row: Record<string, unknown>) => ({
  ...toSummary(row),
  player: {
    name: row.player_name,
    stars: row.stars,
    progress: row.progress,
  },
  lang: row.lang,
  soundEnabled: row.sound_enabled,
  createdAt: row.created_at,
});

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 100_000) return json(request, { error: "Request is too large." }, 413);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid request." }, 400);
  }

  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!/^\d{6}$/.test(pin)) return json(request, { error: "Enter a valid 6-digit PIN." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json(request, { error: "Save service is unavailable." }, 503);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const pinHash = await hashPin(pin);
  const { data: accessPin, error: pinError } = await supabase
    .from("access_pins")
    .select("id")
    .eq("pin_hash", pinHash)
    .maybeSingle();

  if (pinError) {
    console.error("PIN lookup failed", pinError.code);
    return json(request, { error: "Could not check the PIN." }, 500);
  }
  if (!accessPin) return json(request, { error: "That PIN is not recognized." }, 401);

  const action = body.action;
  if (action === "list") {
    const { data, error } = await supabase
      .from("game_saves")
      .select("id,file_name,player_name,stars,updated_at")
      .eq("access_pin_id", accessPin.id)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Save list failed", error.code);
      return json(request, { error: "Could not load game files." }, 500);
    }
    return json(request, { saves: (data ?? []).map(toSummary) });
  }

  if (action === "create") {
    const fileName = cleanName(body.fileName, 24);
    const playerName = cleanName(body.playerName, 20);
    if (!fileName) return json(request, { error: "Game file name must be 1 to 24 characters." }, 400);
    if (!playerName) return json(request, { error: "Player name must be 1 to 20 characters." }, 400);
    const lang = body.lang === "ms" ? "ms" : "en";
    const soundEnabled = body.soundEnabled !== false;
    const { data, error } = await supabase
      .from("game_saves")
      .insert({
        access_pin_id: accessPin.id,
        file_name: fileName,
        player_name: playerName,
        stars: 0,
        progress: {},
        lang,
        sound_enabled: soundEnabled,
      })
      .select("id,file_name,player_name,stars,progress,lang,sound_enabled,created_at,updated_at")
      .single();
    if (error?.code === "23505") return json(request, { error: "A game file with that name already exists for this PIN." }, 409);
    if (error) {
      console.error("Save create failed", error.code);
      return json(request, { error: "Could not create the game file." }, 500);
    }
    return json(request, { save: toGame(data) }, 201);
  }

  const saveId = typeof body.saveId === "string" ? body.saveId : "";
  if (!/^[0-9a-f-]{36}$/i.test(saveId)) return json(request, { error: "Invalid game file." }, 400);

  if (action === "load") {
    const { data, error } = await supabase
      .from("game_saves")
      .select("id,file_name,player_name,stars,progress,lang,sound_enabled,created_at,updated_at")
      .eq("id", saveId)
      .eq("access_pin_id", accessPin.id)
      .maybeSingle();
    if (error) {
      console.error("Save load failed", error.code);
      return json(request, { error: "Could not load the game file." }, 500);
    }
    if (!data) return json(request, { error: "Game file not found." }, 404);
    return json(request, { save: toGame(data) });
  }

  if (action === "save") {
    const player = body.player;
    if (!player || typeof player !== "object" || Array.isArray(player)) {
      return json(request, { error: "Invalid player progress." }, 400);
    }
    const playerRecord = player as Record<string, unknown>;
    const playerName = cleanName(playerRecord.name, 20);
    const stars = playerRecord.stars;
    const progress = playerRecord.progress;
    if (!playerName) return json(request, { error: "Player name must be 1 to 20 characters." }, 400);
    if (!Number.isInteger(stars) || Number(stars) < 0) return json(request, { error: "Invalid star total." }, 400);
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      return json(request, { error: "Invalid lesson progress." }, 400);
    }
    if (JSON.stringify(progress).length > 50_000) return json(request, { error: "Lesson progress is too large." }, 413);
    const lang = body.lang === "ms" ? "ms" : "en";
    const soundEnabled = body.soundEnabled !== false;
    const updatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("game_saves")
      .update({
        player_name: playerName,
        stars,
        progress,
        lang,
        sound_enabled: soundEnabled,
        updated_at: updatedAt,
      })
      .eq("id", saveId)
      .eq("access_pin_id", accessPin.id)
      .select("id,file_name,player_name,stars,progress,lang,sound_enabled,created_at,updated_at")
      .maybeSingle();
    if (error) {
      console.error("Save update failed", error.code);
      return json(request, { error: "Could not save progress." }, 500);
    }
    if (!data) return json(request, { error: "Game file not found." }, 404);
    return json(request, { save: toGame(data) });
  }

  return json(request, { error: "Unknown action." }, 400);
});
