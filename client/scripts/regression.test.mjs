import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function functionSource(name) {
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, `${name} must exist`);
  return ts.transpile(node.getText(ast), { target: ts.ScriptTarget.ES2022 });
}

test('actual comparison feedback preserves true operand order in both languages', () => {
  const start = source.indexOf('  const comparisonSymbol = question.a === question.b');
  const end = source.indexOf('\n  useEffect', start);
  for (const lang of ['en', 'ms']) for (const isVisual of [true, false]) {
    for (let a = 0; a <= 20; a++) for (let b = 0; b <= 20; b++) {
      const feedback = vm.runInNewContext(source.slice(start, end) + '\nfeedback', {
        question: { a, b }, lang, isVisual, objectWord: () => 'objects',
      });
      const match = feedback.match(/(\d+) ([<>=]) (\d+)\./);
      assert.ok(match, feedback);
      const [, left, sign, right] = match;
      assert.ok(sign === '=' ? +left === +right : sign === '<' ? +left < +right : +left > +right, feedback);
    }
  }
});

function countingHarness(muted = true) {
  let now = 0;
  const counts = [], completions = [], waits = [];
  const context = {
    NUMBER_AUDIO_ENABLED: true, audioMuted: muted, activeCountingRunId: null,
    audioRunId: 0, queuedAudioAfterCounting: null, lastCountingFinishedAt: 0,
    COUNTING_STEP_MS: 600, COUNTING_INTER_NUMBER_GAP_MS: 80,
    COUNTING_NUMBER_TAIL_TRIM_MS: 0, COUNT_TOTAL_REVEAL_DELAY_MS: 500,
    performance: { now: () => now },
    wait: async ms => { waits.push(ms); now += ms; },
    stopNumberAudio: () => { context.audioRunId++; context.activeCountingRunId = null; },
    playNumberFile: async (_value, _lang, _run, onStart) => { onStart(); now += 200; return true; },
  };
  vm.createContext(context);
  vm.runInContext(functionSource('speakCountingSequence'), context);
  const run = (count = 3, lang = 'en') => context.speakCountingSequence(count, lang, 600,
    value => counts.push([value, now]), value => completions.push([value, now]));
  return { context, counts, completions, waits, run, now: () => now };
}

for (const muted of [true, false]) for (const lang of ['en', 'ms']) {
  test(`counting is sequential with a final 500ms delay: muted=${muted}, lang=${lang}`, async () => {
    const h = countingHarness(muted);
    await h.run(3, lang);
    assert.deepEqual(h.counts.map(([value]) => value), [1, 2, 3]);
    assert.ok(h.counts[1][1] - h.counts[0][1] >= 600);
    assert.ok(h.now() - h.completions.at(-1)[1] >= 500);
    await h.run(2, lang);
    assert.deepEqual(h.counts.slice(3).map(([value]) => value), [1, 2]);
  });
}
test('cancelled count never advances another object or runs queued narration', async () => {
  const h = countingHarness();
  let queued = false;
  h.context.queuedAudioAfterCounting = () => { queued = true; };
  h.context.wait = async () => { h.context.audioRunId++; };
  await h.run();
  assert.deepEqual(h.counts.map(([value]) => value), [1]);
  assert.equal(queued, false);
});

test('mid-count mute preserves the run and silences the active clip', () => {
  const h = countingHarness(false);
  Object.assign(h.context, {
    activeNumberAudio: { muted: false }, activeCountingRunId: 4,
    stopCelebrationAudio() {}, audioOutputContext: null, keepAudioOutputAwake() {},
  });
  vm.runInContext(functionSource('setGlobalAudioMuted'), h.context);
  h.context.setGlobalAudioMuted(true);
  assert.equal(h.context.audioRunId, 0);
  assert.equal(h.context.activeCountingRunId, 4);
  assert.equal(h.context.activeNumberAudio.muted, true);
});

test('worked-example and carry continuations check lifecycle epochs after every await', () => {
  for (const name of ['CarryInteraction', 'AdvancedPart2WorkedBeat', 'AdvancedSubtractionWorkedBeat']) {
    const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
    function visit(n) {
      if (ts.isBlock(n)) n.statements.forEach((statement, index) => {
        if (ts.isExpressionStatement(statement) && ts.isAwaitExpression(statement.expression)) {
          assert.match(n.statements[index + 1]?.getText(ast) ?? '', /epoch !== sequenceEpoch.current/, name);
        }
      });
      ts.forEachChild(n, visit);
    }
    visit(node);
  }
});

