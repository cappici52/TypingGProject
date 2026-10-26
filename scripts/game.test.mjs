import { readFileSync, writeFileSync, mkdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = path.join(root, 'outputs', 'test-runtime');
mkdirSync(runtime, { recursive: true });
const modules = ['words', 'sentences', 'monsters', 'game', 'save'];
for (const name of modules) {
  let source = ts.transpileModule(readFileSync(path.join(root, 'lib', name + '.ts'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  source = source.replace(/from "\.\/(\w+)"/g, 'from "./$1.mjs"');
  writeFileSync(path.join(runtime, name + '.mjs'), source);
}
after(() => { for (const name of modules) unlinkSync(path.join(runtime, name + '.mjs')); rmdirSync(runtime); });
const game = await import(new URL('../outputs/test-runtime/game.mjs', import.meta.url));
const storage = await import(new URL('../outputs/test-runtime/save.mjs', import.meta.url));
const { createBattle, battleReducer: reduce, wordFor, makeEnemy, STAGES, requiredKills, accuracy, wpm } = game;
const { emptySave, addRun, parseSave, checkpointSave, restoredBattle, migrateGuest } = storage;
const start = (mode = 'en', stage = 1) => reduce(createBattle(mode, stage), { type: 'start' });
function enterBoss(mode, stage) {
  let state = start(mode, stage);
  state = { ...state, kills: STAGES[stage - 1].goal - 1 };
  return reduce(state, { type: 'input', value: state.enemies[0].word });
}
const run = (stage, mode = 'en', cleared = true) => ({ id: crypto.randomUUID(), mode, stage, score: 300, wpm: 45, accuracy: 96, cleared, createdAt: Date.now() });

test('a full word attacks once, scores, leaves a visible defeat animation and clears input', () => {
  const word = start().enemies[0].word;
  let state = reduce(start(), { type: 'input', value: word.slice(0, 1) });
  assert.equal(state.kills, 0); assert.equal(state.enemies[0].hurtAt, state.elapsed);
  state = reduce({ ...state, elapsed: 60000 }, { type: 'input', value: word });
  assert.equal(state.kills, 1); assert.equal(state.words, 1); assert.equal(state.enemies.length, 0);
  assert.equal(state.defeated.length, 1); assert.equal(state.typed, ''); assert.equal(state.score, word.length * 10 + 5);
  assert.equal(accuracy(state), 100); assert.equal(wpm(state), Math.round(word.length / 5));
  for (let i = 0; i < 3; i++) state = reduce(state, { type: 'tick', delta: 200 });
  assert.equal(state.defeated.length, 0);
});
test('typos count toward accuracy and correction preserves hearts', () => {
  const word = start().enemies[0].word;
  let state = reduce(start(), { type: 'input', value: '#' });
  state = reduce(state, { type: 'input', value: '' });
  for (let i = 1; i <= word.length; i++) state = reduce(state, { type: 'input', value: word.slice(0, i) });
  assert.equal(accuracy(state), Math.round(word.length / (word.length + 1) * 100)); assert.equal(state.hearts, 5);
});
test('missed enemies damage the hero, clear prefix and end the run at zero hearts', () => {
  let state = start();
  state = { ...state, typed: 'le', combo: 3, enemies: Array.from({ length: 5 }, (_, id) => ({ ...makeEnemy('en', 1, id), age: STAGES[0].lifetime - 50 })) };
  state = reduce(state, { type: 'tick', delta: 50 });
  assert.equal(state.hearts, 0); assert.equal(state.status, 'lost'); assert.equal(state.combo, 0); assert.equal(state.typed, ''); assert.equal(state.hurtAt, 50);
});
test('paused combat freezes and can resume or retreat without erasing score', () => {
  let state = reduce(start(), { type: 'input', value: 'le' });
  state = reduce({ ...state, score: 125 }, { type: 'pause' });
  assert.deepEqual(reduce(state, { type: 'tick', delta: 200 }), state);
  assert.equal(reduce(state, { type: 'pause' }).typed, 'le');
  assert.equal(reduce(state, { type: 'retreat' }).score, 125);
  assert.equal(reduce(state, { type: 'retreat' }).status, 'lost');
});
test('there are 30 stages, minibosses on 5/15/25, major bosses on 10/20/30', () => {
  assert.equal(STAGES.length, 30);
  assert.deepEqual(STAGES.filter(s => s.encounter === 'mini').map(s => s.number), [5, 15, 25]);
  assert.deepEqual(STAGES.filter(s => s.encounter === 'boss').map(s => s.number), [10, 20, 30]);
  assert.ok(STAGES[29].lifetime < STAGES[0].lifetime); assert.ok(STAGES[29].spawn < STAGES[0].spawn);
});
test('all 15 distinct normal monster species appear without duplicate target words', () => {
  assert.equal(new Set(Array.from({ length: 15 }, (_, id) => makeEnemy('en', 1, id).kind)).size, 15);
  let state = start();
  for (let i = 0; i < 150; i++) state = reduce(state, { type: 'tick', delta: 200 });
  assert.equal(new Set(state.enemies.map(e => e.word)).size, state.enemies.length);
});
test('regular final kill clears stage in all four modes', () => {
  for (const mode of ['en', 'th', 'javascript', 'python']) {
    let state = start(mode);
    state = reduce({ ...state, kills: STAGES[0].goal - 1 }, { type: 'input', value: state.enemies[0].word });
    assert.equal(state.status, 'won'); assert.equal(state.kills, requiredKills(1));
  }
});
test('wave completion spawns a living miniboss rather than ending the stage', () => {
  const state = enterBoss('en', 5);
  assert.equal(state.status, 'playing'); assert.equal(state.phase, 'boss'); assert.equal(state.enemies.length, 1);
  assert.equal(state.enemies[0].role, 'mini'); assert.equal(state.enemies[0].hp, 4); assert.equal(state.enemies[0].maxHp, 4);
  assert.ok(state.enemies[0].word.length > 4);
});
test('miniboss HP drops once per completed word and only final hit wins', () => {
  let state = enterBoss('th', 5);
  for (let hp = 4; hp > 0; hp--) {
    assert.equal(state.enemies[0].hp, hp);
    const word = state.enemies[0].word;
    state = reduce(state, { type: 'input', value: word });
    assert.equal(state.status, hp === 1 ? 'won' : 'playing');
    if (hp > 1) { assert.equal(state.enemies[0].hp, hp - 1); assert.notEqual(state.enemies[0].word, word); assert.equal(state.enemies[0].hurtAt, state.elapsed); }
  }
});
test('major bosses use full sentences/code statements and increasing real HP', () => {
  for (const mode of ['en', 'th', 'javascript', 'python']) {
    let state = enterBoss(mode, 10);
    assert.equal(state.enemies[0].role, 'boss'); assert.equal(state.enemies[0].maxHp, 6);
    assert.ok(state.enemies[0].word.length > 18);
    if (mode !== 'th') assert.ok(state.enemies[0].word.includes(' '));
    const hp = state.enemies[0].hp;
    state = reduce(state, { type: 'input', value: state.enemies[0].word.slice(0, 4) });
    assert.equal(state.enemies[0].hp, hp);
    while (state.status === 'playing') state = reduce(state, { type: 'input', value: state.enemies[0].word });
    assert.equal(state.status, 'won');
  }
  assert.equal(enterBoss('en', 20).enemies[0].hp, 8); assert.equal(enterBoss('en', 30).enemies[0].hp, 10);
});
test('boss attacks on timeout, stays alive, changes phrase and resets its timer', () => {
  let state = enterBoss('en', 10); const word = state.enemies[0].word;
  state = { ...state, enemies: [{ ...state.enemies[0], age: STAGES[9].bossDeadline - 100 }] };
  state = reduce(state, { type: 'tick', delta: 100 });
  assert.equal(state.hearts, 4); assert.equal(state.enemies[0].hp, 6); assert.equal(state.enemies[0].age, 0); assert.notEqual(state.enemies[0].word, word);
});
test('case, punctuation, and spaces are required in code and boss phrases', () => {
  const state = enterBoss('javascript', 10); const word = state.enemies[0].word;
  assert.equal(reduce(state, { type: 'input', value: word.replace(/ /g, '') }).enemies[0].hp, state.enemies[0].hp);
  assert.equal(reduce(start('python'), { type: 'input', value: 'Def' }).kills, 0);
});
test('round trip persists fractional clocks, boss HP, score and paused checkpoint', () => {
  let state = enterBoss('python', 10);
  state = reduce(state, { type: 'input', value: state.enemies[0].word });
  state = reduce(state, { type: 'tick', delta: 50.25 });
  const data = { ...emptySave(), unlocked: { en: 1, th: 1, javascript: 1, python: 10 } };
  const saved = parseSave(JSON.stringify(checkpointSave(data, state)));
  const restored = restoredBattle(saved);
  assert.equal(restored.status, 'paused'); assert.equal(restored.stage, 10); assert.equal(restored.elapsed, 50.25);
  assert.equal(restored.enemies[0].hp, 5); assert.equal(restored.score, state.score); assert.equal(restored.typed, '');
});
test('save history is bounded while unlocks and personal records remain durable', () => {
  let data = addRun(emptySave(), run(29));
  for (let i = 0; i < 110; i++) data = addRun(data, { ...run(1), score: 1, wpm: 1 });
  assert.equal(data.history.length, 100); assert.equal(data.unlocked.en, 30); assert.equal(data.unlocked.th, 1);
  assert.equal(data.stats.runs, 111); assert.equal(data.stats.bestScore, 300); assert.equal(data.stats.bestWpm, 45);
  assert.equal(parseSave(JSON.stringify(data)).unlocked.en, 30);
});
test('run UUID deduplicates saves, loss does not unlock, guest history migrates', () => {
  const item = run(5, 'th', false); const once = addRun(emptySave(), item);
  assert.equal(addRun(once, item).stats.runs, 1); assert.equal(once.unlocked.th, 1);
  const migrated = migrateGuest(JSON.stringify([run(2), { wrong: true }]));
  assert.equal(migrated.history.length, 1); assert.equal(migrated.unlocked.en, 3);
});
test('corrupt/oversized/invalid imported saves are rejected before replacement', () => {
  assert.throws(() => parseSave('{broken')); assert.throws(() => parseSave('x'.repeat(2_000_001)));
  assert.throws(() => parseSave(JSON.stringify({ ...emptySave(), selection: { mode: 'en', stage: 30 } })));
  let state = enterBoss('en', 5); state = { ...state, enemies: [{ ...state.enemies[0], kind: 14 }] };
  assert.throws(() => parseSave(JSON.stringify(checkpointSave({ ...emptySave(), unlocked: { en: 5, th: 1, javascript: 1, python: 1 } }, state))));
});


test('expanded banks contain at least 100 distinct targets per tier and 120 boss phrases per mode', () => {
  for (const mode of ['en', 'th', 'javascript', 'python']) {
    for (const stage of [1, 4, 12]) {
      const pool = game.wordPool(mode, stage);
      assert.ok(pool.length >= 100, `${mode} stage ${stage}: ${pool.length}`);
      assert.equal(new Set(pool).size, pool.length);
      assert.ok(pool.every(word => word.length > 0 && word.length <= 200 && word === word.normalize('NFC')));
    }
    assert.ok(game.wordPool(mode, 5, 'mini').length >= 100);
    assert.ok(game.wordPool(mode, 10, 'boss').length >= 120);
  }
});
test('every bank is drawn without repeats until exhausted, then excludes ten recent and visible targets', () => {
  for (const mode of ['en', 'th', 'javascript', 'python']) {
    for (const [stage, role] of [[1, 'normal'], [4, 'normal'], [12, 'normal'], [5, 'mini'], [10, 'boss']]) {
      const pool = game.wordPool(mode, stage, role);
      let history = [], drawn = [];
      for (let i = 0; i < pool.length; i++) {
        const draw = game.drawWord(mode, stage, i + 1792, role, history);
        assert.ok(pool.includes(draw.word));
        history = draw.history; drawn.push(draw.word);
      }
      assert.equal(new Set(drawn).size, pool.length);
      const visible = drawn.slice(0, 5);
      const next = game.drawWord(mode, stage, 12444, role, history, visible);
      assert.ok(!drawn.slice(-10).includes(next.word)); assert.ok(!visible.includes(next.word));
    }
  }
});
test('different run seeds vary opening words and reducer history survives replay and mode changes', () => {
  const openings = new Set(Array.from({length: 50}, (_, seed) => reduce(createBattle(), {type:'start', seed}).enemies[0].word));
  assert.ok(openings.size >= 30);
  let state = start(); const first = state.enemies[0].word;
  state = reduce(state, {type:'retreat'});
  state = reduce(state, {type:'reset', mode:'th', stage:1});
  state = reduce(state, {type:'start', seed:42});
  state = reduce(state, {type:'retreat'});
  state = reduce(state, {type:'reset', mode:'en', stage:1});
  state = reduce(state, {type:'start', seed:0});
  assert.notEqual(state.enemies[0].word, first);
  assert.ok(state.wordHistory.includes('en:' + first));
});
test('word history survives normal spawns, checkpoint reload, completed-run save and legacy saves', () => {
  let state = start(); const first = state.enemies[0].word;
  for(let i=0; i<20; i++) state = reduce(state, {type:'tick', delta:200});
  assert.equal(new Set(state.enemies.map(e=>e.word)).size, state.enemies.length);
  assert.equal(state.wordHistory.length, 2);
  const data = parseSave(JSON.stringify(checkpointSave(emptySave(), state)));
  assert.deepEqual(restoredBattle(data).wordHistory, state.wordHistory);
  const finished = parseSave(JSON.stringify(addRun(data, run(1))));
  const reset = restoredBattle(finished);
  assert.deepEqual(reset.wordHistory, state.wordHistory);
  assert.notEqual(reduce(reset,{type:'start',seed:0}).enemies[0].word,first);
  const legacy = emptySave(); delete legacy.wordHistory;
  const old = {...state}; delete old.wordHistory; delete old.wordSeed;
  legacy.checkpoint = old;
  const migrated = parseSave(JSON.stringify(legacy));
  assert.deepEqual(migrated.wordHistory,[]); assert.deepEqual(migrated.checkpoint.wordHistory,[]);
  assert.equal(migrated.checkpoint.wordSeed,0);
});
