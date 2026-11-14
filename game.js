/* ==========================================================================
   "Purgatory" — FNAF 1 web engine: Night 6 (AI 15) + 6 AM–9 AM boss fight
   Original engine code. All art and sound are loaded from the user's own asset
   files at runtime (folder or .pak packs). Nothing copyrighted is embedded here.
   ========================================================================== */
'use strict';

// ---------------------------------------------------------------- config
const CONFIG = {
  // the first folder that exists is used (only when there are no .pak files)
  ASSET_ROOTS: ['assets/FiveNightAtFreddyBearASSets/', 'FiveNightAtFreddyBearASSets/', 'assets/FNAF ASSETS REORGANIZED BY ENTEREST/', 'assets/'],
  ASSET_ROOT: 'assets/FiveNightAtFreddyBearASSets/',
  NIGHT: 6,
  AI: { freddy: 15, bonnie: 15, chica: 15, foxy: 15 },
  BOSS_AI: 30,                  // Freddy + Golden Freddy during the boss fight
  HOUR_SECONDS: 89,             // ~8:54 for 12–6 AM, like the PC original
  BOSS_END_HOUR: 9,             // survive until 9 AM
  LIVES: 3,                     // mandatory lives
};
// Office layout (office art is 1600x720, the view is 1280x720)
const LAYOUT = {
  leftDoor: [72, -1], rightDoor: [1270, -2],
  leftBtn: [6, 263], rightBtn: [1497, 273],
  fan: [780, 303],
  nose: [674, 236, 12],         // Freddy poster nose (honk easter egg)
  gfOffice: [530, 210],
  flip: [255, 648, 600, 60],
  map: [848, 313],
  camName: [836, 282],
  rec: [68, 52],
  panBar: [490, 30, 300],       // FNAF-Plus style slider: x, y, width
  resetBtn: [40, 90, 290, 44],  // boss fight: "RESETEO DE CÁMARA"
};

const W = 1280, H = 720;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');

function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', fit); fit();

// ---------------------------------------------------------------- helpers
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const roll20 = ai => ai >= randi(1, 20);
const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const store = {
  get(k, d) { try { const v = localStorage.getItem('fnaf6web_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fnaf6web_' + k, JSON.stringify(v)); } catch (e) {} },
};
const encPath = (root, p) => (root + p).split('/').map(encodeURIComponent).join('/');
const enc = p => encPath(CONFIG.ASSET_ROOT, p);
// When the .pak files made by empaquetador.html are present, assets come from them (blob URLs)
let PACK = null;
const assetURL = p => (PACK && PACK[p]) || enc(p);

// asset manifest + sound list live in assets.js

// ---------------------------------------------------------------- sound (with stereo panning)
let AC = null;
function initAudio() {
  try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
}
addEventListener('pointerdown', initAudio); addEventListener('keydown', initAudio);
const SND = {};
const Sound = {
  get(k) {
    if (!SND[k]) { const a = new Audio(); a.preload = 'auto'; a.src = assetURL('9-AUDIO/' + SND_FILES[k]); SND[k] = a; }
    return SND[k];
  },
  play(k, vol = 1, loop = false) {
    const a = Sound.get(k); try { a.loop = loop; a.volume = clamp(vol, 0, 1); a.currentTime = 0; const p = a.play(); if (p) p.catch(() => {}); } catch (e) {}
    return a;
  },
  // overlapping one-shot; pan: -1 = left ear, +1 = right ear; rate < 1 = deeper
  once(k, vol = 1, pan = 0, rate = 1) {
    try {
      const a = Sound.get(k).cloneNode(); a.volume = clamp(vol, 0, 1);
      if (rate !== 1) { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; a.playbackRate = rate; }
      if (pan && AC && AC.createStereoPanner && location.protocol !== 'file:') {
        try { const src = AC.createMediaElementSource(a), p = AC.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); src.connect(p).connect(AC.destination); } catch (e) {}
      }
      const p = a.play(); if (p) p.catch(() => {}); return a;
    } catch (e) { return null; }
  },
  loop(k, vol = 1) { const a = Sound.get(k); a.loop = true; a.volume = clamp(vol, 0, 1); if (a.paused) { const p = a.play(); if (p) p.catch(() => {}); } return a; },
  vol(k, v) { if (SND[k]) SND[k].volume = clamp(v, 0, 1); },
  stop(k) { const a = SND[k]; if (a) { a.pause(); try { a.currentTime = 0; } catch (e) {} } },
  stopAll() { Object.keys(SND).forEach(Sound.stop); },
};
const PRELOAD_SOUNDS = ['menu', 'static', 'fan', 'amb', 'camUp', 'camDown', 'blip', 'door', 'light', 'window', 'error', 'scream', 'scream2', 'run', 'knock', 'pound', 'powerdown', 'musicbox', 'chimes', 'laugh1', 'laugh2', 'laugh3', 'giggle', 'call'];

// ---------------------------------------------------------------- loader
let loaded = 0, total = 0, missing = [];
function placeholder(path, w, h) {
  const c = newCanvas(w || 320, h || 180), x = c.getContext('2d');
  x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#555'; x.strokeRect(0.5, 0.5, c.width - 1, c.height - 1);
  x.fillStyle = '#888'; x.font = '14px monospace'; x.fillText('Falta: ' + path.split('/').pop(), 8, 20);
  return c;
}
// Remove the grey (90,90,90) / black backgrounds of text & number images.
// 1) real transparency when the page may read pixels (GitHub Pages, .pak)
// 2) otherwise (e.g. opened with double-click) an additive version: background becomes pure black and is drawn with 'lighter'
function keyImage(img, mode) {
  const w = img.naturalWidth, h = img.naturalHeight;
  try {
    const c = newCanvas(w, h), x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    const kr = mode === 'g' ? 90 : 0, tol = mode === 'g' ? 10 : 24;
    for (let i = 0; i < p.length; i += 4) {
      const dist = Math.abs(p[i] - kr) + Math.abs(p[i + 1] - kr) + Math.abs(p[i + 2] - kr);
      if (dist <= tol) p[i + 3] = 0;
      else if (dist < tol * 4) p[i + 3] = Math.min(p[i + 3], ((dist - tol) / (tol * 3)) * 255);
    }
    x.putImageData(d, 0, 0); return c;
  } catch (e) {
    const a = newCanvas(w, h), ax = a.getContext('2d'); ax.drawImage(img, 0, 0);
    if (mode === 'g') {
      ax.globalCompositeOperation = 'difference'; ax.fillStyle = 'rgb(90,90,90)'; ax.fillRect(0, 0, w, h);
      const b = newCanvas(w, h), bx = b.getContext('2d'); bx.drawImage(a, 0, 0); bx.globalCompositeOperation = 'lighter'; bx.drawImage(a, 0, 0);
      b._add = true; return b;
    }
    a._add = true; return a;
  }
}
function loadAll(onDone) {
  const keys = Object.keys(MANIFEST); total = keys.length + PRELOAD_SOUNDS.length;
  let pending = keys.length;
  const done = () => { loaded++; if (--pending === 0) { buildBetaMap(); onDone(); } };
  keys.forEach(k => {
    const [path, km] = MANIFEST[k]; const im = new Image();
    im.onload = () => { IMG[k] = km ? keyImage(im, km) : im; if (im.decode && !km) im.decode().catch(() => {}); done(); };
    im.onerror = () => { missing.push(path); const big = k.startsWith('cam_') || k.startsWith('office'); IMG[k] = placeholder(path, big ? 1600 : 0, big ? 720 : 0); done(); };
    im.src = assetURL(path);
  });
  PRELOAD_SOUNDS.forEach(k => { const a = Sound.get(k); const f = () => { loaded++; a.removeEventListener('canplaythrough', f); a.removeEventListener('error', f); }; a.addEventListener('canplaythrough', f); a.addEventListener('error', f); a.load(); });
}
// find which asset folder exists
function probeRoot() {
  return new Promise(res => {
    let i = 0;
    const next = () => {
      if (i >= CONFIG.ASSET_ROOTS.length) return res(CONFIG.ASSET_ROOTS[0]);
      const r = CONFIG.ASSET_ROOTS[i++], im = new Image();
      im.onload = () => res(r); im.onerror = next; im.src = encPath(r, '3-THE_OFFICE/FAN/1.png');
    };
    next();
  });
}
// ---- .pak loader: fnaf-assets-1.pak holds a JSON index, data continues across -2, -3 ...
let packBytes = 0, packTotal = 0;
async function fetchPart(i, onChunk) {
  const r = await fetch('fnaf-assets-' + i + '.pak', { cache: 'no-cache' });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' en fnaf-assets-' + i + '.pak');
  if (!r.body || !r.body.getReader) { const b = await r.blob(); onChunk(b.size); return b; }
  const rd = r.body.getReader(), chunks = [];
  for (;;) { const { done, value } = await rd.read(); if (done) break; chunks.push(value); onChunk(value.length); }
  return new Blob(chunks);
}
async function loadPack() {
  let first;
  try { first = await fetchPart(1, n => { packBytes += n; }); } catch (e) { return false; } // no pack: use the asset folder
  const magic = String.fromCharCode(...new Uint8Array(await first.slice(0, 8).arrayBuffer()));
  if (magic !== 'FNAFPAK1') throw new Error('fnaf-assets-1.pak no es válido');
  const hlen = new DataView(await first.slice(0, 12).arrayBuffer()).getUint32(8, true);
  const index = JSON.parse(await first.slice(12, 12 + hlen).text());
  packTotal = index.total;
  const rest = [];
  for (let i = 2; i <= index.parts; i++) rest.push(fetchPart(i, n => { packBytes += n; }));
  const all = new Blob([first, ...await Promise.all(rest)]);
  if (all.size !== index.total) throw new Error('Los .pak están incompletos (' + all.size + ' de ' + index.total + ' bytes). Vuelve a subirlos.');
  PACK = {};
  for (const [path, off, size] of index.files) {
    const type = path.endsWith('.png') ? 'image/png' : path.endsWith('.wav') ? 'audio/wav' : '';
    PACK[path] = URL.createObjectURL(all.slice(off, off + size, type));
  }
  return true;
}
// Beta map: the two cone-map frames are identical except for the green "selected" camera,
// so paste the 1B area of frame A over frame B (no pixel reading needed)
function buildBetaMap() {
  const c = newCanvas(400, 400), x = c.getContext('2d');
  x.drawImage(IMG.betamap_b, 0, 0);
  x.save(); x.beginPath(); x.rect(98, 75, 54, 52); x.clip(); x.clearRect(0, 0, 400, 400); x.drawImage(IMG.betamap_a, 0, 0); x.restore();
  IMG.betamap = c;
}