function handlerSource(component, handler) {
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === component);
  let result;
  function visit(n) {
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === handler) result = n.initializer;
    ts.forEachChild(n, visit);
  }
  visit(fn);
  assert.ok(result);
  return ts.transpile(`const handler = ${result.getText(ast)};`, { target: ts.ScriptTarget.ES2022 });
}

test('carry navigation during flight never lands after cancellation', async () => {
  let landed = false;
  const sequenceEpoch = { current: 0 };
  const context = { sequenceEpoch, frameFull: true, liftStarted: false,
    setLiftStarted() {}, setLifted() { landed = true; },
    wait: async () => { sequenceEpoch.current++; },
  };
  vm.createContext(context);
  vm.runInContext(handlerSource('CarryInteraction', 'liftTen'), context);
  await vm.runInContext('handler()', context);
  assert.equal(landed, false);
});

test('addition reset during operand count prevents total reveal and narration', async () => {
  let narrated = false, updates = 0;
  const sequenceEpoch = { current: 0 };
  const context = { sequenceEpoch, problem: { a: 8, b: 5 }, lang: 'en', BANANA: 'banana',
    setOperandTotalsVisible() { updates++; }, setTopCounted() {}, setBottomCounted() {},
    countSequence: async () => { sequenceEpoch.current++; },
    speakRecordedBananaTotal: async () => { narrated = true; },
  };
  vm.createContext(context);
  vm.runInContext(handlerSource('AdvancedPart2WorkedBeat', 'countOperand'), context);
  await vm.runInContext("handler('top')", context);
  assert.equal(updates, 1);
  assert.equal(narrated, false);
});

