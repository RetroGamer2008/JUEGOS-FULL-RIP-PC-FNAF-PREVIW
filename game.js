/* ==========================================================================
   FNAF 1 web engine — Night 6 only, AI 15/15/15/15, beta content, FNAF+ cam bar
   Original engine code. All art and sound are loaded from the user's own asset
   folder at runtime (see README). Nothing copyrighted is embedded here.
   ========================================================================== */
'use strict';

// ---------------------------------------------------------------- config
const CONFIG = {
  ASSET_ROOT: 'assets/FNAF ASSETS REORGANIZED BY ENTEREST/',
  NIGHT: 6,
  AI: { freddy: 15, bonnie: 15, chica: 15, foxy: 15 },
  HOUR_SECONDS: 89,             // ~8:54 per night, like the PC original
  LIVES: 5,                     // beta "lives" mechanic (cut from v1.0)
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
const store = {
  get(k, d) { try { const v = localStorage.getItem('fnaf6web_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fnaf6web_' + k, JSON.stringify(v)); } catch (e) {} },
};
const enc = p => (CONFIG.ASSET_ROOT + p).split('/').map(encodeURIComponent).join('/');

// ---------------------------------------------------------------- asset manifest
// key: [path, keyMode]  keyMode: 'g' = remove grey(90) background, 'b' = remove black background
const IMG = {};
const MANIFEST = {};
function add(key, path, km) { MANIFEST[key] = [path, km || null]; }
function seq(prefix, dir, names, km) { names.forEach((n, i) => add(prefix + i, dir + n + '.png', km)); return names.length; }
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

// menu / text
['BUTTON01', 'BUTTON02', 'SIXTH_NIGHT', 'GAME_TITLE', 'STAR', 'WARNING', 'SET_', 'VERSION', 'CREDIT'].forEach(n => add('txt_' + n, '1-MAIN_TEXT/' + n + '.png', 'g'));
const N_TWITCH = seq('twitch', '2-MENU_TWITCHING/', range(1, 4));
add('end_n5', '2.5-START_TO_END/1.png'); add('end_n6', '2.5-START_TO_END/2.png');
const N_STATIC = seq('static', '0-STATIC/', range(1, 8));
// office
add('office', '3-THE_OFFICE/1-OFFICE.png');
add('office_L', '3-THE_OFFICE/LEFT_LIGHT.png'); add('office_R', '3-THE_OFFICE/RIGHT_LIGHT.png');
add('office_LB', '3-THE_OFFICE/1-OFFICE_BONNIE.png'); add('office_RC', '3-THE_OFFICE/1-OFFICE_CHICA.png');
add('pout_dark', '3-THE_OFFICE/LIGHTS_OUT/304.png'); add('pout_freddy', '3-THE_OFFICE/LIGHTS_OUT/305.png'); add('pout_black', '3-THE_OFFICE/LIGHTS_OUT/326.png');
const N_DOOR = seq('doorL', '3-THE_OFFICE/DOORS/LEFT/', range(1, 14));
seq('doorR', '3-THE_OFFICE/DOORS/RIGHT/', range(1, 14));
['1-STOPPED', '2-DOOR', '3-LIGHT', '4-BOTH'].forEach((n, i) => { add('btnL' + i, '3-THE_OFFICE/DOORS/BUTTONS/LEFT/' + n + '.png'); add('btnR' + i, '3-THE_OFFICE/DOORS/BUTTONS/RIGHT/' + n + '.png'); });
seq('fan', '3-THE_OFFICE/FAN/', range(1, 3));
// HUD
add('hud_power', '3-THE_OFFICE/OTHER/POWER_LEFT.png', 'g'); add('hud_usage', '3-THE_OFFICE/OTHER/USAGE.png', 'g');
add('hud_pct', '3-THE_OFFICE/OTHER/PERCENT.png', 'g'); add('hud_am', '3-THE_OFFICE/OTHER/AM.png', 'g');
add('hud_night', '3-THE_OFFICE/OTHER/447.png', 'g');
seq('usage', '3-THE_OFFICE/OTHER/USAGE_BAR/', range(1, 5), 'b');
seq('dS', '3-THE_OFFICE/OTHER/NUMBERS/', range(0, 9), 'g');      // small digits (Night n)
seq('dB', '5-NUMBERS/NUMBER02/', range(0, 9), 'b');             // clock digits
seq('dM', '5-NUMBERS/NUMBER03/', range(0, 9), 'b');             // power digits
add('am5', '3-THE_OFFICE/OTHER/REACH_6AM/1.png', 'g'); add('am6', '3-THE_OFFICE/OTHER/REACH_6AM/2.png', 'g'); add('amAM', '3-THE_OFFICE/OTHER/REACH_6AM/3.png', 'g');
add('gameover_bg', '3-THE_OFFICE/OTHER/GAME_OVER_.png'); add('gameover_txt', '3-THE_OFFICE/OTHER/GAME_OVER.png', 'g');
// night loading
add('night6', '7-NIGHT_LOADING/6.png', 'g'); add('clock_icon', '7-NIGHT_LOADING/LITTLE_CLOCK.png', 'g');
add('lives_txt', '7-NIGHT_LOADING/LIVES.png', 'g'); add('tiny_man', '7-NIGHT_LOADING/WHAT_THE_HELL_IS_THIS.png', 'g');
// jumpscares
const N_JS = {
  freddy: seq('js_freddy', '3-THE_OFFICE/JUMPSCARES/1-FREDDY/', range(1, 29)),
  bonnie: seq('js_bonnie', '3-THE_OFFICE/JUMPSCARES/2-BONNIE/', range(1, 11)),
  chica: seq('js_chica', '3-THE_OFFICE/JUMPSCARES/3-CHICA/', range(1, 16)),
  foxy: seq('js_foxy', '3-THE_OFFICE/FOXY/', range(1, 21)),
  freddyDark: seq('js_freddyDark', '3-THE_OFFICE/JUMPSCARES/1-FREDDY_LIGHTS_OUT/', range(1, 20)),
};
// cameras
const CAMDIR = '6-CAMERAS/';
[
  ['1A', '1-STAGE'], ['1A_noB', '1-STAGE_BONNIE'], ['1A_noC', '1-STAGE_CHICA'], ['1A_F', '1-STAGE_BONNIE_CHICA'], ['1A_Flook', '1-STAGE_FREDDY_LOOKING'],
  ['1A_empty', '1-STAGE_ALL'], ['1A_stare', '1-STAGE_LOOKING'],
  ['1B', '2-DINING_AREA'], ['1B_B', '2-DINING_AREA_BONNIE'], ['1B_B2', '2-DINING_AREA_BONNIE_2.0'], ['1B_C', '2-DINING_AREA_CHICA'], ['1B_C2', '2-DINING_AREA_CHICA2'], ['1B_F', '2-DINING_AREA_FREDDY'],
  ['1C_0', '3-PIRATE_COVE'], ['1C_1', '3-PIRATE_COVE_FOXY'], ['1C_2', '3-PIRATE_COVE_FOXY2'], ['1C_3', '3-PIRATE_COVE_FOXY3'], ['1C_itsme', "3-PIRATE_COVE_IT'S_ME"],
  ['7', '4-RESTROOMS'], ['7_C', '4-RESTROOMS_CHICA'], ['7_C2', '4-RESTROOMS_CHICA2'], ['7_F', '4-RESTROOMS_FREDDY'],
  ['5', '5-BACKSTAGE'], ['5_B', '5-BACKSTAGE_BONNIE'], ['5_B2', '5-BACKSTAGE_BONNIE_2.0'], ['5_look', '5-BACKSTAGE_LOOKING'],
  ['2A', '6-WEST_HALL_CORNER'], ['2A_alt', '6-WEST_HALL_CORNER_2'], ['2A_B', '6-WEST_HALL_CORNER_BONNIE'],
  ['4A', '7-EAST_HALL_CORNER'], ['4A_C', '7-EAST_HALL_CORNER_CHICA'], ['4A_C2', '7-EAST_HALL_CORNER_CHICA2'], ['4A_kids', '7-EAST_HALL_CORNER_CHILDREN'], ['4A_F', '7-EAST_HALL_CORNER_FREDDY'], ['4A_itsme', "7-EAST_HALL_CORNER_IT'S_ME"],
  ['3', '8-SUPPLY_ROOM'], ['3_B', '8-SUPPLY_ROOM_BONNIE'],
  ['2B', '9-WEST_HALL'], ['2B_B', '9-WEST_HALL_BONNIE'], ['2B_B2', '9-WEST_HALL_BONNIE2'], ['2B_B3', '9-WEST_HALL_BONNIE3'], ['2B_gf', '9-WEST_HALL_GOLDEN_FREDDY'], ['2B_glitch', '9-WEST_HALL_POSTER_GLITCH'],
  ['4B', '10-EAST_HALL'], ['4B_C', '10-EAST_HALL_CHICA'], ['4B_C2', '10-EAST_HALL_CHICA2'], ['4B_C3', '10-EAST_HALL_CHICA3'], ['4B_F', '10-EAST_HALL_FREDDY'],
  ['4B_news1', '10-EAST_HALL_NEWS'], ['4B_news2', '10-EAST_HALL_NEWS2'], ['4B_news3', '10-EAST_HALL_NEWS3'], ['4B_news4', '10-EAST_HALL_NEWS4'],
].forEach(([k, f]) => add('cam_' + k, CAMDIR + f + '.png'));
add('map', CAMDIR + '1-MAP.png'); add('flip', CAMDIR + '0-FLIP.png'); add('rec', CAMDIR + '0-REC.png');
add('btn_off', CAMDIR + 'CAM_BUTTONS/CAM_PRESSED1 (animation or stopped).png');
add('btn_on', CAMDIR + 'CAM_BUTTONS/CAM_PRESSED2 (switch animation sequence).png');
const CAM_IDS = ['1A', '1B', '1C', '2A', '2B', '3', '4A', '4B', '5', '6', '7'];
const CAM_BTN_FILE = { '1A': '1-CAM 1A', '1B': '1-CAM 1B', '1C': '1-CAM 1C', '2A': '2-CAM 2A', '2B': '2-CAM 2B', '3': '3-CAM 3', '4A': '4-CAM 4A', '4B': '4-CAM 4B', '5': '5-CAM 5', '6': '6-CAM 6', '7': '7-CAM 7' };
const CAM_TEXT_FILE = { '1A': '1-SHOW_STAGE', '1B': '2-DINING_AREA', '1C': '3-PIRATE_COVE', '5': '4-BACKSTAGE', '4B': '5-EAST_HALL_CORNER', '2B': '5-WEST_HALL_CORNER', '4A': '6-EAST_HALL', '2A': '6-WEST_HALL', '3': '7-SUPPLY_CLOSET', '7': '8-RESTROOMS', '6': '9-KITCHEN' };
CAM_IDS.forEach(id => { add('lbl_' + id, CAMDIR + 'CAM_BUTTONS/' + CAM_BTN_FILE[id] + '.png', 'g'); add('name_' + id, CAMDIR + 'CAM_TEXT/' + CAM_TEXT_FILE[id] + '.png', 'g'); });
add('cam_disabled', CAMDIR + 'CAM_TEXT/10-DISABLED.png', 'g');
const N_MON = seq('mon', CAMDIR + 'MONITOR_ANIMATION/', range(1, 11));
const N_BARS = seq('bars', CAMDIR + 'WHITE_BARS/', range(1, 7));
const N_RUN = seq('run', CAMDIR + 'FOXY_RUNNING/', ['1_AA', '1_AB'].concat(range(2, 30)));
// easter eggs / hallucinations
add('gf_office', '8-EASTER_EGGS/GOLDEN_FREDDY.png'); add('gf_js', '8-EASTER_EGGS/GOLDEN_FREDDY_JUMPSCARE.png');
['BONNIE (1)', 'BONNIE (2)', 'FREDDY', "IT'S ME (1)", "IT'S ME (2)"].forEach((n, i) => add('hallu' + i, '8-EASTER_EGGS/' + n + '.png'));
// beta / unused: monitor map with camera cones (two frames used to rebuild a clean map)
add('betamap_a', 'OTHER_THINGS/155.png'); add('betamap_b', 'OTHER_THINGS/157.png');

// camera button centres on the 400x400 map (final map / beta cone map)
const CAM_POS = { '1A': [160, 58], '1B': [140, 118], '1C': [42, 186], '5': [30, 112], '7': [325, 150], '6': [306, 264], '3': [70, 282], '2A': [126, 275], '2B': [126, 331], '4A': [230, 275], '4B': [230, 331] };
const BETA_POS = { '1A': [135, 52], '1B': [114, 87], '1C': [106, 210], '5': [38, 87], '7': [325, 107], '6': [336, 242], '3': [85, 307], '2A': [138, 307], '2B': [138, 324], '4A': [220, 307], '4B': [220, 324] };

// ---------------------------------------------------------------- sounds
const SND_FILES = {
  menu: 'darkness music.wav', static: 'static.wav', static2: 'static2.wav',
  fan: 'Buzz_Fan_Florescent2.wav', amb: 'EerieAmbienceLargeSca_MV005.wav', amb2: 'ambience2.wav',
  camUp: 'CAMERA_VIDEO_LOA_60105303.wav', camDown: 'put down.wav', blip: 'blip3.wav', camHum: 'MiniDV_Tape_Eject_1.wav',
  door: 'SFXBible_12478.wav', light: 'BallastHumMedium2.wav', window: 'windowscare.wav', error: 'error.wav',
  laugh1: 'Laugh_Giggle_Girl_1d.wav', laugh2: 'Laugh_Giggle_Girl_2d.wav', laugh3: 'Laugh_Giggle_Girl_8d.wav', giggle: 'Laugh_Giggle_Girl_1.wav',
  honk: 'PartyFavorraspyPart_AC01__3.wav',
  pots1: 'OVEN-DRAWE_GEN-HDF18122.wav', pots2: 'OVEN-DRA_1_GEN-HDF18119.wav', pots3: 'OVEN-DRA_2_GEN-HDF18120.wav', pots4: 'OVEN-DRA_7_GEN-HDF18121.wav',
  musicbox: 'music box.wav', circus: 'circus.wav',
  run: 'run.wav', knock: 'knock2.wav', pound: 'DOOR_POUNDING_ME_D0291401.wav', pirate: 'pirate song2.wav',
  garble1: 'garble1.wav', garble2: 'garble2.wav', garble3: 'garble3.wav', robot: 'robotvoice.wav',
  steps: 'deep steps.wav', breath: 'Vocals_Breaths_S_35972006.wav', whisper: 'whispering2.wav',
  powerdown: 'powerdown.wav', scream: 'XSCREAM.wav', scream2: 'XSCREAM2.wav',
  chimes: 'chimes 2.wav', kids: 'CROWD_SMALL_CHIL_EC049202.wav',
};
const SND = {};
const Sound = {
  get(k) {
    if (!SND[k]) { const a = new Audio(); a.preload = 'auto'; a.src = enc('9-AUDIO/' + SND_FILES[k]); SND[k] = a; }
    return SND[k];
  },
  play(k, vol = 1, loop = false) {
    const a = Sound.get(k); try { a.loop = loop; a.volume = clamp(vol, 0, 1); a.currentTime = 0; const p = a.play(); if (p) p.catch(() => {}); } catch (e) {}
    return a;
  },
  once(k, vol = 1) { // overlapping one-shot
    try { const a = Sound.get(k).cloneNode(); a.volume = clamp(vol, 0, 1); const p = a.play(); if (p) p.catch(() => {}); return a; } catch (e) { return null; }
  },
  loop(k, vol = 1) { const a = Sound.get(k); a.loop = true; a.volume = clamp(vol, 0, 1); if (a.paused) { const p = a.play(); if (p) p.catch(() => {}); } return a; },
  vol(k, v) { if (SND[k]) SND[k].volume = clamp(v, 0, 1); },
  stop(k) { const a = SND[k]; if (a) { a.pause(); try { a.currentTime = 0; } catch (e) {} } },
  stopAll() { Object.keys(SND).forEach(Sound.stop); },
};
const PRELOAD_SOUNDS = ['menu', 'static', 'fan', 'amb', 'camUp', 'camDown', 'blip', 'door', 'light', 'window', 'error', 'scream', 'run', 'knock', 'powerdown', 'musicbox', 'chimes', 'laugh1', 'laugh2', 'laugh3'];

// ---------------------------------------------------------------- loader
let loaded = 0, total = 0, missing = [];
function placeholder(path, w, h) {
  const c = document.createElement('canvas'); c.width = w || 320; c.height = h || 180;
  const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#555'; x.strokeRect(0.5, 0.5, c.width - 1, c.height - 1);
  x.fillStyle = '#888'; x.font = '14px monospace'; x.fillText('Falta: ' + path.split('/').pop(), 8, 20);
  return c;
}
function keyImage(img, mode) {
  try {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    const kr = mode === 'g' ? 90 : 0, tol = mode === 'g' ? 10 : 24;
    for (let i = 0; i < p.length; i += 4) {
      const dist = Math.abs(p[i] - kr) + Math.abs(p[i + 1] - kr) + Math.abs(p[i + 2] - kr);
      if (dist <= tol) p[i + 3] = 0;
      else if (dist < tol * 4) p[i + 3] = Math.min(p[i + 3], ((dist - tol) / (tol * 3)) * 255);
    }
    x.putImageData(d, 0, 0); return c;
  } catch (e) { return img; } // file:// pages can't read pixels; fall back to raw image
}
function loadAll(onDone) {
  const keys = Object.keys(MANIFEST); total = keys.length + PRELOAD_SOUNDS.length;
  let pending = keys.length;
  const done = () => { loaded++; if (--pending === 0) { buildBetaMap(); onDone(); } };
  keys.forEach(k => {
    const [path, km] = MANIFEST[k]; const img = new Image();
    img.onload = () => { IMG[k] = km ? keyImage(img, km) : img; if (img.decode && !km) img.decode().catch(() => {}); done(); };
    img.onerror = () => { missing.push(path); IMG[k] = placeholder(path, k.startsWith('cam_') || k.startsWith('office') ? 1600 : 0, k.startsWith('cam_') || k.startsWith('office') ? 720 : 0); done(); };
    img.src = enc(path);
  });
  PRELOAD_SOUNDS.forEach(k => { const a = Sound.get(k); const f = () => { loaded++; a.removeEventListener('canplaythrough', f); }; a.addEventListener('canplaythrough', f); a.addEventListener('error', f); a.load(); });
}
// Beta map: merge two cone-map frames, dropping the green "selected" highlight from each
function buildBetaMap() {
  const a = IMG.betamap_a, b = IMG.betamap_b;
  const c = document.createElement('canvas'); c.width = 400; c.height = 400; const x = c.getContext('2d');
  try {
    x.drawImage(a, 0, 0); const da = x.getImageData(0, 0, 400, 400);
    x.clearRect(0, 0, 400, 400); x.drawImage(b, 0, 0); const db = x.getImageData(0, 0, 400, 400);
    const green = (p, i) => p[i + 3] > 0 && p[i + 1] > p[i] + 30 && p[i + 1] > p[i + 2] + 30;
    for (let i = 0; i < da.data.length; i += 4) if (green(da.data, i)) for (let j = 0; j < 4; j++) da.data[i + j] = green(db.data, i) ? 0 : db.data[i + j];
    x.putImageData(da, 0, 0);
  } catch (e) { x.clearRect(0, 0, 400, 400); x.drawImage(a, 0, 0); }
  IMG.betamap = c;
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
function img(k, x, y, w, h) { const i = IMG[k]; if (!i) return; if (w !== undefined) ctx.drawImage(i, x, y, w, h); else ctx.drawImage(i, x, y); }
function drawStatic(alpha) { ctx.globalAlpha = alpha; img('static' + randi(0, N_STATIC - 1), 0, 0, W, H); ctx.globalAlpha = 1; }
function digits(prefix, n, x, y, align = 'left', gap = 1) {
  const s = String(n); const ws = [...s].map(c => (IMG[prefix + c] ? IMG[prefix + c].width : 10));
  const tw = ws.reduce((a, b) => a + b + gap, -gap); let cx = align === 'right' ? x - tw : x;
  [...s].forEach((c, i) => { img(prefix + c, cx, y); cx += ws[i] + gap; }); return tw;
}
function text(t, x, y, size = 22, color = '#fff', align = 'left', alpha = 1) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.font = `bold ${size}px "Consolas","Courier New",monospace`; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillText(t, x, y); ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function fade(a) { if (a <= 0) return; ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
function drawLives(x, y, lives) {
  img('lives_txt', x, y);
  for (let i = 0; i < lives; i++) img('tiny_man', x + 70 + i * 22, y - 8, 18, 31);
}

// ---------------------------------------------------------------- persistent state
const SAVE = { stars: store.get('stars', 0), beta: store.get('beta', true), lives: store.get('lives', CONFIG.LIVES), wins: store.get('wins', 0) };
function save() { Object.keys(SAVE).forEach(k => store.set(k, SAVE[k])); }

// ---------------------------------------------------------------- scenes
const Scene = { cur: null, go(s, ...a) { Scene.cur = s; s.enter && s.enter(...a); } };

// --- boot: loading + click to start (also unlocks audio)
const Boot = {
  enter() { this.ready = false; loadAll(() => { this.ready = true; }); },
  update() {},
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const p = total ? loaded / total : 0;
    text('Five Nights at Freddy\'s — Noche 6 (versión web)', 640, 250, 26, '#ddd', 'center');
    ctx.strokeStyle = '#666'; ctx.strokeRect(390, 340, 500, 18); ctx.fillStyle = '#ccc'; ctx.fillRect(392, 342, 496 * clamp(p, 0, 1), 14);
    text(this.ready ? 'Haz clic o toca para empezar' : `Cargando assets... ${loaded}/${total}`, 640, 380, 20, this.ready ? '#fff' : '#999', 'center', this.ready ? 0.6 + 0.4 * Math.sin(performance.now() / 300) : 1);
    if (this.ready && missing.length) text(`Faltan ${missing.length} archivos (revisa la carpeta assets/). Primero: ${missing[0]}`, 640, 430, 14, '#f66', 'center');
    if (location.protocol === 'file:') text('Abierto como archivo local: algunos fondos grises no se quitarán. En GitHub Pages se ve bien.', 640, 680, 13, '#777', 'center');
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
    this.t = 0; this.twitch = 0; this.nextTwitch = rand(0.5, 2); this.frame = 0; this.sel = 0; this.cd = 0;
    Sound.stopAll(); Sound.loop('menu', 0.8); Sound.play('static', 0.5);
  },
  items() {
    return [
      { label: 'txt_SIXTH_NIGHT', y: 544, act: () => Scene.go(Intro) },
      { text: () => 'Contenido Beta: ' + (SAVE.beta ? 'ON' : 'OFF'), y: 610, act: () => { SAVE.beta = !SAVE.beta; save(); } },
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
    img('txt_GAME_TITLE', 175, 79);
    for (let i = 0; i < SAVE.stars; i++) img('txt_STAR', 175 + i * 70, 300);
    // New Game / Continue are locked: only Night 6 is playable in this build
    ctx.globalAlpha = 0.18; img('txt_BUTTON01', 175, 404); img('txt_BUTTON02', 175, 474); ctx.globalAlpha = 1;
    text('(solo Noche 6)', 400, 412, 14, '#777');
    this.items().forEach((it, i) => {
      if (it.label) img(it.label, 175, it.y); else text(it.text(), 175, it.y + 4, 24, '#fff');
      if (i === this.sel) img('txt_SET_', 100, it.y + 6);
    });
    if (SAVE.beta) drawLives(175, 580 + 60, SAVE.lives);
    text('IA: Freddy 15 · Bonnie 15 · Chica 15 · Foxy 15', 175, 690, 14, '#888');
    img('txt_VERSION', 10, 700);
    const cr = IMG.txt_CREDIT; if (cr) img('txt_CREDIT', W - cr.width - 10, 700);
  },
  hit(x, y) { return this.items().findIndex(it => x > 150 && x < 560 && y > it.y - 6 && y < it.y + 44); },
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
    ctx.globalAlpha = a; const i = IMG.night6; if (i) img('night6', (W - i.width) / 2, (H - i.height) / 2);
    if (SAVE.beta) drawLives(560, 430, SAVE.lives);
    ctx.globalAlpha = 1;
    if (this.t > 3) img('clock_icon', W - 60, H - 60);
    if (this.t < 0.25) drawStatic(0.6);
  },
};

// ================================================================== NIGHT
let G = null;
const AI = CONFIG.AI;

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
    foxy: { stage: 0, acc: 0, lock: 0, attackT: 0, running: false, runT: 0, runView: false },
    windowSeenL: false, windowSeenR: false,
    out: null,                                 // power outage state
    gf: { poster: false, inOffice: false, t: 0 }, hallu: null, halluAcc: 0,
    kitchenAcc: 0, fanF: 0, flick: 0, dead: false, won: false,
  };
}

