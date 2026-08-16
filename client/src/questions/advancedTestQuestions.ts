type Lang = "en" | "ms";

type TestVisual =
  | { kind: "number"; value: number }
  | { kind: "word"; value: number }
  | { kind: "groupChoices"; emoji: string; groups: number[] }
  | { kind: "teenQuantityArrangement"; count: number; emoji: string; rowPattern: number[] }
  | { kind: "advancedCompareTest"; a: number; b: number; emoji: string; representation: "labeled" | "objects" | "numbers" }
  | { kind: "sequence"; nums: Array<number | "?"> }
  | { kind: "horizontalAdd"; a: number; b: number; display: "equation" | "objects"; showLabels?: boolean }
  | { kind: "verticalAdd"; a: number; b: number }
  | { kind: "horizontalSubtract"; a: number; b: number }
  | { kind: "verticalSubtract"; a: number; b: number; borrowing?: boolean }
  | { kind: "subtract"; a: number; b: number; emoji: string; display: "objects"; showLabels?: boolean };

export type AdvancedTestQuestionData = {
  id: string;
  text: Record<Lang, string>;
  options: Array<number | string>;
  answer: number | string;
  visual: TestVisual;
  method: Record<Lang, string[]>;
};

const teenWords = {
  en: ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"],
  ms: ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "lapan belas", "sembilan belas", "dua puluh"],
};

function teenWord(value: number, lang: Lang) {
  return teenWords[lang][value - 10];
}

function numeralToWord(id: string, value: number, options: number[]): AdvancedTestQuestionData {
  return {
    id,
    text: { en: "Which number word matches this numeral?", ms: "Perkataan nombor mana padan dengan angka ini?" },
    options: options.map((option) => teenWord(option, "en")),
    answer: teenWord(value, "en"),
    visual: { kind: "number", value },
    method: {
      en: [`The numeral is ${value}.`, `${value} is ${teenWord(value, "en")}.`, `Answer: ${teenWord(value, "en")}.`],
      ms: [`Angka itu ialah ${value}.`, `${value} ialah ${teenWord(value, "ms")}.`, `Jawapan: ${teenWord(value, "ms")}.`],
    },
  };
}

function wordToNumeral(id: string, value: number, options: number[]): AdvancedTestQuestionData {
  return {
    id,
    text: { en: "Which numeral matches this number word?", ms: "Angka mana padan dengan perkataan nombor ini?" },
    options,
    answer: value,
    visual: { kind: "word", value },
    method: {
      en: [`The word is ${teenWord(value, "en")}.`, `${teenWord(value, "en")} is written as ${value}.`, `Answer: ${value}.`],
      ms: [`Perkataan itu ialah ${teenWord(value, "ms")}.`, `${teenWord(value, "ms")} ditulis sebagai ${value}.`, `Jawapan: ${value}.`],
    },
  };
}

function teenPictureChoice(id: string, answer: number, groups: number[], emoji: string): AdvancedTestQuestionData {
  return {
    id,
    text: { en: `Which picture shows ${answer}?`, ms: `Gambar mana menunjukkan ${answer}?` },
    options: groups,
    answer,
    visual: { kind: "groupChoices", emoji, groups },
    method: {
      en: [`Count each picture carefully.`, `The matching picture has ${answer} objects.`, `Answer: ${answer}.`],
      ms: [`Kira setiap gambar dengan teliti.`, `Gambar yang sepadan ada ${answer} objek.`, `Jawapan: ${answer}.`],
    },
  };
}

function teenConservation(id: string, count: number, rowPattern: number[]): AdvancedTestQuestionData {
  return {
    id,
    text: {
      en: `The bananas have been rearranged. Does this group still show ${count}?`,
      ms: `Pisang telah disusun semula. Adakah kumpulan ini masih menunjukkan ${count}?`,
    },
    options: ["Yes", "No"],
    answer: "Yes",
    visual: { kind: "teenQuantityArrangement", count, emoji: "🍌", rowPattern },
    method: {
      en: [`Rearranging the bananas does not change how many there are.`, `There are still ${count}.`, "Answer: Yes."],
      ms: [`Menyusun semula pisang tidak mengubah bilangannya.`, `Masih ada ${count}.`, "Jawapan: Ya."],
    },
  };
}

