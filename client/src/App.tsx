import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  Compass,
  Eraser,
  Flag,
  Hash,
  KeyRound,
  Layers3,
  ListOrdered,
  Map as MapIcon,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import chrysHappy from "@assets/chrys_sitting_new_user_nobg.png";
import chrysExcited from "@assets/chrys_waving_new_user_nobg.png";
import chrysThinking from "@assets/chrys_reading_new_user_nobg.png";
import chrysRunning from "@assets/chrys_running_new_user_hd_nobg.png";
import alyseGuide from "@assets/alyse_guide_new_user_nobg.png";
import trayPhoto from "@assets/tray_photo.png";
import trayImage from "@assets/generated_images/Tray.png";
import forestFloor from "@assets/generated_images/Forestfloor.png";
import {
  createGameSave,
  GameSaveApiError,
  type GameSave,
  type GameSaveSummary,
  listGameSaves,
  loadGameSave,
  saveGameProgress,
} from "./lib/gameSaves";
import { advancedSubtractionQuestionData } from "./questions/advancedSubtractionQuestions";
import {
  advancedTestAdditionData,
  advancedTestCompareBiggerData,
  advancedTestSequencingData,
  advancedTestSubtractionData,
  advancedTestTeenNumberData,
  type AdvancedTestQuestionData,
} from "./questions/advancedTestQuestions";

type Lang = "en" | "ms";
type MathCue = "plus" | "equals" | "minus";
type ContainerKind = "basket" | "tray";
type Screen =
  | "home"
  | "modeSelect"
  | "menu"
  | "advancedMenu"
  | "advancedTeenNumbers"
  | "advancedCompareBigger"
  | "advancedSequencing"
  | "advancedAdditionPart1"
  | "advancedAdditionPart2"
  | "advancedSubtraction"
  | "advancedTestMenu"
  | "advancedTestTeenNumbers"
  | "advancedTestCompareBigger"
  | "advancedTestSequencing"
  | "advancedTestAddition"
  | "advancedTestSubtraction"
  | "learnRecognize"
  | "learnValues"
  | "learnSequencing"
  | "groupingMode"
  | "learnAddition"
  | "learnSubtraction"
  | "learnNumbers"
  | "learnOperations"
  | "learnReal"
  | "testMenu"
  | "testNumbers"
  | "testOperations"
  | "testReal";

type AdvancedTestId = "teenNumbers" | "compareBigger" | "sequencing" | "addition" | "subtraction";
type AdvancedTestScore = { testId: AdvancedTestId; correct: number; total: number; mastered: boolean };

function advancedTestProgressKey(testId: AdvancedTestId, field: "score" | "total" | "mastered") {
  return `advancedTest:${testId}:${field}`;
}

type LearningSectionKey =
  | "recognizeNumbers"
  | "numberValues"
  | "sequencing"
  | "groupingMode"
  | "addition"
  | "subtraction"
  | "learnReal"
  | "advancedTeenNumbers"
  | "advancedCompareBigger"
  | "advancedSequencing"
  | "advancedAdditionPart1"
  | "advancedAdditionPart2"
  | "advancedSubtraction";

type Visual =
  | { kind: "count"; emoji: string; count: number; container?: ContainerKind }
  | { kind: "number"; value: number }
  | { kind: "word"; value: number }
  | { kind: "audioNumber"; value: number }
  | { kind: "groupChoices"; emoji: string; groups: number[]; audioValue?: number }
  | { kind: "groupObserve"; emoji: string; count: number }
  | { kind: "groupMake"; emoji: string; count: number }
  | { kind: "groupBuildMany"; emoji: string; counts: number[] }
  | { kind: "groupTwo"; emoji: string; a: number; b: number }
  | { kind: "groupCompare"; emoji: string; a: number; b: number; ask: "same" | "more" | "fewer" }
  | { kind: "groupCombine"; emoji: string; a: number; b: number }
  | { kind: "numberWithGroup"; value: number; emoji: string }
  | { kind: "sameValue"; count: number; emojis: string[] }
  | { kind: "layoutValue"; count: number; emoji: string }
  | { kind: "compareGroups"; a: number; b: number; emojiA: string; emojiB: string; ask: "same" | "more" | "fewer" }
  | { kind: "order"; nums: number[]; direction: "asc" | "desc" }
  | { kind: "symbol"; a: number; b: number; showObjects?: boolean }
  | { kind: "sequence"; nums: Array<number | "?"> }
  | { kind: "compare"; a: number; b: number }
  | { kind: "add"; a: number; b: number; emoji?: string; container?: ContainerKind; display?: "objects" | "none"; showLabels?: boolean }
  | { kind: "horizontalAdd"; a: number; b: number; display?: "equation" | "objects" | "none"; showLabels?: boolean }
  | { kind: "verticalAdd"; a: number; b: number }
  | { kind: "verticalSubtract"; a: number; b: number; borrowing?: boolean }
  | { kind: "horizontalSubtract"; a: number; b: number }
  | { kind: "subtract"; a: number; b: number; emoji?: string; container?: ContainerKind; display?: "objects" | "none"; showLabels?: boolean }
  | { kind: "teenBundle"; tens: 1 | 2; ones: number }
  | { kind: "teenQuantityArrangement"; count: number; emoji: string; rowPattern: number[] }
  | { kind: "advancedCompareTest"; a: number; b: number; emoji: string; representation: "labeled" | "objects" | "numbers" };

type Question = {
  id: string;
  area: "numbers" | "operations" | "real" | "advanced";
  text: Record<Lang, string>;
  options: Array<number | string>;
  answer: number | string;
  visual: Visual;
  method: Record<Lang, string[]>;
  inputMode?: "choice" | "keypad" | "makeGroup" | "makeGroups" | "buildTotal" | "tapObjects" | "takeAway" | "buildTeen" | "makeTenBuild" | "carryBuild" | "borrowSubtract";
};

const DONT_KNOW_ANSWER = "__dont_know__";

type Player = {
  name: string;
  stars: number;
  progress: Record<string, number>;
};

type LessonAction = {
  label: string;
  onClick: () => void;
  variant?: "plain" | "green";
};

const STORE_KEY = "chrys_adventures_rebuild_state";
const NUMBER_AUDIO_ENABLED = true;
const WORD_AUDIO_ENABLED = false;
const MATH_CUE_AUDIO_ENABLED = true;
const SUCCESS_FANFARE_FILE = "tada-fanfare.mp3";
const NUMBERS = Array.from({ length: 10 }, (_, n) => n);
const BANANA = "\u{1F34C}";
const NUMBER_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--app-font-number)",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};
const getNumberTextStyle = (_value: number | string): React.CSSProperties => NUMBER_TEXT_STYLE;
const NUMBER_AUDIO_PLAYBACK_RATE = 0.85;
const MATH_CUE_AUDIO_PLAYBACK_RATE = 1;
// Decode each clip silently before its audible start. A separate, inaudible Web
// Audio channel keeps mobile audio output awake without replaying part of the
// requested clip or leaking the celebration fanfare into ordinary button taps.
const AUDIO_CLEAR_START_PRIME_MS = 320;
const AUDIO_CLEAR_START_SETTLE_MS = 12;
const AUDIO_PHRASE_JOIN_GAP_MS = 35;
const AUDIO_SEQUENCE_JOIN_WINDOW_MS = 700;
const AUDIO_NUMBER_OBJECT_JOIN_GAP_MS = 8;
const AUDIO_NUMBER_OBJECT_TAIL_TRIM_MS = 160;
const COUNTING_STEP_MS = 1400;
const COUNTING_INTER_NUMBER_GAP_MS = 360;
const COUNTING_NUMBER_TAIL_TRIM_MS = 120;
const COUNT_TOTAL_REVEAL_DELAY_MS = 500;
const SEQUENCING_PLUS_ONE_COUNTING_STEP_MS = 1100;
const ADDITION_BANANA_TRAVEL_MS = 1200;
const ADDITION_BANANA_COUNT_PAUSE_MS = 1200;
const ADDITION_BANANA_STAGGER_MS = ADDITION_BANANA_TRAVEL_MS + ADDITION_BANANA_COUNT_PAUSE_MS;
const SUBTRACTION_SHARE_TRAVEL_MS = 1600;
const SUBTRACTION_SHARE_PAUSE_MS = 900;
const SUBTRACTION_SHARE_ARC_PX = 52;
const ADDITION_EQUATION_GROUPS = [2, 3, 5] as const;
const VALUE_COMPARISON_PAIRS = [
  ["🍃", "🪨"],
  ["🥭", "🌸"],
  ["🥥", "🍄"],
  ["🍎", "🍊"],
] as const;
const WORDS: Record<Lang, string[]> = {
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  ms: ["kosong", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"],
};
const TEEN_WORDS: Record<Lang, Record<number, string>> = {
  en: {
    10: "ten",
    11: "eleven",
    12: "twelve",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
    20: "twenty",
  },
  ms: {
    10: "sepuluh",
    11: "sebelas",
    12: "dua belas",
    13: "tiga belas",
    14: "empat belas",
    15: "lima belas",
    16: "enam belas",
    17: "tujuh belas",
    18: "lapan belas",
    19: "sembilan belas",
    20: "dua puluh",
  },
};

function numberWordFor(value: number, lang: Lang) {
  return TEEN_WORDS[lang][value] ?? WORDS[lang][value] ?? String(value);
}

const NUMBER_AUDIO_FILES: Record<Lang, Record<number, string>> = {
  en: {
    0: "zero.mp3",
    1: "one.mp3",
    2: "two.mp3",
    3: "three.mp3",
    4: "four.mp3",
    5: "five.mp3",
    6: "six.mp3",
    7: "seven.mp3",
    8: "eight.mp3",
    9: "nine.mp3",
    // New recording uses a new URL so deployed browsers cannot reuse the old
    // cached "ten" clip.
    10: "en-number-10-new.mp3",
    11: "Eleven.mp3",
    12: "Twelve.mp3",
    13: "Thirteen.mp3",
    14: "Fourteen.mp3",
    15: "Fifteen.mp3",
    16: "Sixteen.mp3",
    17: "Seventeen.mp3",
    18: "eighteen.mp3",
    19: "Nineteen.mp3",
    20: "Twenty.mp3",
  },
  ms: {
    0: "Kosong.mp3",
    1: "Satu.mp3",
    2: "Dua.mp3",
    3: "Tiga.mp3",
    4: "Empat.mp3",
    5: "Lima.mp3",
    6: "Enam.mp3",
    7: "Tujuh.mp3",
    8: "Lapan.mp3",
    9: "Sembilan.mp3",
    10: "ms-number-10.mp3",
    11: "ms-number-11.mp3",
    12: "ms-number-12.mp3",
    13: "ms-number-13.mp3",
    14: "ms-number-14.mp3",
    15: "ms-number-15.mp3",
    16: "ms-number-16.mp3",
    17: "ms-number-17.mp3",
    18: "ms-number-18.mp3",
    19: "ms-number-19.mp3",
    20: "ms-number-20.mp3",
  },
};

const BANANA_TOTAL_AUDIO_FILES: Record<Lang, Partial<Record<number, string>>> = {
  // The verified English total recordings are mapped explicitly because the
  // uploaded batches use a few different filename patterns.
  en: {
    0: "total 0 banana.mp3",
    1: "en-total-1-bananas.mp3",
    2: "en-total-2-bananas.mp3",
    3: "en-total-3-bananas.mp3",
    4: "en-total-4-bananas.mp3",
    5: "en-total-5-bananas.mp3",
    6: "en-total-6-bananas.mp3",
    7: "en-total-7-bananas.mp3",
    8: "en-total-8-bananas.mp3",
    9: "en-total-9-bananas.mp3",
    10: "t10bananas.mp3",
    11: "en-total-11-bananas.mp3",
    12: "t12 bananas.mp3",
    13: "en-total-13-bananas.mp3",
    14: "en-total-14-bananas.mp3",
    15: "en-total-15-bananas.mp3",
    16: "en-total-16-bananas.mp3",
    17: "en-total-17-bananas.mp3",
    18: "en-total-18-bananas.mp3",
    19: "en-total-19-bananas.mp3",
    20: "en-total-20-bananas.mp3",
  },
  ms: Object.fromEntries(Array.from({ length: 21 }, (_, value) => [value, `ms-total-${value}-bananas.mp3`])) as Record<number, string>,
};

const EN_OBJECT_TOTAL_AUDIO_FILES = {
  total: "total.mp3",
  count: "count.mp3",
  objects: {
    "\u{1F343}": { singular: "leaf.mp3", plural: "leaves.mp3" },
    "\u{1FAA8}": { singular: "rock.mp3", plural: "rocks.mp3" },
    "\u{1F96D}": { plural: "mangoes.mp3" },
    "\u{1F338}": { plural: "flowers.mp3" },
    "\u{1F965}": { plural: "coconuts.mp3" },
    "\u{1F344}": { plural: "mushrooms.mp3" },
    "\u{1F34E}": { plural: "apples.mp3" },
    "\u{1F34A}": { plural: "oranges.mp3" },
    "\u{1F36A}": { plural: "cookies.mp3" },
    "\u{1F41F}": { plural: "fishes.mp3" },
    "\u{1F697}": { plural: "cars.mp3" },
  } as Record<string, { singular?: string; plural: string }>,
} as const;

const EN_OBJECT_TOTAL_PHRASE_AUDIO_FILES: Record<string, Partial<Record<number, string>>> = {
  "\u{1F333}": {
    10: "10 trees.mp3",
  },
  "\u{1FAA8}": {
    11: "11 rocks.mp3",
  },
  "\u{1F343}": {
    12: "12 leaves.mp3",
  },
  "\u{1F344}": {
    13: "13 mushrooms.mp3",
  },
  "\u{1F338}": {
    14: "14 flowers.mp3",
  },
  "\u{1F965}": {
    6: "total 6 coconuts.mp3",
    7: "total 7 coconuts .mp3",
    9: "9 coconut.mp3",
    12: "12 coconut.mp3",
    15: "15 coconuts.mp3",
  },
  "\u{1F34E}": {
    7: "total 7 apples.mp3",
  },
  "\u{1F36A}": {
    4: "total 4 cookies.mp3",
    9: "total 9 cookies.mp3",
  },
  "\u{1F41F}": {
    10: "total 10 fish.mp3",
  },
  "\u{1F96D}": {
    16: "16 mangoes.mp3",
  },
  "\u{2B50}": {
    17: "17 stars.mp3",
  },
  "\u{1F41A}": {
    18: "18 shells.mp3",
  },
  "\u{1F4D8}": {
    19: "19 books.mp3",
  },
  "\u{1F388}": {
    20: "20 balloons.mp3",
  },
};

const MS_OBJECT_TOTAL_AUDIO_FILES: Record<string, Partial<Record<number, string>>> = {
  "\u{1F333}": {
    10: "10 pokok.mp3",
  },
  "\u{1F343}": {
    1: "bm 1 daun.mp3",
    5: "bm 5 daun.mp3",
    9: "bm 9 daun.mp3",
    12: "12 daun.mp3",
  },
  "\u{1FAA8}": {
    1: "bm 1 batu.mp3",
    5: "bm 5 batu.mp3",
    9: "bm 9 batu.mp3",
    11: "11 batu.mp3",
  },
  "\u{1F96D}": {
    2: "bm 2 mangga.mp3",
    6: "bm 6 mangga.mp3",
    16: "16 mangga.mp3",
  },
  "\u{1F338}": {
    2: "bm 2 bunga.mp3",
    6: "bm 6 bunga.mp3",
    14: "14 bunga.mp3",
  },
  "\u{1F965}": {
    3: "bm 3 kelapa.mp3",
    6: "6 kelapa.mp3",
    7: "7 kelapa.mp3",
    9: "9 kelapa.mp3",
    12: "12 kelapa.mp3",
    15: "15 kelapa.mp3",
  },
  "\u{1F344}": {
    3: "bm 3 cendawan.mp3",
    7: "bm 7 cendawan.mp3",
    11: "11 cendawan.mp3",
    13: "13 cendawan.mp3",
    15: "15 cendawan.mp3",
  },
  "\u{1F34E}": {
    3: "3 epal.mp3",
    4: "bm 4 epal.mp3",
    6: "6 epal.mp3",
    7: "7 epal.mp3",
    8: "bm 8 epal.mp3",
  },
  "\u{1F34A}": {
    4: "bm 4 oren.mp3",
    8: "bm 8 oren.mp3",
  },
  "\u{2B50}": {
    17: "17 bintang.mp3",
  },
  "\u{1F41A}": {
    18: "18 cangkerang.mp3",
  },
  "\u{1F4D8}": {
    19: "19 buku.mp3",
  },
  "\u{1F388}": {
    20: "20 belon.mp3",
  },
  "\u{1F36A}": {
    4: "4 biskut.mp3",
    9: "9 biskut.mp3",
  },
  "\u{1F41F}": {
    10: "10 ikan.mp3",
  },
};

const MS_OBJECT_NAME_AUDIO_FILES: Record<string, string> = {
  "\u{1F34E}": "epal.mp3",
  "\u{1F965}": "kelapa.mp3",
  "\u{1F344}": "cendawan.mp3",
  "\u{1F41F}": "ikan.mp3",
  "\u{1F697}": "kereta.mp3",
};

const COUNT_PROMPT_AUDIO_FILES: Record<Lang, string> = {
  en: EN_OBJECT_TOTAL_AUDIO_FILES.count,
  ms: "kira.mp3",
};

const MATH_CUE_AUDIO_FILES: Partial<Record<Lang, Partial<Record<MathCue, string>>>> = {
  en: {
    plus: "en-plus-clear.mp3",
    equals: "en-equals-to-clear.mp3",
    minus: "en-minus-clear.mp3",
  },
  ms: {
    plus: "Tambah.mp3",
    equals: "Sama dengan.mp3",
    minus: "ms-minus.mp3",
  },
};

const DIGIT_LABELS: Record<Lang, readonly [string, string, string]> = {
  en: ["First digit", "Second digit", "Third digit"],
  ms: ["Digit pertama", "Digit kedua", "Digit ketiga"],
};

const DIGIT_LABEL_AUDIO_FILES: Record<Lang, readonly [string, string, string]> = {
  en: ["en-first-digit.mp3", "en-second-digit.mp3", "en-third-digit.mp3"],
  ms: ["ms-digit-pertama.mp3", "ms-digit-kedua.mp3", "ms-digit-ketiga.mp3"],
};

const COMPARISON_AUDIO_FILES: Record<Lang, { greater: string; less: string }> = {
  en: {
    greater: "en-greater-than.mp3",
    less: "en-less-than.mp3",
  },
  ms: {
    greater: "ms-lebih-besar-daripada.mp3",
    less: "ms-lebih-kecil-daripada.mp3",
  },
};

const BM_RECORDED_AUDIO_FILES = new Set<string>([
  ...Object.values(NUMBER_AUDIO_FILES.ms),
  ...Object.values(BANANA_TOTAL_AUDIO_FILES.ms),
  ...Object.values(MATH_CUE_AUDIO_FILES.ms ?? {}),
  ...DIGIT_LABEL_AUDIO_FILES.ms,
  ...Object.values(COMPARISON_AUDIO_FILES.ms),
  ...Object.values(MS_OBJECT_TOTAL_AUDIO_FILES).flatMap((files) => Object.values(files)),
  ...Object.values(MS_OBJECT_NAME_AUDIO_FILES),
  COUNT_PROMPT_AUDIO_FILES.ms,
].filter((file): file is string => Boolean(file)));

const SPRITE_BASE = `${import.meta.env.BASE_URL}assets/sprites/`;
// These URLs are consumed inside index.css's .page-bg::before rule. The CSS
// bundle lives in /assets/, so this parent-relative path resolves to
// /assets/images/ on both GitHub Pages and a root custom domain.
const BACKGROUND_BASE = "../assets/images/";
const DEFAULT_BACKGROUND_STYLE = {
  "--app-bg-color": "#8cccf8",
  "--app-bg-desktop": `url("${BACKGROUND_BASE}learning-meadow-bg-desktop.png")`,
  "--app-bg-tablet": `url("${BACKGROUND_BASE}learning-meadow-bg-tablet.png")`,
  "--app-bg-mobile": `url("${BACKGROUND_BASE}learning-meadow-bg-mobile.png")`,
} as React.CSSProperties;
const CYBER_BACKGROUND_STYLE = {
  "--app-bg-color": "#b55858",
  "--app-bg-desktop": `url("${BACKGROUND_BASE}advanced-sunset-bg-desktop.png")`,
  "--app-bg-tablet": `url("${BACKGROUND_BASE}advanced-sunset-bg-tablet.png")`,
  "--app-bg-mobile": `url("${BACKGROUND_BASE}advanced-sunset-bg-mobile.png")`,
} as React.CSSProperties;
const BASKET_SPRITE = `${SPRITE_BASE}basket.png`;
const OBJECT_SPRITES: Record<string, string> = {
  "\u{1F350}": `${SPRITE_BASE}pear.png`,
  "\u{1F349}": `${SPRITE_BASE}watermelon.png`,
  "\u{1F95D}": `${SPRITE_BASE}kiwi.png`,
  "\u{1F34A}": `${SPRITE_BASE}orange.png`,
  "\u{1F34D}": `${SPRITE_BASE}pineapple.png`,
  "\u{1F34E}": `${SPRITE_BASE}apple.png`,
  "\u{1F353}": `${SPRITE_BASE}strawberry.png`,
  "\u{1F34B}": `${SPRITE_BASE}lemon.png`,
  "🍌": `${SPRITE_BASE}banana.png`,
  "🍃": `${SPRITE_BASE}leaf.png`,
  "🥭": `${SPRITE_BASE}mango.png`,
  "🪨": `${SPRITE_BASE}stone.png`,
  "🥥": `${SPRITE_BASE}coconut.png`,
  "🍄": `${SPRITE_BASE}mushroom.png`,
  "🐟": `${SPRITE_BASE}fish.png`,
  "🌸": `${SPRITE_BASE}flower.png`,
  "🧺": BASKET_SPRITE,
  "🪵": `${SPRITE_BASE}log.png`,
  "🦋": `${SPRITE_BASE}butterfly.png`,
  "🌳": `${SPRITE_BASE}tree.png`,
  "💧": `${SPRITE_BASE}water-drop.png`,
  "🪶": `${SPRITE_BASE}feather.png`,
  "🌰": `${SPRITE_BASE}acorn.png`,
  "❄️": `${SPRITE_BASE}snowflake.png`,
  "⭐": `${SPRITE_BASE}star.png`,
  "🐚": `${SPRITE_BASE}shell.png`,
  "✏️": `${SPRITE_BASE}pencil.png`,
  "✏": `${SPRITE_BASE}pencil.png`,
  "📘": `${SPRITE_BASE}book.png`,
  "🥚": `${SPRITE_BASE}egg.png`,
  "🍪": `${SPRITE_BASE}cookie.png`,
  "🎈": `${SPRITE_BASE}balloon.png`,
  "🚗": `${SPRITE_BASE}toycar.png`,
};

let activeNumberAudio: HTMLAudioElement | null = null;
let activeCelebrationAudio: HTMLAudioElement | null = null;
let successFanfareAudio: HTMLAudioElement | null = null;
let audioOutputContext: AudioContext | null = null;
let audioOutputKeepAlive: OscillatorNode | null = null;
let audioOutputKeepAliveGain: GainNode | null = null;
let lastAudioClipFinishedAt = Number.NEGATIVE_INFINITY;
let audioRunId = 0;
let activeCountingRunId: number | null = null;
let lastCountingFinishedAt = 0;
let queuedAudioAfterCounting: (() => void) | null = null;
let audioMuted = !NUMBER_AUDIO_ENABLED;
let audioUserInteracted = false;
let mathCueVisualRunId = 0;
const numberAudioCache = new Map<string, HTMLAudioElement>();
const AudioEnabledContext = React.createContext(NUMBER_AUDIO_ENABLED);

function beginMathCueVisual(cue: MathCue) {
  const runId = mathCueVisualRunId + 1;
  mathCueVisualRunId = runId;
  document.documentElement.dataset.activeMathCue = cue;
  return runId;
}

function clearMathCueVisual(runId?: number) {
  if (runId !== undefined && runId !== mathCueVisualRunId) return;
  delete document.documentElement.dataset.activeMathCue;
}

function markAudioInteraction() {
  audioUserInteracted = true;
  keepAudioOutputAwake();
}

function setGlobalAudioMuted(muted: boolean) {
  audioMuted = muted;
  if (muted) {
    stopNumberAudio();
    stopCelebrationAudio();
    if (audioOutputContext?.state === "running") void audioOutputContext.suspend();
  } else {
    keepAudioOutputAwake();
  }
}

function keepAudioOutputAwake() {
  if (typeof window === "undefined" || audioMuted) return;
  const AudioContextClass = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!audioOutputContext) {
      audioOutputContext = new AudioContextClass();
      audioOutputKeepAlive = audioOutputContext.createOscillator();
      audioOutputKeepAliveGain = audioOutputContext.createGain();
      audioOutputKeepAliveGain.gain.value = 0;
      audioOutputKeepAlive.frequency.value = 20;
      audioOutputKeepAlive.connect(audioOutputKeepAliveGain);
      audioOutputKeepAliveGain.connect(audioOutputContext.destination);
      audioOutputKeepAlive.start();
    }
    if (audioOutputContext.state === "suspended") void audioOutputContext.resume();
  } catch {
    // Audio still works through HTMLAudioElement when Web Audio is unavailable.
  }
}

function setBmAudioWakeSignal(active: boolean) {
  if (!audioOutputContext || !audioOutputKeepAliveGain) return;
  const now = audioOutputContext.currentTime;
  audioOutputKeepAliveGain.gain.cancelScheduledValues(now);
  // A very quiet 20 Hz signal wakes mobile audio hardware without replaying a
  // soft copy of the spoken clip. This preserves the first BM syllable clearly.
  audioOutputKeepAliveGain.gain.setTargetAtTime(active ? 0.003 : 0, now, 0.006);
}

function cleanDisplayText(value: string) {
  return value;
}

function spriteSrc(value: string) {
  return OBJECT_SPRITES[value] ?? null;
}

function SpriteIcon({ value, className = "h-10 w-10", fallbackClassName = "" }: { value: string; className?: string; fallbackClassName?: string }) {
  const src = spriteSrc(value);
  if (src) {
    return <img src={src} alt="" aria-hidden="true" className={`${className} object-contain ${value === "⭐" ? "scale-125" : ""}`} />;
  }
  return <span className={fallbackClassName}>{cleanDisplayText(value)}</span>;
}

const UI = {
  en: {
    title: "Chrys's Adventures",
    subtitle: "Numbers 0-9, one careful step at a time",
    namePrompt: "Who is learning today?",
    namePlaceholder: "Enter a name",
    chrysIntro: "This is Chrys the monkey!",
    chrysIntroHelp: "Your maths adventure buddy.",
    alyseIntro: "This is Alyse the snake!",
    alyseIntroHelp: "Your friendly learning guide.",
    start: "Start",
    continue: "Continue",
    menuTitle: "Where shall we learn today?",
    advancedAdventure: "Advanced Adventure",
    advancedAdventureShort: "Explore more maths skills with Chrys",
    advancedMenuTitle: "Advanced Expedition",
    advancedMenuHelp: "Explore bigger numbers with Chrys.",
    advancedTeenNumbers: "Recognize Double-Digit Numbers",
    advancedTeenNumbersShort: "Meet digits, then learn numbers 10-20",
    advancedCompareBigger: "Compare Bigger Numbers",
    advancedCompareBiggerShort: "Find which group has more",
    advancedSequencing: "Count Up and Down",
    advancedSequencingShort: "Build sequences with +1 and −1",
    advancedAdditionPart1: "Add Bigger Numbers",
    advancedAdditionPart2: "Write it Down",
    advancedSubtraction: "Subtract Bigger Numbers",
    advancedTestMode: "Advanced Test Mode",
    advancedTestHelp: "Check each Cyber Mission skill in its own test.",
    recognizeNumbers: "Recognize and Identify Numbers",
    numberValues: "Number Values",
    sequencing: "Number Order",
    learnNumbers: "Numbers 0-9",
    learnOperations: "Operations",
    learnOperationsShort: "Learning + and -",
    groupingMode: "Grouping Mode",
    groupingModeShort: "Make and count separate groups",
    addition: "Addition",
    subtraction: "Subtraction",
    learnReal: "Real World",
    testMode: "Test Mode",
    testHelp: "Tests are open anytime. Every answer still shows the method.",
    lesson: "Lesson",
    practice: "Practice",
    back: "Back",
    next: "Next",
    previous: "Previous",
    speak: "Hear it",
    clear: "Clear",
    traced: "I traced it",
    trace: "Trace",
    chooseAnswer: "Choose an answer",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    greatJob: "Great job!",
    lookAgain: "Good try. Let's look again.",
    correct: "Correct",
    tryAgain: "Good try",
    seeMethod: "See the method",
    nextQuestion: "Next question",
    finish: "Finish",
    score: "Score",
    done: "Done",
    noNegative: "Subtraction never goes below zero here.",
    language: "Bahasa Melayu",
  },
  ms: {
    title: "Pengembaraan Chrys",
    subtitle: "Nombor 0-9, langkah demi langkah",
    namePrompt: "Siapa belajar hari ini?",
    namePlaceholder: "Masukkan nama",
    chrysIntro: "Inilah Chrys si monyet!",
    chrysIntroHelp: "Rakan pengembaraan matematik kamu.",
    alyseIntro: "Inilah Alyse si ular!",
    alyseIntroHelp: "Pemandu pembelajaran kamu.",
    start: "Mula",
    continue: "Teruskan",
    menuTitle: "Hari ini mahu belajar apa?",
    advancedAdventure: "Pengembaraan Lanjutan",
    advancedAdventureShort: "Teroka kemahiran matematik bersama Chrys",
    advancedMenuTitle: "Ekspedisi Lanjutan",
    advancedMenuHelp: "Teroka nombor lebih besar bersama Chrys.",
    advancedTeenNumbers: "Kenal Nombor Dua Digit",
    advancedTeenNumbersShort: "Kenal digit, kemudian belajar nombor 10-20",
    advancedCompareBigger: "Banding Nombor Besar",
    advancedCompareBiggerShort: "Cari kumpulan yang lebih banyak",
    advancedSequencing: "Kira Naik dan Turun",
    advancedSequencingShort: "Bina urutan dengan +1 dan −1",
    advancedAdditionPart1: "Tambah Nombor Besar",
    advancedAdditionPart2: "Tulis Tambah",
    advancedSubtraction: "Tolak Nombor Besar",
    advancedTestMode: "Mod Ujian Lanjutan",
    advancedTestHelp: "Uji setiap kemahiran Misi Siber dalam ujian berasingan.",
    recognizeNumbers: "Kenal Nombor",
    numberValues: "Nilai Nombor",
    sequencing: "Susunan Nombor",
    learnNumbers: "Nombor 0-9",
    learnOperations: "Operasi",
    learnOperationsShort: "Belajar + dan -",
    groupingMode: "Kumpulan Nombor",
    groupingModeShort: "Bina dan kira kumpulan berasingan",
    addition: "Tambah",
    subtraction: "Tolak",
    learnReal: "Menaplikasi Konsep",
    testMode: "Mod Ujian",
    testHelp: "Ujian boleh dibuka bila-bila masa. Setiap jawapan tetap tunjuk cara.",
    lesson: "Pelajaran",
    practice: "Latihan",
    back: "Kembali",
    next: "Seterusnya",
    previous: "Sebelumnya",
    speak: "Dengar",
    clear: "Padam",
    traced: "Saya sudah lukis",
    trace: "Ikut garisan",
    chooseAnswer: "Pilih jawapan",
    yourAnswer: "Jawapan kamu",
    correctAnswer: "Jawapan betul",
    greatJob: "Bagus!",
    lookAgain: "Cubaan baik. Mari lihat semula.",
    correct: "Betul",
    tryAgain: "Cubaan baik",
    seeMethod: "Lihat cara",
    nextQuestion: "Soalan seterusnya",
    finish: "Tamat",
    score: "Markah",
    done: "Selesai",
    noNegative: "Tolak tidak akan kurang daripada 0 (kosong) di sini.",
    language: "English",
  },
} as const;

type UIStrings = Record<keyof typeof UI["en"], string>;

type GlossaryEntry = {
  tier: 1 | 2 | 3 | 4;
  term: Record<Lang, string>;
  child: Record<Lang, string>;
  note: Record<Lang, string>;
};

function glossaryEntry(
  tier: GlossaryEntry["tier"],
  termEn: string,
  termMs: string,
  childEn: string,
  childMs: string,
  noteEn: string,
  noteMs: string,
): GlossaryEntry {
  return {
    tier,
    term: { en: termEn, ms: termMs },
    child: { en: childEn, ms: childMs },
    note: { en: noteEn, ms: noteMs },
  };
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  glossaryEntry(1, "Solution", "Cara jawab", "The way to find the answer.", "Cara untuk mencari jawapan.", "The answer and the steps used to reach it.", "Jawapan dan langkah untuk mendapatkannya."),
  glossaryEntry(1, "Method", "Cara", "The way we do it, step by step.", "Cara kita buat, langkah demi langkah.", "A set of steps used to solve something.", "Langkah-langkah yang digunakan untuk menyelesaikan sesuatu."),
  glossaryEntry(1, "Ascending", "Menaik", "Going up. The numbers get bigger.", "Nombor naik dan menjadi lebih besar.", "Numbers placed from small to big.", "Nombor disusun daripada kecil kepada besar."),
  glossaryEntry(1, "Descending", "Menurun", "Going down. The numbers get smaller.", "Nombor turun dan menjadi lebih kecil.", "Numbers placed from big to small.", "Nombor disusun daripada besar kepada kecil."),
  glossaryEntry(1, "Symbol", "Tanda", "A little sign with a meaning, like + or -.", "Tanda kecil yang ada makna, seperti + atau -.", "A mark that stands for an idea or action.", "Tanda yang mewakili idea atau tindakan."),
  glossaryEntry(1, "Tracing", "Ikut garisan", "Follow the dotted line with your finger or pencil.", "Ikut garisan bertitik dengan jari atau pensel.", "Draw over a shape by following its guide line.", "Lukis di atas bentuk dengan mengikut garis panduan."),

  glossaryEntry(2, "Addition", "Tambah", "Put groups together to get more.", "Gabungkan kumpulan untuk mendapat lebih banyak.", "Addition uses the plus sign (+).", "Tambah menggunakan tanda tambah (+)."),
  glossaryEntry(2, "Subtraction", "Tolak", "Take some away to find what is still there.", "Ambil sebahagian untuk tahu apa yang masih ada.", "Subtraction uses the minus sign (-).", "Tolak menggunakan tanda tolak (-)."),
  glossaryEntry(2, "Greater", "Lebih besar", "Greater than means bigger than.", "Lebih besar bermaksud nilainya lebih banyak.", "A greater number is bigger than another number.", "Nombor yang lebih besar mempunyai nilai lebih banyak daripada nombor lain."),
  glossaryEntry(2, "Total", "Jumlah", "How many there are when everything is together.", "Berapa banyak apabila semuanya digabungkan.", "The whole amount after counting all the parts.", "Jumlah penuh selepas semua bahagian dikira."),
  glossaryEntry(2, "Compare", "Banding", "Look at two things to see which has more or less.", "Lihat dua benda untuk tahu yang mana lebih atau kurang.", "Check how two numbers or groups are alike or different.", "Periksa bagaimana dua nombor atau kumpulan sama atau berbeza."),
  glossaryEntry(2, "Value", "Nilai", "How much a number is worth.", "Berapa banyak yang ditunjukkan oleh nombor.", "The number of things a numeral stands for.", "Bilangan benda yang diwakili oleh satu nombor."),
  glossaryEntry(2, "Amounts", "Bilangan", "How much or how many.", "Berapa banyak.", "The number of things in a group.", "Bilangan benda dalam satu kumpulan."),
  glossaryEntry(2, "Objects", "Objek", "Things you can count, like bananas.", "Benda yang boleh dikira, seperti pisang.", "Items shown in a counting group.", "Benda yang ditunjukkan dalam kumpulan kiraan."),
  glossaryEntry(2, "Order", "Susunan", "Which comes first, next, and last.", "Yang mana dahulu, seterusnya, dan terakhir.", "The way numbers or things are arranged.", "Cara nombor atau benda disusun."),
  glossaryEntry(2, "Remove", "Keluarkan", "Take one away.", "Ambil satu.", "Move something out of a group.", "Keluarkan sesuatu daripada kumpulan."),
  glossaryEntry(2, "Spread out", "Jarakkan", "Move things apart with space between them.", "Jarakkan benda supaya ada ruang di antaranya.", "The spaces change, but the count stays the same.", "Ruang berubah, tetapi bilangannya tetap sama."),

  glossaryEntry(3, "Together", "Bersama", "Things joined in one place or group.", "Benda yang digabungkan di satu tempat atau kumpulan.", "Put the parts into one group.", "Gabungkan bahagian menjadi satu kumpulan."),
  glossaryEntry(3, "Different", "Berbeza", "Not the same.", "Tidak sama.", "Two things do not match in some way.", "Dua benda tidak sama."),
  glossaryEntry(3, "Missing", "Hilang", "Something that should be there is not shown.", "Sesuatu yang patut ada tidak ditunjukkan.", "Find the number that fills the empty space.", "Cari nombor yang mengisi ruang kosong."),
  glossaryEntry(3, "Matches", "Padan", "Goes with it because they show the same thing.", "Sesuai dengannya kerana kedua-duanya menunjukkan benda yang sama.", "Two answers, numbers, or groups that fit together.", "Dua jawapan, nombor, atau kumpulan yang sama."),
  glossaryEntry(3, "Smaller", "Lebih kecil", "Less big than another number.", "Lebih kecil daripada nombor lain.", "A number with less than another number.", "Nombor yang kurang daripada nombor lain."),
  glossaryEntry(3, "Smallest", "Paling kecil", "The one with the least.", "Yang mempunyai paling sedikit.", "The lowest number in a group.", "Nombor paling rendah dalam kumpulan."),
  glossaryEntry(3, "Biggest", "Paling besar", "The one with the most.", "Yang mempunyai paling banyak.", "The highest number in a group.", "Nombor paling tinggi dalam kumpulan."),
  glossaryEntry(3, "Bigger", "Lebih besar", "More than another number.", "Lebih banyak daripada nombor lain.", "A number farther up the number line.", "Nombor yang lebih tinggi pada garis nombor."),
  glossaryEntry(3, "Plus", "Tambah", "Put more in.", "Masukkan lebih banyak.", "The + sign tells us to add.", "Tanda + menyuruh kita menambah."),
  glossaryEntry(3, "Minus", "Tolak", "Take some away.", "Ambil sebahagian.", "The - sign tells us to take away.", "Tanda - menyuruh kita mengambil."),
  glossaryEntry(3, "Number line", "Garis nombor", "A row of numbers in order, like a ruler.", "Barisan nombor mengikut susunan, seperti pembaris.", "Move right for bigger numbers and left for smaller numbers.", "Bergerak ke kanan untuk nombor lebih besar dan ke kiri untuk nombor lebih kecil."),
  glossaryEntry(3, "Count", "Kira", "Say one number for each thing.", "Sebut satu nombor untuk setiap benda.", "Count each thing once. The last number is the total.", "Kira setiap benda sekali. Nombor terakhir ialah jumlah."),
  glossaryEntry(3, "Group", "Kumpulan", "Things kept together.", "Benda yang dikumpulkan bersama.", "A set of things that can be counted.", "Sekumpulan benda yang boleh dikira."),
  glossaryEntry(3, "Empty", "Kosong", "There is nothing inside.", "Tiada apa-apa di dalam.", "An empty group has zero things.", "Kumpulan kosong ada 0 benda."),
  glossaryEntry(3, "Whole", "Keseluruhan", "All the parts together.", "Semua bahagian digabungkan.", "The complete group, with nothing missing.", "Kumpulan lengkap tanpa bahagian yang hilang."),
  glossaryEntry(3, "Left over", "Baki", "How many are still there after some are taken away.", "Berapa banyak yang masih ada selepas sebahagian diambil.", "Here, left over means remaining, not the left direction.", "Di sini, baki maksudnya yang tinggal, bukan arah kiri."),
  glossaryEntry(3, "Digit", "Digit", "One of the number symbols from 0 to 9. 14 is made of two digits.", "Satu tanda nombor dari 0 ke 9. 14 dibuat daripada dua digit.", "A single character used to write numbers.", "Aksara tunggal yang digunakan untuk menulis nombor."),
  glossaryEntry(3, "Equation", "Persamaan", "A maths sentence with an equals sign, like 8 + 7 = 15.", "Ayat matematik dengan tanda sama, seperti 8 + 7 = 15.", "A statement showing two sides are equal.", "Kenyataan yang menunjukkan dua bahagian adalah sama."),
  glossaryEntry(3, "Equals", "Sama dengan", "The = sign. It means 'is the same as'.", "Tanda =. Maksudnya 'sama dengan'.", "The symbol showing both sides have the same value.", "Simbol yang menunjukkan kedua-dua bahagian mempunyai nilai yang sama."),
  glossaryEntry(3, "Loose", "Berselerak", "Bananas not in the ten-basket \u2014 the ones left over.", "Pisang tak dalam bakul puluh \u2014 yang tinggal di luar.", "Not grouped or contained.", "Tidak dikumpulkan atau di dalam bekas."),
  glossaryEntry(3, "Fewer", "Lebih sedikit", "A smaller amount.", "Bilangan yang lebih sedikit.", "Less than another amount.", "Kurang daripada satu lagi jumlah."),
  glossaryEntry(3, "Cross out", "Coret", "Draw a line through it to show it's gone.", "Lukis garisan melintasinya untuk tunjuk ia dah tiada.", "Mark something as removed by drawing through it.", "Tandakan sesuatu sebagai dikeluarkan dengan melukis melaluinya."),
  glossaryEntry(3, "Sequence", "Turutan", "Things in order, one after another.", "Benda yang tersusun, satu selepas satu.", "A set of items in a specific order.", "Set item dalam susunan tertentu."),

  glossaryEntry(4, "Ten-frame", "Bingkai puluh", "A box that holds exactly ten bananas.", "Bakul yang muat sepuluh pisang.", "A frame with ten slots used to group ten items together.", "Bekas 10 slot untuk mengumpul sepuluh benda bersama."),
  glossaryEntry(4, "Ten-basket", "Bakul puluh", "A box that holds exactly ten bananas.", "Bakul yang muat sepuluh pisang.", "A frame with ten slots used to group ten items together.", "Bekas 10 slot untuk mengumpul sepuluh benda bersama."),
  glossaryEntry(4, "Column", "Lajur", "A tall line where numbers stand on top of each other.", "Lajur menegak tempat nombor berdiri di atas satu sama lain.", "In vertical addition, a vertical alignment where tens go under tens and ones under ones.", "Dalam tambah menegak, susunan menegak yang mana puluh di bawah puluh dan sa di bawah sa."),
  glossaryEntry(4, "Vertical", "Menegak", "Up and down, like a tall stack.", "Menegak, macam tiang berdiri.", "Written from top to bottom.", "Ditulis dari atas ke bawah."),
  glossaryEntry(4, "Carrying", "Bawa puluh", "When the ones add up to ten, we move that ten up to the tens column.", "Bila sa cukup jadi sepuluh, kita bawa puluh itu ke lajur puluh.", "In vertical addition, exchanging ten ones for one ten added to the tens column.", "Dalam tambah menegak, tukar sepuluh sa jadi satu puluh yang ditambah ke lajur puluh."),
  glossaryEntry(4, "Tens", "Puluh", "How many tens are in a number. In 14, the tens digit is 1.", "Berapa puluh dalam nombor itu. Dalam 14, digit puluh ialah 1.", "The place value showing groups of ten.", "Nilai tempat yang menunjukkan kumpulan sepuluh."),
  glossaryEntry(4, "Ones", "Sa", "How many are left after counting tens. In 14, the ones digit is 4.", "Berapa yang tinggal selepas kira puluh. Dalam 14, digit sa ialah 4.", "The place value showing single units.", "Nilai tempat yang menunjukkan unit tunggal."),
];

const recognitionPracticeQuestions: Question[] = [
  q("rec-audio-symbol-5", "numbers", { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." }, NUMBERS, 5, { kind: "audioNumber", value: 5 }),
  q("rec-audio-symbol-6", "numbers", { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." }, NUMBERS, 6, { kind: "audioNumber", value: 6 }),
  q("rec-audio-symbol-0", "numbers", { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." }, NUMBERS, 0, { kind: "audioNumber", value: 0 }),
  q("rec-audio-symbol-2", "numbers", { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." }, NUMBERS, 2, { kind: "audioNumber", value: 2 }),
  q("rec-audio-symbol-8", "numbers", { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." }, NUMBERS, 8, { kind: "audioNumber", value: 8 }),
  q("rec-symbol-word-1", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["zero", "one", "two", "three"], "one", { kind: "number", value: 1 }),
  q("rec-symbol-word-3", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["one", "two", "three", "four"], "three", { kind: "number", value: 3 }),
  q("rec-symbol-word-6", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["four", "five", "six", "seven"], "six", { kind: "number", value: 6 }),
  q("rec-symbol-word-9", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["six", "seven", "eight", "nine"], "nine", { kind: "number", value: 9 }),
  q("rec-word-symbol-0", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [0, 1, 2, 3], 0, { kind: "word", value: 0 }),
  q("rec-word-symbol-4", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [2, 3, 4, 5], 4, { kind: "word", value: 4 }),
  q("rec-word-symbol-7", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [5, 6, 7, 8], 7, { kind: "word", value: 7 }),
  q("rec-word-symbol-9", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [6, 7, 8, 9], 9, { kind: "word", value: 9 }),
  q("rec-audio-word-2", "numbers", { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" }, ["zero", "one", "two", "three"], "two", { kind: "audioNumber", value: 2 }),
  q("rec-audio-word-8", "numbers", { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" }, ["six", "seven", "eight", "nine"], "eight", { kind: "audioNumber", value: 8 }),
].filter((question) => NUMBER_AUDIO_ENABLED || question.visual.kind !== "audioNumber");

const VALUE_PRACTICE_QUESTION_IDS = new Set([
  "val-audio-group-0",
  "val-symbol-group-1",
  "val-word-group-2",
  "val-audio-group-3",
  "val-symbol-group-4",
  "val-word-group-5",
  "val-audio-group-6",
  "val-symbol-group-7",
  "val-word-group-8",
  "val-audio-group-9",
  "val-make-group-3",
  "val-group-number-5",
  "val-same-3",
  "val-more-4-6",
  "val-fewer-2-5",
]);

const valuePracticeQuestionBank: Question[] = [
  q(
    "val-audio-group-0",
    "numbers",
    { en: "Listen. Choose the right number of objects.", ms: "Dengar. Pilih bilangan objek yang betul." },
    [],
    0,
    { kind: "audioNumber", value: 0 },
    "tapObjects",
    {
      en: ['The audio said "z e r o".', "Zero means nothing."],
      ms: ['Audio menyebut "k o s o n g".', "Kosong maksudnya tiada apa-apa."],
    },
  ),
  q("val-symbol-group-1", "numbers", { en: "Look at the number. Choose the right number of objects.", ms: "Lihat nombor. Pilih bilangan objek yang betul." }, [], 1, { kind: "number", value: 1 }, "tapObjects"),
  q("val-word-group-2", "numbers", { en: "Read the word. Choose the right number of objects.", ms: "Baca perkataan. Pilih bilangan objek yang betul." }, [], 2, { kind: "word", value: 2 }, "tapObjects"),
  q("val-audio-group-3", "numbers", { en: "Listen. Choose the right number of objects.", ms: "Dengar. Pilih bilangan objek yang betul." }, [], 3, { kind: "audioNumber", value: 3 }, "tapObjects"),
  q("val-symbol-group-4", "numbers", { en: "Look at the number. Choose the right number of objects.", ms: "Lihat nombor. Pilih bilangan objek yang betul." }, [], 4, { kind: "number", value: 4 }, "tapObjects"),
  q("val-word-group-5", "numbers", { en: "Read the word. Choose the right number of objects.", ms: "Baca perkataan. Pilih bilangan objek yang betul." }, [], 5, { kind: "word", value: 5 }, "tapObjects"),
  q("val-audio-group-6", "numbers", { en: "Listen. Choose the right number of objects.", ms: "Dengar. Pilih bilangan objek yang betul." }, [], 6, { kind: "audioNumber", value: 6 }, "tapObjects"),
  q("val-symbol-group-7", "numbers", { en: "Look at the number. Choose the right number of objects.", ms: "Lihat nombor. Pilih bilangan objek yang betul." }, [], 7, { kind: "number", value: 7 }, "tapObjects"),
  q("val-word-group-8", "numbers", { en: "Read the word. Choose the right number of objects.", ms: "Baca perkataan. Pilih bilangan objek yang betul." }, [], 8, { kind: "word", value: 8 }, "tapObjects"),
  q("val-audio-group-9", "numbers", { en: "Listen. Choose the right number of objects.", ms: "Dengar. Pilih bilangan objek yang betul." }, [], 9, { kind: "audioNumber", value: 9 }, "tapObjects"),
  q("val-make-group-3", "numbers", { en: "Copy this group.", ms: "Salin kumpulan ini." }, [], 3, { kind: "groupMake", emoji: "🍌", count: 3 }, "makeGroup"),
  q("val-support-3", "numbers", { en: "Which number matches this group?", ms: "Nombor mana padan dengan kumpulan ini?" }, [2, 3, 4], 3, { kind: "numberWithGroup", value: 3, emoji: "🍌" }),
  q("val-support-6", "numbers", { en: "Which number matches this group?", ms: "Nombor mana padan dengan kumpulan ini?" }, [5, 6, 7], 6, { kind: "numberWithGroup", value: 6, emoji: "🍄" }),
  q("val-count-0", "numbers", { en: "How many bananas are in the basket?", ms: "Ada berapa pisang dalam bakul?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🍌", count: 0, container: "basket" }),
  q("val-count-1", "numbers", { en: "How many bananas are there?", ms: "Ada berapa pisang?" }, [0, 1, 2, 3], 1, { kind: "count", emoji: "🍌", count: 1 }),
  q("val-count-2", "numbers", { en: "How many bananas are there?", ms: "Ada berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "count", emoji: "🍌", count: 2 }),
  q("val-count-3", "numbers", { en: "How many bananas are there?", ms: "Ada berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "count", emoji: "🍌", count: 3 }),
  q("val-count-4", "numbers", { en: "How many leaves are there?", ms: "Ada berapa daun?" }, [2, 3, 4, 5], 4, { kind: "count", emoji: "🍃", count: 4 }),
  q("val-count-5", "numbers", { en: "How many mangoes are there?", ms: "Ada berapa mangga?" }, [3, 4, 5, 6], 5, { kind: "count", emoji: "🥭", count: 5 }),
  q("val-count-6", "numbers", { en: "How many rocks are there?", ms: "Ada berapa batu?" }, [4, 5, 6, 7], 6, { kind: "count", emoji: "🪨", count: 6 }),
  q("val-count-7", "numbers", { en: "How many flowers are there?", ms: "Ada berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "count", emoji: "🌸", count: 7 }),
  q("val-count-8", "numbers", { en: "How many coconuts are there?", ms: "Ada berapa kelapa?" }, [6, 7, 8, 9], 8, { kind: "count", emoji: "🥥", count: 8 }),
  q("val-count-9", "numbers", { en: "How many mushrooms are there?", ms: "Ada berapa cendawan?" }, [6, 7, 8, 9], 9, { kind: "count", emoji: "🍄", count: 9 }),
  q("val-group-4", "numbers", { en: "Listen. Which banana group matches?", ms: "Dengar. Kumpulan pisang mana padan?" }, [2, 4, 6], 4, { kind: "groupChoices", emoji: "🍌", groups: [2, 4, 6], audioValue: 4 }),
  q("val-group-7", "numbers", { en: "Listen. Which banana group matches?", ms: "Dengar. Kumpulan pisang mana padan?" }, [5, 7, 9], 7, { kind: "groupChoices", emoji: "🍌", groups: [5, 7, 9], audioValue: 7 }),
  q("val-group-number-5", "numbers", { en: "Which number matches this group?", ms: "Nombor mana padan dengan kumpulan ini?" }, [3, 4, 5, 6], 5, { kind: "count", emoji: "🥭", count: 5 }),
  q("val-same-3", "numbers", { en: "Are these the same number?", ms: "Adakah ini nombor yang sama?" }, ["Yes", "No"], "Yes", { kind: "sameValue", count: 3, emojis: ["🍌", "🍃"] }),
  q("val-layout-6", "numbers", { en: "Do they show the same number?", ms: "Adakah semua tunjuk nombor sama?" }, ["Yes", "No"], "Yes", { kind: "layoutValue", count: 6, emoji: "🍌" }),
  q("val-more-4-6", "numbers", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, ["Group A", "Group B"], "Group B", { kind: "compareGroups", a: 4, b: 6, emojiA: "🍌", emojiB: "🍌", ask: "more" }),
  q("val-fewer-2-5", "numbers", { en: "Which group has fewer?", ms: "Kumpulan mana lebih sedikit?" }, ["Group A", "Group B"], "Group A", { kind: "compareGroups", a: 2, b: 5, emojiA: "🍌", emojiB: "🍌", ask: "fewer" }),
];

const valuePracticeQuestions = valuePracticeQuestionBank.filter((question) =>
  VALUE_PRACTICE_QUESTION_IDS.has(question.id),
);

const sequencingPracticeQuestions: Question[] = [
  q("seq-full-up-0", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 0, { kind: "sequence", nums: ["?", 1, 2, 3, 4, 5, 6, 7, 8, 9] }, "keypad"),
  q("seq-full-up-2", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 2, { kind: "sequence", nums: [0, 1, "?", 3, 4, 5, 6, 7, 8, 9] }, "keypad"),
  q("seq-full-up-5", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 5, { kind: "sequence", nums: [0, 1, 2, 3, 4, "?", 6, 7, 8, 9] }, "keypad"),
  q("seq-full-up-8", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 8, { kind: "sequence", nums: [0, 1, 2, 3, 4, 5, 6, 7, "?", 9] }, "keypad"),
  q("seq-full-down-0", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 0, { kind: "sequence", nums: [9, 8, 7, 6, 5, 4, 3, 2, 1, "?"] }, "keypad"),
  q("seq-full-down-7", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 7, { kind: "sequence", nums: [9, 8, "?", 6, 5, 4, 3, 2, 1, 0] }, "keypad"),
  q("seq-full-down-4", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 4, { kind: "sequence", nums: [9, 8, 7, 6, 5, "?", 3, 2, 1, 0] }, "keypad"),
  q("seq-full-down-8", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 8, { kind: "sequence", nums: [9, "?", 7, 6, 5, 4, 3, 2, 1, 0] }, "keypad"),
  q("seq-part-up-2", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 2, { kind: "sequence", nums: [0, 1, "?", 3, 4] }, "keypad"),
  q("seq-part-up-5", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 5, { kind: "sequence", nums: [2, 3, 4, "?", 6] }, "keypad"),
  q("seq-part-up-6", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 6, { kind: "sequence", nums: [4, 5, "?", 7, 8] }, "keypad"),
  q("seq-part-up-9", "numbers", { en: "Count up. Find the missing number.", ms: "Kira naik. Cari nombor yang hilang." }, [], 9, { kind: "sequence", nums: [5, 6, 7, 8, "?"] }, "keypad"),
  q("seq-part-down-7", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 7, { kind: "sequence", nums: [9, 8, "?", 6, 5] }, "keypad"),
  q("seq-part-down-4", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 4, { kind: "sequence", nums: [7, 6, 5, "?", 3] }, "keypad"),
  q("seq-part-down-3", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 3, { kind: "sequence", nums: [5, 4, "?", 2, 1] }, "keypad"),
  q("seq-part-down-0", "numbers", { en: "Count down. Find the missing number.", ms: "Kira turun. Cari nombor yang hilang." }, [], 0, { kind: "sequence", nums: [4, 3, 2, 1, "?"] }, "keypad"),
];

const numberPracticeQuestions: Question[] = [
  q("lp-n-word-1", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [1, 6, 7, 9], 1, { kind: "word", value: 1 }),
  q("lp-n-word-8", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [3, 5, 8, 0], 8, { kind: "word", value: 8 }),
  q("lp-n-count-3", "numbers", { en: "Count the bananas.", ms: "Kira pisang." }, [1, 2, 3, 4], 3, { kind: "count", emoji: "🍌", count: 3 }),
q("lp-n-count-0", "numbers", { en: "How many bananas are in the basket?", ms: "Ada berapa pisang dalam bakul?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🍌", count: 0, container: "basket" }),
  q("lp-n-after-4", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [3, 4, 5, 6], 5, { kind: "sequence", nums: [2, 3, 4, "?"] }),
  q("lp-n-before-7", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [5, "?", 7, 8] }),
  q("lp-n-missing-2", "numbers", { en: "What number is missing on the number line?", ms: "Nombor apa yang hilang pada garis nombor?" }, [1, 2, 3, 4], 2, { kind: "sequence", nums: [0, 1, "?", 3] }),
  q("lp-n-skip-even", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [2, 3, 4, 5], 4, { kind: "sequence", nums: [0, 2, "?", 6, 8] }),
  q("lp-n-skip-odd", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [3, 4, 5, 6], 5, { kind: "sequence", nums: [1, 3, "?", 7, 9] }),
  q("lp-n-smaller", "numbers", { en: "Which number is less: 9 or 2?", ms: "Nombor mana lebih kecil: 9 atau 2?" }, [1, 2, 7, 9], 2, { kind: "compare", a: 9, b: 2 }),
];

const numberQuestions: Question[] = [
  q("n-count-bananas-6", "numbers", { en: "Count the bananas.", ms: "Kira pisang." }, [4, 5, 6, 7], 6, { kind: "count", emoji: "🍌", count: 6 }),
  q("n-count-stars-4", "numbers", { en: "Count the stars.", ms: "Kira bintang." }, [2, 3, 4, 5], 4, { kind: "count", emoji: "⭐", count: 4 }),
  q("n-count-shells-9", "numbers", { en: "Count the shells.", ms: "Kira cangkerang." }, [6, 7, 8, 9], 9, { kind: "count", emoji: "🐚", count: 9 }),
  q("n-count-apples-2", "numbers", { en: "Count the apples.", ms: "Kira epal." }, [0, 1, 2, 3], 2, { kind: "count", emoji: "🍎", count: 2 }),
  q("n-count-empty", "numbers", { en: "How many flowers are there?", ms: "Ada berapa bunga?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🌸", count: 0 }),
  q("n-word-0", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [0, 2, 4, 6], 0, { kind: "word", value: 0 }),
  q("n-word-3", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [3, 5, 7, 9], 3, { kind: "word", value: 3 }),
  q("n-word-5", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [2, 5, 6, 8], 5, { kind: "word", value: 5 }),
  q("n-word-7", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [1, 4, 7, 9], 7, { kind: "word", value: 7 }),
  q("n-word-9", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [0, 6, 8, 9], 9, { kind: "word", value: 9 }),
  q("n-after-1", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [0, 1, 2, 3], 2, { kind: "sequence", nums: [0, 1, "?"] }),
  q("n-after-5", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [4, 5, 6, 7], 6, { kind: "sequence", nums: [3, 4, 5, "?"] }),
  q("n-after-8", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [6, 7, 8, 9], 9, { kind: "sequence", nums: [6, 7, 8, "?"] }),
  q("n-before-3", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [1, 2, 3, 4], 2, { kind: "sequence", nums: [1, "?", 3, 4] }),
  q("n-before-8", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [6, 7, 8, 9], 7, { kind: "sequence", nums: [6, "?", 8, 9] }),
  q("n-missing-4", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [2, 3, 4, 5], 4, { kind: "sequence", nums: [2, 3, "?", 5] }),
  q("n-missing-6", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [4, 5, "?", 7] }),
  q("n-skip-even-6", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [0, 2, 4, "?", 8] }),
  q("n-skip-odd-7", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 9], 7, { kind: "sequence", nums: [1, 3, 5, "?", 9] }),
  q("n-skip-even-8", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [6, 7, 8, 9], 8, { kind: "sequence", nums: [0, 2, 4, 6, "?"] }),
  q("n-skip-odd-9", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [6, 7, 8, 9], 9, { kind: "sequence", nums: [1, 3, 5, 7, "?"] }),
  q("n-greater-2-7", "numbers", { en: "Which number is more: 2 or 7?", ms: "Nombor mana lebih besar: 2 atau 7?" }, [2, 4, 7, 9], 7, { kind: "compare", a: 2, b: 7 }),
  q("n-greater-6-8", "numbers", { en: "Which number is more: 6 or 8?", ms: "Nombor mana lebih besar: 6 atau 8?" }, [4, 6, 8, 9], 8, { kind: "compare", a: 6, b: 8 }),
  q("n-smaller-6-1", "numbers", { en: "Which number is less: 6 or 1?", ms: "Nombor mana lebih kecil: 6 atau 1?" }, [1, 3, 6, 8], 1, { kind: "compare", a: 6, b: 1 }),
  q("n-smaller-4-0", "numbers", { en: "Which number is less: 4 or 0?", ms: "Nombor mana lebih kecil: 4 atau 0?" }, [0, 2, 4, 6], 0, { kind: "compare", a: 4, b: 0 }),
];

const operationPrompt = (a: number, operator: "+" | "-", b: number): Record<Lang, string> => ({
  en: `Solve: ${a} ${operator} ${b}.`,
  ms: `Selesaikan: ${a} ${operator} ${b}.`,
});

const operationQuestions: Question[] = [
  q("o-add-1-2", "operations", operationPrompt(1, "+", 2), [2, 3, 4, 5], 3, { kind: "add", a: 1, b: 2, emoji: "🍌" }),
  q("o-add-2-5", "operations", operationPrompt(2, "+", 5), [5, 6, 7, 8], 7, { kind: "add", a: 2, b: 5, emoji: "🍌" }),
  q("o-add-3-4", "operations", operationPrompt(3, "+", 4), [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🌸" }),
  q("o-add-6-1", "operations", operationPrompt(6, "+", 1), [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "🍌" }),
  q("o-add-8-1", "operations", operationPrompt(8, "+", 1), [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "🐚" }),
  q("o-add-9-0", "operations", operationPrompt(9, "+", 0), [0, 7, 8, 9], 9, { kind: "add", a: 9, b: 0, emoji: "⭐" }),
  q("o-add-4-2", "operations", operationPrompt(4, "+", 2), [5, 6, 7, 8], 6, { kind: "add", a: 4, b: 2, emoji: "🍌" }),
  q("o-add-5-3", "operations", operationPrompt(5, "+", 3), [6, 7, 8, 9], 8, { kind: "add", a: 5, b: 3, emoji: "🍎" }),
  q("o-add-7-0", "operations", operationPrompt(7, "+", 0), [0, 6, 7, 8], 7, { kind: "add", a: 7, b: 0, emoji: "🍌" }),
  q("o-add-0-8", "operations", operationPrompt(0, "+", 8), [0, 7, 8, 9], 8, { kind: "add", a: 0, b: 8, emoji: "🌸" }),
  q("o-add-2-6", "operations", operationPrompt(2, "+", 6), [6, 7, 8, 9], 8, { kind: "add", a: 2, b: 6, emoji: "⭐" }),
  q("o-add-4-4", "operations", operationPrompt(4, "+", 4), [6, 7, 8, 9], 8, { kind: "add", a: 4, b: 4, emoji: "🐚" }),
  q("o-sub-8-2", "operations", operationPrompt(8, "-", 2), [4, 5, 6, 7], 6, { kind: "subtract", a: 8, b: 2, emoji: "🍌" }),
  q("o-sub-9-5", "operations", operationPrompt(9, "-", 5), [3, 4, 5, 6], 4, { kind: "subtract", a: 9, b: 5, emoji: "🐚" }),
  q("o-sub-7-7", "operations", operationPrompt(7, "-", 7), [0, 1, 2, 3], 0, { kind: "subtract", a: 7, b: 7, emoji: "⭐" }),
  q("o-sub-6-1", "operations", operationPrompt(6, "-", 1), [4, 5, 6, 7], 5, { kind: "subtract", a: 6, b: 1, emoji: "🍌" }),
  q("o-sub-5-3", "operations", operationPrompt(5, "-", 3), [1, 2, 3, 4], 2, { kind: "subtract", a: 5, b: 3, emoji: "🌸" }),
  q("o-sub-4-0", "operations", operationPrompt(4, "-", 0), [0, 3, 4, 5], 4, { kind: "subtract", a: 4, b: 0, emoji: "🍎" }),
  q("o-sub-9-8", "operations", operationPrompt(9, "-", 8), [0, 1, 2, 3], 1, { kind: "subtract", a: 9, b: 8, emoji: "🍌" }),
  q("o-sub-8-4", "operations", operationPrompt(8, "-", 4), [2, 3, 4, 5], 4, { kind: "subtract", a: 8, b: 4, emoji: "🐚" }),
  q("o-sub-6-5", "operations", operationPrompt(6, "-", 5), [0, 1, 2, 3], 1, { kind: "subtract", a: 6, b: 5, emoji: "⭐" }),
  q("o-sub-3-2", "operations", operationPrompt(3, "-", 2), [0, 1, 2, 3], 1, { kind: "subtract", a: 3, b: 2, emoji: "🍌" }),
  q("o-sub-9-0", "operations", operationPrompt(9, "-", 0), [0, 7, 8, 9], 9, { kind: "subtract", a: 9, b: 0, emoji: "🌸" }),
  q("o-sub-7-4", "operations", operationPrompt(7, "-", 4), [2, 3, 4, 5], 3, { kind: "subtract", a: 7, b: 4, emoji: "🍎" }),
  q("o-sub-5-5", "operations", operationPrompt(5, "-", 5), [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "🥤" }),
];

const additionPracticeQuestions: Question[] = [
  // Questions 1-3: objects with visible number labels.
  q("l-add-labeled-1-2", "operations", { en: "Chrys has 1 banana and gets 2 more. How many bananas does he have now?", ms: "Chrys ada 1 pisang dan dapat 2 lagi. Berapa pisang sekarang?" }, [1, 2, 3, 4], 3, { kind: "add", a: 1, b: 2, emoji: "🍌", showLabels: true }),
  q("l-add-labeled-2-4", "operations", { en: "Chrys has 2 bananas and gets 4 more. How many bananas does he have now?", ms: "Chrys ada 2 pisang dan dapat 4 lagi. Berapa pisang sekarang?" }, [4, 5, 6, 7], 6, { kind: "add", a: 2, b: 4, emoji: "🍌", showLabels: true }),
  q("l-add-labeled-3-4", "operations", { en: "Chrys eats 3 bananas, then eats 4 more. How many bananas does he eat altogether?", ms: "Chrys makan 3 pisang dan 4 pisang lagi. Berapa pisang semuanya?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🍌", showLabels: true }),
  // Questions 4-6: objects without number labels.
  q("l-add-objects-1-5", "operations", { en: "Chrys has 1 banana and finds 5 more. How many bananas does he have now?", ms: "Chrys ada 1 pisang dan jumpa 5 lagi. Berapa pisang sekarang?" }, [4, 5, 6, 7], 6, { kind: "add", a: 1, b: 5, emoji: "🍌" }),
  q("l-add-objects-4-4", "operations", { en: "Chrys has 4 bananas and gets 4 more. How many bananas does he have now?", ms: "Chrys ada 4 pisang dan dapat 4 lagi. Berapa pisang sekarang?" }, [6, 7, 8, 9], 8, { kind: "add", a: 4, b: 4, emoji: "🍌" }),
  q("l-add-objects-5-4", "operations", { en: "Chrys eats 5 bananas, then eats 4 more. How many bananas does he eat altogether?", ms: "Chrys makan 5 pisang dan 4 pisang lagi. Berapa pisang semuanya?" }, [6, 7, 8, 9], 9, { kind: "add", a: 5, b: 4, emoji: "🍌" }),
  // Questions 7-9: numbers only.
  q("l-add-numbers-4-2", "operations", operationPrompt(4, "+", 2), [4, 5, 6, 7], 6, { kind: "add", a: 4, b: 2, emoji: "🍌", display: "none" }),
  q("l-add-numbers-0-7", "operations", operationPrompt(0, "+", 7), [0, 6, 7, 8], 7, { kind: "add", a: 0, b: 7, emoji: "🍌", display: "none" }),
  q("l-add-numbers-8-1", "operations", operationPrompt(8, "+", 1), [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "🍌", display: "none" }),
];

const subtractionPracticeQuestions: Question[] = [
  // Questions 1-3: objects with visible number labels.
  q("l-sub-labeled-8-5", "operations", { en: "Chrys has 8 bananas. He gives away 5 bananas. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia beri 5 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "subtract", a: 8, b: 5, emoji: "🍌", showLabels: true }),
  q("l-sub-labeled-6-2", "operations", { en: "Chrys has 6 bananas. He eats 2 bananas. How many bananas are left?", ms: "Chrys ada 6 pisang. Dia makan 2 pisang. Tinggal berapa pisang?" }, [2, 3, 4, 5], 4, { kind: "subtract", a: 6, b: 2, emoji: "🍌", showLabels: true }),
  q("l-sub-labeled-9-6", "operations", { en: "There are 9 bananas. You take away 6 bananas. How many bananas are left?", ms: "Ada 9 pisang. Kamu ambil 6 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "subtract", a: 9, b: 6, emoji: "🍌", showLabels: true }),
  // Questions 4-6: objects without number labels.
  q("l-sub-objects-5-0", "operations", { en: "Chrys has 5 bananas. He gives away 0 bananas. How many bananas are left?", ms: "Chrys ada 5 pisang. Dia beri 0 pisang. Tinggal berapa pisang?" }, [0, 4, 5, 6], 5, { kind: "subtract", a: 5, b: 0, emoji: "🍌" }),
  q("l-sub-objects-8-1", "operations", { en: "Chrys has 8 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "subtract", a: 8, b: 1, emoji: "🍌" }),
  q("l-sub-objects-4-4", "operations", { en: "Chrys has 4 bananas. He gives away all 4 bananas. How many bananas are left?", ms: "Chrys ada 4 pisang. Dia beri semua 4 pisang. Tinggal berapa pisang?" }, [0, 1, 3, 4], 0, { kind: "subtract", a: 4, b: 4, emoji: "🍌" }),
  // Questions 7-9: numbers only.
  q("l-sub-numbers-7-3", "operations", operationPrompt(7, "-", 3), [2, 3, 4, 5], 4, { kind: "subtract", a: 7, b: 3, emoji: "🍌", display: "none" }),
  q("l-sub-numbers-9-4", "operations", operationPrompt(9, "-", 4), [3, 4, 5, 6], 5, { kind: "subtract", a: 9, b: 4, emoji: "🍌", display: "none" }),
  q("l-sub-numbers-6-5", "operations", operationPrompt(6, "-", 5), [0, 1, 2, 3], 1, { kind: "subtract", a: 6, b: 5, emoji: "🍌", display: "none" }),
];

const realQuestions: Question[] = [
  q("r-count-apples", "real", { en: "Count the apples.", ms: "Kira epal." }, [3, 4, 5, 6], 5, { kind: "count", emoji: "🍎", count: 5 }),
  q("r-count-pencils", "real", { en: "Count the pencils.", ms: "Kira pensel." }, [5, 6, 7, 8], 7, { kind: "count", emoji: "✏️", count: 7 }),
q("r-count-cups", "real", { en: "How many cups are on the tray?", ms: "Ada berapa cawan di atas dulang?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🥤", count: 0, container: "tray" }),
q("r-add-oranges", "real", { en: "There are 3 oranges. Put 4 more oranges in the basket. How many oranges are in the basket now?", ms: "Ada 3 oren. Letak 4 oren lagi dalam bakul. Berapa oren?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🍊", container: "basket" }),
  q("r-add-books", "real", { en: "Chrys has 1 book and gets 6 more books. How many books does he have now?", ms: "Chrys ada 1 buku dan dapat 6 buku lagi. Berapa buku?" }, [5, 6, 7, 8], 7, { kind: "add", a: 1, b: 6, emoji: "📘" }),
  q("r-add-bananas", "real", { en: "Chrys has 2 bananas. His friend gives him 5 more. How many bananas does he have now?", ms: "Chrys ada 2 pisang. Kawannya beri 5 lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 2, b: 5, emoji: "🍌" }),
  q("r-add-flowers", "real", { en: "There are 4 flowers. Add 0 more flowers. How many flowers are there now?", ms: "Ada 4 bunga. Tambah 0 bunga lagi. Berapa bunga?" }, [0, 3, 4, 5], 4, { kind: "add", a: 4, b: 0, emoji: "🌸" }),
  q("r-add-eggs", "real", { en: "There are 5 eggs. Add 4 more eggs. How many eggs are there now?", ms: "5 telur dan 4 telur lagi. Berapa telur?" }, [6, 7, 8, 9], 9, { kind: "add", a: 5, b: 4, emoji: "🥚" }),
  q("r-sub-cookies", "real", { en: "There are 8 cookies. Take away 3. How many are left?", ms: "Ada 8 biskut. Ambil 3. Tinggal berapa?" }, [4, 5, 6, 7], 5, { kind: "subtract", a: 8, b: 3, emoji: "🍪" }),
  q("r-sub-balloons", "real", { en: "There are 4 balloons. 0 balloons fly away. How many balloons are left?", ms: "Ada 4 belon. 0 belon terbang pergi. Tinggal berapa belon?" }, [0, 3, 4, 5], 4, { kind: "subtract", a: 4, b: 0, emoji: "🎈" }),
  q("r-sub-pencils", "real", { en: "There are 9 pencils. You give away 2 pencils. How many pencils are left?", ms: "Ada 9 pensel. Kamu beri 2 pensel. Tinggal berapa pensel?" }, [5, 6, 7, 8], 7, { kind: "subtract", a: 9, b: 2, emoji: "✏️" }),
  q("r-sub-apples", "real", { en: "There are 6 apples. You eat 4 apples. How many apples are left?", ms: "Ada 6 epal. Kamu makan 4 epal. Tinggal berapa epal?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 6, b: 4, emoji: "🍎" }),
  q("r-sub-cups", "real", { en: "There are 5 cups. You put away all 5 cups. How many cups are left?", ms: "Ada 5 cawan. Kamu simpan semua 5 cawan. Tinggal berapa cawan?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "🥤" }),
  q("r-count-toys", "real", { en: "Count the toy cars.", ms: "Kira kereta mainan." }, [4, 5, 6, 7], 6, { kind: "count", emoji: "🚗", count: 6 }),
  q("r-sub-bananas", "real", { en: "Chrys has 3 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 3 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 3, b: 1, emoji: "🍌" }),
];

const realPracticeQuestions: Question[] = [
  q("rp-count-pears", "real", { en: "How many pears does Chrys see?", ms: "Berapa buah pir yang Chrys nampak?" }, [0, 1, 2, 3], 2, { kind: "count", emoji: "\u{1F350}", count: 2 }),
  q("rp-add-watermelon", "real", { en: "Chrys has 1 watermelon slice and finds 1 more. How many slices does he have now?", ms: "Chrys ada 1 potong tembikai dan jumpa 1 lagi. Berapa potong tembikai?" }, [1, 2, 3, 4], 2, { kind: "add", a: 1, b: 1, emoji: "\u{1F349}" }),
  q("rp-sub-kiwi", "real", { en: "Chrys has 3 kiwi slices. He eats 1. How many slices are left?", ms: "Chrys ada 3 potong kiwi. Dia makan 1. Tinggal berapa potong kiwi?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 3, b: 1, emoji: "\u{1F95D}" }),
  q("rp-add-oranges", "real", { en: "Chrys has 2 oranges. He finds 3 more. How many oranges does he have now?", ms: "Chrys ada 2 oren. Dia jumpa 3 lagi. Berapa oren?" }, [3, 4, 5, 6], 5, { kind: "add", a: 2, b: 3, emoji: "\u{1F34A}" }),
  q("rp-sub-pineapples", "real", { en: "Chrys has 5 pineapples. He gives away 1. How many are left?", ms: "Chrys ada 5 nanas. Dia beri 1. Tinggal berapa nanas?" }, [3, 4, 5, 6], 4, { kind: "subtract", a: 5, b: 1, emoji: "\u{1F34D}" }),
  q("rp-add-apples", "real", { en: "There are 2 apples in the basket. Add 3 more. How many apples are in the basket now?", ms: "Ada 2 epal dalam bakul. Tambah 3 lagi. Berapa epal?" }, [4, 5, 6, 7], 5, { kind: "add", a: 2, b: 3, emoji: "\u{1F34E}", container: "basket" }),
  q("rp-choose-strawberries", "real", { en: "Chrys has 4 strawberries. He finds 2 more. Is this adding or taking away?", ms: "Chrys ada 4 strawberi. Dia jumpa 2 lagi. Ini tambah atau tolak?" }, ["Adding", "Taking away"], "Adding", { kind: "add", a: 4, b: 2, emoji: "\u{1F353}" }),
  q("rp-choose-lemons", "real", { en: "Chrys has 6 lemons. He gives away 2. Is this adding or taking away?", ms: "Chrys ada 6 lemon. Dia beri 2. Ini tambah atau tolak?" }, ["Adding", "Taking away"], "Taking away", { kind: "subtract", a: 6, b: 2, emoji: "\u{1F34B}" }),
];

const realTestQuestions: Question[] = [
q("rt-count-bananas-4", "real", { en: "Count the bananas in the picnic basket.", ms: "Kira pisang dalam bakul piknik." }, [2, 3, 4, 5], 4, { kind: "count", emoji: "🍌", count: 4, container: "basket" }),
  q("rt-count-apples-8", "real", { en: "Count the apples.", ms: "Kira epal." }, [6, 7, 8, 9], 8, { kind: "count", emoji: "🍎", count: 8 }),
q("rt-count-oranges-3", "real", { en: "Count the oranges in the basket.", ms: "Kira oren dalam bakul." }, [1, 2, 3, 4], 3, { kind: "count", emoji: "🍊", count: 3, container: "basket" }),
  q("rt-count-books-5", "real", { en: "Count the books.", ms: "Kira buku." }, [3, 4, 5, 6], 5, { kind: "count", emoji: "📘", count: 5 }),
q("rt-count-cups-1", "real", { en: "How many cups are on the tray?", ms: "Ada berapa cawan di atas dulang?" }, [0, 1, 2, 3], 1, { kind: "count", emoji: "🥤", count: 1, container: "tray" }),
  q("rt-count-flowers-9", "real", { en: "Count the flowers.", ms: "Kira bunga." }, [6, 7, 8, 9], 9, { kind: "count", emoji: "🌸", count: 9 }),
  q("rt-count-eggs-2", "real", { en: "Count the eggs.", ms: "Kira telur." }, [0, 1, 2, 3], 2, { kind: "count", emoji: "🥚", count: 2 }),
  q("rt-count-toys-7", "real", { en: "Count the toy cars.", ms: "Kira kereta mainan." }, [5, 6, 7, 8], 7, { kind: "count", emoji: "🚗", count: 7 }),
  q("rt-add-bananas-1-6", "real", { en: "Chrys has 1 banana. He finds 6 more. How many bananas does he have now?", ms: "Chrys ada 1 pisang. Chrys jumpa 6 lagi. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 1, b: 6, emoji: "🍌" }),
  q("rt-add-apples-4-3", "real", { en: "There are 4 apples. Add 3 more apples. How many apples are there now?", ms: "4 epal dan 3 epal lagi. Berapa epal?" }, [5, 6, 7, 8], 7, { kind: "add", a: 4, b: 3, emoji: "🍎" }),
  q("rt-add-oranges-6-1", "real", { en: "There are 6 oranges. Add 1 more orange. How many oranges are there now?", ms: "Ada 6 oren. Tambah 1 oren lagi. Berapa oren?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "🍊" }),
  q("rt-add-books-2-4", "real", { en: "Chrys has 2 books and finds 4 more. How many books does he have now?", ms: "Chrys ada 2 buku dan jumpa 4 buku lagi. Berapa buku?" }, [4, 5, 6, 7], 6, { kind: "add", a: 2, b: 4, emoji: "📘" }),
  q("rt-add-cups-8-1", "real", { en: "There are 8 cups. Add 1 more cup. How many cups are there now?", ms: "Ada 8 cawan. Tambah 1 cawan lagi. Berapa cawan?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "🥤" }),
  q("rt-add-flowers-5-2", "real", { en: "There are 5 flowers. Add 2 more flowers. How many flowers are there now?", ms: "Ada 5 bunga. Tambah 2 bunga lagi. Berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "add", a: 5, b: 2, emoji: "🌸" }),
  q("rt-add-eggs-3-5", "real", { en: "There are 3 eggs. Add 5 more eggs. How many eggs are there now?", ms: "3 telur dan 5 telur lagi. Berapa telur?" }, [6, 7, 8, 9], 8, { kind: "add", a: 3, b: 5, emoji: "🥚" }),
  q("rt-add-toys-9-0", "real", { en: "There are 9 toy cars. Add 0 more toy cars. How many toy cars are there now?", ms: "Ada 9 kereta mainan. Tambah 0 lagi. Berapa kereta mainan?" }, [0, 7, 8, 9], 9, { kind: "add", a: 9, b: 0, emoji: "🚗" }),
q("rt-add-bananas-0-5", "real", { en: "The basket has 0 bananas. Put in 5 bananas. How many bananas are in the basket now?", ms: "Bakul ada 0 pisang. Letak 5 pisang. Berapa pisang?" }, [0, 4, 5, 6], 5, { kind: "add", a: 0, b: 5, emoji: "🍌", container: "basket" }),
  q("rt-sub-bananas-9-3", "real", { en: "Chrys has 9 bananas. He eats 3 bananas. How many bananas are left?", ms: "Chrys ada 9 pisang. Dia makan 3 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 6, { kind: "subtract", a: 9, b: 3, emoji: "🍌" }),
  q("rt-sub-apples-8-6", "real", { en: "There are 8 apples. You eat 6 apples. How many apples are left?", ms: "Ada 8 epal. Kamu makan 6 epal. Tinggal berapa epal?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 8, b: 6, emoji: "🍎" }),
  q("rt-sub-oranges-7-1", "real", { en: "There are 7 oranges. You take away 1 orange. How many oranges are left?", ms: "Ada 7 oren. Kamu ambil 1 oren. Tinggal berapa oren?" }, [5, 6, 7, 8], 6, { kind: "subtract", a: 7, b: 1, emoji: "🍊" }),
  q("rt-sub-books-6-4", "real", { en: "There are 6 books. You put away 4 books. How many books are left?", ms: "Ada 6 buku. Kamu simpan 4 buku. Tinggal berapa buku?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 6, b: 4, emoji: "📘" }),
  q("rt-sub-cups-5-5", "real", { en: "There are 5 cups. You put away all 5 cups.\nHow many cups are left?", ms: "Ada 5 cawan. Kamu simpan semua 5 cawan.\nTinggal berapa cawan?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "🥤" }),
  q("rt-sub-flowers-4-2", "real", { en: "There are 4 flowers. You pick 2 flowers. How many flowers are left?", ms: "Ada 4 bunga. Kamu petik 2 bunga. Tinggal berapa bunga?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 4, b: 2, emoji: "🌸" }),
  q("rt-sub-eggs-3-0", "real", { en: "There are 3 eggs. You take away 0 eggs. How many eggs are left?", ms: "Ada 3 telur. Kamu ambil 0 telur. Tinggal berapa telur?" }, [0, 2, 3, 4], 3, { kind: "subtract", a: 3, b: 0, emoji: "🥚" }),
  q("rt-sub-toys-2-1", "real", { en: "There are 2 toy cars. You move 1 toy car away. How many toy cars are left?", ms: "Ada 2 kereta mainan. Kamu pindah 1 kereta mainan. Tinggal berapa kereta mainan?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 2, b: 1, emoji: "🚗" }),
];

function q(
  id: string,
  area: Question["area"],
  text: Record<Lang, string>,
  options: Array<number | string>,
  answer: number | string,
  visual: Visual,
  inputMode: Question["inputMode"] = "choice",
  method?: Record<Lang, string[]>,
): Question {
  const objectValueMethod =
    inputMode === "tapObjects" && typeof answer === "number" && answer > 0
      ? {
        en: [
          `The number ${answer} shows how many.`,
          `Count the bananas: ${Array.from({ length: answer }, (_, index) => index + 1).join(", ")}.`,
          answer === 1 ? "So, there is 1 banana." : `So, there are ${answer} bananas.`,
        ],
        ms: [
          `Nombor ${answer} tunjuk berapa banyak.`,
          `Kira pisang: ${Array.from({ length: answer }, (_, index) => index + 1).join(", ")}.`,
          `Jadi, ada ${answer} pisang.`,
        ],
      }
      : null;
  return {
    id,
    area,
    text,
    options,
    answer,
    visual,
    inputMode,
    method: method ?? objectValueMethod ?? buildMethod(visual, answer),
  };
}

function buildMethod(visual: Visual, answer: number | string): Record<Lang, string[]> {
  if (visual.kind === "verticalSubtract") {
    const result = visual.a - visual.b;
    return {
      en: [`Subtract the ones, borrowing a ten when needed.`, `Then subtract the tens.`, `Answer: ${result}.`],
      ms: [`Tolak sa dan pinjam satu puluh jika perlu.`, `Kemudian tolak puluh.`, `Jawapan: ${result}.`],
    };
  }
  if (visual.kind === "horizontalAdd" || visual.kind === "verticalAdd") {
    const total = visual.a + visual.b;
    const ones = total % 10;
    return {
      en: visual.kind === "verticalAdd"
        ? [`Add the ones: ${visual.a} + ${visual.b} = ${total}.`, `Carry 1 ten and write ${ones} in the ones column.`, `Answer: ${total}.`]
        : [`Start with ${visual.a}.`, `Count on ${visual.b}: ${countForwardSteps(visual.a, visual.b)}.`, `Answer: ${visual.a} + ${visual.b} = ${total}.`],
      ms: visual.kind === "verticalAdd"
        ? [`Tambah sa: ${visual.a} + ${visual.b} = ${total}.`, `Bawa 1 puluh dan tulis ${ones} di lajur sa.`, `Jawapan: ${total}.`]
        : [`Mula dengan ${visual.a}.`, `Kira naik ${visual.b}: ${countForwardSteps(visual.a, visual.b)}.`, `Jawapan: ${visual.a} + ${visual.b} = ${total}.`],
    };
  }
  if (visual.kind === "add") {
    if (typeof answer === "string") {
      return {
        en: ["The story puts more objects in.", "Answer: Adding."],
        ms: ["Cerita menambah lebih banyak objek.", "Jawapan: Tambah."],
      };
    }
    const total = visual.a + visual.b;
    const countOn = countForwardSteps(visual.a, visual.b);
    return {
      en: visual.b === 0
        ? [`Start with ${visual.a}.`, "Add nothing.", `Answer: ${total}.`]
        : [`Start with ${visual.a}.`, `Count on ${visual.b}: ${countOn}.`, `Answer: ${visual.a} + ${visual.b} = ${total}.`],
      ms: visual.b === 0
        ? [`Mula dengan ${visual.a}.`, "Tidak tambah apa-apa.", `Jawapan: ${total}.`]
        : [`Mula dengan ${visual.a}.`, `Kira naik ${visual.b}: ${countOn}.`, `Jawapan: ${visual.a} + ${visual.b} = ${total}.`],
    };
  }
  if (visual.kind === "subtract") {
    if (typeof answer === "string") {
      return {
        en: ["The story takes objects away.", "Answer: Taking away."],
        ms: ["Cerita mengambil objek.", "Jawapan: Tolak."],
      };
    }
    const left = visual.a - visual.b;
    const item = objectName(visual.emoji, left, "en");
    const itemMs = objectName(visual.emoji, left, "ms");
    const be = left === 1 ? "is" : "are";
    return {
      en: visual.b === 0
        ? [`Start with ${visual.a}.`, "Take away 0.", `Count what is left.`, `${left} ${item} ${be} left.`, `So, ${visual.a} - ${visual.b} = ${left}.`]
        : [`Start with ${visual.a}.`, `Cross out ${visual.b}.`, `Count what is left.`, `${left} ${item} ${be} left.`, `So, ${visual.a} - ${visual.b} = ${left}.`],
      ms: visual.b === 0
        ? [`Mula dengan ${visual.a}.`, "Ambil 0.", `Kira yang tinggal.`, `${left} ${itemMs} tinggal.`, `Jadi, ${visual.a} - ${visual.b} = ${left}.`]
        : [`Mula dengan ${visual.a}.`, `Pangkah ${visual.b}.`, `Kira yang tinggal.`, `${left} ${itemMs} tinggal.`, `Jadi, ${visual.a} - ${visual.b} = ${left}.`],
    };
  }
  if (visual.kind === "compare") {
    const greater = Math.max(visual.a, visual.b);
    const smaller = Math.min(visual.a, visual.b);
    const asksForSmaller = Number(answer) === smaller;
    return asksForSmaller
      ? {
        en: [`${smaller} is less than ${greater}.`],
        ms: [`${smaller} lebih kecil daripada ${greater}.`],
      }
      : {
        en: [`${greater} is more than ${smaller}.`],
        ms: [`${greater} lebih besar daripada ${smaller}.`],
      };
  }
  if (visual.kind === "sequence") {
    const answerNumber = Number(answer);
    const previous = answerNumber > 0 ? answerNumber - 1 : null;
    const next = answerNumber < 9 ? answerNumber + 1 : null;
    return {
      en: [
        previous === null ? "" : `${answerNumber} is after ${previous}.`,
        next === null ? "" : `${answerNumber} is before ${next}.`,
      ].filter(Boolean),
      ms: [
        previous === null ? "" : `${answerNumber} selepas ${previous}.`,
        next === null ? "" : `${answerNumber} sebelum ${next}.`,
      ].filter(Boolean),
    };
  }
  if (visual.kind === "number") {
    const word = WORDS.en[visual.value];
    const wordMs = WORDS.ms[visual.value];
    return {
      en: typeof answer === "string"
        ? [`This symbol is ${visual.value}.`, `The word for ${visual.value} is ${word}.`]
        : [`This symbol is ${visual.value}.`, `Say ${word}.`],
      ms: typeof answer === "string"
        ? [`Simbol ini ialah ${visual.value}.`, `Perkataan bagi ${visual.value} ialah ${wordMs}.`]
        : [`Simbol ini ialah ${visual.value}.`, `Sebut ${wordMs}.`],
    };
  }
  if (visual.kind === "word") {
    const word = WORDS.en[visual.value];
    const wordMs = WORDS.ms[visual.value];
    const spelledWord = word.split("").join(" - ");
    const spelledWordMs = wordMs.split("").join(" - ");
    return {
      en: [`Read the letters: ${spelledWord}.`, `This word says ${word}.`, `The number symbol for ${word} is ${visual.value}.`],
      ms: [`Baca huruf: ${spelledWordMs}.`, `Perkataan ini dibaca ${wordMs}.`, `Simbol nombor ${wordMs} ialah ${visual.value}.`],
    };
  }
  if (visual.kind === "audioNumber") {
    const word = numberWordFor(visual.value, "en");
    const wordMs = numberWordFor(visual.value, "ms");
    const spelledWord = word.split("").join(" - ");
    const spelledWordMs = wordMs.split("").join(" - ");
    const namedWord = word.charAt(0).toUpperCase() + word.slice(1);
    const namedWordMs = wordMs.charAt(0).toUpperCase() + wordMs.slice(1);
    return {
      en: [`The audio says ${word}.`, `"${namedWord}" is spelled ${spelledWord}.`, `The symbol for ${word} is ${visual.value}.`],
      ms: [`Audio menyebut ${wordMs}.`, `"${namedWordMs}" dieja ${spelledWordMs}.`, `Simbol bagi ${wordMs} ialah ${visual.value}.`],
    };
  }
  if (visual.kind === "numberWithGroup") {
    return {
      en: [`This is ${visual.value} ${objectName(visual.emoji, visual.value, "en")}.`, `Count the ${objectName(visual.emoji, visual.value, "en")}.`, `So, there are ${visual.value} ${objectName(visual.emoji, visual.value, "en")}.`],
      ms: [`Ini ${visual.value} ${objectName(visual.emoji, visual.value, "ms")}.`, `Kira ${objectName(visual.emoji, visual.value, "ms")}.`, `Jadi, ada ${visual.value} ${objectName(visual.emoji, visual.value, "ms")}.`],
    };
  }
  if (visual.kind === "sameValue") {
    return {
      en: [`Group 1 has ${visual.count} ${objectName(visual.emojis[0], visual.count, "en")}.`, `Group 2 has ${visual.count} ${objectName(visual.emojis[1], visual.count, "en")}.`, "Different objects. Same number."],
      ms: [`Kumpulan 1 ada ${visual.count} ${objectName(visual.emojis[0], visual.count, "ms")}.`, `Kumpulan 2 ada ${visual.count} ${objectName(visual.emojis[1], visual.count, "ms")}.`, "Objek berbeza. Nombor sama."],
    };
  }
  if (visual.kind === "layoutValue") {
    return {
      en: [`Each group has ${visual.count} ${objectName(visual.emoji, visual.count, "en")}.`, "They look different.", `They all show ${visual.count} ${objectName(visual.emoji, visual.count, "en")}.`],
      ms: [`Setiap kumpulan ada ${visual.count} ${objectName(visual.emoji, visual.count, "ms")}.`, "Rupa berbeza.", `Semua tunjuk ${visual.count} ${objectName(visual.emoji, visual.count, "ms")}.`],
    };
  }
  if (visual.kind === "compareGroups") {
    const more = Math.max(visual.a, visual.b);
    const fewer = Math.min(visual.a, visual.b);
    const moreGroup = visual.a > visual.b ? "Group A" : "Group B";
    const fewerGroup = visual.a < visual.b ? "Group A" : "Group B";
    const moreGroupMs = visual.a > visual.b ? "Kumpulan A" : "Kumpulan B";
    const fewerGroupMs = visual.a < visual.b ? "Kumpulan A" : "Kumpulan B";
    const moreEmoji = visual.a > visual.b ? visual.emojiA : visual.emojiB;
    const fewerEmoji = visual.a < visual.b ? visual.emojiA : visual.emojiB;
    return visual.ask === "more"
      ? {
        en: ["Count Group A.", "Count Group B.", `Group A has ${visual.a} ${objectName(visual.emojiA, visual.a, "en")}. Group B has ${visual.b} ${objectName(visual.emojiB, visual.b, "en")}.`, `${more} ${objectName(moreEmoji, more, "en")} is more than ${fewer} ${objectName(fewerEmoji, fewer, "en")}.`, `${moreGroup} has more ${objectName(moreEmoji, more, "en")} than ${fewerGroup}.`],
        ms: ["Kira Kumpulan A.", "Kira Kumpulan B.", `Kumpulan A ada ${visual.a} ${objectName(visual.emojiA, visual.a, "ms")}. Kumpulan B ada ${visual.b} ${objectName(visual.emojiB, visual.b, "ms")}.`, `${more} ${objectName(moreEmoji, more, "ms")} lebih banyak daripada ${fewer} ${objectName(fewerEmoji, fewer, "ms")}.`, `${moreGroupMs} mempunyai lebih banyak ${objectName(moreEmoji, more, "ms")} daripada ${fewerGroupMs}.`],
      }
      : {
        en: ["Count Group A.", "Count Group B.", `Group A has ${visual.a} ${objectName(visual.emojiA, visual.a, "en")}. Group B has ${visual.b} ${objectName(visual.emojiB, visual.b, "en")}.`, `${fewer} is less.`],
        ms: ["Kira Kumpulan A.", "Kira Kumpulan B.", `Kumpulan A ada ${visual.a} ${objectName(visual.emojiA, visual.a, "ms")}. Kumpulan B ada ${visual.b} ${objectName(visual.emojiB, visual.b, "ms")}.`, `${fewer} lebih sedikit.`],
      };
  }
  if (visual.kind === "groupChoices") {
    return {
      en: ["Count each banana group.", `Find the group with ${answer} ${objectName(visual.emoji, Number(answer), "en")}.`],
      ms: ["Kira setiap kumpulan pisang.", `Cari kumpulan dengan ${answer} ${objectName(visual.emoji, Number(answer), "ms")}.`],
    };
  }
  if (visual.kind === "groupObserve" || visual.kind === "groupMake") {
    const count = visual.count;
    return {
      en: [`Count the ${objectName(visual.emoji, count, "en")}.`, `This group has ${count} ${objectName(visual.emoji, count, "en")}.`],
      ms: [`Kira ${objectName(visual.emoji, count, "ms")}.`, `Kumpulan ini ada ${count} ${objectName(visual.emoji, count, "ms")}.`],
    };
  }
  if (visual.kind === "groupBuildMany") {
    const englishGroups = visual.counts.map((count, index) => `Group ${index + 1} has ${count} ${objectName(visual.emoji, count, "en")}.`);
    const malayGroups = visual.counts.map((count, index) => `Kumpulan ${index + 1} ada ${count} ${objectName(visual.emoji, count, "ms")}.`);
    return {
      en: ["Keep every group separate.", ...englishGroups],
      ms: ["Pastikan setiap kumpulan berasingan.", ...malayGroups],
    };
  }
  if (visual.kind === "groupTwo") {
    return {
      en: [`Group 1 has ${visual.a} ${objectName(visual.emoji, visual.a, "en")}.`, `Group 2 has ${visual.b} ${objectName(visual.emoji, visual.b, "en")}.`, "Keep the groups apart."],
      ms: [`Kumpulan 1 ada ${visual.a} ${objectName(visual.emoji, visual.a, "ms")}.`, `Kumpulan 2 ada ${visual.b} ${objectName(visual.emoji, visual.b, "ms")}.`, "Asingkan kumpulan."],
    };
  }
  if (visual.kind === "groupCompare") {
    if (visual.ask === "same") {
      const same = visual.a === visual.b;
      return {
        en: same ? [`Both groups have ${visual.a} ${objectName(visual.emoji, visual.a, "en")}.`, "They are the same."] : [`One group has ${visual.a} ${objectName(visual.emoji, visual.a, "en")}.`, `One group has ${visual.b} ${objectName(visual.emoji, visual.b, "en")}.`, "They are different."],
        ms: same ? [`Kedua-dua kumpulan ada ${visual.a} ${objectName(visual.emoji, visual.a, "ms")}.`, "Mereka sama."] : [`Satu kumpulan ada ${visual.a} ${objectName(visual.emoji, visual.a, "ms")}.`, `Satu kumpulan ada ${visual.b} ${objectName(visual.emoji, visual.b, "ms")}.`, "Mereka berbeza."],
      };
    }
    const more = visual.a > visual.b ? "Group A" : "Group B";
    const fewer = visual.a < visual.b ? "Group A" : "Group B";
    const moreMs = visual.a > visual.b ? "Kumpulan A" : "Kumpulan B";
    const fewerMs = visual.a < visual.b ? "Kumpulan A" : "Kumpulan B";
    const largerCount = Math.max(visual.a, visual.b);
    const smallerCount = Math.min(visual.a, visual.b);
    return visual.ask === "more"
      ? {
        en: [`Group A has ${visual.a} ${objectName(visual.emoji, visual.a, "en")}.`, `Group B has ${visual.b} ${objectName(visual.emoji, visual.b, "en")}.`, `${largerCount} bananas is more than ${smallerCount} bananas.`, `${more} has more bananas than ${fewer}.`],
        ms: [`Kumpulan A ada ${visual.a} ${objectName(visual.emoji, visual.a, "ms")}.`, `Kumpulan B ada ${visual.b} ${objectName(visual.emoji, visual.b, "ms")}.`, `${largerCount} pisang lebih banyak daripada ${smallerCount} pisang.`, `${moreMs} mempunyai lebih banyak pisang daripada ${fewerMs}.`],
      }
      : {
        en: [`Group A has ${visual.a} ${objectName(visual.emoji, visual.a, "en")}.`, `Group B has ${visual.b} ${objectName(visual.emoji, visual.b, "en")}.`, `${fewer} has fewer.`],
        ms: [`Kumpulan A ada ${visual.a} ${objectName(visual.emoji, visual.a, "ms")}.`, `Kumpulan B ada ${visual.b} ${objectName(visual.emoji, visual.b, "ms")}.`, `${fewer} lebih sedikit.`],
      };
  }
  if (visual.kind === "groupCombine") {
    const total = visual.a + visual.b;
    return {
      en: [`Group 1 has ${visual.a} ${objectName(visual.emoji, visual.a, "en")}.`, `Group 2 has ${visual.b} ${objectName(visual.emoji, visual.b, "en")}.`, "Put them together.", `${visual.a} ${objectName(visual.emoji, visual.a, "en")} + ${visual.b} ${objectName(visual.emoji, visual.b, "en")} = ${total} ${objectName(visual.emoji, total, "en")}.`],
      ms: [`Kumpulan 1 ada ${visual.a} ${objectName(visual.emoji, visual.a, "ms")}.`, `Kumpulan 2 ada ${visual.b} ${objectName(visual.emoji, visual.b, "ms")}.`, "Gabungkan.", `${visual.a} ${objectName(visual.emoji, visual.a, "ms")} + ${visual.b} ${objectName(visual.emoji, visual.b, "ms")} = ${total} ${objectName(visual.emoji, total, "ms")}.`],
    };
  }
  if (visual.kind === "order") {
    return visual.direction === "asc"
      ? {
        en: ["Ascending is small to big.", "Start with the smallest.", `Answer: ${answer}.`],
        ms: ["Menaik maksudnya nombor naik, kecil ke besar.", "Letak nombor paling kecil dahulu.", `Jawapan: ${answer}.`],
      }
      : {
        en: ["Descending is big to small.", "Start with the biggest.", `Answer: ${answer}.`],
        ms: ["Menurun maksudnya nombor turun, besar ke kecil.", "Letak nombor paling besar dahulu.", `Jawapan: ${answer}.`],
      };
  }
  if (visual.kind === "symbol") {
    const symbol = visual.a > visual.b ? ">" : "<";
    const greater = visual.a > visual.b;
    return {
      en: [greater ? `${visual.b} is less. ${visual.a} is more.` : `${visual.a} is less. ${visual.b} is more.`, `So, ${visual.a} ${symbol} ${visual.b}.`],
      ms: [greater ? `${visual.a} lebih banyak daripada ${visual.b}.` : `${visual.a} lebih sedikit daripada ${visual.b}.`, `Jadi, ${visual.a} ${symbol} ${visual.b}.`],
    };
  }
  if (visual.kind === "teenBundle") {
    return teenNumberMethod((visual.tens * 10) + visual.ones);
  }
  if (visual.kind === "teenQuantityArrangement") {
    return {
      en: [`The arrangement changed, but the group still has ${visual.count}.`, `Answer: ${answer}.`],
      ms: [`Susunan berubah, tetapi kumpulan masih ada ${visual.count}.`, `Jawapan: ${answer}.`],
    };
  }
  if (visual.kind === "advancedCompareTest") {
    return {
      en: [`Compare ${visual.a} and ${visual.b}.`, `Answer: ${answer}.`],
      ms: [`Bandingkan ${visual.a} dan ${visual.b}.`, `Jawapan: ${answer}.`],
    };
  }
  if (visual.kind === "horizontalSubtract") {
    return {
      en: [`Take ${visual.b} away from ${visual.a}.`, `${visual.a} minus ${visual.b} equals ${answer}.`, `Answer: ${answer}.`],
      ms: [`Tolak ${visual.b} daripada ${visual.a}.`, `${visual.a} tolak ${visual.b} sama dengan ${answer}.`, `Jawapan: ${answer}.`],
    };
  }
  return {
    en: ["Press the button to count the whole group.", `The last number you say is ${visual.count}.`, `Answer: ${answer}.`],
    ms: ["Tekan butang untuk mengira seluruh kumpulan.", `Nombor terakhir yang disebut ialah ${visual.count}.`, `Jawapan: ${answer}.`],
  };
}

function countForwardSteps(start: number, amount: number) {
  return Array.from({ length: amount }, (_, i) => start + i + 1).join(", ");
}

function objectName(emoji: string | undefined, count: number, lang: Lang) {
  const names: Record<string, { en: [string, string]; ms: string }> = {
    "\u{1F353}": { en: ["strawberry", "strawberries"], ms: "strawberi" },
    "\u{1F34B}": { en: ["lemon", "lemons"], ms: "lemon" },
    "\u{1F34D}": { en: ["pineapple", "pineapples"], ms: "nanas" },
    "\u{1F95D}": { en: ["kiwi slice", "kiwi slices"], ms: "potong kiwi" },
    "🍌": { en: ["banana", "bananas"], ms: "pisang" },
    "🍎": { en: ["apple", "apples"], ms: "epal" },
    "🍊": { en: ["orange", "oranges"], ms: "oren" },
    "🥭": { en: ["mango", "mangoes"], ms: "mangga" },
    "🥥": { en: ["coconut", "coconuts"], ms: "kelapa" },
    "🍃": { en: ["leaf", "leaves"], ms: "daun" },
    "🦋": { en: ["butterfly", "butterflies"], ms: "rama-rama" },
    "🌸": { en: ["flower", "flowers"], ms: "bunga" },
    "⭐": { en: ["star", "stars"], ms: "bintang" },
    "🍄": { en: ["mushroom", "mushrooms"], ms: "cendawan" },
    "🪨": { en: ["rock", "rocks"], ms: "batu" },
    "🌳": { en: ["tree", "trees"], ms: "pokok" },
    "🐦": { en: ["bird", "birds"], ms: "burung" },
    "🍪": { en: ["cookie", "cookies"], ms: "biskut" },
    "📘": { en: ["book", "books"], ms: "buku" },
    "🎈": { en: ["balloon", "balloons"], ms: "belon" },
    "✏️": { en: ["pencil", "pencils"], ms: "pensel" },
    "🥤": { en: ["cup", "cups"], ms: "cawan" },
    "🥚": { en: ["egg", "eggs"], ms: "telur" },
    "🚗": { en: ["toy car", "toy cars"], ms: "kereta mainan" },
    "🐚": { en: ["shell", "shells"], ms: "cangkerang" },
  };
  const fallback = { en: ["object", "objects"] as [string, string], ms: "objek" };
  const name = names[emoji ?? ""] ?? fallback;
  return lang === "ms" ? name.ms : count === 1 ? name.en[0] : name.en[1];
}

function teenNumberMethod(value: number): Record<Lang, string[]> {
  if (value === 20) {
    return {
      en: ["One group has 10 bananas.", "Two groups of ten make 20.", "So, the number is 20."],
      ms: ["Satu kumpulan ada 10 pisang.", "Dua kumpulan sepuluh jadi 20.", "Jadi, nombor itu ialah 20."],
    };
  }
  const ones = value - 10;
  return {
    en: [
      "Start with one group of ten.",
      ones === 0 ? "There are no loose bananas." : `Count on ${ones} more banana${ones === 1 ? "" : "s"}.`,
      `Ten and ${ones} more makes ${value}.`,
    ],
    ms: [
      "Mula dengan satu kumpulan sepuluh.",
      ones === 0 ? "Tiada pisang berasingan." : `Kira ${ones} pisang lagi.`,
      `Sepuluh dan ${ones} lagi jadi ${value}.`,
    ],
  };
}

function teenRecognitionPracticeMethod(value: number): Record<Lang, string[]> {
  const wordEn = numberWordFor(value, "en");
  const wordMs = numberWordFor(value, "ms");
  return {
    en: [
      `The number word is ${wordEn}.`,
      `${wordEn.charAt(0).toUpperCase() + wordEn.slice(1)} is written as ${value}.`,
    ],
    ms: [
      `Perkataan nombor ialah ${wordMs}.`,
      `${wordMs.charAt(0).toUpperCase() + wordMs.slice(1)} ditulis sebagai ${value}.`,
    ],
  };
}

function teenCountPracticeMethod(value: number, emoji: string): Record<Lang, string[]> {
  const countSequence = Array.from({ length: value }, (_, index) => index + 1).join(", ");
  return {
    en: [
      `Count each ${objectName(emoji, 1, "en")} once: ${countSequence}.`,
    ],
    ms: [
      `Kira setiap ${objectName(emoji, 1, "ms")} sekali: ${countSequence}.`,
    ],
  };
}

const teenPracticeQuestions: Question[] = [
  q(
    "adv-teen-rec-audio-number-11",
    "advanced",
    { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." },
    [10, 11, 12, 13],
    11,
    { kind: "audioNumber", value: 11 },
    "choice",
    teenRecognitionPracticeMethod(11),
  ),
  q(
    "adv-teen-rec-number-word-14",
    "advanced",
    { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" },
    ["twelve", "thirteen", "fourteen", "fifteen"],
    "fourteen",
    { kind: "number", value: 14 },
    "choice",
    teenRecognitionPracticeMethod(14),
  ),
  q(
    "adv-teen-rec-word-number-20",
    "advanced",
    { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" },
    [17, 18, 19, 20],
    20,
    { kind: "word", value: 20 },
    "choice",
    teenRecognitionPracticeMethod(20),
  ),
  q(
    "adv-teen-rec-audio-word-18",
    "advanced",
    { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" },
    ["sixteen", "seventeen", "eighteen", "nineteen"],
    "eighteen",
    { kind: "audioNumber", value: 18 },
    "choice",
    teenRecognitionPracticeMethod(18),
  ),
  q(
    "adv-teen-rec-audio-word-10",
    "advanced",
    { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" },
    ["ten", "eleven", "twelve", "thirteen"],
    "ten",
    { kind: "audioNumber", value: 10 },
    "choice",
    teenRecognitionPracticeMethod(10),
  ),
  q(
    "adv-teen-rec-number-word-12",
    "advanced",
    { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" },
    ["ten", "eleven", "twelve", "thirteen"],
    "twelve",
    { kind: "number", value: 12 },
    "choice",
    teenRecognitionPracticeMethod(12),
  ),
  q(
    "adv-teen-rec-word-number-13",
    "advanced",
    { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" },
    [11, 12, 13, 14],
    13,
    { kind: "word", value: 13 },
    "choice",
    teenRecognitionPracticeMethod(13),
  ),
  q(
    "adv-teen-rec-audio-number-15",
    "advanced",
    { en: "Listen. Choose the number.", ms: "Dengar. Pilih nombor." },
    [14, 15, 16, 17],
    15,
    { kind: "audioNumber", value: 15 },
    "choice",
    teenRecognitionPracticeMethod(15),
  ),
  q(
    "adv-teen-rec-number-word-16",
    "advanced",
    { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" },
    ["fourteen", "fifteen", "sixteen", "seventeen"],
    "sixteen",
    { kind: "number", value: 16 },
    "choice",
    teenRecognitionPracticeMethod(16),
  ),
  q(
    "adv-teen-rec-word-number-17",
    "advanced",
    { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" },
    [15, 16, 17, 18],
    17,
    { kind: "word", value: 17 },
    "choice",
    teenRecognitionPracticeMethod(17),
  ),
  q(
    "adv-teen-rec-audio-word-19",
    "advanced",
    { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" },
    ["seventeen", "eighteen", "nineteen", "twenty"],
    "nineteen",
    { kind: "audioNumber", value: 19 },
    "choice",
    teenRecognitionPracticeMethod(19),
  ),
  q(
    "adv-teen-value-count-10",
    "advanced",
    { en: "How many trees are there?", ms: "Ada berapa pokok?" },
    [10, 11, 12, 13],
    10,
    { kind: "count", emoji: "🌳", count: 10 },
    "choice",
    teenCountPracticeMethod(10, "🌳"),
  ),
  q(
    "adv-teen-value-count-13",
    "advanced",
    { en: "How many mushrooms are there?", ms: "Ada berapa cendawan?" },
    [11, 12, 13, 14],
    13,
    { kind: "count", emoji: "🍄", count: 13 },
    "choice",
    teenCountPracticeMethod(13, "🍄"),
  ),
  q(
    "adv-teen-value-count-16",
    "advanced",
    { en: "How many mangoes are there?", ms: "Ada berapa mangga?" },
    [14, 15, 16, 17],
    16,
    { kind: "count", emoji: "🥭", count: 16 },
    "choice",
    teenCountPracticeMethod(16, "🥭"),
  ),
  q(
    "adv-teen-value-count-19",
    "advanced",
    { en: "How many books are there?", ms: "Ada berapa buku?" },
    [17, 18, 19, 20],
    19,
    { kind: "count", emoji: "📘", count: 19 },
    "choice",
    teenCountPracticeMethod(19, "📘"),
  ),
];

const advancedAdditionPart1Questions: Question[] = [
  q("adv-add-1-visual-8-4", "advanced", { en: "Count both banana rows. What is 8 + 4?", ms: "Kira kedua-dua baris pisang. Berapakah 8 + 4?" }, [10, 11, 12, 13], 12, { kind: "horizontalAdd", a: 8, b: 4, display: "objects", showLabels: false }),
  q("adv-add-1-visual-7-8", "advanced", { en: "Put the two banana rows together. What is 7 + 8?", ms: "Gabungkan dua baris pisang. Berapakah 7 + 8?" }, [13, 14, 15, 16], 15, { kind: "horizontalAdd", a: 7, b: 8, display: "objects", showLabels: false }),
  q("adv-add-1-visual-9-6", "advanced", { en: "Count on from 9 as 6 more bananas join. What is the total?", ms: "Kira sambung daripada 9 apabila 6 pisang lagi bergabung. Berapakah jumlahnya?" }, [13, 14, 15, 16], 15, { kind: "horizontalAdd", a: 9, b: 6, display: "objects", showLabels: false }),
  q("adv-add-1-build-6-6", "advanced", { en: "Build the whole row for 6 + 6, then check it.", ms: "Bina seluruh baris untuk 6 + 6, kemudian semak." }, [], 12, { kind: "horizontalAdd", a: 6, b: 6, display: "objects", showLabels: false }, "buildTotal"),
  q("adv-add-1-visual-8-9", "advanced", { en: "Count both banana rows. What is 8 + 9?", ms: "Kira kedua-dua baris pisang. Berapakah 8 + 9?" }, [15, 16, 17, 18], 17, { kind: "horizontalAdd", a: 8, b: 9, display: "objects", showLabels: false }),
  q("adv-add-1-visual-6-7", "advanced", { en: "Put the two banana rows together. What is 6 + 7?", ms: "Gabungkan dua baris pisang. Berapakah 6 + 7?" }, [11, 12, 13, 14], 13, { kind: "horizontalAdd", a: 6, b: 7, display: "objects", showLabels: false }),
  q("adv-add-1-build-9-8", "advanced", { en: "Build the whole row for 9 + 8, then check it.", ms: "Bina seluruh baris untuk 9 + 8, kemudian semak." }, [], 17, { kind: "horizontalAdd", a: 9, b: 8, display: "objects", showLabels: false }, "buildTotal"),
  q("adv-add-1-visual-11-7", "advanced", { en: "Count both banana rows. What is 11 + 7?", ms: "Kira kedua-dua baris pisang. Berapakah 11 + 7?" }, [16, 17, 18, 19], 18, { kind: "horizontalAdd", a: 11, b: 7, display: "objects", showLabels: false }),
];

const advancedAdditionPart2Questions: Question[] = [
  q("adv-add-2-carry-8-7", "advanced", { en: "Carry the ten to solve 8 + 7.", ms: "Bawa puluh untuk selesaikan 8 + 7." }, [], 15, { kind: "verticalAdd", a: 8, b: 7 }, "carryBuild"),
  q("adv-add-2-choice-9-4", "advanced", { en: "Add in vertical form.", ms: "Tambah dalam bentuk menegak." }, [11, 12, 13, 14], 13, { kind: "verticalAdd", a: 9, b: 4 }),
  q("adv-add-2-carry-4-6", "advanced", { en: "The ones make exactly 10. Do the carry.", ms: "Sa menjadi tepat 10. Buat bawa puluh." }, [], 10, { kind: "verticalAdd", a: 4, b: 6 }, "carryBuild"),
  q("adv-add-2-choice-9-8", "advanced", { en: "Add in vertical form.", ms: "Tambah dalam bentuk menegak." }, [15, 16, 17, 18], 17, { kind: "verticalAdd", a: 9, b: 8 }),
  q("adv-add-2-choice-9-9", "advanced", { en: "Add in vertical form.", ms: "Tambah dalam bentuk menegak." }, [16, 17, 18, 19], 18, { kind: "verticalAdd", a: 9, b: 9 }),
  q("adv-add-2-choice-8-5", "advanced", { en: "Add in vertical form.", ms: "Tambah dalam bentuk menegak." }, [11, 12, 13, 14], 13, { kind: "verticalAdd", a: 8, b: 5 }),
  q("adv-add-2-choice-9-6", "advanced", { en: "Add in vertical form.", ms: "Tambah dalam bentuk menegak." }, [13, 14, 15, 16], 15, { kind: "verticalAdd", a: 9, b: 6 }),
];

const advancedSubtractionQuestions: Question[] = advancedSubtractionQuestionData.map((question): Question => ({
  id: question.id,
  area: "advanced",
  text: question.text,
  options: question.options,
  answer: question.answer,
  visual: { kind: "verticalSubtract", a: question.a, b: question.b, borrowing: question.borrowing },
  inputMode: question.production ? "borrowSubtract" : "choice",
  method: question.method,
}));

function advancedTestQuestions(data: AdvancedTestQuestionData[]): Question[] {
  return data.map((question): Question => ({
    ...question,
    area: "advanced",
    visual: question.visual as Visual,
    inputMode: "choice",
  }));
}

const advancedTestTeenNumberQuestions = advancedTestQuestions(advancedTestTeenNumberData);
const advancedTestCompareBiggerQuestions = advancedTestQuestions(advancedTestCompareBiggerData);
const advancedTestSequencingQuestions = advancedTestQuestions(advancedTestSequencingData);
const advancedTestAdditionQuestions = advancedTestQuestions(advancedTestAdditionData);
const advancedTestSubtractionQuestions = advancedTestQuestions(advancedTestSubtractionData);

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffledQuestions(questions: Question[]): Question[] {
  return shuffled(questions).map((question) => ({
    ...question,
    options: shuffled(question.options),
  }));
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useDelayedTotalVisibility(shouldReveal: boolean, resetKey: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (!shouldReveal) return;
    let cancelled = false;
    let timer = 0;
    const waitForCountingToFinish = () => {
      if (cancelled) return;
      if (activeCountingRunId !== null) {
        timer = window.setTimeout(waitForCountingToFinish, 50);
        return;
      }
      const elapsedSinceCountFinished = lastCountingFinishedAt > 0 ? performance.now() - lastCountingFinishedAt : 0;
      const remainingDelay = lastCountingFinishedAt > 0
        ? Math.max(0, COUNT_TOTAL_REVEAL_DELAY_MS - elapsedSinceCountFinished)
        : COUNT_TOTAL_REVEAL_DELAY_MS;
      timer = window.setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, remainingDelay);
    };
    waitForCountingToFinish();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [resetKey, shouldReveal]);

  return visible;
}

function getReducedMotionPreference() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadState(): { lang: Lang; soundEnabled: boolean } {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { lang: parsed.lang === "ms" ? "ms" : "en", soundEnabled: parsed.numberSoundEnabled !== false };
  } catch {
    return { lang: "en", soundEnabled: true };
  }
}

function saveState(lang: Lang, soundEnabled: boolean) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ lang, soundEnabled, numberSoundEnabled: soundEnabled }));
  } catch {
    // Language and sound preferences simply reset if browser storage is unavailable.
  }
}

function App() {
  const initial = useMemo(() => loadState(), []);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [accessPin, setAccessPin] = useState<string | null>(null);
  const [availableSaves, setAvailableSaves] = useState<GameSaveSummary[]>([]);
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [lang, setLang] = useState<Lang>(initial.lang);
  const [player, setPlayer] = useState<Player | null>(null);
  const [screen, setScreen] = useState<Screen>("modeSelect");
  const [soundEnabled, setSoundEnabled] = useState(NUMBER_AUDIO_ENABLED && initial.soundEnabled);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [lastScore, setLastScore] = useState<{ correct: number; total: number; mastered: boolean } | null>(null);
  const [lastAdvancedTestScore, setLastAdvancedTestScore] = useState<AdvancedTestScore | null>(null);
  const [completedLesson, setCompletedLesson] = useState<LearningSectionKey | null>(null);

  useEffect(() => saveState(lang, soundEnabled), [lang, soundEnabled]);
  useEffect(() => {
    if (!accessPin || !activeSaveId || !player) return;
    setSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      void saveGameProgress(accessPin, activeSaveId, player, lang, soundEnabled)
        .then((saved) => {
          setAvailableSaves((current) => current.map((item) => item.id === saved.id ? {
            id: saved.id,
            fileName: saved.fileName,
            playerName: saved.playerName,
            stars: saved.stars,
            updatedAt: saved.updatedAt,
          } : item));
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [accessPin, activeSaveId, player, lang, soundEnabled]);
  useEffect(() => setGlobalAudioMuted(!soundEnabled), [soundEnabled]);
  useEffect(() => {
    if (NUMBER_AUDIO_ENABLED) preloadNumberAudioFiles();
  }, []);

  const t = UI[lang];
  const openGameSave = (save: GameSave) => {
    setPlayer(save.player);
    setLang(save.lang);
    setSoundEnabled(NUMBER_AUDIO_ENABLED && save.soundEnabled);
    setActiveSaveId(save.id);
    setScreen("modeSelect");
    setSaveStatus("saved");
  };

  if (!accessPin) {
    return (
      <PinGate
        lang={lang}
        onToggleLang={() => setLang((current) => (current === "en" ? "ms" : "en"))}
        onGranted={(pin, saves) => {
          setAccessPin(pin);
          setAvailableSaves(saves);
        }}
      />
    );
  }

  if (!activeSaveId || !player) {
    return (
      <GameFileScreen
        lang={lang}
        pin={accessPin}
        initialSaves={availableSaves}
        soundEnabled={soundEnabled}
        onToggleLang={() => setLang((current) => (current === "en" ? "ms" : "en"))}
        onOpen={openGameSave}
        onChangePin={() => {
          setAccessPin(null);
          setAvailableSaves([]);
        }}
      />
    );
  }

  const isCyberBackground = screen.startsWith("advanced") || Boolean(completedLesson?.startsWith("advanced"));
  const backgroundStyle = isCyberBackground ? CYBER_BACKGROUND_STYLE : DEFAULT_BACKGROUND_STYLE;
  const go = (next: Screen) => {
    setLastScore(null);
    setLastAdvancedTestScore(null);
    setCompletedLesson(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const finishTest = (key: string, correct: number, total: number) => {
    const mastered = correct >= Math.ceil(total * 0.7);
    setLastScore({ correct, total, mastered });
    awardStar(key, mastered ? 1 : 0);
    setScreen("testMenu");
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const finishAdvancedTest = (testId: AdvancedTestId, correct: number, total: number) => {
    const mastered = correct >= Math.ceil(total * 0.7);
    setLastAdvancedTestScore({ testId, correct, total, mastered });
    setPlayer((current) => {
      if (!current) return current;
      const masteryKey = advancedTestProgressKey(testId, "mastered");
      const alreadyMastered = (current.progress[masteryKey] ?? 0) >= 1;
      const earnedMastery = mastered || alreadyMastered;
      return {
        ...current,
        stars: current.stars + (mastered && !alreadyMastered ? 1 : 0),
        progress: {
          ...current.progress,
          [advancedTestProgressKey(testId, "score")]: correct,
          [advancedTestProgressKey(testId, "total")]: total,
          [masteryKey]: earnedMastery ? 1 : 0,
        },
      };
    });
    setScreen("advancedTestMenu");
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const awardStar = (key: string, amount = 1) => {
    setPlayer((current) => {
      if (!current) return current;
      const old = current.progress[key] ?? 0;
      const gained = Math.max(0, amount - old);
      return { ...current, stars: current.stars + gained, progress: { ...current.progress, [key]: Math.max(old, amount) } };
    });
  };

  const finishLesson = (progressKey: string, sectionKey: LearningSectionKey) => {
    setPlayer((current) => {
      if (!current) return current;
      const alreadyCompleted = (current.progress[progressKey] ?? 0) >= 1 || (current.progress[sectionKey] ?? 0) >= 1;
      return {
        ...current,
        stars: current.stars + (alreadyCompleted ? 0 : 1),
        progress: {
          ...current.progress,
          [progressKey]: 1,
          [sectionKey]: 1,
        },
      };
    });
    setCompletedLesson(sectionKey);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const leaveCurrentGame = () => {
    if (accessPin && activeSaveId && player) {
      void saveGameProgress(accessPin, activeSaveId, player, lang, soundEnabled)
        .then((saved) => {
          setAvailableSaves((current) => current.map((item) => item.id === saved.id ? {
            id: saved.id,
            fileName: saved.fileName,
            playerName: saved.playerName,
            stars: saved.stars,
            updatedAt: saved.updatedAt,
          } : item));
        })
        .catch(() => undefined);
    }
    setLastScore(null);
    setLastAdvancedTestScore(null);
    setCompletedLesson(null);
    setActiveSaveId(null);
    setPlayer(null);
  };

  return (
    <AudioEnabledContext.Provider value={soundEnabled}>
      <div
        className={`page-bg ${isCyberBackground ? "sunset-theme" : "learning-theme"} min-h-[100dvh] text-slate-800 font-sans overflow-x-hidden`}
        style={backgroundStyle}
        onPointerDownCapture={markAudioInteraction}
        onKeyDownCapture={markAudioInteraction}
      >
      <Decor />
      <div className="app-responsive-frame jungle-leaves relative z-10 min-h-[100dvh] mx-auto flex w-full max-w-6xl flex-col px-4 py-4 md:px-8">
        <Header
          lang={lang}
          onToggleLang={() => setLang((current) => (current === "en" ? "ms" : "en"))}
          title={screen === "home" ? "" : t.title}
          stars={player?.stars ?? 0}
          cyber={screen.startsWith("advanced")}
          t={t}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((current) => !current)}
          onOpenGlossary={() => setGlossaryOpen(true)}
          onBack={screen === "home" ? undefined : screen === "modeSelect" ? leaveCurrentGame : () => go(
            screen === "advancedTestMenu"
              ? "advancedMenu"
              : screen.startsWith("advancedTest")
                ? "advancedTestMenu"
                : screen === "advancedTeenNumbers" || screen === "advancedCompareBigger" || screen === "advancedSequencing" || screen === "advancedAdditionPart1" || screen === "advancedAdditionPart2" || screen === "advancedSubtraction"
              ? "advancedMenu"
              : screen === "advancedMenu"
                ? "modeSelect"
                : screen.startsWith("test") && screen !== "testMenu"
                  ? "testMenu"
                  : screen === "menu"
                    ? "modeSelect"
                    : "menu",
          )}
        />
        <div className="mb-2 flex justify-end px-1 text-xs font-black" aria-live="polite">
          <span className={saveStatus === "error" ? "text-red-600" : screen.startsWith("advanced") ? "text-amber-50" : "text-emerald-800"}>
            {saveStatus === "saving"
              ? (lang === "en" ? "Saving..." : "Menyimpan...")
              : saveStatus === "error"
                ? (lang === "en" ? "Progress could not be saved. Check your internet." : "Kemajuan tidak dapat disimpan. Semak internet.")
                : (lang === "en" ? "Progress saved" : "Kemajuan disimpan")}
          </span>
        </div>
        <GlossaryDialog lang={lang} open={glossaryOpen} onOpenChange={setGlossaryOpen} />

        {screen === "home" && (
          <HomeScreen lang={lang} t={t} player={player} setPlayer={setPlayer} go={go} />
        )}
        {screen === "modeSelect" && player && (
          <ModeSelectScreen lang={lang} t={t} player={player} go={go} />
        )}
        {screen === "menu" && player && (
          <MenuScreen lang={lang} t={t} player={player} go={go} />
        )}
        {screen === "advancedMenu" && player && (
          <AdvancedMenuScreen lang={lang} t={t} player={player} go={go} testingMode={accessPin === "000000"} />
        )}
        {completedLesson && (
          <LessonCompletionScreen
            lang={lang}
            sectionName={t[completedLesson]}
            cyber={completedLesson.startsWith("advanced")}
            onContinue={() => go(completedLesson.startsWith("advanced") ? "advancedMenu" : "menu")}
          />
        )}
        {!completedLesson && screen === "advancedTeenNumbers" && (
          <TeenNumbersLesson
            lang={lang}
            t={t}
            onDone={() => finishLesson("advancedTeenNumbers", "advancedTeenNumbers")}
          />
        )}
        {!completedLesson && screen === "advancedCompareBigger" && (
          <AdvancedCompareBiggerLesson
            lang={lang}
            t={t}
            onDone={() => finishLesson("advancedCompareBigger", "advancedCompareBigger")}
          />
        )}
        {!completedLesson && screen === "advancedSequencing" && (
          <AdvancedSequencingLesson
            lang={lang}
            t={t}
            onDone={() => finishLesson("advancedSequencing", "advancedSequencing")}
          />
        )}
        {!completedLesson && screen === "advancedAdditionPart1" && (
          <AdvancedAdditionPart1Lesson
            lang={lang}
            t={t}
            onDone={() => finishLesson("advancedAdditionPart1", "advancedAdditionPart1")}
          />
        )}
        {!completedLesson && screen === "advancedAdditionPart2" && (accessPin === "000000" || player?.progress.advancedAdditionPart1) && (
          <AdvancedAdditionPart2Lesson
            lang={lang}
            t={t}
            onDone={() => finishLesson("advancedAdditionPart2", "advancedAdditionPart2")}
          />
        )}
        {!completedLesson && screen === "advancedSubtraction" && (accessPin === "000000" || player?.progress.advancedAdditionPart2) && (
          <AdvancedSubtractionLesson
            lang={lang}
            t={t}
            onDone={() => finishLesson("advancedSubtraction", "advancedSubtraction")}
          />
        )}
        {screen === "advancedTestMenu" && player && (
          <AdvancedTestMenu
            lang={lang}
            t={t}
            player={player}
            go={go}
            lastScore={lastAdvancedTestScore}
            testingMode={accessPin === "000000"}
          />
        )}
        {screen === "advancedTestTeenNumbers" && (
          <Quiz lang={lang} t={t} title={lang === "en" ? "Advanced Test: Teen Numbers" : "Ujian Lanjutan: Nombor Belasan"} questions={advancedTestTeenNumberQuestions} chunkSize={5} variant="cyber" onFinish={(correct, total) => finishAdvancedTest("teenNumbers", correct, total)} />
        )}
        {screen === "advancedTestCompareBigger" && (
          <Quiz lang={lang} t={t} title={lang === "en" ? "Advanced Test: Compare Bigger" : "Ujian Lanjutan: Banding Nombor"} questions={advancedTestCompareBiggerQuestions} chunkSize={4} variant="cyber" onFinish={(correct, total) => finishAdvancedTest("compareBigger", correct, total)} />
        )}
        {screen === "advancedTestSequencing" && (
          <Quiz lang={lang} t={t} title={lang === "en" ? "Advanced Test: Sequencing" : "Ujian Lanjutan: Urutan"} questions={advancedTestSequencingQuestions} chunkSize={5} variant="cyber" onFinish={(correct, total) => finishAdvancedTest("sequencing", correct, total)} />
        )}
        {screen === "advancedTestAddition" && (
          <Quiz lang={lang} t={t} title={lang === "en" ? "Advanced Test: Addition" : "Ujian Lanjutan: Tambah"} questions={advancedTestAdditionQuestions} chunkSize={4} variant="cyber" onFinish={(correct, total) => finishAdvancedTest("addition", correct, total)} />
        )}
        {screen === "advancedTestSubtraction" && (
          <Quiz lang={lang} t={t} title={lang === "en" ? "Advanced Test: Subtraction" : "Ujian Lanjutan: Tolak"} questions={advancedTestSubtractionQuestions} chunkSize={4} variant="cyber" onFinish={(correct, total) => finishAdvancedTest("subtraction", correct, total)} />
        )}
        {!completedLesson && screen === "learnRecognize" && (
          <RecognizeNumbersLesson lang={lang} t={t} onDone={() => finishLesson("learnRecognize", "recognizeNumbers")} />
        )}
        {!completedLesson && screen === "learnValues" && (
          <NumberValuesLesson lang={lang} t={t} onDone={() => finishLesson("learnValues", "numberValues")} />
        )}
        {!completedLesson && screen === "learnSequencing" && (
          <SequencingLesson lang={lang} t={t} onDone={() => finishLesson("learnSequencing", "sequencing")} />
        )}
        {!completedLesson && screen === "groupingMode" && (
          <GroupingMode lang={lang} t={t} onDone={() => finishLesson("groupingMode", "groupingMode")} />
        )}
        {!completedLesson && screen === "learnAddition" && (
          <AdditionOnlyLesson lang={lang} t={t} onDone={() => finishLesson("learnAddition", "addition")} />
        )}
        {!completedLesson && screen === "learnSubtraction" && (
          <SubtractionOnlyLesson lang={lang} t={t} onDone={() => finishLesson("learnSubtraction", "subtraction")} />
        )}
        {!completedLesson && screen === "learnReal" && (
          <RealWorldLesson lang={lang} t={t} onDone={() => finishLesson("learnReal", "learnReal")} />
        )}
        {screen === "testMenu" && (
          <TestMenu lang={lang} t={t} player={player} go={go} />
        )}
        {screen === "testNumbers" && (
          <Quiz lang={lang} t={t} title={t.learnNumbers} questions={numberQuestions} chunkSize={6} onFinish={(correct, total) => finishTest("testNumbers", correct, total)} />
        )}
        {screen === "testOperations" && (
          <Quiz lang={lang} t={t} title={t.learnOperations} questions={operationQuestions} chunkSize={6} visualOnlyOperationSolutions onFinish={(correct, total) => finishTest("testOperations", correct, total)} />
        )}
        {screen === "testReal" && (
          <Quiz lang={lang} t={t} title={t.learnReal} questions={realTestQuestions} chunkSize={6} visualOnlyOperationSolutions onFinish={(correct, total) => finishTest("testReal", correct, total)} />
        )}

        {lastScore && screen === "testMenu" && (
          <div className="relative mx-auto mt-4 w-full max-w-xl overflow-hidden rounded-[2rem] border-4 border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-emerald-50 p-5 text-center shadow-[0_8px_0_#ca8a04,0_0_28px_rgba(250,204,21,.3)]">
            {lastScore.mastered && <CorrectCelebration />}
            <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border-4 border-yellow-200 bg-yellow-400 text-emerald-950 shadow-[0_5px_0_#a16207]"><Check className="h-9 w-9" strokeWidth={5} aria-hidden="true" /></span>
            <p className="text-2xl font-black text-emerald-800">{lang === "en" ? "Test complete — amazing work!" : "Ujian selesai — hebat sekali!"}</p>
            <p className="mt-1 text-lg font-black text-blue-900">{t.score}: {lastScore.correct}/{lastScore.total}</p>
            <p className="text-sm font-bold text-slate-500">
              {lastScore.mastered
                ? (lang === "en" ? "You did it! You earned a star." : "Kamu berjaya! Kamu dapat bintang.")
                : (lang === "en" ? "You completed it. Keep practicing with Chrys." : "Kamu sudah habiskan latihan. Terus berlatih dengan Chrys.")}
            </p>
          </div>
        )}
      </div>
      </div>
    </AudioEnabledContext.Provider>
  );
}

function PinGate({ lang, onToggleLang, onGranted }: {
  lang: Lang;
  onToggleLang: () => void;
  onGranted: (pin: string, saves: GameSaveSummary[]) => void;
}) {
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.length !== 6 || checking) return;
    setChecking(true);
    setError("");
    try {
      const saves = await listGameSaves(pin);
      onGranted(pin, saves);
    } catch (caught) {
      if (caught instanceof GameSaveApiError && caught.status === 401) {
        setPin("");
        setError(lang === "en"
          ? "That PIN is not recognized. Check all 6 digits and try again."
          : "PIN itu tidak dikenali. Semak kesemua 6 digit dan cuba lagi.");
      } else {
        setError(caught instanceof Error ? caught.message : "Could not check the PIN.");
      }
    } finally {
      setChecking(false);
    }
  };

  const copy = lang === "en"
    ? {
        eyebrow: "Private adventure",
        title: "Enter your access PIN",
        help: "Type the 6-digit PIN provided to you to open Chrys's Adventures.",
        label: "6-digit PIN",
        button: checking ? "Checking PIN..." : "Open the adventure",
        privacy: "For privacy, enter the PIN each time you open or refresh the app.",
        language: "BM",
        languageLabel: "Switch to Bahasa Melayu",
      }
    : {
        eyebrow: "Pengembaraan peribadi",
        title: "Masukkan PIN akses",
        help: "Taip PIN 6 digit yang diberikan kepada anda untuk membuka Pengembaraan Chrys.",
        label: "PIN 6 digit",
        button: checking ? "Sedang menyemak PIN..." : "Buka pengembaraan",
        privacy: "Untuk privasi, masukkan PIN setiap kali aplikasi dibuka atau dimuat semula.",
        language: "EN",
        languageLabel: "Switch to English",
      };

  return (
    <div className="page-bg min-h-[100dvh] overflow-x-hidden font-sans text-slate-800" style={DEFAULT_BACKGROUND_STYLE}>
      <div className="app-responsive-frame jungle-leaves relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 py-4 md:px-8">
        <header className="flex justify-end">
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={copy.languageLabel}
            className="rounded-2xl border-2 border-white/90 bg-white/90 px-4 py-2 text-sm font-black text-blue-900 shadow-[0_4px_0_rgba(0,0,0,.15)]"
          >
            {copy.language}
          </button>
        </header>
        <main className="grid flex-1 place-items-center py-6">
          <section className="lesson-panel w-full max-w-xl rounded-[2.25rem] p-5 text-center shadow-2xl md:p-9">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.75rem] border-4 border-yellow-300 bg-white shadow-[0_7px_0_#a86000]">
              <img src={chrysThinking} alt="Chrys reading" className="h-20 w-20 object-contain" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{copy.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-4xl">{copy.title}</h1>
            <p className="mx-auto mt-3 max-w-md text-base font-bold leading-relaxed text-slate-600 sm:text-lg">{copy.help}</p>

            <form onSubmit={(event) => void submit(event)} className="mx-auto mt-7 max-w-md">
              <label htmlFor="access-pin" className="block text-left text-base font-black text-blue-900">{copy.label}</label>
              <div className={`mt-2 flex min-h-24 items-center rounded-3xl border-4 bg-white px-5 transition-colors ${error ? "border-red-400" : "border-sky-200 focus-within:border-yellow-400"}`}>
                <KeyRound className="h-7 w-7 shrink-0 text-emerald-600" aria-hidden="true" />
                <input
                  id="access-pin"
                  name="access-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  maxLength={6}
                  autoFocus
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "access-pin-error access-pin-help" : "access-pin-help"}
                  className="min-w-0 flex-1 bg-transparent px-5 py-5 text-center text-3xl font-black tracking-[0.45em] text-blue-950 outline-none focus-visible:outline-none focus-visible:shadow-none placeholder:text-slate-300"
                  placeholder="••••••"
                />
                <span className="h-7 w-7 shrink-0" aria-hidden="true" />
              </div>
              <p id="access-pin-help" className="mt-3 text-sm font-bold text-slate-500">{copy.privacy}</p>
              {error && <p id="access-pin-error" role="alert" className="mt-3 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-black text-red-800">{error}</p>}
              <button
                type="submit"
                disabled={pin.length !== 6 || checking}
                className="mt-5 w-full rounded-3xl border-2 border-yellow-500 bg-yellow-400 px-6 py-4 text-xl font-black text-yellow-950 shadow-[0_7px_0_#a86000] transition disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-[0_4px_0_#94a3b8] enabled:active:translate-y-1"
              >
                {copy.button}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}

function LessonCompletionScreen({ lang, sectionName, onContinue, cyber = false }: {
  lang: Lang;
  sectionName: string;
  onContinue: () => void;
  cyber?: boolean;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center pb-8" aria-live="polite">
      <section className={`relative w-full overflow-hidden rounded-[2.5rem] border-4 p-6 text-center sm:p-10 ${cyber ? "border-yellow-300 bg-gradient-to-br from-slate-950 via-emerald-950 to-cyan-950 shadow-[0_12px_0_#083344,0_0_42px_rgba(250,204,21,.28)]" : "border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-emerald-50 shadow-[0_12px_0_rgba(161,98,7,.25),0_0_40px_rgba(250,204,21,.3)]"}`}>
        <CorrectCelebration playSound={false} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(250,204,21,.3),transparent_38%)]" aria-hidden="true" />
        <div className="relative">
          <span className={`mx-auto inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-black uppercase tracking-widest ${cyber ? "border-yellow-300 bg-yellow-300 text-slate-950" : "border-emerald-600 bg-emerald-600 text-white"}`}>
            <Sparkles className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
            {lang === "en" ? "Level complete" : "Tahap selesai"}
            <Sparkles className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          </span>
          <div className="mx-auto mt-6 grid w-fit grid-cols-[auto_auto] items-center justify-center gap-1">
            <span className={`relative z-10 grid h-28 w-28 place-items-center rounded-full border-8 shadow-[0_8px_0_#a16207,0_0_38px_rgba(250,204,21,.72)] ${cyber ? "border-yellow-200 bg-yellow-400 text-slate-950" : "border-yellow-200 bg-yellow-400 text-emerald-950"}`}>
              <Check className="h-16 w-16" strokeWidth={5} aria-hidden="true" />
              <Star className="absolute -right-5 -top-4 h-12 w-12 rotate-12 fill-orange-400 text-orange-600 drop-shadow-md" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <img src={chrysExcited} alt="Chrys celebrating" className="-ml-3 h-40 w-40 object-contain drop-shadow-2xl" />
          </div>
        </div>
        <h2 className={`relative mt-2 text-4xl font-black sm:text-6xl ${cyber ? "text-yellow-200" : "text-emerald-700"}`}>
          {lang === "en" ? "Congratulations!" : "Tahniah!"}
        </h2>
        <p className={`relative mx-auto mt-4 max-w-xl text-2xl font-black sm:text-3xl ${cyber ? "text-cyan-50" : "text-blue-950"}`}>
          {lang === "en"
            ? `You completed the ${sectionName} section!`
            : `Kamu sudah tamat bahagian ${sectionName}!`}
        </p>
        <div className={`relative mx-auto mt-6 flex w-fit items-center gap-3 rounded-2xl border-2 px-5 py-3 font-black shadow-[0_5px_0_rgba(5,150,105,.45)] ${cyber ? "border-emerald-300 bg-emerald-950 text-emerald-100" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-6 w-6" strokeWidth={4} aria-hidden="true" /></span>
          {lang === "en" ? "Completion saved — replay it anytime!" : "Kemajuan disimpan — main semula bila-bila masa!"}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className={`relative mt-8 rounded-2xl border-2 px-9 py-4 text-xl font-black shadow-[0_7px_0_#047857] transition hover:-translate-y-1 active:translate-y-1 active:shadow-none ${cyber ? "border-emerald-200 bg-emerald-500 text-slate-950" : "border-emerald-700 bg-emerald-500 text-white"}`}
        >
          {lang === "en" ? "Back to learning menu" : "Kembali ke menu belajar"}
        </button>
      </section>
    </main>
  );
}

function GameFileScreen({
  lang,
  pin,
  initialSaves,
  soundEnabled,
  onToggleLang,
  onOpen,
  onChangePin,
}: {
  lang: Lang;
  pin: string;
  initialSaves: GameSaveSummary[];
  soundEnabled: boolean;
  onToggleLang: () => void;
  onOpen: (save: GameSave) => void;
  onChangePin: () => void;
}) {
  const [saves, setSaves] = useState(initialSaves);
  const [createStep, setCreateStep] = useState<0 | 1 | 2>(0);
  const [fileName, setFileName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [busySaveId, setBusySaveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setSaves(initialSaves), [initialSaves]);

  const refreshSaves = useCallback(async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      setSaves(await listGameSaves(pin));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh the game files.");
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, [pin]);

  useEffect(() => {
    void refreshSaves(false);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshSaves(false);
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshSaves]);

  const copy = lang === "en"
    ? {
        eyebrow: "Your saved adventures",
        title: "Choose a game file",
        help: "Continue your own game, or begin a new one.",
        empty: "No games have been saved with this PIN yet.",
        continue: "Continue game",
        newGame: "Start a new game",
        fileLabel: "Name this game file",
        fileHelp: "Use a name you will recognize on another device.",
        playerLabel: "What is the player's name?",
        next: "Next: player name",
        create: "Create game",
        back: "Back",
        changePin: "Use a different PIN",
        stars: "stars",
        lastPlayed: "Last played",
        cloudHelp: "Every game saved with this PIN is available here on any connected device.",
        refresh: "Refresh games",
        refreshing: "Refreshing...",
        language: "BM",
      }
    : {
        eyebrow: "Pengembaraan tersimpan",
        title: "Pilih fail permainan",
        help: "Sambung permainan kamu atau mulakan permainan baharu.",
        empty: "Belum ada permainan yang disimpan dengan PIN ini.",
        continue: "Sambung permainan",
        newGame: "Mulakan permainan baharu",
        fileLabel: "Namakan fail permainan ini",
        fileHelp: "Gunakan nama yang mudah dikenal pada peranti lain.",
        playerLabel: "Siapakah nama pemain?",
        next: "Seterusnya: nama pemain",
        create: "Cipta permainan",
        back: "Kembali",
        changePin: "Gunakan PIN lain",
        stars: "bintang",
        lastPlayed: "Kali terakhir dimainkan",
        cloudHelp: "Setiap permainan yang disimpan dengan PIN ini tersedia di sini pada mana-mana peranti yang bersambung.",
        refresh: "Muat semula permainan",
        refreshing: "Sedang memuat semula...",
        language: "EN",
      };

  const formatLastPlayed = (updatedAt: string) => {
    const dateTime = new Intl.DateTimeFormat(lang === "ms" ? "ms-MY" : "en-MY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(updatedAt));
    return `${dateTime} ${lang === "en" ? "MYT (Malaysia Time)" : "MYT (Waktu Malaysia)"}`;
  };

  const openExisting = async (saveId: string) => {
    if (busySaveId) return;
    setBusySaveId(saveId);
    setError("");
    try {
      onOpen(await loadGameSave(pin, saveId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the game file.");
    } finally {
      setBusySaveId(null);
    }
  };

  const createNew = async () => {
    const cleanFileName = fileName.trim();
    const cleanPlayerName = playerName.trim();
    if (!cleanFileName || !cleanPlayerName || busySaveId) return;
    setBusySaveId("new");
    setError("");
    try {
      const save = await createGameSave(pin, cleanFileName, cleanPlayerName, lang, soundEnabled);
      setSaves((current) => [{
        id: save.id,
        fileName: save.fileName,
        playerName: save.playerName,
        stars: save.stars,
        updatedAt: save.updatedAt,
      }, ...current]);
      onOpen(save);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the game file.");
    } finally {
      setBusySaveId(null);
    }
  };

  return (
    <div className="page-bg min-h-[100dvh] overflow-x-hidden font-sans text-slate-800" style={DEFAULT_BACKGROUND_STYLE}>
      <div className="app-responsive-frame jungle-leaves relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 py-4 md:px-8">
        <header className="flex items-center justify-between gap-3">
          <button type="button" onClick={onChangePin} className="rounded-2xl border-2 border-white/90 bg-white/90 px-4 py-2 text-sm font-black text-blue-900 shadow-[0_4px_0_rgba(0,0,0,.15)]">
            <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" /> {copy.changePin}
          </button>
          <button type="button" onClick={onToggleLang} className="rounded-2xl border-2 border-white/90 bg-white/90 px-4 py-2 text-sm font-black text-blue-900 shadow-[0_4px_0_rgba(0,0,0,.15)]">
            {copy.language}
          </button>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 py-6">
          <section className="lesson-panel rounded-[2.25rem] p-5 shadow-2xl md:p-8">
            <div className="text-center">
              <img src={chrysHappy} alt="Chrys" className="mx-auto h-24 w-24 object-contain drop-shadow-xl" />
              <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{copy.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-4xl">{copy.title}</h1>
              <p className="mt-2 text-base font-bold text-slate-600 sm:text-lg">{copy.help}</p>
              <p className="mx-auto mt-3 max-w-2xl rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">{copy.cloudHelp}</p>
              <button
                type="button"
                onClick={() => void refreshSaves()}
                disabled={refreshing || Boolean(busySaveId)}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border-2 border-sky-300 bg-white px-4 py-2 text-sm font-black text-blue-900 shadow-[0_4px_0_#7dd3fc] disabled:cursor-not-allowed disabled:opacity-60 enabled:active:translate-y-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                {refreshing ? copy.refreshing : copy.refresh}
              </button>
            </div>

            {error && <p role="alert" className="mx-auto mt-5 max-w-2xl rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-800">{error}</p>}

            {createStep === 0 && (
              <>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {saves.map((save) => (
                    <article key={save.id} className="rounded-3xl border-3 border-sky-200 bg-white p-5 shadow-[0_5px_0_#7dd3fc]">
                      <h2 className="truncate text-2xl font-black text-blue-950">{save.fileName}</h2>
                      <p className="mt-1 text-lg font-black text-emerald-800">{save.playerName}</p>
                      <p className="mt-2 text-sm font-bold text-slate-500">⭐ {save.stars} {copy.stars}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{copy.lastPlayed}: {formatLastPlayed(save.updatedAt)}</p>
                      <button type="button" disabled={Boolean(busySaveId)} onClick={() => void openExisting(save.id)} className="mt-4 w-full rounded-2xl border-2 border-emerald-500 bg-emerald-400 px-4 py-3 text-base font-black text-emerald-950 shadow-[0_5px_0_#047857] disabled:opacity-60 enabled:active:translate-y-1">
                        {busySaveId === save.id ? "..." : copy.continue}
                      </button>
                    </article>
                  ))}
                </div>
                {saves.length === 0 && <p className="mt-7 rounded-3xl border-2 border-dashed border-sky-300 bg-sky-50 p-6 text-center font-black text-slate-600">{copy.empty}</p>}
                <button type="button" onClick={() => { setCreateStep(1); setError(""); }} className="mx-auto mt-7 block rounded-3xl border-2 border-yellow-500 bg-yellow-400 px-7 py-4 text-xl font-black text-yellow-950 shadow-[0_7px_0_#a86000] active:translate-y-1">
                  <Plus className="mr-2 inline h-5 w-5" aria-hidden="true" /> {copy.newGame}
                </button>
              </>
            )}

            {createStep > 0 && (
              <div className="mx-auto mt-7 max-w-lg rounded-3xl border-3 border-sky-200 bg-white p-5 shadow-[0_6px_0_#7dd3fc] sm:p-7">
                {createStep === 1 ? (
                  <label className="block">
                    <span className="block text-lg font-black text-blue-950">{copy.fileLabel}</span>
                    <span className="mt-1 block text-sm font-bold text-slate-500">{copy.fileHelp}</span>
                    <input autoFocus value={fileName} maxLength={24} onChange={(event) => setFileName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && fileName.trim()) setCreateStep(2); }} className="mt-3 w-full rounded-2xl border-3 border-sky-200 bg-sky-50 px-4 py-3 text-xl font-black text-blue-950 outline-none focus:border-yellow-400" />
                    <span className="mt-1 block text-right text-xs font-black text-slate-500">{fileName.length}/24</span>
                  </label>
                ) : (
                  <label className="block">
                    <span className="block text-lg font-black text-blue-950">{copy.playerLabel}</span>
                    <input autoFocus value={playerName} maxLength={20} onChange={(event) => setPlayerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createNew(); }} className="mt-3 w-full rounded-2xl border-3 border-sky-200 bg-sky-50 px-4 py-3 text-xl font-black text-blue-950 outline-none focus:border-yellow-400" />
                    <span className="mt-1 block text-right text-xs font-black text-slate-500">{playerName.length}/20</span>
                  </label>
                )}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setCreateStep(createStep === 2 ? 1 : 0); setError(""); }} className="rounded-2xl border-2 border-sky-300 bg-white px-4 py-3 font-black text-blue-900 shadow-[0_4px_0_#7dd3fc] active:translate-y-1">{copy.back}</button>
                  {createStep === 1 ? (
                    <button type="button" disabled={!fileName.trim()} onClick={() => setCreateStep(2)} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-4 py-3 font-black text-yellow-950 shadow-[0_4px_0_#a86000] disabled:opacity-50 enabled:active:translate-y-1">{copy.next}</button>
                  ) : (
                    <button type="button" disabled={!playerName.trim() || Boolean(busySaveId)} onClick={() => void createNew()} className="rounded-2xl border-2 border-emerald-500 bg-emerald-400 px-4 py-3 font-black text-emerald-950 shadow-[0_4px_0_#047857] disabled:opacity-50 enabled:active:translate-y-1">{busySaveId === "new" ? "..." : copy.create}</button>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function Header({ lang, onToggleLang, title, stars, cyber = false, t, soundEnabled, onToggleSound, onOpenGlossary, onBack }: {
  lang: Lang;
  onToggleLang: () => void;
  title: string;
  stars: number;
  cyber?: boolean;
  t: UIStrings;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenGlossary: () => void;
  onBack?: () => void;
}) {
  return (
    <header className={`${cyber ? "border-2 border-cyan-300/80 bg-[#041c2d]/95 shadow-[0_6px_0_#07546e]" : "soft-panel"} app-header mb-4 flex items-center justify-between gap-2 rounded-[1.75rem] px-3 py-2 sm:gap-3`}>
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button onClick={onBack} aria-label={t.back} className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 transition hover:-translate-y-0.5 active:translate-y-1 ${cyber ? "border-cyan-300/70 bg-slate-950 text-cyan-100 shadow-[0_5px_0_#164e63] hover:bg-cyan-950" : "border-sky-100 bg-white text-blue-800 shadow-[0_5px_0_rgba(14,116,144,.18)] hover:border-sky-200 hover:bg-sky-50"}`}>
            <BackArrowIcon />
          </button>
        )}
        <h1 className={`hidden truncate text-xl font-black leading-tight sm:block md:text-2xl ${cyber ? "text-cyan-50" : "text-blue-950"}`}>{title}</h1>
      </div>
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        {NUMBER_AUDIO_ENABLED && (
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? (lang === "en" ? "Sound is on" : "Bunyi dibuka") : (lang === "en" ? "Sound is off" : "Bunyi ditutup")}
            className={`flex shrink-0 items-center gap-1 rounded-2xl border-2 px-2 py-2 text-sm font-black shadow-[0_4px_0_rgba(0,0,0,.12)] sm:px-3 ${
              soundEnabled
                ? cyber ? "border-cyan-300/70 bg-slate-950 text-cyan-100" : "border-blue-200 bg-white/90 text-blue-800"
                : cyber ? "border-slate-600 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-500"
            }`}
          >
            <SpeakerIcon />
            <span className="hidden sm:inline">{soundEnabled ? (lang === "en" ? "Sound" : "Bunyi") : (lang === "en" ? "Muted" : "Senyap")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenGlossary}
          aria-label={lang === "en" ? "Open glossary" : "Buka glosari"}
          title={lang === "en" ? "Glossary" : "Glosari"}
          className={`flex shrink-0 items-center gap-1 rounded-2xl border-2 px-2 py-2 text-sm font-black shadow-[0_4px_0_rgba(0,0,0,.12)] sm:px-3 ${cyber ? "border-emerald-300/70 bg-emerald-950/70 text-emerald-100" : "border-emerald-200 bg-white/90 text-emerald-800"}`}
        >
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <span className="hidden md:inline">{lang === "en" ? "Glossary" : "Glosari"}</span>
        </button>
        <button
          type="button"
          onClick={onToggleLang}
          aria-label={lang === "en" ? "Switch to Bahasa Melayu" : "Tukar kepada bahasa Inggeris"}
          title={lang === "en" ? "Switch to Bahasa Melayu" : "Tukar kepada bahasa Inggeris"}
          className={`flex min-h-12 shrink-0 items-center gap-1 rounded-2xl border-2 px-2 py-2.5 text-base font-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 active:translate-y-1 sm:gap-2 sm:px-4 ${cyber ? "border-cyan-300/70 bg-[#09263b] text-cyan-50 shadow-[0_5px_0_#164e63] hover:bg-cyan-950 active:shadow-[0_2px_0_#164e63]" : "border-sky-200 bg-white/95 text-blue-900 shadow-[0_5px_0_rgba(14,116,144,.2)] hover:border-sky-300 hover:bg-sky-50 active:shadow-[0_2px_0_rgba(14,116,144,.2)]"}`}
        >
          <span>{lang === "en" ? "BM" : "EN"}</span>
          <span className={`grid h-7 w-7 place-items-center rounded-xl ${cyber ? "bg-cyan-900 text-cyan-200" : "bg-sky-100 text-sky-700"}`} aria-hidden="true">
            <ArrowLeftRight className="h-4 w-4" strokeWidth={3} />
          </span>
        </button>
        <div className={`flex shrink-0 items-center gap-1 rounded-2xl border-2 px-2 py-2 font-black shadow-[0_4px_0_rgba(0,0,0,.14)] sm:gap-2 sm:px-3 ${cyber ? "border-yellow-300/80 bg-slate-950 text-yellow-200" : "border-yellow-300 bg-white text-yellow-700"}`} aria-label={lang === "en" ? `${stars} stars earned` : `${stars} bintang terkumpul`} title={lang === "en" ? `Stars earned: ${stars}` : `Bintang terkumpul: ${stars}`}>
          <StarBadgeIcon />
          <span className="text-base">{stars}</span>
        </div>
      </div>
    </header>
  );
}

function GlossaryDialog({ lang, open, onOpenChange }: { lang: Lang; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase(lang === "ms" ? "ms-MY" : "en-US");
  const filteredEntries = GLOSSARY_ENTRIES.filter((entry) => {
    if (!normalizedQuery) return true;
    return [entry.term[lang], entry.child[lang], entry.note[lang]]
      .some((value) => value.toLocaleLowerCase(lang === "ms" ? "ms-MY" : "en-US").includes(normalizedQuery));
  });
  const tierLabels: Record<GlossaryEntry["tier"], string> = lang === "en"
    ? { 1: "New math words", 2: "Useful math words", 3: "Everyday math words", 4: "Advanced math words" }
    : { 1: "Perkataan matematik baharu", 2: "Perkataan matematik berguna", 3: "Perkataan matematik harian", 4: "Perkataan matematik lanjutan" };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-blue-950/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[min(94vw,52rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_12px_0_rgba(15,23,42,.22)] focus:outline-none">
          <div className="border-b-2 border-emerald-100 bg-emerald-50 px-5 py-4 pr-16 sm:px-6">
            <Dialog.Title className="flex items-center gap-3 text-2xl font-black text-blue-950 sm:text-3xl">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </span>
              {lang === "en" ? "Math Glossary" : "Glosari Matematik"}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {lang === "en" ? "Child-friendly meanings for math words." : "Maksud perkataan matematik yang mudah untuk budak."}
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={lang === "en" ? "Close glossary" : "Tutup glosari"}
                className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-2xl border-2 border-slate-200 bg-white text-slate-600 shadow-[0_4px_0_rgba(0,0,0,.10)] active:translate-y-1"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </Dialog.Close>
            <label className="relative mt-4 block">
              <span className="sr-only">{lang === "en" ? "Find a word" : "Cari perkataan"}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={lang === "en" ? "Find a word" : "Cari perkataan"}
                className="w-full rounded-2xl border-2 border-emerald-200 bg-white py-3 pl-12 pr-4 text-base font-bold text-blue-950 outline-none focus:border-blue-400"
              />
            </label>
          </div>

          <div className="overflow-y-auto px-5 py-4 sm:px-6">
            {([1, 2, 3, 4] as const).map((tier) => {
              const entries = filteredEntries.filter((entry) => entry.tier === tier);
              if (entries.length === 0) return null;
              return (
                <section key={tier} className="mb-6 last:mb-0" aria-labelledby={`glossary-tier-${tier}`}>
                  <h2 id={`glossary-tier-${tier}`} className="mb-2 text-lg font-black text-emerald-800">{tierLabels[tier]}</h2>
                  <div className="divide-y-2 divide-slate-100 rounded-2xl border-2 border-slate-100 bg-white">
                    {entries.map((entry) => (
                      <article key={entry.term.en} className="flex items-start gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-black text-blue-950">{entry.term[lang]}</h3>
                          <p className="mt-1 font-bold leading-snug text-slate-700">
                            <span className="text-emerald-700">{lang === "en" ? "Easy meaning:" : "Maksud mudah:"}</span> {entry.child[lang]}
                          </p>
                          <p className="mt-1 text-sm font-bold leading-snug text-slate-500">
                            <span className="text-blue-700">{lang === "en" ? "Math note:" : "Nota matematik:"}</span> {entry.note[lang]}
                          </p>
                        </div>
                        {WORD_AUDIO_ENABLED && (
                          <button
                            type="button"
                            onClick={() => speakText(`${entry.term[lang]}. ${entry.child[lang]} ${entry.note[lang]}`, lang)}
                            aria-label={lang === "en" ? `Hear ${entry.term.en}` : `Dengar ${entry.term.ms}`}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.14)] active:translate-y-1"
                          >
                            <SpeakerIcon />
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
            {filteredEntries.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-lg font-black text-slate-500">
                {lang === "en" ? "No matching word yet." : "Tiada perkataan yang sama."}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-800" aria-hidden="true">
      <path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StarBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-yellow-500 drop-shadow-sm" aria-hidden="true">
      <path
        d="m12 2.8 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 2.8Z"
        fill="currentColor"
        stroke="#A86000"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeScreen({ lang, t, player, setPlayer, go }: {
  lang: Lang;
  t: UIStrings;
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  go: (screen: Screen) => void;
}) {
  const [name, setName] = useState(player?.name ?? "");
  const start = () => {
    const clean = name.trim() || "Explorer";
    setPlayer(player ?? { name: clean, stars: 0, progress: {} });
    if (player && player.name !== clean) setPlayer({ ...player, name: clean });
    go("modeSelect");
  };
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 py-4 md:grid-cols-[0.9fr_1.25fr]">
      <div className="flex justify-center">
        <img src={chrysHappy} alt="Chrys the monkey waving hello" className="h-72 w-72 object-contain drop-shadow-2xl md:h-96 md:w-96" />
      </div>
      <section className="lesson-panel rounded-[2rem] p-5 text-center md:p-8">
        <div className="mx-auto mb-3 flex max-w-sm items-center justify-center gap-3">
          <img src={chrysThinking} alt="Chrys reading" className="h-20 w-20 object-contain" />
          <div className="text-left">
            <h2 className="text-4xl font-black leading-none text-blue-900 md:text-5xl">{t.title}</h2>
          </div>
        </div>
        <div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
          <article className="flex min-h-32 items-center gap-3 rounded-3xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-left shadow-[0_5px_0_#f5c400]">
            <img src={chrysExcited} alt="Chrys the monkey" className="h-20 w-20 shrink-0 object-contain drop-shadow-md" />
            <div>
              <h3 className="text-lg font-black leading-tight text-amber-950">{t.chrysIntro}</h3>
              <p className="mt-1 text-sm font-bold leading-snug text-amber-800">{t.chrysIntroHelp}</p>
            </div>
          </article>
          <article className="flex min-h-32 items-center gap-3 rounded-3xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-left shadow-[0_5px_0_#52b788]">
            <img src={alyseGuide} alt="Alyse the snake" className="h-20 w-20 shrink-0 object-contain drop-shadow-md" />
            <div>
              <h3 className="text-lg font-black leading-tight text-emerald-950">{t.alyseIntro}</h3>
              <p className="mt-1 text-sm font-bold leading-snug text-emerald-800">{t.alyseIntroHelp}</p>
            </div>
          </article>
        </div>
        <label className="mx-auto mt-7 block max-w-sm text-left">
          <span className="mb-2 block text-base font-black text-blue-900">{t.namePrompt}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && start()}
            className="w-full rounded-3xl border-4 border-sky-200 bg-sky-50 px-5 py-4 text-xl font-black text-blue-950 outline-none focus:border-yellow-400"
            placeholder={t.namePlaceholder}
            maxLength={14}
          />
        </label>
        <button onClick={start} className="mt-5 w-full max-w-sm rounded-3xl border-2 border-yellow-500 bg-yellow-400 px-6 py-4 text-xl font-black text-yellow-950 shadow-[0_7px_0_#a86000] active:translate-y-1">
          {player ? t.continue : t.start}
        </button>
        <p className="mt-4 text-sm font-bold text-slate-500">
          {lang === "en" ? "Choose English or Bahasa Melayu." : "Pilih English atau Bahasa Melayu."}
        </p>
      </section>
    </main>
  );
}

function ModeSelectScreen({ lang, t, player, go }: { lang: Lang; t: UIStrings; player: Player; go: (screen: Screen) => void }) {
  const learningCompleted = [
    (player.progress.recognizeNumbers ?? 0) > 0 || (player.progress.learnRecognize ?? 0) > 0,
    (player.progress.numberValues ?? 0) > 0 || (player.progress.learnValues ?? 0) > 0,
    (player.progress.sequencing ?? 0) > 0 || (player.progress.learnSequencing ?? 0) > 0,
    (player.progress.groupingMode ?? 0) > 0,
    (player.progress.addition ?? 0) > 0 || (player.progress.learnAddition ?? 0) > 0,
    (player.progress.subtraction ?? 0) > 0 || (player.progress.learnSubtraction ?? 0) > 0,
    (player.progress.learnReal ?? 0) > 0,
    ["testNumbers", "testOperations", "testReal"].every((key) => Object.prototype.hasOwnProperty.call(player.progress, key)),
  ].filter(Boolean).length;
  const advancedCompleted = ["advancedTeenNumbers", "advancedCompareBigger", "advancedSequencing", "advancedAdditionPart1", "advancedAdditionPart2", "advancedSubtraction"]
    .filter((key) => (player.progress[key] ?? 0) > 0).length;
  const learningTopics = lang === "en"
    ? ["Recognize numbers", "Number values", "Number order", "Grouping", "Addition", "Subtraction", "Real-world maths", "Practice tests"]
    : ["Kenal nombor", "Nilai nombor", "Susunan nombor", "Kumpulan nombor", "Tambah", "Tolak", "Aplikasi konsep", "Soalan latihan"];
  const advancedTopics = lang === "en"
    ? ["Recognizing and identifying numbers", "Greater than (>) and less than (<)", "Number sequence", "Addition", "Subtraction", "Test mode"]
    : ["Mengenal dan mengenal pasti nombor", "Lebih besar (>) dan lebih kecil (<)", "Urutan nombor", "Tambah", "Tolak", "Mod ujian"];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 py-6">
      <section className="text-center">
        <img src={chrysExcited} alt="Chrys" className="mx-auto h-36 w-36 object-contain drop-shadow-xl" />
        <h2 className="text-4xl font-black text-blue-950">
          {lang === "en" ? `Hi, ${player.name}! Choose your adventure.` : `Hai, ${player.name}! Pilih pengembaraan kamu.`}
        </h2>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={() => go("menu")}
          aria-label={lang === "en" ? "Open Learning Mode" : "Buka Mod Belajar"}
          className="group relative h-full overflow-hidden rounded-[2rem] border-4 border-sky-300 bg-gradient-to-br from-white via-sky-50 to-emerald-100 p-6 text-left shadow-[0_9px_0_#3b82f6] transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-yellow-400 active:translate-y-1 md:p-8"
        >
          <span className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(14,165,233,.18),transparent_68%)]" aria-hidden="true" />
          <span className="relative z-10 flex h-full flex-col">
            <span className="grid h-24 w-24 place-items-center rounded-[1.6rem] border-2 border-sky-300 bg-gradient-to-br from-sky-100 to-emerald-100 shadow-inner">
              <img src={chrysThinking} alt="" className="h-20 w-20 object-contain" />
            </span>
            <span className="mt-6 block text-3xl font-black text-blue-950">
              {lang === "en" ? "Learning Mode" : "Mod Belajar"}
            </span>
            <span className="mt-2 block text-lg font-bold text-slate-600">
              {lang === "en" ? "Learn numbers 0-9 with Chrys" : "Belajar nombor 0-9 bersama Chrys"}
            </span>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 shadow-sm">
              {learningCompleted > 0 && <Check className="h-5 w-5" strokeWidth={4} aria-hidden="true" />}
              {lang === "en" ? `${learningCompleted} of 8 adventures complete` : `${learningCompleted} daripada 8 pengembaraan selesai`}
            </span>
            <span className="mt-5 flex items-center gap-2 text-sm font-black uppercase text-blue-800">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              {lang === "en" ? "Topics you will explore" : "Topik yang akan diteroka"}
            </span>
            <span className="mt-3 flex flex-wrap gap-2">
              {learningTopics.map((topic) => (
                <span key={topic} className="rounded-full border-2 border-sky-200 bg-white/85 px-3 py-1.5 text-sm font-black text-blue-900 shadow-sm">
                  {topic}
                </span>
              ))}
            </span>
            <span className="mt-auto flex items-center justify-end gap-2 pt-6 font-black text-blue-700">
              {lang === "en" ? "Start learning" : "Mula belajar"}
              <ArrowRight className="h-7 w-7 transition group-hover:translate-x-1" strokeWidth={3} aria-hidden="true" />
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => go("advancedMenu")}
          aria-label={lang === "en" ? "Open Advanced Adventure" : "Buka Pengembaraan Lanjutan"}
          className="group relative h-full overflow-hidden rounded-[2rem] border-4 border-orange-200 bg-gradient-to-br from-[#47283f] via-[#785044] to-[#465833] p-6 text-left text-white shadow-[0_9px_0_#7c493c] transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-yellow-300 active:translate-y-1 md:p-8"
        >
          <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(250,204,21,.24),transparent_68%)]" aria-hidden="true" />
          <span className="relative z-10 flex h-full flex-col">
            <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-[1.6rem] border-2 border-yellow-200/80 bg-[#563247] p-2 shadow-inner">
              <img src={chrysRunning} alt="" className="max-h-full max-w-full object-contain object-center" />
            </span>
            <span className="mt-6 block text-3xl font-black leading-tight text-yellow-100">{t.advancedAdventure}</span>
            <span className="mt-2 block text-lg font-bold text-orange-50">{t.advancedAdventureShort}</span>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-[#523344]/90 px-4 py-2 text-sm font-black text-orange-50 shadow-sm">
              {advancedCompleted > 0 && <Check className="h-5 w-5" strokeWidth={4} aria-hidden="true" />}
              {lang === "en" ? `${advancedCompleted} of 6 missions complete` : `${advancedCompleted} daripada 6 misi selesai`}
            </span>
            <span className="mt-5 flex items-center gap-2 text-sm font-black uppercase text-yellow-200">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              {lang === "en" ? "Topics you will explore" : "Topik yang akan diteroka"}
            </span>
            <span className="mt-3 flex flex-wrap gap-2">
              {advancedTopics.map((topic) => (
                <span key={topic} className="max-w-full rounded-full border border-orange-200/70 bg-[#604039]/80 px-3 py-1.5 text-sm font-black leading-snug text-orange-50 shadow-sm">
                  {topic}
                </span>
              ))}
            </span>
            <span className="mt-auto flex items-center justify-end gap-2 pt-6 font-black text-yellow-200">
              {lang === "en" ? "Start expedition" : "Mula ekspedisi"}
              <ArrowRight className="h-7 w-7 transition group-hover:translate-x-1" strokeWidth={3} aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>
    </main>
  );
}

type LearningSectionColor = "sky" | "emerald" | "violet" | "amber" | "teal" | "rose" | "orange" | "navy";

const LEARNING_SECTION_MARKERS: Record<LearningSectionColor, string> = {
  sky: "bg-sky-500 shadow-[0_4px_0_#0369a1]",
  emerald: "bg-emerald-600 shadow-[0_4px_0_#065f46]",
  violet: "bg-purple-600 shadow-[0_4px_0_#6b21a8]",
  amber: "bg-yellow-400 text-yellow-950 shadow-[0_4px_0_#ca8a04]",
  teal: "bg-cyan-500 shadow-[0_4px_0_#0e7490]",
  rose: "bg-pink-600 shadow-[0_4px_0_#be185d]",
  orange: "bg-orange-600 shadow-[0_4px_0_#c2410c]",
  navy: "bg-slate-900 text-yellow-200 shadow-[0_4px_0_#020617]",
};

function MenuScreen({ lang, t, player, go }: { lang: Lang; t: UIStrings; player: Player; go: (screen: Screen) => void }) {
  const completed = {
    recognize: (player.progress.recognizeNumbers ?? 0) > 0 || (player.progress.learnRecognize ?? 0) > 0,
    values: (player.progress.numberValues ?? 0) > 0 || (player.progress.learnValues ?? 0) > 0,
    sequencing: (player.progress.sequencing ?? 0) > 0 || (player.progress.learnSequencing ?? 0) > 0,
    grouping: (player.progress.groupingMode ?? 0) > 0,
    addition: (player.progress.addition ?? 0) > 0 || (player.progress.learnAddition ?? 0) > 0,
    subtraction: (player.progress.subtraction ?? 0) > 0 || (player.progress.learnSubtraction ?? 0) > 0,
    realWorld: (player.progress.learnReal ?? 0) > 0,
  };
  const testModeComplete = ["testNumbers", "testOperations", "testReal"].every((key) =>
    Object.prototype.hasOwnProperty.call(player.progress, key),
  );
  const stages = [
    {
      number: 1,
      title: lang === "en" ? "Discover numbers" : "Kenali nombor",
      help: lang === "en" ? "Meet numbers, their values, and their order." : "Kenali nombor, nilai, dan susunannya.",
      accent: "sky" as const,
      sections: [
        {
          title: t.recognizeNumbers,
          subtitle: lang === "en" ? "See, spell, trace, and write" : "Lihat, eja, ikut garisan, dan tulis",
          icon: <Hash className="h-10 w-10" strokeWidth={3} aria-hidden="true" />,
          color: "sky" as const,
          complete: completed.recognize,
          onClick: () => go("learnRecognize"),
        },
        {
          title: t.numberValues,
          subtitle: lang === "en" ? "Find how many objects there are" : "Cari berapa banyak objek",
          icon: <SpriteIcon value={BANANA} className="h-12 w-12" />,
          color: "emerald" as const,
          complete: completed.values,
          onClick: () => go("learnValues"),
        },
        {
          title: t.sequencing,
          subtitle: lang === "en" ? "Put numbers in the right order" : "Susun nombor dengan betul",
          icon: <ListOrdered className="h-10 w-10" strokeWidth={3} aria-hidden="true" />,
          color: "violet" as const,
          complete: completed.sequencing,
          onClick: () => go("learnSequencing"),
        },
      ],
    },
    {
      number: 2,
      title: lang === "en" ? "Build maths skills" : "Bina kemahiran matematik",
      help: lang === "en" ? "Make groups, add more, and take away." : "Bina kumpulan, tambah, dan ambil.",
      accent: "emerald" as const,
      sections: [
        {
          title: t.groupingMode,
          subtitle: t.groupingModeShort,
          icon: <Boxes className="h-10 w-10" strokeWidth={3} aria-hidden="true" />,
          color: "amber" as const,
          complete: completed.grouping,
          onClick: () => go("groupingMode"),
        },
        {
          title: t.addition,
          subtitle: lang === "en" ? "Put groups together" : "Gabungkan kumpulan",
          icon: <Plus className="h-11 w-11" strokeWidth={4} aria-hidden="true" />,
          color: "teal" as const,
          complete: completed.addition,
          onClick: () => go("learnAddition"),
        },
        {
          title: t.subtraction,
          subtitle: lang === "en" ? "Take bananas away" : "Ambil pisang",
          icon: <Minus className="h-11 w-11" strokeWidth={4} aria-hidden="true" />,
          color: "rose" as const,
          complete: completed.subtraction,
          onClick: () => go("learnSubtraction"),
        },
      ],
    },
    {
      number: 3,
      title: lang === "en" ? "Use what you know" : "Guna apa yang dipelajari",
      help: lang === "en" ? "Solve stories, then celebrate what you learned." : "Selesaikan cerita, kemudian raikan apa yang dipelajari.",
      accent: "amber" as const,
      sections: [
        {
          title: t.learnReal,
          subtitle: lang === "en" ? "Solve simple everyday stories" : "Selesaikan cerita harian mudah",
          icon: <MapIcon className="h-10 w-10" strokeWidth={3} aria-hidden="true" />,
          color: "orange" as const,
          complete: completed.realWorld,
          onClick: () => go("learnReal"),
        },
        {
          title: t.testMode,
          subtitle: t.testHelp,
          icon: <Star className="h-11 w-11" fill="currentColor" strokeWidth={2.5} aria-hidden="true" />,
          color: "navy" as const,
          complete: testModeComplete,
          onClick: () => go("testMenu"),
        },
      ],
    },
  ];

  const trailDestinations = [
    {
      label: lang === "en" ? "Recognize" : "Kenal",
      complete: completed.recognize,
      markerClass: LEARNING_SECTION_MARKERS.sky,
    },
    {
      label: lang === "en" ? "Values" : "Nilai",
      complete: completed.values,
      markerClass: LEARNING_SECTION_MARKERS.emerald,
    },
    {
      label: lang === "en" ? "Order" : "Susunan",
      complete: completed.sequencing,
      markerClass: LEARNING_SECTION_MARKERS.violet,
    },
    {
      label: lang === "en" ? "Groups" : "Kumpulan",
      complete: completed.grouping,
      markerClass: LEARNING_SECTION_MARKERS.amber,
    },
    {
      label: lang === "en" ? "Addition" : "Tambah",
      complete: completed.addition,
      markerClass: LEARNING_SECTION_MARKERS.teal,
    },
    {
      label: lang === "en" ? "Subtraction" : "Tolak",
      complete: completed.subtraction,
      markerClass: LEARNING_SECTION_MARKERS.rose,
    },
    {
      label: lang === "en" ? "Real world" : "Aplikasi",
      complete: completed.realWorld,
      markerClass: LEARNING_SECTION_MARKERS.orange,
    },
    {
      label: lang === "en" ? "Tests" : "Ujian",
      complete: testModeComplete,
      markerClass: LEARNING_SECTION_MARKERS.navy,
    },
  ];

  let destinationNumber = 0;

  return (
    <main className="learning-menu-stage mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 pb-10">
      <section className="learning-menu-hero relative overflow-hidden rounded-[2rem] border-4 border-white p-5 text-blue-950 shadow-[0_10px_0_rgba(59,130,246,.22)] sm:p-7 md:p-8">
        <div className="relative grid items-center gap-4 md:grid-cols-[auto_1fr_auto]">
          <div className="mx-auto grid h-32 w-32 place-items-center md:h-36 md:w-36">
            <img src={chrysHappy} alt="Chrys" className="h-28 w-28 object-contain drop-shadow-xl md:h-32 md:w-32" />
          </div>
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-sky-200 bg-sky-50/90 px-4 py-2 text-sm font-black uppercase text-blue-900">
              <Compass className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
              {lang === "en" ? "Chrys's learning journey" : "Perjalanan pembelajaran Chrys"}
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 sm:text-4xl">
              {lang === "en" ? `Ready to explore, ${player.name}?` : `Sedia meneroka, ${player.name}?`}
            </h2>
            <p className="mt-2 max-w-2xl text-base font-bold text-slate-600 sm:text-lg">{t.menuTitle}</p>
          </div>
          <div className="mx-auto flex gap-2 md:flex-col">
            <span className="flex items-center gap-2 rounded-2xl border-2 border-yellow-200 bg-yellow-300 px-4 py-3 font-black text-blue-950 shadow-[0_5px_0_#ca8a04]">
              <Flag className="h-5 w-5" fill="currentColor" aria-hidden="true" />
              {lang === "en" ? "8 adventures" : "8 pengembaraan"}
            </span>
            <span className="flex items-center gap-2 rounded-2xl border-2 border-emerald-100 bg-emerald-700/90 px-4 py-3 font-black text-white shadow-[0_5px_0_#065f46]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              {lang === "en" ? "Numbers 0-9" : "Nombor 0-9"}
            </span>
          </div>
        </div>
      </section>

      <section className="learning-trail-strip" aria-label={lang === "en" ? "Learning journey with 8 destinations" : "Perjalanan pembelajaran dengan 8 destinasi"}>
        <div className="grid min-w-[52rem] grid-cols-8 gap-3 px-4 py-5">
          {trailDestinations.map((destination, index) => (
            <div
              key={destination.label}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
              aria-label={`${index + 1}. ${destination.label}. ${destination.complete ? (lang === "en" ? "Completed" : "Selesai") : (lang === "en" ? "Not completed" : "Belum selesai")}`}
            >
              <span
                className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 text-xl font-black ${destination.markerClass} ${destination.complete ? "border-emerald-700 ring-4 ring-emerald-200" : "border-white"} ${destination.markerClass.includes(" text-") ? "" : "text-white"}`}
              >
                {index + 1}
                {destination.complete && (
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-emerald-700 text-white shadow-sm" aria-hidden="true">
                    <Check className="h-4 w-4" strokeWidth={4} />
                  </span>
                )}
              </span>
              <span className={`w-full truncate text-base font-black ${destination.complete ? "text-emerald-800" : "text-blue-950"}`}>
                {destination.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {stages.map((stage) => (
        <section key={stage.number} className={`learning-stage-band learning-stage-${stage.accent}`}>
          <div className="mb-4 flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-950 text-2xl font-black text-white shadow-[0_5px_0_#0c4a6e]">
              {stage.number}
            </span>
            <div>
              <p className="text-sm font-black uppercase text-emerald-700">
                {lang === "en" ? `Stage ${stage.number}` : `Peringkat ${stage.number}`}
              </p>
              <h3 className="text-2xl font-black leading-tight text-blue-950 sm:text-3xl">{stage.title}</h3>
              <p className="mt-1 font-bold text-slate-600">{stage.help}</p>
            </div>
          </div>
          <div className={`grid gap-4 ${stage.sections.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {stage.sections.map((section) => {
              destinationNumber += 1;
              return (
                <MenuCard
                  key={section.title}
                  title={section.title}
                  subtitle={section.subtitle}
                  icon={section.icon}
                  color={section.color}
                  step={destinationNumber}
                  complete={section.complete}
                  lang={lang}
                  actionLabel={lang === "en" ? "Start" : "Mula"}
                  onClick={section.onClick}
                />
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

function AdvancedMenuScreen({ lang, t, player, go, testingMode = false }: { lang: Lang; t: UIStrings; player: Player; go: (screen: Screen) => void; testingMode?: boolean }) {
  const teenComplete = Boolean(player.progress.advancedTeenNumbers);
  const compareComplete = Boolean(player.progress.advancedCompareBigger);
  const sequencingComplete = Boolean(player.progress.advancedSequencing);
  const part1Complete = Boolean(player.progress.advancedAdditionPart1);
  const part2Complete = Boolean(player.progress.advancedAdditionPart2);
  const subtractionComplete = Boolean(player.progress.advancedSubtraction);
  const missionStates = [teenComplete, compareComplete, sequencingComplete, part1Complete, part2Complete, subtractionComplete];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 pb-8">
      <section className="advanced-sunset-surface relative overflow-hidden rounded-[2rem] border-4 p-6 text-white sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,205,123,.18),transparent_38%)]" aria-hidden="true" />
        <div className="relative grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]">
            <span className="grid h-28 w-28 place-items-center rounded-[1.75rem] border-2 border-amber-200 bg-[#3b2638]/80 shadow-[0_6px_0_#7c493c,0_0_22px_rgba(255,194,111,.16)]">
            <img src={chrysRunning} alt="Chrys ready for an expedition" className="h-24 w-24 object-contain" />
          </span>
          <div>
            <p className="flex w-fit items-center gap-2 rounded-full border border-amber-200/70 bg-[#4b2d3c]/80 px-4 py-2 text-sm font-black uppercase text-amber-50">
              <Compass className="h-5 w-5" aria-hidden="true" />
              {lang === "en" ? "Sunset learning trail" : "Laluan belajar senja"}
            </p>
            <h2 className="mt-3 text-4xl font-black text-yellow-200">{t.advancedMenuTitle}</h2>
            <p className="mt-2 text-lg font-bold text-amber-50">
              {player.name}, {t.advancedMenuHelp}
            </p>
          </div>
          <div className="flex gap-3 sm:flex-col">
            <span className="rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-4 py-3 text-center font-black text-slate-950 shadow-[0_5px_0_#a16207]">
              {lang === "en" ? "6 missions" : "6 misi"}
            </span>
            <span className="rounded-2xl border-2 border-orange-200 bg-[#4b2d3c]/80 px-4 py-3 text-center font-black text-orange-50 shadow-[0_5px_0_#7c493c]">
              {lang === "en" ? "Numbers 10-20" : "Nombor 10-20"}
            </span>
          </div>
        </div>
      </section>

      <section className="advanced-sunset-card rounded-[1.75rem] border-2 p-4" aria-label={lang === "en" ? "Advanced learning trail" : "Laluan pembelajaran lanjutan"}>
        <div className="flex items-center gap-2 sm:gap-4">
          {missionStates.map((complete, index) => (
            <React.Fragment key={index}>
              <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 text-lg font-black text-white shadow-[0_4px_0_#164e63] sm:h-14 sm:w-14 ${complete ? "border-emerald-300 bg-emerald-600 ring-4 ring-emerald-300/20" : !testingMode && index > 0 && !missionStates[index - 1] ? "border-slate-500 bg-slate-800 text-slate-400" : "border-cyan-200 bg-cyan-600"}`}>
                {index + 1}
                {complete && <Check className="absolute -right-2 -top-2 h-7 w-7 rounded-full border-2 border-white bg-emerald-500 p-1" strokeWidth={4} aria-hidden="true" />}
              </span>
              {index < missionStates.length - 1 && <span className={`h-2 flex-1 rounded-full ${missionStates[index] ? "bg-emerald-400" : "bg-slate-700"}`} />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <AdvancedMissionTile mission={1} title={t.advancedTeenNumbers} subtitle={t.advancedTeenNumbersShort} icon="10-20" complete={teenComplete} onClick={() => go("advancedTeenNumbers")} lang={lang} />
      <AdvancedMissionTile mission={2} title={t.advancedCompareBigger} subtitle={t.advancedCompareBiggerShort} icon="< >" complete={compareComplete} onClick={() => go("advancedCompareBigger")} lang={lang} />
      <AdvancedMissionTile mission={3} title={t.advancedSequencing} subtitle={t.advancedSequencingShort} icon="+1 −1" complete={sequencingComplete} onClick={() => go("advancedSequencing")} lang={lang} />
      <AdvancedMissionTile mission={4} title={t.advancedAdditionPart1} subtitle={lang === "en" ? "Join banana rows and count totals up to 20" : "Gabungkan baris pisang dan kira jumlah hingga 20"} icon="10+" complete={part1Complete} onClick={() => go("advancedAdditionPart1")} lang={lang} />
      <AdvancedMissionTile mission={5} title={t.advancedAdditionPart2} subtitle={lang === "en" ? "Use tens, ones, and carrying" : "Guna puluh, sa, dan mengumpul semula"} icon="↟1" complete={part2Complete} locked={!testingMode && !part1Complete} onClick={() => go("advancedAdditionPart2")} lang={lang} />
      <AdvancedMissionTile mission={6} title={t.advancedSubtraction} subtitle={lang === "en" ? "Take away tens and ones with borrowing" : "Tolak puluh dan sa dengan meminjam"} icon="10−" complete={subtractionComplete} locked={!testingMode && !part2Complete} onClick={() => go("advancedSubtraction")} lang={lang} />
      <button
        type="button"
        onClick={() => go("advancedTestMenu")}
        className="advanced-sunset-surface group relative overflow-hidden rounded-[2rem] border-4 border-yellow-300 p-5 text-left transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 active:translate-y-1 sm:p-6"
      >
        <span className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-yellow-200 bg-yellow-400 text-slate-950 shadow-[0_5px_0_#a16207]">
            <Flag className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-2xl font-black text-yellow-200 sm:text-3xl">{t.advancedTestMode}</span>
            <span className="mt-1 block font-bold text-amber-50">{t.advancedTestHelp}</span>
          </span>
          <ArrowRight className="ml-auto hidden h-9 w-9 text-yellow-200 transition-transform group-hover:translate-x-1 sm:block" strokeWidth={3} aria-hidden="true" />
        </span>
      </button>
    </main>
  );
}

function AdvancedMissionTile({ mission, title, subtitle, icon, complete = false, locked = false, comingSoon = false, onClick, lang }: {
  mission: number;
  title: string;
  subtitle: string;
  icon: string;
  complete?: boolean;
  locked?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
  lang: Lang;
}) {
  return (
    <section className={`advanced-sunset-card relative overflow-hidden rounded-[2rem] border-2 p-5 sm:p-7 ${locked ? "opacity-75" : complete ? "ring-2 ring-amber-200/50" : ""}`}>
      {complete && <span className="pointer-events-none absolute -right-12 top-8 rotate-45 border-y border-emerald-200 bg-emerald-500 px-14 py-2 text-xs font-black uppercase tracking-wider text-slate-950" aria-hidden="true">{lang === "en" ? "Complete" : "Selesai"}</span>}
      <div className="mb-5 flex items-start gap-4">
        <span className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 text-2xl font-black shadow-[0_5px_0_#0f172a] ${locked ? "border-slate-500 bg-slate-800 text-slate-400" : complete ? "border-emerald-200 bg-emerald-500 text-slate-950 ring-4 ring-emerald-300/30" : "border-yellow-300 bg-yellow-300 text-slate-950"}`}>
          {complete ? <Check className="h-8 w-8" strokeWidth={5} aria-hidden="true" /> : mission}
          {complete && <span className="absolute -bottom-2 -left-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-slate-950 text-[.65rem] text-white">{mission}</span>}
        </span>
        <div>
          <p className={`text-sm font-black uppercase ${locked ? "text-stone-300" : "text-orange-200"}`}>{lang === "en" ? `Adventure mission ${mission}` : `Misi pengembaraan ${mission}`}</p>
          <h3 className={`text-2xl font-black sm:text-3xl ${locked ? "text-slate-300" : "text-white"}`}>{title}</h3>
          <p className={`mt-1 font-bold ${locked ? "text-slate-400" : "text-cyan-100"}`}>{subtitle}</p>
        </div>
      </div>
      <button type="button" disabled={locked} onClick={onClick} className={`group w-full rounded-[2rem] border-4 p-5 text-left shadow-[0_8px_0_#064e3b] transition focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 sm:p-7 ${locked ? "cursor-not-allowed border-slate-600 bg-slate-900 text-slate-500" : complete ? "border-emerald-300 bg-gradient-to-r from-emerald-900 to-cyan-950 text-white hover:-translate-y-1 active:translate-y-1" : "border-yellow-300 bg-gradient-to-r from-emerald-900 to-cyan-950 text-white hover:-translate-y-1 active:translate-y-1"}`}>
        <span className="grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]">
          <span className={`grid h-24 w-24 place-items-center rounded-[1.6rem] border-4 bg-slate-950 text-3xl font-black shadow-[inset_0_0_18px_rgba(34,211,238,.35)] ${locked ? "border-slate-600 text-slate-500" : "border-yellow-300 text-yellow-200"}`} style={getNumberTextStyle(icon)}>{icon}</span>
          <span>
            <span className={`block text-3xl font-black leading-tight ${locked ? "text-slate-300" : "text-yellow-200"}`}>{title}</span>
            <span className={`mt-2 block text-lg font-bold ${locked ? "text-slate-400" : "text-cyan-100"}`}>{subtitle}</span>
            {(locked || complete) && <span className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-black ${complete ? "border-emerald-300 bg-emerald-950 text-emerald-200" : "border-slate-500 bg-slate-950 text-slate-300"}`}>{complete ? (lang === "en" ? "Mission complete" : "Misi selesai") : comingSoon ? (lang === "en" ? "Coming soon" : "Akan datang") : (lang === "en" ? `Complete Mission ${mission - 1} to unlock` : `Selesaikan Misi ${mission - 1} untuk buka`)}</span>}
          </span>
          {locked ? <span className="text-4xl" aria-hidden="true">🔒</span> : <ArrowRight className="hidden h-12 w-12 text-yellow-300 transition group-hover:translate-x-1 sm:block" strokeWidth={3} />}
        </span>
      </button>
    </section>
  );
}

function AdvancedTenFrame({ filled, celebrate = false, compact = false, emoji = BANANA }: { filled: number; celebrate?: boolean; compact?: boolean; emoji?: string }) {
  return (
    <div className={`grid grid-cols-5 gap-2 rounded-3xl border-4 p-3 transition ${celebrate ? "border-yellow-300 bg-yellow-300/20 shadow-[0_0_28px_rgba(250,204,21,.48)]" : "border-cyan-400 bg-slate-950"}`}>
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className={`grid place-items-center rounded-xl border-2 ${compact ? "h-9 w-9" : "h-12 w-12 sm:h-14 sm:w-14"} ${index < filled ? "border-yellow-300 bg-amber-100" : "border-cyan-900 bg-slate-900"}`}>
          {index < filled && <SpriteIcon value={emoji} className={compact ? "h-7 w-7" : "h-9 w-9 sm:h-11 sm:w-11"} />}
        </span>
      ))}
    </div>
  );
}

function BananaPile({ count, dim = false, emoji = BANANA }: { count: number; dim?: boolean; emoji?: string }) {
  return (
    <div className={`flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-cyan-700 bg-slate-950/80 p-3 ${dim ? "opacity-50" : ""}`}>
      {count === 0 ? <span className="font-black text-cyan-300">0</span> : Array.from({ length: count }, (_, index) => <SpriteIcon key={index} value={emoji} className="h-10 w-10" />)}
    </div>
  );
}

function CyberCounter({ value, label, celebrate = false }: { value: number; label: string; celebrate?: boolean }) {
  return (
    <div className={`mx-auto flex w-fit items-center gap-3 rounded-2xl border-2 px-5 py-3 ${celebrate ? "border-yellow-300 bg-yellow-300 text-slate-950 shadow-[0_0_22px_rgba(250,204,21,.5)]" : "border-cyan-300 bg-cyan-950 text-cyan-50"}`}>
      <span className="text-sm font-black uppercase tracking-wide">{label}</span>
      <span className="text-4xl font-black" style={getNumberTextStyle(value)}>{value}</span>
    </div>
  );
}

function MakeTenInteraction({ a, b, lang, friend = false, onSolved }: { a: number; b: number; lang: Lang; friend?: boolean; onSolved: () => void }) {
  const [moved, setMoved] = useState(0);
  const [busy, setBusy] = useState(false);
  const completionReportedRef = useRef(false);
  const soundEnabled = React.useContext(AudioEnabledContext);
  const total = a + moved;
  const target = a + b;
  const neededForTen = 10 - a;
  const loose = Math.max(0, total - 10);
  const remaining = b - moved;
  const fullTen = total >= 10;
  const finished = moved === b;

  const moveOne = async () => {
    if (busy || finished) return;
    const nextMoved = moved + 1;
    const nextTotal = a + nextMoved;
    setBusy(true);
    if (soundEnabled) {
      let ticked = false;
      await speakCountingSequence(nextTotal, lang, COUNTING_STEP_MS, (value) => {
        if (value === nextTotal) {
          ticked = true;
          setMoved(nextMoved);
        }
      }, undefined, nextTotal);
      if (!ticked) setMoved(nextMoved);
    } else {
      setMoved(nextMoved);
    }
    setBusy(false);
    if (nextMoved === b && !completionReportedRef.current) {
      completionReportedRef.current = true;
      onSolved();
    }
  };

  const message = finished
    ? (lang === "en" ? `${a} plus ${b} equals ${target}.` : `${a} tambah ${b} sama dengan ${target}.`)
    : total === 10
      ? (lang === "en" ? "The basket is full. That's TEN!" : "Bakul penuh. Itu SEPULUH!")
      : total > 10
        ? (lang === "en" ? `Ten and ${loose} more. Keep going to ${target}.` : `Sepuluh dan ${loose} lagi. Teruskan hingga ${target}.`)
        : friend
          ? (lang === "en" ? `Chrys has ${a}. His friend has ${b}. Move one banana at a time.` : `Chrys ada ${a}. Kawannya ada ${b}. Pindah satu pisang setiap kali.`)
          : (lang === "en" ? `Chrys has ${a} bananas. The basket fits 10.` : `Chrys ada ${a} pisang. Bakul muat 10.`);

  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 shadow-[inset_0_0_35px_rgba(34,211,238,.12)] sm:p-6">
      <p className="mb-4 text-center text-xl font-black text-cyan-50" role="status">{message}</p>
      <CyberCounter value={total} label={lang === "en" ? "Counter" : "Kiraan"} celebrate={total === 10} />
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_.65fr]">
        <div>
          <p className="mb-2 text-center text-sm font-black uppercase tracking-wide text-cyan-300">{lang === "en" ? "Ten-basket" : "Bakul puluh"}</p>
          <AdvancedTenFrame filled={Math.min(10, total)} celebrate={total === 10} />
          {fullTen && (
            <p className="mt-3 text-center text-2xl font-black text-yellow-200">
              {total === 10 ? (lang === "en" ? "TEN!" : "SEPULUH!") : (lang === "en" ? `10 and ${loose} more` : `10 dan ${loose} lagi`)}
            </p>
          )}
          {loose > 0 && <div className="mx-auto mt-3 max-w-xs"><BananaPile count={loose} /></div>}
        </div>
        <div>
          <p className="mb-2 text-center text-sm font-black uppercase tracking-wide text-cyan-300">
            {friend ? (lang === "en" ? `Friend: ${remaining} left` : `Kawan: ${remaining} tinggal`) : (lang === "en" ? `${remaining} still to add` : `${remaining} lagi untuk tambah`)}
          </p>
          <BananaPile count={remaining} dim={remaining === 0} />
          {!finished && (
            <button type="button" disabled={busy} onClick={moveOne} className="relative mt-4 w-full rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-5 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-50">
              {busy ? (lang === "en" ? "Counting..." : "Mengira...") : total < 10 ? (lang === "en" ? "Add a banana" : "Tambah satu pisang") : (lang === "en" ? "Place one banana beside the ten" : "Letak satu pisang di sebelah puluh")}
              {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>}
            </button>
          )}
          {total === 10 && remaining > 0 && (
            <p className="mt-3 rounded-xl border border-yellow-300 bg-amber-950/70 p-3 text-sm font-black text-yellow-100">
              {lang === "en" ? `${neededForTen} went in the basket. ${remaining} are left over.` : `${neededForTen} masuk bakul. ${remaining} lagi tinggal.`}
            </p>
          )}
        </div>
      </div>
      {finished && (
        <div className="mt-5 text-center">
          <p className="text-4xl font-black text-yellow-200" style={getNumberTextStyle(target)}>{a} + {b} = {target}</p>
          <p className="mt-2 font-black text-cyan-100">{lang === "en" ? `One ten and ${target - 10} ones.` : `Satu puluh dan ${target - 10} sa.`}</p>
        </div>
      )}
    </div>
  );
}

function VerticalAdditionCard({ a, b, answer, carried, lang }: { a: number; b: number; answer?: number | string; carried?: boolean; lang: Lang }) {
  const answerDigits = answer === undefined
    ? ["?", "?"]
    : typeof answer === "number" && answer < 10
      ? ["", String(answer)]
      : String(answer).padStart(2, "0").split("");
  return (
    <div className="mobile-vertical-card mx-auto w-full max-w-64 rounded-3xl border-4 border-cyan-300 bg-slate-950 p-4 shadow-[0_7px_0_#164e63]">
      <div className="mb-2 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-center text-xs font-black uppercase tracking-wider text-cyan-300">
        <span aria-hidden="true" />
        <span>{lang === "en" ? "Tens" : "Puluh"}</span><span>{lang === "en" ? "Ones" : "Sa"}</span>
      </div>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] text-center text-4xl font-black text-yellow-200" style={getNumberTextStyle(a)}>
        <span aria-hidden="true" /><span className="relative">{carried && <small className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg text-emerald-300">1</small>}</span><span>{a}</span>
        <span data-math-cue="plus" className="grid place-items-center text-cyan-300" aria-hidden="true">+</span><span /><span>{b}</span>
        <span className="col-span-3 my-2 border-t-4 border-cyan-300" />
        <span aria-hidden="true" />{answerDigits.map((digit, index) => <span key={index}>{digit}</span>)}
      </div>
    </div>
  );
}

type CarryObject = {
  emoji: string;
  enSingular: string;
  enPlural: string;
  ms: string;
};

const BANANA_CARRY_OBJECT: CarryObject = {
  emoji: BANANA,
  enSingular: "banana",
  enPlural: "bananas",
  ms: "pisang",
};

const SHELL_CARRY_OBJECT: CarryObject = {
  emoji: String.fromCodePoint(0x1f41a),
  enSingular: "shell",
  enPlural: "shells",
  ms: "cangkerang",
};

const FLOWER_CARRY_OBJECT: CarryObject = {
  emoji: String.fromCodePoint(0x1f338),
  enSingular: "flower",
  enPlural: "flowers",
  ms: "bunga",
};

function CarryInteraction({ a, b, lang, onSolved, teaching = false, object = BANANA_CARRY_OBJECT }: { a: number; b: number; lang: Lang; onSolved: () => void; teaching?: boolean; object?: CarryObject }) {
  const need = 10 - a;
  const remainder = b - need;
  const total = a + b;
  const [filledMoves, setFilledMoves] = useState(0);
  const [liftStarted, setLiftStarted] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [placedLoose, setPlacedLoose] = useState(0);
  const [onesWritten, setOnesWritten] = useState(false);
  const [tensWritten, setTensWritten] = useState(false);
  const [busy, setBusy] = useState(false);
  const completionReportedRef = useRef(false);
  const soundEnabled = React.useContext(AudioEnabledContext);
  const frameFull = filledMoves === need;
  const counter = frameFull ? 10 + placedLoose : a + filledMoves;

  const countOne = async (nextValue: number, update: () => void) => {
    setBusy(true);
    if (soundEnabled) {
      let ticked = false;
      await speakCountingSequence(nextValue, lang, COUNTING_STEP_MS, (value) => {
        if (value === nextValue) { ticked = true; update(); }
      }, undefined, nextValue);
      if (!ticked) update();
    } else update();
    setBusy(false);
  };

  const liftTen = async () => {
    if (!frameFull || liftStarted) return;
    setLiftStarted(true);
    await wait(1900);
    setLifted(true);
  };

  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-cyan-950 p-4 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
        <VerticalAdditionCard a={a} b={b} answer={tensWritten ? total : onesWritten ? `?${remainder}` : undefined} carried={lifted} lang={lang} />
        <div>
          <CyberCounter value={counter} label={lang === "en" ? `${object.enPlural} count` : `Kiraan ${object.ms}`} celebrate={frameFull && !lifted} />
          <div className="relative mx-auto mt-4 min-h-40 max-w-xl overflow-visible rounded-3xl border border-cyan-700 bg-slate-950/60 p-3">
            <div className={`origin-center transition-transform ease-in-out [transition-duration:1800ms] ${liftStarted ? "-translate-x-[34%] -translate-y-14 scale-[.42]" : "translate-x-0 translate-y-0 scale-100"}`}>
              <AdvancedTenFrame filled={a + filledMoves} celebrate={frameFull && !liftStarted} compact emoji={object.emoji} />
            </div>
            {lifted && <span className="absolute left-[18%] top-3 grid h-14 w-14 place-items-center rounded-2xl border-2 border-emerald-300 bg-emerald-700 text-3xl font-black text-white shadow-[0_0_20px_rgba(52,211,153,.5)]">1</span>}
          </div>
          <p className="mt-3 text-center text-lg font-black text-cyan-50" role="status">
            {!frameFull ? (lang === "en" ? `Add the ones: ${a} + ${b}. Fill the ten-frame.` : `Tambah sa: ${a} + ${b}. Isi bakul puluh.`)
              : !liftStarted ? (lang === "en" ? "Ten! The ten-frame is full!" : "Sepuluh! Bakul puluh penuh!")
                : !lifted ? (lang === "en" ? "The ten is moving slowly to the TENS column..." : "Puluh sedang naik perlahan ke lajur PULUH...")
                  : placedLoose < remainder ? (lang === "en" ? `Place the ${remainder} ${object.enPlural} left in ONES, one at a time.` : `Letak ${remainder} ${object.ms} yang tinggal di SA, satu demi satu.`)
                    : !onesWritten ? remainder === 0 ? (lang === "en" ? `No loose ${object.enPlural} remain. Write 0 in ones.` : `Tiada ${object.ms} berasingan tinggal. Tulis 0 di sa.`) : (lang === "en" ? `${remainder} ${object.enPlural} are left in ones. Write ${remainder}.` : `${remainder} ${object.ms} tinggal di sa. Tulis ${remainder}.`)
                      : !tensWritten ? (lang === "en" ? "Add the carried ten. Write 1 in tens." : "Tambah puluh yang dibawa. Tulis 1 di puluh.")
                        : (lang === "en" ? `${a} plus ${b} equals ${total}. One ten and ${remainder} ones.` : `${a} tambah ${b} sama dengan ${total}. Satu puluh dan ${remainder} sa.`)}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {!frameFull && <button type="button" disabled={busy} onClick={() => void countOne(a + filledMoves + 1, () => setFilledMoves((value) => value + 1))} className="relative rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-5 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] disabled:opacity-50">{lang === "en" ? `Add one ${object.enSingular}` : `Tambah satu ${object.ms}`}<span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>}
            {frameFull && !liftStarted && <button type="button" onClick={() => void liftTen()} className="relative rounded-2xl border-2 border-cyan-200 bg-cyan-600 px-5 py-3 font-black text-white shadow-[0_5px_0_#164e63]">{lang === "en" ? "Move TEN up" : "Naikkan PULUH"}<span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>}
            {lifted && placedLoose < remainder && <button type="button" disabled={busy} onClick={() => void countOne(10 + placedLoose + 1, () => setPlacedLoose((value) => value + 1))} className="relative rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-5 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] disabled:opacity-50">{lang === "en" ? `Place one loose ${object.enSingular}` : `Letak satu ${object.ms} berasingan`}<span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>}
            {lifted && placedLoose === remainder && !onesWritten && <button type="button" onClick={() => setOnesWritten(true)} className="rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-5 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207]">{lang === "en" ? `Write ${remainder} in ONES` : `Tulis ${remainder} di SA`}</button>}
            {onesWritten && !tensWritten && <button type="button" onClick={() => { setTensWritten(true); if (!completionReportedRef.current) { completionReportedRef.current = true; onSolved(); } }} className="rounded-2xl border-2 border-emerald-200 bg-emerald-600 px-5 py-3 font-black text-white shadow-[0_5px_0_#065f46]">{lang === "en" ? "Write 1 in TENS" : "Tulis 1 di PULUH"}</button>}
          </div>
          {lifted && remainder > 0 && (
            <div className="mx-auto mt-4 grid max-w-lg grid-cols-2 gap-3">
              <div><p className="mb-1 text-center text-xs font-black uppercase text-cyan-300">{lang === "en" ? "Waiting" : "Menunggu"}</p><BananaPile count={remainder - placedLoose} emoji={object.emoji} /></div>
              <div><p className="mb-1 text-center text-xs font-black uppercase text-yellow-200">{lang === "en" ? "Placed in ones" : "Diletak di sa"}</p><BananaPile count={placedLoose} emoji={object.emoji} /></div>
            </div>
          )}
          {tensWritten && (
            <div className="mt-5 text-center">
              <p className="text-4xl font-black text-yellow-200">{a} + {b} = {total}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeenPlaceValueCard({ value, lang, connectDigits = false }: { value: number; lang: Lang; connectDigits?: boolean }) {
  const ones = value - 10;
  return (
    <div className="overflow-hidden rounded-[2rem] border-2 border-cyan-300 bg-slate-950/80 p-5 shadow-[0_6px_0_#164e63]">
      {connectDigits && (
        <div className="mx-auto mb-1 max-w-4xl" aria-label={lang === "en" ? `${value} has 1 ten and ${ones} ones` : `${value} ada 1 puluh dan ${ones} sa`}>
          <div className="grid grid-cols-2 gap-6 text-center text-6xl font-black text-yellow-200">
            <span className="mx-auto grid h-24 w-20 place-items-center rounded-2xl border-4 border-cyan-300 bg-cyan-950 text-cyan-100 shadow-[0_6px_0_#164e63]">1</span>
            <span className="mx-auto grid h-24 w-20 place-items-center rounded-2xl border-4 border-yellow-300 bg-slate-950 shadow-[0_6px_0_#a16207]">{ones}</span>
          </div>
          <svg className="h-20 w-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M25 0 C25 8 25 16 25 24" fill="none" stroke="#67e8f9" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M75 0 C75 8 75 16 75 24" fill="none" stroke="#facc15" strokeWidth="1.25" strokeLinecap="round" />
            <circle cx="25" cy="23" r="1.6" fill="#67e8f9" />
            <circle cx="75" cy="23" r="1.6" fill="#facc15" />
          </svg>
        </div>
      )}
      <div className="grid items-end gap-4 md:grid-cols-2">
        <div><AdvancedTenFrame filled={10} compact /><p className="mt-3 text-center font-black text-cyan-300">{lang === "en" ? "TENS" : "PULUH"}</p></div>
        <div><BananaPile count={ones} /><p className="mt-3 text-center font-black text-yellow-200">{lang === "en" ? "ONES" : "SA"}</p></div>
      </div>
    </div>
  );
}

function AdvancedPlaceValueMeaningCard({ lang }: { lang: Lang }) {
  const examples = [
    {
      display: "03",
      tens: [0],
      ones: [1, 1, 1],
      tensLabel: lang === "en" ? "0 tens" : "0 puluh",
      onesLabel: lang === "en" ? "3 ones" : "3 sa",
      equation: "03 = 1 + 1 + 1 = 3",
    },
    {
      display: "12",
      tens: [10],
      ones: [1, 1],
      tensLabel: lang === "en" ? "1 ten" : "1 puluh",
      onesLabel: lang === "en" ? "2 ones" : "2 sa",
      equation: "12 = 10 + 1 + 1 = 12",
    },
    {
      display: "20",
      tens: [10, 10],
      ones: [0],
      tensLabel: lang === "en" ? "2 tens" : "2 puluh",
      onesLabel: lang === "en" ? "0 ones" : "0 sa",
      equation: "20 = 10 + 10 = 20",
    },
  ];

  const valueGroup = (values: number[], label: string, colour: "cyan" | "yellow") => (
    <div className={`min-w-0 ${values.length > 3 ? "flex-[2]" : "flex-1"}`}>
      <p className={`text-center text-base font-black ${colour === "cyan" ? "text-cyan-200" : "text-yellow-200"}`}>{label}</p>
      <svg className="mx-auto h-9 w-full max-w-52 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
        <path d="M8 6 H92 M8 6 V13 M92 6 V13 M50 6 V23" fill="none" stroke={colour === "cyan" ? "#67e8f9" : "#fde047"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 18 L50 25 L56 18" fill="none" stroke={colour === "cyan" ? "#67e8f9" : "#fde047"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={`flex min-h-16 items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 ${colour === "cyan" ? "border-cyan-300 bg-cyan-950/80" : "border-yellow-300 bg-slate-950"}`}>
        {values.map((value, index) => (
          <React.Fragment key={`${value}-${index}`}>
            {index > 0 && <span data-math-cue="plus" className="text-lg font-black text-white">+</span>}
            <span className={`grid h-9 min-w-6 place-items-center rounded-lg border-2 px-0.5 text-lg font-black ${colour === "cyan" ? "border-cyan-300 text-cyan-100" : "border-yellow-300 text-yellow-100"}`}>{value}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <section className="space-y-5 rounded-[2rem] border-2 border-cyan-300 bg-slate-950/85 p-4 shadow-[0_6px_0_#164e63] sm:p-6">
      <div className="rounded-3xl border-2 border-cyan-400 bg-cyan-950/70 p-5 text-center">
        <h4 className="text-2xl font-black text-yellow-200">{lang === "en" ? "What do the digits mean?" : "Apakah maksud digit?"}</h4>
        <p className="mt-2 text-lg font-black text-cyan-50">{lang === "en" ? "The tens digit counts groups of 10. The ones digit counts single ones." : "Digit puluh mengira kumpulan 10. Digit sa mengira satu-satu."}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {examples.map((example) => (
          <article key={example.display} className="rounded-[1.75rem] border-2 border-cyan-400 bg-gradient-to-br from-slate-950 to-cyan-950 p-4 shadow-[0_5px_0_#164e63]">
            <div className="mx-auto mb-5 grid max-w-52 grid-cols-2 gap-4 text-center" aria-label={example.display}>
              <div>
                <p className="mb-2 text-sm font-black text-cyan-200">{lang === "en" ? "TENS DIGIT" : "DIGIT PULUH"}</p>
                <span className="mx-auto grid h-20 w-16 place-items-center rounded-2xl border-4 border-cyan-300 bg-cyan-950 text-4xl font-black text-cyan-100 shadow-[0_5px_0_#164e63]">{example.display[0]}</span>
              </div>
              <div>
                <p className="mb-2 text-sm font-black text-yellow-200">{lang === "en" ? "ONES DIGIT" : "DIGIT SA"}</p>
                <span className="mx-auto grid h-20 w-16 place-items-center rounded-2xl border-4 border-yellow-300 bg-slate-950 text-4xl font-black text-yellow-100 shadow-[0_5px_0_#a16207]">{example.display[1]}</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              {valueGroup(example.tens, example.tensLabel, "cyan")}
              <span data-math-cue="plus" className="mb-5 text-2xl font-black text-white">+</span>
              {valueGroup(example.ones, example.onesLabel, "yellow")}
            </div>
            <p className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-950/70 px-3 py-3 text-center text-xl font-black leading-relaxed text-emerald-100">{example.equation}</p>
          </article>
        ))}
      </div>
      <p className="rounded-2xl border-2 border-yellow-300/70 bg-yellow-300/10 px-5 py-4 text-center text-xl font-black text-yellow-100">{lang === "en" ? "The left digit tells the tens. The right digit tells the ones." : "Digit kiri menunjukkan puluh. Digit kanan menunjukkan sa."}</p>
    </section>
  );
}

type SeventeenPlaceValueStage = "ready" | "countingTen" | "groupingTen" | "basket" | "movingTens" | "tensPlaced" | "countingOnes" | "complete";

function AdvancedSeventeenPlaceValueDemo({ lang, onComplete }: { lang: Lang; onComplete: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<SeventeenPlaceValueStage>("ready");
  const [countedToTen, setCountedToTen] = useState(0);
  const [countedOnes, setCountedOnes] = useState(0);
  const runIdRef = useRef(0);
  const completionReportedRef = useRef(false);
  const tensPlaced = stage === "tensPlaced" || stage === "countingOnes" || stage === "complete";
  const basketVisible = stage === "basket" || stage === "movingTens";
  const firstTenVisible = stage === "ready" || stage === "countingTen" || stage === "groupingTen";

  useEffect(() => () => {
    runIdRef.current += 1;
    stopNumberAudio();
  }, []);

  const countFirstTen = async () => {
    if (stage !== "ready") return;
    const runId = ++runIdRef.current;
    setCountedToTen(0);
    setStage("countingTen");
    let progressed = false;
    await speakCountingSequence(10, lang, COUNTING_STEP_MS, (value) => {
      if (runIdRef.current !== runId) return;
      progressed = true;
      setCountedToTen(value);
    });
    if (runIdRef.current !== runId) return;
    if (!progressed) setCountedToTen(10);
    setStage("groupingTen");
    await wait(prefersReducedMotion ? 100 : 900);
    if (runIdRef.current !== runId) return;
    setStage("basket");
  };

  const moveToTens = async () => {
    if (stage !== "basket") return;
    const runId = ++runIdRef.current;
    setStage("movingTens");
    await wait(prefersReducedMotion ? 100 : 800);
    if (runIdRef.current !== runId) return;
    setStage("tensPlaced");
  };

  const countRemaining = async () => {
    if (stage !== "tensPlaced") return;
    const runId = ++runIdRef.current;
    setCountedOnes(0);
    setStage("countingOnes");
    let progressed = false;
    await speakCountingSequence(7, lang, COUNTING_STEP_MS, (value) => {
      if (runIdRef.current !== runId) return;
      progressed = true;
      setCountedOnes(value);
    });
    if (runIdRef.current !== runId) return;
    if (!progressed) setCountedOnes(7);
    setStage("complete");
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onComplete();
    }
  };

  const renderBanana = (label: number, counted: boolean, active: boolean, key: string) => (
    <span key={key} className={`relative grid h-14 w-11 shrink-0 place-items-center rounded-xl border-2 transition-all duration-300 sm:h-16 sm:w-14 sm:rounded-2xl ${active ? "z-10 scale-110 border-yellow-200 bg-cyan-950 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]" : counted ? "border-cyan-400 bg-cyan-950" : "border-cyan-900 bg-slate-900/90 opacity-35 grayscale"}`}>
      <SpriteIcon value={BANANA} className="h-9 w-9 sm:h-11 sm:w-11" />
      <span className={`absolute -top-3 left-1/2 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black shadow ${active ? "bg-yellow-400 text-slate-950" : counted ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{label}</span>
    </span>
  );

  return (
    <section className="space-y-5 rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 shadow-[0_6px_0_#164e63] sm:p-6">
      <div className="rounded-3xl border-2 border-cyan-400 bg-cyan-950/70 p-4 text-center">
        <h4 className="text-3xl font-black text-yellow-200">17 = 10 + 7</h4>
        <p className="mt-2 text-lg font-black text-cyan-50">{lang === "en" ? "Make one group of 10. Then count the 7 bananas left." : "Buat satu kumpulan 10. Kemudian kira 7 pisang yang tinggal."}</p>
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-2 gap-4 rounded-[1.75rem] border-2 border-cyan-400 bg-slate-950/90 p-4 text-center shadow-[0_5px_0_#164e63]">
        <div><p className="rounded-full border border-cyan-400 bg-cyan-950 py-2 text-sm font-black uppercase tracking-wider text-cyan-200">{lang === "en" ? "Tens digit" : "Digit puluh"}</p><span className={`mx-auto mt-4 grid h-24 w-20 place-items-center rounded-2xl border-4 text-6xl font-black transition-all duration-500 ${tensPlaced ? "scale-100 border-cyan-300 bg-cyan-950 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.45)]" : "scale-90 border-cyan-900 bg-slate-900 text-slate-700"}`}>{tensPlaced ? "1" : "?"}</span>{tensPlaced && <p className="mt-3 font-black text-cyan-100">{lang === "en" ? "1 means 10" : "1 bermaksud 10"}</p>}</div>
        <div><p className="rounded-full border border-yellow-400 bg-slate-950 py-2 text-sm font-black uppercase tracking-wider text-yellow-200">{lang === "en" ? "Ones digit" : "Digit sa"}</p><span className={`mx-auto mt-4 grid h-24 w-20 place-items-center rounded-2xl border-4 text-6xl font-black transition-all duration-500 ${stage === "complete" ? "scale-100 border-yellow-300 bg-slate-950 text-yellow-100 shadow-[0_0_24px_rgba(250,204,21,.45)]" : "scale-90 border-yellow-900 bg-slate-900 text-slate-700"}`}>{stage === "complete" ? "7" : "?"}</span>{stage === "complete" && <p className="mt-3 font-black text-yellow-100">{lang === "en" ? "7 single ones" : "7 sa"}</p>}</div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-2 border-cyan-400 bg-slate-950/85 p-4 sm:p-6">
        <p className="mb-5 text-center text-xl font-black text-cyan-100">{firstTenVisible ? (lang === "en" ? "Count until you reach 10." : "Kira sehingga 10.") : basketVisible ? (lang === "en" ? "Ten bananas make one basket of 10." : "Sepuluh pisang membuat satu bakul 10.") : (lang === "en" ? "Now count the bananas left." : "Sekarang kira pisang yang tinggal.")}</p>

        <div className="relative mx-auto min-h-40 max-w-xl">
          {firstTenVisible && <div className={`mx-auto grid w-fit grid-cols-5 gap-2 transition-all ease-in-out sm:gap-3 ${stage === "groupingTen" ? "translate-y-8 scale-50 opacity-0 duration-[900ms]" : "translate-y-0 scale-100 opacity-100 duration-300"}`}>{Array.from({ length: 10 }, (_, index) => renderBanana(index + 1, index < countedToTen, stage === "countingTen" && index === countedToTen - 1, `ten-${index}`))}</div>}
          {basketVisible && <div className={`mx-auto w-fit max-w-full transition-all ease-in-out ${stage === "movingTens" ? "-translate-y-60 scale-[.3] opacity-0 duration-[800ms]" : "translate-y-0 scale-100 opacity-100 duration-500"}`}><TenBananaBundle lang={lang} compact /></div>}
          {tensPlaced && <p className="slide-in-up mx-auto grid min-h-28 max-w-xl place-items-center rounded-3xl border-2 border-cyan-400 bg-cyan-950/60 px-5 text-center text-xl font-black text-cyan-100">{lang === "en" ? "The basket changed into 1 in the tens digit." : "Bakul itu berubah menjadi 1 dalam digit puluh."}</p>}
        </div>

        {basketVisible && <p className="mx-auto mt-4 max-w-2xl rounded-2xl border-2 border-emerald-300 bg-emerald-950/75 px-5 py-4 text-center text-xl font-black text-emerald-100">{lang === "en" ? "This basket has 10 bananas. It represents 1 in the tens digit column." : "Bakul ini ada 10 pisang. Ia mewakili 1 dalam lajur digit puluh."}</p>}

        <div className="mx-auto mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {Array.from({ length: 7 }, (_, index) => {
            const relabelled = !firstTenVisible;
            const counted = stage === "countingOnes" || stage === "complete" ? index < countedOnes : false;
            const active = stage === "countingOnes" && index === countedOnes - 1;
            return renderBanana(relabelled ? index + 1 : index + 11, counted, active, `one-${index}`);
          })}
        </div>
        {!firstTenVisible && <p className="mt-4 text-center text-lg font-black text-yellow-100">{lang === "en" ? "7 bananas are left. These belong in the ones digit." : "7 pisang tinggal. Pisang ini berada dalam digit sa."}</p>}

        <div className="mt-6 flex justify-center">
          {stage === "ready" && <button type="button" onClick={() => void countFirstTen()} className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1">{lang === "en" ? "Start counting" : "Mula mengira"}</button>}
          {stage === "countingTen" && <button type="button" disabled className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-4 text-lg font-black text-slate-950 opacity-70 shadow-[0_6px_0_#a16207]">{lang === "en" ? "Counting to 10..." : "Mengira hingga 10..."}</button>}
          {stage === "groupingTen" && <p className="rounded-2xl border-2 border-yellow-300 bg-yellow-300/10 px-6 py-3 text-center text-lg font-black text-yellow-100 animate-pulse">{lang === "en" ? "Putting 10 bananas into the basket..." : "Memasukkan 10 pisang ke dalam bakul..."}</p>}
          {stage === "basket" && <button type="button" onClick={() => void moveToTens()} className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1">{lang === "en" ? "Move to tens digit" : "Pindah ke digit puluh"}</button>}
          {stage === "movingTens" && <button type="button" disabled className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-4 text-lg font-black text-slate-950 opacity-70 shadow-[0_6px_0_#a16207]">{lang === "en" ? "Moving to tens..." : "Bergerak ke puluh..."}</button>}
          {stage === "tensPlaced" && <button type="button" onClick={() => void countRemaining()} className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1">{lang === "en" ? "Count the remaining bananas" : "Kira pisang yang tinggal"}</button>}
          {stage === "countingOnes" && <button type="button" disabled className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-4 text-lg font-black text-slate-950 opacity-70 shadow-[0_6px_0_#a16207]">{lang === "en" ? "Counting the 7 ones..." : "Mengira 7 sa..."}</button>}
        </div>
      </div>

      {stage === "complete" && <div className="slide-in-up rounded-3xl border-2 border-emerald-300 bg-emerald-950/75 p-5 text-center shadow-[0_5px_0_#065f46]"><p className="text-4xl font-black text-yellow-100">17 = 10 + 7</p><p className="mt-2 text-xl font-black text-emerald-100">{lang === "en" ? "17 is 1 ten and 7 ones." : "17 ialah 1 puluh dan 7 sa."}</p></div>}
    </section>
  );
}

function CyberTeachingCard({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mobile-teaching-card mb-5 grid items-center gap-4 rounded-3xl border-2 border-cyan-300 bg-gradient-to-r from-slate-950 to-cyan-950 p-4 shadow-[0_6px_0_#164e63] sm:grid-cols-[auto_1fr]">
      <span className="mx-auto grid h-24 w-24 place-items-center rounded-2xl border-2 border-cyan-300 bg-slate-950/70 shadow-[0_5px_0_#0891b2,0_0_18px_rgba(34,211,238,.16)]"><img src={chrysThinking} alt="Chrys teaching" className="h-20 w-20 object-contain drop-shadow-lg" /></span>
      <div><p className="text-sm font-black uppercase tracking-wide text-cyan-300">{eyebrow}</p><h3 className="text-2xl font-black text-yellow-200">{title}</h3><p className="mt-1 text-lg font-black text-cyan-50">{text}</p></div>
    </div>
  );
}

function AdvancedLessonNavigation({ lang, t, phase, lastPhase, canNext = true, nextLabel, onPrevious, onNext, onPractice }: { lang: Lang; t: UIStrings; phase: number; lastPhase: number; canNext?: boolean; nextLabel?: string; onPrevious: () => void; onNext: () => void; onPractice: () => void }) {
  return (
    <div className="mobile-lesson-navigation mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-cyan-400/40 pt-5">
      <button type="button" disabled={phase === 0} onClick={onPrevious} className="rounded-2xl border-2 border-cyan-400 bg-slate-950 px-6 py-3 font-black text-cyan-100 shadow-[0_4px_0_#164e63] disabled:border-slate-700 disabled:text-slate-500 disabled:shadow-none">{t.previous}</button>
      <div className="flex flex-1 flex-wrap justify-end gap-3">
        <button type="button" onClick={onPractice} className="rounded-xl border-2 border-emerald-300 bg-emerald-900 px-4 py-2 text-sm font-black text-emerald-100 shadow-[0_4px_0_#064e3b]">{skipPracticeLabel(lang)}</button>
        <LessonNextButton onClick={onNext} disabled={!canNext} label={nextLabel ?? (phase === lastPhase ? (lang === "en" ? "Start practice" : "Mula latihan") : t.next)} className="text-xl ring-2 ring-cyan-300/40 disabled:opacity-40" />
      </div>
    </div>
  );
}

function balancedIndexRows(count: number, maxPerRow: number) {
  if (count <= 0) return [] as number[][];
  const rowCount = Math.max(1, Math.ceil(count / maxPerRow));
  const smallestRow = Math.floor(count / rowCount);
  const largerRows = count % rowCount;
  let index = 0;
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const amount = smallestRow + (rowIndex < largerRows ? 1 : 0);
    return Array.from({ length: amount }, () => index++);
  });
}

function AdvancedBananaRow({ count, countedThrough = 0, showCountLabels = false, isCounting = false, label, splitOnDesktop = false, compact = false, emoji = BANANA, largeObjects = false, spacious = false, rowPattern, visibleThrough = count, hiddenIndex = null }: { count: number; countedThrough?: number; showCountLabels?: boolean; isCounting?: boolean; label?: string; splitOnDesktop?: boolean; compact?: boolean; emoji?: string; largeObjects?: boolean; spacious?: boolean; rowPattern?: number[]; visibleThrough?: number; hiddenIndex?: number | null }) {
  const isCookie = emoji === String.fromCodePoint(0x1f36a);
  const useSafeObjectSpacing = spacious || isCookie;
  const tileSizeClass = largeObjects ? "h-11 w-10 sm:h-16 sm:w-14 sm:rounded-2xl" : "h-10 w-9 sm:h-14 sm:w-12 sm:rounded-2xl";
  const objectSizeClass = isCookie
    ? largeObjects ? "h-10 w-10 sm:h-14 sm:w-14" : "h-9 w-9 sm:h-12 sm:w-12"
    : largeObjects ? "h-9 w-9 sm:h-12 sm:w-12" : "h-8 w-8 sm:h-11 sm:w-11";
  const renderBananas = (start: number, amount: number) => (
    <div className={`flex items-center justify-center ${showCountLabels && spacious ? "pt-4 sm:pt-5" : ""} ${spacious ? "gap-4 sm:gap-5" : useSafeObjectSpacing ? "gap-2.5 sm:gap-3" : "gap-1 sm:gap-1.5"}`}>
      {Array.from({ length: amount }, (_, offset) => {
        const index = start + offset;
        const visible = index < visibleThrough && index !== hiddenIndex;
        const counted = visible && (!showCountLabels || index < countedThrough);
        const active = visible && showCountLabels && isCounting && index === countedThrough - 1;
        return (
          <span
            key={index}
            data-advanced-object-index={index}
            className={`relative grid shrink-0 place-items-center rounded-lg border transition-all duration-200 ${tileSizeClass} ${
              !visible
                ? "pointer-events-none border-transparent bg-transparent opacity-0"
                : active
                ? "z-10 scale-110 border-yellow-200 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.8)]"
                : counted
                  ? "border-cyan-400 bg-cyan-950/65"
                  : "border-cyan-900 bg-slate-950/80 opacity-30"
            }`}
          >
            <SpriteIcon value={emoji} className={objectSizeClass} />
            {showCountLabels && counted && (
              <span className={`absolute left-1/2 z-20 grid h-5 min-w-5 -translate-x-1/2 place-items-center rounded-full px-1 text-[10px] font-black shadow sm:h-6 sm:min-w-6 sm:text-xs ${spacious ? "-top-5 sm:-top-6" : "-top-2 sm:-top-2.5"} ${active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
                {index + 1}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
  const balancedRows = (maxPerRow: number) => balancedIndexRows(count, maxPerRow).map((row, rowIndex) => (
    <React.Fragment key={rowIndex}>{renderBananas(row[0], row.length)}</React.Fragment>
  ));
  // Five is the safe maximum for every card width used by lessons, questions,
  // tests, and worked solutions. Larger sets become balanced centred rows
  // instead of shrinking, clipping, or touching the card border.
  const maxObjectsPerRow = 5;
  const mobileRows = count > maxObjectsPerRow ? balancedRows(maxObjectsPerRow) : [renderBananas(0, count)];
  const desktopRows = count > maxObjectsPerRow ? balancedRows(maxObjectsPerRow) : [renderBananas(0, count)];
  const splitRows = balancedRows(5);
  const customRows = rowPattern?.reduce<{ rows: React.ReactNode[]; start: number }>((result, amount, rowIndex) => {
    result.rows.push(<React.Fragment key={rowIndex}>{renderBananas(result.start, amount)}</React.Fragment>);
    result.start += amount;
    return result;
  }, { rows: [], start: 0 }).rows;

  return (
    <div className={`${compact ? "w-fit max-w-full shrink-0" : "w-full min-w-0"} px-2 py-2 sm:px-3 sm:py-3`} aria-label={label}>
      <div className={`hidden min-h-14 items-center justify-center sm:flex ${rowPattern || splitOnDesktop || count > maxObjectsPerRow ? `flex-col ${spacious ? "gap-7" : useSafeObjectSpacing ? "gap-4" : "gap-2"}` : ""}`}>
        {customRows ?? (splitOnDesktop ? splitRows : desktopRows)}
      </div>
      <div className={`flex min-h-14 flex-col items-center justify-center sm:hidden ${spacious ? "gap-7" : useSafeObjectSpacing ? "gap-4" : "gap-2"}`}>
        {customRows ?? (splitOnDesktop ? splitRows : mobileRows)}
      </div>
    </div>
  );
}

type AdvancedAdditionRowStage = "moving" | "merging" | "combined" | "counting" | "equation";

function AdvancedAdditionRowScenario({ base, extra, lang, source, onSolved }: { base: number; extra: number; lang: Lang; source: "alyse" | "branch"; onSolved: () => void }) {
  const [moved, setMoved] = useState(0);
  const [stage, setStage] = useState<AdvancedAdditionRowStage>("moving");
  const [busy, setBusy] = useState(false);
  const [countedThrough, setCountedThrough] = useState(0);
  const completionReportedRef = useRef(false);
  const [flyingBanana, setFlyingBanana] = useState<{ left: number; top: number; x: number; y: number; curve: Array<{ x: number; y: number }>; size: number; sourceIndex: number } | null>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const combinedRef = useRef<HTMLDivElement>(null);
  const animationRunRef = useRef(0);
  const soundEnabled = React.useContext(AudioEnabledContext);
  const prefersReducedMotion = usePrefersReducedMotion();
  const total = base + extra;
  const currentTotal = base + moved;
  const remaining = extra - moved;

  const getObjectBounds = (container: HTMLDivElement | null, index: number) => {
    if (!container) return null;
    const matches = Array.from(container.querySelectorAll<HTMLElement>(`[data-advanced-object-index="${index}"]`));
    const match = matches.find((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    return match?.getBoundingClientRect() ?? null;
  };

  useEffect(() => () => {
    animationRunRef.current += 1;
    stopNumberAudio();
  }, []);

  const speakOneValue = async (value: number) => {
    if (soundEnabled && NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(value, lang, COUNTING_STEP_MS, undefined, undefined, value);
    } else {
      await wait(180);
    }
  };

  const addAllBananas = async () => {
    if (busy || stage !== "moving" || remaining <= 0) return;
    const runId = animationRunRef.current + 1;
    animationRunRef.current = runId;
    setBusy(true);
    for (let nextMoved = moved + 1; nextMoved <= extra; nextMoved += 1) {
      if (animationRunRef.current !== runId) return;
      const sourceIndex = extra - nextMoved;
      const destinationIndex = base + nextMoved - 1;
      const sourceBounds = getObjectBounds(sourceRef.current, sourceIndex);
      const destinationBounds = getObjectBounds(destinationRef.current, destinationIndex);
      if (sourceBounds && destinationBounds && !prefersReducedMotion) {
        const size = Math.min(sourceBounds.width, sourceBounds.height);
        const left = sourceBounds.left + (sourceBounds.width / 2) - (size / 2);
        const top = sourceBounds.top + (sourceBounds.height / 2) - (size / 2);
        const x = (destinationBounds.left + (destinationBounds.width / 2) - (size / 2)) - left;
        const y = (destinationBounds.top + (destinationBounds.height / 2) - (size / 2)) - top;
        const controlX = x * 0.52;
        const controlY = Math.min(0, y) - Math.max(100, Math.min(180, Math.abs(x) * 0.22));
        const curve = Array.from({ length: 7 }, (_, curveIndex) => {
          const progress = (curveIndex + 1) / 8;
          const remainingProgress = 1 - progress;
          return {
            x: (2 * remainingProgress * progress * controlX) + (progress * progress * x),
            y: (2 * remainingProgress * progress * controlY) + (progress * progress * y),
          };
        });
        setFlyingBanana({
          left,
          top,
          x,
          y,
          curve,
          size,
          sourceIndex,
        });
        await wait(1200);
      }
      if (animationRunRef.current !== runId) return;
      const nextTotal = base + nextMoved;
      setMoved(nextMoved);
      await wait(prefersReducedMotion ? 0 : 70);
      setFlyingBanana(null);
      await speakOneValue(nextTotal);
      if (animationRunRef.current !== runId) return;
    }

    setStage("merging");
    await wait(prefersReducedMotion ? 100 : 900);
    if (animationRunRef.current !== runId) return;
    setStage("combined");
    setBusy(false);
    window.requestAnimationFrame(() => combinedRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" }));
  };

  const countAllBananas = async () => {
    if (busy || stage !== "combined") return;
    const runId = animationRunRef.current + 1;
    animationRunRef.current = runId;
    stopNumberAudio();
    setBusy(true);
    setCountedThrough(0);
    setStage("counting");
    if (soundEnabled && NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(total, lang, COUNTING_STEP_MS, (value) => {
        if (animationRunRef.current === runId) setCountedThrough(value);
      });
    } else {
      for (let value = 1; value <= total; value += 1) {
        await wait(prefersReducedMotion ? 80 : Math.max(300, COUNTING_STEP_MS));
        if (animationRunRef.current !== runId) return;
        setCountedThrough(value);
      }
    }
    if (animationRunRef.current !== runId) return;
    setCountedThrough(total);
    await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
    if (animationRunRef.current !== runId) return;
    setStage("equation");
    setBusy(false);
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onSolved();
    }
  };

  const resetScenario = () => {
    animationRunRef.current += 1;
    stopNumberAudio();
    setMoved(0);
    setStage("moving");
    setBusy(false);
    setCountedThrough(0);
    setFlyingBanana(null);
  };

  const movingText = source === "alyse"
    ? (lang === "en" ? "Chrys has 8 bananas. Alyse adds 5 more." : "Chrys ada 8 pisang. Alyse tambah 5 lagi.")
    : (lang === "en" ? "Chrys has 7 bananas. Move 8 more into his basket." : "Chrys ada 7 pisang. Pindahkan 8 lagi ke dalam bakulnya.");

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 shadow-[inset_0_0_35px_rgba(34,211,238,.12)] sm:p-7">
      <style>{`@keyframes advancedObjectCurveFlight{0%{transform:translate3d(0,0,0) scale(1);opacity:1}12.5%{transform:translate3d(var(--flight-x-1),var(--flight-y-1),0) scale(1.02)}25%{transform:translate3d(var(--flight-x-2),var(--flight-y-2),0) scale(1.04)}37.5%{transform:translate3d(var(--flight-x-3),var(--flight-y-3),0) scale(1.055)}50%{transform:translate3d(var(--flight-x-4),var(--flight-y-4),0) scale(1.06)}62.5%{transform:translate3d(var(--flight-x-5),var(--flight-y-5),0) scale(1.055)}75%{transform:translate3d(var(--flight-x-6),var(--flight-y-6),0) scale(1.04)}87.5%{transform:translate3d(var(--flight-x-7),var(--flight-y-7),0) scale(1.02)}100%{transform:translate3d(var(--flight-x),var(--flight-y),0) scale(1);opacity:1}}@media(prefers-reduced-motion:reduce){.advanced-object-slot-flight{animation:none!important}}`}</style>
      {flyingBanana && (
        <span
          className="advanced-object-slot-flight pointer-events-none fixed z-[80] grid place-items-center rounded-xl border-2 border-yellow-300 bg-amber-950 shadow-[0_0_20px_rgba(250,204,21,.65)]"
          style={{
            left: flyingBanana.left,
            top: flyingBanana.top,
            width: flyingBanana.size,
            height: flyingBanana.size,
            "--flight-x": `${flyingBanana.x}px`,
            "--flight-y": `${flyingBanana.y}px`,
            "--flight-x-1": `${flyingBanana.curve[0].x}px`,
            "--flight-y-1": `${flyingBanana.curve[0].y}px`,
            "--flight-x-2": `${flyingBanana.curve[1].x}px`,
            "--flight-y-2": `${flyingBanana.curve[1].y}px`,
            "--flight-x-3": `${flyingBanana.curve[2].x}px`,
            "--flight-y-3": `${flyingBanana.curve[2].y}px`,
            "--flight-x-4": `${flyingBanana.curve[3].x}px`,
            "--flight-y-4": `${flyingBanana.curve[3].y}px`,
            "--flight-x-5": `${flyingBanana.curve[4].x}px`,
            "--flight-y-5": `${flyingBanana.curve[4].y}px`,
            "--flight-x-6": `${flyingBanana.curve[5].x}px`,
            "--flight-y-6": `${flyingBanana.curve[5].y}px`,
            "--flight-x-7": `${flyingBanana.curve[6].x}px`,
            "--flight-y-7": `${flyingBanana.curve[6].y}px`,
            animation: "advancedObjectCurveFlight 1200ms linear both",
          } as React.CSSProperties}
          aria-hidden="true"
        >
          <SpriteIcon value={BANANA} className="h-8 w-8" />
        </span>
      )}

      <p className="mx-auto mb-4 max-w-3xl text-center text-xl font-black text-cyan-50" role="status">
        {stage === "moving"
          ? movingText
          : stage === "merging"
            ? source === "branch"
              ? (lang === "en" ? "All the bananas are now in Chrys's basket..." : "Semua pisang kini berada di dalam bakul Chrys...")
              : (lang === "en" ? "The two groups are joining..." : "Dua kumpulan sedang bergabung...")
            : (lang === "en" ? "Count all the bananas together." : "Kira semua pisang sekali.")}
      </p>

      <CyberCounter value={stage === "moving" || stage === "merging" ? currentTotal : total} label={lang === "en" ? "Banana count" : "Kiraan pisang"} celebrate={currentTotal === total} />

      {(stage === "moving" || stage === "merging") && (
        <div className={`mt-6 grid items-stretch gap-4 transition-all duration-700 min-[850px]:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,.85fr)] min-[850px]:items-center ${stage === "merging" ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
          <div ref={destinationRef} className="flex min-h-48 min-w-0 flex-col justify-center rounded-[1.75rem] border-2 border-cyan-400 bg-slate-950/75 p-5 shadow-[inset_0_0_24px_rgba(34,211,238,.10)]">
            <p className="mb-3 text-center text-base font-black uppercase tracking-wide text-cyan-200">{source === "branch" ? (lang === "en" ? `Chrys's basket: ${currentTotal}` : `Bakul Chrys: ${currentTotal}`) : (lang === "en" ? `Chrys: ${currentTotal} bananas` : `Chrys: ${currentTotal} pisang`)}</p>
            {source === "branch" ? (
              <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
                <img src={BASKET_SPRITE} alt={lang === "en" ? "Chrys's basket" : "Bakul Chrys"} className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_12px_rgba(0,0,0,.38)]" />
                <div className="absolute inset-x-[10%] inset-y-[18%] grid place-items-center overflow-hidden py-3">
                  <AdvancedBananaRow count={total} visibleThrough={currentTotal} countedThrough={currentTotal} showCountLabels splitOnDesktop label={lang === "en" ? `${currentTotal} bananas in Chrys's basket` : `${currentTotal} pisang di dalam bakul Chrys`} />
                </div>
              </div>
            ) : (
              <AdvancedBananaRow count={total} visibleThrough={currentTotal} countedThrough={currentTotal} showCountLabels splitOnDesktop label={lang === "en" ? `${currentTotal} bananas with Chrys` : `${currentTotal} pisang dengan Chrys`} />
            )}
          </div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border-2 border-yellow-300 bg-yellow-300 text-3xl font-black text-slate-950 shadow-[0_5px_0_#a16207]" aria-hidden="true">{source === "branch" ? "←" : "+"}</span>
          <div ref={sourceRef} className={`relative flex min-h-48 min-w-0 flex-col justify-center overflow-hidden rounded-[1.75rem] border-2 border-emerald-300 p-5 shadow-[inset_0_0_24px_rgba(52,211,153,.10)] ${source === "branch" ? "min-h-[22rem] bg-slate-950" : "bg-slate-950/75"}`}>
            {source === "branch" && <><img src={forestFloor} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" /><span className="absolute inset-0 bg-slate-950/10" aria-hidden="true" /></>}
            <p className={`relative z-10 mx-auto mb-5 rounded-full px-4 py-2 text-center text-base font-black uppercase tracking-wide ${source === "branch" ? "bg-slate-950/80 text-white shadow-lg" : "text-emerald-200"}`}>
              {source === "alyse"
                ? (lang === "en" ? `Alyse: ${remaining} left` : `Alyse: ${remaining} tinggal`)
                : (lang === "en" ? `Forest floor: ${remaining} bananas left` : `Lantai hutan: ${remaining} pisang tinggal`)}
            </p>
            <div className="relative z-10 rounded-3xl bg-slate-950/25 py-4">
              {remaining > 0 ? <AdvancedBananaRow count={remaining} countedThrough={remaining} showCountLabels hiddenIndex={flyingBanana?.sourceIndex ?? null} splitOnDesktop label={lang === "en" ? `${remaining} bananas on the forest floor` : `${remaining} pisang di lantai hutan`} /> : <div className="grid min-h-14 place-items-center text-3xl font-black text-white">0</div>}
            </div>
          </div>
        </div>
      )}

      {(stage === "combined" || stage === "counting" || stage === "equation") && (
        <div ref={combinedRef} className="mt-5 animate-[fadeIn_.5s_ease-out]">
          <div data-math-cue="equals" className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border-2 border-cyan-200 bg-cyan-400 text-4xl font-black text-slate-950 shadow-[0_5px_0_#164e63]" aria-hidden="true">=</div>
          <div className="rounded-[1.75rem] border-2 border-cyan-300 bg-slate-950/85 px-2 pb-4 pt-6 sm:px-4">
            <p className="mb-4 text-center text-sm font-black uppercase tracking-wide text-cyan-200">{lang === "en" ? "Combined banana row" : "Baris pisang gabungan"}</p>
            <AdvancedBananaRow count={total} countedThrough={countedThrough} showCountLabels={stage === "counting" || stage === "equation"} isCounting={stage === "counting"} label={lang === "en" ? `${total} bananas together` : `${total} pisang sekali`} />
          </div>
        </div>
      )}

      <div className="mt-5 text-center">
        {stage === "moving" && (
          <button type="button" disabled={busy} onClick={() => void addAllBananas()} className="relative rounded-2xl border-2 border-yellow-200 bg-yellow-300 px-8 py-4 text-xl font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-50">
            {source === "branch"
              ? busy
                ? (lang === "en" ? `Moving ${extra} bananas...` : `Memindahkan ${extra} pisang...`)
                : (lang === "en" ? `Move ${extra} bananas into Chrys's basket` : `Pindahkan ${extra} pisang ke dalam bakul Chrys`)
              : busy
                ? (lang === "en" ? `Adding ${extra} bananas...` : `Menambah ${extra} pisang...`)
                : (lang === "en" ? `Add ${extra} bananas` : `Tambah ${extra} pisang`)}
            {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>}
          </button>
        )}
        {stage === "combined" && (
          <button type="button" onClick={() => void countAllBananas()} className="relative rounded-2xl border-2 border-cyan-200 bg-cyan-600 px-7 py-4 text-xl font-black text-white shadow-[0_6px_0_#164e63] active:translate-y-1">
            {lang === "en" ? "Start counting" : "Mula mengira"}
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>
          </button>
        )}
        {stage === "counting" && <p className="text-xl font-black text-yellow-200">{lang === "en" ? `Counting: ${countedThrough}` : `Mengira: ${countedThrough}`}</p>}
        {stage === "equation" && (
          <div>
            <p className="text-4xl font-black text-yellow-200 sm:text-5xl" style={getNumberTextStyle(total)}>{base} + {extra} = {total}</p>
            <button type="button" onClick={resetScenario} className="relative mx-auto mt-5 rounded-2xl border-2 border-cyan-200 bg-cyan-600 px-7 py-3 text-lg font-black text-white shadow-[0_5px_0_#164e63] active:translate-y-1">
              {lang === "en" ? "Count again" : "Kira lagi"}
              <span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type AdvancedCookieAdditionStage = "countFirst" | "countSecond" | "readyJoin" | "joining" | "countTotal" | "done";

function AdvancedCookieAdditionScenario({ lang, onSolved }: { lang: Lang; onSolved: () => void }) {
  const cookie = String.fromCodePoint(0x1f36a);
  const [stage, setStage] = useState<AdvancedCookieAdditionStage>("countFirst");
  const [firstCount, setFirstCount] = useState(0);
  const [secondCount, setSecondCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const completionReportedRef = useRef(false);
  const combinedRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const soundEnabled = React.useContext(AudioEnabledContext);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const countRow = async (count: number, update: (value: number) => void, nextStage: AdvancedCookieAdditionStage) => {
    if (busy) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setBusy(true);
    update(0);
    if (soundEnabled && NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) update(value);
      });
    } else {
      for (let value = 1; value <= count; value += 1) {
        await wait(prefersReducedMotion ? 80 : Math.max(420, COUNTING_STEP_MS));
        if (runRef.current !== runId) return;
        update(value);
      }
    }
    if (runRef.current !== runId) return;
    update(count);
    await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
    if (runRef.current !== runId) return;
    setStage(nextStage);
    if (nextStage === "readyJoin") await speakMathCue("equals", lang);
    if (runRef.current !== runId) return;
    setBusy(false);
  };

  const joinTrays = async () => {
    if (busy || stage !== "readyJoin") return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setBusy(true);
    setStage("joining");
    await wait(prefersReducedMotion ? 120 : 1450);
    if (runRef.current !== runId) return;
    setStage("countTotal");
    setTotalCount(0);
    window.requestAnimationFrame(() => combinedRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" }));
    await wait(prefersReducedMotion ? 80 : 620);
    if (runRef.current !== runId) return;
    if (soundEnabled && NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(13, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) setTotalCount(value);
      });
    } else {
      for (let value = 1; value <= 13; value += 1) {
        await wait(prefersReducedMotion ? 80 : Math.max(420, COUNTING_STEP_MS));
        if (runRef.current !== runId) return;
        setTotalCount(value);
      }
    }
    if (runRef.current !== runId) return;
    setTotalCount(13);
    await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
    if (runRef.current !== runId) return;
    setStage("done");
    setBusy(false);
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onSolved();
    }
  };

  const resetMethod = () => {
    runRef.current += 1;
    stopNumberAudio();
    setFirstCount(0);
    setSecondCount(0);
    setTotalCount(0);
    setBusy(false);
    setStage("countFirst");
  };

  const trayClass = "flex min-h-52 min-w-0 flex-col justify-center rounded-[1.75rem] border-2 bg-slate-950/80 p-5 shadow-[inset_0_0_26px_rgba(34,211,238,.10)]";

  const firstFinished = stage !== "countFirst";
  const secondVisible = stage !== "countFirst";
  const secondFinished = !["countFirst", "countSecond"].includes(stage);
  const showJoinArea = ["readyJoin", "joining", "countTotal", "done"].includes(stage);
  const showingCombinedBox = ["countTotal", "done"].includes(stage);

  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 sm:p-7">
      <style>{`@keyframes cookieTrayJoinLeft{0%{transform:translate3d(0,0,0) scale(1);opacity:1}72%{transform:translate3d(var(--cookie-join-x),var(--cookie-join-y),0) scale(1.1);opacity:1}100%{transform:translate3d(var(--cookie-join-x),var(--cookie-join-y),0) scale(.98);opacity:0}}@keyframes cookieTrayJoinRight{0%{transform:translate3d(0,0,0) scale(1);opacity:1}72%{transform:translate3d(var(--cookie-join-x),var(--cookie-join-y),0) scale(1.1);opacity:1}100%{transform:translate3d(var(--cookie-join-x),var(--cookie-join-y),0) scale(.98);opacity:0}}@keyframes cookieTotalGroupPop{0%{transform:scale(.72) translateY(1.25rem);opacity:0}62%{transform:scale(1.06) translateY(0);opacity:1}100%{transform:scale(1);opacity:1}}.cookie-tray-join-left{--cookie-join-x:48%;--cookie-join-y:3rem;animation:cookieTrayJoinLeft 1450ms cubic-bezier(.2,.72,.24,1) both;transform-origin:center;will-change:transform,opacity}.cookie-tray-join-right{--cookie-join-x:-48%;--cookie-join-y:3rem;animation:cookieTrayJoinRight 1450ms cubic-bezier(.2,.72,.24,1) both;transform-origin:center;will-change:transform,opacity}.cookie-total-group-pop{animation:cookieTotalGroupPop 620ms cubic-bezier(.18,.85,.28,1.18) both;transform-origin:center;will-change:transform,opacity}@media(max-width:767px){.cookie-tray-join-left{--cookie-join-x:0;--cookie-join-y:42%;transform-origin:center bottom}.cookie-tray-join-right{--cookie-join-x:0;--cookie-join-y:-42%;transform-origin:center top}}@media(prefers-reduced-motion:reduce){.cookie-tray-join-left,.cookie-tray-join-right,.cookie-total-group-pop{animation:none}}`}</style>
      <h4 className="text-center text-2xl font-black text-yellow-200">{lang === "en" ? "Now count the two parts" : "Sekarang kira dua bahagian"}</h4>
      <div className="mx-auto mt-6 grid max-w-6xl items-center gap-4 md:grid-cols-[minmax(0,1.18fr)_auto_minmax(0,.82fr)]">
        <div className={`${trayClass} border-cyan-400`}>
          <p className="mb-5 text-center text-lg font-black text-cyan-100">{lang === "en" ? "Alyse's tray at the beginning" : "Dulang Alyse pada awalnya"}</p>
          <AdvancedBananaRow count={8} countedThrough={firstCount} showCountLabels isCounting={stage === "countFirst" && busy} emoji={cookie} spacious />
          {!firstFinished && <button type="button" disabled={busy} onClick={() => void countRow(8, setFirstCount, "countSecond")} className="relative mx-auto mt-5 rounded-2xl border-2 border-cyan-200 bg-cyan-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#164e63]">{busy ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count 8 cookies" : "Kira 8 biskut")}<span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>}
        </div>
        <span data-math-cue="plus" className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 text-4xl font-black transition-all duration-500 ${secondVisible ? "scale-100 border-yellow-300 bg-yellow-300 text-slate-950 opacity-100 shadow-[0_5px_0_#a16207]" : "scale-75 border-slate-700 bg-slate-900 text-slate-700 opacity-30"}`} aria-hidden="true">+</span>
        <div className={`${trayClass} border-emerald-300 transition-all duration-500 ${secondVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-30"}`}>
          <p className="mb-5 text-center text-lg font-black text-emerald-100">{lang === "en" ? "After Chrys gives 5 cookies" : "Selepas Chrys memberi 5 biskut"}</p>
          <AdvancedBananaRow count={5} countedThrough={secondCount} showCountLabels isCounting={stage === "countSecond" && busy} emoji={cookie} rowPattern={[3, 2]} spacious />
          {stage === "countSecond" && <button type="button" disabled={busy} onClick={() => void countRow(5, setSecondCount, "readyJoin")} className="relative mx-auto mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#065f46]">{busy ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count 5 cookies" : "Kira 5 biskut")}<span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>}
          {secondFinished && <p className="mt-4 text-center text-3xl font-black text-emerald-200">5</p>}
        </div>
      </div>

      {showJoinArea && (
        <div className="mt-7 border-t-2 border-cyan-700 pt-6">
          <div data-math-cue="equals" className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border-2 border-cyan-200 bg-cyan-400 text-4xl font-black text-slate-950 shadow-[0_5px_0_#164e63]" aria-hidden="true">=</div>
          {(stage === "readyJoin" || stage === "joining") && (
            <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
              <div className={`${trayClass} border-cyan-400 ${stage === "joining" ? "cookie-tray-join-left" : ""}`}><AdvancedBananaRow count={8} countedThrough={8} showCountLabels emoji={cookie} spacious /></div>
              <div className={`${trayClass} border-emerald-300 ${stage === "joining" ? "cookie-tray-join-right" : ""}`}><AdvancedBananaRow count={5} countedThrough={5} showCountLabels emoji={cookie} rowPattern={[3, 2]} spacious /></div>
            </div>
          )}
          {stage === "readyJoin" && <button type="button" onClick={() => void joinTrays()} className="relative mx-auto mt-5 flex min-h-16 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-yellow-300 px-8 text-xl font-black text-slate-950 shadow-[0_6px_0_#a16207]">{lang === "en" ? "Join the two trays" : "Gabungkan dua dulang"}<span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>}
          {showingCombinedBox && (
            <div ref={combinedRef} className="comparison-result-reveal mx-auto max-w-5xl rounded-[1.75rem] border-2 border-yellow-300 bg-slate-950/90 p-6 shadow-[0_0_28px_rgba(250,204,21,.16)]">
              <p className="mb-5 text-center text-xl font-black text-yellow-200">{lang === "en" ? "Total number of cookies" : "Jumlah biskut"}</p>
              <div className="cookie-total-group-pop">
                  <AdvancedBananaRow count={13} countedThrough={totalCount} showCountLabels isCounting={stage === "countTotal"} rowPattern={[5, 5, 3]} emoji={cookie} largeObjects spacious />
                  <p className="mt-5 text-center text-2xl font-black text-cyan-100">{stage === "done" ? (lang === "en" ? "Total: 13 cookies" : "Jumlah: 13 biskut") : (lang === "en" ? `Counting: ${totalCount}` : `Mengira: ${totalCount}`)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "done" && (
        <div className="mt-6 text-center">
          <p className="text-5xl font-black text-yellow-200">8 + 5 = 13</p>
          <button type="button" onClick={resetMethod} className="relative mx-auto mt-5 rounded-2xl border-2 border-cyan-200 bg-cyan-600 px-7 py-3 text-lg font-black text-white shadow-[0_5px_0_#164e63]">{lang === "en" ? "Count again" : "Kira lagi"}<span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button>
        </div>
      )}
    </div>
  );
}

type AdvancedCompareChoice = "left" | "right" | "same" | "different" | ">" | "<" | "=";
type AdvancedCompareObject = "apple" | "fish" | "car" | "cookie" | "coconut" | "mushroom";

type AdvancedCompareQuestion = {
  id: string;
  tier: "visual" | "digits";
  kind: "more" | "symbol" | "same";
  a: number;
  b: number;
  object?: AdvancedCompareObject;
  options: AdvancedCompareChoice[];
  answer: AdvancedCompareChoice;
};

const ADVANCED_COMPARE_OBJECTS: Record<AdvancedCompareObject, { emoji: string; en: [string, string]; ms: string }> = {
  apple: { emoji: "🍎", en: ["apple", "apples"], ms: "epal" },
  fish: { emoji: "🐟", en: ["fish", "fish"], ms: "ikan" },
  car: { emoji: "🚗", en: ["car", "cars"], ms: "kereta" },
  cookie: { emoji: "🍪", en: ["cookie", "cookies"], ms: "biskut" },
  coconut: { emoji: "🥥", en: ["coconut", "coconuts"], ms: "kelapa" },
  mushroom: { emoji: "🍄", en: ["mushroom", "mushrooms"], ms: "cendawan" },
};

const advancedCompareBiggerQuestions: AdvancedCompareQuestion[] = [
  { id: "ac-visual-more-apples", tier: "visual", kind: "more", a: 8, b: 3, object: "apple", options: ["left", "right"], answer: "left" },
  { id: "ac-visual-symbol-fish", tier: "visual", kind: "symbol", a: 7, b: 6, object: "fish", options: [">", "<"], answer: ">" },
  { id: "ac-visual-more-cars", tier: "visual", kind: "more", a: 5, b: 12, object: "car", options: ["left", "right"], answer: "right" },
  { id: "ac-visual-symbol-cookies", tier: "visual", kind: "symbol", a: 4, b: 4, object: "cookie", options: [">", "<", "="], answer: "=" },
  { id: "ac-visual-same-coconuts", tier: "visual", kind: "same", a: 6, b: 6, object: "coconut", options: ["same", "different"], answer: "same" },
  { id: "ac-visual-more-mushrooms", tier: "visual", kind: "more", a: 9, b: 2, object: "mushroom", options: ["left", "right"], answer: "left" },
  { id: "ac-digits-more-teens", tier: "digits", kind: "more", a: 14, b: 11, options: ["left", "right"], answer: "left" },
  { id: "ac-digits-symbol-cross-ten", tier: "digits", kind: "symbol", a: 8, b: 14, options: [">", "<"], answer: "<" },
  { id: "ac-digits-more-close", tier: "digits", kind: "more", a: 19, b: 20, options: ["left", "right"], answer: "right" },
  { id: "ac-digits-symbol-equal", tier: "digits", kind: "symbol", a: 12, b: 12, options: [">", "<", "="], answer: "=" },
  { id: "ac-digits-same", tier: "digits", kind: "same", a: 7, b: 7, options: ["same", "different"], answer: "same" },
  { id: "ac-digits-symbol-teen", tier: "digits", kind: "symbol", a: 17, b: 15, options: [">", "<"], answer: ">" },
];

function AdvancedComparePile({
  count,
  object,
  lang,
  side,
  visibleCount,
  isCounting,
}: {
  count: number;
  object: AdvancedCompareObject;
  lang: Lang;
  side: "left" | "right";
  visibleCount: number;
  isCounting: boolean;
}) {
  const item = ADVANCED_COMPARE_OBJECTS[object];
  const word = lang === "en" ? (count === 1 ? item.en[0] : item.en[1]) : item.ms;
  const objectTile = (index: number) => (
        <span
          key={index}
          className={`relative grid shrink-0 place-items-center rounded-xl border-2 text-2xl shadow-[inset_0_0_12px_rgba(34,211,238,.16)] transition-colors sm:text-4xl ${object === "coconut" ? "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20" : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"} ${
            index < visibleCount
              ? index === visibleCount - 1 && isCounting
              ? "z-10 scale-105 border-yellow-200 bg-cyan-950 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]"
                : "border-cyan-400 bg-cyan-950"
              : "border-cyan-900 bg-slate-900"
          }`}
          aria-hidden="true"
        >
          {index < visibleCount && (
            <span className={`absolute -top-3 left-1/2 grid h-7 min-w-7 -translate-x-1/2 place-items-center rounded-full px-1 text-sm font-black ${
              index === visibleCount - 1 && isCounting ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"
            }`}>{index + 1}</span>
          )}
          <SpriteIcon
            value={item.emoji}
            className={`h-11 w-11 drop-shadow-md sm:h-14 sm:w-14 ${object === "coconut" ? "translate-y-1.5" : ""}`}
            fallbackClassName="text-2xl sm:text-4xl"
          />
        </span>
  );
  const objectGap = object === "apple" ? "gap-5 sm:gap-6" : "gap-4 sm:gap-5";
  const centeredRows = (perRow: number, className: string) => (
    <div className={`${className} min-h-48 flex-col justify-center ${objectGap}`}>
      {Array.from({ length: Math.ceil(count / perRow) }, (_, rowIndex) => {
        const rowStart = rowIndex * perRow;
        const rowCount = Math.min(perRow, count - rowStart);
        return (
          <div key={rowIndex} className={`flex justify-center ${objectGap}`}>
            {Array.from({ length: rowCount }, (_, offset) => objectTile(rowStart + offset))}
          </div>
        );
      })}
    </div>
  );
  return (
    <div role="img" aria-label={lang === "en" ? `${count} ${word} in the ${side} pile` : `${count} ${word} di kumpulan ${side === "left" ? "kiri" : "kanan"}`} className="rounded-3xl border-2 border-cyan-700 bg-slate-950/80 p-6 sm:p-8">
      {centeredRows(3, "flex sm:hidden")}
      {centeredRows(4, "hidden sm:flex")}
    </div>
  );
}

function ComparisonSymbolIntroduction({ lang, symbol }: { lang: Lang; symbol: ">" | "<" }) {
  const [showSides, setShowSides] = useState(false);
  const isGreater = symbol === ">";
  const openX = isGreater ? 270 : 370;
  const pointX = isGreater ? 370 : 270;
  const openLabelX = isGreater ? 95 : 395;
  const pointLabelX = isGreater ? 395 : 95;
  const symbolName = lang === "en"
    ? (isGreater ? "greater-than" : "less-than")
    : (isGreater ? "lebih besar daripada" : "lebih kecil daripada");
  const symbolMeaning = lang === "en" ? (isGreater ? "greater than" : "less than") : symbolName;

  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/80 to-emerald-950/70 p-5 text-center shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-7">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-4">
        <img src={chrysThinking} alt="Chrys teaching" className="h-24 w-24 object-contain sm:h-28 sm:w-28" />
        <div className="rounded-3xl border-2 border-cyan-300 bg-slate-950/85 px-5 py-4 text-left shadow-[0_5px_0_#164e63]">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
            {lang === "en" ? `Meet the ${symbolName} symbol` : `Kenali simbol ${symbolName}`}
          </p>
          <p className="mt-1 text-xl font-black text-cyan-50 sm:text-2xl">
            {lang === "en" ? `The ${symbol} sign means ${symbolMeaning}.` : `Tanda ${symbol} bermaksud ${symbolMeaning}.`}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-3xl overflow-hidden rounded-[2rem] border-2 border-cyan-500/70 bg-slate-950/90 p-2 shadow-[inset_0_0_32px_rgba(34,211,238,.1)] sm:p-4">
        <svg viewBox="0 0 640 320" role="img" aria-label={lang === "en" ? `The open side and point side of the ${symbol} symbol` : `Bahagian terbuka dan bahagian runcing simbol ${symbol}`} className="mx-auto h-auto w-full max-w-2xl">
          <defs>
            <filter id={`comparison-glow-${isGreater ? "greater" : "less"}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <marker id={`open-arrow-${isGreater ? "greater" : "less"}`} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6ee7b7" />
            </marker>
            <marker id={`point-arrow-${isGreater ? "greater" : "less"}`} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#67e8f9" />
            </marker>
          </defs>

          <text x="320" y="166" textAnchor="middle" dominantBaseline="middle" fill="#fde68a" fontSize="190" fontWeight="900" fontFamily="Nunito, sans-serif" filter={`url(#comparison-glow-${isGreater ? "greater" : "less"})`}>
            {symbol}
          </text>

          {showSides && (
            <g className="comparison-result-reveal">
              <ellipse cx={openX} cy="152" rx="38" ry="72" fill="rgba(16,185,129,.04)" stroke="#6ee7b7" strokeWidth="3" />
              <circle cx={pointX} cy="152" r="30" fill="rgba(6,182,212,.05)" stroke="#67e8f9" strokeWidth="3" />

              <rect x={openLabelX} y="12" width="150" height="48" rx="20" fill="#064e3b" stroke="#6ee7b7" strokeWidth="3" />
              <text x={openLabelX + 75} y="43" textAnchor="middle" fill="#d1fae5" fontSize="20" fontWeight="900" fontFamily="Nunito, sans-serif">
                {lang === "en" ? "OPEN SIDE" : "BAHAGIAN TERBUKA"}
              </text>
              <line x1={openLabelX + 75} y1="62" x2={openX} y2="92" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" markerEnd={`url(#open-arrow-${isGreater ? "greater" : "less"})`} />

              <rect x={pointLabelX} y="260" width="150" height="48" rx="20" fill="#164e63" stroke="#67e8f9" strokeWidth="3" />
              <text x={pointLabelX + 75} y="291" textAnchor="middle" fill="#cffafe" fontSize="20" fontWeight="900" fontFamily="Nunito, sans-serif">
                {lang === "en" ? "POINT SIDE" : "BAHAGIAN RUNCING"}
              </text>
              <line x1={pointLabelX + 75} y1="258" x2={pointX} y2="182" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" markerEnd={`url(#point-arrow-${isGreater ? "greater" : "less"})`} />
            </g>
          )}
        </svg>
      </div>

      <button type="button" onClick={() => setShowSides((current) => !current)} aria-expanded={showSides} className="mx-auto mt-5 flex min-h-14 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 text-lg font-black text-slate-950 shadow-[0_5px_0_#a16207] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-y-1 active:shadow-[0_2px_0_#a16207]">
        {showSides
          ? (lang === "en" ? "Hide the two sides" : "Sembunyikan dua bahagian")
          : (lang === "en" ? "Show the open and point sides" : "Tunjukkan bahagian terbuka dan runcing")}
      </button>

      {showSides && (
        <div className="comparison-result-reveal mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-2">
          <p className="rounded-2xl border-2 border-emerald-300 bg-emerald-950/80 px-4 py-3 font-black text-emerald-100">
            {lang === "en" ? "The OPEN side faces the bigger number." : "Bahagian TERBUKA menghadap nombor yang lebih besar."}
          </p>
          <p className="rounded-2xl border-2 border-cyan-300 bg-cyan-950/80 px-4 py-3 font-black text-cyan-100">
            {lang === "en" ? "The POINT side faces the smaller number." : "Bahagian RUNCING menghadap nombor yang lebih kecil."}
          </p>
        </div>
      )}
    </div>
  );
}

function GreaterThanSymbolTeaching({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/80 to-emerald-950/70 p-5 text-center shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-7">
      <p className="text-xl font-black text-cyan-50">
        {lang === "en" ? "The symbol > means greater than." : "Simbol > bermaksud lebih besar daripada."}
      </p>
      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="rounded-3xl border-4 border-emerald-300 bg-emerald-950/80 p-4 shadow-[0_6px_0_#065f46]">
          <p className="text-6xl font-black text-yellow-200 sm:text-7xl" style={getNumberTextStyle(8)}>8</p>
          <p className="mt-2 text-lg font-black uppercase text-emerald-200 sm:text-xl">{lang === "en" ? "Bigger" : "Lebih besar"}</p>
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-[2rem] border-4 border-yellow-300 bg-slate-900 text-7xl font-black text-yellow-200 shadow-[0_7px_0_#a16207,0_0_24px_rgba(250,204,21,.24)]" aria-label={lang === "en" ? "Greater-than symbol" : "Simbol lebih besar daripada"}>
          &gt;
        </div>
        <div className="rounded-3xl border-4 border-cyan-400 bg-slate-950/85 p-4 shadow-[0_6px_0_#164e63]">
          <p className="text-6xl font-black text-cyan-100 sm:text-7xl" style={getNumberTextStyle(3)}>3</p>
          <p className="mt-2 text-lg font-black uppercase text-cyan-200 sm:text-xl">{lang === "en" ? "Smaller" : "Lebih kecil"}</p>
        </div>
      </div>
      <div className="mx-auto mt-5 max-w-3xl text-center">
        <p className="text-xl font-black text-yellow-200 sm:text-2xl">
          {lang === "en" ? "8 is greater than 3." : "8 lebih besar daripada 3."}
        </p>
        <p className="mt-1 text-lg font-black text-cyan-100 sm:text-xl">
          {lang === "en" ? "We write this as 8 > 3." : "Kita tulis sebagai 8 > 3."}
        </p>
      </div>
      <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
        <p className="rounded-2xl border-2 border-emerald-300 bg-emerald-950/70 px-4 py-3 font-black text-emerald-100">
          {lang === "en" ? "The OPEN side faces the bigger number." : "Bahagian TERBUKA menghadap nombor yang lebih besar."}
        </p>
        <p className="rounded-2xl border-2 border-cyan-400 bg-cyan-950/70 px-4 py-3 font-black text-cyan-100">
          {lang === "en" ? "The POINT faces the smaller number." : "Bahagian RUNCING menghadap nombor yang lebih kecil."}
        </p>
      </div>
    </div>
  );
}

function EqualsSymbolTeaching({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/80 to-emerald-950/70 p-5 text-center shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-7">
      <p className="text-xl font-black text-cyan-50 sm:text-2xl">
        {lang === "en" ? "The symbol = means equals to." : "Simbol = bermaksud sama dengan."}
      </p>
      <p className="mt-2 text-lg font-black text-cyan-100 sm:text-xl">
        {lang === "en" ? "Use it when both sides have the same value." : "Gunakannya apabila kedua-dua belah mempunyai nilai yang sama."}
      </p>
      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="rounded-3xl border-4 border-cyan-300 bg-slate-950/85 p-4 shadow-[0_6px_0_#164e63]">
          <p className="text-6xl font-black text-yellow-200 sm:text-7xl" style={getNumberTextStyle(5)}>5</p>
          <p className="mt-2 text-lg font-black uppercase text-cyan-100 sm:text-xl">{lang === "en" ? "Same value" : "Nilai sama"}</p>
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-[2rem] border-4 border-yellow-300 bg-slate-900 text-7xl font-black text-yellow-200 shadow-[0_7px_0_#a16207,0_0_24px_rgba(250,204,21,.24)]" aria-label={lang === "en" ? "Equals symbol" : "Simbol sama dengan"}>
          =
        </div>
        <div className="rounded-3xl border-4 border-emerald-300 bg-emerald-950/80 p-4 shadow-[0_6px_0_#065f46]">
          <p className="text-6xl font-black text-yellow-200 sm:text-7xl" style={getNumberTextStyle(5)}>5</p>
          <p className="mt-2 text-lg font-black uppercase text-emerald-100 sm:text-xl">{lang === "en" ? "Same value" : "Nilai sama"}</p>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border-2 border-yellow-300 bg-slate-950/80 px-5 py-4">
        <p className="text-2xl font-black text-yellow-200 sm:text-3xl" style={NUMBER_TEXT_STYLE}>5 = 5</p>
        <p className="mt-2 text-lg font-black text-cyan-50 sm:text-xl">
          {lang === "en" ? "Five equals to five. Both sides match." : "Lima sama dengan lima. Kedua-dua belah sepadan."}
        </p>
      </div>
    </div>
  );
}

function AdvancedCompareVisual({ a, b, object, lang, symbol, stagedReveal = false }: { a: number; b: number; object: AdvancedCompareObject; lang: Lang; symbol?: ">" | "<" | "="; stagedReveal?: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleCounts, setVisibleCounts] = useState({ left: 0, right: 0 });
  const [completedSides, setCompletedSides] = useState({ left: false, right: false });
  const [countingSide, setCountingSide] = useState<"left" | "right" | null>(null);
  const [revealStage, setRevealStage] = useState<0 | 1 | 2 | 3>(stagedReveal ? 0 : 3);
  const [comparisonAudioPlaying, setComparisonAudioPlaying] = useState(false);
  const countingRunRef = useRef(0);
  const comparisonRevealedRef = useRef(!stagedReveal);
  const item = ADVANCED_COMPARE_OBJECTS[object];
  const bothPilesCounted = completedSides.left && completedSides.right;
  const leftObjectName = lang === "en" ? (a === 1 ? item.en[0] : item.en[1]) : item.ms;
  const rightObjectName = lang === "en" ? (b === 1 ? item.en[0] : item.en[1]) : item.ms;

  useEffect(() => {
    countingRunRef.current += 1;
    setVisibleCounts({ left: 0, right: 0 });
    setCompletedSides({ left: false, right: false });
    setCountingSide(null);
    setRevealStage(stagedReveal ? 0 : 2);
    setComparisonAudioPlaying(false);
    comparisonRevealedRef.current = !stagedReveal;

    return () => {
      countingRunRef.current += 1;
      stopNumberAudio();
    };
  }, [a, b, lang, object, stagedReveal, symbol]);

  useEffect(() => {
    if (!stagedReveal) {
      comparisonRevealedRef.current = true;
      setRevealStage(3);
      return;
    }
    if (comparisonRevealedRef.current) {
      setRevealStage(3);
      return;
    }
    if (!bothPilesCounted || countingSide !== null) {
      setRevealStage(0);
      return;
    }
    let cancelled = false;
    const revealComparison = async () => {
      setRevealStage(1);
      await wait(prefersReducedMotion ? 100 : 2000);
      if (cancelled) return;
      setRevealStage(2);
      await wait(prefersReducedMotion ? 100 : 1000);
      if (cancelled) return;
      comparisonRevealedRef.current = true;
      setRevealStage(3);
      if (symbol) {
        setComparisonAudioPlaying(true);
        await speakComparisonResultSentence(a, b, symbol, lang);
        if (!cancelled) setComparisonAudioPlaying(false);
      }
    };
    void revealComparison();
    return () => {
      cancelled = true;
    };
  }, [a, b, bothPilesCounted, countingSide, lang, prefersReducedMotion, stagedReveal, symbol]);

  const replayComparison = async () => {
    if (!symbol || comparisonAudioPlaying) return;
    setComparisonAudioPlaying(true);
    await speakComparisonSentence(a, b, symbol, lang, item.emoji, item.emoji);
    setComparisonAudioPlaying(false);
  };

  const countPile = async (side: "left" | "right", count: number) => {
    if (countingSide !== null) return;
    stopNumberAudio();
    setComparisonAudioPlaying(false);
    const runId = countingRunRef.current + 1;
    countingRunRef.current = runId;
    setCountingSide(side);
    setVisibleCounts((current) => ({ ...current, [side]: 0 }));
    setCompletedSides((current) => ({ ...current, [side]: false }));
    const reveal = (value: number) => {
      if (countingRunRef.current === runId) {
        setVisibleCounts((current) => ({ ...current, [side]: value }));
      }
    };

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, reveal);
    } else {
      for (let value = 1; value <= count; value += 1) {
        if (countingRunRef.current !== runId) return;
        reveal(value);
        await wait(value === count ? COUNT_TOTAL_REVEAL_DELAY_MS : COUNTING_STEP_MS);
      }
    }
    if (countingRunRef.current !== runId) return;
    setVisibleCounts((current) => ({ ...current, [side]: count }));
    if (NUMBER_AUDIO_ENABLED && !audioMuted) await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
    if (countingRunRef.current !== runId) return;
    setCompletedSides((current) => ({ ...current, [side]: true }));
    await speakRecordedBananaTotal(count, lang, item.emoji);
    if (countingRunRef.current !== runId) return;
    setCountingSide(null);
  };

  const pileSection = (side: "left" | "right", count: number) => {
    const isCounting = countingSide === side;
    const isComplete = completedSides[side];
    const sideLabel = lang === "en"
      ? `Pile ${side === "left" ? "A" : "B"}`
      : `Kumpulan ${side === "left" ? "A" : "B"}`;
    const totalLabel = lang === "en"
      ? `Total: ${count} ${count === 1 ? item.en[0] : item.en[1]}`
      : `Jumlah: ${count} ${item.ms}`;
    return (
      <section className="rounded-[1.75rem] border-2 border-cyan-300 bg-cyan-950/70 p-4">
        <h4 className="mb-3 text-center text-lg font-black text-cyan-100">{sideLabel}</h4>
        <AdvancedComparePile count={count} object={object} lang={lang} side={side} visibleCount={visibleCounts[side]} isCounting={isCounting} />
        {isComplete && (
          <p className="mt-3 rounded-2xl border-2 border-emerald-300 bg-emerald-950 px-4 py-2 text-center text-lg font-black text-emerald-100">{totalLabel}</p>
        )}
        <button
          type="button"
          onClick={() => void countPile(side, count)}
          disabled={countingSide !== null}
          className="relative mx-auto mt-4 flex min-h-12 items-center justify-center rounded-2xl border-2 border-cyan-300 bg-blue-600 px-5 text-base font-black text-white shadow-[0_5px_0_#1e3a8a] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={lang === "en" ? `Count the ${side} pile` : `Kira kumpulan ${side === "left" ? "kiri" : "kanan"}`}
        >
          {isCounting
            ? (lang === "en" ? "Counting..." : "Mengira...")
            : isComplete
              ? (lang === "en" ? "Count again" : "Kira lagi")
              : (lang === "en" ? `Count ${side} pile` : `Kira kumpulan ${side === "left" ? "kiri" : "kanan"}`)}
          {!isCounting && <span className="pointer-events-none absolute -right-3 -top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-amber-700 shadow-sm" aria-hidden="true"><PointerIcon /></span>}
        </button>
      </section>
    );
  };

  return (
    <div>
      <div className={`grid gap-3 ${symbol ? "sm:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] sm:items-center" : "sm:grid-cols-2"}`}>
        {pileSection("left", a)}
        {symbol && (
          <div className="grid min-h-20 place-items-center self-center justify-self-center" aria-live="polite">
            {revealStage >= 2 && (
              <div className={`relative grid h-20 w-20 place-items-center rounded-3xl border-4 border-yellow-300 bg-slate-900 text-6xl font-black text-yellow-200 shadow-[0_6px_0_#a16207,0_0_28px_rgba(250,204,21,.55)] ${stagedReveal ? "comparison-symbol-pop" : ""}`} aria-label={lang === "en" ? `Comparison sign ${symbol}` : `Tanda banding ${symbol}`}>
                {symbol}
                {stagedReveal && <span className="comparison-symbol-ring pointer-events-none absolute inset-[-0.8rem] rounded-[2rem] border-4 border-yellow-300/70" aria-hidden="true" />}
              </div>
            )}
          </div>
        )}
        {pileSection("right", b)}
      </div>
      {stagedReveal && revealStage >= 1 && (
        <p className="comparison-explanation-bar-reveal mx-auto mt-5 max-w-3xl rounded-2xl border-2 border-emerald-300 bg-emerald-950 px-5 py-4 text-center text-xl font-black text-emerald-100 sm:text-2xl" aria-live="polite">
          {lang === "en" ? symbol === "<" ? (
            <>{a} {leftObjectName} is <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">LESS</span> than {b} {rightObjectName}.</>
          ) : symbol === "=" ? (
            <>{a} {leftObjectName} <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">EQUALS TO</span> {b} {rightObjectName}.</>
          ) : (
            <>{a} {leftObjectName} is <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">MORE</span> than {b} {rightObjectName}.</>
          ) : symbol === "<" ? (
            <>{a} {leftObjectName} adalah <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">LEBIH SEDIKIT</span> daripada {b} {rightObjectName}.</>
          ) : symbol === "=" ? (
            <>{a} {leftObjectName} adalah <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">SAMA DENGAN</span> {b} {rightObjectName}.</>
          ) : (
            <>{a} {leftObjectName} adalah <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">LEBIH BANYAK</span> daripada {b} {rightObjectName}.</>
          )}
        </p>
      )}
      {stagedReveal && revealStage >= 3 && (
        <div className="mx-auto mt-3 grid max-w-3xl gap-3 text-center">
          <p className="comparison-explanation-bar-reveal rounded-2xl border-2 border-cyan-300 bg-cyan-950 px-5 py-4 text-xl font-black text-cyan-50 sm:text-2xl" aria-live="polite">
            {lang === "en" ? symbol === "=" ? (
              <>{a} <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">equals to</span> {b}.</>
            ) : (
              <>{a} is <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">{symbol === ">" ? "greater than" : "less than"}</span> {b}.</>
            ) : (
              <>{a} adalah <span className="rounded-xl bg-yellow-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#a16207]">{symbol === ">" ? "lebih besar daripada" : symbol === "<" ? "lebih kecil daripada" : "sama dengan"}</span> {b}.</>
            )}
          </p>
          <div className="comparison-explanation-bar-reveal rounded-2xl border-2 border-cyan-300 bg-cyan-950 px-5 py-4">
            <p className="text-2xl font-black text-cyan-50 sm:text-3xl" aria-live="polite">
              {a} <span className="inline-grid min-w-14 place-items-center rounded-xl bg-yellow-300 px-3 py-1 text-3xl text-slate-950 shadow-[0_3px_0_#a16207]">{symbol}</span> {b}
            </p>
            <button
              type="button"
              onClick={() => void replayComparison()}
              disabled={comparisonAudioPlaying}
              className="mx-auto mt-4 inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-cyan-200 bg-cyan-500 px-4 font-black text-slate-950 shadow-[0_5px_0_#0e7490] transition hover:bg-cyan-400 active:translate-y-1 disabled:cursor-wait disabled:opacity-60"
            >
              <SpeakerIcon />
              {comparisonAudioPlaying
                ? (lang === "en" ? "Playing..." : "Sedang dimainkan...")
                : (lang === "en" ? "Hear again" : "Dengar sekali lagi")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type AdvancedStoryObject = AdvancedCompareObject | "banana";

function AdvancedStoryObjectIcon({ object }: { object: AdvancedStoryObject }) {
  if (object === "banana") return <SpriteIcon value={BANANA} className="h-11 w-11 sm:h-12 sm:w-12" />;
  return <span className="text-4xl sm:text-5xl" aria-hidden="true">{ADVANCED_COMPARE_OBJECTS[object].emoji}</span>;
}

function AdvancedStoryObjectWord({ object, count, lang }: { object: AdvancedStoryObject; count: number; lang: Lang }) {
  if (object === "banana") {
    return <>{lang === "en" ? (count === 1 ? "banana" : "bananas") : "pisang"}</>;
  }
  const item = ADVANCED_COMPARE_OBJECTS[object];
  return <>{lang === "en" ? (count === 1 ? item.en[0] : item.en[1]) : item.ms}</>;
}

type AdvancedStoryOperation =
  | { kind: "direct"; count: number }
  | { kind: "add"; a: number; b: number }
  | { kind: "subtract"; start: number; remove: number };

type AdvancedStoryVisualState = {
  counted: number;
  crossed: number;
  joined: boolean;
  working: boolean;
  complete: boolean;
};

const freshAdvancedStoryState = (): AdvancedStoryVisualState => ({
  counted: 0,
  crossed: 0,
  joined: false,
  working: false,
  complete: false,
});

function advancedStoryResult(operation: AdvancedStoryOperation) {
  if (operation.kind === "direct") return operation.count;
  if (operation.kind === "add") return operation.a + operation.b;
  return operation.start - operation.remove;
}

function advancedStoryObjectName(object: AdvancedStoryObject, count: number, lang: Lang) {
  if (object === "banana") return lang === "en" ? (count === 1 ? "banana" : "bananas") : "pisang";
  const names = ADVANCED_COMPARE_OBJECTS[object];
  return lang === "en" ? (count === 1 ? names.en[0] : names.en[1]) : names.ms;
}

function AdvancedStoryOperationBox({
  operation,
  object,
  label,
  lang,
  state,
  active,
}: {
  operation: AdvancedStoryOperation;
  object: AdvancedStoryObject;
  label: string;
  lang: Lang;
  state: AdvancedStoryVisualState;
  active: boolean;
}) {
  const result = advancedStoryResult(operation);
  const isAddition = operation.kind === "add";
  const isSubtraction = operation.kind === "subtract";
  const startCount = isSubtraction ? operation.start : result;
  const additionGroups = isAddition ? [operation.a, operation.b] : [startCount];

  const renderObject = (index: number, layoutCount: number, layoutIndex: number) => {
    const isCrossed = isSubtraction && index >= result && index < result + state.crossed;
    const countedIndex = isSubtraction ? index + 1 : index + 1;
    const isCounted = !isCrossed && countedIndex <= state.counted;
    const isActive = state.working && isCounted && countedIndex === state.counted;
    const isWaiting = !isSubtraction && !isCounted;

    return (
      <span
        key={index}
        className={`relative grid h-16 w-14 place-items-center rounded-2xl border-2 transition-[background-color,border-color,filter,opacity,transform,box-shadow] duration-300 sm:h-[4.6rem] sm:w-16 ${
          isCrossed
            ? "scale-95 border-red-400 bg-red-950/70 opacity-65 grayscale"
            : isActive
              ? "scale-105 border-yellow-200 bg-cyan-950 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]"
              : isCounted || isSubtraction
                ? "border-cyan-400 bg-cyan-950"
                : "border-cyan-900 bg-slate-900"
        } ${isWaiting ? "opacity-45 grayscale" : ""} ${!state.joined && layoutCount % 2 === 1 && layoutIndex === layoutCount - 1 ? "col-span-2 justify-self-center" : ""}`}
      >
        {isCounted && (
          <span className={`absolute -top-3 left-1/2 z-20 grid h-7 min-w-7 -translate-x-1/2 place-items-center rounded-full px-1 text-sm font-black ${isActive ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
            {countedIndex}
          </span>
        )}
        <AdvancedStoryObjectIcon object={object} />
        {isCrossed && (
          <span className="absolute inset-0 grid place-items-center text-5xl font-black leading-none text-red-500" aria-label={lang === "en" ? "crossed out" : "dipangkah"}>×</span>
        )}
      </span>
    );
  };

  let runningIndex = 0;
  const expression = operation.kind === "add"
    ? `${operation.a} + ${operation.b}`
    : operation.kind === "subtract"
      ? `${operation.start} − ${operation.remove}`
      : String(operation.count);

  return (
    <section className={`h-full rounded-[1.6rem] border-2 p-3 shadow-[0_5px_0_#164e63] transition-[border-color,box-shadow,transform] duration-500 ${
      active
        ? "border-yellow-300 bg-slate-950/90 ring-4 ring-yellow-300/15"
        : state.complete
          ? "border-emerald-300 bg-emerald-950/35"
          : "border-cyan-300 bg-slate-950/80"
    }`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-lg font-black text-cyan-100">{label}</h4>
        <span className="rounded-xl border-2 border-yellow-300 bg-slate-900 px-3 py-1 text-xl font-black text-yellow-200" style={NUMBER_TEXT_STYLE}>{expression}</span>
      </div>
      <div className={`relative min-h-52 rounded-2xl border-2 border-cyan-900 bg-slate-950 p-3 transition-[border-color,box-shadow] duration-700 ${state.joined ? "border-emerald-400 shadow-[inset_0_0_24px_rgba(16,185,129,.18)]" : ""}`}>
        {isSubtraction && (
          <p className="mb-3 rounded-xl border border-red-400/70 bg-red-950/70 px-3 py-2 text-center text-sm font-black text-red-100">
            {lang === "en" ? `Cross out ${operation.remove}, then count what remains.` : `Pangkah ${operation.remove}, kemudian kira yang tinggal.`}
          </p>
        )}
        <div className={`grid min-h-40 items-center transition-[gap] duration-1000 ${isAddition ? (state.joined ? "grid-cols-4 place-items-center gap-2" : "grid-cols-[1fr_auto_1fr] gap-3") : "grid-cols-1 gap-3"}`}>
          {additionGroups.map((groupCount, groupIndex) => {
            const offset = runningIndex;
            runningIndex += groupCount;
            return (
              <React.Fragment key={`${groupIndex}-${groupCount}`}>
                {groupIndex === 1 && (
                  <span data-math-cue="plus" className={`place-items-center overflow-hidden font-black text-yellow-200 transition-[max-width,opacity,transform] duration-700 ${state.joined ? "hidden" : "grid max-w-12 text-3xl opacity-100"}`}>+</span>
                )}
                <div className={`${state.joined ? "contents" : "grid grid-cols-2 place-items-center gap-2 rounded-2xl border-2 p-2 transition-[border-color,background-color,border-radius,box-shadow] duration-1000"} ${
                  state.joined
                    ? ""
                    : "border-cyan-700 bg-cyan-950/45"
                }`}>
                  {Array.from({ length: groupCount }, (_, groupObjectIndex) => renderObject(offset + groupObjectIndex, groupCount, groupObjectIndex))}
                </div>
              </React.Fragment>
            );
          })}
          {state.joined && <span className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/20 ring-8 ring-yellow-300/10 motion-safe:animate-ping" aria-hidden="true" />}
        </div>
      </div>
      <p className={`mx-auto mt-3 min-h-11 w-fit rounded-full border-2 px-4 py-2 text-center text-base font-black transition-colors ${state.complete ? "border-emerald-300 bg-emerald-950 text-emerald-100" : "border-slate-700 bg-slate-900 text-slate-500"}`} aria-live="polite">
        {state.complete
          ? `${lang === "en" ? "Total" : "Jumlah"}: ${result} ${advancedStoryObjectName(object, result, lang)}`
          : (lang === "en" ? "Work out this side" : "Kira bahagian ini")}
      </p>
    </section>
  );
}

function AdvancedComparisonStory({ lang, story, onComplete }: { lang: Lang; story: "greater" | "less" | "equal"; onComplete?: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [leftState, setLeftState] = useState<AdvancedStoryVisualState>(freshAdvancedStoryState);
  const [rightState, setRightState] = useState<AdvancedStoryVisualState>(freshAdvancedStoryState);

  const storyData = {
    greater: {
      eyebrow: lang === "en" ? "Story example: greater than" : "Contoh cerita: lebih besar",
      title: lang === "en" ? "Who ate more coconuts?" : "Siapa makan lebih banyak kelapa?",
      text: lang === "en" ? "Chrys eats 5 coconuts, then 2 more. Alyse eats 6 coconuts. Who ate more?" : "Chrys makan 5 kelapa, kemudian 2 lagi. Alyse makan 6 kelapa. Siapa makan lebih banyak?",
      leftLabel: "Chrys",
      rightLabel: "Alyse",
      leftObject: "coconut" as AdvancedStoryObject,
      rightObject: "coconut" as AdvancedStoryObject,
      leftOperation: { kind: "add", a: 5, b: 2 } as AdvancedStoryOperation,
      rightOperation: { kind: "direct", count: 6 } as AdvancedStoryOperation,
      leftAction: lang === "en" ? "Add and count Chrys's coconuts" : "Tambah dan kira kelapa Chrys",
      rightAction: lang === "en" ? "Count Alyse's 6 coconuts" : "Kira 6 kelapa Alyse",
      symbol: ">" as const,
      explanation: lang === "en" ? "Chrys ate 7 coconuts. Alyse ate 6. Seven is greater than six." : "Chrys makan 7 kelapa. Alyse makan 6. Tujuh lebih besar daripada enam.",
    },
    less: {
      eyebrow: lang === "en" ? "Story example: less than" : "Contoh cerita: lebih kecil",
      title: lang === "en" ? "Which basket has fewer bananas?" : "Bakul mana ada lebih sedikit pisang?",
      text: lang === "en" ? "Chrys has 8 bananas. Alyse has 15, then gives away 2. Which basket has fewer?" : "Chrys ada 8 pisang. Alyse ada 15, kemudian beri 2. Bakul mana ada lebih sedikit?",
      leftLabel: lang === "en" ? "Chrys's basket" : "Bakul Chrys",
      rightLabel: lang === "en" ? "Alyse's basket" : "Bakul Alyse",
      leftObject: "banana" as AdvancedStoryObject,
      rightObject: "banana" as AdvancedStoryObject,
      leftOperation: { kind: "direct", count: 8 } as AdvancedStoryOperation,
      rightOperation: { kind: "subtract", start: 15, remove: 2 } as AdvancedStoryOperation,
      leftAction: lang === "en" ? "Count Chrys's 8 bananas" : "Kira 8 pisang Chrys",
      rightAction: lang === "en" ? "Cross out 2, then count 13" : "Pangkah 2, kemudian kira 13",
      symbol: "<" as const,
      explanation: lang === "en" ? "Alyse has 13 bananas left. Eight is less than thirteen." : "Alyse ada 13 pisang lagi. Lapan lebih kecil daripada tiga belas.",
    },
    equal: {
      eyebrow: lang === "en" ? "Story example: equals" : "Contoh cerita: sama dengan",
      title: lang === "en" ? "Do Chrys and Alyse have the same number?" : "Adakah Chrys dan Alyse mempunyai jumlah yang sama?",
      text: lang === "en" ? "Chrys has 4 apples, then gets 3 more. Alyse has 9 and gives away 2. Are their totals equal?" : "Chrys ada 4 epal, kemudian dapat 3 lagi. Alyse ada 9 dan beri 2. Adakah jumlah mereka sama?",
      leftLabel: "Chrys",
      rightLabel: "Alyse",
      leftObject: "apple" as AdvancedStoryObject,
      rightObject: "apple" as AdvancedStoryObject,
      leftOperation: { kind: "add", a: 4, b: 3 } as AdvancedStoryOperation,
      rightOperation: { kind: "subtract", start: 9, remove: 2 } as AdvancedStoryOperation,
      leftAction: lang === "en" ? "Add and count Chrys's apples" : "Tambah dan kira epal Chrys",
      rightAction: lang === "en" ? "Cross out 2, then count Alyse's apples" : "Pangkah 2, kemudian kira epal Alyse",
      symbol: "=" as const,
      explanation: lang === "en" ? "Chrys has 7 apples. Alyse has 7 apples. Both totals are equal." : "Chrys ada 7 epal. Alyse ada 7 epal. Kedua-dua jumlah adalah sama.",
    },
  }[story];

  useEffect(() => {
    setStep(0);
    setLeftState(freshAdvancedStoryState());
    setRightState(freshAdvancedStoryState());
  }, [story]);

  const countIntoState = async (count: number, update: React.Dispatch<React.SetStateAction<AdvancedStoryVisualState>>) => {
    const reveal = (value: number) => update((current) => ({ ...current, counted: value }));
    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, reveal);
    } else if (prefersReducedMotion) {
      reveal(count);
    } else {
      for (let value = 1; value <= count; value += 1) {
        reveal(value);
        await wait(COUNTING_STEP_MS);
      }
    }
  };

  const runOperation = async (operation: AdvancedStoryOperation, update: React.Dispatch<React.SetStateAction<AdvancedStoryVisualState>>) => {
    update({ ...freshAdvancedStoryState(), working: true });
    if (operation.kind === "subtract") {
      for (let value = 1; value <= operation.remove; value += 1) {
        update((current) => ({ ...current, crossed: value }));
        await wait(prefersReducedMotion ? 0 : 650);
      }
      await countIntoState(operation.start - operation.remove, update);
    } else {
      await countIntoState(advancedStoryResult(operation), update);
      if (operation.kind === "add") {
        update((current) => ({ ...current, joined: true }));
        await wait(prefersReducedMotion ? 0 : 1000);
      }
    }
    update((current) => ({ ...current, working: false, complete: true }));
  };

  const action = async () => {
    if (leftState.working || rightState.working || step >= 2) return;
    if (step === 0) {
      await runOperation(storyData.leftOperation, setLeftState);
      setStep(1);
      return;
    }
    await runOperation(storyData.rightOperation, setRightState);
    setStep(2);
    const leftEmoji = storyData.leftObject === "banana" ? BANANA : ADVANCED_COMPARE_OBJECTS[storyData.leftObject].emoji;
    const rightEmoji = storyData.rightObject === "banana" ? BANANA : ADVANCED_COMPARE_OBJECTS[storyData.rightObject].emoji;
    await speakComparisonSentence(leftResult, rightResult, storyData.symbol, lang, leftEmoji, rightEmoji);
    onComplete?.();
  };

  const busy = leftState.working || rightState.working;
  const actionLabel = step === 0 ? storyData.leftAction : storyData.rightAction;
  const leftResult = advancedStoryResult(storyData.leftOperation);
  const rightResult = advancedStoryResult(storyData.rightOperation);

  return (
    <div className="rounded-[2rem] border-2 border-cyan-300 bg-slate-950/70 p-4 shadow-[0_6px_0_#164e63]">
      <div className="mb-4 rounded-2xl border border-cyan-700 bg-cyan-950/70 p-3 text-center">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-300">{storyData.eyebrow}</p>
        <p className="mt-1 text-xl font-black text-yellow-200">{storyData.title}</p>
        <p className="mt-1 text-base font-black text-cyan-50">{storyData.text}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
        <AdvancedStoryOperationBox operation={storyData.leftOperation} object={storyData.leftObject} label={storyData.leftLabel} lang={lang} state={leftState} active={step === 0} />
        <div className={`grid h-20 w-20 place-items-center self-center justify-self-center rounded-3xl border-4 text-6xl font-black shadow-[0_6px_0_#a16207] transition-[background-color,border-color,color,opacity,transform] duration-700 ${step === 2 ? "scale-110 border-yellow-300 bg-yellow-300 text-slate-950 opacity-100" : "border-slate-700 bg-slate-900 text-slate-600 opacity-60"}`} aria-live="polite" aria-label={step === 2 ? `${leftResult} ${storyData.symbol} ${rightResult}` : undefined}>
          {step === 2 ? storyData.symbol : "?"}
        </div>
        <AdvancedStoryOperationBox operation={storyData.rightOperation} object={storyData.rightObject} label={storyData.rightLabel} lang={lang} state={rightState} active={step === 1} />
      </div>
      {step < 2 ? (
        <button type="button" disabled={busy} onClick={() => void action()} className="relative mx-auto mt-5 flex min-h-14 items-center justify-center rounded-2xl border-2 border-cyan-300 bg-blue-600 px-6 text-lg font-black text-white shadow-[0_5px_0_#1e3a8a] disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? (lang === "en" ? "Working it out..." : "Sedang mengira...") : actionLabel}
          {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-amber-700"><PointerIcon /></span>}
        </button>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-emerald-950 px-5 py-4 text-center text-emerald-100">
          <p className="text-4xl font-black" style={NUMBER_TEXT_STYLE}>{leftResult} {storyData.symbol} {rightResult}</p>
          <p className="mt-2 text-lg font-black">{storyData.explanation}</p>
        </div>
      )}
    </div>
  );
}

function AdvancedCompareBiggerLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const [completedStories, setCompletedStories] = useState<Set<number>>(() => new Set());
  const finishStory = (storyPhase: number) => setCompletedStories((current) => {
    if (current.has(storyPhase)) return current;
    const next = new Set(current);
    next.add(storyPhase);
    return next;
  });
  const slides = [
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Meet the greater-than symbol" : "Kenali simbol lebih besar daripada",
      text: lang === "en" ? "The > symbol means greater than. Look at its two sides." : "Simbol > bermaksud lebih besar. Lihat kedua-dua bahagiannya.",
      visual: <ComparisonSymbolIntroduction lang={lang} symbol=">" />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Greater than: >" : "Lebih besar: >",
      text: lang === "en" ? "Learn what > means. Look at both sides." : "Pelajari maksud >. Lihat kedua-dua bahagiannya.",
      visual: <GreaterThanSymbolTeaching lang={lang} />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Greater-than example" : "Contoh lebih besar",
      text: lang === "en" ? "Count both apple piles. Which pile has more?" : "Kira kedua-dua kumpulan epal. Kumpulan mana lebih banyak?",
      visual: <AdvancedCompareVisual a={8} b={3} object="apple" lang={lang} symbol=">" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Another greater-than example" : "Satu lagi contoh lebih besar",
      text: lang === "en" ? "Count both piles. The open side faces more." : "Kira kedua-dua kumpulan. Bahagian terbuka menghadap jumlah lebih banyak.",
      visual: <AdvancedCompareVisual a={12} b={9} object="coconut" lang={lang} symbol=">" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Meet the less-than symbol" : "Kenali simbol lebih kecil daripada",
      text: lang === "en" ? "The < symbol means less than. It faces the other way." : "Simbol < bermaksud lebih kecil. Simbol ini menghadap arah lain.",
      visual: <ComparisonSymbolIntroduction lang={lang} symbol="<" />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Less than: <" : "Lebih kecil: <",
      text: lang === "en" ? "Count both apple piles. The point faces fewer." : "Kira kedua-dua kumpulan epal. Bahagian runcing menghadap jumlah lebih sedikit.",
      visual: <AdvancedCompareVisual a={3} b={6} object="apple" lang={lang} symbol="<" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Less-than example 1" : "Contoh lebih kecil 1",
      text: lang === "en" ? "The point faces the smaller number." : "Bahagian runcing menghadap nombor lebih kecil.",
      visual: <AdvancedCompareVisual a={4} b={9} object="cookie" lang={lang} symbol="<" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Less-than example 2" : "Contoh lebih kecil 2",
      text: lang === "en" ? "Count both piles. The smaller amount gets the pointed side of <." : "Kira kedua-dua kumpulan. Jumlah lebih kecil mendapat bahagian runcing <.",
      visual: <AdvancedCompareVisual a={11} b={15} object="mushroom" lang={lang} symbol="<" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Meet the equals symbol" : "Kenali simbol sama dengan",
      text: lang === "en" ? "First, learn what = means." : "Mula-mula, pelajari maksud =.",
      visual: <EqualsSymbolTeaching lang={lang} />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Equals example 1" : "Contoh sama 1",
      text: lang === "en" ? "When both amounts match, use =." : "Apabila dua-dua jumlah sama, guna =.",
      visual: <AdvancedCompareVisual a={4} b={4} object="cookie" lang={lang} symbol="=" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Equals example 2" : "Contoh sama 2",
      text: lang === "en" ? "Count both piles. When they match, use =." : "Kira kedua-dua kumpulan. Apabila jumlah sama, guna =.",
      visual: <AdvancedCompareVisual a={10} b={10} object="fish" lang={lang} symbol="=" stagedReveal />,
      note: "",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Use > after adding" : "Guna > selepas tambah",
      text: lang === "en" ? "First find each total. Then compare them." : "Mula-mula cari setiap jumlah. Kemudian bandingkan.",
      visual: <AdvancedComparisonStory key="greater-story" lang={lang} story="greater" onComplete={() => finishStory(11)} />,
      note: lang === "en" ? "Chrys has 7 coconuts. Alyse has 6. 7 > 6." : "Chrys ada 7 kelapa. Alyse ada 6. 7 > 6.",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Use < after taking away" : "Guna < selepas ambil",
      text: lang === "en" ? "Take away first. Then compare what is left." : "Ambil dahulu. Kemudian bandingkan yang tinggal.",
      visual: <AdvancedComparisonStory key="less-story" lang={lang} story="less" onComplete={() => finishStory(12)} />,
      note: lang === "en" ? "8 is less than 13. 8 < 13." : "8 lebih kecil daripada 13. 8 < 13.",
    },
    {
      eyebrow: lang === "en" ? "Mission 2: Compare" : "Misi 2: Banding",
      title: lang === "en" ? "Use = when totals match" : "Guna = apabila jumlah sama",
      text: lang === "en" ? "Both stories can make the same total." : "Dua cerita boleh dapat jumlah yang sama.",
      visual: <AdvancedComparisonStory key="equal-story" lang={lang} story="equal" onComplete={() => finishStory(13)} />,
      note: lang === "en" ? "Both totals are 7. 7 = 7." : "Dua-dua jumlah ialah 7. 7 = 7.",
    },
  ];
  const slide = slides[phase];

  if (showPractice) return <AdvancedComparePractice lang={lang} t={t} onBack={() => { setShowPractice(false); setPhase(slides.length - 1); }} onDone={onDone} />;

  return (
    <main className="mx-auto w-full max-w-[90rem] pb-8">
      <div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3">
        <LessonShell lang={lang} title={t.advancedCompareBigger} helper={lang === "en" ? "Compare groups and numbers from 0 to 20." : "Banding kumpulan dan nombor dari 0 hingga 20."} variant="cyber">
          <div className="mb-5 grid grid-cols-3 gap-2 md:grid-cols-7 xl:grid-cols-[repeat(14,minmax(0,1fr))]">{slides.map((_, index) => <span key={index} className={`h-3 rounded-full border ${index <= phase ? "border-yellow-200 bg-yellow-400" : "border-slate-600 bg-slate-700"}`} />)}</div>
          <CyberTeachingCard eyebrow={slide.eyebrow} title={slide.title} text={slide.text} />
          <div key={phase}>{slide.visual}</div>
          {slide.note && (phase < 11 || completedStories.has(phase)) && <p className="mt-5 rounded-2xl border-2 border-emerald-300 bg-emerald-950 px-5 py-4 text-center text-xl font-black text-emerald-100">{slide.note}</p>}
          <AdvancedLessonNavigation lang={lang} t={t} phase={phase} lastPhase={slides.length - 1} canNext={phase < 11 || completedStories.has(phase)} onPrevious={() => { stopNumberAudio(); setPhase((value) => Math.max(0, value - 1)); }} onNext={() => { stopNumberAudio(); phase === slides.length - 1 ? setShowPractice(true) : setPhase((value) => value + 1); }} onPractice={() => { stopNumberAudio(); setShowPractice(true); }} />
        </LessonShell>
      </div>
    </main>
  );
}

function AdvancedComparePractice({ lang, t, onBack, onDone }: { lang: Lang; t: UIStrings; onBack: () => void; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<AdvancedCompareChoice | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const spokenFeedbackRef = useRef<string | null>(null);
  const question = advancedCompareBiggerQuestions[index];
  const isCorrect = selected === question.answer;
  const isVisual = question.tier === "visual";
  const item = question.object ? ADVANCED_COMPARE_OBJECTS[question.object] : null;
  const objectWord = (count: number) => item ? (lang === "en" ? (count === 1 ? item.en[0] : item.en[1]) : item.ms) : "";
  const choiceLabel = (choice: AdvancedCompareChoice) => ({
    left: lang === "en" ? "Left pile" : "Kumpulan kiri",
    right: lang === "en" ? "Right pile" : "Kumpulan kanan",
    same: lang === "en" ? "Same" : "Sama",
    different: lang === "en" ? "Different" : "Berbeza",
    ">": ">",
    "<": "<",
    "=": "=",
  })[choice];
  const prompt = question.kind === "more"
    ? (lang === "en" ? (isVisual ? "Which pile has more?" : "Which number is bigger?") : (isVisual ? "Kumpulan mana lebih banyak?" : "Nombor mana lebih besar?"))
    : question.kind === "symbol"
      ? (lang === "en" ? "Choose the correct sign." : "Pilih tanda yang betul.")
      : (lang === "en" ? "Do both have the same amount?" : "Adakah dua-dua jumlah sama?");
  const comparisonSymbol = question.a === question.b ? "=" : question.a > question.b ? ">" : "<";
  const largerSide = question.a > question.b ? "left" : "right";
  const smallerSide = largerSide === "left" ? "right" : "left";
  const feedback = question.a === question.b
    ? (lang === "en"
      ? isVisual ? `Both piles have ${question.a} ${objectWord(question.a)}. They are the same. So ${question.a} = ${question.b}.` : `${question.a} and ${question.b} are the same. So ${question.a} = ${question.b}.`
      : isVisual ? `Dua-dua kumpulan ada ${question.a} ${objectWord(question.a)}. Dua-dua sama. Jadi ${question.a} = ${question.b}.` : `${question.a} dan ${question.b} sama. Jadi ${question.a} = ${question.b}.`)
    : (lang === "en"
      ? isVisual ? `The wide side faces the bigger pile. The ${largerSide} pile has ${Math.max(question.a, question.b)} ${objectWord(Math.max(question.a, question.b))}. The ${smallerSide} pile has ${Math.min(question.a, question.b)}. So ${Math.max(question.a, question.b)} ${comparisonSymbol} ${Math.min(question.a, question.b)}.` : `${Math.max(question.a, question.b)} is bigger than ${Math.min(question.a, question.b)}. So ${question.a} ${comparisonSymbol} ${question.b}.`
      : isVisual ? `Bahagian luas tanda ini menghadap kumpulan yang lebih banyak. Kumpulan ${largerSide === "left" ? "kiri" : "kanan"} ada ${Math.max(question.a, question.b)} ${objectWord(Math.max(question.a, question.b))}. Kumpulan ${smallerSide === "left" ? "kiri" : "kanan"} ada ${Math.min(question.a, question.b)}. Jadi ${Math.max(question.a, question.b)} ${comparisonSymbol} ${Math.min(question.a, question.b)}.` : `${Math.max(question.a, question.b)} lebih besar daripada ${Math.min(question.a, question.b)}. Jadi ${question.a} ${comparisonSymbol} ${question.b}.`);

  useEffect(() => {
    spokenFeedbackRef.current = null;
  }, [lang, question.id]);

  useEffect(() => {
    if (selected === null) return;
    const key = `${question.id}:${lang}:${question.a}:${comparisonSymbol}:${question.b}`;
    if (spokenFeedbackRef.current === key) return;
    spokenFeedbackRef.current = key;
    void speakComparisonSentence(
      question.a,
      question.b,
      comparisonSymbol,
      lang,
      isVisual ? item?.emoji : undefined,
      isVisual ? item?.emoji : undefined,
    );
  }, [comparisonSymbol, isVisual, item?.emoji, lang, question.a, question.b, question.id, selected]);

  const goNext = () => {
    if (isCorrect) setCorrectCount((value) => value + 1);
    if (index === advancedCompareBiggerQuestions.length - 1) {
      onDone();
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3">
        <LessonShell lang={lang} title={lang === "en" ? "Compare Bigger Numbers: Practice" : "Banding Nombor Besar: Latihan"} helper={`${index + 1}/${advancedCompareBiggerQuestions.length} · ${lang === "en" ? "Score" : "Markah"}: ${correctCount}`} variant="cyber">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="rounded-2xl border-2 border-cyan-300 bg-slate-950 px-5 py-3 font-black text-cyan-100 shadow-[0_4px_0_#164e63]">{lang === "en" ? "Back to lesson" : "Kembali ke pelajaran"}</button>
            <span className={`rounded-full border px-4 py-2 text-sm font-black ${isVisual ? "border-yellow-300 bg-yellow-300 text-slate-950" : "border-cyan-300 bg-cyan-950 text-cyan-100"}`}>{isVisual ? (lang === "en" ? "Look at the objects" : "Lihat objek") : (lang === "en" ? "Try with numbers" : "Cuba dengan nombor")}</span>
          </div>
          <h3 className="mb-6 text-center text-3xl font-black text-white">{prompt}</h3>
          {isVisual && question.object ? <AdvancedCompareVisual a={question.a} b={question.b} object={question.object} lang={lang} /> : (
            <div className="grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="grid min-h-48 place-items-center rounded-[2rem] border-4 border-cyan-300 bg-cyan-950/80 text-7xl font-black text-yellow-200" style={getNumberTextStyle(question.a)}>{question.a}</div>
              <span className="hidden text-5xl font-black text-cyan-300 sm:block">?</span>
              <div className="grid min-h-48 place-items-center rounded-[2rem] border-4 border-cyan-300 bg-cyan-950/80 text-7xl font-black text-yellow-200" style={getNumberTextStyle(question.b)}>{question.b}</div>
            </div>
          )}
          <div className={`mt-6 grid gap-3 ${question.options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {question.options.map((choice) => {
              const selectedChoice = selected === choice;
              const correctChoice = selected !== null && choice === question.answer;
              return <button key={choice} type="button" disabled={selected !== null} onClick={() => setSelected(choice)} aria-pressed={selectedChoice} className={`min-h-20 rounded-3xl border-4 px-5 py-4 text-2xl font-black shadow-[0_6px_0_#164e63] transition disabled:cursor-default ${correctChoice ? "border-emerald-200 bg-emerald-600 text-white shadow-[0_6px_0_#065f46]" : selectedChoice ? "border-rose-300 bg-rose-600 text-white shadow-[0_6px_0_#9f1239]" : "border-cyan-300 bg-slate-900 text-cyan-50 hover:-translate-y-1 active:translate-y-1"}`}>{choiceLabel(choice)}{correctChoice && <Check className="ml-2 inline h-7 w-7" strokeWidth={4} aria-hidden="true" />}</button>;
            })}
          </div>
          {selected !== null && <section className={`mt-6 rounded-3xl border-2 p-5 ${isCorrect ? "border-emerald-300 bg-emerald-950 text-emerald-100" : "border-yellow-300 bg-yellow-100 text-slate-900"}`}>
            <h4 className="text-2xl font-black">{isCorrect ? (lang === "en" ? "Great comparing!" : "Bagus membanding!") : (lang === "en" ? "Let's look again." : "Mari lihat semula.")}</h4>
            <p className="mt-2 text-lg font-bold">{isCorrect ? (lang === "en" ? "You chose the correct answer." : "Kamu pilih jawapan yang betul.") : feedback}</p>
            <button type="button" onClick={goNext} className="mt-5 w-full rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-6 py-4 text-xl font-black text-slate-950 shadow-[0_5px_0_#a16207]">{index === advancedCompareBiggerQuestions.length - 1 ? (lang === "en" ? "Finish mission" : "Tamatkan misi") : (lang === "en" ? "Next question" : "Soalan seterusnya")}</button>
          </section>}
        </LessonShell>
      </div>
    </main>
  );
}

function SequencingBananaBox({ count, visibleCount = count, label, activeIndex = null, hiddenIndex = null, compact = false, showCountLabels = false, countLabelThrough = visibleCount, countLabelStart = 1, showFuture = false, interleavedRows = false, enteringIndex = null, lastItemOnTopRow = false }: {
  count: number;
  visibleCount?: number;
  label?: string;
  activeIndex?: number | null;
  hiddenIndex?: number | null;
  compact?: boolean;
  showCountLabels?: boolean;
  countLabelThrough?: number;
  countLabelStart?: number;
  showFuture?: boolean;
  interleavedRows?: boolean;
  enteringIndex?: number | null;
  lastItemOnTopRow?: boolean;
}) {
  const topCount = count <= 4 ? count : Math.ceil(count / 2);
  const bottomCount = count <= 4 ? 0 : Math.floor(count / 2);
  const topIndices = lastItemOnTopRow && bottomCount > 0
    ? [...Array.from({ length: topCount - 1 }, (_, index) => index), count - 1]
    : Array.from({ length: topCount }, (_, index) => index);
  const bottomIndices = lastItemOnTopRow && bottomCount > 0
    ? Array.from({ length: bottomCount }, (_, index) => topCount - 1 + index)
    : Array.from({ length: bottomCount }, (_, index) => topCount + index);
  const renderBanana = (index: number) => {
    const visible = index < visibleCount && index !== hiddenIndex;
    return (
      <span
        key={index}
        className={`relative grid shrink-0 place-items-center rounded-xl border transition-[opacity,transform,filter,background-color,border-color] duration-300 ${enteringIndex === index ? "sequence-banana-join" : ""} ${compact ? "h-6 w-6 sm:h-12 sm:w-12" : "h-9 w-9 sm:h-14 sm:w-14"} ${
          visible
            ? index === activeIndex
              ? "border-yellow-200 bg-cyan-950/65 opacity-100 ring-4 ring-yellow-300/80"
              : "border-cyan-400/70 bg-cyan-950/65 opacity-100"
            : showFuture && index !== hiddenIndex
              ? "scale-95 border-slate-700 bg-slate-900 opacity-25 grayscale"
              : "scale-75 border-slate-800 bg-slate-900/30 opacity-0"
        }`}
        aria-hidden="true"
      >
        <SpriteIcon value={BANANA} className={compact ? "h-5 w-5 sm:h-10 sm:w-10" : "h-8 w-8 sm:h-11 sm:w-11"} />
        {showCountLabels && visible && index < countLabelThrough && (
          <span className={`absolute -right-2 -top-3 grid h-7 min-w-7 place-items-center rounded-full border-2 px-1 text-sm font-black leading-none shadow-md ${index === activeIndex ? "border-yellow-100 bg-yellow-400 text-slate-950" : "border-cyan-100 bg-blue-600 text-white"}`}>{countLabelStart + index}</span>
        )}
      </span>
    );
  };

  const renderRow = (indices: number[]) => (
    <div className="flex min-h-10 items-center justify-center gap-1.5 sm:min-h-14 sm:gap-3" data-row-count={indices.length}>
      {indices.map((index) => renderBanana(index))}
    </div>
  );

  return (
    <div className="flex h-40 w-full min-w-0 flex-col justify-center rounded-[1.65rem] border-2 border-cyan-400 bg-slate-950/90 px-3 py-3 shadow-[inset_0_0_24px_rgba(34,211,238,.12),0_5px_0_#164e63] sm:h-44 sm:px-5">
      {label && <p className="mb-3 text-center text-base font-black uppercase tracking-wide text-cyan-100">{label}</p>}
      {interleavedRows ? (
        <div className="mx-auto grid w-fit grid-flow-col grid-rows-2 content-center gap-x-1.5 gap-y-4 sm:gap-x-3 sm:gap-y-5">
          {Array.from({ length: count }, (_, index) => renderBanana(index))}
        </div>
      ) : (
        <div className="grid content-center gap-2 sm:gap-3">
          {renderRow(topIndices)}
          {bottomCount > 0 && renderRow(bottomIndices)}
        </div>
      )}
    </div>
  );
}

function SequencingAnchorPhase({ lang, onComplete }: { lang: Lang; onComplete: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const runRef = useRef(0);

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const startCount = async () => {
    if (running) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setVisibleCount(0);
    setDone(false);
    setRunning(true);
    if (!audioMuted) {
      await speakCountingSequence(9, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) setVisibleCount(value);
      });
    } else {
      for (let value = 1; value <= 9; value += 1) {
        if (runRef.current !== runId) return;
        setVisibleCount(value);
        await wait(COUNTING_STEP_MS);
      }
    }
    if (runRef.current !== runId) return;
    setRunning(false);
    setDone(true);
    onComplete();
  };

  return (
    <section className="rounded-[2rem] border-2 border-cyan-300 bg-cyan-950/55 p-5">
      <div className="mx-auto max-w-3xl"><SequencingBananaBox count={9} visibleCount={visibleCount} activeIndex={running ? visibleCount - 1 : null} showCountLabels countLabelThrough={visibleCount} showFuture /></div>
      <p className="mt-5 text-center text-2xl font-black leading-relaxed text-cyan-50 sm:text-3xl">
        {lang === "en" ? "Count the bananas: 1, 2, 3, 4, 5, 6, 7, 8, 9." : "Kira pisang: 1, 2, 3, 4, 5, 6, 7, 8, 9."}
      </p>
      <button type="button" onClick={() => void startCount()} disabled={running} className="mx-auto mt-4 flex min-h-14 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 text-lg font-black text-slate-950 shadow-[0_5px_0_#a16207] transition hover:-translate-y-0.5 disabled:opacity-60">
        {running ? (lang === "en" ? `Counting ${visibleCount}...` : `Mengira ${visibleCount}...`) : done ? (lang === "en" ? "Count again" : "Kira lagi") : (lang === "en" ? "Start counting" : "Mula mengira")}
      </button>
      {done && (
        <p className="comparison-result-reveal mx-auto mt-5 max-w-3xl rounded-2xl border-2 border-emerald-300 bg-emerald-950/85 px-5 py-4 text-center text-lg font-black text-emerald-100 sm:text-xl">
          {lang === "en" ? "Each new number is one more than the last." : "Setiap nombor baru adalah satu lebih daripada nombor sebelumnya."}
        </p>
      )}
    </section>
  );
}

function SequencingPlusOnePhase({ base, lang, onComplete }: { base: 9 | 10; lang: Lang; onComplete: () => void }) {
  const total = base + 1;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<"ready" | "countingBase" | "baseCounted" | "plus" | "one" | "equals" | "counting" | "combining" | "done">("ready");
  const [visibleBase, setVisibleBase] = useState(0);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const runRef = useRef(0);
  const busy = stage === "countingBase" || (stage !== "ready" && stage !== "baseCounted" && stage !== "done");
  const showOne = stage === "one" || stage === "equals" || stage === "counting" || stage === "combining" || stage === "done";
  const showBottomGroups = stage === "counting";
  const countedInBase = Math.min(visibleTotal, base);
  const countedInOne = visibleTotal > base ? 1 : 0;

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const countStartingGroup = async () => {
    if (stage !== "ready" && stage !== "done") return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setVisibleBase(0);
    setVisibleTotal(0);
    setStage("countingBase");
    if (!audioMuted) {
      await speakCountingSequence(base, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) setVisibleBase(value);
      });
    } else {
      for (let value = 1; value <= base; value += 1) {
        if (runRef.current !== runId) return;
        setVisibleBase(value);
        await wait(COUNTING_STEP_MS);
      }
    }
    if (runRef.current !== runId) return;
    setStage("baseCounted");
  };

  const addOne = async () => {
    if (stage !== "baseCounted") return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setVisibleTotal(0);
    setStage("plus");
    await wait(prefersReducedMotion ? 0 : 100);
    if (runRef.current !== runId) return;
    setStage("one");
    speakNumber(1, lang);
    await wait(950);
    if (runRef.current !== runId) return;
    setStage("equals");
    await speakMathCue("equals", lang);
    await wait(350);
    if (runRef.current !== runId) return;
    setStage("counting");
    if (!audioMuted) {
      await speakCountingSequence(total, lang, SEQUENCING_PLUS_ONE_COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) setVisibleTotal(value);
      });
    } else {
      for (let value = 1; value <= total; value += 1) {
        if (runRef.current !== runId) return;
        setVisibleTotal(value);
        await wait(SEQUENCING_PLUS_ONE_COUNTING_STEP_MS);
      }
    }
    if (runRef.current !== runId) return;
    await wait(400);
    setStage("combining");
    await wait(850);
    if (runRef.current !== runId) return;
    setStage("done");
    onComplete();
  };

  return (
    <section className="rounded-[2rem] border-2 border-cyan-300 bg-cyan-950/55 p-4 sm:p-5">
      <style>{`@keyframes sequenceBananaJoin{0%{transform:translateX(180px) scale(.82);opacity:0}65%{transform:translateX(-8px) scale(1.08);opacity:1}100%{transform:translateX(0) scale(1);opacity:1}}.sequence-banana-join{animation:sequenceBananaJoin 850ms cubic-bezier(.2,.8,.25,1) both}@media (prefers-reduced-motion:reduce){.sequence-banana-join{animation:none}}`}</style>
      <div className={`grid items-center gap-4 transition-all duration-500 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,.65fr)] ${showBottomGroups || stage === "combining" || stage === "done" ? "scale-[.98] opacity-55" : "opacity-100"}`}>
        <SequencingBananaBox
          count={base}
          visibleCount={visibleBase}
          activeIndex={stage === "countingBase" ? visibleBase - 1 : null}
          showFuture
          showCountLabels
          countLabelThrough={visibleBase}
          label={lang === "en" ? `${base} bananas` : `${base} pisang`}
        />
        <span data-math-cue="plus" className={`grid h-16 w-16 place-items-center justify-self-center rounded-2xl border-2 text-5xl font-black transition-all duration-300 ${stage === "plus" ? "scale-125 border-yellow-200 bg-yellow-300 text-slate-950 shadow-[0_0_24px_rgba(250,204,21,.75)]" : "border-cyan-700 bg-slate-950 text-yellow-300"}`} aria-label={lang === "en" ? "plus" : "tambah"}>+</span>
        <div>
          <SequencingBananaBox
            count={1}
            visibleCount={showOne ? 1 : 0}
            activeIndex={stage === "one" || (stage === "counting" && visibleTotal === total) ? 0 : null}
            showFuture
            showCountLabels
            countLabelThrough={stage === "counting" ? countedInOne : showOne ? 1 : 0}
            countLabelStart={stage === "counting" ? total : 1}
            label={lang === "en" ? "1 more" : "1 lagi"}
          />
        </div>
      </div>

      <button type="button" onClick={() => stage === "ready" || stage === "done" ? void countStartingGroup() : void addOne()} disabled={busy} className="mx-auto mt-4 flex min-h-14 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 text-lg font-black text-slate-950 shadow-[0_5px_0_#a16207] transition hover:-translate-y-0.5 disabled:opacity-60">
        {stage === "ready"
            ? (lang === "en" ? "Start counting" : "Mula mengira")
            : stage === "countingBase"
              ? (lang === "en" ? `Counting ${visibleBase}...` : `Mengira ${visibleBase}...`)
              : stage === "baseCounted"
                ? (lang === "en" ? "Add 1 banana" : "Tambah 1 pisang")
          : stage === "plus"
            ? (lang === "en" ? "Plus..." : "Tambah...")
            : stage === "one"
              ? (lang === "en" ? "One banana" : "Satu pisang")
              : stage === "equals"
                ? (lang === "en" ? "Equals to..." : "Sama dengan...")
                : stage === "counting"
                  ? (lang === "en" ? `Counting ${visibleTotal}...` : `Mengira ${visibleTotal}...`)
                  : stage === "combining"
                    ? (lang === "en" ? "Combining both groups..." : "Menggabungkan kedua-dua kumpulan...")
                    : (lang === "en" ? "Count again" : "Kira lagi")}
      </button>

      {(stage === "equals" || showBottomGroups || stage === "combining" || stage === "done") && (
        <div className="comparison-result-reveal mt-5 border-t-2 border-cyan-400/40 pt-5">
          <p data-math-cue="equals" className={`mx-auto mb-4 grid h-16 w-20 place-items-center rounded-2xl border-2 text-5xl font-black transition-all ${stage === "equals" ? "scale-125 border-cyan-100 bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(103,232,249,.7)]" : "border-cyan-400 bg-slate-950 text-cyan-200"}`} aria-label={lang === "en" ? "equals to" : "sama dengan"}>=</p>

          {showBottomGroups && (
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border-2 border-cyan-400 bg-slate-950/80 p-4 sm:p-5">
              <p className="mb-3 text-center text-sm font-black uppercase tracking-wide text-cyan-200">
                {stage === "counting"
                  ? (lang === "en" ? `Count both groups from 1 to ${total}` : `Kira kedua-dua kumpulan dari 1 hingga ${total}`)
                  : (lang === "en" ? "Now combine both groups" : "Sekarang gabungkan kedua-dua kumpulan")}
              </p>
              <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,.55fr)]">
                <div>
                  <SequencingBananaBox count={base} visibleCount={countedInBase} activeIndex={stage === "counting" && visibleTotal <= base ? visibleTotal - 1 : null} showFuture showCountLabels countLabelThrough={countedInBase} label={lang === "en" ? `Group of ${base}` : `Kumpulan ${base}`} />
                </div>
                <span data-math-cue="plus" className="text-center text-4xl font-black text-yellow-300" aria-hidden="true">+</span>
                <div>
                  <SequencingBananaBox count={1} visibleCount={countedInOne} activeIndex={stage === "counting" && visibleTotal === total ? 0 : null} showFuture showCountLabels countLabelThrough={countedInOne} countLabelStart={base + 1} label={lang === "en" ? "Group of 1" : "Kumpulan 1"} />
                </div>
              </div>
            </div>
          )}

          {(stage === "combining" || stage === "done") && (
            <div className="comparison-result-reveal mx-auto max-w-4xl">
              <p className="mb-3 text-center text-base font-black uppercase tracking-wide text-cyan-100">
                {stage === "combining"
                  ? (lang === "en" ? `The last banana joins to make ${total}` : `Pisang terakhir bergabung untuk menjadi ${total}`)
                  : (lang === "en" ? `One group of ${total}` : `Satu kumpulan ${total}`)}
              </p>
              <SequencingBananaBox count={total} visibleCount={total} showCountLabels countLabelThrough={total} enteringIndex={stage === "combining" ? total - 1 : null} lastItemOnTopRow label={lang === "en" ? `${total} bananas together` : `${total} pisang bersama`} />
            </div>
          )}
        </div>
      )}

      {stage === "done" && (
        <div className="comparison-result-reveal mt-5 text-center">
          <p className="text-5xl font-black text-yellow-200" style={NUMBER_TEXT_STYLE}>{base} + 1 = {total}</p>
          <p className="mx-auto mt-4 max-w-3xl rounded-2xl border-2 border-emerald-300 bg-emerald-950/85 px-5 py-4 text-lg font-black text-emerald-100">
            {base === 9
              ? (lang === "en" ? "9 is a one-digit number. After +1, the total value is 10, which is a two-digit number." : "9 ialah nombor satu digit. Selepas +1, jumlah nilainya ialah 10, iaitu nombor dua digit.")
              : (lang === "en" ? "Same rule: one more each time." : "Peraturan sama: satu lebih setiap kali.")}
          </p>
        </div>
      )}
    </section>
  );
}

function SequenceNumberLine({ direction, lang, onComplete }: { direction: "ascending" | "descending"; lang: Lang; onComplete: () => void }) {
  const values = direction === "ascending" ? Array.from({ length: 21 }, (_, index) => index) : Array.from({ length: 21 }, (_, index) => 20 - index);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const done = revealed === values.length;

  const reveal = async () => {
    if (running || done) return;
    setRunning(true);
    speakText(
      direction === "ascending"
        ? (lang === "en" ? "Counting up is ascending. Each number is one more." : "Kira naik dipanggil menaik. Setiap nombor tambah satu.")
        : (lang === "en" ? "Counting down is descending. Each number is one less." : "Kira turun dipanggil menurun. Setiap nombor kurang satu."),
      lang,
      { allowWhenWordAudioDisabled: true },
    );
    for (let index = 1; index <= values.length; index += 1) {
      setRevealed(index);
      await wait(150);
    }
    setRunning(false);
    onComplete();
  };

  return (
    <section className="rounded-[2rem] border-2 border-cyan-300 bg-slate-950/85 p-4 sm:p-5">
      <div className="cyber-scrollbar overflow-x-auto pb-3" aria-label={lang === "en" ? `${direction} number line` : `garisan nombor ${direction === "ascending" ? "menaik" : "menurun"}`}>
        <div className="mx-auto flex w-max min-w-full items-center justify-center gap-1">
          {values.map((value, index) => (
            <React.Fragment key={value}>
              <span className={`grid h-12 w-12 place-items-center rounded-xl border-2 text-xl font-black transition-all duration-200 ${index < revealed ? "scale-100 border-yellow-300 bg-cyan-950 text-yellow-200 opacity-100" : "scale-75 border-slate-700 bg-slate-900 text-slate-700 opacity-30"}`} style={NUMBER_TEXT_STYLE}>{value}</span>
              {index < values.length - 1 && (
                <span className={`grid min-w-12 place-items-center font-black transition-opacity duration-200 ${index + 1 < revealed ? "text-cyan-300 opacity-100" : "text-slate-700 opacity-25"}`}>
                  <span className="text-lg leading-none">{direction === "ascending" ? "+1" : "−1"}</span>
                  <span className="mt-1 text-2xl leading-none" aria-hidden="true">→</span>
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      {!done && <button type="button" onClick={() => void reveal()} disabled={running} className="mx-auto mt-3 flex min-h-13 items-center justify-center rounded-2xl border-2 border-cyan-200 bg-blue-600 px-6 font-black text-white shadow-[0_5px_0_#1e3a8a] disabled:opacity-60">
        {running
            ? (lang === "en" ? "Revealing..." : "Sedang menunjukkan...")
            : direction === "ascending"
              ? (lang === "en" ? "Reveal the number line" : "Tunjukkan garisan nombor")
              : (lang === "en" ? "Show the descending line" : "Tunjukkan garisan menurun")}
      </button>}
    </section>
  );
}

function SequencingTapCounter({ direction, lang, onComplete }: { direction: "up" | "down"; lang: Lang; onComplete: () => void }) {
  const start = direction === "up" ? 11 : 20;
  const target = direction === "up" ? 20 : 9;
  const [count, setCount] = useState(start);
  const [flying, setFlying] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const tapLockRef = useRef(false);
  const done = count === target;
  const busy = flying || coolingDown;

  const moveOne = async () => {
    if (tapLockRef.current || done) return;
    tapLockRef.current = true;
    setFlying(true);
    await wait(600);
    const next = direction === "up" ? count + 1 : count - 1;
    setCount(next);
    speakNumber(next, lang);
    setCoolingDown(next !== target);
    setFlying(false);
    if (next === target) {
      tapLockRef.current = false;
      onComplete();
      return;
    }
    await wait(800);
    setCoolingDown(false);
    tapLockRef.current = false;
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border-2 border-cyan-300 bg-cyan-950/55 p-5">
      <style>{`@keyframes sequenceFlyIn{0%{transform:translateY(-70px) scale(.7);opacity:0}100%{transform:translateY(70px) scale(1);opacity:1}}@keyframes sequenceFlyOut{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-110px) translateX(80px) scale(.65);opacity:0}}`}</style>
      {!done && <button type="button" onClick={() => void moveOne()} disabled={busy} className="group relative mx-auto flex min-h-16 items-center justify-center rounded-2xl border-2 border-yellow-100 bg-yellow-400 px-8 text-lg font-black text-slate-950 shadow-[0_7px_0_#a16207,0_0_0_0_rgba(250,204,21,0)] transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-yellow-300 hover:shadow-[0_9px_0_#a16207,0_0_24px_rgba(250,204,21,.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 active:translate-y-1 active:scale-95 active:shadow-[0_2px_0_#a16207] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100">
        {flying
          ? direction === "up"
            ? (lang === "en" ? "Adding a banana..." : "Menambah pisang...")
            : (lang === "en" ? "Removing a banana..." : "Membuang pisang...")
          : coolingDown
            ? (lang === "en" ? "Get ready for the next one..." : "Bersedia untuk yang seterusnya...")
          : direction === "up"
            ? (lang === "en" ? "Add to 20 bananas!" : "Tambah hingga 20 pisang!")
            : (lang === "en" ? "Remove one" : "Buang satu")}
        {!busy && !done && (
          <span className="pointer-events-none absolute -right-4 -top-4 grid h-11 w-11 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-amber-700 shadow-md transition-transform duration-200 motion-safe:animate-bounce group-hover:rotate-[-10deg] group-hover:scale-110" aria-hidden="true">
            <PointerIcon />
          </span>
        )}
      </button>}
      <div className="relative mx-auto mt-5 max-w-4xl">
        {flying && (
          <span className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2" style={{ animation: `${direction === "up" ? "sequenceFlyIn" : "sequenceFlyOut"} 600ms ease-in-out both` }} aria-hidden="true">
            <SpriteIcon value={BANANA} className="h-14 w-14 drop-shadow-[0_0_12px_rgba(250,204,21,.8)]" />
          </span>
        )}
        <SequencingBananaBox count={count} hiddenIndex={direction === "down" && flying ? count - 1 : null} compact showCountLabels countLabelThrough={count} interleavedRows />
      </div>
      <div className="mx-auto mt-4 grid h-24 w-32 place-items-center rounded-3xl border-4 border-yellow-300 bg-slate-950 text-6xl font-black text-yellow-200 shadow-[0_6px_0_#a16207]" style={NUMBER_TEXT_STYLE} aria-live="polite">{count}</div>
    </section>
  );
}

function SequencingDescendingPhase({ lang, onComplete }: { lang: Lang; onComplete: () => void }) {
  const [reachedNine, setReachedNine] = useState(false);
  const [lineDone, setLineDone] = useState(false);
  return (
    <div className="space-y-5">
      <SequencingTapCounter direction="down" lang={lang} onComplete={() => setReachedNine(true)} />
      {reachedNine && (
        <p className="comparison-result-reveal rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-5 py-4 text-center text-xl font-black text-slate-950">
          {lang === "en" ? "9! Now we're back to one digit." : "9! Sekarang kita balik ke satu digit."}
        </p>
      )}
      {reachedNine && <SequenceNumberLine direction="descending" lang={lang} onComplete={() => { setLineDone(true); onComplete(); }} />}
      {lineDone && <p className="text-center text-lg font-black text-emerald-200">{lang === "en" ? "Every step down is −1." : "Setiap langkah turun ialah −1."}</p>}
    </div>
  );
}

type SequencingPracticeQuestion = {
  id: string;
  kind: "after" | "before" | "middle";
  values: Array<number | null>;
  answer: number;
  options: number[];
  direction: "up" | "down";
};

const ADVANCED_SEQUENCING_QUESTIONS: SequencingPracticeQuestion[] = [
  { id: "seq-after-9", kind: "after", values: [8, 9, null], answer: 10, options: [10, 8, 9, 11], direction: "up" },
  { id: "seq-after-13", kind: "after", values: [11, 12, 13, null], answer: 14, options: [14, 12, 13, 15], direction: "up" },
  { id: "seq-after-19", kind: "after", values: [17, 18, 19, null], answer: 20, options: [20, 18, 17, 19], direction: "up" },
  { id: "seq-before-10", kind: "before", values: [null, 10, 11], answer: 9, options: [9, 11, 8, 10], direction: "up" },
  { id: "seq-before-15", kind: "before", values: [null, 15, 16, 17], answer: 14, options: [14, 16, 13, 15], direction: "up" },
  { id: "seq-before-2", kind: "before", values: [null, 2, 3, 4], answer: 1, options: [1, 3, 0, 2], direction: "up" },
  { id: "seq-middle-up", kind: "middle", values: [13, null, 15], answer: 14, options: [14, 12, 13, 16], direction: "up" },
  { id: "seq-middle-down", kind: "middle", values: [18, null, 16], answer: 17, options: [17, 19, 16, 18], direction: "down" },
  { id: "seq-middle-down-10", kind: "middle", values: [11, null, 9], answer: 10, options: [10, 12, 9, 11], direction: "down" },
];

function AdvancedSequencingPractice({ lang, t, onBack, onDone }: { lang: Lang; t: UIStrings; onBack: () => void; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const question = ADVANCED_SEQUENCING_QUESTIONS[index];
  const correct = selected === question.answer;
  const prompt = question.kind === "after"
    ? (lang === "en" ? "What number comes next?" : "Nombor apa seterusnya?")
    : question.kind === "before"
      ? (lang === "en" ? "What number comes before?" : "Nombor apa sebelumnya?")
      : (lang === "en" ? "Fill in the missing number." : "Isi nombor yang hilang.");
  const ruleStart = question.kind === "before"
    ? Number(question.values[1])
    : Number(question.values[question.values.findIndex((value) => value === null) - 1]);
  const feedbackCountsUp = question.kind !== "before" && question.direction === "up";
  const feedback = selected == null ? "" : feedbackCountsUp
    ? (lang === "en"
      ? `${ruleStart} + 1 is ${question.answer}${correct ? ". Every number is one more than the last." : `, not ${selected}. Every number is one more than the last.`}`
      : `${ruleStart} tambah 1 sama dengan ${question.answer}${correct ? ". Setiap nombor satu lebih dari sebelumnya." : `, bukan ${selected}. Setiap nombor satu lebih dari sebelumnya.`}`)
    : (lang === "en"
      ? `${ruleStart} − 1 is ${question.answer}${correct ? ". Every number is one less than the last." : `, not ${selected}. Every number is one less than the last.`}`
      : `${ruleStart} tolak 1 sama dengan ${question.answer}${correct ? ". Setiap nombor satu kurang dari sebelumnya." : `, bukan ${selected}. Setiap nombor satu kurang dari sebelumnya.`}`);

  const choose = (option: number) => {
    if (selected !== null) return;
    setSelected(option);
    if (option === question.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (index === ADVANCED_SEQUENCING_QUESTIONS.length - 1) {
      onDone();
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-3 shadow-[0_10px_0_#083344]">
        <LessonShell lang={lang} title={lang === "en" ? "Cyber Mission 3: Sequencing Practice" : "Misi Siber 3: Latihan Urutan"} helper={`${index + 1}/${ADVANCED_SEQUENCING_QUESTIONS.length} · ${t.score}: ${score}`} variant="cyber">
          <button type="button" onClick={onBack} className="mb-5 rounded-2xl border-2 border-cyan-300 bg-slate-950 px-5 py-3 font-black text-cyan-100 shadow-[0_4px_0_#164e63]">{lang === "en" ? "Back to lesson" : "Kembali ke pelajaran"}</button>
          <div className="rounded-[2rem] border-2 border-cyan-300 bg-cyan-950/60 p-5 text-center">
            <h3 className="text-3xl font-black text-yellow-200">{prompt}</h3>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3" aria-label={prompt}>
              {question.values.map((value, valueIndex) => (
                <React.Fragment key={valueIndex}>
                  <span className={`grid h-20 min-w-20 place-items-center rounded-2xl border-4 px-3 text-4xl font-black shadow-[0_5px_0_#164e63] ${value === null ? "border-yellow-300 bg-slate-950 text-yellow-200" : "border-cyan-300 bg-cyan-950 text-cyan-100"}`} style={NUMBER_TEXT_STYLE}>{value ?? "?"}</span>
                  {valueIndex < question.values.length - 1 && <span className="text-2xl font-black text-cyan-300" aria-hidden="true">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {question.options.map((option) => {
              const isPicked = selected === option;
              const isAnswer = option === question.answer;
              const stateClass = selected === null
                ? "border-cyan-300 bg-slate-950 text-cyan-50 hover:bg-cyan-950"
                : isAnswer
                  ? "border-emerald-300 bg-emerald-800 text-white"
                  : isPicked
                    ? "border-orange-300 bg-orange-950 text-orange-100"
                    : "border-slate-700 bg-slate-900 text-slate-500";
              return <button key={option} type="button" onClick={() => choose(option)} disabled={selected !== null} className={`min-h-20 rounded-3xl border-2 text-4xl font-black shadow-[0_5px_0_rgba(0,0,0,.2)] ${stateClass}`} style={getNumberTextStyle(option)}>{option}</button>;
            })}
          </div>
          {selected !== null && (
            <div className={`comparison-result-reveal mt-5 rounded-2xl border-2 px-5 py-4 text-center text-lg font-black ${correct ? "border-emerald-300 bg-emerald-950 text-emerald-100" : "border-orange-300 bg-orange-950 text-orange-100"}`}>
              {correct && <CorrectCelebration key={question.id} />}
              <p className="text-2xl">{correct ? (lang === "en" ? "Correct!" : "Betul!") : (lang === "en" ? "Good try. Use the rule:" : "Cubaan baik. Guna peraturan:")}</p>
              <p className="mt-2">{feedback}</p>
              <button type="button" onClick={next} className="mt-4 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207]">{index === ADVANCED_SEQUENCING_QUESTIONS.length - 1 ? t.finish : t.nextQuestion}</button>
            </div>
          )}
        </LessonShell>
      </div>
    </main>
  );
}

function AdvancedSequencingLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const [completed, setCompleted] = useState<boolean[]>(Array(6).fill(false));
  const finishPhase = (phaseIndex: number) => setCompleted((current) => current.map((value, index) => index === phaseIndex ? true : value));
  const phaseCopy = [
    { title: lang === "en" ? "Count from 1 to 9" : "Kira dari 1 hingga 9", text: lang === "en" ? "Start with the numbers you already know." : "Mulakan dengan nombor yang kamu sudah kenal." },
    { title: lang === "en" ? "From 9 to 10" : "Daripada 9 ke 10", text: lang === "en" ? "Add one banana to cross from a one-digit number to a two-digit number." : "Tambah satu pisang untuk bergerak daripada nombor satu digit kepada nombor dua digit." },
    { title: lang === "en" ? "From 10 to 11" : "Daripada 10 ke 11", text: lang === "en" ? "Continue from 10. The same +1 rule makes 11." : "Sambung daripada 10. Peraturan +1 yang sama menghasilkan 11." },
    { title: lang === "en" ? "Keep adding one" : "Terus tambah satu", text: lang === "en" ? "Tap once for each new banana as you grow the sequence from 11 to 20." : "Tekan sekali untuk setiap pisang baharu semasa membina urutan daripada 11 hingga 20." },
    { title: lang === "en" ? "Counting up is ascending" : "Kira naik ialah menaik", text: lang === "en" ? "Reveal how every number from 0 to 20 is connected by +1." : "Lihat bagaimana setiap nombor daripada 0 hingga 20 disambung dengan +1." },
    { title: lang === "en" ? "Count down with −1" : "Kira turun dengan −1", text: lang === "en" ? "Remove one banana at a time, then reveal the descending number line." : "Buang satu pisang setiap kali, kemudian lihat garisan nombor menurun." },
  ];

  if (showPractice) return <AdvancedSequencingPractice lang={lang} t={t} onBack={() => { setShowPractice(false); setPhase(5); }} onDone={onDone} />;

  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3">
        <LessonShell lang={lang} title={t.advancedSequencing} helper={lang === "en" ? "Cyber Mission 3 — Build sequences from 0 to 20 with +1 and −1." : "Misi Siber 3 — Bina urutan 0 hingga 20 dengan +1 dan −1."} variant="cyber">
          <div className="mb-5 grid grid-cols-6 gap-2">{Array.from({ length: 6 }, (_, index) => <span key={index} className={`h-3 rounded-full border ${index <= phase ? "border-yellow-200 bg-yellow-400" : "border-slate-600 bg-slate-700"}`} />)}</div>
          <CyberTeachingCard eyebrow={lang === "en" ? "Cyber Mission 3: Sequencing" : "Misi Siber 3: Urutan"} title={phaseCopy[phase].title} text={phaseCopy[phase].text} />
          {phase === 0 && <SequencingAnchorPhase key="sequence-anchor" lang={lang} onComplete={() => finishPhase(0)} />}
          {phase === 1 && <SequencingPlusOnePhase key="sequence-9-10" base={9} lang={lang} onComplete={() => finishPhase(1)} />}
          {phase === 2 && <SequencingPlusOnePhase key="sequence-10-11" base={10} lang={lang} onComplete={() => finishPhase(2)} />}
          {phase === 3 && <SequencingTapCounter key="sequence-up" direction="up" lang={lang} onComplete={() => finishPhase(3)} />}
          {phase === 4 && <SequenceNumberLine key="sequence-line-up" direction="ascending" lang={lang} onComplete={() => finishPhase(4)} />}
          {phase === 5 && <SequencingDescendingPhase key="sequence-down" lang={lang} onComplete={() => finishPhase(5)} />}
          <AdvancedLessonNavigation lang={lang} t={t} phase={phase} lastPhase={5} canNext={completed[phase]} onPrevious={() => setPhase((value) => Math.max(0, value - 1))} onNext={() => phase === 5 ? setShowPractice(true) : setPhase((value) => value + 1)} onPractice={() => setShowPractice(true)} />
        </LessonShell>
      </div>
    </main>
  );
}

type CookieFlightState = {
  left: number;
  top: number;
  x: number;
  y: number;
  p30X: number;
  p30Y: number;
  p55X: number;
  p55Y: number;
  p75X: number;
  p75Y: number;
  p90X: number;
  p90Y: number;
  p97X: number;
  p97Y: number;
  size: number;
  sourceIndex: number;
};

function AdvancedCookieTrayCountingIntro({ lang, onComplete }: { lang: Lang; onComplete: () => void }) {
  const cookie = String.fromCodePoint(0x1f36a);
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [completedTrays, setCompletedTrays] = useState({ left: false, right: false });
  const [countingTray, setCountingTray] = useState<"left" | "right" | null>(null);
  const [readyToTransfer, setReadyToTransfer] = useState(false);
  const [transferred, setTransferred] = useState(0);
  const [transferring, setTransferring] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [flyingCookie, setFlyingCookie] = useState<CookieFlightState | null>(null);
  const chrysTrayRef = useRef<HTMLDivElement>(null);
  const alyseTrayRef = useRef<HTMLDivElement>(null);
  const chrysCookieAreaRef = useRef<HTMLDivElement>(null);
  const alyseCookieAreaRef = useRef<HTMLDivElement>(null);
  const completionReportedRef = useRef(false);
  const runRef = useRef(0);
  const soundEnabled = React.useContext(AudioEnabledContext);
  const prefersReducedMotion = usePrefersReducedMotion();

  const getObjectBounds = (container: HTMLDivElement | null, index: number) => {
    if (!container) return null;
    const matches = Array.from(container.querySelectorAll<HTMLElement>(`[data-advanced-object-index="${index}"]`));
    const visibleMatch = matches.find((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    return visibleMatch?.getBoundingClientRect() ?? null;
  };

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const countTray = async (side: "left" | "right", count: number) => {
    if (countingTray || transferring || transferComplete) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    stopNumberAudio();
    setReadyToTransfer(false);
    setCompletedTrays((current) => ({ ...current, [side]: false }));
    setCountingTray(side);
    const update = side === "left" ? setLeftCount : setRightCount;
    update(0);
    if (soundEnabled && NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) update(value);
      });
    } else {
      for (let value = 1; value <= count; value += 1) {
        await wait(prefersReducedMotion ? 80 : Math.max(420, COUNTING_STEP_MS));
        if (runRef.current !== runId) return;
        update(value);
      }
    }
    if (runRef.current !== runId) return;
    update(count);
    await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
    if (runRef.current !== runId) return;
    setCompletedTrays((current) => ({ ...current, [side]: true }));
    setCountingTray(null);
    const otherTrayComplete = side === "left" ? completedTrays.right : completedTrays.left;
    if (otherTrayComplete) {
      setReadyToTransfer(true);
    }
  };

  const resetIntro = () => {
    runRef.current += 1;
    stopNumberAudio();
    setLeftCount(0);
    setRightCount(0);
    setCompletedTrays({ left: false, right: false });
    setCountingTray(null);
    setReadyToTransfer(false);
    setTransferred(0);
    setTransferring(false);
    setTransferComplete(false);
    setFlyingCookie(null);
  };

  const transferCookies = async () => {
    if (!readyToTransfer || transferring || transferComplete) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    stopNumberAudio();
    setTransferring(true);

    for (let moved = 1; moved <= 5; moved += 1) {
      if (runRef.current !== runId) return;
      const sourceBounds = getObjectBounds(chrysCookieAreaRef.current, 5 - moved);
      const destinationBounds = getObjectBounds(alyseCookieAreaRef.current, 7 + moved);
      if (sourceBounds && destinationBounds && !prefersReducedMotion) {
        const size = Math.min(sourceBounds.width, sourceBounds.height);
        const left = sourceBounds.left + (sourceBounds.width / 2) - (size / 2);
        const top = sourceBounds.top + (sourceBounds.height / 2) - (size / 2);
        const x = (destinationBounds.left + (destinationBounds.width / 2) - (size / 2)) - left;
        const y = (destinationBounds.top + (destinationBounds.height / 2) - (size / 2)) - top;
        const controlX = x / 2;
        const controlY = (y / 2) - 160;
        const curvePoint = (progress: number) => {
          const remaining = 1 - progress;
          return {
            x: (2 * remaining * progress * controlX) + (progress * progress * x),
            y: (2 * remaining * progress * controlY) + (progress * progress * y),
          };
        };
        const p30 = curvePoint(0.3);
        const p55 = curvePoint(0.55);
        const p75 = curvePoint(0.75);
        const p90 = curvePoint(0.9);
        const p97 = curvePoint(0.97);
        setFlyingCookie({
          left,
          top,
          x,
          y,
          p30X: p30.x,
          p30Y: p30.y,
          p55X: p55.x,
          p55Y: p55.y,
          p75X: p75.x,
          p75Y: p75.y,
          p90X: p90.x,
          p90Y: p90.y,
          p97X: p97.x,
          p97Y: p97.y,
          size,
          sourceIndex: 5 - moved,
        });
        await wait(1650);
      }
      if (runRef.current !== runId) return;
      setTransferred(moved);
      await wait(prefersReducedMotion ? 80 : 90);
      setFlyingCookie(null);
      if (soundEnabled && NUMBER_AUDIO_ENABLED && !audioMuted) {
        await speakCountingSequence(8 + moved, lang, COUNTING_STEP_MS, undefined, undefined, 8 + moved);
      } else {
        await wait(prefersReducedMotion ? 80 : 340);
      }
    }

    if (runRef.current !== runId) return;
    setTransferring(false);
    setTransferComplete(true);
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onComplete();
    }
  };

  const chrysCookieCount = 5 - transferred;
  const alyseCookieCount = 8 + transferred;
  const alyseRowPattern = [5, 5, 3];

  const tray = ({ side, initialCount, displayCount, countedThrough, name, character, borderClass, textClass, trayRef, objectAreaRef, rowPattern, slotCount }: { side: "left" | "right"; initialCount: number; displayCount: number; countedThrough: number; name: string; character: string; borderClass: string; textClass: string; trayRef: React.RefObject<HTMLDivElement | null>; objectAreaRef: React.RefObject<HTMLDivElement | null>; rowPattern?: number[]; slotCount: number }) => {
    const finished = completedTrays[side] && countedThrough === initialCount;
    const busy = countingTray === side;
    return (
      <div ref={trayRef} className={`rounded-[1.75rem] border-2 bg-slate-950/75 p-4 ${borderClass}`}>
        <div className="mb-2 flex items-center justify-center gap-3">
          <img src={character} alt="" className="h-14 w-14 object-contain" />
          <p className={`text-xl font-black ${textClass}`}>{name}</p>
        </div>
        <div className="relative mx-auto aspect-[1.29/1] w-full max-w-[32rem]" aria-label={lang === "en" ? `${displayCount} cookies in ${name}` : `${displayCount} biskut di ${name}`}>
          <img src={trayImage} alt="" className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_8px_rgba(0,0,0,.28)]" />
          <div ref={objectAreaRef} className="absolute inset-x-[10%] inset-y-[18%] grid -translate-y-2 place-items-center sm:-translate-y-3">
            {displayCount > 0
              ? <AdvancedBananaRow count={slotCount} visibleThrough={displayCount} hiddenIndex={side === "left" ? flyingCookie?.sourceIndex : null} countedThrough={readyToTransfer ? displayCount : countedThrough} showCountLabels isCounting={countingTray === side || (transferring && side === "right" && !flyingCookie)} splitOnDesktop={!rowPattern} rowPattern={rowPattern} emoji={cookie} largeObjects spacious />
              : <span className="text-5xl font-black text-slate-400">0</span>}
          </div>
        </div>
        {finished && (
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-cyan-200 bg-blue-600 px-6 py-3 text-lg font-black text-white shadow-[0_5px_0_#164e63]">
            {lang === "en" ? `Total: ${displayCount} cookies` : `Jumlah: ${displayCount} biskut`}
          </p>
        )}
        <button
          type="button"
          disabled={countingTray !== null || transferring || transferComplete}
          onClick={() => void countTray(side, initialCount)}
          className="relative mt-3 rounded-2xl border-2 border-cyan-200 bg-blue-600 px-6 py-3 text-lg font-black text-white shadow-[0_5px_0_#164e63] active:translate-y-1 disabled:cursor-default disabled:text-white disabled:opacity-100"
        >
          {busy
            ? (lang === "en" ? "Counting..." : "Sedang mengira...")
            : finished
              ? (lang === "en" ? "Count again" : "Kira lagi")
              : (lang === "en" ? `Count ${name}` : `Kira ${name}`)}
          {!countingTray && !transferring && !transferComplete && <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>}
        </button>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-5 text-center">
      <style>{`@keyframes cookieFlightCurve{0%{transform:translate3d(0,0,0) rotate(0deg) scale(1)}27%{transform:translate3d(var(--cookie-p30-x),var(--cookie-p30-y),0) rotate(-6deg) scale(1.04)}50%{transform:translate3d(var(--cookie-p55-x),var(--cookie-p55-y),0) rotate(-9deg) scale(1.06)}68%{transform:translate3d(var(--cookie-p75-x),var(--cookie-p75-y),0) rotate(-7deg) scale(1.05)}82%{transform:translate3d(var(--cookie-p90-x),var(--cookie-p90-y),0) rotate(-4deg) scale(1.03)}92%{transform:translate3d(var(--cookie-p97-x),var(--cookie-p97-y),0) rotate(-2deg) scale(1.01)}100%{transform:translate3d(var(--cookie-x),var(--cookie-y),0) rotate(0deg) scale(1)}}.cookie-flight-curve{will-change:transform}@media(prefers-reduced-motion:reduce){.cookie-flight-curve{animation:none!important}}`}</style>
      {flyingCookie && (
        <span
          className="cookie-flight-curve pointer-events-none fixed z-[80] grid place-items-center drop-shadow-[0_8px_8px_rgba(0,0,0,.35)]"
          style={{
            left: flyingCookie.left,
            top: flyingCookie.top,
            width: flyingCookie.size,
            height: flyingCookie.size,
            "--cookie-x": `${flyingCookie.x}px`,
            "--cookie-y": `${flyingCookie.y}px`,
            "--cookie-p30-x": `${flyingCookie.p30X}px`,
            "--cookie-p30-y": `${flyingCookie.p30Y}px`,
            "--cookie-p55-x": `${flyingCookie.p55X}px`,
            "--cookie-p55-y": `${flyingCookie.p55Y}px`,
            "--cookie-p75-x": `${flyingCookie.p75X}px`,
            "--cookie-p75-y": `${flyingCookie.p75Y}px`,
            "--cookie-p90-x": `${flyingCookie.p90X}px`,
            "--cookie-p90-y": `${flyingCookie.p90Y}px`,
            "--cookie-p97-x": `${flyingCookie.p97X}px`,
            "--cookie-p97-y": `${flyingCookie.p97Y}px`,
            animation: "cookieFlightCurve 1650ms linear both",
          } as React.CSSProperties}
          aria-hidden="true"
        >
          <SpriteIcon value={cookie} className="h-full w-full" />
        </span>
      )}
      <div className="mx-auto grid max-w-[78rem] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {tray({ side: "left", initialCount: 5, displayCount: chrysCookieCount, countedThrough: leftCount, name: lang === "en" ? "Chrys's tray" : "Dulang Chrys", character: chrysThinking, borderClass: "border-cyan-400", textClass: "text-cyan-100", trayRef: chrysTrayRef, objectAreaRef: chrysCookieAreaRef, slotCount: 5 })}
        <span data-math-cue={readyToTransfer ? undefined : "plus"} className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-yellow-300 bg-yellow-300 text-4xl font-black text-slate-950 shadow-[0_5px_0_#a16207]" aria-hidden="true">{readyToTransfer ? "→" : "+"}</span>
        {tray({ side: "right", initialCount: 8, displayCount: alyseCookieCount, countedThrough: rightCount, name: lang === "en" ? "Alyse's tray" : "Dulang Alyse", character: alyseGuide, borderClass: "border-emerald-300", textClass: "text-emerald-100", trayRef: alyseTrayRef, objectAreaRef: alyseCookieAreaRef, rowPattern: alyseRowPattern, slotCount: 13 })}
      </div>
      {readyToTransfer && !transferComplete && (
        <button type="button" disabled={transferring} onClick={() => void transferCookies()} className="relative mx-auto mt-6 flex min-h-16 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-yellow-300 px-8 text-xl font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-60">
          {transferring
            ? (lang === "en" ? `Giving cookie ${Math.min(5, transferred + 1)} of 5...` : `Memberi biskut ${Math.min(5, transferred + 1)} daripada 5...`)
            : (lang === "en" ? "Give Alyse 5 cookies" : "Beri Alyse 5 biskut")}
          {!transferring && <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>}
        </button>
      )}
      {transferComplete && (
        <div className="comparison-result-reveal mx-auto mt-6 max-w-2xl rounded-2xl border-2 border-emerald-300 bg-emerald-950/80 px-6 py-4 text-emerald-100" role="status">
          <p className="text-2xl font-black">{lang === "en" ? "Alyse now has all 13 cookies." : "Alyse kini mempunyai kesemua 13 biskut."}</p>
          <p className="mt-2 text-xl font-black text-cyan-100">{lang === "en" ? "Chrys gave her 5 cookies, so 8 + 5 = 13." : "Chrys memberinya 5 biskut, jadi 8 + 5 = 13."}</p>
          <button type="button" onClick={resetIntro} className="relative mx-auto mt-5 rounded-2xl border-2 border-cyan-200 bg-cyan-600 px-7 py-3 text-lg font-black text-white shadow-[0_5px_0_#164e63] active:translate-y-1">
            {lang === "en" ? "Count again" : "Kira lagi"}
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>
          </button>
        </div>
      )}
    </div>
  );
}

function AdvancedAdditionPart1Lesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const [completed, setCompleted] = useState<boolean[]>(Array(4).fill(false));
  const finishPhase = (phaseIndex: number) => setCompleted((current) => current.map((value, index) => index === phaseIndex ? true : value));
  if (showPractice) return <Quiz lang={lang} t={t} title={lang === "en" ? "Cyber Mission 4: Banana Row Practice" : "Misi Siber 4: Latihan Baris Pisang"} questions={advancedAdditionPart1Questions} randomize={false} variant="cyber" onBackToLearning={() => { setShowPractice(false); setPhase(3); }} onFinish={() => onDone()} />;
  const titles = [
    lang === "en" ? "Chrys gives Alyse 5 cookies" : "Chrys memberi Alyse 5 biskut",
    lang === "en" ? "Add 8 + 5 horizontally" : "Tambah 8 + 5 secara mendatar",
    lang === "en" ? "Bananas on the forest floor" : "Pisang di lantai hutan",
    lang === "en" ? "Count every banana together" : "Kira setiap pisang sekali",
  ];
  const texts = [
    lang === "en" ? "Alyse has 8 cookies. Chrys gives her 5 more." : "Alyse ada 8 biskut. Chrys memberinya 5 lagi.",
    lang === "en" ? "Count 8. Count 5. Join both groups to make 13." : "Kira 8. Kira 5. Gabungkan kedua-dua kumpulan menjadi 13.",
    lang === "en" ? "Move 8 bananas into Chrys's basket. Count from 7 to 15." : "Pindahkan 8 pisang ke dalam bakul Chrys. Kira dari 7 hingga 15.",
    lang === "en" ? "Join the rows. Count all the bananas." : "Gabungkan baris. Kira semua pisang.",
  ];
  return (
    <main className="mx-auto w-full max-w-7xl pb-8"><div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3"><LessonShell lang={lang} title={t.advancedAdditionPart1} helper={lang === "en" ? "Cyber Mission 4 - Add cookies and bananas up to 20." : "Misi Siber 4 - Tambah biskut dan pisang hingga 20."} variant="cyber">
      <div className="mb-5 grid grid-cols-4 gap-2">{Array.from({ length: 4 }, (_, index) => <span key={index} className={`h-3 rounded-full border ${index <= phase ? "border-yellow-200 bg-yellow-400" : "border-slate-600 bg-slate-700"}`} />)}</div>
      <CyberTeachingCard eyebrow={lang === "en" ? "Cyber Mission 4" : "Misi Siber 4"} title={titles[phase]} text={texts[phase]} />
      {phase === 0 && <AdvancedCookieTrayCountingIntro key="cookie-tray-counting-intro" lang={lang} onComplete={() => finishPhase(0)} />}
      {phase === 1 && <AdvancedCookieAdditionScenario key="cookie-horizontal-method" lang={lang} onSolved={() => finishPhase(1)} />}
      {phase === 2 && <AdvancedAdditionRowScenario key="row-story-7-8" base={7} extra={8} lang={lang} source="branch" onSolved={() => finishPhase(2)} />}
      {phase === 3 && (
        <div className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 text-center sm:p-6">
          <p className="text-xl font-black text-cyan-50">{lang === "en" ? "You joined two banana rows and counted every banana." : "Kamu gabungkan dua baris pisang dan kira setiap pisang."}</p>
          <div className="mx-auto mt-5 grid max-w-4xl gap-4 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-cyan-500 bg-slate-950/75 p-4"><AdvancedBananaRow count={13} /><p className="mt-3 text-3xl font-black text-yellow-200">8 + 5 = 13</p></div>
            <div className="rounded-3xl border-2 border-emerald-400 bg-slate-950/75 p-4"><AdvancedBananaRow count={15} /><p className="mt-3 text-3xl font-black text-yellow-200">7 + 8 = 15</p></div>
          </div>
        </div>
      )}
      <AdvancedLessonNavigation lang={lang} t={t} phase={phase} lastPhase={3} canNext={phase === 3 || completed[phase]} onPrevious={() => setPhase((value) => Math.max(0, value - 1))} onNext={() => phase === 3 ? setShowPractice(true) : setPhase((value) => value + 1)} onPractice={() => setShowPractice(true)} />
    </LessonShell></div></main>
  );
}

function AdvancedVerticalAdditionStory({ lang, character, characterName, story, a, b, object }: { lang: Lang; character: string; characterName: string; story: string; a: number; b: number; object: CarryObject }) {
  return (
    <section className="rounded-[2rem] border-2 border-emerald-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-5 shadow-[0_6px_0_#065f46]">
      <div className="grid items-center gap-5 md:grid-cols-[auto_1fr]">
        <img src={character} alt={characterName} className="mx-auto h-28 w-28 object-contain drop-shadow-lg" />
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-emerald-300">{lang === "en" ? "Story example" : "Contoh cerita"}</p>
          <p className="mt-2 text-xl font-black leading-relaxed text-white">{story}</p>
        </div>
      </div>
      <div className="mx-auto mt-5 grid max-w-4xl items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-3xl border-2 border-cyan-400 bg-slate-950/80 p-4">
          <AdvancedBananaRow count={a} emoji={object.emoji} label={lang === "en" ? `${a} ${object.enPlural}` : `${a} ${object.ms}`} />
          <p className="mt-2 text-center text-lg font-black text-cyan-100">{lang === "en" ? `${a} ${object.enPlural}` : `${a} ${object.ms}`}</p>
        </div>
        <span data-math-cue="plus" className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-yellow-300 bg-yellow-300 text-4xl font-black text-slate-950 shadow-[0_5px_0_#a16207]" aria-hidden="true">+</span>
        <div className="rounded-3xl border-2 border-emerald-400 bg-slate-950/80 p-4">
          <AdvancedBananaRow count={b} emoji={object.emoji} label={lang === "en" ? `${b} ${object.enPlural}` : `${b} ${object.ms}`} />
          <p className="mt-2 text-center text-lg font-black text-emerald-100">{lang === "en" ? `${b} ${object.enPlural}` : `${b} ${object.ms}`}</p>
        </div>
      </div>
      <p className="mt-5 text-center text-xl font-black text-cyan-100">
        {lang === "en" ? `Write ${a} + ${b} vertically, then add the ones.` : `Tulis ${a} + ${b} secara menegak, kemudian tambah sa.`}
      </p>
    </section>
  );
}

type AdvancedPart2BeatIndex = 0 | 1 | 2;

function getAdvancedPart2Beat(beat: AdvancedPart2BeatIndex) {
  return [
    { a: 8, b: 5, total: 13 },
    { a: 12, b: 2, total: 14 },
    { a: 10, b: 10, total: 20 },
  ][beat];
}

function AdvancedPart2LooseBananas({ count, countedThrough = 0, counting = false, startLabel = 1, compact = false, movingFirstTen = false }: { count: number; countedThrough?: number; counting?: boolean; startLabel?: number; compact?: boolean; movingFirstTen?: boolean }) {
  const topCount = count <= 5 ? count : Math.ceil(count / 2);
  const rows = count <= 5 ? [count] : [topCount, count - topCount];
  let runningIndex = 0;
  return (
    <div className="mobile-part2-bananas grid justify-items-center gap-3">
      {rows.map((rowCount, rowIndex) => {
        const start = runningIndex;
        runningIndex += rowCount;
        return (
          <div key={rowIndex} className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {Array.from({ length: rowCount }, (_, offset) => {
              const index = start + offset;
              const counted = index < countedThrough;
              const active = counting && counted && index === countedThrough - 1;
              return (
                <span key={index} className={`relative grid shrink-0 place-items-center rounded-2xl border-2 transition-all ${movingFirstTen && index < 10 ? "translate-y-36 scale-75 opacity-0 duration-[900ms] ease-in-out" : "translate-y-0 duration-300"} ${compact ? "h-14 w-12" : "h-20 w-16"} ${active ? "z-10 scale-110 border-yellow-200 bg-cyan-950 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]" : counted ? "border-cyan-400 bg-cyan-950" : "border-cyan-900 bg-slate-900/90 opacity-45 grayscale"}`}>
                  <SpriteIcon value={BANANA} className={compact ? "h-10 w-10" : "h-12 w-12"} />
                  <span className={`absolute -top-3 left-1/2 grid h-7 min-w-7 -translate-x-1/2 place-items-center rounded-full px-1 text-sm font-black shadow-md ${active ? "bg-yellow-400 text-slate-950" : counted ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{startLabel + index}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AdvancedPart2CountableTen({ lang, countedThrough = 0, counting = false, startLabel = 1 }: { lang: Lang; countedThrough?: number; counting?: boolean; startLabel?: number }) {
  return (
    <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-[1.5rem] border-4 border-emerald-400 bg-emerald-950/75 p-2.5">
      <div className="grid grid-cols-5 place-items-center gap-x-2 gap-y-3 overflow-hidden rounded-xl border-2 border-emerald-400/80 bg-slate-950/85 px-3 pb-2.5 pt-4">
        {Array.from({ length: 10 }, (_, index) => {
          const counted = index < countedThrough;
          const active = counting && counted && index === countedThrough - 1;
          return (
            <span key={index} className={`relative grid h-9 w-9 place-items-center rounded-lg border transition-all duration-300 ${active ? "z-10 scale-105 border-yellow-200 ring-2 ring-yellow-300/90 shadow-[0_0_14px_rgba(250,204,21,.68)]" : counted ? "border-cyan-300 bg-cyan-950" : "border-slate-700 bg-slate-950/55 opacity-55 grayscale"}`}>
              <SpriteIcon value={BANANA} className="h-7 w-7" />
              <span className={`absolute -top-2.5 left-1/2 grid h-5 min-w-5 -translate-x-1/2 place-items-center rounded-full px-1 text-[10px] font-black leading-none shadow ${active ? "bg-yellow-400 text-slate-950" : counted ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{startLabel + index}</span>
            </span>
          );
        })}
      </div>
      <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full bg-emerald-800 px-3 py-1.5 text-white">
        <span className="text-xl font-black" style={getNumberTextStyle(10)}>10</span>
        <span className="text-xs font-black">{lang === "en" ? "one ten" : "satu sepuluh"}</span>
      </div>
    </div>
  );
}

function AdvancedPart2OperandGroup({ value, countedThrough, counting, lang }: { value: number; countedThrough: number; counting: boolean; lang: Lang }) {
  const ones = value >= 10 ? value - 10 : value;
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-4">
      {value >= 10 && <AdvancedPart2CountableTen lang={lang} countedThrough={Math.min(10, countedThrough)} counting={counting && countedThrough <= 10} />}
      {ones > 0 && <AdvancedPart2LooseBananas count={ones} countedThrough={value >= 10 ? Math.max(0, countedThrough - 10) : countedThrough} counting={counting && (value < 10 || countedThrough > 10)} startLabel={value >= 10 ? 11 : 1} compact={value >= 10} />}
    </div>
  );
}

function AdvancedPart2CompactTen({ lang, count = 1 }: { lang: Lang; count?: 1 | 2 }) {
  return (
    <div className={`flex items-center justify-center gap-1 ${count === 2 ? "scale-[.62] min-[380px]:scale-75" : "scale-75"}`}>
      {Array.from({ length: count }, (_, index) => <TenBananaBundle key={index} lang={lang} compact />)}
    </div>
  );
}

function AdvancedPart2PanelAForm({ beat, complete, combined, tenInColumn, remainderCounted, tensCounted, tensCounting, lang }: { beat: AdvancedPart2BeatIndex; complete: boolean; combined: boolean; tenInColumn: boolean; remainderCounted: number; tensCounted: number; tensCounting: boolean; lang: Lang }) {
  const problem = getAdvancedPart2Beat(beat);
  const aDigits = String(problem.a).padStart(2, "0").split("");
  const bDigits = String(problem.b).padStart(2, "0").split("");
  const answerDigits = String(problem.total).padStart(2, "0").split("");
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border-4 border-cyan-300 bg-slate-950/90 p-5 shadow-[0_7px_0_#164e63]">
      <div className="mb-3 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-center text-sm font-black uppercase tracking-wider text-cyan-200">
        <span aria-hidden="true" />
        <span className="rounded-full border border-cyan-400 bg-cyan-950 px-3 py-2">{lang === "en" ? "Tens" : "Puluh"}</span>
        <span className="rounded-full border border-cyan-400 bg-cyan-950 px-3 py-2">{lang === "en" ? "Ones" : "Sa"}</span>
      </div>
      {tenInColumn && beat === 0 && <div className="mb-3 grid grid-cols-2 items-center"><div className="relative h-28"><div className="absolute left-1/2 top-1/2 w-[15rem] -translate-x-1/2 -translate-y-1/2 scale-[.45]"><AdvancedPart2CompactTen lang={lang} /><span className="absolute -right-12 top-1/2 text-6xl font-black text-yellow-200">1</span></div></div><span /></div>}
      {beat === 2 && combined && <div className="slide-in-up mb-4 grid grid-cols-2 gap-3"><div className="overflow-hidden rounded-2xl border-2 border-cyan-400 bg-cyan-950/60 p-2"><p className="mb-1 text-center text-xs font-black uppercase text-cyan-200">{lang === "en" ? "Tens column" : "Lajur puluh"}</p><div className="relative h-28"><div className="absolute left-1/2 top-1/2 flex w-[31rem] -translate-x-1/2 -translate-y-1/2 scale-[.30] items-center justify-center gap-4 sm:scale-[.38]">{([0, 1] as const).map((index) => <div key={index} className={`rounded-[1.75rem] transition-all ${tensCounting && tensCounted === index + 1 ? "scale-110 ring-8 ring-yellow-300 shadow-[0_0_30px_rgba(250,204,21,.7)]" : ""}`}><TenBananaBundle lang={lang} compact /></div>)}</div></div></div><div className="grid place-items-center rounded-2xl border-2 border-cyan-900 bg-slate-900/60 text-4xl font-black text-cyan-800">0</div></div>}
      <div className="relative grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] text-center text-5xl font-black text-yellow-200" style={getNumberTextStyle(problem.total)}>
        <span aria-hidden="true" /><span>{aDigits[0]}</span><span>{aDigits[1]}</span>
        <span data-math-cue="plus" className="grid place-items-center text-cyan-300" aria-hidden="true">+</span><span>{bDigits[0]}</span><span>{bDigits[1]}</span>
        <span className="col-span-3 my-3 border-t-4 border-cyan-300" />
        <span aria-hidden="true" /><span className={`transition-all duration-500 ${complete ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>{complete ? answerDigits[0] : "0"}</span>
        <span className={`transition-all duration-500 ${complete ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>{complete ? answerDigits[1] : beat === 0 && remainderCounted === 3 ? "3" : beat === 2 && tensCounted === 2 ? "0" : "0"}</span>
      </div>
    </section>
  );
}

function advancedPart2Summary(beat: AdvancedPart2BeatIndex, lang: Lang) {
  if (beat === 0) return lang === "en" ? "8 plus 5 equals 13. That's 1 ten and 3 ones." : "8 tambah 5 sama dengan 13. Itu 1 puluh dan 3 sa.";
  if (beat === 1) return lang === "en" ? "12 plus 2 equals 14. The ten stayed, the ones became 4." : "12 tambah 2 sama dengan 14. Puluh kekal, sa jadi 4.";
  return lang === "en" ? "1 ten plus 1 ten equals 2 tens. That's 20." : "1 puluh tambah 1 puluh sama dengan 2 puluh. Itu 20.";
}

function advancedPart2WalkthroughLines(beat: AdvancedPart2BeatIndex, lang: Lang) {
  const lines = beat === 0
    ? [
      ["Let's add 8 and 5 the vertical way.", "Jom tambah 8 dan 5 secara menegak."],
      ["First, add the ones column. 8 plus 5.", "Mula, tambah lajur sa. 8 tambah 5."],
      ["8 plus 5 equals 13. That's more than 9, so we carry the ten.", "8 tambah 5 sama dengan 13. Lebih dari 9, jadi kita bawa puluh."],
      ["Carry the 1 to the top of the tens column. It's small because it's a carried digit.", "Bawa 1 ke atas lajur puluh. Ia kecil sebab digit dibawa."],
      ["Write 3 in the ones column.", "Tulis 3 dalam lajur sa."],
      ["Now add the tens column. Carried 1, plus 0, plus 0.", "Sekarang tambah lajur puluh. 1 dibawa, tambah 0, tambah 0."],
      ["That's 1 in the tens column. So the answer is 13.", "Itu 1 dalam lajur puluh. Jadi jawapannya 13."],
      ["8 plus 5 equals 13. That's 1 ten and 3 ones.", "8 tambah 5 sama dengan 13. Itu 1 puluh dan 3 sa."],
    ]
    : beat === 1
      ? [
        ["Let's add 12 and 2 the vertical way.", "Jom tambah 12 dan 2 secara menegak."],
        ["First, add the ones column. 2 plus 2.", "Mula, tambah lajur sa. 2 tambah 2."],
        ["2 plus 2 equals 4. No carrying needed.", "2 tambah 2 sama dengan 4. Tak perlu bawa."],
        ["Now add the tens column. 1 plus 0.", "Sekarang tambah lajur puluh. 1 tambah 0."],
        ["That's 1 in the tens column. So the answer is 14.", "Itu 1 dalam lajur puluh. Jadi jawapannya 14."],
        ["12 plus 2 equals 14. That's 1 ten and 4 ones.", "12 tambah 2 sama dengan 14. Itu 1 puluh dan 4 sa."],
      ]
      : [
        ["Let's add 10 and 10 the vertical way.", "Jom tambah 10 dan 10 secara menegak."],
        ["First, add the ones column. 0 plus 0.", "Mula, tambah lajur sa. 0 tambah 0."],
        ["0 plus 0 equals 0.", "0 tambah 0 sama dengan 0."],
        ["Now add the tens column. 1 plus 1.", "Sekarang tambah lajur puluh. 1 tambah 1."],
        ["That's 2 in the tens column. So the answer is 20.", "Itu 2 dalam lajur puluh. Jadi jawapannya 20."],
        ["10 plus 10 equals 20. That's 2 tens.", "10 tambah 10 sama dengan 20. Itu 2 puluh."],
      ];
  return lines.map((line) => line[lang === "en" ? 0 : 1]);
}

function AdvancedPart2MethodPanel({ beat, lang, onComplete }: { beat: AdvancedPart2BeatIndex; lang: Lang; onComplete: () => void }) {
  const problem = getAdvancedPart2Beat(beat);
  const lines = useMemo(() => advancedPart2WalkthroughLines(beat, lang), [beat, lang]);
  const [step, setStep] = useState(0);
  const [showNextStep, setShowNextStep] = useState(false);
  const completionRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const finalStep = lines.length - 1;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setShowNextStep(false);
    speakText(lines[step], lang, { allowWhenWordAudioDisabled: true });
    const revealTimer = step < finalStep ? window.setTimeout(() => setShowNextStep(true), 1500) : null;
    const advanceTimer = window.setTimeout(() => {
      if (step < finalStep) setStep((value) => value + 1);
      else if (!completionRef.current) {
        completionRef.current = true;
        onCompleteRef.current();
      }
    }, step === 0 ? 1500 : step === finalStep ? 1000 : 2500);
    return () => {
      if (revealTimer) window.clearTimeout(revealTimer);
      window.clearTimeout(advanceTimer);
    };
  }, [finalStep, lang, lines, step]);

  const aDigits = String(problem.a).padStart(2, "0").split("");
  const bDigits = String(problem.b).padStart(2, "0").split("");
  const answerDigits = String(problem.total).split("");
  const onesOperandsActive = step === 1 || (beat === 0 && step === 2);
  const tensOperandsActive = beat === 0 ? step === 5 : step === 3;
  const onesResultVisible = beat === 0 ? step >= 4 : step >= 2;
  const tensResultVisible = beat === 0 ? step >= 6 : step >= 4;
  const finalGlow = step === finalStep;
  const digitClass = (active: boolean) => `grid h-20 place-items-center rounded-2xl border-2 text-5xl font-black transition-all duration-500 ${active ? "scale-110 border-yellow-200 bg-yellow-300/15 text-yellow-100 ring-4 ring-yellow-300/80 shadow-[0_0_24px_rgba(250,204,21,.65)]" : "border-cyan-800 bg-cyan-950/60 text-yellow-200"}`;

  return (
    <section className="slide-in-up rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-cyan-950 p-5 shadow-[0_6px_0_#164e63] sm:p-6">
      <p className="mb-5 text-center text-sm font-black uppercase tracking-[.2em] text-cyan-300">{lang === "en" ? "Vertical method" : "Kaedah menegak"}</p>
      <div className="relative mx-auto w-full max-w-lg rounded-[2rem] border-4 border-cyan-300 bg-slate-950/95 p-6 shadow-[0_8px_0_#164e63] sm:p-8">
        <div className="mb-4 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-center text-sm font-black uppercase tracking-wider text-cyan-100">
          <span aria-hidden="true" />
          <span className="rounded-full border border-cyan-400 bg-cyan-950 py-2">{lang === "en" ? "Tens" : "Puluh"}</span>
          <span className="rounded-full border border-cyan-400 bg-cyan-950 py-2">{lang === "en" ? "Ones" : "Sa"}</span>
        </div>
        {beat === 0 && step >= 3 && <span className={`absolute left-[18%] top-[5.9rem] z-20 grid h-9 w-8 place-items-center rounded-xl border-2 border-yellow-200 bg-yellow-400 text-xl font-black text-slate-950 shadow-[0_0_16px_rgba(250,204,21,.7)] ${step === 3 || step === 5 ? "animate-pulse" : ""}`}>1</span>}
        {beat === 0 && step === 2 && <span className="absolute -right-2 top-1/2 rounded-xl border border-cyan-400 bg-cyan-950 px-2 py-1 text-lg font-black text-cyan-200 opacity-80">13</span>}
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-4 text-center" style={getNumberTextStyle(problem.total)}>
          <span aria-hidden="true" /><span className={digitClass(tensOperandsActive)}>{aDigits[0]}</span><span className={digitClass(onesOperandsActive)}>{aDigits[1]}</span>
          <span data-math-cue="plus" className="grid place-items-center text-4xl font-black text-cyan-300" aria-hidden="true">+</span><span className={digitClass(tensOperandsActive)}>{bDigits[0]}</span><span className={digitClass(onesOperandsActive)}>{bDigits[1]}</span>
          <span className="col-span-3 my-2 border-t-4 border-cyan-300" />
          <span aria-hidden="true" /><span className={`${digitClass(tensResultVisible && (beat === 0 ? step === 6 || finalGlow : step === 4 || finalGlow))} ${tensResultVisible ? "opacity-100" : "opacity-0"}`}>{answerDigits[0]}</span>
          <span className={`${digitClass(onesResultVisible && (beat === 0 ? step === 4 || finalGlow : step === 2 || finalGlow))} ${onesResultVisible ? "opacity-100" : "opacity-0"}`}>{answerDigits[1]}</span>
        </div>
      </div>
      <p className={`mx-auto mt-5 min-h-20 max-w-3xl rounded-2xl border-2 px-5 py-4 text-center text-xl font-black transition-all ${finalGlow ? "border-yellow-300 bg-yellow-300/15 text-yellow-100 shadow-[0_0_24px_rgba(250,204,21,.35)]" : "border-cyan-700 bg-slate-950/70 text-cyan-50"}`} aria-live="polite">{lines[step]}</p>
      {showNextStep && step < finalStep && <button type="button" onClick={() => setStep((value) => Math.min(finalStep, value + 1))} className="mx-auto mt-4 flex rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-6 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1">{lang === "en" ? "Next step" : "Langkah seterusnya"}</button>}
    </section>
  );
}

function AdvancedPart2WorkedBeat({ beat, lang, onWalkthroughComplete }: { beat: AdvancedPart2BeatIndex; lang: Lang; onWalkthroughComplete: () => void }) {
  const problem = getAdvancedPart2Beat(beat);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [panel, setPanel] = useState<"A" | "B">("A");
  const [panelLeaving, setPanelLeaving] = useState(false);
  const [topCounted, setTopCounted] = useState(0);
  const [bottomCounted, setBottomCounted] = useState(0);
  const [countingGroup, setCountingGroup] = useState<"top" | "bottom" | "result" | "rest" | "tens" | null>(null);
  const [combining, setCombining] = useState(false);
  const [combined, setCombined] = useState(false);
  const [resultCounted, setResultCounted] = useState(0);
  const [carrying, setCarrying] = useState(false);
  const [carried, setCarried] = useState(false);
  const [showUnderstand, setShowUnderstand] = useState(false);
  const [movingTen, setMovingTen] = useState(false);
  const [tenInColumn, setTenInColumn] = useState(false);
  const [remainderCounted, setRemainderCounted] = useState(0);
  const [tensCounted, setTensCounted] = useState(0);
  const [panelAComplete, setPanelAComplete] = useState(false);
  const busy = countingGroup !== null || combining || carrying || movingTen;

  useEffect(() => () => stopNumberAudio(), []);

  const countSequence = async (count: number, update: (value: number) => void, group: "top" | "bottom" | "result" | "rest" | "tens") => {
    if (busy) return;
    setCountingGroup(group);
    update(0);
    let progressed = false;
    await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => {
      progressed = true;
      update(value);
    });
    if (!progressed) update(count);
    setCountingGroup(null);
  };

  const countOperand = async (side: "top" | "bottom") => {
    const count = side === "top" ? problem.a : problem.b;
    await countSequence(count, side === "top" ? setTopCounted : setBottomCounted, side);
  };

  const combineGroups = async () => {
    if (busy || topCounted !== problem.a || bottomCounted !== problem.b) return;
    setCombining(true);
    await wait(prefersReducedMotion ? 80 : 650);
    setCombined(true);
    setCombining(false);
  };

  const countTogether = async () => {
    if (beat === 0) {
      setCarried(false);
      setShowUnderstand(false);
      await countSequence(10, setResultCounted, "result");
      setCarrying(true);
      await wait(prefersReducedMotion ? 100 : 900);
      setCarried(true);
      setCarrying(false);
      setShowUnderstand(true);
      return;
    }
    await countSequence(4, setResultCounted, "result");
    setShowUnderstand(true);
  };

  const countTens = async () => {
    await countSequence(2, setTensCounted, "tens");
    speakText(lang === "en" ? "One ten. Two tens. Twenty!" : "Satu puluh. Dua puluh. Dua puluh!", lang, { allowWhenWordAudioDisabled: true });
    setPanelAComplete(true);
  };

  const repeatTogether = () => {
    stopNumberAudio();
    setResultCounted(0);
    setCarried(false);
    setCarrying(false);
    setShowUnderstand(false);
    setMovingTen(false);
    setTenInColumn(false);
    setRemainderCounted(0);
    setPanelAComplete(false);
  };

  const understand = async () => {
    setShowUnderstand(false);
    if (beat === 1) {
      setPanelAComplete(true);
      return;
    }
    setMovingTen(true);
    await wait(prefersReducedMotion ? 100 : 750);
    setTenInColumn(true);
    setMovingTen(false);
  };

  const countRest = async () => {
    await countSequence(3, setRemainderCounted, "rest");
    setPanelAComplete(true);
  };

  const openMethod = async () => {
    if (panelLeaving) return;
    setPanelLeaving(true);
    await wait(prefersReducedMotion ? 40 : 300);
    setPanel("B");
  };

  if (panel === "B") return <AdvancedPart2MethodPanel beat={beat} lang={lang} onComplete={onWalkthroughComplete} />;

  return (
    <section className={`space-y-6 rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 shadow-[inset_0_0_32px_rgba(34,211,238,.10)] transition-all duration-300 sm:p-6 ${panelLeaving ? "scale-[.99] opacity-0" : "scale-100 opacity-100"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full border border-cyan-400 bg-cyan-950 px-4 py-2 text-sm font-black uppercase tracking-wider text-cyan-100">{lang === "en" ? `Example ${beat + 1} of 3` : `Contoh ${beat + 1} daripada 3`}</p>
        <p className="text-3xl font-black text-yellow-200" style={getNumberTextStyle(problem.total)}>{problem.a} + {problem.b}</p>
      </div>

      <AdvancedPart2PanelAForm beat={beat} complete={panelAComplete} combined={combined} tenInColumn={tenInColumn} remainderCounted={remainderCounted} tensCounted={tensCounted} tensCounting={countingGroup === "tens"} lang={lang} />

      {!combined && (
        <div className="grid gap-5 md:grid-cols-2">
          {(["top", "bottom"] as const).map((side) => {
            const value = side === "top" ? problem.a : problem.b;
            const counted = side === "top" ? topCounted : bottomCounted;
            const done = counted === value;
            return (
              <div key={side} className={`rounded-[1.75rem] border-2 border-cyan-400 bg-slate-950/85 p-4 shadow-[0_5px_0_#164e63] transition-all duration-700 ease-in-out ${combining ? side === "top" ? "translate-y-8 scale-90 opacity-0 md:translate-x-[45%] md:translate-y-12" : "-translate-y-8 scale-90 opacity-0 md:-translate-x-[45%] md:translate-y-12" : "translate-x-0 translate-y-0 scale-100 opacity-100"}`}>
                <div className="mb-4 flex items-center justify-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-400 text-2xl font-black text-slate-950">{value}</span><span className="text-3xl font-black text-cyan-200">{side === "bottom" ? "+" : ""}</span></div>
                <AdvancedPart2OperandGroup value={value} countedThrough={counted} counting={countingGroup === side} lang={lang} />
                <button type="button" disabled={busy || done} onClick={() => void countOperand(side)} className={`mx-auto mt-4 flex min-h-12 items-center rounded-2xl border-2 px-5 py-2 font-black shadow-[0_4px_0_#164e63] active:translate-y-1 disabled:opacity-70 ${done ? "border-emerald-300 bg-emerald-900 text-emerald-100" : "border-cyan-300 bg-cyan-950 text-cyan-100"}`}>{done ? (lang === "en" ? "Counted ✓" : "Sudah dikira ✓") : countingGroup === side ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count" : "Kira")}</button>
              </div>
            );
          })}
        </div>
      )}

      {!combined && <button type="button" disabled={busy || topCounted !== problem.a || bottomCounted !== problem.b} onClick={() => void combineGroups()} className="mx-auto flex min-h-14 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-3 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-35">{combining ? (lang === "en" ? "Combining..." : "Menggabungkan...") : (lang === "en" ? "Combine" : "Gabungkan")}</button>}

      {combined && (
        <div className="slide-in-up rounded-[2rem] border-2 border-cyan-300 bg-slate-950/85 p-5 shadow-[0_6px_0_#164e63]">
          <h4 className="mb-5 text-center text-xl font-black text-cyan-100">{beat === 2 ? (lang === "en" ? "Two ten-baskets" : "Dua bakul puluh") : (lang === "en" ? "Combined result" : "Hasil gabungan")}</h4>
          {beat === 0 && !carried && <AdvancedPart2LooseBananas count={13} countedThrough={resultCounted} counting={countingGroup === "result"} movingFirstTen={carrying} />}
          {beat === 0 && carried && <AdvancedPart2LooseBananas count={3} countedThrough={remainderCounted} counting={countingGroup === "rest"} />}
          {beat === 1 && <div className="grid items-center justify-center gap-5 md:grid-cols-[auto_1fr]"><TenBananaBundle lang={lang} compact /><AdvancedPart2LooseBananas count={4} countedThrough={resultCounted} counting={countingGroup === "result"} /></div>}
          {beat === 2 && <p className="mx-auto max-w-2xl rounded-2xl border border-cyan-500 bg-cyan-950/60 px-4 py-3 text-center text-lg font-black text-cyan-100">{lang === "en" ? "The two baskets stay separate. Each basket is one ten." : "Dua bakul kekal berasingan. Setiap bakul ialah satu puluh."}</p>}

          {beat < 2 && !showUnderstand && !carried && resultCounted === 0 && <button type="button" disabled={busy} onClick={() => void countTogether()} className="mx-auto mt-5 flex rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1 disabled:opacity-60">{lang === "en" ? "Count together" : "Kira bersama-sama"}</button>}
          {beat === 2 && !panelAComplete && <button type="button" disabled={busy} onClick={() => void countTens()} className="mx-auto mt-5 flex rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1 disabled:opacity-60">{countingGroup === "tens" ? (lang === "en" ? "Counting tens..." : "Mengira puluh...") : (lang === "en" ? "Count the tens" : "Kira puluh")}</button>}

          {carrying && <p className="mt-5 text-center text-xl font-black text-yellow-200 animate-pulse">{lang === "en" ? "The first 10 bananas are moving into the ten-basket..." : "10 pisang pertama sedang masuk ke dalam bakul puluh..."}</p>}
          {beat === 0 && carrying && <div className="mx-auto mt-5 min-h-40 max-w-xl rounded-[1.75rem] border-2 border-dashed border-yellow-300/70 bg-amber-950/20" aria-hidden="true" />}
          {beat === 0 && carried && !tenInColumn && <div className={`mx-auto mt-6 max-w-xl transition-all duration-700 ${movingTen ? "-translate-y-24 scale-50 opacity-70" : "translate-y-0 scale-100 opacity-100"}`}><TenBananaBundle lang={lang} compact /><p className="mt-4 text-center text-xl font-black text-yellow-100">{lang === "en" ? "This is a group of 10, which equals 1 in the tens digit." : "Ini kumpulan 10, sama dengan 1 dalam digit puluh."}</p></div>}
          {beat === 0 && tenInColumn && !panelAComplete && <div className="mt-5 text-center"><p className="mb-4 text-xl font-black text-cyan-100">{lang === "en" ? "The ten becomes the 1 in the tens column." : "Puluh itu jadi 1 dalam lajur puluh."}</p><button type="button" disabled={busy} onClick={() => void countRest()} className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1">{countingGroup === "rest" ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count the rest" : "Kira yang tinggal")}</button></div>}

          {showUnderstand && beat < 2 && <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => void understand()} className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-6 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1">{lang === "en" ? "I understand" : "Saya faham"}</button><button type="button" onClick={repeatTogether} className="rounded-2xl border-2 border-cyan-300 bg-cyan-950 px-6 py-3 font-black text-cyan-100 shadow-[0_5px_0_#164e63] active:translate-y-1">{lang === "en" ? "Please repeat" : "Sila ulang"}</button></div>}
        </div>
      )}

      {panelAComplete && <div className="slide-in-up rounded-3xl border-2 border-emerald-300 bg-emerald-950/75 p-5 text-center shadow-[0_5px_0_#065f46]"><p className="text-2xl font-black text-emerald-100">{advancedPart2Summary(beat, lang)}</p><button type="button" disabled={panelLeaving} onClick={() => void openMethod()} className="mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-60">{lang === "en" ? "See the vertical addition method" : "Lihat kaedah tambah menegak"}</button></div>}
    </section>
  );
}

function AdvancedAdditionPart2Lesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const [placeValueBeat, setPlaceValueBeat] = useState<0 | 1>(0);
  const [placeValueDemoComplete, setPlaceValueDemoComplete] = useState(false);
  const [workedBeat, setWorkedBeat] = useState<AdvancedPart2BeatIndex>(0);
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  if (showPractice) return <Quiz lang={lang} t={t} title={lang === "en" ? "Cyber Mission 5: Carrying Practice" : "Misi Siber 5: Latihan Bawa Puluh"} questions={advancedAdditionPart2Questions} randomize={false} variant="cyber" onBackToLearning={() => { setShowPractice(false); setPhase(2); setWorkedBeat(2); setWalkthroughComplete(false); }} onFinish={() => onDone()} />;
  const phaseCopy = [
    { title: lang === "en" ? "From objects to written maths" : "Daripada objek kepada matematik bertulis", text: lang === "en" ? "We know how to join two groups. Now let's learn to write addition vertically." : "Kita sudah tahu cara gabungkan dua kumpulan. Sekarang mari belajar menulis tambah secara menegak." },
    { title: lang === "en" ? "Meet tens and ones" : "Kenal puluh dan sa", text: lang === "en" ? "A big number is made of tens and ones. The digit tells us how many of each." : "Nombor besar dibuat daripada puluh dan sa. Digit tunjuk berapa banyak setiap satu." },
    { title: lang === "en" ? "Vertical addition" : "Tambah menegak", text: lang === "en" ? "Count each group, combine them, then see how we write the same problem vertically." : "Kira setiap kumpulan, gabungkan, kemudian lihat cara kita tulis soalan yang sama secara menegak." },
  ];
  const canNext = phase === 0 || (phase === 1 ? placeValueBeat === 0 || placeValueDemoComplete : walkthroughComplete);

  const previous = () => {
    stopNumberAudio();
    if (phase === 1) {
      if (placeValueBeat === 1) {
        setPlaceValueBeat(0);
        setPlaceValueDemoComplete(false);
      }
      else setPhase(0);
      return;
    }
    if (phase === 2) {
      setWalkthroughComplete(false);
      if (workedBeat > 0) setWorkedBeat((workedBeat - 1) as AdvancedPart2BeatIndex);
      else {
        setPhase(1);
        setPlaceValueBeat(1);
        setPlaceValueDemoComplete(false);
      }
    }
  };

  const next = () => {
    stopNumberAudio();
    if (phase === 0) {
      setPhase(1);
      setPlaceValueBeat(0);
      setPlaceValueDemoComplete(false);
      return;
    }
    if (phase === 1) {
      if (placeValueBeat === 0) {
        setPlaceValueBeat(1);
        setPlaceValueDemoComplete(false);
      }
      else {
        setPhase(2);
        setWorkedBeat(0);
        setWalkthroughComplete(false);
      }
      return;
    }
    if (!walkthroughComplete) return;
    if (workedBeat < 2) {
      setWorkedBeat((workedBeat + 1) as AdvancedPart2BeatIndex);
      setWalkthroughComplete(false);
    } else setShowPractice(true);
  };

  return (
    <main className="mx-auto w-full max-w-6xl pb-8"><div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3"><LessonShell lang={lang} title={t.advancedAdditionPart2} helper={lang === "en" ? "Cyber Mission 5 - Solve simple stories using vertical addition." : "Misi Siber 5 - Selesaikan cerita mudah menggunakan tambah menegak."} variant="cyber">
      <div className="mb-5 grid grid-cols-3 gap-2">{Array.from({ length: 3 }, (_, index) => <span key={index} className={`h-3 rounded-full border ${index <= phase ? "border-yellow-200 bg-yellow-400" : "border-slate-600 bg-slate-700"}`} />)}</div>
      <CyberTeachingCard eyebrow={lang === "en" ? "Cyber Mission 5" : "Misi Siber 5"} title={phase === 1 && placeValueBeat === 1 ? (lang === "en" ? "17 equals 10 + 7" : "17 sama dengan 10 + 7") : phaseCopy[phase].title} text={phase === 1 && placeValueBeat === 1 ? (lang === "en" ? "Count 10 bananas into one basket. Then count the 7 bananas left." : "Kira 10 pisang ke dalam satu bakul. Kemudian kira 7 pisang yang tinggal.") : phaseCopy[phase].text} />
      {phase === 0 && (
        <div className="grid min-h-72 place-items-center rounded-[2rem] border-4 border-cyan-300 bg-slate-950/80 p-6 text-center">
          <div className="w-full max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border-2 border-cyan-400 bg-cyan-950/70 p-5">
                <p className="text-xl font-black uppercase text-cyan-100">{lang === "en" ? "Tens digit" : "Digit puluh"}</p>
                <span className="mx-auto my-3 grid h-20 w-16 place-items-center rounded-2xl border-4 border-cyan-300 bg-slate-950 text-5xl font-black text-cyan-100 shadow-[0_5px_0_#164e63]">1</span>
                <div className="text-lg font-black text-white">
                  <p>{lang === "en" ? "It counts groups of 10." : "Ia mengira kumpulan 10."}</p>
                  <p className="mt-2">{lang === "en" ? "1 means 10." : "1 bermaksud 10."}</p>
                  <p>{lang === "en" ? "2 means 20." : "2 bermaksud 20."}</p>
                </div>
              </div>
              <div className="rounded-3xl border-2 border-yellow-300 bg-slate-950 p-5">
                <p className="text-xl font-black uppercase text-yellow-200">{lang === "en" ? "Ones digit" : "Digit sa"}</p>
                <span className="mx-auto my-3 grid h-20 w-16 place-items-center rounded-2xl border-4 border-yellow-300 bg-slate-950 text-5xl font-black text-yellow-100 shadow-[0_5px_0_#a16207]">7</span>
                <p className="text-lg font-black text-white">{lang === "en" ? "It counts single ones. 7 means 7 single ones." : "Ia mengira sa satu-satu. 7 bermaksud 7 sa."}</p>
              </div>
            </div>
            <p className="mt-6 text-2xl font-black text-white">{lang === "en" ? "Keep tens under tens and ones under ones." : "Letakkan puluh di bawah puluh dan sa di bawah sa."}</p>
          </div>
        </div>
      )}
      {phase === 1 && (placeValueBeat === 0 ? <AdvancedPlaceValueMeaningCard lang={lang} /> : <AdvancedSeventeenPlaceValueDemo key={`seventeen-place-value-${lang}`} lang={lang} onComplete={() => setPlaceValueDemoComplete(true)} />)}
      {phase === 2 && <AdvancedPart2WorkedBeat key={`${workedBeat}-${lang}`} beat={workedBeat} lang={lang} onWalkthroughComplete={() => setWalkthroughComplete(true)} />}
      <AdvancedLessonNavigation lang={lang} t={t} phase={phase} lastPhase={2} canNext={canNext} nextLabel={phase === 2 && workedBeat < 2 ? t.next : undefined} onPrevious={previous} onNext={next} onPractice={() => setShowPractice(true)} />
    </LessonShell></div></main>
  );
}

type AdvancedSubtractionBeatIndex = 0 | 1 | 2;

function getAdvancedSubtractionBeat(beat: AdvancedSubtractionBeatIndex) {
  return [
    { a: 14, b: 5, answer: 9, borrowing: true },
    { a: 19, b: 15, answer: 4, borrowing: false },
    { a: 20, b: 10, answer: 10, borrowing: false },
  ][beat];
}

function AdvancedSubtractionLooseBananas({ count, countedThrough = 0, counting = false, startLabel = 1, removedThrough = 0, dashed = false, shaking = false, compact = false }: {
  count: number;
  countedThrough?: number;
  counting?: boolean;
  startLabel?: number;
  removedThrough?: number;
  dashed?: boolean;
  shaking?: boolean;
  compact?: boolean;
}) {
  const rows = balancedIndexRows(count, compact ? 5 : 4);
  return (
    <div className={`mobile-subtraction-bananas grid w-full min-w-0 justify-items-center gap-4 overflow-hidden px-3 py-3 ${shaking ? "motion-safe:animate-bounce" : ""}`}>
      {rows.map((row, rowIndex) => {
        return (
          <div key={rowIndex} className="flex w-full min-w-0 items-center justify-center gap-2 min-[380px]:gap-3">
            {row.map((index) => {
              const removed = index < removedThrough;
              const counted = index < countedThrough;
              const active = counting && counted && index === countedThrough - 1;
              return (
                <span key={index} className={`relative grid h-12 w-9 shrink-0 place-items-center rounded-xl border-2 transition-all min-[380px]:h-16 min-[380px]:w-12 min-[380px]:rounded-2xl ${removed ? "pointer-events-none -translate-y-10 translate-x-12 rotate-12 scale-75 opacity-0 duration-700 motion-reduce:duration-75" : "translate-x-0 translate-y-0 opacity-100 duration-300"} ${active ? "z-10 scale-110 border-yellow-200 bg-cyan-950 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]" : counted ? "border-cyan-300 bg-cyan-950" : dashed ? "border-dashed border-cyan-400 bg-slate-950/70" : "border-cyan-900 bg-slate-900/90 opacity-45 grayscale"}`}>
                  <SpriteIcon value={BANANA} className="h-7 w-7 min-[380px]:h-10 min-[380px]:w-10" />
                  <span className={`absolute -top-3 left-1/2 grid h-7 min-w-7 -translate-x-1/2 place-items-center rounded-full px-1 text-sm font-black shadow-md ${active ? "bg-yellow-400 text-slate-950" : counted ? "bg-blue-600 text-white" : dashed ? "border border-cyan-300 bg-slate-950 text-cyan-100" : "bg-slate-700 text-slate-300"}`}>{startLabel + index}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AdvancedSubtractionCountableTen({ lang, countedThrough = 0, counting = false, startLabel = 1, dashed = false, removing = false }: {
  lang: Lang;
  countedThrough?: number;
  counting?: boolean;
  startLabel?: number;
  dashed?: boolean;
  removing?: boolean;
}) {
  return (
    <div className={`relative mx-auto w-fit max-w-full transition-all ${removing ? "-translate-y-16 scale-75 opacity-0 duration-700 motion-reduce:duration-75" : "translate-y-0 opacity-100 duration-300"} ${dashed ? "rounded-[2rem] border-2 border-dashed border-cyan-300 p-1" : ""}`}>
      <AdvancedPart2CountableTen lang={lang} countedThrough={countedThrough} counting={counting} startLabel={startLabel} />
    </div>
  );
}

function AdvancedSubtractionOperandGroup({ value, countedThrough, counting, lang, dashed = false, opened = false, removedLoose = 0, removedTens = 0, shaking = false }: {
  value: number;
  countedThrough: number;
  counting: boolean;
  lang: Lang;
  dashed?: boolean;
  opened?: boolean;
  removedLoose?: number;
  removedTens?: number;
  shaking?: boolean;
}) {
  if (opened) return <AdvancedSubtractionLooseBananas count={value} countedThrough={countedThrough} counting={counting} removedThrough={removedLoose} dashed={dashed} shaking={shaking} compact={value > 10} />;
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return (
    <div className="flex min-h-44 w-full min-w-0 flex-col items-center justify-center gap-4 overflow-hidden px-2 py-3">
      {Array.from({ length: tens }, (_, index) => (
        <AdvancedSubtractionCountableTen key={index} lang={lang} countedThrough={Math.max(0, Math.min(10, countedThrough - (index * 10)))} counting={counting && countedThrough > index * 10 && countedThrough <= (index + 1) * 10} startLabel={(index * 10) + 1} dashed={dashed} removing={index < removedTens} />
      ))}
      {ones > 0 && <AdvancedSubtractionLooseBananas count={ones} countedThrough={Math.max(0, countedThrough - (tens * 10))} counting={counting && countedThrough > tens * 10} startLabel={(tens * 10) + 1} removedThrough={removedLoose} dashed={dashed} shaking={shaking} compact={tens > 0} />}
    </div>
  );
}

function AdvancedSubtractionCompactTen({ lang, count = 1 }: { lang: Lang; count?: 1 | 2 }) {
  return <AdvancedPart2CompactTen lang={lang} count={count} />;
}

function AdvancedSubtractionWholeTens({ count, countedThrough, counting, lang, dashed = false }: { count: 1 | 2; countedThrough: number; counting: boolean; lang: Lang; dashed?: boolean }) {
  return (
    <div className="flex min-h-44 flex-wrap items-center justify-center gap-3">
      {Array.from({ length: count }, (_, index) => {
        const counted = index < countedThrough;
        const active = counting && counted && index === countedThrough - 1;
        return <div key={index} className={`relative rounded-[2rem] border-2 p-1 transition-all ${active ? "z-10 scale-105 border-yellow-200 ring-4 ring-yellow-300/80 shadow-[0_0_22px_rgba(250,204,21,.6)]" : counted ? "border-cyan-300" : dashed ? "border-dashed border-cyan-400 opacity-55" : "border-cyan-900 opacity-45 grayscale"}`}><AdvancedSubtractionCompactTen lang={lang} /><span className={`absolute -top-3 left-1/2 grid h-8 min-w-8 -translate-x-1/2 place-items-center rounded-full px-1 text-sm font-black ${active ? "bg-yellow-400 text-slate-950" : counted ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{index + 1}</span></div>;
      })}
    </div>
  );
}

function AdvancedSubtractionPanelAForm({ beat, complete, lang }: { beat: AdvancedSubtractionBeatIndex; complete: boolean; lang: Lang }) {
  const problem = getAdvancedSubtractionBeat(beat);
  const aDigits = String(problem.a).padStart(2, "0").split("");
  const bDigits = String(problem.b).padStart(2, "0").split("");
  const answerDigits = String(problem.answer).padStart(2, "0").split("");
  return (
    <section className="mx-auto w-full max-w-sm rounded-[2rem] border-4 border-cyan-300 bg-slate-950/90 p-4 shadow-[0_7px_0_#164e63] min-[380px]:p-5">
      <div className="mb-3 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-center text-xs font-black uppercase tracking-wider text-cyan-200 min-[380px]:text-sm">
        <span aria-hidden="true" />
        <span className="rounded-full border border-cyan-400 bg-cyan-950 px-2 py-2">{lang === "en" ? "Tens" : "Puluh"}</span>
        <span className="rounded-full border border-cyan-400 bg-cyan-950 px-2 py-2">{lang === "en" ? "Ones" : "Sa"}</span>
      </div>
      <div className="relative grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] text-center text-4xl font-black text-yellow-200 min-[380px]:text-5xl" style={getNumberTextStyle(problem.answer)}>
        <span aria-hidden="true" /><span>{aDigits[0]}</span><span>{aDigits[1]}</span>
        <span data-math-cue="minus" className="grid place-items-center text-cyan-300" aria-hidden="true">−</span><span>{bDigits[0]}</span><span>{bDigits[1]}</span>
        <span className="col-span-3 my-3 border-t-4 border-cyan-300" />
        <span aria-hidden="true" /><span className={`transition-all ${complete ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>{answerDigits[0]}</span>
        <span className={`transition-all ${complete ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>{answerDigits[1]}</span>
      </div>
    </section>
  );
}

function VerticalSubtractionCard({ a, b, answer, borrowing = false, showBorrow = false, lang }: { a: number; b: number; answer?: number; borrowing?: boolean; showBorrow?: boolean; lang: Lang }) {
  const aDigits = String(a).padStart(2, "0").split("");
  const bDigits = String(b).padStart(2, "0").split("");
  const answerDigits = answer == null ? ["?", "?"] : String(answer).padStart(2, "0").split("");
  return (
    <div className="mobile-vertical-card mx-auto w-full max-w-sm rounded-[2rem] border-4 border-cyan-300 bg-slate-950 p-4 shadow-[0_7px_0_#164e63] min-[380px]:p-6">
      <div className="mb-3 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-center text-xs font-black uppercase text-cyan-100 min-[380px]:text-sm"><span aria-hidden="true" /><span className="rounded-full border border-cyan-500 bg-cyan-950 py-2">{lang === "en" ? "Tens" : "Puluh"}</span><span className="rounded-full border border-cyan-500 bg-cyan-950 py-2">{lang === "en" ? "Ones" : "Sa"}</span></div>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-center text-4xl font-black text-yellow-200 min-[380px]:text-5xl" style={getNumberTextStyle(a)}>
        <span aria-hidden="true" /><span className="relative rounded-xl border border-cyan-900 py-2">{aDigits[0]}{borrowing && showBorrow && <><span className="absolute left-1/2 top-1/2 h-1 w-12 -translate-x-1/2 -rotate-[32deg] bg-red-400" /><span className="absolute -right-1 -top-4 text-xl text-yellow-300">0</span></>}</span>
        <span className="relative rounded-xl border border-cyan-900 py-2">{borrowing && showBorrow && <span className="absolute -left-1 -top-4 text-xl text-yellow-300">1</span>}{aDigits[1]}</span>
        <span data-math-cue="minus" className="grid place-items-center text-cyan-300" aria-hidden="true">−</span><span className="rounded-xl border border-cyan-900 py-2">{bDigits[0]}</span><span className="rounded-xl border border-cyan-900 py-2">{bDigits[1]}</span>
        <span className="col-span-3 border-t-4 border-cyan-300" />
        <span aria-hidden="true" /><span>{answerDigits[0]}</span><span>{answerDigits[1]}</span>
      </div>
    </div>
  );
}

function advancedSubtractionWalkthroughLines(beat: AdvancedSubtractionBeatIndex, lang: Lang) {
  const lines = beat === 0 ? [
    ["Let's subtract 5 from 14 the vertical way.", "Jom tolak 5 daripada 14 secara menegak."],
    ["Look at the ones column. 4 minus 5. We don't have enough!", "Lihat lajur sa. 4 tolak 5. Tak cukup!"],
    ["We borrow 1 ten. Cross out the 1, write 0. The ones become 14.", "Kita pinjam 1 puluh. Coret 1, tulis 0. Sa jadi 14."],
    ["Now subtract: 14 minus 5 equals 9.", "Sekarang tolak: 14 tolak 5 sama dengan 9."],
    ["Write 9 in the ones column.", "Tulis 9 dalam lajur sa."],
    ["Now the tens column. 0 minus 0.", "Sekarang lajur puluh. 0 tolak 0."],
    ["That's 0. So the answer is 9.", "Itu 0. Jadi jawapannya 9."],
    ["14 minus 5 equals 9.", "14 tolak 5 sama dengan 9."],
  ] : beat === 1 ? [
    ["Let's subtract 15 from 19 the vertical way.", "Jom tolak 15 daripada 19 secara menegak."],
    ["Ones column: 9 minus 5.", "Lajur sa: 9 tolak 5."],
    ["9 minus 5 equals 4. No borrowing needed.", "9 tolak 5 sama dengan 4. Tak perlu pinjam."],
    ["Tens column: 1 minus 1.", "Lajur puluh: 1 tolak 1."],
    ["That's 0. So the answer is 4.", "Itu 0. Jadi jawapannya 4."],
    ["19 minus 15 equals 4.", "19 tolak 15 sama dengan 4."],
  ] : [
    ["Let's subtract 10 from 20 the vertical way.", "Jom tolak 10 daripada 20 secara menegak."],
    ["Ones column: 0 minus 0.", "Lajur sa: 0 tolak 0."],
    ["That's 0.", "Itu 0."],
    ["Tens column: 2 minus 1.", "Lajur puluh: 2 tolak 1."],
    ["That's 1 ten. So the answer is 10.", "Itu 1 puluh. Jadi jawapannya 10."],
    ["20 minus 10 equals 10.", "20 tolak 10 sama dengan 10."],
  ];
  return lines.map((line) => line[lang === "en" ? 0 : 1]);
}

function AdvancedSubtractionVerticalCard({ beat, step, lang }: { beat: AdvancedSubtractionBeatIndex; step: number; lang: Lang }) {
  const problem = getAdvancedSubtractionBeat(beat);
  const aDigits = String(problem.a).padStart(2, "0").split("");
  const bDigits = String(problem.b).padStart(2, "0").split("");
  const answerDigits = String(problem.answer).padStart(2, "0").split("");
  const finalStep = advancedSubtractionWalkthroughLines(beat, lang).length - 1;
  const onesActive = beat === 0 ? step === 1 || step === 3 || step === 4 : step === 1 || step === 2;
  const tensActive = beat === 0 ? step === 5 || step === 6 : step === 3 || step === 4;
  const onesVisible = beat === 0 ? step >= 4 : step >= 2;
  const tensVisible = beat === 0 ? step >= 6 : step >= 4;
  const borrowed = beat === 0 && step >= 2;
  const finalGlow = step === finalStep;
  const digitClass = (active: boolean) => `relative grid h-16 min-w-0 place-items-center rounded-2xl border-2 text-4xl font-black transition-all duration-500 min-[380px]:h-20 min-[380px]:text-5xl ${active || finalGlow ? "scale-105 border-yellow-200 bg-yellow-300/15 text-yellow-100 ring-2 ring-yellow-300/80 shadow-[0_0_22px_rgba(250,204,21,.55)]" : "border-cyan-800 bg-cyan-950/60 text-yellow-200"}`;
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-[2rem] border-4 border-cyan-300 bg-slate-950/95 p-4 shadow-[0_8px_0_#164e63] min-[380px]:p-6 sm:p-8">
      <div className="mb-4 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-center text-xs font-black uppercase tracking-wider text-cyan-100 min-[380px]:text-sm">
        <span aria-hidden="true" />
        <span className="rounded-full border border-cyan-400 bg-cyan-950 py-2">{lang === "en" ? "Tens" : "Puluh"}</span>
        <span className="rounded-full border border-cyan-400 bg-cyan-950 py-2">{lang === "en" ? "Ones" : "Sa"}</span>
      </div>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-center" style={getNumberTextStyle(problem.answer)}>
        <span aria-hidden="true" /><span className={digitClass(borrowed || tensActive)}>
          {aDigits[0]}
          {borrowed && <><span className="absolute left-1/2 top-1/2 h-1 w-12 -translate-x-1/2 -translate-y-1/2 -rotate-[32deg] rounded bg-red-400" aria-hidden="true" /><span className="absolute -right-1 -top-4 grid h-8 w-8 place-items-center rounded-full border-2 border-yellow-200 bg-yellow-400 text-lg text-slate-950">0</span></>}
        </span>
        <span className={digitClass(onesActive || borrowed)}>{borrowed && <span className="absolute -left-1 -top-4 grid h-8 w-8 place-items-center rounded-full border-2 border-yellow-200 bg-yellow-400 text-lg text-slate-950">1</span>}{aDigits[1]}</span>
        <span data-math-cue="minus" className="grid place-items-center text-4xl font-black text-cyan-300" aria-hidden="true">−</span><span className={digitClass(tensActive)}>{bDigits[0]}</span>
        <span className={digitClass(onesActive)}>{bDigits[1]}</span>
        <span className="col-span-3 my-2 border-t-4 border-cyan-300" />
        <span aria-hidden="true" /><span className={`${digitClass(tensVisible)} ${tensVisible ? "opacity-100" : "opacity-0"}`}>{answerDigits[0]}</span>
        <span className={`${digitClass(onesVisible)} ${onesVisible ? "opacity-100" : "opacity-0"}`}>{answerDigits[1]}</span>
      </div>
    </div>
  );
}

function AdvancedSubtractionMethodPanel({ beat, lang, onComplete }: { beat: AdvancedSubtractionBeatIndex; lang: Lang; onComplete: () => void }) {
  const lines = useMemo(() => advancedSubtractionWalkthroughLines(beat, lang), [beat, lang]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [showNextStep, setShowNextStep] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const finalStep = lines.length - 1;
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => {
    setShowNextStep(false);
    const narration = lines[step];
    const usesSubtractionCue = lang === "en" ? /\b(minus|subtract)\b/i.test(narration) : /\btolak\b/i.test(narration);
    void (async () => {
      if (usesSubtractionCue) await speakMathCue("minus", lang);
      speakText(narration, lang, { allowWhenWordAudioDisabled: true });
    })();
    const revealTimer = step < finalStep ? window.setTimeout(() => setShowNextStep(true), prefersReducedMotion ? 250 : 1500) : null;
    const dwell = prefersReducedMotion ? 450 : beat === 0 && step === 2 ? 3000 : step === 0 ? 1500 : step === finalStep ? 1000 : 2500;
    const advanceTimer = window.setTimeout(() => {
      if (step < finalStep) setStep((value) => value + 1);
      else if (!completedRef.current) { completedRef.current = true; onCompleteRef.current(); }
    }, dwell);
    return () => { if (revealTimer) window.clearTimeout(revealTimer); window.clearTimeout(advanceTimer); };
  }, [beat, finalStep, lang, lines, prefersReducedMotion, step]);
  return (
    <section className="slide-in-up rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-cyan-950 p-4 shadow-[0_6px_0_#164e63] sm:p-6">
      <p className="mb-5 text-center text-sm font-black uppercase tracking-[.2em] text-cyan-300">{lang === "en" ? "Vertical subtraction method" : "Kaedah tolak menegak"}</p>
      <AdvancedSubtractionVerticalCard beat={beat} step={step} lang={lang} />
      <p className={`mx-auto mt-5 min-h-20 max-w-3xl rounded-2xl border-2 px-4 py-4 text-center text-lg font-black transition-all min-[380px]:text-xl ${step === finalStep ? "border-yellow-300 bg-yellow-300/15 text-yellow-100 shadow-[0_0_24px_rgba(250,204,21,.35)]" : "border-cyan-700 bg-slate-950/70 text-cyan-50"}`} aria-live="polite">{lines[step]}</p>
      {showNextStep && step < finalStep && <button type="button" onClick={() => setStep((value) => Math.min(finalStep, value + 1))} className="mx-auto mt-4 flex rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-6 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1">{lang === "en" ? "Next step" : "Langkah seterusnya"}</button>}
    </section>
  );
}

function advancedSubtractionSummary(beat: AdvancedSubtractionBeatIndex, lang: Lang) {
  if (beat === 0) return lang === "en" ? "14 take away 5 equals 9." : "14 tolak 5 sama dengan 9.";
  if (beat === 1) return lang === "en" ? "19 take away 15 equals 4. No borrowing needed." : "19 tolak 15 sama dengan 4. Tak perlu buka bakul.";
  return lang === "en" ? "2 tens take away 1 ten equals 1 ten. That's 10." : "2 puluh tolak 1 puluh sama dengan 1 puluh. Itu 10.";
}

function AdvancedSubtractionWorkedBeat({ beat, lang, onWalkthroughComplete }: { beat: AdvancedSubtractionBeatIndex; lang: Lang; onWalkthroughComplete: () => void }) {
  const problem = getAdvancedSubtractionBeat(beat);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [panel, setPanel] = useState<"A" | "B">("A");
  const [panelLeaving, setPanelLeaving] = useState(false);
  const [topCounted, setTopCounted] = useState(0);
  const [bottomCounted, setBottomCounted] = useState(0);
  const [countingGroup, setCountingGroup] = useState<"top" | "bottom" | "remove" | "remaining" | null>(null);
  const [insufficient, setInsufficient] = useState(false);
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [removedLoose, setRemovedLoose] = useState(0);
  const [removedTens, setRemovedTens] = useState(0);
  const [removalDone, setRemovalDone] = useState(false);
  const [remainingCounted, setRemainingCounted] = useState(0);
  const [showUnderstand, setShowUnderstand] = useState(false);
  const [panelAComplete, setPanelAComplete] = useState(false);
  const busy = countingGroup !== null || opening;

  useEffect(() => () => stopNumberAudio(), []);

  const countSequence = async (count: number, update: (value: number) => void, group: "top" | "bottom" | "remove" | "remaining") => {
    if (busy) return;
    setCountingGroup(group);
    update(0);
    let progressed = false;
    await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => { progressed = true; update(value); });
    if (!progressed) update(count);
    setCountingGroup(null);
  };

  const countOperand = async (side: "top" | "bottom") => {
    const value = side === "top" ? problem.a : problem.b;
    const update = side === "top" ? setTopCounted : setBottomCounted;
    if (beat === 2) {
      if (busy) return;
      setCountingGroup(side);
      let progressed = false;
      await speakCountingSequence(value / 10, lang, COUNTING_STEP_MS, (tens) => { progressed = true; update(tens * 10); });
      if (!progressed) update(value);
      setCountingGroup(null);
      await speakNumber(value, lang);
      return;
    }
    await countSequence(value, update, side);
  };

  const tryTakeAway = async () => {
    if (busy || topCounted !== problem.a || bottomCounted !== problem.b) return;
    if (beat === 0 && !opened) { setInsufficient(true); return; }
    setInsufficient(false);
    setCountingGroup("remove");
    await speakMathCue("minus", lang);
    if (beat > 0) {
      setRemovedTens(1);
      await wait(prefersReducedMotion ? 80 : 700);
    }
    const looseToRemove = beat === 0 ? 5 : beat === 1 ? 5 : 0;
    if (looseToRemove > 0) {
      let progressed = false;
      await speakCountingSequence(looseToRemove, lang, COUNTING_STEP_MS, (value) => { progressed = true; setRemovedLoose(value); });
      if (!progressed) setRemovedLoose(looseToRemove);
    }
    setCountingGroup(null);
    setRemovalDone(true);
  };

  const openTen = async () => {
    if (busy || opened) return;
    setOpening(true);
    await wait(prefersReducedMotion ? 100 : 900);
    setOpened(true);
    setOpening(false);
    setInsufficient(false);
  };

  const countRemaining = async () => {
    if (beat === 2) {
      if (busy) return;
      setCountingGroup("remaining");
      let progressed = false;
      await speakCountingSequence(1, lang, COUNTING_STEP_MS, () => { progressed = true; setRemainingCounted(10); });
      if (!progressed) setRemainingCounted(10);
      setCountingGroup(null);
      await speakNumber(10, lang);
      setPanelAComplete(true);
      return;
    }
    await countSequence(problem.answer, setRemainingCounted, "remaining");
    setShowUnderstand(true);
  };

  const resetPanelA = () => {
    stopNumberAudio();
    setTopCounted(0); setBottomCounted(0); setCountingGroup(null); setInsufficient(false);
    setOpening(false); setOpened(false); setRemovedLoose(0); setRemovedTens(0); setRemovalDone(false);
    setRemainingCounted(0); setShowUnderstand(false); setPanelAComplete(false);
  };

  const openMethod = async () => {
    if (panelLeaving) return;
    setPanelLeaving(true);
    await wait(prefersReducedMotion ? 40 : 300);
    setPanel("B");
  };

  if (panel === "B") return <AdvancedSubtractionMethodPanel beat={beat} lang={lang} onComplete={onWalkthroughComplete} />;

  const readyToRemove = topCounted === problem.a && bottomCounted === problem.b;
  const remainingVisual = beat === 2
    ? <AdvancedSubtractionWholeTens count={1} countedThrough={remainingCounted === 10 ? 1 : 0} counting={countingGroup === "remaining"} lang={lang} />
    : <AdvancedSubtractionLooseBananas count={problem.answer} countedThrough={remainingCounted} counting={countingGroup === "remaining"} />;

  return (
    <section className={`space-y-6 rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 shadow-[inset_0_0_32px_rgba(34,211,238,.10)] transition-all duration-300 sm:p-6 ${panelLeaving ? "scale-[.99] opacity-0" : "scale-100 opacity-100"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full border border-cyan-400 bg-cyan-950 px-4 py-2 text-sm font-black uppercase tracking-wider text-cyan-100">{lang === "en" ? `Example ${beat + 1} of 3` : `Contoh ${beat + 1} daripada 3`}</p>
        <p className="text-3xl font-black text-yellow-200" style={getNumberTextStyle(problem.answer)}>{problem.a} − {problem.b}</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(15rem,.72fr)_minmax(0,1.28fr)]">
        <AdvancedSubtractionPanelAForm beat={beat} complete={panelAComplete} lang={lang} />
        {!removalDone ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["top", "bottom"] as const).map((side) => {
              const value = side === "top" ? problem.a : problem.b;
              const counted = side === "top" ? topCounted : bottomCounted;
              const done = counted === value;
              return (
                <div key={side} className={`rounded-[1.75rem] border-2 p-3 shadow-[0_5px_0_#164e63] sm:p-4 ${side === "bottom" ? "border-dashed border-cyan-300 bg-cyan-950/35" : "border-cyan-400 bg-slate-950/85"}`}>
                  <p className="mb-3 text-center text-lg font-black text-cyan-100">{side === "top" ? (lang === "en" ? `Start with ${value}` : `Mula dengan ${value}`) : (lang === "en" ? `Take away ${value}` : `Buang ${value}`)}</p>
                  {beat === 2 ? <AdvancedSubtractionWholeTens count={(value / 10) as 1 | 2} countedThrough={counted / 10} counting={countingGroup === side} lang={lang} dashed={side === "bottom"} /> : <AdvancedSubtractionOperandGroup value={value} countedThrough={counted} counting={countingGroup === side} lang={lang} dashed={side === "bottom"} opened={side === "top" && beat === 0 && opened} removedLoose={side === "top" ? removedLoose : 0} removedTens={side === "top" ? removedTens : 0} shaking={side === "top" && insufficient} />}
                  <button type="button" disabled={busy || done} onClick={() => void countOperand(side)} className={`mx-auto mt-4 flex min-h-12 items-center rounded-2xl border-2 px-5 py-2 font-black shadow-[0_4px_0_#164e63] active:translate-y-1 disabled:opacity-70 ${done ? "border-emerald-300 bg-emerald-900 text-emerald-100" : "border-cyan-300 bg-cyan-950 text-cyan-100"}`}>{done ? (lang === "en" ? "Counted ✓" : "Sudah dikira ✓") : countingGroup === side ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count" : "Kira")}</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border-2 border-emerald-300 bg-slate-950/85 p-5 text-center shadow-[0_5px_0_#065f46]">
            <p className="mb-5 text-xl font-black text-emerald-100">{lang === "en" ? `${problem.answer} remain` : `Tinggal ${problem.answer}`}</p>
            {remainingVisual}
            {remainingCounted !== problem.answer && <button type="button" disabled={busy} onClick={() => void countRemaining()} className="mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1 disabled:opacity-60">{countingGroup === "remaining" ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count what is left" : "Kira yang tinggal")}</button>}
          </div>
        )}
      </div>

      {!removalDone && !insufficient && !(beat === 0 && opened) && <button type="button" disabled={busy || !readyToRemove} onClick={() => void tryTakeAway()} className="mx-auto flex min-h-14 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-8 py-3 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-35">{countingGroup === "remove" ? (lang === "en" ? "Taking away..." : "Sedang membuang...") : (lang === "en" ? "Take away" : "Buang")}</button>}

      {insufficient && !opened && <div className="rounded-3xl border-2 border-yellow-300 bg-amber-950/70 p-5 text-center"><p className="text-xl font-black text-yellow-100">{lang === "en" ? "We only have 4 ones. We need 1 more to take away 5. Not enough!" : "Kita cuma ada 4 sa. Kita perlukan 1 lagi untuk tolak 5. Tak cukup!"}</p><button type="button" disabled={opening} onClick={() => void openTen()} className="mx-auto mt-4 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1 disabled:opacity-60">{opening ? (lang === "en" ? "Opening..." : "Membuka...") : (lang === "en" ? "Open the ten-basket" : "Buka bakul puluh")}</button></div>}
      {beat === 0 && opened && !removalDone && <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-950/70 p-4 text-center"><p className="text-xl font-black text-emerald-100">{lang === "en" ? "Now we have 14 ones. Let's take away 5." : "Sekarang kita ada 14 sa. Jom tolak 5."}</p><button type="button" disabled={busy} onClick={() => void tryTakeAway()} className="mx-auto mt-4 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1 disabled:opacity-60">{lang === "en" ? "Take away" : "Buang"}</button></div>}

      {showUnderstand && !panelAComplete && <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setShowUnderstand(false); setPanelAComplete(true); }} className="rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-6 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] active:translate-y-1">{lang === "en" ? "I understand" : "Saya faham"}</button><button type="button" onClick={resetPanelA} className="rounded-2xl border-2 border-cyan-300 bg-cyan-950 px-6 py-3 font-black text-cyan-100 shadow-[0_5px_0_#164e63] active:translate-y-1">{lang === "en" ? "Please repeat" : "Ulang semula"}</button></div>}

      {panelAComplete && <div className="slide-in-up rounded-3xl border-2 border-emerald-300 bg-emerald-950/75 p-5 text-center shadow-[0_5px_0_#065f46]"><p className="text-2xl font-black text-emerald-100">{advancedSubtractionSummary(beat, lang)}</p><button type="button" disabled={panelLeaving} onClick={() => void openMethod()} className="mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-60">{lang === "en" ? "See the vertical subtraction method" : "Lihat kaedah tolak menegak"}</button></div>}
    </section>
  );
}

function AdvancedSubtractionConcreteAnchor({ lang, onComplete }: { lang: Lang; onComplete: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [removed, setRemoved] = useState(0);
  const [busy, setBusy] = useState(false);
  const finished = removed === 3;
  useEffect(() => () => stopNumberAudio(), []);
  const removeOne = async () => {
    if (busy || finished) return;
    setBusy(true);
    if (removed === 0) await speakMathCue("minus", lang);
    const next = removed + 1;
    let progressed = false;
    await speakCountingSequence(next, lang, COUNTING_STEP_MS, (value) => { progressed = true; setRemoved(value); }, undefined, next);
    if (!progressed) setRemoved(next);
    await wait(prefersReducedMotion ? 60 : 600);
    setBusy(false);
    if (next === 3) onComplete();
  };
  return (
    <section className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 text-center shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-6">
      <p className="text-xl font-black text-cyan-50">{lang === "en" ? "Chrys has 15 bananas. Chrys gives 3 away." : "Chrys ada 15 pisang. Chrys beri 3."}</p>
      <div className="mx-auto mt-6 max-w-4xl rounded-[2rem] border-2 border-cyan-400 bg-slate-950/80 px-3 py-8 sm:px-6">
        <AdvancedSubtractionLooseBananas count={15} countedThrough={15} removedThrough={removed} compact />
      </div>
      <div className="mx-auto mt-5 grid max-w-xl gap-3 min-[380px]:grid-cols-2">
        <div className="rounded-2xl border-2 border-red-300 bg-red-950/70 px-4 py-3"><p className="text-sm font-black uppercase text-red-200">{lang === "en" ? "Removed" : "Dibuang"}</p><p className="text-4xl font-black text-white">{removed} / 3</p></div>
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-950/70 px-4 py-3"><p className="text-sm font-black uppercase text-emerald-200">{lang === "en" ? "Bananas remaining" : "Pisang tinggal"}</p><p className="text-4xl font-black text-white">{15 - removed}</p></div>
      </div>
      {!finished ? <button type="button" disabled={busy} onClick={() => void removeOne()} className="relative mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-4 text-lg font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-60">{busy ? (lang === "en" ? "Taking away..." : "Sedang membuang...") : (lang === "en" ? "Take away a banana" : "Buang satu pisang")}<span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span></button> : <div className="slide-in-up mt-6 rounded-3xl border-2 border-emerald-300 bg-emerald-950/75 p-5"><p className="text-4xl font-black text-yellow-200">15 − 3 = 12</p><p className="mt-2 text-xl font-black text-emerald-100">{lang === "en" ? "15 take away 3 equals 12." : "15 tolak 3 sama dengan 12."}</p></div>}
    </section>
  );
}

function AdvancedSubtractionBorrowingIntro({ lang }: { lang: Lang }) {
  return (
    <section className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-5 shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-7">
      <div className="mx-auto grid max-w-4xl items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,.8fr)]">
        <div className="relative mx-auto"><TenBananaBundle lang={lang} compact /></div>
        <span data-math-cue="plus" className="text-center text-5xl font-black text-cyan-300">+</span>
        <div className="relative rounded-[1.75rem] border-2 border-cyan-400 bg-slate-950/75 p-5"><AdvancedSubtractionLooseBananas count={4} countedThrough={4} /><span className="absolute -right-3 -top-4 grid h-12 w-12 place-items-center rounded-full border-4 border-yellow-200 bg-yellow-400 text-3xl font-black text-slate-950 shadow-[0_0_20px_rgba(250,204,21,.55)]">?</span></div>
      </div>
      <p className="mx-auto mt-6 max-w-3xl rounded-2xl border border-cyan-500 bg-cyan-950/60 px-5 py-4 text-center text-xl font-black text-cyan-50">{lang === "en" ? "If the ones are not enough, this ten-basket can open into 10 ones." : "Jika sa tidak cukup, bakul puluh ini boleh dibuka menjadi 10 sa."}</p>
    </section>
  );
}

function AdvancedSubtractionProductionPractice({ a, b, lang, onSolved }: { a: number; b: number; lang: Lang; onSolved: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const answer = a - b;
  const [topCounted, setTopCounted] = useState(0);
  const [bottomCounted, setBottomCounted] = useState(0);
  const [counting, setCounting] = useState<"top" | "bottom" | "remove" | "remaining" | null>(null);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [removed, setRemoved] = useState(0);
  const [remainingCounted, setRemainingCounted] = useState(0);
  const removalDone = removed === b;
  useEffect(() => () => stopNumberAudio(), []);
  const countGroup = async (side: "top" | "bottom") => {
    if (counting || opening) return;
    const count = side === "top" ? a : b;
    const update = side === "top" ? setTopCounted : setBottomCounted;
    setCounting(side); update(0); let progressed = false;
    await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => { progressed = true; update(value); });
    if (!progressed) update(count);
    setCounting(null);
  };
  const openBasket = async () => {
    if (opening || counting) return;
    setOpening(true); await wait(prefersReducedMotion ? 100 : 900); setOpened(true); setOpening(false);
  };
  const remove = async () => {
    if (counting || !opened) return;
    setCounting("remove"); let progressed = false;
    await speakCountingSequence(b, lang, COUNTING_STEP_MS, (value) => { progressed = true; setRemoved(value); });
    if (!progressed) setRemoved(b);
    setCounting(null);
  };
  const countRemaining = async () => {
    if (counting || !removalDone) return;
    setCounting("remaining"); setRemainingCounted(0); let progressed = false;
    await speakCountingSequence(answer, lang, COUNTING_STEP_MS, (value) => { progressed = true; setRemainingCounted(value); });
    if (!progressed) setRemainingCounted(answer);
    setCounting(null); onSolved();
  };
  const ready = topCounted === a && bottomCounted === b;
  return (
    <section className="rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 to-emerald-950 p-4 text-center sm:p-5">
      <VerticalSubtractionCard a={a} b={b} borrowing lang={lang} />
      {!removalDone ? <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(["top", "bottom"] as const).map((side) => { const value = side === "top" ? a : b; const counted = side === "top" ? topCounted : bottomCounted; return <div key={side} className={`rounded-3xl border-2 p-4 ${side === "bottom" ? "border-dashed border-cyan-300 bg-cyan-950/40" : "border-cyan-400 bg-slate-950/80"}`}><AdvancedSubtractionOperandGroup value={value} countedThrough={counted} counting={counting === side} lang={lang} dashed={side === "bottom"} opened={side === "top" && opened} removedLoose={side === "top" ? removed : 0} /><button type="button" disabled={Boolean(counting) || opening || counted === value} onClick={() => void countGroup(side)} className="mx-auto mt-4 rounded-2xl border-2 border-cyan-300 bg-cyan-950 px-5 py-2 font-black text-cyan-100 shadow-[0_4px_0_#164e63] disabled:opacity-55">{counted === value ? (lang === "en" ? "Counted ✓" : "Sudah dikira ✓") : counting === side ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count" : "Kira")}</button></div>; })}
      </div> : <div className="mx-auto mt-5 max-w-2xl rounded-3xl border-2 border-emerald-300 bg-slate-950/80 p-5"><AdvancedSubtractionLooseBananas count={answer} countedThrough={remainingCounted} counting={counting === "remaining"} /><button type="button" disabled={Boolean(counting)} onClick={() => void countRemaining()} className="mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-6 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] disabled:opacity-55">{counting === "remaining" ? (lang === "en" ? "Counting..." : "Mengira...") : (lang === "en" ? "Count what is left" : "Kira yang tinggal")}</button></div>}
      {ready && !opened && <button type="button" disabled={opening} onClick={() => void openBasket()} className="mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] disabled:opacity-55">{opening ? (lang === "en" ? "Opening..." : "Membuka...") : (lang === "en" ? "Open the ten-basket" : "Buka bakul puluh")}</button>}
      {ready && opened && !removalDone && <button type="button" disabled={Boolean(counting)} onClick={() => void remove()} className="mx-auto mt-5 rounded-2xl border-2 border-yellow-200 bg-yellow-400 px-7 py-3 font-black text-slate-950 shadow-[0_5px_0_#a16207] disabled:opacity-55">{counting === "remove" ? (lang === "en" ? "Taking away..." : "Sedang membuang...") : (lang === "en" ? "Take away" : "Buang")}</button>}
    </section>
  );
}

function AdvancedSubtractionLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const [anchorComplete, setAnchorComplete] = useState(false);
  const [workedBeat, setWorkedBeat] = useState<AdvancedSubtractionBeatIndex>(0);
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  if (showPractice) return <Quiz lang={lang} t={t} title={lang === "en" ? "Cyber Mission 6: Subtraction Practice" : "Misi Siber 6: Latihan Tolak"} questions={advancedSubtractionQuestions} randomize={false} variant="cyber" onBackToLearning={() => { setShowPractice(false); setPhase(2); setWorkedBeat(2); setWalkthroughComplete(false); }} onFinish={() => onDone()} />;
  const phaseCopy = [
    { title: lang === "en" ? "Take away bigger numbers" : "Tolak nombor lebih besar", text: lang === "en" ? "It works just like before — just with more bananas." : "Caranya sama macam dulu — cuma pisang lebih banyak." },
    { title: lang === "en" ? "Meet borrowing" : "Kenal pinjam", text: lang === "en" ? "Sometimes the ones don't have enough to take away. We can open a ten-basket to get more ones." : "Kadang-kadang sa tak cukup untuk ditolak. Kita boleh buka bakul puluh untuk dapat lebih sa." },
    { title: lang === "en" ? "Vertical subtraction" : "Tolak menegak", text: lang === "en" ? "Count each group, take away, then see how we write it vertically." : "Kira setiap kumpulan, tolak, kemudian lihat cara kita tulis secara menegak." },
  ];
  const canNext = phase === 0 ? anchorComplete : phase === 1 || walkthroughComplete;
  const previous = () => {
    stopNumberAudio();
    if (phase === 0) return;
    if (phase === 1) { setAnchorComplete(false); setPhase(0); return; }
    setWalkthroughComplete(false);
    if (workedBeat > 0) setWorkedBeat((workedBeat - 1) as AdvancedSubtractionBeatIndex);
    else setPhase(1);
  };
  const next = () => {
    stopNumberAudio();
    if (phase === 0 && anchorComplete) { setPhase(1); return; }
    if (phase === 1) { setPhase(2); setWorkedBeat(0); setWalkthroughComplete(false); return; }
    if (!walkthroughComplete) return;
    if (workedBeat < 2) { setWorkedBeat((workedBeat + 1) as AdvancedSubtractionBeatIndex); setWalkthroughComplete(false); }
    else setShowPractice(true);
  };
  return (
    <main className="mx-auto w-full max-w-6xl pb-8"><div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3"><LessonShell lang={lang} title={t.advancedSubtraction} helper={lang === "en" ? "Cyber Mission 6 - Take away tens and ones up to 20." : "Misi Siber 6 - Tolak puluh dan sa hingga 20."} variant="cyber">
      <div className="mb-5 grid grid-cols-3 gap-2">{Array.from({ length: 3 }, (_, index) => <span key={index} className={`h-3 rounded-full border ${index <= phase ? "border-yellow-200 bg-yellow-400" : "border-slate-600 bg-slate-700"}`} />)}</div>
      <CyberTeachingCard eyebrow={lang === "en" ? "Cyber Mission 6" : "Misi Siber 6"} title={phaseCopy[phase].title} text={phaseCopy[phase].text} />
      {phase === 0 && <AdvancedSubtractionConcreteAnchor key={`sub-anchor-${lang}`} lang={lang} onComplete={() => setAnchorComplete(true)} />}
      {phase === 1 && <AdvancedSubtractionBorrowingIntro lang={lang} />}
      {phase === 2 && <AdvancedSubtractionWorkedBeat key={`${workedBeat}-${lang}`} beat={workedBeat} lang={lang} onWalkthroughComplete={() => setWalkthroughComplete(true)} />}
      <AdvancedLessonNavigation lang={lang} t={t} phase={phase} lastPhase={2} canNext={canNext} nextLabel={phase === 2 && workedBeat < 2 ? t.next : undefined} onPrevious={previous} onNext={next} onPractice={() => setShowPractice(true)} />
    </LessonShell></div></main>
  );
}

function TenBananaBundle({ lang, active = false, compact = false }: { lang: Lang; active?: boolean; compact?: boolean }) {
  return (
    <div className={`mobile-ten-bundle relative max-w-full overflow-hidden rounded-[1.75rem] border-4 p-3 transition ${
      active
        ? "border-yellow-300 bg-amber-950/80 shadow-[0_0_0_6px_rgba(250,204,21,.24)]"
        : "border-emerald-400 bg-emerald-950/75"
    }`}>
      <div className="grid grid-cols-5 place-items-center gap-1.5 overflow-hidden rounded-2xl border-2 border-emerald-400/80 bg-slate-950/85 p-2">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            className={`grid place-items-center rounded-xl border border-amber-300/40 bg-slate-900 shadow-inner ${compact ? "h-10 w-10" : "h-12 w-12 sm:h-14 sm:w-14"}`}
          >
            <SpriteIcon value={BANANA} className={compact ? "h-8 w-8" : "h-10 w-10 sm:h-11 sm:w-11"} />
          </span>
        ))}
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-white">
        <span className="text-2xl font-black" style={getNumberTextStyle(10)}>10</span>
        <span className="text-sm font-black">{lang === "en" ? "one ten" : "satu sepuluh"}</span>
      </div>
    </div>
  );
}

function TeenQuantityVisual({
  lang,
  tens,
  ones,
  activeTotal,
  showCountLabels = false,
  dimFuture = false,
}: {
  lang: Lang;
  tens: 1 | 2;
  ones: number;
  activeTotal?: number | null;
  showCountLabels?: boolean;
  dimFuture?: boolean;
}) {
  return (
    <div className={`grid items-center gap-4 ${tens === 2 ? "sm:grid-cols-2" : ones > 0 ? "md:grid-cols-[minmax(0,1.35fr)_auto_minmax(0,.8fr)]" : ""}`}>
      {Array.from({ length: tens }, (_, index) => (
        <TenBananaBundle
          key={index}
          lang={lang}
          compact={tens === 2}
          active={activeTotal === ((index + 1) * 10)}
        />
      ))}
      {tens === 1 && ones > 0 && (
        <>
          <span data-math-cue="plus" className="text-center text-5xl font-black text-yellow-300" aria-hidden="true">+</span>
          <div className="rounded-[1.75rem] border-4 border-yellow-300 bg-amber-50 p-4">
            <p className="mb-3 text-center text-lg font-black text-amber-900">
              {lang === "en" ? `${ones} more` : `${ones} lagi`}
            </p>
            <div className="mx-auto flex max-w-36 flex-wrap justify-center gap-3">
              {Array.from({ length: ones }, (_, index) => {
                const value = 11 + index;
                const reached = activeTotal == null || value <= activeTotal;
                const active = activeTotal === value;
                return (
                  <span
                    key={index}
                    className={`relative grid h-16 w-16 place-items-center rounded-2xl border-2 pt-3 shadow-inner transition ${
                      active
                        ? "border-yellow-400 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
                        : reached
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-slate-100 grayscale"
                    } ${dimFuture && !reached ? "opacity-35" : ""}`}
                  >
                    <SpriteIcon value={BANANA} className="h-12 w-12" />
                    {showCountLabels && reached && (
                      <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm ${active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
                        {value}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TEEN_VALUE_SECOND_OBJECTS = [
  "🌳",
  "🪨",
  "🍃",
  "🍄",
  "🌸",
  "🥥",
  "🥭",
  "⭐",
  "🐚",
  "📘",
  "🎈",
] as const;

function teenValueSecondObject(value: number) {
  return TEEN_VALUE_SECOND_OBJECTS[value - 10] ?? "🌳";
}

function TeenValueObjects({
  value,
  lang,
  visibleCount,
  counting,
  resultStage,
}: {
  value: number;
  lang: Lang;
  visibleCount: number;
  counting: boolean;
  resultStage: 0 | 1 | 2;
}) {
  const bananaLabel = lang === "en"
    ? `Total: ${value} ${objectName(BANANA, value, lang)}`
    : `Jumlah: ${value} ${objectName(BANANA, value, lang)}`;
  const secondObject = teenValueSecondObject(value);
  const secondObjectName = objectName(secondObject, value, lang);
  const secondObjectHeading = secondObjectName.charAt(0).toUpperCase() + secondObjectName.slice(1);
  const secondObjectLabel = lang === "en"
    ? `Total: ${value} ${secondObjectName}`
    : `Jumlah: ${value} ${secondObjectName}`;
  const activelyCounting = counting && resultStage === 0;
  // Keep every teen object large enough to identify. A maximum of five per
  // row avoids the former 7-10-column squeeze inside side-by-side panels.
  const balancedColumns = Math.min(5, Math.ceil(value / 2));

  return (
    <div className={`rounded-[2rem] border-4 p-4 transition sm:p-5 ${
      resultStage === 2
        ? "border-emerald-300 bg-emerald-950/85 shadow-[0_0_0_6px_rgba(52,211,153,.18)]"
        : "border-cyan-400 bg-slate-950/80 shadow-[inset_0_0_28px_rgba(34,211,238,.12)]"
    }`}>
      <p className="mb-4 text-center text-xl font-black text-cyan-100">
        {lang === "en" ? "Count both kinds of objects together." : "Kira kedua-dua jenis objek bersama-sama."}
      </p>
      <div className="grid items-stretch gap-5 md:grid-cols-2">
        <section>
          <h3 className="mb-3 text-center text-xl font-black text-yellow-200">
            {lang === "en" ? "Bananas" : "Pisang"}
          </h3>
          <LabeledValueGroup
            label={bananaLabel}
            count={value}
            emoji={BANANA}
            counted
            visibleCount={visibleCount}
            showLabel={resultStage >= 1}
            slowLabelReveal
            active={activelyCounting}
            cyber
            fixedColumns={balancedColumns}
            largeTiles
            lang={lang}
          />
        </section>
        <section>
          <h3 className="mb-3 text-center text-xl font-black text-cyan-100">
            {secondObjectHeading}
          </h3>
          <LabeledValueGroup
            label={secondObjectLabel}
            count={value}
            emoji={secondObject}
            counted
            visibleCount={visibleCount}
            showLabel={resultStage >= 2}
            slowLabelReveal
            active={activelyCounting}
            cyber
            fixedColumns={balancedColumns}
            largeTiles
            lang={lang}
          />
        </section>
      </div>
    </div>
  );
}

type DigitIntroStep = 0 | 1 | 2 | 3 | 4;

function DigitLabelSequence({ lang }: { lang: Lang }) {
  const digits = [2, 5, 8];
  const labels = DIGIT_LABELS[lang];
  const labelAudioFiles = DIGIT_LABEL_AUDIO_FILES[lang];
  const [activeIndex, setActiveIndex] = useState(-1);
  const [completedIndex, setCompletedIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const runRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const startLabeling = async () => {
    if (running) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setRunning(true);
    setActiveIndex(-1);
    setCompletedIndex(-1);

    for (let index = 0; index < labels.length; index += 1) {
      if (runRef.current !== runId) return;
      setActiveIndex(-1);
      const played = await playRecordedVoiceFile(
        labelAudioFiles[index],
        () => {
          if (runRef.current === runId) setActiveIndex(index);
        },
      );
      if (!played) {
        setActiveIndex(index);
        await wait(prefersReducedMotion ? 250 : 650);
      }
      if (runRef.current !== runId) return;
      setCompletedIndex(index);
    }

    setActiveIndex(-1);
    setRunning(false);
  };

  return (
    <div className="mx-auto grid min-h-[24rem] max-w-4xl place-items-center rounded-[2rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-6 text-center shadow-[inset_0_0_32px_rgba(34,211,238,.2)]">
      <div>
        <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-4 sm:gap-5">
          {digits.map((digit, index) => {
            const active = activeIndex === index;
            const complete = completedIndex >= index;
            return (
              <div key={digit} className={`transition-transform duration-300 ${active ? "scale-110" : "scale-100"}`}>
                <span
                  className={`mx-auto grid h-24 w-20 place-items-center rounded-2xl border-4 text-5xl font-black shadow-[0_6px_0_#155e75] transition-[background-color,border-color,color,box-shadow] duration-300 sm:h-28 sm:w-24 ${
                    active
                      ? "border-yellow-300 bg-cyan-800 text-yellow-200 ring-4 ring-yellow-300/60 shadow-[0_7px_0_#a16207]"
                      : complete
                        ? "border-emerald-300 bg-emerald-900 text-white"
                        : "border-cyan-300 bg-slate-900 text-yellow-200"
                  }`}
                  style={getNumberTextStyle(digit)}
                >
                  {digit}
                </span>
                <span
                  className={`mx-auto mt-4 block w-fit whitespace-nowrap rounded-full border-2 px-3 py-2 text-lg font-black transition-[background-color,border-color,color,box-shadow] duration-300 ${
                    active
                      ? "border-yellow-200 bg-yellow-300 text-slate-950 shadow-[0_4px_0_#a16207]"
                      : complete
                        ? "border-emerald-300 bg-emerald-500 text-white shadow-[0_4px_0_#047857]"
                        : "border-cyan-300 bg-slate-900 text-cyan-100 shadow-[0_4px_0_#155e75]"
                  }`}
                >
                  {labels[index]}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void startLabeling()}
          disabled={running}
          className="relative mx-auto mt-8 inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-cyan-200 bg-cyan-500 px-6 py-3 text-lg font-black text-slate-950 shadow-[0_6px_0_#0e7490] active:translate-y-1 disabled:opacity-70"
        >
          {running
            ? (lang === "en" ? "Playing the labels..." : "Memainkan label...")
            : completedIndex === labels.length - 1
              ? (lang === "en" ? "Hear and highlight the labels again" : "Dengar dan serlahkan label sekali lagi")
              : (lang === "en" ? "Hear and highlight the labels" : "Dengar dan serlahkan label")}
          {!running && (
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md" aria-hidden="true">
              <PointerIcon />
            </span>
          )}
        </button>

        <p className="mt-7 text-2xl font-black text-white">
          {lang === "en" ? "Each symbol is one digit." : "Setiap simbol ialah satu digit."}
        </p>
        <p className="mt-2 text-lg font-bold text-cyan-100">
          {lang === "en" ? "We can count the digit symbols: one, two, three." : "Kita boleh kira simbol digit: satu, dua, tiga."}
        </p>
        <p className="sr-only" aria-live="polite">
          {activeIndex >= 0 ? labels[activeIndex] : ""}
        </p>
      </div>
    </div>
  );
}

function DigitLengthComparison({ lang }: { lang: Lang }) {
  const digitLabels = DIGIT_LABELS[lang];
  const examples = lang === "en"
    ? [
        { value: "7", label: "1 digit" },
        { value: "14", label: "2 digits" },
        { value: "123", label: "3 digits" },
      ]
    : [
        { value: "7", label: "1 digit" },
        { value: "14", label: "2 digit" },
        { value: "123", label: "3 digit" },
      ];

  return (
    <div className="mx-auto grid min-h-[24rem] max-w-6xl place-items-center rounded-[2rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-5 text-center shadow-[inset_0_0_32px_rgba(34,211,238,.2)] sm:p-7">
      <div className="w-full">
        <p className="text-xl font-black text-cyan-100">
          {lang === "en" ? "Look at how many digits each number uses." : "Lihat berapa digit yang digunakan oleh setiap nombor."}
        </p>
        <div className="mx-auto mt-6 grid max-w-6xl gap-4 lg:grid-cols-[0.75fr_1.15fr_1.7fr]">
          {examples.map((example) => (
            <div key={example.value} className="rounded-[1.6rem] border-2 border-cyan-300 bg-slate-950/75 p-4 shadow-[0_5px_0_#164e63]">
              <div className="flex min-h-36 flex-nowrap items-start justify-center gap-2 xl:gap-3">
                {example.value.split("").map((digit, index) => (
                  <div key={`${example.value}-${index}`} className="flex flex-col items-center">
                    <span
                      className="grid h-20 w-16 place-items-center rounded-2xl border-4 border-yellow-300 bg-slate-900 text-4xl font-black text-yellow-200 shadow-[0_5px_0_#a16207] sm:h-24 sm:w-20 sm:text-5xl"
                      style={getNumberTextStyle(Number(digit))}
                    >
                      {digit}
                    </span>
                    <span className="mt-4 whitespace-nowrap rounded-full border-2 border-cyan-300 bg-slate-900 px-3 py-2 text-sm font-black text-cyan-100 shadow-[0_4px_0_#155e75] sm:text-base">
                      {digitLabels[index]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-4 w-fit rounded-full border-2 border-emerald-300 bg-emerald-950 px-5 py-2 text-lg font-black text-emerald-100 shadow-[0_4px_0_#065f46]">
                {example.label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-lg font-black text-white">
          {lang === "en" ? "Count the digit slots in each number." : "Kira ruang digit dalam setiap nombor."}
        </p>
      </div>
    </div>
  );
}

function DigitIntroductionVisual({ step, lang }: { step: DigitIntroStep; lang: Lang }) {
  if (step === 0) {
    return <DigitLabelSequence lang={lang} />;
  }

  if (step === 1) {
    return (
      <div className="mx-auto grid min-h-[24rem] max-w-4xl place-items-center rounded-[2rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-6 text-center">
        <div>
          <div className="mx-auto grid h-44 w-36 place-items-center rounded-[2rem] border-4 border-yellow-300 bg-slate-900 text-8xl font-black text-yellow-200 shadow-[0_8px_0_#a16207]" style={getNumberTextStyle(7)}>
            7
          </div>
          <p className="mt-7 text-2xl font-black text-white">
            {lang === "en" ? "7 is a one digit number." : "7 ialah nombor satu digit."}
          </p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return <DigitLengthComparison lang={lang} />;
  }

  if (step === 3) {
    return (
      <div className="mx-auto min-h-[24rem] max-w-4xl rounded-[2rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-5 text-center sm:p-7">
        <p className="text-2xl font-black text-white">
          {lang === "en" ? "These are all the one-digit numbers." : "Ini semua nombor satu digit."}
        </p>
        <div className="mx-auto mt-7 grid max-w-3xl grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }, (_, digit) => (
            <span
              key={digit}
              className="grid aspect-square place-items-center rounded-2xl border-3 border-cyan-300 bg-slate-900 text-3xl font-black text-yellow-200 shadow-[0_5px_0_#155e75] sm:text-5xl"
              style={getNumberTextStyle(digit)}
            >
              {digit}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[24rem] max-w-4xl place-items-center rounded-[2rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-6 text-center">
      <div className="w-full">
        <p className="text-xl font-black text-cyan-100">
          {lang === "en" ? "Put two digits side by side." : "Letak dua digit bersebelahan."}
        </p>
        <div className="mx-auto mt-6 w-fit rounded-[2rem] border-2 border-cyan-300/60 bg-slate-950/60 p-5">
          <div className="flex items-start justify-center gap-1">
          {[1, 0].map((digit, index) => (
            <div key={`${digit}-${index}`} className="w-28">
              <span
                className={`grid h-32 w-28 place-items-center border-4 border-yellow-300 bg-slate-900 text-7xl font-black text-yellow-200 shadow-[0_7px_0_#a16207] ${index === 0 ? "rounded-l-2xl rounded-r-md" : "rounded-l-md rounded-r-2xl"}`}
                style={getNumberTextStyle(digit)}
              >
                {digit}
              </span>
              <span className="mt-3 block rounded-full bg-cyan-900 px-3 py-1.5 text-sm font-black text-cyan-50">
                {lang === "en" ? `Digit ${index + 1}` : `Digit ${index + 1}`}
              </span>
            </div>
          ))}
          </div>
          <div className="mx-auto mt-5 grid h-16 w-36 place-items-center rounded-2xl border-3 border-emerald-300 bg-emerald-500 text-4xl font-black text-white shadow-[0_5px_0_#047857]" style={getNumberTextStyle(10)}>
            10
          </div>
        </div>
        <p className="mt-6 text-3xl font-black text-white">
          {lang === "en" ? "Together, they make 10." : "Bersama-sama, digit ini jadi 10."}
        </p>
        <p className="mt-2 text-lg font-bold text-cyan-100">
          {lang === "en" ? "10 is a two-digit number." : "10 ialah nombor dua digit."}
        </p>

        <div className="mx-auto mt-7 max-w-3xl border-t-2 border-cyan-400/40 pt-6">
          <p className="text-xl font-black text-yellow-200">
            {lang === "en" ? "Here are two more examples." : "Ini dua lagi contoh."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { digits: [1, 4], value: 14 },
              { digits: [1, 8], value: 18 },
            ].map((example) => (
              <div
                key={example.value}
                className="rounded-[1.5rem] border-2 border-cyan-300 bg-slate-950/70 p-4 shadow-[0_5px_0_#164e63]"
              >
                <div className="flex items-start justify-center gap-3">
                  {example.digits.map((digit, index) => (
                    <div key={`${example.value}-${index}`}>
                      <span
                        className="grid h-16 w-14 place-items-center rounded-xl border-3 border-cyan-300 bg-slate-900 text-3xl font-black text-yellow-200 shadow-[0_4px_0_#155e75]"
                        style={getNumberTextStyle(digit)}
                      >
                        {digit}
                      </span>
                      <span className="mt-2 block rounded-full bg-cyan-900 px-2 py-1 text-xs font-black text-cyan-50">
                        {lang === "en" ? `Digit ${index + 1}` : `Digit ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="mx-auto mt-4 grid h-12 w-28 place-items-center rounded-xl border-3 border-emerald-300 bg-emerald-500 text-3xl font-black text-white shadow-[0_4px_0_#047857]"
                  style={getNumberTextStyle(example.value)}
                >
                  {example.value}
                </div>
                <p className="mt-4 text-xl font-black text-white">
                  {lang === "en"
                    ? `${example.digits[0]} and ${example.digits[1]} make ${example.value}.`
                    : `${example.digits[0]} dan ${example.digits[1]} menjadi ${example.value}.`}
                </p>
                <p className="mt-1 text-sm font-bold text-cyan-100">
                  {lang === "en" ? `${example.value} is a two-digit number.` : `${example.value} ialah nombor dua digit.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeenNumbersLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [introStep, setIntroStep] = useState<DigitIntroStep | null>(0);
  const [number, setNumber] = useState(10);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [showPractice, setShowPractice] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [counting, setCounting] = useState(false);
  const [countComplete, setCountComplete] = useState(false);
  const [resultStage, setResultStage] = useState<0 | 1 | 2>(0);
  const soundEnabled = React.useContext(AudioEnabledContext);
  const countRunRef = React.useRef(0);
  const numberWord = TEEN_WORDS[lang][number];
  const spelledWord = numberWord
    .split(" ")
    .map((part) => part.split("").join(" - "))
    .join("   ");

  useEffect(() => {
    countRunRef.current += 1;
    stopNumberAudio();
    setVisibleCount(0);
    setCounting(false);
    setCountComplete(false);
    setResultStage(0);
  }, [introStep, number, step, lang]);

  useEffect(() => () => {
    countRunRef.current += 1;
    stopNumberAudio();
  }, []);

  const goToNumber = (nextNumber: number, nextStep: 0 | 1 | 2 = 0) => {
    countRunRef.current += 1;
    stopNumberAudio();
    setIntroStep(null);
    setNumber(Math.min(20, Math.max(10, nextNumber)));
    setStep(nextStep);
  };

  const startCounting = async () => {
    if (counting) return;
    const runId = ++countRunRef.current;
    stopNumberAudio();
    setVisibleCount(0);
    setCountComplete(false);
    setResultStage(0);
    setCounting(true);
    const values = Array.from({ length: number }, (_, index) => index + 1);

    if (soundEnabled) {
      await speakNumberValuesSequence(values, lang, 1300, (value) => {
        if (countRunRef.current === runId) setVisibleCount(value);
      });
    } else {
      for (const value of values) {
        if (countRunRef.current !== runId) return;
        setVisibleCount(value);
        await wait(500);
      }
    }

    if (countRunRef.current !== runId) return;
    await wait(1000);
    if (countRunRef.current !== runId) return;
    setResultStage(1);
    // Reveal and announce the banana total before introducing the matching
    // second object group. This shared sequence covers every teen value from
    // 10 through 20 in lesson mode.
    await wait(250);
    if (countRunRef.current !== runId) return;
    if (soundEnabled) await speakRecordedBananaTotal(number, lang, BANANA);
    if (countRunRef.current !== runId) return;
    await wait(500);
    if (countRunRef.current !== runId) return;
    setResultStage(2);
    await wait(250);
    if (countRunRef.current !== runId) return;
    if (soundEnabled) await speakRecordedBananaTotal(number, lang, teenValueSecondObject(number));
    if (countRunRef.current !== runId) return;
    await wait(900);
    if (countRunRef.current !== runId) return;
    setCounting(false);
    setCountComplete(true);
  };

  const goPrevious = () => {
    if (introStep !== null) {
      if (introStep > 0) setIntroStep((introStep - 1) as DigitIntroStep);
      return;
    }
    if (step > 0) {
      setStep((current) => Math.max(0, current - 1) as 0 | 1 | 2);
    } else if (number > 10) {
      goToNumber(number - 1, 2);
    } else {
      setIntroStep(3);
    }
  };

  const goNext = () => {
    if (introStep !== null) {
      if (introStep < 4) {
        setIntroStep((introStep + 1) as DigitIntroStep);
      } else {
        setIntroStep(null);
        setNumber(10);
        setStep(0);
      }
      return;
    }
    if (step < 2) {
      setStep((current) => Math.min(2, current + 1) as 0 | 1 | 2);
    } else if (number < 20) {
      goToNumber(number + 1);
    } else {
      setShowPractice(true);
    }
  };

  if (showPractice) {
    return (
      <Quiz
        lang={lang}
        t={t}
        title={lang === "en" ? "Double-Digit Numbers: Practice" : "Nombor Dua Digit: Latihan"}
        questions={teenPracticeQuestions}
        randomize={false}
        variant="cyber"
          onBackToLearning={() => {
          setShowPractice(false);
          goToNumber(20, 2);
        }}
        onFinish={() => onDone()}
      />
    );
  }

  const introCopy = introStep === 0
    ? {
        title: lang === "en" ? "What is a digit?" : "Apa itu digit?",
        text: lang === "en" ? "A digit is one symbol used to write numbers." : "Digit ialah satu simbol yang digunakan untuk menulis nombor.",
      }
    : introStep === 1
      ? {
          title: lang === "en" ? "A one-digit number" : "Nombor satu digit",
          text: lang === "en" ? "A one-digit number uses one digit." : "Nombor satu digit menggunakan satu digit.",
        }
      : introStep === 2
        ? {
            title: lang === "en" ? "Compare digit lengths" : "Banding bilangan digit",
            text: lang === "en" ? "A number can use one, two, or three digits." : "Satu nombor boleh menggunakan satu, dua atau tiga digit.",
          }
        : introStep === 3
          ? {
              title: lang === "en" ? "Meet every one-digit number" : "Kenal semua nombor satu digit",
              text: lang === "en" ? "The one-digit numbers are 0 to 9." : "Nombor satu digit ialah 0 hingga 9.",
            }
          : {
              title: lang === "en" ? "Now meet two digits" : "Sekarang kenal dua digit",
              text: lang === "en" ? "The number 10 has two digits: 1 and 0." : "Nombor 10 mempunyai dua digit: 1 dan 0.",
            };

  const numberTeachingCopy = step === 0
    ? {
        title: lang === "en" ? `Meet number ${number}` : `Kenal nombor ${number}`,
        text: lang === "en" ? `This is the number ${number}.` : `Ini nombor ${number}.`,
      }
    : step === 1 ? {
          title: lang === "en" ? `See the value of ${number}` : `Lihat nilai ${number}`,
          text: lang === "en"
            ? `${number} means ${number} objects. Count the bananas and ${objectName(teenValueSecondObject(number), number, lang)} together.`
            : `${number} bermaksud ${number} objek. Kira pisang dan ${objectName(teenValueSecondObject(number), number, lang)} bersama-sama.`,
      } : {
          title: lang === "en" ? `Trace ${number}` : `Ikut garisan ${number}`,
          text: lang === "en" ? `Follow the number ${number} with your pencil or finger.` : `Ikut nombor ${number} dengan pensel atau jari kamu.`,
        };
  const teachingCopy = introStep !== null ? introCopy : numberTeachingCopy;

  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <div className="rounded-[2.25rem] border-4 border-cyan-300 bg-slate-950 p-2 shadow-[0_10px_0_#083344] sm:p-3">
        <LessonShell
          lang={lang}
          title={t.advancedTeenNumbers}
          helper={lang === "en" ? "Learn digits, then see, spell, and count numbers 10-20." : "Belajar digit, kemudian lihat, eja dan kira nombor 10-20."}
          variant="cyber"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="rounded-full border border-cyan-300 bg-cyan-950/90 px-4 py-2 text-sm font-black text-yellow-200 shadow-[0_4px_0_#164e63]">
              {introStep !== null
                ? (lang === "en" ? "Digit basics" : "Asas digit")
                : (lang === "en" ? `Number ${number} of 10-20` : `Nombor ${number} daripada 10-20`)}
            </p>
            <p className="rounded-full border border-cyan-400/70 bg-slate-950/80 px-4 py-2 font-black text-cyan-100">{introStep !== null ? `${introStep + 1} / 5` : `${number - 9} / 11`}</p>
          </div>
          <div className={`mb-5 grid gap-2 ${introStep !== null ? "grid-cols-5" : "grid-cols-3"}`}>
            {Array.from({ length: introStep !== null ? 5 : 3 }, (_, item) => (
              <div key={item} className={`h-3 rounded-full border ${item <= (introStep ?? step) ? "border-yellow-200 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,.5)]" : "border-slate-600 bg-slate-700"}`} />
            ))}
          </div>

          <div className="mb-5 grid items-center gap-4 rounded-3xl border-2 border-cyan-300 bg-gradient-to-r from-slate-950/95 to-cyan-950/90 p-4 shadow-[0_6px_0_#164e63] sm:grid-cols-[auto_1fr]">
            <span className="mx-auto grid h-28 w-28 place-items-center rounded-2xl border-2 border-cyan-300 bg-slate-950/70 shadow-[0_5px_0_#0891b2,0_0_20px_rgba(34,211,238,.16)]">
              <img src={chrysThinking} alt="Chrys teaching" className="h-24 w-24 object-contain drop-shadow-lg" />
            </span>
            <div>
              <p className="mb-1 text-sm font-black uppercase tracking-wide text-cyan-300">{lang === "en" ? "Mission briefing" : "Taklimat misi"}</p>
              <h2 className="text-2xl font-black text-yellow-200">{teachingCopy.title}</h2>
              <p className="mt-1 text-xl font-black text-cyan-50">{teachingCopy.text}</p>
            </div>
          </div>

          {introStep !== null && <DigitIntroductionVisual step={introStep} lang={lang} />}

          {introStep === null && step === 0 && (
            <div className="mx-auto grid min-h-[24rem] max-w-4xl items-stretch gap-5 rounded-[2rem] border-4 border-cyan-300 bg-slate-950/80 p-6 shadow-[inset_0_0_36px_rgba(34,211,238,.16)] sm:grid-cols-2">
              <div className="grid place-items-center rounded-[2rem] border-2 border-cyan-300/80 bg-cyan-950/50 p-5">
                <div className="grid h-52 w-56 place-items-center rounded-[2.5rem] border-4 border-yellow-300 bg-yellow-300 text-8xl font-black text-slate-950 shadow-[0_10px_0_#a16207,0_0_30px_rgba(250,204,21,.25)]" style={getNumberTextStyle(number)}>
                  {number}
                </div>
              </div>
              <div className="grid content-center justify-items-center rounded-[2rem] border-2 border-cyan-300 bg-gradient-to-b from-cyan-950 to-slate-950 p-6 text-center shadow-[0_6px_0_#164e63]">
                <p className="text-sm font-black uppercase tracking-wide text-cyan-300">{lang === "en" ? "Spelling" : "Ejaan"}</p>
                <p className="mt-3 break-words text-5xl font-black capitalize text-yellow-200 sm:text-6xl">{numberWord}</p>
                <p className="mt-5 whitespace-pre-wrap text-lg font-black text-cyan-100 sm:text-xl">{spelledWord}</p>
                <button
                  type="button"
                  onClick={() => speakNumber(number, lang)}
                  aria-label={lang === "en" ? `Hear ${numberWord}` : `Dengar ${numberWord}`}
                  className="relative mt-6 grid h-16 w-20 place-items-center rounded-2xl border-2 border-cyan-300 bg-cyan-600 text-white shadow-[0_6px_0_#164e63] active:translate-y-1"
                >
                  <SpeakerIcon />
                  <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md" aria-hidden="true">
                    <PointerIcon />
                  </span>
                </button>
              </div>
            </div>
          )}

          {introStep === null && step === 1 && (
            <div>
              <div className="mb-5 text-center">
                <button
                  type="button"
                  disabled={counting}
                  onClick={startCounting}
                  className="relative rounded-2xl border-2 border-cyan-300 bg-cyan-600 px-8 py-4 text-xl font-black text-white shadow-[0_7px_0_#164e63] active:translate-y-1 disabled:opacity-60"
                >
                  {counting
                    ? (lang === "en" ? "Counting..." : "Mengira...")
                    : countComplete
                      ? (lang === "en" ? "Count again" : "Kira lagi")
                      : (lang === "en" ? "Start counting" : "Mula mengira")}
                  {!counting && (
                    <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md" aria-hidden="true">
                      <PointerIcon />
                    </span>
                  )}
                </button>
              </div>
              <TeenValueObjects
                value={number}
                lang={lang}
                visibleCount={visibleCount}
                counting={counting}
                resultStage={resultStage}
              />
            </div>
          )}

          {introStep === null && step === 2 && (
            <div className="rounded-[2rem] border-2 border-cyan-300 bg-slate-950/80 p-4 shadow-[inset_0_0_36px_rgba(34,211,238,.16)]">
              <TracePad
                value={number}
                t={t}
                lang={lang}
                onComplete={goNext}
                cyber
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-cyan-400/40 pt-5">
            <button
              type="button"
              disabled={introStep === 0}
              onClick={goPrevious}
              className="rounded-2xl border-2 border-cyan-400 bg-slate-950 px-6 py-3 font-black text-cyan-100 shadow-[0_4px_0_#164e63] active:translate-y-1 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:shadow-none"
            >
              {t.previous}
            </button>
            <div className="flex flex-1 flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPractice(true)}
                className="rounded-xl border-2 border-emerald-300 bg-emerald-900 px-4 py-2 text-sm font-black text-emerald-100 shadow-[0_4px_0_#064e3b] active:translate-y-1"
              >
                {skipPracticeLabel(lang)}
              </button>
              {introStep !== null ? (
                <button
                  type="button"
                  onClick={() => goToNumber(10)}
                  className="rounded-xl border-2 border-cyan-300 bg-slate-900 px-4 py-2 text-sm font-black text-cyan-100 shadow-[0_4px_0_#164e63] active:translate-y-1"
                >
                  {lang === "en" ? "Skip to numbers 10-20" : "Terus ke nombor 10-20"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={number === 10}
                    onClick={() => goToNumber(number - 1)}
                    className="rounded-xl border-2 border-cyan-300 bg-slate-900 px-4 py-2 text-sm font-black text-cyan-100 shadow-[0_4px_0_#164e63] active:translate-y-1 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:shadow-none"
                  >
                    {goBackPreviousNumberLabel(lang)}
                  </button>
                  <button
                    type="button"
                    disabled={number === 20}
                    onClick={() => goToNumber(number + 1)}
                    className="rounded-xl border-2 border-cyan-300 bg-slate-900 px-4 py-2 text-sm font-black text-cyan-100 shadow-[0_4px_0_#164e63] active:translate-y-1 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:shadow-none"
                  >
                    {skipNextNumberLabel(lang)}
                  </button>
                </>
              )}
              <LessonNextButton
                onClick={goNext}
                label={introStep === 4
                  ? (lang === "en" ? "Meet number 10" : "Kenal nombor 10")
                  : number === 20 && step === 2
                    ? (lang === "en" ? "Start practice" : "Mula latihan")
                    : t.next}
                className="text-xl ring-2 ring-cyan-300/40"
              />
            </div>
          </div>
        </LessonShell>
      </div>
    </main>
  );
}

function MenuCard({
  title,
  subtitle,
  icon,
  color,
  step,
  complete = false,
  lang,
  actionLabel,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string | React.ReactNode;
  color: LearningSectionColor;
  step?: number;
  complete?: boolean;
  lang: Lang;
  actionLabel?: string;
  onClick: () => void;
}) {
  const colors = {
    sky: {
      border: "border-sky-400",
      accent: "bg-sky-500",
      badge: "border-sky-200 bg-sky-50 text-sky-700",
      step: "bg-sky-600",
    },
    emerald: {
      border: "border-emerald-500",
      accent: "bg-emerald-600",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      step: "bg-emerald-700",
    },
    violet: {
      border: "border-purple-500",
      accent: "bg-purple-600",
      badge: "border-purple-200 bg-purple-50 text-purple-800",
      step: "bg-purple-700",
    },
    amber: {
      border: "border-yellow-400",
      accent: "bg-yellow-400",
      badge: "border-yellow-300 bg-yellow-50 text-yellow-900",
      step: "bg-yellow-500",
    },
    teal: {
      border: "border-cyan-400",
      accent: "bg-cyan-500",
      badge: "border-cyan-200 bg-cyan-50 text-cyan-800",
      step: "bg-cyan-600",
    },
    rose: {
      border: "border-pink-500",
      accent: "bg-pink-600",
      badge: "border-pink-200 bg-pink-50 text-pink-800",
      step: "bg-pink-700",
    },
    orange: {
      border: "border-orange-500",
      accent: "bg-orange-600",
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      step: "bg-orange-700",
    },
    navy: {
      border: "border-slate-800",
      accent: "bg-slate-900",
      badge: "border-yellow-300 bg-slate-900 text-yellow-200",
      step: "bg-slate-900",
    },
  };
  const theme = colors[color];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title}. ${subtitle}. ${complete ? (lang === "en" ? "Completed" : "Selesai") : (lang === "en" ? "Not completed" : "Belum selesai")}`}
      className={`menu-card group relative min-h-48 overflow-hidden rounded-[2rem] border-4 p-5 text-left transition active:translate-y-1 md:p-6 ${complete ? "border-emerald-500 ring-4 ring-emerald-200 shadow-[0_9px_0_#047857,0_0_28px_rgba(16,185,129,.35)]" : theme.border} ${step ? "learning-menu-card" : ""}`}
    >
      <span className={`absolute inset-x-0 top-0 h-3 ${complete ? "bg-emerald-500" : theme.accent}`} aria-hidden="true" />
      {complete && (
        <span
          className="pointer-events-none absolute right-4 top-4 rounded-full border-2 border-white/90 bg-emerald-600 px-3 py-1 text-[.68rem] font-black uppercase tracking-wider text-white shadow-md sm:right-5 sm:top-5 sm:text-xs"
          aria-hidden="true"
        >
          {lang === "en" ? "Completed" : "Selesai"}
        </span>
      )}
      <span className="relative z-10 flex items-start justify-between gap-3 pt-2">
        <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-[1.4rem] border-2 shadow-inner ${complete ? "border-emerald-300 bg-emerald-50 text-emerald-700" : theme.badge}`}>
          {typeof icon === "string" ? <SpriteIcon value={icon} className="h-14 w-14" /> : icon}
        </span>
        {step !== undefined && (
          <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-white text-lg font-black text-white shadow-md ${complete ? "mt-10 bg-emerald-600 ring-4 ring-emerald-200" : theme.step}`}>
            {complete ? <Check className="h-7 w-7" strokeWidth={5} aria-hidden="true" /> : step}
            {complete && <span className="absolute -bottom-2 -left-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-blue-950 text-[.65rem] text-white">{step}</span>}
          </span>
        )}
      </span>
      <h3 className="relative z-10 mt-5 text-2xl font-black leading-tight text-blue-950 md:text-[1.7rem]">{title}</h3>
      <p className="relative z-10 mt-2 max-w-[28rem] text-base font-black leading-snug text-slate-600">{subtitle}</p>
      {step !== undefined && (
        <span className={`relative z-10 mt-5 flex items-center justify-end gap-2 font-black ${complete ? "text-emerald-700" : "text-blue-700"}`}>
          {complete ? (lang === "en" ? "Completed — play again" : "Selesai — main semula") : actionLabel}
          {complete ? <Check className="h-6 w-6" strokeWidth={4} aria-hidden="true" /> : <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" strokeWidth={3} aria-hidden="true" />}
        </span>
      )}
    </button>
  );
}

function skipPracticeLabel(lang: Lang) {
  return lang === "en" ? "Skip to practice questions" : "Terus ke soalan latihan";
}

function skipNextNumberLabel(lang: Lang) {
  return lang === "en" ? "Skip to next number" : "Terus ke nombor seterusnya";
}

function goBackPreviousNumberLabel(lang: Lang) {
  return lang === "en" ? "Go back to previous number" : "Kembali ke nombor sebelumnya";
}

function backToLearningLabel(lang: Lang) {
  return lang === "en" ? "Back to learning mode" : "Kembali ke mod belajar";
}

function NumbersLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [number, setNumber] = useState(0);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [showPractice, setShowPractice] = useState(false);
  const word = WORDS[lang][number];
  const next = () => {
    if (step < 4) setStep((s) => (s + 1) as 0 | 1 | 2 | 3 | 4);
    else if (number < 9) {
      setNumber((n) => n + 1);
      setStep(0);
    } else setShowPractice(true);
  };
  const previous = () => {
    if (step > 0) {
      setStep((s) => (s - 1) as 0 | 1 | 2 | 3 | 4);
      return;
    }
    if (number > 0) {
      setNumber((n) => n - 1);
      setStep(4);
    }
  };
  const skipNextNumber = () => {
    if (number < 9) {
      setNumber((n) => n + 1);
      setStep(0);
    } else {
      setShowPractice(true);
    }
  };

  if (showPractice) {
    return (
      <Quiz
        lang={lang}
        t={t}
        title={lang === "en" ? `${t.learnNumbers}: Practice` : `${t.learnNumbers}: Latihan`}
        questions={numberPracticeQuestions}
        onFinish={() => onDone()}
        onBackToLearning={() => setShowPractice(false)}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl pb-8">
      <LessonShell
        lang={lang}
        title={`${t.learnNumbers}: ${number}`}
        helper={lang === "en" ? "Chrys teaches each number through seeing, counting, number order, tracing, and drawing." : "Chrys ajar setiap nombor dengan lihat, kira, susun, ikut garisan, dan lukis."}
      >
        <div className="mb-4 grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-3 rounded-full ${s <= step ? "bg-yellow-400" : "bg-slate-200"}`} />
          ))}
        </div>
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <CharacterTalk lang={lang} text={lang === "en" ? `This is ${number}. We say ${word}.` : `Ini ${number}. Kita sebut ${word}.`} />
            <div className="rounded-[2rem] border-4 border-yellow-200 bg-yellow-50 p-6 text-center">
              <NumberTile value={number} lang={lang} large />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4 text-center">
            <CharacterTalk lang={lang} text={number === 0 ? (lang === "en" ? "Zero means nothing. The basket is empty." : "Kosong maksudnya tiada apa-apa. Bakul kosong.") : (lang === "en" ? `Count ${number} bananas slowly.` : `Kira ${number} pisang perlahan.`)} />
            <ObjectGroup count={number} emoji="🍌" numbered lang={lang} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <CharacterTalk lang={lang} text={lang === "en" ? "Use the number line. The number before is on the left. The number after is on the right." : "Guna garis nombor. Nombor sebelum ada di kiri. Nombor selepas ada di kanan."} />
            <NumberLine marked={number} />
            <SequenceNeighbors number={number} lang={lang} />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <CharacterTalk lang={lang} text={lang === "en" ? "Skip counting means we jump by the same size. Here we jump by 2." : "Bergerak ke nombor seterusnya dengan lompatan yang sama. Di sini kita lompat 2."} />
            <SkipCountingPanel marked={number} lang={lang} />
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-4 md:grid-cols-2">
            <TracePad value={number} t={t} lang={lang} onComplete={next} />
            <DrawQuantity count={number} lang={lang} />
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button disabled={number === 0 && step === 0} onClick={previous} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">
            {t.previous}
          </button>
          <div className="flex flex-1 flex-wrap justify-end gap-3">
            <button onClick={() => setShowPractice(true)} className="rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-5 py-3 font-black text-white shadow-[0_5px_0_#065f46] active:translate-y-1">
              {skipPracticeLabel(lang)}
            </button>
            <button onClick={skipNextNumber} className="rounded-2xl border-2 border-blue-200 bg-white px-5 py-3 font-black text-blue-700 shadow-[0_5px_0_rgba(30,64,175,.18)] active:translate-y-1">
              {number < 9 ? skipNextNumberLabel(lang) : skipPracticeLabel(lang)}
            </button>
            <LessonNextButton label={number === 9 && step === 4 ? t.done : t.next} onClick={next} />
          </div>
        </div>
      </LessonShell>
    </main>
  );
}

function RecognizeNumbersLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [number, setNumber] = useState(0);
  const [step, setStep] = useState(0);
  const [practice, setPractice] = useState(false);
  const [reviewingPreviousNumber, setReviewingPreviousNumber] = useState(false);
  const [numberDrawings, setNumberDrawings] = useState<Record<number, string>>({});

  const next = () => {
    setReviewingPreviousNumber(false);
    if (step < 4) setStep((s) => s + 1);
    else if (number < 9) {
      setNumber((n) => n + 1);
      setStep(0);
    } else setPractice(true);
  };

  const previous = () => {
    if (step > 0) {
      setReviewingPreviousNumber(false);
      setStep((s) => s - 1);
      return;
    }
    if (number > 0) {
      setNumber((n) => n - 1);
      setStep(4);
      setReviewingPreviousNumber(true);
    }
  };

  const skipNextNumber = () => {
    setReviewingPreviousNumber(false);
    if (number < 9) {
      setNumber((n) => n + 1);
      setStep(0);
    } else {
      setPractice(true);
    }
  };

  const skipPreviousNumber = () => {
    if (number === 0) return;
    setReviewingPreviousNumber(false);
    setNumber((n) => n - 1);
    setStep(0);
  };

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.recognizeNumbers}: ${t.practice}`} questions={recognitionPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell lang={lang} title={t.recognizeNumbers} helper={lang === "en" ? "See it. Spell it. Trace it. Write it." : "Lihat. Eja. Ikut garisan. Tulis."}>
        <div className="mb-4 grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((s) => <div key={s} className={`h-3 rounded-full ${s <= step ? "bg-yellow-400" : "bg-slate-200"}`} />)}
        </div>
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <CharacterTalk lang={lang} text={lang === "en" ? `This is ${number}.` : `Ini ${number}.`} />
            <NumberTile value={number} lang={lang} large showWord={false} />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <CharacterTalk lang={lang} text={lang === "en" ? `This word says ${WORDS.en[number]}.` : `Perkataan ini ${WORDS.ms[number]}.`} />
            <div className="rounded-[2rem] border-4 border-yellow-200 bg-yellow-50 p-6 text-center">
              <p className="text-6xl font-black text-blue-950">{WORDS[lang][number]}</p>
              {NUMBER_AUDIO_ENABLED && (
                <button
                  onClick={() => speakNumber(number, lang)}
                  aria-label={lang === "en" ? `Hear ${WORDS.en[number]}` : `Dengar ${WORDS.ms[number]}`}
                  className="relative mt-4 inline-grid h-20 w-20 place-items-center rounded-3xl bg-blue-600 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1"
                >
                  <SpeakerIcon />
                  <span className="pointer-events-none absolute -right-4 -top-4 rotate-45 rounded-full border-2 border-yellow-300 bg-yellow-100 px-3 py-2 text-yellow-700 shadow-md" aria-hidden="true">
                    <PointerIcon />
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <CharacterTalk lang={lang} text={lang === "en" ? `This word says ${WORDS.en[number]}.` : `Perkataan ini ${WORDS.ms[number]}.`} />
            <SpellWordCard value={number} lang={lang} />
          </div>
        )}
        {step === 3 && <TracePad value={number} t={t} lang={lang} onComplete={next} />}
        {step === 4 && (
          <WriteNumberPad
            value={number}
            t={t}
            lang={lang}
            onComplete={next}
            initialDrawing={numberDrawings[number]}
            initialShowModel={reviewingPreviousNumber}
            onDrawingChange={(drawing) => {
              setNumberDrawings((current) => {
                if (drawing) return { ...current, [number]: drawing };
                const updated = { ...current };
                delete updated[number];
                return updated;
              });
            }}
          />
        )}
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button disabled={number === 0 && step === 0} onClick={previous} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            <button
              type="button"
              disabled={number === 0}
              onClick={skipPreviousNumber}
              className="rounded-xl border-2 border-blue-200 bg-white/80 px-4 py-2 text-sm font-black text-blue-700 shadow-[0_3px_0_rgba(30,64,175,.14)] active:translate-y-1 disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {goBackPreviousNumberLabel(lang)}
            </button>
            <button
              type="button"
              disabled={number === 9}
              onClick={skipNextNumber}
              className="rounded-xl border-2 border-blue-200 bg-white/80 px-4 py-2 text-sm font-black text-blue-700 shadow-[0_3px_0_rgba(30,64,175,.14)] active:translate-y-1 disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {skipNextNumberLabel(lang)}
            </button>
            <LessonNextButton label={number === 9 && step === 4 ? t.practice : t.next} onClick={next} />
          </div>
        </div>
      </LessonShell>
    </main>
  );
}

function NumberValuesLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0);
  const [practice, setPractice] = useState(false);
  const examples = NUMBERS.map((n) => ({
    n,
    emoji: "🍌",
    text: n === 0
      ? (lang === "en" ? "0 is nothing. The basket is empty." : "0 ialah kosong. Bakul tiada pisang.")
      : (lang === "en" ? `This is ${n} bananas.` : `Ini ${n} pisang.`),
  }));
  const current = examples[step];
  const conceptSlides = [
    {
      text: lang === "en" ? "Different objects. Same number." : "Objek berbeza. Nombor sama.",
      visual: <SameValueVisual count={3} emojis={["🍌", "🍃", "🪨"]} lang={lang} />,
    },
    {
      text: lang === "en" ? "They look different. They are all 6." : "Rupa berbeza. Semua ialah 6.",
      visual: <LayoutValueVisual count={6} emoji="🍌" lang={lang} />,
    },
    {
      text: lang === "en" ? "4 is less. 6 is more." : "4 lebih sedikit. 6 lebih banyak.",
      visual: <CompareGroupsVisual a={4} b={6} emojiA="🍃" emojiB="🍌" lang={lang} showReason />,
    },
  ];
  const inConcept = step >= examples.length;
  const currentNumber = Math.min(current?.n ?? 9, 9);
  const currentEmoji = "🍌";
  const concept = conceptSlides[step - examples.length];
  const lessonText = inConcept ? concept.text : getNumberValueLessonText(currentNumber, phase, lang);
  const maxPhase = inConcept ? 0 : getNumberValueMaxPhase(currentNumber);

  const next = () => {
    if (!inConcept && phase < maxPhase) {
      setPhase((p) => p + 1);
      return;
    }
    if (step < examples.length + conceptSlides.length - 1) {
      setStep((s) => s + 1);
      setPhase(0);
    } else {
      setPractice(true);
    }
  };

  const skipNextNumber = () => {
    if (inConcept || currentNumber >= 9) {
      setPractice(true);
      return;
    }
    setStep(currentNumber + 1);
    setPhase(0);
  };

  const previous = () => {
    if (!inConcept && phase > 0) {
      setPhase((p) => p - 1);
      return;
    }
    if (step > 0) {
      const nextStep = step - 1;
      setStep(nextStep);
      const previousNumber = Math.min(examples[nextStep]?.n ?? 9, 9);
      setPhase(nextStep < examples.length ? getNumberValueMaxPhase(previousNumber) : 0);
    }
  };

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.numberValues}: ${t.practice}`} questions={valuePracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell lang={lang} title={t.numberValues} helper={lang === "en" ? "A number tells us how many." : "Nombor memberitahu berapa banyak."}>
        <div className="grid gap-4">
          <CharacterTalk lang={lang} text={lessonText} />
          <div className="rounded-[2rem] border-4 border-white bg-white p-5 text-center shadow-[0_7px_0_rgba(0,0,0,.12)]">
            {inConcept ? concept.visual : <NumberValueStepVisual n={currentNumber} emoji={currentEmoji} phase={phase} lang={lang} />}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button disabled={step === 0 && phase === 0} onClick={previous} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            <SecondaryLessonButton
              label={!inConcept && currentNumber < 9 ? skipNextNumberLabel(lang) : skipPracticeLabel(lang)}
              onClick={skipNextNumber}
            />
            <LessonNextButton
              label={step < examples.length + conceptSlides.length - 1 || (!inConcept && phase < maxPhase) ? t.next : t.practice}
              onClick={next}
            />
          </div>
        </div>
      </LessonShell>
    </main>
  );
}

function getNumberValueLessonText(n: number, phase: number, lang: Lang) {
  if (lang === "ms") {
    if (n === 0) {
      return phase === 0
        ? "Lihat bakul.\nTiada pisang."
        : "0 maksudnya tiada.\nJadi, ada 0 pisang.";
    }
    if (phase === 0) return `Ini ${n}.`;
    if (phase === 1) return `Ini ${n} pisang. Kira setiap pisang.`;
    if (phase === 2) return `Objek berbeza. Nombor sama, ${n}.`;
    return `Susunan berbeza. Masih ${n}.`;
  }
  if (n === 0) {
    return phase === 0
      ? "Look at the basket.\nThere are no bananas."
      : "0 means none.\nSo, there are 0 bananas.";
  }
  if (phase === 0) return `This is ${n}.`;
  if (phase === 1) return `This is ${n} ${n === 1 ? "banana" : "bananas"}. Count each banana.`;
  if (phase === 2) return `Different objects. Same number, ${n}.`;
  return `Different arrangement. Still ${n}.`;
}

function getNumberValueMaxPhase(n: number) {
  if (n === 0) return 1;
  return 2;
}

function NumberValueStepVisual({ n, emoji, phase, lang }: { n: number; emoji: string; phase: number; lang: Lang }) {
  const [counting, setCounting] = useState(false);
  const [singleCountValue, setSingleCountValue] = useState(0);
  const [singleCountComplete, setSingleCountComplete] = useState(false);
  const [singleCountAudioActive, setSingleCountAudioActive] = useState(false);
  const [pairedCount, setPairedCount] = useState(0);
  const [pairedCountAudioActive, setPairedCountAudioActive] = useState(false);
  const [pairedTotalStage, setPairedTotalStage] = useState<0 | 1 | 2>(0);
  const [countRun, setCountRun] = useState(0);
  const [comparisonEmojiA, comparisonEmojiB] = VALUE_COMPARISON_PAIRS[(Math.max(1, n) - 1) % VALUE_COMPARISON_PAIRS.length];

  useEffect(() => {
    setCounting(false);
    setSingleCountValue(0);
    setSingleCountComplete(false);
    setSingleCountAudioActive(false);
    setPairedCount(0);
    setPairedCountAudioActive(false);
    setPairedTotalStage(0);
    setCountRun(0);
  }, [n, emoji, phase]);

  if (n === 0) {
    return (
      <div className="space-y-4">
        {phase === 1 && <NumberTile value={0} lang={lang} large showWord={false} />}
        <ContainerScene count={0} emoji="🍌" container="basket" hideEmptyLabel />
      </div>
    );
  }

  if (phase === 0) {
    return <NumberTile value={n} lang={lang} large showWord={false} />;
  }
  if (phase === 1) {
    const objectLabel = valueObjectLabel(n, emoji, lang);
    const totalText = lang === "en"
      ? `Total: ${objectLabel}`
      : `Jumlah: ${objectLabel}`;
    return (
      <div className="space-y-3">
        <NumberTile value={n} lang={lang} showWord={false} />
        <div className={`rounded-3xl border-4 p-4 transition-colors duration-300 ${singleCountComplete ? "border-emerald-100 bg-emerald-50" : "border-slate-100 bg-white"}`}>
          {singleCountValue > 0
            ? <CountedObjectRow
                key={`${n}-${emoji}-count-on`}
                count={n}
                emoji={emoji}
                showCount
                visibleCount={singleCountValue}
                highlightActiveCount={singleCountAudioActive}
                lang={lang}
                intervalMs={COUNTING_STEP_MS}
              />
            : <ObjectGroup count={n} emoji={emoji} lang={lang} />}
        </div>
        <button
          onClick={async () => {
            if (counting) return;
            setCounting(true);
            setSingleCountValue(0);
            setSingleCountComplete(false);
            setSingleCountAudioActive(false);
            await playWholeNumberValueCount(n, lang, setSingleCountValue, setSingleCountAudioActive);
            await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
            setSingleCountComplete(true);
            await speakRecordedBananaTotal(n, lang, BANANA);
            setCounting(false);
          }}
          disabled={counting}
          className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1"
        >
          {singleCountComplete
              ? (lang === "en" ? "Count again" : "Kira lagi")
              : (lang === "en" ? `Count ${n} ${objectName(emoji, n, lang)}` : `Kira ${n} ${objectName(emoji, n, lang)}`)}
          <span
            className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md"
            aria-hidden="true"
          >
            <PointerIcon />
          </span>
        </button>
        {singleCountComplete && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xl font-black text-emerald-900" aria-live="polite">
            {totalText}
          </p>
        )}
      </div>
    );
  }
  if (phase === 2) {
    const firstGroupCount = Math.min(pairedCount, n);
    const secondGroupCount = Math.max(0, pairedCount - n);
    const comparisonComplete = pairedTotalStage === 2;
    const countingFirstGroup = pairedCount < n;
    const activeEmoji = countingFirstGroup ? comparisonEmojiA : comparisonEmojiB;
    const firstValueLabel = valueObjectLabel(n, comparisonEmojiA, lang);
    const secondValueLabel = valueObjectLabel(n, comparisonEmojiB, lang);
    const activeObjectName = objectName(activeEmoji, n, lang);
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={async () => {
            if (counting) return;
            setCounting(true);
            if (comparisonComplete) {
              setPairedCount(0);
              setPairedTotalStage(0);
              setPairedCountAudioActive(false);
            }
            const completedStage = pairedTotalStage === 1 && !comparisonComplete ? 2 : 1;
            const baseCount = completedStage === 1 ? 0 : n;
            const completedEmoji = completedStage === 1 ? comparisonEmojiA : comparisonEmojiB;
            await playWholeNumberValueCount(
              n,
              lang,
              (value) => setPairedCount(baseCount + value),
              setPairedCountAudioActive,
            );
            await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
            setPairedTotalStage(completedStage);
            await speakRecordedBananaTotal(n, lang, completedEmoji);
            setCounting(false);
          }}
          disabled={counting}
          className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1"
        >
          {comparisonComplete
            ? (lang === "en" ? "Count again" : "Kira lagi")
            : lang === "en"
              ? `Count ${n} ${activeObjectName}`
              : `Kira ${n} ${activeObjectName}`}
          <span
            className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md"
            aria-hidden="true"
          >
            <PointerIcon />
          </span>
        </button>
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledValueGroup
            key={`${n}-${comparisonEmojiA}-${countRun}`}
            label={lang === "en" ? `Total: ${firstValueLabel}` : `Jumlah: ${firstValueLabel}`}
            count={n}
            emoji={comparisonEmojiA}
            counted={firstGroupCount > 0}
            visibleCount={firstGroupCount}
            showLabel={pairedTotalStage >= 1}
            delayTotalLabel={false}
            active={pairedCountAudioActive && firstGroupCount > 0 && firstGroupCount <= n && pairedTotalStage === 0}
            complete={pairedTotalStage >= 1}
            lang={lang}
          />
          <div
            className={`transition duration-300 ${pairedTotalStage < 1 ? "pointer-events-none grayscale opacity-35" : ""}`}
            aria-disabled={pairedTotalStage < 1}
          >
            <LabeledValueGroup
              label={lang === "en" ? `Total: ${secondValueLabel}` : `Jumlah: ${secondValueLabel}`}
              count={n}
              emoji={comparisonEmojiB}
              counted={secondGroupCount > 0}
              visibleCount={secondGroupCount}
              showLabel={pairedTotalStage >= 2}
              delayTotalLabel={false}
              active={pairedCountAudioActive && secondGroupCount > 0 && pairedTotalStage === 1}
              complete={pairedTotalStage >= 2}
              lang={lang}
            />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <NumberTile value={n} lang={lang} showWord={false} />
      <CountedObjectRow key={`${n}-${emoji}-total`} count={n} emoji={emoji} showCount lang={lang} intervalMs={500} />
      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xl font-black text-emerald-900">
        {lang === "en" ? `There are ${n}.` : `Ada ${n}.`}
      </p>
    </div>
  );
}

function valueObjectLabel(count: number, emoji: string, lang: Lang) {
  return `${count} ${objectName(emoji, count, lang)}`;
}

function ZeroContainerCard({ label, container, lang }: { label: string; container: ContainerKind; lang: Lang }) {
  return (
    <div className="rounded-3xl border-2 border-sky-100 bg-sky-50 p-4 text-center">
      <p className="mb-3 text-xl font-black text-blue-950">{label}</p>
      <ContainerScene count={0} emoji="🍌" container={container} numbered />
      <p className="mt-3 rounded-2xl bg-white px-3 py-2 font-black text-slate-600">
        {lang === "en" ? "0 means none." : "0 maksudnya tiada."}
      </p>
    </div>
  );
}

function LabeledValueGroup({ label, count, emoji, counted, speakCount = false, visibleCount, onCountProgress, showLabel = true, delayTotalLabel = true, slowLabelReveal = false, active = false, complete = false, cyber = false, fixedColumns, largeTiles = false, lang }: {
  label: string;
  count: number;
  emoji: string;
  counted: boolean;
  speakCount?: boolean;
  visibleCount?: number;
  onCountProgress?: (value: number) => void;
  showLabel?: boolean;
  delayTotalLabel?: boolean;
  slowLabelReveal?: boolean;
  active?: boolean;
  complete?: boolean;
  cyber?: boolean;
  fixedColumns?: number;
  largeTiles?: boolean;
  lang: Lang;
}) {
  const isTotalLabel = label.startsWith("Total:") || label.startsWith("Jumlah:");
  const delayedTotalLabelVisible = useDelayedTotalVisibility(showLabel && isTotalLabel, label);
  const labelVisible = showLabel && (!isTotalLabel || !delayTotalLabel || delayedTotalLabelVisible);

  return (
    <div className={`rounded-3xl border-4 p-4 text-center transition-[border-color,background-color,box-shadow] duration-300 ${
      active
        ? cyber
          ? "border-cyan-400 bg-cyan-950 shadow-[0_6px_0_#164e63]"
          : "border-blue-400 bg-blue-50 shadow-[0_6px_0_rgba(37,99,235,.18)]"
        : cyber
          ? "border-cyan-400 bg-slate-900/90 shadow-[0_6px_0_#164e63]"
          : "border-emerald-100 bg-emerald-50"
    }`}>
      {counted ? (
        <CountedObjectRow
          count={count}
          emoji={emoji}
          showCount
          compact
          speakCount={speakCount}
          visibleCount={visibleCount}
          onCountProgress={onCountProgress}
          highlightActiveCount={active}
          cyber={cyber}
          fixedColumns={fixedColumns}
          largeTiles={largeTiles}
          lang={lang}
        />
      ) : <ObjectGroup count={count} emoji={emoji} lang={lang} />}
      <p
        className={`mt-3 min-h-7 rounded-2xl px-3 py-2 text-xl font-black transition-opacity ease-out ${slowLabelReveal ? "duration-700" : "duration-200"} ${labelVisible ? (cyber ? "bg-cyan-950 text-cyan-50 opacity-100" : "bg-white text-emerald-950 opacity-100") : "opacity-0"}`}
        aria-live="polite"
      >
        {labelVisible ? label : "\u00a0"}
      </p>
    </div>
  );
}

function SequencingLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [practice, setPractice] = useState(false);
  const slides = [
    {
      title: lang === "en" ? "Full number line" : "Garis nombor penuh",
      text: lang === "en" ? "Numbers go from 0 to 9." : "Nombor dari 0 hingga 9.",
      visual: <NumberLineSequence nums={NUMBERS} marked={-1} arrow="right" />,
    },
    {
      title: lang === "en" ? "Ascending: Going Up" : "Menaik: Nombor Naik",
      text: lang === "en" ? "Ascending means numbers go up." : "Menaik maksudnya nombor naik.",
      visual: <SequencingExample lang={lang} />,
    },
    {
      title: lang === "en" ? "Numbers get bigger" : "Nombor makin besar",
      text: lang === "en" ? "Tap to see more." : "Tekan untuk lihat lebih banyak.",
      visual: <TapRevealOrder nums={[1, 2, 3, 4]} lang={lang} mode="up" />,
    },
    {
      title: lang === "en" ? "Descending: Going Down" : "Menurun: Nombor Turun",
      text: lang === "en" ? "Descending means numbers go down." : "Menurun maksudnya nombor turun.",
      visual: <NumberLineSequence nums={[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} marked={-1} arrow="right" />,
    },
    {
      title: lang === "en" ? "Numbers get smaller" : "Nombor makin kecil",
      text: lang === "en" ? "Tap to see less." : "Tekan untuk lihat lebih sedikit.",
      visual: <TapRevealOrder nums={[4, 3, 2, 1]} lang={lang} mode="down" />,
    },
    {
      title: lang === "en" ? "Number Order" : "Susunan Nombor",
      text: lang === "en" ? "Numbers follow an order." : "Nombor ada susunan.",
      visual: <TapRevealSequence lang={lang} />,
    },
    {
      title: lang === "en" ? "Missing numbers" : "Nombor hilang",
      text: lang === "en" ? "What number is ?" : "Apakah nombor ?",
      visual: <MissingNumberTeaching key="missing-full-up" lang={lang} nums={[0, 1, 2, "?", 4, 5, 6, 7, 8, 9]} answer={3} />,
    },
    {
      title: lang === "en" ? "Missing number: count down" : "Nombor hilang: kira turun",
      text: lang === "en" ? "What number is ?" : "Apakah nombor ?",
      visual: <MissingNumberTeaching key="missing-full-down" lang={lang} nums={[9, 8, "?", 6, 5, 4, 3, 2, 1, 0]} answer={7} />,
    },
    {
      title: lang === "en" ? "Short count-up example" : "Contoh pendek kira naik",
      text: lang === "en" ? "What number is ?" : "Apakah nombor ?",
      visual: <MissingNumberTeaching key="missing-short-up" lang={lang} nums={[5, 6, "?", 8]} answer={7} />,
    },
    {
      title: lang === "en" ? "Short count-down example" : "Contoh pendek kira turun",
      text: lang === "en" ? "What number is ?" : "Apakah nombor ?",
      visual: <MissingNumberTeaching key="missing-short-down" lang={lang} nums={[9, 8, "?", 6]} answer={7} />,
    },
  ];
  const current = slides[step];

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.sequencing}: ${t.practice}`} questions={sequencingPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl pb-8">
      <LessonShell lang={lang} title={t.sequencing} helper={lang === "en" ? "Learn one step at a time." : "Belajar satu langkah demi satu langkah."}>
        <div className="rounded-[2rem] border-4 border-white bg-white p-5 shadow-[0_7px_0_rgba(0,0,0,.12)]">
          <p className="mb-2 text-center text-sm font-black text-blue-700">{current.title}</p>
          <CharacterTalk lang={lang} text={current.text} />
          <div className="mt-4">{current.visual}</div>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            <LessonNextButton
              label={step < slides.length - 1 ? t.next : t.practice}
              onClick={() => step < slides.length - 1 ? setStep((s) => s + 1) : setPractice(true)}
            />
          </div>
        </div>
      </LessonShell>
    </main>
  );
}

type NewGroupingActivity =
  | { kind: "observe"; count: number; emoji: string }
  | { kind: "makeOne"; target: number; emoji: string }
  | { kind: "makeTwo"; a: number; b: number; emoji: string }
  | { kind: "makeThree"; a: number; b: number; c: number; emoji: string };

const GROUPING_LESSON_STEPS: NewGroupingActivity[] = [
  { kind: "observe", count: 3, emoji: "🍌" },
  { kind: "makeOne", target: 0, emoji: "🍌" },
  { kind: "makeOne", target: 4, emoji: "🍌" },
  { kind: "makeOne", target: 7, emoji: "🍌" },
  { kind: "makeOne", target: 9, emoji: "🍌" },
  { kind: "makeTwo", a: 2, b: 3, emoji: "🍌" },
  { kind: "makeTwo", a: 0, b: 8, emoji: "🍌" },
  { kind: "makeTwo", a: 6, b: 5, emoji: "🍌" },
  { kind: "makeThree", a: 1, b: 4, c: 7, emoji: "🍌" },
  { kind: "makeThree", a: 2, b: 6, c: 9, emoji: "🍌" },
];

const fullGroupingPracticeQuestions: Question[] = [
  q("group-practice-count-1", "numbers", { en: "Count Group 1 and Group 2 separately. How many bananas are in each group? Choose the answer in Group 1, Group 2 order.", ms: "Kira Kumpulan 1 dan Kumpulan 2 secara berasingan. Berapakah pisang dalam setiap kumpulan? Pilih jawapan mengikut urutan Kumpulan 1, Kumpulan 2." }, ["4, 7", "7, 4", "4, 6", "3, 7"], "4, 7", { kind: "groupTwo", emoji: "🍌", a: 4, b: 7 }),
  q("group-practice-count-2", "numbers", { en: "Count Group 1 and Group 2 separately. How many bananas are in each group? Choose the answer in Group 1, Group 2 order.", ms: "Kira Kumpulan 1 dan Kumpulan 2 secara berasingan. Berapakah pisang dalam setiap kumpulan? Pilih jawapan mengikut urutan Kumpulan 1, Kumpulan 2." }, ["3, 8", "8, 3", "3, 7", "4, 8"], "3, 8", { kind: "groupTwo", emoji: "🍌", a: 3, b: 8 }),
  q("group-practice-count-3", "numbers", { en: "Count Group 1 and Group 2 separately. How many bananas are in each group? Choose the answer in Group 1, Group 2 order.", ms: "Kira Kumpulan 1 dan Kumpulan 2 secara berasingan. Berapakah pisang dalam setiap kumpulan? Pilih jawapan mengikut urutan Kumpulan 1, Kumpulan 2." }, ["1, 5", "5, 1", "1, 4", "2, 5"], "1, 5", { kind: "groupTwo", emoji: "🍌", a: 1, b: 5 }),
  q("group-practice-count-4", "numbers", { en: "Count Group 1 and Group 2 separately. How many bananas are in each group? Choose the answer in Group 1, Group 2 order.", ms: "Kira Kumpulan 1 dan Kumpulan 2 secara berasingan. Berapakah pisang dalam setiap kumpulan? Pilih jawapan mengikut urutan Kumpulan 1, Kumpulan 2." }, ["9, 6", "6, 9", "9, 5", "8, 6"], "9, 6", { kind: "groupTwo", emoji: "🍌", a: 9, b: 6 }),
  q("group-practice-more-3-5", "numbers", { en: "Which banana group has more?", ms: "Kumpulan pisang manakah lebih banyak?" }, ["Group A", "Group B"], "Group B", { kind: "groupCompare", emoji: "🍌", a: 3, b: 5, ask: "more" }),
  q("group-practice-more-8-4", "numbers", { en: "Which banana group has more?", ms: "Kumpulan pisang manakah lebih banyak?" }, ["Group A", "Group B"], "Group A", { kind: "groupCompare", emoji: "🍌", a: 8, b: 4, ask: "more" }),
  q("group-practice-more-2-7", "numbers", { en: "Which banana group has more?", ms: "Kumpulan pisang manakah lebih banyak?" }, ["Group A", "Group B"], "Group B", { kind: "groupCompare", emoji: "🍌", a: 2, b: 7, ask: "more" }),
  q("group-practice-make-0", "numbers", { en: "Make a group of 0 bananas.", ms: "Bina kumpulan 0 pisang." }, [], 0, { kind: "groupMake", emoji: "🍌", count: 0 }, "makeGroup"),
  q("group-practice-make-5", "numbers", { en: "Make a group of 5 bananas.", ms: "Bina kumpulan 5 pisang." }, [], 5, { kind: "groupMake", emoji: "🍌", count: 5 }, "makeGroup"),
  q("group-practice-make-9", "numbers", { en: "Make a group of 9 bananas.", ms: "Bina kumpulan 9 pisang." }, [], 9, { kind: "groupMake", emoji: "🍌", count: 9 }, "makeGroup"),
  q("group-practice-build-two-2-7", "numbers", { en: "Make Group 1 with 2 bananas and Group 2 with 7 bananas.", ms: "Bina Kumpulan 1 dengan 2 pisang dan Kumpulan 2 dengan 7 pisang." }, [], "2,7", { kind: "groupBuildMany", emoji: "🍌", counts: [2, 7] }, "makeGroups"),
  q("group-practice-build-two-4-8", "numbers", { en: "Make two separate groups: 4 bananas and 8 bananas.", ms: "Bina dua kumpulan berasingan: 4 pisang dan 8 pisang." }, [], "4,8", { kind: "groupBuildMany", emoji: "🍌", counts: [4, 8] }, "makeGroups"),
  q("group-practice-build-three-1-3-6", "numbers", { en: "Make 3 separate groups with 1, 3, and 6 bananas.", ms: "Bina 3 kumpulan berasingan dengan 1, 3, dan 6 pisang." }, [], "1,3,6", { kind: "groupBuildMany", emoji: "🍌", counts: [1, 3, 6] }, "makeGroups"),
  q("group-practice-build-three-0-4-9", "numbers", { en: "Make 3 separate groups with 0, 4, and 9 bananas.", ms: "Bina 3 kumpulan berasingan dengan 0, 4, dan 9 pisang." }, [], "0,4,9", { kind: "groupBuildMany", emoji: "🍌", counts: [0, 4, 9] }, "makeGroups"),
  q("group-practice-build-three-2-5-8", "numbers", { en: "Make 3 separate groups with 2, 5, and 8 bananas.", ms: "Bina 3 kumpulan berasingan dengan 2, 5, dan 8 pisang." }, [], "2,5,8", { kind: "groupBuildMany", emoji: "🍌", counts: [2, 5, 8] }, "makeGroups"),
];

function GroupingMode({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [groupA, setGroupA] = useState(0);
  const [groupB, setGroupB] = useState(0);
  const [groupC, setGroupC] = useState(0);
  const [checked, setChecked] = useState(false);
  const [practice, setPractice] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const activity = GROUPING_LESSON_STEPS[activityIndex];
  const maxStep = getNewGroupingMaxStep(activity);
  const activeTarget = getActiveGroupingTarget(activity, step);
  const activeCount = getActiveGroupingCount(activity, step, groupA, groupB, groupC);
  const canEdit = activeTarget !== null;
  const correct = activeTarget !== null && activeCount === activeTarget;
  const instruction = getNewGroupingInstruction(activity, step, lang);

  const resetTo = (nextIndex: number) => {
    setActivityIndex(nextIndex);
    setStep(0);
    setGroupA(0);
    setGroupB(0);
    setGroupC(0);
    setChecked(false);
  };

  const addObject = () => {
    if (!canEdit) return;
    setChecked(false);
    if ((activity.kind === "makeTwo" || activity.kind === "makeThree") && step === 2) setGroupB((count) => Math.min(9, count + 1));
    else if (activity.kind === "makeThree" && step === 4) setGroupC((count) => Math.min(9, count + 1));
    else setGroupA((count) => Math.min(9, count + 1));
  };

  const removeObject = () => {
    if (!canEdit) return;
    setChecked(false);
    if ((activity.kind === "makeTwo" || activity.kind === "makeThree") && step === 2) setGroupB((count) => Math.max(0, count - 1));
    else if (activity.kind === "makeThree" && step === 4) setGroupC((count) => Math.max(0, count - 1));
    else setGroupA((count) => Math.max(0, count - 1));
  };

  const retryGroup = () => {
    setChecked(false);
    if ((activity.kind === "makeTwo" || activity.kind === "makeThree") && step === 2) setGroupB(0);
    else if (activity.kind === "makeThree" && step === 4) setGroupC(0);
    else setGroupA(0);
  };

  const checkGroup = () => {
    setChecked(true);
    if (correct) {
      setCelebrationKey((current) => current + 1);
      setStep((current) => Math.min(maxStep, current + 1));
    }
  };

  const next = () => {
    setChecked(false);
    if (step < maxStep) {
      setStep((current) => current + 1);
      return;
    }
    if (activityIndex < GROUPING_LESSON_STEPS.length - 1) resetTo(activityIndex + 1);
    else setPractice(true);
  };

  const previous = () => {
    setChecked(false);
    if (step > 0) {
      setStep((current) => current - 1);
      return;
    }
    if (activityIndex > 0) resetTo(activityIndex - 1);
  };

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.groupingMode}: ${t.practice}`} questions={fullGroupingPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl pb-8">
      {celebrationKey > 0 && <CorrectCelebration key={celebrationKey} playSound={false} />}
      <LessonShell
        lang={lang}
        title={t.groupingMode}
        helper={lang === "en" ? "Make groups. Count each group separately." : "Bina kumpulan. Kira setiap kumpulan secara berasingan."}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
          <img src={chrysHappy} alt="Chrys" className="mx-auto h-28 w-28 object-contain" />
          <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 shadow-[0_5px_0_rgba(6,95,70,.12)]">
            <p className="text-2xl font-black leading-snug text-emerald-950">
              <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">{instruction}</span>
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-900/70">
              {lang === "en" ? `Step ${activityIndex + 1} of ${GROUPING_LESSON_STEPS.length}` : `Langkah ${activityIndex + 1} daripada ${GROUPING_LESSON_STEPS.length}`}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border-4 border-white bg-[linear-gradient(180deg,#e8fff2_0%,#f7ffe8_58%,#d6f2a2_100%)] p-4 shadow-inner">
          <NewGroupingLessonVisual activity={activity} step={step} groupA={groupA} groupB={groupB} groupC={groupC} lang={lang} />
        </div>

        {canEdit && (
          <div className="mt-5 rounded-3xl border-2 border-amber-100 bg-white p-4">
            <p className="mb-3 text-center text-lg font-black text-slate-700">
              {lang === "en" ? `Tap bananas to make ${activeTarget}.` : `Tekan pisang untuk bina ${activeTarget}.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={addObject}
                aria-label={lang === "en" ? "Add one banana" : "Tambah satu pisang"}
                className="relative grid h-20 w-20 place-items-center rounded-3xl border-2 border-yellow-300 bg-yellow-50 shadow-[0_5px_0_rgba(180,83,9,.25)] active:translate-y-1"
              >
                <SpriteIcon value={activity.emoji} className="h-14 w-14" />
                <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                  <PointerIcon />
                </span>
              </button>
              <button onClick={removeObject} className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-5 py-3 font-black text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.14)] active:translate-y-1">
                {lang === "en" ? "Remove one" : "Ambil satu"}
              </button>
              <button onClick={checkGroup} className="rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#065f46] active:translate-y-1">
                {lang === "en" ? "Check group" : "Semak kumpulan"}
              </button>
            </div>
            {checked && (
              <div className={`mt-4 rounded-3xl border-2 p-4 text-center ${correct ? "border-emerald-200 bg-emerald-50" : "border-yellow-200 bg-yellow-50"}`}>
                <p className={`text-xl font-black ${correct ? "text-emerald-800" : "text-orange-700"}`}>
                  {correct ? (lang === "en" ? "Great job." : "Bagus.") : (lang === "en" ? "Good try. Let's count again." : "Cubaan baik. Mari kira lagi.")}
                </p>
                <CountedObjectRow count={activeCount} emoji={activity.emoji} showCount compact speakCount lang={lang} />
                {!correct && (
                  <button
                    type="button"
                    onClick={retryGroup}
                    className="mt-4 rounded-2xl border-2 border-orange-300 bg-white px-6 py-3 font-black text-orange-700 shadow-[0_5px_0_rgba(194,65,12,.18)] active:translate-y-1"
                  >
                    {lang === "en" ? "Try again" : "Cuba lagi"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button
            disabled={activityIndex === 0 && step === 0}
            onClick={previous}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40"
          >
            {t.previous}
          </button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            {!canEdit && (
              <LessonNextButton
                label={step < maxStep || activityIndex < GROUPING_LESSON_STEPS.length - 1 ? t.next : t.practice}
                onClick={next}
              />
            )}
          </div>
        </div>
      </LessonShell>
    </main>
  );
}

function getNewGroupingMaxStep(activity: NewGroupingActivity) {
  if (activity.kind === "observe") return 2;
  if (activity.kind === "makeOne") return 1;
  if (activity.kind === "makeTwo") return 4;
  return 6;
}

function getActiveGroupingTarget(activity: NewGroupingActivity, step: number) {
  if (activity.kind === "makeOne" && step === 0) return activity.target;
  if (activity.kind === "makeTwo" && step === 0) return activity.a;
  if (activity.kind === "makeTwo" && step === 2) return activity.b;
  if (activity.kind === "makeThree" && step === 0) return activity.a;
  if (activity.kind === "makeThree" && step === 2) return activity.b;
  if (activity.kind === "makeThree" && step === 4) return activity.c;
  return null;
}

function getActiveGroupingCount(activity: NewGroupingActivity, step: number, groupA: number, groupB: number, groupC: number) {
  if ((activity.kind === "makeTwo" || activity.kind === "makeThree") && step === 2) return groupB;
  if (activity.kind === "makeThree" && step === 4) return groupC;
  return groupA;
}

function getNewGroupingInstruction(activity: NewGroupingActivity, step: number, lang: Lang) {
  if (activity.kind === "observe") {
    if (step === 0) return lang === "en" ? "This is a group." : "Ini satu kumpulan.";
    if (step === 1) return lang === "en" ? "Count this group." : "Kira kumpulan ini.";
    return lang === "en" ? `${activity.count} bananas are in this group.` : `${activity.count} pisang dalam kumpulan ini.`;
  }
  if (activity.kind === "makeOne") {
    if (step === 0) return lang === "en" ? `Make a group of ${activity.target} ${objectName(activity.emoji, activity.target, "en")}.` : `Bina kumpulan ${activity.target} ${objectName(activity.emoji, activity.target, "ms")}.`;
    return lang === "en" ? `This group has ${activity.target} ${objectName(activity.emoji, activity.target, "en")}.` : `Kumpulan ini ada ${activity.target} ${objectName(activity.emoji, activity.target, "ms")}.`;
  }
  if (activity.kind === "makeTwo") {
    if (step === 0) return lang === "en"
      ? `Make Group 1 with ${activity.a} ${objectName(activity.emoji, activity.a, "en")}. Group 2 will have ${activity.b} ${objectName(activity.emoji, activity.b, "en")}.`
      : `Bina Kumpulan 1 dengan ${activity.a} ${objectName(activity.emoji, activity.a, "ms")}. Kumpulan 2 akan ada ${activity.b} ${objectName(activity.emoji, activity.b, "ms")}.`;
    if (step === 1) return lang === "en" ? `Count the ${activity.a} ${objectName(activity.emoji, activity.a, "en")} in Group 1.` : `Kira ${activity.a} ${objectName(activity.emoji, activity.a, "ms")} dalam Kumpulan 1.`;
    if (step === 2) return lang === "en"
      ? `Group 1 has ${activity.a} ${objectName(activity.emoji, activity.a, "en")}. Now make Group 2 with ${activity.b} ${objectName(activity.emoji, activity.b, "en")}.`
      : `Kumpulan 1 ada ${activity.a} ${objectName(activity.emoji, activity.a, "ms")}. Sekarang bina Kumpulan 2 dengan ${activity.b} ${objectName(activity.emoji, activity.b, "ms")}.`;
    if (step === 3) return lang === "en" ? `Count the ${activity.b} ${objectName(activity.emoji, activity.b, "en")} in Group 2.` : `Kira ${activity.b} ${objectName(activity.emoji, activity.b, "ms")} dalam Kumpulan 2.`;
    return lang === "en" ? `Group 1 has ${activity.a} ${objectName(activity.emoji, activity.a, "en")}. Group 2 has ${activity.b} ${objectName(activity.emoji, activity.b, "en")}.` : `Kumpulan 1 ada ${activity.a} ${objectName(activity.emoji, activity.a, "ms")}. Kumpulan 2 ada ${activity.b} ${objectName(activity.emoji, activity.b, "ms")}.`;
  }
  if (activity.kind === "makeThree") {
    if (step === 0) return lang === "en"
      ? `Make Group 1 with ${activity.a} ${objectName(activity.emoji, activity.a, "en")}. Then you will make Groups 2 and 3.`
      : `Bina Kumpulan 1 dengan ${activity.a} ${objectName(activity.emoji, activity.a, "ms")}. Kemudian bina Kumpulan 2 dan 3.`;
    if (step === 1) return lang === "en" ? "Count Group 1." : "Kira Kumpulan 1.";
    if (step === 2) return lang === "en"
      ? `Now make Group 2 with ${activity.b} ${objectName(activity.emoji, activity.b, "en")}.`
      : `Sekarang bina Kumpulan 2 dengan ${activity.b} ${objectName(activity.emoji, activity.b, "ms")}.`;
    if (step === 3) return lang === "en" ? "Count Group 2." : "Kira Kumpulan 2.";
    if (step === 4) return lang === "en"
      ? `Now make Group 3 with ${activity.c} ${objectName(activity.emoji, activity.c, "en")}.`
      : `Sekarang bina Kumpulan 3 dengan ${activity.c} ${objectName(activity.emoji, activity.c, "ms")}.`;
    if (step === 5) return lang === "en" ? "Count Group 3." : "Kira Kumpulan 3.";
    return lang === "en"
      ? `You made 3 groups: ${activity.a}, ${activity.b}, and ${activity.c} ${objectName(activity.emoji, activity.c, "en")}.`
      : `Anda membina 3 kumpulan: ${activity.a}, ${activity.b}, dan ${activity.c} ${objectName(activity.emoji, activity.c, "ms")}.`;
  }
  return "";
}

function NewGroupingLessonVisual({ activity, step, groupA, groupB, groupC, lang }: { activity: NewGroupingActivity; step: number; groupA: number; groupB: number; groupC: number; lang: Lang }) {
  if (activity.kind === "observe") {
    return (
      <div className="space-y-4">
        <GroupingTray count={activity.count} emoji={activity.emoji} counted={step >= 1} announceTotal lang={lang} />
        {step === 2 && <GroupingAnswerLine text={lang === "en" ? `${activity.count} bananas are in this group.` : `${activity.count} pisang dalam kumpulan ini.`} />}
      </div>
    );
  }
  if (activity.kind === "makeOne") {
    return (
      <div className="space-y-4">
        <GroupingTray label={lang === "en" ? "Group box" : "Kotak kumpulan"} count={step >= 1 ? activity.target : groupA} emoji={activity.emoji} counted={step >= 1} active={step === 0} announceTotal lang={lang} />
        {step >= 1 && <GroupingAnswerLine text={lang === "en" ? `This group has ${activity.target} ${objectName(activity.emoji, activity.target, "en")}.` : `Kumpulan ini ada ${activity.target} ${objectName(activity.emoji, activity.target, "ms")}.`} />}
      </div>
    );
  }
  if (activity.kind === "makeTwo") {
    const groupOneLabel = lang === "en"
      ? `Group 1: ${activity.a} ${objectName(activity.emoji, activity.a, "en")}`
      : `Kumpulan 1: ${activity.a} ${objectName(activity.emoji, activity.a, "ms")}`;
    const groupTwoLabel = lang === "en"
      ? `Group 2: ${activity.b} ${objectName(activity.emoji, activity.b, "en")}`
      : `Kumpulan 2: ${activity.b} ${objectName(activity.emoji, activity.b, "ms")}`;
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <GroupingTray label={groupOneLabel} count={step >= 1 ? activity.a : groupA} emoji={activity.emoji} counted={step >= 1} active={step === 0} announceTotal lang={lang} />
          <GroupingTray label={groupTwoLabel} count={step >= 3 ? activity.b : groupB} emoji={activity.emoji} counted={step >= 3} active={step === 2} announceTotal lang={lang} />
        </div>
        {step >= 4 && <GroupingAnswerLine text={lang === "en" ? `Each group has its own number.` : `Setiap kumpulan ada nombor sendiri.`} />}
      </div>
    );
  }
  if (activity.kind === "makeThree") {
    const targets = [activity.a, activity.b, activity.c];
    const currentCounts = [groupA, groupB, groupC];
    const completedSteps = [1, 3, 5];
    const activeSteps = [0, 2, 4];
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {targets.map((target, index) => (
            <GroupingTray
              key={`group-${index + 1}`}
              label={lang === "en"
                ? `Group ${index + 1}: ${target} ${objectName(activity.emoji, target, "en")}`
                : `Kumpulan ${index + 1}: ${target} ${objectName(activity.emoji, target, "ms")}`}
              count={step >= completedSteps[index] ? target : currentCounts[index]}
              emoji={activity.emoji}
              counted={step >= completedSteps[index]}
              active={step === activeSteps[index]}
              announceTotal
              lang={lang}
            />
          ))}
        </div>
        {step >= 6 && <GroupingAnswerLine text={lang === "en" ? "Great work! You made 3 groups." : "Bagus! Anda membina 3 kumpulan."} />}
      </div>
    );
  }
  return null;
}

function GroupingTray({ label, count, emoji, counted, active = false, announceTotal = false, lang }: { label?: string; count: number; emoji: string; counted: boolean; active?: boolean; announceTotal?: boolean; lang: Lang }) {
  const [currentCount, setCurrentCount] = useState(0);
  const [countComplete, setCountComplete] = useState(false);
  const finishCounting = useCallback(() => {
    setCurrentCount(count);
    setCountComplete(true);
    if (announceTotal) void speakRecordedBananaTotal(count, lang, emoji);
  }, [announceTotal, count, emoji, lang]);

  useEffect(() => {
    setCurrentCount(0);
    setCountComplete(false);
  }, [count, counted, emoji, lang]);

  return (
    <div className={`mobile-grouping-tray rounded-[2rem] border-4 p-4 text-center transition-all ${active ? "border-yellow-400 bg-yellow-50 shadow-[0_7px_0_rgba(180,83,9,.22)]" : "border-emerald-200 bg-white"}`}>
      {label && <h3 className="mb-3 text-2xl font-black text-blue-950">{label}</h3>}
      {counted ? (
        <CountedObjectRow
          count={count}
          emoji={emoji}
          showCount
          compact
          speakCount
          lang={lang}
          intervalMs={COUNTING_STEP_MS}
          onCountProgress={setCurrentCount}
          onCountComplete={finishCounting}
        />
      ) : <ObjectGroup count={count} emoji={emoji} lang={lang} />}
      {counted && (
        <div className="min-h-16" aria-live="polite">
          {countComplete
            ? <CountTotalBadge count={count} lang={lang} unit={objectName(emoji, count, lang)} />
            : <p className="mt-3 rounded-full bg-blue-50 px-4 py-3 text-lg font-black text-blue-900">{lang === "en" ? `Counting: ${currentCount}` : `Mengira: ${currentCount}`}</p>}
        </div>
      )}
    </div>
  );
}

function SeparateGroupCountingVisual({ a, b, emoji, lang }: { a: number; b: number; emoji: string; lang: Lang }) {
  const [busy, setBusy] = useState(false);
  const audioRunRef = useRef(0);

  useEffect(() => {
    audioRunRef.current += 1;
    setBusy(false);
    stopNumberAudio();
    return () => {
      audioRunRef.current += 1;
      stopNumberAudio();
    };
  }, [a, b, emoji, lang]);

  const hearBothGroups = async () => {
    if (busy) return;
    const runId = audioRunRef.current + 1;
    audioRunRef.current = runId;
    setBusy(true);
    stopNumberAudio();

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await playRecordedVoiceFile(COUNT_PROMPT_AUDIO_FILES[lang]);
      if (audioRunRef.current !== runId) return;
      await wait(100);
      await speakCountingSequence(a, lang, COUNTING_STEP_MS);
      if (audioRunRef.current !== runId) return;
      await wait(180);
      await speakCountingSequence(b, lang, COUNTING_STEP_MS);
    }

    if (audioRunRef.current === runId) setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border-4 border-emerald-200 bg-white p-4 text-center">
          <h3 className="mb-3 text-2xl font-black text-blue-950">{lang === "en" ? "Group 1" : "Kumpulan 1"}</h3>
          <ObjectGroup count={a} emoji={emoji} lang={lang} maxPerRow={3} />
        </div>
        <div className="rounded-[2rem] border-4 border-emerald-200 bg-white p-4 text-center">
          <h3 className="mb-3 text-2xl font-black text-blue-950">{lang === "en" ? "Group 2" : "Kumpulan 2"}</h3>
          <ObjectGroup count={b} emoji={emoji} lang={lang} maxPerRow={3} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => void hearBothGroups()}
        disabled={busy}
        className="relative mx-auto block rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 text-lg font-black text-white shadow-[0_4px_0_#1e3a8a] active:translate-y-1 disabled:opacity-60"
      >
        {busy
          ? (lang === "en" ? "Playing the counting..." : "Memainkan kiraan...")
          : (lang === "en" ? "Hear both groups" : "Dengar kedua-dua kumpulan")}
        {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>}
      </button>
      <p className="text-center text-base font-bold text-slate-500">
        {lang === "en"
          ? "Listen and count each group separately. The labels and totals will appear after you answer."
          : "Dengar dan kira setiap kumpulan secara berasingan. Label dan jumlah akan muncul selepas anda menjawab."}
      </p>
    </div>
  );
}

function CountTotalBadge({ count, lang, unit }: { count: number; lang: Lang; unit?: string }) {
  const totalLabel = `${lang === "en" ? "Total" : "Jumlah"}: ${count}${unit ? ` ${unit}` : ""}`;
  const visible = useDelayedTotalVisibility(true, totalLabel);

  return (
    <div
      className={`mx-auto mt-3 flex min-h-14 w-fit items-center justify-center rounded-full border-2 px-5 py-3 text-center text-xl font-black transition-opacity duration-200 ${visible ? "border-emerald-200 bg-emerald-100 text-emerald-950 opacity-100 shadow-[0_4px_0_rgba(5,150,105,.16)]" : "border-transparent opacity-0"}`}
      aria-label={totalLabel}
      aria-hidden={!visible}
    >
      {visible ? totalLabel : "\u00a0"}
    </div>
  );
}

function GroupingAnswerLine({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center text-2xl font-black text-emerald-900">
      {text}
    </div>
  );
}

function AdditionOnlyLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState<"intro" | "sign" | "equals" | "story" | "practice">("intro");

  if (phase === "practice") {
    return <Quiz lang={lang} t={t} title={`${t.addition}: ${t.practice}`} questions={additionPracticeQuestions} randomize={false} visualOnlyOperationSolutions onFinish={() => onDone()} onBackToLearning={() => setPhase("intro")} />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl pb-8">
      <LessonShell lang={lang} title={t.addition}>
        {phase === "intro" && (
          <AdditionIntroStep
            title={t.addition}
            text={lang === "en" ? "Addition puts groups together." : "Tambah gabungkan kumpulan."}
            onPrevious={undefined}
            onNext={() => setPhase("sign")}
            onSkip={() => setPhase("practice")}
            t={t}
            lang={lang}
          />
        )}
        {phase === "sign" && (
          <SymbolIntro
            title={lang === "en" ? "The plus sign" : "Tanda tambah"}
            symbol="+"
            text={lang === "en" ? "The + sign means add more." : "Tanda + maksudnya tambah lagi."}
            onPrevious={() => setPhase("intro")}
            onNext={() => setPhase("equals")}
            onSkip={() => setPhase("practice")}
            t={t}
            lang={lang}
          />
        )}
        {phase === "equals" && (
          <SymbolIntro
            title={lang === "en" ? "The equals sign" : "Tanda sama dengan"}
            symbol="="
            text={lang === "en"
              ? "The = sign means the same amount on both sides."
              : "Tanda = maksudnya jumlah yang sama pada kedua-dua belah."}
            onPrevious={() => setPhase("sign")}
            onNext={() => setPhase("story")}
            onSkip={() => setPhase("practice")}
            t={t}
            lang={lang}
          />
        )}
        {phase === "story" && (
          <ChrysAdditionStory
            lang={lang}
            t={t}
            onPrev={() => setPhase("equals")}
            onDone={() => setPhase("practice")}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
      </LessonShell>
    </main>
  );
}

function SubtractionOnlyLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState<"intro" | "sign" | "story7" | "story9" | "story5" | "practice">("intro");

  if (phase === "practice") {
    return <Quiz lang={lang} t={t} title={`${t.subtraction}: ${t.practice}`} questions={subtractionPracticeQuestions} randomize={false} visualOnlyOperationSolutions onFinish={() => onDone()} onBackToLearning={() => setPhase("intro")} />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl pb-8">
      <LessonShell lang={lang} title={t.subtraction} helper={lang === "en" ? "Take away. Count what is left." : "Ambil. Kira yang tinggal."}>
        {phase === "intro" && (
          <AdditionIntroStep
            title={t.subtraction}
            text={lang === "en" ? "Subtraction takes away from one group." : "Tolak maksudnya ambil daripada satu kumpulan."}
            onPrevious={undefined}
            onNext={() => setPhase("sign")}
            onSkip={() => setPhase("practice")}
            t={t}
            lang={lang}
          />
        )}
        {phase === "sign" && (
          <SymbolIntro
            title={lang === "en" ? "The minus sign" : "Tanda tolak"}
            symbol="-"
            text={lang === "en" ? "The - sign means take away." : "Tanda - maksudnya tolak."}
            onPrevious={() => setPhase("intro")}
            onNext={() => setPhase("story7")}
            onSkip={() => setPhase("practice")}
            t={t}
            lang={lang}
          />
        )}
        {phase === "story7" && (
          <ChrysSubtractionStory
            lang={lang}
            t={t}
            start={7}
            takeAway={3}
            situation={{
              en: "Alyse is hungry. Chrys wants to share 3 bananas.",
              ms: "Alyse lapar. Chrys mahu berkongsi 3 pisang.",
            }}
            onPrev={() => setPhase("sign")}
            onDone={() => setPhase("story9")}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
        {phase === "story9" && (
          <ChrysSubtractionStory
            lang={lang}
            t={t}
            start={9}
            takeAway={7}
            situation={{
              en: "Alyse needs 7 bananas. Chrys has 9 bananas and wants to share 7.",
              ms: "Alyse memerlukan 7 pisang. Chrys ada 9 pisang dan mahu berkongsi 7.",
            }}
            onPrev={() => setPhase("story7")}
            onDone={() => setPhase("story5")}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
        {phase === "story5" && (
          <ChrysSubtractionStory
            lang={lang}
            t={t}
            start={5}
            takeAway={5}
            objectKind="butterflies"
            situation={{
              en: "Chrys sees 5 butterflies. All 5 butterflies fly away.",
              ms: "Chrys nampak 5 rama-rama. Kesemua 5 rama-rama terbang pergi.",
            }}
            onPrev={() => setPhase("story9")}
            onDone={() => setPhase("practice")}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
      </LessonShell>
    </main>
  );
}

type RealWorldTeachingIndex = 0 | 1;

function RealWorldLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState<RealWorldTeachingIndex | "practice">(0);

  if (phase === "practice") {
    return (
      <Quiz
        lang={lang}
        t={t}
        title={lang === "en" ? `${t.learnReal}: ${t.practice}` : `${t.learnReal}: ${t.practice}`}
        questions={realPracticeQuestions}
        randomize={false}
        visualOnlyOperationSolutions
        onFinish={() => onDone()}
        onBackToLearning={() => setPhase(0)}
      />
    );
  }

  const goNext = () => setPhase((current) => {
    if (current === "practice") return current;
    return current === 1 ? "practice" : ((current + 1) as RealWorldTeachingIndex);
  });
  const goPrevious = () => setPhase((current) => {
    if (current === "practice" || current === 0) return 0;
    return ((current - 1) as RealWorldTeachingIndex);
  });

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell
        lang={lang}
        title={t.learnReal}
        helper={lang === "en"
          ? "Read the story and follow the numbers."
          : "Baca cerita dan ikuti nombornya."}
      >
        <RealWorldTeachingPhase
          phase={phase}
          lang={lang}
          t={t}
          onPrevious={phase === 0 ? undefined : goPrevious}
          onNext={goNext}
          onSkip={() => setPhase("practice")}
        />
      </LessonShell>
    </main>
  );
}

function RealWorldTeachingPhase({ phase, lang, t, onPrevious, onNext, onSkip }: {
  phase: RealWorldTeachingIndex;
  lang: Lang;
  t: UIStrings;
  onPrevious?: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const title = [
    lang === "en" ? "Addition story" : "Cerita tambah",
    lang === "en" ? "Subtraction story" : "Cerita tolak",
  ][phase];
  const talk = [
    lang === "en"
      ? "Start with 3 shells. Then add 2 more."
      : "Mula dengan 3 cangkerang. Kemudian tambah 2 lagi.",
    lang === "en"
      ? "Start with 5 cookies. Then take away 2."
      : "Mula dengan 5 biskut. Kemudian tolak 2.",
  ][phase];
  const nextLabel = phase === 1 ? t.practice : t.next;

  return (
    <div className="space-y-5">
      <div className="relative rounded-[2rem] border-2 border-emerald-100 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,.10)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img src={chrysThinking} alt="Chrys" className="mx-auto h-28 w-28 shrink-0 object-contain sm:mx-0" />
          <div>
            <p className="text-sm font-black text-blue-700">{title}</p>
            <h3 className="mt-2 text-2xl font-black leading-snug text-blue-950 md:text-3xl">
              <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">{talk}</span>
            </h3>
          </div>
        </div>
      </div>

      {phase === 0 && (
        <div className="space-y-5">
          <RealWorldKeywordLesson lang={lang} operation="addition" />
          <RealWorldOperationExample lang={lang} operation="addition" />
        </div>
      )}
      {phase === 1 && (
        <div className="space-y-5">
          <RealWorldKeywordLesson lang={lang} operation="subtraction" />
          <RealWorldOperationExample lang={lang} operation="subtraction" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreviousLessonButton label={t.previous} onClick={onPrevious} />
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={onSkip} variant="green" />
          <LessonNextButton label={nextLabel} onClick={onNext} />
        </div>
      </div>
    </div>
  );
}

function RealWorldEverywhereExample({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-[2rem] border-2 border-sky-100 bg-sky-50 p-4 shadow-[0_6px_0_rgba(14,116,144,.12)]">
      <div className="grid gap-4 md:grid-cols-3">
        <RealWorldSituationCard
          title={lang === "en" ? "Apples in a basket" : "Epal di dalam bakul"}
          prompt={lang === "en" ? "Total: 3 apples" : "Jumlah: 3 epal"}
        >
          <MiniAppleBasket count={3} />
        </RealWorldSituationCard>
        <RealWorldSituationCard
          title={lang === "en" ? "Fish in a pond" : "Ikan di dalam kolam"}
          prompt={lang === "en" ? "Total: 3 fish" : "Jumlah: 3 ikan"}
        >
          <div className="relative mx-auto flex h-40 max-w-64 items-center justify-center gap-1 overflow-hidden rounded-[50%] border-4 border-sky-300 bg-sky-200 px-5 shadow-inner">
            <span className="absolute bottom-1 left-5 text-2xl" aria-hidden="true">🌿</span>
            {["🐟", "🐠", "🐟"].map((fish, index) => (
              <SceneCountObject key={`${fish}-${index}`} number={index + 1} outlined={false}>
                <span className="text-4xl" aria-hidden="true">{fish}</span>
              </SceneCountObject>
            ))}
          </div>
        </RealWorldSituationCard>
        <RealWorldSituationCard
          title={lang === "en" ? "Cars in a car park" : "Kereta di tempat letak kereta"}
          prompt={lang === "en" ? "Total: 3 cars" : "Jumlah: 3 kereta"}
        >
          <div className="mx-auto grid h-40 max-w-64 grid-cols-3 items-center gap-2 rounded-2xl border-4 border-slate-400 bg-slate-600 p-3 shadow-inner">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex h-28 items-center justify-center border-x-2 border-white/80">
                <SceneCountObject number={index + 1} outlined={false}>
                  <SpriteIcon value="🚗" className="h-12 w-12 drop-shadow-md" />
                </SceneCountObject>
              </div>
            ))}
          </div>
        </RealWorldSituationCard>
      </div>
      <p className="mt-5 rounded-2xl bg-white p-4 text-center text-xl font-black text-blue-950">
        {lang === "en"
          ? "We count everywhere: apples, fish, cars, and more!"
          : "Kita mengira di mana-mana: epal, ikan, kereta dan banyak lagi!"}
      </p>
    </div>
  );
}

function SceneCountObject({ number, children, className = "", compact = false, outlined = true }: {
  number: number;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  outlined?: boolean;
}) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center ${outlined ? "rounded-full border-[3px] border-blue-500 bg-white/90 shadow-[0_3px_0_#93c5fd]" : ""} ${compact ? "h-12 w-12" : "h-16 w-16"} ${className}`}>
      <span className="absolute -top-2 left-1/2 z-20 flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-black leading-none text-white shadow-sm">
        {number}
      </span>
      {children}
    </span>
  );
}

function RealWorldSituationCard({ title, prompt, children }: {
  title: string;
  prompt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border-2 border-white bg-white p-4 shadow-[0_5px_0_rgba(0,0,0,.10)]">
      <h4 className="min-h-14 text-center text-xl font-black leading-tight text-blue-950">{title}</h4>
      <div className="mt-3">{children}</div>
      <p className="mt-3 text-center text-base font-black text-slate-600">{prompt}</p>
    </div>
  );
}

function MiniAppleBasket({ count }: { count: number }) {
  const positions = [
    "left-[40%] top-[42%] -translate-x-1/2 -translate-y-1/2",
    "left-[60%] top-[42%] -translate-x-1/2 -translate-y-1/2",
    "left-1/2 top-[65%] -translate-x-1/2 -translate-y-1/2",
  ];
  return (
    <div className="relative mx-auto h-40 max-w-64">
      <img src={BASKET_SPRITE} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />
      <div className="absolute inset-0">
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className={`absolute ${positions[index]}`}>
            <SceneCountObject number={index + 1} compact>
              <SpriteIcon value="🍎" className="h-8 w-8 drop-shadow-md" />
            </SceneCountObject>
          </span>
        ))}
      </div>
    </div>
  );
}

function FindStoryNumbersExample({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-4 rounded-[2rem] border-2 border-amber-100 bg-amber-50 p-4 shadow-[0_6px_0_rgba(146,64,14,.12)]">
      <div className="flex justify-center">
        <span className="rounded-full border-2 border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-800">
          {lang === "en" ? "Step 1 of 3" : "Langkah 1 daripada 3"}
        </span>
      </div>
      <p className="rounded-3xl bg-white p-5 text-center text-xl font-black leading-relaxed text-blue-950 md:text-2xl">
        {lang === "en" ? "Ali has " : "Ali ada "}
        <StoryNumber value={3} />
        {lang === "en" ? " apples. His friend gives him " : " epal. Kawannya beri "}
        <StoryNumber value={2} />
        {lang === "en" ? " more apples." : " lagi epal."}
      </p>
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-3xl border-2 border-amber-200 bg-white p-4 text-center">
          <p className="mb-2 text-lg font-black text-amber-900">{lang === "en" ? "Ali's basket" : "Bakul Ali"}</p>
          <MiniAppleBasket count={3} />
          <p className="mt-2 text-xl font-black text-blue-950">{lang === "en" ? "3 apples" : "3 epal"}</p>
        </div>
        <div className="text-center">
          <span className="block text-5xl" aria-hidden="true">🤲</span>
          <span className="mt-1 block text-3xl font-black text-emerald-700">→</span>
        </div>
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="mb-4 text-lg font-black text-emerald-900">{lang === "en" ? "A friend gives more" : "Kawan beri lagi"}</p>
          <div className="flex min-h-28 items-center justify-center gap-4">
            <SpriteIcon value="🍎" className="h-16 w-16 drop-shadow-md" />
            <SpriteIcon value="🍎" className="h-16 w-16 drop-shadow-md" />
          </div>
          <p className="mt-2 text-xl font-black text-blue-950">{lang === "en" ? "2 more apples" : "2 epal lagi"}</p>
        </div>
      </div>
      <p className="rounded-2xl bg-yellow-200 p-4 text-center text-xl font-black text-yellow-950">
        {lang === "en"
          ? "Step 1: we find the numbers. Next, we ask: what happens?"
          : "Langkah 1: kita cari nombor. Seterusnya, kita tanya: apa yang berlaku?"}
      </p>
    </div>
  );
}

function StoryNumber({ value }: { value: number }) {
  return (
    <span className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-yellow-500 bg-yellow-300 px-3 text-2xl font-black text-yellow-950 shadow-[0_3px_0_#d97706]">
      {value}
    </span>
  );
}

type RealWorldOperation = "addition" | "subtraction";
type RealWorldExamplePhase = "ready" | "countStart" | "operate" | "countResult" | "done";

function RealWorldKeywordLesson({ lang, operation }: { lang: Lang; operation: RealWorldOperation }) {
  const addition = operation === "addition";
  const keywords = addition
    ? lang === "en" ? ["finds more", "gets more", "altogether", "in total"] : ["jumpa lagi", "dapat lagi", "kesemuanya", "jumlah"]
    : lang === "en" ? ["eats", "takes away", "gives away", "left"] : ["makan", "ambil", "beri", "tinggal"];

  return (
    <div className={`rounded-[2rem] border-2 p-5 shadow-[0_6px_0_rgba(0,0,0,.10)] ${addition ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"}`}>
      <div className="rounded-3xl bg-white p-5 text-center">
        <p className="text-lg font-black text-slate-600">
          {addition
            ? (lang === "en" ? "Addition clue words tell us that the amount grows." : "Kata petunjuk tambah memberitahu kita bahawa jumlah bertambah.")
            : (lang === "en" ? "Subtraction clue words tell us that the amount becomes smaller." : "Kata petunjuk tolak memberitahu kita bahawa jumlah berkurang.")}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {keywords.map((keyword) => (
            <span key={keyword} className={`rounded-full border-2 px-4 py-2 text-lg font-black ${addition ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-orange-300 bg-orange-100 text-orange-950"}`}>
              {keyword}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

function RealWorldOperationExample({ lang, operation }: { lang: Lang; operation: RealWorldOperation }) {
  const addition = operation === "addition";
  const start = addition ? 3 : 5;
  const change = 2;
  const answer = addition ? start + change : start - change;
  const emoji = addition ? "🐚" : "🍪";
  const [phase, setPhase] = useState<RealWorldExamplePhase>("ready");
  const [startCount, setStartCount] = useState(0);
  const [changedCount, setChangedCount] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const runRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const running = phase !== "ready" && phase !== "done";

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const countTo = async (count: number, onCount: (value: number) => void, runId: number) => {
    if (!audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) onCount(value);
      });
      return;
    }
    for (let value = 1; value <= count; value += 1) {
      await wait(prefersReducedMotion ? 100 : COUNTING_STEP_MS);
      if (runRef.current !== runId) return;
      onCount(value);
    }
  };

  const playExample = async () => {
    if (running) return;
    const runId = ++runRef.current;
    stopNumberAudio();
    setStartCount(0);
    setChangedCount(0);
    setResultCount(0);
    setPhase("countStart");
    await countTo(start, setStartCount, runId);
    if (runRef.current !== runId) return;

    await speakMathCue(addition ? "plus" : "minus", lang);
    if (runRef.current !== runId) return;
    setPhase("operate");
    for (let value = 1; value <= change; value += 1) {
      setChangedCount(value);
      speakNumber(value, lang);
      await wait(prefersReducedMotion ? 120 : COUNTING_STEP_MS);
      if (runRef.current !== runId) return;
    }

    await speakMathCue("equals", lang);
    if (runRef.current !== runId) return;
    setPhase("countResult");
    await countTo(answer, setResultCount, runId);
    if (runRef.current === runId) setPhase("done");
  };

  const reset = () => {
    runRef.current += 1;
    stopNumberAudio();
    setPhase("ready");
    setStartCount(0);
    setChangedCount(0);
    setResultCount(0);
  };

  const clue = addition ? (lang === "en" ? "finds 2 more" : "jumpa 2 lagi") : (lang === "en" ? "eats 2" : "makan 2");
  const currentInstruction = phase === "ready"
    ? (addition
      ? (lang === "en" ? "Start with 3 shells, then add 2 more." : "Mula dengan 3 cangkerang, kemudian tambah 2 lagi.")
      : (lang === "en" ? "Start with 5 cookies, then take away 2." : "Mula dengan 5 biskut, kemudian tolak 2."))
    : phase === "countStart"
      ? (lang === "en" ? `First, count the starting ${start}.` : `Mula-mula, kira jumlah mula ${start}.`)
      : phase === "operate"
        ? (addition ? (lang === "en" ? "“Finds 2 more” means add 2." : "“Jumpa 2 lagi” bermaksud tambah 2.") : (lang === "en" ? "“Eats 2” means subtract 2." : "“Makan 2” bermaksud tolak 2."))
        : phase === "countResult"
          ? (lang === "en" ? "Now count the result." : "Sekarang kira jawapannya.")
          : (lang === "en" ? `The answer is ${answer}.` : `Jawapannya ialah ${answer}.`);

  return (
    <div className="space-y-5 rounded-[2rem] border-2 border-sky-200 bg-sky-50 p-5 shadow-[0_6px_0_rgba(14,116,144,.12)]">
      <p className="rounded-3xl bg-white p-5 text-center text-xl font-black leading-relaxed text-blue-950 md:text-2xl">
        {addition ? (lang === "en" ? "Sara has " : "Sara ada ") : (lang === "en" ? "Tom has " : "Tom ada ")}
        <StoryNumber value={start} />
        {addition ? (lang === "en" ? " shells. She " : " cangkerang. Dia ") : (lang === "en" ? " cookies. He " : " biskut. Dia ")}
        <span className="rounded-xl bg-yellow-200 px-2 py-1 text-yellow-950">{clue}</span>
        {addition ? (lang === "en" ? " shells. How many shells does she have now?" : " cangkerang. Berapa cangkerang yang dia ada sekarang?") : (lang === "en" ? " cookies. How many cookies are left?" : " biskut. Berapa biskut yang tinggal?")}
      </p>

      <div className="rounded-3xl border-2 border-white bg-white p-4">
        <p className="mb-4 text-center text-xl font-black text-blue-950">{currentInstruction}</p>
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <section className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
            <h4 className="text-lg font-black text-blue-900">{lang === "en" ? `Start with ${start}` : `Mula dengan ${start}`}</h4>
            <div className="mt-4 flex min-h-36 flex-wrap items-center justify-center gap-3">
              {Array.from({ length: start }, (_, index) => {
                const removed = !addition && index >= answer && changedCount > index - answer;
                const counted = index < startCount;
                const active = phase === "countStart" && index + 1 === startCount;
                return (
                  <div key={index} className={`relative grid h-20 w-16 place-items-center rounded-2xl border-2 transition-all duration-500 ${removed ? "-translate-y-5 scale-75 border-red-300 bg-red-50 opacity-35" : active ? "scale-110 border-yellow-400 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "border-blue-200 bg-white"}`}>
                    <span className="text-5xl drop-shadow-md" aria-hidden="true">{emoji}</span>
                    {(counted || removed) && <span className={`absolute -top-2 rounded-full px-2 text-xs font-black ${removed ? "bg-red-600 text-white" : active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>{removed ? index - answer + 1 : index + 1}</span>}
                    {removed && <span className="absolute inset-0 grid place-items-center text-5xl font-black text-red-500">×</span>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
            <h4 className="text-lg font-black text-emerald-900">{addition ? (lang === "en" ? "2 more shells" : "2 cangkerang lagi") : (lang === "en" ? "2 cookies eaten" : "2 biskut dimakan")}</h4>
            <div className="mt-4 flex min-h-36 items-center justify-center gap-3">
              {Array.from({ length: change }, (_, index) => {
                const active = phase === "operate" && index + 1 === changedCount;
                return (
                <div key={index} className={`relative grid h-20 w-16 place-items-center rounded-2xl border-2 transition-all duration-500 ${index < changedCount ? active ? "z-10 translate-y-0 scale-110 border-yellow-400 bg-white opacity-100 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "translate-y-0 scale-100 border-blue-300 bg-white opacity-100" : "translate-y-8 scale-75 border-slate-200 bg-white opacity-25"}`}>
                  <span className="text-5xl drop-shadow-md" aria-hidden="true">{emoji}</span>
                  {index < changedCount && <span className={`absolute -top-2 rounded-full px-2 text-xs font-black ${active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>{index + 1}</span>}
                </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-5 rounded-3xl border-2 border-violet-200 bg-violet-50 p-4 text-center">
          <p className="text-3xl font-black text-violet-950" style={NUMBER_TEXT_STYLE}>
            {start} <span data-math-cue={addition ? "plus" : "minus"}>{addition ? "+" : "−"}</span> {change} <span data-math-cue="equals">=</span> {phase === "done" ? answer : "?"}
          </p>
          <div className="mt-4 flex min-h-24 flex-wrap items-center justify-center gap-3">
            {Array.from({ length: answer }, (_, index) => {
              const active = phase === "countResult" && index + 1 === resultCount;
              return (
              <div key={index} className={`relative grid h-16 w-14 place-items-center rounded-2xl border-2 transition-all ${index < resultCount ? active ? "z-10 scale-110 border-yellow-400 bg-white opacity-100 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "scale-100 border-violet-400 bg-white opacity-100" : "scale-75 border-transparent opacity-15"}`}>
                <span className="text-4xl drop-shadow-sm" aria-hidden="true">{emoji}</span>
                {index < resultCount && <span className={`absolute -top-2 rounded-full px-2 text-xs font-black ${active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>{index + 1}</span>}
              </div>
              );
            })}
          </div>
        </div>

        <RealWorldStepGrid steps={[
          { label: lang === "en" ? "Start" : "Mula", value: String(start) },
          { label: lang === "en" ? "Clue" : "Petunjuk", value: clue },
          { label: lang === "en" ? "Meaning" : "Maksud", value: addition ? "+2" : "−2" },
          { label: lang === "en" ? "Answer" : "Jawapan", value: phase === "done" ? String(answer) : "?" },
        ]} />

        <div className="mt-5 flex justify-center">
          <button type="button" disabled={running} onClick={() => phase === "done" ? reset() : void playExample()} className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-4 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] disabled:cursor-wait disabled:opacity-60">
            {running ? (lang === "en" ? "Example playing..." : "Contoh sedang berjalan...") : phase === "done" ? (lang === "en" ? "Show again" : "Lihat lagi") : (lang === "en" ? "Start the example" : "Mula contoh")}
            {(phase === "ready" || phase === "done") && <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true"><PointerIcon /></span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function FindClueWordExample({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-4">
      <CharacterTalk
        lang={lang}
        text={lang === "en" ? "A clue word tells us what happens." : "Kata petunjuk beritahu apa yang berlaku."}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <RealWorldStoryCard
          story={lang === "en" ? "Sara finds 2 more shells." : "Sara jumpa 2 lagi cangkerang."}
          clue={lang === "en" ? "finds" : "jumpa"}
          note={lang === "en" ? "FINDS MORE is an ADDITION (+) clue." : "JUMPA LAGI ialah petunjuk TAMBAH (+)."}
        >
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-3xl bg-sky-50 p-4">
            <SpriteIcon value="🐚" className="h-14 w-14 drop-shadow-md" />
            <span data-math-cue="plus" className="text-4xl font-black text-blue-800">+</span>
            <SpriteIcon value="🐚" className="h-14 w-14 drop-shadow-md" />
            <SpriteIcon value="🐚" className="h-14 w-14 drop-shadow-md" />
          </div>
        </RealWorldStoryCard>
        <RealWorldStoryCard
          story={lang === "en" ? "Tom eats 2 cookies." : "Tom makan 2 biskut."}
          clue={lang === "en" ? "eats" : "makan"}
          note={lang === "en" ? "EATS is a SUBTRACTION (-) clue." : "MAKAN ialah petunjuk TOLAK (-)."}
        >
          <div className="flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-3xl bg-orange-50 p-4">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="relative inline-flex h-14 w-14 items-center justify-center drop-shadow-md" aria-hidden="true">
                <SpriteIcon value="🍪" className={`h-14 w-14 ${index < 2 ? "grayscale opacity-45" : ""}`} />
                {index < 2 && (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
                    <span className="absolute h-2.5 w-9 rotate-45 rounded-full border border-white bg-red-600 shadow-sm" />
                    <span className="absolute h-2.5 w-9 -rotate-45 rounded-full border border-white bg-red-600 shadow-sm" />
                  </span>
                )}
              </span>
            ))}
          </div>
        </RealWorldStoryCard>
      </div>
      <p className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center text-lg font-black text-yellow-950">
        {lang === "en" ? "Clue words help us choose. They do not decide every story." : "Kata petunjuk bantu kita pilih. Ia tidak menentukan setiap cerita."}
      </p>
    </div>
  );
}

function StoryBird({ flying }: { flying: boolean }) {
  return (
    <svg viewBox="0 0 86 72" className="h-14 w-16 overflow-visible drop-shadow-[0_4px_2px_rgba(15,23,42,.22)]" aria-hidden="true">
      <path d="M20 39 5 28l3 20 17-3Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="38" cy="40" rx="27" ry="20" fill="#38bdf8" stroke="#1e3a8a" strokeWidth="3" />
      <circle cx="60" cy="26" r="15" fill="#7dd3fc" stroke="#1e3a8a" strokeWidth="3" />
      <path d="m73 25 11 5-11 6Z" fill="#f59e0b" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="64" cy="22" r="3" fill="#0f172a" />
      <circle cx="65" cy="21" r="1" fill="white" />
      <ellipse
        cx="36"
        cy="40"
        rx="16"
        ry="10"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="2.5"
        className="transition-transform duration-300"
        style={{ transformBox: "fill-box", transformOrigin: "center", transform: flying ? "rotate(-28deg) translateY(-3px)" : "rotate(-8deg)" }}
      />
      <path d="M30 58v7m13-7v7m-16 0h7m6 0h7" fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SolveRealStoryExample({ lang }: { lang: Lang }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [birdStage, setBirdStage] = useState<"together" | "flying" | "complete">("together");
  const [birdAnimationRun, setBirdAnimationRun] = useState(0);

  useEffect(() => {
    setBirdStage("together");

    const takeOffTimer = window.setTimeout(
      () => setBirdStage(prefersReducedMotion ? "complete" : "flying"),
      1500,
    );
    const completeTimer = window.setTimeout(
      () => setBirdStage("complete"),
      prefersReducedMotion ? 1500 : 3400,
    );

    return () => {
      window.clearTimeout(takeOffTimer);
      window.clearTimeout(completeTimer);
    };
  }, [birdAnimationRun, lang, prefersReducedMotion]);

  const birdPositions = ["18%", "34%", "50%", "66%", "82%"];

  return (
    <div className="space-y-4 rounded-[2rem] border-2 border-sky-100 bg-sky-50 p-4 shadow-[0_6px_0_rgba(14,116,144,.12)]">
      <p className="rounded-3xl bg-white p-5 text-center text-xl font-black leading-relaxed text-blue-950 md:text-2xl">
        {lang === "en" ? "There are " : "Ada "}
        <StoryNumber value={5} />
        {lang === "en" ? " birds. " : " ekor burung. "}
        <StoryNumber value={2} />
        {" "}
        <span className="rounded-xl bg-yellow-200 px-2 py-1 text-yellow-950">
          {lang === "en" ? "fly away" : "terbang pergi"}
        </span>
        {lang === "en" ? ". How many are left?" : ". Berapa yang tinggal?"}
      </p>

      <div className="relative overflow-hidden rounded-[2rem] border-2 border-sky-200 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 shadow-inner">
        <div className="absolute right-[8%] top-6 h-14 w-14 rounded-full bg-yellow-200/80 shadow-[0_0_28px_rgba(250,204,21,.45)]" aria-hidden="true" />
        <div className="absolute left-[9%] top-8 h-8 w-24 rounded-full bg-white/70 blur-[1px]" aria-hidden="true" />
        <div className="absolute left-[5%] top-12 h-7 w-32 rounded-full bg-white/70 blur-[1px]" aria-hidden="true" />

        <div className="relative min-h-72 sm:min-h-80" aria-label={lang === "en" ? "Five birds on a tree branch; two fly away" : "Lima burung di atas dahan; dua terbang pergi"}>
          <div className="absolute -bottom-12 -left-7 h-64 w-36 rounded-[48%_52%_30%_25%] bg-gradient-to-r from-amber-950 via-amber-800 to-amber-700 shadow-lg" aria-hidden="true">
            <span className="absolute bottom-8 right-6 top-16 w-3 rounded-full bg-amber-600/45" />
          </div>
          <div className="absolute -left-12 bottom-32 h-32 w-48 rounded-full border-b-8 border-emerald-800/25 bg-emerald-600 shadow-[50px_-20px_0_#22c55e,88px_8px_0_#16a34a]" aria-hidden="true" />
          <div className="absolute bottom-[28%] left-[10%] right-[6%] h-7 -rotate-1 rounded-full border-b-4 border-amber-950/40 bg-gradient-to-b from-amber-700 to-amber-900 shadow-lg" aria-hidden="true" />
          <div className="absolute bottom-[29%] right-[7%] h-5 w-32 origin-right -rotate-[18deg] rounded-full bg-amber-800" aria-hidden="true" />

          {birdPositions.map((left, index) => {
            const fliesAway = index >= 3;
            const isLeaving = fliesAway && birdStage !== "together";
            const flightTransform = index === 3
              ? "translate(calc(-50% + min(46vw, 24rem)), -5rem) rotate(-10deg)"
              : "translate(calc(-50% + min(52vw, 28rem)), -8rem) rotate(8deg)";

            return (
              <span
                key={index}
                className="absolute bottom-[34%] z-10 flex h-20 w-16 items-center justify-center"
                style={{
                  left,
                  opacity: isLeaving ? 0 : 1,
                  transform: isLeaving ? flightTransform : "translateX(-50%)",
                  transition: prefersReducedMotion
                    ? "none"
                    : `transform 1500ms cubic-bezier(.2,.75,.2,1) ${index === 4 ? 180 : 0}ms, opacity 300ms ease ${index === 4 ? 1250 : 1070}ms`,
                }}
                aria-hidden="true"
              >
                <span className="absolute -top-1 left-1/2 z-20 grid h-7 min-w-7 -translate-x-1/2 place-items-center rounded-full border-2 border-white bg-blue-600 px-1 text-sm font-black text-white shadow-md">
                  {index + 1}
                </span>
                <StoryBird flying={isLeaving} />
              </span>
            );
          })}

          <div className="absolute inset-x-3 bottom-3 z-20 flex flex-col items-center gap-2 text-center">
            <p className={`rounded-full border-2 bg-white/95 px-5 py-2 text-lg font-black shadow-md ${birdStage === "complete" ? "border-emerald-300 text-emerald-900" : birdStage === "flying" ? "border-red-200 text-red-700" : "border-blue-200 text-blue-900"}`} aria-live="polite">
              {birdStage === "together"
                ? (lang === "en" ? "Start with 5 birds." : "Mula dengan 5 burung.")
                : birdStage === "flying"
                  ? (lang === "en" ? "Watch birds 4 and 5 fly away!" : "Lihat burung 4 dan 5 terbang pergi!")
                  : (lang === "en" ? "3 birds stay. 2 birds flew away." : "3 burung tinggal. 2 burung terbang pergi.")}
            </p>
            {birdStage === "complete" && (
              <button
                type="button"
                onClick={() => setBirdAnimationRun((run) => run + 1)}
                className="rounded-full border-2 border-blue-300 bg-white px-4 py-1.5 text-sm font-black text-blue-800 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                ↻ {lang === "en" ? "Watch again" : "Lihat lagi"}
              </button>
            )}
          </div>
        </div>
      </div>

      {birdStage === "complete" && (
        <div className="space-y-4">
          <RealWorldStepGrid
            steps={[
              { label: lang === "en" ? "Find the numbers" : "Cari nombor", value: "5, 2" },
              { label: lang === "en" ? "Find the clue" : "Cari petunjuk", value: lang === "en" ? "fly away" : "terbang pergi" },
              { label: lang === "en" ? "Choose" : "Pilih", value: lang === "en" ? "take away (-)" : "tolak (-)" },
              { label: lang === "en" ? "Count what is left" : "Kira yang tinggal", value: "3" },
            ]}
          />
          <p className="rounded-2xl bg-emerald-100 p-4 text-center text-3xl font-black text-emerald-950">
            5 - 2 = 3
          </p>
        </div>
      )}
    </div>
  );
}

function RealWorldStoryCard({ story, clue, note, children }: { story: string; clue: string; note: string; children: React.ReactNode }) {
  const parts = story.split(clue);
  return (
    <div className="space-y-3 rounded-[2rem] border-2 border-white bg-white p-4 shadow-[0_5px_0_rgba(0,0,0,.10)]">
      <p className="text-xl font-black leading-snug text-blue-950">
        {parts[0]}
        <span className="rounded-xl bg-yellow-200 px-2 py-1 text-yellow-950">{clue}</span>
        {parts[1]}
      </p>
      {children}
      <p className="rounded-2xl bg-emerald-50 p-3 text-center text-lg font-black text-emerald-800">{note}</p>
    </div>
  );
}

function RealWorldStepGrid({ steps }: { steps: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {steps.map((step) => (
        <div key={`${step.label}-${step.value}`} className="rounded-2xl border-2 border-white bg-white p-3 text-center shadow-[0_3px_0_rgba(0,0,0,.08)]">
          <p className="text-sm font-black uppercase text-slate-500">{step.label}</p>
          <p className="mt-1 text-2xl font-black text-blue-950">{step.value}</p>
        </div>
      ))}
    </div>
  );
}

function AdditionIntroStep({ title, text, onPrevious, onNext, onSkip, t, lang }: {
  title: string;
  text: string;
  onPrevious?: () => void;
  onNext: () => void;
  onSkip: () => void;
  t: UIStrings;
  lang: Lang;
}) {
  return (
    <div className="space-y-5 text-center">
      <img src={chrysHappy} alt="Chrys happy" className="mx-auto h-36 w-36 object-contain" />
      <div className="relative rounded-3xl border-2 border-emerald-100 bg-white p-5 text-left">
        <p className="text-sm font-black text-blue-700">{title}</p>
        <h3 className="mt-3 text-2xl font-black leading-snug text-blue-950 md:text-3xl">
          <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">{text}</span>
        </h3>
      </div>
      <LessonActionRow
        previousLabel={t.previous}
        onPrevious={onPrevious}
        primaryLabel={t.next}
        onPrimary={onNext}
        actions={[{ label: skipPracticeLabel(lang), onClick: onSkip, variant: "green" }]}
      />
    </div>
  );
}

function ChrysAdditionStory({ lang, t, onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const [step, setStep] = useState(1);
  const [eatingStep, setEatingStep] = useState<number | null>(null);
  const [eatingCompleteStep, setEatingCompleteStep] = useState<number | null>(null);
  const [zeroStep, setZeroStep] = useState<1 | 2 | 3>(1);
  const bellyCounterRef = useRef<HTMLDivElement>(null);
  const storyText: Record<number, string> = lang === "en"
    ? {
      1: "Chrys eats 2 bananas.",
      3: "Then Chrys eats 3 more bananas.",
      5: "See how the groups make 5.",
      7: "Chrys and Alyse count bananas.",
    }
    : {
      1: "Chrys makan 2 pisang.",
      3: "Kemudian Chrys makan 3 pisang lagi.",
      5: "Lihat bagaimana kumpulan menjadi 5.",
      7: "Chrys dan Alyse mengira pisang.",
    };
  const zeroBeat = step === 7;
  const showFirst = step <= 1;
  const eatFirst = step === 1 && eatingStep === 1;
  const showSecond = step >= 2 && step <= 3;
  const eatSecond = step === 3 && eatingStep === 3;
  const waitingToEat = (step === 1 || step === 3) && eatingStep !== step;
  const eatingAnimationPending = (step === 1 || step === 3) && eatingCompleteStep !== step;
  const bellyTarget = step >= 3 ? 5 : step >= 1 ? 2 : 0;
  const zeroStoryText: Record<1 | 2 | 3, string> = lang === "en"
    ? {
      1: "Chrys has 0 bananas.",
      2: "Alyse has 4 bananas.",
      3: "Put both baskets together.",
    }
    : {
      1: "Chrys ada 0 pisang.",
      2: "Alyse ada 4 pisang.",
      3: "Gabungkan kedua-dua bakul.",
    };
  const helperText = zeroBeat ? zeroStoryText[zeroStep] : storyText[step];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <h3 className="text-2xl font-black leading-snug text-blue-950 md:text-3xl">
          <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">{helperText}</span>
        </h3>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        {zeroBeat ? (
          <ZeroAdditionBeat step={zeroStep} onStepChange={setZeroStep} lang={lang} />
        ) : step === 5 ? (
          <AdditionBananaEquation lang={lang} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="min-h-40 rounded-3xl border-2 border-amber-100 bg-amber-50 p-4">
                {showFirst && (
                  <StoryBananaGroup
                    count={2}
                    eating={eatFirst}
                    label={lang === "en" ? "2 bananas" : "2 pisang"}
                    destinationRef={bellyCounterRef}
                  />
                )}
                {showSecond && (
                  <StoryBananaGroup
                    count={3}
                    eating={eatSecond}
                    label={lang === "en" ? "3 more bananas" : "3 pisang lagi"}
                    destinationRef={bellyCounterRef}
                  />
                )}
              </div>

              <div className="relative mx-auto flex w-44 flex-col items-center">
                <img src={chrysHappy} alt="Chrys eating bananas" className="h-36 w-36 -translate-y-3 object-contain" />
                {(step === 1 || step === 3) && (
                  <button
                    type="button"
                    disabled={eatingStep === step}
                    onClick={() => {
                      setEatingCompleteStep(null);
                      setEatingStep(step);
                    }}
                    aria-label={lang === "en" ? `Eat ${step === 1 ? 2 : 3} bananas` : `Makan ${step === 1 ? 2 : 3} pisang`}
                    className="relative -mt-3 rounded-2xl border-2 border-amber-500 bg-amber-400 px-5 py-3 font-black text-amber-950 shadow-[0_5px_0_#a86000] active:translate-y-1 disabled:cursor-default disabled:opacity-60"
                  >
                    {lang === "en" ? `Eat ${step === 1 ? 2 : 3} bananas` : `Makan ${step === 1 ? 2 : 3} pisang`}
                    <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                      <PointerIcon />
                    </span>
                  </button>
                )}
              </div>

              {bellyTarget > 0 && (
                <BellyCounter
                  ref={bellyCounterRef}
                  start={step === 1 ? 0 : step === 3 ? 2 : bellyTarget}
                  target={bellyTarget}
                  counting={eatFirst || eatSecond}
                  waiting={waitingToEat}
                  label={lang === "en" ? "Chrys's belly" : "Perut Chrys"}
                  unit={lang === "en" ? "bananas" : "pisang"}
                  lang={lang}
                  onComplete={() => setEatingCompleteStep(step)}
                />
              )}
            </div>

          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            setEatingStep(null);
            setEatingCompleteStep(null);
            if (step === 1) onPrev();
            else if (step === 3) setStep(1);
            else if (step === 5) setStep(3);
            else if (step === 7 && zeroStep > 1) setZeroStep((current) => (current - 1) as 1 | 2);
            else if (step === 7) setStep(5);
            else setStep((current) => current - 1);
          }}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
        >
          {t.previous}
        </button>
        <div className="flex flex-wrap justify-end gap-3">
          {actions.map((action) => (
            <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
          ))}
          <LessonNextButton
            disabled={eatingAnimationPending}
            onClick={() => {
              setEatingStep(null);
              setEatingCompleteStep(null);
              if (step === 1) setStep(3);
              else if (step === 3) setStep(5);
              else if (step === 5) {
                setZeroStep(1);
                setStep(7);
              }
              else if (step === 7 && zeroStep < 3) setZeroStep((current) => (current + 1) as 2 | 3);
              else if (step < 7) setStep((current) => current + 1);
              else onDone();
            }}
            label={step < 7 || (step === 7 && zeroStep < 3) ? t.next : t.practice}
          />
        </div>
      </div>
    </div>
  );
}

function ChrysSubtractionStory({ lang, t, start, takeAway, situation, objectKind = "bananas", onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  start: number;
  takeAway: number;
  situation: Record<Lang, string>;
  objectKind?: "bananas" | "butterflies";
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const [storyStep, setStoryStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [showSituation, setShowSituation] = useState(true);
  const [given, setGiven] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [flight, setFlight] = useState<Array<{ left: number; top: number; x: number; y: number; sourceIndex: number; targetIndex: number }> | null>(null);
  const basketRef = useRef<HTMLDivElement>(null);
  const chrysBananaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const alyseBananaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const flyingBananaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const answer = start - takeAway;
  const left = start - given;
  const butterflies = objectKind === "butterflies";
  const objectEmoji = butterflies ? "🦋" : BANANA;
  const sharingFinished = showSituation && storyStep === 4 && given === takeAway && !sharing && !flight;
  const storyText: Record<number, string> = butterflies
    ? lang === "en"
      ? {
        1: `${takeAway} butterflies will fly away.`,
        4: `${takeAway} butterflies fly away. ${answer} are left.`,
        5: `Count what is left. ${answer} butterflies!`,
        6: `${start} butterflies. ${takeAway} fly away. ${answer} are left.`,
      }
      : {
        1: `${takeAway} rama-rama akan terbang pergi.`,
        4: `${takeAway} rama-rama terbang pergi. Tinggal ${answer}.`,
        5: `Kira yang tinggal. ${answer} rama-rama!`,
        6: `${start} rama-rama. ${takeAway} terbang pergi. Tinggal ${answer}.`,
      }
    : lang === "en"
    ? {
      1: `Chrys will give Alyse ${takeAway} bananas.`,
      4: `Chrys gives Alyse ${takeAway} bananas. ${answer} are left.`,
      5: `Count what is left. ${answer} bananas!`,
      6: `${start} bananas. Give Alyse ${takeAway}. ${answer} are left.`,
    }
    : {
      1: `Chrys akan beri Alyse ${takeAway} pisang.`,
      4: `Chrys beri Alyse ${takeAway} pisang. Tinggal ${answer}.`,
      5: `Kira yang tinggal. ${answer} pisang!`,
      6: `${start} pisang. Beri Alyse ${takeAway}. Tinggal ${answer}.`,
    };

  useEffect(() => {
    if (!flight) return;
    const reducedMotion = getReducedMotionPreference();
    const animations = flight.flatMap((item) => {
      const banana = flyingBananaRefs.current[item.targetIndex];
      if (!banana) return [];
      const keyframes = reducedMotion
        ? [
          { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
          { transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(1)`, opacity: 1 },
        ]
        : [
          { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
          { offset: 0.33, transform: `translate3d(${item.x * 0.33}px, ${item.y * 0.33 - SUBTRACTION_SHARE_ARC_PX}px, 0) scale(1.02)`, opacity: 1 },
          { offset: 0.67, transform: `translate3d(${item.x * 0.67}px, ${item.y * 0.67 - SUBTRACTION_SHARE_ARC_PX}px, 0) scale(1.02)`, opacity: 1 },
          { transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(1)`, opacity: 1 },
        ];
      return [banana.animate(keyframes, {
        duration: reducedMotion ? 1 : SUBTRACTION_SHARE_TRAVEL_MS,
        easing: "cubic-bezier(.4,0,.2,1)",
        fill: "forwards",
      })];
    });

    if (animations.length !== 1) return;
    let cancelled = false;
    let landingFrame = 0;
    Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (cancelled) return;
      const nextGiven = Math.min(takeAway, flight[0].targetIndex + 1);
      setGiven(nextGiven);
      // Speak the new remaining count only after this object reaches its destination.
      speakNumber(start - nextGiven, lang);
      // Keep the flying banana over the destination until React paints the landed tile.
      landingFrame = window.requestAnimationFrame(() => {
        landingFrame = window.requestAnimationFrame(() => {
          setFlight(null);
          if (nextGiven === takeAway) {
            setSharing(false);
            setStoryStep(4);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(landingFrame);
      animations.forEach((animation) => animation.cancel());
    };
  }, [flight, lang, start, takeAway]);

  useEffect(() => {
    if (!showSituation || !sharing || flight || given >= takeAway || !basketRef.current) return;
    const timer = window.setTimeout(() => {
      const sourceIndex = start - 1 - given;
      const targetIndex = given;
      const source = chrysBananaRefs.current[sourceIndex];
      const target = alyseBananaRefs.current[targetIndex];
      if (!source || !target) return;

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const leftPosition = sourceRect.left + sourceRect.width / 2 - 24;
      const topPosition = sourceRect.top + sourceRect.height / 2 - 24;
      setFlight([{
        left: leftPosition,
        top: topPosition,
        x: targetRect.left + targetRect.width / 2 - 24 - leftPosition,
        y: targetRect.top + targetRect.height / 2 - 24 - topPosition,
        sourceIndex,
        targetIndex,
      }]);
    }, SUBTRACTION_SHARE_PAUSE_MS);

    return () => window.clearTimeout(timer);
  }, [flight, given, sharing, showSituation, start, takeAway]);

  const giveBananas = () => {
    if (flight || sharing || given >= takeAway || !basketRef.current) return;
    setSharing(true);
  };

  const setStoryPosition = (nextStep: 1 | 2 | 3 | 4 | 5 | 6) => {
    setFlight(null);
    setSharing(false);
    setStoryStep(nextStep);
    setGiven(nextStep === 1 ? 0 : takeAway);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <h3 className="text-2xl font-black leading-snug text-blue-950 md:text-3xl">
          <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">
            {showSituation && storyStep === 1
              ? situation[lang]
              : storyText[storyStep]}
          </span>
        </h3>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        {showSituation && (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
              <div ref={basketRef} className="min-h-56 rounded-3xl border-2 border-amber-200 bg-amber-50 p-3 text-center sm:p-4">
                <img src={chrysHappy} alt="Chrys" className="mx-auto h-16 w-16 object-contain sm:h-20 sm:w-20" />
                <p className="mb-3 text-sm font-black uppercase text-amber-800">{butterflies ? (lang === "en" ? "Butterflies near Chrys" : "Rama-rama dekat Chrys") : (lang === "en" ? "Chrys's basket" : "Bakul Chrys")}</p>
                <div className="relative mx-auto min-h-[21rem] w-full max-w-[26rem] overflow-hidden rounded-3xl border-2 border-amber-100 bg-white">
                  {!butterflies && <img src={BASKET_SPRITE} alt="" aria-hidden="true" className="absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] object-contain opacity-95" />}
                  <div className="relative z-10 flex min-h-[21rem] flex-col items-center justify-center gap-5 overflow-hidden px-8 pb-10 pt-12 sm:px-10">
                    {balancedIndexRows(start, 4).map((row, rowIndex) => (
                      <div key={rowIndex} className="flex w-full items-center justify-center gap-3 sm:gap-4">
                        {row.map((index) => {
                          const inBasket = index < left;
                          const isFlying = flight?.some((item) => item.sourceIndex === index);
                          return (
                            <div
                              key={index}
                              ref={(node) => { chrysBananaRefs.current[index] = node; }}
                              className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-visible rounded-full border-[3px] shadow-[0_3px_0_#93c5fd] transition-opacity duration-150 ${
                                inBasket
                                  ? "border-blue-400 bg-blue-50/95"
                                  : "pointer-events-none border-transparent bg-transparent opacity-0"
                              } ${isFlying ? "opacity-0" : ""}`}
                            >
                              {inBasket && <>
                                <span className="absolute -right-1 -top-2 z-20 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-xs font-black leading-none text-white shadow-sm">
                                  {index + 1}
                                </span>
                                <SpriteIcon value={objectEmoji} className="h-12 w-12" />
                              </>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-lg font-black">
                  <p className="rounded-2xl bg-amber-100 px-3 py-2 text-amber-950">
                    {lang === "en" ? `Start: ${start}` : `Mula: ${start}`}
                  </p>
                  <p className="rounded-2xl bg-blue-100 px-3 py-2 text-blue-950">
                    {lang === "en" ? `Left: ${left}` : `Tinggal: ${left}`}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-5xl font-black text-emerald-600" aria-hidden="true">→</p>
                <p className="mt-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
                  {butterflies ? (lang === "en" ? `Fly away ${takeAway}` : `${takeAway} terbang pergi`) : (lang === "en" ? `Share ${takeAway}` : `Kongsi ${takeAway}`)}
                </p>
              </div>
              <div className="min-h-56 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-3 text-center sm:p-4">
                <div className="mb-2 flex items-center justify-center gap-2">
                  {butterflies ? <SpriteIcon value="🌳" className="h-16 w-16" /> : <img src={alyseGuide} alt="Alyse" className="h-16 w-16 object-contain" />}
                  <p className="text-sm font-black uppercase text-emerald-800">{butterflies ? (lang === "en" ? "Butterflies flying home" : "Rama-rama terbang pulang") : (lang === "en" ? "Alyse's basket" : "Bakul Alyse")}</p>
                </div>
                <p className="mb-4 text-base font-black text-emerald-900">{butterflies ? (lang === "en" ? `${takeAway} butterflies fly away.` : `${takeAway} rama-rama terbang pergi.`) : (lang === "en" ? `Alyse gets ${takeAway} bananas.` : `Alyse dapat ${takeAway} pisang.`)}</p>
                <div className="relative mx-auto min-h-[21rem] w-full max-w-[26rem] overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white">
                  {!butterflies && <img src={BASKET_SPRITE} alt="" aria-hidden="true" className="absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] object-contain opacity-95" />}
                  <div className="relative z-10 grid min-h-[21rem] grid-cols-3 place-content-center gap-4 overflow-hidden px-10 py-12">
                    {Array.from({ length: takeAway }, (_, index) => (
                      <div
                        key={index}
                        ref={(node) => { alyseBananaRefs.current[index] = node; }}
                        className={`relative flex h-16 w-16 items-center justify-center justify-self-center overflow-visible rounded-full border-[3px] transition-[background-color,border-color,box-shadow,transform] duration-300 ${
                          index < given
                            ? index === given - 1 && sharing
                              ? "scale-105 border-yellow-500 bg-white/95 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
                              : "border-blue-400 bg-blue-50/95 shadow-[0_3px_0_#93c5fd]"
                            : "border-dashed border-slate-300 bg-white/75"
                        }`}
                      >
                        <span className={`absolute -right-1 -top-2 z-20 grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm ${index < given ? index === given - 1 && sharing ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white" : "bg-slate-400 text-white"}`}>
                          {index + 1}
                        </span>
                        {index < given && <SpriteIcon value={objectEmoji} className="h-12 w-12" />}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xl font-black text-emerald-950">
                  {butterflies ? (lang === "en" ? `Flown away: ${given}` : `Terbang pergi: ${given}`) : (lang === "en" ? `Alyse has: ${given}` : `Alyse ada: ${given}`)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-center sm:grid-cols-3" aria-label={lang === "en" ? "Subtraction number labels" : "Label nombor tolak"}>
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-black text-amber-800">{lang === "en" ? "Start" : "Mula"}</p>
                <p className="text-3xl font-black text-amber-950" style={NUMBER_TEXT_STYLE}>{start}</p>
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-black text-emerald-800">{butterflies ? (lang === "en" ? "Flown away" : "Terbang pergi") : (lang === "en" ? "Given to Alyse" : "Diberi kepada Alyse")}</p>
                <p className="text-3xl font-black text-emerald-950" style={NUMBER_TEXT_STYLE}>{given}</p>
              </div>
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-black text-blue-800">{lang === "en" ? "Left" : "Tinggal"}</p>
                <p className="text-3xl font-black text-blue-950" style={NUMBER_TEXT_STYLE}>{left}</p>
              </div>
            </div>

            {given < takeAway && (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={sharing || Boolean(flight)}
                  onClick={giveBananas}
                  className="relative rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#047857] active:translate-y-1 disabled:cursor-wait disabled:opacity-60"
                >
                  {sharing
                    ? butterflies ? (lang === "en" ? "Flying away one at a time..." : "Terbang pergi satu demi satu...") : (lang === "en" ? "Sharing one at a time..." : "Berkongsi satu demi satu...")
                    : butterflies ? (lang === "en" ? `Let ${takeAway} fly away` : `Biarkan ${takeAway} terbang pergi`) : (lang === "en" ? `Share ${takeAway} with Alyse` : `Kongsi ${takeAway} kepada Alyse`)}
                  <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                    <PointerIcon />
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {!showSituation && storyStep === 6 && (
          <SubtractionBananaEquation lang={lang} start={start} takeAway={takeAway} objectEmoji={objectEmoji} />
        )}
      </div>

      {flight?.map((item) => (
        <div
          key={item.targetIndex}
          ref={(node) => { flyingBananaRefs.current[item.targetIndex] = node; }}
          className="pointer-events-none fixed z-[100] grid h-12 w-12 place-items-center drop-shadow-lg"
          style={{ left: item.left, top: item.top }}
          aria-hidden="true"
        >
          <SpriteIcon value={objectEmoji} className="h-12 w-12" />
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            if (showSituation) {
              setSharing(false);
              setFlight(null);
              onPrev();
            } else {
              setStoryPosition(4);
              setShowSituation(true);
            }
          }}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
        >
          {t.previous}
        </button>
        <div className="flex flex-wrap justify-end gap-3">
          {actions.map((action) => (
            <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
          ))}
          <LessonNextButton
            disabled={showSituation && !sharingFinished}
            onClick={() => {
              if (sharingFinished) {
                setShowSituation(false);
                setStoryPosition(6);
                return;
              }
              if (storyStep < 6) setStoryPosition((storyStep + 1) as 2 | 3 | 4 | 5 | 6);
              else onDone();
            }}
            label={t.next}
          />
        </div>
      </div>
    </div>
  );
}

type SubtractionEquationPhase = "ready" | "countingStart" | "crossing" | "removing" | "counting" | "done";

function SubtractionBananaEquation({ lang, start, takeAway, objectEmoji = BANANA }: { lang: Lang; start: number; takeAway: number; objectEmoji?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<SubtractionEquationPhase>("ready");
  const [startCount, setStartCount] = useState(0);
  const [startCountComplete, setStartCountComplete] = useState(false);
  const [crossedCount, setCrossedCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const runRef = useRef(0);
  const answer = start - takeAway;

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const startExplanation = async () => {
    if (busy) return;
    const runId = ++runRef.current;
    setBusy(true);
    stopNumberAudio();

    if (phase === "done") {
      setPhase("ready");
      setStartCount(0);
      setStartCountComplete(false);
      setCrossedCount(0);
      setRemainingCount(0);
      setBusy(false);
      return;
    }

    if (phase === "ready" || phase === "countingStart") {
      const nextValue = startCount + 1;
      setPhase("countingStart");
      await speakNumber(nextValue, lang);
      if (runRef.current !== runId) return;
      setStartCount(nextValue);
      if (nextValue >= start) {
        setStartCountComplete(true);
        await speakMathCue("minus", lang);
        setPhase("crossing");
      }
    } else if (phase === "crossing") {
      const nextValue = crossedCount + 1;
      await speakNumber(nextValue, lang);
      if (runRef.current !== runId) return;
      setCrossedCount(nextValue);
      if (nextValue >= takeAway) {
        setPhase("removing");
        await wait(prefersReducedMotion ? 0 : 350);
        await speakMathCue("equals", lang);
        if (answer === 0) {
          await speakNumber(0, lang);
          setPhase("done");
          await speakRecordedBananaTotal(0, lang, objectEmoji);
        } else {
          setPhase("counting");
        }
      }
    } else if (phase === "removing") {
      setPhase(answer === 0 ? "done" : "counting");
    } else if (phase === "counting") {
      const nextValue = remainingCount + 1;
      await speakNumber(nextValue, lang);
      if (runRef.current !== runId) return;
      setRemainingCount(nextValue);
      if (nextValue >= answer) {
        setPhase("done");
        await speakRecordedBananaTotal(answer, lang, objectEmoji);
      }
    }
    setBusy(false);
  };

  const renderBanana = (index: number, mode: "start" | "crossed" | "resultCrossed" | "remaining") => {
    const value = index + 1;
    const isCrossMode = mode === "crossed" || mode === "resultCrossed";
    const isCrossed = isCrossMode && value <= crossedCount;
    const isStartCounted = mode === "start" && value <= startCount;
    const isRemainingCounted = mode === "remaining" && value <= remainingCount;
    const isCounted = isStartCounted || isRemainingCounted;
    const isCurrent = (mode === "start" && phase === "countingStart" && !startCountComplete && value === startCount)
      || (mode === "remaining" && phase === "counting" && value === remainingCount);
    const isCurrentCross = isCrossMode && phase === "crossing" && value === crossedCount;
    const isLeaving = mode === "resultCrossed" && ["removing", "counting", "done"].includes(phase);
    const groupCount = mode === "start" ? start : mode === "remaining" ? answer : takeAway;
    const centerLast = groupCount % 2 === 1 && index === groupCount - 1;
    return (
      <div
        key={`${mode}-${index}`}
        className={`relative grid h-24 w-16 place-items-center rounded-2xl border-2 pt-4 transition-[border-color,background-color,filter,opacity,box-shadow,transform] duration-700 ${centerLast ? "col-span-2 justify-self-center" : ""} ${
          isCurrent
            ? "scale-105 border-yellow-500 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
            : isCurrentCross
              ? "scale-105 border-red-500 bg-red-100 ring-4 ring-red-200 shadow-lg"
              : isCrossed
                ? "border-red-300 bg-slate-100 ring-2 ring-red-100"
                : isCounted
                  ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                  : "border-amber-100 bg-amber-50"
        } ${isLeaving ? "translate-x-16 scale-75 opacity-0" : "translate-x-0 opacity-100"}`}
        style={isLeaving && !prefersReducedMotion ? { transitionDelay: `${index * 120}ms` } : undefined}
      >
        {(isCrossed || isCounted) && (
          <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm ${isCrossed ? "bg-red-600 text-white" : isCurrent ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
            {value}
          </span>
        )}
        <span className="relative grid h-12 w-12 place-items-center">
          <SpriteIcon value={objectEmoji} className="h-12 w-12 opacity-100 saturate-100 grayscale-0" />
          {isCrossed && (
            <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-5xl font-black leading-none text-red-500 drop-shadow-sm" aria-hidden="true">&times;</span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => void startExplanation()}
          disabled={busy}
          className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1 disabled:cursor-wait disabled:opacity-60"
        >
          {phase === "countingStart" || phase === "ready"
            ? (lang === "en" ? "Count one" : "Kira satu")
            : phase === "crossing"
              ? (lang === "en" ? "Remove one" : "Ambil satu")
              : phase === "removing"
                ? (lang === "en" ? "Continue" : "Teruskan")
                : phase === "counting"
                  ? (lang === "en" ? "Count one left" : "Kira satu yang tinggal")
                  : phase === "done"
                    ? (lang === "en" ? "Show it again" : "Lihat sekali lagi")
                    : (lang === "en" ? "Start the solution" : "Mula cara jawab")}
          {(phase === "ready" || phase === "done") && (
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
              <PointerIcon />
            </span>
          )}
        </button>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(10.5rem,1fr)_auto_minmax(10.5rem,1fr)_auto_minmax(10.5rem,1fr)] lg:items-center">
        <div className={`rounded-3xl border-2 bg-blue-50 p-4 text-center transition-[border-color,box-shadow] ${phase === "countingStart" ? "border-blue-500 ring-4 ring-blue-100" : "border-blue-200"}`}>
          <p className="mb-4 text-xl font-black text-blue-950">{lang === "en" ? `Start with ${start}` : `Mula dengan ${start}`}</p>
          <div className="grid min-h-[23rem] grid-cols-2 place-content-center place-items-center gap-3 rounded-3xl bg-white p-5">
            {Array.from({ length: start }, (_, index) => renderBanana(index, "start"))}
          </div>
          <div className="min-h-20 pt-3">
            {startCountComplete && <CountTotalBadge count={start} lang={lang} unit={objectName(objectEmoji, start, lang)} />}
          </div>
        </div>

        <span data-math-cue="minus" className="grid h-14 w-14 place-items-center justify-self-center rounded-2xl border-2 border-yellow-500 bg-yellow-200 text-4xl font-black text-blue-950 shadow-[0_4px_0_#d97706]">-</span>

        <div className={`rounded-3xl border-2 p-4 text-center transition-[border-color,background-color,box-shadow] ${phase === "crossing" ? "border-red-500 bg-red-50 ring-4 ring-red-100" : "border-red-200 bg-red-50"}`}>
          <p className="mb-4 text-xl font-black text-red-900">{lang === "en" ? `Cross out ${takeAway}` : `Pangkah ${takeAway}`}</p>
          <div className="grid min-h-[23rem] grid-cols-2 place-content-center place-items-center gap-3 rounded-3xl bg-white p-5">
            {Array.from({ length: takeAway }, (_, index) => renderBanana(index, "crossed"))}
          </div>
          <div className="min-h-20 pt-3">
            {crossedCount === takeAway && (
              <p className="mx-auto inline-flex rounded-full bg-red-100 px-5 py-3 text-xl font-black text-red-900">
                {lang === "en" ? `Taken away: ${takeAway} ${objectName(objectEmoji, takeAway, lang)}` : `Diambil: ${takeAway} ${objectName(objectEmoji, takeAway, lang)}`}
              </p>
            )}
          </div>
        </div>

        <span data-math-cue="equals" className="grid h-14 w-14 place-items-center justify-self-center rounded-2xl border-2 border-yellow-500 bg-yellow-200 text-4xl font-black text-blue-950 shadow-[0_4px_0_#d97706]">=</span>

        <div className={`rounded-3xl border-2 p-4 text-center transition-[border-color,background-color,box-shadow] ${phase === "counting" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : phase === "done" ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100" : "border-blue-200 bg-blue-50"}`}>
          <p className="mb-4 text-xl font-black text-blue-950">{lang === "en" ? "Count what is left" : "Kira yang tinggal"}</p>
          <div className="flex min-h-[23rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-white p-5">
            <div className="grid grid-cols-2 place-items-center gap-3">
              {Array.from({ length: answer }, (_, index) => renderBanana(index, "remaining"))}
            </div>
            <div className={`grid grid-cols-2 place-items-center gap-3 transition-[max-height,opacity,transform,margin] duration-700 ${["removing", "counting", "done"].includes(phase) ? "-translate-y-3 max-h-0 overflow-hidden opacity-0" : "max-h-56 opacity-100"}`}>
              {Array.from({ length: takeAway }, (_, index) => renderBanana(index, "resultCrossed"))}
            </div>
          </div>
          <div className="min-h-20 pt-3">
            {remainingCount === answer && <CountTotalBadge count={answer} lang={lang} unit={objectName(objectEmoji, answer, lang)} />}
          </div>
        </div>
      </div>

      {phase === "done" && (
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-4xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>{start} - {takeAway} = {answer}</p>
          <p className="mt-2 text-xl font-black text-emerald-900">{lang === "en" ? `${start} ${objectName(objectEmoji, start, lang)}. Cross out ${takeAway}. ${answer} are left.` : `${start} ${objectName(objectEmoji, start, lang)}. Pangkah ${takeAway}. Tinggal ${answer}.`}</p>
        </div>
      )}
    </div>
  );
}

type WorkedSubtractionStage = "initial" | "process" | "end";

function WorkedSubtractionStory({ lang, t, title, story, processText, start, takeAway, character, onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  title: string;
  story: string;
  processText: string;
  start: number;
  takeAway: number;
  character: "chrys" | "alyse";
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const [stage, setStage] = useState<WorkedSubtractionStage>("initial");
  const left = start - takeAway;
  const characterImage = character === "alyse" ? alyseGuide : chrysHappy;
  const characterAlt = character === "alyse" ? "Alyse" : "Chrys";
  const stages: WorkedSubtractionStage[] = ["initial", "process", "end"];
  const stageIndex = stages.indexOf(stage);
  const stageLabel = stage === "initial"
    ? (lang === "en" ? "Initial" : "Mula")
    : stage === "process"
      ? (lang === "en" ? "Take away" : "Ambil")
      : (lang === "en" ? "End" : "Akhir");
  const instruction = stage === "initial"
    ? (lang === "en" ? `Start with ${start} bananas.` : `Mula dengan ${start} pisang.`)
    : stage === "process"
      ? processText
      : (lang === "en" ? `${left} bananas are left.` : `${left} pisang tinggal.`);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
          <img src={characterImage} alt={characterAlt} className="h-24 w-24 shrink-0 object-contain" />
          <div>
            <h3 className="text-center text-3xl font-black text-blue-950 sm:text-left">{title}</h3>
            <p className="mt-2 text-center text-lg font-black leading-snug text-slate-700 sm:text-left">{story}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        <div className="mb-4 grid grid-cols-3 gap-2" aria-label={lang === "en" ? "Subtraction sequence" : "Urutan penolakan"}>
          {stages.map((item, index) => (
            <div
              key={item}
              className={`rounded-2xl border-2 px-2 py-3 text-center text-sm font-black sm:text-base ${index === stageIndex ? "border-blue-500 bg-blue-500 text-white" : index < stageIndex ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}
            >
              <span className="mr-1">{index + 1}.</span>
              {item === "initial" ? (lang === "en" ? "Initial" : "Mula") : item === "process" ? (lang === "en" ? "Process" : "Proses") : (lang === "en" ? "End" : "Akhir")}
            </div>
          ))}
        </div>

        <div className={`space-y-4 rounded-3xl border-2 p-4 text-center ${stage === "process" ? "border-red-200 bg-red-50" : stage === "end" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">{stageLabel}</p>
          <p className="text-2xl font-black text-blue-950">{instruction}</p>
          {stage === "initial" && <ObjectGroup count={start} emoji={BANANA} numbered />}
          {stage === "process" && <ObjectGroup count={start} emoji={BANANA} numbered crossed={takeAway} />}
          {stage === "end" && <ObjectGroup count={left} emoji={BANANA} numbered />}
          <p className={`text-3xl font-black ${stage === "process" ? "text-red-800" : stage === "end" ? "text-emerald-800" : "text-blue-800"}`} style={NUMBER_TEXT_STYLE}>
            {stage === "initial" ? `${start} - ${takeAway} = ?` : stage === "process" ? `${start} - ${takeAway}` : `${start} - ${takeAway} = ${left}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => stage === "initial" ? onPrev() : setStage(stages[stageIndex - 1])}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
        >
          {t.previous}
        </button>
        <div className="flex flex-wrap justify-end gap-3">
          {actions.map((action) => (
            <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
          ))}
          <LessonNextButton
            onClick={() => stage === "end" ? onDone() : setStage(stages[stageIndex + 1])}
            label={stage === "end" ? (character === "alyse" ? t.practice : t.next) : t.next}
          />
        </div>
      </div>
    </div>
  );
}

type MangoTrayStoryPhase = "ready" | "countingStart" | "packing" | "countingLeft" | "done";

function MangoTraySubtractionStory({ lang, t, onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const mango = "🥭";
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<MangoTrayStoryPhase>("ready");
  const [startCount, setStartCount] = useState(0);
  const [packedCount, setPackedCount] = useState(0);
  const [leftCount, setLeftCount] = useState(0);
  const runRef = useRef(0);
  const running = phase !== "ready" && phase !== "done";

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const playCount = async (count: number, onCount: (value: number) => void, runId: number) => {
    if (!audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => {
        if (runRef.current === runId) onCount(value);
      });
      return;
    }

    const silentStepMs = prefersReducedMotion ? 180 : COUNTING_STEP_MS;
    for (let value = 1; value <= count; value += 1) {
      await wait(silentStepMs);
      if (runRef.current !== runId) return;
      onCount(value);
    }
  };

  const resetStory = () => {
    runRef.current += 1;
    stopNumberAudio();
    setPhase("ready");
    setStartCount(0);
    setPackedCount(0);
    setLeftCount(0);
  };

  const startStory = async () => {
    if (running) return;
    const runId = ++runRef.current;
    stopNumberAudio();
    setStartCount(0);
    setPackedCount(0);
    setLeftCount(0);

    setPhase("countingStart");
    await playCount(8, setStartCount, runId);
    if (runRef.current !== runId) return;

    await wait(prefersReducedMotion ? 120 : 450);
    if (runRef.current !== runId) return;
    await speakMathCue("minus", lang);
    if (runRef.current !== runId) return;

    setPhase("packing");
    await playCount(6, setPackedCount, runId);
    if (runRef.current !== runId) return;

    await wait(prefersReducedMotion ? 120 : 500);
    if (runRef.current !== runId) return;
    await speakMathCue("equals", lang);
    if (runRef.current !== runId) return;

    setPhase("countingLeft");
    await playCount(2, setLeftCount, runId);
    if (runRef.current !== runId) return;
    setPhase("done");
  };

  const instruction = phase === "ready"
    ? (lang === "en" ? "8 mangoes are on a tray." : "Ada 8 mangga di atas dulang.")
    : phase === "countingStart"
      ? (lang === "en" ? "Count the 8 mangoes." : "Kira 8 mangga.")
      : phase === "packing"
        ? (lang === "en" ? "Pack 6 mangoes into the basket." : "Masukkan 6 mangga ke dalam bakul.")
        : phase === "countingLeft"
          ? (lang === "en" ? "Count the mangoes left on the tray." : "Kira mangga yang tinggal di atas dulang.")
          : (lang === "en" ? "2 mangoes are left." : "Tinggal 2 mangga.");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
          <img src={chrysHappy} alt="Chrys" className="h-24 w-24 shrink-0 object-contain" />
          <div>
            <h3 className="text-center text-3xl font-black text-blue-950 sm:text-left">
              {lang === "en" ? "Mangoes on a tray" : "Mangga di atas dulang"}
            </h3>
            <p className="mt-2 text-center text-lg font-black leading-snug text-slate-700 sm:text-left">
              {lang === "en"
                ? "There are 8 mangoes on a tray. Chrys packs 6 into a basket."
                : "Ada 8 mangga di atas dulang. Chrys masukkan 6 ke dalam bakul."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_7px_0_rgba(0,0,0,.12)] md:p-6">
        <div className="mb-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-xl font-black text-emerald-950">
          {instruction}
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-5">
          <section className={`rounded-[2rem] border-4 p-4 transition-colors ${phase === "countingStart" || phase === "countingLeft" ? "border-blue-400 bg-blue-50" : "border-amber-300 bg-amber-50"}`}>
            <h4 className="mb-3 text-center text-2xl font-black text-amber-900">
              {lang === "en" ? "Mango tray" : "Dulang mangga"}
            </h4>
            <div className="relative mx-auto rounded-[2rem] border-[6px] border-amber-500 bg-amber-100 px-5 py-6 shadow-[inset_0_7px_0_rgba(180,83,9,.14),0_6px_0_rgba(180,83,9,.18)]">
              <span className="absolute -left-4 top-1/2 h-14 w-5 -translate-y-1/2 rounded-l-full border-4 border-r-0 border-amber-500 bg-amber-200" aria-hidden="true" />
              <span className="absolute -right-4 top-1/2 h-14 w-5 -translate-y-1/2 rounded-r-full border-4 border-l-0 border-amber-500 bg-amber-200" aria-hidden="true" />
              <div className="mx-auto grid max-w-sm grid-cols-4 justify-items-center gap-3">
                {Array.from({ length: 8 }, (_, index) => {
                  const removed = index < packedCount && index < 6;
                  const startingCurrent = phase === "countingStart" && index + 1 === startCount;
                  const startingCounted = phase === "countingStart" && index + 1 <= startCount;
                  const leftIndex = index - 5;
                  const leftCurrent = phase === "countingLeft" && index >= 6 && leftIndex === leftCount;
                  const leftCounted = (phase === "countingLeft" || phase === "done") && index >= 6 && leftIndex <= leftCount;
                  const label = phase === "countingLeft" || phase === "done" ? leftIndex : index + 1;
                  const showLabel = !removed && (startingCounted || leftCounted);

                  return (
                    <div
                      key={index}
                      className={`relative grid h-24 w-20 place-items-center rounded-2xl border-2 transition-all duration-500 ${removed ? "-translate-y-3 scale-90 border-slate-200 bg-slate-100 opacity-20" : startingCurrent || leftCurrent ? "z-10 scale-110 border-yellow-400 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : showLabel ? "border-blue-400 bg-blue-50 shadow-[0_3px_0_rgba(37,99,235,.14)]" : "border-amber-200 bg-white/75"}`}
                    >
                      {showLabel && (
                        <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm ${startingCurrent || leftCurrent ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
                          {label}
                        </span>
                      )}
                      <SpriteIcon value={mango} className="h-12 w-12" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="min-h-20 pt-3 text-center">
              {startCount === 8 && packedCount === 0 && <CountTotalBadge count={8} lang={lang} unit={objectName(mango, 8, lang)} />}
              {phase === "done" && <CountTotalBadge count={2} lang={lang} unit={objectName(mango, 2, lang)} />}
            </div>
          </section>

          <div className="flex items-center justify-center md:flex-col">
            <div data-math-cue="minus" className={`grid h-16 w-16 place-items-center rounded-2xl border-2 border-yellow-500 bg-yellow-100 text-4xl font-black text-blue-950 shadow-[0_5px_0_#a86000] ${phase === "packing" ? "ring-4 ring-red-200" : ""}`} aria-label={lang === "en" ? "minus" : "tolak"}>-</div>
          </div>

          <section className={`rounded-[2rem] border-4 p-4 transition-colors ${phase === "packing" ? "border-emerald-400 bg-emerald-50" : "border-emerald-200 bg-white"}`}>
            <h4 className="mb-3 text-center text-2xl font-black text-emerald-900">
              {lang === "en" ? "Packing basket" : "Bakul simpanan"}
            </h4>
            <div className="relative mx-auto min-h-[18rem] max-w-sm overflow-hidden rounded-[2rem] bg-amber-50/60 p-5">
              <img src={BASKET_SPRITE} alt={lang === "en" ? "Basket" : "Bakul"} className="absolute inset-0 h-full w-full object-contain" />
              <div className="relative z-10 mx-auto mt-12 grid max-w-[15rem] grid-cols-3 justify-items-center gap-3 overflow-hidden px-2 py-3">
                {Array.from({ length: 6 }, (_, index) => {
                  const packed = index < packedCount;
                  const current = index + 1 === packedCount && phase === "packing";
                  return (
                    <div
                      key={index}
                      className={`relative grid h-20 w-16 place-items-center rounded-2xl border-2 transition-all duration-500 ${packed ? current ? "z-10 scale-110 border-yellow-400 bg-emerald-50 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "border-emerald-400 bg-emerald-50" : "translate-y-4 border-dashed border-white/0 opacity-0"}`}
                    >
                      {packed && (
                        <>
                          <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm ${current ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>{index + 1}</span>
                          <SpriteIcon value={mango} className="h-11 w-11" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="min-h-20 pt-3 text-center">
              {packedCount > 0 && <CountTotalBadge count={packedCount} lang={lang} unit={objectName(mango, packedCount, lang)} />}
            </div>
          </section>
        </div>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => phase === "done" ? resetStory() : void startStory()}
            disabled={running}
            className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-4 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1 disabled:cursor-wait disabled:opacity-60"
          >
            {running
              ? (lang === "en" ? "Story playing..." : "Cerita sedang berjalan...")
              : phase === "done"
                ? (lang === "en" ? "Show again" : "Lihat lagi")
                : (lang === "en" ? "Start the story" : "Mula cerita")}
            {!running && (
              <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md" aria-hidden="true">
                <PointerIcon />
              </span>
            )}
          </button>
        </div>

        {phase === "done" && (
          <div className="mt-5 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-4xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>8 - 6 = 2</p>
            <p className="mt-2 text-xl font-black text-emerald-950">
              {lang === "en" ? "8 mangoes. Pack 6. 2 are left." : "8 mangga. Simpan 6. Tinggal 2."}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreviousLessonButton label={t.previous} onClick={phase === "ready" ? onPrev : resetStory} />
        <div className="flex flex-wrap justify-end gap-3">
          {actions.map((action) => (
            <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
          ))}
          <LessonNextButton label={t.practice} onClick={onDone} disabled={phase !== "done"} />
        </div>
      </div>
    </div>
  );
}

type NewSubtractionStoryPhase = "ready" | "countingStart" | "takingAway" | "countingLeft" | "done";

async function playSubtractionStoryCount(
  count: number,
  lang: Lang,
  onCount: (value: number) => void,
  runRef: React.RefObject<number>,
  runId: number,
  prefersReducedMotion: boolean,
) {
  if (count === 0) {
    onCount(0);
    speakNumber(0, lang);
    await wait(prefersReducedMotion ? 100 : COUNTING_STEP_MS);
    return;
  }
  if (!audioMuted) {
    await speakCountingSequence(count, lang, COUNTING_STEP_MS, (value) => {
      if (runRef.current === runId) onCount(value);
    });
    return;
  }
  for (let value = 1; value <= count; value += 1) {
    await wait(prefersReducedMotion ? 120 : COUNTING_STEP_MS);
    if (runRef.current !== runId) return;
    onCount(value);
  }
}

function ButterfliesFlyHomeStory({ lang, t, onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const butterfly = String.fromCodePoint(0x1f98b);
  const tree = String.fromCodePoint(0x1f333);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<NewSubtractionStoryPhase>("ready");
  const [startCount, setStartCount] = useState(0);
  const [flownCount, setFlownCount] = useState(0);
  const [leftCount, setLeftCount] = useState(0);
  const runRef = useRef(0);
  const running = phase !== "ready" && phase !== "done";

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const reset = () => {
    runRef.current += 1;
    stopNumberAudio();
    setPhase("ready");
    setStartCount(0);
    setFlownCount(0);
    setLeftCount(0);
  };

  const start = async () => {
    if (running) return;
    const runId = ++runRef.current;
    stopNumberAudio();
    setStartCount(0);
    setFlownCount(0);
    setLeftCount(0);
    setPhase("countingStart");
    await playSubtractionStoryCount(6, lang, setStartCount, runRef, runId, prefersReducedMotion);
    if (runRef.current !== runId) return;
    await speakMathCue("minus", lang);
    setPhase("takingAway");
    for (let value = 1; value <= 2; value += 1) {
      setFlownCount(value);
      speakNumber(value, lang);
      await wait(prefersReducedMotion ? 180 : COUNTING_STEP_MS);
      if (runRef.current !== runId) return;
    }
    await speakMathCue("equals", lang);
    setPhase("countingLeft");
    await playSubtractionStoryCount(4, lang, setLeftCount, runRef, runId, prefersReducedMotion);
    if (runRef.current === runId) setPhase("done");
  };

  const instruction = phase === "ready"
    ? (lang === "en" ? "Chrys sees 6 butterflies near the banana trees." : "Chrys nampak 6 rama-rama berhampiran pokok pisang.")
    : phase === "countingStart"
      ? (lang === "en" ? "Count the 6 butterflies." : "Kira 6 rama-rama.")
      : phase === "takingAway"
        ? (lang === "en" ? "2 butterflies fly home." : "2 rama-rama terbang pulang.")
        : phase === "countingLeft"
          ? (lang === "en" ? "Count the butterflies that remain." : "Kira rama-rama yang masih ada.")
          : (lang === "en" ? "4 butterflies remain." : "Tinggal 4 rama-rama.");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-sky-200 bg-sky-50 p-5 text-center">
        <h3 className="text-3xl font-black text-blue-950">{lang === "en" ? "The butterflies fly home" : "Rama-rama terbang pulang"}</h3>
        <p className="mt-2 text-lg font-black text-slate-700">{instruction}</p>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-[linear-gradient(#dff6ff_0%,#f0fff4_58%,#bbf7d0_100%)] p-5 shadow-[0_7px_0_rgba(0,0,0,.12)]">
        <div className="grid min-h-[23rem] items-center gap-5 md:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-3 place-items-center gap-5">
            {Array.from({ length: 6 }, (_, index) => {
              const flown = index < flownCount;
              const remainingIndex = index - 1;
              const showStartLabel = phase === "countingStart" && index < startCount;
              const showLeftLabel = (phase === "countingLeft" || phase === "done") && index >= 2 && remainingIndex <= leftCount;
              const active = phase === "countingStart" ? index + 1 === startCount : phase === "countingLeft" && index >= 2 && remainingIndex === leftCount;
              return (
                <div key={index} className={`relative grid h-24 w-24 place-items-center rounded-full border-4 transition-all duration-700 ${flown ? "-translate-y-32 translate-x-28 scale-75 opacity-0" : active ? "scale-110 border-yellow-400 bg-white/85 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "border-sky-300 bg-white/85"}`}>
                  <SpriteIcon value={butterfly} className="h-14 w-14" />
                  {(showStartLabel || showLeftLabel) && <span className={`absolute -top-3 grid h-8 min-w-8 place-items-center rounded-full px-2 text-sm font-black ${active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>{showLeftLabel ? remainingIndex : index + 1}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center justify-center">
            <SpriteIcon value={tree} className="h-40 w-40" />
            <p className="rounded-full bg-emerald-100 px-4 py-2 font-black text-emerald-900">{lang === "en" ? "Home" : "Rumah"}</p>
          </div>
        </div>
        {phase === "done" && <div className="mt-4 rounded-3xl border-2 border-emerald-200 bg-white/90 p-4 text-center"><p className="text-4xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>6 - 2 = 4</p></div>}
        <div className="mt-5 flex justify-center"><button type="button" disabled={running} onClick={() => phase === "done" ? reset() : void start()} className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-4 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] disabled:opacity-60">{running ? (lang === "en" ? "Story playing..." : "Cerita sedang berjalan...") : phase === "done" ? (lang === "en" ? "Show again" : "Lihat lagi") : (lang === "en" ? "Start the story" : "Mula cerita")}</button></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><PreviousLessonButton label={t.previous} onClick={phase === "ready" ? onPrev : reset} /><div className="flex flex-wrap justify-end gap-3">{actions.map((action) => <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />)}<LessonNextButton label={t.next} onClick={onDone} disabled={phase !== "done"} /></div></div>
    </div>
  );
}

function AllBananasSharedStory({ lang, t, onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const friend = String.fromCodePoint(0x1f412);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<NewSubtractionStoryPhase>("ready");
  const [startCount, setStartCount] = useState(0);
  const [sharedCount, setSharedCount] = useState(0);
  const runRef = useRef(0);
  const running = phase !== "ready" && phase !== "done";

  useEffect(() => () => { runRef.current += 1; stopNumberAudio(); }, []);
  const reset = () => { runRef.current += 1; stopNumberAudio(); setPhase("ready"); setStartCount(0); setSharedCount(0); };
  const start = async () => {
    if (running) return;
    const runId = ++runRef.current;
    stopNumberAudio();
    setStartCount(0);
    setSharedCount(0);
    setPhase("countingStart");
    await playSubtractionStoryCount(5, lang, setStartCount, runRef, runId, prefersReducedMotion);
    if (runRef.current !== runId) return;
    await speakMathCue("minus", lang);
    setPhase("takingAway");
    for (let value = 1; value <= 5; value += 1) {
      setSharedCount(value);
      speakNumber(value, lang);
      await wait(prefersReducedMotion ? 150 : COUNTING_STEP_MS);
      if (runRef.current !== runId) return;
    }
    await speakMathCue("equals", lang);
    setPhase("countingLeft");
    await playSubtractionStoryCount(0, lang, () => undefined, runRef, runId, prefersReducedMotion);
    if (runRef.current === runId) setPhase("done");
  };
  const left = 5 - sharedCount;
  const instruction = phase === "ready" ? (lang === "en" ? "Chrys has 5 bananas. Five hungry friends arrive." : "Chrys ada 5 pisang. Lima kawan yang lapar datang.") : phase === "countingStart" ? (lang === "en" ? "Count Chrys's 5 bananas." : "Kira 5 pisang Chrys.") : phase === "takingAway" ? (lang === "en" ? "Chrys gives one banana to each friend." : "Chrys memberi satu pisang kepada setiap kawan.") : (lang === "en" ? "Chrys's basket is empty. 0 bananas are left." : "Bakul Chrys kosong. Tinggal 0 pisang.");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-5 text-center"><h3 className="text-3xl font-black text-blue-950">{lang === "en" ? "Chrys shares all his bananas" : "Chrys berkongsi semua pisangnya"}</h3><p className="mt-2 text-lg font-black text-slate-700">{instruction}</p></div>
      <div className="rounded-[2rem] border-4 border-white bg-white p-5 shadow-[0_7px_0_rgba(0,0,0,.12)]">
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-4 text-center"><h4 className="text-xl font-black text-amber-900">{lang === "en" ? "Chrys's basket" : "Bakul Chrys"}</h4><div className="mt-4 flex min-h-40 flex-wrap items-center justify-center gap-3 rounded-3xl bg-white p-4">{Array.from({ length: 5 }, (_, index) => { const active = phase === "countingStart" && index + 1 === startCount; return index >= sharedCount && <div key={index} className={`relative grid h-20 w-16 place-items-center rounded-2xl border-2 ${active ? "border-yellow-400 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "border-blue-200 bg-blue-50"}`}><SpriteIcon value={BANANA} className="h-12 w-12" />{phase === "countingStart" && index < startCount && <span className={`absolute -top-2 rounded-full px-2 text-xs font-black ${active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>{index + 1}</span>}</div>; })}</div><p className="mt-3 text-2xl font-black text-amber-950">{lang === "en" ? `${left} left` : `Tinggal ${left}`}</p></section>
          <section className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center"><h4 className="text-xl font-black text-emerald-900">{lang === "en" ? "Five hungry friends" : "Lima kawan yang lapar"}</h4><div className="mt-4 grid grid-cols-5 gap-2">{Array.from({ length: 5 }, (_, index) => <div key={index} className={`rounded-2xl border-2 p-2 transition-all ${index < sharedCount ? "border-yellow-400 bg-yellow-100" : "border-slate-200 bg-white"}`}><span className="text-3xl" aria-hidden="true">{friend}</span><div className="mt-2 grid h-10 place-items-center">{index < sharedCount ? <SpriteIcon value={BANANA} className="h-9 w-9" /> : <span className="text-xs font-black text-slate-400">{index + 1}</span>}</div></div>)}</div></section>
        </div>
        {phase === "done" && <div className="mt-5 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center"><p className="text-4xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>5 - 5 = 0</p><p className="mt-2 text-xl font-black text-emerald-950">{lang === "en" ? "Subtracting everything leaves zero." : "Menolak semuanya meninggalkan sifar."}</p></div>}
        <div className="mt-5 flex justify-center"><button type="button" disabled={running} onClick={() => phase === "done" ? reset() : void start()} className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-4 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] disabled:opacity-60">{running ? (lang === "en" ? "Sharing..." : "Berkongsi...") : phase === "done" ? (lang === "en" ? "Show again" : "Lihat lagi") : (lang === "en" ? "Start the story" : "Mula cerita")}</button></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><PreviousLessonButton label={t.previous} onClick={phase === "ready" ? onPrev : reset} /><div className="flex flex-wrap justify-end gap-3">{actions.map((action) => <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />)}<LessonNextButton label={t.practice} onClick={onDone} disabled={phase !== "done"} /></div></div>
    </div>
  );
}

function ZeroAdditionBeat({ step, onStepChange: _onStepChange, lang }: {
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  lang: Lang;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [alyseCounted, setAlyseCounted] = useState(step === 3 ? 4 : 0);
  const [alyseCounting, setAlyseCounting] = useState(false);
  const alyseCountRunRef = useRef(0);

  useEffect(() => {
    const runId = ++alyseCountRunRef.current;
    stopNumberAudio();
    setAlyseCounting(false);

    if (step === 1) {
      setAlyseCounted(0);
      const timer = window.setTimeout(() => {
        if (alyseCountRunRef.current === runId) speakNumber(0, lang);
      }, 300);
      return () => {
        window.clearTimeout(timer);
        alyseCountRunRef.current += 1;
        stopNumberAudio();
      };
    } else if (step === 2) {
      setAlyseCounted(0);
    } else {
      setAlyseCounted(4);
    }

    return () => {
      alyseCountRunRef.current += 1;
      stopNumberAudio();
    };
  }, [lang, step]);

  const countAlyseBananas = async () => {
    if (alyseCounting) return;
    const runId = ++alyseCountRunRef.current;
    setAlyseCounting(true);
    setAlyseCounted(0);
    stopNumberAudio();
    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(4, lang, COUNTING_STEP_MS, (value) => {
        if (alyseCountRunRef.current === runId) setAlyseCounted(value);
      });
    } else {
      for (let value = 1; value <= 4; value += 1) {
        if (alyseCountRunRef.current !== runId) return;
        setAlyseCounted(value);
        await wait(prefersReducedMotion ? 80 : COUNTING_STEP_MS);
      }
    }
    if (alyseCountRunRef.current !== runId) return;
    setAlyseCounted(4);
    setAlyseCounting(false);
    if (!audioMuted) {
      speakText(
        lang === "en" ? "Alyse has 4 bananas." : "Alyse ada 4 pisang.",
        lang,
      );
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-5">
        <p className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-4 text-center text-xl font-black text-blue-950">
          {lang === "en" ? "Look at Chrys's basket." : "Lihat bakul Chrys."}
        </p>
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex justify-center">
            <img src={chrysHappy} alt="Chrys" className="h-36 w-36 object-contain" />
          </div>
          <div>
            <ContainerScene
              count={0}
              emoji="🍌"
              container="basket"
              hideEmptyLabel
              label={lang === "en" ? "Chrys's basket" : "Bakul Chrys"}
            />
            <p className="mt-3 text-center text-2xl font-black text-blue-950">
              {lang === "en" ? "Chrys has 0 bananas." : "Chrys ada 0 pisang."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-5">
        <p className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-4 text-center text-xl font-black text-blue-950">
          {lang === "en" ? "Now count Alyse's bananas." : "Sekarang kira pisang Alyse."}
        </p>
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex justify-center">
            <img src={alyseGuide} alt="Alyse" className="h-32 w-32 object-contain" />
          </div>
          <div>
             <BasketBananaScene
               count={4}
               counted={alyseCounted}
               isCounting={alyseCounting}
               label={lang === "en" ? "Alyse's basket" : "Bakul Alyse"}
             />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => void countAlyseBananas()}
                disabled={alyseCounting}
                className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1 disabled:cursor-wait disabled:opacity-70"
              >
                {alyseCounting
                  ? (lang === "en" ? "Counting..." : "Mengira...")
                  : alyseCounted === 4
                    ? (lang === "en" ? "Count again" : "Kira lagi")
                    : (lang === "en" ? "Count 4 bananas" : "Kira 4 pisang")}
                <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                  <PointerIcon />
                </span>
              </button>
            </div>
            <p className="mt-3 min-h-8 text-center text-2xl font-black text-emerald-900" aria-live="polite">
              {alyseCounted === 4
                ? (lang === "en" ? "Alyse has 4 bananas." : "Alyse ada 4 pisang.")
                : alyseCounted > 0
                  ? (lang === "en" ? `Count: ${alyseCounted}` : `Kira: ${alyseCounted}`)
                  : <span aria-hidden="true">&nbsp;</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-4 text-center text-xl font-black text-blue-950">
        {lang === "en" ? "Put both baskets together." : "Gabungkan kedua-dua bakul."}
      </p>
      <ZeroAdditionEquation lang={lang} />
    </div>
  );
}

function ZeroAdditionEquation({ lang }: { lang: Lang }) {
  const manualStepMode = true;
  const banana = String.fromCodePoint(0x1f34c);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [sourceZeroVisible, setSourceZeroVisible] = useState(false);
  const [sourceVisibleBananas, setSourceVisibleBananas] = useState(0);
  const [sourceActiveBanana, setSourceActiveBanana] = useState<number | null>(null);
  const [zeroVisible, setZeroVisible] = useState(false);
  const [visibleBananas, setVisibleBananas] = useState(0);
  const [activePart, setActivePart] = useState<
    "source-zero" | "source-plus" | "source-bananas" | "source-equals" |
    "zero" | "plus" | "bananas" | "merge" | null
  >(null);
  const [activeBanana, setActiveBanana] = useState<number | null>(null);
  const [mergeStage, setMergeStage] = useState<"split" | "cue" | "joining" | "joined">("split");
  const [hasStarted, setHasStarted] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const [countRun, setCountRun] = useState(0);
  const manualCountRunRef = useRef(0);

  useEffect(() => {
    if (manualStepMode) return;
    if (!hasStarted) return;
    let cancelled = false;
    const intervalMs = 1400;

    const runSequence = async () => {
      setIsCounting(true);
      stopNumberAudio();
      setSourceZeroVisible(false);
      setSourceVisibleBananas(0);
      setSourceActiveBanana(null);
      setZeroVisible(false);
      setVisibleBananas(0);
      setActivePart("source-zero");
      setActiveBanana(null);
      setMergeStage("split");

      if (audioMuted) {
        setSourceZeroVisible(true);
        await wait(prefersReducedMotion ? 0 : intervalMs);
      } else {
        await speakNumberValuesSequence([0], lang, intervalMs, () => {
          if (!cancelled) setSourceZeroVisible(true);
        });
      }
      if (cancelled) return;

      setActivePart("source-plus");
      await wait(prefersReducedMotion ? 0 : 180);
      await speakMathCue("plus", lang);
      await wait(prefersReducedMotion ? 0 : 450);
      if (cancelled) return;

      setActivePart("source-bananas");
      if (audioMuted) {
        if (prefersReducedMotion) {
          setSourceVisibleBananas(4);
        } else {
          for (let value = 1; value <= 4; value += 1) {
            if (cancelled) return;
            setSourceVisibleBananas(value);
            setSourceActiveBanana(value - 1);
            await wait(intervalMs);
            setSourceActiveBanana(null);
          }
        }
      } else {
        await speakCountingSequence(
          4,
          lang,
          intervalMs,
          (value) => {
            if (cancelled) return;
            setSourceVisibleBananas(value);
            setSourceActiveBanana(value - 1);
          },
          (value) => {
            if (cancelled) return;
            setSourceActiveBanana((current) => current === value - 1 ? null : current);
          },
        );
      }
      if (cancelled) return;
      setSourceActiveBanana(null);

      setActivePart("source-equals");
      await wait(prefersReducedMotion ? 0 : 180);
      await speakMathCue("equals", lang);
      await wait(prefersReducedMotion ? 0 : 450);
      if (cancelled) return;

      // The result is one combined group. Reveal the zero silently, then count
      // the objects straight through without inserting another "plus" cue.
      setActivePart("zero");
      setZeroVisible(true);
      await wait(prefersReducedMotion ? 0 : 300);
      if (cancelled) return;

      setMergeStage("split");
      setActivePart("bananas");
      if (audioMuted) {
        if (prefersReducedMotion) {
          setVisibleBananas(4);
        } else {
          for (let value = 1; value <= 4; value += 1) {
            if (cancelled) return;
            setVisibleBananas(value);
            setActiveBanana(value - 1);
            await wait(intervalMs);
            setActiveBanana(null);
          }
        }
      } else {
        await speakCountingSequence(
          4,
          lang,
          intervalMs,
          (value) => {
            if (cancelled) return;
            setVisibleBananas(value);
            setActiveBanana(value - 1);
          },
          (value) => {
            if (cancelled) return;
            setActiveBanana((current) => current === value - 1 ? null : current);
          },
        );
      }
      if (cancelled) return;

      setActiveBanana(null);
      setActivePart("merge");
      await wait(prefersReducedMotion ? 0 : 350);
      setMergeStage("joining");
      await wait(prefersReducedMotion ? 0 : 1100);
      if (cancelled) return;
      setMergeStage("joined");
      await speakBananaTotal(4, lang);
      if (cancelled) return;
      setActivePart(null);
      if (!audioMuted) {
        speakText(lang === "en" ? "The answer is 4." : "Jawapannya ialah 4.", lang);
      }
      await wait(WORD_AUDIO_ENABLED && !audioMuted ? 1800 : 300);
      if (cancelled) return;
      setIsCounting(false);
    };

    void runSequence();
    return () => {
      cancelled = true;
      stopNumberAudio();
    };
  }, [countRun, hasStarted, lang, prefersReducedMotion]);

  useEffect(() => () => {
    manualCountRunRef.current += 1;
    stopNumberAudio();
  }, []);

  const countBananaGroup = async (
    setVisible: React.Dispatch<React.SetStateAction<number>>,
    setActive: React.Dispatch<React.SetStateAction<number | null>>,
    runId: number,
  ) => {
    setVisible(0);
    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(4, lang, COUNTING_STEP_MS, (value) => {
        if (manualCountRunRef.current !== runId) return;
        setVisible(value);
        setActive(value - 1);
      });
    } else {
      for (let value = 1; value <= 4; value += 1) {
        if (manualCountRunRef.current !== runId) return;
        setVisible(value);
        setActive(value - 1);
        await wait(prefersReducedMotion ? 80 : COUNTING_STEP_MS);
      }
    }
    if (manualCountRunRef.current === runId) setActive(null);
  };

  const startCounting = async () => {
    if (isCounting) return;
    const runId = manualCountRunRef.current + 1;
    manualCountRunRef.current = runId;
    setIsCounting(true);
    setHasStarted(true);
    stopNumberAudio();

    if (mergeStage === "joined") {
      setSourceZeroVisible(false);
      setSourceVisibleBananas(0);
      setSourceActiveBanana(null);
      setZeroVisible(false);
      setVisibleBananas(0);
      setActiveBanana(null);
      setMergeStage("split");
    }

    if (!sourceZeroVisible || mergeStage === "joined") {
      setActivePart("source-zero");
      setSourceZeroVisible(true);
      await speakNumber(0, lang);
      if (manualCountRunRef.current !== runId) return;
      setActivePart("source-plus");
      await speakMathCue("plus", lang);
      if (manualCountRunRef.current !== runId) return;
      setActivePart("source-bananas");
    } else if (sourceVisibleBananas < 4) {
      setActivePart("source-bananas");
      await countBananaGroup(setSourceVisibleBananas, setSourceActiveBanana, runId);
      if (manualCountRunRef.current !== runId) return;
      setSourceVisibleBananas(4);
      setActivePart("source-equals");
      await speakMathCue("equals", lang);
      if (manualCountRunRef.current !== runId) return;
      setZeroVisible(true);
      setActivePart("bananas");
    } else if (visibleBananas < 4) {
      setActivePart("bananas");
      await countBananaGroup(setVisibleBananas, setActiveBanana, runId);
      if (manualCountRunRef.current !== runId) return;
      setVisibleBananas(4);
      setActivePart("merge");
      setMergeStage("joining");
      await wait(prefersReducedMotion ? 0 : 500);
      if (manualCountRunRef.current !== runId) return;
      setMergeStage("joined");
      setActivePart(null);
      await speakBananaTotal(4, lang);
      if (manualCountRunRef.current !== runId) return;
      if (!audioMuted) speakText(lang === "en" ? "The answer is 4." : "Jawapannya ialah 4.", lang);
    }
    setIsCounting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => void startCounting()}
          disabled={isCounting}
          className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1 disabled:cursor-wait disabled:opacity-70"
        >
          {isCounting
            ? (lang === "en" ? "Counting..." : "Mengira...")
            : mergeStage === "joined"
              ? (lang === "en" ? "Count Again!" : "Kira Lagi!")
              : !sourceZeroVisible
                ? (lang === "en" ? "Start counting" : "Mula mengira")
                : (lang === "en" ? "Count 4 bananas" : "Kira 4 pisang")}
          {!isCounting && (
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
              <PointerIcon />
            </span>
          )}
        </button>
      </div>

      <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div
          aria-current={activePart === "source-zero" ? "step" : undefined}
          className={`flex min-h-[35rem] min-w-0 flex-col rounded-3xl border-2 p-4 shadow-[0_4px_0_rgba(0,0,0,.08)] transition-[border-color,background-color,opacity,filter,box-shadow] duration-300 ${
            activePart === "source-zero"
              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200"
              : !hasStarted
                ? "border-slate-200 bg-slate-100 opacity-50 grayscale"
                : "border-emerald-300 bg-white"
          }`}
        >
          <div className="grid flex-1 place-items-center">
            <div className="text-center">
              <span
                className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-4xl font-black transition-[background-color,color,opacity,transform] duration-300 ${
                  sourceZeroVisible
                    ? "scale-100 bg-blue-600 text-white opacity-100"
                    : "scale-75 bg-slate-200 text-slate-400 opacity-45"
                }`}
                style={NUMBER_TEXT_STYLE}
              >
                0
              </span>
            </div>
          </div>
          <div
            className={`mx-auto mt-4 flex min-h-16 min-w-40 max-w-full items-center justify-center self-center rounded-full px-6 py-3 text-center text-xl font-black transition-colors ${
              sourceZeroVisible ? "bg-emerald-100 text-emerald-950" : "bg-slate-200 text-slate-400"
            }`}
            aria-live="polite"
          >
            {lang === "en" ? "No Bananas" : "Tiada Pisang"}
          </div>
        </div>

        <span
          data-math-cue="plus"
          className={`grid h-14 w-14 place-items-center self-center justify-self-center rounded-2xl border-2 text-4xl font-black transition-[background-color,border-color,color,box-shadow,transform] duration-300 ${
            activePart === "source-plus"
              ? "scale-110 border-yellow-500 bg-yellow-300 text-blue-950 ring-4 ring-yellow-100 shadow-[0_4px_0_#d97706]"
              : sourceZeroVisible
                ? "border-yellow-400 bg-yellow-100 text-blue-950 shadow-[0_4px_0_#d97706]"
                : "border-slate-200 bg-slate-100 text-slate-300 shadow-[0_3px_0_#cbd5e1]"
          }`}
          aria-label={lang === "en" ? "plus" : "tambah"}
        >
          +
        </span>

        <div
          aria-current={activePart === "source-bananas" ? "step" : undefined}
          className={`flex min-h-[35rem] min-w-0 flex-col rounded-3xl border-2 p-4 shadow-[0_4px_0_rgba(0,0,0,.08)] transition-[border-color,background-color,opacity,filter,box-shadow] duration-300 ${
            activePart === "source-bananas"
              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200"
              : sourceVisibleBananas === 4
                ? "border-emerald-300 bg-white"
                : "border-slate-200 bg-slate-100 opacity-50 grayscale"
          }`}
        >
          <div className="flex flex-1 items-center justify-center">
            <div className="grid w-40 grid-cols-2 place-items-center gap-x-6 gap-y-4">
              {Array.from({ length: 4 }, (_, objectIndex) => {
                const counted = objectIndex < sourceVisibleBananas;
                const current = sourceActiveBanana === objectIndex;
                const groupComplete = sourceVisibleBananas === 4 && sourceActiveBanana === null;
                return (
                  <div
                    key={objectIndex}
                    className={`relative flex h-24 w-16 items-center justify-center rounded-2xl border-2 pt-4 transition-[background-color,border-color,filter,opacity,transform,box-shadow] duration-300 ${
                      current
                        ? "scale-105 border-yellow-500 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
                        : groupComplete
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : counted
                            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                            : "border-transparent bg-amber-50 opacity-55 grayscale"
                    }`}
                  >
                    <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm transition-opacity ${current ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"} ${counted ? "opacity-100" : "opacity-0"}`}>
                      {objectIndex + 1}
                    </span>
                    <SpriteIcon value={banana} className={`h-12 w-12 transition-transform duration-300 ${current ? "scale-110" : ""}`} />
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className={`mx-auto mt-4 min-h-16 w-full rounded-full px-4 py-3 text-center text-xl font-black transition-colors ${
              sourceVisibleBananas === 4 ? "bg-emerald-100 text-emerald-950" : "bg-slate-200 text-transparent"
            }`}
            aria-live="polite"
          >
            {sourceVisibleBananas === 4
              ? `${lang === "en" ? "Total" : "Jumlah"}: 4 ${lang === "en" ? "bananas" : "pisang"}`
              : <span aria-hidden="true">&nbsp;</span>}
          </div>
        </div>

        <span
          data-math-cue="equals"
          className={`grid h-14 w-14 place-items-center self-center justify-self-center rounded-2xl border-2 text-4xl font-black transition-[background-color,border-color,color,box-shadow,transform] duration-300 ${
            activePart === "source-equals"
              ? "scale-110 border-yellow-500 bg-yellow-300 text-blue-950 ring-4 ring-yellow-100 shadow-[0_4px_0_#d97706]"
              : sourceVisibleBananas === 4
                ? "border-yellow-400 bg-yellow-100 text-blue-950 shadow-[0_4px_0_#d97706]"
                : "border-slate-200 bg-slate-100 text-slate-300 shadow-[0_3px_0_#cbd5e1]"
          }`}
          aria-label={lang === "en" ? "equals" : "sama dengan"}
        >
          =
        </span>

        <div
        className={`flex min-h-[35rem] min-w-0 flex-col rounded-3xl border-2 p-4 shadow-[0_4px_0_rgba(0,0,0,.08)] transition-[border-color,background-color,box-shadow,transform] duration-700 ease-out ${
          mergeStage === "joining"
            ? "scale-[1.025] border-yellow-400 bg-yellow-50 ring-8 ring-yellow-200 shadow-[0_0_36px_rgba(250,204,21,.55)]"
            : mergeStage === "joined"
              ? "border-emerald-400 bg-white ring-4 ring-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,.24)]"
              : "border-emerald-300 bg-white"
        }`}
      >
        <div
          aria-current={activePart === "zero" ? "step" : undefined}
          className={`grid overflow-hidden rounded-2xl border-2 transition-[max-height,min-height,opacity,transform,padding,border-color,background-color,box-shadow] ease-out ${
            mergeStage === "joining" || mergeStage === "joined"
              ? "max-h-0 min-h-0 scale-95 border-transparent p-0 opacity-0 duration-500"
              : `max-h-44 min-h-36 p-4 opacity-100 duration-700 ${
                  activePart === "zero"
                    ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200"
                    : "border-emerald-200 bg-emerald-50"
                }`
          }`}
        >
          <div className="place-self-center text-center">
            <span
              className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-4xl font-black transition-[background-color,color,opacity,transform] duration-300 ${
                zeroVisible ? "scale-100 bg-blue-600 text-white opacity-100" : "scale-75 bg-slate-200 text-slate-400 opacity-45"
              }`}
              style={NUMBER_TEXT_STYLE}
            >
              0
            </span>
            <span className={`mt-3 block text-xl font-black transition-colors ${zeroVisible ? "text-blue-950" : "text-slate-400"}`}>
              {lang === "en" ? "No Bananas" : "Tiada Pisang"}
            </span>
          </div>
        </div>

        <div
          className={`grid place-items-center overflow-hidden transition-[max-height,opacity,transform,padding] ${
            mergeStage === "joining" || mergeStage === "joined"
              ? "max-h-0 scale-50 p-0 opacity-0 duration-200"
              : "max-h-24 scale-100 py-5 opacity-100 duration-300"
          }`}
        >
          <span
            data-math-cue="plus"
            className={`grid h-14 w-14 place-items-center rounded-2xl border-2 text-4xl font-black transition-[background-color,border-color,color,box-shadow,transform] duration-300 ${
              activePart === "plus" || mergeStage === "cue"
                ? "scale-110 border-yellow-500 bg-yellow-300 text-blue-950 ring-4 ring-yellow-100 shadow-[0_4px_0_#d97706]"
                : zeroVisible
                  ? "border-yellow-400 bg-yellow-100 text-blue-950 shadow-[0_4px_0_#d97706]"
                  : "border-slate-200 bg-slate-100 text-slate-300 shadow-[0_3px_0_#cbd5e1]"
            }`}
            aria-label={lang === "en" ? "plus" : "tambah"}
          >
            +
          </span>
        </div>

        <div
          aria-current={activePart === "bananas" ? "step" : undefined}
          className={`flex flex-1 flex-col rounded-2xl border-2 p-4 transition-[border-color,background-color,box-shadow,transform,border-radius] duration-700 ease-out ${
            activePart === "bananas"
              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200"
              : mergeStage === "joined"
                ? "border-transparent bg-white"
                : "border-emerald-200 bg-white"
          }`}
        >
          <div className="flex flex-1 items-center justify-center">
            <div className="grid w-40 grid-cols-2 place-items-center gap-x-6 gap-y-4">
              {Array.from({ length: 4 }, (_, objectIndex) => {
                const counted = objectIndex < visibleBananas;
                const current = activeBanana === objectIndex;
                const groupComplete = visibleBananas === 4 && activeBanana === null;
                return (
                  <div
                    key={objectIndex}
                    className={`relative flex h-24 w-16 items-center justify-center rounded-2xl border-2 pt-4 transition-[background-color,border-color,filter,opacity,transform,box-shadow] duration-300 ${
                      current
                        ? "scale-105 border-yellow-500 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
                        : groupComplete
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : counted
                            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                            : "border-transparent bg-amber-50 opacity-55 grayscale"
                    }`}
                  >
                    <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm transition-opacity ${current ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"} ${counted ? "opacity-100" : "opacity-0"}`}>
                      {objectIndex + 1}
                    </span>
                    <SpriteIcon value={banana} className={`h-12 w-12 transition-transform duration-300 ${current ? "scale-110" : ""}`} />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div
          className={`mx-auto mt-4 flex min-h-16 min-w-40 max-w-full items-center justify-center self-center rounded-full px-6 py-3 text-center text-lg font-black transition-[background-color,color,opacity,transform] duration-500 sm:text-xl ${
            mergeStage === "joined"
              ? "scale-100 bg-emerald-100 text-emerald-950 opacity-100"
              : "scale-95 bg-slate-200 text-transparent opacity-55"
          }`}
          aria-live="polite"
        >
          {mergeStage === "joined"
            ? `${lang === "en" ? "Total" : "Jumlah"}: 4 ${lang === "en" ? "bananas" : "pisang"}`
            : <span aria-hidden="true">&nbsp;</span>}
        </div>
      </div>
      </div>

      {mergeStage === "joined" && (
        <div className="text-center text-emerald-900">
          <p className="text-4xl font-black" style={NUMBER_TEXT_STYLE}>0 + 4 = 4</p>
          <p className="mt-2 text-xl font-black">
            {lang === "en"
              ? "0 bananas plus 4 bananas equals 4 bananas."
              : "0 pisang tambah 4 pisang sama dengan 4 pisang."}
          </p>
        </div>
      )}
    </div>
  );
}

function BasketBananaScene({ count, counted, isCounting, label }: {
  count: number;
  counted: number;
  isCounting: boolean;
  label: string;
}) {
  const banana = String.fromCodePoint(0x1f34c);
  const positions = [
    ["left-[37%]", "top-[36%]", "-rotate-12"],
    ["left-[63%]", "top-[36%]", "rotate-12"],
    ["left-[37%]", "top-[64%]", "rotate-6"],
    ["left-[63%]", "top-[64%]", "-rotate-6"],
  ];

  return (
    <div className="mx-auto max-w-xl rounded-3xl border-4 border-amber-200 bg-white p-4">
      <div className="relative mx-auto aspect-[4/3] max-h-80 overflow-hidden rounded-3xl bg-amber-50">
        <img src={BASKET_SPRITE} alt="basket" className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute inset-0">
          {Array.from({ length: count }, (_, index) => {
            const [x, y, rotation] = positions[index];
            const isCounted = index < counted;
            const isActiveCount = isCounting && counted > 0 && index === counted - 1;
            return (
              <div
                key={index}
                className={`absolute ${x} ${y} ${rotation} grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 transition-[border-color,background-color,box-shadow,transform] duration-300 ${
                  isActiveCount
                    ? "border-yellow-400 bg-white/80 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
                    : isCounted
                      ? "border-blue-600 bg-blue-100/60 ring-4 ring-blue-200 shadow-md"
                    : "border-white/90 bg-white/80 shadow-lg"
                }`}
              >
                <SpriteIcon value={banana} className="h-20 w-20 drop-shadow-lg" />
                {isCounted && (
                  <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-md ${isActiveCount ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
                    {index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center text-xl font-black text-amber-900">{label}</p>
    </div>
  );
}

function AdditionBananaEquation({
  lang,
  a = ADDITION_EQUATION_GROUPS[0],
  b = ADDITION_EQUATION_GROUPS[1],
  emoji = String.fromCodePoint(0x1f34c),
  autoStart = false,
  cyber = false,
}: {
  lang: Lang;
  a?: number;
  b?: number;
  emoji?: string;
  autoStart?: boolean;
  cyber?: boolean;
}) {
  const groups = [a, b, a + b];
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleCounts, setVisibleCounts] = useState([0, 0, 0]);
  const [completedGroups, setCompletedGroups] = useState(0);
  const [activeGroup, setActiveGroup] = useState(-1);
  const [completedSigns, setCompletedSigns] = useState(0);
  const [activeSign, setActiveSign] = useState(-1);
  const [activeBanana, setActiveBanana] = useState<{ groupIndex: number; objectIndex: number } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const [resultMergeStage, setResultMergeStage] = useState<"split" | "cue" | "joining" | "joined">("split");
  const countRunRef = useRef(0);
  const labels = groups.map((count) => `${count} ${objectName(emoji, count, lang)}`);

  useEffect(() => {
    countRunRef.current += 1;
    stopNumberAudio();
    setVisibleCounts([0, 0, 0]);
    setCompletedGroups(0);
    setActiveGroup(-1);
    setCompletedSigns(0);
    setActiveSign(-1);
    setActiveBanana(null);
    setResultMergeStage("split");
    setHasStarted(false);
    setIsCounting(false);
    return () => {
      countRunRef.current += 1;
      stopNumberAudio();
    };
  }, [a, b, emoji, lang]);

  const startCounting = async () => {
    if (isCounting) return;
    const runId = countRunRef.current + 1;
    countRunRef.current = runId;
    setIsCounting(true);
    setHasStarted(true);
    stopNumberAudio();
    setVisibleCounts([0, 0, 0]);
    setCompletedGroups(0);
    setCompletedSigns(0);
    setActiveSign(-1);
    setActiveBanana(null);
    setResultMergeStage("split");

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await playRecordedVoiceFile(COUNT_PROMPT_AUDIO_FILES[lang]);
      if (countRunRef.current !== runId) return;
    }

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const groupCount = groups[groupIndex];
      setActiveGroup(groupIndex);
      setVisibleCounts((current) => current.map((value, index) => index === groupIndex ? 0 : value));

      const revealCount = (value: number) => {
        if (countRunRef.current !== runId) return;
        setActiveBanana({ groupIndex, objectIndex: value - 1 });
        setVisibleCounts((current) => current.map((count, index) => index === groupIndex ? value : count));
      };

      if (groupCount === 0) {
        await speakNumber(0, lang);
      } else if (NUMBER_AUDIO_ENABLED && !audioMuted) {
        await speakCountingSequence(groupCount, lang, COUNTING_STEP_MS, revealCount);
      } else {
        for (let value = 1; value <= groupCount; value += 1) {
          if (countRunRef.current !== runId) return;
          revealCount(value);
          await wait(prefersReducedMotion ? 80 : COUNTING_STEP_MS);
        }
      }
      if (countRunRef.current !== runId) return;

      setActiveBanana(null);
      setCompletedGroups(groupIndex + 1);
      await speakRecordedBananaTotal(groupCount, lang, emoji);
      if (countRunRef.current !== runId) return;

      if (groupIndex < groups.length - 1) {
        setActiveSign(groupIndex);
        if (groupIndex === 1) {
          await speakMathCue("equals", lang);
          if (countRunRef.current !== runId) return;
        } else {
          await wait(prefersReducedMotion ? 0 : 100);
        }
        setCompletedSigns(groupIndex + 1);
        setActiveSign(-1);
        if (groupIndex === 1) {
          setResultMergeStage("joining");
          await wait(prefersReducedMotion ? 0 : 500);
          if (countRunRef.current !== runId) return;
          setResultMergeStage("joined");
        }
      }
    }

    setActiveGroup(-1);
    setIsCounting(false);
  };

  const renderBanana = (groupIndex: number, countIndex: number) => {
    const counted = countIndex < visibleCounts[groupIndex];
    const groupComplete = visibleCounts[groupIndex] >= groups[groupIndex];
    const currentBanana = activeBanana?.groupIndex === groupIndex && activeBanana.objectIndex === countIndex;
    return (
      <div
        key={`${groupIndex}-${countIndex}`}
        className={`relative flex h-20 w-12 shrink-0 items-center justify-center rounded-2xl border-2 pt-3 shadow-inner transition-[background-color,border-color,filter,opacity,transform,box-shadow] duration-300 sm:h-24 sm:w-14 sm:pt-4 ${
          currentBanana
            ? cyber
              ? "scale-105 border-yellow-200 bg-cyan-950 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]"
              : "scale-105 border-yellow-500 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
            : groupComplete
              ? cyber
                ? "border-cyan-400 bg-cyan-950 ring-2 ring-cyan-700"
                : "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
            : counted
              ? cyber
                ? "border-cyan-400 bg-cyan-950 ring-2 ring-cyan-700"
                : "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
              : cyber
                ? "border-cyan-900 bg-slate-900 opacity-45 grayscale"
                : "border-transparent bg-amber-50 opacity-55 grayscale"
        }`}
      >
        <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm transition-opacity ${currentBanana ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"} ${counted ? "opacity-100" : "opacity-0"}`}>
          {countIndex + 1}
        </span>
        <SpriteIcon value={emoji} className={`h-10 w-10 transition-[filter,transform] duration-300 sm:h-12 sm:w-12 ${currentBanana ? "scale-110 drop-shadow-lg" : ""}`} />
      </div>
    );
  };

  const renderBananaRows = (groupIndex: number, count: number, countOffset = 0) => (
    <div className="flex w-full flex-col items-center justify-center gap-5 py-4 sm:gap-6">
      {balancedIndexRows(count, 3).map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center justify-center gap-2 sm:gap-3">
          {row.map((rowObjectIndex) => renderBanana(groupIndex, countOffset + rowObjectIndex))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => void startCounting()}
          disabled={isCounting}
          className={`relative rounded-2xl border-2 px-7 py-3 text-xl font-black text-white active:translate-y-1 disabled:cursor-wait disabled:opacity-70 ${cyber ? "border-cyan-300 bg-cyan-700 shadow-[0_6px_0_#164e63,0_0_18px_rgba(34,211,238,.20)]" : "border-blue-700 bg-blue-600 shadow-[0_6px_0_#1e3a8a]"}`}
        >
          {isCounting
            ? (lang === "en" ? "Counting..." : "Mengira...")
            : completedGroups === groups.length
              ? (lang === "en" ? "Count Again!" : "Kira Lagi!")
              : (lang === "en" ? "Count all bananas" : "Kira semua pisang")}
          {!isCounting && (
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
              <PointerIcon />
            </span>
          )}
        </button>
      </div>
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {groups.map((count, index) => (
          <React.Fragment key={`${index}-${count}`}>
            {index > 0 && (
              <span
                data-math-cue={index === 1 ? "plus" : "equals"}
                className={`grid h-14 w-14 place-items-center justify-self-center rounded-2xl border-2 text-4xl font-black transition-[background-color,border-color,color,box-shadow] duration-300 ${
                   activeSign === index - 1
                    ? cyber
                      ? "border-yellow-300 bg-yellow-300 text-slate-950 ring-4 ring-yellow-300/20 shadow-[0_4px_0_#a16207]"
                      : "border-yellow-500 bg-yellow-300 text-blue-950 ring-4 ring-yellow-100 shadow-[0_4px_0_#d97706]"
                    : completedSigns >= index
                      ? cyber
                        ? "border-yellow-300 bg-yellow-300 text-slate-950 shadow-[0_4px_0_#a16207]"
                        : "border-yellow-400 bg-yellow-200 text-blue-950 shadow-[0_4px_0_#d97706]"
                      : cyber
                        ? "border-slate-700 bg-slate-900 text-slate-600 shadow-[0_3px_0_#020617]"
                        : "border-slate-200 bg-slate-100 text-slate-300 shadow-[0_3px_0_#cbd5e1]"
                }`}
                aria-hidden="true"
              >
                {index === 1 ? "+" : "="}
              </span>
            )}
            <div
              aria-current={activeGroup === index ? "step" : undefined}
              className={`relative flex h-full min-h-[25rem] flex-col rounded-2xl border-2 p-3 shadow-[0_3px_0_rgba(0,0,0,.08)] transition-[border-color,background-color,opacity,filter,box-shadow,transform] duration-700 ease-out ${
                  index === 2 && resultMergeStage === "joining"
                    ? cyber
                      ? "scale-[1.025] border-yellow-300 bg-yellow-300/10 ring-8 ring-yellow-300/20 shadow-[0_0_36px_rgba(250,204,21,.35)]"
                      : "scale-[1.025] border-yellow-400 bg-yellow-50 ring-8 ring-yellow-200 shadow-[0_0_36px_rgba(250,204,21,.55)]"
                    : index === 2 && resultMergeStage === "joined"
                      ? cyber
                        ? "border-emerald-300 bg-emerald-950/70 ring-4 ring-emerald-500/20 shadow-[0_8px_24px_rgba(16,185,129,.20)]"
                        : "border-emerald-400 bg-emerald-50 ring-4 ring-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,.24)]"
                      : activeGroup === index
                    ? cyber
                      ? "border-cyan-300 bg-cyan-950/70 ring-4 ring-cyan-500/20"
                      : "border-blue-500 bg-blue-50 ring-4 ring-blue-200"
                    : !hasStarted || (index > activeGroup && completedGroups <= index)
                      ? cyber
                        ? "border-slate-800 bg-slate-950 opacity-45 grayscale"
                        : "border-slate-200 bg-slate-100 opacity-50 grayscale"
                      : cyber
                        ? "border-emerald-700 bg-slate-950/85"
                        : "border-emerald-300 bg-white"
              }`}
            >
              <div className="flex flex-1 items-center justify-center">
                {index === 2 ? (
                  <div
                    className={`relative grid w-full transition-[gap] duration-1000 ease-in-out ${
                      resultMergeStage === "split" || resultMergeStage === "cue"
                        ? "gap-6 sm:gap-8"
                        : "gap-0"
                    }`}
                  >
                    {resultMergeStage === "joined" ? (
                      <div className="relative z-10 grid w-full place-items-center rounded-2xl border-2 border-transparent bg-transparent p-2 shadow-none animate-[fadeIn_.35s_ease-out]">
                        {renderBananaRows(index, count)}
                      </div>
                    ) : (
                      <>
                        {resultMergeStage === "joining" && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/70 ring-8 ring-yellow-200/70 motion-safe:animate-ping"
                          />
                        )}
                        {[a, b].map((subgroupCount, subgroupIndex) => {
                      const countOffset = subgroupIndex === 0 ? 0 : a;
                      const subgroupFinished = visibleCounts[index] >= countOffset + subgroupCount;
                      const subgroupIsCurrent = activeBanana?.groupIndex === index
                        && activeBanana.objectIndex >= countOffset
                        && activeBanana.objectIndex < countOffset + subgroupCount;
                      const subgroupHighlighted = subgroupFinished
                        && (
                          resultMergeStage === "cue"
                          || (subgroupIndex === 0 && visibleCounts[index] === a)
                          || (subgroupIndex === 1 && resultMergeStage === "split")
                        );
                      return (
                        <React.Fragment key={`total-subgroup-${subgroupIndex}`}>
                          {subgroupIndex === 1 && (
                             <div
                               aria-hidden="true"
                               className={`relative z-20 grid justify-self-center overflow-hidden transition-[max-height,opacity,transform,padding] ease-out ${
                                 resultMergeStage === "joining"
                                   ? "max-h-0 scale-50 p-0 opacity-0 duration-200"
                                   : "max-h-20 scale-100 p-2 opacity-100 duration-300"
                               }`}
                             >
                              <span
                                data-math-cue="plus"
                                className={`grid h-14 w-14 place-items-center rounded-2xl border-2 text-4xl font-black transition-[background-color,border-color,box-shadow,transform] duration-300 ${
                                  resultMergeStage === "cue"
                                    ? "scale-110 border-yellow-500 bg-yellow-300 text-blue-950 ring-4 ring-yellow-100 shadow-[0_5px_0_#d97706]"
                                    : "border-yellow-400 bg-yellow-100 text-blue-950 shadow-[0_4px_0_#d97706]"
                                }`}
                              >
                                +
                              </span>
                            </div>
                          )}
                          <div
                               className={`relative z-10 grid w-full place-items-center rounded-2xl border-2 p-2 transition-[border-color,background-color,box-shadow,border-radius] duration-1000 ease-in-out ${
                               subgroupHighlighted
                                    ? cyber
                                      ? "border-yellow-300 bg-yellow-300/10 ring-4 ring-yellow-300/20 shadow-lg"
                                      : "border-yellow-500 bg-yellow-50 ring-4 ring-yellow-200 shadow-lg"
                                   : subgroupIsCurrent
                                     ? cyber
                                       ? "border-cyan-300 bg-cyan-950/70 ring-2 ring-cyan-600/30"
                                       : "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                     : cyber
                                       ? "border-cyan-800 bg-slate-950/60"
                                       : "border-blue-400 bg-blue-50/60"
                            } ${
                              resultMergeStage === "joining"
                                ? subgroupIndex === 0
                                  ? "rounded-b-none border-b-blue-400 shadow-[0_8px_20px_rgba(59,130,246,.2)]"
                                  : "rounded-t-none border-t-transparent shadow-[0_8px_20px_rgba(59,130,246,.2)]"
                                : ""
                            }`}
                          >
                            {renderBananaRows(index, subgroupCount, countOffset)}
                            {subgroupCount === 0 && (
                              <span className="py-5 text-base font-black text-slate-500">
                                {lang === "en" ? "No objects" : "Tiada objek"}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      );
                        })}
                      </>
                    )}
                  </div>
                ) : (
                  renderBananaRows(index, count)
                )}
              </div>
              <div className={`mt-3 min-h-12 rounded-full border px-4 py-2 text-center text-base font-black transition-colors sm:text-xl ${
                completedGroups > index
                  ? cyber
                    ? "border-emerald-400 bg-emerald-950 text-emerald-100"
                    : "border-transparent bg-emerald-100 text-emerald-950"
                  : cyber
                    ? "border-slate-800 bg-slate-900 text-transparent"
                    : "border-transparent bg-slate-200 text-transparent"
              }`} aria-live="polite">
                {completedGroups > index
                  ? `${lang === "en" ? "Total" : "Jumlah"}: ${labels[index]}`
                  : <span aria-hidden="true">&nbsp;</span>}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      {completedGroups === groups.length && completedSigns === 2 && (
        <p className={`text-center text-4xl font-black ${cyber ? "text-emerald-300" : "text-emerald-800"}`} style={NUMBER_TEXT_STYLE}>{a} + {b} = {a + b}</p>
      )}
    </div>
  );
}

function StoryBananaGroup({ count, eating, label, destinationRef }: {
  count: number;
  eating: boolean;
  label: string;
  destinationRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const bananaRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const bananas = bananaRefs.current.slice(0, count);
    bananas.forEach((banana) => {
      banana?.getAnimations().forEach((animation) => animation.cancel());
      if (banana) {
        banana.style.opacity = "";
        banana.style.transform = "";
      }
    });

    if (!eating || !destinationRef?.current) return;

    if (getReducedMotionPreference()) {
      bananas.forEach((banana) => {
        if (banana) banana.style.opacity = "0";
      });
      return;
    }

    const destination = destinationRef.current.getBoundingClientRect();
    const animations = bananas.flatMap((banana, index) => {
      if (!banana) return [];
      const source = banana.getBoundingClientRect();
      const x = destination.left + destination.width / 2 - (source.left + source.width / 2);
      const y = destination.top + destination.height / 2 - (source.top + source.height / 2);
      return [banana.animate([
        { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
        { offset: 0.62, transform: `translate3d(${x * 0.62}px, ${y * 0.62 - 28}px, 0) scale(.78)`, opacity: 1 },
        { transform: `translate3d(${x}px, ${y}px, 0) scale(.3)`, opacity: 0 },
      ], {
        duration: ADDITION_BANANA_TRAVEL_MS,
        delay: index * ADDITION_BANANA_STAGGER_MS,
        easing: "cubic-bezier(.22,.72,.24,1)",
        fill: "forwards",
      })];
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, [count, destinationRef, eating]);

  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-3">
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            ref={(node) => { bananaRefs.current[i] = node; }}
            className={`relative z-10 grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl shadow-inner ${eating && !destinationRef ? "translate-x-24 -translate-y-4 scale-50 opacity-0 transition-all duration-1000" : "opacity-100"}`}
          >
            <SpriteIcon value={String.fromCodePoint(0x1f34c)} className="h-12 w-12" />
          </span>
        ))}
      </div>
      <p className="text-xl font-black text-amber-900">{label}</p>
    </div>
  );
}

const BellyCounter = React.forwardRef<HTMLDivElement, {
  start: number;
  target: number;
  counting: boolean;
  waiting: boolean;
  label: string;
  unit: string;
  lang: Lang;
  onComplete?: () => void;
}>(function BellyCounter({ start, target, counting, waiting, label, unit, lang, onComplete }, ref) {
  const [visible, setVisible] = useState(counting || waiting ? start : target);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (target === 0) {
      setVisible(0);
      return;
    }
    if (waiting) {
      setVisible(start);
      return;
    }
    if (!counting) {
      setVisible(target);
      return;
    }
    if (getReducedMotionPreference()) {
      setVisible(target);
      onCompleteRef.current?.();
      return;
    }

    setVisible(start);
    const additions = Math.max(0, target - start);
    const timers = Array.from({ length: additions }, (_, index) => window.setTimeout(() => {
      const nextValue = start + index + 1;
      setVisible(nextValue);
      speakNumber(nextValue, lang);
    }, ADDITION_BANANA_TRAVEL_MS + index * ADDITION_BANANA_STAGGER_MS));
    if (additions > 0) {
      const finalCountDelay = ADDITION_BANANA_TRAVEL_MS + (additions - 1) * ADDITION_BANANA_STAGGER_MS;
      timers.push(window.setTimeout(() => {
        void speakRecordedBananaTotal(target, lang, BANANA);
      }, finalCountDelay + ADDITION_BANANA_COUNT_PAUSE_MS));
    }
    const completionDelay = ADDITION_BANANA_TRAVEL_MS
      + Math.max(0, additions - 1) * ADDITION_BANANA_STAGGER_MS
      + ADDITION_BANANA_COUNT_PAUSE_MS;
    timers.push(window.setTimeout(() => onCompleteRef.current?.(), completionDelay));

    return () => {
      timers.forEach(window.clearTimeout);
      stopNumberAudio();
    };
  }, [counting, lang, start, target, waiting]);

  return (
    <div ref={ref} className="mx-auto flex h-[15.25rem] w-full max-w-52 flex-col items-center justify-center rounded-[2rem] border-4 border-pink-200 bg-pink-50 p-4 text-center shadow-inner">
      <p className="text-sm font-black uppercase text-pink-700">{label}</p>
      <div className="my-3 grid h-24 w-24 place-items-center rounded-full border-4 border-pink-300 bg-white">
        <span className="text-4xl font-black text-pink-700">{visible}</span>
      </div>
      <p className="text-lg font-black text-pink-900">{visible} {unit}</p>
      <div className="mt-3 flex min-h-10 max-w-40 flex-wrap justify-center gap-1">
        {Array.from({ length: visible }, (_, i) => (
          <span key={i} className="relative grid h-10 w-7 place-items-end">
            <span className="absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full bg-blue-600 px-1.5 text-xs font-black leading-none text-white shadow-sm">
              {i + 1}
            </span>
            <SpriteIcon value="🍌" className="h-6 w-6" />
          </span>
        ))}
      </div>
    </div>
  );
});

function SymbolIntro({ title, symbol, text, onPrevious, onNext, onSkip, t, lang }: {
  title: string;
  symbol: "+" | "-" | "=";
  text: string;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  t: UIStrings;
  lang: Lang;
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <img src={chrysThinking} alt="Chrys teaching" className="mx-auto h-32 w-32 object-contain" />
        <div className="rounded-3xl border-2 border-emerald-100 bg-white p-5 text-left">
          <p className="text-sm font-black text-blue-700">{title}</p>
          <h3 className="mt-2 text-2xl font-black leading-snug text-blue-950 md:text-3xl">
            <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">{text}</span>
          </h3>
        </div>
      </div>
      <div className="mx-auto grid h-40 w-40 place-items-center rounded-[2rem] border-4 border-yellow-400 bg-yellow-100 text-8xl font-black text-blue-900 shadow-[0_8px_0_rgba(0,0,0,.16)]">
        {symbol}
      </div>
      <LessonActionRow
        previousLabel={t.previous}
        onPrevious={onPrevious}
        primaryLabel={t.next}
        onPrimary={onNext}
        actions={[{ label: skipPracticeLabel(lang), onClick: onSkip, variant: "green" }]}
      />
    </div>
  );
}

function LessonActionRow({ previousLabel, onPrevious, primaryLabel, onPrimary, actions = [] }: {
  previousLabel: string;
  onPrevious?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  actions?: LessonAction[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <PreviousLessonButton label={previousLabel} onClick={onPrevious} />
      <div className="flex flex-wrap justify-end gap-3">
        {actions.map((action) => (
          <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
        ))}
        <LessonNextButton label={primaryLabel} onClick={onPrimary} />
      </div>
    </div>
  );
}

function LessonNextButton({ label, onClick, disabled = false, className = "" }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {label}
      {!disabled && (
        <span
          className="lesson-next-hint pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md"
          aria-hidden="true"
        >
          <PointerIcon />
        </span>
      )}
    </button>
  );
}

function PreviousLessonButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.10)] active:translate-y-1 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function SecondaryLessonButton({ label, onClick, variant = "plain" }: LessonAction) {
  const styles = variant === "green"
    ? "border-emerald-200 bg-white/80 text-emerald-700 shadow-[0_3px_0_rgba(4,120,87,.12)]"
    : "border-blue-200 bg-white/80 text-blue-700 shadow-[0_3px_0_rgba(30,64,175,.14)]";

  return (
    <button onClick={onClick} className={`rounded-xl border-2 px-4 py-2 text-sm font-black active:translate-y-1 ${styles}`}>
      {label}
    </button>
  );
}

function SlowOperationExample({ kind, lang, t, doneLabel, onPrev, onDone }: {
  kind: "add" | "subtract";
  lang: Lang;
  t: UIStrings;
  doneLabel: string;
  onPrev: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const isAdd = kind === "add";
  const totalSteps = 5;
  const title = isAdd ? "2 + 3 = ?" : "7 - 3 = ?";
  const text = getSlowExampleText(kind, step, lang);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <p className="text-lg font-black text-blue-700">{title}</p>
        <h3 className="mt-2 text-2xl font-black leading-snug text-blue-950 md:text-3xl">
          <span className="box-decoration-clone rounded-xl bg-yellow-200 px-3 py-1 text-yellow-950">{text}</span>
        </h3>
      </div>
      <div className="rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        {isAdd ? <AdditionExampleVisual step={step} /> : <SubtractionExampleVisual step={step} />}
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => step > 0 ? setStep((s) => s - 1) : onPrev()}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
        >
          {t.previous}
        </button>
        <LessonNextButton
          label={step < totalSteps - 1 ? t.next : doneLabel}
          onClick={() => step < totalSteps - 1 ? setStep((s) => s + 1) : onDone()}
        />
      </div>
    </div>
  );
}

function getSlowExampleText(kind: "add" | "subtract", step: number, lang: Lang) {
  const add = lang === "en"
    ? [
      "Start with 2 bananas.",
      "Add 3 more bananas.",
      "Join the groups.",
      "Count all bananas.",
      "There are 5 bananas.",
    ]
    : [
      "Mula-mula, kita ada 2 pisang.",
      "Kemudian, tambah 3 pisang lagi.",
      "Sekarang kita gabungkan dua kumpulan.",
      "Sekarang kita kira semuanya bersama.",
      "Ada 5 pisang semuanya.",
    ];
  const sub = lang === "en"
    ? [
      "Start with 7 bananas.",
      "Chrys gives away 3 bananas.",
      "Cross out 3 bananas.",
      "Count what is left.",
      "4 bananas are left.",
    ]
    : [
      "Mula-mula, kita ada 7 pisang.",
      "Ambil 3 pisang.",
      "Pisang yang diambil kekal dipalang.",
      "Kira hanya pisang yang tinggal.",
      "4 pisang tinggal.",
    ];
  return (kind === "add" ? add : sub)[step];
}

function AdditionExampleVisual({ step }: { step: number }) {
  const showJoined = step >= 2;
  const showCount = step >= 3;
  return (
    <div className="space-y-5">
      {!showJoined ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <LabeledGroup count={2} label="2" emoji="🍌" />
          <div data-math-cue="plus" className="text-center text-5xl font-black text-blue-800">+</div>
          {step >= 1 ? <LabeledGroup count={3} label="3" emoji="🍌" /> : <div className="rounded-3xl border-4 border-dashed border-slate-200 p-8 text-center font-black text-slate-300">?</div>}
        </div>
      ) : (
        <CountedObjectRow count={5} emoji="🍌" showCount={showCount} />
      )}
      {step >= 4 && (
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center text-4xl font-black text-emerald-800">
          2 + 3 = 5
        </div>
      )}
    </div>
  );
}

function SubtractionExampleVisual({ step }: { step: number }) {
  const showCross = step >= 1;
  const showCount = step >= 3;
  return (
    <div className="space-y-5">
      <CountedObjectRow count={7} emoji="🍌" crossed={showCross ? 3 : 0} showCount={showCount} countRemainingOnly showCrossCount={showCross} />
      {step >= 4 && (
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center text-4xl font-black text-emerald-800">
          7 - 3 = 4
        </div>
      )}
    </div>
  );
}

type SubtractionPhase = "start" | "crossing" | "crossed" | "counting" | "done";

function InteractiveSubtractionFlow({ start, takeAway, emoji, lang, onComplete }: {
  start: number;
  takeAway: number;
  emoji: string;
  lang: Lang;
  onComplete?: () => void;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<SubtractionPhase>("start");
  const [cuePlaying, setCuePlaying] = useState(false);
  const [crossedCount, setCrossedCount] = useState(0);
  const [remainingCountValue, setRemainingCountValue] = useState(0);
  const countRunRef = useRef(0);
  const left = start - takeAway;
  const showRemainingCount = phase === "counting" || phase === "done";
  const showCrossCount = crossedCount > 0;

  useEffect(() => {
    countRunRef.current += 1;
    stopNumberAudio();
    setPhase("start");
    setCuePlaying(false);
    setCrossedCount(0);
    setRemainingCountValue(0);
    return () => {
      countRunRef.current += 1;
      stopNumberAudio();
    };
  }, [emoji, lang, start, takeAway]);

  const instruction = phase === "counting" && remainingCountValue > 0
    ? [lang === "en" ? `Counting what is left: ${remainingCountValue}` : `Mengira yang tinggal: ${remainingCountValue}`]
    : getSubtractionFlowInstruction(lang, phase, start, takeAway, left, emoji);
  const removing = crossedCount < takeAway;
  const actionLabel = removing
    ? (lang === "en" ? "Remove one" : "Ambil satu")
    : (lang === "en" ? "Count what is left" : "Kira yang tinggal");

  const advancePhase = async () => {
    if (cuePlaying || phase === "done") return;
    const runId = countRunRef.current + 1;
    countRunRef.current = runId;
    setCuePlaying(true);

    if (removing) {
      const nextCrossed = crossedCount + 1;
      if (crossedCount === 0) await speakMathCue("minus", lang);
      if (countRunRef.current !== runId) return;
      await speakNumber(nextCrossed, lang);
      if (countRunRef.current !== runId) return;
      setCrossedCount(nextCrossed);
      setPhase(nextCrossed >= takeAway ? "crossed" : "crossing");
      setCuePlaying(false);
      return;
    }

    if (left === 0) {
      await speakMathCue("equals", lang);
      if (countRunRef.current !== runId) return;
      await speakNumber(0, lang);
      if (countRunRef.current !== runId) return;
      setPhase("done");
      await speakRecordedBananaTotal(0, lang, emoji);
      if (countRunRef.current !== runId) return;
      setCuePlaying(false);
      onComplete?.();
      return;
    }

    await speakMathCue("equals", lang);
    if (countRunRef.current !== runId) return;
    setRemainingCountValue(0);
    setPhase("counting");
    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(left, lang, COUNTING_STEP_MS, (value) => {
        if (countRunRef.current === runId) setRemainingCountValue(value);
      });
    } else {
      for (let value = 1; value <= left; value += 1) {
        if (countRunRef.current !== runId) return;
        setRemainingCountValue(value);
        await wait(prefersReducedMotion ? 80 : COUNTING_STEP_MS);
      }
    }
    if (countRunRef.current !== runId) return;
    setRemainingCountValue(left);
    setPhase("done");
    setCuePlaying(false);
    await speakRecordedBananaTotal(left, lang, emoji);
    if (countRunRef.current !== runId) return;
    onComplete?.();
  };

  return (
    <div className="space-y-4 rounded-3xl border-2 border-amber-100 bg-amber-50 p-4">
      <div className="rounded-3xl bg-white p-3">
        <CountedObjectRow
          count={start}
          emoji={emoji}
          crossed={crossedCount}
          showCount={showRemainingCount}
          countRemainingOnly
          showCrossCount={showCrossCount}
          visibleCount={remainingCountValue}
          highlightActiveCount={phase === "counting" && cuePlaying}
          lang={lang}
        />
      </div>

      {phase !== "done" && (
        <div className="flex justify-center">
          <button
            onClick={() => void advancePhase()}
            disabled={cuePlaying}
            className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 text-xl font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1 disabled:cursor-wait disabled:opacity-70"
          >
            {cuePlaying ? (lang === "en" ? "Listen..." : "Dengar...") : actionLabel}
          </button>
        </div>
      )}

      <div className={`${phase === "crossing" || phase === "crossed" ? "border-red-200 bg-red-50 text-red-900" : phase === "counting" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"} rounded-3xl border-2 p-4 text-center`}>
        <p className="text-xl font-black">{instruction[0]}</p>
        {instruction[1] && <p className="mt-2 text-3xl font-black">{instruction[1]}</p>}
      </div>
    </div>
  );
}

function getSubtractionFlowInstruction(lang: Lang, phase: SubtractionPhase, start: number, takeAway: number, left: number, emoji: string) {
  const startItem = objectName(emoji, start, lang);
  const takeAwayItem = objectName(emoji, takeAway, lang);
  const leftItem = objectName(emoji, left, lang);
  if (lang === "ms") {
    if (phase === "start") return [`Mula dengan ${start} ${startItem}.`];
    if (phase === "crossing" || phase === "crossed") return [`Ambil ${takeAway} ${takeAwayItem}.`];
    if (phase === "counting") return [`Kira ${leftItem} yang tinggal.`];
    return [`${left} ${leftItem} tinggal.`, `Jadi, ${start} - ${takeAway} = ${left}.`];
  }
  if (phase === "start") return [`Start with ${start} ${startItem}.`];
  if (phase === "crossing" || phase === "crossed") return [`Take away ${takeAway} ${takeAwayItem}.`];
  if (phase === "counting") return ["Count what is left."];
  return [`${left} ${leftItem} ${left === 1 ? "is" : "are"} left.`, `So, ${start} - ${takeAway} = ${left}.`];
}

function LabeledGroup({ count, label, emoji }: { count: number; label: string; emoji: string }) {
  return (
    <div className="rounded-3xl border-2 border-yellow-100 bg-yellow-50 p-4 text-center">
      <ObjectGroup count={count} emoji={emoji} />
      <p className="mt-3 text-3xl font-black text-yellow-800">{label}</p>
    </div>
  );
}

function CountedObjectRow({ count, emoji, crossed = 0, showCount, countRemainingOnly = false, animateCrossOut = false, compact = false, fixedColumns, rowPattern, largeTiles = false, showCrossCount = false, intervalMs = COUNTING_STEP_MS, speakCrossCount = false, speakCount = false, visibleCount, onCountProgress, onCrossCountComplete, onCountComplete, highlightActiveCount = true, cyber = false, lang = "en" }: {
  count: number;
  emoji: string;
  crossed?: number;
  showCount: boolean;
  countRemainingOnly?: boolean;
  animateCrossOut?: boolean;
  compact?: boolean;
  fixedColumns?: number;
  rowPattern?: number[];
  largeTiles?: boolean;
  showCrossCount?: boolean;
  intervalMs?: number;
  speakCrossCount?: boolean;
  speakCount?: boolean;
  visibleCount?: number;
  onCountProgress?: (value: number) => void;
  onCrossCountComplete?: () => void;
  onCountComplete?: () => void;
  highlightActiveCount?: boolean;
  cyber?: boolean;
  lang?: Lang;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const stepIntervalMs = Math.max(intervalMs, COUNTING_STEP_MS);
  const remaining = count - crossed;
  const [visible, setVisible] = useState(0);
  const [visibleCrossed, setVisibleCrossed] = useState(animateCrossOut ? 0 : crossed);
  const [countingInProgress, setCountingInProgress] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!animateCrossOut) {
      setVisibleCrossed(crossed);
      return;
    }
    setVisibleCrossed(0);

    if (crossed <= 0) {
      onCrossCountComplete?.();
      return;
    }

    if (speakCrossCount && !audioMuted) {
      void speakCountingSequence(
        crossed,
        lang,
        stepIntervalMs,
        (value) => {
          if (!cancelled) setVisibleCrossed(value);
        },
      ).then(() => {
        if (!cancelled) onCrossCountComplete?.();
      });
      return () => {
        cancelled = true;
        stopNumberAudio();
      };
    }

    if (prefersReducedMotion) {
      setVisibleCrossed(crossed);
      onCrossCountComplete?.();
      return;
    }

    const timers = Array.from({ length: crossed }, (_, i) => window.setTimeout(() => {
      if (cancelled) return;
      setVisibleCrossed(i + 1);
      if (i + 1 === crossed) onCrossCountComplete?.();
    }, stepIntervalMs * (i + 1)));
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [animateCrossOut, crossed, lang, onCrossCountComplete, prefersReducedMotion, speakCrossCount, stepIntervalMs]);

  useEffect(() => {
    let cancelled = false;
    if (visibleCount !== undefined) return;
    setVisible(0);
    setCountingInProgress(false);
    onCountProgress?.(0);
    if (!showCount) return;
    const max = countRemainingOnly ? remaining : count;
    const countDelay = animateCrossOut ? (crossed * stepIntervalMs) + stepIntervalMs : 0;

    if (max <= 0) {
      setCountingInProgress(false);
      onCountComplete?.();
      return;
    }

    if (speakCount && !audioMuted) {
      const startAudioCount = () => {
        setCountingInProgress(true);
        void speakCountingSequence(
          max,
          lang,
          stepIntervalMs,
          (value) => {
            if (!cancelled) {
              setVisible(value);
              onCountProgress?.(value);
            }
          },
        ).then(() => {
          if (cancelled) return;
          const completionTimer = window.setTimeout(() => {
            if (cancelled) return;
            setCountingInProgress(false);
            onCountComplete?.();
          }, COUNT_TOTAL_REVEAL_DELAY_MS);
          timers.push(completionTimer);
        });
      };
      const timers: number[] = [];
      const speechTimer = countDelay > 0
        ? window.setTimeout(startAudioCount, countDelay)
        : null;
      if (speechTimer) timers.push(speechTimer);
      if (!speechTimer) startAudioCount();
      return () => {
        cancelled = true;
        timers.forEach(window.clearTimeout);
        stopNumberAudio();
      };
    }

    if (prefersReducedMotion) {
      setVisible(max);
      onCountProgress?.(max);
      lastCountingFinishedAt = performance.now();
      setCountingInProgress(true);
      const completionTimer = window.setTimeout(() => {
        if (cancelled) return;
        setCountingInProgress(false);
        onCountComplete?.();
      }, COUNT_TOTAL_REVEAL_DELAY_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(completionTimer);
      };
    }

    setCountingInProgress(true);
    const timers = Array.from({ length: max }, (_, i) => window.setTimeout(() => {
      if (cancelled) return;
      setVisible(i + 1);
      onCountProgress?.(i + 1);
      if (i + 1 === max) {
        lastCountingFinishedAt = performance.now();
        const completionTimer = window.setTimeout(() => {
          if (cancelled) return;
          setCountingInProgress(false);
          onCountComplete?.();
        }, COUNT_TOTAL_REVEAL_DELAY_MS);
        timers.push(completionTimer);
      }
    }, countDelay + (stepIntervalMs * (i + 1))));
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [animateCrossOut, count, countRemainingOnly, crossed, lang, onCountComplete, onCountProgress, prefersReducedMotion, remaining, showCount, speakCount, stepIntervalMs, visibleCount]);

  useEffect(() => () => stopNumberAudio(), []);

  const displayedCount = visibleCount ?? visible;
  const teenColumnCount = fixedColumns ?? 1;
  const balancedTeenGrid = teenColumnCount > 5;
  const layoutClass = balancedTeenGrid
    ? "flex flex-wrap justify-center"
    : fixedColumns === 1
      ? "grid grid-cols-[3rem] place-content-center"
      : fixedColumns === 2
        ? "grid grid-cols-[repeat(2,3rem)] place-content-center"
        : fixedColumns === 3
          ? "grid grid-cols-[repeat(3,3rem)] place-content-center"
          : fixedColumns === 4
            ? "grid grid-cols-[repeat(4,3rem)] place-content-center"
            : fixedColumns === 5
              ? "flex flex-wrap justify-center"
              : fixedColumns
                ? "grid place-content-center"
                : "flex flex-wrap justify-center";
  const balancedTileStyle = balancedTeenGrid
    ? { flex: `0 0 calc((100% - ${(teenColumnCount - 1) * 0.5}rem) / ${teenColumnCount})` }
    : undefined;
  const spacingClass = balancedTeenGrid
    ? "gap-3 px-5 pb-5 pt-8"
    : largeTiles
    ? "gap-x-4 gap-y-8 px-6 pb-5 pt-8"
    : compact
      ? "gap-x-3 gap-y-7 px-5 pb-4 pt-7"
      : "gap-x-4 gap-y-8 px-6 pb-5 pt-8";
  const tileSizeClass = balancedTeenGrid
    ? "h-20 min-w-0 text-3xl"
    : largeTiles ? "h-24 w-14 text-4xl" : compact ? "h-20 w-12 text-3xl" : "h-24 w-16 text-4xl";
  const iconSizeClass = balancedTeenGrid
    ? "h-11 w-full max-w-10"
    : largeTiles ? "h-14 w-12" : compact ? "h-10 w-10" : "h-12 w-12";
  const containerWidthClass = fixedColumns === 5
    ? "max-w-[27rem]"
    : fixedColumns
      ? "max-w-full"
      : "max-w-[28rem]";
  let leftIndex = 0;
  const tiles = Array.from({ length: count }, (_, i) => {
    const gone = i < visibleCrossed;
    const willBeTaken = i < crossed;
    const shouldCount = showCount && (!countRemainingOnly || !willBeTaken);
    const label = shouldCount ? ++leftIndex : 0;
    const labelVisible = shouldCount && label <= displayedCount;
    const isActiveCount = highlightActiveCount
      && (visibleCount !== undefined || countingInProgress)
      && labelVisible
      && label === displayedCount;
    const crossLabelVisible = showCrossCount && willBeTaken && i < visibleCrossed;
    const hasCountedLabel = labelVisible && !gone;
    const isUncounted = shouldCount && !labelVisible && !gone;
    return (
      <div
        key={i}
        style={balancedTileStyle}
        className={`relative flex flex-col items-center justify-center overflow-visible rounded-2xl border-2 pt-4 shadow-inner transition-[background-color,border-color,box-shadow,transform] duration-300 ${
          isActiveCount
            ? cyber
              ? "scale-105 border-yellow-200 bg-cyan-950/90 ring-4 ring-yellow-300/90 shadow-[0_0_20px_rgba(250,204,21,.72)]"
              : "scale-105 border-yellow-500 bg-white ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]"
            : hasCountedLabel
              ? cyber
                ? "border-cyan-400 bg-cyan-950/90 ring-2 ring-cyan-700/70"
                : "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
              : gone
                ? cyber
                  ? "border-red-800 bg-slate-900/70"
                  : "border-red-200 bg-slate-100"
                : cyber
                  ? isUncounted
                    ? "border-slate-700 bg-slate-950/80"
                    : "border-cyan-900 bg-slate-900/90"
                  : "border-amber-100 bg-amber-50"
        } ${tileSizeClass}`}
      >
        {crossLabelVisible ? (
          <span className="absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full bg-red-600 px-1 text-xs font-black leading-none text-white shadow-sm transition-opacity">
            {i + 1}
          </span>
        ) : (
          <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1 text-xs font-black leading-none shadow-sm transition-opacity ${isActiveCount ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"} ${labelVisible ? "opacity-100" : "opacity-0"}`}>
            {labelVisible ? label : "."}
          </span>
        )}
        <span className={`relative inline-flex items-center justify-center ${iconSizeClass}`}>
          <SpriteIcon value={emoji} className={`h-full w-full ${isUncounted ? "opacity-40 grayscale" : "opacity-100 saturate-100 grayscale-0"}`} />
          {gone && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-black leading-none text-red-500 drop-shadow-sm transition-opacity duration-300 ${compact ? "text-4xl" : "text-5xl"}`}
            >
              &times;
            </span>
          )}
        </span>
      </div>
    );
  });
  let rowStart = 0;
  const arrangedRows = rowPattern?.map((amount, rowIndex) => {
    const row = tiles.slice(rowStart, rowStart + amount);
    rowStart += amount;
    return <div key={rowIndex} className={`flex w-full items-center justify-center ${largeTiles ? "gap-x-4" : compact ? "gap-x-3" : "gap-x-4"}`}>{row}</div>;
  });
  return (
    <div
      className={`${rowPattern ? "flex flex-col items-center justify-center" : layoutClass} mx-auto w-full ${containerWidthClass} rounded-3xl border-2 ${cyber ? "border-cyan-700/80 bg-slate-950/75 shadow-[inset_0_0_24px_rgba(34,211,238,.10)]" : "border-slate-100 bg-white"} ${spacingClass}`}
    >
      {arrangedRows ?? tiles}
    </div>
  );
}

function AnimatedCupSubtractionVisual({ lang, onComplete }: { lang: Lang; onComplete: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [crossedCount, setCrossedCount] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    setCrossedCount(0);
    stopNumberAudio();

    const runAnimation = async () => {
      await wait(prefersReducedMotion ? 80 : 450);
      if (cancelled) return;

      if (prefersReducedMotion) {
        setCrossedCount(5);
      }

      if (NUMBER_AUDIO_ENABLED && !audioMuted) {
        await speakCountingSequence(5, lang, COUNTING_STEP_MS, (value) => {
          if (!cancelled && !prefersReducedMotion) setCrossedCount(value);
        });
      } else if (!prefersReducedMotion) {
        for (let value = 1; value <= 5; value += 1) {
          await wait(COUNTING_STEP_MS);
          if (cancelled) return;
          setCrossedCount(value);
        }
      }

      if (cancelled) return;
      setCrossedCount(5);
      onCompleteRef.current();
      speakText(
        lang === "en" ? "Five minus five equals zero." : "Lima tolak lima sama dengan sifar.",
        lang,
      );
    };

    void runAnimation();
    return () => {
      cancelled = true;
      stopNumberAudio();
    };
  }, [lang, prefersReducedMotion]);

  const statusText = crossedCount === 0
    ? (lang === "en" ? "Five cups are ready." : "Lima cawan sudah sedia.")
    : crossedCount < 5
      ? (lang === "en" ? `Putting away cup ${crossedCount} of 5.` : `Menyimpan cawan ${crossedCount} daripada 5.`)
      : (lang === "en" ? "All five cups are put away." : "Semua lima cawan telah disimpan.");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-7 rounded-3xl border-2 border-slate-100 bg-white px-4 pb-4 pt-8">
        {Array.from({ length: 5 }, (_, index) => {
          const crossed = index < crossedCount;
          const active = crossedCount > 0 && index === crossedCount - 1;
          return (
            <div
              key={index}
              aria-label={lang === "en"
                ? `Cup ${index + 1}${crossed ? ", put away" : ""}`
                : `Cawan ${index + 1}${crossed ? ", disimpan" : ""}`}
              className={`relative grid h-24 w-16 place-items-center rounded-2xl border-2 bg-amber-50 shadow-inner transition-[border-color,box-shadow,transform] duration-300 ${
                active ? "scale-105 border-yellow-400 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.55)]" : "border-amber-100"
              }`}
            >
              <span className={`absolute -top-7 z-20 grid h-7 min-w-8 place-items-center rounded-full px-2 text-sm font-black text-white shadow-md transition-colors ${
                active ? "bg-yellow-400 text-slate-950" : crossed ? "bg-red-600" : "bg-blue-600"
              }`}>
                {index + 1}
              </span>
              <span className="relative inline-flex h-12 w-12 items-center justify-center">
                <SpriteIcon value="🥤" className="h-full w-full opacity-100 saturate-100 grayscale-0" />
                {crossed && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-5xl font-black leading-none text-red-500 drop-shadow-sm"
                  >
                    &times;
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="min-h-7 text-center text-lg font-black text-blue-800" aria-live="polite">
        {statusText}
      </p>
    </div>
  );
}

function AdvancedTestMenu({ lang, t, player, go, lastScore, testingMode = false }: {
  lang: Lang;
  t: UIStrings;
  player: Player;
  go: (screen: Screen) => void;
  lastScore: AdvancedTestScore | null;
  testingMode?: boolean;
}) {
  const tests: Array<{
    id: AdvancedTestId;
    screen: Screen;
    title: string;
    subtitle: string;
    unlocked: boolean;
    icon: string;
  }> = [
    {
      id: "teenNumbers",
      screen: "advancedTestTeenNumbers",
      title: lang === "en" ? "Teen Numbers" : "Nombor Belasan",
      subtitle: lang === "en" ? "10 questions · Numbers 10-20" : "10 soalan · Nombor 10-20",
      unlocked: testingMode || Boolean(player.progress.advancedTeenNumbers),
      icon: "10-20",
    },
    {
      id: "compareBigger",
      screen: "advancedTestCompareBigger",
      title: lang === "en" ? "Compare Bigger" : "Banding Nombor",
      subtitle: lang === "en" ? "12 questions · Greater than, less than, or equal" : "12 soalan · Lebih besar, lebih kecil, atau sama",
      unlocked: testingMode || Boolean(player.progress.advancedCompareBigger),
      icon: "< > =",
    },
    {
      id: "sequencing",
      screen: "advancedTestSequencing",
      title: lang === "en" ? "Sequencing" : "Urutan",
      subtitle: lang === "en" ? "10 questions · What comes next" : "10 soalan · Nombor seterusnya",
      unlocked: testingMode || Boolean(player.progress.advancedSequencing),
      icon: "+1",
    },
    {
      id: "addition",
      screen: "advancedTestAddition",
      title: lang === "en" ? "Addition" : "Tambah",
      subtitle: lang === "en" ? "16 questions · Adding up to 20" : "16 soalan · Tambah sehingga 20",
      unlocked: testingMode || (Boolean(player.progress.advancedAdditionPart1) && Boolean(player.progress.advancedAdditionPart2)),
      icon: "10+",
    },
    {
      id: "subtraction",
      screen: "advancedTestSubtraction",
      title: lang === "en" ? "Subtraction" : "Tolak",
      subtitle: lang === "en" ? "16 questions · Subtracting up to 20" : "16 soalan · Tolak sehingga 20",
      unlocked: testingMode || Boolean(player.progress.advancedSubtraction),
      icon: "10−",
    },
  ];

  return (
    <main className="cyber-lesson-panel mx-auto w-full max-w-6xl rounded-[2.25rem] p-4 sm:p-6">
      <section className="relative mb-5 overflow-hidden rounded-[2rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 p-6 text-center shadow-[0_9px_0_#083344]">
        <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(34,211,238,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.2)_1px,transparent_1px)] [background-size:26px_26px]" aria-hidden="true" />
        <div className="relative">
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-[1.75rem] border-2 border-yellow-200 bg-yellow-400 text-slate-950 shadow-[0_6px_0_#a16207]">
            <Flag className="h-12 w-12" strokeWidth={3} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-4xl font-black text-yellow-200">{t.advancedTestMode}</h2>
          <p className="mx-auto mt-2 max-w-xl text-lg font-bold text-cyan-50">{t.advancedTestHelp}</p>
          <p className="mt-2 text-sm font-black text-cyan-200">{lang === "en" ? "Earn mastery with 70% or more." : "Capai penguasaan dengan 70% atau lebih."}</p>
        </div>
      </section>

      {lastScore && (
        <section className={`relative mb-5 overflow-hidden rounded-[1.75rem] border-4 p-5 text-center ${lastScore.mastered ? "border-yellow-300 bg-gradient-to-br from-emerald-950 to-cyan-950 shadow-[0_8px_0_#047857,0_0_30px_rgba(250,204,21,.3)]" : "border-orange-300 bg-orange-950/90 shadow-[0_6px_0_#083344]"}`} aria-live="polite">
          {lastScore.mastered && <CorrectCelebration />}
          <span className={`mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border-4 shadow-[0_5px_0_#0f172a] ${lastScore.mastered ? "border-yellow-200 bg-yellow-400 text-slate-950" : "border-orange-200 bg-orange-500 text-slate-950"}`}><Check className="h-9 w-9" strokeWidth={5} aria-hidden="true" /></span>
          <p className={`text-2xl font-black ${lastScore.mastered ? "text-emerald-200" : "text-orange-200"}`}>
            {lastScore.mastered
              ? (lang === "en" ? "Mastery achieved! You earned a star." : "Penguasaan dicapai! Kamu mendapat bintang.")
              : (lang === "en" ? "Test complete. Keep practicing with Chrys." : "Ujian selesai. Terus berlatih bersama Chrys.")}
          </p>
          <p className="mt-1 text-xl font-black text-cyan-50">{t.score}: {lastScore.correct}/{lastScore.total}</p>
        </section>
      )}

      <div className="grid gap-4">
        {tests.map((test) => {
          const score = player.progress[advancedTestProgressKey(test.id, "score")];
          const total = player.progress[advancedTestProgressKey(test.id, "total")];
          const mastered = Boolean(player.progress[advancedTestProgressKey(test.id, "mastered")]);
          const hasScore = Number.isFinite(score) && Number.isFinite(total) && total > 0;
          return (
            <button
              key={test.id}
              type="button"
              disabled={!test.unlocked}
              onClick={() => go(test.screen)}
              className={`group rounded-[1.75rem] border-2 p-5 text-left shadow-[0_7px_0_#083344] transition sm:p-6 ${test.unlocked ? "border-cyan-300 bg-slate-950/95 hover:-translate-y-1 hover:border-yellow-300" : "cursor-not-allowed border-slate-600 bg-slate-950/80 opacity-65"}`}
            >
              <span className="flex items-center gap-4">
                <span className={`grid h-16 min-w-16 shrink-0 place-items-center rounded-2xl border-2 px-2 text-lg font-black shadow-[0_4px_0_#164e63] ${test.unlocked ? "border-cyan-200 bg-cyan-950 text-yellow-200" : "border-slate-600 bg-slate-900 text-slate-500"}`} style={NUMBER_TEXT_STYLE}>
                  {test.unlocked ? test.icon : <KeyRound className="h-8 w-8" strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-2xl font-black ${test.unlocked ? "text-yellow-200" : "text-slate-400"}`}>{test.title}</span>
                  <span className={`mt-1 block font-bold ${test.unlocked ? "text-cyan-100" : "text-slate-500"}`}>{test.subtitle}</span>
                  {!test.unlocked && <span className="mt-2 block text-sm font-black text-orange-300">{lang === "en" ? "Complete the matching mission to unlock." : "Selesaikan misi yang sepadan untuk membuka."}</span>}
                </span>
                <span className="shrink-0 text-right">
                  {mastered ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-900 px-3 py-2 text-sm font-black text-emerald-100"><Check className="h-5 w-5" strokeWidth={4} aria-hidden="true" />{lang === "en" ? "Mastered" : "Dikuasai"}</span>
                  ) : hasScore ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400 bg-cyan-950 px-3 py-2 text-sm font-black text-cyan-100"><Check className="h-5 w-5" strokeWidth={4} aria-hidden="true" />{lang === "en" ? "Completed" : "Selesai"} · {t.score}: {score}/{total}</span>
                  ) : test.unlocked ? (
                    <ArrowRight className="h-8 w-8 text-cyan-200 transition-transform group-hover:translate-x-1" strokeWidth={3} aria-hidden="true" />
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function TestMenu({ lang, t, player, go }: { lang: Lang; t: UIStrings; player: Player; go: (screen: Screen) => void }) {
  const completed = (key: string) => Object.prototype.hasOwnProperty.call(player.progress, key);
  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <section className="mb-4 rounded-[2rem] border-4 border-white/80 bg-white/90 p-5 text-center shadow-[0_8px_0_rgba(0,0,0,.16)]">
        <img src={chrysRunning} alt="Chrys ready" className="mx-auto h-32 w-32 object-contain" />
        <h2 className="text-3xl font-black text-blue-950">{t.testMode}</h2>
        <p className="mt-2 font-bold text-slate-500">{t.testHelp}</p>
      </section>
      <div className="grid gap-4">
        <MenuCard lang={lang} title={t.learnNumbers} subtitle={lang === "en" ? "25 questions, all 0-9" : "25 soalan, semua nombor 0-9"} icon="🔢" color="sky" complete={completed("testNumbers")} onClick={() => go("testNumbers")} />
        <MenuCard lang={lang} title={t.learnOperations} subtitle={lang === "en" ? "Solve number sentences using + and −" : "Jawab ayat nombor dengan + dan −"} icon="➕" color="emerald" complete={completed("testOperations")} onClick={() => go("testOperations")} />
        <MenuCard lang={lang} title={t.learnReal} subtitle={lang === "en" ? "Solve everyday stories using visible objects" : "Jawab cerita harian dengan objek yang boleh dilihat"} icon="🍎" color="orange" complete={completed("testReal")} onClick={() => go("testReal")} />
      </div>
    </main>
  );
}

function localizedQuestionOption(question: Question, option: number | string, lang: Lang) {
  if (lang === "en" || typeof option !== "string") return option;
  if (option === "Adding") return "Tambah";
  if (option === "Taking away") return "Tolak";
  if (option === "Yes") return "Ya";
  if (option === "No") return "Tidak";
  if (question.id.startsWith("rec-")) {
    const numberWordIndex = WORDS.en.indexOf(option);
    return numberWordIndex >= 0 ? WORDS.ms[numberWordIndex] : option;
  }
  if (question.id.startsWith("adv-teen-rec-")) {
    const matchingNumber = Object.entries(TEEN_WORDS.en).find(([, word]) => word === option)?.[0];
    return matchingNumber ? TEEN_WORDS.ms[Number(matchingNumber)] : option;
  }
  return option;
}

function Quiz({ lang, t, title, questions, onFinish, extraAction, randomize = true, onBackToLearning, chunkSize, visualOnlyOperationSolutions = false, variant = "default" }: {
  lang: Lang;
  t: UIStrings;
  title: string;
  questions: Question[];
  onFinish: (correct: number, total: number) => void;
  extraAction?: LessonAction;
  randomize?: boolean;
  onBackToLearning?: () => void;
  chunkSize?: number;
  visualOnlyOperationSolutions?: boolean;
  variant?: "default" | "cyber";
}) {
  const randomizedQuestions = useMemo(() => randomize ? shuffledQuestions(questions) : questions, [questions, randomize]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [showBreather, setShowBreather] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [cupAnimationComplete, setCupAnimationComplete] = useState(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const qn = randomizedQuestions[index];
  const selected = answers[index] ?? null;
  const answered = selected !== null;
  const choseDontKnow = selected === DONT_KNOW_ANSWER;
  const displayedSelected = selected === null ? "" : localizedQuestionOption(qn, selected, lang);
  const displayedAnswer = localizedQuestionOption(qn, qn.answer, lang);
  const isCorrect = selected === qn.answer;
  const isCountQuestion = qn.visual.kind === "count";
  const isValueQuestion = qn.id.startsWith("val-");
  const isTeenValueCountQuestion = qn.id.startsWith("adv-teen-value-count-");
  const usesWideSequenceQuestion = qn.visual.kind === "sequence" && qn.visual.nums.length > 5;
  const groupChoiceVisual = qn.visual.kind === "groupChoices" ? qn.visual : null;
  const keepsGroupingAnswerInSolution =
    qn.visual.kind === "groupChoices" ||
    qn.visual.kind === "groupObserve" ||
    qn.visual.kind === "groupMake" ||
    qn.visual.kind === "groupBuildMany" ||
    qn.visual.kind === "groupTwo" ||
    qn.visual.kind === "groupCompare" ||
    qn.visual.kind === "groupCombine";
  const hidesQuestionVisual =
    (qn.visual.kind === "horizontalAdd" && qn.visual.display === "none") ||
    ((qn.visual.kind === "add" || qn.visual.kind === "subtract") && qn.visual.display === "none");
  const isAnimatedCupQuestion = qn.id === "rt-sub-cups-5-5";
  const answersLockedForAnimation = isAnimatedCupQuestion && !cupAnimationComplete;
  const activePanelOwnsVisual = qn.inputMode === "makeGroups" || qn.inputMode === "buildTotal" || qn.inputMode === "takeAway" || qn.inputMode === "buildTeen" || qn.inputMode === "makeTenBuild" || qn.inputMode === "carryBuild" || qn.inputMode === "borrowSubtract";
  const showGuidedAdditionLabels = qn.visual.kind === "add" && qn.visual.showLabels === true;
  const showGuidedSubtractionLabels = qn.visual.kind === "subtract" && qn.visual.showLabels === true;
  const correct = randomizedQuestions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;
  const cyber = variant === "cyber";

  useEffect(() => {
    setCupAnimationComplete(false);
  }, [lang]);

  const next = () => {
    if (index === randomizedQuestions.length - 1) onFinish(correct, randomizedQuestions.length);
    else if (chunkSize && (index + 1) % chunkSize === 0) {
      setCupAnimationComplete(false);
      setShowBreather(true);
    }
    else {
      setShowSolution(false);
      setCupAnimationComplete(false);
      setIndex((i) => i + 1);
    }
  };

  const continueAfterBreather = () => {
    setShowBreather(false);
    setShowSolution(false);
    setCupAnimationComplete(false);
    setIndex((i) => Math.min(randomizedQuestions.length - 1, i + 1));
  };

  const answerQuestion = (answer: number | string) => {
    setShowSolution(false);
    setAnswers((current) => ({ ...current, [index]: answer }));
  };

  const showUnknownSolution = () => {
    setAnswers((current) => ({ ...current, [index]: DONT_KNOW_ANSWER }));
    setShowSolution(true);
  };

  const retryQuestion = () => {
    setShowSolution(false);
    setAnswers((current) => {
      const nextAnswers = { ...current };
      delete nextAnswers[index];
      return nextAnswers;
    });
  };

  const focusOption = (nextIndex: number) => {
    const optionCount = qn.options.length;
    if (optionCount === 0) return;
    const wrappedIndex = (nextIndex + optionCount) % optionCount;
    optionRefs.current[wrappedIndex]?.focus();
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, optionIndex: number, option: number | string) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(optionIndex + 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(optionIndex - 1);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !answered) {
      event.preventDefault();
      answerQuestion(option);
    }
  };

  if (showBreather) {
    return (
      <main className="mx-auto w-full max-w-3xl pb-8">
        <LessonShell lang={lang} title={title} helper={`${t.score}: ${correct}/${randomizedQuestions.length}`} variant={variant}>
          <div className={`rounded-[2rem] border-4 p-6 text-center ${cyber ? "border-cyan-400 bg-slate-950/90 shadow-[0_8px_0_#164e63]" : "border-white bg-white shadow-[0_8px_0_rgba(0,0,0,.16)]"}`}>
            <img src={chrysExcited} alt="Chrys cheering" className="mx-auto h-32 w-32 object-contain" />
            <h2 className={`mt-2 text-3xl font-black ${cyber ? "text-yellow-200" : "text-emerald-800"}`}>{lang === "en" ? "Nice work!" : "Bagus!"}</h2>
            <p className={`mx-auto mt-2 max-w-md text-xl font-black ${cyber ? "text-cyan-50" : "text-blue-950"}`}>
              {lang === "en" ? "Ready for more?" : "Sedia untuk lagi?"}
            </p>
            <p className={`mt-1 text-sm font-bold ${cyber ? "text-cyan-200" : "text-slate-500"}`}>
              {lang === "en" ? `You finished ${index + 1} questions.` : `Kamu sudah jawab ${index + 1} soalan.`}
            </p>
            <button
              type="button"
              onClick={continueAfterBreather}
              className="mt-5 rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-8 py-3 text-xl font-black text-white shadow-[0_6px_0_#065f46] active:translate-y-1"
            >
              {lang === "en" ? "Continue" : "Teruskan"}
            </button>
          </div>
        </LessonShell>
      </main>
    );
  }

  return (
    <main className={`mx-auto w-full pb-8 ${cyber ? "max-w-5xl" : usesWideSequenceQuestion ? "max-w-7xl" : "max-w-3xl"}`}>
      <LessonShell lang={lang} title={title} helper={`${t.score}: ${correct}/${randomizedQuestions.length} - ${index + 1}/${randomizedQuestions.length}`} variant={variant}>
        <div className={`mobile-quiz-card rounded-[2rem] border-4 p-4 ${cyber ? "border-cyan-400 bg-slate-950/90 shadow-[0_8px_0_#164e63]" : "border-white bg-white shadow-[0_8px_0_rgba(0,0,0,.16)]"}`}>
          <div className={`mb-3 h-3 overflow-hidden rounded-full ${cyber ? "border border-cyan-700 bg-slate-800" : "bg-slate-100"}`}>
            <div className={`h-full rounded-full ${cyber ? "bg-gradient-to-r from-cyan-400 to-yellow-300 shadow-[0_0_12px_rgba(34,211,238,.45)]" : "bg-blue-500"}`} style={{ width: `${(answeredCount / randomizedQuestions.length) * 100}%` }} />
          </div>
          {(index > 0 || onBackToLearning || extraAction) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                {index > 0 && (
                  <button
                    onClick={() => {
                      setShowSolution(false);
                      setCupAnimationComplete(false);
                      setIndex((i) => Math.max(0, i - 1));
                    }}
                    className={`rounded-2xl border-2 px-5 py-3 font-black active:translate-y-1 ${cyber ? "border-cyan-500 bg-slate-900 text-cyan-100 shadow-[0_4px_0_#164e63]" : "border-slate-200 bg-white text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.12)]"}`}
                  >
                    {t.previous}
                  </button>
                )}
                {onBackToLearning && (
                  <button
                    onClick={onBackToLearning}
                    className={`rounded-2xl border-2 px-5 py-3 font-black active:translate-y-1 ${cyber ? "border-cyan-400 bg-cyan-950 text-cyan-50 shadow-[0_4px_0_#164e63]" : "border-blue-200 bg-white text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.16)]"}`}
                  >
                    {backToLearningLabel(lang)}
                  </button>
                )}
              </div>
              {extraAction && <SecondaryLessonButton label={extraAction.label} onClick={extraAction.onClick} variant={extraAction.variant} />}
            </div>
          )}
          <h2 data-narration-read="true" className={`whitespace-pre-line text-center text-2xl font-black leading-snug ${cyber ? "text-yellow-200" : "text-slate-900"}`}>{qn.text[lang]}</h2>
          {!groupChoiceVisual && !activePanelOwnsVisual && !hidesQuestionVisual && (
            <div className={`mobile-visual-card my-4 rounded-3xl border-2 p-3 ${cyber ? "border-cyan-500 bg-gradient-to-br from-slate-950 to-cyan-950/80 shadow-[inset_0_0_28px_rgba(34,211,238,.10)]" : "border-sky-100 bg-sky-50"}`}>
              {isAnimatedCupQuestion ? (
                <AnimatedCupSubtractionVisual
                  lang={lang}
                  onComplete={() => setCupAnimationComplete(true)}
                />
              ) : (
                <VisualDisplay
                  visual={qn.visual}
                  lang={lang}
                  revealNumbers={!keepsGroupingAnswerInSolution && ((showSolution && !isTeenValueCountQuestion) || showGuidedAdditionLabels)}
                  revealCrossedLabels={showGuidedSubtractionLabels}
                  cyber={cyber}
                />
              )}
            </div>
          )}
          {groupChoiceVisual ? (
            <GroupChoiceAnswerPanel
              visual={groupChoiceVisual}
              lang={lang}
              selected={selected}
              answered={answered}
              revealCorrect={isCorrect || showSolution}
              answer={Number(qn.answer)}
              onAnswer={answerQuestion}
              cyber={cyber}
            />
          ) : qn.inputMode && qn.inputMode !== "choice" ? (
            <ActiveAnswerPanel
              key={`${qn.id}-${qn.inputMode === "makeTenBuild" || qn.inputMode === "carryBuild" || qn.inputMode === "borrowSubtract" ? "production" : answered ? "answered" : "open"}`}
              question={qn}
              lang={lang}
              answered={answered}
              selected={selected}
              onAnswer={answerQuestion}
              cyber={cyber}
            />
          ) : (
            <div
              className={`mobile-answer-grid grid gap-3 ${
                qn.visual.kind === "audioNumber" &&
                qn.options.length === NUMBERS.length &&
                qn.options.every((option) => typeof option === "number")
                  ? "grid-cols-2 sm:grid-cols-5"
                  : "grid-cols-2"
              }`}
            >
              {qn.options.map((option, optionIndex) => {
                const displayedOption = localizedQuestionOption(qn, option, lang);
                const picked = selected === option;
                const right = option === qn.answer;
                const revealCorrect = isCorrect || showSolution;
                const feedbackIcon = answered && right && revealCorrect ? "✓" : answered && picked && !right ? "×" : null;
                const resultText = !answered
                  ? ""
                  : right && revealCorrect
                    ? (lang === "en" ? ", correct answer" : ", jawapan betul")
                    : picked
                      ? (lang === "en" ? ", your answer, try again" : ", jawapan awak, cuba lagi")
                      : (lang === "en" ? ", not selected" : ", tidak dipilih");
                const optionSize = typeof displayedOption === "string" ? "text-2xl sm:text-3xl" : "text-4xl";
                const stateClass = !answered
                  ? cyber
                    ? "border-cyan-500 bg-slate-900 text-cyan-50 hover:border-yellow-300 hover:bg-cyan-950"
                    : "border-slate-200 bg-white text-slate-900"
                  : right && revealCorrect
                    ? cyber
                      ? "border-emerald-300 bg-emerald-700 text-white shadow-[0_0_18px_rgba(52,211,153,.22)]"
                      : "border-emerald-600 bg-emerald-500 text-white"
                    : picked
                      ? cyber
                        ? "border-orange-300 bg-orange-700 text-white"
                        : "border-orange-500 bg-orange-400 text-white"
                      : cyber
                        ? "border-slate-700 bg-slate-900/70 text-slate-500"
                        : "border-slate-100 bg-slate-50 text-slate-300";
                return (
                  <button
                    key={String(option)}
                    ref={(element) => {
                      optionRefs.current[optionIndex] = element;
                    }}
                    disabled={answered || answersLockedForAnimation}
                    aria-label={`${lang === "en" ? "Answer" : "Jawapan"} ${displayedOption}${resultText}`}
                    onClick={() => answerQuestion(option)}
                    onKeyDown={(event) => handleOptionKeyDown(event, optionIndex, option)}
                    className={`relative min-h-20 rounded-3xl border-2 px-2 font-black shadow-[0_5px_0_rgba(0,0,0,.14)] disabled:cursor-wait disabled:opacity-50 ${optionSize} ${stateClass}`}
                    style={typeof option === "number" ? getNumberTextStyle(option) : undefined}
                  >
                    <span className="inline-block pr-8">{displayedOption}</span>
                    {feedbackIcon && (
                      <span
                        aria-hidden="true"
                        className={`absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-2 bg-white text-3xl font-black shadow-sm ${right ? "border-emerald-700 text-emerald-700" : "border-orange-700 text-orange-700"}`}
                      >
                        {feedbackIcon}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!answered && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={answersLockedForAnimation}
                onClick={showUnknownSolution}
                className={`rounded-2xl border-2 px-7 py-3 font-black active:translate-y-1 disabled:cursor-wait disabled:opacity-50 ${cyber ? "border-yellow-400 bg-amber-950/80 text-yellow-100 shadow-[0_5px_0_#78350f]" : "border-amber-300 bg-amber-50 text-amber-900 shadow-[0_5px_0_rgba(180,83,9,.18)]"}`}
              >
                {lang === "en" ? "I don't know" : "Tidak tahu"}
              </button>
            </div>
          )}
          {answered && (
            <div className={`mobile-feedback-card relative mt-5 overflow-hidden rounded-3xl border-2 p-4 ${cyber ? "border-cyan-400 bg-gradient-to-br from-slate-900 to-cyan-950 shadow-[inset_0_0_24px_rgba(34,211,238,.10)]" : "border-yellow-200 bg-yellow-50"}`}>
              {isCorrect && <CorrectCelebration />}
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={isCorrect ? chrysExcited : chrysThinking}
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-20 shrink-0 object-contain"
                  onError={(event) => {
                    const image = event.currentTarget;
                    if (image.dataset.fallbackApplied === "true") {
                      image.hidden = true;
                      return;
                    }
                    image.dataset.fallbackApplied = "true";
                    image.src = chrysHappy;
                  }}
                />
                <div>
                  <p className={`text-xl font-black ${isCorrect ? (cyber ? "text-emerald-300" : "text-emerald-700") : (cyber ? "text-orange-300" : "text-orange-700")}`}>
                    {isCorrect
                      ? (isValueQuestion ? (lang === "en" ? "Great job! Count with Chrys." : "Bagus! Kira dengan Chrys.") : (isCountQuestion ? (lang === "en" ? `Great job! It is ${qn.answer}.` : `Bagus! Ini ${qn.answer}.`) : t.greatJob))
                      : (isCountQuestion ? (lang === "en" ? "Good try. Let's count." : "Cubaan baik. Mari kira.") : t.lookAgain)}
                  </p>
                  <p className={`font-black ${cyber ? "text-cyan-50" : "text-slate-700"}`}>
                    {t.yourAnswer}: {choseDontKnow ? (lang === "en" ? "I don't know" : "Tidak tahu") : displayedSelected}
                  </p>
                  {!isCorrect && showSolution && <p className={`font-black ${cyber ? "text-cyan-50" : "text-slate-700"}`}>{t.correctAnswer}: {displayedAnswer}</p>}
                  {!isCorrect && showSolution && qn.visual.kind === "count" && (
                    <p className={`font-black ${cyber ? "text-cyan-200" : "text-blue-800"}`}>{lang === "en" ? `This is ${qn.visual.count}.` : `Ini ${qn.visual.count}.`}</p>
                  )}
                  {!isCorrect && showSolution && <p className={`font-bold ${cyber ? "text-cyan-200" : "text-slate-600"}`}>{t.seeMethod}</p>}
                </div>
              </div>
              {!isCorrect && !showSolution && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={retryQuestion} className={`rounded-2xl border-2 px-6 py-3 font-black active:translate-y-1 ${cyber ? "border-yellow-400 bg-slate-900 text-yellow-200 shadow-[0_5px_0_#78350f]" : "border-amber-300 bg-white text-amber-800 shadow-[0_5px_0_rgba(180,83,9,.18)]"}`}>
                    {lang === "en" ? "Try again" : "Cuba lagi"}
                  </button>
                  <button onClick={() => setShowSolution(true)} className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1">
                    {lang === "en" ? "Show me how" : "Tunjuk cara"}
                  </button>
                </div>
              )}
              {showSolution && (
                <WorkedMethod
                  q={qn}
                  lang={lang}
                  visualOnlyOperationSolutions={visualOnlyOperationSolutions}
                  cyber={cyber}
                />
              )}
              {(isCorrect || showSolution) && (
                <div className="mt-4 flex gap-3">
                  {isCorrect && !showSolution && (
                    <button
                      type="button"
                      onClick={() => setShowSolution(true)}
                      className={`flex-1 rounded-2xl border-2 px-6 py-3 font-black active:translate-y-1 ${cyber ? "border-cyan-300 bg-cyan-950 text-cyan-100 shadow-[0_5px_0_#164e63]" : "border-emerald-300 bg-white text-emerald-800 shadow-[0_5px_0_rgba(5,150,105,.18)]"}`}
                    >
                      {lang === "en" ? "See solution" : "Lihat penyelesaian"}
                    </button>
                  )}
                  <button onClick={next} className="flex-[2] rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1">
                    {index === randomizedQuestions.length - 1 ? t.finish : t.nextQuestion}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </LessonShell>
    </main>
  );
}

function GroupChoiceAnswerPanel({
  visual,
  lang,
  selected,
  answered,
  revealCorrect,
  answer,
  onAnswer,
  cyber = false,
}: {
  visual: Extract<Visual, { kind: "groupChoices" }>;
  lang: Lang;
  selected: number | string | null;
  answered: boolean;
  revealCorrect: boolean;
  answer: number;
  onAnswer: (answer: number | string) => void;
  cyber?: boolean;
}) {
  return (
    <div className="my-4 space-y-4">
      {NUMBER_AUDIO_ENABLED && visual.audioValue !== undefined && (
        <AudioHearButton
          label={lang === "en" ? "Hear the number" : "Dengar nombor"}
          onClick={() => speakNumber(visual.audioValue!, lang)}
        />
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {visual.groups.map((count) => {
        const picked = selected === count;
        const right = count === answer;
        const stateClass = !answered
          ? cyber ? "border-cyan-400 bg-slate-950 hover:border-yellow-300" : "border-blue-100 bg-white hover:border-blue-300"
          : right && revealCorrect
            ? cyber ? "border-emerald-300 bg-emerald-950" : "border-emerald-600 bg-emerald-50"
            : picked
              ? cyber ? "border-orange-300 bg-orange-950" : "border-orange-500 bg-orange-50"
              : cyber ? "border-slate-700 bg-slate-950 opacity-70" : "border-slate-100 bg-slate-50 opacity-70";
        const status = !answered
          ? ""
          : right && revealCorrect
            ? (lang === "en" ? ", correct answer" : ", jawapan betul")
            : picked
              ? (lang === "en" ? ", your answer, try again" : ", jawapan awak, cuba lagi")
              : (lang === "en" ? ", not selected" : ", tidak dipilih");
        return (
          <button
            key={count}
            disabled={answered}
            onClick={() => onAnswer(count)}
            aria-label={`${lang === "en" ? "Group answer with" : "Jawapan kumpulan dengan"} ${count}${status}`}
            className={`rounded-3xl border-4 p-3 text-center shadow-[0_6px_0_rgba(0,0,0,.12)] transition active:translate-y-1 ${stateClass}`}
          >
            <ObjectGroup count={count} emoji={visual.emoji} cyber={cyber} lang={lang} />
            {answered && (picked || (right && revealCorrect)) && (
              <span className={`mt-3 inline-grid h-10 w-10 place-items-center rounded-full border-2 bg-white text-2xl font-black ${right ? "border-emerald-700 text-emerald-700" : picked ? "border-orange-700 text-orange-700" : "border-slate-200 text-slate-300"}`} aria-hidden="true">
                {right ? "✓" : picked ? "×" : ""}
              </span>
            )}
          </button>
        );
        })}
      </div>
    </div>
  );
}

function ActiveAnswerPanel({
  question,
  lang,
  answered,
  selected,
  onAnswer,
  cyber = false,
}: {
  question: Question;
  lang: Lang;
  answered: boolean;
  selected: number | string | null;
  onAnswer: (answer: number | string) => void;
  cyber?: boolean;
}) {
  const [builtCount, setBuiltCount] = useState(0);
  const [selectedObjects, setSelectedObjects] = useState<number[]>([]);
  const [selectedNone, setSelectedNone] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const [builtGroups, setBuiltGroups] = useState<number[]>([]);
  const [buildMessage, setBuildMessage] = useState<string | null>(null);
  const answer = Number(question.answer);
  const emoji =
    question.visual.kind === "groupMake" ? question.visual.emoji :
    question.visual.kind === "groupBuildMany" ? question.visual.emoji :
    question.visual.kind === "count" ? question.visual.emoji :
    question.visual.kind === "add" ? (question.visual.emoji ?? "🍌") :
    question.visual.kind === "subtract" ? (question.visual.emoji ?? "🍌") :
    "🍌";
  const selectedNumber = typeof selected === "number" ? selected : Number(selected);
  const shownCount = answered && Number.isFinite(selectedNumber) ? selectedNumber : builtCount;

  if (question.inputMode === "makeGroups" && question.visual.kind === "groupBuildMany") {
    const targets = question.visual.counts;
    const currentGroups = targets.map((_, groupIndex) => builtGroups[groupIndex] ?? 0);
    const expectedAnswer = targets.join(",");
    const updateGroup = (groupIndex: number, change: number) => {
      if (answered) return;
      setBuiltGroups((current) => targets.map((_, index) => {
        const currentValue = current[index] ?? 0;
        return index === groupIndex ? Math.max(0, Math.min(9, currentValue + change)) : currentValue;
      }));
    };

    return (
      <div className="rounded-[2rem] border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="mb-4 text-xl font-black text-emerald-950">
          {lang === "en" ? "Build every group separately." : "Bina setiap kumpulan secara berasingan."}
        </p>
        <div className={`grid gap-4 ${targets.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {targets.map((target, groupIndex) => {
            const count = currentGroups[groupIndex];
            return (
              <div key={`build-group-${groupIndex}`} className="rounded-3xl border-4 border-emerald-200 bg-white p-4">
                <h3 className="text-xl font-black text-blue-950">
                  {lang === "en" ? `Group ${groupIndex + 1}: make ${target}` : `Kumpulan ${groupIndex + 1}: bina ${target}`}
                </h3>
                <div className="my-4 min-h-32 rounded-3xl border-2 border-blue-100 bg-blue-50/50 p-4">
                  <ObjectGroup count={count} emoji={emoji} numbered lang={lang} />
                </div>
                <CountTotalBadge count={count} lang={lang} unit={objectName(emoji, count, lang)} />
                {!answered && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      disabled={count <= 0}
                      onClick={() => updateGroup(groupIndex, -1)}
                      className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-2 font-black text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.14)] active:translate-y-1 disabled:opacity-40"
                    >
                      {lang === "en" ? "Remove one" : "Buang satu"}
                    </button>
                    <button
                      type="button"
                      disabled={count >= 9}
                      onClick={() => updateGroup(groupIndex, 1)}
                      className="rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-4 py-2 font-black text-white shadow-[0_4px_0_#047857] active:translate-y-1 disabled:opacity-40"
                    >
                      {lang === "en" ? "Add one" : "Tambah satu"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          disabled={answered}
          onClick={() => onAnswer(currentGroups.join(","))}
          className="mt-5 rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
        >
          {lang === "en" ? "Check all groups" : "Semak semua kumpulan"}
        </button>
        {answered && selected !== expectedAnswer && (
          <p className="mt-4 rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-4 py-3 font-black text-orange-800">
            {lang === "en" ? "Count each group separately and try again." : "Kira setiap kumpulan secara berasingan dan cuba lagi."}
          </p>
        )}
      </div>
    );
  }

  if (question.inputMode === "makeTenBuild" && question.visual.kind === "horizontalAdd") {
    return (
      <div className={cyber ? "rounded-[2rem] border-2 border-cyan-400 bg-slate-950/70 p-2" : ""}>
        <MakeTenInteraction a={question.visual.a} b={question.visual.b} lang={lang} onSolved={() => onAnswer(answer)} />
      </div>
    );
  }

  if (question.inputMode === "carryBuild" && question.visual.kind === "verticalAdd") {
    return (
      <div className={cyber ? "rounded-[2rem] border-2 border-cyan-400 bg-slate-950/70 p-2" : ""}>
        <CarryInteraction a={question.visual.a} b={question.visual.b} lang={lang} onSolved={() => onAnswer(answer)} />
      </div>
    );
  }

  if (question.inputMode === "borrowSubtract" && question.visual.kind === "verticalSubtract") {
    return (
      <div className={cyber ? "rounded-[2rem] border-2 border-cyan-400 bg-slate-950/70 p-2" : ""}>
        <AdvancedSubtractionProductionPractice a={question.visual.a} b={question.visual.b} lang={lang} onSolved={() => onAnswer(answer)} />
      </div>
    );
  }

  if (question.inputMode === "keypad") {
    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4">
        <div className="mx-auto mb-4 grid h-16 w-24 place-items-center rounded-3xl border-4 border-yellow-200 bg-yellow-50 text-4xl font-black text-blue-950">
          {answered && Number.isFinite(selectedNumber) ? selectedNumber : "?"}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {NUMBERS.map((n) => {
            const picked = answered && n === selectedNumber;
            const correctChoice = picked && n === answer;
            const stateClass = !answered
              ? "border-blue-100 bg-blue-50 text-blue-900"
              : correctChoice
                ? "border-emerald-700 bg-emerald-500 text-white"
                : picked
                  ? "border-orange-600 bg-orange-400 text-white"
                  : "border-slate-100 bg-slate-50 text-slate-300";

            return (
              <button
                key={n}
                disabled={answered}
                onClick={() => onAnswer(n)}
                aria-label={`${lang === "en" ? "Answer" : "Jawapan"} ${n}${correctChoice ? (lang === "en" ? ", correct answer" : ", jawapan betul") : picked ? (lang === "en" ? ", your answer, try again" : ", jawapan awak, cuba lagi") : ""}`}
                className={`relative min-h-16 rounded-2xl border-2 text-3xl font-black shadow-[0_4px_0_rgba(30,64,175,.16)] active:translate-y-1 ${stateClass}`}
                style={getNumberTextStyle(n)}
              >
                <span className={picked ? "pr-6" : ""}>{n}</span>
                {picked && (
                  <span
                    aria-hidden="true"
                    className={`absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-2 bg-white shadow-sm ${correctChoice ? "border-emerald-700 text-emerald-700" : "border-orange-700 text-orange-700"}`}
                  >
                    {correctChoice ? <Check className="h-5 w-5" strokeWidth={4} /> : <X className="h-5 w-5" strokeWidth={4} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.inputMode === "tapObjects") {
    const toggleObject = (objectIndex: number) => {
      if (answered) return;
      setSelectedNone(false);
      setSelectedObjects((current) => {
        if (current.includes(objectIndex)) return current.filter((item) => item !== objectIndex);
        if (current.length >= 9) return current;
        return [...current, objectIndex];
      });
    };
    const selectionOrder = (objectIndex: number) => selectedObjects.indexOf(objectIndex) + 1;
    const hasSelection = selectedNone || selectedObjects.length > 0;
    const checkSelection = () => {
      if (!hasSelection) return;
      onAnswer(selectedNone ? 0 : selectedObjects.length);
    };
    const instruction = question.visual.kind === "audioNumber"
      ? (lang === "en" ? "Tap the objects you hear, or choose No objects. Then press Check." : "Tekan objek yang kamu dengar, atau pilih Tiada objek. Kemudian tekan Semak.")
      : answer === 0
        ? (lang === "en" ? "Choose No objects. Then press Check." : "Pilih Tiada objek. Kemudian tekan Semak.")
        : (lang === "en" ? "Tap the objects. Then press Check." : "Tekan objek. Kemudian tekan Semak.");

    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
        <p className="mb-3 text-lg font-black text-slate-700">{instruction}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {Array.from({ length: 9 }, (_, objectIndex) => {
            const selectedHere = selectedObjects.includes(objectIndex);
            const order = selectionOrder(objectIndex);
            return (
              <button
                key={objectIndex}
                type="button"
                disabled={answered}
                onClick={() => toggleObject(objectIndex)}
                aria-pressed={selectedHere}
                aria-label={`${lang === "en" ? "Object" : "Objek"} ${objectIndex + 1}${selectedHere ? (lang === "en" ? ", selected" : ", dipilih") : ""}`}
                className={`relative grid h-20 place-items-center rounded-3xl border-2 text-4xl shadow-inner active:translate-y-1 disabled:opacity-80 ${
                  selectedHere ? "border-blue-600 bg-blue-50" : "border-slate-100 bg-amber-50"
                }`}
              >
                {selectedHere && (
                  <span className="absolute -top-2 rounded-full bg-blue-600 px-2 text-xs font-black text-white">
                    {order}
                  </span>
                )}
                <SpriteIcon value={emoji} className="h-12 w-12" />
              </button>
            );
          })}
          <button
            type="button"
            disabled={answered}
            aria-pressed={selectedNone}
            onClick={() => {
              setSelectedObjects([]);
              setSelectedNone(true);
            }}
            className={`grid h-20 place-items-center rounded-3xl border-2 px-3 text-center text-lg font-black shadow-inner active:translate-y-1 disabled:opacity-80 ${
              selectedNone
                ? "border-blue-700 bg-blue-600 text-white"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {lang === "en" ? "No objects" : "Tiada objek"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            disabled={answered || !hasSelection}
            onClick={() => {
              setSelectedObjects([]);
              setSelectedNone(false);
            }}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Clear" : "Padam"}
          </button>
          <button
            disabled={answered || !hasSelection}
            onClick={checkSelection}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
      </div>
    );
  }

  if (question.inputMode === "buildTotal" && question.visual.kind === "horizontalAdd" && cyber) {
    const targetTotal = question.visual.a + question.visual.b;
    const builtTotal = answered && Number.isFinite(selectedNumber) ? selectedNumber : selectedObjects.length;
    const addToRow = () => {
      if (answered || selectedObjects.length >= 20) return;
      const nextObjects = [...selectedObjects, selectedObjects.length];
      setSelectedObjects(nextObjects);
      setBuildMessage(null);
      speakNumber(nextObjects.length, lang);
    };
    const checkRow = () => {
      if (selectedObjects.length === 0) return;
      onAnswer(selectedObjects.length);
    };

    return (
      <div className="rounded-[2rem] border-2 border-cyan-400 bg-gradient-to-br from-slate-950 to-emerald-950 p-3 text-center shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-5">
        <p className="mb-4 text-xl font-black text-cyan-50">
          {lang === "en" ? "Count both groups. Then build one row with the same total." : "Kira kedua-dua kumpulan. Kemudian bina satu baris dengan jumlah yang sama."}
        </p>
        <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="rounded-3xl border-2 border-cyan-500 bg-slate-950/75 p-3">
            <AdvancedBananaRow count={question.visual.a} />
          </div>
          <span data-math-cue="plus" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border-2 border-yellow-300 bg-yellow-300 text-3xl font-black text-slate-950 shadow-[0_5px_0_#a16207]" aria-hidden="true">+</span>
          <div className="rounded-3xl border-2 border-emerald-400 bg-slate-950/75 p-3">
            <AdvancedBananaRow count={question.visual.b} />
          </div>
        </div>

        <span data-math-cue="equals" className="mx-auto mt-5 grid h-12 w-12 place-items-center rounded-2xl border-2 border-yellow-300 bg-yellow-300 text-3xl font-black text-slate-950 shadow-[0_5px_0_#a16207]" aria-hidden="true">=</span>

        <div className="mx-auto mt-5 max-w-4xl rounded-[1.75rem] border-2 border-cyan-300 bg-slate-950/85 px-2 pb-4 pt-6 sm:px-4">
          <p className="mb-4 text-sm font-black uppercase tracking-wide text-cyan-200">{lang === "en" ? `Build the answer: ${builtTotal}` : `Bina jawapan: ${builtTotal}`}</p>
          {builtTotal > 0
            ? <AdvancedBananaRow count={builtTotal} countedThrough={builtTotal} showCountLabels />
            : <div className="grid min-h-16 place-items-center rounded-2xl border-2 border-dashed border-cyan-800 text-lg font-black text-cyan-500">{lang === "en" ? "Your row starts empty" : "Baris kamu bermula kosong"}</div>}
        </div>

        {!answered && (
          <button type="button" disabled={selectedObjects.length >= 20} onClick={addToRow} className="relative mx-auto mt-5 inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 border-yellow-200 bg-yellow-300 px-7 py-3 text-xl font-black text-slate-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-40">
            <SpriteIcon value={BANANA} className="h-9 w-9" />
            {lang === "en" ? "Add a banana to the row" : "Tambah pisang ke dalam baris"}
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>
          </button>
        )}

        {buildMessage && <p className="mx-auto mt-4 max-w-xl rounded-2xl border-2 border-yellow-400 bg-amber-950/80 px-4 py-3 font-black text-yellow-100" role="status">{buildMessage}</p>}
        {answered && <p className="mt-5 text-4xl font-black text-yellow-200">{question.visual.a} + {question.visual.b} = {targetTotal}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={answered || selectedObjects.length === 0} onClick={() => { setSelectedObjects([]); setBuildMessage(null); }} className="rounded-2xl border-2 border-cyan-500 bg-slate-900 px-5 py-3 font-black text-cyan-100 shadow-[0_4px_0_#164e63] active:translate-y-1 disabled:opacity-40">
            {lang === "en" ? "Clear row" : "Padam baris"}
          </button>
          <button type="button" disabled={answered || selectedObjects.length === 0} onClick={checkRow} className="rounded-2xl border-2 border-emerald-200 bg-emerald-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#065f46] active:translate-y-1 disabled:opacity-40">
            {lang === "en" ? "Check my row" : "Semak baris saya"}
          </button>
        </div>
      </div>
    );
  }

  if (question.inputMode === "buildTotal" && question.visual.kind === "add") {
    const groupCounts = [question.visual.a, question.visual.b];
    const targetTotal = question.visual.a + question.visual.b;
    const builtTotal = answered && Number.isFinite(selectedNumber) ? selectedNumber : selectedObjects.length;
    const addToBasket = () => {
      if (answered || selectedObjects.length >= targetTotal) return;
      const nextObjects = [...selectedObjects, selectedObjects.length];
      setSelectedObjects(nextObjects);
      setBuildMessage(null);
      speakNumber(nextObjects.length, lang);
    };
    const checkBasket = () => {
      if (selectedObjects.length === 0) return;
      if (selectedObjects.length === targetTotal) {
        onAnswer(selectedObjects.length);
        return;
      }
      setBuildMessage(
        lang === "en"
          ? "Keep adding bananas, or clear the basket and try again."
          : "Tambah lagi pisang, atau padam bakul dan cuba lagi.",
      );
    };

    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
        <p className="mb-4 text-xl font-black text-slate-800">
          {lang === "en"
            ? "Put both groups together. Build the total."
            : "Gabungkan kedua-dua kumpulan. Bina jumlah."}
        </p>
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          {groupCounts.map((groupCount, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupIndex > 0 && <span data-math-cue="plus" className="text-4xl font-black text-blue-900" aria-hidden="true">+</span>}
              <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-4">
                <ObjectGroup count={groupCount} emoji={emoji} numbered lang={lang} />
                <p className="mt-3 text-xl font-black text-amber-900">
                  {lang === "en"
                    ? `Group ${groupIndex + 1}: ${groupCount} ${objectName(emoji, groupCount, lang)}`
                    : `Kumpulan ${groupIndex + 1}: ${groupCount} ${objectName(emoji, groupCount, lang)}`}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-xl rounded-3xl border-4 border-emerald-300 bg-emerald-50 p-4">
          <ContainerScene
            count={builtTotal}
            emoji={emoji}
            container="basket"
            numbered
            hideEmptyLabel
            label={lang === "en" ? "Your basket" : "Bakul awak"}
            lang={lang}
          />
          <CountTotalBadge count={builtTotal} lang={lang} unit={objectName(emoji, builtTotal, lang)} />
        </div>

        {!answered && (
          <button
            type="button"
            disabled={selectedObjects.length >= targetTotal}
            onClick={addToBasket}
            className="relative mx-auto mt-5 inline-flex min-h-20 items-center justify-center gap-3 rounded-3xl border-2 border-yellow-500 bg-yellow-100 px-8 py-4 text-xl font-black text-amber-950 shadow-[0_6px_0_#d97706] active:translate-y-1 disabled:opacity-40"
          >
            <SpriteIcon value={emoji} className="h-12 w-12" />
            {lang === "en" ? "Add one banana" : "Tambah satu pisang"}
            <span
              className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md"
              aria-hidden="true"
            >
              <PointerIcon />
            </span>
          </button>
        )}

        {buildMessage && (
          <p className="mx-auto mt-4 max-w-xl rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 font-black text-amber-900" role="status">
            {buildMessage}
          </p>
        )}

        {answered && (
          <p className="mt-5 text-3xl font-black text-emerald-800">
            {question.visual.a} + {question.visual.b} = {targetTotal}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={answered || selectedObjects.length === 0}
            onClick={() => {
              setSelectedObjects([]);
              setBuildMessage(null);
            }}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Clear" : "Padam"}
          </button>
          <button
            type="button"
            disabled={answered || selectedObjects.length === 0}
            onClick={checkBasket}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
      </div>
    );
  }

  if (question.inputMode === "buildTeen" && question.visual.kind === "teenBundle") {
    const shownOnes = answered && Number.isFinite(selectedNumber)
      ? Math.max(0, Math.min(10, selectedNumber - 10))
      : builtCount;
    const shownValue = 10 + shownOnes;
    const addLooseBanana = () => {
      if (answered || builtCount >= 10) return;
      const nextOnes = builtCount + 1;
      speakNumber(10 + nextOnes, lang, () => {
        setBuiltCount(nextOnes);
        setBuildMessage(null);
      });
    };
    const checkTeenNumber = () => {
      if (builtCount === 0) return;
      onAnswer(10 + builtCount);
    };

    return (
      <div className="rounded-[2rem] border-4 border-emerald-300 bg-emerald-950 p-4 text-center text-white shadow-[0_7px_0_#064e3b]">
        <p className="mb-4 text-xl font-black text-yellow-200">
          {lang === "en" ? "Keep the ten. Add loose bananas to build the number." : "Kekalkan sepuluh. Tambah pisang berasingan untuk bina nombor."}
        </p>
        <div className="rounded-[1.75rem] bg-white p-4 text-slate-800">
          <TeenQuantityVisual lang={lang} tens={1} ones={shownOnes} activeTotal={shownValue} showCountLabels />
          <div className="mx-auto mt-4 grid h-20 w-28 place-items-center rounded-3xl border-4 border-yellow-400 bg-yellow-100 text-4xl font-black text-emerald-950" style={getNumberTextStyle(shownValue)}>
            {shownValue}
          </div>
        </div>
        {!answered && (
          <button
            type="button"
            disabled={builtCount >= 10}
            onClick={addLooseBanana}
            className="relative mt-5 inline-flex items-center gap-3 rounded-2xl border-2 border-yellow-500 bg-yellow-300 px-7 py-4 text-xl font-black text-emerald-950 shadow-[0_6px_0_#a16207] active:translate-y-1 disabled:opacity-50"
          >
            <SpriteIcon value={BANANA} className="h-10 w-10" />
            {lang === "en" ? "Add one loose banana" : "Tambah satu pisang berasingan"}
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-md" aria-hidden="true">
              <PointerIcon />
            </span>
          </button>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={answered || builtCount === 0}
            onClick={() => {
              setBuiltCount(0);
              setBuildMessage(null);
            }}
            className="rounded-2xl border-2 border-emerald-200 bg-white px-5 py-3 font-black text-emerald-800 shadow-[0_4px_0_rgba(0,0,0,.16)] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Clear" : "Padam"}
          </button>
          <button
            type="button"
            disabled={answered || builtCount === 0}
            onClick={checkTeenNumber}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
      </div>
    );
  }

  if (question.inputMode === "takeAway" && question.visual.kind === "subtract") {
    const startCount = question.visual.a;
    const hasNumericAnswer = Number.isFinite(selectedNumber);
    const shownRemoved = answered && hasNumericAnswer ? startCount - selectedNumber : removedCount;
    const leftCount = startCount - shownRemoved;

    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
        <p className="mb-3 text-lg font-black text-slate-700">
          {lang === "en"
            ? `Start with ${startCount} bananas.`
            : `Mula dengan ${startCount} pisang.`}
        </p>
        <CountedObjectRow count={startCount} emoji={emoji} crossed={shownRemoved} showCount={answered} countRemainingOnly showCrossCount={shownRemoved > 0} lang={lang} />
        {answered && hasNumericAnswer && <CountTotalBadge count={selectedNumber} lang={lang} unit={objectName(emoji, selectedNumber, lang)} />}
        <p className="mt-4 text-lg font-black text-blue-800">
          {lang === "en" ? "Tap to take away." : "Tekan untuk ambil."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            disabled={answered || removedCount <= 0}
            onClick={() => setRemovedCount((count) => Math.max(0, count - 1))}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-2xl font-black text-slate-600 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
            aria-label={lang === "en" ? "Put one back" : "Letak satu semula"}
          >
            +
          </button>
          <button
            disabled={answered || removedCount >= startCount}
            onClick={() => setRemovedCount((count) => Math.min(startCount, count + 1))}
            className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-6 py-3 font-black text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.14)] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Remove one" : "Ambil satu"}
          </button>
          <button
            disabled={answered || removedCount === 0}
            onClick={() => onAnswer(leftCount)}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
      </div>
    );
  }

  const instruction = answer === 0
    ? (lang === "en" ? "Leave the group empty to make 0." : "Biarkan kumpulan kosong untuk bina 0.")
    : (lang === "en" ? "Tap bananas to build your group." : "Tekan pisang untuk bina kumpulan.");

  return (
    <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
      <p className="mb-3 text-lg font-black text-slate-700">{instruction}</p>
      <ObjectGroup count={shownCount} emoji={emoji} numbered={answered} lang={lang} />
      {answered && <CountTotalBadge count={shownCount} lang={lang} unit={objectName(emoji, shownCount, lang)} />}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          disabled={answered || builtCount <= 0}
          onClick={() => setBuiltCount((count) => Math.max(0, count - 1))}
          aria-label={lang === "en" ? "Remove banana" : "Buang pisang"}
          className="rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-xl font-black text-slate-600 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
        >
          {lang === "en" ? "Remove banana" : "Buang pisang"}
        </button>
        <button
          disabled={answered || builtCount >= 9}
          onClick={() => setBuiltCount((count) => Math.min(9, count + 1))}
          className="rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-8 py-3 text-2xl font-black text-white shadow-[0_5px_0_#047857] active:translate-y-1 disabled:opacity-40"
        >
          {lang === "en" ? "Tap banana" : "Tekan pisang"}
        </button>
        <button
          disabled={answered || (builtCount === 0 && answer !== 0)}
          onClick={() => onAnswer(builtCount)}
          className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
        >
          {lang === "en" ? "Check" : "Semak"}
        </button>
      </div>
    </div>
  );
}

function CorrectCelebration({ playSound = true }: { playSound?: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const colors = ["#facc15", "#22c55e", "#3b82f6", "#fb7185", "#a855f7", "#f97316", "#14b8a6"];
  const balloons = [
    { left: "3%", color: "#fb7185", delay: "0ms" },
    { left: "14%", color: "#60a5fa", delay: "210ms" },
    { left: "28%", color: "#facc15", delay: "90ms" },
    { left: "45%", color: "#c084fc", delay: "320ms" },
    { left: "62%", color: "#34d399", delay: "150ms" },
    { left: "78%", color: "#fb923c", delay: "380ms" },
    { left: "91%", color: "#38bdf8", delay: "40ms" },
  ];

  useLayoutEffect(() => {
    let cancelled = false;
    const finishCelebration = () => {
      if (!cancelled) setIsVisible(false);
    };
    const audioStarted = playSound ? playSuccessFanfare(finishCelebration) : false;
    const hideTimer = window.setTimeout(
      finishCelebration,
      prefersReducedMotion ? 100 : audioStarted ? 13000 : 3000,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(hideTimer);
      if (playSound) stopCelebrationAudio();
    };
  }, [playSound, prefersReducedMotion]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      <span className="correct-celebration-burst" />
      {Array.from({ length: 64 }, (_, index) => (
        <span
          key={`confetti-${index}`}
          className="correct-confetti"
          style={{
            left: `${1 + ((index * 37) % 98)}%`,
            backgroundColor: colors[index % colors.length],
            animationDelay: `${(index % 12) * 55}ms`,
            animationDuration: `${2300 + (index % 7) * 130}ms`,
            width: `${7 + (index % 4) * 2}px`,
            height: `${11 + (index % 5) * 2}px`,
          }}
        />
      ))}
      {balloons.map((balloon, index) => (
        <span
          key={`balloon-${index}`}
          className="correct-balloon"
          style={{
            left: balloon.left,
            backgroundColor: balloon.color,
            animationDelay: balloon.delay,
          }}
        />
      ))}
      {Array.from({ length: 14 }, (_, index) => (
        <span
          key={`sparkle-${index}`}
          className="correct-sparkle"
          style={{
            left: `${5 + ((index * 29) % 90)}%`,
            top: `${8 + ((index * 41) % 72)}%`,
            color: colors[(index + 2) % colors.length],
            animationDelay: `${(index % 7) * 120}ms`,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

let lessonSpeechHighlightElement: HTMLElement | null = null;

type LessonNarrationToken = {
  range: Range;
  spoken: string;
  spokenStart: number;
};

function clearLessonSpeechHighlight() {
  if (lessonSpeechHighlightElement) {
    const parent = lessonSpeechHighlightElement.parentNode;
    lessonSpeechHighlightElement.replaceWith(document.createTextNode(lessonSpeechHighlightElement.textContent ?? ""));
    parent?.normalize();
    lessonSpeechHighlightElement = null;
  }
}

function showLessonSpeechHighlight(root: HTMLElement, lang: Lang, tokenIndex: number) {
  clearLessonSpeechHighlight();
  const range = collectLessonNarrationTokens(root, lang)[tokenIndex]?.range;
  if (!range) return;

  const highlight = document.createElement("span");
  highlight.className = "lesson-spoken-word-highlight";
  range.surroundContents(highlight);
  lessonSpeechHighlightElement = highlight;
}

function lessonTokenSpeech(token: string, lang: Lang) {
  const cleanToken = token
    .replace(/^[^A-Za-zÀ-ž0-9+\-=×−]+|[^A-Za-zÀ-ž0-9+\-=×−]+$/g, "")
    .trim();
  if (!cleanToken) return "";
  const mathWords = lang === "ms"
    ? { minus: "tolak", plus: "tambah", equals: "sama dengan", times: "darab" }
    : { minus: "minus", plus: "plus", equals: "equals", times: "times" };
  if (/^[0-9+=×−-]+$/.test(cleanToken)) {
    return cleanToken
      .replace(/[−-]/g, ` ${mathWords.minus} `)
      .replace(/\+/g, ` ${mathWords.plus} `)
      .replace(/=/g, ` ${mathWords.equals} `)
      .replace(/×/g, ` ${mathWords.times} `)
      .replace(/\s+/g, " ")
      .trim();
  }
  return cleanToken;
}

function collectLessonNarrationTokens(root: HTMLElement, lang: Lang) {
  const rawTokens: Array<{ range: Range; spoken: string }> = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    const explicitlyReadable = parent?.closest("[data-narration-read='true']");
    const blocked = parent?.closest("button, h1, h2, h3, h4, h5, h6, [role='heading'], [aria-hidden='true'], [hidden], [data-narration-ignore='true']");
    if (parent && (explicitlyReadable || !blocked)) {
      const style = window.getComputedStyle(parent);
      const visible = parent.getClientRects().length > 0
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || "1") > 0
        && style.color !== "rgba(0, 0, 0, 0)";
      if (visible) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/\S+/g)) {
          if (match.index === undefined) continue;
          const spoken = lessonTokenSpeech(match[0], lang);
          if (!spoken) continue;
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          rawTokens.push({ range, spoken });
        }
      }
    }
    node = walker.nextNode();
  }

  let spokenOffset = 0;
  return rawTokens.map(({ range, spoken }) => {
    const token: LessonNarrationToken = { range, spoken, spokenStart: spokenOffset };
    spokenOffset += spoken.length + 1;
    return token;
  });
}

function LessonShell({ lang, title, helper, children, variant = "default" }: {
  lang: Lang;
  title: string;
  helper?: string;
  children: React.ReactNode;
  variant?: "default" | "cyber";
}) {
  const soundEnabled = React.useContext(AudioEnabledContext);
  const contentRef = useRef<HTMLElement>(null);
  const narrationRunRef = useRef(0);
  const [narrating, setNarrating] = useState(false);
  const cyber = variant === "cyber";

  const stopLessonNarration = useCallback(() => {
    narrationRunRef.current += 1;
    clearLessonSpeechHighlight();
    setNarrating(false);
  }, []);

  useEffect(() => {
    if (!soundEnabled) stopLessonNarration();
  }, [soundEnabled, stopLessonNarration]);

  useEffect(() => () => {
    narrationRunRef.current += 1;
    clearLessonSpeechHighlight();
  }, []);

  const startLessonNarration = () => {
    // Full lesson narration stays unavailable until matching recordings exist.
  };

  return (
    <section
      ref={contentRef}
      className={cyber ? "mobile-lesson-panel cyber-lesson-panel rounded-[2rem] p-4 text-white md:p-6" : "mobile-lesson-panel lesson-panel rounded-[2rem] p-4 md:p-6"}
      onClickCapture={(event) => {
        const target = event.target as Element;
        if (narrating && target.closest("button") && !target.closest("[data-lesson-narration-control='true']")) {
          stopLessonNarration();
        }
      }}
    >
      <div className="mb-5 text-center" data-narration-ignore="true">
        {cyber && (
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-orange-200">
            {lang === "en" ? "Sunset learning mission" : "Misi pembelajaran senja"}
          </p>
        )}
        <h2 className={`text-3xl font-black leading-tight md:text-4xl ${cyber ? "text-amber-100" : "text-blue-950"}`}>{title}</h2>
        {helper && <p className={`mx-auto mt-2 max-w-2xl text-sm font-bold leading-snug md:text-base ${cyber ? "text-orange-50" : "text-slate-600"}`}>{helper}</p>}
      </div>
      {WORD_AUDIO_ENABLED && soundEnabled && (
        <div className="mb-5 flex justify-center" data-lesson-narration-control="true" data-narration-ignore="true">
          <button
            type="button"
            onClick={startLessonNarration}
            disabled={narrating}
            className={`relative rounded-2xl border-2 px-6 py-3 font-black text-white active:translate-y-1 disabled:cursor-wait disabled:opacity-70 ${cyber ? "border-cyan-300 bg-cyan-700 shadow-[0_5px_0_#164e63]" : "border-blue-700 bg-blue-600 shadow-[0_5px_0_#1e3a8a]"}`}
          >
            {narrating
              ? (lang === "en" ? "Playing lesson..." : "Sedang main...")
              : (lang === "en" ? "Tap to start lesson" : "Tekan untuk mula belajar")}
            <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
              <PointerIcon />
            </span>
          </button>
        </div>
      )}
      {children}
    </section>
  );
}

function CharacterTalk({ lang, text }: { lang: Lang; text: string }) {
  return (
    <div className="talk-bubble flex items-center gap-3 rounded-3xl p-4">
      <img src={chrysThinking} alt="Chrys" className="h-20 w-20 object-contain" />
      <p className="whitespace-pre-line text-xl font-black leading-snug text-slate-800 md:text-2xl">
        <span className="box-decoration-clone rounded-xl bg-yellow-100 px-2 py-1 text-blue-950">{text}</span>
      </p>
      {WORD_AUDIO_ENABLED && (
        <button
          type="button"
          onClick={() => speakText(text, lang)}
          aria-label={audioMuted ? (lang === "en" ? "Sound is muted" : "Bunyi ditutup") : (lang === "en" ? "Hear this teaching text" : "Dengar teks pelajaran ini")}
          className={`ml-auto grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-blue-200 bg-white text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.16)] active:translate-y-1 ${audioMuted ? "opacity-45" : ""}`}
        >
          <SpeakerIcon />
        </button>
      )}
    </div>
  );
}

function AudioHearButton({ label, onClick, cyber = false }: { label: string; onClick: () => void; cyber?: boolean }) {
  return (
    <div className={`flex items-center justify-center rounded-[2rem] border-4 p-5 shadow-inner ${cyber ? "border-cyan-500 bg-slate-950/80 shadow-[inset_0_0_24px_rgba(34,211,238,.12)]" : "border-blue-100 bg-white/85"}`}>
      <button
        onClick={onClick}
        aria-label={label}
        className={`relative grid h-24 w-24 place-items-center rounded-3xl border-4 text-white active:translate-y-1 ${cyber ? "border-cyan-300 bg-cyan-600 shadow-[0_7px_0_#164e63,0_0_20px_rgba(34,211,238,.22)]" : "border-blue-200 bg-blue-600 shadow-[0_7px_0_#1e3a8a]"}`}
      >
        <SpeakerIcon />
        <span className="pointer-events-none absolute -right-3 -top-4 rotate-45 rounded-full border-2 border-yellow-300 bg-yellow-100 px-3 py-2 shadow-md" aria-hidden="true">
          <PointerIcon />
        </span>
      </button>
    </div>
  );
}

function AudioNumberSolutionCard({ value, lang, cyber = false }: { value: number; lang: Lang; cyber?: boolean }) {
  const word = numberWordFor(value, lang);
  const displayWord = word.charAt(0).toUpperCase() + word.slice(1);
  const spelledWord = word.split("").join(" - ");
  const replayLabel = lang === "en" ? `Hear ${word} again` : `Dengar ${word} sekali lagi`;

  return (
    <div
      className={`mx-auto grid w-full max-w-4xl gap-4 rounded-[2rem] border-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 ${
        cyber
          ? "border-cyan-300 bg-slate-950 shadow-[0_8px_0_#164e63,0_0_28px_rgba(34,211,238,.16)]"
          : "border-blue-100 bg-white/90 shadow-[0_8px_0_rgba(30,64,175,.12)]"
      }`}
    >
      <div
        className={`grid min-h-56 place-items-center rounded-[1.6rem] border-2 p-5 ${
          cyber ? "border-cyan-400 bg-cyan-950/45" : "border-yellow-200 bg-yellow-50"
        }`}
      >
        <div
          className={`grid h-40 w-40 place-items-center rounded-[2rem] border-4 text-7xl font-black sm:h-48 sm:w-48 sm:text-8xl ${
            cyber
              ? "border-yellow-300 bg-yellow-300 text-slate-950 shadow-[0_8px_0_#a16207,0_0_24px_rgba(250,204,21,.2)]"
              : "border-yellow-500 bg-yellow-400 text-white shadow-[0_8px_0_#b7791f]"
          }`}
          style={getNumberTextStyle(value)}
          aria-label={`${lang === "en" ? "Number" : "Nombor"} ${value}`}
        >
          {value}
        </div>
      </div>

      <div
        className={`flex min-h-56 flex-col items-center justify-center rounded-[1.6rem] border-2 p-5 text-center ${
          cyber ? "border-cyan-400 bg-cyan-950/45" : "border-blue-100 bg-blue-50/70"
        }`}
      >
        <p className={`text-sm font-black uppercase tracking-[0.16em] ${cyber ? "text-cyan-300" : "text-blue-600"}`}>
          {lang === "en" ? "Listen and learn" : "Dengar dan belajar"}
        </p>
        <div className="mt-4">
          <AudioHearButton label={replayLabel} onClick={() => speakNumber(value, lang)} cyber={cyber} />
        </div>
        <p className={`mt-5 text-lg font-black sm:text-xl ${cyber ? "text-cyan-50" : "text-slate-700"}`}>
          {lang === "en" ? `The audio says ${word}.` : `Audio menyebut ${word}.`}
        </p>
        <p className={`mt-2 text-4xl font-black sm:text-5xl ${cyber ? "text-yellow-200" : "text-blue-950"}`}>
          &ldquo;{displayWord}&rdquo;
        </p>
        <p className={`mt-3 break-words text-lg font-black tracking-wide sm:text-xl ${cyber ? "text-cyan-100" : "text-slate-600"}`}>
          {spelledWord}
        </p>
      </div>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <path d="M4 9.5v5h4l5 4.2V5.3l-5 4.2H4Z" fill="currentColor" />
      <path d="M16.2 8.2a5 5 0 0 1 0 7.6M18.7 5.7a8.5 8.5 0 0 1 0 12.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function PointerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-yellow-700" aria-hidden="true">
      <path d="M8 3.8v8.1L6.6 10.5a2 2 0 0 0-2.8 2.8l5.1 5.1c1.1 1.1 2.5 1.8 4.1 1.8h2.2a4.8 4.8 0 0 0 4.8-4.8v-4.2a1.8 1.8 0 0 0-3.1-1.2 1.8 1.8 0 0 0-3.1-.9 1.8 1.8 0 0 0-2.2-.4V3.8a1.8 1.8 0 0 0-3.6 0Z" fill="currentColor" stroke="#A86000" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function NumberTile({ value, lang, large = false, showWord = true }: { value: number; lang: Lang; large?: boolean; showWord?: boolean }) {
  return (
    <div className={`mx-auto grid place-items-center rounded-[2rem] border-4 border-yellow-500 bg-yellow-400 text-white ${large ? "h-48 w-48" : "h-24 w-24"}`}>
      <div className="text-center">
        <div className={`${large ? "text-8xl" : "text-5xl"} font-black leading-none`} style={getNumberTextStyle(value)}>{value}</div>
        {showWord && <div className="mt-1 text-sm font-black uppercase tracking-wide">{WORDS[lang][value]}</div>}
      </div>
    </div>
  );
}

function SpellWordCard({ value, lang }: { value: number; lang: Lang }) {
  const word = WORDS[lang][value];
  return (
    <div className="rounded-[2rem] border-4 border-yellow-200 bg-yellow-50 p-6 text-center">
      <p className="text-6xl font-black text-blue-950">{word}</p>
      <div
        className="mt-5 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${word.length}, minmax(0, 1fr))` }}
      >
        {word.split("").map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className={`grid aspect-square w-full max-w-14 place-items-center justify-self-center rounded-2xl border-2 border-blue-100 bg-white font-black text-blue-900 shadow-inner ${
              word.length > 6 ? "text-xl" : "text-3xl"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
      <p className="mt-4 text-lg font-black text-slate-600">{word.split("").join(" - ")}</p>
    </div>
  );
}

function ObjectGroup({ count, emoji, numbered = false, crossed = 0, crossedLabels = false, cyber = false, lang = "en", maxPerRow = 4, countedThrough, isCounting = false }: { count: number; emoji: string; numbered?: boolean; crossed?: number; crossedLabels?: boolean; cyber?: boolean; lang?: Lang; maxPerRow?: number; countedThrough?: number; isCounting?: boolean }) {
  if (count === 0) {
    return <div className={`mx-auto rounded-3xl border-4 border-dashed p-8 text-center text-2xl font-black ${cyber ? "border-cyan-700 bg-slate-950/80 text-cyan-300" : "border-slate-200 bg-white text-slate-400"}`}>{numbered ? "0" : lang === "en" ? "empty" : "kosong"}</div>;
  }
  return (
    <div className={`mobile-object-group mx-auto flex w-full min-w-0 flex-col items-center gap-y-6 overflow-hidden rounded-3xl border-2 px-5 pb-5 pt-8 sm:px-7 ${cyber ? "border-cyan-700/80 bg-slate-950/75 shadow-[inset_0_0_24px_rgba(34,211,238,.10)]" : "border-slate-100 bg-white"}`}>
      {balancedIndexRows(count, maxPerRow).map((row, rowIndex) => (
        <div key={rowIndex} className="mx-auto flex w-fit max-w-full min-w-0 items-center justify-center gap-3">
          {row.map((i) => {
        const gone = i < crossed;
        const countingMode = countedThrough !== undefined;
        const counted = !countingMode || i < countedThrough;
        const active = countingMode && isCounting && i === countedThrough - 1;
        return (
          <div className={`relative grid h-12 w-12 place-items-center rounded-xl border-2 pt-3 text-3xl shadow-inner sm:h-16 sm:w-16 sm:rounded-2xl sm:text-4xl ${
            gone
              ? cyber ? "border-red-700 bg-slate-900" : "border-red-200 bg-amber-50"
              : active
                ? "z-10 scale-110 border-yellow-400 bg-yellow-50 ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.65)]"
              : countingMode && !counted
                ? cyber ? "border-cyan-900 bg-slate-950 opacity-30" : "border-slate-200 bg-slate-50 opacity-30"
              : numbered
                ? cyber ? "border-cyan-400 bg-cyan-950 ring-2 ring-cyan-700" : "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                : cyber ? "border-cyan-900 bg-slate-900" : "border-amber-100 bg-amber-50"
          }`} key={i}>
            <span className="opacity-100 saturate-100 grayscale-0">
              <SpriteIcon value={emoji} className="h-9 w-9 sm:h-12 sm:w-12" />
            </span>
            {((numbered && counted) || (crossedLabels && gone)) && (
              <span className={`absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full px-1.5 text-xs font-black leading-none shadow-sm ${gone ? "bg-red-600 text-white" : active ? "bg-yellow-400 text-slate-950" : "bg-blue-600 text-white"}`}>
                {i + 1}
              </span>
            )}
            {gone && (
              <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-hidden="true">
                <span className="absolute h-2.5 w-8 rotate-45 rounded-full border border-white bg-red-600 shadow-sm" />
                <span className="absolute h-2.5 w-8 -rotate-45 rounded-full border border-white bg-red-600 shadow-sm" />
              </span>
            )}
          </div>
        );
          })}
        </div>
      ))}
    </div>
  );
}

function ContainerScene({
  count,
  emoji,
  container,
  numbered = false,
  hideEmptyLabel = false,
  label,
  lang = "en",
}: {
  count: number;
  emoji: string;
  container: ContainerKind;
  numbered?: boolean;
  hideEmptyLabel?: boolean;
  label?: string;
  lang?: Lang;
}) {
  const image = container === "basket" ? BASKET_SPRITE : trayPhoto;
  const alt = container === "basket" ? "basket" : "tray";

  return (
    <div className="mobile-container-scene mx-auto max-w-xl rounded-3xl border-2 border-amber-100 bg-white p-4">
      <div className="relative mx-auto aspect-[4/3] max-h-80 overflow-hidden rounded-3xl bg-amber-50">
        <img src={image} alt={alt} className="absolute inset-0 z-0 h-full w-full object-contain" />
        <div className={`absolute z-10 grid content-center justify-items-center overflow-hidden px-3 py-4 ${container === "basket" ? "inset-[18%] gap-y-3" : "inset-x-[16%] inset-y-[18%] gap-y-5"}`}>
          {balancedIndexRows(count, container === "basket" ? 4 : 5).map((row, rowIndex) => (
            <div key={rowIndex} className="flex w-full min-w-0 items-center justify-center gap-3">
              {row.map((i) => (
                <div
                  key={i}
                  className={`relative grid shrink-0 place-items-center rounded-2xl border-2 pt-3 shadow-md ${container === "basket" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-14 w-14"} ${
                    numbered ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-white/70 bg-white/90"
                  }`}
                >
                  <SpriteIcon value={emoji} className={container === "basket" ? "h-8 w-8 sm:h-10 sm:w-10" : "h-11 w-11"} />
                  {numbered && <span className="absolute -top-2 left-1/2 z-20 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full bg-blue-600 px-1.5 text-xs font-black leading-none text-white shadow-sm">{i + 1}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {label && <p className="mt-3 text-center text-xl font-black text-amber-900">{label}</p>}
      {count === 0 && !hideEmptyLabel && (
        <div className="mx-auto mt-3 max-w-xs rounded-2xl border-2 border-dashed border-slate-200 bg-white/85 px-4 py-3 text-center text-2xl font-black text-slate-400">
          {numbered ? "0" : lang === "en" ? "empty" : "kosong"}
        </div>
      )}
    </div>
  );
}

function NumberLine({ marked }: { marked: number | number[] }) {
  return <NumberLineSequence nums={NUMBERS} marked={marked} arrow="right" />;
}

function ManualCountedObjectRow({ count, emoji, lang, onProgress, onComplete, announceTotal = false, compact = false, fixedColumns, rowPattern, cyber = false }: {
  count: number;
  emoji: string;
  lang: Lang;
  onProgress?: (value: number) => void;
  onComplete?: () => void;
  announceTotal?: boolean;
  compact?: boolean;
  fixedColumns?: 1 | 2;
  rowPattern?: number[];
  cyber?: boolean;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const countRunRef = useRef(0);

  useEffect(() => {
    countRunRef.current += 1;
    setVisibleCount(0);
    setBusy(false);
    stopNumberAudio();
    return () => {
      countRunRef.current += 1;
      stopNumberAudio();
    };
  }, [count, emoji, lang]);

  const countWholeGroup = async () => {
    if (busy || visibleCount >= count) return;
    const runId = countRunRef.current + 1;
    countRunRef.current = runId;
    setBusy(true);
    setVisibleCount(0);
    onProgress?.(0);
    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await playRecordedVoiceFile(COUNT_PROMPT_AUDIO_FILES[lang]);
      await wait(120);
    }
    const reveal = (value: number) => {
      if (countRunRef.current !== runId) return;
      setVisibleCount(value);
      onProgress?.(value);
    };
    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakCountingSequence(count, lang, COUNTING_STEP_MS, reveal);
    } else {
      for (let value = 1; value <= count; value += 1) {
        if (countRunRef.current !== runId) return;
        reveal(value);
        if (value < count) await wait(prefersReducedMotion ? 80 : COUNTING_STEP_MS);
      }
      lastCountingFinishedAt = performance.now();
      await wait(COUNT_TOTAL_REVEAL_DELAY_MS);
    }
    if (countRunRef.current !== runId) return;
    setVisibleCount(count);
    onProgress?.(count);
    setBusy(false);
    if (announceTotal) await speakRecordedBananaTotal(count, lang, emoji);
    if (countRunRef.current === runId) onComplete?.();
  };

  return (
    <div className="space-y-3">
      <CountedObjectRow
        count={count}
        emoji={emoji}
        showCount
        visibleCount={visibleCount}
        compact={compact}
        fixedColumns={fixedColumns}
        rowPattern={rowPattern}
        cyber={cyber}
        lang={lang}
        highlightActiveCount={busy}
      />
      {visibleCount < count && (
        <button
          type="button"
          onClick={() => void countWholeGroup()}
          disabled={busy}
          className="relative mx-auto block rounded-2xl border-2 border-blue-700 bg-blue-600 px-5 py-2 font-black text-white shadow-[0_4px_0_#1e3a8a] active:translate-y-1 disabled:opacity-60"
        >
          {busy
            ? (lang === "en" ? "Counting..." : "Mengira...")
            : lang === "en"
              ? `Count the number of ${objectName(emoji, 2, lang)}`
              : `Kira bilangan ${objectName(emoji, 2, lang)}`}
          {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100"><PointerIcon /></span>}
        </button>
      )}
    </div>
  );
}

function NumberLineSequence({ nums, marked, arrow = "right" }: { nums: Array<number | "?">; marked: number | number[]; arrow?: "left" | "right" }) {
  const compact = nums.length <= 5;
  const markedNumbers = Array.isArray(marked) ? marked : [marked];
  const numberSize = compact
    ? "h-7 w-7 text-xs sm:h-10 sm:w-10 sm:text-base md:h-12 md:w-12 lg:h-14 lg:w-14 lg:text-xl"
    : "h-8 w-8 text-sm sm:h-11 sm:w-11 sm:text-lg md:h-14 md:w-14 md:text-xl lg:h-16 lg:w-16 lg:text-2xl";
  const arrowPosition = `${compact ? "top-2 sm:top-3 md:top-3 lg:top-4" : "top-2.5 sm:top-3.5 md:top-4 lg:top-5"} absolute left-[calc(100%+0.125rem)] z-20 h-3 w-3 -translate-x-1/2 text-emerald-700 sm:left-[calc(100%+0.375rem)] sm:h-4 sm:w-4 md:left-[calc(100%+0.875rem)] md:h-6 md:w-6 lg:left-[calc(100%+1rem)] xl:left-[calc(100%+1.25rem)]`;

  return (
    <div className="w-full overflow-hidden rounded-3xl border-2 border-sky-200 bg-sky-50/70 p-2 pb-3 sm:p-5 sm:pb-4">
      <div
        className={`relative mx-auto grid w-full min-w-0 gap-1 px-0 pb-3 sm:gap-3 sm:px-1 md:gap-7 lg:gap-8 xl:gap-10 ${compact ? "max-w-3xl" : "max-w-7xl"}`}
        style={{ gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))` }}
      >
        <div className="absolute bottom-3 left-3 right-3 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 shadow-[0_3px_0_rgba(14,116,144,.18)] sm:bottom-4 sm:left-6 sm:right-6 sm:h-3" aria-hidden="true" />
        {nums.map((n, i) => {
          const missing = n === "?";
          const selected = !missing && markedNumbers.includes(n);
          return (
          <div key={`${n}-${i}`} className="relative z-10 flex flex-col items-center">
            {i < nums.length - 1 && (arrow === "right" ? (
              <ArrowRight className={arrowPosition} strokeWidth={3} aria-hidden="true" />
            ) : (
              <ArrowLeft className={arrowPosition} strokeWidth={3} aria-hidden="true" />
            ))}
            <div className={`mb-2 grid place-items-center rounded-full border-2 font-black shadow-[0_3px_0_rgba(15,23,42,.12)] sm:mb-3 sm:border-4 ${numberSize} ${missing ? "border-amber-500 bg-yellow-50 text-yellow-900" : selected ? "border-amber-500 bg-yellow-300 text-blue-950" : "border-sky-300 bg-white text-blue-950"}`}>{n}</div>
            <div className={`h-6 w-1.5 rounded-full sm:h-8 sm:w-2 md:h-9 md:w-2.5 ${missing || selected ? "bg-amber-500" : "bg-sky-500"}`} />
          </div>
          );
        })}
      </div>
    </div>
  );
}

function sequenceReferenceValues(nums: Array<number | "?">) {
  const missingIndex = nums.findIndex((value) => value === "?");
  const adjacentGaps = nums.slice(1).flatMap((value, index) => {
    const previous = nums[index];
    return typeof previous === "number" && typeof value === "number" ? [value - previous] : [];
  });
  const step = adjacentGaps.find((gap) => gap !== 0) ?? 1;
  const before = nums[missingIndex - 1];
  const after = nums[missingIndex + 1];
  const answer = typeof before === "number"
    ? before + step
    : typeof after === "number"
      ? after - step
      : 0;
  return { answer };
}

function SequenceReferenceSolution({ nums, lang }: { nums: Array<number | "?">; lang: Lang }) {
  const { answer } = sequenceReferenceValues(nums);
  const before = answer > 0 ? answer - 1 : null;
  const after = answer < 9 ? answer + 1 : null;
  return (
    <div className="space-y-4">
      <NumberLine marked={answer} />
      <NumberOrderRelationship before={before} answer={answer} after={after} lang={lang} />
    </div>
  );
}

function SameValueVisual({ count, emojis, lang, showSummary = true }: { count: number; emojis: string[]; lang: Lang; showSummary?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {emojis.map((emoji, index) => (
          <div key={`${emoji}-${index}`} className="rounded-3xl border-2 border-emerald-100 bg-white p-3 text-center shadow-inner">
            <ObjectGroup count={count} emoji={emoji} lang={lang} />
            <p className="mt-2 text-lg font-black text-emerald-900">{lang === "en" ? `Group ${index + 1}` : `Kumpulan ${index + 1}`}</p>
          </div>
        ))}
      </div>
      {showSummary && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xl font-black text-emerald-900">
          {lang === "en" ? `All groups have ${count}.` : `Semua kumpulan ada ${count}.`}
        </p>
      )}
    </div>
  );
}

function LayoutValueVisual({ count, emoji, lang, showSummary = true }: { count: number; emoji: string; lang: Lang; showSummary?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <LayoutGroup count={count} emoji={emoji} layout="row" label={lang === "en" ? "Row" : "Baris"} />
        <LayoutGroup count={count} emoji={emoji} layout="twoGroups" label={lang === "en" ? "Two groups" : "Dua kumpulan"} />
        <LayoutGroup count={count} emoji={emoji} layout="spread" label={lang === "en" ? "Spread out" : "Berselerak"} />
      </div>
      {showSummary && (
        <p className="rounded-2xl bg-yellow-50 px-4 py-3 text-center text-xl font-black text-yellow-900">
          {lang === "en" ? `They are all ${count}.` : `Semua ialah ${count}.`}
        </p>
      )}
    </div>
  );
}

function LayoutGroup({ count, emoji, layout, label }: { count: number; emoji: string; layout: "row" | "twoGroups" | "spread"; label: string }) {
  const positions = layout === "spread"
    ? ["self-start", "self-center", "self-end", "self-center", "self-start", "self-end", "self-start", "self-center", "self-end"]
    : [];
  return (
    <div className="rounded-3xl border-2 border-blue-100 bg-white p-3 text-center shadow-inner">
      <div className={`mx-auto flex min-h-36 max-w-48 flex-wrap justify-center gap-3 rounded-3xl bg-blue-50 p-5 ${layout === "row" ? "items-center" : "items-start"}`}>
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`grid h-10 w-10 place-items-center rounded-2xl bg-white text-2xl shadow-inner ${layout === "spread" ? positions[i] : ""} ${layout === "twoGroups" && i === Math.ceil(count / 2) ? "ml-5" : ""}`}
          >
            <SpriteIcon value={emoji} className="h-8 w-8" />
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm font-black text-blue-900">{label}</p>
    </div>
  );
}

function CompareGroupsVisual({ a, b, emojiA, emojiB, lang, showReason = false }: { a: number; b: number; emojiA: string; emojiB: string; lang: Lang; showReason?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border-2 border-blue-100 bg-white p-3 text-center shadow-inner">
          <ObjectGroup count={a} emoji={emojiA} lang={lang} />
          <p className="mt-2 text-xl font-black text-blue-900">{lang === "en" ? "Group A" : "Kumpulan A"}</p>
        </div>
        <div className="rounded-3xl border-2 border-blue-100 bg-white p-3 text-center shadow-inner">
          <ObjectGroup count={b} emoji={emojiB} lang={lang} />
          <p className="mt-2 text-xl font-black text-blue-900">{lang === "en" ? "Group B" : "Kumpulan B"}</p>
        </div>
      </div>
      {showReason && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-lg font-black text-emerald-900">
          {lang === "en" ? `${Math.min(a, b)} is less. ${Math.max(a, b)} is more.` : `${Math.min(a, b)} lebih sedikit. ${Math.max(a, b)} lebih banyak.`}
        </p>
      )}
    </div>
  );
}

function CountedGroupTwoSolution({ visual, lang }: {
  visual: Extract<Visual, { kind: "groupTwo" }>;
  lang: Lang;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-4 border-emerald-200 bg-white p-3 text-center">
          <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Group 1" : "Kumpulan 1"}</p>
          <ObjectGroup count={visual.a} emoji={visual.emoji} numbered lang={lang} maxPerRow={3} />
          <CountTotalBadge count={visual.a} lang={lang} unit={objectName(visual.emoji, visual.a, lang)} />
        </div>

        <div className="rounded-3xl border-4 border-emerald-200 bg-white p-3 text-center">
          <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Group 2" : "Kumpulan 2"}</p>
          <ObjectGroup count={visual.b} emoji={visual.emoji} numbered lang={lang} maxPerRow={3} />
          <CountTotalBadge count={visual.b} lang={lang} unit={objectName(visual.emoji, visual.b, lang)} />
        </div>
      </div>
      <GroupingAnswerLine text={lang === "en"
        ? `The answer is ${visual.a}, ${visual.b}.`
        : `Jawapannya ialah ${visual.a}, ${visual.b}.`} />
    </div>
  );
}

function CountedCompareGroupsSolution({ visual, lang }: {
  visual: Extract<Visual, { kind: "compareGroups" }>;
  lang: Lang;
}) {
  const [stage, setStage] = useState(0);
  const spokenComparisonRef = useRef<string | null>(null);
  const finishFirstGroup = useCallback(() => setStage((current) => Math.max(current, 1)), []);
  const finishSecondGroup = useCallback(() => setStage(2), []);
  const smaller = Math.min(visual.a, visual.b);
  const larger = Math.max(visual.a, visual.b);
  const largerGroup = visual.a > visual.b ? "Group A" : "Group B";
  const smallerGroup = visual.a < visual.b ? "Group A" : "Group B";
  const largerGroupMs = visual.a > visual.b ? "Kumpulan A" : "Kumpulan B";
  const smallerGroupMs = visual.a < visual.b ? "Kumpulan A" : "Kumpulan B";
  const largerEmoji = visual.a > visual.b ? visual.emojiA : visual.emojiB;
  const smallerEmoji = visual.a < visual.b ? visual.emojiA : visual.emojiB;

  useEffect(() => {
    setStage(0);
    spokenComparisonRef.current = null;
  }, [visual.a, visual.b]);

  useEffect(() => {
    if (stage < 2) return;
    const symbol = visual.a === visual.b ? "=" : visual.a > visual.b ? ">" : "<";
    const key = `${lang}:${visual.a}:${symbol}:${visual.b}`;
    if (spokenComparisonRef.current === key) return;
    spokenComparisonRef.current = key;
    void speakComparisonSentence(visual.a, visual.b, symbol, lang);
  }, [lang, stage, visual.a, visual.b]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-3xl border-4 p-3 text-center transition-colors ${stage === 0 ? "border-blue-500 bg-blue-50" : "border-emerald-200 bg-white"}`}>
          <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Group A" : "Kumpulan A"}</p>
          <ManualCountedObjectRow
            count={visual.a}
            emoji={visual.emojiA}
            lang={lang}
            announceTotal
            onComplete={finishFirstGroup}
          />
          {stage >= 1 && (
            <p className="mt-3 rounded-full bg-emerald-100 px-4 py-2 text-xl font-black text-emerald-900">
              {`${lang === "en" ? "Total" : "Jumlah"}: ${visual.a} ${objectName(visual.emojiA, visual.a, lang)}`}
            </p>
          )}
        </div>

        <div className={`rounded-3xl border-4 p-3 text-center transition-colors ${stage === 1 ? "border-blue-500 bg-blue-50" : "border-emerald-200 bg-white"} ${stage === 0 ? "opacity-35 grayscale" : ""}`}>
          <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Group B" : "Kumpulan B"}</p>
          {stage >= 1 ? (
            <ManualCountedObjectRow
              count={visual.b}
              emoji={visual.emojiB}
              lang={lang}
              announceTotal
              onComplete={finishSecondGroup}
            />
          ) : (
            <ObjectGroup count={visual.b} emoji={visual.emojiB} lang={lang} />
          )}
          {stage >= 2 && (
            <p className="mt-3 rounded-full bg-emerald-100 px-4 py-2 text-xl font-black text-emerald-900">
              {`${lang === "en" ? "Total" : "Jumlah"}: ${visual.b} ${objectName(visual.emojiB, visual.b, lang)}`}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-lg font-black text-emerald-900" aria-live="polite">
        {stage === 0
          ? (lang === "en" ? "Count Group A first." : "Kira Kumpulan A dahulu.")
          : stage === 1
            ? (lang === "en" ? "Now count Group B." : "Sekarang kira Kumpulan B.")
            : visual.ask === "same"
              ? visual.a === visual.b
                ? (lang === "en" ? "The groups are the same." : "Kumpulan ini sama.")
                : (lang === "en" ? "The groups are different." : "Kumpulan ini berbeza.")
              : visual.ask === "more"
                ? (
                  <div className="space-y-1">
                    <p>
                      {lang === "en"
                        ? `${larger} ${objectName(largerEmoji, larger, "en")} is more than ${smaller} ${objectName(smallerEmoji, smaller, "en")}.`
                        : `${larger} ${objectName(largerEmoji, larger, "ms")} lebih banyak daripada ${smaller} ${objectName(smallerEmoji, smaller, "ms")}.`}
                    </p>
                    <p>
                      {lang === "en"
                        ? `${largerGroup} has more ${objectName(largerEmoji, larger, "en")} than ${smallerGroup}.`
                        : `${largerGroupMs} mempunyai lebih banyak ${objectName(largerEmoji, larger, "ms")} daripada ${smallerGroupMs}.`}
                    </p>
                  </div>
                )
                : (lang === "en" ? `${smaller} is less.` : `${smaller} lebih sedikit.`)}
      </div>
    </div>
  );
}

function CountedGroupCombineSolution({ visual, lang }: {
  visual: Extract<Visual, { kind: "groupCombine" }>;
  lang: Lang;
}) {
  const [stage, setStage] = useState(0);
  const total = visual.a + visual.b;
  const finishFirstGroup = useCallback(() => setStage((current) => Math.max(current, 1)), []);
  const finishSecondGroup = useCallback(() => setStage((current) => Math.max(current, 2)), []);
  const finishTotal = useCallback(() => setStage(3), []);

  useEffect(() => setStage(0), [visual.a, visual.b, visual.emoji]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`rounded-3xl border-4 p-3 text-center transition-colors ${stage === 0 ? "border-blue-500 bg-blue-50" : "border-emerald-200 bg-white"}`}>
          <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Group 1" : "Kumpulan 1"}</p>
          <ManualCountedObjectRow
            count={visual.a}
            emoji={visual.emoji}
            onComplete={finishFirstGroup}
            lang={lang}
          />
          {stage >= 1 && <CountTotalBadge count={visual.a} lang={lang} unit={objectName(visual.emoji, visual.a, lang)} />}
        </div>

        <div className={`rounded-3xl border-4 p-3 text-center transition-colors ${stage === 1 ? "border-blue-500 bg-blue-50" : "border-emerald-200 bg-white"} ${stage === 0 ? "opacity-35 grayscale" : ""}`}>
          <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Group 2" : "Kumpulan 2"}</p>
          {stage >= 1 ? (
            <ManualCountedObjectRow
              count={visual.b}
              emoji={visual.emoji}
              onComplete={finishSecondGroup}
              lang={lang}
            />
          ) : (
            <ObjectGroup count={visual.b} emoji={visual.emoji} lang={lang} />
          )}
          {stage >= 2 && <CountTotalBadge count={visual.b} lang={lang} unit={objectName(visual.emoji, visual.b, lang)} />}
        </div>
      </div>

      <div className={`rounded-3xl border-4 p-3 text-center transition-colors ${stage === 2 ? "border-blue-500 bg-blue-50" : "border-emerald-200 bg-white"} ${stage < 2 ? "opacity-35 grayscale" : ""}`}>
        <p className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "One big group" : "Satu kumpulan besar"}</p>
        {stage >= 2 ? (
          <ManualCountedObjectRow
            count={total}
            emoji={visual.emoji}
            announceTotal
            onComplete={finishTotal}
            lang={lang}
          />
        ) : (
          <ObjectGroup count={total} emoji={visual.emoji} lang={lang} />
        )}
        {stage >= 3 && <CountTotalBadge count={total} lang={lang} unit={objectName(visual.emoji, total, lang)} />}
      </div>

      {stage >= 3 && <GroupingAnswerLine text={`${visual.a} + ${visual.b} = ${total}`} />}
    </div>
  );
}

function TapRevealOrder({ nums, lang, mode }: { nums: number[]; lang: Lang; mode: "up" | "down" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIndex, setCompletedIndex] = useState(-1);
  const [counting, setCounting] = useState(false);
  const banana = BANANA;
  const done = completedIndex >= nums.length - 1;
  const currentComplete = completedIndex >= activeIndex;
  const shown = nums.slice(0, activeIndex + 1);
  const activeValue = nums[activeIndex] ?? 0;

  const finishCurrentCount = useCallback(async () => {
    setCompletedIndex(activeIndex);
    await speakRecordedBananaTotal(activeValue, lang, banana);
    setCounting(false);
  }, [activeIndex, activeValue, banana, lang]);

  const handleCountAction = () => {
    if (counting || done) return;
    if (currentComplete) {
      setActiveIndex((index) => Math.min(nums.length - 1, index + 1));
    }
    setCounting(true);
  };

  const quantityLabel = (count: number) => lang === "en"
    ? `Total: ${count} ${count === 1 ? "banana" : "bananas"}`
    : `Jumlah: ${count} pisang`;

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-wrap items-center justify-center gap-3 pb-2 md:flex-nowrap">
        {shown.map((n, index) => {
          const complete = completedIndex >= index;
          const isCurrentCounting = index === activeIndex && counting;
          const cardWidth = n === 1
            ? "md:w-[9rem]"
            : n === 2
              ? "md:w-[11rem]"
              : n === 3
                ? "md:w-[14rem]"
                : "md:w-[17rem]";
          const cardMaxWidth = n === 4 ? "max-w-72" : "max-w-64";
          return (
            <React.Fragment key={`${n}-${index}`}>
              {index > 0 && (
                <div className="flex shrink-0 items-center justify-center text-emerald-600" aria-hidden="true">
                  <ArrowRight className="h-8 w-8 rotate-90 sm:rotate-0" strokeWidth={3} />
                </div>
              )}
              <div className={`w-full ${cardMaxWidth} shrink-0 self-center rounded-3xl border-2 p-2 text-center shadow-inner transition-colors lg:p-3 ${cardWidth} ${complete ? "border-emerald-400 bg-emerald-50" : isCurrentCounting ? "border-blue-400 bg-blue-50" : "border-emerald-100 bg-white"}`}>
                <p className="mb-2 text-4xl font-black text-blue-950">{n}</p>
                {isCurrentCounting ? (
                  <CountedObjectRow
                    count={n}
                    emoji={banana}
                    showCount
                    speakCount
                    compact
                    fixedColumns={n}
                    lang={lang}
                    onCountComplete={finishCurrentCount}
                  />
                ) : complete ? (
                  <CountedObjectRow count={n} emoji={banana} showCount compact fixedColumns={n} visibleCount={n} highlightActiveCount={false} lang={lang} />
                ) : (
                  <CountedObjectRow count={n} emoji={banana} showCount compact fixedColumns={n} visibleCount={0} highlightActiveCount={false} lang={lang} />
                )}
                <p
                  className={`mt-3 min-h-10 rounded-full px-3 py-2 text-lg font-black transition-opacity ${complete ? "bg-emerald-100 text-emerald-950 opacity-100" : "opacity-0"}`}
                  aria-live="polite"
                >
                  {complete ? quantityLabel(n) : "\u00a0"}
                </p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {done ? (
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <NumberLineSequence nums={mode === "up" ? [1, 2, 3, 4] : [4, 3, 2, 1]} marked={-1} arrow="right" />
          <p className="text-center text-lg font-black text-emerald-900 sm:text-xl">
            {mode === "up"
              ? (lang === "en"
                  ? "Numbers increase in an ascending order."
                  : "Nombor meningkat dalam susunan menaik.")
              : (lang === "en"
                  ? "Numbers decrease in a descending order."
                  : "Nombor menurun dalam susunan menurun.")}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleCountAction}
            disabled={counting || done}
            className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-7 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] disabled:opacity-50"
          >
            {done
              ? (lang === "en" ? "Done" : "Selesai")
              : counting
                ? (lang === "en" ? "Counting..." : "Mengira...")
                : currentComplete
                  ? (lang === "en" ? "Show the next number" : "Lihat nombor seterusnya")
                  : (lang === "en" ? "Start counting" : "Mula mengira")}
            {!counting && !done && (
              <span className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-sm">
                <PointerIcon />
              </span>
            )}
          </button>
          <p className="text-lg font-black text-slate-700">
            {mode === "up"
              ? (lang === "en" ? "The numbers get bigger." : "Nombor makin besar.")
              : (lang === "en" ? "The numbers get smaller." : "Nombor makin kecil.")}
          </p>
        </div>
      )}
    </div>
  );
}

function TapRevealSequence({ lang }: { lang: Lang }) {
  const [marked, setMarked] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [done, setDone] = useState(false);
  const sequenceRunRef = useRef(0);

  useEffect(() => () => {
    sequenceRunRef.current += 1;
    stopNumberAudio();
  }, []);

  const showNumbersWithoutAudio = async (runId: number) => {
    for (const value of NUMBERS) {
      if (sequenceRunRef.current !== runId) return;
      setMarked(value);
      await wait(COUNTING_STEP_MS);
    }
  };

  const startCounting = async () => {
    if (counting) return;
    const runId = sequenceRunRef.current + 1;
    sequenceRunRef.current = runId;
    setCounting(true);
    setDone(false);
    setMarked(null);

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakNumberValuesSequence(NUMBERS, lang, COUNTING_STEP_MS, (value) => {
        if (sequenceRunRef.current === runId) setMarked(value);
      });
    } else {
      await showNumbersWithoutAudio(runId);
    }

    if (sequenceRunRef.current !== runId) return;
    setCounting(false);
    setDone(true);
  };

  return (
    <div className="space-y-4">
      <NumberLineSequence nums={NUMBERS} marked={marked ?? -1} arrow="right" />
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
        <button
          onClick={() => void startCounting()}
          disabled={counting}
          className="relative rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#047857] disabled:opacity-50"
        >
          {counting
            ? (lang === "en" ? "Counting..." : "Mengira...")
            : done
              ? (lang === "en" ? "Count again" : "Kira lagi")
              : (lang === "en" ? "Start counting" : "Mula mengira")}
          {!counting && (
            <span className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 shadow-sm" aria-hidden="true">
              <PointerIcon />
            </span>
          )}
        </button>
        <p className="text-lg font-black text-emerald-900" aria-live="polite">
          {counting && marked !== null
            ? (lang === "en" ? `Counting ${marked}.` : `Mengira ${marked}.`)
            : done
              ? (lang === "en" ? "You counted from 0 to 9." : "Kamu sudah kira dari 0 hingga 9.")
              : (lang === "en" ? "Count from 0 to 9." : "Kira dari 0 hingga 9.")}
        </p>
      </div>
    </div>
  );
}

function NumberOrderRelationship({ before, answer, after, lang }: { before: number | null; answer: number; after: number | null; lang: Lang }) {
  const numberNode = (value: number, active = false) => (
    <div className="text-center">
      <span
        className={`mx-auto grid h-16 w-16 place-items-center rounded-full border-4 text-3xl font-black shadow-[0_5px_0_rgba(0,0,0,.12)] sm:h-20 sm:w-20 sm:text-4xl ${active ? "border-amber-500 bg-yellow-300 text-blue-950" : "border-sky-300 bg-white text-blue-950"}`}
        style={getNumberTextStyle(value)}
      >
        {value}
      </span>
      <span className={`mt-2 block text-sm font-black uppercase ${active ? "text-amber-800" : "text-sky-800"}`}>
        {active
          ? (lang === "en" ? "This number" : "Nombor ini")
          : value === before
            ? (lang === "en" ? "Previous" : "Sebelum")
            : (lang === "en" ? "Next" : "Selepas")}
      </span>
    </div>
  );

  const relationshipArrow = () => (
    <div className="mt-7 flex min-w-0 items-center sm:mt-9" aria-hidden="true">
      <span className="h-1 flex-1 rounded-full bg-emerald-400" />
      <ArrowRight className="-ml-1 h-7 w-7 shrink-0 text-emerald-600" strokeWidth={3.5} />
    </div>
  );

  return (
    <div
      className="mt-3 rounded-3xl border-2 border-emerald-200 bg-white px-3 py-4 sm:px-6"
      aria-live="polite"
      aria-label={[
        before === null ? "" : `${answer} ${lang === "en" ? "comes after" : "selepas"} ${before}.`,
        after === null ? "" : `${answer} ${lang === "en" ? "comes before" : "sebelum"} ${after}.`,
      ].filter(Boolean).join(" ")}
    >
      <div className={`grid gap-4 ${before !== null && after !== null ? "md:grid-cols-2" : "mx-auto max-w-2xl"}`}>
        {before !== null && (
          <section className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/70 p-4">
            <div className="grid grid-cols-[auto_minmax(3rem,1fr)_auto] items-start gap-3 sm:gap-4">
              {numberNode(before)}
              {relationshipArrow()}
              {numberNode(answer, true)}
            </div>
            <p className="mt-4 rounded-full bg-emerald-100 px-4 py-2 text-center text-base font-black text-emerald-950 sm:text-lg">
              {lang === "en" ? `${answer} is after ${before}` : `${answer} selepas ${before}`}
            </p>
          </section>
        )}
        {after !== null && (
          <section className="rounded-3xl border-2 border-sky-200 bg-sky-50/70 p-4">
            <div className="grid grid-cols-[auto_minmax(3rem,1fr)_auto] items-start gap-3 sm:gap-4">
              {numberNode(answer, true)}
              {relationshipArrow()}
              {numberNode(after)}
            </div>
            <p className="mt-4 rounded-full bg-sky-100 px-4 py-2 text-center text-base font-black text-emerald-950 sm:text-lg">
              {lang === "en" ? `${answer} is before ${after}` : `${answer} sebelum ${after}`}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function MissingNumberTeaching({ nums, answer, lang }: { nums: Array<number | "?">; answer: number; lang: Lang }) {
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeValue, setActiveValue] = useState<number | null>(null);
  const teachingRunRef = useRef(0);
  const missingIndex = nums.findIndex((n) => n === "?");
  const numericValues = nums.filter((value): value is number => typeof value === "number");
  const descending = numericValues.length > 1 && numericValues[1] < numericValues[0];
  const before = numericValues.includes(answer - 1) ? answer - 1 : null;
  const after = numericValues.includes(answer + 1) ? answer + 1 : null;
  const visibleNums = revealed ? nums.map((n) => n === "?" ? answer : n) : nums;
  const countValues = nums.slice(0, missingIndex).filter((value): value is number => typeof value === "number");
  const countWords = countValues.map((value) => WORDS[lang][value]).join(", ");
  const countStart = countValues[0];
  const resultText = countValues.length === 0
    ? (lang === "en"
      ? `Counting starts at zero. The missing number is ${answer}.`
      : `Kiraan bermula dengan kosong. Nombor yang hilang ialah ${answer}.`)
    : (lang === "en"
      ? `${descending ? "Count down" : "Count up"} from ${countStart}: ${countWords}... the missing number is ${answer}.`
      : `${descending ? "Kira turun" : "Kira naik"} dari ${countStart}: ${countWords}... nombor yang hilang ialah ${answer}.`);
  const orderParts = [
    typeof before === "number" ? (lang === "en" ? `${answer} comes after ${before}.` : `${answer} selepas ${before}.`) : "",
    typeof after === "number" ? (lang === "en" ? `${answer} comes before ${after}.` : `${answer} sebelum ${after}.`) : "",
  ].filter(Boolean);
  const orderText = orderParts.join(" ");

  useEffect(() => () => {
    teachingRunRef.current += 1;
    stopNumberAudio();
  }, []);

  const showValuesWithoutAudio = async (values: number[], runId: number) => {
    for (const value of values) {
      if (teachingRunRef.current !== runId) return;
      setActiveValue(value);
      await wait(COUNTING_STEP_MS);
    }
  };

  const startCountUp = async () => {
    if (running || finished) return;
    const runId = teachingRunRef.current + 1;
    teachingRunRef.current = runId;
    setRunning(true);
    setRevealed(false);
    setFinished(false);
    setActiveValue(null);

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakNumberValuesSequence(countValues, lang, COUNTING_STEP_MS, (value) => {
        if (teachingRunRef.current === runId) setActiveValue(value);
      });
    } else {
      await showValuesWithoutAudio(countValues, runId);
    }
    if (teachingRunRef.current !== runId) return;

    await wait(700);
    if (teachingRunRef.current !== runId) return;
    setRevealed(true);

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await speakNumberValuesSequence([answer], lang, COUNTING_STEP_MS, (value) => {
        if (teachingRunRef.current === runId) setActiveValue(value);
      });
    } else {
      await showValuesWithoutAudio([answer], runId);
    }
    if (teachingRunRef.current !== runId) return;
    setRunning(false);
    setFinished(true);
  };

  return (
    <div className="space-y-4">
      <MissingNumberLine nums={visibleNums} marked={activeValue ?? -1} />
      <div className="rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
        {!finished && (
          <button
            onClick={() => void startCountUp()}
            disabled={running}
            className="relative rounded-2xl border-2 border-yellow-600 bg-yellow-400 px-6 py-3 font-black text-yellow-950 shadow-[0_5px_0_#a86000] disabled:opacity-60"
          >
            {running
              ? (lang === "en" ? "Counting..." : "Mengira...")
              : (lang === "en" ? "Count with me" : "Kira dengan saya")}
            {!running && (
              <span className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-500 bg-yellow-100 shadow-sm" aria-hidden="true">
                <PointerIcon />
              </span>
            )}
          </button>
        )}
        {revealed && (
          <p className="mt-3 text-xl font-black text-yellow-950" aria-live="polite">{resultText}</p>
        )}
        {finished && orderText && (
          <NumberOrderRelationship before={before} answer={answer} after={after} lang={lang} />
        )}
      </div>
    </div>
  );
}

function MissingNumberPlacementActivity({ lang, sequence, answer, choices, direction }: {
  lang: Lang;
  sequence: Array<number | "?">;
  answer: number;
  choices: number[];
  direction: "ascending" | "descending";
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const correct = checked && selected === answer;
  const displayedSequence: Array<number | "?"> = sequence.map((value) => value === "?" ? (checked ? answer : selected ?? "?") : value);
  const resolvedSequenceText = sequence.map((value) => value === "?" ? answer : value).join(", ");

  const choose = (value: number) => {
    setSelected(value);
    setChecked(false);
  };

  const checkAnswer = () => {
    setChecked(true);
    if (selected === answer) setCelebrationKey((current) => current + 1);
  };

  return (
    <div className="space-y-4 rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
      {celebrationKey > 0 && <CorrectCelebration key={celebrationKey} playSound={false} />}
      <div className="rounded-3xl border-2 border-white bg-white p-3 sm:p-5">
        <NumberLineSequence nums={displayedSequence} marked={checked ? answer : selected ?? -1} arrow="right" />
        <p className="mt-3 text-center text-lg font-black text-blue-950">
          {direction === "ascending"
            ? (lang === "en" ? "Count up by 1." : "Kira naik satu demi satu.")
            : (lang === "en" ? "Count down by 1." : "Kira turun satu demi satu.")}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => choose(choice)}
            aria-pressed={selected === choice}
            className={`grid h-16 w-16 place-items-center rounded-2xl border-2 text-3xl font-black shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 ${
              selected === choice ? "border-blue-700 bg-blue-600 text-white" : "border-blue-100 bg-white text-blue-950"
            }`}
            style={getNumberTextStyle(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          disabled={selected === null}
          onClick={checkAnswer}
          className="rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#047857] active:translate-y-1 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          {lang === "en" ? "Check" : "Semak"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setChecked(false);
          }}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.1)] active:translate-y-1"
        >
          {lang === "en" ? "Try again" : "Cuba lagi"}
        </button>
      </div>
      {checked && selected !== null && (
        <div className={`rounded-3xl border-2 p-4 text-center ${correct ? "border-emerald-200 bg-emerald-50" : "border-yellow-200 bg-yellow-50"}`}>
          <p className={`text-xl font-black ${correct ? "text-emerald-800" : "text-orange-700"}`}>
            {correct
              ? (lang === "en" ? `Great job. ${answer} is missing.` : `Bagus. ${answer} yang hilang.`)
              : (lang === "en" ? "Good try. Let's look again." : "Cubaan baik. Mari lihat lagi.")}
          </p>
          <p className="mt-3 text-lg font-black text-slate-700">
            {direction === "ascending"
              ? (lang === "en" ? `Count up: ${resolvedSequenceText}.` : `Kira naik: ${resolvedSequenceText}.`)
              : (lang === "en" ? `Count down: ${resolvedSequenceText}.` : `Kira turun: ${resolvedSequenceText}.`)}
          </p>
        </div>
      )}
    </div>
  );
}

function MissingNumberLine({ nums, marked = -1 }: { nums: Array<number | "?">; marked?: number }) {
  return <NumberLineSequence nums={nums} marked={marked} arrow="right" />;
}

function SequencingExample({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-4">
      <NumberLine marked={-1} />
      <div
        className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-2 border-emerald-100 bg-emerald-50 px-5 py-4 text-center"
        aria-label={lang === "en" ? "Numbers increasing in value" : "Nilai nombor semakin meningkat"}
      >
        <p className="text-xl font-black text-emerald-900 sm:text-2xl">
          {lang === "en" ? "Numbers increasing in value" : "Nilai nombor semakin meningkat"}
        </p>
        <span className="mt-1 text-6xl font-black leading-none text-emerald-600" aria-hidden="true">⟶</span>
      </div>
    </div>
  );
}

function SequenceNeighbors({ number, lang }: { number: number; lang: Lang }) {
  const before = number > 0 ? number - 1 : null;
  const after = number < 9 ? number + 1 : null;
  const cells = [
    { label: lang === "en" ? "before" : "sebelum", value: before, muted: before === null },
    { label: lang === "en" ? "now" : "sekarang", value: number, current: true },
    { label: lang === "en" ? "after" : "selepas", value: after, muted: after === null },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={`rounded-3xl border-2 p-4 text-center ${cell.current ? "border-yellow-400 bg-yellow-50" : "border-blue-100 bg-white"}`}
        >
          <p className="text-sm font-black uppercase text-slate-500">{cell.label}</p>
          <p className={`mt-2 text-5xl font-black ${cell.muted ? "text-slate-300" : cell.current ? "text-yellow-800" : "text-blue-800"}`}>
            {cell.muted ? "-" : cell.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function SkipCountingPanel({ marked, lang }: { marked: number; lang: Lang }) {
  const rows = [
    { title: lang === "en" ? "Start at 0, jump by 2" : "Mula pada 0, lompat 2", nums: [0, 2, 4, 6, 8] },
    { title: lang === "en" ? "Start at 1, jump by 2" : "Mula pada 1, lompat 2", nums: [1, 3, 5, 7, 9] },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.title} className="rounded-3xl border-2 border-emerald-100 bg-white p-4">
          <p className="mb-3 text-center text-lg font-black text-emerald-900">{row.title}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {row.nums.map((n, i) => (
              <React.Fragment key={n}>
                {i > 0 && <span className="text-2xl font-black text-slate-300">+2</span>}
                <span className={`grid h-14 w-14 place-items-center rounded-2xl border-2 text-2xl font-black ${n === marked ? "border-yellow-500 bg-yellow-400 text-yellow-950" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>
                  {n}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type DrawingTool = "pen" | "eraser";

const DRAWING_COLORS = [
  { value: "#2563eb", en: "Blue", ms: "Biru" },
  { value: "#16a34a", en: "Green", ms: "Hijau" },
  { value: "#dc2626", en: "Red", ms: "Merah" },
  { value: "#7c3aed", en: "Purple", ms: "Ungu" },
] as const;

function DrawingToolPanel({ lang, color, tool, onColorChange, onToolChange, cyber = false, sidePanel = false }: {
  lang: Lang;
  color: string;
  tool: DrawingTool;
  onColorChange: (color: string) => void;
  onToolChange: (tool: DrawingTool) => void;
  cyber?: boolean;
  sidePanel?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 rounded-2xl border-2 p-3 ${sidePanel ? "flex-col items-stretch p-4" : ""} ${cyber ? "border-cyan-400/70 bg-slate-950/75" : `${sidePanel ? "" : "mt-3"} border-slate-200 bg-slate-50`}`}>
      <span className={`font-black ${cyber ? `text-cyan-100 ${sidePanel ? "text-left" : "text-center"}` : "text-slate-700"}`}>{lang === "en" ? "Pen colour" : "Warna pen"}</span>
      <div className="flex flex-wrap justify-center gap-2">
        {DRAWING_COLORS.map((option) => {
          const selected = tool === "pen" && color === option.value;
          const name = lang === "en" ? option.en : option.ms;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onColorChange(option.value)}
              aria-label={lang === "en" ? `${name} pen` : `Pen ${name.toLowerCase()}`}
              aria-pressed={selected}
              title={name}
              className={`grid h-11 w-11 place-items-center rounded-xl border-4 text-white shadow-sm transition active:scale-95 ${
                selected
                  ? `border-yellow-400 ring-2 ring-blue-500 ring-offset-2 ${cyber ? "ring-offset-slate-950" : ""}`
                  : cyber ? "border-cyan-100" : "border-white"
              }`}
              style={{ backgroundColor: option.value }}
            >
              {selected && <Check className="h-6 w-6" strokeWidth={4} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onToolChange("eraser")}
        aria-pressed={tool === "eraser"}
        className={`flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 py-2 font-black shadow-sm active:translate-y-0.5 ${
          tool === "eraser"
            ? cyber
              ? "border-yellow-300 bg-cyan-900 text-yellow-100 ring-2 ring-yellow-300"
              : "border-blue-700 bg-blue-100 text-blue-900 ring-2 ring-yellow-300"
            : cyber
              ? "border-cyan-400 bg-slate-900 text-cyan-50"
              : "border-slate-300 bg-white text-slate-700"
        }`}
      >
        <Eraser className="h-5 w-5" aria-hidden="true" />
        {lang === "en" ? "Eraser" : "Pemadam"}
      </button>
    </div>
  );
}

function TracePad({ value, t, lang, onComplete, cyber = false }: { value: number; t: UIStrings; lang: Lang; onComplete: () => void; cyber?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [confirmed, setConfirmed] = useState(false);
  const [penColor, setPenColor] = useState<string>(DRAWING_COLORS[0].value);
  const [tool, setTool] = useState<DrawingTool>("pen");

  useEffect(() => {
    setConfirmed(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 12;
  }, [value]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    setConfirmed(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = tool === "eraser" ? 28 : 12;
    }
    const p = point(event);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
  };
  const stop = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setConfirmed(false);
  };
  const confirmTrace = () => {
    setConfirmed(true);
  };

  return (
    <div className={`mx-auto w-full max-w-5xl rounded-[2rem] p-4 sm:p-6 ${cyber ? "border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 shadow-[inset_0_0_32px_rgba(34,211,238,.16)]" : "border-2 border-amber-100 bg-white shadow-[0_7px_0_rgba(30,64,175,.10)]"}`}>
      <h3 className={`mb-2 text-center text-3xl font-black ${cyber ? "text-yellow-200" : "text-blue-950"}`}>{lang === "en" ? `Trace ${value}` : `Ikut garisan ${value}`}</h3>
      <p className={`mb-5 text-center text-base font-bold ${cyber ? "text-cyan-100" : "text-slate-500"}`}>
        {lang === "en" ? "Follow the big number guide on the screen." : "Ikut panduan nombor besar pada skrin."}
      </p>
      <div className="trace-pad-layout grid gap-5 md:grid-cols-[minmax(0,1fr)_16rem] md:items-stretch xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className={`relative h-72 overflow-hidden rounded-3xl sm:h-[26rem] ${cyber ? "border-3 border-cyan-400 bg-slate-950/80 shadow-[inset_0_0_28px_rgba(34,211,238,.15)]" : "border-4 border-amber-300 bg-amber-50 shadow-[inset_0_0_0_3px_rgba(255,255,255,.7),0_5px_0_rgba(180,83,9,.16)]"}`}>
          <div
            className={`pointer-events-none absolute inset-0 grid place-items-center text-[12rem] font-black leading-none sm:text-[16rem] ${cyber ? "text-cyan-200/25" : "text-blue-950/20"}`}
            style={getNumberTextStyle(value)}
          >
            {value}
          </div>
          {confirmed && (
            <div
              className={`trace-model-zoom trace-confirmed-number pointer-events-none absolute inset-0 z-10 grid place-items-center text-[12rem] font-black leading-none sm:text-[16rem] ${cyber ? "text-yellow-200/80" : "text-amber-500/90"}`}
              aria-hidden="true"
              style={getNumberTextStyle(value)}
            >
              {value}
            </div>
          )}
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={stop}
            onPointerLeave={stop}
            className="relative h-full w-full touch-none rounded-3xl"
          />
        </div>
        <aside className={`flex flex-col gap-4 rounded-3xl border-2 p-4 ${cyber ? "border-cyan-400/70 bg-cyan-950/65 shadow-[0_5px_0_#164e63]" : "border-slate-200 bg-slate-50 shadow-[0_5px_0_rgba(15,23,42,.10)]"}`}>
          {confirmed && (
            <p className={`rounded-2xl border-2 px-3 py-3 text-center text-sm font-black ${cyber ? "border-emerald-300 bg-emerald-950 text-emerald-100" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {lang === "en" ? "Watch the correct number shape slowly." : "Lihat bentuk nombor yang betul perlahan."}
            </p>
          )}
          <DrawingToolPanel
            lang={lang}
            color={penColor}
            tool={tool}
            cyber={cyber}
            sidePanel
            onColorChange={(color) => {
              setPenColor(color);
              setTool("pen");
            }}
            onToolChange={setTool}
          />
          <div className="mt-auto grid gap-3">
            <button onClick={clear} className={`rounded-2xl border-2 px-4 py-3 font-black active:translate-y-1 active:shadow-none ${cyber ? "border-cyan-300 bg-slate-900 text-cyan-50 shadow-[0_4px_0_#164e63]" : "border-slate-200 bg-white text-slate-600 shadow-[0_4px_0_rgba(15,23,42,.10)]"}`}>
              {lang === "en" ? "Restart" : "Mula semula"}
            </button>
            <button
              onClick={confirmed ? onComplete : confirmTrace}
              className={`group relative isolate min-h-14 overflow-visible rounded-2xl border-2 px-4 py-3 font-black text-white transition-[transform,filter,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 hover:-translate-y-1 hover:brightness-110 active:translate-y-1 active:shadow-none ${
                confirmed
                  ? "border-yellow-200 bg-gradient-to-r from-emerald-600 to-cyan-600 shadow-[0_5px_0_#0e7490]"
                  : "border-emerald-200 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_6px_0_#047857,0_0_20px_rgba(52,211,153,.34)]"
              }`}
            >
              {!confirmed && (
                <span className="pointer-events-none absolute inset-0 z-0 rounded-2xl border-2 border-emerald-200/70 opacity-35 motion-safe:animate-ping" aria-hidden="true" />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Check className={`h-6 w-6 transition-transform duration-200 ${confirmed ? "scale-110" : "group-hover:rotate-[-8deg] group-hover:scale-110"}`} strokeWidth={4} aria-hidden="true" />
                <span>{confirmed ? (lang === "en" ? "Done!" : "Selesai!") : t.traced}</span>
                {!confirmed && <Sparkles className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-125" aria-hidden="true" />}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WriteNumberPad({
  value,
  t,
  lang,
  onComplete,
  initialDrawing,
  initialShowModel = false,
  onDrawingChange,
}: {
  value: number;
  t: UIStrings;
  lang: Lang;
  onComplete: () => void;
  initialDrawing?: string;
  initialShowModel?: boolean;
  onDrawingChange?: (drawing: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [matched, setMatched] = useState(false);
  const [penColor, setPenColor] = useState<string>(DRAWING_COLORS[0].value);
  const [tool, setTool] = useState<DrawingTool>("pen");

  useEffect(() => {
    setHasDrawn(Boolean(initialDrawing));
    setShowModel(initialShowModel);
    setMatched(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 12;
    if (initialDrawing) {
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
      image.src = initialDrawing;
    }
  }, [initialDrawing, initialShowModel, value]);

  useEffect(() => {
    if (!matched) return;
    const timer = window.setTimeout(onComplete, 3000);
    return () => window.clearTimeout(timer);
  }, [matched, onComplete]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    if (tool === "pen") setHasDrawn(true);
    setMatched(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = tool === "eraser" ? 28 : 12;
    }
    const p = point(event);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    if (tool === "pen") setHasDrawn(true);
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
  };
  const stop = () => {
    if (drawing.current) {
      const canvas = canvasRef.current;
      if (canvas) onDrawingChange?.(canvas.toDataURL("image/png"));
    }
    drawing.current = false;
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setShowModel(false);
    setMatched(false);
    onDrawingChange?.("");
  };
  const checkAnswer = () => {
    if (!hasDrawn) return;
    setShowModel(true);
    setMatched(false);
    speakNumber(value, lang);
  };
  const confirmMatched = () => {
    setMatched(true);
    speakNumber(value, lang);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-amber-100 bg-white p-4 sm:p-6">
      {matched && <CorrectCelebration playSound={false} />}
      <h3 className="mb-2 text-center text-2xl font-black text-blue-950">{lang === "en" ? `Write ${value} yourself` : `Tulis ${value} sendiri`}</h3>
      <p className="mb-3 text-center text-sm font-bold text-slate-500">
        {lang === "en" ? "Try without the tracing guide." : "Cuba tanpa panduan garisan."}
      </p>
      <div className={`grid gap-5 ${showModel ? "md:grid-cols-[minmax(0,1fr)_14rem]" : "md:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_18rem]"}`}>
        <div className="w-full min-w-0">
          <p className="mb-3 text-center text-lg font-black text-amber-900">
            {lang === "en" ? `Drawing of number ${WORDS.en[value]}` : `Lukisan nombor ${WORDS.ms[value]}`}
          </p>
          <div className="relative h-72 rounded-3xl border-4 border-amber-300 bg-amber-50 shadow-[inset_0_0_0_3px_rgba(255,255,255,.7),0_5px_0_rgba(180,83,9,.16)] sm:h-[26rem]">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={stop}
              onPointerLeave={stop}
              className="relative h-full w-full touch-none rounded-3xl"
            />
          </div>
        </div>
        {showModel ? (
          <div className="w-full rounded-3xl border-4 border-blue-100 bg-blue-50 p-4 text-center md:w-56">
            <p className="mb-2 text-sm font-black text-blue-900">{lang === "en" ? "Look at this model" : "Lihat contoh ini"}</p>
            <div className="mx-auto grid h-40 w-40 place-items-center rounded-[2rem] border-4 border-blue-200 bg-white text-8xl font-black leading-none text-blue-950 shadow-inner" style={getNumberTextStyle(value)}>
              {value}
            </div>
            <p className="mt-3 text-base font-black leading-snug text-blue-950">
              {lang === "en" ? `This is ${value}. Does yours look like this?` : `Ini ${value}. Sama tak dengan awak?`}
            </p>
          </div>
        ) : (
          <aside className="flex flex-col gap-4 rounded-3xl border-2 border-slate-200 bg-slate-50 p-4 shadow-[0_5px_0_rgba(15,23,42,.10)]">
            <DrawingToolPanel
              lang={lang}
              color={penColor}
              tool={tool}
              sidePanel
              onColorChange={(color) => {
                setPenColor(color);
                setTool("pen");
              }}
              onToolChange={setTool}
            />
            <div className="mt-auto grid gap-3">
              <button onClick={clear} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-black text-slate-600 shadow-[0_4px_0_rgba(15,23,42,.10)] active:translate-y-1 active:shadow-none">
                {lang === "en" ? "Restart" : "Mula semula"}
              </button>
              <button
                onClick={checkAnswer}
                disabled={!hasDrawn}
                className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-4 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 active:shadow-none disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                {lang === "en" ? "Check my answer" : "Semak jawapan saya"}
              </button>
            </div>
          </aside>
        )}
      </div>
      {showModel && (
        <div className="mt-4 rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
          {matched ? (
            <div className="flex items-center gap-3">
              <img src={chrysExcited} alt="Chrys excited" className="h-20 w-20 object-contain" />
              <p className="text-lg font-black text-emerald-800">
                {lang === "en" ? "Good job! Your number matches." : "Bagus! Nombor awak sama."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <p className="text-lg font-black text-emerald-900">
                  {lang === "en" ? "Compare your number with the model." : "Banding nombor awak dengan contoh."}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={confirmMatched} className="flex-1 rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-4 py-3 font-black text-white shadow-[0_4px_0_#047857] active:translate-y-1">
                  {lang === "en" ? "Yes, I got it!" : "Ya, saya dapat!"}
                </button>
                <button onClick={clear} className="flex-1 rounded-2xl border-2 border-amber-300 bg-white px-4 py-3 font-black text-amber-800 shadow-[0_4px_0_rgba(180,83,9,.18)] active:translate-y-1">
                  {lang === "en" ? "Let me try again" : "Saya cuba lagi"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DrawQuantity({ count, lang }: { count: number; lang: Lang }) {
  return (
    <div className="rounded-3xl border-2 border-amber-100 bg-white p-4 text-center">
      <h3 className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Draw how many objects" : "Lukis berapa banyak objek"}</h3>
      <p className="mb-3 text-sm font-bold text-slate-500">{count === 0 ? (lang === "en" ? "For zero, draw nothing in the box." : "Untuk nombor kosong, jangan lukis apa-apa dalam kotak.") : (lang === "en" ? `Draw ${count} dots or bananas on paper.` : `Lukis ${count} titik atau pisang di kertas.`)}</p>
      <ObjectGroup count={count} emoji="●" numbered lang={lang} />
    </div>
  );
}

function TeenQuantityArrangementVisual({ count, emoji, rowPattern, lang }: { count: number; emoji: string; rowPattern: number[]; lang: Lang }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-cyan-300 bg-slate-950/80 p-5 shadow-[inset_0_0_24px_rgba(34,211,238,.12)]">
      <p className="mb-4 text-center text-sm font-black uppercase tracking-wide text-cyan-200">{lang === "en" ? "Same group, new arrangement" : "Kumpulan sama, susunan baharu"}</p>
      <AdvancedBananaRow count={count} emoji={emoji} rowPattern={rowPattern} spacious largeObjects />
    </div>
  );
}

function AdvancedCompareTestVisual({ a, b, emoji, representation, lang }: Extract<Visual, { kind: "advancedCompareTest" }> & { lang: Lang }) {
  const group = (value: number, side: "A" | "B") => (
    <div className="relative flex min-h-60 min-w-0 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border-2 border-cyan-400 bg-slate-950/80 px-5 pb-6 pt-7">
      <span className="mb-5 text-sm font-black uppercase tracking-wide text-cyan-200">{lang === "en" ? `Group ${side}` : `Kumpulan ${side}`}</span>
      {representation === "labeled" && (
        <span className="absolute right-3 top-3 grid h-11 min-w-11 place-items-center rounded-full border-2 border-yellow-200 bg-yellow-400 px-2 text-2xl font-black text-slate-950 shadow-[0_4px_0_#a16207]" style={getNumberTextStyle(value)}>{value}</span>
      )}
      <AdvancedBananaRow count={value} emoji={emoji} compact={value >= 10} />
    </div>
  );

  if (representation === "numbers") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-5 rounded-[2rem] border-2 border-cyan-400 bg-slate-950/80 p-6">
        <span className="grid h-28 min-w-28 place-items-center rounded-3xl border-4 border-cyan-300 bg-cyan-950 px-4 text-6xl font-black text-yellow-200 shadow-[0_6px_0_#164e63]" style={getNumberTextStyle(a)}>{a}</span>
        <span className="text-5xl font-black text-cyan-300" aria-hidden="true">?</span>
        <span className="grid h-28 min-w-28 place-items-center rounded-3xl border-4 border-cyan-300 bg-cyan-950 px-4 text-6xl font-black text-yellow-200 shadow-[0_6px_0_#164e63]" style={getNumberTextStyle(b)}>{b}</span>
      </div>
    );
  }

  return (
    <div className="mobile-wide-grid grid items-center gap-5 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      {group(a, "A")}
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-yellow-200 bg-yellow-400 text-4xl font-black text-slate-950 shadow-[0_5px_0_#a16207]" aria-hidden="true">?</span>
      {group(b, "B")}
    </div>
  );
}

function AdditionGroupsCountingVisual({ a, b, emoji = BANANA, lang, cyber = false }: { a: number; b: number; emoji?: string; lang: Lang; cyber?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [hasCounted, setHasCounted] = useState(false);
  const [activeGroup, setActiveGroup] = useState<"a" | "b" | null>(null);
  const [countedA, setCountedA] = useState(0);
  const [countedB, setCountedB] = useState(0);
  const runRef = useRef(0);

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const countBothGroups = async () => {
    if (busy) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setBusy(true);
    setHasCounted(false);
    setActiveGroup("a");
    setCountedA(0);
    setCountedB(0);
    stopNumberAudio();

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await playRecordedVoiceFile(COUNT_PROMPT_AUDIO_FILES[lang]);
      if (runRef.current !== runId) return;
    }

    const countGroup = async (group: "a" | "b", count: number) => {
      setActiveGroup(group);
      const updateVisualCount = (value: number) => {
        if (runRef.current !== runId) return;
        if (group === "a") setCountedA(value);
        else setCountedB(value);
      };

      if (count === 0) {
        await speakNumber(0, lang);
      } else if (NUMBER_AUDIO_ENABLED && !audioMuted) {
        await speakCountingSequence(count, lang, COUNTING_STEP_MS, updateVisualCount);
      } else {
        for (let value = 1; value <= count; value += 1) {
          if (runRef.current !== runId) return false;
          updateVisualCount(value);
          await wait(getReducedMotionPreference() ? 80 : COUNTING_STEP_MS);
        }
      }
      if (runRef.current !== runId) return false;
      await wait(500);
      if (runRef.current !== runId) return false;
      await speakRecordedBananaTotal(count, lang, emoji);
      return runRef.current === runId;
    };

    if (!await countGroup("a", a)) return;
    if (!await countGroup("b", b)) return;
    setActiveGroup(null);
    setHasCounted(true);
    setBusy(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void countBothGroups()}
        disabled={busy}
        className={`relative mx-auto mb-4 block rounded-2xl border-2 px-6 py-3 font-black active:translate-y-1 disabled:cursor-wait disabled:opacity-70 ${cyber ? "border-cyan-300 bg-cyan-700 text-white shadow-[0_5px_0_#164e63]" : "border-blue-700 bg-blue-600 text-white shadow-[0_5px_0_#1e3a8a]"}`}
      >
        {busy
          ? (lang === "en" ? "Counting both groups..." : "Mengira kedua-dua kumpulan...")
          : hasCounted
            ? (lang === "en" ? "Count again" : "Kira lagi")
            : (lang === "en" ? "Count both groups" : "Kira kedua-dua kumpulan")}
        {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true"><PointerIcon /></span>}
      </button>
      <div className="mobile-wide-grid grid items-center gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className={`rounded-[2rem] border-2 p-3 ${cyber ? "border-cyan-400 bg-slate-950/70" : "border-yellow-300 bg-yellow-50"}`}>
          {cyber
            ? <AdvancedBananaRow count={a} emoji={emoji} showCountLabels={busy || hasCounted} countedThrough={countedA} isCounting={busy && activeGroup === "a"} rowPattern={balancedIndexRows(a, 3).map((row) => row.length)} spacious />
            : <ObjectGroup count={a} emoji={emoji} numbered={busy || hasCounted} countedThrough={countedA} isCounting={busy && activeGroup === "a"} lang={lang} maxPerRow={3} />}
        </div>
        <span data-math-cue="plus" className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 text-4xl font-black ${cyber ? "border-yellow-300 bg-yellow-300 text-slate-950 shadow-[0_5px_0_#a16207]" : "border-yellow-400 bg-yellow-200 text-blue-950 shadow-[0_5px_0_#d97706]"}`} aria-hidden="true">+</span>
        <div className={`rounded-[2rem] border-2 p-3 ${cyber ? "border-cyan-400 bg-slate-950/70" : "border-yellow-300 bg-yellow-50"}`}>
          {cyber
            ? <AdvancedBananaRow count={b} emoji={emoji} showCountLabels={busy || hasCounted} countedThrough={countedB} isCounting={busy && activeGroup === "b"} rowPattern={balancedIndexRows(b, 3).map((row) => row.length)} spacious />
            : <ObjectGroup count={b} emoji={emoji} numbered={busy || hasCounted} countedThrough={countedB} isCounting={busy && activeGroup === "b"} lang={lang} maxPerRow={3} />}
        </div>
      </div>
    </div>
  );
}

function AdditionGroupsAudioButton({ a, b, emoji = BANANA, lang, cyber = false }: { a: number; b: number; emoji?: string; lang: Lang; cyber?: boolean }) {
  const [busy, setBusy] = useState(false);
  const runRef = useRef(0);

  useEffect(() => () => {
    runRef.current += 1;
    stopNumberAudio();
  }, []);

  const countBothGroups = async () => {
    if (busy) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setBusy(true);
    stopNumberAudio();

    if (NUMBER_AUDIO_ENABLED && !audioMuted) {
      await playRecordedVoiceFile(COUNT_PROMPT_AUDIO_FILES[lang]);
      if (runRef.current !== runId) return;
    }

    const countGroup = async (count: number) => {
      if (count === 0) await speakNumber(0, lang);
      else if (NUMBER_AUDIO_ENABLED && !audioMuted) await speakCountingSequence(count, lang, COUNTING_STEP_MS);
      else await wait(getReducedMotionPreference() ? 80 : Math.max(120, count * 80));
      if (runRef.current !== runId) return false;
      await wait(500);
      if (runRef.current !== runId) return false;
      await speakRecordedBananaTotal(count, lang, emoji);
      return runRef.current === runId;
    };

    if (!await countGroup(a)) return;
    if (!await countGroup(b)) return;
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={() => void countBothGroups()}
      disabled={busy}
      className={`relative mx-auto mb-4 block rounded-2xl border-2 px-6 py-3 font-black active:translate-y-1 disabled:cursor-wait disabled:opacity-70 ${cyber ? "border-cyan-300 bg-cyan-700 text-white shadow-[0_5px_0_#164e63]" : "border-blue-700 bg-blue-600 text-white shadow-[0_5px_0_#1e3a8a]"}`}
    >
      {busy
        ? (lang === "en" ? "Counting both groups..." : "Mengira kedua-dua kumpulan...")
        : (lang === "en" ? "Count both groups" : "Kira kedua-dua kumpulan")}
      {!busy && <span className="pointer-events-none absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true"><PointerIcon /></span>}
    </button>
  );
}

function VisualDisplay({ visual, lang = "en", revealNumbers = true, revealCrossedLabels = false, cyber = false }: { visual: Visual; lang?: Lang; revealNumbers?: boolean; revealCrossedLabels?: boolean; cyber?: boolean }) {
  if (visual.kind === "teenQuantityArrangement") {
    return <TeenQuantityArrangementVisual count={visual.count} emoji={visual.emoji} rowPattern={visual.rowPattern} lang={lang} />;
  }
  if (visual.kind === "advancedCompareTest") {
    return <AdvancedCompareTestVisual {...visual} lang={lang} />;
  }
  if (visual.kind === "horizontalAdd") {
    if (visual.display === "none") return null;

    if (visual.display === "objects") {
      return <AdditionGroupsCountingVisual a={visual.a} b={visual.b} lang={lang} cyber={cyber} />;
    }

    return (
      <div className={`mx-auto max-w-xl rounded-[2rem] border-4 p-6 text-center ${cyber ? "border-cyan-300 bg-slate-950 shadow-[0_7px_0_#164e63]" : "border-yellow-300 bg-yellow-50"}`}>
        <p className={`text-5xl font-black sm:text-6xl ${cyber ? "text-yellow-200" : "text-blue-950"}`} style={getNumberTextStyle(visual.a)}>
          {visual.a} <span data-math-cue="plus" className={cyber ? "text-cyan-300" : "text-blue-600"}>+</span> {visual.b} <span data-math-cue="equals" className={cyber ? "text-cyan-300" : "text-blue-600"}>=</span> ?
        </p>
      </div>
    );
  }
  if (visual.kind === "verticalAdd") {
    return <VerticalAdditionCard a={visual.a} b={visual.b} lang={lang} />;
  }
  if (visual.kind === "verticalSubtract") {
    return <VerticalSubtractionCard a={visual.a} b={visual.b} borrowing={visual.borrowing} lang={lang} />;
  }
  if (visual.kind === "horizontalSubtract") {
    return (
      <div className={`mx-auto max-w-xl rounded-[2rem] border-4 p-6 text-center ${cyber ? "border-cyan-300 bg-slate-950 shadow-[0_7px_0_#164e63]" : "border-yellow-300 bg-yellow-50"}`}>
        <p className={`text-5xl font-black sm:text-6xl ${cyber ? "text-yellow-200" : "text-blue-950"}`} style={getNumberTextStyle(visual.a)}>
          {visual.a} <span data-math-cue="minus" className={cyber ? "text-cyan-300" : "text-blue-600"}>−</span> {visual.b} <span data-math-cue="equals" className={cyber ? "text-cyan-300" : "text-blue-600"}>=</span> ?
        </p>
      </div>
    );
  }
  if (visual.kind === "teenBundle") {
    return (
      <div className="space-y-4">
        <TeenQuantityVisual lang={lang} tens={visual.tens} ones={visual.ones} />
        {revealNumbers && (
          <div className="mx-auto grid h-20 w-28 place-items-center rounded-3xl border-4 border-yellow-400 bg-yellow-100 text-4xl font-black text-emerald-950" style={getNumberTextStyle((visual.tens * 10) + visual.ones)}>
            {(visual.tens * 10) + visual.ones}
          </div>
        )}
      </div>
    );
  }
  if (visual.kind === "count") {
    if (visual.container) {
      return <ContainerScene count={visual.count} emoji={visual.emoji} container={visual.container} numbered={revealNumbers} lang={lang} />;
    }
    return <ObjectGroup count={visual.count} emoji={visual.emoji} numbered={revealNumbers} cyber={cyber} lang={lang} />;
  }
  if (visual.kind === "number") {
    return cyber ? (
      <div className="mx-auto grid h-32 w-40 place-items-center rounded-[2rem] border-4 border-yellow-300 bg-slate-950 text-6xl font-black text-yellow-200 shadow-[0_7px_0_#a16207,0_0_24px_rgba(250,204,21,.18)]" style={getNumberTextStyle(visual.value)}>
        {visual.value}
      </div>
    ) : <NumberTile value={visual.value} lang={lang} showWord={false} />;
  }
  if (visual.kind === "word") {
    return (
      <div className={`mx-auto max-w-sm rounded-[2rem] border-4 border-yellow-300 p-6 text-center ${cyber ? "bg-slate-950 shadow-[0_7px_0_#a16207,0_0_24px_rgba(250,204,21,.18)]" : "bg-yellow-50"}`}>
        <p className={`text-5xl font-black ${cyber ? "text-yellow-200" : "text-blue-950"}`}>{numberWordFor(visual.value, lang)}</p>
      </div>
    );
  }
  if (visual.kind === "audioNumber") {
    if (!NUMBER_AUDIO_ENABLED) return null;
    return (
      <AudioHearButton label={lang === "en" ? "Hear it" : "Dengar"} onClick={() => speakNumber(visual.value, lang)} cyber={cyber} />
    );
  }
  if (visual.kind === "groupObserve" || visual.kind === "groupMake") {
    return <GroupingTray label={lang === "en" ? "Group box" : "Kotak kumpulan"} count={visual.count} emoji={visual.emoji} counted={revealNumbers} lang={lang} />;
  }
  if (visual.kind === "groupBuildMany") {
    return (
      <div className={`grid gap-4 ${visual.counts.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {visual.counts.map((count, groupIndex) => (
          <GroupingTray
            key={`group-preview-${groupIndex}`}
            label={lang === "en" ? `Group ${groupIndex + 1}` : `Kumpulan ${groupIndex + 1}`}
            count={count}
            emoji={visual.emoji}
            counted={revealNumbers}
            lang={lang}
          />
        ))}
      </div>
    );
  }
  if (visual.kind === "groupChoices") {
    return (
      <div className="mobile-wide-grid grid gap-4 xl:grid-cols-3">
        {visual.groups.map((count) => (
          <div key={count} className="rounded-3xl border-2 border-blue-100 bg-white p-3 text-center">
            <ObjectGroup count={count} emoji={visual.emoji} numbered={revealNumbers} lang={lang} />
          </div>
        ))}
      </div>
    );
  }
  if (visual.kind === "groupTwo") {
    return <SeparateGroupCountingVisual a={visual.a} b={visual.b} emoji={visual.emoji} lang={lang} />;
  }
  if (visual.kind === "groupCompare") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <GroupingTray label={lang === "en" ? "Group A" : "Kumpulan A"} count={visual.a} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
        <GroupingTray label={lang === "en" ? "Group B" : "Kumpulan B"} count={visual.b} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
      </div>
    );
  }
  if (visual.kind === "groupCombine") {
    return (
      <div className="space-y-3">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <GroupingTray label={lang === "en" ? "Group 1" : "Kumpulan 1"} count={visual.a} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
          <span className="text-center text-lg font-black text-emerald-700">{revealNumbers ? "+" : (lang === "en" ? "and" : "dan")}</span>
          <GroupingTray label={lang === "en" ? "Group 2" : "Kumpulan 2"} count={visual.b} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
        </div>
        {revealNumbers && <GroupingAnswerLine text={`${visual.a} + ${visual.b} = ${visual.a + visual.b}`} />}
      </div>
    );
  }
  if (visual.kind === "numberWithGroup") {
    return (
      <div className="space-y-4">
        {revealNumbers && <NumberTile value={visual.value} lang={lang} showWord={false} />}
        <ObjectGroup count={visual.value} emoji={visual.emoji} numbered={revealNumbers} lang={lang} />
      </div>
    );
  }
  if (visual.kind === "sameValue") {
    return <SameValueVisual count={visual.count} emojis={visual.emojis} lang={lang} showSummary={revealNumbers} />;
  }
  if (visual.kind === "layoutValue") {
    return <LayoutValueVisual count={visual.count} emoji={visual.emoji} lang={lang} showSummary={revealNumbers} />;
  }
  if (visual.kind === "compareGroups") {
    return <CompareGroupsVisual a={visual.a} b={visual.b} emojiA={visual.emojiA} emojiB={visual.emojiB} lang={lang} showReason={revealNumbers} />;
  }
  if (visual.kind === "order") {
    return (
      <div className="space-y-4">
        <NumberLine marked={visual.direction === "asc" ? Math.min(...visual.nums) : Math.max(...visual.nums)} />
        <div className="flex flex-wrap justify-center gap-3">
          {visual.nums.map((n) => (
            <span key={n} className="grid h-16 w-16 place-items-center rounded-3xl border-2 border-yellow-200 bg-yellow-50 text-3xl font-black text-blue-950">{n}</span>
          ))}
        </div>
      </div>
    );
  }
  if (visual.kind === "symbol") {
    return (
      <div className="space-y-4">
        <NumberLine marked={Math.max(visual.a, visual.b)} />
        {visual.showObjects !== false && (
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledGroup count={visual.a} label={String(visual.a)} emoji="🍌" />
            <LabeledGroup count={visual.b} label={String(visual.b)} emoji="🍌" />
          </div>
        )}
        <div className="flex items-center justify-center gap-4 text-5xl font-black text-blue-950">
          <span>{visual.a}</span>
          <span className="text-slate-300">?</span>
          <span>{visual.b}</span>
        </div>
      </div>
    );
  }
  if (visual.kind === "sequence") {
    return (
      <div className="space-y-4">
        <MissingNumberLine nums={visual.nums} />
      </div>
    );
  }
  if (visual.kind === "compare") {
    return (
      <div className="space-y-3">
        <NumberLine marked={[visual.a, visual.b]} />
        <div className="grid grid-cols-2 gap-3">
          <ObjectGroup count={visual.a} emoji="🍌" lang={lang} />
          <ObjectGroup count={visual.b} emoji="🍌" lang={lang} />
        </div>
      </div>
    );
  }
  if (visual.kind === "add") {
    const emoji = visual.emoji ?? "🍌";
    if (visual.container) {
      return (
        <div className="space-y-3">
          <AdditionGroupsAudioButton a={visual.a} b={visual.b} emoji={emoji} lang={lang} cyber={cyber} />
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <ContainerScene
              count={visual.a}
              emoji={emoji}
              container={visual.container}
              numbered={revealNumbers}
              label={lang === "en"
                ? `${visual.a} ${objectName(emoji, visual.a, lang)} in the basket`
                : `${visual.a} ${objectName(emoji, visual.a, lang)} di dalam bakul`}
              lang={lang}
            />
            <span data-math-cue="plus" className="text-center text-4xl font-black text-blue-700">+</span>
            <div className="rounded-3xl border-2 border-amber-100 bg-white p-3 text-center">
              <ObjectGroup count={visual.b} emoji={emoji} numbered={revealNumbers} lang={lang} maxPerRow={3} />
              <p className="mt-3 text-xl font-black text-amber-900">
                {lang === "en"
                  ? `${visual.b} more ${objectName(emoji, visual.b, lang)}`
                  : `${visual.b} ${objectName(emoji, visual.b, lang)} lagi`}
              </p>
            </div>
          </div>
          <p className="text-center text-3xl font-black text-slate-400">= ?</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <AdditionGroupsAudioButton a={visual.a} b={visual.b} emoji={emoji} lang={lang} cyber={cyber} />
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <ObjectGroup count={visual.a} emoji={emoji} numbered={visual.showLabels === true || revealNumbers} lang={lang} maxPerRow={3} />
          <span data-math-cue="plus" className="text-center text-4xl font-black text-blue-700">+</span>
          <ObjectGroup count={visual.b} emoji={emoji} numbered={visual.showLabels === true || revealNumbers} lang={lang} maxPerRow={3} />
        </div>
        <p className="text-center text-3xl font-black text-slate-400">= ?</p>
      </div>
    );
  }
  const emoji = visual.emoji ?? "🍌";
  return (
    <div className="space-y-3">
      <ObjectGroup count={visual.a} emoji={emoji} numbered={visual.showLabels === true || revealCrossedLabels} crossed={visual.b} crossedLabels={revealCrossedLabels} cyber={cyber} lang={lang} />
      {revealNumbers && <p className={`text-center text-2xl font-black ${cyber ? "text-cyan-200" : "text-slate-500"}`}>{visual.a} - {visual.b} = ?</p>}
    </div>
  );
}

function NumberRecognitionSolution({ value, lang, cyber }: { value: number; lang: Lang; cyber: boolean }) {
  const word = numberWordFor(value, lang);
  const namedWord = word.charAt(0).toUpperCase() + word.slice(1);
  const spelling = word.split("").join(" - ");

  return (
    <div className={`rounded-3xl border-2 p-4 ${cyber ? "border-cyan-500 bg-slate-950/80" : "border-emerald-100 bg-emerald-50"}`}>
      <h4 className={`mb-4 text-lg font-black ${cyber ? "text-yellow-200" : "text-emerald-900"}`}>
        {lang === "en" ? "How to solve it" : "Cara selesaikan"}
      </h4>
      <div className={`grid gap-5 rounded-[2rem] border-4 p-5 md:grid-cols-2 ${cyber ? "border-cyan-300 bg-slate-950 shadow-[0_7px_0_#164e63]" : "border-blue-200 bg-white shadow-[0_7px_0_rgba(30,64,175,.12)]"}`}>
        <div className={`grid min-h-72 place-items-center rounded-[1.75rem] border-2 p-5 ${cyber ? "border-cyan-400 bg-cyan-950/55" : "border-blue-100 bg-blue-50"}`}>
          <span
            className="grid h-60 w-60 max-w-full place-items-center rounded-[2.5rem] border-4 border-yellow-300 bg-yellow-300 text-8xl font-black text-slate-950 shadow-[0_10px_0_#a16207]"
            style={getNumberTextStyle(value)}
          >
            {value}
          </span>
        </div>
        <div className={`flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border-2 p-5 text-center ${cyber ? "border-cyan-400 bg-cyan-950/55" : "border-blue-100 bg-blue-50"}`}>
          <p className={`mb-4 text-sm font-black uppercase tracking-[.18em] ${cyber ? "text-cyan-300" : "text-blue-700"}`}>
            {lang === "en" ? "Listen and learn" : "Dengar dan belajar"}
          </p>
          <AudioHearButton
            label={lang === "en" ? `Hear ${word}` : `Dengar ${word}`}
            onClick={() => speakNumber(value, lang)}
            cyber={cyber}
          />
          <p className={`mt-5 text-xl font-black ${cyber ? "text-cyan-50" : "text-blue-950"}`}>
            {lang === "en" ? `The audio says ${word}.` : `Audio menyebut ${word}.`}
          </p>
          <p className={`mt-2 text-5xl font-black ${cyber ? "text-yellow-200" : "text-amber-700"}`}>
            “{namedWord}”
          </p>
          <p className={`mt-3 text-xl font-black tracking-wide ${cyber ? "text-cyan-100" : "text-slate-600"}`}>{spelling}</p>
        </div>
      </div>
    </div>
  );
}

function WorkedMethod({ q, lang, visualOnlyOperationSolutions = false, cyber = false }: {
  q: Question;
  lang: Lang;
  visualOnlyOperationSolutions?: boolean;
  cyber?: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const announcedStaticTotalRef = useRef<string | null>(null);
  const announcedAdvancedSubtractionCueRef = useRef<string | null>(null);
  const announcedComparisonStepRef = useRef<string | null>(null);
  const spokenSteps = q.method[lang].join(". ");
  const solutionVisual: Visual =
    q.inputMode === "tapObjects" && typeof q.answer === "number" && q.answer > 0
      ? { kind: "count", count: q.answer, emoji: "🍌" }
      : q.visual;
  const recognitionValue = (q.id.startsWith("rec-") || q.id.startsWith("adv-teen-rec-")) &&
    (solutionVisual.kind === "number" || solutionVisual.kind === "word" || solutionVisual.kind === "audioNumber")
      ? solutionVisual.value
      : null;
  const lastStep = stepIndex >= q.method[lang].length - 1;
  const isAdvancedAdditionPart1 =
    q.id.startsWith("adv-add-1-") && solutionVisual.kind === "horizontalAdd";
  const advancedComparisonPair = q.id.startsWith("adv-test-compare-") && solutionVisual.kind === "advancedCompareTest"
    ? { left: solutionVisual.a, right: solutionVisual.b }
    : null;
  const staticBananaCalculation =
    q.inputMode !== "carryBuild" &&
    q.inputMode !== "makeTenBuild" &&
    !isAdvancedAdditionPart1 &&
    (
      solutionVisual.kind === "verticalAdd" ||
      solutionVisual.kind === "verticalSubtract" ||
      solutionVisual.kind === "horizontalSubtract" ||
      solutionVisual.kind === "horizontalAdd" ||
      (solutionVisual.kind === "count" && solutionVisual.count === 0 && (solutionVisual.emoji ?? BANANA) === BANANA)
    );

  useEffect(() => {
    setStepIndex(0);
    announcedStaticTotalRef.current = null;
    announcedAdvancedSubtractionCueRef.current = null;
    announcedComparisonStepRef.current = null;
  }, [q.id]);

  useEffect(() => {
    if (!advancedComparisonPair || stepIndex > 1) return;
    const { left, right } = advancedComparisonPair;
    const announcementKey = `${q.id}:${lang}:${stepIndex}:${left}:${right}`;
    if (announcedComparisonStepRef.current === announcementKey) return;
    announcedComparisonStepRef.current = announcementKey;

    if (stepIndex === 0) return;

    const symbol = left > right ? ">" : left < right ? "<" : "=";
    void speakComparisonResultSentence(left, right, symbol, lang);
  }, [advancedComparisonPair, lang, q.id, stepIndex]);

  useEffect(() => {
    if (!(q.id.startsWith("adv-sub-") || q.id.startsWith("adv-test-sub-")) || (solutionVisual.kind !== "verticalSubtract" && solutionVisual.kind !== "horizontalSubtract" && solutionVisual.kind !== "subtract")) return;
    const cueKey = `${q.id}:${lang}`;
    if (announcedAdvancedSubtractionCueRef.current === cueKey) return;
    announcedAdvancedSubtractionCueRef.current = cueKey;
    void speakMathCue("minus", lang);
  }, [lang, q.id, solutionVisual.kind]);

  useEffect(() => {
    const answer = typeof q.answer === "number" ? q.answer : Number(q.answer);
    const announcementKey = `${q.id}:${lang}:${answer}`;
    if (
      !staticBananaCalculation ||
      !lastStep ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer > 20 ||
      announcedStaticTotalRef.current === announcementKey
    ) return;

    announcedStaticTotalRef.current = announcementKey;
    void speakRecordedBananaTotal(answer, lang);
  }, [lang, lastStep, q.answer, q.id, staticBananaCalculation]);

  if (recognitionValue !== null) {
    return <NumberRecognitionSolution value={recognitionValue} lang={lang} cyber={cyber} />;
  }

  if (isAdvancedAdditionPart1) {
    return (
      <div className="rounded-3xl border-2 border-cyan-500 bg-slate-950/80 p-4">
        <h4 className="mb-4 text-lg font-black text-yellow-200">
          {lang === "en" ? "How to solve it" : "Cara selesaikan"}
        </h4>
        <div className="rounded-[2rem] border-2 border-cyan-600 bg-gradient-to-br from-slate-950 to-cyan-950/80 p-3 shadow-[inset_0_0_28px_rgba(34,211,238,.12)] sm:p-5">
          <AdditionBananaEquation
            key={q.id}
            lang={lang}
            a={solutionVisual.a}
            b={solutionVisual.b}
            emoji={String.fromCodePoint(0x1f34c)}
            cyber
          />
        </div>
      </div>
    );
  }

  if (visualOnlyOperationSolutions && solutionVisual.kind === "add") {
    return (
      <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
        <h4 className="mb-4 text-lg font-black text-emerald-900">
          {lang === "en" ? "How to solve it" : "Cara selesaikan"}
        </h4>
        <AdditionBananaEquation
          key={q.id}
          lang={lang}
          a={solutionVisual.a}
          b={solutionVisual.b}
          emoji={solutionVisual.emoji ?? "🍌"}
          autoStart
        />
      </div>
    );
  }

  if (visualOnlyOperationSolutions && solutionVisual.kind === "subtract") {
    return (
      <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
        <h4 className="mb-4 text-lg font-black text-emerald-900">
          {lang === "en" ? "How to solve it" : "Cara selesaikan"}
        </h4>
        <SolutionVisual visual={solutionVisual} lang={lang} />
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border-2 p-4 ${cyber ? "border-cyan-500 bg-slate-950/80" : "border-emerald-100 bg-emerald-50"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className={`text-lg font-black ${cyber ? "text-yellow-200" : "text-emerald-900"}`}>{lang === "en" ? "How to solve it" : "Cara selesaikan"}</h4>
        {WORD_AUDIO_ENABLED && (
          <button
            type="button"
            onClick={() => speakText(spokenSteps, lang)}
            aria-label={lang === "en" ? "Hear the solution steps" : "Dengar cara jawab"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-emerald-200 bg-white text-emerald-700 shadow-[0_4px_0_rgba(4,120,87,.14)] active:translate-y-1"
          >
            <SpeakerIcon />
          </button>
        )}
      </div>
      <div className="mb-3">
        <SolutionVisual visual={solutionVisual} lang={lang} cyber={cyber} />
      </div>
      <div className={`rounded-3xl border-2 px-5 py-4 text-center ${cyber ? "border-cyan-600 bg-slate-900" : "border-emerald-200 bg-white"}`}>
        <p className={`text-sm font-black uppercase ${cyber ? "text-cyan-300" : "text-emerald-600"}`}>
          {lang === "en" ? `Step ${stepIndex + 1}` : `Langkah ${stepIndex + 1}`}
        </p>
        <p className={`mt-1 text-xl font-black ${cyber ? "text-cyan-50" : "text-slate-800"}`}>{q.method[lang][stepIndex]}</p>
      </div>
      {!lastStep && (
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.min(q.method[lang].length - 1, current + 1))}
          className="mt-3 w-full rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#047857] active:translate-y-1"
        >
          {lang === "en" ? "Next step" : "Langkah seterusnya"}
        </button>
      )}
    </div>
  );
}

function SequentialCountResult({ count, emoji, lang, cyber = false, maxPerRow = 4 }: { count: number; emoji: string; lang: Lang; cyber?: boolean; maxPerRow?: number }) {
  const [currentCount, setCurrentCount] = useState(0);
  const [complete, setComplete] = useState(false);

  const finishCounting = useCallback(() => {
    setCurrentCount(count);
    setComplete(true);
  }, [count]);

  useEffect(() => {
    setCurrentCount(0);
    setComplete(false);
  }, [count, emoji, lang]);

  return (
    <div className="space-y-3">
      <ManualCountedObjectRow
        count={count}
        emoji={emoji}
        lang={lang}
        announceTotal
        onProgress={setCurrentCount}
        onComplete={finishCounting}
        cyber={cyber}
        rowPattern={balancedIndexRows(count, maxPerRow).map((row) => row.length)}
      />
      <div className="min-h-16" aria-live="polite">
        {complete ? (
          <div className="space-y-3">
            <CountTotalBadge count={count} lang={lang} unit={objectName(emoji, count, lang)} />
            <p className={`text-center text-lg font-black ${cyber ? "text-emerald-300" : "text-emerald-800"}`}>
              {lang === "en" ? `This is ${count}.` : `Ini ${count}.`}
            </p>
          </div>
        ) : (
          <p className={`rounded-full px-4 py-3 text-center text-xl font-black ${cyber ? "border border-cyan-700 bg-cyan-950 text-cyan-100" : "bg-blue-50 text-blue-900"}`}>
            {currentCount > 0
              ? (lang === "en" ? `Counting: ${currentCount}` : `Mengira: ${currentCount}`)
              : (lang === "en" ? "Get ready to count." : "Bersedia untuk mengira.")}
          </p>
        )}
      </div>
    </div>
  );
}

function SolutionVisual({ visual, lang, cyber = false }: { visual: Visual; lang: Lang; cyber?: boolean }) {
  if (visual.kind === "verticalAdd") {
    return <VerticalAdditionCard a={visual.a} b={visual.b} answer={visual.a + visual.b} lang={lang} />;
  }
  if (visual.kind === "verticalSubtract") {
    return <VerticalSubtractionCard a={visual.a} b={visual.b} answer={visual.a - visual.b} borrowing={visual.borrowing} showBorrow={visual.borrowing} lang={lang} />;
  }
  if (visual.kind === "horizontalSubtract") {
    const answer = visual.a - visual.b;
    return (
      <div className={`mx-auto rounded-3xl border-2 p-5 text-center text-4xl font-black ${cyber ? "border-cyan-300 bg-slate-950 text-yellow-200" : "border-emerald-200 bg-white text-emerald-900"}`} style={getNumberTextStyle(answer)}>
        {visual.a} − {visual.b} = {answer}
      </div>
    );
  }
  if (visual.kind === "teenBundle") {
    return <VisualDisplay visual={visual} lang={lang} revealNumbers cyber={cyber} />;
  }
  if (visual.kind === "count") {
    const emoji = visual.emoji ?? "🍌";
    if (visual.count === 0) {
      return visual.container
        ? <ContainerScene count={0} emoji={emoji} container={visual.container} numbered lang={lang} />
        : <ObjectGroup count={0} emoji={emoji} numbered cyber={cyber} lang={lang} />;
    }
    return <SequentialCountResult count={visual.count} emoji={emoji} lang={lang} cyber={cyber} maxPerRow={visual.container === "tray" ? 5 : 4} />;
  }
  if (visual.kind === "add") {
    return <AdditionBananaEquation lang={lang} a={visual.a} b={visual.b} emoji={visual.emoji ?? "🍌"} autoStart />;
  }
  if (visual.kind === "groupObserve" || visual.kind === "groupMake") {
    return <GroupingTray label={lang === "en" ? "Group box" : "Kotak kumpulan"} count={visual.count} emoji={visual.emoji} counted lang={lang} />;
  }
  if (visual.kind === "groupBuildMany") {
    return (
      <div className={`grid gap-4 ${visual.counts.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {visual.counts.map((count, groupIndex) => (
          <GroupingTray
            key={`group-solution-${groupIndex}`}
            label={lang === "en" ? `Group ${groupIndex + 1}` : `Kumpulan ${groupIndex + 1}`}
            count={count}
            emoji={visual.emoji}
            counted
            lang={lang}
          />
        ))}
      </div>
    );
  }
  if (visual.kind === "groupTwo") {
    return <CountedGroupTwoSolution visual={visual} lang={lang} />;
  }
  if (visual.kind === "groupCompare") {
    return (
      <CountedCompareGroupsSolution
        visual={{
          kind: "compareGroups",
          a: visual.a,
          b: visual.b,
          emojiA: visual.emoji,
          emojiB: visual.emoji,
          ask: visual.ask,
        }}
        lang={lang}
      />
    );
  }
  if (visual.kind === "groupCombine") {
    return <CountedGroupCombineSolution visual={visual} lang={lang} />;
  }
  if (visual.kind === "compareGroups") {
    return <CountedCompareGroupsSolution visual={visual} lang={lang} />;
  }
  if (visual.kind === "word") {
    const word = numberWordFor(visual.value, lang);
    return (
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className={`rounded-3xl border-4 border-yellow-300 p-5 text-center ${cyber ? "bg-slate-950" : "bg-yellow-50"}`}>
          <p className={`text-4xl font-black ${cyber ? "text-yellow-200" : "text-blue-950"}`}>{word}</p>
          <p className={`mt-2 text-lg font-black ${cyber ? "text-cyan-100" : "text-slate-600"}`}>{word.split("").join(" - ")}</p>
        </div>
        <span data-math-cue="equals" className="text-center text-4xl font-black text-amber-500" aria-hidden="true">=</span>
        <NumberTile value={visual.value} lang={lang} showWord={false} />
      </div>
    );
  }
  if (visual.kind === "audioNumber") {
    if (!NUMBER_AUDIO_ENABLED) return null;
    return <AudioNumberSolutionCard value={visual.value} lang={lang} cyber={cyber} />;
  }
  if (visual.kind === "subtract") {
    const emoji = visual.emoji ?? "🍌";
    return <InteractiveSubtractionFlow start={visual.a} takeAway={visual.b} emoji={emoji} lang={lang} />;
  }
  if (visual.kind === "sequence") {
    return <SequenceReferenceSolution nums={visual.nums} lang={lang} />;
  }
  if (visual.kind === "compare") {
    return <NumberLine marked={[visual.a, visual.b]} />;
  }
  return <VisualDisplay visual={visual} lang={lang} cyber={cyber} />;
}

type AudioStartMode = "clear" | "joined";
type AudioClarityProfile = "default" | "bm";

async function speakNumber(
  value: number,
  lang: Lang,
  onStart?: (value: number) => void,
  onAudibleStart?: () => void,
  startMode: AudioStartMode = "clear",
  tailTrimMs = 0,
): Promise<boolean> {
  if (!NUMBER_AUDIO_ENABLED || audioMuted) {
    onStart?.(value);
    onAudibleStart?.();
    return false;
  }
  if (activeCountingRunId !== null) {
    queuedAudioAfterCounting = () => { void speakNumber(value, lang, onStart, onAudibleStart, startMode, tailTrimMs); };
    return false;
  }
  stopNumberAudio();
  const runId = audioRunId;
  onStart?.(value);
  return playNumberFile(value, lang, runId, onAudibleStart, startMode, tailTrimMs);
}

async function playRecordedVoiceFile(
  file: string,
  onAudibleStart?: () => void,
  startMode: AudioStartMode = "clear",
): Promise<boolean> {
  if (!NUMBER_AUDIO_ENABLED || audioMuted) return false;
  stopNumberAudio();
  return new Promise<boolean>((resolve) => {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    let settled = false;
    let timeoutId: number | null = null;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (activeNumberAudio === audio) activeNumberAudio = null;
      resolve(played);
    };

    activeNumberAudio = audio;
    audio.preload = "auto";
    audio.playbackRate = 1;
    audio.preservesPitch = true;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    timeoutId = window.setTimeout(() => finish(audio.currentTime > 0), 6500);
    void playAudioFromClearStart(
      audio,
      () => activeNumberAudio === audio,
      onAudibleStart,
      startMode,
      BM_RECORDED_AUDIO_FILES.has(file) ? "bm" : "default",
    )
      .then((started) => {
        if (!started) finish(false);
      });
  });
}

async function speakComparisonResultSentence(
  left: number,
  right: number,
  symbol: ">" | "<" | "=",
  lang: Lang,
): Promise<void> {
  if (left < 0 || left > 20 || right < 0 || right > 20) return;
  if (!NUMBER_AUDIO_ENABLED || audioMuted) return;
  await speakNumber(left, lang);
  await wait(AUDIO_PHRASE_JOIN_GAP_MS);
  if (symbol === "=") {
    await speakMathCue("equals", lang, "joined");
  } else {
    await playRecordedVoiceFile(COMPARISON_AUDIO_FILES[lang][symbol === ">" ? "greater" : "less"], undefined, "joined");
  }
  await wait(AUDIO_PHRASE_JOIN_GAP_MS);
  await speakNumber(right, lang, undefined, undefined, "joined");
}

async function speakComparisonSentence(
  left: number,
  right: number,
  symbol: ">" | "<" | "=",
  lang: Lang,
  leftEmoji?: string,
  rightEmoji?: string,
): Promise<void> {
  if (leftEmoji && rightEmoji && NUMBER_AUDIO_ENABLED && !audioMuted) {
    await speakRecordedBananaTotal(left, lang, leftEmoji);
    await wait(AUDIO_PHRASE_JOIN_GAP_MS);
    await speakRecordedBananaTotal(right, lang, rightEmoji);
    await wait(AUDIO_PHRASE_JOIN_GAP_MS);
  }
  await speakComparisonResultSentence(left, right, symbol, lang);
}

async function speakRecordedBananaTotal(value: number, lang: Lang, emoji: string = BANANA, onAudibleStart?: () => void) {
  if (value < 0 || value > 20) return false;
  if (emoji === BANANA) return speakBananaTotal(value, lang, onAudibleStart);
  if (lang === "ms") {
    const file = MS_OBJECT_TOTAL_AUDIO_FILES[emoji]?.[value];
    return file ? playRecordedVoiceFile(file, onAudibleStart) : false;
  }

  const phraseFile = EN_OBJECT_TOTAL_PHRASE_AUDIO_FILES[emoji]?.[value];
  if (phraseFile) {
    if (activeCountingRunId !== null) {
      queuedAudioAfterCounting = () => { void speakRecordedBananaTotal(value, lang, emoji, onAudibleStart); };
      return false;
    }
    return playRecordedVoiceFile(phraseFile, onAudibleStart);
  }

  const objectFiles = EN_OBJECT_TOTAL_AUDIO_FILES.objects[emoji];
  if (!objectFiles) return false;
  const objectFile = value === 1 && objectFiles.singular ? objectFiles.singular : objectFiles.plural;
  if (activeCountingRunId !== null) {
    queuedAudioAfterCounting = () => { void speakRecordedBananaTotal(value, lang, emoji, onAudibleStart); };
    return false;
  }

  const totalPlayed = await playRecordedVoiceFile(EN_OBJECT_TOTAL_AUDIO_FILES.total, onAudibleStart);
  if (!totalPlayed) return false;
  await wait(AUDIO_PHRASE_JOIN_GAP_MS);
  const numberPlayed = await speakNumber(
    value,
    lang,
    undefined,
    undefined,
    "joined",
    AUDIO_NUMBER_OBJECT_TAIL_TRIM_MS,
  );
  if (!numberPlayed) return false;
  await wait(AUDIO_NUMBER_OBJECT_JOIN_GAP_MS);
  return playRecordedVoiceFile(objectFile, undefined, "joined");
}

async function speakBananaTotal(value: number, lang: Lang, onAudibleStart?: () => void) {
  if (!NUMBER_AUDIO_ENABLED || audioMuted) {
    onAudibleStart?.();
    return false;
  }
  const file = BANANA_TOTAL_AUDIO_FILES[lang][value];
  if (!file) return false;
  if (activeCountingRunId !== null) {
    queuedAudioAfterCounting = () => { void speakBananaTotal(value, lang, onAudibleStart); };
    return false;
  }

  stopNumberAudio();
  return new Promise<boolean>((resolve) => {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    let settled = false;
    let timeoutId: number | null = null;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (activeNumberAudio === audio) activeNumberAudio = null;
      resolve(played);
    };

    activeNumberAudio = audio;
    audio.preload = "auto";
    audio.playbackRate = NUMBER_AUDIO_PLAYBACK_RATE;
    audio.preservesPitch = true;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    timeoutId = window.setTimeout(() => finish(audio.currentTime > 0), 6500);
    void playAudioFromClearStart(
      audio,
      () => activeNumberAudio === audio,
      onAudibleStart,
      "clear",
      lang === "ms" ? "bm" : "default",
    )
      .then((started) => {
        if (!started) finish(false);
      });
  });
}

async function speakNumberValuesSequence(
  values: number[],
  lang: Lang,
  intervalMs: number,
  onCount?: (value: number) => void,
) {
  if (!NUMBER_AUDIO_ENABLED || audioMuted || values.length === 0) return;
  stopNumberAudio();
  const runId = audioRunId;
  activeCountingRunId = runId;
  const gapMs = Math.max(180, COUNTING_INTER_NUMBER_GAP_MS + intervalMs - COUNTING_STEP_MS);
  try {
    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];
      if (runId !== audioRunId) return;
      onCount?.(value);
      await playNumberFile(
        value,
        lang,
        runId,
        undefined,
        index === 0 ? "clear" : "joined",
        COUNTING_NUMBER_TAIL_TRIM_MS,
      );
      if (runId !== audioRunId) return;
      if (index < values.length - 1) await wait(gapMs);
    }
  } finally {
    if (activeCountingRunId === runId) activeCountingRunId = null;
  }
}

async function speakCountingSequence(
  count: number,
  lang: Lang = "en",
  intervalMs = COUNTING_STEP_MS,
  onCount?: (value: number) => void,
  onCountComplete?: (value: number) => void,
  startValue = 1,
) {
  if (!NUMBER_AUDIO_ENABLED || audioMuted) return;
  if (count <= 0) return;
  if (activeCountingRunId !== null) return;
  stopNumberAudio();
  const runId = audioRunId;
  activeCountingRunId = runId;
  const gapMs = Math.max(180, COUNTING_INTER_NUMBER_GAP_MS + intervalMs - COUNTING_STEP_MS);
  const finalValue = Math.min(count, 20);
  const firstValue = Math.max(1, startValue);
  let completed = false;
  try {
    for (let value = firstValue; value <= finalValue; value += 1) {
      if (runId !== audioRunId) return;
      onCount?.(value);
      await playNumberFile(
        value,
        lang,
        runId,
        undefined,
        value === firstValue ? "clear" : "joined",
        COUNTING_NUMBER_TAIL_TRIM_MS,
      );
      if (runId !== audioRunId) return;
      onCountComplete?.(value);
      if (value < finalValue) await wait(gapMs);
    }
    completed = true;
  } finally {
    if (completed && runId === audioRunId) lastCountingFinishedAt = performance.now();
    if (activeCountingRunId === runId) {
      activeCountingRunId = null;
      const queuedAudio = queuedAudioAfterCounting;
      queuedAudioAfterCounting = null;
      if (runId === audioRunId) queuedAudio?.();
    }
  }
}

function stopNumberAudio() {
  audioRunId += 1;
  activeCountingRunId = null;
  queuedAudioAfterCounting = null;
  activeNumberAudio?.pause();
  activeNumberAudio = null;
  mathCueVisualRunId += 1;
  clearMathCueVisual();
}

function stopCelebrationAudio() {
  const audio = activeCelebrationAudio ?? successFanfareAudio;
  audio?.pause();
  if (audio) {
    audio.loop = false;
    resetAudioToStart(audio);
  }
  activeCelebrationAudio = null;
}

function resetAudioToStart(audio: HTMLAudioElement) {
  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers reject seeking until metadata is available. Playback will
    // decode the clip before the next reset attempt.
  }
}

function waitForAudioReady(audio: HTMLAudioElement, timeoutMs = 3500): Promise<boolean> {
  if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onError);
      resolve(ready);
    };
    const onReady = () => finish(true);
    const onError = () => finish(false);
    const timeoutId = window.setTimeout(() => finish(audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA), timeoutMs);
    audio.addEventListener("loadeddata", onReady, { once: true });
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

function seekAudioToStart(audio: HTMLAudioElement, timeoutMs = 600): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      audio.removeEventListener("seeked", finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, timeoutMs);
    audio.addEventListener("seeked", finish, { once: true });
    resetAudioToStart(audio);
    if (audio.currentTime === 0) window.setTimeout(finish, 0);
  });
}

async function playAudioFromClearStart(
  audio: HTMLAudioElement,
  isCurrent: () => boolean,
  onAudibleStart?: () => void,
  startMode: AudioStartMode = "clear",
  clarityProfile: AudioClarityProfile = "default",
): Promise<boolean> {
  if (!isCurrent()) return false;
  audio.preload = "auto";
  const audibleVolume = audio.volume;
  const wasLooping = audio.loop;
  audio.pause();
  if (!await waitForAudioReady(audio) || !isCurrent()) return false;
  await seekAudioToStart(audio);
  if (!isCurrent()) return false;

  const joinsRecentClip = performance.now() - lastAudioClipFinishedAt <= AUDIO_SEQUENCE_JOIN_WINDOW_MS;
  const shouldJoin = startMode === "joined" || joinsRecentClip;
  const noteAudioFinished = () => {
    lastAudioClipFinishedAt = performance.now();
  };

  if (shouldJoin) {
    audio.volume = audibleVolume;
    audio.loop = wasLooping;
    audio.addEventListener("ended", noteAudioFinished, { once: true });
    try {
      await audio.play();
      onAudibleStart?.();
      return true;
    } catch {
      audio.removeEventListener("ended", noteAudioFinished);
      return false;
    }
  }

  audio.volume = 0;
  audio.loop = true;
  const useBmWakeSignal = clarityProfile === "bm";
  if (useBmWakeSignal) setBmAudioWakeSignal(true);

  try {
    // Calling play immediately preserves the browser's user-gesture permission;
    // its promise resolves only after enough of the clip has decoded to start.
    await audio.play();
  } catch {
    if (useBmWakeSignal) setBmAudioWakeSignal(false);
    audio.loop = wasLooping;
    audio.volume = audibleVolume;
    return false;
  }

  if (!isCurrent()) {
    audio.pause();
    audio.loop = wasLooping;
    audio.volume = audibleVolume;
    return false;
  }

  await wait(AUDIO_CLEAR_START_PRIME_MS);
  if (useBmWakeSignal) setBmAudioWakeSignal(false);
  if (!isCurrent()) {
    audio.pause();
    audio.loop = wasLooping;
    audio.volume = audibleVolume;
    return false;
  }

  // Stop the silent decode pass, restore normal looping, and rewind. The short
  // settle avoids a decoder/seek race without producing a quiet duplicate.
  audio.pause();
  audio.loop = wasLooping;
  await seekAudioToStart(audio);
  await wait(AUDIO_CLEAR_START_SETTLE_MS);
  if (!isCurrent()) {
    audio.pause();
    audio.volume = audibleVolume;
    return false;
  }

  audio.volume = audibleVolume;
  audio.addEventListener("ended", noteAudioFinished, { once: true });
  try {
    await audio.play();
    onAudibleStart?.();
    return true;
  } catch {
    audio.removeEventListener("ended", noteAudioFinished);
    audio.volume = audibleVolume;
    return false;
  }
}

function playSuccessFanfare(onFinished?: () => void) {
  if (!NUMBER_AUDIO_ENABLED || audioMuted) return false;
  stopNumberAudio();
  stopCelebrationAudio();
  const audio = getSuccessFanfareAudio();
  audio.pause();
  audio.currentTime = 0;
  audio.preload = "auto";
  audio.volume = 0.72;
  activeCelebrationAudio = audio;
  let settled = false;
  const clear = () => {
    if (settled) return;
    settled = true;
    if (activeCelebrationAudio === audio) activeCelebrationAudio = null;
    onFinished?.();
  };
  audio.onended = clear;
  audio.onerror = clear;
  void playAudioFromClearStart(audio, () => activeCelebrationAudio === audio)
    .then((started) => {
      if (!started) clear();
    });
  return true;
}

function getSuccessFanfareAudio() {
  if (successFanfareAudio) return successFanfareAudio;
  successFanfareAudio = new Audio(`${import.meta.env.BASE_URL}audio/${SUCCESS_FANFARE_FILE}`);
  successFanfareAudio.preload = "auto";
  return successFanfareAudio;
}

function playNumberFile(
  value: number,
  lang: Lang,
  runId: number,
  onAudibleStart?: () => void,
  startMode: AudioStartMode = "clear",
  tailTrimMs = 0,
) {
  const file = NUMBER_AUDIO_FILES[lang][value];
  if (!file) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    activeNumberAudio?.pause();
    const audio = getNumberAudio(value, lang);
    let settled = false;
    let timeoutId: number | null = null;
    let tailTrimTimeoutId: number | null = null;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (tailTrimTimeoutId !== null) window.clearTimeout(tailTrimTimeoutId);
      if (activeNumberAudio === audio) activeNumberAudio = null;
      resolve(played);
    };
    activeNumberAudio = audio;
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = NUMBER_AUDIO_PLAYBACK_RATE;
    audio.preservesPitch = true;
    audio.onended = () => finish(true);
    audio.onerror = () => {
      numberAudioCache.delete(`${lang}-${value}`);
      finish(false);
    };
    timeoutId = window.setTimeout(() => finish(audio.currentTime > 0), 4200);
    void playAudioFromClearStart(
      audio,
      () => runId === audioRunId && activeNumberAudio === audio,
      onAudibleStart,
      startMode,
      lang === "ms" ? "bm" : "default",
    ).then((started) => {
      if (!started) {
        finish(false);
        return;
      }
      if (tailTrimMs > 0 && Number.isFinite(audio.duration)) {
        const remainingMs = Math.max(0, ((audio.duration - audio.currentTime) / audio.playbackRate) * 1000);
        const safeTailTrimMs = Math.min(tailTrimMs, remainingMs * 0.18);
        tailTrimTimeoutId = window.setTimeout(() => {
          audio.pause();
          finish(true);
        }, Math.max(0, remainingMs - safeTailTrimMs));
      }
    });
    if (runId !== audioRunId) {
      audio.pause();
      finish(false);
    }
  });
}

function getNumberAudio(value: number, lang: Lang) {
  const cacheKey = `${lang}-${value}`;
  const cached = numberAudioCache.get(cacheKey);
  if (cached) return cached;
  const file = NUMBER_AUDIO_FILES[lang][value];
  const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
  audio.preload = "auto";
  numberAudioCache.set(cacheKey, audio);
  return audio;
}

function preloadNumberAudioFiles() {
  getSuccessFanfareAudio().load();
  [
    ...Object.values(COMPARISON_AUDIO_FILES.en),
    ...Object.values(COMPARISON_AUDIO_FILES.ms),
    EN_OBJECT_TOTAL_AUDIO_FILES.total,
    ...Object.values(COUNT_PROMPT_AUDIO_FILES),
    ...DIGIT_LABEL_AUDIO_FILES.en,
    ...DIGIT_LABEL_AUDIO_FILES.ms,
    ...Object.values(EN_OBJECT_TOTAL_AUDIO_FILES.objects).flatMap(({ singular, plural }) => singular ? [singular, plural] : [plural]),
    ...Object.values(EN_OBJECT_TOTAL_PHRASE_AUDIO_FILES).flatMap((files) => Object.values(files)),
    ...Object.values(MS_OBJECT_TOTAL_AUDIO_FILES).flatMap((files) => Object.values(files)),
  ].forEach((file) => {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    audio.preload = "auto";
    audio.load();
  });
  (Object.keys(MATH_CUE_AUDIO_FILES) as Lang[]).forEach((lang) => {
    Object.values(MATH_CUE_AUDIO_FILES[lang] ?? {}).forEach((file) => {
      const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
      audio.preload = "auto";
      audio.load();
    });
  });
  (Object.keys(BANANA_TOTAL_AUDIO_FILES) as Lang[]).forEach((lang) => {
    Object.values(BANANA_TOTAL_AUDIO_FILES[lang]).forEach((file) => {
      const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
      audio.preload = "auto";
      audio.load();
    });
  });
  (Object.keys(NUMBER_AUDIO_FILES) as Lang[]).forEach((lang) => {
    Object.keys(NUMBER_AUDIO_FILES[lang]).forEach((value) => {
      getNumberAudio(Number(value), lang).load();
    });
  });
}

async function speakMathCue(cue: MathCue, lang: Lang, startMode: AudioStartMode = "clear") {
  if (!MATH_CUE_AUDIO_ENABLED || audioMuted) return;
  if (activeCountingRunId !== null) {
    queuedAudioAfterCounting = () => void speakMathCue(cue, lang);
    return;
  }
  stopNumberAudio();
  const recordedFile = MATH_CUE_AUDIO_FILES[lang]?.[cue];
  if (!recordedFile) return;
  await new Promise<void>((resolve) => {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${recordedFile}`);
    let settled = false;
    let timeoutId: number | null = null;
    let visualRunId: number | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (activeNumberAudio === audio) activeNumberAudio = null;
      if (visualRunId !== null) clearMathCueVisual(visualRunId);
      resolve();
    };
    timeoutId = window.setTimeout(finish, 6500);
    activeNumberAudio = audio;
    audio.preload = "auto";
    audio.playbackRate = MATH_CUE_AUDIO_PLAYBACK_RATE;
    audio.preservesPitch = true;
    audio.onended = finish;
    audio.onerror = finish;
    void playAudioFromClearStart(
      audio,
      () => activeNumberAudio === audio,
      () => { visualRunId = beginMathCueVisual(cue); },
      startMode,
      lang === "ms" ? "bm" : "default",
    )
      .then((started) => {
        if (!started) finish();
      });
  });
}

function speakText(_text: string, _lang: Lang, _options: { requireInteraction?: boolean; allowWhenWordAudioDisabled?: boolean } = {}) {
  // Recorded-audio-only policy: never fall back to browser-generated speech.
}

async function playWholeNumberValueCount(
  count: number,
  lang: Lang,
  onValue: (value: number) => void,
  onAudioActive: (active: boolean) => void,
) {
  if (NUMBER_AUDIO_ENABLED && !audioMuted) {
    await playRecordedVoiceFile(COUNT_PROMPT_AUDIO_FILES[lang]);
    await wait(120);
  }
  let audioSequenceStarted = false;
  await speakCountingSequence(
    count,
    lang,
    COUNTING_STEP_MS,
    (value) => {
      audioSequenceStarted = true;
      onValue(value);
      onAudioActive(true);
    },
    () => onAudioActive(false),
  );

  if (!audioSequenceStarted) {
    for (let value = 1; value <= count; value += 1) {
      onValue(value);
      onAudioActive(true);
      await wait(COUNTING_STEP_MS);
      onAudioActive(false);
      if (value < count) await wait(180);
    }
  }
  onValue(count);
  onAudioActive(false);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function Decor() {
  return null;
}

export default App;