// ---------------------------------------------------------------- multi-animatronic camera shots
// Each "<room>_<who>" shot is the empty room plus one animatronic. The difference against the empty
// room gives that animatronic's silhouette, so several can be stacked on one image.
const COMBO = {
  '1B': { base: 'cam_1B', who: { bonnie: 'cam_1B_B', chica: 'cam_1B_C', freddy: 'cam_1B_F' }, order: ['bonnie', 'chica', 'freddy'] },
  '7': { base: 'cam_7', who: { chica: 'cam_7_C', freddy: 'cam_7_F' }, order: ['freddy', 'chica'] },
  '4A': { base: 'cam_4A', who: { chica: 'cam_4A_C', freddy: 'cam_4A_F' }, order: ['freddy', 'chica'] },
  '4B': { base: 'cam_4B', who: { chica: 'cam_4B_C', freddy: 'cam_4B_F' }, order: ['freddy', 'chica'] },
};
const SPRITES = {}, COMPOSITES = {};
function ensureMaskFilter() {
  if (document.getElementById('fxmask')) return;
  const d = document.createElement('div'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><filter id="fxmask" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 3 3 0 -0.35"/></filter></svg>';
  document.body.appendChild(d);
}
function makeSprite(ck, bk) {
  if (ck in SPRITES) return SPRITES[ck];
  const a = IMG[ck], b = IMG[bk]; let s = null;
  if (a && b && a.width === b.width && a.height === b.height) {
    const w = a.width, h = a.height;
    try { // pixel version
      const c = newCanvas(w, h), x = c.getContext('2d');
      x.drawImage(b, 0, 0); const pb = x.getImageData(0, 0, w, h).data;
      x.clearRect(0, 0, w, h); x.drawImage(a, 0, 0); const da = x.getImageData(0, 0, w, h), pa = da.data;
      for (let i = 0; i < pa.length; i += 4) {
        const diff = Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]);
        pa[i + 3] = clamp((diff - 30) / 85, 0, 1) * 255;
      }
      x.putImageData(da, 0, 0); s = c;
    } catch (e) { // filter version (works where pixels can't be read)
      try {
        const d = newCanvas(w, h), dx = d.getContext('2d');
        if (typeof dx.filter !== 'string') throw e;
        ensureMaskFilter();
        dx.drawImage(a, 0, 0); dx.globalCompositeOperation = 'difference'; dx.drawImage(b, 0, 0);
        const m = newCanvas(w, h), mx = m.getContext('2d'); mx.filter = 'url(#fxmask)'; mx.drawImage(d, 0, 0); mx.filter = 'none';
        mx.globalCompositeOperation = 'source-in'; mx.drawImage(a, 0, 0); s = m;
      } catch (e2) { s = null; }
    }
  }
  return (SPRITES[ck] = s);
}
function composite(room, present) {
  const key = room + ':' + present.join('+');
  if (key in COMPOSITES) return COMPOSITES[key];
  const C = COMBO[room], c = newCanvas(1600, 720), x = c.getContext('2d');
  x.drawImage(IMG[C.base], 0, 0);
  for (const w of C.order) if (present.includes(w)) { const s = makeSprite(C.who[w], C.base); if (!s) return (COMPOSITES[key] = null); x.drawImage(s, 0, 0); }
  return (COMPOSITES[key] = c);
}

// ---------------------------------------------------------------- input
const input = { x: 640, y: 360, down: false, keys: {}, inFlip: false };
function toGame(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
cv.addEventListener('pointermove', e => { [input.x, input.y] = toGame(e); Scene.cur.move && Scene.cur.move(e); });
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); [input.x, input.y] = toGame(e); input.down = true; input.touch = e.pointerType !== 'mouse'; Scene.cur.click && Scene.cur.click(input.x, input.y, e); });
cv.addEventListener('pointerup', e => { input.down = false; Scene.cur.release && Scene.cur.release(e); });
cv.addEventListener('wheel', e => { Scene.cur.wheel && Scene.cur.wheel(e.deltaY || e.deltaX); e.preventDefault(); }, { passive: false });
addEventListener('keydown', e => { input.keys[e.code] = true; Scene.cur.key && Scene.cur.key(e.code, e); });
addEventListener('keyup', e => { input.keys[e.code] = false; });
const cdHeld = () => input.keys.KeyC && input.keys.KeyD;