export const advancedTestTeenNumberData: AdvancedTestQuestionData[] = [
  numeralToWord("adv-teen-rec-test-number-word-10", 10, [10, 11, 12, 13]),
  wordToNumeral("adv-teen-rec-test-word-number-12", 12, [10, 11, 12, 14]),
  numeralToWord("adv-teen-rec-test-number-word-15", 15, [13, 14, 15, 16]),
  wordToNumeral("adv-teen-rec-test-word-number-17", 17, [15, 16, 17, 18]),
  numeralToWord("adv-teen-rec-test-number-word-19", 19, [17, 18, 19, 20]),
  wordToNumeral("adv-teen-rec-test-word-number-16", 16, [14, 15, 16, 18]),
  teenPictureChoice("adv-test-teen-value-picture-14", 14, [12, 14, 16], "🍎"),
  teenPictureChoice("adv-test-teen-value-picture-18", 18, [17, 18, 20], "🌸"),
  teenConservation("adv-test-teen-value-arranged-12", 12, [5, 4, 3]),
  teenConservation("adv-test-teen-value-arranged-17", 17, [6, 5, 6]),
];

function comparisonSymbol(a: number, b: number) {
  return a > b ? ">" : a < b ? "<" : "=";
}

function comparisonQuestion(id: string, a: number, b: number, representation: "labeled" | "objects" | "numbers", emoji: string): AdvancedTestQuestionData {
  const answer = comparisonSymbol(a, b);
  const comparisonEn = answer === ">" ? "greater than" : answer === "<" ? "less than" : "equal to";
  const comparisonMs = answer === ">" ? "lebih besar daripada" : answer === "<" ? "lebih kecil daripada" : "sama dengan";
  return {
    id,
    text: { en: "Choose <, >, or = to compare both sides.", ms: "Pilih <, >, atau = untuk membandingkan kedua-dua belah." },
    options: ["<", ">", "="],
    answer,
    visual: { kind: "advancedCompareTest", a, b, emoji, representation },
    method: {
      en: [`Compare ${a} and ${b}.`, `${a} is ${comparisonEn} ${b}.`, `Answer: ${answer}.`],
      ms: [`Bandingkan ${a} dan ${b}.`, `${a} ${comparisonMs} ${b}.`, `Jawapan: ${answer}.`],
    },
  };
}

export const advancedTestCompareBiggerData: AdvancedTestQuestionData[] = [
  comparisonQuestion("adv-test-compare-labeled-8-12", 8, 12, "labeled", "🍎"),
  comparisonQuestion("adv-test-compare-labeled-15-9", 15, 9, "labeled", "🍪"),
  comparisonQuestion("adv-test-compare-labeled-14-14", 14, 14, "labeled", "🌸"),
  comparisonQuestion("adv-test-compare-labeled-10-10", 10, 10, "labeled", "🥭"),
  comparisonQuestion("adv-test-compare-objects-7-11", 7, 11, "objects", "🐚"),
  comparisonQuestion("adv-test-compare-objects-18-13", 18, 13, "objects", "🍎"),
  comparisonQuestion("adv-test-compare-objects-16-16", 16, 16, "objects", "🍪"),
  comparisonQuestion("adv-test-compare-objects-10-20", 10, 20, "objects", "🌸"),
  comparisonQuestion("adv-test-compare-numbers-4-17", 4, 17, "numbers", "🍌"),
  comparisonQuestion("adv-test-compare-numbers-19-8", 19, 8, "numbers", "🍌"),
  comparisonQuestion("adv-test-compare-numbers-11-11", 11, 11, "numbers", "🍌"),
  comparisonQuestion("adv-test-compare-numbers-20-15", 20, 15, "numbers", "🍌"),
];

