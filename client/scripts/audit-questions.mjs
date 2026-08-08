import fs from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const appPath = fileURLToPath(new URL("../src/App.tsx", import.meta.url));
const sourceText = fs.readFileSync(appPath, "utf8");
const sourceFile = ts.createSourceFile(appPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const UNKNOWN = Symbol("unknown");
const numberWords = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty",
];
let buildMethodNode = null;

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return UNKNOWN;
}

function staticValue(node) {
  if (!node) return UNKNOWN;
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
    return staticValue(node.expression);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const value = staticValue(node.operand);
    return typeof value === "number" ? -value : UNKNOWN;
  }
  if (ts.isIdentifier(node)) {
    if (node.text === "NUMBERS") return Array.from({ length: 10 }, (_, value) => value);
    if (node.text === "undefined") return undefined;
    return UNKNOWN;
  }
  if (ts.isArrayLiteralExpression(node)) {
    const values = node.elements.map(staticValue);
    return values.some((value) => value === UNKNOWN) ? UNKNOWN : values;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) return UNKNOWN;
      const key = propertyName(property.name);
      const value = staticValue(property.initializer);
      if (key === UNKNOWN || value === UNKNOWN) return UNKNOWN;
      result[key] = value;
    }
    return result;
  }
  return UNKNOWN;
}

function sequenceAnswer(nums) {
  const missingIndex = nums.indexOf("?");
  const known = nums
    .map((value, index) => ({ value, index }))
    .filter((entry) => typeof entry.value === "number");
  if (missingIndex < 0 || known.length < 2) return UNKNOWN;
  const first = known[0];
  const second = known[1];
  const step = (second.value - first.value) / (second.index - first.index);
  if (!Number.isInteger(step)) return UNKNOWN;
  if (known.some((entry) => entry.value !== first.value + step * (entry.index - first.index))) return UNKNOWN;
  return first.value + step * (missingIndex - first.index);
}

function expectedAnswer(question) {
  const { answer, prompt, visual } = question;
  switch (visual.kind) {
    case "count":
    case "groupObserve":
    case "groupMake":
      return visual.count;
    case "numberWithGroup":
      return visual.value;
    case "number":
    case "word":
    case "audioNumber":
      return typeof answer === "string" ? numberWords[visual.value] : visual.value;
    case "groupChoices":
      return visual.audioValue;
    case "sameValue":
    case "layoutValue":
      return "Yes";
    case "groupTwo":
    case "groupCombine":
      return visual.a + visual.b;
    case "groupCompare":
    case "compareGroups": {
      if (visual.ask === "same") return visual.a === visual.b ? "Yes" : "No";
      if (visual.ask === "more") return visual.a > visual.b ? "Group A" : "Group B";
      return visual.a < visual.b ? "Group A" : "Group B";
    }
    case "add":
      return typeof answer === "string" ? "Adding" : visual.a + visual.b;
    case "subtract":
      return typeof answer === "string" ? "Taking away" : visual.a - visual.b;
    case "horizontalAdd":
    case "verticalAdd":
      return visual.a + visual.b;
    case "sequence":
      return sequenceAnswer(visual.nums);
    case "compare": {
      const text = String(prompt.en ?? "").toLowerCase();
      if (text.includes("less") || text.includes("smaller")) return Math.min(visual.a, visual.b);
      if (text.includes("more") || text.includes("greater")) return Math.max(visual.a, visual.b);
      return UNKNOWN;
    }
    case "symbol":
      return visual.a > visual.b ? ">" : visual.a < visual.b ? "<" : "=";
    case "teenBundle":
      return visual.tens * 10 + visual.ones;
    case "order":
      return UNKNOWN;
    default:
      return UNKNOWN;
  }
}

const questions = [];

function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "buildMethod") buildMethodNode = node;
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "q") {
    const id = staticValue(node.arguments[0]);
    const prompt = staticValue(node.arguments[2]);
    const options = staticValue(node.arguments[3]);
    const answer = staticValue(node.arguments[4]);
    const visual = staticValue(node.arguments[5]);
    const inputMode = node.arguments[6] ? staticValue(node.arguments[6]) : "choice";
    const explicitMethod = node.arguments[7] ? staticValue(node.arguments[7]) : undefined;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    questions.push({ id, prompt, options, answer, visual, inputMode, explicitMethod, line });
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);