// ---------------------------------------------------------------- drawing utils
function drawI(i, x, y, w, h) {
  if (!i) return;
  const add = i._add; if (add) ctx.globalCompositeOperation = 'lighter';
  if (w !== undefined) ctx.drawImage(i, x, y, w, h); else ctx.drawImage(i, x, y);
  if (add) ctx.globalCompositeOperation = 'source-over';
}
function img(k, x, y, w, h) { drawI(IMG[k], x, y, w, h); }
function drawStatic(alpha) { ctx.globalAlpha = alpha; img('static' + randi(0, N_STATIC - 1), 0, 0, W, H); ctx.globalAlpha = 1; }
function digits(prefix, n, x, y, align = 'left', gap = 1, scale = 1) {
  const s = String(n); const ws = [...s].map(c => (IMG[prefix + c] ? IMG[prefix + c].width * scale : 10));
  const tw = ws.reduce((a, b) => a + b + gap, -gap); let cx = align === 'right' ? x - tw : x;
  [...s].forEach((c, i) => { const im = IMG[prefix + c]; if (im) drawI(im, cx, y, im.width * scale, im.height * scale); cx += ws[i] + gap; }); return tw;
}
const FONT = '"Consolas","Lucida Console","Courier New",monospace';
function text(t, x, y, size = 22, color = '#fff', align = 'left', alpha = 1, weight = 'bold') {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillText(t, x, y); ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function fade(a) { if (a <= 0) return; ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
function drawLives(x, y, lives) {
  img('lives_txt', x, y);
  for (let i = 0; i < lives; i++) img('tiny_man', x + 70 + i * 22, y - 8, 18, 31);
}

// ---------------------------------------------------------------- persistent + run state
const SAVE = { stars: store.get('stars', 0), beta: store.get('beta', true), wins: store.get('wins', 0) };
function save() { Object.keys(SAVE).forEach(k => store.set(k, SAVE[k])); }
let RUN = { lives: CONFIG.LIVES, checkpoint: null };
const newRun = () => { RUN = { lives: CONFIG.LIVES, checkpoint: null }; };

// ---------------------------------------------------------------- scenes
const Scene = { cur: null, go(s, ...a) { Scene.cur = s; s.enter && s.enter(...a); } };

// --- boot: loading + click to start (also unlocks audio)
const Boot = {
  enter() {
    this.ready = false; this.error = null; this.packing = true;
    loadPack()
      .then(ok => ok ? null : probeRoot().then(r => { CONFIG.ASSET_ROOT = r; }))
      .then(() => { this.packing = false; loadAll(() => { this.ready = true; }); })
      .catch(e => { this.packing = false; this.error = e.message; });
  },
  update() {},
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    text('Purgatory', 640, 230, 48, '#ddd', 'center', 1, 'normal');
    if (this.error) { text('Error: ' + this.error, 640, 340, 18, '#f66', 'center'); return; }
    if (this.packing) {
      const mb = (packBytes / 1048576).toFixed(1), tot = packTotal ? ' / ' + (packTotal / 1048576).toFixed(1) + ' MB' : ' MB';
      ctx.strokeStyle = '#666'; ctx.strokeRect(390, 340, 500, 18); ctx.fillStyle = '#ccc'; ctx.fillRect(392, 342, 496 * (packTotal ? clamp(packBytes / packTotal, 0, 1) : 0), 14);
      text('Descargando assets... ' + mb + tot, 640, 380, 20, '#999', 'center'); return;
    }
    const p = total ? loaded / total : 0;
    ctx.strokeStyle = '#666'; ctx.strokeRect(390, 340, 500, 18); ctx.fillStyle = '#ccc'; ctx.fillRect(392, 342, 496 * clamp(p, 0, 1), 14);
    text(this.ready ? 'Haz clic o toca para empezar' : `Cargando assets... ${loaded}/${total}`, 640, 380, 20, this.ready ? '#fff' : '#999', 'center', this.ready ? 0.6 + 0.4 * Math.sin(performance.now() / 300) : 1);
    if (this.ready && missing.length) text(`Faltan ${missing.length} archivos (${PACK ? 'vuelve a crear los .pak' : 'revisa assets/FiveNightAtFreddyBearASSets/ o sube los .pak'}). Primero: ${missing[0]}`, 640, 430, 14, '#f66', 'center');
  },
  click() { if (this.ready) Scene.go(Warning); },
  key(c) { if (this.ready && (c === 'Enter' || c === 'Space')) Scene.go(Warning); },
};

// --- warning screen
const Warning = {
  enter() { this.t = 0; },
  update(dt) { this.t += dt; if (this.t > 3.2) Scene.go(Menu); },
  draw() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); const i = IMG.txt_WARNING; if (i) img('txt_WARNING', (W - i.width) / 2, (H - i.height) / 2); fade(this.t < 0.5 ? 1 - this.t * 2 : this.t > 2.7 ? (this.t - 2.7) * 2 : 0); },
  click() { if (this.t > 0.5) Scene.go(Menu); },
};

// --- main menu
const Menu = {
  enter() {
    this.t = 0; this.twitch = 0; this.nextTwitch = rand(0.5, 2); this.frame = 0; this.sel = 0;
    Sound.stopAll(); Sound.loop('menu', 0.8); Sound.play('static', 0.5);
  },
  items() {
    return [
      { label: 'txt_SIXTH_NIGHT', y: 404, act: () => { newRun(); Scene.go(Intro); } },
      { text: () => 'Contenido Beta: ' + (SAVE.beta ? 'ON' : 'OFF'), y: 474, act: () => { SAVE.beta = !SAVE.beta; save(); } },
    ];
  },
  update(dt) {
    this.t += dt; this.twitch -= dt; this.nextTwitch -= dt;
    if (this.nextTwitch <= 0) { this.frame = randi(1, N_TWITCH - 1); this.twitch = rand(0.04, 0.12); this.nextTwitch = rand(0.3, 3); }
    if (this.twitch <= 0) this.frame = 0;
    // debug unlocks from the original game (C + D + 1 / C + D + 2)
    if (cdHeld() && input.keys.Digit1 && SAVE.stars < 1) { SAVE.stars = 1; save(); }
    if (cdHeld() && input.keys.Digit2 && SAVE.stars < 2) { SAVE.stars = 2; save(); }
  },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.6 + 0.4 * Math.random(); img('twitch' + this.frame, 0, 0); ctx.globalAlpha = 1;
    drawStatic(0.12 + Math.random() * 0.2);
    const sy = (this.t * 140) % (H + 100) - 50; ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, sy, W, 40);
    text('Purgatory', 175, 79, 56, '#fff', 'left', 0.92 + 0.08 * Math.random(), 'normal');
    for (let i = 0; i < SAVE.stars; i++) img('txt_STAR', 175 + i * 70, 170);
    this.items().forEach((it, i) => {
      if (it.label) img(it.label, 175, it.y); else text(it.text(), 175, it.y + 4, 30, '#fff', 'left', 1, 'normal');
      if (i === this.sel) img('txt_SET_', 100, it.y + 6);
    });
    img('txt_VERSION', 10, 700);
    const cr = IMG.txt_CREDIT; if (cr) img('txt_CREDIT', W - cr.width - 10, 700);
  },
  hit(x, y) { return this.items().findIndex(it => x > 150 && x < 640 && y > it.y - 6 && y < it.y + 44); },
  move() { const i = this.hit(input.x, input.y); if (i >= 0) this.sel = i; },
  click(x, y) { const i = this.hit(x, y); if (i >= 0) { this.sel = i; Sound.once('blip', 0.6); this.items()[i].act(); } },
  key(c) {
    const n = this.items().length;
    if (c === 'ArrowDown' || c === 'KeyS') this.sel = (this.sel + 1) % n;
    if (c === 'ArrowUp' || c === 'KeyW') this.sel = (this.sel + n - 1) % n;
    if (c === 'Enter' || c === 'Space') this.items()[this.sel].act();
  },
};

// --- night intro ("12:00 AM / 6th Night")
const Intro = {
  enter() { this.t = 0; Sound.stopAll(); Sound.once('blip', 0.8); },
  update(dt) { this.t += dt; if (this.t > 4) Scene.go(Night); },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const a = this.t < 2 ? 1 : clamp(1 - (this.t - 2) / 1, 0, 1);
    ctx.globalAlpha = a;
    if (RUN.checkpoint === 'boss') text('6:00 AM', 640, 300, 48, '#fff', 'center', a, 'normal');
    else { const i = IMG.night6; if (i) img('night6', (W - i.width) / 2, (H - i.height) / 2); }
    drawLives(560, 430, RUN.lives);
    ctx.globalAlpha = 1;
    if (this.t > 3) img('clock_icon', W - 60, H - 60);
    if (this.t < 0.25) drawStatic(0.6);
  },
};