function sequenceQuestion(id: string, kind: "next" | "before" | "middle", nums: Array<number | "?">, answer: number, options: number[]): AdvancedTestQuestionData {
  const prompt = kind === "next"
    ? { en: "What number comes next?", ms: "Nombor apa seterusnya?" }
    : kind === "before"
      ? { en: "What number comes before?", ms: "Nombor apa sebelumnya?" }
      : { en: "Fill in the middle number.", ms: "Isi nombor di tengah." };
  return {
    id,
    text: prompt,
    options,
    answer,
    visual: { kind: "sequence", nums },
    method: {
      en: ["Move one step at a time on the number line.", `The missing number is ${answer}.`, `Answer: ${answer}.`],
      ms: ["Bergerak satu langkah setiap kali pada garisan nombor.", `Nombor yang hilang ialah ${answer}.`, `Jawapan: ${answer}.`],
    },
  };
}

export const advancedTestSequencingData: AdvancedTestQuestionData[] = [
  sequenceQuestion("adv-test-sequence-next-3-6", "next", [3, 4, 5, "?"], 6, [4, 5, 6, 7]),
  sequenceQuestion("adv-test-sequence-next-cross-ten", "next", [9, 10, 11, "?"], 12, [9, 10, 11, 12]),
  sequenceQuestion("adv-test-sequence-next-14-17", "next", [14, 15, 16, "?"], 17, [15, 16, 17, 18]),
  sequenceQuestion("adv-test-sequence-next-down-20", "next", [20, 19, 18, "?"], 17, [16, 17, 18, 19]),
  sequenceQuestion("adv-test-sequence-before-7", "before", ["?", 7, 8], 6, [5, 6, 7, 8]),
  sequenceQuestion("adv-test-sequence-before-cross-ten", "before", ["?", 9, 10], 8, [7, 8, 9, 10]),
  sequenceQuestion("adv-test-sequence-before-19", "before", ["?", 19, 20], 18, [17, 18, 19, 20]),
  sequenceQuestion("adv-test-sequence-middle-4-6", "middle", [4, "?", 6], 5, [4, 5, 6, 7]),
  sequenceQuestion("adv-test-sequence-middle-cross-ten", "middle", [9, "?", 11], 10, [8, 9, 10, 11]),
  sequenceQuestion("adv-test-sequence-middle-down-20", "middle", [20, "?", 18], 19, [17, 18, 19, 20]),
];

type AdditionRepresentation = "labeled" | "objects" | "horizontal" | "vertical";

function additionQuestion(id: string, a: number, b: number, representation: AdditionRepresentation): AdvancedTestQuestionData {
  const answer = a + b;
  const options = Array.from(new Set([Math.max(0, answer - 2), answer - 1, answer, Math.min(20, answer + 1)])).sort((left, right) => left - right);
  const visual: TestVisual = representation === "vertical"
    ? { kind: "verticalAdd", a, b }
    : { kind: "horizontalAdd", a, b, display: representation === "horizontal" ? "equation" : "objects", showLabels: representation === "labeled" };
  return {
    id,
    text: {
      en: representation === "vertical" ? "Add in vertical form." : `What is ${a} + ${b}?`,
      ms: representation === "vertical" ? "Tambah dalam bentuk menegak." : `Berapakah ${a} + ${b}?`,
    },
    options,
    answer,
    visual,
    method: {
      en: [`Add ${a} and ${b}.`, `${a} plus ${b} equals ${answer}.`, `Answer: ${answer}.`],
      ms: [`Tambah ${a} dan ${b}.`, `${a} tambah ${b} sama dengan ${answer}.`, `Jawapan: ${answer}.`],
    },
  };
}

export const advancedTestAdditionData: AdvancedTestQuestionData[] = [
  additionQuestion("adv-test-add-single-labeled-2-5", 2, 5, "labeled"),
  additionQuestion("adv-test-add-single-objects-3-6", 3, 6, "objects"),
  additionQuestion("adv-test-add-single-vertical-1-8", 1, 8, "vertical"),
  additionQuestion("adv-test-add-single-labeled-5-2", 5, 2, "labeled"),
  additionQuestion("adv-test-add-single-objects-7-3", 7, 3, "objects"),
  additionQuestion("adv-test-add-carry-labeled-5-7", 5, 7, "labeled"),
  additionQuestion("adv-test-add-carry-objects-6-8", 6, 8, "objects"),
  additionQuestion("adv-test-add-carry-vertical-7-9", 7, 9, "vertical"),
  additionQuestion("adv-test-add-carry-horizontal-5-9", 5, 9, "horizontal"),
  additionQuestion("adv-test-add-carry-objects-2-9", 2, 9, "objects"),
  additionQuestion("adv-test-add-double-single-labeled-10-6", 10, 6, "labeled"),
  additionQuestion("adv-test-add-double-single-objects-12-3", 12, 3, "objects"),
  additionQuestion("adv-test-add-double-single-vertical-13-5", 13, 5, "vertical"),
  additionQuestion("adv-test-add-double-single-horizontal-14-2", 14, 2, "horizontal"),
  additionQuestion("adv-test-add-double-single-labeled-15-4", 15, 4, "labeled"),
  additionQuestion("adv-test-add-double-double-vertical-10-10", 10, 10, "vertical"),
];

