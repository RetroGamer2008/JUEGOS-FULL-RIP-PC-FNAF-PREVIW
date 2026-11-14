/* Asset list shared by the game (game.js) and the packer (empaquetador.html).
   Paths are relative to the asset folder "FNAF ASSETS REORGANIZED BY ENTEREST". */
'use strict';
// ---------------------------------------------------------------- asset manifest
// key: [path, keyMode]  keyMode: 'g' = remove grey(90) background, 'b' = remove black background
const IMG = {};
const MANIFEST = {};
function add(key, path, km) { MANIFEST[key] = [path, km || null]; }
function seq(prefix, dir, names, km) { names.forEach((n, i) => add(prefix + i, dir + n + '.png', km)); return names.length; }
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

// menu / text
['BUTTON01', 'BUTTON02', 'SIXTH_NIGHT', 'GAME_TITLE', 'STAR', 'WARNING', 'SET_', 'VERSION', 'CREDIT'].forEach(n => add('txt_' + n, '1-MAIN_TEXT/' + n + '.png', n === 'STAR' ? null : 'g'));
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
seq('dS', '3-THE_OFFICE/OTHER/NUMBERS/', range(0, 9), 'b');      // small digits (Night n)
seq('dB', '5-NUMBERS/NUMBER02/', range(0, 9), 'b');             // clock digits
seq('dM', '5-NUMBERS/NUMBER03/', range(0, 9), 'b');             // power digits
add('am5', '3-THE_OFFICE/OTHER/REACH_6AM/1.png', 'g'); add('am6', '3-THE_OFFICE/OTHER/REACH_6AM/2.png', 'g'); add('amAM', '3-THE_OFFICE/OTHER/REACH_6AM/3.png', 'g');
add('gameover_bg', '3-THE_OFFICE/OTHER/GAME_OVER_.png'); add('gameover_txt', '3-THE_OFFICE/OTHER/GAME_OVER.png', 'g');
// night loading
add('night6', '7-NIGHT_LOADING/6.png', 'g'); add('clock_icon', '7-NIGHT_LOADING/LITTLE_CLOCK.png');
add('lives_txt', '7-NIGHT_LOADING/LIVES.png', 'g'); add('tiny_man', '7-NIGHT_LOADING/WHAT_THE_HELL_IS_THIS.png', 'b');
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
  call: 'voiceover5.wav',          // Night 5 anonymous call (used to start the 6 AM boss fight)
};

// every file the game needs (used by the packer)
function neededFiles() {
  const set = new Set(Object.values(MANIFEST).map(v => v[0]));
  Object.values(SND_FILES).forEach(f => set.add('9-AUDIO/' + f));
  return [...set];
}
