import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChrysCharacter } from './ChrysCharacter';
import { CoinBurst } from './CoinBurst';
import { ProgressBar } from './ProgressBar';
import type { Question, QuestionVisual } from '../lib/gameData';
import { PRAISE_MESSAGES, NUMBER_NAMES } from '../lib/gameData';
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';

const PRACTICE_COUNT = 10;

/* ─── Filter: keep only questions with visual counts ≤ 9 ─── */
function isGoodForPractice(q: Question): boolean {
  if (!q.visual) return true;
  if (q.visual.kind === 'dot-array' && q.visual.n > 9) return false;
  if (q.visual.kind === 'count' && q.visual.n > 9) return false;
  const numOptions = q.options.filter(o => typeof o === 'number') as number[];
  if (numOptions.some(n => n > 9)) return false;
  if (typeof q.correctAnswer === 'number' && q.correctAnswer > 9) return false;
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Detect "which is greater/smaller/bigger" comparison questions ─── */
interface ComparisonInfo { a: number; b: number; answer: number; }
function getComparison(q: Question): ComparisonInfo | null {
  const m = q.text.match(/(\d+)\s+or\s+(\d+)/i);
  if (!m) return null;
  const a = parseInt(m[1]);
  const b = parseInt(m[2]);
  const answer = q.correctAnswer;
  if (typeof answer !== 'number' || a > 9 || b > 9) return null;
  return { a, b, answer };
}

/* ─── Comparison banana visual ─── */
function ComparisonSolution({ a, b, answer }: ComparisonInfo) {
  const aIsWinner = answer === a;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 rounded-2xl p-4 border-2 border-green-200 space-y-3"
    >
      {/* Row A */}
      <div className={`rounded-xl px-3 py-2.5 border-2 transition-colors ${aIsWinner ? 'bg-yellow-100 border-yellow-400 shadow-[0_3px_0_#B45309]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-3xl font-black text-gray-800" style={{ fontFamily: 'var(--app-font-number)' }}>{a}</span>
          {aIsWinner && <span className="text-xs font-black bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">MORE ✅</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: a }, (_, i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 400 }}
              className="text-2xl leading-none">🍌</motion.span>
          ))}
        </div>
      </div>

      {/* Row B */}
      <div className={`rounded-xl px-3 py-2.5 border-2 transition-colors ${!aIsWinner ? 'bg-yellow-100 border-yellow-400 shadow-[0_3px_0_#B45309]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-3xl font-black text-gray-800" style={{ fontFamily: 'var(--app-font-number)' }}>{b}</span>
          {!aIsWinner && <span className="text-xs font-black bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">MORE ✅</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: b }, (_, i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: a * 0.07 + i * 0.07, type: 'spring', stiffness: 400 }}
              className="text-2xl leading-none">🍌</motion.span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl px-3 py-2 border border-green-200 text-center space-y-0.5">
        <p className="text-base font-black text-green-800">
          Count both groups.
        </p>
        <p className="text-lg font-black text-gray-800">
          <span className="text-yellow-600">{answer}</span> has more, so {answer} is greater.
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Subtraction crossed-out visual ─── */
interface SubtractionInfo { total: number; takeAway: number; emoji: string; }
function getSubtraction(q: Question): SubtractionInfo | null {
  if (!q.visual) return null;
  if (q.visual.kind === 'equation' && q.visual.op === '−' && q.visual.lhs <= 9)
    return { total: q.visual.lhs, takeAway: q.visual.rhs, emoji: '🍌' };
  if (q.visual.kind === 'split' && q.visual.op === '−' && q.visual.leftN <= 9)
    return { total: q.visual.leftN, takeAway: q.visual.rightN, emoji: q.visual.leftEmoji };
  return null;
}

function SubtractionSolution({ total, takeAway, emoji }: SubtractionInfo) {
  const remaining = total - takeAway;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200 space-y-3"
    >
      {/* Single group: crossed-out + remaining */}
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const taken = i < takeAway;
          return (
            <motion.div key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 380 }}
              className="relative w-10 h-10 flex items-center justify-center">
              <span className={`text-3xl leading-none select-none transition-opacity ${taken ? 'opacity-30' : ''}`}>
                {emoji}
              </span>
              {taken && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-0.5 bg-red-500 rounded-full rotate-45" />
                  <div className="absolute w-9 h-0.5 bg-red-500 rounded-full -rotate-45" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Short explanation */}
      <div className="bg-white rounded-xl px-3 py-2 border border-orange-200 space-y-1 text-center">
        <p className="text-sm font-black text-gray-600">
          Start with <span className="text-orange-700 text-base">{total}</span>.
        </p>
        <p className="text-sm font-black text-red-600">
          Cross out <span className="text-base">{takeAway}</span>.
        </p>
        <p className="text-base font-black text-green-700">
          Count what is left: <span className="text-xl">{remaining}</span>.
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Jungle counting frame (5-per-row grid) ─── */
function TenFrame({ n }: { n: number }) {
  const rows = Math.ceil(Math.min(n, 20) / 5);
  return (
    <div className="flex flex-col items-center gap-2">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-2 bg-green-50 rounded-2xl px-3 py-2 border-2 border-green-200">
          {Array.from({ length: 5 }, (_, col) => {
            const idx = row * 5 + col;
            const filled = idx < n;
            return (
              <motion.div key={col}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 420, damping: 18 }}
                className="w-8 h-8 flex items-center justify-center">
                {filled
                  ? <span className="text-2xl leading-none select-none">🍌</span>
                  : <span className="w-6 h-6 rounded-full bg-green-100 border-2 border-dashed border-green-300 block" />}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Number line ─── */
function NumberLine({ marked, max }: { marked: number; max: number }) {
  const nums = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <div className="overflow-x-auto py-1">
      <div className="flex items-end gap-0 min-w-max mx-auto px-2">
        {nums.map((n, i) => (
          <div key={n} className="flex flex-col items-center">
            {n === marked ? (
              <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 border-2 border-yellow-500 flex items-center justify-center mb-1">
                <span className="text-xs font-black text-white">★</span>
              </motion.div>
            ) : <div className="w-6 h-6 mb-1" />}
            <div className={`h-3 w-px ${n === marked ? 'bg-orange-400' : 'bg-gray-300'}`} />
            {i < nums.length - 1 && <div className="h-px w-8 bg-gray-300" />}
            <span className={`text-xs font-black mt-0.5 ${n === marked ? 'text-orange-600' : 'text-gray-400'}`}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Visual display ─── */
function VisualDisplay({ visual }: { visual: QuestionVisual }) {
  if (visual.kind === 'dot-array') return <div className="flex justify-center py-2"><TenFrame n={visual.n} /></div>;
  if (visual.kind === 'number-line') return <div className="py-2"><NumberLine marked={visual.marked} max={visual.max} /></div>;
  if (visual.kind === 'missing') {
    const BOX = <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 border-4 border-dashed border-amber-400 text-2xl font-black text-amber-400" style={{ fontFamily: 'var(--app-font-number)' }}>?</span>;
    const NUM = (val: number) => <span className="text-4xl font-black text-amber-600" style={{ fontFamily: 'var(--app-font-number)' }}>{val}</span>;
    return (
      <div className="flex items-center justify-center gap-3 flex-wrap py-2">
        {visual.lhs === null ? BOX : NUM(visual.lhs)}
        <span className="text-3xl font-black text-gray-500">{visual.op}</span>
        {visual.rhs === null ? BOX : NUM(visual.rhs)}
        <span className="text-3xl font-black text-gray-400">=</span>
        {NUM(visual.result)}
      </div>
    );
  }
  if (visual.kind === 'count') {
    return (
      <div className="flex flex-wrap justify-center gap-1.5 py-3 px-2">
        {Array.from({ length: visual.n }, (_, i) => (
          <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 400 }}
            className="text-3xl leading-none">{visual.emoji}</motion.span>
        ))}
      </div>
    );
  }
  if (visual.kind === 'sequence') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 flex-wrap">
        {visual.nums.map((n, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="font-black text-2xl text-orange-400">→</span>}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
              className={`min-w-[48px] h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 px-2 font-black ${n === '?' ? 'bg-gray-50 border-dashed border-gray-300 text-gray-300' : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 text-yellow-700'}`}
              style={{ fontFamily: 'var(--app-font-number)' }}>{n}</motion.div>
          </React.Fragment>
        ))}
      </div>
    );
  }
  if (visual.kind === 'equation') {
    if (visual.op === '−') {
      /* Subtraction: show starting group only (full take-away shown in solution) */
      const showGroup = visual.lhs <= 9;
      return (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="flex items-center gap-3">
            <span className="text-5xl text-amber-600 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>{visual.lhs}</span>
            <span className="text-4xl font-black text-gray-500">−</span>
            <span className="text-5xl text-amber-600 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>{visual.rhs}</span>
            <span className="text-4xl font-black text-gray-300">=</span>
            <span className="text-5xl text-gray-200 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>?</span>
          </div>
          {showGroup && (
            <div className="flex flex-wrap justify-center gap-1.5 bg-green-50 rounded-2xl px-4 py-2 border-2 border-green-200">
              {Array.from({ length: visual.lhs }, (_, i) => (
                <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 380 }}
                  className="text-2xl leading-none">🍌</motion.span>
              ))}
            </div>
          )}
        </div>
      );
    }
    /* Addition equation */
    const showDots = visual.lhs <= 7 && visual.rhs <= 7;
    return (
      <div className="flex items-center justify-center gap-3 py-3 flex-wrap">
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl text-yellow-600 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>{visual.lhs}</span>
          {showDots && <div className="flex flex-wrap justify-center gap-0.5 max-w-[90px]">{Array.from({ length: visual.lhs }, (_, i) => <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} className="text-xl leading-none">🍌</motion.span>)}</div>}
        </div>
        <span className="text-4xl font-black text-gray-500">{visual.op}</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl text-yellow-600 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>{visual.rhs}</span>
          {showDots && <div className="flex flex-wrap justify-center gap-0.5 max-w-[90px]">{Array.from({ length: visual.rhs }, (_, i) => <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: visual.lhs * 0.05 + i * 0.05 }} className="text-xl leading-none">🍌</motion.span>)}</div>}
        </div>
        <span className="text-4xl font-black text-gray-300">=</span>
        <span className="text-5xl text-gray-200 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>?</span>
      </div>
    );
  }
  if (visual.kind === 'split') {
    if (visual.op === '−') {
      /* Subtraction split: one group of starting items only */
      const cap = 9;
      return (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="flex flex-wrap justify-center gap-1.5 bg-green-50 rounded-2xl px-4 py-2 border-2 border-green-200 max-w-[240px]">
            {Array.from({ length: Math.min(visual.leftN, cap) }, (_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 380 }}
                className="text-2xl leading-none">{visual.leftEmoji}</motion.span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm font-black text-gray-500">
            <span className="text-2xl font-black text-amber-600">{visual.leftN}</span>
            <span>take away</span>
            <span className="text-2xl font-black text-red-500">{visual.rightN}</span>
            <span className="text-xl">{visual.rightEmoji}</span>
          </div>
        </div>
      );
    }
    /* Addition split: two groups side-by-side */
    const cap = 9;
    return (
      <div className="flex items-center justify-center gap-3 py-3 flex-wrap">
        <div className="flex flex-col items-center gap-1 bg-amber-50 rounded-2xl px-3 py-2 border border-amber-100">
          <div className="flex flex-wrap justify-center gap-0.5 max-w-[110px]">{Array.from({ length: Math.min(visual.leftN, cap) }, (_, i) => <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04 }} className="text-2xl leading-none">{visual.leftEmoji}</motion.span>)}</div>
          <span className="text-xs font-black text-gray-500">{visual.leftN}</span>
        </div>
        <span className="text-3xl font-black text-gray-500">+</span>
        <div className="flex flex-col items-center gap-1 bg-amber-50 rounded-2xl px-3 py-2 border border-amber-100">
          <div className="flex flex-wrap justify-center gap-0.5 max-w-[110px]">{Array.from({ length: Math.min(visual.rightN, cap) }, (_, i) => <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: visual.leftN * 0.04 + i * 0.04 }} className="text-2xl leading-none">{visual.rightEmoji}</motion.span>)}</div>
          <span className="text-xs font-black text-gray-500">{visual.rightN}</span>
        </div>
        <span className="text-3xl font-black text-gray-300">=</span>
        <span className="text-4xl text-gray-200 leading-none font-black" style={{ fontFamily: 'var(--app-font-number)' }}>?</span>
      </div>
    );
  }
  if (visual.kind === 'number') {
    const isZero = visual.value === 0;
    return (
      <div className="flex justify-center py-3">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center shadow-xl border-4 ${isZero ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300' : 'bg-gradient-to-br from-yellow-300 to-orange-400 border-yellow-500'}`}>
          <span className="text-5xl font-black leading-none" style={{ fontFamily: 'var(--app-font-number)', color: isZero ? '#9ca3af' : 'white' }}>{visual.value}</span>
          <span className={`text-xs font-black capitalize mt-0.5 ${isZero ? 'text-gray-400' : 'text-yellow-100'}`}>{NUMBER_NAMES[visual.value]}</span>
        </motion.div>
      </div>
    );
  }
  return null;
}

