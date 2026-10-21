/* =========================================================
   HAPPY 18TH, BINDU!  — a tiny retro platformer
   Photos: photos/Photo1.jpeg ... photos/Photo18.jpeg
   (.jpg / .JPG / .JPEG also work — it tries each)
   ========================================================= */
(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540;
  ctx.imageSmoothingEnabled = false;

  /* ---------- WORLD LAYOUT ---------- */
  const PX = 4;                 // sprite pixel size
  const GROUND = 470;
  const TOTAL = 18;
  const BS = 44;                // memory block size
  const BLOCK_Y = 300;
  const FIRST = 640, GAP = 440;
  const blockX = i => FIRST + i * GAP;
  const SHOP_X = blockX(TOTAL - 1) + 400;   // left edge of the shop stall
  const SHOP_W = 220;
  const VIJ_X = SHOP_X + SHOP_W + 420;
  const CAKE_X = VIJ_X + 150;
  const WORLD_W = CAKE_X + 380;
  const FRAME = 140;            // photo frame size
  // photos shown whole (no crop) in a frame shaped to the photo
  const FIT_WHOLE = [6, 8, 10, 12, 13, 15, 16];
  const WHOLE_MAX_W = 300, WHOLE_MAX_H = 205;

  const FONT = '"Press Start 2P", monospace';

  /* ---------- ZONES (life stages) ---------- */
  const ZONES = [
    { name: 'ZONE 1 - BABY DAYS',    start: 0,               sky: ['#ffc8e6', '#eaf6ff'], hill: '#bfe8b4', hill2: '#9fd894' },
    { name: 'ZONE 2 - LITTLE BINDU', start: blockX(4) - 220, sky: ['#4aa8ff', '#c4ecff'], hill: '#5cc85c', hill2: '#3fa63f' },
    { name: 'ZONE 3 - SCHOOL DAYS',  start: blockX(9) - 220, sky: ['#ff7a59', '#ffd36e'], hill: '#d0804f', hill2: '#a85a36' },
    { name: 'ZONE 4 - TEEN BINDU',   start: blockX(14) - 220, sky: ['#0a1240', '#3b2577'], hill: '#2f3d70', hill2: '#1f2a52' }
  ];

  /* ---------- SPRITES (12 x 16) ---------- */
  const PAL = {
    K: '#141414', k: '#3d3d52', S: '#f2c39b', E: '#1d1d1d', M: '#c4504d',
    P: '#ff6fb5', p: '#d94a92', B: '#3a7bff', b: '#2349b0', H: '#5a3a2a',
    W: '#ffffff', w: '#bfe9ff', G: '#101018', Y: '#ffd84a', C: '#3ad8ff',
    R: '#ff3b5c', r: '#b81d3a',
    V: '#9b5de5', v: '#6a3aa8', N: '#43b65a', n: '#2b7a3c'
  };

  // Bindu: silky long black hair, pink dress
  const BINDU_TOP = [
    '...KKKKK....',
    '..KKKKKKK...',
    '.KKKkKKKKK..',
    '.KKSSSSSKK..',
    '.KKSSESSEK..',
    '.KKSSSSSSK..',
    '.KKSSMMSSK..',
    '.KKKSSSSKKK.',
    '.KKPPPPPPKK.',
    'KKPPPPPPPPKK',
    '.KSPPPPPPSK.',
    '..SPPPPPPS..',
    '..PPPPPPPP..',
    '.pPPPPPPPPp.'
  ];
  const BINDU_STAND = BINDU_TOP.concat(['...SS..SS...', '...HH..HH...']);
  const BINDU_RUN   = BINDU_TOP.concat(['..SS....SS..', '..HH....HH..']);
  const BINDU_JUMP  = BINDU_TOP.concat(['...SS.SS....', '...HH..HH...']);

  // Vij: curly black hair, blue outfit
  const VIJ_BASE = [
    '.K.KK.KK.K..',
    'KKKKKKKKKKK.',
    'KKkKKKKkKKKK',
    '.KKSSSSSSKK.',
    '.KSSESSESSK.',
    '.KSSSSSSSSK.',
    'KKSSSMMSSSKK',
    'K.KSSSSSSK.K',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    '.SBBBBBBBBS.',
    '..BBBBBBBB..',
    '..bbbbbbbb..',
    '..bbb..bbb..',
    '...bb..bb...',
    '...HH..HH...'
  ];
  const VIJ_WAVE = VIJ_BASE.slice();
  VIJ_WAVE[6]  = 'KKSSSMMSSSKS';
  VIJ_WAVE[7]  = 'K.KSSSSSSK.S';
  VIJ_WAVE[8]  = '..BBBBBBBBBS';
  VIJ_WAVE[10] = '.SBBBBBBBBB.';

  /* ---------- SHOP ITEMS (worn on Bindu) ---------- */
  // dx/dy = offset in sprite pixels from the sprite's top-left. slot: one item per slot.
  const ITEMS = [
    { id: 'hat', name: 'PARTY HAT', price: 10, slot: 'head', dx: 2, dy: -6, map: [
      '...W...',
      '..YCY..',
      '..CYC..',
      '.YCYCY.',
      '.CYCYC.',
      'YCYCYCY'] },
    { id: 'shades', name: 'SUNGLASSES', price: 12, slot: 'face', dx: 3, dy: 4, map: [
      'GGGGGG',
      '.wG.wG'] },
    { id: 'crown', name: 'CROWN', price: 25, slot: 'head', dx: 3, dy: -3, map: [
      'Y.Y.Y',
      'YYYYY',
      'YRYCY'] },
    { id: 'bow', name: 'HAIR BOW', price: 8, slot: 'hair', dx: 7, dy: -1, map: [
      'RR.RR',
      'RRrRR',
      'RR.RR'] },
    { id: 'cape', name: 'HERO CAPE', price: 18, slot: 'back', behind: true, dx: -2, dy: 8, map: [
      'RR..',
      'RRR.',
      'rRR.',
      'RRRR',
      'rRRR',
      'RRR.',
      'RR..'] }
  ];
  const owned = new Set(), worn = new Set();

  /* ---------- RAW MODE: Srishti & Kumuda ---------- */
  // Off by default. Turn on with the RAW MODE button on the start screen,
  // or open the page as index.html?raw
  let RAW = new URLSearchParams(location.search).has('raw');

  const ENEMY_WALK1 = [
    '....AAAA....',
    '..AAAAAAAA..',
    '.AAAAAAAAAA.',
    '.AEEAAAAEEA.',
    '.AWEAAAAEWA.',
    'AAAAAAAAAAAA',
    'AAAAEEEEAAAA',
    'AAAEAAAAEAAA',
    'aAAAAAAAAAAa',
    '.aaaaaaaaaa.',
    '..HH....HH..',
    '.HHH....HHH.'
  ];
  const ENEMY_WALK2 = ENEMY_WALK1.slice(0, 10).concat(['...HH..HH...', '..HHH..HHH..']);
  const ENEMY_SQUASH = ['..AAAAAAAA..', '.AEEAAAAEEA.', 'AAAAAAAAAAAA', 'aaaaaaaaaaaa'];
  const tint = (map, A, a) => map.map(r => r.replace(/A/g, A).replace(/a/g, a));

  const enemies = [
    { name: 'SRISHTI', home: blockX(6) + 220, A: 'V', a: 'v' },
    { name: 'KUMUDA',  home: blockX(12) + 220, A: 'N', a: 'n' }
  ].map(e => ({
    ...e, x: e.home, y: GROUND - 44, w: 44, h: 44, dir: -1, dead: 0,
    walk1: tint(ENEMY_WALK1, e.A, e.a), walk2: tint(ENEMY_WALK2, e.A, e.a), squash: tint(ENEMY_SQUASH, e.A, e.a)
  }));
  let hurtT = 0;

  const rawBtn = document.getElementById('rawBtn');
  function syncRaw() {
    rawBtn.textContent = `RAW MODE: ${RAW ? 'ON' : 'OFF'}`;
    rawBtn.classList.toggle('on', RAW);
  }
  rawBtn.addEventListener('click', e => { e.stopPropagation(); RAW = !RAW; syncRaw(); rawBtn.blur(); });
  syncRaw();
  let shopLock = false;

  const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

  /* ---------- PHOTOS ---------- */
  /* ✏️ CAPTIONS — shown under each photo when it's expanded.
     Write between the quotes. Leave '' empty to show no caption.
     Use \n for a new line. */
  const CAPTIONS = {
    1:  'Non Chalant af',
    2:  'Already encroaching my territory',
    3:  'Naanna ID card and my book btw',
    4:  'No one quite understood how she got there',
    5:  'How come I ever get that face?',
    6:  'Look at the CURLS',
    7:  '"What do you mean I can not steal your hw?"',
    8:  '"Yo Peasants"',
    9:  'I almost got in trouble for this!',
    10: 'Not skipping the og',
    11: 'The aayammas who actually made it were just outside the frame :)',
    12: 'Dodged the wave (only to be hit my the incoming one :) )',
    13: 'She tried to shoot me peeps',
    14: 'This cute ngl..',
    15: 'Group Photo 1',
    16: 'Group Photo 2',
    17: 'Group Photo 3',
    18: 'Photo Credits : me'
  };

  const PHOTO_DIR = 'photos/';   // folder next to index.html (lowercase!)
  const photos = Array.from({ length: TOTAL }, (_, i) => {
    const o = { img: new Image(), ok: false };
    // Live servers (Vercel, Netlify, GitHub Pages) are case-sensitive, so try
    // every common spelling of the folder, file name and extension.
    const dirs = [PHOTO_DIR, 'Photos/', 'PHOTOS/', ''];
    const names = ['Photo', 'photo', 'PHOTO'];
    const exts = ['jpeg', 'jpg', 'JPG', 'JPEG', 'Jpeg', 'Jpg', 'png', 'PNG'];
    const tries = [];
    for (const d of dirs) for (const n of names) for (const x of exts) tries.push(`${d}${n}${i + 1}.${x}`);
    let e = 0;
    o.img.onload = () => { o.ok = true; };
    o.img.onerror = () => {
      if (++e < tries.length) o.img.src = tries[e];
      else console.warn(`Photo ${i + 1} not found. Tried e.g. ${tries[0]}`);
    };
    o.img.src = tries[0];
    return o;
  });

  /* ---------- ENTITIES ---------- */
  const blocks = Array.from({ length: TOTAL }, (_, i) => ({
    i, x: blockX(i), y: BLOCK_Y, s: BS, hit: false, bounce: 0, pop: 0
  }));

  const coins = [];
  [300, 340, 380].forEach(x => coins.push({ x, y: GROUND - 46, got: false }));
  for (let i = 0; i < TOTAL; i++) {
    const bx = blockX(i);
    const high = i % 2 === 1;
    [150, 195, 240].forEach((d, k) => coins.push({
      x: bx + d,
      y: high ? GROUND - 120 - (k === 1 ? 24 : 0) : GROUND - 46,
      got: false
    }));
  }

  const P = { x: 120, y: GROUND - 62, w: 40, h: 62, vx: 0, vy: 0, onGround: true, face: 1, anim: 0 };
  const ACC = 0.6, MAXV = 5.2, FRICTION = 0.8, GRAV = 0.65, JUMP = -14.2;

  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: 50 + Math.random() * 300, t: Math.random() * 6 }));

  let state = 'title';
  let collected = 0, coinCount = 0;
  let camX = 0, frame = 0;
  let zoneNow = 0, bannerT = 0;
  let msg = '', msgT = 0;
  let winT = 0, cardShown = false;
  const popups = [], hearts = [];

  /* ---------- HELPERS ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const easeOutBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mixColor(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }

  function zoneMix(x) {
    let i = 0;
    for (let k = 0; k < ZONES.length; k++) if (x >= ZONES[k].start - 150) i = k;
    if (i === 0) return { a: 0, b: 0, t: 0 };
    return { a: i - 1, b: i, t: clamp((x - (ZONES[i].start - 150)) / 300, 0, 1) };
  }

  /* ---------- AUDIO (all generated, no files) ---------- */
  let actx = null, master = null, muted = false, musicOn = false, step = 0, nextT = 0;
  const STEP = 0.17;
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = n => { const m = n.match(/^([A-G]#?)(\d)$/); return 440 * Math.pow(2, ((+m[2] + 1) * 12 + NOTE[m[1]] - 69) / 12); };

  // original cheerful loop
  const MEL = ['C5','E5','G5','E5','F5','A5','G5','-', 'E5','G5','C6','B5','A5','F5','G5','-',
               'A4','C5','E5','C5','D5','F5','E5','-', 'D5','E5','F5','G5','E5','D5','C5','-'];
  const BASS = ['C3','C3','F3','F3','C3','C3','G3','G3', 'A2','A2','F3','F3','G3','G3','C3','C3'];

  function initAudio() {
    if (actx) { actx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0.25;
    master.connect(actx.destination);
  }

  function tone(f, dur, type = 'square', vol = 0.2, when = 0, slideTo = 0) {
    if (!actx) return;
    const t = actx.currentTime + Math.max(0, when);
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const sfx = {
    jump:  () => tone(320, 0.16, 'square', 0.14, 0, 720),
    coin:  () => { tone(988, 0.06, 'square', 0.12); tone(1319, 0.22, 'square', 0.12, 0.06); },
    bump:  () => tone(140, 0.09, 'triangle', 0.4),
    memory:() => ['C5','E5','G5','C6'].forEach((n, k) => tone(freq(n), 0.18, 'square', 0.13, k * 0.07)),
    stomp: () => { tone(220, 0.08, 'square', 0.2, 0, 90); tone(660, 0.14, 'square', 0.13, 0.08); },
    nope:  () => { tone(330, 0.15, 'square', 0.15); tone(247, 0.3, 'square', 0.15, 0.15); },
    win:   () => ['C5','E5','G5','C6','G5','C6','E6'].forEach((n, k) =>
             tone(freq(n), k === 6 ? 0.9 : 0.16, 'square', 0.14, k * 0.15))
  };

  function scheduleMusic() {
    if (!actx || !musicOn) return;
    if (nextT < actx.currentTime - 0.1) nextT = actx.currentTime + 0.05;
    while (nextT < actx.currentTime + 0.2) {
      const when = nextT - actx.currentTime;
      const n = MEL[step % MEL.length];
      if (n !== '-') tone(freq(n), STEP * 0.9, 'square', 0.06, when);
      if (step % 2 === 0) tone(freq(BASS[(step / 2) % BASS.length]), STEP * 1.8, 'triangle', 0.16, when);
      nextT += STEP;
      step++;
    }
  }
  setInterval(scheduleMusic, 40);

  const muteBtn = document.getElementById('muteBtn');
  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.25;
    muteBtn.textContent = muted ? 'MUSIC: OFF' : 'MUSIC: ON';
    muteBtn.blur();
  }
  muteBtn.addEventListener('click', toggleMute);

  /* ---------- INPUT ---------- */
  const keys = { left: false, right: false, jump: false };
  let jumpBuffer = 0;
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump'
  };

  addEventListener('keydown', e => {
    if (state === 'photo') {
      if (['Escape', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); closePhoto(); }
      return;
    }
    if (state === 'shop') {
      if (e.code === 'Enter' || e.code === 'Escape') { e.preventDefault(); closeShop(); }
      return;
    }
    if (state === 'title' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); start(); return; }
    if (e.code === 'KeyM') { toggleMute(); return; }
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (k === 'jump' && !keys.jump) jumpBuffer = 8;
    keys[k] = true;
  });
  addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (k) keys[k] = false;
  });

  document.querySelectorAll('#touch [data-key]').forEach(btn => {
    const k = btn.dataset.key;
    const down = e => {
      e.preventDefault();
      if (state === 'title') start();
      if (k === 'jump' && !keys.jump) jumpBuffer = 8;
      keys[k] = true;
      btn.classList.add('on');
    };
    const up = e => { e.preventDefault(); keys[k] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', down);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, up));
  });

  const startScreen = document.getElementById('startScreen');
  const cardOverlay = document.getElementById('cardOverlay');
  document.getElementById('startBtn').addEventListener('click', start);
  document.getElementById('replayBtn').addEventListener('click', () => location.reload());

  /* ---------- SHOP UI ---------- */
  const shopOverlay = document.getElementById('shopOverlay');
  const shopItemsEl = document.getElementById('shopItems');
  const shopCoinsEl = document.getElementById('shopCoins');
  const shopMsg = document.getElementById('shopMsg');
  const shopPreview = document.getElementById('shopPreview');
  document.getElementById('shopDone').addEventListener('click', closeShop);

  function openShop() {
    state = 'shop';
    shopLock = true;
    keys.left = keys.right = keys.jump = false;
    P.vx = 0;
    shopMsg.textContent = coinCount > 0 ? 'BUY SOMETHING TO WEAR TO THE PARTY!' : 'NO COINS? GO BACK & GRAB SOME!';
    renderShop();
    shopOverlay.classList.remove('hidden');
    document.body.classList.add('modal');
  }

  /* ---------- PHOTO VIEWER (click a photo to expand) ---------- */
  const photoView = document.getElementById('photoView');
  const photoViewImg = document.getElementById('photoViewImg');
  const photoViewTag = document.getElementById('photoViewTag');
  const photoViewCap = document.getElementById('photoViewCap');
  let stateBeforePhoto = 'play';

  function photoAt(e) {
    const r = canvas.getBoundingClientRect();
    const lx = (e.clientX - r.left) / r.width * W;
    const ly = (e.clientY - r.top) / r.height * H;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i], q = b.rect;
      if (q && photos[b.i].ok && lx >= q.x && lx <= q.x + q.w && ly >= q.y && ly <= q.y + q.h) return b;
    }
    return null;
  }

  canvas.addEventListener('click', e => {
    if (state !== 'play' && state !== 'win') return;
    const b = photoAt(e);
    if (b) openPhoto(b);
  });
  canvas.addEventListener('mousemove', e => {
    canvas.style.cursor = (state === 'play' || state === 'win') && photoAt(e) ? 'zoom-in' : 'default';
  });

  function openPhoto(b) {
    stateBeforePhoto = state;
    state = 'photo';
    keys.left = keys.right = keys.jump = false;
    photoViewImg.src = photos[b.i].img.src;
    photoViewTag.textContent = `MEMORY #${b.i + 1}`;
    const cap = (CAPTIONS[b.i + 1] || '').trim();
    photoViewCap.textContent = cap;
    photoViewCap.classList.toggle('hidden', !cap);
    photoView.classList.remove('hidden');
    document.body.classList.add('modal');
    sfx.coin();
  }

  function closePhoto() {
    photoView.classList.add('hidden');
    if (cardOverlay.classList.contains('hidden') && shopOverlay.classList.contains('hidden')) document.body.classList.remove('modal');
    keys.left = keys.right = keys.jump = false;
    jumpBuffer = 0;
    state = stateBeforePhoto;
  }
  photoView.addEventListener('click', closePhoto);

  function closeShop() {
    shopOverlay.classList.add('hidden');
    document.body.classList.remove('modal');
    keys.left = keys.right = keys.jump = false;
    jumpBuffer = 0;
    state = 'play';
  }

  function wear(it) {
    for (const o of ITEMS) if (o.slot === it.slot) worn.delete(o.id);
    worn.add(it.id);
  }

  function shopClick(it) {
    if (!owned.has(it.id)) {
      if (coinCount < it.price) { shopMsg.textContent = `NEED ${it.price - coinCount} MORE COINS!`; sfx.nope(); return; }
      coinCount -= it.price;
      owned.add(it.id);
      wear(it);
      sfx.coin();
      shopMsg.textContent = `BOUGHT THE ${it.name}!`;
    } else if (worn.has(it.id)) {
      worn.delete(it.id);
      sfx.bump();
      shopMsg.textContent = `TOOK OFF THE ${it.name}`;
    } else {
      wear(it);
      sfx.jump();
      shopMsg.textContent = `WEARING THE ${it.name}!`;
    }
    renderShop();
  }

  function drawItemIcon(cv, it) {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    const w = it.map[0].length, h = it.map.length;
    const px = Math.floor(76 / Math.max(w, h));
    paint(c, it.map, Math.round((96 - w * px) / 2), Math.round((96 - h * px) / 2), false, px);
  }

  function renderShop() {
    shopCoinsEl.textContent = coinCount;
    shopItemsEl.innerHTML = '';
    for (const it of ITEMS) {
      const btn = document.createElement('button');
      btn.className = 'shop-item';
      if (worn.has(it.id)) btn.classList.add('worn');
      if (!owned.has(it.id) && coinCount < it.price) btn.classList.add('poor');
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      drawItemIcon(cv, it);
      const name = document.createElement('span');
      name.className = 'si-name';
      name.textContent = it.name;
      const tag = document.createElement('span');
      tag.className = 'si-price';
      tag.textContent = !owned.has(it.id) ? `${it.price} COINS` : (worn.has(it.id) ? 'WEARING' : 'TAP TO WEAR');
      btn.append(cv, name, tag);
      btn.addEventListener('click', () => shopClick(it));
      shopItemsEl.appendChild(btn);
    }
    const pc = shopPreview.getContext('2d');
    pc.clearRect(0, 0, shopPreview.width, shopPreview.height);
    paintBindu(pc, BINDU_STAND, 20, 60, false, 10);
  }

  /* ---------- CARD + DANCE PARTY ---------- */
  const dance = document.getElementById('danceCanvas');
  const DW = 240, DH = 92;
  const CONF_COLORS = ['#ff4fa3', '#ffd84a', '#3ad8ff', '#7ee35a', '#b57bff'];
  const confetti = Array.from({ length: 45 }, () => ({
    x: Math.random() * DW, y: Math.random() * DH, v: 0.3 + Math.random() * 0.6,
    c: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)]
  }));
  let danceT = 0, danceK = 1;

  function showCard() {
    cardOverlay.classList.remove('hidden');
    document.body.classList.add('modal');
    requestAnimationFrame(() => {
      const r = dance.getBoundingClientRect();
      danceK = Math.max(1, Math.min(6, Math.ceil((r.width || DW) * (window.devicePixelRatio || 1) / DW)));
      dance.width = DW * danceK;
      dance.height = DH * danceK;
      requestAnimationFrame(danceLoop);
    });
  }

  function danceLoop() {
    danceT++;
    const d = dance.getContext('2d');
    d.setTransform(danceK, 0, 0, danceK, 0, 0);
    d.imageSmoothingEnabled = false;
    d.clearRect(0, 0, DW, DH);
    const floor = DH - 9;

    // disco floor
    const tile = 12;
    for (let i = 0; i < DW / tile; i++) {
      d.fillStyle = CONF_COLORS[(i + Math.floor(danceT / 15)) % CONF_COLORS.length];
      d.fillRect(i * tile, floor + 1, tile, 8);
    }
    d.fillStyle = '#000';
    d.fillRect(0, floor, DW, 1);

    // confetti
    for (const c of confetti) {
      c.y += c.v;
      c.x += Math.sin((danceT + c.y) * 0.05) * 0.3;
      if (c.y > floor) { c.y = -4; c.x = Math.random() * DW; }
      d.fillStyle = c.c;
      d.fillRect(Math.round(c.x), Math.round(c.y), 3, 3);
    }

    // the two of you, hopping on alternate beats and spinning now and then
    const px = 3;
    const beat = Math.floor(danceT / 20);
    const bHop = Math.round(Math.abs(Math.sin(danceT * Math.PI / 20)) * 14);
    const vHop = Math.round(Math.abs(Math.cos(danceT * Math.PI / 20)) * 14);
    const bx = DW / 2 - 52, vx = DW / 2 + 16;
    paintBindu(d, bHop > 3 ? BINDU_JUMP : BINDU_STAND, bx, floor - 16 * px - bHop, beat % 4 === 3, px);
    paint(d, beat % 2 ? VIJ_WAVE : VIJ_BASE, vx, floor - 16 * px - vHop, beat % 4 !== 1, px);

    // heart between you
    const hs = beat % 2 ? 3 : 2;
    d.fillStyle = '#ff4fa3';
    const hx = DW / 2 - 3.5 * hs, hy = 22 - 3 * hs;
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < HEART[r].length; c++)
        if (HEART[r][c] === 'X') d.fillRect(Math.round(hx + c * hs), Math.round(hy + r * hs), hs, hs);

    requestAnimationFrame(danceLoop);
  }

  function start() {
    if (state !== 'title') return;
    initAudio();
    startScreen.classList.add('hidden');
    state = 'play';
    if (actx) { musicOn = true; nextT = actx.currentTime + 0.05; }
    bannerT = 160;
  }

  /* ---------- UPDATE ---------- */
  function bump(b) {
    b.bounce = 10;
    if (b.hit) { sfx.bump(); return; }
    b.hit = true;
    b.pop = 0.001;
    collected++;
    sfx.bump();
    sfx.memory();
    popups.push({ x: b.x + BS / 2, y: b.y - 10, text: `MEMORY ${b.i + 1}!`, t: 60 });
  }

  function update() {
    frame++;
    if (state === 'title' || state === 'shop' || state === 'photo') return;

    if (state === 'play') {
      const ctrl = hurtT <= 40;   // brief loss of control after getting bumped
      if (ctrl && keys.left) { P.vx -= ACC; P.face = -1; }
      if (ctrl && keys.right) { P.vx += ACC; P.face = 1; }
      if (ctrl && !keys.left && !keys.right) P.vx *= FRICTION;
      P.vx = clamp(P.vx, -MAXV, MAXV);
      if (Math.abs(P.vx) < 0.05) P.vx = 0;

      if (jumpBuffer > 0) {
        if (P.onGround) { P.vy = JUMP; P.onGround = false; jumpBuffer = 0; sfx.jump(); }
        else jumpBuffer--;
      }
      if (!keys.jump && P.vy < -6) P.vy = -6;   // tap = small hop
    } else if (state === 'win') {
      const target = VIJ_X - 56 - P.w;
      P.face = 1;
      P.vx = P.x < target - 2 ? 2.4 : 0;
    }

    // horizontal
    P.x += P.vx;
    for (const b of blocks) {
      const r = { x: b.x, y: b.y, w: BS, h: BS };
      if (overlap(P, r)) {
        if (P.vx > 0) P.x = b.x - P.w; else if (P.vx < 0) P.x = b.x + BS;
        P.vx = 0;
      }
    }
    P.x = clamp(P.x, 0, WORLD_W - P.w);

    // vertical
    P.vy = Math.min(P.vy + GRAV, 16);
    P.y += P.vy;
    P.onGround = false;
    for (const b of blocks) {
      const r = { x: b.x, y: b.y, w: BS, h: BS };
      if (overlap(P, r)) {
        if (P.vy > 0) { P.y = b.y - P.h; P.vy = 0; P.onGround = true; }
        else if (P.vy < 0) { P.y = b.y + BS; P.vy = 0; bump(b); }
      }
    }
    if (P.y + P.h >= GROUND) { P.y = GROUND - P.h; P.vy = 0; P.onGround = true; }

    P.anim += Math.abs(P.vx) * 0.07;

    // coins
    for (const c of coins) {
      if (!c.got && overlap(P, { x: c.x - 8, y: c.y - 11, w: 16, h: 22 })) {
        c.got = true; coinCount++; sfx.coin();
      }
    }

    // raw mode: Srishti & Kumuda patrol; stomp them for coins, touching them bumps you back
    if (RAW) {
      for (const e of enemies) {
        if (e.dead) { e.dead++; continue; }
        if (state !== 'play') continue;
        e.x += e.dir * 1.2;
        if (e.x < e.home - 150) e.dir = 1;
        if (e.x > e.home + 150) e.dir = -1;
        if (!overlap(P, e)) continue;
        if (P.vy > 0 && P.y + P.h - P.vy <= e.y + 12) {
          e.dead = 1;
          P.vy = -9;
          coinCount += 3;
          sfx.stomp();
          popups.push({ x: e.x + e.w / 2, y: e.y - 20, text: `BYE ${e.name}! +3`, t: 80 });
        } else if (hurtT === 0) {
          hurtT = 60;
          P.vx = P.x + P.w / 2 < e.x + e.w / 2 ? -8 : 8;
          P.vy = -6;
          P.onGround = false;
          sfx.nope();
          popups.push({ x: P.x + P.w / 2, y: P.y - 16, text: 'OUCH!', t: 50 });
        }
      }
    }
    if (hurtT > 0) hurtT--;

    // zones
    let z = 0;
    for (let k = 0; k < ZONES.length; k++) if (P.x >= ZONES[k].start) z = k;
    if (z !== zoneNow) { zoneNow = z; bannerT = 160; }

    // the shop (opens when she walks in, heading right)
    if (state === 'play') {
      const pc = P.x + P.w / 2;
      const inside = pc > SHOP_X + 50 && pc < SHOP_X + SHOP_W - 50;
      if (pc < SHOP_X - 40 || pc > SHOP_X + SHOP_W + 40) shopLock = false;
      if (inside && P.onGround && P.vx >= 0 && !shopLock) openShop();
    }

    // reaching Vij
    if (state === 'play' && P.x + P.w > VIJ_X - 56) {
      if (collected < TOTAL) {
        P.x = VIJ_X - 56 - P.w - 8;
        P.vx = -4;
        if (msgT < 60) sfx.nope();
        const left = TOTAL - collected;
        msg = `WAIT! YOU MISSED ${left} MEMOR${left === 1 ? 'Y' : 'IES'}!`;
        msgT = 150;
      } else {
        state = 'win';
        musicOn = false;
        sfx.win();
      }
    }

    if (state === 'win') {
      winT++;
      if (winT % 5 === 0) {
        hearts.push({ x: VIJ_X - 20 + (Math.random() - 0.5) * 140, y: GROUND - 70, vy: -1.5 - Math.random() * 2, vx: (Math.random() - 0.5) * 1.5, t: 90 });
      }
      if (winT === 190 && !cardShown) { cardShown = true; showCard(); }
    }

    // timers
    for (const b of blocks) {
      if (b.bounce > 0) b.bounce--;
      if (b.pop > 0 && b.pop < 1) b.pop = Math.min(1, b.pop + 0.035);
    }
    for (let i = popups.length - 1; i >= 0; i--) { popups[i].y -= 0.8; if (--popups[i].t <= 0) popups.splice(i, 1); }
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i]; h.x += h.vx; h.y += h.vy;
      if (--h.t <= 0) hearts.splice(i, 1);
    }
    if (bannerT > 0) bannerT--;
    if (msgT > 0) msgT--;

    // camera
    const target = clamp(P.x - W * 0.4, 0, WORLD_W - W);
    camX += (target - camX) * 0.15;
  }

  /* ---------- DRAW HELPERS ---------- */
  // paint a pixel map onto any canvas context (12-wide sprite grid, optional offset)
  function paint(c, map, x, y, flip, px, dx = 0, dy = 0) {
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let col = 0; col < row.length; col++) {
        const ch = row[col];
        if (ch === '.') continue;
        c.fillStyle = PAL[ch];
        const gx = dx + col;
        const cc = flip ? 11 - gx : gx;
        c.fillRect(Math.round(x + cc * px), Math.round(y + (dy + r) * px), px, px);
      }
    }
  }
  function drawSprite(map, x, y, flip) { paint(ctx, map, x, y, flip, PX); }

  // Bindu + whatever she's wearing
  function paintBindu(c, map, x, y, flip, px) {
    for (const it of ITEMS) if (it.behind && worn.has(it.id)) paint(c, it.map, x, y, flip, px, it.dx, it.dy);
    paint(c, map, x, y, flip, px);
    for (const it of ITEMS) if (!it.behind && worn.has(it.id)) paint(c, it.map, x, y, flip, px, it.dx, it.dy);
  }

  function drawHeart(x, y, s, color) {
    ctx.fillStyle = color;
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < HEART[r].length; c++)
        if (HEART[r][c] === 'X') ctx.fillRect(Math.round(x + c * s), Math.round(y + r * s), s, s);
  }

  function text(t, x, y, size, color, align = 'left', shadow = '#000') {
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    if (shadow) { ctx.fillStyle = shadow; ctx.fillText(t, x + 3, y + 3); }
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
  }

  function pixelBox(x, y, w, h, fill) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = fill;   ctx.fillRect(x, y, w, h);
  }

  function bubble(t, cx, y) {
    ctx.font = `10px ${FONT}`;
    const w = ctx.measureText(t).width + 24;
    const x = Math.round(cx - w / 2);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, 34);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 28);
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 6, y + 31, 12, 4); ctx.fillRect(cx - 3, y + 35, 6, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx - 3, y + 28, 6, 4);
    text(t, cx, y + 9, 10, '#222', 'center', null);
  }

  function drawCloud(x, y, s) {
    ctx.fillRect(x + 8 * s, y, 24 * s, 8 * s);
    ctx.fillRect(x, y + 8 * s, 40 * s, 8 * s);
    ctx.fillRect(x + 4 * s, y + 16 * s, 32 * s, 4 * s);
  }

  function drawHills(par, spacing, base, color, seed) {
    const cx = camX * par;
    const k0 = Math.floor(cx / spacing) - 1;
    ctx.fillStyle = color;
    for (let k = k0; k < k0 + Math.ceil(W / spacing) + 3; k++) {
      const sx = k * spacing + seed - cx;
      const steps = 4 + (((k * 7 + seed) % 4) + 4) % 4;
      for (let s = 0; s < steps; s++) {
        const w = base - s * (base / steps);
        ctx.fillRect(Math.round(sx - w / 2), GROUND - (s + 1) * 14, Math.round(w), 14);
      }
    }
  }

  function drawCover(img, x, y, w, h) {
    const r = Math.max(w / img.width, h / img.height);
    const sw = w / r, sh = h / r;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  }

  /* ---------- RENDER ---------- */
  // Render the canvas at the screen's real resolution (whole-number multiple of
  // 960x540) so photos stay sharp while pixel art stays crisp.
  let scaleK = 0;
  function fitResolution() {
    const r = canvas.getBoundingClientRect();
    const k = Math.max(1, Math.min(4, Math.ceil((r.width || W) * (window.devicePixelRatio || 1) / W)));
    if (k !== scaleK) { scaleK = k; canvas.width = W * k; canvas.height = H * k; }
  }
  addEventListener('resize', fitResolution);
  fitResolution();

  function render() {
    ctx.setTransform(scaleK, 0, 0, scaleK, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const mix = zoneMix(camX + W / 2);
    const za = ZONES[mix.a], zb = ZONES[mix.b], t = mix.t;
    const night = mix.b === 3 ? t : 0;

    // sky
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, mixColor(za.sky[0], zb.sky[0], t));
    g.addColorStop(1, mixColor(za.sky[1], zb.sky[1], t));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    if (night > 0) {
      for (const s of stars) {
        ctx.globalAlpha = night * (0.5 + 0.5 * Math.sin(frame * 0.05 + s.t));
        ctx.fillStyle = '#fff';
        const sx = ((s.x - camX * 0.05) % W + W) % W;
        ctx.fillRect(Math.round(sx), Math.round(s.y), 3, 3);
      }
      ctx.globalAlpha = 1;
      // moon
      ctx.globalAlpha = night;
      ctx.fillStyle = '#fff6c8';
      ctx.fillRect(800, 70, 48, 48);
      ctx.fillStyle = mixColor(za.sky[0], zb.sky[0], t);
      ctx.fillRect(824, 66, 28, 30);
      ctx.globalAlpha = 1;
    }

    // clouds
    ctx.globalAlpha = 1 - night * 0.65;
    ctx.fillStyle = '#fff';
    const cpx = camX * 0.2;
    const c0 = Math.floor(cpx / 330) - 1;
    for (let k = c0; k < c0 + 5; k++) {
      const yy = 70 + (((k * 53) % 5) + 5) % 5 * 22;
      drawCloud(Math.round(k * 330 - cpx), yy, 2);
    }
    ctx.globalAlpha = 1;

    // hills
    drawHills(0.3, 420, 360, mixColor(za.hill2, zb.hill2, t), 90);
    drawHills(0.55, 520, 300, mixColor(za.hill, zb.hill, t), 240);

    // ground
    const gx0 = Math.floor(camX / 32) * 32;
    for (let x = gx0; x < camX + W + 32; x += 32) {
      const sx = Math.round(x - camX);
      ctx.fillStyle = '#c06a2b'; ctx.fillRect(sx, GROUND, 32, H - GROUND);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(sx, GROUND + 22, 32, 3);
      ctx.fillRect(sx, GROUND + 46, 32, 3);
      ctx.fillRect(sx + 30, GROUND + 10, 3, 12);
      ctx.fillRect(sx + 14, GROUND + 25, 3, 21);
      ctx.fillRect(sx + 30, GROUND + 49, 3, 21);
      ctx.fillStyle = '#3cb043'; ctx.fillRect(sx, GROUND, 32, 10);
      ctx.fillStyle = '#2a8a33'; ctx.fillRect(sx, GROUND + 10, 32, 3);
    }

    // bushes
    const b0 = Math.floor(camX / 360) - 1;
    for (let k = b0; k < b0 + 5; k++) {
      const sx = Math.round(k * 360 + 200 - camX);
      ctx.fillStyle = '#1f7a2e';
      ctx.fillRect(sx, GROUND - 20, 60, 20);
      ctx.fillRect(sx + 10, GROUND - 32, 40, 12);
      ctx.fillStyle = '#34a043';
      ctx.fillRect(sx + 4, GROUND - 16, 52, 14);
      ctx.fillRect(sx + 14, GROUND - 28, 32, 12);
    }

    // shop + cake
    drawShop(Math.round(SHOP_X - camX));
    drawCake(Math.round(CAKE_X - camX));

    // Vij
    const vx = Math.round(VIJ_X - camX);
    if (vx > -100 && vx < W + 100) {
      const hop = state === 'win' ? Math.abs(Math.sin(winT * 0.12)) * 26 : 0;
      const waving = Math.floor(frame / 18) % 2 === 0;
      drawSprite(waving ? VIJ_WAVE : VIJ_BASE, vx, GROUND - 64 - hop, true);
      if (state === 'win') bubble('HAPPY 18TH, BINDU!!', vx + 24, GROUND - 120 - hop);
      else if (P.x > VIJ_X - 700) bubble(collected < TOTAL ? `FIND ALL ${TOTAL} MEMORIES!` : 'BINDU! OVER HERE!', vx + 24, GROUND - 112);
    }

    // photo frames
    for (const b of blocks) drawPhoto(b);

    // blocks
    for (const b of blocks) drawBlock(b);

    // coins
    for (const c of coins) {
      if (c.got) continue;
      const sx = c.x - camX;
      if (sx < -20 || sx > W + 20) continue;
      const w = 4 + Math.round(Math.abs(Math.sin(frame * 0.08 + c.x)) * 6) * 2;
      ctx.fillStyle = '#7a4a00'; ctx.fillRect(Math.round(sx - w / 2) - 2, c.y - 13, w + 4, 26);
      ctx.fillStyle = '#ffcc1a'; ctx.fillRect(Math.round(sx - w / 2), c.y - 11, w, 22);
      ctx.fillStyle = '#fff3a0'; ctx.fillRect(Math.round(sx - w / 2) + 2, c.y - 9, 2, 10);
    }

    // raw mode enemies
    if (RAW) for (const e of enemies) drawEnemy(e);

    // Bindu
    let spr = BINDU_STAND;
    if (!P.onGround) spr = BINDU_JUMP;
    else if (Math.abs(P.vx) > 0.4) spr = Math.floor(P.anim) % 2 ? BINDU_RUN : BINDU_STAND;
    if (!(hurtT > 0 && frame % 6 < 3)) paintBindu(ctx, spr, P.x - 4 - camX, P.y - 2, P.face < 0, PX);

    // hearts
    for (const h of hearts) {
      ctx.globalAlpha = Math.min(1, h.t / 30);
      drawHeart(h.x - camX, h.y, 3, '#ff4fa3');
    }
    ctx.globalAlpha = 1;

    // popups
    for (const p of popups) {
      ctx.globalAlpha = Math.min(1, p.t / 20);
      text(p.text, p.x - camX, p.y, 12, '#ffd84a', 'center');
    }
    ctx.globalAlpha = 1;

    drawHUD();

    // zone banner
    if (bannerT > 0 && state !== 'title') {
      ctx.globalAlpha = Math.min(1, bannerT / 30);
      ctx.font = `16px ${FONT}`;
      const name = ZONES[zoneNow].name;
      const w = ctx.measureText(name).width + 40;
      pixelBox(W / 2 - w / 2, 70, w, 40, '#2a1650');
      text(name, W / 2, 82, 16, '#fff', 'center');
      ctx.globalAlpha = 1;
    }

    // missed-memories message
    if (msgT > 0) {
      ctx.font = `14px ${FONT}`;
      const w = ctx.measureText(msg).width + 40;
      pixelBox(W / 2 - w / 2, 200, w, 64, '#c2185b');
      text(msg, W / 2, 213, 14, '#fff', 'center');
      text('GO BACK & BUMP THEM!', W / 2, 238, 10, '#ffd84a', 'center');
    }
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, 44);
    text('BINDU', 20, 14, 14, '#ff8fd1');
    text(`MEMORIES ${String(collected).padStart(2, '0')}/${TOTAL}`, W / 2, 14, 14, '#fff', 'center');
    text(`COINS x${String(coinCount).padStart(2, '0')}`, W - 20, 14, 14, '#ffd84a', 'right');
  }

  function drawBlock(b) {
    const sx = Math.round(b.x - camX);
    if (sx < -60 || sx > W + 60) return;
    const off = b.bounce > 0 ? -Math.round(Math.sin(((10 - b.bounce) / 10) * Math.PI) * 14) : 0;
    const y = b.y + off;
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 2, y - 2, BS + 4, BS + 4);
    if (!b.hit) {
      ctx.fillStyle = '#f7b42c'; ctx.fillRect(sx, y, BS, BS);
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(sx, y, BS, 4); ctx.fillRect(sx, y, 4, BS);
      ctx.fillStyle = '#a85d0a'; ctx.fillRect(sx, y + BS - 4, BS, 4); ctx.fillRect(sx + BS - 4, y, 4, BS);
      const shimmer = Math.sin(frame * 0.1 + b.i) > 0 ? '#ff4fa3' : '#ff8fd1';
      drawHeart(sx + 11, y + 13, 3, shimmer);
    } else {
      ctx.fillStyle = '#b9763a'; ctx.fillRect(sx, y, BS, BS);
      ctx.fillStyle = '#8a5326'; ctx.fillRect(sx, y + BS - 4, BS, 4); ctx.fillRect(sx + BS - 4, y, 4, BS);
      drawHeart(sx + 11, y + 13, 3, '#d98aa8');
    }
  }

  function drawPhoto(b) {
    b.rect = null;
    if (b.pop <= 0) return;
    const cx = b.x + BS / 2 - camX;
    if (cx < -200 || cx > W + 200) return;
    const p = Math.min(1, b.pop);
    const e = easeOutBack(p);
    const ph = photos[b.i];

    // frame shape: square by default; whole-photo frames take the photo's own shape
    let fw = FRAME, fh = FRAME;
    const whole = ph.ok && FIT_WHOLE.includes(b.i + 1);
    if (whole) {
      const s = Math.min(WHOLE_MAX_W / ph.img.naturalWidth, WHOLE_MAX_H / ph.img.naturalHeight);
      fw = Math.round(ph.img.naturalWidth * s);
      fh = Math.round(ph.img.naturalHeight * s);
    }

    const sc = 0.2 + 0.8 * e;
    const w = Math.round(fw * sc), h = Math.round(fh * sc);
    const fy = BLOCK_Y - 26 - fh;
    const y = Math.round(lerp(BLOCK_Y, fy, Math.min(1, p * 1.4)));
    const x = Math.round(cx - w / 2);
    if (p >= 1) b.rect = { x: x - 8, y: y - 8, w: w + 16, h: h + 16 };   // clickable area

    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 4, y + 8, w + 8, h + 8);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 5, y - 5, w + 10, h + 10);

    if (ph.ok) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (whole) ctx.drawImage(ph.img, x, y, w, h);   // entire photo, nothing cropped
      else drawCover(ph.img, x, y, w, h);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.fillStyle = '#e8e0f0'; ctx.fillRect(x, y, w, h);
      if (p >= 1) text(`PHOTO${b.i + 1}`, cx, y + h / 2 - 5, 10, '#7a6a90', 'center', null);
    }

    if (p >= 1) {
      // number tag
      const tag = `#${b.i + 1}`;
      ctx.fillStyle = '#000'; ctx.fillRect(Math.round(cx - 24), y - 22, 48, 20);
      ctx.fillStyle = '#ff4fa3'; ctx.fillRect(Math.round(cx - 22), y - 20, 44, 16);
      text(tag, cx, y - 16, 10, '#fff', 'center', null);
    }
  }

  function drawEnemy(e) {
    if (e.dead > 50) return;
    const sx = Math.round(e.x - 2 - camX);
    if (sx < -100 || sx > W + 100) return;
    if (e.dead) {
      paint(ctx, e.squash, sx, GROUND - 16, false, 4);
      nameTag(e.name, sx + 24, GROUND - 42);
      return;
    }
    paint(ctx, Math.floor(frame / 10) % 2 ? e.walk2 : e.walk1, sx, e.y - 4, e.dir > 0, 4);
    nameTag(e.name, sx + 24, e.y - 30);
  }

  function nameTag(t, cx, y) {
    ctx.font = `10px ${FONT}`;
    const w = Math.ceil(ctx.measureText(t).width) + 14;
    const x = Math.round(cx - w / 2);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, w + 4, 22);
    ctx.fillStyle = '#e53935'; ctx.fillRect(x, y, w, 18);
    text(t, cx, y + 4, 10, '#fff', 'center', null);
  }

  function drawShop(sx) {
    if (sx < -320 || sx > W + 120) return;
    const w = SHOP_W, top = GROUND - 190;
    // back wall
    ctx.fillStyle = '#000'; ctx.fillRect(sx + 16, top + 44, w - 32, 150);
    ctx.fillStyle = '#fff0d8'; ctx.fillRect(sx + 19, top + 44, w - 38, 146);
    ctx.fillStyle = '#ffd9b0';
    for (let y = top + 60; y < GROUND - 74; y += 22) ctx.fillRect(sx + 19, y, w - 38, 3);
    // posts
    ctx.fillStyle = '#000'; ctx.fillRect(sx + 4, top + 40, 16, 150); ctx.fillRect(sx + w - 20, top + 40, 16, 150);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(sx + 7, top + 40, 10, 150); ctx.fillRect(sx + w - 17, top + 40, 10, 150);
    // striped awning
    const n = 11, sw = Math.ceil((w + 8) / n);
    ctx.fillStyle = '#000'; ctx.fillRect(sx - 6, top + 12, w + 12, 44);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#ff4fa3';
      ctx.fillRect(sx - 4 + i * sw, top + 14, sw, 32);
      ctx.fillRect(sx - 4 + i * sw + 3, top + 46, sw - 6, 8);
    }
    // sign
    pixelBox(sx + 40, top - 28, w - 80, 30, '#2a1650');
    text('SHOP', sx + w / 2, top - 19, 14, '#ffd84a', 'center');
    text('SPEND YOUR COINS!', sx + w / 2, top + 72, 8, '#c2185b', 'center', null);
    // goods hanging on the wall
    paint(ctx, ITEMS[4].map, sx + 34, top + 92, false, 4);
    paint(ctx, ITEMS[2].map, sx + 92, top + 100, false, 4);
    paint(ctx, ITEMS[1].map, sx + 150, top + 104, false, 4);
    // counter
    ctx.fillStyle = '#000'; ctx.fillRect(sx + 2, GROUND - 74, w - 4, 74);
    ctx.fillStyle = '#c97a3a'; ctx.fillRect(sx + 5, GROUND - 71, w - 10, 68);
    ctx.fillStyle = '#e8a060'; ctx.fillRect(sx + 5, GROUND - 71, w - 10, 8);
    ctx.fillStyle = '#a85d2a';
    for (let i = 0; i < 5; i++) ctx.fillRect(sx + 24 + i * 42, GROUND - 56, 4, 50);
    // party hat + bow on the counter
    paint(ctx, ITEMS[0].map, sx + 40, GROUND - 74 - 18, false, 3);
    paint(ctx, ITEMS[3].map, sx + 150, GROUND - 74 - 9, false, 3);
  }

  function drawCake(sx) {
    if (sx < -200 || sx > W + 200) return;
    ctx.fillStyle = '#000'; ctx.fillRect(sx - 14, GROUND - 12, 148, 12);
    ctx.fillStyle = '#ddd'; ctx.fillRect(sx - 12, GROUND - 10, 144, 8);
    // bottom layer
    ctx.fillStyle = '#000'; ctx.fillRect(sx - 2, GROUND - 62, 124, 52);
    ctx.fillStyle = '#ff8fc7'; ctx.fillRect(sx, GROUND - 60, 120, 48);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx, GROUND - 60, 120, 8);
    for (let i = 0; i < 6; i++) ctx.fillRect(sx + 6 + i * 20, GROUND - 52, 8, 6 + (i % 2) * 6);
    text('18', sx + 60, GROUND - 38, 18, '#fff', 'center', '#c2185b');
    // top layer
    ctx.fillStyle = '#000'; ctx.fillRect(sx + 13, GROUND - 104, 94, 44);
    ctx.fillStyle = '#fff3f9'; ctx.fillRect(sx + 15, GROUND - 102, 90, 42);
    ctx.fillStyle = '#ff4fa3';
    for (let i = 0; i < 5; i++) ctx.fillRect(sx + 22 + i * 17, GROUND - 84, 8, 8);
    // candles
    [32, 58, 84].forEach((cx, i) => {
      ctx.fillStyle = '#000'; ctx.fillRect(sx + cx - 2, GROUND - 130, 10, 28);
      ctx.fillStyle = '#6ec6ff'; ctx.fillRect(sx + cx, GROUND - 128, 6, 26);
      const fl = Math.floor(frame / 6 + i) % 2;
      ctx.fillStyle = '#ff9a1a'; ctx.fillRect(sx + cx - 1, GROUND - 142 - fl * 2, 8, 12);
      ctx.fillStyle = '#ffe96b'; ctx.fillRect(sx + cx + 1, GROUND - 139 - fl * 2, 4, 7);
    });
  }

  /* ---------- LOOP ---------- */
  let last = performance.now(), acc = 0;
  const DT = 1000 / 60;
  function loop(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= DT) { update(); acc -= DT; }
    render();
    requestAnimationFrame(loop);
  }

  (document.fonts && document.fonts.load ? document.fonts.load(`16px ${FONT}`) : Promise.resolve())
    .catch(() => {})
    .finally(() => requestAnimationFrame(loop));
})();
