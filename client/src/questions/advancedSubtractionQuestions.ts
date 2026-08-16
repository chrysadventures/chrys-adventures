export type AdvancedSubtractionQuestionData = {
  id: string;
  text: { en: string; ms: string };
  options: number[];
  answer: number;
  a: number;
  b: number;
  borrowing: boolean;
  production?: boolean;
  method: { en: string[]; ms: string[] };
};

export const advancedSubtractionQuestionData: AdvancedSubtractionQuestionData[] = [
  {
    id: "adv-sub-borrow-14-5",
    text: { en: "Subtract in vertical form. What is 14 − 5?", ms: "Tolak dalam bentuk menegak. Berapakah 14 − 5?" },
    options: [7, 8, 9, 10], answer: 9, a: 14, b: 5, borrowing: true,
    method: {
      en: ["4 ones are not enough to take away 5.", "Borrow 1 ten, so 14 ones take away 5 leaves 9.", "Answer: 9."],
      ms: ["4 sa tidak cukup untuk tolak 5.", "Pinjam 1 puluh, jadi 14 sa tolak 5 tinggal 9.", "Jawapan: 9."],
    },
  },
  {
    id: "adv-sub-build-13-6",
    text: { en: "Open the ten-basket, then take away 6 from 13.", ms: "Buka bakul puluh, kemudian tolak 6 daripada 13." },
    options: [], answer: 7, a: 13, b: 6, borrowing: true, production: true,
    method: {
      en: ["3 ones are not enough to take away 6.", "Open the ten-basket to make 13 ones.", "13 minus 6 equals 7."],
      ms: ["3 sa tidak cukup untuk tolak 6.", "Buka bakul puluh untuk jadi 13 sa.", "13 tolak 6 sama dengan 7."],
    },
  },
  {
    id: "adv-sub-choice-19-15",
    text: { en: "Subtract in vertical form. What is 19 − 15?", ms: "Tolak dalam bentuk menegak. Berapakah 19 − 15?" },
    options: [3, 4, 5, 6], answer: 4, a: 19, b: 15, borrowing: false,
    method: {
      en: ["Ones: 9 minus 5 equals 4.", "Tens: 1 minus 1 equals 0.", "Answer: 4."],
      ms: ["Sa: 9 tolak 5 sama dengan 4.", "Puluh: 1 tolak 1 sama dengan 0.", "Jawapan: 4."],
    },
  },
  {
    id: "adv-sub-build-12-7",
    text: { en: "Open the ten-basket, then take away 7 from 12.", ms: "Buka bakul puluh, kemudian tolak 7 daripada 12." },
    options: [], answer: 5, a: 12, b: 7, borrowing: true, production: true,
    method: {
      en: ["2 ones are not enough to take away 7.", "Open the ten-basket to make 12 ones.", "12 minus 7 equals 5."],
      ms: ["2 sa tidak cukup untuk tolak 7.", "Buka bakul puluh untuk jadi 12 sa.", "12 tolak 7 sama dengan 5."],
    },
  },
  {
    id: "adv-sub-choice-18-6",
    text: { en: "Subtract in vertical form. What is 18 − 6?", ms: "Tolak dalam bentuk menegak. Berapakah 18 − 6?" },
    options: [10, 11, 12, 13], answer: 12, a: 18, b: 6, borrowing: false,
    method: {
      en: ["Ones: 8 minus 6 equals 2.", "The 1 ten stays.", "Answer: 12."],
      ms: ["Sa: 8 tolak 6 sama dengan 2.", "1 puluh kekal.", "Jawapan: 12."],
    },
  },
  {
    id: "adv-sub-choice-20-10",
    text: { en: "Subtract in vertical form. What is 20 − 10?", ms: "Tolak dalam bentuk menegak. Berapakah 20 − 10?" },
    options: [0, 5, 10, 20], answer: 10, a: 20, b: 10, borrowing: false,
    method: {
      en: ["Ones: 0 minus 0 equals 0.", "Tens: 2 minus 1 equals 1 ten.", "Answer: 10."],
      ms: ["Sa: 0 tolak 0 sama dengan 0.", "Puluh: 2 tolak 1 sama dengan 1 puluh.", "Jawapan: 10."],
    },
  },
  {
    id: "adv-sub-choice-17-9",
    text: { en: "Borrow, then subtract. What is 17 − 9?", ms: "Pinjam, kemudian tolak. Berapakah 17 − 9?" },
    options: [6, 7, 8, 9], answer: 8, a: 17, b: 9, borrowing: true,
    method: {
      en: ["7 ones are not enough to take away 9.", "Borrow 1 ten, so 17 ones take away 9 leaves 8.", "Answer: 8."],
      ms: ["7 sa tidak cukup untuk tolak 9.", "Pinjam 1 puluh, jadi 17 sa tolak 9 tinggal 8.", "Jawapan: 8."],
    },
  },
  {
    id: "adv-sub-choice-16-16",
    text: { en: "Subtract in vertical form. What is 16 − 16?", ms: "Tolak dalam bentuk menegak. Berapakah 16 − 16?" },
    options: [0, 1, 6, 10], answer: 0, a: 16, b: 16, borrowing: false,
    method: {
      en: ["Ones: 6 minus 6 equals 0.", "Tens: 1 minus 1 equals 0.", "Answer: 0."],
      ms: ["Sa: 6 tolak 6 sama dengan 0.", "Puluh: 1 tolak 1 sama dengan 0.", "Jawapan: 0."],
    },
  },
];