// ================================================================== NIGHT
let G = null;
const AI = CONFIG.AI;
const H6 = () => CONFIG.HOUR_SECONDS * 6, HEND = () => CONFIG.HOUR_SECONDS * CONFIG.BOSS_END_HOUR;

function newNight() {
  return {
    t: 0, power: 99.9, usage: 1, foxyBlocks: 0,
    ox: 160,                                   // office scroll 0..320
    doorL: false, doorR: false, animL: 0, animR: 0, lightL: false, lightR: false,
    brokenL: false, brokenR: false,
    cam: false, monAnim: -1, monDir: 0, cur: '1A', camT: 0, bars: 0, disrupt: 0, variant: 0,
    pan: 0, panAuto: true, panDir: 1, panWait: 0, dragging: false,
    bonnie: { loc: '1A', acc: 0 }, chica: { loc: '1A', acc: 0 },
    freddy: { loc: '1A', acc: 0, count: -1, killAcc: 0 },
    foxy: { stage: 0, acc: 0, lock: 0, watching: false, attackT: 0, running: false, runT: 0, runView: false },
    windowSeenL: false, windowSeenR: false,
    out: null,                                 // power outage state
    gf: { poster: false, inOffice: false, t: 0 }, hallu: null, halluAcc: 0,
    boss: null,                                // 6 AM – 9 AM boss fight
    kitchenAcc: 0, fanF: 0, flick: 0, dead: false, won: false, dbg: false,
  };
}