/* ─── Accent configs ─── */
const ACCENT_BTN: Record<string, string> = {
  yellow: 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_6px_0_#b45309] hover:-translate-y-0.5',
  green:  'bg-green-400  text-green-900  border-green-500  shadow-[0_6px_0_#166534] hover:-translate-y-0.5',
  pink:   'bg-pink-400   text-pink-900   border-pink-500   shadow-[0_6px_0_#9d174d] hover:-translate-y-0.5',
  purple: 'bg-purple-400 text-purple-900 border-purple-500 shadow-[0_6px_0_#581c87] hover:-translate-y-0.5',
};
const ACCENT_CARD: Record<string, string> = {
  yellow: 'border-yellow-300', green: 'border-green-300', pink: 'border-pink-300', purple: 'border-purple-300',
};
const ACCENT_BAR_TOP: Record<string, string> = {
  yellow: 'from-yellow-400 to-amber-400', green: 'from-green-400 to-emerald-500',
  pink: 'from-pink-400 to-rose-500', purple: 'from-purple-400 to-violet-500',
};
const ACCENT_OPT: Record<string, string> = {
  yellow: 'border-yellow-200 text-amber-800 hover:border-yellow-400 hover:bg-yellow-50',
  green:  'border-green-200  text-green-800  hover:border-green-400  hover:bg-green-50',
  pink:   'border-pink-200   text-pink-800   hover:border-pink-400   hover:bg-pink-50',
  purple: 'border-purple-200 text-purple-800 hover:border-purple-400 hover:bg-purple-50',
};