type SubtractionRepresentation = "labeled" | "objects" | "horizontal" | "vertical";

function subtractionQuestion(id: string, a: number, b: number, representation: SubtractionRepresentation): AdvancedTestQuestionData {
  const answer = a - b;
  const borrowing = a >= 10 && (a % 10) < (b % 10);
  const optionCandidates = [Math.max(0, answer - 1), answer, Math.min(20, answer + 1), Math.min(20, answer + 2)];
  const options = Array.from(new Set(optionCandidates)).sort((left, right) => left - right);
  const visual: TestVisual = representation === "vertical"
    ? { kind: "verticalSubtract", a, b, borrowing }
    : representation === "horizontal"
      ? { kind: "horizontalSubtract", a, b }
      : { kind: "subtract", a, b, emoji: "🍌", display: "objects", showLabels: representation === "labeled" };
  return {
    id,
    text: {
      en: representation === "vertical" ? "Subtract in vertical form." : `What is ${a} − ${b}?`,
      ms: representation === "vertical" ? "Tolak dalam bentuk menegak." : `Berapakah ${a} − ${b}?`,
    },
    options,
    answer,
    visual,
    method: {
      en: [borrowing ? "Borrow one ten before subtracting the ones." : "Subtract the ones, then the tens.", `${a} minus ${b} equals ${answer}.`, `Answer: ${answer}.`],
      ms: [borrowing ? "Pinjam satu puluh sebelum menolak sa." : "Tolak sa, kemudian puluh.", `${a} tolak ${b} sama dengan ${answer}.`, `Jawapan: ${answer}.`],
    },
  };
}

export const advancedTestSubtractionData: AdvancedTestQuestionData[] = [
  subtractionQuestion("adv-test-sub-single-labeled-9-2", 9, 2, "labeled"),
  subtractionQuestion("adv-test-sub-single-objects-8-3", 8, 3, "objects"),
  subtractionQuestion("adv-test-sub-single-vertical-7-5", 7, 5, "vertical"),
  subtractionQuestion("adv-test-sub-single-horizontal-6-1", 6, 1, "horizontal"),
  subtractionQuestion("adv-test-sub-double-single-labeled-17-5", 17, 5, "labeled"),
  subtractionQuestion("adv-test-sub-double-single-labeled-18-4", 18, 4, "labeled"),
  subtractionQuestion("adv-test-sub-double-single-objects-16-3", 16, 3, "objects"),
  subtractionQuestion("adv-test-sub-double-single-vertical-15-2", 15, 2, "vertical"),
  subtractionQuestion("adv-test-sub-borrow-labeled-13-8", 13, 8, "labeled"),
  subtractionQuestion("adv-test-sub-borrow-objects-12-5", 12, 5, "objects"),
  subtractionQuestion("adv-test-sub-borrow-objects-15-7", 15, 7, "objects"),
  subtractionQuestion("adv-test-sub-borrow-vertical-11-6", 11, 6, "vertical"),
  subtractionQuestion("adv-test-sub-double-double-labeled-18-11", 18, 11, "labeled"),
  subtractionQuestion("adv-test-sub-double-double-objects-19-15", 19, 15, "objects"),
  subtractionQuestion("adv-test-sub-double-double-vertical-20-13", 20, 13, "vertical"),
  subtractionQuestion("adv-test-sub-double-double-horizontal-20-16", 20, 16, "horizontal"),
];
