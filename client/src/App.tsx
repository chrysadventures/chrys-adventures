import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Search, X } from "lucide-react";
import chrysHappy from "@assets/chrys_sitting_new_user_nobg.png";
import chrysExcited from "@assets/chrys_waving_new_user_nobg.png";
import chrysThinking from "@assets/chrys_reading_new_user_nobg.png";
import chrysRunning from "@assets/chrys_running_new_user_nobg.png";
import chrysRestingWithAlyse from "@assets/chrys_resting_with_alyse_new_user_nobg.png";
import alyseGuide from "@assets/alyse_guide_new_user_nobg.png";
import trayPhoto from "@assets/tray_photo.png";

type Lang = "en" | "ms";
type ContainerKind = "basket" | "tray";
type Screen =
  | "home"
  | "menu"
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

type Visual =
  | { kind: "count"; emoji: string; count: number; container?: ContainerKind }
  | { kind: "number"; value: number }
  | { kind: "word"; value: number }
  | { kind: "audioNumber"; value: number }
  | { kind: "groupChoices"; emoji: string; groups: number[] }
  | { kind: "groupObserve"; emoji: string; count: number }
  | { kind: "groupMake"; emoji: string; count: number }
  | { kind: "groupTwo"; emoji: string; a: number; b: number }
  | { kind: "groupCompare"; emoji: string; a: number; b: number; ask: "same" | "more" | "fewer" }
  | { kind: "groupCombine"; emoji: string; a: number; b: number }
  | { kind: "numberWithGroup"; value: number; emoji: string }
  | { kind: "sameValue"; count: number; emojis: string[] }
  | { kind: "layoutValue"; count: number; emoji: string }
  | { kind: "compareGroups"; a: number; b: number; emojiA: string; emojiB: string; ask: "more" | "fewer" }
  | { kind: "order"; nums: number[]; direction: "asc" | "desc" }
  | { kind: "symbol"; a: number; b: number; showObjects?: boolean }
  | { kind: "sequence"; nums: Array<number | "?"> }
  | { kind: "compare"; a: number; b: number }
  | { kind: "add"; a: number; b: number; emoji?: string; container?: ContainerKind }
  | { kind: "subtract"; a: number; b: number; emoji?: string; container?: ContainerKind };

type Question = {
  id: string;
  area: "numbers" | "operations" | "real";
  text: Record<Lang, string>;
  options: Array<number | string>;
  answer: number | string;
  visual: Visual;
  method: Record<Lang, string[]>;
  inputMode?: "choice" | "keypad" | "makeGroup" | "buildTotal" | "tapObjects" | "takeAway";
};

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
const NUMBERS = Array.from({ length: 10 }, (_, n) => n);
const NUMBER_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--app-font-number)",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};
const SPEECH_RATE = 0.68;
const NUMBER_AUDIO_PLAYBACK_RATE = 0.85;
const COUNTING_STEP_MS = 1400;
const ADDITION_BANANA_TRAVEL_MS = 1200;
const ADDITION_BANANA_COUNT_PAUSE_MS = 1200;
const ADDITION_BANANA_STAGGER_MS = ADDITION_BANANA_TRAVEL_MS + ADDITION_BANANA_COUNT_PAUSE_MS;
const ADDITION_EQUATION_GROUPS = [2, 3, 5] as const;
const VALUE_EMOJIS = ["🍌", "🍃", "🥭", "🍌", "🪨", "🥥", "🍄", "🌸", "📘", "🚗"];
const WORDS: Record<Lang, string[]> = {
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  ms: ["sifar", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"],
};

const NUMBER_AUDIO_FILES: Record<number, string> = {
  0: "floraphonic-adult-man-raspy-voice-says-0-184064.mp3",
  1: "floraphonic-casual-voice-man-says-1-186552.mp3",
  2: "floraphonic-casual-voice-man-says-2-186553.mp3",
  3: "floraphonic-casual-voice-man-says-3-186554.mp3",
  4: "floraphonic-casual-voice-man-says-4-186555.mp3",
  5: "floraphonic-casual-voice-man-says-5-186556.mp3",
  6: "floraphonic-casual-voice-man-says-6-209711.mp3",
  7: "floraphonic-casual-voice-man-says-7-209713.mp3",
  8: "floraphonic-casual-voice-man-says-8-209710.mp3",
  9: "floraphonic-casual-voice-man-says-9-209709.mp3",
  10: "floraphonic-casual-voice-man-says-10-209712.mp3",
};

const SPRITE_BASE = `${import.meta.env.BASE_URL}assets/sprites/`;
const BACKGROUND_BASE = `${import.meta.env.BASE_URL}assets/images/`;
const APP_BACKGROUND_STYLE = {
  "--app-bg-desktop": `url("${BACKGROUND_BASE}jungle-bg-desktop.png")`,
  "--app-bg-tablet": `url("${BACKGROUND_BASE}jungle-bg-tablet.png")`,
  "--app-bg-mobile": `url("${BACKGROUND_BASE}jungle-bg-mobile.png")`,
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
  "🌸": `${SPRITE_BASE}flower.png`,
  "🧺": BASKET_SPRITE,
  "🪵": `${SPRITE_BASE}log.png`,
  "🦋": `${SPRITE_BASE}butterfly.png`,
  "🌳": `${SPRITE_BASE}tree.png`,
  "💧": `${SPRITE_BASE}water-drop.png`,
  "🪶": `${SPRITE_BASE}feather.png`,
  "🌰": `${SPRITE_BASE}acorn.png`,
  "❄️": `${SPRITE_BASE}snowflake.png`,
};

let activeNumberAudio: HTMLAudioElement | null = null;
let audioRunId = 0;
let activeCountingRunId: number | null = null;
let queuedAudioAfterCounting: (() => void) | null = null;
let audioMuted = false;
let audioUserInteracted = false;
const numberAudioCache = new Map<number, HTMLAudioElement>();
const AudioEnabledContext = React.createContext(true);

function markAudioInteraction() {
  audioUserInteracted = true;
}

function setGlobalAudioMuted(muted: boolean) {
  audioMuted = muted;
  if (muted) stopNumberAudio();
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
    return <img src={src} alt="" aria-hidden="true" className={`${className} object-contain`} />;
  }
  return <span className={fallbackClassName}>{cleanDisplayText(value)}</span>;
}

const UI = {
  en: {
    title: "Chrys's Adventures",
    subtitle: "Numbers 0-9, one careful step at a time",
    namePrompt: "Who is learning today?",
    namePlaceholder: "Enter a name",
    start: "Start",
    continue: "Continue",
    menuTitle: "Where shall we learn today?",
    recognizeNumbers: "Recognize and Identify Numbers",
    numberValues: "Number Values",
    sequencing: "Number Order",
    learnNumbers: "Numbers 0-9",
    learnOperations: "Operations",
    learnOperationsShort: "Learning + and -",
    groupingMode: "Grouping Mode",
    groupingModeShort: "Put groups together",
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
    start: "Mula",
    continue: "Teruskan",
    menuTitle: "Hari ini mahu belajar apa?",
    recognizeNumbers: "Kenal dan Cam Nombor",
    numberValues: "Nilai Nombor",
    sequencing: "Turutan Nombor",
    learnNumbers: "Nombor 0-9",
    learnOperations: "Operasi",
    learnOperationsShort: "Belajar + dan -",
    groupingMode: "Mod Kumpulan",
    groupingModeShort: "Gabungkan kumpulan",
    addition: "Tambah",
    subtraction: "Tolak",
    learnReal: "Dunia Sebenar",
    testMode: "Mod Ujian",
    testHelp: "Ujian boleh dibuka bila-bila masa. Setiap jawapan tetap tunjuk cara.",
    lesson: "Pelajaran",
    practice: "Latihan",
    back: "Kembali",
    next: "Seterusnya",
    previous: "Sebelumnya",
    speak: "Dengar",
    clear: "Padam",
    traced: "Saya sudah surih",
    trace: "Surih",
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
    noNegative: "Tolak tidak akan kurang daripada sifar di sini.",
    language: "English",
  },
} as const;

type UIStrings = Record<keyof typeof UI["en"], string>;

type GlossaryEntry = {
  tier: 1 | 2 | 3;
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
  glossaryEntry(1, "Solution", "Penyelesaian", "The way to find the answer.", "Cara untuk mencari jawapan.", "The answer and the steps used to reach it.", "Jawapan dan langkah untuk mendapatkannya."),
  glossaryEntry(1, "Method", "Cara", "The way we do it, step by step.", "Cara kita buat, langkah demi langkah.", "A set of steps used to solve something.", "Langkah-langkah yang digunakan untuk menyelesaikan sesuatu."),
  glossaryEntry(1, "Ascending", "Menaik", "Going up. The numbers get bigger.", "Nombor naik dan menjadi lebih besar.", "Numbers placed from small to big.", "Nombor disusun daripada kecil kepada besar."),
  glossaryEntry(1, "Descending", "Menurun", "Going down. The numbers get smaller.", "Nombor turun dan menjadi lebih kecil.", "Numbers placed from big to small.", "Nombor disusun daripada besar kepada kecil."),
  glossaryEntry(1, "Symbol", "Tanda", "A little sign with a meaning, like + or -.", "Tanda kecil yang ada makna, seperti + atau -.", "A mark that stands for an idea or action.", "Tanda yang mewakili idea atau tindakan."),
  glossaryEntry(1, "Tracing", "Surih", "Follow the dotted line with your finger or pencil.", "Ikut garisan bertitik dengan jari atau pensel.", "Draw over a shape by following its guide line.", "Lukis di atas bentuk dengan mengikut garis panduan."),

  glossaryEntry(2, "Addition", "Tambah", "Put groups together to get more.", "Gabungkan kumpulan untuk mendapat lebih banyak.", "Addition uses the plus sign (+).", "Tambah menggunakan tanda tambah (+)."),
  glossaryEntry(2, "Subtraction", "Tolak", "Take some away to find what is still there.", "Ambil sebahagian untuk tahu apa yang masih ada.", "Subtraction uses the minus sign (-).", "Tolak menggunakan tanda tolak (-)."),
  glossaryEntry(2, "Greater", "Lebih besar", "Bigger. It is a larger number.", "Lebih besar. Nombornya lebih banyak.", "A number that is more than another number.", "Nombor yang lebih banyak daripada nombor lain."),
  glossaryEntry(2, "Total", "Jumlah", "How many there are when everything is together.", "Berapa banyak apabila semuanya digabungkan.", "The whole amount after counting all the parts.", "Jumlah penuh selepas semua bahagian dikira."),
  glossaryEntry(2, "Compare", "Banding", "Look at two things to see which has more or less.", "Lihat dua benda untuk tahu yang mana lebih atau kurang.", "Check how two numbers or groups are alike or different.", "Periksa bagaimana dua nombor atau kumpulan sama atau berbeza."),
  glossaryEntry(2, "Value", "Nilai", "How much a number is worth.", "Berapa banyak yang ditunjukkan oleh nombor.", "The number of things a numeral stands for.", "Bilangan benda yang diwakili oleh satu nombor."),
  glossaryEntry(2, "Amounts", "Bilangan", "How much or how many.", "Berapa banyak.", "The number of things in a group.", "Bilangan benda dalam satu kumpulan."),
  glossaryEntry(2, "Objects", "Objek", "Things you can count, like bananas.", "Benda yang boleh dikira, seperti pisang.", "Items shown in a counting group.", "Benda yang ditunjukkan dalam kumpulan kiraan."),
  glossaryEntry(2, "Order", "Turutan", "Which comes first, next, and last.", "Yang mana dahulu, seterusnya, dan terakhir.", "The way numbers or things are arranged.", "Cara nombor atau benda disusun."),
  glossaryEntry(2, "Remove", "Keluarkan", "Take one away.", "Ambil satu.", "Move something out of a group.", "Keluarkan sesuatu daripada kumpulan."),
  glossaryEntry(2, "Spread out", "Jarakkan", "Move things apart with space between them.", "Jarakkan benda supaya ada ruang di antaranya.", "The spaces change, but the count stays the same.", "Ruang berubah, tetapi bilangannya tetap sama."),

  glossaryEntry(3, "Together", "Bersama", "Things joined in one place or group.", "Benda yang digabungkan di satu tempat atau kumpulan.", "Put the parts into one group.", "Gabungkan bahagian menjadi satu kumpulan."),
  glossaryEntry(3, "Different", "Berbeza", "Not the same.", "Tidak sama.", "Two things do not match in some way.", "Dua benda tidak sepadan dalam sesuatu cara."),
  glossaryEntry(3, "Missing", "Hilang", "Something that should be there is not shown.", "Sesuatu yang patut ada tidak ditunjukkan.", "Find the number that fills the empty space.", "Cari nombor yang mengisi ruang kosong."),
  glossaryEntry(3, "Matches", "Padan", "Goes with it because they show the same thing.", "Sesuai dengannya kerana kedua-duanya menunjukkan benda yang sama.", "Two answers, numbers, or groups that fit together.", "Dua jawapan, nombor, atau kumpulan yang sepadan."),
  glossaryEntry(3, "Smaller", "Lebih kecil", "Less big than another number.", "Lebih kecil daripada nombor lain.", "A number with less than another number.", "Nombor yang kurang daripada nombor lain."),
  glossaryEntry(3, "Smallest", "Paling kecil", "The one with the least.", "Yang mempunyai paling sedikit.", "The lowest number in a group.", "Nombor paling rendah dalam kumpulan."),
  glossaryEntry(3, "Biggest", "Paling besar", "The one with the most.", "Yang mempunyai paling banyak.", "The highest number in a group.", "Nombor paling tinggi dalam kumpulan."),
  glossaryEntry(3, "Bigger", "Lebih besar", "More than another number.", "Lebih banyak daripada nombor lain.", "A number farther up the number line.", "Nombor yang lebih tinggi pada garis nombor."),
  glossaryEntry(3, "Plus", "Tambah", "Put more in.", "Masukkan lebih banyak.", "The + sign tells us to add.", "Tanda + menyuruh kita menambah."),
  glossaryEntry(3, "Minus", "Tolak", "Take some away.", "Ambil sebahagian.", "The - sign tells us to take away.", "Tanda - menyuruh kita mengambil."),
  glossaryEntry(3, "Number line", "Garis nombor", "A row of numbers in order, like a ruler.", "Barisan nombor mengikut turutan, seperti pembaris.", "Move right for bigger numbers and left for smaller numbers.", "Bergerak ke kanan untuk nombor lebih besar dan ke kiri untuk nombor lebih kecil."),
  glossaryEntry(3, "Count", "Kira", "Say one number for each thing.", "Sebut satu nombor untuk setiap benda.", "Count each thing once. The last number is the total.", "Kira setiap benda sekali. Nombor terakhir ialah jumlah."),
  glossaryEntry(3, "Group", "Kumpulan", "Things kept together.", "Benda yang dikumpulkan bersama.", "A set of things that can be counted.", "Sekumpulan benda yang boleh dikira."),
  glossaryEntry(3, "Empty", "Kosong", "There is nothing inside.", "Tiada apa-apa di dalam.", "An empty group has zero things.", "Kumpulan kosong mempunyai sifar benda."),
  glossaryEntry(3, "Whole", "Keseluruhan", "All the parts together.", "Semua bahagian digabungkan.", "The complete group, with nothing missing.", "Kumpulan lengkap tanpa bahagian yang hilang."),
  glossaryEntry(3, "Left", "Baki", "How many are still there after some are taken away.", "Berapa banyak yang masih ada selepas sebahagian diambil.", "Here, left means remaining, not the left direction.", "Di sini, baki bermaksud yang tinggal, bukan arah kiri."),
];