function persistenceHarness() {
  const values = new Map();
  const context = { exports: {}, localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key),
  } };
  const code = readFileSync(new URL('../src/lib/pendingProgress.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpile(code, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }), context);
  return context.exports;
}
const snapshot = stars => ({ player: { name: 'Explorer', stars, progress: { addition: stars } }, lang: 'ms', soundEnabled: false });
test('durable snapshot survives a failed write and stale acknowledgment', async () => {
  const p = persistenceHarness();
  p.stageProgress('save', snapshot(1));
  await assert.rejects(p.serializeProgress('save', async () => { throw Error('offline'); }));
  assert.equal(p.pendingProgress('save').player.stars, 1);
  p.stageProgress('save', snapshot(2));
  p.acknowledgeProgress('save', snapshot(1));
  assert.equal(p.pendingProgress('save').player.stars, 2);
  await p.serializeProgress('save', async () => p.acknowledgeProgress('save', snapshot(2)));
  assert.equal(p.pendingProgress('save'), null);
});
test('overlapping writes are serialized and a failed write does not poison retry', async () => {
  const p = persistenceHarness(), order = [];
  let release;
  const first = p.serializeProgress('save', async () => { order.push(1); await new Promise(r => release = r); });
  const second = p.serializeProgress('save', async () => { order.push(2); });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(order, [1]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(order, [1, 2]);
});

test('client no longer ships a list of valid offline PINs', () => {
  const saves = readFileSync(new URL('../src/lib/gameSaves.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(saves, /APPROVED_OFFLINE_PINS|"\d{6}"/);
});

function gameSaveHarness(fetchImpl) {
  const values = new Map();
  let acknowledged = false;
  const pending = {
    stageProgress() {}, pendingProgress: () => null,
    serializeProgress: (_id, write) => write(),
    acknowledgeProgress: () => { acknowledged = true; },
  };
  const context = {
    exports: {}, fetch: fetchImpl, crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    require: id => id === './pendingProgress' ? pending : assert.fail(`Unexpected import: ${id}`),
  };
  const code = readFileSync(new URL('../src/lib/gameSaves.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpile(code, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }), context);
  return { api: context.exports, values, acknowledged: () => acknowledged };
}

test('network failure saves existing progress locally without claiming cloud sync', async () => {
  const h = gameSaveHarness(async () => { throw new TypeError('DNS unavailable'); });
  const existing = { id: '11111111-1111-4111-8111-111111111111', fileName: 'Adventure', playerName: 'Explorer',
    stars: 1, updatedAt: '2026-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
    player: { name: 'Explorer', stars: 1, progress: {} }, lang: 'en', soundEnabled: true };
  h.values.set('chrys-offline-saves:123456', JSON.stringify([existing]));
  const result = await h.api.saveGameProgress('123456', existing.id,
    { name: 'Explorer', stars: 2, progress: { addition: 1 } }, 'en', true);
  assert.equal(result.synced, false);
  assert.equal(result.save.stars, 2);
  assert.equal(JSON.parse(h.values.get('chrys-offline-saves:123456'))[0].stars, 2);
  assert.equal(h.acknowledged(), false);
});

test('successful request reports cloud sync and acknowledges the pending snapshot', async () => {
  const cloudSave = { id: '11111111-1111-4111-8111-111111111111', fileName: 'Adventure', playerName: 'Explorer',
    stars: 2, updatedAt: '2026-01-02T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
    player: { name: 'Explorer', stars: 2, progress: { addition: 1 } }, lang: 'en', soundEnabled: true };
  const h = gameSaveHarness(async () => ({ ok: true, json: async () => ({ save: cloudSave }) }));
  const result = await h.api.saveGameProgress('123456', cloudSave.id, cloudSave.player, 'en', true);
  assert.equal(result.synced, true);
  assert.equal(h.acknowledged(), true);
});

// Exercise the real navigation components with saved progress and inspect their element trees.
function navigationHarness(name, props) {
  const React = { createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }), Fragment: 'fragment' };
  const context = { React, chrysHappy: 'chrys', chrysRunning: 'chrys', BANANA: 'banana',
    LEARNING_SECTION_MARKERS: Object.fromEntries(['sky','emerald','violet','amber','teal','rose','orange','navy'].map(c => [c,c])),
    ...Object.fromEntries(['Hash','SpriteIcon','ListOrdered','Boxes','Plus','Minus','MapIcon','Star','Compass','Flag','Sparkles','Check','ArrowRight','AdventureProgress'].map(c => [c,c])) };
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  vm.createContext(context);
  vm.runInContext(ts.transpile(node.getText(ast), { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React }), context);
  return context[name](props);
}
function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...tree.children.flatMap(elements)];
}
test('all eight journey milestones use the existing lesson routes and saved completion in both languages', () => {
  const routes = ['learnRecognize','learnValues','learnSequencing','groupingMode','learnAddition','learnSubtraction','learnReal','testMenu'];
  for (const lang of ['en','ms']) for (const progress of [{}, {recognizeNumbers:1, numberValues:1}]) {
    const visited = [];
    const tree = navigationHarness('MenuScreen', {lang, t: new Proxy({}, {get: (_,key) => String(key)}), player:{name:'Test',progress}, go: route => visited.push(route)});
    const nodes = elements(tree);
    const milestones = nodes.filter(n => n.type === 'button' && n.props.className?.includes('journey-milestone'));
    const cards = nodes.filter(n => n.type === 'button' && n.props.className?.startsWith('meadow-lesson '));
    assert.equal(milestones.length, 8); assert.equal(cards.length, 8);
    milestones.forEach(n => n.props.onClick()); assert.deepEqual(visited, routes);
    visited.length = 0; cards.forEach(n => n.props.onClick()); assert.deepEqual(visited, routes);
    const completed = Object.keys(progress).length;
    assert.equal(milestones.filter(n => n.props['data-state'] === 'complete').length, completed);
    assert.equal(cards.filter(n => n.props['data-complete']).length, completed);
    assert.equal(milestones[completed].props['aria-current'], 'step');
  }
});
test('mission renders exactly one button, title and description while preserving disabled and completed states', () => {
  for (const lang of ['en','ms']) for (const locked of [false,true]) for (const complete of [false,true]) {
    let opened = false;
    const tree = navigationHarness('AdvancedMissionTile', {mission:5,title:'Unique mission title',subtitle:'Unique description',lang,locked,complete,onClick:()=>{opened=true;}});
    const nodes = elements(tree);
    assert.equal(nodes.filter(n=>n.type === 'button').length,1);
    assert.equal(tree.props.disabled,locked);
    assert.equal(tree.props['data-complete'],complete);
    const text = nodes.flatMap(n=>n.children).filter(c=>typeof c === 'string');
    assert.equal(text.filter(t=>t === 'Unique mission title').length,1);
    assert.equal(text.filter(t=>t === 'Unique description').length,1);
    assert.ok(nodes.some(n=>n.props.className === 'expedition-number' && n.children.includes(5)));
    if (!locked) {tree.props.onClick(); assert.equal(opened,true);}
  }
});
