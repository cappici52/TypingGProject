import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../lib/game.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { createBattle, battleReducer: reduce, wordFor, STAGES, accuracy, wpm } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('a complete word attacks once, scores, clears input and builds combo', () => {
  let state = reduce(createBattle(), { type: 'start' });
  state = reduce(state, { type: 'input', value: 'l' });
  assert.equal(state.kills, 0);
  state = reduce({ ...state, elapsed: 60000 }, { type: 'input', value: 'leaf' });
  assert.equal(state.kills, 1); assert.equal(state.enemies.length, 0);
  assert.equal(state.typed, ''); assert.equal(state.score, 45);
  assert.equal(accuracy(state), 100); assert.equal(wpm(state), 1);
});
test('typos reduce accuracy and can be corrected without losing a heart', () => {
  let state = reduce(createBattle(), { type: 'start' });
  state = reduce(state, { type: 'input', value: 'x' });
  state = reduce(state, { type: 'input', value: '' });
  for (const value of ['l', 'le', 'lea', 'leaf']) state = reduce(state, { type: 'input', value });
  assert.equal(accuracy(state), 80); assert.equal(state.hearts, 5); assert.equal(state.kills, 1);
});
test('missed enemies cost hearts, reset combo and eventually end the round', () => {
  let state = reduce(createBattle(), { type: 'start' });
  state = { ...state, combo: 3, enemies: Array.from({ length: 5 }, (_, id) => ({ id, word: 'x', kind: 0, age: STAGES[0].lifetime - 50 })) };
  state = reduce(state, { type: 'tick', delta: 50 });
  assert.equal(state.hearts, 0); assert.equal(state.status, 'lost'); assert.equal(state.combo, 0);
});
test('pausing freezes gameplay and preserves typed prefix', () => {
  let state = reduce(createBattle(), { type: 'start' });
  state = reduce(state, { type: 'input', value: 'le' });
  state = reduce(state, { type: 'pause' });
  assert.deepEqual(reduce(state, { type: 'tick', delta: 200 }), state);
  assert.equal(reduce(state, { type: 'pause' }).typed, 'le');
});
test('last required word clears a stage; code and Thai words match exactly', () => {
  for (const mode of ['en', 'th', 'javascript', 'python']) {
    let state = reduce(createBattle(mode), { type: 'start' });
    state = { ...state, kills: STAGES[0].goal - 1 };
    state = reduce(state, { type: 'input', value: wordFor(mode, 1, 0) });
    assert.equal(state.status, 'won'); assert.equal(state.kills, STAGES[0].goal);
  }
  let code = reduce(createBattle('javascript', 5), { type: 'start' });
  const correct = code.enemies[0].word;
  code = reduce(code, { type: 'input', value: correct.toLowerCase() });
  assert.equal(code.kills, 0);
});
test('difficulty gets faster and word banks have no duplicate active targets', () => {
  for (let i = 1; i < STAGES.length; i++) { assert.ok(STAGES[i].lifetime < STAGES[i-1].lifetime); assert.ok(STAGES[i].spawn < STAGES[i-1].spawn); assert.ok(STAGES[i].goal > STAGES[i-1].goal); }
  let state = reduce(createBattle(), { type: 'start' });
  for (let i = 0; i < 200; i++) state = reduce(state, { type: 'tick', delta: 200 });
  assert.equal(new Set(state.enemies.map(e => e.word)).size, state.enemies.length);
});
