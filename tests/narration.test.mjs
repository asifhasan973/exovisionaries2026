import test from 'node:test';
import assert from 'node:assert/strict';
import { NarrationController } from '../src/game/story/narration.ts';

function harness() {
  const utterances = [], timers = new Map();
  let nextTimer = 0, cancellations = 0;
  const controller = new NarrationController({
    synthesis: { speak: utterance => utterances.push(utterance), cancel: () => { cancellations++; }, getVoices: () => [] },
    createUtterance: text => ({ text }),
    setTimer: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimer: id => timers.delete(id),
  });
  return { controller, utterances, timers, get cancellations() { return cancellations; } };
}

test('mouth starts only on actual speech start, and closes on end or pause', () => {
  const h = harness();
  h.controller.speak('My own mission?', 'commander');
  const utterance = h.utterances[0];
  assert.equal(h.controller.getSnapshot().status, 'starting');
  utterance.onstart();
  assert.deepEqual(h.controller.getSnapshot(), { status: 'speaking', character: 'commander' });
  utterance.onpause();
  assert.equal(h.controller.getSnapshot().character, null);
  utterance.onresume();
  assert.equal(h.controller.getSnapshot().status, 'speaking');
  utterance.onend();
  assert.equal(h.controller.getSnapshot().status, 'idle');
  utterance.onstart(); // stale callback after end cannot flap the mouth
  assert.equal(h.controller.getSnapshot().status, 'idle');
  assert.equal(h.timers.size, 0);
});

test('rapid Next/Back/replay cancels old audio and ignores out-of-order callbacks', () => {
  const h = harness();
  h.controller.speak('Old', 'chief');
  const old = h.utterances[0]; old.onstart();
  h.controller.speak('New', 'commander');
  const current = h.utterances[1];
  assert.equal(h.cancellations, 1);
  old.onstart(); old.onend(); old.onerror();
  assert.equal(h.controller.getSnapshot().status, 'starting');
  current.onstart();
  assert.equal(h.controller.getSnapshot().character, 'commander');
  old.onresume();
  assert.equal(h.controller.getSnapshot().character, 'commander');
  h.controller.stop();
  current.onstart(); current.onresume();
  assert.equal(h.controller.getSnapshot().status, 'idle');
  assert.equal(h.timers.size, 0);
});

test('unsupported voice and speech failure leave text navigation independent', () => {
  const controller = new NarrationController(null);
  controller.speak('Text remains', 'chief');
  assert.equal(controller.getSnapshot().status, 'unavailable');
  const h = harness();
  h.controller.speak('Text remains', 'chief');
  h.utterances[0].onerror();
  assert.equal(h.controller.getSnapshot().status, 'error');
  assert.equal(h.timers.size, 0);
  h.controller.speak('Try again', 'chief');
  h.utterances[1].onstart();
  assert.equal(h.controller.getSnapshot().status, 'speaking');
});

test('blocked start and missing end events time out, close mouth and cancel audio', () => {
  const h = harness();
  h.controller.speak('Blocked', 'chief');
  [...h.timers.values()][0]();
  assert.equal(h.controller.getSnapshot().status, 'error');
  assert.equal(h.cancellations, 1);
  h.utterances[0].onstart();
  assert.equal(h.controller.getSnapshot().status, 'error');
  h.controller.speak('Never ends', 'commander'); h.utterances[1].onstart();
  [...h.timers.values()][0]();
  assert.equal(h.controller.getSnapshot().status, 'error');
  assert.equal(h.timers.size, 0);
});

test('subscriptions release and throwing speech services fail safely', () => {
  const h = harness(); let notifications = 0;
  const unsubscribe = h.controller.subscribe(() => notifications++);
  h.controller.speak('Hello', 'chief');
  assert.ok(notifications > 0);
  unsubscribe(); const count = notifications;
  h.controller.stop(); assert.equal(notifications, count);
  const controller = new NarrationController({
    synthesis: { speak() { throw new Error('Speech blocked'); }, cancel() {}, getVoices: () => [] },
    createUtterance: text => ({ text }), setTimer: () => 0, clearTimer() {},
  });
  controller.speak('Hello', 'chief');
  assert.equal(controller.getSnapshot().status, 'error');
});

test('recorded Chief and Commander clips use separate natural voices and cancel on navigation', async () => {
  const recordings = [], timers = new Map();
  const controller = new NarrationController({
    synthesis: { speak() { assert.fail('A recorded line should not use browser TTS'); }, cancel() {}, getVoices: () => [] },
    createUtterance: text => ({ text }),
    createRecording: url => { const audio = { url, pauses: 0, play: () => Promise.resolve(), pause() { this.pauses++; } }; recordings.push(audio); return audio; },
    setTimer: cb => { const id = timers.size + 1; timers.set(id,cb); return id; }, clearTimer: id => timers.delete(id),
  });
  controller.speak('Charlie, good to see you.','chief','appointment-01');
  const oldStart=recordings[0].onplaying; oldStart(); assert.equal(controller.getSnapshot().character,'chief');
  controller.speak('Thank you, Chief.','commander','appointment-02');
  assert.ok(recordings[0].pauses>0); oldStart(); assert.equal(controller.getSnapshot().status,'starting');
  recordings[1].onplaying(); assert.equal(controller.getSnapshot().character,'commander');
  const ended=recordings[1].onended; ended(); assert.equal(controller.getSnapshot().status,'idle');
  assert.equal(timers.size,0);
  const {readFileSync}=await import('node:fs');
  const credits=JSON.parse(readFileSync(new URL('../public/story/audio/credits.json',import.meta.url)));
  assert.equal(credits.voices.chief,'en-US-GuyNeural'); assert.equal(credits.voices.commander,'en-GB-SoniaNeural');
  for(const clip of credits.lines) assert.ok(readFileSync(new URL(`../public/story/audio/${clip.id}.mp3`,import.meta.url)).length>1000);
});

test('voice selection prefers natural voices and does not reuse a female default for Chief', async () => {
  const {selectCharacterVoice}=await import('../src/game/story/narration.ts');
  const voices=[{name:'Samantha',default:true},{name:'Daniel',default:false},{name:'Microsoft Sonia Online (Natural)',default:false}];
  assert.equal(selectCharacterVoice(voices,'chief').name,'Daniel');
  assert.equal(selectCharacterVoice(voices,'commander').name,'Microsoft Sonia Online (Natural)');
});