const Night = {
  enter() {
    G = newNight();
    Sound.stopAll(); this.ambience();
    if (RUN.checkpoint === 'boss') this.startBoss();
  },
  ambience() { Sound.loop('fan', 0.35); Sound.loop('amb', 0.25); Sound.loop('amb2', 0.15); },
  locked() { return G.boss && G.boss.phase === 'intro'; },

  // -------------------------------------------------------------- update
  update(dt) {
    const g = G; if (g.dead || g.won) return;
    g.t += dt;
    if (!g.boss && g.t >= H6()) return this.startBoss();
    if (g.boss && g.t >= HEND()) return this.win();
    // original debug combo C + D + "+": jump to 6 AM (boss) / to 9 AM during the boss
    const plus = cdHeld() && (input.keys.NumpadAdd || input.keys.Equal);
    if (plus && !g.dbg) { g.dbg = true; if (!g.boss) g.t = H6(); else if (g.boss.phase === 'fight') g.t = HEND(); }
    if (!plus) g.dbg = false;

    // office scrolling (mouse near edges, or arrows when monitor is down)
    if (!g.cam || g.out) {
      let v = 0;
      if (!input.touch || input.down) { if (input.x < 380) v = -(380 - input.x) / 380 * 900; else if (input.x > 900) v = (input.x - 900) / 380 * 900; }
      if (input.keys.ArrowLeft) v = -700; if (input.keys.ArrowRight) v = 700;
      if (g.monAnim < 0 || g.out) g.ox = clamp(g.ox + v * dt, 0, 320);
    }
    const ds = dt * 60;
    g.animL = clamp(g.animL + (g.doorL ? ds : -ds), 0, N_DOOR - 1);
    g.animR = clamp(g.animR + (g.doorR ? ds : -ds), 0, N_DOOR - 1);
    g.fanF = (g.fanF + dt * 30) % 3;
    g.flick = Math.random() < 0.08 ? 1 : 0;

    // monitor animation
    if (g.monAnim >= 0) {
      g.monAnim += dt * 44 * g.monDir;
      if (g.monDir > 0 && g.monAnim >= N_MON) { g.monAnim = -1; g.cam = true; g.bars = 0.25; this.onCamUp(); }
      if (g.monDir < 0 && g.monAnim < 0) { g.monAnim = -1; this.onCamDown(); }
    }
    if (g.cam) this.updateCam(dt);

    if (!g.out) {
      g.usage = 1 + (g.doorL ? 1 : 0) + (g.doorR ? 1 : 0) + ((g.lightL || g.lightR) ? 1 : 0) + ((g.cam || g.monDir > 0) ? 1 : 0);
      g.power -= dt * (g.usage / 9.6 + 3 / CONFIG.HOUR_SECONDS);   // + night 5+ passive drain
      if (g.power <= 0) { g.power = 0; this.powerOut(); return; }
      if (g.boss) this.updateBoss(dt); else { this.updateAI(dt); this.updateEggs(dt); }
      this.updateLightsAudio();
    } else this.updateOutage(dt);
  },

  updateCam(dt) {
    const g = G;
    g.camT += dt; g.bars = Math.max(0, g.bars - dt); g.disrupt = Math.max(0, g.disrupt - dt);
    if (g.panAuto && !g.dragging) {
      if (g.panWait > 0) g.panWait -= dt;
      else { g.pan += g.panDir * 75 * dt; if (g.pan >= 320 || g.pan <= 0) { g.pan = clamp(g.pan, 0, 320); g.panDir *= -1; g.panWait = 1.2; } }
    }
    let kv = 0; if (input.keys.ArrowLeft || input.keys.KeyA) kv = -400; if (input.keys.ArrowRight || input.keys.KeyD) kv = 400;
    if (kv) { g.panAuto = false; g.pan = clamp(g.pan + kv * dt, 0, 320); }
  },

  // -------------------------------------------------------------- night AI
  disruptIf(...locs) { if (G.cam && locs.includes(G.cur)) { G.disrupt = rand(1.2, 2.5); Sound.once(pick(['garble1', 'garble2', 'garble3']), 0.5); } },
  knock(pan) { Sound.once('knock', 1, pan); Sound.once('pound', 0.5, pan); },
  laugh(pan = 0, rate = 1) { Sound.once(pick(['laugh1', 'laugh2', 'laugh3']), 0.9, pan, rate); },
  updateAI(dt) {
    const g = G, b = g.bonnie, c = g.chica, f = g.freddy, fx = g.foxy;
    // Bonnie — every 4.97 s
    b.acc += dt; if (b.acc >= 4.97) { b.acc -= 4.97; if (b.loc !== 'IN' && roll20(AI.bonnie)) this.moveBonnie(); }
    // Chica — every 4.98 s
    c.acc += dt; if (c.acc >= 4.98) { c.acc -= 4.98; if (c.loc !== 'IN' && roll20(AI.chica)) this.moveChica(); }
    // Freddy — every 3.02 s
    f.acc += dt;
    if (f.acc >= 3.02) {
      f.acc -= 3.02;
      if (f.loc === '4B') {
        if (roll20(AI.freddy)) {
          // right door shut while he is on CAM 4B: he bangs on it (right side) and walks away
          if (g.doorR) { f.loc = '1B'; f.count = -1; this.knock(0.9); this.disruptIf('4B', '1B'); }
          else if (g.cam && g.cur !== '4B') { f.loc = 'IN'; f.killAcc = 0; }
        }
      } else if (f.loc !== 'IN' && !g.cam && f.count < 0) {
        const blocked = f.loc === '1A' && (b.loc === '1A' || c.loc === '1A');
        if (!blocked && roll20(AI.freddy)) f.count = Math.max(0, (1000 - 100 * AI.freddy) / 60);
      }
    }
    if (f.count >= 0 && !g.cam) {
      f.count -= dt;
      if (f.count < 0) { const path = ['1A', '1B', '7', '6', '4A', '4B']; const i = path.indexOf(f.loc); if (i >= 0 && i < 5) { f.loc = path[i + 1]; this.laugh(); } }
    }
    if (f.loc === 'IN' && !g.cam && g.monAnim < 0) { f.killAcc += dt; if (f.killAcc >= 1) { f.killAcc -= 1; if (Math.random() < 0.25) return this.jumpscare('freddy'); } }

    // Foxy — every 5.01 s. Only staring at Pirate Cove (CAM 1C) holds him back,
    // and he stays frozen 0.83–5 s after you look away from it.
    const watching = g.cam && g.cur === '1C' && g.monAnim < 0;
    if (watching) { fx.watching = true; fx.lock = 1; }
    else { if (fx.watching) { fx.watching = false; fx.lock = rand(0.83, 5); } fx.lock = Math.max(0, fx.lock - dt); }
    fx.acc += dt;
    if (fx.acc >= 5.01) { fx.acc -= 5.01; if (fx.stage < 3 && fx.lock <= 0 && roll20(AI.foxy)) { fx.stage++; if (fx.stage === 3) fx.attackT = 25; } }
    if (fx.stage === 3 && !fx.running) {
      fx.attackT -= dt;
      if (fx.attackT <= 0 || (g.cam && g.cur === '2A' && g.monAnim < 0)) this.foxyRun();
    }
    if (fx.running) {
      fx.runT += dt;
      if (g.cam && g.cur === '2A') fx.runView = true;
      if (fx.runT >= (fx.runView ? N_RUN / 20 + 0.1 : 2.2)) this.foxyArrive();
    }
    // kitchen audio
    g.kitchenAcc += dt;
    const camOn6 = g.cam && g.cur === '6';
    if (c.loc === '6' && g.kitchenAcc > 2.5) { g.kitchenAcc = 0; if (Math.random() < 0.6) Sound.once(pick(['pots1', 'pots2', 'pots3', 'pots4']), camOn6 ? 0.9 : 0.25); }
    if (f.loc === '6') Sound.loop('musicbox', camOn6 ? 0.8 : 0.15); else if (!g.out) Sound.stop('musicbox');
  },
  moveBonnie() {
    const g = G, b = g.bonnie, from = b.loc; let to;
    switch (from) {
      case '1A': to = pick(['1B', '5']); break;
      case '1B': to = pick(['5', '2A']); break;
      case '5': to = pick(['1B', '2A']); break;
      case '2A': to = pick(['3', '2B']); break;
      case '3': to = pick(['2A', 'DOOR']); break;
      case '2B': to = pick(['3', 'DOOR']); break;
      case 'DOOR': if (g.doorL) to = '1B'; else { to = 'IN'; g.brokenL = true; g.lightL = false; Sound.once('breath', 0.4); } break;
      default: return;
    }
    b.loc = to; if (to === 'DOOR') g.windowSeenL = false;
    if (to === 'DOOR' || from === 'DOOR') Sound.once('steps', 0.25, -0.7);
    this.disruptIf(from, to);
  },
  moveChica() {
    const g = G, c = g.chica, from = c.loc; let to;
    switch (from) {
      case '1A': to = '1B'; break;
      case '1B': to = pick(['7', '6']); break;
      case '7': to = pick(['1B', '6']); break;
      case '6': to = pick(['7', '4A']); break;
      case '4A': to = pick(['1B', '4B']); break;
      case '4B': to = pick(['4A', 'DOOR']); break;
      case 'DOOR': if (g.doorR) to = '4A'; else { to = 'IN'; g.brokenR = true; g.lightR = false; Sound.once('breath', 0.4); } break;
      default: return;
    }
    c.loc = to; if (to === 'DOOR') g.windowSeenR = false;
    if (to === 'DOOR' || from === 'DOOR') Sound.once('steps', 0.25, 0.7);
    if (to === '6' && Math.random() < 0.05) Sound.once('circus', 0.3);
    this.disruptIf(from, to);
  },
  foxyRun() { const fx = G.foxy; fx.running = true; fx.runT = 0; fx.runView = G.cam && G.cur === '2A'; Sound.once('run', 0.9, -0.6); },
  foxyArrive() {
    const g = G, fx = g.foxy; fx.running = false;
    if (g.doorL) {
      this.knock(-0.9);
      g.power = Math.max(0, g.power - (1 + 5 * g.foxyBlocks)); g.foxyBlocks++;
      fx.stage = randi(0, 1); fx.lock = 0;
    } else this.jumpscare('foxy');
  },
  updateLightsAudio() {
    const g = G, on = g.lightL || g.lightR;
    if (on) Sound.loop('light', 0.5); else Sound.stop('light');
    if (g.lightL && g.bonnie.loc === 'DOOR' && !g.windowSeenL) { g.windowSeenL = true; Sound.once('window', 0.9, -0.5); }
    if (g.lightR && g.chica.loc === 'DOOR' && !g.windowSeenR) { g.windowSeenR = true; Sound.once('window', 0.9, 0.5); }
  },
  updateEggs(dt) {
    const g = G;
    // Golden Freddy in the office after the 2B poster has been seen
    if (g.gf.inOffice && !g.cam && g.monAnim < 0) { g.gf.t += dt; if (g.gf.t > 5) return this.goldenJumpscare(); }
    // rare hallucinations ("IT'S ME" flashes)
    if (g.hallu) { g.hallu.t -= dt; if (g.hallu.t <= 0) g.hallu = null; }
    g.halluAcc += dt;
    if (g.halluAcc >= 1) { g.halluAcc = 0; if (!g.cam && Math.random() < 1 / 400) { g.hallu = { k: 'hallu' + randi(0, 4), t: rand(0.08, 0.25) }; Sound.once('whisper', 0.5); } }
  },

  // -------------------------------------------------------------- 6 AM boss fight
  startBoss() {
    const g = G;
    g.t = Math.max(g.t, H6()); RUN.checkpoint = 'boss';
    g.out = null; g.power = 99.9;                                   // the generator kicks back in
    g.doorL = g.doorR = g.lightL = g.lightR = false; g.brokenL = g.brokenR = false;
    g.cam = false; g.monAnim = -1; g.monDir = 0; g.disrupt = 0;
    g.bonnie.loc = 'GONE'; g.chica.loc = 'GONE';
    g.foxy = { stage: 0, acc: 0, lock: 0, watching: false, attackT: 0, running: false, runT: 0, runView: false };
    g.freddy.loc = '1B'; g.gf = { poster: false, inOffice: false, t: 0 }; g.hallu = null;
    g.boss = {
      phase: 'intro', t: 0, step: 0, gfShow: false, reset: 0,
      fr: { state: 'rest', side: null, t: 0, rest: 3, travel: 5, first: true },
      gf: { present: false, t: 0, cd: 12 },
    };
    Sound.stopAll(); this.ambience(); Sound.play('call', 0.95);
  },
  updateBoss(dt) {
    const g = G, b = g.boss, fr = b.fr, gf = b.gf, ai = CONFIG.BOSS_AI;
    b.t += dt;
    if (b.phase === 'intro') {
      if (b.step === 0 && b.t > 2.2) { b.step = 1; b.gfShow = true; Sound.once('giggle', 0.9); Sound.once('whisper', 0.5); }
      if (b.step === 1 && b.t > 5) { b.step = 2; b.gfShow = false; g.cur = '1B'; g.pan = 160; g.monDir = 1; g.monAnim = 0; Sound.once('camUp', 0.6); }
      if (b.step === 2 && g.cam && b.t > 5.8) { b.step = 3; this.laugh(0, 0.62); }        // deep laugh variant
      if (b.step === 3 && b.t > 9) { b.phase = 'fight'; fr.t = 0; fr.rest = rand(2, 4); }
      return;
    }
    // camera reset: 5 s of static, then Golden Freddy leaves
    if (b.reset > 0) {
      if (!g.cam) { b.reset = 0; Sound.stop('static2'); }
      else { b.reset -= dt; if (b.reset <= 0) { b.reset = 0; Sound.stop('static2'); if (gf.present) { gf.present = false; gf.t = 0; gf.cd = rand(25, 40); } } }
    }
    // Freddy (level 30): rests on the stage staring at the camera, then attacks one door
    fr.t += dt;
    const speed = 20 / Math.max(1, ai);   // level 30 → 2/3 of the level-20 timings
    if (fr.state === 'rest') {
      if (!gf.present && fr.t >= fr.rest) {
        fr.state = 'attack'; fr.t = 0; fr.side = pick(['L', 'R']); fr.travel = rand(6, 8) * speed + 1.5; fr.first = false;
        const from = g.freddy.loc;
        g.freddy.loc = fr.side === 'R' ? '4A' : 'LEFT';
        this.laugh(fr.side === 'L' ? -1 : 1);
        this.disruptIf(from, g.freddy.loc);
      }
    } else {
      if (fr.side === 'R' && g.freddy.loc === '4A' && fr.t > fr.travel / 2) { g.freddy.loc = '4B'; this.disruptIf('4A', '4B'); }
      if (fr.t >= fr.travel) {
        const shut = fr.side === 'L' ? g.doorL : g.doorR;
        if (!shut) return this.jumpscare('freddy');
        this.knock(fr.side === 'L' ? -0.9 : 0.9);
        const from = g.freddy.loc;
        fr.state = 'rest'; fr.t = 0; fr.rest = rand(5, 10) * speed + 1; g.freddy.loc = '1A';
        this.disruptIf(from, '1A');
      }
    }
    // Golden Freddy (level 30): pops up in the office; cannot appear while Freddy is attacking
    if (!gf.present) {
      if (fr.state === 'rest') gf.cd -= dt;
      if (gf.cd <= 0 && fr.state === 'rest' && !g.cam && g.monAnim < 0 && Math.random() < dt * 0.35 * ai / 20) {
        gf.present = true; gf.t = 0; Sound.once('giggle', 0.9); Sound.once('whisper', 0.4);
      }
    } else if (!g.cam && g.monAnim < 0) {
      gf.t += dt; if (gf.t > 4) return this.jumpscare('golden');
    }
  },
  cameraReset() {
    const b = G.boss; if (!b || b.phase !== 'fight' || b.reset > 0 || !G.cam) return;
    b.reset = 5; Sound.play('static2', 0.6, true);
  },

  // -------------------------------------------------------------- monitor
  toggleMonitor() {
    const g = G; if (g.out || g.dead || g.monAnim >= 0 || this.locked()) return;
    if (!g.cam) { g.monDir = 1; g.monAnim = 0; Sound.once('camUp', 0.6); }
    else { g.cam = false; g.monDir = -1; g.monAnim = N_MON - 1; Sound.once('camDown', 0.6); Sound.stop('camHum'); }
  },
  onCamUp() { Sound.loop('camHum', 0.15); this.rollVariant(); if (G.gf.inOffice) { G.gf.inOffice = false; G.gf.t = 0; } },
  onCamDown() {
    const g = G; g.monDir = 0;
    if (g.gf.poster) { g.gf.poster = false; g.gf.inOffice = true; g.gf.t = 0; Sound.once('giggle', 0.6); }
    // Bonnie / Chica inside the office attack when the monitor comes down
    if (g.bonnie.loc === 'IN') return this.jumpscare('bonnie');
    if (g.chica.loc === 'IN') return this.jumpscare('chica');
  },
  switchCam(id) {
    const g = G; if (!g.cam || id === g.cur || this.locked() || (g.boss && g.boss.reset > 0)) return;
    g.cur = id; g.camT = 0; g.bars = 0.25; Sound.once('blip', 0.7); this.rollVariant();
    if (id === '1C' && g.foxy.stage < 3 && Math.random() < 1 / 30) Sound.once('pirate', 0.4);
  },
  rollVariant() {
    const g = G; g.variant = randi(1, 100);
    if (!g.boss && g.cur === '2B' && g.bonnie.loc !== '2B' && Math.random() < 1 / 80) g.gf.poster = true;
  },
  // returns an image key, or a canvas (several animatronics in one room)
  camImage(id) {
    const g = G, b = g.bonnie.loc, c = g.chica.loc, f = g.freddy.loc, v = g.variant;
    if (COMBO[id]) {
      const present = [b === id && 'bonnie', c === id && 'chica', f === id && 'freddy'].filter(Boolean);
      if (present.length > 1) { const comp = composite(id, present); if (comp) return comp; }
    }
    switch (id) {
      case '1A': {
        const B = b === '1A', C = c === '1A', F = f === '1A';
        if (g.boss) return F ? 'cam_1A_Flook' : 'cam_1A_empty';              // boss: Freddy alone, staring
        if (B && C && F) return SAVE.beta && v <= 2 ? 'cam_1A_stare' : 'cam_1A';   // unused "all staring" shot
        if (C && F) return 'cam_1A_noB';
        if (B && F) return 'cam_1A_noC';
        if (F) return v <= 3 ? 'cam_1A_Flook' : 'cam_1A_F';
        return 'cam_1A_empty';
      }
      case '1B': if (c === '1B') return v % 2 ? 'cam_1B_C' : 'cam_1B_C2'; if (b === '1B') return v <= 3 ? 'cam_1B_B2' : 'cam_1B_B'; if (f === '1B') return 'cam_1B_F'; return 'cam_1B';
      case '1C': { const s = g.foxy.stage; if (s === 0) return v === 1 ? 'cam_1C_itsme' : 'cam_1C_0'; return 'cam_1C_' + Math.min(s, 3); }
      case '2A': if (b === '2A') return 'cam_2A_B'; return v <= 3 ? 'cam_2A_alt' : 'cam_2A';
      case '2B': if (b === '2B') return ['cam_2B_B', 'cam_2B_B2', 'cam_2B_B3'][v % 3]; if (g.gf.poster) return 'cam_2B_gf'; return v <= 2 ? 'cam_2B_glitch' : 'cam_2B';
      case '3': return b === '3' ? 'cam_3_B' : 'cam_3';
      case '4A': if (c === '4A') return v % 2 ? 'cam_4A_C' : 'cam_4A_C2'; if (f === '4A') return 'cam_4A_F'; if (v <= 2) return 'cam_4A_kids'; if (v <= 4) return 'cam_4A_itsme'; return 'cam_4A';
      case '4B': if (c === '4B') return ['cam_4B_C', 'cam_4B_C2', 'cam_4B_C3'][v % 3]; if (f === '4B') return 'cam_4B_F'; if (v <= 4) return 'cam_4B_news' + v; return 'cam_4B';
      case '5': if (b === '5') return v <= 3 ? 'cam_5_B2' : 'cam_5_B'; return v <= 3 ? 'cam_5_look' : 'cam_5';
      case '7': if (c === '7') return v % 2 ? 'cam_7_C' : 'cam_7_C2'; if (f === '7') return 'cam_7_F'; return 'cam_7';
    }
    return null;
  },

  // -------------------------------------------------------------- doors & lights
  door(side) {
    const g = G; if (g.out) return Sound.once('error', 0.6);
    if (side === 'L') { if (g.brokenL) return Sound.once('error', 0.6); g.doorL = !g.doorL; }
    else { if (g.brokenR) return Sound.once('error', 0.6); g.doorR = !g.doorR; }
    Sound.once('door', 0.7, side === 'L' ? -0.6 : 0.6);
  },
  light(side) {
    const g = G; if (g.out) return Sound.once('error', 0.6);
    if (side === 'L') { if (g.brokenL) return Sound.once('error', 0.6); g.lightL = !g.lightL; if (g.lightL) g.lightR = false; }
    else { if (g.brokenR) return Sound.once('error', 0.6); g.lightR = !g.lightR; if (g.lightR) g.lightL = false; }
  },

  // -------------------------------------------------------------- outage / end states
  powerOut() {
    const g = G;
    g.out = { phase: 0, t: 0, acc: 0, elapsed: 0 };
    if (g.cam) { g.cam = false; g.monDir = -1; g.monAnim = N_MON - 1; }
    g.doorL = g.doorR = g.lightL = g.lightR = false;
    ['fan', 'amb', 'amb2', 'light', 'camHum', 'musicbox', 'static2'].forEach(Sound.stop);
    if (g.boss) { g.boss.reset = 0; g.boss.gf.present = false; }
    Sound.once('powerdown', 1);
  },
  updateOutage(dt) {
    const o = G.out; o.acc += dt; o.elapsed += dt;
    if (o.phase === 0) { // waiting for Freddy at the left door
      if (o.acc >= 5) { o.acc = 0; if (Math.random() < 0.2 || o.elapsed >= 20) { o.phase = 1; o.elapsed = 0; Sound.play('musicbox', 0.9, true); Sound.once('steps', 0.6, -0.7); } }
    } else if (o.phase === 1) { // Toreador march, face flashing
      if (o.acc >= 5) { o.acc = 0; if (Math.random() < 0.2 || o.elapsed >= 20) { o.phase = 2; o.elapsed = 0; Sound.stop('musicbox'); } }
    } else if (o.phase === 2) { // pitch black
      if (o.acc >= 2) { o.acc = 0; if (Math.random() < 0.2) this.jumpscare('freddyDark'); }
    }
  },
  jumpscare(who) {
    const g = G; if (g.dead || g.won) return;
    g.dead = true; g.cam = false; g.monAnim = -1;
    Sound.stopAll(); Scene.go(Jumpscare, who);
  },
  goldenJumpscare() { G.dead = true; Sound.stopAll(); Scene.go(GoldenCrash); },
  win() { G.won = true; Sound.stopAll(); Scene.go(NineAM); },

  // -------------------------------------------------------------- draw
  draw() {
    const g = G;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (g.cam) this.drawCam(); else this.drawOffice();
    if (g.monAnim >= 0) img('mon' + clamp(Math.floor(g.monAnim), 0, N_MON - 1), 0, 0);
    if (!g.out) this.drawHUD();
    if (!g.out && !g.dead && !this.locked()) { const [fx, fy] = LAYOUT.flip; img('flip', fx, fy); }
  },
  drawOffice() {
    const g = G, ox = -g.ox;
    if (g.out) {
      const o = g.out;
      if (o.phase === 2) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
      img(o.phase === 1 && Math.random() < 0.5 ? 'pout_freddy' : 'pout_dark', ox, 0); this.drawDoors(ox); return;
    }
    let bg = 'office';
    if (g.lightL && !g.flick) bg = g.bonnie.loc === 'DOOR' ? 'office_LB' : 'office_L';
    if (g.lightR && !g.flick) bg = g.chica.loc === 'DOOR' ? 'office_RC' : 'office_R';
    img(bg, ox, 0);
    img('fan' + Math.floor(g.fanF), LAYOUT.fan[0] + ox, LAYOUT.fan[1]);
    this.drawDoors(ox);
    const bl = (g.doorL ? 1 : 0) + (g.lightL ? 2 : 0), br = (g.doorR ? 1 : 0) + (g.lightR ? 2 : 0);
    img('btnL' + bl, LAYOUT.leftBtn[0] + ox, LAYOUT.leftBtn[1]);
    img('btnR' + br, LAYOUT.rightBtn[0] + ox, LAYOUT.rightBtn[1]);
    const golden = g.gf.inOffice || (g.boss && (g.boss.gfShow || g.boss.gf.present));
    if (golden) { img('gf_office', LAYOUT.gfOffice[0] + ox, LAYOUT.gfOffice[1]); if (Math.random() < 0.1) img('hallu' + randi(3, 4), 0, 0); }
    if (g.hallu) img(g.hallu.k, 0, 0);
  },
  drawDoors(ox) {
    img('doorL' + Math.round(G.animL), LAYOUT.leftDoor[0] + ox, LAYOUT.leftDoor[1]);
    img('doorR' + Math.round(G.animR), LAYOUT.rightDoor[0] + ox, LAYOUT.rightDoor[1]);
  },
  drawCam() {
    const g = G, id = g.cur, resetting = g.boss && g.boss.reset > 0;
    if (resetting) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); drawStatic(0.75 + Math.random() * 0.25);
    } else if (id === '6') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); drawStatic(0.35 + Math.random() * 0.15);
      img('cam_disabled', 400, 200);
    } else if (g.disrupt > 0) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); drawStatic(0.5 + Math.random() * 0.3);
    } else {
      let k = this.camImage(id);
      if (id === '2A' && g.foxy.running && g.foxy.runView) k = 'run' + clamp(Math.floor(g.foxy.runT * 20), 0, N_RUN - 1);
      if (typeof k === 'string') img(k, -g.pan, 0); else if (k) ctx.drawImage(k, -g.pan, 0);
      drawStatic(0.05 + Math.random() * 0.07);
    }
    if (g.bars > 0) { ctx.globalCompositeOperation = 'lighter'; img('bars' + clamp(Math.floor((0.25 - g.bars) / 0.25 * N_BARS), 0, N_BARS - 1), 0, 0); ctx.globalCompositeOperation = 'source-over'; }
    // UI frame
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);
    if (Math.floor(performance.now() / 600) % 2) img('rec', LAYOUT.rec[0], LAYOUT.rec[1]);
    img('name_' + id, LAYOUT.camName[0], LAYOUT.camName[1]);
    this.drawMap();
    this.drawPanBar();
    if (g.boss && g.boss.phase === 'fight') this.drawResetBtn();
  },
  drawResetBtn() {
    const b = G.boss, [x, y, w, h] = LAYOUT.resetBtn, on = b.reset > 0;
    ctx.fillStyle = on ? 'rgba(160,0,0,0.75)' : 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    text(on ? 'RESETEANDO... ' + Math.ceil(b.reset) + 's' : 'RESETEO DE CÁMARA', x + w / 2, y + 11, 20, '#fff', 'center');
  },
  drawMap() {
    const [mx, my] = LAYOUT.map, g = G, beta = SAVE.beta;
    img(beta ? 'betamap' : 'map', mx, my);
    const blink = Math.floor(performance.now() / 350) % 2;
    CAM_IDS.forEach(id => {
      const [cx, cy] = (beta ? BETA_POS : CAM_POS)[id];
      const sel = id === g.cur;
      if (beta) {
        if (sel) { ctx.fillStyle = blink ? '#6dff1a' : '#3c9a10'; ctx.beginPath(); ctx.arc(mx + cx, my + cy, 9, 0, 7); ctx.fill(); }
        const l = IMG['lbl_' + id], off = { '2B': [10, 2], '4B': [10, 2], '2A': [-34, -24], '4A': [10, -24] }[id] || [8, -26];
        if (l) img('lbl_' + id, mx + cx + off[0], my + cy + off[1], l.width * 0.85, l.height * 0.85);
      } else {
        img(sel && blink ? 'btn_on' : 'btn_off', mx + cx - 27, my + cy - 18, 54, 36);
        img('lbl_' + id, mx + cx - 15, my + cy - 12);
      }
    });
  },
  // FNAF-Plus style rotation bar: drag the circle to look around the room
  drawPanBar() {
    const g = G, [bx, by, bw] = LAYOUT.panBar, kx = bx + (g.pan / 320) * bw;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx - 18, by - 16, bw + 36, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx, by - 3, bw, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 0.5, by - 3.5, bw + 1, 7);
    ctx.fillStyle = g.dragging ? '#fff' : '#ddd'; ctx.beginPath(); ctx.arc(kx, by, 12, 0, 7); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(kx, by, 12, 0, 7); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.fillRect(kx - 1, by - 6, 2, 12);
    text('◄', bx - 15, by - 9, 14, '#ccc'); text('►', bx + bw + 4, by - 9, 14, '#ccc');
    text(g.panAuto ? 'AUTO' : 'MANUAL', bx + bw + 30, by - 9, 16, g.panAuto ? '#9f9' : '#ff9');
  },
  drawHUD() {
    const g = G, hour = Math.floor(g.t / CONFIG.HOUR_SECONDS), h = hour === 0 ? 12 : hour;
    digits('dB', h, 1188, 24, 'right', 2); img('hud_am', 1196, 40);
    img('hud_night', 1150, 80); digits('dS', CONFIG.NIGHT, 1220, 80);
    img('hud_power', 38, 631); const pw = digits('dM', Math.max(0, Math.floor(g.power)), 182, 622, 'left', 1); img('hud_pct', 186 + pw, 631);
    img('hud_usage', 38, 667); img('usage' + (clamp(g.usage, 1, 5) - 1), 120, 657);
    ctx.globalAlpha = 0.85; drawLives(1040, 680, RUN.lives); ctx.globalAlpha = 1;
  },

  // -------------------------------------------------------------- input
  inFlip(x, y) { const [fx, fy, fw, fh] = LAYOUT.flip; return x >= fx && x <= fx + fw && y >= fy - 10 && y <= fy + fh; },
  move(e) {
    const g = G; if (!g) return;
    const inside = this.inFlip(input.x, input.y);
    if (e.pointerType === 'mouse' && inside && !input.inFlip) this.toggleMonitor();
    input.inFlip = inside;
    if (g.dragging) this.dragPan(input.x);
  },
  dragPan(x) { const [bx, , bw] = LAYOUT.panBar; G.pan = clamp((x - bx) / bw, 0, 1) * 320; G.panAuto = false; },
  click(x, y, e) {
    const g = G; if (!g || g.dead || g.won || this.locked()) return;
    if (e.pointerType !== 'mouse' && this.inFlip(x, y)) return this.toggleMonitor();
    if (g.cam) {
      const [bx, by, bw] = LAYOUT.panBar;
      if (y > by - 20 && y < by + 20 && x > bx - 20 && x < bx + bw + 20) { g.dragging = true; this.dragPan(x); return; }
      if (y > by - 20 && y < by + 20 && x > bx + bw + 25 && x < bx + bw + 110) { g.panAuto = !g.panAuto; return; }
      const [rx0, ry0, rw, rh] = LAYOUT.resetBtn;
      if (g.boss && x >= rx0 && x <= rx0 + rw && y >= ry0 && y <= ry0 + rh) return this.cameraReset();
      const [mx, my] = LAYOUT.map, P = SAVE.beta ? BETA_POS : CAM_POS;
      let best = null, bd = 1e9;
      CAM_IDS.forEach(id => { const dx = x - (mx + P[id][0]), dy = y - (my + P[id][1]); const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = id; } });
      if (best && bd < (SAVE.beta ? 22 * 22 : 30 * 30)) this.switchCam(best);
      return;
    }
    if (g.monAnim >= 0) return;
    const ox = g.ox, rx = x + ox;
    const hitBtn = ([bx, by], side) => {
      if (rx < bx || rx > bx + 92 || y < by || y > by + 247) return false;
      if (y < by + 123) this.door(side); else this.light(side); return true;
    };
    if (hitBtn(LAYOUT.leftBtn, 'L') || hitBtn(LAYOUT.rightBtn, 'R')) return;
    const [nx, ny, nr] = LAYOUT.nose; if ((rx - nx) ** 2 + (y - ny) ** 2 < nr * nr && !g.out) Sound.once('honk', 0.8);
  },
  release() { if (G) G.dragging = false; },
  wheel(d) { if (G && G.cam) { G.panAuto = false; G.pan = clamp(G.pan + d * 0.5, 0, 320); } },
  key(c) {
    const g = G; if (!g || g.dead || g.won || this.locked()) return;
    if (c === 'Space' || c === 'KeyS') return this.toggleMonitor();
    if (g.cam) {
      const map = { Digit1: '1A', Digit2: '1B', Digit3: '1C', Digit4: '2A', Digit5: '2B', Digit6: '3', Digit7: '4A', Digit8: '4B', Digit9: '5', Digit0: '6', Minus: '7' };
      if (map[c]) this.switchCam(map[c]);
      if (c === 'KeyR') g.panAuto = !g.panAuto;
      if (c === 'KeyX') this.cameraReset();
      return;
    }
    if (c === 'KeyQ') this.door('L'); if (c === 'KeyA') this.light('L');
    if (c === 'KeyE') this.door('R'); if (c === 'KeyD') this.light('R');
  },
};