interface AnswerRecord {
  selected: number | string;
  correct: boolean;
  praise: string;
}

export interface PracticeSessionProps {
  questions: Question[];
  onFinish: () => void;
  accentColor?: 'yellow' | 'green' | 'pink' | 'purple';
  title?: string;
}

export function PracticeSession({ questions, onFinish, accentColor = 'yellow', title = 'Practice Time!' }: PracticeSessionProps) {
  const [sessionQ] = useState<Question[]>(() =>
    shuffle(questions.filter(isGoodForPractice)).slice(0, PRACTICE_COUNT)
  );
  const actualCount = sessionQ.length;

  /* ── Phase machine ──
     cursor   = which question is on screen (can go back/forward)
     head     = furthest question reached (active question)
     phase    = 'question' | 'solution' (only matters when cursor === head)
     done     = end screen
     isReview = cursor < head  →  past question, read-only
  */
  const [cursor, setCursor] = useState(0);
  const [head, setHead]     = useState(0);
  const [phase, setPhase]   = useState<'question' | 'solution'>('question');
  const [done, setDone]     = useState(false);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [coinBurst, setCoinBurst] = useState(false);
  const [streak, setStreak] = useState(0);

  if (!sessionQ.length) {
    return <p className="text-center text-gray-400 font-bold py-8">No questions available!</p>;
  }

  const q         = sessionQ[Math.min(cursor, actualCount - 1)];
  const ans       = answers[cursor] ?? null;
  const isReview  = cursor < head;
  const showSolution = isReview || (cursor === head && phase === 'solution');
  const score     = Object.values(answers).filter(a => a.correct).length;
  const progress  = (head / actualCount) * 100;
  const comparison  = showSolution ? getComparison(q)   : null;
  const subtraction = showSolution ? getSubtraction(q)  : null;

  const handleSelect = (answer: number | string) => {
    if (cursor !== head || phase !== 'question') return;
    const correct = answer === q.correctAnswer;
    const praise  = correct ? PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)] : '';
    setAnswers(prev => ({ ...prev, [cursor]: { selected: answer, correct, praise } }));
    if (correct) {
      setStreak(s => s + 1);
      setCoinBurst(true);
      setTimeout(() => setCoinBurst(false), 900);
    } else {
      setStreak(0);
    }
    setPhase('solution');
  };

  const handleNext = () => {
    if (cursor < head) {
      setCursor(c => c + 1);
    } else {
      if (head < actualCount - 1) {
        const next = head + 1;
        setHead(next);
        setCursor(next);
        setPhase('question');
      } else {
        setDone(true);
      }
    }
  };

  const handlePrev = () => {
    if (cursor > 0) setCursor(c => c - 1);
  };

  const handleTryAgain = () => {
    setCursor(0); setHead(0); setPhase('question'); setDone(false);
    setAnswers({}); setStreak(0); setCoinBurst(false);
  };

  /* ── Done screen ── */
  if (done) {
    const pct   = score / actualCount;
    const stars = pct >= 0.8 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 text-center">
        <ChrysCharacter mood="celebrating" size="lg" bounce />
        <div className="bg-white rounded-[2rem] border-4 border-yellow-300 p-6 shadow-[0_8px_0_#B45309] w-full max-w-md overflow-hidden">
          <div className={`h-2 w-full bg-gradient-to-r ${ACCENT_BAR_TOP[accentColor]} -mx-6 mb-4`} style={{ width: 'calc(100% + 48px)', marginLeft: -24, marginTop: -24, marginBottom: 16 }} />
          <h2 className="text-3xl font-display font-black text-gray-800 mb-1">Practice Done! 🎉</h2>
          <p className="text-gray-400 font-bold mb-3 text-sm">You answered {actualCount} questions</p>
          <div className="flex items-baseline justify-center gap-1 my-3">
            <span className="text-7xl font-display font-black text-amber-600" style={{ fontFamily: 'var(--app-font-number)' }}>{score}</span>
            <span className="text-2xl text-gray-300 font-black">/{actualCount}</span>
          </div>
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: 3 }, (_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 350 }}
                className={`text-4xl ${i < stars ? '' : 'opacity-15 grayscale'}`}>⭐</motion.span>
            ))}
          </div>
          <p className="text-gray-500 font-bold mb-5 text-sm">
            {pct >= 0.8 ? "Amazing! You're a superstar! 🌟" : pct >= 0.6 ? "Great work! Keep practising!" : "Keep going — you're getting better! 💪"}
          </p>
          <div className="flex gap-3">
            <button onClick={handleTryAgain} className="flex-1 py-3.5 rounded-2xl font-display font-black text-lg bg-white border-2 border-gray-200 text-gray-500 shadow-[0_5px_0_#d1d5db] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
              <RefreshCw size={18} /> Try Again
            </button>
            <button onClick={onFinish} className={`flex-1 py-3.5 rounded-2xl font-display font-black text-lg border-2 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 ${ACCENT_BTN[accentColor]}`}>
              <CheckCircle size={18} /> Done!
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="w-full flex flex-col gap-3">

      {/* HUD */}
      <div className="flex items-center gap-2">
        <ProgressBar progress={progress} className="flex-1" />
        <motion.div key={score} animate={ans?.correct ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}
          className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1.5 border-2 border-yellow-400 shadow-[0_3px_0_#B45309] shrink-0">
          <span>🪙</span>
          <span className="font-display font-black text-lg text-yellow-700">{score}</span>
        </motion.div>
        <span className="text-xs font-black px-2.5 py-1.5 rounded-xl border-2 bg-white/80 border-white text-gray-500 shadow shrink-0">
          {cursor + 1}/{actualCount}
        </span>
      </div>

      {/* Streak badge */}
      <AnimatePresence>
        {streak >= 3 && cursor === head && phase === 'question' && (
          <motion.div key={streak} initial={{ scale: 0, y: -10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400 }} className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-display font-black text-base shadow-[0_3px_0_rgba(0,0,0,0.22)]">
              🔥 x{streak} streak!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chrys feedback row */}
      <div className="flex items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.div key={showSolution ? (ans?.correct ? 'correct' : 'wrong') : 'thinking'}
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
            <ChrysCharacter
              mood={showSolution ? (ans?.correct ? 'running' : 'thinking') : 'happy'}
              size="md" bounce={false} />
          </motion.div>
        </AnimatePresence>

        {/* Answer feedback bubble */}
        <AnimatePresence>
          {showSolution && ans && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              className={`rounded-3xl px-4 py-2.5 border-2 shadow-lg text-center flex-1 max-w-[180px] ${ans.correct ? 'bg-green-100 border-green-400 text-green-700 shadow-[0_3px_0_#15803d]' : 'bg-orange-100 border-orange-400 text-orange-700 shadow-[0_3px_0_#c2410c]'}`}>
              <span className="text-2xl">{ans.correct ? '⭐' : '🤔'}</span>
              <p className="text-sm font-black mt-0.5 leading-snug">
                {ans.correct ? (isReview ? 'Great job! ✅' : ans.praise) : 'Good try! 💪'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center rounded-2xl px-3 py-2 border-2 bg-white border-yellow-300 shadow-[0_3px_0_#B45309] shrink-0">
          <p className="text-xs font-bold text-gray-400">Score</p>
          <p className="text-2xl font-display font-black text-yellow-700">{score}</p>
        </div>
      </div>

      {/* ── Question card ── */}
      <AnimatePresence mode="wait">
        <motion.div key={cursor}
          initial={{ opacity: 0, x: cursor === head ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: cursor === head ? -50 : 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`relative bg-white rounded-[1.75rem] overflow-hidden border-2 ${ACCENT_CARD[accentColor]}`}
          style={{ boxShadow: '0 8px 0 rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.07)' }}>

          <div className={`h-2.5 w-full bg-gradient-to-r ${ACCENT_BAR_TOP[accentColor]}`} />
          <CoinBurst active={coinBurst} />

          <div className="p-4">
            {/* Review/Past badge */}
            {isReview && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-black bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                  📖 Question {cursor + 1} — Review
                </span>
              </div>
            )}

            <p className="text-xl font-display font-black text-gray-800 text-center leading-snug mb-3">{q.text}</p>

            {q.visual && (
              <div className="bg-sky-50/60 rounded-2xl border border-sky-100 mb-4 overflow-hidden">
                <VisualDisplay visual={q.visual} />
              </div>
            )}

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((option, i) => {
                const isSelected      = ans?.selected === option;
                const isReallyCorrect = option === q.correctAnswer;
                let cls = `bg-white border-2 answer-btn ${ACCENT_OPT[accentColor]}`;
                if (showSolution && ans) {
                  if (isReallyCorrect)        cls = 'bg-green-500 border-2 border-green-600 text-white shadow-[0_4px_0_#15803d]';
                  else if (isSelected)        cls = 'bg-orange-400 border-2 border-orange-500 text-white shadow-none';
                  else                        cls = 'bg-gray-50 border-2 border-gray-100 text-gray-300 shadow-none';
                }
                return (
                  <motion.button key={i}
                    onClick={() => !showSolution && handleSelect(option)}
                    disabled={showSolution || cursor !== head}
                    animate={
                      showSolution && ans && isReallyCorrect ? { scale: [1, 1.08, 1.03] } :
                      showSolution && ans && isSelected && !isReallyCorrect ? { x: [0, -8, 8, -5, 5, 0] } : {}
                    }
                    transition={{ duration: 0.35 }}
                    className={`min-h-[64px] rounded-2xl font-display font-black text-4xl transition-colors duration-100 ${cls}`}>
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* ── Solution section (shown after answering) ── */}
            <AnimatePresence>
              {showSolution && ans && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 24 }}
                  className="mt-4 space-y-3"
                >
                  {/* Your answer / Correct answer labels */}
                  <div className={`rounded-2xl p-3 border-2 ${ans.correct ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-gray-500">Your answer:</span>
                      <span className={`text-lg font-black ${ans.correct ? 'text-green-700' : 'text-orange-600'}`}>
                        {ans.selected} {ans.correct ? '✅' : '❌'}
                      </span>
                    </div>
                    {!ans.correct && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-500">Correct answer:</span>
                        <span className="text-lg font-black text-green-700">{q.correctAnswer} ✅</span>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-center text-base font-black text-gray-600">
                    {ans.correct ? 'Correct. Here is the method.' : 'Look at the method, then try the next one.'}
                  </p>

                  {/* Visual solution: comparison or subtraction */}
                  {comparison && (
                    <ComparisonSolution a={comparison.a} b={comparison.b} answer={comparison.answer} />
                  )}
                  {subtraction && !comparison && (
                    <SubtractionSolution total={subtraction.total} takeAway={subtraction.takeAway} emoji={subtraction.emoji} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation buttons ── */}
      <div className="flex items-center gap-3">
        {/* Previous */}
        {cursor > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            onClick={handlePrev}
            data-testid="button-prev"
            className="px-5 py-3 rounded-2xl font-display font-black text-base bg-white border-2 border-gray-200 text-gray-500 shadow-[0_4px_0_#d1d5db] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#d1d5db] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 shrink-0">
            <ArrowLeft size={17} strokeWidth={3} /> Prev
          </motion.button>
        )}

        {/* Next (only shown in solution/review mode) */}
        {showSolution && (
          <motion.button
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            onClick={handleNext}
            data-testid="button-next"
            className={`flex-1 py-3 rounded-2xl font-display font-black text-lg border-2 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 ${ACCENT_BTN[accentColor]}`}>
            {isReview ? 'Continue →' : head < actualCount - 1 ? 'Next →' : 'See Results!'}
            <ArrowRight size={18} strokeWidth={3} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
