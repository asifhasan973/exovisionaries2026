import { loadRigAssets, sampleRigMotion, drawCharacterRig, drawCharacterPortrait } from './rig.mjs';

const status = document.querySelector('#status');
const root = document.querySelector('#studio');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const assets = new Map();
const actors = new Map([...document.querySelectorAll('.actor')].map(actor => [actor.dataset.character,
  { actor, context: actor.querySelector('canvas').getContext('2d') }]));
let characterId = 'commander';
let expression = 'encouraging';
let pose = 'explain';
let speaking = true;
let frame = 'auto';
let raf = 0;
let cueIndex = -1;
let clockStart = performance.now();
let uniqueCues = [];

const title = value => value[0].toUpperCase() + value.slice(1);
function pressed(group, key, value) {
  group.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key] === value)));
}

function render(now = performance.now()) {
  for (const [id, { actor, context }] of actors) {
    const active = id === characterId;
    const cue = active ? { character: id, expression, pose } : {
      character: id, expression: id === 'chief' ? 'encouraging' : 'thoughtful', pose: 'listen',
    };
    const motion = sampleRigMotion(now - clockStart + (id === 'chief' ? 370 : 0), active && speaking, reducedMotion.matches);
    if (frame !== 'auto') Object.assign(motion, {
      mouth: active && ['ah', 'oo'].includes(frame) ? frame : 'closed', blink: active && frame === 'blink', gesture: 0, nod: 0, breath: 0,
    });
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    drawCharacterRig(context, assets.get(id), cue, motion);
    actor.classList.toggle('active', active);
  }
}

function animate(now) {
  raf = 0;
  render(now);
  if (!document.hidden && !reducedMotion.matches && frame === 'auto') raf = requestAnimationFrame(animate);
}

function refresh() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  render();
  if (!document.hidden && !reducedMotion.matches && frame === 'auto') raf = requestAnimationFrame(animate);
  const label = frame === 'auto' ? (speaking ? 'Talking preview' : 'Listening preview') : `${title(frame)} frame`;
  document.querySelector('#performance-label').textContent = label;
  document.querySelector('#performance-dot').style.background = frame === 'auto' && speaking ? '#83e0c4' : '#ffdd63';
  document.querySelector('#talk-control').textContent = speaking ? 'Ⅱ Pause talking' : '▷ Start talking';
  document.querySelector('#talk-control').setAttribute('aria-pressed', String(speaking));
  pressed(document.querySelector('#character-controls'), 'character', characterId);
  pressed(document.querySelector('#frame-controls'), 'frame', frame);
}

function rebuildOptions() {
  const character = assets.get(characterId).character;
  for (const [selector, options, selected, onSelect] of [
    ['#expression-controls', character.expressions, expression, value => { expression = value; }],
    ['#pose-controls', character.poses, pose, value => { pose = value; }],
  ]) {
    const group = document.querySelector(selector); group.replaceChildren();
    for (const value of Object.keys(options)) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = title(value);
      button.setAttribute('aria-pressed', String(value === selected));
      button.addEventListener('click', () => { onSelect(value); cueIndex = -1; document.querySelector('#cue-index').textContent = 'Custom'; rebuildOptions(); refresh(); });
      group.append(button);
    }
  }
}

function contactSheets() {
  const container = document.querySelector('#contact-sheets');
  if (container.children.length) return;
  for (const [id, art] of assets) {
    const sheet = document.createElement('section'); sheet.className = 'contact-sheet'; sheet.dataset.character = id;
    const heading = document.createElement('h2'); heading.textContent = art.character.displayName; sheet.append(heading);
    for (const name of Object.keys(art.character.expressions)) {
      const row = document.createElement('div'); row.className = 'contact-row'; row.dataset.expression = name;
      const label = document.createElement('h3'); label.textContent = name; row.append(label);
      for (const type of ['closed', 'ah', 'oo', 'blink']) {
        const figure = document.createElement('figure'); figure.className = 'contact-frame';
        const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300;
        const caption = document.createElement('figcaption'); caption.textContent = title(type);
        drawCharacterPortrait(canvas.getContext('2d'), art, name, { mouth: type === 'blink' ? 'closed' : type, blink: type === 'blink' });
        figure.append(canvas, caption); row.append(figure);
      }
      sheet.append(row);
    }
    container.append(sheet);
  }
}

try {
  await Promise.all(['chief', 'commander'].map(async id => assets.set(id, await loadRigAssets(id))));
  uniqueCues = [...new Map(assets.get('chief').manifest.cueBindings.map(cue => [`${cue.character}/${cue.expression}/${cue.pose}`, cue])).values()];
  document.querySelector('#cue-index').textContent = 'Custom';
  document.querySelector('#character-controls').addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    characterId = button.dataset.character;
    const art = assets.get(characterId).character;
    if (!art.expressions[expression]) expression = characterId === 'chief' ? 'welcoming' : 'encouraging';
    if (!art.poses[pose]) pose = 'listen';
    cueIndex = -1; document.querySelector('#cue-index').textContent = 'Custom'; rebuildOptions(); refresh();
  });
  document.querySelector('#talk-control').addEventListener('click', () => { speaking = !speaking; frame = 'auto'; refresh(); });
  document.querySelector('#frame-controls').addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    frame = button.dataset.frame; refresh();
  });
  document.querySelector('#next-cue').addEventListener('click', () => {
    cueIndex = (cueIndex + 1) % uniqueCues.length;
    const cue = uniqueCues[cueIndex]; characterId = cue.character; expression = cue.expression; pose = cue.pose;
    speaking = cue.role === 'speaker'; frame = 'auto';
    document.querySelector('#cue-index').textContent = `${cueIndex + 1} / ${uniqueCues.length}`;
    rebuildOptions(); refresh();
  });
  document.querySelector('#contact-panel').addEventListener('toggle', event => { if (event.target.open) contactSheets(); });
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener('change', refresh);
  window.addEventListener('pagehide', () => { if (raf) cancelAnimationFrame(raf); }, { once: true });
  // Exposed only in this isolated art lab for reproducible asset QA, never in the game.
  window.characterLab = { assets, drawCharacterRig, drawCharacterPortrait, sampleRigMotion, contactSheets, uniqueCues };
  status.textContent = ''; root.hidden = false; rebuildOptions(); refresh();
} catch (error) {
  status.textContent = `The character assets could not load. ${error.message}`;
  console.error(error);
}
