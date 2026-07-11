import React, { useEffect, useMemo, useRef, useState } from "react";
import chrysHappy from "@assets/chrys_happy_new_nobg.png";
import chrysExcited from "@assets/chrys_excited_new_nobg.png";
import chrysThinking from "@assets/chrys_thinking_new_nobg.png";
import chrysRunning from "@assets/chrys_running_new_nobg.png";
import chrysCelebrate from "@assets/chrys_swinging_new_nobg.png";
import alyseNormal from "@assets/alyse_normal_nobg.png";
import alyseTeaching from "@assets/alyse_teaching_nobg.png";
import basketPhoto from "@assets/basket_photo.png";
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
const WORDS: Record<Lang, string[]> = {
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  ms: ["sifar", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"],
};

const CP1252_BYTES: Record<number, number> = {
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x0161: 0x9a,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function cleanDisplayText(value: string) {
  const shouldClean = Array.from(value).some((char) => {
    const cp = char.codePointAt(0) ?? 0;
    return cp === 0xc3 || cp === 0xc2 || cp === 0xf0 || cp === 0xe2 || cp === 0x0178;
  });
  if (!shouldClean) return value;

  let current = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const bytes: number[] = [];
    let convertible = true;
    for (const char of current) {
      const cp = char.codePointAt(0) ?? 0;
      if (cp <= 0xff) bytes.push(cp);
      else if (CP1252_BYTES[cp]) bytes.push(CP1252_BYTES[cp]);
      else {
        convertible = false;
        break;
      }
    }
    if (!convertible) break;
    const decoded = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    if (decoded === current || decoded.includes("\uFFFD")) break;
    current = decoded;
  }
  return current;
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
    sequencing: "Ascending, Descending, and Sequencing",
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
    sequencing: "Menaik, Menurun, dan Turutan",
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

const recognitionPracticeQuestions: Question[] = [
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
  q("val-support-3", "numbers", { en: "3 means 3 objects.", ms: "3 bermaksud 3 objek." }, [2, 3, 4], 3, { kind: "numberWithGroup", value: 3, emoji: "🍌" }),
  q("val-support-6", "numbers", { en: "6 means 6 objects.", ms: "6 bermaksud 6 objek." }, [5, 6, 7], 6, { kind: "numberWithGroup", value: 6, emoji: "🍃" }),
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
  q("val-layout-6", "numbers", { en: "Do they all show 6?", ms: "Semua tunjuk 6?" }, ["Yes", "No"], "Yes", { kind: "layoutValue", count: 6, emoji: "🍌" }),
  q("val-more-4-6", "numbers", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, ["Group A", "Group B"], "Group B", { kind: "compareGroups", a: 4, b: 6, emojiA: "🍃", emojiB: "🍌", ask: "more" }),
  q("val-fewer-2-5", "numbers", { en: "Which group has fewer?", ms: "Kumpulan mana lebih sedikit?" }, ["Group A", "Group B"], "Group A", { kind: "compareGroups", a: 2, b: 5, emojiA: "🪨", emojiB: "🥭", ask: "fewer" }),
];
const sequencingPracticeQuestions: Question[] = [
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
  q("lp-n-count-3", "numbers", { en: "Count the bananas.", ms: "Kira pisang." }, [1, 2, 3, 4], 3, { kind: "count", emoji: "ðŸŒ", count: 3 }),
q("lp-n-count-0", "numbers", { en: "The basket is empty. How many bananas?", ms: "Bakul kosong. Ada berapa pisang?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "ðŸŒ", count: 0, container: "basket" }),
  q("lp-n-after-4", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [3, 4, 5, 6], 5, { kind: "sequence", nums: [2, 3, 4, "?"] }),
  q("lp-n-before-7", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [5, 6, 7, 8], 6, { kind: "sequence", nums: [5, "?", 7, 8] }),
  q("lp-n-missing-2", "numbers", { en: "What number is missing on the number line?", ms: "Nombor apa yang hilang pada garis nombor?" }, [1, 2, 3, 4], 2, { kind: "sequence", nums: [0, 1, "?", 3] }),
  q("lp-n-skip-even", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [2, 3, 4, 5], 4, { kind: "sequence", nums: [0, 2, "?", 6, 8] }),
  q("lp-n-skip-odd", "numbers", { en: "What number is missing?", ms: "Nombor apa yang hilang?" }, [3, 4, 5, 6], 5, { kind: "sequence", nums: [1, 3, "?", 7, 9] }),
  q("lp-n-smaller", "numbers", { en: "Which number is smaller: 9 or 2?", ms: "Nombor mana lebih kecil: 9 atau 2?" }, [1, 2, 7, 9], 2, { kind: "compare", a: 9, b: 2 }),
];

const numberQuestions: Question[] = [
  q("n-count-bananas-6", "numbers", { en: "Count the bananas.", ms: "Kira pisang." }, [4, 5, 6, 7], 6, { kind: "count", emoji: "ðŸŒ", count: 6 }),
  q("n-count-stars-4", "numbers", { en: "Count the stars.", ms: "Kira bintang." }, [2, 3, 4, 5], 4, { kind: "count", emoji: "â­", count: 4 }),
  q("n-count-shells-9", "numbers", { en: "Count the shells.", ms: "Kira cangkerang." }, [6, 7, 8, 9], 9, { kind: "count", emoji: "ðŸš", count: 9 }),
  q("n-count-apples-2", "numbers", { en: "Count the apples.", ms: "Kira epal." }, [0, 1, 2, 3], 2, { kind: "count", emoji: "ðŸŽ", count: 2 }),
  q("n-count-empty", "numbers", { en: "There are no flowers. How many?", ms: "Tiada bunga. Berapa?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "ðŸŒ¸", count: 0 }),
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
  q("o-add-1-2", "operations", { en: "Chrys has 1 banana and finds 2 more. How many now?", ms: "Chrys ada 1 pisang dan jumpa 2 lagi. Jadi berapa?" }, [2, 3, 4, 5], 3, { kind: "add", a: 1, b: 2, emoji: "ðŸŒ" }),
  q("o-add-2-5", "operations", { en: "2 bananas join 5 more bananas. How many bananas?", ms: "2 pisang bergabung dengan 5 pisang lagi. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 2, b: 5, emoji: "ðŸŒ" }),
  q("o-add-3-4", "operations", { en: "3 flowers and 4 more flowers. How many flowers?", ms: "3 bunga dan 4 bunga lagi. Berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "ðŸŒ¸" }),
  q("o-add-6-1", "operations", { en: "Chrys has 6 bananas and gets 1 more. How many bananas?", ms: "Chrys ada 6 pisang dan dapat 1 lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "ðŸŒ" }),
  q("o-add-8-1", "operations", { en: "8 shells and 1 more shell. How many shells?", ms: "8 cangkerang dan 1 lagi. Berapa cangkerang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "ðŸš" }),
  q("o-add-9-0", "operations", { en: "9 stars and 0 more stars. How many stars?", ms: "9 bintang dan 0 bintang lagi. Berapa bintang?" }, [0, 7, 8, 9], 9, { kind: "add", a: 9, b: 0, emoji: "â­" }),
  q("o-add-4-2", "operations", { en: "4 bananas join 2 more bananas. How many bananas?", ms: "4 pisang bergabung dengan 2 pisang lagi. Berapa pisang?" }, [5, 6, 7, 8], 6, { kind: "add", a: 4, b: 2, emoji: "ðŸŒ" }),
  q("o-add-5-3", "operations", { en: "5 apples and 3 more apples. How many apples?", ms: "5 epal dan 3 epal lagi. Berapa epal?" }, [6, 7, 8, 9], 8, { kind: "add", a: 5, b: 3, emoji: "ðŸŽ" }),
  q("o-add-7-0", "operations", { en: "7 bananas and 0 more bananas. How many bananas?", ms: "7 pisang dan 0 pisang lagi. Berapa pisang?" }, [0, 6, 7, 8], 7, { kind: "add", a: 7, b: 0, emoji: "ðŸŒ" }),
  q("o-add-0-8", "operations", { en: "0 flowers and 8 more flowers. How many flowers?", ms: "0 bunga dan 8 bunga lagi. Berapa bunga?" }, [0, 7, 8, 9], 8, { kind: "add", a: 0, b: 8, emoji: "ðŸŒ¸" }),
  q("o-add-2-6", "operations", { en: "2 stars and 6 more stars. How many stars?", ms: "2 bintang dan 6 bintang lagi. Berapa bintang?" }, [6, 7, 8, 9], 8, { kind: "add", a: 2, b: 6, emoji: "â­" }),
  q("o-add-4-4", "operations", { en: "4 shells and 4 more shells. How many shells?", ms: "4 cangkerang dan 4 cangkerang lagi. Berapa cangkerang?" }, [6, 7, 8, 9], 8, { kind: "add", a: 4, b: 4, emoji: "ðŸš" }),
  q("o-sub-8-2", "operations", { en: "Chrys has 8 bananas. He gives away 2 bananas. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia beri 2 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 6, { kind: "subtract", a: 8, b: 2, emoji: "ðŸŒ" }),
  q("o-sub-9-5", "operations", { en: "There are 9 shells. You take away 5 shells. How many shells are left?", ms: "Ada 9 cangkerang. Kamu ambil 5 cangkerang. Tinggal berapa cangkerang?" }, [3, 4, 5, 6], 4, { kind: "subtract", a: 9, b: 5, emoji: "ðŸš" }),
  q("o-sub-7-7", "operations", { en: "There are 7 stars. All 7 stars go away. How many stars are left?", ms: "Ada 7 bintang. Semua 7 bintang pergi. Tinggal berapa bintang?" }, [0, 1, 2, 3], 0, { kind: "subtract", a: 7, b: 7, emoji: "â­" }),
  q("o-sub-6-1", "operations", { en: "There are 6 bananas. You take away 1 banana. How many bananas are left?", ms: "Ada 6 pisang. Kamu ambil 1 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 5, { kind: "subtract", a: 6, b: 1, emoji: "ðŸŒ" }),
  q("o-sub-5-3", "operations", { en: "There are 5 flowers. You take away 3 flowers. How many flowers are left?", ms: "Ada 5 bunga. Kamu ambil 3 bunga. Tinggal berapa bunga?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 5, b: 3, emoji: "ðŸŒ¸" }),
  q("o-sub-4-0", "operations", { en: "There are 4 apples. You take away 0 apples. How many apples are left?", ms: "Ada 4 epal. Kamu ambil 0 epal. Tinggal berapa epal?" }, [0, 3, 4, 5], 4, { kind: "subtract", a: 4, b: 0, emoji: "ðŸŽ" }),
  q("o-sub-9-8", "operations", { en: "There are 9 bananas. You take away 8 bananas. How many bananas are left?", ms: "Ada 9 pisang. Kamu ambil 8 pisang. Tinggal berapa pisang?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 9, b: 8, emoji: "ðŸŒ" }),
  q("o-sub-8-4", "operations", { en: "There are 8 shells. You take away 4 shells. How many shells are left?", ms: "Ada 8 cangkerang. Kamu ambil 4 cangkerang. Tinggal berapa cangkerang?" }, [2, 3, 4, 5], 4, { kind: "subtract", a: 8, b: 4, emoji: "ðŸš" }),
  q("o-sub-6-5", "operations", { en: "There are 6 stars. You take away 5 stars. How many stars are left?", ms: "Ada 6 bintang. Kamu ambil 5 bintang. Tinggal berapa bintang?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 6, b: 5, emoji: "â­" }),
  q("o-sub-3-2", "operations", { en: "There are 3 bananas. You take away 2 bananas. How many bananas are left?", ms: "Ada 3 pisang. Kamu ambil 2 pisang. Tinggal berapa pisang?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 3, b: 2, emoji: "ðŸŒ" }),
  q("o-sub-9-0", "operations", { en: "There are 9 flowers. You take away 0 flowers. How many flowers are left?", ms: "Ada 9 bunga. Kamu ambil 0 bunga. Tinggal berapa bunga?" }, [0, 7, 8, 9], 9, { kind: "subtract", a: 9, b: 0, emoji: "ðŸŒ¸" }),
  q("o-sub-7-4", "operations", { en: "There are 7 apples. You take away 4 apples. How many apples are left?", ms: "Ada 7 epal. Kamu ambil 4 epal. Tinggal berapa epal?" }, [2, 3, 4, 5], 3, { kind: "subtract", a: 7, b: 4, emoji: "ðŸŽ" }),
  q("o-sub-5-5", "operations", { en: "There are 5 bananas. You take away all 5 bananas. How many bananas are left?", ms: "Ada 5 pisang. Kamu ambil semua 5 pisang. Tinggal berapa pisang?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "ðŸŒ" }),
];

const additionPracticeQuestions: Question[] = [
  q("l-add-2-3", "operations", { en: "Chrys eats 2 bananas and 3 more bananas. How many bananas?", ms: "Chrys makan 2 pisang dan 3 pisang lagi. Berapa pisang?" }, [4, 5, 6, 7], 5, { kind: "add", a: 2, b: 3, emoji: "ðŸŒ" }),
  q("l-add-2-4", "operations", { en: "Chrys has 2 bananas and gets 4 more. How many bananas now?", ms: "Chrys ada 2 pisang dan dapat 4 lagi. Berapa pisang sekarang?" }, [5, 6, 7, 8], 6, { kind: "add", a: 2, b: 4, emoji: "ðŸŒ" }),
  q("l-add-4-5", "operations", { en: "Alyse brings 4 bananas. Chrys brings 5 more. How many bananas?", ms: "Alyse bawa 4 pisang. Chrys bawa 5 lagi. Berapa pisang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 4, b: 5, emoji: "ðŸŒ" }),
  q("l-add-0-6", "operations", { en: "Chrys starts with 0 bananas and gets 6 bananas. How many bananas?", ms: "Chrys mula dengan 0 pisang dan dapat 6 pisang. Berapa pisang?" }, [0, 5, 6, 7], 6, { kind: "add", a: 0, b: 6, emoji: "ðŸŒ" }),
  q("l-add-6-1", "operations", { en: "Chrys eats 6 bananas and 1 more banana. How many bananas?", ms: "Chrys makan 6 pisang dan 1 pisang lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "ðŸŒ" }),
  q("l-add-8-1", "operations", { en: "Chrys has 8 bananas and gets 1 more. How many bananas now?", ms: "Chrys ada 8 pisang dan dapat 1 lagi. Berapa pisang sekarang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "ðŸŒ" }),
];

const subtractionPracticeQuestions: Question[] = [
  q("l-sub-7-3", "operations", { en: "Chrys has 7 bananas. He gives away 3 bananas. How many bananas are left?", ms: "Chrys ada 7 pisang. Dia beri 3 pisang. Tinggal berapa pisang?" }, [3, 4, 5, 6], 4, { kind: "subtract", a: 7, b: 3, emoji: "ðŸŒ" }),
  q("l-sub-6-2", "operations", { en: "Chrys has 6 bananas. He eats 2 bananas. How many bananas are left?", ms: "Chrys ada 6 pisang. Dia makan 2 pisang. Tinggal berapa pisang?" }, [2, 3, 4, 5], 4, { kind: "subtract", a: 6, b: 2, emoji: "ðŸŒ" }),
  q("l-sub-9-6", "operations", { en: "There are 9 bananas. You take away 6 bananas. How many bananas are left?", ms: "Ada 9 pisang. Kamu ambil 6 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "subtract", a: 9, b: 6, emoji: "ðŸŒ" }),
  q("l-sub-5-0", "operations", { en: "Chrys has 5 bananas. He gives away 0 bananas. How many bananas are left?", ms: "Chrys ada 5 pisang. Dia beri 0 pisang. Tinggal berapa pisang?" }, [0, 4, 5, 6], 5, { kind: "subtract", a: 5, b: 0, emoji: "ðŸŒ" }),
  q("l-sub-8-1", "operations", { en: "Chrys has 8 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 8 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "subtract", a: 8, b: 1, emoji: "ðŸŒ" }),
  q("l-sub-4-4", "operations", { en: "Chrys has 4 bananas. He gives away all 4 bananas. How many bananas are left?", ms: "Chrys ada 4 pisang. Dia beri semua 4 pisang. Tinggal berapa pisang?" }, [0, 1, 3, 4], 0, { kind: "subtract", a: 4, b: 4, emoji: "ðŸŒ" }),
];

const realQuestions: Question[] = [
  q("r-count-apples", "real", { en: "Count the apples.", ms: "Kira epal." }, [3, 4, 5, 6], 5, { kind: "count", emoji: "ðŸŽ", count: 5 }),
  q("r-count-pencils", "real", { en: "Count the pencils.", ms: "Kira pensel." }, [5, 6, 7, 8], 7, { kind: "count", emoji: "âœï¸", count: 7 }),
q("r-count-cups", "real", { en: "The tray is empty. How many cups are on it?", ms: "Dulang kosong. Ada berapa cawan di atasnya?" }, [0, 1, 2, 3], 0, { kind: "count", emoji: "ðŸ¥¤", count: 0, container: "tray" }),
q("r-add-oranges", "real", { en: "There are 3 oranges. Put 4 more oranges in the basket. How many oranges?", ms: "Ada 3 oren. Letak 4 oren lagi dalam bakul. Berapa oren?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "ðŸŠ", container: "basket" }),
  q("r-add-books", "real", { en: "Alyse has 1 book and gets 6 more books. How many books?", ms: "Alyse ada 1 buku dan dapat 6 buku lagi. Berapa buku?" }, [5, 6, 7, 8], 7, { kind: "add", a: 1, b: 6, emoji: "ðŸ“˜" }),
  q("r-add-bananas", "real", { en: "Chrys has 2 bananas. His friend gives him 5 more. How many bananas?", ms: "Chrys ada 2 pisang. Kawannya beri 5 lagi. Berapa pisang?" }, [6, 7, 8, 9], 7, { kind: "add", a: 2, b: 5, emoji: "ðŸŒ" }),
  q("r-add-flowers", "real", { en: "There are 4 flowers. Add 0 more flowers. How many flowers?", ms: "Ada 4 bunga. Tambah 0 bunga lagi. Berapa bunga?" }, [0, 3, 4, 5], 4, { kind: "add", a: 4, b: 0, emoji: "ðŸŒ¸" }),
  q("r-add-eggs", "real", { en: "5 eggs and 4 more eggs. How many eggs?", ms: "5 telur dan 4 telur lagi. Berapa telur?" }, [6, 7, 8, 9], 9, { kind: "add", a: 5, b: 4, emoji: "ðŸ¥š" }),
  q("r-sub-cookies", "real", { en: "There are 8 cookies. Take away 3. How many are left?", ms: "Ada 8 biskut. Ambil 3. Tinggal berapa?" }, [4, 5, 6, 7], 5, { kind: "subtract", a: 8, b: 3, emoji: "ðŸª" }),
  q("r-sub-balloons", "real", { en: "There are 4 balloons. 0 balloons fly away. How many balloons are left?", ms: "Ada 4 belon. 0 belon terbang pergi. Tinggal berapa belon?" }, [0, 3, 4, 5], 4, { kind: "subtract", a: 4, b: 0, emoji: "ðŸŽˆ" }),
  q("r-sub-pencils", "real", { en: "There are 9 pencils. You give away 2 pencils. How many pencils are left?", ms: "Ada 9 pensel. Kamu beri 2 pensel. Tinggal berapa pensel?" }, [5, 6, 7, 8], 7, { kind: "subtract", a: 9, b: 2, emoji: "âœï¸" }),
  q("r-sub-apples", "real", { en: "There are 6 apples. You eat 4 apples. How many apples are left?", ms: "Ada 6 epal. Kamu makan 4 epal. Tinggal berapa epal?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 6, b: 4, emoji: "ðŸŽ" }),
  q("r-sub-cups", "real", { en: "There are 5 cups. You put away all 5 cups. How many cups are left?", ms: "Ada 5 cawan. Kamu simpan semua 5 cawan. Tinggal berapa cawan?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "ðŸ¥¤" }),
  q("r-count-toys", "real", { en: "Count the toy cars.", ms: "Kira kereta mainan." }, [4, 5, 6, 7], 6, { kind: "count", emoji: "ðŸš—", count: 6 }),
  q("r-sub-bananas", "real", { en: "Chrys has 3 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 3 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 3, b: 1, emoji: "ðŸŒ" }),
];

const realPracticeQuestions: Question[] = [
  q("rp-count-2", "real", { en: "Chrys sees 2 bananas. How many bananas?", ms: "Chrys nampak 2 pisang. Berapa pisang?" }, [0, 1, 2, 3], 2, { kind: "count", emoji: "ðŸŒ", count: 2 }),
  q("rp-add-1-1", "real", { en: "Chrys has 1 banana and finds 1 more. How many bananas?", ms: "Chrys ada 1 pisang dan jumpa 1 lagi. Berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "add", a: 1, b: 1, emoji: "ðŸŒ" }),
  q("rp-sub-3-1", "real", { en: "Chrys has 3 bananas. He eats 1 banana. How many bananas are left?", ms: "Chrys ada 3 pisang. Dia makan 1 pisang. Tinggal berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 3, b: 1, emoji: "ðŸŒ" }),
  q("rp-add-birds", "real", { en: "Chrys sees 2 birds. 3 more birds come. How many birds?", ms: "Chrys nampak 2 burung. 3 burung lagi datang. Berapa burung?" }, [3, 4, 5, 6], 5, { kind: "add", a: 2, b: 3, emoji: "ðŸ¦" }),
  q("rp-sub-leaves", "real", { en: "Chrys has 5 leaves. He uses 1 leaf for a bed. How many leaves are left?", ms: "Chrys ada 5 daun. Dia guna 1 daun untuk katil. Tinggal berapa daun?" }, [3, 4, 5, 6], 4, { kind: "subtract", a: 5, b: 1, emoji: "ðŸƒ" }),
  q("rp-add-basket", "real", { en: "2 coconuts are in the basket. Add 3 more. How many coconuts?", ms: "Ada 2 kelapa dalam bakul. Tambah 3 lagi. Berapa kelapa?" }, [4, 5, 6, 7], 5, { kind: "add", a: 2, b: 3, emoji: "ðŸ¥¥", container: "basket" }),
  q("rp-choose-add", "real", { en: "Chrys has 4 bananas. He finds 2 more. Is this adding or taking away?", ms: "Chrys ada 4 pisang. Dia jumpa 2 lagi. Ini tambah atau tolak?" }, ["Adding", "Taking away"], "Adding", { kind: "add", a: 4, b: 2, emoji: "ðŸŒ" }),
  q("rp-choose-subtract", "real", { en: "Chrys has 6 mangoes. He gives away 2. Is this adding or taking away?", ms: "Chrys ada 6 mangga. Dia beri 2. Ini tambah atau tolak?" }, ["Adding", "Taking away"], "Taking away", { kind: "subtract", a: 6, b: 2, emoji: "ðŸ¥­" }),
];

const realTestQuestions: Question[] = [
q("rt-count-bananas-4", "real", { en: "Count the bananas in the picnic basket.", ms: "Kira pisang dalam bakul piknik." }, [2, 3, 4, 5], 4, { kind: "count", emoji: "ðŸŒ", count: 4, container: "basket" }),
  q("rt-count-apples-8", "real", { en: "Count the apples.", ms: "Kira epal." }, [6, 7, 8, 9], 8, { kind: "count", emoji: "ðŸŽ", count: 8 }),
q("rt-count-oranges-3", "real", { en: "Count the oranges in the basket.", ms: "Kira oren dalam bakul." }, [1, 2, 3, 4], 3, { kind: "count", emoji: "ðŸŠ", count: 3, container: "basket" }),
  q("rt-count-books-5", "real", { en: "Count the books.", ms: "Kira buku." }, [3, 4, 5, 6], 5, { kind: "count", emoji: "ðŸ“˜", count: 5 }),
q("rt-count-cups-1", "real", { en: "Count the cup on the tray.", ms: "Kira cawan di atas dulang." }, [0, 1, 2, 3], 1, { kind: "count", emoji: "ðŸ¥¤", count: 1, container: "tray" }),
  q("rt-count-flowers-9", "real", { en: "Count the flowers.", ms: "Kira bunga." }, [6, 7, 8, 9], 9, { kind: "count", emoji: "ðŸŒ¸", count: 9 }),
  q("rt-count-eggs-2", "real", { en: "Count the eggs.", ms: "Kira telur." }, [0, 1, 2, 3], 2, { kind: "count", emoji: "ðŸ¥š", count: 2 }),
  q("rt-count-toys-7", "real", { en: "Count the toy cars.", ms: "Kira kereta mainan." }, [5, 6, 7, 8], 7, { kind: "count", emoji: "ðŸš—", count: 7 }),
  q("rt-add-bananas-1-6", "real", { en: "Chrys has 1 banana. Alyse gives him 6 more. How many bananas?", ms: "Chrys ada 1 pisang. Alyse beri 6 lagi. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 1, b: 6, emoji: "ðŸŒ" }),
  q("rt-add-apples-4-3", "real", { en: "4 apples and 3 more apples. How many apples?", ms: "4 epal dan 3 epal lagi. Berapa epal?" }, [5, 6, 7, 8], 7, { kind: "add", a: 4, b: 3, emoji: "ðŸŽ" }),
  q("rt-add-oranges-6-1", "real", { en: "There are 6 oranges. Add 1 more orange. How many oranges?", ms: "Ada 6 oren. Tambah 1 oren lagi. Berapa oren?" }, [6, 7, 8, 9], 7, { kind: "add", a: 6, b: 1, emoji: "ðŸŠ" }),
  q("rt-add-books-2-4", "real", { en: "Alyse has 2 books and finds 4 more books. How many books?", ms: "Alyse ada 2 buku dan jumpa 4 buku lagi. Berapa buku?" }, [4, 5, 6, 7], 6, { kind: "add", a: 2, b: 4, emoji: "ðŸ“˜" }),
  q("rt-add-cups-8-1", "real", { en: "There are 8 cups. Add 1 more cup. How many cups?", ms: "Ada 8 cawan. Tambah 1 cawan lagi. Berapa cawan?" }, [6, 7, 8, 9], 9, { kind: "add", a: 8, b: 1, emoji: "ðŸ¥¤" }),
  q("rt-add-flowers-5-2", "real", { en: "There are 5 flowers. Add 2 more flowers. How many flowers?", ms: "Ada 5 bunga. Tambah 2 bunga lagi. Berapa bunga?" }, [5, 6, 7, 8], 7, { kind: "add", a: 5, b: 2, emoji: "ðŸŒ¸" }),
  q("rt-add-eggs-3-5", "real", { en: "3 eggs and 5 more eggs. How many eggs?", ms: "3 telur dan 5 telur lagi. Berapa telur?" }, [6, 7, 8, 9], 8, { kind: "add", a: 3, b: 5, emoji: "ðŸ¥š" }),
  q("rt-add-toys-9-0", "real", { en: "There are 9 toy cars. Add 0 more toy cars. How many toy cars?", ms: "Ada 9 kereta mainan. Tambah 0 lagi. Berapa kereta mainan?" }, [0, 7, 8, 9], 9, { kind: "add", a: 9, b: 0, emoji: "ðŸš—" }),
q("rt-add-bananas-0-5", "real", { en: "The basket has 0 bananas. Put in 5 bananas. How many bananas?", ms: "Bakul ada 0 pisang. Letak 5 pisang. Berapa pisang?" }, [0, 4, 5, 6], 5, { kind: "add", a: 0, b: 5, emoji: "ðŸŒ", container: "basket" }),
  q("rt-sub-bananas-9-3", "real", { en: "Chrys has 9 bananas. He eats 3 bananas. How many bananas are left?", ms: "Chrys ada 9 pisang. Dia makan 3 pisang. Tinggal berapa pisang?" }, [4, 5, 6, 7], 6, { kind: "subtract", a: 9, b: 3, emoji: "ðŸŒ" }),
  q("rt-sub-apples-8-6", "real", { en: "There are 8 apples. You eat 6 apples. How many apples are left?", ms: "Ada 8 epal. Kamu makan 6 epal. Tinggal berapa epal?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 8, b: 6, emoji: "ðŸŽ" }),
  q("rt-sub-oranges-7-1", "real", { en: "There are 7 oranges. You take away 1 orange. How many oranges are left?", ms: "Ada 7 oren. Kamu ambil 1 oren. Tinggal berapa oren?" }, [5, 6, 7, 8], 6, { kind: "subtract", a: 7, b: 1, emoji: "ðŸŠ" }),
  q("rt-sub-books-6-4", "real", { en: "There are 6 books. You put away 4 books. How many books are left?", ms: "Ada 6 buku. Kamu simpan 4 buku. Tinggal berapa buku?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 6, b: 4, emoji: "ðŸ“˜" }),
  q("rt-sub-cups-5-5", "real", { en: "There are 5 cups. You put away all 5 cups. How many cups are left?", ms: "Ada 5 cawan. Kamu simpan semua 5 cawan. Tinggal berapa cawan?" }, [0, 1, 4, 5], 0, { kind: "subtract", a: 5, b: 5, emoji: "ðŸ¥¤" }),
  q("rt-sub-flowers-4-2", "real", { en: "There are 4 flowers. You pick 2 flowers. How many flowers are left?", ms: "Ada 4 bunga. Kamu petik 2 bunga. Tinggal berapa bunga?" }, [1, 2, 3, 4], 2, { kind: "subtract", a: 4, b: 2, emoji: "ðŸŒ¸" }),
  q("rt-sub-eggs-3-0", "real", { en: "There are 3 eggs. You take away 0 eggs. How many eggs are left?", ms: "Ada 3 telur. Kamu ambil 0 telur. Tinggal berapa telur?" }, [0, 2, 3, 4], 3, { kind: "subtract", a: 3, b: 0, emoji: "ðŸ¥š" }),
  q("rt-sub-toys-2-1", "real", { en: "There are 2 toy cars. You move 1 toy car away. How many toy cars are left?", ms: "Ada 2 kereta mainan. Kamu alihkan 1 kereta mainan. Tinggal berapa kereta mainan?" }, [0, 1, 2, 3], 1, { kind: "subtract", a: 2, b: 1, emoji: "ðŸš—" }),
];

function q(
  id: string,
  area: Question["area"],
  text: Record<Lang, string>,
  options: Array<number | string>,
  answer: number | string,
  visual: Visual,
): Question {
  return {
    id,
    area,
    text,
    options,
    answer,
    visual,
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
    const countBack = countBackwardSteps(visual.a, visual.b);
    return {
      en: visual.b === 0
        ? [`Start with ${visual.a}.`, "Take away nothing.", `Answer: ${left}.`]
        : [`Start with ${visual.a}.`, `Count back ${visual.b}: ${countBack}.`, `Answer: ${visual.a} - ${visual.b} = ${left}.`],
      ms: visual.b === 0
        ? [`Mula dengan ${visual.a}.`, "Tidak ambil apa-apa.", `Jawapan: ${left}.`]
        : [`Mula dengan ${visual.a}.`, `Kira undur ${visual.b}: ${countBack}.`, `Jawapan: ${visual.a} - ${visual.b} = ${left}.`],
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
        en: [`Group A has ${visual.a}.`, `Group B has ${visual.b}.`, `${more} is more than ${fewer}.`],
        ms: [`Kumpulan A ada ${visual.a}.`, `Kumpulan B ada ${visual.b}.`, `${more} lebih banyak daripada ${fewer}.`],
      }
      : {
        en: [`Group A has ${visual.a}.`, `Group B has ${visual.b}.`, `${fewer} is fewer than ${more}.`],
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
      en: [greater ? `${visual.a} is more than ${visual.b}.` : `${visual.a} is less than ${visual.b}.`, `So, ${visual.a} ${symbol} ${visual.b}.`],
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

function countBackwardSteps(start: number, amount: number) {
  return Array.from({ length: amount }, (_, i) => start - i - 1).join(", ");
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
    "ðŸŒ": { en: ["banana", "bananas"], ms: "pisang" },
    "ðŸŽ": { en: ["apple", "apples"], ms: "epal" },
    "ðŸŠ": { en: ["orange", "oranges"], ms: "oren" },
    "ðŸ¥­": { en: ["mango", "mangoes"], ms: "mangga" },
    "ðŸ¥¥": { en: ["coconut", "coconuts"], ms: "kelapa" },
    "ðŸƒ": { en: ["leaf", "leaves"], ms: "daun" },
    "ðŸª¨": { en: ["rock", "rocks"], ms: "batu" },
    "ðŸ¦": { en: ["bird", "birds"], ms: "burung" },
    "ðŸª": { en: ["cookie", "cookies"], ms: "biskut" },
    "ðŸ“˜": { en: ["book", "books"], ms: "buku" },
    "ðŸŽˆ": { en: ["balloon", "balloons"], ms: "belon" },
    "âœï¸": { en: ["pencil", "pencils"], ms: "pensel" },
    "ðŸ¥¤": { en: ["cup", "cups"], ms: "cawan" },
    "ðŸŒ¸": { en: ["flower", "flowers"], ms: "bunga" },
    "ðŸ¥š": { en: ["egg", "eggs"], ms: "telur" },
    "ðŸš—": { en: ["toy car", "toy cars"], ms: "kereta mainan" },
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

function loadState(): { player: Player | null; lang: Lang } {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { player: parsed.player ?? null, lang: parsed.lang === "ms" ? "ms" : "en" };
  } catch {
    return { player: null, lang: "en" };
  }
}

function saveState(player: Player | null, lang: Lang) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ player, lang }));
}

function App() {
  const initial = useMemo(() => loadState(), []);
  const [lang, setLang] = useState<Lang>(initial.lang);
  const [player, setPlayer] = useState<Player | null>(initial.player);
  const [screen, setScreen] = useState<Screen>(initial.player ? "menu" : "home");
  const [lastScore, setLastScore] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => saveState(player, lang), [player, lang]);

  const t = UI[lang];
  const go = (next: Screen) => {
    setLastScore(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="page-bg min-h-[100dvh] text-slate-800 font-sans overflow-x-hidden">
      <Decor />
      <div className="jungle-leaves relative z-10 min-h-[100dvh] mx-auto flex w-full max-w-6xl flex-col px-4 py-4 md:px-8">
        <Header
          lang={lang}
          onToggleLang={() => setLang((current) => (current === "en" ? "ms" : "en"))}
          title={screen === "home" ? "" : t.title}
          stars={player?.stars ?? 0}
          t={t}
          onBack={screen === "home" ? undefined : () => go(screen.startsWith("test") && screen !== "testMenu" ? "testMenu" : screen === "menu" ? "home" : "menu")}
        />

        {screen === "home" && (
          <HomeScreen lang={lang} t={t} player={player} setPlayer={setPlayer} go={go} />
        )}
        {screen === "menu" && player && (
          <MenuScreen t={t} player={player} go={go} />
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
          <AdditionOnlyLesson lang={lang} t={t} onDone={() => { awardStar("learnAddition"); go("menu"); }} onSkipSubtraction={() => go("learnSubtraction")} />
        )}
        {screen === "learnSubtraction" && (
          <SubtractionOnlyLesson lang={lang} t={t} onDone={() => { awardStar("learnSubtraction"); go("menu"); }} />
        )}
        {screen === "learnReal" && (
          <ConceptLesson
            lang={lang}
            t={t}
            title={t.learnReal}
            intro={lang === "en" ? "Use counting, adding, and taking away in simple stories." : "Guna kira, tambah, dan tolak dalam cerita mudah."}
            note={lang === "en" ? "Look at the objects. Then answer." : "Lihat objek. Kemudian jawab."}
            questions={realPracticeQuestions}
            randomizePractice={false}
            onDone={() => { awardStar("learnReal"); go("menu"); }}
          />
        )}
        {screen === "testMenu" && (
          <TestMenu t={t} go={go} />
        )}
        {screen === "testNumbers" && (
          <Quiz lang={lang} t={t} title={t.learnNumbers} questions={numberQuestions} onFinish={(correct, total) => { setLastScore({ correct, total }); awardStar("testNumbers", correct >= Math.ceil(total * 0.7) ? 1 : 0); go("testMenu"); }} />
        )}
        {screen === "testOperations" && (
          <Quiz lang={lang} t={t} title={t.learnOperations} questions={operationQuestions} onFinish={(correct, total) => { setLastScore({ correct, total }); awardStar("testOperations", correct >= Math.ceil(total * 0.7) ? 1 : 0); go("testMenu"); }} />
        )}
        {screen === "testReal" && (
          <Quiz lang={lang} t={t} title={t.learnReal} questions={realTestQuestions} onFinish={(correct, total) => { setLastScore({ correct, total }); awardStar("testReal", correct >= Math.ceil(total * 0.7) ? 1 : 0); go("testMenu"); }} />
        )}

        {lastScore && screen === "testMenu" && (
          <div className="mx-auto mt-4 w-full max-w-xl rounded-3xl border-2 border-white/80 bg-white/90 p-4 text-center shadow-[0_6px_0_rgba(0,0,0,.14)]">
            <p className="text-lg font-black text-blue-900">{t.score}: {lastScore.correct}/{lastScore.total}</p>
            <p className="text-sm font-bold text-slate-500">{lang === "en" ? "Review the method, then try again whenever you like." : "Semak cara, kemudian cuba lagi bila-bila masa."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ lang, onToggleLang, title, stars, t, onBack }: {
  lang: Lang;
  onToggleLang: () => void;
  title: string;
  stars: number;
  t: UIStrings;
  onBack?: () => void;
}) {
  return (
    <header className="soft-panel mb-4 flex items-center justify-between gap-3 rounded-[1.75rem] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button onClick={onBack} aria-label={t.back} className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-sky-100 bg-white text-[0px] text-blue-800 shadow-[0_5px_0_rgba(14,116,144,.18)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 active:translate-y-1">
            <BackArrowIcon />
            â†
          </button>
        )}
        <h1 className="hidden truncate text-xl font-black leading-tight text-blue-950 sm:block md:text-2xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggleLang} className="rounded-2xl border-2 border-white/80 bg-white/90 px-3 py-2 text-sm font-black text-blue-800 shadow-[0_4px_0_rgba(0,0,0,.12)]">
          {lang === "en" ? "BM" : "EN"}
        </button>
        <div className="flex items-center gap-2 rounded-2xl border-2 border-yellow-300 bg-white px-3 py-2 font-black text-[0px] text-yellow-700 shadow-[0_4px_0_rgba(0,0,0,.14)]">
          <StarBadgeIcon />
          <span className="text-base">{stars}</span>
          â­ {stars}
        </div>
      </div>
    </header>
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
          <img src={alyseNormal} alt="Alyse the snake" className="h-20 w-20 object-contain" />
          <div className="text-left">
            <h2 className="text-4xl font-black leading-none text-blue-900 md:text-5xl">{t.title}</h2>
            <p className="mt-2 text-base font-bold text-slate-500">{t.subtitle}</p>
          </div>
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

function MenuScreen({ t, player, go }: { t: UIStrings; player: Player; go: (screen: Screen) => void }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 pb-8">
      <section className="flex flex-col items-center text-center">
        <img src={chrysHappy} alt="Chrys" className="h-36 w-36 object-contain drop-shadow-xl" />
        <h2 className="text-3xl font-black text-blue-950">Hi, {player.name}!</h2>
        <p className="text-lg font-bold text-blue-900/70">{t.menuTitle}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <MenuCard title={t.recognizeNumbers} subtitle="See, spell, hear, trace" icon="ðŸ”¢" color="sky" onClick={() => go("learnRecognize")} />
        <MenuCard title={t.numberValues} subtitle="Numbers mean quantity" icon="ðŸŒ" color="emerald" onClick={() => go("learnValues")} />
        <MenuCard title={t.sequencing} subtitle="Number lines and order" icon="< >" color="sky" onClick={() => go("learnSequencing")} />
        <MenuCard title={t.groupingMode} subtitle={t.groupingModeShort} icon="ðŸ§º" color="amber" onClick={() => go("groupingMode")} />
        <MenuCard title={t.addition} subtitle="Adding more" icon="âž•" color="emerald" onClick={() => go("learnAddition")} />
        <MenuCard title={t.subtraction} subtitle="Taking away" icon="âž–" color="pink" onClick={() => go("learnSubtraction")} />
        <MenuCard title={t.learnReal} subtitle="Counting objects in simple stories" icon="ðŸŽ" color="pink" onClick={() => go("learnReal")} />
        <MenuCard title={t.testMode} subtitle={t.testHelp} icon="â­" color="amber" onClick={() => go("testMenu")} />
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
      <span className="icon-badge relative z-10 mb-5 grid h-20 w-20 place-items-center rounded-[1.6rem] text-4xl font-black text-blue-950">{cleanDisplayText(icon)}</span>
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

function skipSubtractionLabel(lang: Lang) {
  return lang === "en" ? "Skip to subtraction" : "Langkau ke tolak";
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
        title={`${t.learnNumbers}: ${number}`}
        helper={lang === "en" ? "Alyse teaches each number through seeing, hearing, counting, sequencing, tracing, and drawing." : "Alyse ajar setiap nombor dengan lihat, dengar, kira, susun, surih, dan lukis."}
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
              <button onClick={() => speakNumber(number, lang)} className="hidden">
                ðŸ”Š {t.speak}
              </button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4 text-center">
            <CharacterTalk lang={lang} text={number === 0 ? (lang === "en" ? "Zero means nothing. The basket is empty." : "Sifar bermaksud tiada apa-apa. Bakul kosong.") : (lang === "en" ? `Count ${number} bananas slowly.` : `Kira ${number} pisang perlahan-lahan.`)} />
            <ObjectGroup count={number} emoji="ðŸŒ" numbered />
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
      <LessonShell title={t.recognizeNumbers} helper={lang === "en" ? "See it. Hear it. Spell it. Trace it. Write it." : "Lihat. Dengar. Eja. Surih. Tulis."}>
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
              <button onClick={() => speakNumber(number, lang)} className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-[0px] font-black text-white shadow-[0_5px_0_#1e3a8a] active:translate-y-1">
                <SpeakerIcon />
                <span className="text-base sm:text-lg">{lang === "en" ? `Hear ${WORDS.en[number]}` : `Dengar ${WORDS.ms[number]}`}</span>
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
  const examples = NUMBERS.map((n) => ({
    n,
    emoji: "🍌",
    text: n === 0
      ? (lang === "en" ? "0 is nothing. The basket is empty." : "0 ialah kosong. Bakul tiada pisang.")
      : (lang === "en" ? `This is ${n} bananas.` : `Ini ${n} pisang.`),
  }));
  const current = examples[step];
  const valueEmojis = ["🍌", "🍃", "🥭", "🪨", "🌸", "🥥", "🍄", "🍌", "🍃", "🥭"];
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
      text: lang === "en" ? "6 is more than 4. 4 is fewer than 6." : "6 lebih banyak daripada 4. 4 lebih sedikit daripada 6.",
      visual: <CompareGroupsVisual a={4} b={6} emojiA="🍃" emojiB="🍌" lang={lang} />,
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
      <LessonShell title={t.numberValues} helper={lang === "en" ? "A number tells us how many." : "Nombor memberitahu berapa banyak."}>
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <CharacterTalk lang={lang} text={lessonText} />
          <div className="rounded-[2rem] border-4 border-white bg-white p-5 text-center shadow-[0_7px_0_rgba(0,0,0,.12)]">
            {inConcept ? concept.visual : <NumberValueStepVisual n={currentNumber} emoji={currentEmoji} phase={phase} lang={lang} />}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button disabled={step === 0 && phase === 0} onClick={previous} className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40">{t.previous}</button>
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            <button onClick={next} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">{step < examples.length + conceptSlides.length - 1 || (!inConcept && phase < maxPhase) ? t.next : t.practice}</button>
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

  if (n === 0) {
    return (
      <div className="space-y-4">
        <NumberTile value={0} lang={lang} showWord={false} />
        <ContainerScene count={0} emoji="🍌" container="basket" numbered />
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xl font-black text-emerald-900">
          {lang === "en" ? "" : ""}
        </p>
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
          {lang === "en" ? `So, there are ${n}.` : `Jadi, ada ${n}.`}
        </p>
      </div>
    );
  }
  if (phase === 3) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledValueGroup label={lang === "en" ? `${n} bananas` : `${n} pisang`} count={n} emoji={emoji} counted />
          <LabeledValueGroup label={lang === "en" ? `${n} leaves` : `${n} daun`} count={n} emoji={alternateEmoji} counted />
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
  return "🍃";
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
      <p className="mb-3 text-xl font-black text-emerald-950">{label}</p>
      {counted ? <CountedObjectRow count={count} emoji={emoji} showCount compact intervalMs={500} /> : <ObjectGroup count={count} emoji={emoji} />}
    </div>
  );
}

function ValueLayoutCard({ label, count, emoji, layout }: { label: string; count: number; emoji: string; layout: "row" | "groups" | "spread" }) {
  const symbol = cleanDisplayText(emoji);
  const items = Array.from({ length: count }, (_, i) => i);
  const layoutClass = layout === "row"
    ? "flex flex-wrap justify-center gap-2"
    : layout === "groups"
      ? "grid grid-cols-3 gap-2"
      : "grid grid-cols-4 gap-x-1 gap-y-4";

  return (
    <div className="rounded-3xl border-2 border-yellow-100 bg-yellow-50 p-4 text-center">
      <p className="mb-3 text-lg font-black text-yellow-900">{label}</p>
      <div className={`${layoutClass} rounded-3xl bg-white p-3`}>
        {items.map((i) => (
          <span key={i} className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-3xl shadow-inner ${layout === "spread" && i % 2 === 1 ? "translate-y-2" : ""}`}>
            {symbol}
          </span>
        ))}
      </div>
      <p className="mt-3 text-2xl font-black text-blue-950">{count}</p>
    </div>
  );
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
      title: lang === "en" ? "Ascending" : "Menaik",
      text: lang === "en" ? "Ascending means numbers go up." : "Menaik bermaksud nombor naik.",
      visual: <SequencingExample nums={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} arrow="right" />,
    },
    {
      title: lang === "en" ? "Numbers get bigger" : "Nombor makin besar",
      text: lang === "en" ? "Tap to see more." : "Tekan untuk lihat lebih banyak.",
      visual: <TapRevealOrder nums={[1, 2, 3, 4]} lang={lang} mode="up" />,
    },
    {
      title: lang === "en" ? "Descending" : "Menurun",
      text: lang === "en" ? "Descending means numbers go down." : "Menurun bermaksud nombor turun.",
      visual: <NumberLineSequence nums={[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} marked={-1} arrow="right" />,
    },
    {
      title: lang === "en" ? "Numbers get smaller" : "Nombor makin kecil",
      text: lang === "en" ? "Tap to see less." : "Tekan untuk lihat lebih sedikit.",
      visual: <TapRevealOrder nums={[4, 3, 2, 1]} lang={lang} mode="down" />,
    },
    {
      title: lang === "en" ? "Sequencing" : "Turutan",
      text: lang === "en" ? "Numbers follow an order." : "Nombor ada turutan.",
      visual: <TapRevealSequence lang={lang} />,
    },
    {
      title: lang === "en" ? "Missing numbers" : "Nombor hilang",
      text: lang === "en" ? "What number is missing?" : "Nombor apa yang hilang?",
      visual: <MissingNumberTeaching lang={lang} nums={[0, 1, 2, "?", 4, 5, 6, 7, 8, 9]} answer={3} />,
    },
    {
      title: lang === "en" ? "Greater than" : "Lebih besar",
      text: lang === "en" ? "5 is more than 2." : "5 lebih banyak daripada 2.",
      visual: <CompareTeachingVisual a={5} b={2} symbol=">" lang={lang} />,
    },
    {
      title: lang === "en" ? "Less than" : "Lebih kecil",
      text: lang === "en" ? "2 is less than 5." : "2 lebih sedikit daripada 5.",
      visual: <CompareTeachingVisual a={2} b={5} symbol="<" lang={lang} />,
    },
  ];
  const current = slides[step];

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.sequencing}: ${t.practice}`} questions={sequencingPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell title={t.sequencing} helper={lang === "en" ? "Learn one step at a time." : "Belajar satu langkah demi satu langkah."}>
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

const GROUPING_ACTIVITIES = [
  { a: 1, b: 1, emoji: "🍌" },
  { a: 1, b: 2, emoji: "🍌" },
  { a: 2, b: 2, emoji: "🍌" },
  { a: 2, b: 3, emoji: "🍌" },
  { a: 3, b: 4, emoji: "🍌" },
  { a: 4, b: 5, emoji: "🍌" },
];

const groupingPracticeQuestions: Question[] = [
  q("group-1-1", "operations", { en: "1 banana and 1 banana. How many bananas?", ms: "1 pisang dan 1 pisang. Berapa pisang?" }, [0, 1, 2, 3], 2, { kind: "add", a: 1, b: 1, emoji: "🍌" }),
  q("group-1-2", "operations", { en: "1 banana and 2 bananas. How many bananas?", ms: "1 pisang dan 2 pisang. Berapa pisang?" }, [1, 2, 3, 4], 3, { kind: "add", a: 1, b: 2, emoji: "🍌" }),
  q("group-2-2", "operations", { en: "2 bananas and 2 bananas. How many bananas?", ms: "2 pisang dan 2 pisang. Berapa pisang?" }, [2, 3, 4, 5], 4, { kind: "add", a: 2, b: 2, emoji: "🍌" }),
  q("group-2-3", "operations", { en: "2 bananas and 3 bananas. How many bananas?", ms: "2 pisang dan 3 pisang. Berapa pisang?" }, [3, 4, 5, 6], 5, { kind: "add", a: 2, b: 3, emoji: "🍌" }),
  q("group-3-3", "operations", { en: "3 bananas and 3 bananas. How many bananas?", ms: "3 pisang dan 3 pisang. Berapa pisang?" }, [4, 5, 6, 7], 6, { kind: "add", a: 3, b: 3, emoji: "🍌" }),
  q("group-3-4", "operations", { en: "3 bananas and 4 bananas. How many bananas?", ms: "3 pisang dan 4 pisang. Berapa pisang?" }, [5, 6, 7, 8], 7, { kind: "add", a: 3, b: 4, emoji: "🍌" }),
  q("group-4-5", "operations", { en: "4 bananas and 5 bananas. How many bananas?", ms: "4 pisang dan 5 pisang. Berapa pisang?" }, [6, 7, 8, 9], 9, { kind: "add", a: 4, b: 5, emoji: "🍌" }),
];

const fullGroupingPracticeQuestions: Question[] = [
  q("group-observe-2", "operations", { en: "This group has how many bananas?", ms: "Kumpulan ini ada berapa pisang?" }, [1, 2, 3, 4], 2, { kind: "groupObserve", emoji: "🍌", count: 2 }),
  q("group-make-3", "operations", { en: "Make a group of 3.", ms: "Bina kumpulan 3." }, [1, 2, 3, 4], 3, { kind: "groupMake", emoji: "🍌", count: 3 }),
  q("group-choose-4", "operations", { en: "Which group has 4?", ms: "Kumpulan mana ada 4?" }, [2, 4, 5], 4, { kind: "groupChoices", emoji: "🍌", groups: [2, 4, 5] }),
  q("group-two-2-3", "operations", { en: "Group 1 has 2. Group 2 has 3. What is in Group 2?", ms: "Kumpulan 1 ada 2. Kumpulan 2 ada 3. Apa ada dalam Kumpulan 2?" }, [1, 2, 3, 4], 3, { kind: "groupTwo", emoji: "🍌", a: 2, b: 3 }),
  q("group-same-3-3", "operations", { en: "Are the groups the same?", ms: "Adakah kumpulan sama?" }, ["Yes", "No"], "Yes", { kind: "groupCompare", emoji: "🍌", a: 3, b: 3, ask: "same" }),
  q("group-same-2-5", "operations", { en: "Are the groups the same?", ms: "Adakah kumpulan sama?" }, ["Yes", "No"], "No", { kind: "groupCompare", emoji: "🍌", a: 2, b: 5, ask: "same" }),
  q("group-more-3-5", "operations", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, ["Group A", "Group B"], "Group B", { kind: "groupCompare", emoji: "🍌", a: 3, b: 5, ask: "more" }),
  q("group-more-4-2", "operations", { en: "Which group has more?", ms: "Kumpulan mana lebih banyak?" }, ["Group A", "Group B"], "Group A", { kind: "groupCompare", emoji: "🍌", a: 4, b: 2, ask: "more" }),
  q("group-combine-1-1", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [1, 2, 3, 4], 2, { kind: "groupCombine", emoji: "🍌", a: 1, b: 1 }),
  q("group-combine-1-2", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [2, 3, 4, 5], 3, { kind: "groupCombine", emoji: "🍌", a: 1, b: 2 }),
  q("group-combine-2-2", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [3, 4, 5, 6], 4, { kind: "groupCombine", emoji: "🍌", a: 2, b: 2 }),
  q("group-combine-2-3", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [4, 5, 6, 7], 5, { kind: "groupCombine", emoji: "🍌", a: 2, b: 3 }),
  q("group-combine-3-3", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [5, 6, 7, 8], 6, { kind: "groupCombine", emoji: "🍌", a: 3, b: 3 }),
  q("group-combine-3-4", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [6, 7, 8, 9], 7, { kind: "groupCombine", emoji: "🍌", a: 3, b: 4 }),
  q("group-combine-4-5", "operations", { en: "How many altogether?", ms: "Berapa semuanya?" }, [7, 8, 9], 9, { kind: "groupCombine", emoji: "🍌", a: 4, b: 5 }),
];

type GroupingPhase = "makeA" | "checkA" | "makeB" | "checkB" | "explain" | "combine" | "answer";

function LegacyGroupingMode({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [phase, setPhase] = useState<GroupingPhase>("makeA");
  const [groupA, setGroupA] = useState(0);
  const [groupB, setGroupB] = useState(0);
  const [practice, setPractice] = useState(false);
  const activity = GROUPING_ACTIVITIES[activityIndex];
  const activeGroup = phase === "makeB" || phase === "checkB" ? 2 : 1;
  const activeCount = activeGroup === 1 ? groupA : groupB;
  const activeTarget = activeGroup === 1 ? activity.a : activity.b;
  const total = activity.a + activity.b;
  const canEdit = phase === "makeA" || phase === "makeB" || ((phase === "checkA" || phase === "checkB") && activeCount !== activeTarget);
  const combined = phase === "combine" || phase === "answer";
  const feedback = getGroupingFeedback(lang, activeCount, activeTarget, activeGroup);
  const instruction = getGroupingInstruction(lang, phase, activity.a, activity.b, total);

  const resetActivity = (nextIndex: number) => {
    setActivityIndex(nextIndex);
    setGroupA(0);
    setGroupB(0);
    setPhase("makeA");
  };

  const addObject = () => {
    if (!canEdit) return;
    if (activeGroup === 1) setGroupA((count) => Math.min(9, count + 1));
    else setGroupB((count) => Math.min(9, count + 1));
  };

  const removeObject = () => {
    if (!canEdit) return;
    if (activeGroup === 1) setGroupA((count) => Math.max(0, count - 1));
    else setGroupB((count) => Math.max(0, count - 1));
  };

  const checkGroup = () => {
    if (activeGroup === 1) {
      setPhase("checkA");
      return;
    }
    setPhase("checkB");
  };

  const nextActivity = () => {
    if (activityIndex < GROUPING_ACTIVITIES.length - 1) resetActivity(activityIndex + 1);
    else setPractice(true);
  };

  if (practice) {
    return <Quiz lang={lang} t={t} title={`${t.groupingMode}: ${t.practice}`} questions={groupingPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPractice(false)} />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl pb-8">
      <LessonShell
        title={lang === "en" ? "Grouping Mode: Banana Snack" : "Mod Kumpulan: Snek Pisang"}
        helper={lang === "en" ? "Make two banana groups. Then count all." : "Bina dua kumpulan pisang. Kemudian kira semua."}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
          <img src={chrysHappy} alt="Chrys" className="mx-auto h-28 w-28 object-contain" />
          <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
            <p className="text-xl font-black text-blue-950">{instruction}</p>
            <p className="mt-1 text-sm font-bold text-blue-800/70">
              {lang === "en" ? "Tap banana to add one." : "Tekan pisang untuk tambah satu."}
            </p>
            <div className="mt-3">
              <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPractice(true)} variant="green" />
            </div>
          </div>
        </div>

        {phase === "answer" && (
          <div className="mb-4 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-4xl font-black text-emerald-800">{activity.a} + {activity.b} = {total}</p>
            <p className="mt-2 text-xl font-black text-emerald-900">
              {lang === "en" ? `${activity.a} bananas and ${activity.b} bananas make ${total} bananas.` : `${activity.a} pisang dan ${activity.b} pisang menjadi ${total} pisang.`}
            </p>
            <p className="mt-1 text-lg font-black text-emerald-800">
              {lang === "en" ? `Chrys has ${total} bananas altogether.` : `Chrys ada ${total} pisang semuanya.`}
            </p>
          </div>
        )}

        <div className="rounded-[2rem] border-4 border-white bg-[linear-gradient(180deg,#e0f7ff_0%,#efffdc_58%,#d5f28b_100%)] p-4 shadow-inner">
        <div className={`grid gap-4 transition-all duration-700 ${combined ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {combined ? (
            <CombinedGroupBox a={groupA} b={groupB} targetA={activity.a} targetB={activity.b} emoji={activity.emoji} lang={lang} />
          ) : (
            <>
              <GroupingBox
                title={lang === "en" ? "Group 1" : "Kumpulan 1"}
                target={activity.a}
                count={groupA}
                emoji={activity.emoji}
                active={activeGroup === 1}
                lang={lang}
              />
              <GroupingBox
                title={lang === "en" ? "Group 2" : "Kumpulan 2"}
                target={activity.b}
                count={groupB}
                emoji={activity.emoji}
                active={activeGroup === 2}
                lang={lang}
              />
            </>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <img src={chrysHappy} alt="Chrys the monkey" className="h-28 w-28 object-contain drop-shadow-xl" />
        </div>
        </div>

        {(phase === "checkA" || phase === "checkB") && (
          <div className="mt-4 rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className={`text-xl font-black ${feedback.correct ? "text-emerald-700" : "text-orange-700"}`}>{feedback.title}</p>
            <p className="mt-1 font-bold text-slate-700">{feedback.detail}</p>
            <CountedObjectRow count={activeCount} emoji={activity.emoji} showCount compact />
            {feedback.correct && (
              <button
                onClick={() => setPhase(phase === "checkA" ? "makeB" : "explain")}
                className="mt-3 rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#065f46] active:translate-y-1"
              >
                {t.next}
              </button>
            )}
          </div>
        )}

        {phase === "explain" && (
          <div className="mt-4 rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="mb-2 text-4xl font-black text-blue-950">{activity.a} + {activity.b} = ?</p>
            <p className="text-3xl font-black text-blue-900">+</p>
            <p className="text-xl font-black text-slate-800">
              {lang === "en" ? "The + sign joins the groups." : "Tanda + gabungkan kumpulan."}
            </p>
          </div>
        )}

        {canEdit && (
          <div className="mt-5 rounded-3xl border-2 border-amber-100 bg-white p-4">
            <p className="mb-3 text-center text-lg font-black text-slate-700">
              {lang === "en" ? `Can you make a group of ${activeTarget}?` : `Boleh bina kumpulan ${activeTarget}?`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={addObject} className="grid h-20 w-20 place-items-center rounded-3xl border-2 border-yellow-300 bg-yellow-50 text-5xl shadow-[0_5px_0_rgba(180,83,9,.25)] active:translate-y-1">
                {activity.emoji}
              </button>
              <button onClick={removeObject} className="flex items-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-3 font-black text-red-700 shadow-[0_4px_0_rgba(185,28,28,.16)] active:translate-y-1">
                <span className="relative inline-grid h-8 w-8 place-items-center rounded-xl bg-white text-xl">
                  {activity.emoji}
                  <span className="absolute text-3xl font-black leading-none text-red-600">×</span>
                </span>
                {lang === "en" ? "Remove one" : "Buang satu"}
              </button>
              <button onClick={checkGroup} className="rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-6 py-3 font-black text-white shadow-[0_5px_0_#065f46] active:translate-y-1">
                {lang === "en" ? "Check group" : "Semak kumpulan"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button
            onClick={() => resetActivity(0)}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
          >
            {lang === "en" ? "Start again" : "Mula semula"}
          </button>
          <div className="flex flex-wrap justify-end gap-3">
            {phase === "explain" && (
              <button onClick={() => setPhase("combine")} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">
              {lang === "en" ? "Join groups" : "Gabung kumpulan"}
              </button>
            )}
            {phase === "combine" && (
              <button onClick={() => setPhase("answer")} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">
                {lang === "en" ? "Show answer" : "Tunjuk jawapan"}
              </button>
            )}
            {phase === "answer" && (
              <button onClick={nextActivity} className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-8 py-3 font-black text-white shadow-[0_6px_0_#1e3a8a] active:translate-y-1">
                {activityIndex < GROUPING_ACTIVITIES.length - 1 ? t.next : t.done}
              </button>
            )}
          </div>
        </div>
      </LessonShell>
    </main>
  );
}

function getGroupingInstruction(lang: Lang, phase: GroupingPhase, a: number, b: number, total: number) {
  if (lang === "ms") {
    if (phase === "makeA" || phase === "checkA") return `Chrys jumpa ${a} pisang. Bina Kumpulan 1.`;
    if (phase === "makeB" || phase === "checkB") return `Chrys jumpa ${b} pisang lagi. Bina Kumpulan 2.`;
    if (phase === "explain") return `${a} ialah satu kumpulan. ${b} ialah satu kumpulan lagi.`;
    if (phase === "combine") return `Gerakkan kumpulan bersama untuk lihat jumlahnya.`;
    return `${a} tambah ${b} menjadi ${total}.`;
  }
  if (phase === "makeA" || phase === "checkA") return `Chrys found ${a} bananas. Make Group 1.`;
  if (phase === "makeB" || phase === "checkB") return `Chrys found ${b} more bananas. Make Group 2.`;
  if (phase === "explain") return `${a} is one group. ${b} is another group.`;
  if (phase === "combine") return `Put both groups together.`;
  return `${a} plus ${b} makes ${total}.`;
}

function getGroupingFeedback(lang: Lang, count: number, target: number, group: number) {
  const correct = count === target;
  if (lang === "ms") {
    return correct
      ? { correct, title: `Bagus! Kumpulan ini ada ${target}.`, detail: `Kumpulan ${group} sudah betul.` }
      : { correct, title: "Cubaan baik. Mari kira kumpulan ini semula.", detail: `Kita perlukan ${target}, tetapi sekarang ada ${count}.` };
  }
  return correct
    ? { correct, title: `Great job! This group has ${target}.`, detail: `Group ${group} is ready.` }
    : { correct, title: "Good try. Count again.", detail: `Need ${target}. Now there are ${count}.` };
}

function GroupingBox({ title, target, count, emoji, active, lang }: { title: string; target: number; count: number; emoji: string; active: boolean; lang: Lang }) {
  return (
    <div className={`rounded-[2rem] border-4 p-4 transition-all duration-500 ${active ? "border-yellow-400 bg-yellow-50 shadow-[0_7px_0_rgba(180,83,9,.22)]" : "border-blue-100 bg-white"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-2xl font-black text-blue-950">{title}</h3>
          <p className="text-sm font-black text-slate-500">{lang === "en" ? `Make ${target}` : `Bina ${target}`}</p>
        </div>
        {active && <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-yellow-950">{lang === "en" ? "active" : "aktif"}</span>}
      </div>
      <ObjectGroup count={count} emoji={emoji} numbered />
    </div>
  );
}

function CombinedGroupBox({ a, b, targetA, targetB, emoji, lang }: { a: number; b: number; targetA: number; targetB: number; emoji: string; lang: Lang }) {
  return (
    <div className="rounded-[2rem] border-4 border-emerald-300 bg-emerald-50 p-4 text-center shadow-[0_7px_0_rgba(6,95,70,.22)]">
      <h3 className="mb-3 text-2xl font-black text-emerald-900">
        {lang === "en" ? "One big group" : "Satu kumpulan besar"}
      </h3>
      <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-3xl border-2 border-blue-100 bg-white p-3">
          <p className="mb-2 font-black text-blue-900">{lang === "en" ? `Group 1: ${targetA}` : `Kumpulan 1: ${targetA}`}</p>
          <ObjectGroup count={a} emoji={emoji} />
        </div>
        <span className="text-4xl font-black text-emerald-700">+</span>
        <div className="rounded-3xl border-2 border-blue-100 bg-white p-3">
          <p className="mb-2 font-black text-blue-900">{lang === "en" ? `Group 2: ${targetB}` : `Kumpulan 2: ${targetB}`}</p>
          <ObjectGroup count={b} emoji={emoji} />
        </div>
      </div>
      <CountedObjectRow count={a + b} emoji={emoji} showCount compact />
    </div>
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
              <button onClick={addObject} className="grid h-20 w-20 place-items-center rounded-3xl border-2 border-yellow-300 bg-yellow-50 text-5xl shadow-[0_5px_0_rgba(180,83,9,.25)] active:translate-y-1">
                {activity.emoji}
              </button>
              <button onClick={removeObject} className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-3 font-black text-red-700 shadow-[0_4px_0_rgba(185,28,28,.16)] active:translate-y-1">
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

function OperationsLesson({ lang, t, onDone }: { lang: Lang; t: UIStrings; onDone: () => void }) {
  const [phase, setPhase] = useState<"addIntro" | "addSign" | "addStory" | "addPractice" | "subIntro" | "subSign" | "subStory" | "subPractice">("addIntro");
  const skipToCurrentPractice = () => setPhase(phase.startsWith("add") ? "addPractice" : "subPractice");
  const skipToSubtraction = () => setPhase("subIntro");

  if (phase === "addPractice") {
    return (
      <Quiz
        lang={lang}
        t={t}
        title={lang === "en" ? `${t.learnOperations}: Addition practice` : `${t.learnOperations}: Latihan tambah`}
        questions={additionPracticeQuestions}
        onFinish={() => setPhase("subIntro")}
        extraAction={{ label: skipSubtractionLabel(lang), onClick: skipToSubtraction }}
        onBackToLearning={() => setPhase("addIntro")}
      />
    );
  }

  if (phase === "subPractice") {
    return (
      <Quiz
        lang={lang}
        t={t}
        title={lang === "en" ? `${t.learnOperations}: Subtraction practice` : `${t.learnOperations}: Latihan tolak`}
        questions={subtractionPracticeQuestions}
        onFinish={() => onDone()}
        onBackToLearning={() => setPhase("subIntro")}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell
        title={t.learnOperations}
        helper={phase.startsWith("add")
          ? (lang === "en"
            ? "Learn addition. Then try questions."
            : "Mula-mula belajar tambah dengan Chrys, kemudian cuba soalan.")
          : (lang === "en"
            ? "Learn subtraction. Take away from one group."
            : "Sekarang belajar tolak dengan mengambil daripada satu kumpulan.")}
      >
        {phase === "addIntro" && (
          <AdditionIntroStep
            title={lang === "en" ? "Addition" : "Tambah"}
            text={lang === "en" ? "Addition puts groups together." : "Tambah gabungkan kumpulan."}
            onNext={() => setPhase("addSign")}
            t={t}
            actions={[
              { label: skipPracticeLabel(lang), onClick: skipToCurrentPractice, variant: "green" },
              { label: skipSubtractionLabel(lang), onClick: skipToSubtraction },
            ]}
          />
        )}
        {phase === "addSign" && (
          <SymbolIntro
            title={lang === "en" ? "The plus sign" : "Tanda tambah"}
            symbol="+"
            text={lang === "en" ? "The + sign means we add more." : "Tanda + bermaksud kita tambah lagi."}
            onNext={() => setPhase("addStory")}
            t={t}
            actions={[
              { label: skipPracticeLabel(lang), onClick: skipToCurrentPractice, variant: "green" },
              { label: skipSubtractionLabel(lang), onClick: skipToSubtraction },
            ]}
          />
        )}
        {phase === "addStory" && (
          <ChrysAdditionStory
            lang={lang}
            t={t}
            onPrev={() => setPhase("addSign")}
            onDone={() => setPhase("addPractice")}
            onSkipPractice={skipToCurrentPractice}
            onSkipSubtraction={skipToSubtraction}
          />
        )}
        {phase === "subIntro" && (
          <AdditionIntroStep
            title={lang === "en" ? "Subtraction" : "Tolak"}
            text={lang === "en" ? "Subtraction takes away from one group." : "Tolak ambil daripada satu kumpulan."}
            onNext={() => setPhase("subSign")}
            t={t}
            actions={[
              { label: skipPracticeLabel(lang), onClick: skipToCurrentPractice, variant: "green" },
            ]}
          />
        )}
        {phase === "subSign" && (
          <SymbolIntro
            title={lang === "en" ? "The minus sign" : "Tanda tolak"}
            symbol="-"
            text={lang === "en" ? "The - sign means take away." : "Tanda - bermaksud ambil."}
            onNext={() => setPhase("subStory")}
            t={t}
            actions={[
              { label: skipPracticeLabel(lang), onClick: skipToCurrentPractice, variant: "green" },
            ]}
          />
        )}
        {phase === "subStory" && (
          <ChrysSubtractionStory
            lang={lang}
            t={t}
            onPrev={() => setPhase("subSign")}
            onDone={() => setPhase("subPractice")}
            onSkipPractice={skipToCurrentPractice}
          />
        )}
      </LessonShell>
    </main>
  );
}

function AdditionOnlyLesson({ lang, t, onDone, onSkipSubtraction }: { lang: Lang; t: UIStrings; onDone: () => void; onSkipSubtraction?: () => void }) {
  const [phase, setPhase] = useState<"intro" | "sign" | "story" | "practice">("intro");

  if (phase === "practice") {
    return <Quiz lang={lang} t={t} title={`${t.addition}: ${t.practice}`} questions={additionPracticeQuestions} randomize={false} onFinish={() => onDone()} onBackToLearning={() => setPhase("intro")} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell title={t.addition} helper={lang === "en" ? "Add more. Count all." : "Tambah lagi. Kira semua."}>
        {phase === "intro" && (
          <AdditionIntroStep
            title={t.addition}
            text={lang === "en" ? "Addition puts groups together." : "Tambah gabungkan kumpulan."}
            onNext={() => setPhase("sign")}
            t={t}
            actions={[
              { label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" },
              ...(onSkipSubtraction ? [{ label: skipSubtractionLabel(lang), onClick: onSkipSubtraction }] : []),
            ]}
          />
        )}
        {phase === "sign" && (
          <SymbolIntro
            title={lang === "en" ? "The plus sign" : "Tanda tambah"}
            symbol="+"
            text={lang === "en" ? "The + sign means add more." : "Tanda + bermaksud tambah lagi."}
            onNext={() => setPhase("story")}
            t={t}
            actions={[
              { label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" },
              ...(onSkipSubtraction ? [{ label: skipSubtractionLabel(lang), onClick: onSkipSubtraction }] : []),
            ]}
          />
        )}
        {phase === "story" && (
          <ChrysAdditionStory
            lang={lang}
            t={t}
            onPrev={() => setPhase("sign")}
            onDone={() => setPhase("practice")}
            onSkipPractice={() => setPhase("practice")}
            onSkipSubtraction={onSkipSubtraction}
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
      <LessonShell title={t.subtraction} helper={lang === "en" ? "Take away. Count what is left." : "Ambil. Kira yang tinggal."}>
        {phase === "intro" && (
          <AdditionIntroStep
            title={t.subtraction}
            text={lang === "en" ? "Subtraction takes away from one group." : "Tolak ambil daripada satu kumpulan."}
            onNext={() => setPhase("sign")}
            t={t}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
        {phase === "sign" && (
          <SymbolIntro
            title={lang === "en" ? "The minus sign" : "Tanda tolak"}
            symbol="-"
            text={lang === "en" ? "The - sign means take away." : "Tanda - bermaksud ambil."}
            onNext={() => setPhase("story")}
            t={t}
            actions={[{ label: skipPracticeLabel(lang), onClick: () => setPhase("practice"), variant: "green" }]}
          />
        )}
        {phase === "story" && (
          <ChrysSubtractionStory
            lang={lang}
            t={t}
            onPrev={() => setPhase("sign")}
            onDone={() => setPhase("practice")}
            onSkipPractice={() => setPhase("practice")}
          />
        )}
      </LessonShell>
    </main>
  );
}

function AdditionIntroStep({ title, text, onNext, t, actions }: {
  title: string;
  text: string;
  onNext: () => void;
  t: UIStrings;
  actions?: LessonAction[];
}) {
  return (
    <div className="space-y-5 text-center">
      <img src={chrysHappy} alt="Chrys happy" className="mx-auto h-36 w-36 object-contain" />
      <div className="rounded-3xl border-2 border-emerald-100 bg-white p-5 text-left">
        <h3 className="text-3xl font-black text-blue-950">{title}</h3>
        <p className="mt-3 text-xl font-black leading-snug text-slate-700">{text}</p>
      </div>
      <LessonActionRow primaryLabel={t.next} onPrimary={onNext} actions={actions} />
    </div>
  );
}

function ChrysAdditionStory({ lang, t, onPrev, onDone, onSkipPractice, onSkipSubtraction }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  onSkipPractice: () => void;
  onSkipSubtraction?: () => void;
}) {
  const [step, setStep] = useState(0);
  const totalSteps = 7;
  const storyText = lang === "en"
    ? [
      "Chrys eats 2 bananas.",
      "Chrys eats 2 bananas.",
      "Then Chrys eats 3 more bananas.",
      "Then Chrys eats 3 more bananas.",
      "2 bananas and 3 more bananas make 5 bananas.",
      "The + sign adds more bananas.",
      "So, 2 + 3 = 5.",
    ]
    : [
      "Chrys makan 2 pisang.",
      "Chrys makan 2 pisang.",
      "Kemudian Chrys makan 3 pisang lagi.",
      "Kemudian Chrys makan 3 pisang lagi.",
      "2 pisang dan 3 pisang lagi menjadi 5 pisang.",
      "Tanda + bermaksud Chrys menambah pisang lagi.",
      "Jadi, 2 + 3 = 5.",
    ];
  const showFirst = step <= 1;
  const eatFirst = step === 1;
  const showSecond = step >= 2 && step <= 3;
  const eatSecond = step === 3;
  const bellyTarget = step >= 3 ? 5 : step >= 1 ? 2 : 0;
  const helperText = step < 4
    ? storyText[step]
    : lang === "en"
      ? "Now write it."
      : "Sekarang kita boleh tulis ayat nombor.";

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <h3 className="text-3xl font-black text-blue-950">{lang === "en" ? "Chrys and bananas" : "Chrys dan pisang"}</h3>
        <p className="mt-2 text-lg font-black text-slate-700">{helperText}</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="min-h-40 rounded-3xl border-2 border-amber-100 bg-amber-50 p-4">
            {showFirst && <StoryBananaGroup count={2} eating={eatFirst} label={lang === "en" ? "2 bananas" : "2 pisang"} />}
            {showSecond && <StoryBananaGroup count={3} eating={eatSecond} label={lang === "en" ? "3 more bananas" : "3 pisang lagi"} />}
            {step >= 4 && (
              <div className="grid h-full min-h-32 place-items-center rounded-3xl bg-emerald-50 text-center">
                <ObjectGroup count={5} emoji="ðŸŒ" numbered />
              </div>
            )}
          </div>

          <div className="relative mx-auto grid w-40 place-items-center">
            <img src={chrysHappy} alt="Chrys eating bananas" className={`h-36 w-36 object-contain transition-transform duration-700 ${eatFirst || eatSecond ? "scale-110" : ""}`} />
            {(eatFirst || eatSecond) && <span className="absolute right-2 top-1 text-3xl">ðŸŒ</span>}
          </div>

          {bellyTarget > 0 && (
            <BellyCounter
              target={bellyTarget}
              counting={eatSecond}
              label={lang === "en" ? "belly counter" : "kira dalam perut"}
              unit={lang === "en" ? "bananas" : "pisang"}
              lang={lang}
            />
          )}
        </div>

        {step >= 4 && (
          <div className="mt-5 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-4xl font-black text-emerald-800">2 + 3 = 5</p>
            <p className="mt-2 text-lg font-black text-emerald-900">{storyText[step]}</p>
          </div>
        )}
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
          {step < totalSteps - 1 ? t.next : t.practice}
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={onSkipPractice} variant="green" />
        {onSkipSubtraction && <SecondaryLessonButton label={skipSubtractionLabel(lang)} onClick={onSkipSubtraction} />}
      </div>
    </div>
  );
}

function ChrysSubtractionStory({ lang, t, onPrev, onDone, onSkipPractice }: {
  lang: Lang;
  t: UIStrings;
  onPrev: () => void;
  onDone: () => void;
  onSkipPractice: () => void;
}) {
  const [complete, setComplete] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4 text-center">
        <h3 className="text-3xl font-black text-blue-950">{lang === "en" ? "Chrys takes away bananas" : "Chrys mengambil pisang"}</h3>
        <p className="mt-2 text-lg font-black text-slate-700">{lang === "en" ? "Use one banana group. Tap each step." : "Guna satu kumpulan pisang. Tekan setiap langkah."}</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_6px_0_rgba(0,0,0,.12)]">
        <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
          <div className="relative mx-auto grid w-36 place-items-center">
            <img src={chrysThinking} alt="Chrys thinking" className="h-32 w-32 object-contain" />
          </div>
          <InteractiveSubtractionFlow start={7} takeAway={3} emoji="🍌" lang={lang} onComplete={() => setComplete(true)} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500"
        >
          {t.previous}
        </button>
        <button
          disabled={!complete}
          onClick={onDone}
          className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1 disabled:opacity-40"
        >
          {t.practice}
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={onSkipPractice} variant="green" />
      </div>
    </div>
  );
}

function StoryBananaGroup({ count, eating, label }: { count: number; eating: boolean; label: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-3">
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl shadow-inner transition-all duration-1000 ${eating ? "translate-x-24 -translate-y-4 scale-50 opacity-0" : "translate-x-0 opacity-100"}`}
            style={{ transitionDelay: `${i * 220}ms` }}
          >
            ðŸŒ
          </span>
        ))}
      </div>
      <p className="text-xl font-black text-amber-900">{label}</p>
    </div>
  );
}

function BellyCounter({ target, counting, label, unit, lang }: { target: number; counting: boolean; label: string; unit: string; lang: Lang }) {
  const [visible, setVisible] = useState(target);

  useEffect(() => {
    if (target === 0) {
      setVisible(0);
      return;
    }
    if (!counting) {
      setVisible(target);
      return;
    }
    setVisible(0);
    speakCountingSequence(target, lang);
    const timers = Array.from({ length: target }, (_, i) => window.setTimeout(() => setVisible(i + 1), 450 * (i + 1)));
    return () => timers.forEach(window.clearTimeout);
  }, [counting, target]);

  return (
    <div className="mx-auto flex min-h-40 w-full max-w-52 flex-col items-center justify-center rounded-[2rem] border-4 border-pink-200 bg-pink-50 p-4 text-center shadow-inner">
      <p className="text-sm font-black uppercase text-pink-700">{label}</p>
      <div className="my-3 grid h-24 w-24 place-items-center rounded-full border-4 border-pink-300 bg-white">
        <span className="text-4xl font-black text-pink-700">{visible}</span>
      </div>
      <p className="text-lg font-black text-pink-900">{visible} {unit}</p>
      <div className="mt-2 flex max-w-40 flex-wrap justify-center gap-1">
        {Array.from({ length: visible }, (_, i) => <span key={i} className="text-lg">ðŸŒ</span>)}
      </div>
    </div>
  );
}

function SymbolIntro({ title, symbol, text, onNext, t, actions }: {
  title: string;
  symbol: "+" | "-";
  text: string;
  onNext: () => void;
  t: UIStrings;
  actions?: LessonAction[];
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <img src={alyseTeaching} alt="Alyse teaching" className="mx-auto h-32 w-32 object-contain" />
        <div className="rounded-3xl border-2 border-emerald-100 bg-white p-5 text-left">
          <h3 className="text-2xl font-black text-blue-950">{title}</h3>
          <p className="mt-2 text-lg font-black text-slate-600">{text}</p>
        </div>
      </div>
      <div className="mx-auto grid h-40 w-40 place-items-center rounded-[2rem] border-4 border-yellow-400 bg-yellow-100 text-8xl font-black text-blue-900 shadow-[0_8px_0_rgba(0,0,0,.16)]">
        {symbol}
      </div>
      <LessonActionRow primaryLabel={t.next} onPrimary={onNext} actions={actions} />
    </div>
  );
}

function LessonActionRow({ primaryLabel, onPrimary, actions = [] }: { primaryLabel: string; onPrimary: () => void; actions?: LessonAction[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {actions.map((action) => (
        <SecondaryLessonButton key={action.label} label={action.label} onClick={action.onClick} variant={action.variant} />
      ))}
      <button onClick={onPrimary} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000] active:translate-y-1">
        {primaryLabel}
      </button>
    </div>
  );
}

function SecondaryLessonButton({ label, onClick, variant = "plain" }: LessonAction) {
  const styles = variant === "green"
    ? "border-emerald-600 bg-emerald-500 text-white shadow-[0_5px_0_#065f46]"
    : "border-blue-200 bg-white text-blue-700 shadow-[0_5px_0_rgba(30,64,175,.18)]";

  return (
    <button onClick={onClick} className={`rounded-2xl border-2 px-5 py-3 font-black active:translate-y-1 ${styles}`}>
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
          <LabeledGroup count={2} label="2" emoji="ðŸŒ" />
          <div className="text-center text-5xl font-black text-blue-800">+</div>
          {step >= 1 ? <LabeledGroup count={3} label="3" emoji="ðŸŒ" /> : <div className="rounded-3xl border-4 border-dashed border-slate-200 p-8 text-center font-black text-slate-300">?</div>}
        </div>
      ) : (
        <CountedObjectRow count={5} emoji="ðŸŒ" showCount={showCount} />
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
      <CountedObjectRow count={7} emoji="ðŸŒ" crossed={showCross ? 3 : 0} showCount={showCount} countRemainingOnly showCrossCount={showCross} />
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
  const intervalMs = 720;
  const crossed = phase === "start" ? 0 : takeAway;
  const showRemainingCount = phase === "counting" || phase === "done";
  const showCrossCount = phase !== "start";

  useEffect(() => {
    if (phase !== "crossing") return;
    const timer = window.setTimeout(() => setPhase("crossed"), Math.max(700, takeAway * intervalMs + 350));
    return () => window.clearTimeout(timer);
  }, [intervalMs, phase, takeAway]);

  useEffect(() => {
    if (phase !== "counting") return;
    const timer = window.setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, Math.max(700, left * intervalMs + 350));
    return () => window.clearTimeout(timer);
  }, [intervalMs, left, onComplete, phase]);

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
          speakCount={phase === "counting"}
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

function CountedObjectRow({ count, emoji, crossed = 0, showCount, countRemainingOnly = false, animateCrossOut = false, compact = false, showCrossCount = false, intervalMs = 450, speakCount = false, lang = "en" }: {
  count: number;
  emoji: string;
  crossed?: number;
  showCount: boolean;
  countRemainingOnly?: boolean;
  animateCrossOut?: boolean;
  compact?: boolean;
  showCrossCount?: boolean;
  intervalMs?: number;
  speakCount?: boolean;
  lang?: Lang;
}) {
  const remaining = count - crossed;
  const [visible, setVisible] = useState(0);
  const [visibleCrossed, setVisibleCrossed] = useState(animateCrossOut ? 0 : crossed);
  const symbol = cleanDisplayText(emoji);

  useEffect(() => {
    if (!animateCrossOut) {
      setVisibleCrossed(crossed);
      return;
    }
    setVisibleCrossed(0);
    const timers = Array.from({ length: crossed }, (_, i) => window.setTimeout(() => setVisibleCrossed(i + 1), intervalMs * (i + 1)));
    return () => timers.forEach(window.clearTimeout);
  }, [animateCrossOut, crossed, intervalMs]);

  useEffect(() => {
    setVisible(0);
    if (!showCount) return;
    const max = countRemainingOnly ? remaining : count;
    const countDelay = animateCrossOut ? (crossed * intervalMs) + intervalMs : 0;
    const speechTimer = speakCount && max > 0 ? window.setTimeout(() => speakCountingSequence(max, lang), countDelay) : null;
    const timers = Array.from({ length: max }, (_, i) => window.setTimeout(() => setVisible(i + 1), countDelay + (intervalMs * (i + 1))));
    return () => {
      timers.forEach(window.clearTimeout);
      if (speechTimer) window.clearTimeout(speechTimer);
    };
  }, [animateCrossOut, count, countRemainingOnly, crossed, intervalMs, lang, remaining, showCount, speakCount]);

  let leftIndex = 0;
  return (
    <div className={`flex flex-wrap justify-center rounded-3xl border-2 border-slate-100 bg-white ${compact ? "gap-2 p-3" : "gap-3 p-4"}`}>
      {Array.from({ length: count }, (_, i) => {
        const gone = i < visibleCrossed;
        const willBeTaken = i < crossed;
        const shouldCount = showCount && (!countRemainingOnly || !willBeTaken);
        const label = shouldCount ? ++leftIndex : 0;
        const labelVisible = shouldCount && label <= visible;
        const crossLabelVisible = showCrossCount && willBeTaken && i < visibleCrossed;
        return (
          <div key={i} className={`relative flex flex-col items-center justify-center rounded-2xl bg-amber-50 shadow-inner ${compact ? "h-20 w-12 pt-4 text-3xl" : "h-24 w-16 pt-5 text-4xl"}`}>
            {crossLabelVisible ? (
              <span className={`absolute top-1 rounded-full bg-red-600 px-2 font-black text-white transition-opacity ${compact ? "text-xs" : "text-sm"}`}>
                {i + 1}
              </span>
            ) : (
              <span className={`absolute top-1 rounded-full bg-blue-600 px-2 font-black text-white transition-opacity ${compact ? "text-xs" : "text-sm"} ${labelVisible ? "opacity-100" : "opacity-0"}`}>
                {labelVisible ? label : "."}
              </span>
            )}
            <span className={`transition-all duration-300 ${gone ? "scale-95 opacity-25 grayscale brightness-125" : "opacity-100"}`}>{symbol}</span>
            {gone && <span className={`absolute font-black text-red-500 transition-opacity duration-300 ${compact ? "top-0 text-4xl" : "top-1 text-5xl"}`}>x</span>}
          </div>
        );
      })}
    </div>
  );
}

function ConceptLesson({ lang, t, title, intro, note, questions, onDone, randomizePractice }: {
  lang: Lang;
  t: UIStrings;
  title: string;
  intro: string;
  note: string;
  questions: Question[];
  onDone: () => void;
  randomizePractice?: boolean;
}) {
  const examples = useMemo(() => shuffled(questions).slice(0, 3), [questions]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"examples" | "practice">("examples");
  const current = examples[index];

  if (phase === "practice") {
    return (
      <Quiz
        lang={lang}
        t={t}
        title={lang === "en" ? `${title}: Practice` : `${title}: Latihan`}
        questions={questions}
        randomize={randomizePractice ?? true}
        onFinish={() => onDone()}
        onBackToLearning={() => setPhase("examples")}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell title={title} helper={intro}>
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <img src={alyseTeaching} alt="Alyse teaching" className="mx-auto h-32 w-32 object-contain" />
          <div className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
            <p className="text-lg font-black text-blue-950">{note}</p>
            <p className="mt-2 text-sm font-bold text-blue-800/70">{lang === "en" ? "Look. Count. Answer." : "Lihat. Kira. Jawab."}</p>
          </div>
        </div>
        <div className="mt-5 rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_7px_0_rgba(0,0,0,.14)]">
          <h3 className="mb-3 text-center text-xl font-black text-slate-900">{current.text[lang]}</h3>
          <VisualDisplay visual={current.visual} lang={lang} />
          <WorkedMethod q={current} lang={lang} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-500 disabled:opacity-40"
          >
            {t.previous}
          </button>
          <div className="flex flex-1 flex-wrap justify-end gap-3">
            <SecondaryLessonButton label={skipPracticeLabel(lang)} onClick={() => setPhase("practice")} variant="green" />
          {index < examples.length - 1 ? (
            <button onClick={() => setIndex((i) => i + 1)} className="rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-8 py-3 font-black text-yellow-950 shadow-[0_6px_0_#a86000]">
              {t.next}
            </button>
          ) : (
            <button onClick={() => setPhase("practice")} className="rounded-2xl border-2 border-emerald-600 bg-emerald-500 px-8 py-3 font-black text-white shadow-[0_6px_0_#065f46]">
              {t.practice}
            </button>
          )}
          </div>
        </div>
      </LessonShell>
    </main>
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
        <MenuCard title={t.learnNumbers} subtitle="25 questions, all 0-9" icon="ðŸ”¢" color="sky" onClick={() => go("testNumbers")} />
        <MenuCard title={t.learnOperations} subtitle="25 questions, 0-9 only" icon="âž•" color="emerald" onClick={() => go("testOperations")} />
        <MenuCard title={t.learnReal} subtitle="25 stories with visible objects" icon="ðŸŽ" color="pink" onClick={() => go("testReal")} />
      </div>
    </main>
  );
}

function Quiz({ lang, t, title, questions, onFinish, extraAction, randomize = true, onBackToLearning }: {
  lang: Lang;
  t: UIStrings;
  title: string;
  questions: Question[];
  onFinish: (correct: number, total: number) => void;
  extraAction?: LessonAction;
  randomize?: boolean;
  onBackToLearning?: () => void;
}) {
  const randomizedQuestions = useMemo(() => randomize ? shuffledQuestions(questions) : questions, [questions, randomize]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const qn = randomizedQuestions[index];
  const selected = answers[index] ?? null;
  const answered = selected !== null;
  const isCorrect = selected === qn.answer;
  const isCountQuestion = qn.visual.kind === "count";
  const isValueQuestion = qn.id.startsWith("val-");
  const correct = randomizedQuestions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;

  const next = () => {
    if (index === randomizedQuestions.length - 1) onFinish(correct, randomizedQuestions.length);
    else setIndex((i) => i + 1);
  };

  return (
    <main className="mx-auto w-full max-w-3xl pb-8">
      <LessonShell title={title} helper={`${t.score}: ${correct}/${randomizedQuestions.length} - ${index + 1}/${randomizedQuestions.length}`}>
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
          <div className="my-4 rounded-3xl border-2 border-sky-100 bg-sky-50 p-3">
            <VisualDisplay visual={qn.visual} lang={lang} revealNumbers={answered && !isCorrect} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {qn.options.map((option) => {
              const picked = selected === option;
              const right = option === qn.answer;
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
                  disabled={answered}
                  onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                  className={`min-h-20 rounded-3xl border-2 px-2 font-black shadow-[0_5px_0_rgba(0,0,0,.14)] ${optionSize} ${stateClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
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
                  <p className="font-black text-slate-700">{t.correctAnswer}: {qn.answer}</p>
                  {!isCorrect && qn.visual.kind === "count" && (
                    <p className="font-black text-blue-800">{lang === "en" ? `This is ${qn.visual.count}.` : `Ini ${qn.visual.count}.`}</p>
                  )}
                  {!isCorrect && <p className="font-bold text-slate-600">{t.seeMethod}</p>}
                </div>
              </div>
              {(!isCorrect || (isCorrect && isValueQuestion)) && <WorkedMethod q={qn} lang={lang} />}
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

function LessonShell({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <section className="lesson-panel rounded-[2rem] p-4 md:p-6">
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-black leading-tight text-blue-950 md:text-4xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-snug text-slate-600 md:text-base">{helper}</p>
      </div>
      {children}
    </section>
  );
}

function CharacterTalk({ lang, text }: { lang: Lang; text: string }) {
  return (
    <div className="talk-bubble flex items-center gap-3 rounded-3xl p-4">
      <img src={alyseTeaching} alt="Alyse" className="h-20 w-20 object-contain" />
      <p className="whitespace-pre-line text-lg font-black leading-snug text-slate-800">{text}</p>
    </div>
  );
}

function AudioHearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[2rem] border-4 border-blue-100 bg-white/85 p-5 shadow-inner">
      <button
        onClick={onClick}
        aria-label={label}
        className="grid h-16 w-16 place-items-center rounded-3xl border-4 border-sky-200 bg-sky-50 text-[0px] text-blue-700 shadow-[0_5px_0_rgba(30,64,175,.18)] active:translate-y-1"
      >
        <SpeakerIcon />
      </button>
      <div className="relative">
        <button
          onClick={onClick}
          className="rounded-[2rem] border-4 border-blue-200 bg-blue-600 px-10 py-7 text-3xl font-black text-white shadow-[0_7px_0_#1e3a8a] active:translate-y-1"
        >
          {label}
        </button>
        <span className="pointer-events-none absolute -right-3 -top-4 rotate-45 rounded-full border-2 border-yellow-300 bg-yellow-100 px-3 py-2 text-[0px] shadow-md">
          <PointerIcon />
        </span>
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
    <div className={`mx-auto grid place-items-center rounded-[2rem] border-4 ${value === 0 ? "border-slate-300 bg-slate-100 text-slate-500" : "border-yellow-500 bg-yellow-400 text-white"} ${large ? "h-48 w-48" : "h-24 w-24"}`}>
      <div className="text-center">
        <div className={`${large ? "text-8xl" : "text-5xl"} font-black leading-none`} style={{ fontFamily: "var(--app-font-number)" }}>{value}</div>
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
  const symbol = cleanDisplayText(emoji);
  if (count === 0) {
    return <div className="mx-auto rounded-3xl border-4 border-dashed border-slate-200 bg-white p-8 text-center text-2xl font-black text-slate-400">{numbered ? "0" : "empty"}</div>;
  }
  return (
    <div className="flex flex-wrap justify-center gap-3 rounded-3xl border-2 border-slate-100 bg-white p-4">
      {Array.from({ length: count }, (_, i) => {
        const gone = i < crossed;
        return (
          <div key={i} className="relative grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-4xl shadow-inner">
            <span className={gone ? "opacity-25" : ""}>{symbol}</span>
            {numbered && <span className="absolute -top-2 rounded-full bg-blue-600 px-2 text-xs font-black text-white">{i + 1}</span>}
            {gone && <span className="absolute text-5xl font-black text-red-500">Ã—</span>}
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
}: {
  count: number;
  emoji: string;
  container: ContainerKind;
  numbered?: boolean;
  hideEmptyLabel?: boolean;
}) {
  const symbol = cleanDisplayText(emoji);
  const image = container === "basket" ? basketPhoto : trayPhoto;
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
              <span>{symbol}</span>
              {numbered && <span className="absolute -top-2 rounded-full bg-blue-600 px-2 text-xs font-black text-white">{i + 1}</span>}
            </div>
          );
        })}
      </div>
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
  const banana = "Ã°Å¸ÂÅ’";
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

function SameValueVisual({ count, emojis, lang }: { count: number; emojis: string[]; lang: Lang }) {
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
      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xl font-black text-emerald-900">
        {lang === "en" ? `All groups have ${count}.` : `Semua kumpulan ada ${count}.`}
      </p>
    </div>
  );
}

function LayoutValueVisual({ count, emoji, lang }: { count: number; emoji: string; lang: Lang }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <LayoutGroup count={count} emoji={emoji} layout="row" label={lang === "en" ? "Row" : "Baris"} />
        <LayoutGroup count={count} emoji={emoji} layout="twoGroups" label={lang === "en" ? "Two groups" : "Dua kumpulan"} />
        <LayoutGroup count={count} emoji={emoji} layout="spread" label={lang === "en" ? "Spread out" : "Berselerak"} />
      </div>
      <p className="rounded-2xl bg-yellow-50 px-4 py-3 text-center text-xl font-black text-yellow-900">
        {lang === "en" ? `They are all ${count}.` : `Semua ialah ${count}.`}
      </p>
    </div>
  );
}

function LayoutGroup({ count, emoji, layout, label }: { count: number; emoji: string; layout: "row" | "twoGroups" | "spread"; label: string }) {
  const symbol = cleanDisplayText(emoji);
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
            {symbol}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm font-black text-blue-900">{label}</p>
    </div>
  );
}

function CompareGroupsVisual({ a, b, emojiA, emojiB, lang }: { a: number; b: number; emojiA: string; emojiB: string; lang: Lang }) {
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
      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-lg font-black text-emerald-900">
        {lang === "en" ? `${Math.max(a, b)} is more. ${Math.min(a, b)} is fewer.` : `${Math.max(a, b)} lebih banyak. ${Math.min(a, b)} lebih sedikit.`}
      </p>
    </div>
  );
}

function TapRevealOrder({ nums, lang, mode }: { nums: number[]; lang: Lang; mode: "up" | "down" }) {
  const [visible, setVisible] = useState(1);
  const banana = "Ã°Å¸ÂÅ’";
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

function CompareTeachingVisual({ a, b, symbol, lang }: { a: number; b: number; symbol: ">" | "<"; lang: Lang }) {
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  return (
    <div className="space-y-4">
      <NumberLine marked={Math.max(a, b)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledGroup count={a} label={String(a)} emoji="ðŸŒ" />
        <LabeledGroup count={b} label={String(b)} emoji="ðŸŒ" />
      </div>
      <div className="rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
        <p className="text-6xl font-black text-blue-950">{a} {symbol} {b}</p>
        <p className="mt-2 text-lg font-black text-slate-700">
          {lang === "en"
            ? `${bigger} is more. ${smaller} is less.`
            : `${bigger} lebih banyak. ${smaller} lebih sedikit.`}
        </p>
        <p className="mt-1 text-sm font-black text-slate-500">
          {lang === "en" ? `${symbol} means ${symbol === ">" ? "greater than" : "less than"}.` : `${symbol} ialah ${symbol === ">" ? "lebih besar" : "lebih kecil"}.`}
        </p>
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
          style={{ fontFamily: "var(--app-font-number)" }}
        >
          {value}
        </div>
        {confirmed && (
          <div
            className="trace-model-zoom pointer-events-none absolute inset-0 z-10 grid place-items-center text-[12rem] font-black leading-none text-blue-300/70"
            style={{ fontFamily: "var(--app-font-number)" }}
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

  useEffect(() => {
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
  };

  return (
    <div className="mx-auto w-full max-w-[27rem] rounded-3xl border-2 border-amber-100 bg-white p-4">
      <h3 className="mb-2 text-center text-2xl font-black text-blue-950">{lang === "en" ? `Write ${value} yourself` : `Tulis ${value} sendiri`}</h3>
      <p className="mb-3 text-center text-sm font-bold text-slate-500">
        {lang === "en" ? "Try without the tracing guide." : "Cuba tanpa panduan surih."}
      </p>
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
      <div className="mt-3 flex gap-2">
        <button onClick={clear} className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-2 font-black text-slate-500">{t.clear}</button>
        <button onClick={() => speakNumber(value, lang)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-blue-700 bg-blue-600 py-2 font-black text-white">
          <SpeakerIcon />
          <span>{t.speak}</span>
        </button>
      </div>
    </div>
  );
}

function DrawQuantity({ count, lang }: { count: number; lang: Lang }) {
  return (
    <div className="rounded-3xl border-2 border-amber-100 bg-white p-4 text-center">
      <h3 className="mb-2 text-xl font-black text-blue-950">{lang === "en" ? "Draw the quantity" : "Lukis kuantiti"}</h3>
      <p className="mb-3 text-sm font-bold text-slate-500">{count === 0 ? (lang === "en" ? "For zero, draw nothing in the box." : "Untuk sifar, jangan lukis apa-apa dalam kotak.") : (lang === "en" ? `Draw ${count} dots or bananas on paper.` : `Lukis ${count} titik atau pisang di kertas.`)}</p>
      <ObjectGroup count={count} emoji="â—" numbered />
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
        <NumberTile value={visual.value} lang={lang} showWord={false} />
        <ObjectGroup count={visual.value} emoji={visual.emoji} numbered={revealNumbers} />
      </div>
    );
  }
  if (visual.kind === "sameValue") {
    return <SameValueVisual count={visual.count} emojis={visual.emojis} lang={lang} />;
  }
  if (visual.kind === "layoutValue") {
    return <LayoutValueVisual count={visual.count} emoji={visual.emoji} lang={lang} />;
  }
  if (visual.kind === "compareGroups") {
    return <CompareGroupsVisual a={visual.a} b={visual.b} emojiA={visual.emojiA} emojiB={visual.emojiB} lang={lang} />;
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
            <LabeledGroup count={visual.a} label={String(visual.a)} emoji="ðŸŒ" />
            <LabeledGroup count={visual.b} label={String(visual.b)} emoji="ðŸŒ" />
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
          <ObjectGroup count={visual.a} emoji="ðŸŒ" />
          <ObjectGroup count={visual.b} emoji="ðŸŒ" />
        </div>
      </div>
    );
  }
  if (visual.kind === "add") {
    const emoji = visual.emoji ?? "ðŸŒ";
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
  const emoji = visual.emoji ?? "ðŸŒ";
  return (
    <div className="space-y-3">
      <ObjectGroup count={visual.a} emoji={emoji} />
      {revealNumbers && <p className="text-center text-2xl font-black text-slate-500">{visual.a} - {visual.b} = ?</p>}
    </div>
  );
}

function WorkedMethod({ q, lang }: { q: Question; lang: Lang }) {
  return (
    <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
      <h4 className="mb-3 text-lg font-black text-emerald-900">{lang === "en" ? "How to solve it" : "Cara selesaikan"}</h4>
      <div className="mb-3">
        <SolutionVisual visual={q.visual} lang={lang} />
      </div>
      {q.visual.kind !== "subtract" && (
        <ol className="space-y-2">
          {q.method[lang].map((step, i) => (
            <li key={step} className="flex gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-700">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs text-white">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SolutionVisual({ visual, lang }: { visual: Visual; lang: Lang }) {
  if (visual.kind === "count") {
    const emoji = visual.emoji ?? "ðŸŒ";
    if (visual.count === 0) {
      return visual.container
        ? <ContainerScene count={0} emoji={emoji} container={visual.container} numbered />
        : <ObjectGroup count={0} emoji={emoji} numbered />;
    }
    return (
      <div className="space-y-3">
        <CountedObjectRow count={visual.count} emoji={emoji} showCount speakCount lang={lang} />
        <p className="text-center text-lg font-black text-emerald-800">
          {lang === "en" ? `This is ${visual.count}.` : `Ini ${visual.count}.`}
        </p>
      </div>
    );
  }
  if (visual.kind === "add") {
    const emoji = visual.emoji ?? "ðŸŒ";
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
    const emoji = visual.emoji ?? "ðŸŒ";
    return <InteractiveSubtractionFlow start={visual.a} takeAway={visual.b} emoji={emoji} lang={lang} />;
  }
  if (visual.kind === "compare") {
    return <NumberLine marked={Math.max(visual.a, visual.b)} />;
  }
  return <VisualDisplay visual={visual} lang={lang} />;
}

function speakNumber(value: number, lang: Lang) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(WORDS[lang][value]);
  utterance.lang = lang === "ms" ? "ms-MY" : "en-US";
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}

function speakCountingSequence(count: number, lang: Lang = "en") {
  if (!("speechSynthesis" in window) || count <= 0) return;
  window.speechSynthesis.cancel();
  const words = Array.from({ length: count }, (_, i) => WORDS[lang][i + 1]).join(", ");
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.lang = lang === "ms" ? "ms-MY" : "en-US";
  utterance.rate = 0.72;
  window.speechSynthesis.speak(utterance);
}

function Decor() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-[-4rem] top-12 h-20 w-64 rounded-full bg-white/80 blur-sm" />
      <div className="absolute right-[-3rem] top-36 h-24 w-72 rounded-full bg-white/75 blur-sm" />
      <div className="absolute bottom-0 h-10 w-full bg-green-600/70" />
      <div className="absolute bottom-9 h-3 w-full bg-amber-900/20" />
      {["10%", "28%", "58%", "82%"].map((left, i) => (
        <span key={left} className="absolute top-16 text-xl text-yellow-200" style={{ left }}>â˜…</span>
      ))}
    </div>
  );
}

export default App;