// --- jumpscare
const Jumpscare = {
  enter(who) {
    this.who = who; this.t = 0;
    this.n = who === 'golden' ? 1 : N_JS[who];
    this.scream = Sound.play(who === 'golden' ? 'scream2' : 'scream', 1);
    this.cut = !SAVE.beta; // the original cuts the 5 s scream to ~1 s; beta restores the full sound
  },
  update(dt) {
    this.t += dt;
    if (this.cut && this.t > 1.05 && this.scream) { this.scream.pause(); this.scream = null; }
    if (this.t > 1.25) Scene.go(Dead);
  },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.who === 'golden') { img('gf_js', 0, 0); return; }
    const f = Math.floor(this.t * 30), n = this.n;
    const idx = f < n ? f : n - 1 - ((f - n) % Math.min(4, n));
    const ox = this.who === 'freddyDark' ? 0 : -(G ? G.ox : 160);
    img('js_' + this.who + clamp(idx, 0, n - 1), ox, 0);
  },
};

// --- golden freddy easter egg (night): jumpscare then "crash" back to the menu
const GoldenCrash = {
  enter() { this.t = 0; Sound.play('scream2', 1); },
  update(dt) { this.t += dt; if (this.t > 3) { Sound.stopAll(); newRun(); Scene.go(Menu); } },
  draw() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); if (this.t < 1.2) img('gf_js', 0, 0); },
};