const Night = {
  enter() {
    G = newNight();
    Sound.stopAll(); Sound.loop('fan', 0.35); Sound.loop('amb', 0.25); Sound.loop('amb2', 0.15);
  },

  // -------------------------------------------------------------- update
  update(dt) {
    const g = G; if (g.dead || g.won) return;
    g.t += dt;
    if (g.t >= CONFIG.HOUR_SECONDS * 6) return this.win();
    if (cdHeld() && (input.keys.NumpadAdd || input.keys.Equal)) return this.win(); // original debug: C + D + "+"

    // office scrolling (mouse near edges, or arrows when monitor is down)
    if (!g.cam || g.out) {
      let v = 0;
      if (!input.touch || input.down) { if (input.x < 380) v = -(380 - input.x) / 380 * 900; else if (input.x > 900) v = (input.x - 900) / 380 * 900; }
      if (input.keys.ArrowLeft) v = -700; if (input.keys.ArrowRight) v = 700;
      if (g.monAnim < 0 || g.out) g.ox = clamp(g.ox + v * dt, 0, 320);
    }
    // doors
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
      // power
      g.usage = 1 + (g.doorL ? 1 : 0) + (g.doorR ? 1 : 0) + ((g.lightL || g.lightR) ? 1 : 0) + ((g.cam || g.monDir > 0) ? 1 : 0);
      g.power -= dt * (g.usage / 9.6 + 3 / CONFIG.HOUR_SECONDS);   // + night 5+ passive drain
      if (g.power <= 0) { g.power = 0; this.powerOut(); }
      this.updateAI(dt);
      this.updateLightsAudio();
      this.updateEggs(dt);
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

  // -------------------------------------------------------------- AI
  disruptIf(...locs) { if (G.cam && locs.includes(G.cur)) { G.disrupt = rand(1.2, 2.5); Sound.once(pick(['garble1', 'garble2', 'garble3']), 0.5); } },
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
          if (g.doorR) { f.loc = '4A'; this.laugh(); this.disruptIf('4B', '4A'); }
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

    // Foxy — every 5.01 s; locked while the monitor is up and for 0.83–16.67 s after lowering it
    if (!g.cam && g.monDir <= 0) fx.lock = Math.max(0, fx.lock - dt);
    fx.acc += dt;
    if (fx.acc >= 5.01) { fx.acc -= 5.01; if (fx.stage < 3 && !g.cam && fx.lock <= 0 && roll20(AI.foxy)) { fx.stage++; if (fx.stage === 3) fx.attackT = 25; } }
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
    if (to === 'DOOR' || from === 'DOOR') Sound.once('steps', 0.25);
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
    if (to === 'DOOR' || from === 'DOOR') Sound.once('steps', 0.25);
    if (to === '6' && Math.random() < 0.05) Sound.once('circus', 0.3);
    this.disruptIf(from, to);
  },
  laugh() { Sound.once(pick(['laugh1', 'laugh2', 'laugh3']), 0.8); },
  foxyRun() { const fx = G.foxy; fx.running = true; fx.runT = 0; fx.runView = G.cam && G.cur === '2A'; Sound.once('run', 0.9); },
  foxyArrive() {
    const g = G, fx = g.foxy; fx.running = false;
    if (g.doorL) {
      Sound.once('knock', 1); Sound.once('pound', 0.5);
      g.power = Math.max(0, g.power - (1 + 5 * g.foxyBlocks)); g.foxyBlocks++;
      fx.stage = randi(0, 1); fx.lock = 0;
    } else this.jumpscare('foxy');
  },
  updateLightsAudio() {
    const g = G, on = g.lightL || g.lightR;
    if (on) Sound.loop('light', 0.5); else Sound.stop('light');
    if (g.lightL && g.bonnie.loc === 'DOOR' && !g.windowSeenL) { g.windowSeenL = true; Sound.once('window', 0.9); }
    if (g.lightR && g.chica.loc === 'DOOR' && !g.windowSeenR) { g.windowSeenR = true; Sound.once('window', 0.9); }
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

  // -------------------------------------------------------------- monitor
  toggleMonitor() {
    const g = G; if (g.out || g.dead || g.monAnim >= 0) return;
    if (!g.cam) { g.monDir = 1; g.monAnim = 0; Sound.once('camUp', 0.6); g.foxy.lock = Infinity; }
    else { g.cam = false; g.monDir = -1; g.monAnim = N_MON - 1; Sound.once('camDown', 0.6); Sound.stop('camHum'); }
  },
  onCamUp() { Sound.loop('camHum', 0.15); this.rollVariant(); if (G.gf.inOffice) { G.gf.inOffice = false; G.gf.t = 0; } },
  onCamDown() {
    const g = G; g.monDir = 0; g.foxy.lock = rand(0.83, 16.67);
    if (g.gf.poster) { g.gf.poster = false; g.gf.inOffice = true; g.gf.t = 0; Sound.once('giggle', 0.6); }
    // Bonnie / Chica inside the office attack when the monitor comes down
    if (g.bonnie.loc === 'IN') return this.jumpscare('bonnie');
    if (g.chica.loc === 'IN') return this.jumpscare('chica');
  },
  switchCam(id) {
    const g = G; if (!g.cam || id === g.cur) return;
    g.cur = id; g.camT = 0; g.bars = 0.25; Sound.once('blip', 0.7); this.rollVariant();
    if (id === '1C' && g.foxy.stage < 3 && Math.random() < 1 / 30) Sound.once('pirate', 0.4);
  },
  rollVariant() {
    const g = G; g.variant = randi(1, 100);
    if (g.cur === '2B' && g.bonnie.loc !== '2B' && Math.random() < 1 / 80) g.gf.poster = true;
  },
  camImage(id) {
    const g = G, b = g.bonnie.loc, c = g.chica.loc, f = g.freddy.loc, v = g.variant;
    switch (id) {
      case '1A': {
        const B = b === '1A', C = c === '1A', F = f === '1A';
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
    Sound.once('door', 0.7);
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
    ['fan', 'amb', 'amb2', 'light', 'camHum', 'musicbox'].forEach(Sound.stop);
    Sound.once('powerdown', 1);
  },
  updateOutage(dt) {
    const o = G.out; o.acc += dt; o.elapsed += dt;
    if (o.phase === 0) { // waiting for Freddy at the left door
      if (o.acc >= 5) { o.acc = 0; if (Math.random() < 0.2 || o.elapsed >= 20) { o.phase = 1; o.elapsed = 0; Sound.play('musicbox', 0.9, true); Sound.once('steps', 0.6); } }
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
  win() { G.won = true; Sound.stopAll(); Scene.go(SixAM); },

  // -------------------------------------------------------------- draw
  draw() {
    const g = G;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (g.cam) this.drawCam(); else this.drawOffice();
    if (g.monAnim >= 0) { if (!g.cam && g.monDir < 0 && g.monAnim < 1) {} else img('mon' + clamp(Math.floor(g.monAnim), 0, N_MON - 1), 0, 0); }
    if (!g.out) this.drawHUD();
    if (!g.out && !g.dead) {
      const [fx, fy] = LAYOUT.flip; img('flip', fx, fy);
    }
  },
  drawOffice() {
    const g = G, ox = -g.ox;
    if (g.out) {
      const o = g.out;
      if (o.phase === 2) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
      const k = o.phase === 1 && Math.random() < 0.5 ? 'pout_freddy' : 'pout_dark';
      img(k, ox, 0); this.drawDoors(ox); return;
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
    if (g.gf.inOffice) { ctx.globalAlpha = 0.95; img('gf_office', LAYOUT.gfOffice[0] + ox, LAYOUT.gfOffice[1]); ctx.globalAlpha = 1; if (Math.random() < 0.1) img('hallu' + randi(3, 4), 0, 0); }
    if (g.hallu) img(g.hallu.k, 0, 0);
  },
  drawDoors(ox) {
    const g = G;
    img('doorL' + Math.round(G.animL), LAYOUT.leftDoor[0] + ox, LAYOUT.leftDoor[1]);
    img('doorR' + Math.round(G.animR), LAYOUT.rightDoor[0] + ox, LAYOUT.rightDoor[1]);
  },
  drawCam() {
    const g = G, id = g.cur;
    if (id === '6') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); drawStatic(0.35 + Math.random() * 0.15);
      const d = IMG.cam_disabled; if (d) img('cam_disabled', 400, 200);
    } else if (g.disrupt > 0) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); drawStatic(0.5 + Math.random() * 0.3);
    } else {
      let k = this.camImage(id);
      if (id === '2A' && g.foxy.running && g.foxy.runView) k = 'run' + clamp(Math.floor(g.foxy.runT * 20), 0, N_RUN - 1);
      img(k, -g.pan, 0);
      drawStatic(0.05 + Math.random() * 0.07);
    }
    if (g.bars > 0) { ctx.globalCompositeOperation = 'lighter'; img('bars' + clamp(Math.floor((0.25 - g.bars) / 0.25 * N_BARS), 0, N_BARS - 1), 0, 0); ctx.globalCompositeOperation = 'source-over'; }
    // UI frame
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);
    if (Math.floor(performance.now() / 600) % 2) img('rec', LAYOUT.rec[0], LAYOUT.rec[1]);
    img('name_' + id, LAYOUT.camName[0], LAYOUT.camName[1]);
    this.drawMap();
    this.drawPanBar();
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
        const l = IMG['lbl_' + id], off = { '2B': [10, 2], '4B': [10, 2], '2A': [-34, -24], '4A': [10, -24] }[id] || [8, -26]; if (l) img('lbl_' + id, mx + cx + off[0], my + cy + off[1], l.width * 0.85, l.height * 0.85);
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
    if (SAVE.beta) { ctx.globalAlpha = 0.85; drawLives(1040, 680, SAVE.lives); ctx.globalAlpha = 1; }
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
    const g = G; if (!g || g.dead || g.won) return;
    if (e.pointerType !== 'mouse' && this.inFlip(x, y)) return this.toggleMonitor();
    if (g.cam) {
      const [bx, by, bw] = LAYOUT.panBar;
      if (y > by - 20 && y < by + 20 && x > bx - 20 && x < bx + bw + 20) { g.dragging = true; this.dragPan(x); return; }
      if (y > by - 20 && y < by + 20 && x > bx + bw + 25 && x < bx + bw + 110) { g.panAuto = !g.panAuto; return; }
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
    const g = G; if (!g || g.dead || g.won) return;
    if (c === 'Space' || c === 'KeyS') return this.toggleMonitor();
    if (g.cam) {
      const map = { Digit1: '1A', Digit2: '1B', Digit3: '1C', Digit4: '2A', Digit5: '2B', Digit6: '3', Digit7: '4A', Digit8: '4B', Digit9: '5', Digit0: '6', Minus: '7' };
      if (map[c]) this.switchCam(map[c]);
      if (c === 'KeyR') g.panAuto = !g.panAuto;
      return;
    }
    if (c === 'KeyQ') this.door('L'); if (c === 'KeyA') this.light('L');
    if (c === 'KeyE') this.door('R'); if (c === 'KeyD') this.light('R');
  },
};

// --- jumpscare
const Jumpscare = {
  enter(who) {
    this.who = who; this.t = 0; this.n = N_JS[who];
    const scream = Sound.play('scream', 1);
    this.cut = !SAVE.beta; // the original cuts the 5 s scream to ~1 s; beta restores the full sound
    this.scream = scream;
  },
  update(dt) {
    this.t += dt;
    if (this.cut && this.t > 1.05 && this.scream) { this.scream.pause(); this.scream = null; }
    if (this.t > 1.25) Scene.go(Dead);
  },
  draw() {
    const fps = 30, f = Math.floor(this.t * fps), n = this.n;
    const idx = f < n ? f : n - 1 - ((f - n) % Math.min(4, n));
    const ox = this.who === 'freddyDark' ? 0 : -(G ? G.ox : 160);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    img('js_' + this.who + clamp(idx, 0, n - 1), ox, 0);
  },
};

// --- golden freddy: jumpscare then "crash" back to the menu
const GoldenCrash = {
  enter() { this.t = 0; Sound.play('scream2', 1); },
  update(dt) { this.t += dt; if (this.t > 3) { Sound.stopAll(); Scene.go(Menu); } },
  draw() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); if (this.t < 1.2) img('gf_js', 0, 0); },
};