if (!buildMethodNode) throw new Error("Could not find buildMethod in App.tsx");
const compiledBuildMethod = ts.transpileModule(buildMethodNode.getText(sourceFile), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const buildMethod = new Function(
  "objectName",
  "countForwardSteps",
  "WORDS",
  "teenNumberMethod",
  `${compiledBuildMethod}\nreturn buildMethod;`,
)(
  (_emoji, count, lang) => lang === "ms" ? (count === 1 ? "objek" : "objek") : (count === 1 ? "object" : "objects"),
  (start, count) => Array.from({ length: count }, (_, index) => start + index + 1).join(", "),
  { en: numberWords, ms: numberWords },
  (value) => ({ en: [`Answer: ${value}.`], ms: [`Jawapan: ${value}.`] }),
);

function generatedMethod(question) {
  if (question.explicitMethod && question.explicitMethod !== UNKNOWN) return question.explicitMethod;
  if (question.explicitMethod === UNKNOWN) return UNKNOWN;
  if (question.inputMode === "tapObjects" && typeof question.answer === "number" && question.answer > 0) {
    return {
      en: [`The number ${question.answer} shows how many.`, `Answer: ${question.answer}.`],
      ms: [`Nombor ${question.answer} tunjuk berapa banyak.`, `Jawapan: ${question.answer}.`],
    };
  }
  return buildMethod(question.visual, question.answer);
}

function checkMethod(question, method) {
  const issues = [];
  for (const lang of ["en", "ms"]) {
    const steps = method[lang] ?? [];
    const combined = steps.join(" ");
    const answerPattern = lang === "en" ? /\bAnswer:\s*([^.]*)/gi : /\bJawapan:\s*([^.]*)/gi;
    for (const match of combined.matchAll(answerPattern)) {
      if (typeof question.answer === "number") {
        const values = match[1].match(/-?\d+/g)?.map(Number) ?? [];
        const shownAnswer = values.at(-1);
        if (shownAnswer !== question.answer) {
          issues.push(`${lang} solution labels ${JSON.stringify(shownAnswer)} as the answer instead of ${question.answer}`);
        }
      } else {
        const translatedAnswer = lang === "ms"
          ? ({ Adding: "Tambah", "Taking away": "Tolak", Yes: "Ya", No: "Tidak" }[question.answer] ?? question.answer)
          : question.answer;
        if (!match[1].toLowerCase().includes(String(translatedAnswer).toLowerCase())) {
          issues.push(`${lang} solution labels ${JSON.stringify(match[1].trim())} instead of ${JSON.stringify(translatedAnswer)}`);
        }
      }
    }

    for (const match of combined.matchAll(/(-?\d+)\s*([+\-])\s*(-?\d+)\s*=\s*(-?\d+)/g)) {
      const left = Number(match[1]);
      const right = Number(match[3]);
      const shownResult = Number(match[4]);
      const calculated = match[2] === "+" ? left + right : left - right;
      if (shownResult !== calculated) issues.push(`${lang} solution contains incorrect equation '${match[0]}'`);
    }
  }

  if (question.visual.kind === "compare") {
    const greater = Math.max(question.visual.a, question.visual.b);
    const smaller = Math.min(question.visual.a, question.visual.b);
    const expectedSentence = question.answer === smaller
      ? `${smaller} is less than ${greater}.`
      : `${greater} is more than ${smaller}.`;
    if (!method.en.includes(expectedSentence)) {
      issues.push(`comparison solution should contain ${JSON.stringify(expectedSentence)}`);
    }
  }
  return issues;
}

const failures = [];
const seenIds = new Map();
let fullyAudited = 0;
let methodsAudited = 0;

for (const question of questions) {
  const label = question.id === UNKNOWN ? `line ${question.line}` : question.id;
  if (
    question.id === UNKNOWN ||
    question.options === UNKNOWN ||
    question.answer === UNKNOWN ||
    question.visual === UNKNOWN ||
    (question.visual?.kind === "compare" && question.prompt === UNKNOWN)
  ) {
    failures.push(`${label}: question data could not be read statically`);
    continue;
  }
  if (seenIds.has(question.id)) failures.push(`${label}: duplicate ID (first declared on line ${seenIds.get(question.id)})`);
  else seenIds.set(question.id, question.line);

  const expected = expectedAnswer(question);
  if (expected === UNKNOWN || expected === undefined) {
    failures.push(`${label}: no audit rule for visual kind '${question.visual.kind}'`);
    continue;
  }
  fullyAudited += 1;
  if (!Object.is(question.answer, expected)) {
    failures.push(`${label}: stored answer ${JSON.stringify(question.answer)} does not match expected ${JSON.stringify(expected)}`);
  }
  if (question.options.length > 0 && !question.options.some((option) => Object.is(option, question.answer))) {
    failures.push(`${label}: answer ${JSON.stringify(question.answer)} is missing from its choices`);
  }

  const method = generatedMethod(question);
  if (method !== UNKNOWN) {
    methodsAudited += 1;
    checkMethod(question, method).forEach((issue) => failures.push(`${label}: ${issue}`));
  }
}

if (failures.length > 0) {
  console.error(`Question audit failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Question audit passed: ${fullyAudited} answers/visuals and ${methodsAudited} solution methods checked across ${questions.length} questions.`);
}