// --- death: static, game over, lives
const Dead = {
  enter() {
    this.t = 0; Sound.play('static', 0.8);
    RUN.lives = Math.max(0, RUN.lives - 1);
    this.outOfLives = RUN.lives === 0;
  },
  next() { Sound.stopAll(); if (this.outOfLives) { newRun(); Scene.go(Menu); } else Scene.go(Intro); },
  update(dt) { this.t += dt; if (this.t > 9) this.next(); },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.t < 2.5) { drawStatic(0.9); return; }
    Sound.stop('static');
    img('gameover_bg', 0, 0); drawStatic(0.12);
    const go = IMG.gameover_txt; if (go) img('gameover_txt', W - go.width - 40, H - 60);
    if (this.outOfLives) { text('SIN VIDAS', 60, 60, 40, '#f44'); text('Vuelves al menú. La próxima partida empieza a las 12 AM con 3 vidas.', 60, 110, 16, '#ddd'); }
    else {
      drawLives(60, 70, RUN.lives);
      text(RUN.checkpoint === 'boss' ? 'Reintentando desde las 6 AM...' : 'Reintentando la Noche 6...', 60, 110, 16, '#ddd');
    }
  },
  click() { if (this.t > 3) this.next(); },
};

// --- 9 AM (end of the boss fight)
const NineAM = {
  enter() { this.t = 0; Sound.play('chimes', 1); this.kids = false; },
  update(dt) {
    this.t += dt;
    if (!this.kids && this.t > 3.5) { this.kids = true; Sound.play('kids', 0.9); }
    if (this.t > 10) { SAVE.stars = 3; SAVE.wins++; save(); newRun(); Scene.go(Paycheck); }
  },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const p = clamp((this.t - 1) / 2, 0, 1), cx = 540, cy = 324, sc = 72 / 42;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - 10, cy - 4, 80, 80); ctx.clip();
    digits('dB', 8, cx, cy - p * 76, 'left', 0, sc); digits('dB', 9, cx, cy + 76 - p * 76, 'left', 0, sc); ctx.restore();
    img('amAM', cx + 70, cy);
    fade(this.t < 0.5 ? 1 - this.t * 2 : this.t > 9 ? this.t - 9 : 0);
  },
};

// --- paycheck
const Paycheck = {
  enter() { this.t = 0; },
  update(dt) { this.t += dt; if (this.t > 9) Scene.go(Menu); },
  draw() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); img('end_n6', 0, 0); fade(this.t < 1 ? 1 - this.t : this.t > 8 ? this.t - 8 : 0); },
  click() { if (this.t > 2) Scene.go(Menu); },
};

// ---------------------------------------------------------------- main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const s = Scene.cur;
  if (s.update) s.update(dt);
  if (Scene.cur.draw) Scene.cur.draw();
  requestAnimationFrame(frame);
}
Scene.go(Boot);
requestAnimationFrame(frame);

// expose for debugging / automated tests
window.__fnaf = { Scene, Night, Menu, get G() { return G; }, get RUN() { return RUN; }, SAVE, IMG, missing: () => missing };