const recognitionPracticeQuestions: Question[] = [
  q("rec-tap-5", "numbers", { en: "Tap 5 bananas.", ms: "Tekan 5 pisang." }, [], 5, { kind: "number", value: 5 }, "tapObjects"),
  q("rec-audio-make-6", "numbers", { en: "Listen. Make the number.", ms: "Dengar. Bina nombor itu." }, [], 6, { kind: "audioNumber", value: 6 }, "tapObjects"),
  q("rec-audio-symbol-0", "numbers", { en: "What number did you hear?", ms: "Nombor apa yang kamu dengar?" }, [0, 1, 2, 3], 0, { kind: "audioNumber", value: 0 }),
  q("rec-audio-symbol-2", "numbers", { en: "What number did you hear?", ms: "Nombor apa yang kamu dengar?" }, [1, 2, 3, 4], 2, { kind: "audioNumber", value: 2 }),
  q("rec-audio-symbol-5", "numbers", { en: "What number did you hear?", ms: "Nombor apa yang kamu dengar?" }, [3, 4, 5, 6], 5, { kind: "audioNumber", value: 5 }),
  q("rec-audio-symbol-8", "numbers", { en: "What number did you hear?", ms: "Nombor apa yang kamu dengar?" }, [6, 7, 8, 9], 8, { kind: "audioNumber", value: 8 }),
  q("rec-symbol-word-1", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["zero", "one", "two", "three"], "one", { kind: "number", value: 1 }),
  q("rec-symbol-word-3", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["one", "two", "three", "four"], "three", { kind: "number", value: 3 }),
  q("rec-symbol-word-6", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["four", "five", "six", "seven"], "six", { kind: "number", value: 6 }),
  q("rec-symbol-word-9", "numbers", { en: "Which word matches this number?", ms: "Perkataan mana padan dengan nombor ini?" }, ["six", "seven", "eight", "nine"], "nine", { kind: "number", value: 9 }),
  q("rec-word-symbol-0", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [0, 1, 2, 3], 0, { kind: "word", value: 0 }),
  q("rec-word-symbol-4", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [2, 3, 4, 5], 4, { kind: "word", value: 4 }),
  q("rec-word-symbol-7", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [5, 6, 7, 8], 7, { kind: "word", value: 7 }),
  q("rec-word-symbol-9", "numbers", { en: "Which number matches this word?", ms: "Nombor mana padan dengan perkataan ini?" }, [6, 7, 8, 9], 9, { kind: "word", value: 9 }),
  q("rec-audio-word-2", "numbers", { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" }, ["zero", "one", "two", "three"], "two", { kind: "audioNumber", value: 2 }),
  q("rec-audio-word-5", "numbers", { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" }, ["three", "four", "five", "six"], "five", { kind: "audioNumber", value: 5 }),
  q("rec-audio-word-8", "numbers", { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" }, ["six", "seven", "eight", "nine"], "eight", { kind: "audioNumber", value: 8 }),
  q("rec-audio-word-9", "numbers", { en: "Which word did you hear?", ms: "Perkataan mana yang kamu dengar?" }, ["six", "seven", "eight", "nine"], "nine", { kind: "audioNumber", value: 9 }),
];

const valuePracticeQuestions: Question[] = [
  q("val-tap-0", "numbers", { en: "Make 0.", ms: "Bina 0." }, [], 0, { kind: "number", value: 0 }, "tapObjects"),
  q("val-tap-1", "numbers", { en: "Make 1.", ms: "Bina 1." }, [], 1, { kind: "number", value: 1 }, "tapObjects"),
  q("val-tap-2", "numbers", { en: "Make 2.", ms: "Bina 2." }, [], 2, { kind: "number", value: 2 }, "tapObjects"),
  q("val-tap-3", "numbers", { en: "Make 3.", ms: "Bina 3." }, [], 3, { kind: "number", value: 3 }, "tapObjects"),
  q("val-tap-4", "numbers", { en: "Make 4.", ms: "Bina 4." }, [], 4, { kind: "number", value: 4 }, "tapObjects"),
  q("val-tap-5", "numbers", { en: "Make 5.", ms: "Bina 5." }, [], 5, { kind: "number", value: 5 }, "tapObjects"),
  q("val-tap-6", "numbers", { en: "Make 6.", ms: "Bina 6." }, [], 6, { kind: "number", value: 6 }, "tapObjects"),
  q("val-tap-7", "numbers", { en: "Make 7.", ms: "Bina 7." }, [], 7, { kind: "number", value: 7 }, "tapObjects"),
  q("val-tap-8", "numbers", { en: "Make 8.", ms: "Bina 8." }, [], 8, { kind: "number", value: 8 }, "tapObjects"),
  q("val-tap-9", "numbers", { en: "Make 9.", ms: "Bina 9." }, [], 9, { kind: "number", value: 9 }, "tapObjects"),
  q("val-make-group-3", "numbers", { en: "Make a group of 3.", ms: "Bina kumpulan 3." }, [], 3, { kind: "groupMake", emoji: "🍌", count: 3 }, "makeGroup"),
  q("val-support-3", "numbers", { en: "Which number matches this group?", ms: "Nombor mana padan dengan kumpulan ini?" }, [2, 3, 4], 3, { kind: "numberWithGroup", value: 3, emoji: "🍌" }),
  q("val-support-6", "numbers", { en: "Which number matches this group?", ms: "Nombor mana padan dengan kumpulan ini?" }, [5, 6, 7], 6, { kind: "numberWithGroup", value: 6, emoji: "🍄" }),
  q("val-count-0", "numbers", { en: "The basket is empty. How many bananas?", ms: "Bakul kosong. Ada berapa pisang?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🍌", count: 0, container: "basket" }),
  q("val-count-1", "numbers", { en: "How many bananas are there?", ms: "Ada berapa pisang?" }, [0, 1, 2, 3], 1, { kind: "count", emoji: "🍌", count: 1 }),
  q("val-count-2", "numbers", { en: "How many bananas are there?", ms: "Ada berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "count", emoji: "🍌", count: 2 }),
  q("val-count-3", "numbers", { en: "How many bananas are there?", ms: "Ada berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "count", emoji: "🍌", count: 3 }),
  q("val-count-4", "numbers", { en: "How many leaves are there?", ms: "Ada berapa daun?" }, [2, 3, 4, 5], 4, { kind: "count", emoji: "🍃", count: 4 }),
  q("val-count-5", "numbers", { en: "How many mangoes are there?", ms: "Ada berapa mangga?" }, [3, 4, 5, 6], 5, { kind: "count", emoji: "🥭", count: 5 }),
  q("val-count-6", "numbers", { en: "How many rocks are there?", ms: "Ada berapa batu?" }, [4, 5, 6, 7], 6, { kind: "count", emoji: "🪨", count: 6 }),
  q("val-count-7", "numbers", { en: "How many flowers are there?", ms: "Ada berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "count", emoji: "🌸", count: 7 }),
  q("val-count-8", "numbers", { en: "How many coconuts are there?", ms: "Ada berapa kelapa?" }, [6, 7, 8, 9], 8, { kind: "count", emoji: "🥥", count: 8 }),
  q("val-count-9", "numbers", { en: "How many mushrooms are there?", ms: "Ada berapa cendawan?" }, [6, 7, 8, 9], 9, { kind: "count", emoji: "🍄", count: 9 }),
  q("val-group-4", "numbers", { en: "Which banana group shows 4?", ms: "Kumpulan pisang mana tunjuk 4?" }, [2, 4, 6], 4, { kind: "groupChoices", emoji: "🍌", groups: [2, 4, 6] }),
  q("val-group-7", "numbers", { en: "Which banana group shows 7?", ms: "Kumpulan pisang mana tunjuk 7?" }, [5, 7, 9], 7, { kind: "groupChoices", emoji: "🍌", groups: [5, 7, 9] }),
  q("val-group-number-5", "numbers", { en: "Which number matches this group?", ms: "Nombor mana padan dengan kumpulan ini?" }, [3, 4, 5, 6], 5, { kind: "count", emoji: "🥭", count: 5 }),
  q("val-same-3", "numbers", { en: "Are these the same number?", ms: "Adakah ini nombor yang sama?" }, ["Yes", "No"], "Yes", { kind: "sameValue", count: 3, emojis: ["🍌", "🍃"] }),
  q("val-layout-6", "numbers", { en: "Do they show the same number?", ms: "Adakah semua tunjuk nombor sama?" }, ["Yes", "No"], "Yes", { kind: "layoutValue", count: 6, emoji: "🍌" }),
  q("val-more-4-6", "numbers", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, ["Group A", "Group B"], "Group B", { kind: "compareGroups", a: 4, b: 6, emojiA: "🍃", emojiB: "🍌", ask: "more" }),
  q("val-fewer-2-5", "numbers", { en: "Which group has fewer?", ms: "Kumpulan mana lebih sedikit?" }, ["Group A", "Group B"], "Group A", { kind: "compareGroups", a: 2, b: 5, emojiA: "🪨", emojiB: "🥭", ask: "fewer" }),
];
const sequencingPracticeQuestions: Question[] = [
  q("seq-keypad-3", "numbers", { en: "Type the missing number.", ms: "Taip nombor yang hilang." }, [], 3, { kind: "sequence", nums: [0, 1, 2, "?", 4] }, "keypad"),
  q("seq-full-3", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [2, 3, 4, 5], 3, { kind: "sequence", nums: [0, 1, 2, "?", 4, 5, 6, 7, 8, 9] }),
  q("seq-full-6", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [4, 5, 6, 7], 6, { kind: "sequence", nums: [0, 1, 2, 3, 4, 5, "?", 7, 8, 9] }),
  q("seq-full-1", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [0, 1, 2, 3], 1, { kind: "sequence", nums: [0, "?", 2, 3, 4, 5, 6, 7, 8, 9] }),
  q("seq-full-8", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [6, 7, 8, 9], 8, { kind: "sequence", nums: [0, 1, 2, 3, 4, 5, 6, 7, "?", 9] }),
  q("seq-short-5", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [4, 5, 6, 7], 5, { kind: "sequence", nums: [2, 3, 4, "?", 6, 7, 8] }),
  q("seq-short-2", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [1, 2, 3, 4], 2, { kind: "sequence", nums: [0, 1, "?", 3, 4, 5, 6] }),
  q("seq-five-6", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [4, 5, "?", 7, 8] }),
  q("seq-five-7", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 7, { kind: "sequence", nums: [5, 6, "?", 8, 9] }),
  q("seq-four-6", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [5, "?", 7, 8] }),
  q("seq-skip-7", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 9], 7, { kind: "sequence", nums: [1, 3, 5, "?", 9] }),
  q("seq-asc-1", "numbers", { en: "Choose smallest to biggest.", ms: "Pilih kecil ke besar." }, ["1, 2, 4", "4, 2, 1", "2, 1, 4"], "1, 2, 4", { kind: "order", nums: [2, 4, 1], direction: "asc" }),
  q("seq-desc-1", "numbers", { en: "Choose biggest to smallest.", ms: "Pilih besar ke kecil." }, ["8, 5, 3", "3, 5, 8", "5, 8, 3"], "8, 5, 3", { kind: "order", nums: [3, 8, 5], direction: "desc" }),
  q("seq-more-3-6", "numbers", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, [3, 4, 5, 6], 6, { kind: "compare", a: 3, b: 6 }),
  q("seq-symbol-3-6", "numbers", { en: "3 __ 6. Choose the symbol.", ms: "3 __ 6. Pilih simbol." }, [">", "<"], "<", { kind: "symbol", a: 3, b: 6 }),
  q("seq-symbol-7-4", "numbers", { en: "7 __ 4. Choose the symbol.", ms: "7 __ 4. Pilih simbol." }, [">", "<"], ">", { kind: "symbol", a: 7, b: 4, showObjects: false }),
];

const numberPracticeQuestions: Question[] = [
  q("lp-n-word-1", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [1, 6, 7, 9], 1, { kind: "number", value: 1 }),
  q("lp-n-word-8", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [3, 5, 8, 0], 8, { kind: "number", value: 8 }),
  q("lp-n-count-3", "numbers", { en: "Count the bananas.", ms: "Kira pisang." }, [1, 2, 3, 4], 3, { kind: "count", emoji: "🍌", count: 3 }),
q("lp-n-count-0", "numbers", { en: "The basket is empty. How many bananas?", ms: "Bakul kosong. Ada berapa pisang?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🍌", count: 0, container: "basket" }),
  q("lp-n-after-4", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [3, 4, 5, 6], 5, { kind: "sequence", nums: [2, 3, 4, "?"] }),
  q("lp-n-before-7", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [5, "?", 7, 8] }),
  q("lp-n-missing-2", "numbers", { en: "What number is missing on the number line?", ms: "Nombor apa yang hilang pada garis nombor?" }, [1, 2, 3, 4], 2, { kind: "sequence", nums: [0, 1, "?", 3] }),
  q("lp-n-skip-even", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [2, 3, 4, 5], 4, { kind: "sequence", nums: [0, 2, "?", 6, 8] }),
  q("lp-n-skip-odd", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [3, 4, 5, 6], 5, { kind: "sequence", nums: [1, 3, "?", 7, 9] }),
  q("lp-n-smaller", "numbers", { en: "Which number is smaller: 9 or 2?", ms: "Nombor mana lebih kecil: 9 atau 2?" }, [1, 2, 7, 9], 2, { kind: "compare", a: 9, b: 2 }),
];

const numberQuestions: Question[] = [
  q("n-count-bananas-6", "numbers", { en: "Count the bananas.", ms: "Kira pisang." }, [4, 5, 6, 7], 6, { kind: "count", emoji: "🍌", count: 6 }),
  q("n-count-stars-4", "numbers", { en: "Count the stars.", ms: "Kira bintang." }, [2, 3, 4, 5], 4, { kind: "count", emoji: "⭐", count: 4 }),
  q("n-count-shells-9", "numbers", { en: "Count the shells.", ms: "Kira cangkerang." }, [6, 7, 8, 9], 9, { kind: "count", emoji: "🐚", count: 9 }),
  q("n-count-apples-2", "numbers", { en: "Count the apples.", ms: "Kira epal." }, [0, 1, 2, 3], 2, { kind: "count", emoji: "🍎", count: 2 }),
  q("n-count-empty", "numbers", { en: "There are no flowers. How many?", ms: "Tiada bunga. Berapa?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🌸", count: 0 }),
  q("n-word-0", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [0, 2, 4, 6], 0, { kind: "number", value: 0 }),
  q("n-word-3", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [3, 5, 7, 9], 3, { kind: "number", value: 3 }),
  q("n-word-5", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [2, 5, 6, 8], 5, { kind: "number", value: 5 }),
  q("n-word-7", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [1, 4, 7, 9], 7, { kind: "number", value: 7 }),
  q("n-word-9", "numbers", { en: "What number is this?", ms: "Ini nombor apa?" }, [0, 6, 8, 9], 9, { kind: "number", value: 9 }),
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
  q("n-greater-2-7", "numbers", { en: "Which number is greater: 2 or 7?", ms: "Nombor mana lebih besar: 2 atau 7?" }, [2, 4, 7, 9], 7, { kind: "compare", a: 2, b: 7 }),
  q("n-greater-6-8", "numbers", { en: "Which number is greater: 6 or 8?", ms: "Nombor mana lebih besar: 6 atau 8?" }, [4, 6, 8, 9], 8, { kind: "compare", a: 6, b: 8 }),
  q("n-smaller-6-1", "numbers", { en: "Which number is smaller: 6 or 1?", ms: "Nombor mana lebih kecil: 6 atau 1?" }, [1, 3, 6, 8], 1, { kind: "compare", a: 6, b: 1 }),
  q("n-smaller-4-0", "numbers", { en: "Which number is smaller: 4 or 0?", ms: "Nombor mana lebih kecil: 4 atau 0?" }, [0, 2, 4, 6], 0, { kind: "compare", a: 4, b: 0 }),
];

const operationQuestions: Question[] = [
  q("o-add-1-2", "operations", { en: "Chrys has 1 banana and finds 2 more. How many now?", ms: "Chrys ada 1 pisang dan jumpa 2 lagi. Jadi berapa?" }, [2, 3, 4, 5], 3, { kind: "add", a: 1, b: 2, emoji: "🍌" }),
  q("o-add-2-5", "operations", { en: "2 bananas join 5 more bananas. How many bananas?", ms: "2 pisang bergabung dengan 5 pisang lagi. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 2, b: 5, emoji: "🍌" }),
  q("o-add-3-4", "operations", { en: "3 flowers and 4 more flowers. How many flowers?", ms: "3 bunga dan 4 bunga lagi. Berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🌸" }),
  q("o-add-6-1", "operations", { en: "Chrys has 6 bananas and gets 1 more. How many bananas?", ms: "Chrys ada 6 pisang dan dapat 1 lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "🍌" }),
  q("o-add-8-1", "operations", { en: "8 shells and 1 more shell. How many shells?", ms: "8 cangkerang dan 1 lagi. Berapa cangkerang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "🐚" }),
  q("o-add-9-0", "operations", { en: "9 stars and 0 more stars. How many stars?", ms: "9 bintang dan 0 bintang lagi. Berapa bintang?" }, [0, 7, 8, 9], 9, { kind: "add", a: 9, b: 0, emoji: "⭐" }),
  q("o-add-4-2", "operations", { en: "4 bananas join 2 more bananas. How many bananas?", ms: "4 pisang bergabung dengan 2 pisang lagi. Berapa pisang?" }, [5, 6, 7, 8], 6, { kind: "add", a: 4, b: 2, emoji: "🍌" }),
  q("o-add-5-3", "operations", { en: "5 apples and 3 more apples. How many apples?", ms: "5 epal dan 3 epal lagi. Berapa epal?" }, [6, 7, 8, 9], 8, { kind: "add", a: 5, b: 3, emoji: "🍎" }),
  q("o-add-7-0", "operations", { en: "7 bananas and 0 more bananas. How many bananas?", ms: "7 pisang dan 0 pisang lagi. Berapa pisang?" }, [0, 6, 7, 8], 7, { kind: "add", a: 7, b: 0, emoji: "🍌" }),
  q("o-add-0-8", "operations", { en: "0 flowers and 8 more flowers. How many flowers?", ms: "0 bunga dan 8 bunga lagi. Berapa bunga?" }, [0, 7, 8, 9], 8, { kind: "add", a: 0, b: 8, emoji: "🌸" }),
  q("o-add-2-6", "operations", { en: "2 stars and 6 more stars. How many stars?", ms: "2 bintang dan 6 bintang lagi. Berapa bintang?" }, [6, 7, 8, 9], 8, { kind: "add", a: 2, b: 6, emoji: "⭐" }),
  q("o-add-4-4", "operations", { en: "4 shells and 4 more shells. How many shells?", ms: "4 cangkerang dan 4 cangkerang lagi. Berapa cangkerang?" }, [6, 7, 8, 9], 8, { kind: "add", a: 4, b: 4, emoji: "🐚" }),
  q("o-sub-8-2", "operations", { en: "Chrys has 8 bananas. He gives away 2 bananas. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia beri 2 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 6, { kind: "subtract", a: 8, b: 2, emoji: "🍌" }),
  q("o-sub-9-5", "operations", { en: "There are 9 shells. You take away 5 shells. How many shells are left?", ms: "Ada 9 cangkerang. Kamu ambil 5 cangkerang. Tinggal berapa cangkerang?" }, [3, 4, 5, 6], 4, { kind: "subtract", a: 9, b: 5, emoji: "🐚" }),
  q("o-sub-7-7", "operations", { en: "There are 7 stars. All 7 stars go away. How many stars are left?", ms: "Ada 7 bintang. Semua 7 bintang pergi. Tinggal berapa bintang?" }, [0, 1, 2, 3], 0, { kind: "subtract", a: 7, b: 7, emoji: "⭐" }),
  q("o-sub-6-1", "operations", { en: "There are 6 bananas. You take away 1 banana. How many bananas are left?", ms: "Ada 6 pisang. Kamu ambil 1 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 5, { kind: "subtract", a: 6, b: 1, emoji: "🍌" }),
  q("o-sub-5-3", "operations", { en: "There are 5 flowers. You take away 3 flowers. How many flowers are left?", ms: "Ada 5 bunga. Kamu ambil 3 bunga. Tinggal berapa bunga?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 5, b: 3, emoji: "🌸" }),
  q("o-sub-4-0", "operations", { en: "There are 4 apples. You take away 0 apples. How many apples are left?", ms: "Ada 4 epal. Kamu ambil 0 epal. Tinggal berapa epal?" }, [0, 3, 4, 5], 4, { kind: "subtract", a: 4, b: 0, emoji: "🍎" }),
  q("o-sub-9-8", "operations", { en: "There are 9 bananas. You take away 8 bananas. How many bananas are left?", ms: "Ada 9 pisang. Kamu ambil 8 pisang. Tinggal berapa pisang?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 9, b: 8, emoji: "🍌" }),
  q("o-sub-8-4", "operations", { en: "There are 8 shells. You take away 4 shells. How many shells are left?", ms: "Ada 8 cangkerang. Kamu ambil 4 cangkerang. Tinggal berapa cangkerang?" }, [2, 3, 4, 5], 4, { kind: "subtract", a: 8, b: 4, emoji: "🐚" }),
  q("o-sub-6-5", "operations", { en: "There are 6 stars. You take away 5 stars. How many stars are left?", ms: "Ada 6 bintang. Kamu ambil 5 bintang. Tinggal berapa bintang?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 6, b: 5, emoji: "⭐" }),
  q("o-sub-3-2", "operations", { en: "There are 3 bananas. You take away 2 bananas. How many bananas are left?", ms: "Ada 3 pisang. Kamu ambil 2 pisang. Tinggal berapa pisang?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 3, b: 2, emoji: "🍌" }),
  q("o-sub-9-0", "operations", { en: "There are 9 flowers. You take away 0 flowers. How many flowers are left?", ms: "Ada 9 bunga. Kamu ambil 0 bunga. Tinggal berapa bunga?" }, [0, 7, 8, 9], 9, { kind: "subtract", a: 9, b: 0, emoji: "🌸" }),
  q("o-sub-7-4", "operations", { en: "There are 7 apples. You take away 4 apples. How many apples are left?", ms: "Ada 7 epal. Kamu ambil 4 epal. Tinggal berapa epal?" }, [2, 3, 4, 5], 3, { kind: "subtract", a: 7, b: 4, emoji: "🍎" }),
  q("o-sub-5-5", "operations", { en: "There are 5 bananas. You take away all 5 bananas. How many bananas are left?", ms: "Ada 5 pisang. Kamu ambil semua 5 pisang. Tinggal berapa pisang?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "🍌" }),
];

const additionPracticeQuestions: Question[] = [
  q("l-add-build-2-3", "operations", { en: "Build the answer: 2 + 3.", ms: "Bina jawapan: 2 + 3." }, [], 5, { kind: "add", a: 2, b: 3, emoji: "🍌" }, "buildTotal"),
  q("l-add-3-4", "operations", { en: "Chrys eats 3 bananas and 4 more bananas. How many bananas?", ms: "Chrys makan 3 pisang dan 4 pisang lagi. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🍌" }),
  q("l-add-2-4", "operations", { en: "Chrys has 2 bananas and gets 4 more. How many bananas now?", ms: "Chrys ada 2 pisang dan dapat 4 lagi. Berapa pisang sekarang?" }, [5, 6, 7, 8], 6, { kind: "add", a: 2, b: 4, emoji: "🍌" }),
  q("l-add-4-5", "operations", { en: "Chrys has 4 bananas. Chrys finds 5 more. How many bananas?", ms: "Chrys ada 4 pisang. Chrys jumpa 5 lagi. Berapa pisang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 4, b: 5, emoji: "🍌" }),
  q("l-add-0-6", "operations", { en: "Chrys starts with 0 bananas and gets 6 bananas. How many bananas?", ms: "Chrys mula dengan 0 pisang dan dapat 6 pisang. Berapa pisang?" }, [0, 5, 6, 7], 6, { kind: "add", a: 0, b: 6, emoji: "🍌" }),
  q("l-add-6-1", "operations", { en: "Chrys eats 6 bananas and 1 more banana. How many bananas?", ms: "Chrys makan 6 pisang dan 1 pisang lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "🍌" }),
  q("l-add-8-1", "operations", { en: "Chrys has 8 bananas and gets 1 more. How many bananas now?", ms: "Chrys ada 8 pisang dan dapat 1 lagi. Berapa pisang sekarang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "🍌" }),
];

const subtractionPracticeQuestions: Question[] = [
  q("l-sub-takeaway-7-3", "operations", { en: "Show 7 - 3. Start with 7, take away 3.", ms: "Tunjuk 7 - 3. Mula dengan 7, buang 3." }, [], 4, { kind: "subtract", a: 7, b: 3, emoji: "🍌" }, "takeAway"),
  q("l-sub-8-5", "operations", { en: "Chrys has 8 bananas. He gives away 5 bananas. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia beri 5 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "subtract", a: 8, b: 5, emoji: "🍌" }),
  q("l-sub-6-2", "operations", { en: "Chrys has 6 bananas. He eats 2 bananas. How many bananas are left?", ms: "Chrys ada 6 pisang. Dia makan 2 pisang. Tinggal berapa pisang?" }, [2, 3, 4, 5], 4, { kind: "subtract", a: 6, b: 2, emoji: "🍌" }),
  q("l-sub-9-6", "operations", { en: "There are 9 bananas. You take away 6 bananas. How many bananas are left?", ms: "Ada 9 pisang. Kamu ambil 6 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "subtract", a: 9, b: 6, emoji: "🍌" }),
  q("l-sub-5-0", "operations", { en: "Chrys has 5 bananas. He gives away 0 bananas. How many bananas are left?", ms: "Chrys ada 5 pisang. Dia beri 0 pisang. Tinggal berapa pisang?" }, [0, 4, 5, 6], 5, { kind: "subtract", a: 5, b: 0, emoji: "🍌" }),
  q("l-sub-8-1", "operations", { en: "Chrys has 8 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "subtract", a: 8, b: 1, emoji: "🍌" }),
  q("l-sub-4-4", "operations", { en: "Chrys has 4 bananas. He gives away all 4 bananas. How many bananas are left?", ms: "Chrys ada 4 pisang. Dia beri semua 4 pisang. Tinggal berapa pisang?" }, [0, 1, 3, 4], 0, { kind: "subtract", a: 4, b: 4, emoji: "🍌" }),
];

const realQuestions: Question[] = [
  q("r-count-apples", "real", { en: "Count the apples.", ms: "Kira epal." }, [3, 4, 5, 6], 5, { kind: "count", emoji: "🍎", count: 5 }),
  q("r-count-pencils", "real", { en: "Count the pencils.", ms: "Kira pensel." }, [5, 6, 7, 8], 7, { kind: "count", emoji: "✏️", count: 7 }),
q("r-count-cups", "real", { en: "The tray is empty. How many cups are on it?", ms: "Dulang kosong. Ada berapa cawan di atasnya?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "🥤", count: 0, container: "tray" }),
q("r-add-oranges", "real", { en: "There are 3 oranges. Put 4 more oranges in the basket. How many oranges?", ms: "Ada 3 oren. Letak 4 oren lagi dalam bakul. Berapa oren?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🍊", container: "basket" }),
  q("r-add-books", "real", { en: "Chrys has 1 book and gets 6 more books. How many books?", ms: "Chrys ada 1 buku dan dapat 6 buku lagi. Berapa buku?" }, [5, 6, 7, 8], 7, { kind: "add", a: 1, b: 6, emoji: "📘" }),
  q("r-add-bananas", "real", { en: "Chrys has 2 bananas. His friend gives him 5 more. How many bananas?", ms: "Chrys ada 2 pisang. Kawannya beri 5 lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 2, b: 5, emoji: "🍌" }),
  q("r-add-flowers", "real", { en: "There are 4 flowers. Add 0 more flowers. How many flowers?", ms: "Ada 4 bunga. Tambah 0 bunga lagi. Berapa bunga?" }, [0, 3, 4, 5], 4, { kind: "add", a: 4, b: 0, emoji: "🌸" }),
  q("r-add-eggs", "real", { en: "5 eggs and 4 more eggs. How many eggs?", ms: "5 telur dan 4 telur lagi. Berapa telur?" }, [6, 7, 8, 9], 9, { kind: "add", a: 5, b: 4, emoji: "🥚" }),
  q("r-sub-cookies", "real", { en: "There are 8 cookies. Take away 3. How many are left?", ms: "Ada 8 biskut. Ambil 3. Tinggal berapa?" }, [4, 5, 6, 7], 5, { kind: "subtract", a: 8, b: 3, emoji: "🍪" }),
  q("r-sub-balloons", "real", { en: "There are 4 balloons. 0 balloons fly away. How many balloons are left?", ms: "Ada 4 belon. 0 belon terbang pergi. Tinggal berapa belon?" }, [0, 3, 4, 5], 4, { kind: "subtract", a: 4, b: 0, emoji: "🎈" }),
  q("r-sub-pencils", "real", { en: "There are 9 pencils. You give away 2 pencils. How many pencils are left?", ms: "Ada 9 pensel. Kamu beri 2 pensel. Tinggal berapa pensel?" }, [5, 6, 7, 8], 7, { kind: "subtract", a: 9, b: 2, emoji: "✏️" }),
  q("r-sub-apples", "real", { en: "There are 6 apples. You eat 4 apples. How many apples are left?", ms: "Ada 6 epal. Kamu makan 4 epal. Tinggal berapa epal?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 6, b: 4, emoji: "🍎" }),
  q("r-sub-cups", "real", { en: "There are 5 cups. You put away all 5 cups. How many cups are left?", ms: "Ada 5 cawan. Kamu simpan semua 5 cawan. Tinggal berapa cawan?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "🥤" }),
  q("r-count-toys", "real", { en: "Count the toy cars.", ms: "Kira kereta mainan." }, [4, 5, 6, 7], 6, { kind: "count", emoji: "🚗", count: 6 }),
  q("r-sub-bananas", "real", { en: "Chrys has 3 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 3 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 3, b: 1, emoji: "🍌" }),
];

const realPracticeQuestions: Question[] = [
  q("rp-count-pears", "real", { en: "Chrys sees 2 pears. How many pears?", ms: "Chrys nampak 2 buah pir. Berapa buah pir?" }, [0, 1, 2, 3], 2, { kind: "count", emoji: "\u{1F350}", count: 2 }),
  q("rp-add-watermelon", "real", { en: "Chrys has 1 watermelon slice and finds 1 more. How many slices?", ms: "Chrys ada 1 potong tembikai dan jumpa 1 lagi. Berapa potong tembikai?" }, [1, 2, 3, 4], 2, { kind: "add", a: 1, b: 1, emoji: "\u{1F349}" }),
  q("rp-sub-kiwi", "real", { en: "Chrys has 3 kiwi slices. He eats 1. How many slices are left?", ms: "Chrys ada 3 potong kiwi. Dia makan 1. Tinggal berapa potong kiwi?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 3, b: 1, emoji: "\u{1F95D}" }),
  q("rp-add-oranges", "real", { en: "Chrys has 2 oranges. He finds 3 more. How many oranges?", ms: "Chrys ada 2 oren. Dia jumpa 3 lagi. Berapa oren?" }, [3, 4, 5, 6], 5, { kind: "add", a: 2, b: 3, emoji: "\u{1F34A}" }),
  q("rp-sub-pineapples", "real", { en: "Chrys has 5 pineapples. He gives away 1. How many are left?", ms: "Chrys ada 5 nanas. Dia beri 1. Tinggal berapa nanas?" }, [3, 4, 5, 6], 4, { kind: "subtract", a: 5, b: 1, emoji: "\u{1F34D}" }),
  q("rp-add-apples", "real", { en: "2 apples are in the basket. Add 3 more. How many apples?", ms: "Ada 2 epal dalam bakul. Tambah 3 lagi. Berapa epal?" }, [4, 5, 6, 7], 5, { kind: "add", a: 2, b: 3, emoji: "\u{1F34E}", container: "basket" }),
  q("rp-choose-strawberries", "real", { en: "Chrys has 4 strawberries. He finds 2 more. Is this adding or taking away?", ms: "Chrys ada 4 strawberi. Dia jumpa 2 lagi. Ini tambah atau tolak?" }, ["Adding", "Taking away"], "Adding", { kind: "add", a: 4, b: 2, emoji: "\u{1F353}" }),
  q("rp-choose-lemons", "real", { en: "Chrys has 6 lemons. He gives away 2. Is this adding or taking away?", ms: "Chrys ada 6 lemon. Dia beri 2. Ini tambah atau tolak?" }, ["Adding", "Taking away"], "Taking away", { kind: "subtract", a: 6, b: 2, emoji: "\u{1F34B}" }),
];

const realTestQuestions: Question[] = [
q("rt-count-bananas-4", "real", { en: "Count the bananas in the picnic basket.", ms: "Kira pisang dalam bakul piknik." }, [2, 3, 4, 5], 4, { kind: "count", emoji: "🍌", count: 4, container: "basket" }),
  q("rt-count-apples-8", "real", { en: "Count the apples.", ms: "Kira epal." }, [6, 7, 8, 9], 8, { kind: "count", emoji: "🍎", count: 8 }),
q("rt-count-oranges-3", "real", { en: "Count the oranges in the basket.", ms: "Kira oren dalam bakul." }, [1, 2, 3, 4], 3, { kind: "count", emoji: "🍊", count: 3, container: "basket" }),
  q("rt-count-books-5", "real", { en: "Count the books.", ms: "Kira buku." }, [3, 4, 5, 6], 5, { kind: "count", emoji: "📘", count: 5 }),
q("rt-count-cups-1", "real", { en: "Count the cup on the tray.", ms: "Kira cawan di atas dulang." }, [0, 1, 2, 3], 1, { kind: "count", emoji: "🥤", count: 1, container: "tray" }),
  q("rt-count-flowers-9", "real", { en: "Count the flowers.", ms: "Kira bunga." }, [6, 7, 8, 9], 9, { kind: "count", emoji: "🌸", count: 9 }),
  q("rt-count-eggs-2", "real", { en: "Count the eggs.", ms: "Kira telur." }, [0, 1, 2, 3], 2, { kind: "count", emoji: "🥚", count: 2 }),
  q("rt-count-toys-7", "real", { en: "Count the toy cars.", ms: "Kira kereta mainan." }, [5, 6, 7, 8], 7, { kind: "count", emoji: "🚗", count: 7 }),
  q("rt-add-bananas-1-6", "real", { en: "Chrys has 1 banana. Chrys finds 6 more. How many bananas?", ms: "Chrys ada 1 pisang. Chrys jumpa 6 lagi. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 1, b: 6, emoji: "🍌" }),
  q("rt-add-apples-4-3", "real", { en: "4 apples and 3 more apples. How many apples?", ms: "4 epal dan 3 epal lagi. Berapa epal?" }, [5, 6, 7, 8], 7, { kind: "add", a: 4, b: 3, emoji: "🍎" }),
  q("rt-add-oranges-6-1", "real", { en: "There are 6 oranges. Add 1 more orange. How many oranges?", ms: "Ada 6 oren. Tambah 1 oren lagi. Berapa oren?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "🍊" }),
  q("rt-add-books-2-4", "real", { en: "Chrys has 2 books and finds 4 more books. How many books?", ms: "Chrys ada 2 buku dan jumpa 4 buku lagi. Berapa buku?" }, [4, 5, 6, 7], 6, { kind: "add", a: 2, b: 4, emoji: "📘" }),
  q("rt-add-cups-8-1", "real", { en: "There are 8 cups. Add 1 more cup. How many cups?", ms: "Ada 8 cawan. Tambah 1 cawan lagi. Berapa cawan?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "🥤" }),
  q("rt-add-flowers-5-2", "real", { en: "There are 5 flowers. Add 2 more flowers. How many flowers?", ms: "Ada 5 bunga. Tambah 2 bunga lagi. Berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "add", a: 5, b: 2, emoji: "🌸" }),
  q("rt-add-eggs-3-5", "real", { en: "3 eggs and 5 more eggs. How many eggs?", ms: "3 telur dan 5 telur lagi. Berapa telur?" }, [6, 7, 8, 9], 8, { kind: "add", a: 3, b: 5, emoji: "🥚" }),
  q("rt-add-toys-9-0", "real", { en: "There are 9 toy cars. Add 0 more toy cars. How many toy cars?", ms: "Ada 9 kereta mainan. Tambah 0 lagi. Berapa kereta mainan?" }, [0, 7, 8, 9], 9, { kind: "add", a: 9, b: 0, emoji: "🚗" }),
q("rt-add-bananas-0-5", "real", { en: "The basket has 0 bananas. Put in 5 bananas. How many bananas?", ms: "Bakul ada 0 pisang. Letak 5 pisang. Berapa pisang?" }, [0, 4, 5, 6], 5, { kind: "add", a: 0, b: 5, emoji: "🍌", container: "basket" }),
  q("rt-sub-bananas-9-3", "real", { en: "Chrys has 9 bananas. He eats 3 bananas. How many bananas are left?", ms: "Chrys ada 9 pisang. Dia makan 3 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 6, { kind: "subtract", a: 9, b: 3, emoji: "🍌" }),
  q("rt-sub-apples-8-6", "real", { en: "There are 8 apples. You eat 6 apples. How many apples are left?", ms: "Ada 8 epal. Kamu makan 6 epal. Tinggal berapa epal?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 8, b: 6, emoji: "🍎" }),
  q("rt-sub-oranges-7-1", "real", { en: "There are 7 oranges. You take away 1 orange. How many oranges are left?", ms: "Ada 7 oren. Kamu ambil 1 oren. Tinggal berapa oren?" }, [5, 6, 7, 8], 6, { kind: "subtract", a: 7, b: 1, emoji: "🍊" }),
  q("rt-sub-books-6-4", "real", { en: "There are 6 books. You put away 4 books. How many books are left?", ms: "Ada 6 buku. Kamu simpan 4 buku. Tinggal berapa buku?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 6, b: 4, emoji: "📘" }),
  q("rt-sub-cups-5-5", "real", { en: "There are 5 cups. You put away all 5 cups. How many cups are left?", ms: "Ada 5 cawan. Kamu simpan semua 5 cawan. Tinggal berapa cawan?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "🥤" }),
  q("rt-sub-flowers-4-2", "real", { en: "There are 4 flowers. You pick 2 flowers. How many flowers are left?", ms: "Ada 4 bunga. Kamu petik 2 bunga. Tinggal berapa bunga?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 4, b: 2, emoji: "🌸" }),
  q("rt-sub-eggs-3-0", "real", { en: "There are 3 eggs. You take away 0 eggs. How many eggs are left?", ms: "Ada 3 telur. Kamu ambil 0 telur. Tinggal berapa telur?" }, [0, 2, 3, 4], 3, { kind: "subtract", a: 3, b: 0, emoji: "🥚" }),
  q("rt-sub-toys-2-1", "real", { en: "There are 2 toy cars. You move 1 toy car away. How many toy cars are left?", ms: "Ada 2 kereta mainan. Kamu alihkan 1 kereta mainan. Tinggal berapa kereta mainan?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 2, b: 1, emoji: "🚗" }),
];

function q(
  id: string,
  area: Question["area"],
  text: Record<Lang, string>,
  options: Array<number | string>,
  answer: number | string,
  visual: Visual,
  inputMode: Question["inputMode"] = "choice",
): Question {
  return {
    id,
    area,
    text,
    options,
    answer,
    visual,
    inputMode,
    method: buildMethod(visual, answer),
  };
}

function buildMethod(visual: Visual, answer: number | string): Record<Lang, string[]> {
  if (visual.kind === "add") {
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
    return {
      en: [`${greater} is more.`, `${smaller} is less.`, `Answer: ${greater}.`],
      ms: [`${greater} lebih banyak.`, `${smaller} lebih sedikit.`, `Jawapan: ${greater}.`],
    };
  }
  if (visual.kind === "sequence") {
    const missingIndex = visual.nums.findIndex((n) => n === "?");
    const before = visual.nums[missingIndex - 1];
    const after = visual.nums[missingIndex + 1];
    const filledAnswer = Number(answer);
    const nums = visual.nums.map((n) => n === "?" ? filledAnswer : n);
    const numeric = nums.filter((n): n is number => typeof n === "number");
    const gaps = numeric.slice(1).map((n, i) => n - numeric[i]);
    const skipByTwo = gaps.some((gap) => Math.abs(gap) === 2);
    const beforeEn = typeof before === "number" ? `${answer} comes after ${before}.` : "Look at the blank.";
    const afterEn = typeof after === "number" ? `${answer} comes before ${after}.` : "Look at the blank.";
    const beforeMs = typeof before === "number" ? `${answer} selepas ${before}.` : "Lihat ruang kosong.";
    const afterMs = typeof after === "number" ? `${answer} sebelum ${after}.` : "Lihat ruang kosong.";
    return {
      en: skipByTwo
        ? ["Look at the jumps.", "It jumps by 2.", `So, ? is ${answer}.`]
        : ["Look at the blank.", beforeEn, afterEn, `So, ? is ${answer}.`],
      ms: skipByTwo
        ? ["Lihat lompatan nombor.", "Ia lompat 2.", `Jadi, ? ialah ${answer}.`]
        : ["Lihat ruang kosong.", beforeMs, afterMs, `Jadi, ? ialah ${answer}.`],
    };
  }
  if (visual.kind === "number") {
    const word = WORDS.en[visual.value];
    const wordMs = WORDS.ms[visual.value];
    return {
      en: typeof answer === "string"
        ? [`This is ${visual.value}.`, `The word is ${word}.`]
        : [`This is ${visual.value}.`, `Say ${word}.`],
      ms: typeof answer === "string"
        ? [`Ini ${visual.value}.`, `Perkataannya ${wordMs}.`]
        : [`Ini ${visual.value}.`, `Sebut ${wordMs}.`],
    };
  }
  if (visual.kind === "word") {
    const word = WORDS.en[visual.value];
    const wordMs = WORDS.ms[visual.value];
    return {
      en: [`The word is ${word}.`, `The number is ${visual.value}.`],
      ms: [`Perkataan ini ${wordMs}.`, `Nombornya ${visual.value}.`],
    };
  }
  if (visual.kind === "audioNumber") {
    const word = WORDS.en[visual.value];
    const wordMs = WORDS.ms[visual.value];
    return {
      en: typeof answer === "string"
        ? [`You heard ${word}.`, `The word is ${word}.`]
        : [`You heard ${word}.`, `The number is ${visual.value}.`],
      ms: typeof answer === "string"
        ? [`Kamu dengar ${wordMs}.`, `Perkataannya ${wordMs}.`]
        : [`Kamu dengar ${wordMs}.`, `Nombornya ${visual.value}.`],
    };
  }
  if (visual.kind === "numberWithGroup") {
    return {
      en: [`This is ${visual.value}.`, `Count ${visual.value} objects.`, `So, there are ${visual.value}.`],
      ms: [`Ini ${visual.value}.`, `Kira ${visual.value} objek.`, `Jadi, ada ${visual.value}.`],
    };
  }
  if (visual.kind === "sameValue") {
    return {
      en: [`Both groups have ${visual.count}.`, "Different objects.", "Same number."],
      ms: [`Kedua-dua kumpulan ada ${visual.count}.`, "Objek berbeza.", "Nombor sama."],
    };
  }
  if (visual.kind === "layoutValue") {
    return {
      en: [`Each group has ${visual.count}.`, "They look different.", `They are all ${visual.count}.`],
      ms: [`Setiap kumpulan ada ${visual.count}.`, "Rupa berbeza.", `Semua ialah ${visual.count}.`],
    };
  }
  if (visual.kind === "compareGroups") {
    const more = Math.max(visual.a, visual.b);
    const fewer = Math.min(visual.a, visual.b);
    return visual.ask === "more"
      ? {
        en: [`Group A has ${visual.a}.`, `Group B has ${visual.b}.`, `${fewer} is less. ${more} is more.`],
        ms: [`Kumpulan A ada ${visual.a}.`, `Kumpulan B ada ${visual.b}.`, `${more} lebih banyak daripada ${fewer}.`],
      }
      : {
        en: [`Group A has ${visual.a}.`, `Group B has ${visual.b}.`, `${fewer} is less. ${more} is more.`],
        ms: [`Kumpulan A ada ${visual.a}.`, `Kumpulan B ada ${visual.b}.`, `${fewer} lebih sedikit daripada ${more}.`],
      };
  }
  if (visual.kind === "groupChoices") {
    return {
      en: ["Count each group.", `Find the group with ${answer}.`],
      ms: ["Kira setiap kumpulan.", `Cari kumpulan dengan ${answer}.`],
    };
  }
  if (visual.kind === "groupObserve" || visual.kind === "groupMake") {
    const count = visual.count;
    return {
      en: ["Count the objects.", `This group has ${count}.`],
      ms: ["Kira objek.", `Kumpulan ini ada ${count}.`],
    };
  }
  if (visual.kind === "groupTwo") {
    return {
      en: [`Group 1 has ${visual.a}.`, `Group 2 has ${visual.b}.`, "Keep the groups apart."],
      ms: [`Kumpulan 1 ada ${visual.a}.`, `Kumpulan 2 ada ${visual.b}.`, "Asingkan kumpulan."],
    };
  }
  if (visual.kind === "groupCompare") {
    if (visual.ask === "same") {
      const same = visual.a === visual.b;
      return {
        en: same ? [`Both groups have ${visual.a}.`, "They are the same."] : [`One group has ${visual.a}.`, `One group has ${visual.b}.`, "They are different."],
        ms: same ? [`Kedua-dua kumpulan ada ${visual.a}.`, "Mereka sama."] : [`Satu kumpulan ada ${visual.a}.`, `Satu kumpulan ada ${visual.b}.`, "Mereka berbeza."],
      };
    }
    const more = visual.a > visual.b ? "Group A" : "Group B";
    const fewer = visual.a < visual.b ? "Group A" : "Group B";
    return visual.ask === "more"
      ? {
        en: [`Group A has ${visual.a}.`, `Group B has ${visual.b}.`, `${more} has more.`],
        ms: [`Kumpulan A ada ${visual.a}.`, `Kumpulan B ada ${visual.b}.`, `${more} lebih banyak.`],
      }
      : {
        en: [`Group A has ${visual.a}.`, `Group B has ${visual.b}.`, `${fewer} has fewer.`],
        ms: [`Kumpulan A ada ${visual.a}.`, `Kumpulan B ada ${visual.b}.`, `${fewer} lebih sedikit.`],
      };
  }
  if (visual.kind === "groupCombine") {
    const total = visual.a + visual.b;
    return {
      en: [`Group 1 has ${visual.a}.`, `Group 2 has ${visual.b}.`, "Put them together.", `${visual.a} + ${visual.b} = ${total}.`],
      ms: [`Kumpulan 1 ada ${visual.a}.`, `Kumpulan 2 ada ${visual.b}.`, "Gabungkan.", `${visual.a} + ${visual.b} = ${total}.`],
    };
  }
  if (visual.kind === "order") {
    return visual.direction === "asc"
      ? {
        en: ["Ascending is small to big.", "Start with the smallest.", `Answer: ${answer}.`],
        ms: ["Menaik bermaksud kecil ke besar.", "Letak nombor paling kecil dahulu.", `Jawapan: ${answer}.`],
      }
      : {
        en: ["Descending is big to small.", "Start with the biggest.", `Answer: ${answer}.`],
        ms: ["Menurun bermaksud besar ke kecil.", "Letak nombor paling besar dahulu.", `Jawapan: ${answer}.`],
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
  return {
    en: ["Count the objects one by one.", `The last number you say is ${visual.count}.`, `Answer: ${answer}.`],
    ms: ["Kira objek satu demi satu.", `Nombor terakhir yang disebut ialah ${visual.count}.`, `Jawapan: ${answer}.`],
  };
}

function countForwardSteps(start: number, amount: number) {
  return Array.from({ length: amount }, (_, i) => start + i + 1).join(", ");
}

function objectName(emoji: string | undefined, count: number, lang: Lang) {
  const names: Record<string, { en: [string, string]; ms: string }> = {
    "🍌": { en: ["banana", "bananas"], ms: "pisang" },
    "🍎": { en: ["apple", "apples"], ms: "epal" },
    "🍊": { en: ["orange", "oranges"], ms: "oren" },
    "🥭": { en: ["mango", "mangoes"], ms: "mangga" },
    "🥥": { en: ["coconut", "coconuts"], ms: "kelapa" },
    "🍃": { en: ["leaf", "leaves"], ms: "daun" },
    "🌸": { en: ["flower", "flowers"], ms: "bunga" },
    "🍄": { en: ["mushroom", "mushrooms"], ms: "cendawan" },
    "🪨": { en: ["rock", "rocks"], ms: "batu" },
    "🐦": { en: ["bird", "birds"], ms: "burung" },
    "🍪": { en: ["cookie", "cookies"], ms: "biskut" },
    "📘": { en: ["book", "books"], ms: "buku" },
    "🎈": { en: ["balloon", "balloons"], ms: "belon" },
    "✏️": { en: ["pencil", "pencils"], ms: "pensel" },
    "🥤": { en: ["cup", "cups"], ms: "cawan" },
    "🥚": { en: ["egg", "eggs"], ms: "telur" },
    "🚗": { en: ["toy car", "toy cars"], ms: "kereta mainan" },
  };
  const fallback = { en: ["object", "objects"] as [string, string], ms: "objek" };
  const name = names[emoji ?? ""] ?? fallback;
  return lang === "ms" ? name.ms : count === 1 ? name.en[0] : name.en[1];
}

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

function getReducedMotionPreference() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadState(): { player: Player | null; lang: Lang; soundEnabled: boolean } {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { player: parsed.player ?? null, lang: parsed.lang === "ms" ? "ms" : "en", soundEnabled: parsed.soundEnabled !== false };
  } catch {
    return { player: null, lang: "en", soundEnabled: true };
  }
}

function saveState(player: Player | null, lang: Lang, soundEnabled: boolean) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ player, lang, soundEnabled }));
}

function App() {
  const initial = useMemo(() => loadState(), []);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [lang, setLang] = useState<Lang>(initial.lang);
  const [player, setPlayer] = useState<Player | null>(initial.player);
  const [screen, setScreen] = useState<Screen>(initial.player ? "menu" : "home");
  const [soundEnabled, setSoundEnabled] = useState(initial.soundEnabled);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [lastScore, setLastScore] = useState<{ correct: number; total: number; mastered: boolean } | null>(null);

  useEffect(() => saveState(player, lang, soundEnabled), [player, lang, soundEnabled]);
  useEffect(() => setGlobalAudioMuted(!soundEnabled), [soundEnabled]);
  useEffect(() => preloadNumberAudioFiles(), []);

  const t = UI[lang];
  const go = (next: Screen) => {
    setLastScore(null);
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

  const awardStar = (key: string, amount = 1) => {
    setPlayer((current) => {
      if (!current) return current;
      const old = current.progress[key] ?? 0;
      const gained = Math.max(0, amount - old);
      return { ...current, stars: current.stars + gained, progress: { ...current.progress, [key]: Math.max(old, amount) } };
    });
  };

  return (
    <AudioEnabledContext.Provider value={soundEnabled}>
      <div
        className="page-bg min-h-[100dvh] text-slate-800 font-sans overflow-x-hidden"
        style={APP_BACKGROUND_STYLE}
        onPointerDownCapture={markAudioInteraction}
        onKeyDownCapture={markAudioInteraction}
      >
      <Decor />
      <div className="jungle-leaves relative z-10 min-h-[100dvh] mx-auto flex w-full max-w-6xl flex-col px-4 py-4 md:px-8">
        <Header
          lang={lang}
          onToggleLang={() => setLang((current) => (current === "en" ? "ms" : "en"))}
          title={screen === "home" ? "" : t.title}
          stars={player?.stars ?? 0}
          t={t}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((current) => !current)}
          onOpenGlossary={() => setGlossaryOpen(true)}
          onBack={screen === "home" ? undefined : () => go(screen.startsWith("test") && screen !== "testMenu" ? "testMenu" : screen === "menu" ? "home" : "menu")}
        />
        <GlossaryDialog lang={lang} open={glossaryOpen} onOpenChange={setGlossaryOpen} />

        {screen === "home" && (
          <HomeScreen lang={lang} t={t} player={player} setPlayer={setPlayer} go={go} />
        )}
        {screen === "menu" && player && (
          <MenuScreen lang={lang} t={t} player={player} go={go} />
        )}
        {screen === "learnRecognize" && (
          <RecognizeNumbersLesson lang={lang} t={t} onDone={() => { awardStar("learnRecognize"); go("menu"); }} />
        )}
        {screen === "learnValues" && (
          <NumberValuesLesson lang={lang} t={t} onDone={() => { awardStar("learnValues"); go("menu"); }} />
        )}
        {screen === "learnSequencing" && (
          <SequencingLesson lang={lang} t={t} onDone={() => { awardStar("learnSequencing"); go("menu"); }} />
        )}
        {screen === "groupingMode" && (
          <GroupingMode lang={lang} t={t} onDone={() => { awardStar("groupingMode"); go("menu"); }} />
        )}
        {screen === "learnAddition" && (
          <AdditionOnlyLesson lang={lang} t={t} onDone={() => { awardStar("learnAddition"); go("menu"); }} />
        )}
        {screen === "learnSubtraction" && (
          <SubtractionOnlyLesson lang={lang} t={t} onDone={() => { awardStar("learnSubtraction"); go("menu"); }} />
        )}
        {screen === "learnReal" && (
          <RealWorldLesson lang={lang} t={t} onDone={() => { awardStar("learnReal"); go("menu"); }} />
        )}
        {screen === "testMenu" && (
          <TestMenu t={t} go={go} />
        )}
        {screen === "testNumbers" && (
          <Quiz lang={lang} t={t} title={t.learnNumbers} questions={numberQuestions} chunkSize={6} onFinish={(correct, total) => finishTest("testNumbers", correct, total)} />
        )}
        {screen === "testOperations" && (
          <Quiz lang={lang} t={t} title={t.learnOperations} questions={operationQuestions} chunkSize={6} onFinish={(correct, total) => finishTest("testOperations", correct, total)} />
        )}
        {screen === "testReal" && (
          <Quiz lang={lang} t={t} title={t.learnReal} questions={realTestQuestions} chunkSize={6} onFinish={(correct, total) => finishTest("testReal", correct, total)} />
        )}

        {lastScore && screen === "testMenu" && (
          <div className="mx-auto mt-4 w-full max-w-xl rounded-3xl border-2 border-white/80 bg-white/90 p-4 text-center shadow-[0_6px_0_rgba(0,0,0,.14)]">
            <p className="text-xl font-black text-emerald-800">{lang === "en" ? "You finished the test. Nice work!" : "Kamu sudah habis ujian. Bagus!"}</p>
            <p className="mt-1 text-lg font-black text-blue-900">{t.score}: {lastScore.correct}/{lastScore.total}</p>
            <p className="text-sm font-bold text-slate-500">
              {lastScore.mastered
                ? (lang === "en" ? "You did it! You earned a star." : "Kamu berjaya! Kamu dapat bintang.")
                : (lang === "en" ? "You completed it. Keep practicing with Chrys." : "Kamu sudah lengkapkan. Terus berlatih dengan Chrys.")}
            </p>
          </div>
        )}
      </div>
      </div>
    </AudioEnabledContext.Provider>
  );
}

function Header({ lang, onToggleLang, title, stars, t, soundEnabled, onToggleSound, onOpenGlossary, onBack }: {
  lang: Lang;
  onToggleLang: () => void;
  title: string;
  stars: number;
  t: UIStrings;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenGlossary: () => void;
  onBack?: () => void;
}) {
  return (
    <header className="soft-panel mb-4 flex items-center justify-between gap-3 rounded-[1.75rem] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button onClick={onBack} aria-label={t.back} className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-sky-100 bg-white text-blue-800 shadow-[0_5px_0_rgba(14,116,144,.18)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 active:translate-y-1">
            <BackArrowIcon />
          </button>
        )}
        <h1 className="hidden truncate text-xl font-black leading-tight text-blue-950 sm:block md:text-2xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? (lang === "en" ? "Sound is on" : "Bunyi dibuka") : (lang === "en" ? "Sound is off" : "Bunyi ditutup")}
          className={`flex items-center gap-1 rounded-2xl border-2 px-3 py-2 text-sm font-black shadow-[0_4px_0_rgba(0,0,0,.12)] ${
            soundEnabled ? "border-blue-200 bg-white/90 text-blue-800" : "border-slate-200 bg-slate-100 text-slate-500"
          }`}
        >
          <SpeakerIcon />
          <span>{soundEnabled ? (lang === "en" ? "Sound" : "Bunyi") : (lang === "en" ? "Muted" : "Senyap")}</span>
        </button>
        <button
          type="button"
          onClick={onOpenGlossary}
          aria-label={lang === "en" ? "Open glossary" : "Buka glosari"}
          title={lang === "en" ? "Glossary" : "Glosari"}
          className="flex items-center gap-1 rounded-2xl border-2 border-emerald-200 bg-white/90 px-3 py-2 text-sm font-black text-emerald-800 shadow-[0_4px_0_rgba(0,0,0,.12)]"
        >
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <span className="hidden md:inline">{lang === "en" ? "Glossary" : "Glosari"}</span>
        </button>
        <button onClick={onToggleLang} className="rounded-2xl border-2 border-white/80 bg-white/90 px-3 py-2 text-sm font-black text-blue-800 shadow-[0_4px_0_rgba(0,0,0,.12)]">
          {lang === "en" ? "BM" : "EN"}
        </button>
        <div className="flex items-center gap-2 rounded-2xl border-2 border-yellow-300 bg-white px-3 py-2 font-black text-yellow-700 shadow-[0_4px_0_rgba(0,0,0,.14)]" aria-label={`${stars} stars`}>
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
    ? { 1: "New math words", 2: "Useful math words", 3: "Everyday math words" }
    : { 1: "Perkataan matematik baharu", 2: "Perkataan matematik berguna", 3: "Perkataan matematik harian" };

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
              {lang === "en" ? "Child-friendly meanings for math words." : "Maksud perkataan matematik yang mudah untuk kanak-kanak."}
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
            {([1, 2, 3] as const).map((tier) => {
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
                        <button
                          type="button"
                          onClick={() => speakText(`${entry.term[lang]}. ${entry.child[lang]} ${entry.note[lang]}`, lang)}
                          aria-label={lang === "en" ? `Hear ${entry.term.en}` : `Dengar ${entry.term.ms}`}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.14)] active:translate-y-1"
                        >
                          <SpeakerIcon />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
            {filteredEntries.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-lg font-black text-slate-500">
                {lang === "en" ? "No matching word yet." : "Tiada perkataan yang sepadan."}
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
    go("menu");
  };
  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-6 py-4 md:grid-cols-[1fr_1.1fr]">
      <div className="flex justify-center">
        <img src={chrysExcited} alt="Chrys the monkey" className="h-72 w-72 object-contain drop-shadow-2xl md:h-96 md:w-96" />
      </div>
      <section className="lesson-panel rounded-[2rem] p-5 text-center md:p-8">
        <div className="mx-auto mb-3 flex max-w-sm items-center justify-center gap-3">
          <img src={chrysHappy} alt="Chrys the monkey" className="h-20 w-20 object-contain" />
          <div className="text-left">
            <h2 className="text-4xl font-black leading-none text-blue-900 md:text-5xl">{t.title}</h2>
            <p className="mt-2 text-base font-bold text-slate-500">{t.subtitle}</p>
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-4 rounded-3xl border-2 border-emerald-100 bg-emerald-50/70 px-4 py-2">
          <img src={alyseGuide} alt="Alyse" className="h-16 w-16 object-contain" />
          <img src={chrysRestingWithAlyse} alt="Chrys resting with Alyse" className="h-16 w-36 object-contain" />
        </div>
        <label className="mx-auto mt-6 block max-w-sm text-left">
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

function MenuScreen({ lang, t, player, go }: { lang: Lang; t: UIStrings; player: Player; go: (screen: Screen) => void }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 pb-8">
      <section className="flex flex-col items-center text-center">
        <img src={chrysHappy} alt="Chrys" className="h-36 w-36 object-contain drop-shadow-xl" />
        <h2 className="text-3xl font-black text-blue-950">Hi, {player.name}!</h2>
        <p className="text-lg font-bold text-blue-900/70">{t.menuTitle}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <MenuCard title={t.recognizeNumbers} subtitle="See, spell, hear, trace" icon="🔢" color="sky" onClick={() => go("learnRecognize")} />
        <MenuCard title={t.numberValues} subtitle={lang === "en" ? "Numbers show how many" : "Nombor tunjuk berapa banyak"} icon="🍌" color="emerald" onClick={() => go("learnValues")} />
        <MenuCard title={t.sequencing} subtitle={lang === "en" ? "Numbers in the right order" : "Nombor dalam turutan yang betul"} icon="< >" color="sky" onClick={() => go("learnSequencing")} />
        <MenuCard title={t.groupingMode} subtitle={t.groupingModeShort} icon="🧺" color="amber" onClick={() => go("groupingMode")} />
        <MenuCard title={t.addition} subtitle="Adding more" icon="➕" color="emerald" onClick={() => go("learnAddition")} />
        <MenuCard title={t.subtraction} subtitle="Taking away" icon="➖" color="pink" onClick={() => go("learnSubtraction")} />
        <MenuCard title={t.learnReal} subtitle="Counting objects in simple stories" icon="🍎" color="pink" onClick={() => go("learnReal")} />
        <MenuCard title={t.testMode} subtitle={t.testHelp} icon="⭐" color="amber" onClick={() => go("testMenu")} />
      </div>
    </main>
  );
}
function MenuCard({ title, subtitle, icon, color, onClick }: { title: string; subtitle: string; icon: string; color: "sky" | "emerald" | "pink" | "amber"; onClick: () => void }) {
  const colors = {
    sky: "border-sky-400 shadow-sky-700/35",
    emerald: "border-emerald-400 shadow-emerald-700/35",
    pink: "border-pink-300 shadow-pink-700/30",
    amber: "border-amber-400 shadow-amber-700/35",
  };
  return (
    <button onClick={onClick} className={`menu-card min-h-48 rounded-[2rem] border-4 p-6 text-left transition active:translate-y-1 md:p-7 ${colors[color]}`}>
      <span className="icon-badge relative z-10 mb-5 grid h-20 w-20 place-items-center rounded-[1.6rem] text-4xl font-black text-blue-950">
        <SpriteIcon value={icon} className="h-14 w-14" />
      </span>
      <h3 className="relative z-10 text-2xl font-black leading-tight text-blue-950 md:text-3xl">{title}</h3>
      <p className="relative z-10 mt-3 text-base font-black leading-snug text-slate-500">{subtitle}</p>
    </button>
  );
}

function skipPracticeLabel(lang: Lang) {
  return lang === "en" ? "Skip to practice questions" : "Langkau ke soalan latihan";
}

function skipNextNumberLabel(lang: Lang) {
  return lang === "en" ? "Skip to next number" : "Langkau ke nombor seterusnya";
}

function backToLearningLabel(lang: Lang) {
  return lang === "en" ? "Back to learning mode" : "Kembali ke mod pembelajaran";
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
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell
        lang={lang}
        title={`${t.learnNumbers}: ${number}`}
        helper={lang === "en" ? "Chrys teaches each number through seeing, hearing, counting, number order, tracing, and drawing." : "Chrys ajar setiap nombor dengan lihat, dengar, kira, susun, surih, dan lukis."}
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
            <CharacterTalk lang={lang} text={number === 0 ? (lang === "en" ? "Zero means nothing. The basket is empty." : "Sifar bermaksud tiada apa-apa. Bakul kosong.") : (lang === "en" ? `Count ${number} bananas slowly.` : `Kira ${number} pisang perlahan-lahan.`)} />
            <ObjectGroup count={number} emoji="🍌" numbered />
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
            <CharacterTalk lang={lang} text={lang === "en" ? "Skip counting means we jump by the same size. Here we jump by 2." : "Kira langkau bermaksud kita lompat dengan saiz yang sama. Di sini kita lompat 2."} />
            <SkipCountingPanel marked={number} lang={lang} />
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-4 md:grid-cols-2">
            <TracePad value={number} t={t} lang={lang} onTraced={next} />
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
            <button onClick={next} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">
              {number === 9 && step === 4 ? t.done : t.next}
            </button>
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

  const next = () => {
    if (step < 4) setStep((s) => s + 1);
    else if (number < 9) {
      setNumber((n) => n + 1);
      setStep(0);
    } else setPractice(true);
  };

  const previous = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const skipNextNumber = () => {
    if (number < 9) {
      setNumber((n) => n + 1);
      setStep(0);
    } else {
      setPractice(true);
    }
  };

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.recognizeNumbers}: ${t.practice}`} questions={recognitionPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell lang={lang} title={t.recognizeNumbers} helper={lang === "en" ? "See it. Hear it. Spell it. Trace it. Write it." : "Lihat. Dengar. Eja. Surih. Tulis."}>
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
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <CharacterTalk lang={lang} text={lang === "en" ? `This word says ${WORDS.en[number]}.` : `Perkataan ini ${WORDS.ms[number]}.`} />
            <SpellWordCard value={number} lang={lang} />
          </div>
        )}
        {step === 3 && <TracePad value={number} t={t} lang={lang} onTraced={next} />}
        {step === 4 && <WriteNumberPad value={number} t={t} lang={lang} />}
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button disabled={step === 0} onClick={previous} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            <SecondaryLessonButton label={number < 9 ? skipNextNumberLabel(lang) : skipPracticeLabel(lang)} onClick={skipNextNumber} />
            <button onClick={next} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">{number === 9 && step === 4 ? t.practice : t.next}</button>
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
  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const examples = NUMBERS.map((n) => ({
    n,
    emoji: "🍌",
    text: n === 0
      ? (lang === "en" ? "0 is nothing. The basket is empty." : "0 ialah kosong. Bakul tiada pisang.")
      : (lang === "en" ? `This is ${n} bananas.` : `Ini ${n} pisang.`),
  }));
  const current = examples[step];
  const valueEmojis = VALUE_EMOJIS;
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
  const currentEmoji = valueEmojis[currentNumber] ?? "🍌";
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
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <CharacterTalk lang={lang} text={lessonText} />
          <div className="rounded-[2rem] border-4 border-white bg-white p-5 text-center shadow-[0_7px_0_rgba(0,0,0,.12)]">
            {inConcept ? concept.visual : <NumberValueStepVisual n={currentNumber} emoji={currentEmoji} phase={phase} lang={lang} />}
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button disabled={step === 0 && phase === 0} onClick={previous} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
            <button onClick={next} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">{step < examples.length + conceptSlides.length - 1 || (!inConcept && phase < maxPhase) ? t.next : t.practice}</button>
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowSkipOptions((shown) => !shown)}
              className="rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-black text-slate-500 shadow-sm"
            >
              {showSkipOptions
                ? (lang === "en" ? "Hide choices" : "Sembunyi pilihan")
                : (lang === "en" ? "More choices" : "Pilihan lain")}
            </button>
          </div>
          {showSkipOptions && (
            <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-2">
              <button onClick={() => setPractice(true)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">
                {skipPracticeLabel(lang)}
              </button>
              <button onClick={skipNextNumber} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">
                {!inConcept && currentNumber < 9 ? skipNextNumberLabel(lang) : skipPracticeLabel(lang)}
              </button>
            </div>
          )}
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
        : "0 bermaksud tiada.\nJadi, ada 0 pisang.";
    }
    if (phase === 0) return `Ini ${n}.`;
    if (phase === 1) return `${n} bermaksud ${n} objek.`;
    if (phase === 2) return `Kira setiap objek. Nombor terakhir ialah ${n}.`;
    if (phase === 3) return `Objek berbeza. Masih ${n}.`;
    return `Susunan berbeza. Masih ${n}.`;
  }
  if (n === 0) {
    return phase === 0
      ? "Look at the basket.\nThere are no bananas."
      : "0 means none.\nSo, there are 0 bananas.";
  }
  if (phase === 0) return `This is ${n}.`;
  if (phase === 1) return `${n} means ${n} things.`;
  if (phase === 2) return `Count each object. The last number is ${n}.`;
  if (phase === 3) return `Different objects. Still ${n}.`;
  return `Different arrangement. Still ${n}.`;
}

function getNumberValueMaxPhase(n: number) {
  if (n === 0) return 1;
  if (n === 1) return 3;
  return 4;
}

function NumberValueStepVisual({ n, emoji, phase, lang }: { n: number; emoji: string; phase: number; lang: Lang }) {
  const [counting, setCounting] = useState(false);
  const alternateEmoji = getAlternateValueEmoji(emoji);

  useEffect(() => {
    setCounting(false);
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
    return (
      <div className="space-y-4">
        <NumberTile value={n} lang={lang} showWord={false} />
        <ObjectGroup count={n} emoji={emoji} />
      </div>
    );
  }
  if (phase === 2) {
    const objectLabel = valueObjectLabel(n, emoji, lang);
    const totalText = lang === "en"
      ? `So, there ${n === 1 ? "is" : "are"} ${objectLabel}.`
      : `Jadi, ada ${objectLabel}.`;
    return (
      <div className="space-y-3">
        <button
          onClick={() => setCounting(true)}
          className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1"
        >
          {lang === "en" ? "Tap to count" : "Tekan untuk kira"}
        </button>
        {counting
          ? <CountedObjectRow key={`${n}-${emoji}-count-on`} count={n} emoji={emoji} showCount speakCount lang={lang} intervalMs={650} />
          : <ObjectGroup count={n} emoji={emoji} />}
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xl font-black text-emerald-900">
          {totalText}
        </p>
      </div>
    );
  }
  if (phase === 3) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledValueGroup label={valueObjectLabel(n, emoji, lang)} count={n} emoji={emoji} counted />
          <LabeledValueGroup label={valueObjectLabel(n, alternateEmoji, lang)} count={n} emoji={alternateEmoji} counted />
        </div>
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xl font-black text-emerald-900">
          {lang === "en" ? "Different things. Same number." : "Objek berbeza. Nombor sama."}
        </p>
      </div>
    );
  }
  if (phase === 4) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueLayoutCard label={lang === "en" ? "Row" : "Baris"} count={n} emoji={emoji} layout="row" />
          <ValueLayoutCard label={lang === "en" ? "Groups" : "Kumpulan"} count={n} emoji={emoji} layout="groups" />
          <ValueLayoutCard label={lang === "en" ? "Spread out" : "Bersepah"} count={n} emoji={emoji} layout="spread" />
        </div>
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xl font-black text-emerald-900">
          {lang === "en" ? `They look different. They are all ${n}.` : `Rupa berbeza. Semua ialah ${n}.`}
        </p>
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

function getAlternateValueEmoji(emoji: string) {
  const symbol = cleanDisplayText(emoji);
  if (symbol === "🍃") return "🍌";
  if (symbol === "🥥") return "📘";
  if (symbol === "🍄") return "🍌";
  if (symbol === "📘") return "🌸";
  if (symbol === "🚗") return "🍌";
  return "🍃";
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
        {lang === "en" ? "0 means none." : "0 bermaksud tiada."}
      </p>
    </div>
  );
}

function LabeledValueGroup({ label, count, emoji, counted }: { label: string; count: number; emoji: string; counted: boolean }) {
  return (
    <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4 text-center">
      {counted ? <CountedObjectRow count={count} emoji={emoji} showCount compact intervalMs={500} /> : <ObjectGroup count={count} emoji={emoji} />}
      <p className="mt-3 text-xl font-black text-emerald-950">{label}</p>
    </div>
  );
}

function ValueLayoutCard({ label, count, emoji, layout }: { label: string; count: number; emoji: string; layout: "row" | "groups" | "spread" }) {
  const items = Array.from({ length: count }, (_, i) => i);
  const groupA = Math.ceil(count / 2);
  const groupB = count - groupA;

  return (
    <div className="rounded-3xl border-2 border-yellow-100 bg-yellow-50 p-4 text-center">
      <p className="mb-3 text-lg font-black text-yellow-900">{label}</p>
      <div className="rounded-3xl bg-white p-3">
        {layout === "groups" ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <MiniObjectSet count={groupA} emoji={emoji} />
            <div className="h-24 w-1 rounded-full bg-yellow-200" aria-hidden="true" />
            <MiniObjectSet count={groupB} emoji={emoji} />
          </div>
        ) : (
          <div className={layout === "row" ? "flex min-h-28 flex-nowrap items-center justify-center gap-2 overflow-x-auto" : "relative mx-auto h-32 max-w-64"}>
            {items.map((i) => (
              <span
                key={i}
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-3xl shadow-inner ${layout === "spread" ? "absolute" : "shrink-0"}`}
                style={layout === "spread" ? spreadObjectStyle(i, count) : undefined}
              >
                <SpriteIcon value={emoji} className="h-9 w-9" />
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-black text-blue-950" style={NUMBER_TEXT_STYLE}>{count}</p>
    </div>
  );
}

function MiniObjectSet({ count, emoji }: { count: number; emoji: string }) {
  return (
    <div className="flex min-h-24 flex-wrap content-center justify-center gap-2 rounded-2xl border-2 border-dashed border-yellow-200 bg-yellow-50 p-2">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-2xl shadow-inner">
          <SpriteIcon value={emoji} className="h-8 w-8" />
        </span>
      ))}
    </div>
  );
}

function spreadObjectStyle(index: number, total: number): React.CSSProperties {
  const positions = [
    [8, 10], [58, 6], [34, 34], [76, 42], [14, 62],
    [50, 72], [72, 12], [26, 82], [4, 38],
  ];
  const [left, top] = positions[index % positions.length];
  const offset = Math.max(0, 9 - total) * 2;
  return { left: `${Math.min(82, left + offset)}%`, top: `${top}%` };
}

function SequencingLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [practice, setPractice] = useState(false);
  const slides = [
    {
      title: lang === "en" ? "Number values" : "Nilai nombor",
      text: lang === "en" ? "Numbers show amounts." : "Nombor menunjukkan jumlah.",
      visual: <NumberValueCompare a={2} b={5} lang={lang} />,
    },
    {
      title: lang === "en" ? "Full number line" : "Garis nombor penuh",
      text: lang === "en" ? "Numbers go from 0 to 9." : "Nombor dari 0 hingga 9.",
      visual: <NumberLineSequence nums={NUMBERS} marked={-1} arrow="right" />,
    },
    {
      title: lang === "en" ? "Ascending: Going Up" : "Menaik: Nombor Naik",
      text: lang === "en" ? "Ascending means numbers go up." : "Menaik bermaksud nombor naik.",
      visual: <SequencingExample nums={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} arrow="right" />,
    },
    {
      title: lang === "en" ? "Numbers get bigger" : "Nombor makin besar",
      text: lang === "en" ? "Tap to see more." : "Tekan untuk lihat lebih banyak.",
      visual: <TapRevealOrder nums={[1, 2, 3, 4]} lang={lang} mode="up" />,
    },
    {
      title: lang === "en" ? "Descending: Going Down" : "Menurun: Nombor Turun",
      text: lang === "en" ? "Descending means numbers go down." : "Menurun bermaksud nombor turun.",
      visual: <NumberLineSequence nums={[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} marked={-1} arrow="right" />,
    },
    {
      title: lang === "en" ? "Numbers get smaller" : "Nombor makin kecil",
      text: lang === "en" ? "Tap to see less." : "Tekan untuk lihat lebih sedikit.",
      visual: <TapRevealOrder nums={[4, 3, 2, 1]} lang={lang} mode="down" />,
    },
    {
      title: lang === "en" ? "Number Order" : "Turutan Nombor",
      text: lang === "en" ? "Numbers follow an order." : "Nombor ada turutan.",
      visual: <TapRevealSequence lang={lang} />,
    },
    {
      title: lang === "en" ? "Missing numbers" : "Nombor hilang",
      text: lang === "en" ? "What number is missing?" : "Nombor apa yang hilang?",
      visual: <MissingNumberTeaching lang={lang} nums={[0, 1, 2, "?", 4, 5, 6, 7, 8, 9]} answer={3} />,
    },
    {
      title: lang === "en" ? "Place the missing number" : "Letak nombor hilang",
      text: lang === "en" ? "Choose a tile for the empty space." : "Pilih jubin untuk ruang kosong.",
      visual: <MissingNumberPlacementActivity lang={lang} />,
    },
  ];
  const current = slides[step];

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.sequencing}: ${t.practice}`} questions={sequencingPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell lang={lang} title={t.sequencing} helper={lang === "en" ? "Learn one step at a time." : "Belajar satu langkah demi satu langkah."}>
        <div className="rounded-[2rem] border-4 border-white bg-white p-5 shadow-[0_7px_0_rgba(0,0,0,.12)]">
          <h3 className="mb-2 text-center text-3xl font-black text-blue-950">{current.title}</h3>
          <CharacterTalk lang={lang} text={current.text} />
          <div className="mt-4">{current.visual}</div>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            <button onClick={() => step < slides.length - 1 ? setStep((s) => s + 1) : setPractice(true)} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">{step < slides.length - 1 ? t.next : t.practice}</button>
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
  | { kind: "same"; a: number; b: number; emoji: string }
  | { kind: "more"; a: number; b: number; emoji: string }
  | { kind: "combine"; a: number; b: number; emoji: string };

const GROUPING_LESSON_STEPS: NewGroupingActivity[] = [
  { kind: "observe", count: 3, emoji: "🍌" },
  { kind: "makeOne", target: 2, emoji: "🍌" },
  { kind: "makeOne", target: 3, emoji: "🍌" },
  { kind: "makeTwo", a: 2, b: 3, emoji: "🍌" },
  { kind: "same", a: 3, b: 3, emoji: "🍌" },
  { kind: "more", a: 3, b: 5, emoji: "🍌" },
  { kind: "combine", a: 1, b: 1, emoji: "🍌" },
  { kind: "combine", a: 1, b: 2, emoji: "🍌" },
  { kind: "combine", a: 2, b: 2, emoji: "🍌" },
  { kind: "combine", a: 2, b: 3, emoji: "🍌" },
  { kind: "combine", a: 3, b: 3, emoji: "🍌" },
  { kind: "combine", a: 3, b: 4, emoji: "🍌" },
  { kind: "combine", a: 4, b: 5, emoji: "🍌" },
];

const fullGroupingPracticeQuestions: Question[] = [
  q("group-practice-make-2", "numbers", { en: "Make a group of 2.", ms: "Bina kumpulan 2." }, [], 2, { kind: "groupMake", emoji: "🍌", count: 2 }, "makeGroup"),
  q("group-practice-make-4", "numbers", { en: "Make a group of 4.", ms: "Bina kumpulan 4." }, [], 4, { kind: "groupMake", emoji: "🍌", count: 4 }, "makeGroup"),
  q("group-practice-2-3", "numbers", { en: "Which total is 2 and 3 together?", ms: "Berapakah jumlah 2 dan 3 bersama?" }, [4, 5, 6], 5, { kind: "groupCombine", emoji: "🍌", a: 2, b: 3 }),
  q("group-practice-3-4", "numbers", { en: "Which total is 3 and 4 together?", ms: "Berapakah jumlah 3 dan 4 bersama?" }, [6, 7, 8], 7, { kind: "groupCombine", emoji: "🍌", a: 3, b: 4 }),
  q("group-practice-more", "numbers", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, ["Group 1", "Group 2"], "Group 2", { kind: "groupCompare", emoji: "🍌", a: 3, b: 5, ask: "more" }),
];

function GroupingMode({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [groupA, setGroupA] = useState(0);
  const [groupB, setGroupB] = useState(0);
  const [checked, setChecked] = useState(false);
  const [practice, setPractice] = useState(false);
  const activity = GROUPING_LESSON_STEPS[activityIndex];
  const maxStep = getNewGroupingMaxStep(activity);
  const activeTarget = getActiveGroupingTarget(activity, step);
  const activeCount = getActiveGroupingCount(activity, step, groupA, groupB);
  const canEdit = activeTarget !== null;
  const correct = activeTarget !== null && activeCount === activeTarget;
  const instruction = getNewGroupingInstruction(activity, step, lang);

  const resetTo = (nextIndex: number) => {
    setActivityIndex(nextIndex);
    setStep(0);
    setGroupA(0);
    setGroupB(0);
    setChecked(false);
  };

  const addObject = () => {
    if (!canEdit) return;
    setChecked(false);
    if (activity.kind === "makeTwo" && step === 2) setGroupB((count) => Math.min(9, count + 1));
    else setGroupA((count) => Math.min(9, count + 1));
  };

  const removeObject = () => {
    if (!canEdit) return;
    setChecked(false);
    if (activity.kind === "makeTwo" && step === 2) setGroupB((count) => Math.max(0, count - 1));
    else setGroupA((count) => Math.max(0, count - 1));
  };

  const retryGroup = () => {
    setChecked(false);
    if (activity.kind === "makeTwo" && step === 2) setGroupB(0);
    else setGroupA(0);
  };

  const checkGroup = () => {
    setChecked(true);
    if (correct) setStep((current) => Math.min(maxStep, current + 1));
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
      <LessonShell
        lang={lang}
        title={lang === "en" ? "Grouping: Jungle Groups" : "Kumpulan: Kumpulan Rimba"}
        helper={lang === "en" ? "Make groups. Count groups. Then put groups together." : "Bina kumpulan. Kira kumpulan. Kemudian gabungkan."}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
          <img src={chrysHappy} alt="Chrys" className="mx-auto h-28 w-28 object-contain" />
          <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 shadow-[0_5px_0_rgba(6,95,70,.12)]">
            <p className="text-xl font-black text-emerald-950">{instruction}</p>
            <p className="mt-1 text-sm font-bold text-emerald-900/70">
              {lang === "en" ? `Step ${activityIndex + 1} of ${GROUPING_LESSON_STEPS.length}` : `Langkah ${activityIndex + 1} daripada ${GROUPING_LESSON_STEPS.length}`}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border-4 border-white bg-[linear-gradient(180deg,#e8fff2_0%,#f7ffe8_58%,#d6f2a2_100%)] p-4 shadow-inner">
          <NewGroupingLessonVisual activity={activity} step={step} groupA={groupA} groupB={groupB} lang={lang} />
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
                className="grid h-20 w-20 place-items-center rounded-3xl border-2 border-yellow-300 bg-yellow-50 shadow-[0_5px_0_rgba(180,83,9,.25)] active:translate-y-1"
              >
                <SpriteIcon value={activity.emoji} className="h-14 w-14" />
              </button>
              <button onClick={removeObject} className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-5 py-3 font-black text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.14)] active:translate-y-1">
                {lang === "en" ? "Remove one" : "Buang satu"}
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
              <button onClick={next} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">
                {step < maxStep || activityIndex < GROUPING_LESSON_STEPS.length - 1 ? t.next : t.practice}
              </button>
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
  if (activity.kind === "combine") return 5;
  return 2;
}

function getActiveGroupingTarget(activity: NewGroupingActivity, step: number) {
  if (activity.kind === "makeOne" && step === 0) return activity.target;
  if (activity.kind === "makeTwo" && step === 0) return activity.a;
  if (activity.kind === "makeTwo" && step === 2) return activity.b;
  return null;
}

function getActiveGroupingCount(activity: NewGroupingActivity, step: number, groupA: number, groupB: number) {
  if (activity.kind === "makeTwo" && step === 2) return groupB;
  return groupA;
}

function getNewGroupingInstruction(activity: NewGroupingActivity, step: number, lang: Lang) {
  if (activity.kind === "observe") {
    if (step === 0) return lang === "en" ? "This is a group." : "Ini satu kumpulan.";
    if (step === 1) return lang === "en" ? "Count this group." : "Kira kumpulan ini.";
    return lang === "en" ? `${activity.count} bananas are in this group.` : `${activity.count} pisang dalam kumpulan ini.`;
  }
  if (activity.kind === "makeOne") {
    if (step === 0) return lang === "en" ? `Make a group of ${activity.target}.` : `Bina kumpulan ${activity.target}.`;
    return lang === "en" ? `This group has ${activity.target}.` : `Kumpulan ini ada ${activity.target}.`;
  }
  if (activity.kind === "makeTwo") {
    if (step === 0) return lang === "en" ? `Make Group 1 with ${activity.a}.` : `Bina Kumpulan 1 dengan ${activity.a}.`;
    if (step === 1) return lang === "en" ? "Count Group 1." : "Kira Kumpulan 1.";
    if (step === 2) return lang === "en" ? `Now make Group 2 with ${activity.b}.` : `Sekarang bina Kumpulan 2 dengan ${activity.b}.`;
    if (step === 3) return lang === "en" ? "Count Group 2." : "Kira Kumpulan 2.";
    return lang === "en" ? `Group 1 has ${activity.a}. Group 2 has ${activity.b}.` : `Kumpulan 1 ada ${activity.a}. Kumpulan 2 ada ${activity.b}.`;
  }
  if (activity.kind === "same") {
    if (step === 0) return lang === "en" ? "Look at both groups." : "Lihat dua kumpulan.";
    if (step === 1) return lang === "en" ? "Count each group." : "Kira setiap kumpulan.";
    return activity.a === activity.b
      ? (lang === "en" ? "The groups are the same." : "Kumpulan ini sama.")
      : (lang === "en" ? "The groups are different." : "Kumpulan ini berbeza.");
  }
  if (activity.kind === "more") {
    if (step === 0) return lang === "en" ? "Look at both groups." : "Lihat dua kumpulan.";
    if (step === 1) return lang === "en" ? "Count each group." : "Kira setiap kumpulan.";
    return activity.a > activity.b
      ? (lang === "en" ? "Group A has more." : "Kumpulan A lebih banyak.")
      : (lang === "en" ? "Group B has more." : "Kumpulan B lebih banyak.");
  }
  if (step === 0) return lang === "en" ? `Group 1 has ${activity.a}.` : `Kumpulan 1 ada ${activity.a}.`;
  if (step === 1) return lang === "en" ? "Count Group 1." : "Kira Kumpulan 1.";
  if (step === 2) return lang === "en" ? `Group 2 has ${activity.b}.` : `Kumpulan 2 ada ${activity.b}.`;
  if (step === 3) return lang === "en" ? "Put the groups together." : "Gabungkan kumpulan.";
  if (step === 4) return lang === "en" ? "Count them all." : "Kira semuanya.";
  return lang === "en" ? `${activity.a} and ${activity.b} make ${activity.a + activity.b}.` : `${activity.a} dan ${activity.b} menjadi ${activity.a + activity.b}.`;
}

function NewGroupingLessonVisual({ activity, step, groupA, groupB, lang }: { activity: NewGroupingActivity; step: number; groupA: number; groupB: number; lang: Lang }) {
  if (activity.kind === "observe") {
    return (
      <div className="space-y-4">
        <GroupingTray label={lang === "en" ? "Basket group" : "Kumpulan bakul"} count={activity.count} emoji={activity.emoji} counted={step >= 1} lang={lang} />
        {step === 2 && <GroupingAnswerLine text={lang === "en" ? `${activity.count} bananas are in this group.` : `${activity.count} pisang dalam kumpulan ini.`} />}
      </div>
    );
  }
  if (activity.kind === "makeOne") {
    return (
      <div className="space-y-4">
        <GroupingTray label={lang === "en" ? "Group box" : "Kotak kumpulan"} count={step >= 1 ? activity.target : groupA} emoji={activity.emoji} counted={step >= 1} active={step === 0} lang={lang} />
        {step >= 1 && <GroupingAnswerLine text={lang === "en" ? `This group has ${activity.target}.` : `Kumpulan ini ada ${activity.target}.`} />}
      </div>
    );
  }
  if (activity.kind === "makeTwo") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <GroupingTray label={lang === "en" ? "Group 1" : "Kumpulan 1"} count={step >= 1 ? activity.a : groupA} emoji={activity.emoji} counted={step >= 1} active={step === 0} lang={lang} />
          <GroupingTray label={lang === "en" ? "Group 2" : "Kumpulan 2"} count={step >= 3 ? activity.b : groupB} emoji={activity.emoji} counted={step >= 3} active={step === 2} lang={lang} />
        </div>
        {step >= 4 && <GroupingAnswerLine text={lang === "en" ? `Each group has its own number.` : `Setiap kumpulan ada nombornya sendiri.`} />}
      </div>
    );
  }
  if (activity.kind === "same" || activity.kind === "more") {
    const result = activity.kind === "same"
      ? (activity.a === activity.b ? (lang === "en" ? "Yes. Both groups have 3." : "Ya. Kedua-dua kumpulan ada 3.") : (lang === "en" ? `${activity.a} and ${activity.b} are different.` : `${activity.a} dan ${activity.b} berbeza.`))
      : (activity.a > activity.b ? (lang === "en" ? "Group A has more." : "Kumpulan A lebih banyak.") : (lang === "en" ? "Group B has more." : "Kumpulan B lebih banyak."));
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <GroupingTray label="Group A" count={activity.a} emoji={activity.emoji} counted={step >= 1} lang={lang} />
          <GroupingTray label="Group B" count={activity.b} emoji={activity.emoji} counted={step >= 1} lang={lang} />
        </div>
        {step >= 2 && <GroupingAnswerLine text={result} />}
      </div>
    );
  }
  const total = activity.a + activity.b;
  return (
    <div className="space-y-4">
      {step < 3 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <GroupingTray label={lang === "en" ? "Group 1" : "Kumpulan 1"} count={activity.a} emoji={activity.emoji} counted={step >= 1} lang={lang} />
          <GroupingTray label={lang === "en" ? "Group 2" : "Kumpulan 2"} count={activity.b} emoji={activity.emoji} counted={step >= 2} lang={lang} />
        </div>
      ) : (
        <GroupingTray label={lang === "en" ? "One big group" : "Satu kumpulan besar"} count={total} emoji={activity.emoji} counted={step >= 4} lang={lang} />
      )}
      {step === 3 && <GroupingAnswerLine text={lang === "en" ? "The groups move into one big group." : "Kumpulan bergerak menjadi satu kumpulan besar."} />}
      {step === 5 && (
        <div className="rounded-3xl border-2 border-emerald-200 bg-white p-4 text-center">
          <p className="text-2xl font-black text-emerald-900">{lang === "en" ? `${activity.a} and ${activity.b} make ${total}.` : `${activity.a} dan ${activity.b} menjadi ${total}.`}</p>
          <p className="mt-2 text-4xl font-black text-blue-950">{activity.a} + {activity.b} = {total}</p>
        </div>
      )}
    </div>
  );
}

function GroupingTray({ label, count, emoji, counted, active = false, lang }: { label: string; count: number; emoji: string; counted: boolean; active?: boolean; lang: Lang }) {
  return (
    <div className={`rounded-[2rem] border-4 p-4 text-center transition-all ${active ? "border-yellow-400 bg-yellow-50 shadow-[0_7px_0_rgba(180,83,9,.22)]" : "border-emerald-200 bg-white"}`}>
      <h3 className="mb-3 text-2xl font-black text-blue-950">{label}</h3>
      {counted ? <CountedObjectRow count={count} emoji={emoji} showCount compact speakCount lang={lang} /> : <ObjectGroup count={count} emoji={emoji} />}
      {counted && <CountTotalBadge count={count} lang={lang} />}
    </div>
  );
}

function CountTotalBadge({ count, lang }: { count: number; lang: Lang }) {
  return (
    <div
      className="mx-auto mt-3 inline-flex items-center gap-2 rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-2 text-blue-950 shadow-[0_4px_0_rgba(30,64,175,.14)]"
      aria-label={lang === "en" ? `Total ${count}` : `Jumlah ${count}`}
    >
      <span className="text-sm font-black uppercase tracking-wide text-blue-700">{lang === "en" ? "Total" : "Jumlah"}</span>
      <span className="grid h-10 min-w-10 place-items-center rounded-full bg-white px-3 text-2xl font-black text-blue-950">
        {count}
      </span>
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
    return <Quiz lang={lang} t={t} title={`${t.addition}: ${t.practice}`} questions={additionPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPhase("intro")} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
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
            text={lang === "en" ? "The + sign means add more." : "Tanda + bermaksud tambah lagi."}
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
              : "Tanda = bermaksud jumlah yang sama pada kedua-dua belah."}
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
  const [phase, setPhase] = useState<"intro" | "sign" | "story" | "practice">("intro");

  if (phase === "practice") {
    return <Quiz lang={lang} t={t} title={`${t.subtraction}: ${t.practice}`} questions={subtractionPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPhase("intro")} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell lang={lang} title={t.subtraction} helper={lang === "en" ? "Take away. Count what is left." : "Ambil. Kira yang tinggal."}>
        {phase === "intro" && (
          <AdditionIntroStep
            title={t.subtraction}
            text={lang === "en" ? "Subtraction takes away from one group." : "Tolak ambil daripada satu kumpulan."}
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
            text={lang === "en" ? "The - sign means take away." : "Tanda - bermaksud ambil."}
            onPrevious={() => setPhase("intro")}
            onNext={() => setPhase("story")}
            onSkip={() => setPhase("practice")}
            t={t}
            lang={lang}
          />
        )}
        {phase === "story" && (
          <ChrysSubtractionStory
            lang={lang}
            t={t}
            onPrev={() => setPhase("sign")}
            onDone={() => setPhase("practice")}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
      </LessonShell>
    </main>
  );
}

type RealWorldTeachingIndex = 0 | 1 | 2 | 3;

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
        onFinish={() => onDone()}
        onBackToLearning={() => setPhase(0)}
      />
    );
  }

  const goNext = () => setPhase((current) => {
    if (current === "practice") return current;
    return current === 3 ? "practice" : ((current + 1) as RealWorldTeachingIndex);
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
          ? "Read the story. Find the numbers. Find the clue."
          : "Baca cerita. Cari nombor. Cari petunjuk."}
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
  const banana = String.fromCodePoint(0x1f34c);
  const title = [
    lang === "en" ? "Find the numbers" : "Cari nombor",
    lang === "en" ? "Find the action" : "Cari perbuatan",
    lang === "en" ? "Choose: add" : "Pilih: tambah",
    lang === "en" ? "Choose: take away" : "Pilih: tolak",
  ][phase];
  const talk = [
    lang === "en"
      ? "Look for how many. The numbers are 3 and 2."
      : "Cari berapa banyak. Nombornya 3 dan 2.",
    lang === "en"
      ? "Clue words help us choose. They are hints."
      : "Kata petunjuk bantu kita pilih. Ia cuma petunjuk.",
    lang === "en"
      ? "More bananas come together. We add."
      : "Pisang lagi bergabung. Kita tambah.",
    lang === "en"
      ? "Some bananas go away. We take away."
      : "Ada pisang pergi. Kita tolak.",
  ][phase];
  const nextLabel = phase === 3 ? t.practice : t.next;

  return (
    <div className="space-y-5">
      <div className="relative rounded-[2rem] border-2 border-emerald-100 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,.10)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img src={chrysThinking} alt="Chrys" className="mx-auto h-28 w-28 shrink-0 object-contain sm:mx-0" />
          <div>
            <h3 className="text-3xl font-black text-blue-950">{title}</h3>
            <p className="mt-2 text-lg font-black leading-snug text-slate-700">{talk}</p>
          </div>
        </div>
      </div>

      {phase === 0 && <FindNumbersExample lang={lang} banana={banana} />}
      {phase === 1 && <FindActionExample lang={lang} banana={banana} />}
      {phase === 2 && <ChooseAddExample lang={lang} banana={banana} />}
      {phase === 3 && <ChooseTakeAwayExample lang={lang} banana={banana} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreviousLessonButton label={t.previous} onClick={onPrevious} />
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={onSkip} variant="green" />
          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FindNumbersExample({ lang, banana }: { lang: Lang; banana: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <CharacterTalk lang={lang} text={lang === "en" ? "Chrys has 3 bananas and 2 more bananas." : "Chrys ada 3 pisang dan 2 pisang lagi."} />
      <div className="rounded-[2rem] border-2 border-yellow-100 bg-yellow-50 p-4">
        <p className="mb-3 text-center text-xl font-black text-yellow-900">
          {lang === "en" ? "The numbers are 3 and 2." : "Nombornya 3 dan 2."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <RealWorldNumberGroup count={3} label="3" emoji={banana} />
          <RealWorldNumberGroup count={2} label="2" emoji={banana} />
        </div>
      </div>
    </div>
  );
}

function FindActionExample({ lang, banana }: { lang: Lang; banana: string }) {
  return (
    <div className="space-y-4">
      <CharacterTalk lang={lang} text={lang === "en" ? "A clue word tells what happens." : "Kata petunjuk beritahu apa berlaku."} />
      <div className="grid gap-4 md:grid-cols-2">
        <RealWorldStoryCard
          lang={lang}
          story={lang === "en" ? "Chrys gets more bananas." : "Chrys dapat lagi pisang."}
          clue={lang === "en" ? "gets more" : "dapat lagi"}
          note={lang === "en" ? "This is an ADDITION (+) clue." : "Ini petunjuk TAMBAH (+)."}
        >
          <div className="flex items-center justify-center gap-2">
            <ObjectGroup count={2} emoji={banana} />
            <span className="text-4xl font-black text-blue-800">+</span>
            <ObjectGroup count={1} emoji={banana} />
          </div>
        </RealWorldStoryCard>
        <RealWorldStoryCard
          lang={lang}
          story={lang === "en" ? "Chrys gives away bananas." : "Chrys beri pisang."}
          clue={lang === "en" ? "gives away" : "beri"}
          note={lang === "en" ? "This is a SUBTRACTION (-) clue." : "Ini petunjuk TOLAK (-)."}
        >
          <CountedObjectRow count={4} emoji={banana} crossed={1} showCount={false} compact />
        </RealWorldStoryCard>
      </div>
    </div>
  );
}

function ChooseAddExample({ lang, banana }: { lang: Lang; banana: string }) {
  return (
    <div className="space-y-4 rounded-[2rem] border-2 border-blue-100 bg-blue-50 p-4">
      <CharacterTalk lang={lang} text={lang === "en" ? "Chrys has 3 bananas. He gets 2 more." : "Chrys ada 3 pisang. Dia dapat 2 lagi."} />
      <RealWorldStepGrid
        steps={[
          { label: lang === "en" ? "Numbers" : "Nombor", value: "3, 2" },
          { label: lang === "en" ? "Clue" : "Petunjuk", value: lang === "en" ? "more" : "lagi" },
          { label: lang === "en" ? "Choose" : "Pilih", value: "+" },
          { label: lang === "en" ? "Answer" : "Jawapan", value: "5" },
        ]}
      />
      <CountedObjectRow count={5} emoji={banana} showCount compact />
      <p className="text-center text-2xl font-black text-blue-950">3 + 2 = 5</p>
    </div>
  );
}

function ChooseTakeAwayExample({ lang, banana }: { lang: Lang; banana: string }) {
  return (
    <div className="space-y-4 rounded-[2rem] border-2 border-red-100 bg-red-50 p-4">
      <CharacterTalk lang={lang} text={lang === "en" ? "Chrys has 5 bananas. He gives away 2." : "Chrys ada 5 pisang. Dia beri 2."} />
      <RealWorldStepGrid
        steps={[
          { label: lang === "en" ? "Numbers" : "Nombor", value: "5, 2" },
          { label: lang === "en" ? "Clue" : "Petunjuk", value: lang === "en" ? "gives away" : "beri" },
          { label: lang === "en" ? "Choose" : "Pilih", value: "-" },
          { label: lang === "en" ? "Answer" : "Jawapan", value: "3" },
        ]}
      />
      <CountedObjectRow count={5} emoji={banana} crossed={2} showCount countRemainingOnly showCrossCount compact />
      <p className="text-center text-2xl font-black text-red-950">5 - 2 = 3</p>
    </div>
  );
}

function RealWorldNumberGroup({ count, label, emoji }: { count: number; label: string; emoji: string }) {
  return (
    <div className="rounded-3xl border-2 border-white bg-white p-3 text-center shadow-[0_4px_0_rgba(0,0,0,.08)]">
      <ObjectGroup count={count} emoji={emoji} />
      <p className="mt-2 text-4xl font-black text-blue-950" style={NUMBER_TEXT_STYLE}>{label}</p>
    </div>
  );
}

function RealWorldStoryCard({ story, clue, note, children }: { lang: Lang; story: string; clue: string; note: string; children: React.ReactNode }) {
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
        <h3 className="text-3xl font-black text-blue-950">{title}</h3>
        <p className="mt-3 text-xl font-black leading-snug text-slate-700">{text}</p>
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
  const bellyTarget = step >= 3 ? 5 : step >= 1 ? 2 : 0;
  const helperText = storyText[step];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <h3 className="text-3xl font-black text-blue-950">{lang === "en" ? "Chrys and bananas" : "Chrys dan pisang"}</h3>
        <p className="mt-2 text-lg font-black text-slate-700">{helperText}</p>
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
                    onClick={() => setEatingStep(step)}
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
          <button
            onClick={() => {
              setEatingStep(null);
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
            className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step < 7 || (step === 7 && zeroStep < 3) ? t.next : t.practice}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChrysSubtractionStory({ lang, t, onPrev, onDone, actions = [] }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  actions?: LessonAction[];
}) {
  const [storyStep, setStoryStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [showSituation, setShowSituation] = useState(true);
  const [given, setGiven] = useState(0);
  const [flight, setFlight] = useState<Array<{ left: number; top: number; x: number; y: number; targetIndex: number }> | null>(null);
  const basketRef = useRef<HTMLDivElement>(null);
  const chrysBananaRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const alyseBananaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const flyingBananaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const left = 7 - given;
  const storyText: Record<number, string> = lang === "en"
    ? {
      1: "Chrys will give Alyse 3 bananas.",
      4: "Chrys gives Alyse 3 bananas. 4 are left.",
      5: "Count what is left. 4 bananas!",
      6: "7 bananas. Give Alyse 3. 4 are left.",
    }
    : {
      1: "Chrys akan beri Alyse 3 pisang.",
      4: "Chrys beri Alyse 3 pisang. Tinggal 4.",
      5: "Kira yang tinggal. 4 pisang!",
      6: "7 pisang. Beri Alyse 3. Tinggal 4.",
    };

  useEffect(() => {
    if (!flight) return;
    const reducedMotion = getReducedMotionPreference();
    const animations = flight.flatMap((item) => {
      const banana = flyingBananaRefs.current[item.targetIndex];
      if (!banana) return [];
      const arcHeight = Math.max(135, Math.min(210, Math.abs(item.x) * 0.38)) + item.targetIndex * 12;
      const keyframes = reducedMotion
        ? [
          { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
          { transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(.65)`, opacity: 0 },
        ]
        : [
          { transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)", opacity: 1 },
          { offset: 0.24, transform: `translate3d(${item.x * 0.22}px, ${item.y * 0.22 - arcHeight * 0.72}px, 0) rotate(-8deg) scale(1.02)`, opacity: 1 },
          { offset: 0.52, transform: `translate3d(${item.x * 0.52}px, ${item.y * 0.52 - arcHeight}px, 0) rotate(5deg) scale(.96)`, opacity: 1 },
          { offset: 0.8, transform: `translate3d(${item.x * 0.82}px, ${item.y * 0.82 - arcHeight * 0.55}px, 0) rotate(10deg) scale(.82)`, opacity: 1 },
          { transform: `translate3d(${item.x}px, ${item.y}px, 0) rotate(0deg) scale(.65)`, opacity: 0 },
        ];
      return [banana.animate(keyframes, {
        duration: reducedMotion ? 1 : 2600,
        easing: "cubic-bezier(.4,0,.2,1)",
        fill: "forwards",
      })];
    });

    if (animations.length !== 3) return;
    let cancelled = false;
    Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (cancelled) return;
      setGiven(3);
      setStoryStep(4);
      setFlight(null);
      // The remaining count is spoken only after all three bananas reach Alyse.
      speakNumber(4, lang);
    });

    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
    };
  }, [flight, lang]);

  const giveThree = () => {
    if (flight || given >= 3 || !basketRef.current) return;
    const sourceBananas = chrysBananaRefs.current.slice(4, 7);
    const targets = alyseBananaRefs.current.slice(0, 3);
    if (sourceBananas.some((banana) => !banana) || targets.some((target) => !target)) return;

    setFlight(sourceBananas.map((source, targetIndex) => {
      const sourceRect = source!.getBoundingClientRect();
      const targetRect = targets[targetIndex]!.getBoundingClientRect();
      const leftPosition = sourceRect.left + sourceRect.width / 2 - 24;
      const topPosition = sourceRect.top + sourceRect.height / 2 - 24;
      return {
        left: leftPosition,
        top: topPosition,
        x: targetRect.left + targetRect.width / 2 - 24 - leftPosition,
        y: targetRect.top + targetRect.height / 2 - 24 - topPosition,
        targetIndex,
      };
    }));
  };

  const setStoryPosition = (nextStep: 1 | 2 | 3 | 4 | 5 | 6) => {
    setFlight(null);
    setStoryStep(nextStep);
    setGiven(nextStep === 1 ? 0 : 3);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <h3 className="text-3xl font-black text-blue-950">{lang === "en" ? "Chrys gives bananas to Alyse" : "Chrys beri pisang kepada Alyse"}</h3>
        <p className="mt-2 text-lg font-black text-slate-700">
          {showSituation
            ? (lang === "en" ? "Alyse is hungry. Chrys wants to share 3 bananas." : "Alyse lapar. Chrys mahu berkongsi 3 pisang.")
            : storyText[storyStep]}
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        {showSituation && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
                <img src={chrysHappy} alt="Chrys" className="mx-auto h-24 w-24 object-contain" />
                <p className="mb-3 text-sm font-black uppercase text-amber-800">{lang === "en" ? "Chrys's basket" : "Bakul Chrys"}</p>
                <div className="flex flex-wrap justify-center gap-3 rounded-3xl border-2 border-amber-100 bg-white p-4">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div key={index} className="relative grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 shadow-inner">
                      <span className="absolute -top-2 grid h-7 min-w-10 place-items-center rounded-full bg-blue-600 px-3 text-xs font-black text-white shadow-sm">{index + 1}</span>
                      <SpriteIcon value="🍌" className="h-10 w-10" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xl font-black text-amber-950">{lang === "en" ? "Chrys has 7 bananas." : "Chrys ada 7 pisang."}</p>
              </div>

              <div className="text-center">
                <p className="text-5xl font-black text-emerald-600" aria-hidden="true">→</p>
                <p className="mt-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
                  {lang === "en" ? "Share 3" : "Kongsi 3"}
                </p>
              </div>

              <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                <img src={alyseGuide} alt="Alyse" className="mx-auto h-24 w-24 object-contain" />
                <p className="mb-3 text-sm font-black uppercase text-emerald-800">{lang === "en" ? "Alyse's basket" : "Bakul Alyse"}</p>
                <div className="grid min-h-28 place-items-center rounded-3xl border-2 border-dashed border-emerald-200 bg-white">
                  <p className="rounded-full bg-slate-100 px-5 py-2 text-xl font-black text-slate-600">{lang === "en" ? "0 bananas" : "0 pisang"}</p>
                </div>
                <p className="mt-3 text-xl font-black text-emerald-950">{lang === "en" ? "Alyse is hungry." : "Alyse lapar."}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setStoryPosition(1);
                  setShowSituation(false);
                }}
                className="relative rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#047857] active:translate-y-1"
              >
                {lang === "en" ? "Help Chrys share" : "Bantu Chrys berkongsi"}
                <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                  <PointerIcon />
                </span>
              </button>
            </div>
          </div>
        )}

        {!showSituation && storyStep <= 4 && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div ref={basketRef} className="min-h-56 rounded-3xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
                <p className="mb-3 text-sm font-black uppercase text-amber-800">{lang === "en" ? "Chrys's basket" : "Bakul Chrys"}</p>
                <div className="flex min-h-24 flex-wrap content-center justify-center gap-3 rounded-3xl border-2 border-slate-100 bg-white p-4">
                  {Array.from({ length: left }, (_, index) => (
                    <span
                      key={index}
                      ref={(node) => { chrysBananaRefs.current[index] = node; }}
                      className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 shadow-inner ${flight && index >= 4 ? "opacity-0" : "opacity-100"}`}
                    >
                      <span className="absolute -top-2 grid h-7 min-w-10 place-items-center rounded-full bg-blue-600 px-3 text-xs font-black text-white shadow-sm">
                        {index + 1}
                      </span>
                      <SpriteIcon value="🍌" className="h-9 w-9 sm:h-11 sm:w-11" />
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-lg font-black">
                  <p className="rounded-2xl bg-amber-100 px-3 py-2 text-amber-950">
                    {lang === "en" ? "Start: 7" : "Mula: 7"}
                  </p>
                  <p className="rounded-2xl bg-blue-100 px-3 py-2 text-blue-950">
                    {lang === "en" ? `Left: ${left}` : `Tinggal: ${left}`}
                  </p>
                </div>
              </div>
              <img src={chrysHappy} alt="Chrys sharing bananas" className="mx-auto h-24 w-24 object-contain md:h-32 md:w-32" />
              <div className="min-h-56 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <img src={alyseGuide} alt="Alyse" className="h-16 w-16 object-contain" />
                  <p className="text-sm font-black uppercase text-emerald-800">{lang === "en" ? "Alyse's basket" : "Bakul Alyse"}</p>
                </div>
                <p className="mb-4 text-base font-black text-emerald-900">
                  {lang === "en" ? "Alyse gets 3 bananas in total." : "Alyse dapat 3 pisang semuanya."}
                </p>
                <div className="grid grid-cols-3 gap-3 rounded-3xl border-2 border-emerald-100 bg-white p-4">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      ref={(node) => { alyseBananaRefs.current[index] = node; }}
                      className={`relative grid h-16 min-w-0 place-items-center rounded-2xl border-2 ${
                        index < given ? "border-emerald-300 bg-emerald-50" : "border-dashed border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span className={`absolute -top-3 grid h-7 min-w-10 place-items-center rounded-full px-3 text-xs font-black text-white shadow-sm ${index < given ? "bg-emerald-600" : "bg-slate-400"}`}>
                        {index + 1}
                      </span>
                      {index < given && <SpriteIcon value="🍌" className="h-11 w-11" />}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xl font-black text-emerald-950">
                  {lang === "en" ? `Alyse has: ${given}` : `Alyse ada: ${given}`}
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-center sm:grid-cols-3" aria-label={lang === "en" ? "Subtraction number labels" : "Label nombor penolakan"}>
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-black text-amber-800">{lang === "en" ? "Start" : "Mula"}</p>
                <p className="text-3xl font-black text-amber-950" style={NUMBER_TEXT_STYLE}>7</p>
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-black text-emerald-800">{lang === "en" ? "Given to Alyse" : "Diberi kepada Alyse"}</p>
                <p className="text-3xl font-black text-emerald-950" style={NUMBER_TEXT_STYLE}>{given}</p>
              </div>
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-black text-blue-800">{lang === "en" ? "Left" : "Tinggal"}</p>
                <p className="text-3xl font-black text-blue-950" style={NUMBER_TEXT_STYLE}>{left}</p>
              </div>
            </div>

            <div className="flex justify-center">
              {given < 3 ? (
                <button
                  type="button"
                  disabled={Boolean(flight)}
                  onClick={giveThree}
                  className="relative rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#047857] active:translate-y-1 disabled:cursor-wait disabled:opacity-60"
                >
                  {lang === "en" ? "Give Alyse 3 bananas" : "Beri Alyse 3 pisang"}
                  <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                    <PointerIcon />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStoryPosition(5)}
                  className="relative rounded-2xl border-2 border-blue-600 bg-blue-500 px-7 py-3 text-xl font-black text-white shadow-[0_6px_0_#1d4ed8] active:translate-y-1"
                >
                  {lang === "en" ? "Count what is left" : "Kira yang tinggal"}
                  <span className="pointer-events-none absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full border-2 border-yellow-400 bg-yellow-100 text-yellow-700 shadow-md" aria-hidden="true">
                    <PointerIcon />
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {!showSituation && storyStep === 5 && (
          <div className="space-y-4 rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
            <p className="text-2xl font-black text-blue-950">{lang === "en" ? "Count what is left." : "Kira yang tinggal."}</p>
            <CountedObjectRow count={4} emoji="🍌" showCount speakCount lang={lang} intervalMs={COUNTING_STEP_MS} />
            <p className="text-2xl font-black text-blue-900">{lang === "en" ? "4 bananas!" : "4 pisang!"}</p>
          </div>
        )}

        {!showSituation && storyStep === 6 && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              <SubtractionStoryGroup title={lang === "en" ? "Start" : "Mula"} count={7} lang={lang} />
              <span className="text-center text-5xl font-black text-blue-800">-</span>
              <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-4 text-center">
                <p className="mb-3 text-lg font-black text-red-900">{lang === "en" ? "Given to Alyse" : "Diberi kepada Alyse"}</p>
                <img src={alyseGuide} alt="Alyse" className="mx-auto mb-2 h-16 w-16 object-contain" />
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white">
                      <span className="absolute -top-2 grid h-6 min-w-9 place-items-center rounded-full bg-red-600 px-2 text-xs font-black text-white">{index + 1}</span>
                      <SpriteIcon value="🍌" className="h-9 w-9" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xl font-black text-red-900">{lang === "en" ? "3 bananas" : "3 pisang"}</p>
              </div>
              <span className="text-center text-5xl font-black text-blue-800">=</span>
              <SubtractionStoryGroup title={lang === "en" ? "Left" : "Tinggal"} count={4} lang={lang} />
            </div>
            <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>7 - 3 = 4</p>
              <p className="mt-2 text-xl font-black text-emerald-900">{storyText[6]}</p>
            </div>
          </div>
        )}
      </div>

      {flight?.map((item) => (
        <div
          key={item.targetIndex}
          ref={(node) => { flyingBananaRefs.current[item.targetIndex] = node; }}
          className="pointer-events-none fixed z-[100] grid h-12 w-12 place-items-center"
          style={{ left: item.left, top: item.top }}
          aria-hidden="true"
        >
          <SpriteIcon value="🍌" className="h-12 w-12" />
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            if (showSituation) onPrev();
            else if (storyStep === 1) setShowSituation(true);
            else if (storyStep === 4) setStoryPosition(1);
            else setStoryPosition((storyStep - 1) as 4 | 5);
          }}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
        >
          {t.previous}
        </button>
        <div className="flex flex-wrap justify-end gap-3">
          {actions.map((action) => (
            <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
          ))}
          <button
            disabled={showSituation || storyStep <= 4}
            onClick={() => {
              if (storyStep < 6) setStoryPosition((storyStep + 1) as 2 | 3 | 4 | 5 | 6);
              else onDone();
            }}
            className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {storyStep < 6 ? t.next : t.practice}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubtractionStoryGroup({ title, count, lang }: { title: string; count: number; lang: Lang }) {
  return (
    <div className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-3 text-center">
      <p className="mb-2 text-lg font-black text-blue-950">{title}</p>
      <ObjectGroup count={count} emoji="🍌" numbered />
      <p className="mt-2 text-xl font-black text-blue-900">{count} {lang === "en" ? "bananas" : "pisang"}</p>
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

    if (!audioMuted) {
      await speakCountingSequence(4, lang, COUNTING_STEP_MS, (value) => {
        if (alyseCountRunRef.current === runId) setAlyseCounted(value);
      });
    } else if (prefersReducedMotion) {
      setAlyseCounted(4);
    } else {
      for (let value = 1; value <= 4; value += 1) {
        await wait(COUNTING_STEP_MS);
        if (alyseCountRunRef.current !== runId) return;
        setAlyseCounted(value);
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
                    : (lang === "en" ? "Tap to count" : "Ketik untuk mengira")}
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
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <img src={chrysHappy} alt="Chrys" className="h-16 w-16 object-contain" />
            <p className="text-xl font-black text-blue-950">Chrys</p>
          </div>
          <ContainerScene
            count={0}
            emoji="🍌"
            container="basket"
            hideEmptyLabel
            label={lang === "en" ? "Chrys's basket" : "Bakul Chrys"}
          />
          <p className="mt-2 text-xl font-black text-blue-950">{lang === "en" ? "0 bananas" : "0 pisang"}</p>
        </div>
        <div className="text-center text-5xl font-black text-blue-800">+</div>
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <img src={alyseGuide} alt="Alyse" className="h-16 w-16 object-contain" />
            <p className="text-xl font-black text-blue-950">Alyse</p>
          </div>
          <BasketBananaScene
            count={4}
            counted={4}
            label={lang === "en" ? "Alyse's basket" : "Bakul Alyse"}
          />
          <p className="mt-2 text-xl font-black text-blue-950">{lang === "en" ? "4 bananas" : "4 pisang"}</p>
        </div>
      </div>
      <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-4xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>0 + 4 = 4</p>
        <p className="mt-2 text-xl font-black text-emerald-900">
          {lang === "en"
            ? "0 bananas plus 4 bananas equals 4 bananas."
            : "0 pisang tambah 4 pisang sama dengan 4 pisang."}
        </p>
      </div>
    </div>
  );
}

function BasketBananaScene({ count, counted, label }: { count: number; counted: number; label: string }) {
  const banana = String.fromCodePoint(0x1f34c);
  const positions = [
    ["left-[29%]", "top-[35%]", "-rotate-12"],
    ["left-[63%]", "top-[30%]", "rotate-12"],
    ["left-[39%]", "top-[62%]", "rotate-6"],
    ["left-[69%]", "top-[59%]", "-rotate-6"],
  ];

  return (
    <div className="mx-auto max-w-xl rounded-3xl border-2 border-amber-200 bg-white p-4">
      <div className="relative mx-auto aspect-[4/3] max-h-80 overflow-hidden rounded-3xl bg-amber-50">
        <img src={BASKET_SPRITE} alt="basket" className="absolute inset-0 h-full w-full object-contain" />
        {Array.from({ length: count }, (_, index) => {
          const [x, y, rotation] = positions[index];
          const isCounted = index < counted;
          return (
            <div
              key={index}
              className={`absolute ${x} ${y} ${rotation} grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 transition-[border-color,background-color,transform] duration-300 ${
                isCounted
                  ? "border-blue-500 bg-transparent"
                  : "border-transparent bg-transparent"
              }`}
            >
              <SpriteIcon value={banana} className="h-14 w-14" />
              {isCounted && (
                <span className="absolute -top-3 grid h-8 min-w-8 place-items-center rounded-full bg-blue-600 px-2 text-sm font-black text-white shadow-md">
                  {index + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xl font-black text-amber-900">{label}</p>
    </div>
  );
}

function AdditionBananaEquation({ lang }: { lang: Lang }) {
  const banana = String.fromCodePoint(0x1f34c);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleCounts, setVisibleCounts] = useState([0, 0, 0]);
  const [completedGroups, setCompletedGroups] = useState(0);
  const [activeGroup, setActiveGroup] = useState(0);
  const [completedSigns, setCompletedSigns] = useState(0);
  const [activeSign, setActiveSign] = useState(-1);
  const labels = lang === "en"
    ? ["2 bananas", "3 bananas", "5 bananas"]
    : ["2 pisang", "3 pisang", "5 pisang"];

  useEffect(() => {
    let cancelled = false;
    const intervalMs = 1400;

    const runSequence = async () => {
      stopNumberAudio();
      setVisibleCounts([0, 0, 0]);
      setCompletedGroups(0);
      setActiveGroup(0);
      setCompletedSigns(0);
      setActiveSign(-1);

      for (let groupIndex = 0; groupIndex < ADDITION_EQUATION_GROUPS.length; groupIndex += 1) {
        if (cancelled) return;
        const count = ADDITION_EQUATION_GROUPS[groupIndex];
        setActiveGroup(groupIndex);

        if (prefersReducedMotion) {
          setVisibleCounts((current) => current.map((value, index) => index === groupIndex ? count : value));
          await speakCountingSequence(count, lang, intervalMs);
        } else if (audioMuted) {
          for (let value = 1; value <= count; value += 1) {
            if (cancelled) return;
            setVisibleCounts((current) => current.map((shown, index) => index === groupIndex ? value : shown));
            await wait(intervalMs);
          }
        } else {
          await speakCountingSequence(count, lang, intervalMs, (value) => {
            if (cancelled) return;
            setVisibleCounts((current) => current.map((shown, index) => index === groupIndex ? value : shown));
          });
        }

        if (cancelled) return;
        setCompletedGroups(groupIndex + 1);
        speakText(
          lang === "en" ? `Total ${count} bananas.` : `Jumlah ${count} pisang.`,
          lang,
        );
        await wait(audioMuted ? 800 : 2000);

        if (groupIndex < ADDITION_EQUATION_GROUPS.length - 1) {
          if (cancelled) return;
          setActiveSign(groupIndex);
          speakText(
            groupIndex === 0
              ? (lang === "en" ? "Plus." : "Tambah.")
              : (lang === "en" ? "Equals to." : "Sama dengan."),
            lang,
          );
          await wait(audioMuted ? 600 : 1300);
          if (cancelled) return;
          setCompletedSigns(groupIndex + 1);
          setActiveSign(-1);
        }
      }

      if (cancelled) return;
      setActiveGroup(-1);

      if (!audioMuted) {
        speakText(
          lang === "en"
            ? "2 bananas plus 3 bananas equals to 5 bananas."
            : "2 pisang tambah 3 pisang sama dengan 5 pisang.",
          lang,
        );
        await wait(4200);
        if (cancelled) return;
        speakText(
          lang === "en" ? "2 plus 3 equals to 5." : "2 tambah 3 sama dengan 5.",
          lang,
        );
      }
    };

    void runSequence();
    return () => {
      cancelled = true;
      stopNumberAudio();
    };
  }, [lang, prefersReducedMotion]);

  return (
    <div className="space-y-4">
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {ADDITION_EQUATION_GROUPS.map((count, index) => (
          <React.Fragment key={count}>
            {index > 0 && (
              <span
                className={`grid h-14 w-14 place-items-center justify-self-center rounded-2xl border-2 text-4xl font-black transition-[background-color,border-color,color,box-shadow] duration-300 ${
                  activeSign === index - 1
                    ? "border-yellow-500 bg-yellow-300 text-blue-950 ring-4 ring-yellow-100 shadow-[0_4px_0_#d97706]"
                    : completedSigns >= index
                      ? "border-yellow-400 bg-yellow-200 text-blue-950 shadow-[0_4px_0_#d97706]"
                      : "border-slate-200 bg-slate-100 text-slate-300 shadow-[0_3px_0_#cbd5e1]"
                }`}
                aria-hidden="true"
              >
                {index === 1 ? "+" : "="}
              </span>
            )}
            <div className="flex h-full flex-col">
              <div
                aria-current={activeGroup === index ? "step" : undefined}
                className={`flex flex-1 items-center rounded-2xl border-2 p-3 shadow-[0_3px_0_rgba(0,0,0,.08)] transition-[border-color,background-color,opacity,filter,box-shadow] duration-300 ${
                  activeGroup === index
                    ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200"
                    : index > activeGroup && completedGroups <= index
                      ? "border-slate-200 bg-slate-100 opacity-50 grayscale"
                      : "border-emerald-300 bg-white"
                }`}
              >
                <div className="flex w-full flex-wrap justify-center gap-3">
                  {Array.from({ length: count }, (_, objectIndex) => {
                    const counted = objectIndex < visibleCounts[index];
                    return (
                      <div key={objectIndex} className="relative flex h-24 w-16 items-center justify-center rounded-2xl bg-amber-50 pt-4 shadow-inner">
                        <span className={`absolute top-1 rounded-full bg-blue-600 px-2 text-sm font-black text-white transition-opacity ${counted ? "opacity-100" : "opacity-0"}`}>
                          {objectIndex + 1}
                        </span>
                        <SpriteIcon value={banana} className="h-12 w-12" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="grid min-h-9 grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-base font-black text-emerald-900 sm:gap-3 sm:text-xl" aria-live="polite">
        <span>{completedGroups > 0 ? labels[0] : ""}</span>
        <span className={completedSigns >= 1 ? "text-blue-950" : "text-transparent"}>+</span>
        <span>{completedGroups > 1 ? labels[1] : ""}</span>
        <span className={completedSigns >= 2 ? "text-blue-950" : "text-transparent"}>=</span>
        <span>{completedGroups > 2 ? labels[2] : ""}</span>
      </div>
      {completedGroups === ADDITION_EQUATION_GROUPS.length && completedSigns === 2 && (
        <p className="text-center text-4xl font-black text-emerald-800" style={NUMBER_TEXT_STYLE}>2 + 3 = 5</p>
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
}>(function BellyCounter({ start, target, counting, waiting, label, unit, lang }, ref) {
  const [visible, setVisible] = useState(counting || waiting ? start : target);

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
      return;
    }

    setVisible(start);
    const additions = Math.max(0, target - start);
    const timers = Array.from({ length: additions }, (_, index) => window.setTimeout(() => {
      const nextValue = start + index + 1;
      setVisible(nextValue);
      speakNumber(nextValue, lang);
    }, ADDITION_BANANA_TRAVEL_MS + index * ADDITION_BANANA_STAGGER_MS));
    if (target === 5 && additions > 0) {
      const finalCountDelay = ADDITION_BANANA_TRAVEL_MS + (additions - 1) * ADDITION_BANANA_STAGGER_MS;
      timers.push(window.setTimeout(() => {
        speakText(
          lang === "en" ? "Chrys eats 5 bananas in total." : "Chrys makan 5 pisang semuanya.",
          lang,
        );
      }, finalCountDelay + ADDITION_BANANA_COUNT_PAUSE_MS));
    }

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
      <div className="mt-2 flex max-w-40 flex-wrap justify-center gap-1">
        {Array.from({ length: visible }, (_, i) => (
          <span key={i} className="grid h-7 w-7 place-items-center">
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
          <h3 className="text-2xl font-black text-blue-950">{title}</h3>
          <p className="mt-2 text-lg font-black text-slate-600">{text}</p>
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
        <button onClick={onPrimary} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">
          {primaryLabel}
        </button>
      </div>
    </div>
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
        <h3 className="text-3xl font-black text-blue-950">{title}</h3>
        <p className="mt-2 text-lg font-black text-slate-700">{text}</p>
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
        <button
          onClick={() => step < totalSteps - 1 ? setStep((s) => s + 1) : onDone()}
          className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1"
        >
          {step < totalSteps - 1 ? t.next : doneLabel}
        </button>
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
          <div className="text-center text-5xl font-black text-blue-800">+</div>
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
  const [phase, setPhase] = useState<SubtractionPhase>("start");
  const left = start - takeAway;
  const intervalMs = COUNTING_STEP_MS;
  const crossed = phase === "start" ? 0 : takeAway;
  const showRemainingCount = phase === "counting" || phase === "done";
  const showCrossCount = phase !== "start";

  const finishCrossCount = useCallback(() => setPhase((current) => current === "crossing" ? "crossed" : current), []);
  const finishRemainingCount = useCallback(() => {
    setPhase((current) => current === "counting" ? "done" : current);
    onComplete?.();
  }, [onComplete]);

  const instruction = getSubtractionFlowInstruction(lang, phase, start, takeAway, left);
  const actionLabel = phase === "start"
    ? (lang === "en" ? "Tap to take away" : "Tekan untuk ambil")
    : (lang === "en" ? "Tap to count what is left" : "Tekan untuk kira yang tinggal");

  return (
    <div className="space-y-4 rounded-3xl border-2 border-amber-100 bg-amber-50 p-4">
      <div className="rounded-3xl bg-white p-3">
        <CountedObjectRow
          count={start}
          emoji={emoji}
          crossed={crossed}
          showCount={showRemainingCount}
          countRemainingOnly
          animateCrossOut={phase === "crossing"}
          showCrossCount={showCrossCount}
          intervalMs={intervalMs}
          speakCrossCount={phase === "crossing"}
          speakCount={phase === "counting" || phase === "done"}
          onCrossCountComplete={finishCrossCount}
          onCountComplete={finishRemainingCount}
          lang={lang}
        />
      </div>

      {(phase === "start" || phase === "crossed") && (
        <div className="flex justify-center">
          <button
            onClick={() => setPhase(phase === "start" ? "crossing" : "counting")}
            className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 text-xl font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1"
          >
            {actionLabel}
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

function getSubtractionFlowInstruction(lang: Lang, phase: SubtractionPhase, start: number, takeAway: number, left: number) {
  if (lang === "ms") {
    if (phase === "start") return [`Mula dengan ${start} pisang.`];
    if (phase === "crossing" || phase === "crossed") return [`Ambil ${takeAway} pisang.`];
    if (phase === "counting") return ["Kira pisang yang tinggal."];
    return [`${left} pisang tinggal.`, `Jadi, ${start} - ${takeAway} = ${left}.`];
  }
  if (phase === "start") return [`Start with ${start} bananas.`];
  if (phase === "crossing" || phase === "crossed") return [`Take away ${takeAway} bananas.`];
  if (phase === "counting") return ["Count what is left."];
  return [`${left} bananas are left.`, `So, ${start} - ${takeAway} = ${left}.`];
}

function LabeledGroup({ count, label, emoji }: { count: number; label: string; emoji: string }) {
  return (
    <div className="rounded-3xl border-2 border-yellow-100 bg-yellow-50 p-4 text-center">
      <ObjectGroup count={count} emoji={emoji} />
      <p className="mt-3 text-3xl font-black text-yellow-800">{label}</p>
    </div>
  );
}

function CountedObjectRow({ count, emoji, crossed = 0, showCount, countRemainingOnly = false, animateCrossOut = false, compact = false, showCrossCount = false, intervalMs = COUNTING_STEP_MS, speakCrossCount = false, speakCount = false, onCrossCountComplete, onCountComplete, lang = "en" }: {
  count: number;
  emoji: string;
  crossed?: number;
  showCount: boolean;
  countRemainingOnly?: boolean;
  animateCrossOut?: boolean;
  compact?: boolean;
  showCrossCount?: boolean;
  intervalMs?: number;
  speakCrossCount?: boolean;
  speakCount?: boolean;
  onCrossCountComplete?: () => void;
  onCountComplete?: () => void;
  lang?: Lang;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const stepIntervalMs = Math.max(intervalMs, COUNTING_STEP_MS);
  const remaining = count - crossed;
  const [visible, setVisible] = useState(0);
  const [visibleCrossed, setVisibleCrossed] = useState(animateCrossOut ? 0 : crossed);

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
    setVisible(0);
    if (!showCount) return;
    const max = countRemainingOnly ? remaining : count;
    const countDelay = animateCrossOut ? (crossed * stepIntervalMs) + stepIntervalMs : 0;

    if (max <= 0) {
      onCountComplete?.();
      return;
    }

    if (speakCount && !audioMuted) {
      const startAudioCount = () => {
        void speakCountingSequence(
          max,
          lang,
          stepIntervalMs,
          (value) => {
            if (!cancelled) setVisible(value);
          },
        ).then(() => {
          if (!cancelled) onCountComplete?.();
        });
      };
      const speechTimer = countDelay > 0
        ? window.setTimeout(startAudioCount, countDelay)
        : null;
      if (!speechTimer) startAudioCount();
      return () => {
        cancelled = true;
        if (speechTimer) window.clearTimeout(speechTimer);
        stopNumberAudio();
      };
    }

    if (prefersReducedMotion) {
      setVisible(max);
      onCountComplete?.();
      return;
    }

    const timers = Array.from({ length: max }, (_, i) => window.setTimeout(() => {
      if (cancelled) return;
      setVisible(i + 1);
      if (i + 1 === max) onCountComplete?.();
    }, countDelay + (stepIntervalMs * (i + 1))));
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [animateCrossOut, count, countRemainingOnly, crossed, lang, onCountComplete, prefersReducedMotion, remaining, showCount, speakCount, stepIntervalMs]);

  useEffect(() => () => stopNumberAudio(), []);

  let leftIndex = 0;
  return (
    <div className={`flex flex-wrap justify-center rounded-3xl border-2 border-slate-100 bg-white ${compact ? "gap-2 p-3" : "gap-3 p-4"}`}>
      {Array.from({ length: count }, (_, i) => {
        const gone = i < visibleCrossed;
        const willBeTaken = i < crossed;
        const shouldCount = showCount && (!countRemainingOnly || !willBeTaken);
        const label = shouldCount ? ++leftIndex : 0;
        const labelVisible = shouldCount && label <= visible;
        const isActiveCount = speakCount && labelVisible && label === visible;
        const crossLabelVisible = showCrossCount && willBeTaken && i < visibleCrossed;
        return (
          <div
            key={i}
            className={`relative flex flex-col items-center justify-center rounded-2xl shadow-inner transition-[background-color,box-shadow] duration-300 ${
              isActiveCount ? "bg-blue-50 ring-4 ring-blue-300" : "bg-amber-50"
            } ${compact ? "h-20 w-12 pt-4 text-3xl" : "h-24 w-16 pt-5 text-4xl"}`}
          >
            {crossLabelVisible ? (
              <span className={`absolute top-1 z-30 rounded-full bg-red-600 px-2 font-black text-white transition-opacity ${compact ? "text-xs" : "text-sm"}`}>
                {i + 1}
              </span>
            ) : (
              <span className={`absolute top-1 rounded-full bg-blue-600 px-2 font-black text-white transition-opacity ${compact ? "text-xs" : "text-sm"} ${labelVisible ? "opacity-100" : "opacity-0"}`}>
                {labelVisible ? label : "."}
              </span>
            )}
            <span className={`transition-all duration-300 ${gone ? "scale-95 opacity-25 grayscale brightness-125" : "opacity-100"}`}>
              <SpriteIcon value={emoji} className={compact ? "h-10 w-10" : "h-12 w-12"} />
            </span>
            {gone && <span className={`absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 font-black text-red-500 transition-opacity duration-300 ${compact ? "text-4xl" : "text-5xl"}`}>x</span>}
          </div>
        );
      })}
    </div>
  );
}

function TestMenu({ t, go }: { t: UIStrings; go: (screen: Screen) => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <section className="mb-4 rounded-[2rem] border-4 border-white/80 bg-white/90 p-5 text-center shadow-[0_8px_0_rgba(0,0,0,.16)]">
        <img src={chrysRunning} alt="Chrys ready" className="mx-auto h-32 w-32 object-contain" />
        <h2 className="text-3xl font-black text-blue-950">{t.testMode}</h2>
        <p className="mt-2 font-bold text-slate-500">{t.testHelp}</p>
      </section>
      <div className="grid gap-4">
        <MenuCard title={t.learnNumbers} subtitle="25 questions, all 0-9" icon="🔢" color="sky" onClick={() => go("testNumbers")} />
        <MenuCard title={t.learnOperations} subtitle="25 questions, 0-9 only" icon="➕" color="emerald" onClick={() => go("testOperations")} />
        <MenuCard title={t.learnReal} subtitle="25 stories with visible objects" icon="🍎" color="pink" onClick={() => go("testReal")} />
      </div>
    </main>
  );
}

function Quiz({ lang, t, title, questions, onFinish, extraAction, randomize = true, onBackToLearning, chunkSize }: {
  lang: Lang;
  t: UIStrings;
  title: string;
  questions: Question[];
  onFinish: (correct: number, total: number) => void;
  extraAction?: LessonAction;
  randomize?: boolean;
  onBackToLearning?: () => void;
  chunkSize?: number;
}) {
  const randomizedQuestions = useMemo(() => randomize ? shuffledQuestions(questions) : questions, [questions, randomize]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [showBreather, setShowBreather] = useState(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const qn = randomizedQuestions[index];
  const selected = answers[index] ?? null;
  const answered = selected !== null;
  const isCorrect = selected === qn.answer;
  const isCountQuestion = qn.visual.kind === "count";
  const isValueQuestion = qn.id.startsWith("val-");
  const groupChoiceVisual = qn.visual.kind === "groupChoices" ? qn.visual : null;
  const activePanelOwnsVisual = qn.inputMode === "buildTotal" || qn.inputMode === "takeAway";
  const activePanelHasOwnCorrection = qn.inputMode === "tapObjects" || qn.inputMode === "takeAway";
  const correct = randomizedQuestions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;

  const next = () => {
    if (index === randomizedQuestions.length - 1) onFinish(correct, randomizedQuestions.length);
    else if (chunkSize && (index + 1) % chunkSize === 0) setShowBreather(true);
    else setIndex((i) => i + 1);
  };

  const continueAfterBreather = () => {
    setShowBreather(false);
    setIndex((i) => Math.min(randomizedQuestions.length - 1, i + 1));
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
      setAnswers((current) => ({ ...current, [index]: option }));
    }
  };

  if (showBreather) {
    return (
      <main className="mx-auto w-full max-w-3xl pb-8">
        <LessonShell lang={lang} title={title} helper={`${t.score}: ${correct}/${randomizedQuestions.length}`}>
          <div className="rounded-[2rem] border-4 border-white bg-white p-6 text-center shadow-[0_8px_0_rgba(0,0,0,.16)]">
            <img src={chrysExcited} alt="Chrys cheering" className="mx-auto h-32 w-32 object-contain" />
            <h2 className="mt-2 text-3xl font-black text-emerald-800">{lang === "en" ? "Nice work!" : "Bagus!"}</h2>
            <p className="mx-auto mt-2 max-w-md text-xl font-black text-blue-950">
              {lang === "en" ? "Ready for more?" : "Sedia untuk lagi?"}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
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
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell lang={lang} title={title} helper={`${t.score}: ${correct}/${randomizedQuestions.length} - ${index + 1}/${randomizedQuestions.length}`}>
        <div className="rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_8px_0_rgba(0,0,0,.16)]">
          <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(answeredCount / randomizedQuestions.length) * 100}%` }} />
          </div>
          {(index > 0 || onBackToLearning || extraAction) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                {index > 0 && (
                  <button
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1"
                  >
                    {t.previous}
                  </button>
                )}
                {onBackToLearning && (
                  <button
                    onClick={onBackToLearning}
                    className="rounded-2xl border-2 border-blue-200 bg-white px-5 py-3 font-black text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.16)] active:translate-y-1"
                  >
                    {backToLearningLabel(lang)}
                  </button>
                )}
              </div>
              {extraAction && <SecondaryLessonButton label={extraAction.label} onClick={extraAction.onClick} variant={extraAction.variant} />}
            </div>
          )}
          <h2 className="text-center text-2xl font-black text-slate-900">{qn.text[lang]}</h2>
          {!groupChoiceVisual && !activePanelOwnsVisual && (
            <div className="my-4 rounded-3xl border-2 border-sky-100 bg-sky-50 p-3">
              <VisualDisplay visual={qn.visual} lang={lang} revealNumbers={answered && !isCorrect} />
            </div>
          )}
          {groupChoiceVisual ? (
            <GroupChoiceAnswerPanel
              visual={groupChoiceVisual}
              lang={lang}
              selected={selected}
              answered={answered}
              answer={Number(qn.answer)}
              onAnswer={(answer) => setAnswers((current) => ({ ...current, [index]: answer }))}
            />
          ) : qn.inputMode && qn.inputMode !== "choice" ? (
            <ActiveAnswerPanel
              key={qn.id}
              question={qn}
              lang={lang}
              answered={answered}
              selected={selected}
              onAnswer={(answer) => setAnswers((current) => ({ ...current, [index]: answer }))}
              onRetry={() => setAnswers((current) => {
                const nextAnswers = { ...current };
                delete nextAnswers[index];
                return nextAnswers;
              })}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {qn.options.map((option, optionIndex) => {
                const picked = selected === option;
                const right = option === qn.answer;
                const feedbackIcon = answered && right ? "✓" : answered && picked && !right ? "×" : null;
                const resultText = !answered
                  ? ""
                  : right
                    ? (lang === "en" ? ", correct answer" : ", jawapan betul")
                    : picked
                      ? (lang === "en" ? ", your answer, try again" : ", jawapan awak, cuba lagi")
                      : (lang === "en" ? ", not selected" : ", tidak dipilih");
                const optionSize = typeof option === "string" ? "text-2xl sm:text-3xl" : "text-4xl";
                const stateClass = !answered
                  ? "border-slate-200 bg-white text-slate-900"
                  : right
                    ? "border-emerald-600 bg-emerald-500 text-white"
                    : picked
                      ? "border-orange-500 bg-orange-400 text-white"
                      : "border-slate-100 bg-slate-50 text-slate-300";
                return (
                  <button
                    key={String(option)}
                    ref={(element) => {
                      optionRefs.current[optionIndex] = element;
                    }}
                    disabled={answered}
                    aria-label={`${lang === "en" ? "Answer" : "Jawapan"} ${option}${resultText}`}
                    onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                    onKeyDown={(event) => handleOptionKeyDown(event, optionIndex, option)}
                    className={`relative min-h-20 rounded-3xl border-2 px-2 font-black shadow-[0_5px_0_rgba(0,0,0,.14)] ${optionSize} ${stateClass}`}
                    style={typeof option === "number" ? NUMBER_TEXT_STYLE : undefined}
                  >
                    <span className="inline-block pr-8">{option}</span>
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
          {answered && activePanelHasOwnCorrection ? (
            <div className="mt-5 flex gap-3">
              <button onClick={next} className="flex-[2] rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1">
                {index === randomizedQuestions.length - 1 ? t.finish : t.nextQuestion}
              </button>
            </div>
          ) : answered && (
            <div className="mt-5 rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <img src={isCorrect ? chrysExcited : chrysThinking} alt="Chrys feedback" className="h-20 w-20 object-contain" />
                <div>
                  <p className={`text-xl font-black ${isCorrect ? "text-emerald-700" : "text-orange-700"}`}>
                    {isCorrect
                      ? (isValueQuestion ? (lang === "en" ? "Great job! Count with Chrys." : "Bagus! Kira dengan Chrys.") : (isCountQuestion ? (lang === "en" ? `Great job! It is ${qn.answer}.` : `Bagus! Ini ${qn.answer}.`) : t.greatJob))
                      : (isCountQuestion ? (lang === "en" ? "Good try. Let's count." : "Cubaan baik. Mari kira.") : t.lookAgain)}
                  </p>
                  <p className="font-black text-slate-700">{t.yourAnswer}: {selected}</p>
                  {!isCorrect && <p className="font-black text-slate-700">{t.correctAnswer}: {qn.answer}</p>}
                  {!isCorrect && qn.visual.kind === "count" && (
                    <p className="font-black text-blue-800">{lang === "en" ? `This is ${qn.visual.count}.` : `Ini ${qn.visual.count}.`}</p>
                  )}
                  {!isCorrect && <p className="font-bold text-slate-600">{t.seeMethod}</p>}
                </div>
              </div>
              {(!isCorrect || qn.visual.kind === "subtract") && <WorkedMethod q={qn} lang={lang} />}
              <div className="mt-4 flex gap-3">
                <button onClick={next} className="flex-[2] rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1">
                  {index === randomizedQuestions.length - 1 ? t.finish : t.nextQuestion}
                </button>
              </div>
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
  answer,
  onAnswer,
}: {
  visual: Extract<Visual, { kind: "groupChoices" }>;
  lang: Lang;
  selected: number | string | null;
  answered: boolean;
  answer: number;
  onAnswer: (answer: number) => void;
}) {
  return (
    <div className="my-4 grid gap-3 md:grid-cols-3">
      {visual.groups.map((count) => {
        const picked = selected === count;
        const right = count === answer;
        const stateClass = !answered
          ? "border-blue-100 bg-white hover:border-blue-300"
          : right
            ? "border-emerald-600 bg-emerald-50"
            : picked
              ? "border-orange-500 bg-orange-50"
              : "border-slate-100 bg-slate-50 opacity-70";
        const status = !answered
          ? ""
          : right
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
            <ObjectGroup count={count} emoji={visual.emoji} numbered={answered} />
            {answered && (
              <span className={`mt-3 inline-grid h-10 w-10 place-items-center rounded-full border-2 bg-white text-2xl font-black ${right ? "border-emerald-700 text-emerald-700" : picked ? "border-orange-700 text-orange-700" : "border-slate-200 text-slate-300"}`} aria-hidden="true">
                {right ? "✓" : picked ? "×" : ""}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ActiveAnswerPanel({
  question,
  lang,
  answered,
  selected,
  onAnswer,
  onRetry,
}: {
  question: Question;
  lang: Lang;
  answered: boolean;
  selected: number | string | null;
  onAnswer: (answer: number) => void;
  onRetry: () => void;
}) {
  const [builtCount, setBuiltCount] = useState(0);
  const [selectedObjects, setSelectedObjects] = useState<number[]>([]);
  const [removedCount, setRemovedCount] = useState(0);
  const answer = Number(question.answer);
  const emoji =
    question.visual.kind === "groupMake" ? question.visual.emoji :
    question.visual.kind === "count" ? question.visual.emoji :
    question.visual.kind === "add" ? (question.visual.emoji ?? "🍌") :
    question.visual.kind === "subtract" ? (question.visual.emoji ?? "🍌") :
    "🍌";
  const selectedNumber = typeof selected === "number" ? selected : Number(selected);
  const shownCount = answered && Number.isFinite(selectedNumber) ? selectedNumber : builtCount;
  const isCorrect = answered && selectedNumber === answer;

  if (question.inputMode === "keypad") {
    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4">
        <div className="mx-auto mb-4 grid h-16 w-24 place-items-center rounded-3xl border-4 border-yellow-200 bg-yellow-50 text-4xl font-black text-blue-950">
          {answered ? selected : "?"}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {NUMBERS.map((n) => (
            <button
              key={n}
              disabled={answered}
              onClick={() => onAnswer(n)}
              className="min-h-16 rounded-2xl border-2 border-blue-100 bg-blue-50 text-3xl font-black text-blue-900 shadow-[0_4px_0_rgba(30,64,175,.16)] active:translate-y-1 disabled:opacity-60"
              style={NUMBER_TEXT_STYLE}
            >
              {n}
            </button>
          ))}
        </div>
        {answered && <ActiveResultMessage correct={isCorrect} lang={lang} answer={answer} />}
      </div>
    );
  }

  if (question.inputMode === "tapObjects") {
    const chosenCount = answered && Number.isFinite(selectedNumber) ? selectedNumber : selectedObjects.length;
    const toggleObject = (objectIndex: number) => {
      if (answered) return;
      setSelectedObjects((current) => {
        if (current.includes(objectIndex)) return current.filter((item) => item !== objectIndex);
        if (current.length >= 9) return current;
        return [...current, objectIndex];
      });
    };
    const selectionOrder = (objectIndex: number) => selectedObjects.indexOf(objectIndex) + 1;
    const checkSelection = () => onAnswer(selectedObjects.length);
    const instruction = question.visual.kind === "audioNumber"
      ? (lang === "en" ? "Tap the objects you hear. Then press Check." : "Tekan objek yang kamu dengar. Kemudian tekan Semak.")
      : answer === 0
        ? (lang === "en" ? "Select none. Then press Check." : "Pilih tiada. Kemudian tekan Semak.")
        : (lang === "en" ? `Tap ${answer} objects.` : `Tekan ${answer} objek.`);

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
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            disabled={answered}
            onClick={() => setSelectedObjects([])}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Clear" : "Padam"}
          </button>
          <button
            disabled={answered}
            onClick={checkSelection}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
        {answered && (
          <div className="mt-4 space-y-3">
            <ActiveResultMessage correct={isCorrect} lang={lang} answer={answer} />
            <div>
              {chosenCount > 0 && <CountedObjectRow count={chosenCount} emoji={emoji} showCount compact speakCount lang={lang} />}
              <CountTotalBadge count={chosenCount} lang={lang} />
            </div>
            {!isCorrect && (
              <div className="space-y-3 rounded-3xl border-2 border-blue-100 bg-blue-50 p-3">
                <p className="font-black text-blue-900">
                  {lang === "en" ? `The model has ${answer}.` : `Contoh ada ${answer}.`}
                </p>
                <div>
                  {answer > 0 ? <CountedObjectRow count={answer} emoji={emoji} showCount compact lang={lang} /> : <ObjectGroup count={0} emoji={emoji} numbered />}
                  <CountTotalBadge count={answer} lang={lang} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedObjects([]);
                    onRetry();
                  }}
                  className="rounded-2xl border-2 border-amber-300 bg-white px-5 py-3 font-black text-amber-800 shadow-[0_4px_0_rgba(180,83,9,.18)] active:translate-y-1"
                >
                  {lang === "en" ? "Try again" : "Cuba lagi"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (question.inputMode === "buildTotal" && question.visual.kind === "add") {
    const groupCounts = [question.visual.a, question.visual.b];
    const countedTotal = answered && Number.isFinite(selectedNumber) ? selectedNumber : selectedObjects.length;
    const countExistingObject = (objectIndex: number) => {
      if (answered || selectedObjects.includes(objectIndex)) return;
      const nextObjects = [...selectedObjects, objectIndex];
      setSelectedObjects(nextObjects);
      speakNumber(nextObjects.length, lang);
    };
    let objectOffset = 0;

    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
        <p className="mb-4 text-lg font-black text-slate-700">
          {lang === "en" ? "Tap each banana to count." : "Tekan setiap pisang untuk mengira."}
        </p>
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          {groupCounts.map((groupCount, groupIndex) => {
            const groupStart = objectOffset;
            objectOffset += groupCount;
            return (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && <span className="text-4xl font-black text-blue-900" aria-hidden="true">+</span>}
                <div className="rounded-3xl border-2 border-amber-100 bg-amber-50 p-4">
                  <div className="flex flex-wrap justify-center gap-3">
                    {Array.from({ length: groupCount }, (_, localIndex) => {
                      const objectIndex = groupStart + localIndex;
                      const countOrder = selectedObjects.indexOf(objectIndex) + 1;
                      const counted = countOrder > 0;
                      return (
                        <button
                          key={objectIndex}
                          type="button"
                          disabled={answered || counted}
                          onClick={() => countExistingObject(objectIndex)}
                          aria-pressed={counted}
                          aria-label={lang === "en"
                            ? `Banana ${objectIndex + 1}${counted ? `, counted ${countOrder}` : ""}`
                            : `Pisang ${objectIndex + 1}${counted ? `, dikira ${countOrder}` : ""}`}
                          className={`relative grid h-24 w-16 place-items-center rounded-2xl border-2 pt-4 shadow-inner active:translate-y-1 disabled:opacity-100 ${counted ? "border-blue-600 bg-blue-50" : "border-amber-100 bg-white"}`}
                        >
                          {counted && (
                            <span className="absolute top-1 rounded-full bg-blue-600 px-2 text-sm font-black text-white">
                              {countOrder}
                            </span>
                          )}
                          <SpriteIcon value={emoji} className="h-12 w-12" />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xl font-black text-amber-900">
                    {groupCount} {lang === "en" ? (groupCount === 1 ? "banana" : "bananas") : "pisang"}
                  </p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        {answered && <CountTotalBadge count={countedTotal} lang={lang} />}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={answered || selectedObjects.length === 0}
            onClick={() => setSelectedObjects([])}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Clear" : "Padam"}
          </button>
          <button
            type="button"
            disabled={answered}
            onClick={() => onAnswer(selectedObjects.length)}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
        {answered && (
          <div className="space-y-3">
            <ActiveResultMessage correct={isCorrect} lang={lang} answer={answer} />
            {!isCorrect && (
              <button
                type="button"
                onClick={() => {
                  setSelectedObjects([]);
                  onRetry();
                }}
                className="rounded-2xl border-2 border-amber-300 bg-white px-5 py-3 font-black text-amber-800 shadow-[0_4px_0_rgba(180,83,9,.18)] active:translate-y-1"
              >
                {lang === "en" ? "Try again" : "Cuba lagi"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (question.inputMode === "takeAway" && question.visual.kind === "subtract") {
    const startCount = question.visual.a;
    const takeAwayTarget = question.visual.b;
    const shownRemoved = answered ? startCount - selectedNumber : removedCount;
    const leftCount = startCount - shownRemoved;

    return (
      <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
        <p className="mb-3 text-lg font-black text-slate-700">
          {lang === "en"
            ? `Start with ${startCount} bananas.`
            : `Mula dengan ${startCount} pisang.`}
        </p>
        <CountedObjectRow count={startCount} emoji={emoji} crossed={shownRemoved} showCount={answered} countRemainingOnly showCrossCount={shownRemoved > 0} lang={lang} />
        {answered && <CountTotalBadge count={selectedNumber} lang={lang} />}
        <p className="mt-4 text-lg font-black text-blue-800">
          {lang === "en" ? "Tap to take away." : "Ketik untuk buang."}
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
            {lang === "en" ? "Remove one" : "Buang satu"}
          </button>
          <button
            disabled={answered}
            onClick={() => onAnswer(leftCount)}
            className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
          >
            {lang === "en" ? "Check" : "Semak"}
          </button>
        </div>
        {answered && (
          <div className="space-y-3">
            <ActiveResultMessage correct={isCorrect} lang={lang} answer={answer} />
            {!isCorrect && (
              <div className="space-y-3 rounded-3xl border-2 border-blue-100 bg-blue-50 p-3">
                <p className="font-black text-blue-900">
                  {lang === "en"
                    ? `Take away ${takeAwayTarget}. ${answer} are left.`
                    : `Buang ${takeAwayTarget}. Tinggal ${answer}.`}
                </p>
                <div>
                  <CountedObjectRow count={startCount} emoji={emoji} crossed={takeAwayTarget} showCount countRemainingOnly showCrossCount compact lang={lang} />
                  <CountTotalBadge count={answer} lang={lang} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRemovedCount(0);
                    onRetry();
                  }}
                  className="rounded-2xl border-2 border-amber-300 bg-white px-5 py-3 font-black text-amber-800 shadow-[0_4px_0_rgba(180,83,9,.18)] active:translate-y-1"
                >
                  {lang === "en" ? "Try again" : "Cuba lagi"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const instruction = question.inputMode === "buildTotal"
    ? (lang === "en" ? `Tap to make ${answer}.` : `Tekan untuk bina ${answer}.`)
    : (lang === "en" ? `Tap to make a group of ${answer}.` : `Tekan untuk bina kumpulan ${answer}.`);

  return (
    <div className="rounded-3xl border-2 border-blue-100 bg-white p-4 text-center">
      <p className="mb-3 text-lg font-black text-slate-700">{instruction}</p>
      <ObjectGroup count={shownCount} emoji={emoji} numbered={answered} />
      {answered && <CountTotalBadge count={shownCount} lang={lang} />}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          disabled={answered || builtCount <= 0}
          onClick={() => setBuiltCount((count) => Math.max(0, count - 1))}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-2xl font-black text-slate-600 shadow-[0_4px_0_rgba(0,0,0,.12)] active:translate-y-1 disabled:opacity-40"
        >
          -
        </button>
        <button
          disabled={answered || builtCount >= 9}
          onClick={() => setBuiltCount((count) => Math.min(9, count + 1))}
          className="rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-8 py-3 text-2xl font-black text-white shadow-[0_5px_0_#047857] active:translate-y-1 disabled:opacity-40"
        >
          {lang === "en" ? "Tap banana" : "Tekan pisang"}
        </button>
        <button
          disabled={answered}
          onClick={() => onAnswer(builtCount)}
          className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-xl font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:opacity-40"
        >
          {lang === "en" ? "Check" : "Semak"}
        </button>
      </div>
      {answered && (
        <div className="space-y-3">
          <ActiveResultMessage correct={isCorrect} lang={lang} answer={answer} />
          {!isCorrect && (
            <button
              type="button"
              onClick={() => {
                setBuiltCount(0);
                onRetry();
              }}
              className="rounded-2xl border-2 border-amber-300 bg-white px-5 py-3 font-black text-amber-800 shadow-[0_4px_0_rgba(180,83,9,.18)] active:translate-y-1"
            >
              {lang === "en" ? "Try again" : "Cuba lagi"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActiveResultMessage({ correct, lang, answer }: { correct: boolean; lang: Lang; answer: number }) {
  return (
    <p className={`mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-lg font-black ${correct ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
      <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm">
        {correct ? "\u2713" : "\u00d7"}
      </span>
      <span>
        {correct
          ? (lang === "en" ? `Great job. This is ${answer}.` : `Bagus. Ini ${answer}.`)
          : (lang === "en" ? "Good try. Let's count again." : "Cubaan baik. Mari kira lagi.")}
      </span>
    </p>
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
    : { minus: "minus", plus: "plus", equals: "equals to", times: "times" };
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
    if (parent && !parent.closest("button, [aria-hidden='true'], [hidden], [data-narration-ignore='true']")) {
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

function LessonShell({ lang, title, helper, children }: { lang: Lang; title: string; helper?: string; children: React.ReactNode }) {
  const soundEnabled = React.useContext(AudioEnabledContext);
  const contentRef = useRef<HTMLElement>(null);
  const narrationRunRef = useRef(0);
  const [narrating, setNarrating] = useState(false);

  const stopLessonNarration = useCallback(() => {
    narrationRunRef.current += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    clearLessonSpeechHighlight();
    setNarrating(false);
  }, []);

  useEffect(() => {
    if (!soundEnabled) stopLessonNarration();
  }, [soundEnabled, stopLessonNarration]);

  useEffect(() => () => {
    narrationRunRef.current += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    clearLessonSpeechHighlight();
  }, []);

  const startLessonNarration = () => {
    if (!soundEnabled || !contentRef.current || !("speechSynthesis" in window)) return;
    const tokens = collectLessonNarrationTokens(contentRef.current, lang);
    if (tokens.length === 0) return;

    stopNumberAudio();
    const runId = ++narrationRunRef.current;
    const utterance = new SpeechSynthesisUtterance(tokens.map((token) => token.spoken).join(" "));
    utterance.lang = lang === "ms" ? "ms-MY" : "en-US";
    utterance.rate = SPEECH_RATE;
    setNarrating(true);
    showLessonSpeechHighlight(contentRef.current, lang, 0);

    const finish = () => {
      if (narrationRunRef.current !== runId) return;
      clearLessonSpeechHighlight();
      setNarrating(false);
    };

    utterance.onstart = () => {
      if (narrationRunRef.current === runId && contentRef.current) {
        showLessonSpeechHighlight(contentRef.current, lang, 0);
      }
    };
    utterance.onboundary = (event) => {
      if (narrationRunRef.current !== runId) return;
      let tokenIndex = 0;
      for (let index = 1; index < tokens.length; index += 1) {
        if (tokens[index].spokenStart > event.charIndex) break;
        tokenIndex = index;
      }
      if (contentRef.current) showLessonSpeechHighlight(contentRef.current, lang, tokenIndex);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section
      ref={contentRef}
      className="lesson-panel rounded-[2rem] p-4 md:p-6"
      onClickCapture={(event) => {
        const target = event.target as Element;
        if (narrating && target.closest("button") && !target.closest("[data-lesson-narration-control='true']")) {
          stopLessonNarration();
        }
      }}
    >
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-black leading-tight text-blue-950 md:text-4xl">{title}</h2>
        {helper && <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-snug text-slate-600 md:text-base">{helper}</p>}
      </div>
      {soundEnabled && (
        <div className="mb-5 flex justify-center" data-lesson-narration-control="true" data-narration-ignore="true">
          <button
            type="button"
            onClick={startLessonNarration}
            disabled={narrating}
            className="relative rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-3 font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1 disabled:cursor-wait disabled:opacity-70"
          >
            {narrating
              ? (lang === "en" ? "Playing lesson..." : "Pelajaran dimainkan...")
              : (lang === "en" ? "Tap to start lesson" : "Ketik untuk mula belajar")}
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
      <p className="whitespace-pre-line text-lg font-black leading-snug text-slate-800">{text}</p>
      <button
        type="button"
        onClick={() => speakText(text, lang)}
        aria-label={audioMuted ? (lang === "en" ? "Sound is muted" : "Bunyi disenyapkan") : (lang === "en" ? "Hear this teaching text" : "Dengar teks pengajaran ini")}
        className={`ml-auto grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-blue-200 bg-white text-blue-700 shadow-[0_4px_0_rgba(30,64,175,.16)] active:translate-y-1 ${audioMuted ? "opacity-45" : ""}`}
      >
        <SpeakerIcon />
      </button>
    </div>
  );
}

function AudioHearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center rounded-[2rem] border-4 border-blue-100 bg-white/85 p-5 shadow-inner">
      <button
        onClick={onClick}
        aria-label={label}
        className="relative grid h-24 w-24 place-items-center rounded-3xl border-4 border-blue-200 bg-blue-600 text-white shadow-[0_7px_0_#1e3a8a] active:translate-y-1"
      >
        <SpeakerIcon />
        <span className="pointer-events-none absolute -right-3 -top-4 rotate-45 rounded-full border-2 border-yellow-300 bg-yellow-100 px-3 py-2 shadow-md" aria-hidden="true">
          <PointerIcon />
        </span>
      </button>
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
        <div className={`${large ? "text-8xl" : "text-5xl"} font-black leading-none`} style={NUMBER_TEXT_STYLE}>{value}</div>
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
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {word.split("").map((letter, index) => (
          <span key={`${letter}-${index}`} className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-blue-100 bg-white text-3xl font-black text-blue-900 shadow-inner">
            {letter}
          </span>
        ))}
      </div>
      <p className="mt-4 text-lg font-black text-slate-600">{word.split("").join(" - ")}</p>
    </div>
  );
}

function ObjectGroup({ count, emoji, numbered = false, crossed = 0 }: { count: number; emoji: string; numbered?: boolean; crossed?: number }) {
  if (count === 0) {
    return <div className="mx-auto rounded-3xl border-4 border-dashed border-slate-200 bg-white p-8 text-center text-2xl font-black text-slate-400">{numbered ? "0" : "empty"}</div>;
  }
  return (
    <div className="flex flex-wrap justify-center gap-3 rounded-3xl border-2 border-slate-100 bg-white p-4">
      {Array.from({ length: count }, (_, i) => {
        const gone = i < crossed;
        return (
          <div key={i} className="relative grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-4xl shadow-inner">
            <span className={gone ? "opacity-25" : ""}>
              <SpriteIcon value={emoji} className="h-12 w-12" />
            </span>
            {numbered && <span className="absolute -top-2 rounded-full bg-blue-600 px-2 text-xs font-black text-white">{i + 1}</span>}
            {gone && <span className="absolute text-5xl font-black text-red-500">×</span>}
          </div>
        );
      })}
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
}: {
  count: number;
  emoji: string;
  container: ContainerKind;
  numbered?: boolean;
  hideEmptyLabel?: boolean;
  label?: string;
}) {
  const image = container === "basket" ? BASKET_SPRITE : trayPhoto;
  const alt = container === "basket" ? "basket" : "tray";
  const positions = [
    ["left-[23%]", "top-[38%]"],
    ["left-[40%]", "top-[30%]"],
    ["left-[57%]", "top-[38%]"],
    ["left-[31%]", "top-[52%]"],
    ["left-[50%]", "top-[50%]"],
    ["left-[66%]", "top-[54%]"],
    ["left-[17%]", "top-[58%]"],
    ["left-[42%]", "top-[62%]"],
    ["left-[58%]", "top-[66%]"],
  ];

  return (
    <div className="mx-auto max-w-xl rounded-3xl border-2 border-amber-100 bg-white p-4">
      <div className="relative mx-auto aspect-[4/3] max-h-80 overflow-hidden rounded-3xl bg-amber-50">
        <img src={image} alt={alt} className="absolute inset-0 h-full w-full object-contain" />
        {Array.from({ length: count }, (_, i) => {
          const [x, y] = positions[i % positions.length];
          return (
            <div
              key={i}
              className={`absolute ${x} ${y} grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white/80 text-4xl shadow-md`}
            >
              <SpriteIcon value={emoji} className="h-11 w-11" />
              {numbered && <span className="absolute -top-2 rounded-full bg-blue-600 px-2 text-xs font-black text-white">{i + 1}</span>}
            </div>
          );
        })}
      </div>
      {label && <p className="mt-3 text-center text-xl font-black text-amber-900">{label}</p>}
      {count === 0 && !hideEmptyLabel && (
        <div className="mx-auto mt-3 max-w-xs rounded-2xl border-2 border-dashed border-slate-200 bg-white/85 px-4 py-3 text-center text-2xl font-black text-slate-400">
          {numbered ? "0" : "empty"}
        </div>
      )}
    </div>
  );
}

function NumberLine({ marked }: { marked: number }) {
  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-blue-100 bg-white p-4">
      <div className="mx-auto flex min-w-[560px] items-end justify-center">
        {NUMBERS.map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center">
            <div className={`mb-2 grid h-10 w-10 place-items-center rounded-full border-2 font-black ${n === marked ? "border-yellow-600 bg-yellow-400 text-yellow-950" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{n}</div>
            <div className={`h-5 w-1 ${n === marked ? "bg-yellow-500" : "bg-slate-300"}`} />
            <div className="h-2 w-full bg-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberLineSequence({ nums, marked, arrow = "right" }: { nums: number[]; marked: number; arrow?: "left" | "right" }) {
  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-blue-100 bg-white p-4">
      <div className="mx-auto flex min-w-[560px] items-center justify-center gap-2">
        {nums.map((n, i) => (
          <React.Fragment key={`${n}-${i}`}>
            {i > 0 && <span className="text-2xl font-black text-emerald-700">{arrow === "right" ? "\u2192" : "\u2190"}</span>}
            <div className="flex flex-1 flex-col items-center">
              <div className={`mb-2 grid h-10 w-10 place-items-center rounded-full border-2 font-black ${n === marked ? "border-yellow-600 bg-yellow-400 text-yellow-950" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{n}</div>
              <div className={`h-5 w-1 ${n === marked ? "bg-yellow-500" : "bg-slate-300"}`} />
              <div className={`h-2 w-full ${n === marked ? "bg-yellow-400" : "bg-slate-300"}`} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function NumberValueCompare({ a, b, lang }: { a: number; b: number; lang: Lang }) {
  const banana = "🍌";
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledGroup count={a} label={String(a)} emoji={banana} />
        <LabeledGroup count={b} label={String(b)} emoji={banana} />
      </div>
      <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4 text-center text-xl font-black text-emerald-900">
        <p>{lang === "en" ? `${bigger} has more.` : `${bigger} ada lebih banyak.`}</p>
        <p>{lang === "en" ? `${smaller} has less.` : `${smaller} ada lebih sedikit.`}</p>
      </div>
    </div>
  );
}

function SameValueVisual({ count, emojis, lang, showSummary = true }: { count: number; emojis: string[]; lang: Lang; showSummary?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {emojis.map((emoji, index) => (
          <div key={`${emoji}-${index}`} className="rounded-3xl border-2 border-emerald-100 bg-white p-3 text-center shadow-inner">
            <ObjectGroup count={count} emoji={emoji} />
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
      <div className={`mx-auto flex min-h-36 max-w-44 flex-wrap justify-center gap-2 rounded-3xl bg-blue-50 p-3 ${layout === "row" ? "items-center" : "items-start"}`}>
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
          <ObjectGroup count={a} emoji={emojiA} />
          <p className="mt-2 text-xl font-black text-blue-900">{lang === "en" ? "Group A" : "Kumpulan A"}</p>
        </div>
        <div className="rounded-3xl border-2 border-blue-100 bg-white p-3 text-center shadow-inner">
          <ObjectGroup count={b} emoji={emojiB} />
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

function TapRevealOrder({ nums, lang, mode }: { nums: number[]; lang: Lang; mode: "up" | "down" }) {
  const [visible, setVisible] = useState(1);
  const banana = "🍌";
  const done = visible >= nums.length;
  const shown = nums.slice(0, visible);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((n) => (
          <div key={n} className="rounded-3xl border-2 border-emerald-100 bg-white p-3 text-center shadow-inner">
            <p className="mb-2 text-4xl font-black text-blue-950">{n}</p>
            <ObjectGroup count={n} emoji={banana} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setVisible((v) => Math.min(nums.length, v + 1))}
          disabled={done}
          className="rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#047857] disabled:opacity-50"
        >
          {done ? (lang === "en" ? "Done" : "Selesai") : (lang === "en" ? "Tap me" : "Tekan saya")}
        </button>
        <p className="text-lg font-black text-slate-700">
          {mode === "up"
            ? (lang === "en" ? "The numbers get bigger." : "Nombor makin besar.")
            : (lang === "en" ? "The numbers get smaller." : "Nombor makin kecil.")}
        </p>
      </div>
    </div>
  );
}

function TapRevealSequence({ lang }: { lang: Lang }) {
  const [index, setIndex] = useState(0);
  const marked = NUMBERS[index] ?? 9;
  const done = index >= NUMBERS.length - 1;
  return (
    <div className="space-y-4">
      <NumberLineSequence nums={NUMBERS} marked={marked} arrow="right" />
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
        <button
          onClick={() => setIndex((value) => Math.min(NUMBERS.length - 1, value + 1))}
          disabled={done}
          className="rounded-2xl border-2 border-emerald-700 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#047857] disabled:opacity-50"
        >
          {done ? (lang === "en" ? "Done" : "Selesai") : (lang === "en" ? "Tap to continue" : "Tekan untuk terus")}
        </button>
        <p className="text-lg font-black text-emerald-900">{lang === "en" ? `Now look at ${marked}.` : `Sekarang lihat ${marked}.`}</p>
      </div>
    </div>
  );
}

function MissingNumberTeaching({ nums, answer, lang }: { nums: Array<number | "?">; answer: number; lang: Lang }) {
  const [step, setStep] = useState(0);
  const missingIndex = nums.findIndex((n) => n === "?");
  const before = nums[missingIndex - 1];
  const after = nums[missingIndex + 1];
  const visibleNums = step >= 3 ? nums.map((n) => n === "?" ? answer : n) : nums;
  const messages = lang === "en"
    ? [
      "Look at the blank.",
      typeof before === "number" ? `${answer} comes after ${before}.` : `The answer is ${answer}.`,
      typeof after === "number" ? `${answer} comes before ${after}.` : `The answer is ${answer}.`,
      `So, ? is ${answer}.`,
    ]
    : [
      "Lihat ruang kosong.",
      typeof before === "number" ? `${answer} selepas ${before}.` : `Jawapan ialah ${answer}.`,
      typeof after === "number" ? `${answer} sebelum ${after}.` : `Jawapan ialah ${answer}.`,
      `Jadi, ? ialah ${answer}.`,
    ];
  const done = step >= messages.length - 1;
  return (
    <div className="space-y-4">
      <MissingNumberLine nums={visibleNums} />
      <div className="rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
        <p className="text-2xl font-black text-yellow-950">{messages[step]}</p>
        <button
          onClick={() => setStep((value) => Math.min(messages.length - 1, value + 1))}
          disabled={done}
          className="mt-3 rounded-2xl border-2 border-yellow-600 bg-yellow-400 px-6 py-3 font-black text-yellow-950 shadow-[0_5px_0_#a86000] disabled:opacity-50"
        >
          {done ? (lang === "en" ? "Done" : "Selesai") : (lang === "en" ? "Tap to find it" : "Tekan untuk cari")}
        </button>
      </div>
    </div>
  );
}

function MissingNumberPlacementActivity({ lang }: { lang: Lang }) {
  const answer = 3;
  const choices = [2, 3, 5];
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = checked && selected === answer;

  const choose = (value: number) => {
    setSelected(value);
    setChecked(false);
  };

  return (
    <div className="space-y-4 rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
      <NumberLineSequence nums={NUMBERS} marked={selected ?? -1} arrow="right" />
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border-2 border-white bg-white p-3">
        {[0, 1, 2, "?", 4, 5].map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && <span className="text-2xl font-black text-blue-300">{"\u2192"}</span>}
            <span
              className={`grid h-14 min-w-14 place-items-center rounded-2xl border-2 px-4 text-2xl font-black ${
                item === "?"
                  ? "border-dashed border-yellow-400 bg-yellow-50 text-yellow-900"
                  : "border-blue-100 bg-blue-50 text-blue-950"
              }`}
              style={typeof item === "number" ? NUMBER_TEXT_STYLE : undefined}
            >
              {item === "?" ? (selected ?? "?") : item}
            </span>
          </React.Fragment>
        ))}
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
            style={NUMBER_TEXT_STYLE}
          >
            {choice}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          disabled={selected === null}
          onClick={() => setChecked(true)}
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
              ? (lang === "en" ? "Great job. 3 is missing." : "Bagus. 3 yang hilang.")
              : (lang === "en" ? "Good try. Let's look again." : "Cubaan baik. Mari lihat lagi.")}
          </p>
          <div className="mt-3 grid gap-2 text-base font-black text-slate-700">
            <p>{lang === "en" ? "3 comes after 2." : "3 selepas 2."}</p>
            <p>{lang === "en" ? "3 comes before 4." : "3 sebelum 4."}</p>
            <p>{lang === "en" ? "So, ? is 3." : "Jadi, ? ialah 3."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MissingNumberLine({ nums }: { nums: Array<number | "?"> }) {
  return (
    <div className="rounded-3xl border-2 border-blue-100 bg-white p-4">
      <div className="mx-auto flex max-w-2xl items-end justify-center">
        {nums.map((n, i) => {
          const missing = n === "?";
          return (
            <div key={`${n}-${i}`} className="flex min-w-14 flex-1 flex-col items-center sm:min-w-20">
              <div
                className={`mb-3 grid h-16 w-16 place-items-center rounded-3xl border-2 text-3xl font-black shadow-inner sm:h-20 sm:w-20 sm:text-4xl ${
                  missing
                    ? "border-yellow-500 bg-yellow-50 text-yellow-800"
                    : "border-blue-100 bg-blue-50 text-blue-900"
                }`}
              >
                {n}
              </div>
              <div className={`h-6 w-1 rounded-t-full ${missing ? "bg-yellow-500" : "bg-blue-200"}`} />
              <div className={`h-2 w-full ${missing ? "bg-yellow-400" : "bg-blue-200"}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SequencingExample({ nums, arrow }: { nums: number[]; arrow: "left" | "right" }) {
  return (
    <div className="space-y-4">
      <NumberLine marked={-1} />
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
        {nums.map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && <span className="text-2xl font-black text-emerald-700">{arrow === "right" ? "\u2192" : "\u2190"}</span>}
            <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-emerald-200 bg-white text-2xl font-black text-blue-950">{n}</span>
          </React.Fragment>
        ))}
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

function TracePad({ value, t, lang, onTraced }: { value: number; t: UIStrings; lang: Lang; onTraced: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [confirmed, setConfirmed] = useState(false);

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
    const ctx = canvasRef.current?.getContext("2d");
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
    window.setTimeout(onTraced, 4200);
  };

  return (
    <div className="mx-auto w-full max-w-[27rem] rounded-3xl border-2 border-blue-100 bg-white p-4">
      <h3 className="mb-2 text-center text-2xl font-black text-blue-950">{lang === "en" ? `Trace ${value}` : `Surih ${value}`}</h3>
      <p className="mb-3 text-center text-sm font-bold text-slate-500">
        {lang === "en" ? "Follow the big number guide on the screen." : "Ikut panduan nombor besar pada skrin."}
      </p>
      {confirmed && (
        <p className="mb-2 rounded-2xl bg-emerald-50 px-3 py-2 text-center text-sm font-black text-emerald-800">
          {lang === "en" ? "Watch the correct number shape slowly." : "Lihat bentuk nombor yang betul perlahan-lahan."}
        </p>
      )}
      <div className="relative h-72 rounded-3xl border-2 border-sky-100 bg-sky-50">
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center text-[12rem] font-black leading-none text-blue-200/45"
          style={NUMBER_TEXT_STYLE}
        >
          {value}
        </div>
        {confirmed && (
          <div
            className="trace-model-zoom trace-confirmed-number pointer-events-none absolute inset-0 z-10 grid place-items-center text-[12rem] font-black leading-none text-blue-950"
            aria-hidden="true"
            style={NUMBER_TEXT_STYLE}
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
      <div className="mt-3 flex gap-2">
        <button onClick={clear} className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-2 font-black text-slate-500">{t.clear}</button>
        <button onClick={confirmTrace} className={`flex-1 rounded-2xl border-2 py-2 font-black text-white ${confirmed ? "border-emerald-700 bg-emerald-600" : "border-emerald-600 bg-emerald-500"}`}>
          {confirmed ? (lang === "en" ? "Done!" : "Selesai!") : t.traced}
        </button>
      </div>
    </div>
  );
}

function WriteNumberPad({ value, t, lang }: { value: number; t: UIStrings; lang: Lang }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    setHasDrawn(false);
    setShowModel(false);
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
  }, [value]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    setHasDrawn(true);
    setMatched(false);
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    setHasDrawn(true);
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
    setHasDrawn(false);
    setShowModel(false);
    setMatched(false);
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
    <div className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-amber-100 bg-white p-4">
      <h3 className="mb-2 text-center text-2xl font-black text-blue-950">{lang === "en" ? `Write ${value} yourself` : `Tulis ${value} sendiri`}</h3>
      <p className="mb-3 text-center text-sm font-bold text-slate-500">
        {lang === "en" ? "Try without the tracing guide." : "Cuba tanpa panduan surih."}
      </p>
      <div className={`grid gap-4 ${showModel ? "md:grid-cols-[1fr_auto]" : ""}`}>
        <div>
          <p className="mb-2 text-center text-sm font-black text-amber-900">{lang === "en" ? "Your number" : "Nombor awak"}</p>
          <div className="relative h-72 rounded-3xl border-2 border-amber-100 bg-amber-50">
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
        {showModel && (
          <div className="rounded-3xl border-4 border-blue-100 bg-blue-50 p-4 text-center md:w-56">
            <p className="mb-2 text-sm font-black text-blue-900">{lang === "en" ? "Look at this model" : "Lihat contoh ini"}</p>
            <div className="mx-auto grid h-40 w-40 place-items-center rounded-[2rem] border-4 border-blue-200 bg-white text-8xl font-black leading-none text-blue-950 shadow-inner" style={NUMBER_TEXT_STYLE}>
              {value}
            </div>
            <p className="mt-3 text-base font-black leading-snug text-blue-950">
              {lang === "en" ? `This is ${value}. Does yours look like this?` : `Ini ${value}. Sama tak dengan awak?`}
            </p>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={clear} className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-2 font-black text-slate-500">{t.clear}</button>
        <button
          onClick={checkAnswer}
          disabled={!hasDrawn}
          className="flex-[1.4] rounded-2xl border-2 border-blue-700 bg-blue-600 px-4 py-2 font-black text-white shadow-[0_4px_0_#1e3a8a] active:translate-y-1 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          {lang === "en" ? "Check my answer" : "Semak jawapan saya"}
        </button>
        <button
          onClick={() => speakNumber(value, lang)}
          aria-label={lang === "en" ? `Hear ${WORDS.en[value]}` : `Dengar ${WORDS.ms[value]}`}
          className="grid flex-1 place-items-center rounded-2xl border-2 border-blue-700 bg-blue-600 py-2 font-black text-white"
        >
          <SpeakerIcon />
        </button>
      </div>
      {showModel && (
        <div className="mt-4 rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
          {matched ? (
            <div className="flex items-center gap-3">
              <img src={chrysExcited} alt="Chrys excited" className="h-20 w-20 object-contain" />
              <p className="text-lg font-black text-emerald-800">
                {lang === "en" ? "Nice checking. You matched it!" : "Bagus semak. Awak padankan!"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <p className="text-lg font-black text-emerald-900">
                  {lang === "en" ? "Compare your number with the model." : "Bandingkan nombor awak dengan contoh."}
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
      <p className="mb-3 text-sm font-bold text-slate-500">{count === 0 ? (lang === "en" ? "For zero, draw nothing in the box." : "Untuk sifar, jangan lukis apa-apa dalam kotak.") : (lang === "en" ? `Draw ${count} dots or bananas on paper.` : `Lukis ${count} titik atau pisang di kertas.`)}</p>
      <ObjectGroup count={count} emoji="●" numbered />
    </div>
  );
}

function VisualDisplay({ visual, lang = "en", revealNumbers = true }: { visual: Visual; lang?: Lang; revealNumbers?: boolean }) {
  if (visual.kind === "count") {
    if (visual.container) {
      return <ContainerScene count={visual.count} emoji={visual.emoji} container={visual.container} numbered={revealNumbers} />;
    }
    return <ObjectGroup count={visual.count} emoji={visual.emoji} numbered={revealNumbers} />;
  }
  if (visual.kind === "number") return <NumberTile value={visual.value} lang={lang} showWord={false} />;
  if (visual.kind === "word") {
    return (
      <div className="mx-auto max-w-sm rounded-[2rem] border-4 border-yellow-300 bg-yellow-50 p-6 text-center">
        <p className="text-5xl font-black text-blue-950">{WORDS[lang][visual.value]}</p>
      </div>
    );
  }
  if (visual.kind === "audioNumber") {
    return (
      <AudioHearButton label={lang === "en" ? "Hear it" : "Dengar"} onClick={() => speakNumber(visual.value, lang)} />
    );
  }
  if (visual.kind === "groupObserve" || visual.kind === "groupMake") {
    return <GroupingTray label={lang === "en" ? "Group box" : "Kotak kumpulan"} count={visual.count} emoji={visual.emoji} counted={revealNumbers} lang={lang} />;
  }
  if (visual.kind === "groupChoices") {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {visual.groups.map((count) => (
          <div key={count} className="rounded-3xl border-2 border-blue-100 bg-white p-3 text-center">
            <ObjectGroup count={count} emoji={visual.emoji} numbered={revealNumbers} />
          </div>
        ))}
      </div>
    );
  }
  if (visual.kind === "groupTwo") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <GroupingTray label={lang === "en" ? "Group 1" : "Kumpulan 1"} count={visual.a} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
        <GroupingTray label={lang === "en" ? "Group 2" : "Kumpulan 2"} count={visual.b} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
      </div>
    );
  }
  if (visual.kind === "groupCompare") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <GroupingTray label="Group A" count={visual.a} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
        <GroupingTray label="Group B" count={visual.b} emoji={visual.emoji} counted={revealNumbers} lang={lang} />
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
        <ObjectGroup count={visual.value} emoji={visual.emoji} numbered={revealNumbers} />
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
        <NumberLine marked={Math.max(visual.a, visual.b)} />
        <div className="grid grid-cols-2 gap-3">
          <ObjectGroup count={visual.a} emoji="🍌" />
          <ObjectGroup count={visual.b} emoji="🍌" />
        </div>
      </div>
    );
  }
  if (visual.kind === "add") {
    const emoji = visual.emoji ?? "🍌";
    if (visual.container) {
      return (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <ContainerScene count={visual.a} emoji={emoji} container={visual.container} numbered={revealNumbers} />
            <span className="text-center text-4xl font-black text-blue-700">+</span>
            <ObjectGroup count={visual.b} emoji={emoji} numbered={revealNumbers} />
          </div>
          <p className="text-center text-3xl font-black text-slate-400">= ?</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <ObjectGroup count={visual.a} emoji={emoji} numbered={revealNumbers} />
          <span className="text-center text-4xl font-black text-blue-700">+</span>
          <ObjectGroup count={visual.b} emoji={emoji} numbered={revealNumbers} />
        </div>
        <p className="text-center text-3xl font-black text-slate-400">= ?</p>
      </div>
    );
  }
  const emoji = visual.emoji ?? "🍌";
  return (
    <div className="space-y-3">
      <ObjectGroup count={visual.a} emoji={emoji} />
      {revealNumbers && <p className="text-center text-2xl font-black text-slate-500">{visual.a} - {visual.b} = ?</p>}
    </div>
  );
}

function WorkedMethod({ q, lang }: { q: Question; lang: Lang }) {
  const spokenSteps = q.method[lang].join(". ");
  return (
    <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-lg font-black text-emerald-900">{lang === "en" ? "How to solve it" : "Cara selesaikan"}</h4>
        <button
          type="button"
          onClick={() => speakText(spokenSteps, lang)}
          aria-label={lang === "en" ? "Hear the solution steps" : "Dengar langkah penyelesaian"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-emerald-200 bg-white text-emerald-700 shadow-[0_4px_0_rgba(4,120,87,.14)] active:translate-y-1"
        >
          <SpeakerIcon />
        </button>
      </div>
      <div className="mb-3">
        <SolutionVisual visual={q.visual} lang={lang} />
      </div>
      <ol className="space-y-2">
        {q.method[lang].map((step, i) => (
          <li key={`${i}-${step}`} className="flex gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-700">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs text-white">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SolutionVisual({ visual, lang }: { visual: Visual; lang: Lang }) {
  if (visual.kind === "count") {
    const emoji = visual.emoji ?? "🍌";
    if (visual.count === 0) {
      return visual.container
        ? <ContainerScene count={0} emoji={emoji} container={visual.container} numbered />
        : <ObjectGroup count={0} emoji={emoji} numbered />;
    }
    return (
      <div className="space-y-3">
        <CountedObjectRow count={visual.count} emoji={emoji} showCount speakCount lang={lang} />
        <CountTotalBadge count={visual.count} lang={lang} />
        <p className="text-center text-lg font-black text-emerald-800">
          {lang === "en" ? `This is ${visual.count}.` : `Ini ${visual.count}.`}
        </p>
      </div>
    );
  }
  if (visual.kind === "add") {
    const emoji = visual.emoji ?? "🍌";
    if (visual.container) {
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <ContainerScene count={visual.a} emoji={emoji} container={visual.container} numbered />
            <span className="text-center text-4xl font-black text-blue-700">+</span>
            <LabeledGroup count={visual.b} label={String(visual.b)} emoji={emoji} />
          </div>
          <p className="text-center text-lg font-black text-emerald-800">{lang === "en" ? "Put both groups together. Count all." : "Gabungkan dua kumpulan. Kira semua."}</p>
          <ContainerScene count={visual.a + visual.b} emoji={emoji} container={visual.container} numbered />
          <div className="rounded-3xl border-2 border-emerald-200 bg-white p-3 text-center text-3xl font-black text-emerald-800">
            {visual.a} + {visual.b} = {visual.a + visual.b}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <LabeledGroup count={visual.a} label={String(visual.a)} emoji={emoji} />
          <span className="text-center text-4xl font-black text-blue-700">+</span>
          <LabeledGroup count={visual.b} label={String(visual.b)} emoji={emoji} />
        </div>
        <p className="text-center text-lg font-black text-emerald-800">{lang === "en" ? "Join the groups. Count all." : "Gabungkan kumpulan. Kira semua."}</p>
        <CountedObjectRow count={visual.a + visual.b} emoji={emoji} showCount speakCount lang={lang} />
        <CountTotalBadge count={visual.a + visual.b} lang={lang} />
        <div className="rounded-3xl border-2 border-emerald-200 bg-white p-3 text-center text-3xl font-black text-emerald-800">
          {visual.a} + {visual.b} = {visual.a + visual.b}
        </div>
      </div>
    );
  }
  if (visual.kind === "groupObserve" || visual.kind === "groupMake") {
    return <GroupingTray label={lang === "en" ? "Group box" : "Kotak kumpulan"} count={visual.count} emoji={visual.emoji} counted lang={lang} />;
  }
  if (visual.kind === "groupTwo") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <GroupingTray label={lang === "en" ? "Group 1" : "Kumpulan 1"} count={visual.a} emoji={visual.emoji} counted lang={lang} />
        <GroupingTray label={lang === "en" ? "Group 2" : "Kumpulan 2"} count={visual.b} emoji={visual.emoji} counted lang={lang} />
      </div>
    );
  }
  if (visual.kind === "groupCompare") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <GroupingTray label="Group A" count={visual.a} emoji={visual.emoji} counted lang={lang} />
        <GroupingTray label="Group B" count={visual.b} emoji={visual.emoji} counted lang={lang} />
      </div>
    );
  }
  if (visual.kind === "groupCombine") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <GroupingTray label={lang === "en" ? "Group 1" : "Kumpulan 1"} count={visual.a} emoji={visual.emoji} counted lang={lang} />
          <GroupingTray label={lang === "en" ? "Group 2" : "Kumpulan 2"} count={visual.b} emoji={visual.emoji} counted lang={lang} />
        </div>
        <GroupingTray label={lang === "en" ? "One big group" : "Satu kumpulan besar"} count={visual.a + visual.b} emoji={visual.emoji} counted lang={lang} />
        <GroupingAnswerLine text={`${visual.a} + ${visual.b} = ${visual.a + visual.b}`} />
      </div>
    );
  }
  if (visual.kind === "subtract") {
    const emoji = visual.emoji ?? "🍌";
    return <InteractiveSubtractionFlow start={visual.a} takeAway={visual.b} emoji={emoji} lang={lang} />;
  }
  if (visual.kind === "compare") {
    return <NumberLine marked={Math.max(visual.a, visual.b)} />;
  }
  return <VisualDisplay visual={visual} lang={lang} />;
}

function speakNumber(value: number, lang: Lang) {
  if (audioMuted) return;
  if (activeCountingRunId !== null) {
    queuedAudioAfterCounting = () => speakNumber(value, lang);
    return;
  }
  stopNumberAudio();
  const runId = audioRunId;
  const file = NUMBER_AUDIO_FILES[value];
  if (!file) {
    speakNumberWithTts(value, lang);
    return;
  }
  playNumberFile(value, runId).then((played) => {
    if (!played && runId === audioRunId) speakNumberWithTts(value, lang);
  });
}

async function speakCountingSequence(
  count: number,
  lang: Lang = "en",
  intervalMs = COUNTING_STEP_MS,
  onCount?: (value: number) => void,
) {
  if (audioMuted) return;
  if (count <= 0) return;
  if (activeCountingRunId !== null) return;
  stopNumberAudio();
  const runId = audioRunId;
  activeCountingRunId = runId;
  const stepMs = Math.max(intervalMs, COUNTING_STEP_MS);
  try {
    for (let value = 1; value <= Math.min(count, 10); value += 1) {
      if (runId !== audioRunId) return;
      onCount?.(value);
      const startedAt = performance.now();
      const played = await playNumberFile(value, runId);
      if (!played && runId === audioRunId) {
        speakNumberWithTts(value, lang);
        await wait(Math.min(stepMs, 900));
      }
      if (runId !== audioRunId) return;
      const elapsed = performance.now() - startedAt;
      await wait(Math.max(180, stepMs - elapsed));
    }
  } finally {
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
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function playNumberFile(value: number, runId: number) {
  const file = NUMBER_AUDIO_FILES[value];
  if (!file) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    activeNumberAudio?.pause();
    const audio = getNumberAudio(value);
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
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = NUMBER_AUDIO_PLAYBACK_RATE;
    audio.preservesPitch = true;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    timeoutId = window.setTimeout(() => finish(audio.currentTime > 0), 2600);
    audio.play().catch(() => finish(false));
    if (runId !== audioRunId) {
      audio.pause();
      finish(false);
    }
  });
}

function getNumberAudio(value: number) {
  const cached = numberAudioCache.get(value);
  if (cached) return cached;
  const file = NUMBER_AUDIO_FILES[value];
  const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
  audio.preload = "auto";
  numberAudioCache.set(value, audio);
  return audio;
}

function preloadNumberAudioFiles() {
  Object.keys(NUMBER_AUDIO_FILES).forEach((value) => {
    getNumberAudio(Number(value)).load();
  });
}

function speakNumberWithTts(value: number, lang: Lang) {
  if (audioMuted) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(WORDS[lang][value] ?? String(value));
  utterance.lang = lang === "ms" ? "ms-MY" : "en-US";
  utterance.rate = SPEECH_RATE;
  window.speechSynthesis.speak(utterance);
}

function speakText(text: string, lang: Lang, options: { requireInteraction?: boolean } = {}) {
  if (audioMuted) return;
  if (options.requireInteraction && !audioUserInteracted) return;
  if (!("speechSynthesis" in window)) return;
  if (activeCountingRunId !== null) {
    queuedAudioAfterCounting = () => speakText(text, lang, options);
    return;
  }
  stopNumberAudio();
  const mathWords = lang === "ms"
    ? { minus: " tolak ", plus: " tambah ", equals: " sama dengan ", times: " darab " }
    : { minus: " minus ", plus: " plus ", equals: " equals ", times: " times " };
  const cleanText = text
    .replace(/[−-]/g, mathWords.minus)
    .replace(/\+/g, mathWords.plus)
    .replace(/=/g, mathWords.equals)
    .replace(/×/g, mathWords.times)
    .replace(/\s+/g, " ")
    .trim();
  if (!cleanText) return;
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang === "ms" ? "ms-MY" : "en-US";
  utterance.rate = SPEECH_RATE;
  window.speechSynthesis.speak(utterance);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function Decor() {
  return null;
}

export default App;