// --- death: static, game over, lives (beta)
const Dead = {
  enter() {
    this.t = 0; Sound.play('static', 0.8);
    this.livesBefore = SAVE.lives;
    if (SAVE.beta) { SAVE.lives = Math.max(0, SAVE.lives - 1); this.outOfLives = SAVE.lives === 0; if (this.outOfLives) SAVE.lives = CONFIG.LIVES; save(); }
    else this.outOfLives = false;
  },
  update(dt) { this.t += dt; if (this.t > 10) { Sound.stopAll(); Scene.go(Menu); } },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.t < 2.5) { drawStatic(0.9); return; }
    Sound.stop('static');
    img('gameover_bg', 0, 0); drawStatic(0.12);
    const go = IMG.gameover_txt; if (go) img('gameover_txt', W - go.width - 40, H - 60);
    if (SAVE.beta) {
      if (this.outOfLives) { text('SIN VIDAS', 60, 60, 40, '#f44'); text('En la beta, perder las 5 vidas te devolvía a la Noche 1. Aquí se reinicia la Noche 6 con 5 vidas.', 60, 110, 16, '#ddd'); }
      else drawLives(60, 70, SAVE.lives);
    }
  },
  click() { if (this.t > 3) { Sound.stopAll(); Scene.go(Menu); } },
};

// --- 6 AM
const SixAM = {
  enter() { this.t = 0; Sound.play('chimes', 1); this.kids = false; },
  update(dt) {
    this.t += dt;
    if (!this.kids && this.t > 3.5) { this.kids = true; Sound.play('kids', 0.9); }
    if (this.t > 10) { SAVE.stars = Math.max(SAVE.stars, 2); SAVE.wins++; SAVE.lives = CONFIG.LIVES; save(); Scene.go(Paycheck); }
  },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const p = clamp((this.t - 1) / 2, 0, 1), cx = 540, cy = 324;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - 10, cy - 4, 80, 80); ctx.clip();
    img('am5', cx, cy - p * 76); img('am6', cx, cy + 76 - p * 76); ctx.restore();
    img('amAM', cx + 70, cy);
    fade(this.t < 0.5 ? 1 - this.t * 2 : this.t > 9 ? this.t - 9 : 0);
  },
};

// --- paycheck (Night 6 overtime)
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
window.__fnaf = { Scene, Night, Menu, get G() { return G; }, SAVE, IMG, missing: () => missing };
