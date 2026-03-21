/* ── Audio Manager (Web Audio API) ── */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.volume = 0.35;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch { /* no audio support */ }
  }

  ensure() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === "suspended") this.ctx.resume();
    return this.ctx && !this.muted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  }

  // ── Utility: play a tone with envelope ──

  tone(freq, type, duration, { attack = 0.01, decay = duration, vol = 0.3, delay = 0, detune = 0 } = {}) {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  }

  noise(duration, { vol = 0.15, delay = 0, attack = 0.005 } = {}) {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime + delay;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + duration + 0.05);
  }

  // ── Game SFX ──

  swap() {
    this.tone(520, "sine", 0.1, { vol: 0.25 });
    this.tone(680, "sine", 0.1, { delay: 0.05, vol: 0.2 });
  }

  invalidSwap() {
    this.tone(200, "square", 0.12, { vol: 0.15 });
    this.tone(160, "square", 0.12, { delay: 0.08, vol: 0.12 });
  }

  match(chain = 1) {
    const base = 440 + chain * 80;
    this.tone(base, "sine", 0.15, { vol: 0.25 });
    this.tone(base * 1.25, "sine", 0.12, { delay: 0.06, vol: 0.2 });
    this.tone(base * 1.5, "sine", 0.1, { delay: 0.12, vol: 0.18 });
  }

  cascade(chain = 1) {
    const base = 500 + chain * 100;
    this.tone(base, "triangle", 0.12, { vol: 0.2 });
    this.tone(base * 1.33, "triangle", 0.1, { delay: 0.05, vol: 0.18 });
    this.tone(base * 1.67, "triangle", 0.08, { delay: 0.1, vol: 0.15 });
  }

  specialCreate() {
    this.tone(600, "sine", 0.2, { vol: 0.3 });
    this.tone(800, "sine", 0.18, { delay: 0.08, vol: 0.25 });
    this.tone(1050, "sine", 0.25, { delay: 0.16, vol: 0.2 });
    this.noise(0.15, { vol: 0.08, delay: 0.1 });
  }

  lineBlast() {
    this.noise(0.2, { vol: 0.12 });
    this.tone(300, "sawtooth", 0.2, { vol: 0.15 });
    this.tone(600, "sine", 0.15, { delay: 0.05, vol: 0.2 });
    this.tone(900, "sine", 0.1, { delay: 0.1, vol: 0.15 });
  }

  bombBlast() {
    this.tone(80, "sine", 0.35, { vol: 0.35, attack: 0.005 });
    this.tone(120, "square", 0.2, { vol: 0.15, delay: 0.02 });
    this.noise(0.25, { vol: 0.18 });
  }

  colorBlast() {
    for (let i = 0; i < 5; i++) {
      this.tone(400 + i * 150, "sine", 0.15, { delay: i * 0.06, vol: 0.2 - i * 0.02 });
    }
    this.noise(0.3, { vol: 0.1, delay: 0.05 });
  }

  feverActivate() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      this.tone(f, "sine", 0.2, { delay: i * 0.08, vol: 0.25 });
      this.tone(f, "triangle", 0.15, { delay: i * 0.08 + 0.02, vol: 0.1 });
    });
  }

  levelComplete() {
    const melody = [523, 659, 784, 880, 1047];
    melody.forEach((f, i) => {
      this.tone(f, "sine", 0.25, { delay: i * 0.12, vol: 0.25 });
      this.tone(f * 0.5, "triangle", 0.2, { delay: i * 0.12 + 0.03, vol: 0.1 });
    });
  }

  gameOver() {
    const notes = [440, 370, 311, 261];
    notes.forEach((f, i) => {
      this.tone(f, "sine", 0.3, { delay: i * 0.15, vol: 0.2 });
    });
  }

  spawn() {
    this.tone(800, "sine", 0.06, { vol: 0.1 });
    this.tone(1000, "sine", 0.05, { delay: 0.03, vol: 0.08 });
  }

  gravity() {
    this.tone(250, "sine", 0.08, { vol: 0.08 });
  }

  select() {
    this.tone(660, "sine", 0.06, { vol: 0.15 });
  }

  deselect() {
    this.tone(440, "sine", 0.05, { vol: 0.1 });
  }

  hint() {
    this.tone(880, "sine", 0.1, { vol: 0.08 });
    this.tone(1100, "sine", 0.08, { delay: 0.1, vol: 0.06 });
  }

  uiClick() {
    this.tone(700, "sine", 0.04, { vol: 0.12 });
  }

  purchase() {
    this.tone(523, "sine", 0.1, { vol: 0.2 });
    this.tone(784, "sine", 0.15, { delay: 0.08, vol: 0.25 });
    this.noise(0.08, { vol: 0.06, delay: 0.08 });
  }
}

const sfx = new AudioManager();

const BOARD_SIZE = 8;
const BASE_POINTS = 100;
const MOOD_VARIANTS = 3;
const TIMING = {
  SWAP_MS: 205,
  INVALID_MS: 220,
  CLEAR_MS: 320,
  SPAWN_MS: 440,
  CASCADE_MS: 140,
  GRAVITY_FALL_MS: 168,
  GRAVITY_STEP_MS: 8,
  IMPACT_CHAIN_MS: 290,
  SWEEP_MS: 340,
  SCORE_POP_MS: 1050,
};

const FEVER = {
  MAX_CHARGE: 100,
  TURNS: 5,
  SCORE_MULTIPLIER: 1.45,
};
const DAILY_STORAGE_KEY = "manga-match-daily-v1";
const PROGRESS_STORAGE_KEY = "manga-match-progress-v1";
const TUTORIAL_STORAGE_KEY = "manga-match-tutorial-done-v1";
const SHOP_STORAGE_KEY = "manga-match-shop-v1";
const DAILY_CHALLENGE_VERSION = 2;

const TILE_TYPES = [
  { id: "sakura", name: "Rosa", icon: "🌸" },
  { id: "neko", name: "Blå", icon: "🔵" },
  { id: "sun", name: "Gul", icon: "🌟" },
  { id: "ink", name: "Lila", icon: "🟣" },
  { id: "star", name: "Grön", icon: "💚" },
  { id: "blade", name: "Orange", icon: "🔶" },
];

const TILE_INDEX_BY_ID = Object.fromEntries(TILE_TYPES.map((tile, index) => [tile.id, index]));

const SPECIAL = {
  LINE_H: "line-h",
  LINE_V: "line-v",
  BOMB: "bomb",
  COLOR: "color",
};

const LEVELS = [
  // ── World 1: Grunder (1-10) — score & collect, inga hinder ──
  {
    id: 1, name: "Akademiporten", moves: 30,
    goals: [{ type: "score", amount: 1000 }],
  },
  {
    id: 2, name: "Körsbärsträdgården", moves: 30,
    goals: [{ type: "collect", tile: "sakura", amount: 6 }],
  },
  {
    id: 3, name: "Kattkaféet", moves: 28,
    goals: [
      { type: "score", amount: 1400 },
      { type: "collect", tile: "neko", amount: 8 },
    ],
  },
  {
    id: 4, name: "Solnedgången", moves: 28,
    goals: [{ type: "collect", tile: "sun", amount: 10 }],
  },
  {
    id: 5, name: "Stjärnfestivalen", moves: 27,
    goals: [
      { type: "score", amount: 1800 },
      { type: "collect", tile: "star", amount: 8 },
    ],
  },
  {
    id: 6, name: "Bladvirvelns park", moves: 27,
    goals: [{ type: "collect", tile: "blade", amount: 10 }],
  },
  {
    id: 7, name: "Nattmarknaden", moves: 26,
    goals: [
      { type: "score", amount: 2200 },
      { type: "collect", tile: "neko", amount: 10 },
    ],
  },
  {
    id: 8, name: "Månbron", moves: 26,
    goals: [
      { type: "collect", tile: "sakura", amount: 8 },
      { type: "collect", tile: "star", amount: 8 },
    ],
  },
  {
    id: 9, name: "Tusenkransvägen", moves: 25,
    goals: [{ type: "score", amount: 2600 }],
  },
  {
    id: 10, name: "Portalens prov", moves: 25,
    goals: [
      { type: "score", amount: 2800 },
      { type: "collect", tile: "sun", amount: 12 },
    ],
  },
  // ── World 2: Ink & Locks (11-20) ──
  {
    id: 11, name: "Bläckgränden", moves: 26,
    goals: [
      { type: "score", amount: 2000 },
      { type: "clear", obstacle: "ink", amount: 4 },
    ],
    obstacleMap: [
      "........", "........", "...i....", "........",
      "....i...", "........", "........", "........",
    ],
  },
  {
    id: 12, name: "Bläckregnet", moves: 26,
    goals: [{ type: "clear", obstacle: "ink", amount: 6 }],
    obstacleMap: [
      "........", "..i..i..", "........", "........",
      "........", "........", "..i..i..", "........",
    ],
  },
  {
    id: 13, name: "Mörka floden", moves: 25,
    goals: [
      { type: "score", amount: 2400 },
      { type: "clear", obstacle: "ink", amount: 6 },
    ],
    obstacleMap: [
      "........", "..i..i..", "...ii...", "........",
      "........", "...ii...", "..i..i..", "........",
    ],
  },
  {
    id: 14, name: "Soltemplet", moves: 25,
    goals: [
      { type: "collect", tile: "sun", amount: 12 },
      { type: "clear", obstacle: "ink", amount: 8 },
    ],
    obstacleMap: [
      "........", ".i....i.", "..i..i..", "...ii...",
      "...ii...", "..i..i..", ".i....i.", "........",
    ],
  },
  {
    id: 15, name: "Sigillhallen", moves: 25,
    goals: [
      { type: "unlock", amount: 4 },
      { type: "score", amount: 2600 },
    ],
    lockMap: [
      "........", "........", "...ll...", "........",
      "........", "...ll...", "........", "........",
    ],
  },
  {
    id: 16, name: "Kedjornas kammare", moves: 24,
    goals: [{ type: "unlock", amount: 6 }],
    lockMap: [
      "........", "..l..l..", "........", "..l..l..",
      "..l..l..", "........", "..l..l..", "........",
    ],
  },
  {
    id: 17, name: "Bläck och bojor", moves: 24,
    goals: [
      { type: "unlock", amount: 4 },
      { type: "clear", obstacle: "ink", amount: 6 },
    ],
    obstacleMap: [
      "........", "...ii...", "........", "........",
      "........", "........", "...ii...", "........",
    ],
    lockMap: [
      "........", "........", "..l..l..", "........",
      "........", "..l..l..", "........", "........",
    ],
  },
  {
    id: 18, name: "Tvillingtornen", moves: 24,
    goals: [
      { type: "score", amount: 3000 },
      { type: "unlock", amount: 6 },
      { type: "clear", obstacle: "ink", amount: 6 },
    ],
    obstacleMap: [
      "........", "..i..i..", "........", "........",
      "........", "........", "..i..i..", "........",
    ],
    lockMap: [
      "........", ".l....l.", "..l..l..", "........",
      "........", "..l..l..", ".l....l.", "........",
    ],
  },
  {
    id: 19, name: "Drömlabyrinten", moves: 23,
    goals: [
      { type: "collect", tile: "ink", amount: 12 },
      { type: "clear", obstacle: "ink", amount: 8 },
    ],
    obstacleMap: [
      "........", ".i....i.", "..i..i..", "........",
      "........", "..i..i..", ".i....i.", "........",
    ],
  },
  {
    id: 20, name: "Portalens väktare", moves: 23,
    goals: [
      { type: "score", amount: 3400 },
      { type: "unlock", amount: 8 },
    ],
    lockMap: [
      "..l..l..", "...ll...", "........", ".l....l.",
      ".l....l.", "........", "...ll...", "..l..l..",
    ],
  },
  // ── World 3: Frames & Full Mix (21-30) ──
  {
    id: 21, name: "Panelfästet", moves: 24,
    goals: [
      { type: "clear", obstacle: "frame", amount: 4 },
      { type: "score", amount: 2800 },
    ],
    obstacleMap: [
      "........", "........", "...ff...", "........",
      "........", "...ff...", "........", "........",
    ],
  },
  {
    id: 22, name: "Ramverkets ruin", moves: 23,
    goals: [{ type: "clear", obstacle: "frame", amount: 6 }],
    obstacleMap: [
      "........", "........", "..f..f..", "........",
      "........", "..f..f..", "........", "........",
    ],
  },
  {
    id: 23, name: "Stålpanelerna", moves: 23,
    goals: [
      { type: "clear", obstacle: "frame", amount: 6 },
      { type: "clear", obstacle: "ink", amount: 4 },
    ],
    obstacleMap: [
      "........", "..f..f..", "........", "...ii...",
      "...ii...", "........", "..f..f..", "........",
    ],
  },
  {
    id: 24, name: "Mekanisk manga", moves: 22,
    goals: [
      { type: "clear", obstacle: "frame", amount: 8 },
      { type: "clear", obstacle: "ink", amount: 6 },
    ],
    obstacleMap: [
      ".i....i.", "...ff...", "..f..f..", ".f.ii.f.",
      ".f.ii.f.", "..f..f..", "...ff...", ".i....i.",
    ],
  },
  {
    id: 25, name: "Fängelseön", moves: 22,
    goals: [
      { type: "unlock", amount: 6 },
      { type: "clear", obstacle: "frame", amount: 6 },
    ],
    obstacleMap: [
      "........", "...ff...", "..f..f..", "........",
      "........", "..f..f..", "...ff...", "........",
    ],
    lockMap: [
      "........", "........", "........", "..l..l..",
      "..l..l..", "........", "........", "........",
    ],
  },
  {
    id: 26, name: "Skuggpalatset", moves: 21,
    goals: [
      { type: "score", amount: 3800 },
      { type: "clear", obstacle: "ink", amount: 8 },
      { type: "unlock", amount: 6 },
    ],
    obstacleMap: [
      "........", ".i....i.", "..i..i..", "...ii...",
      "...ii...", "..i..i..", ".i....i.", "........",
    ],
    lockMap: [
      "........", "........", ".l....l.", "........",
      "........", ".l....l.", "........", "........",
    ],
  },
  {
    id: 27, name: "Shogunens port", moves: 21,
    goals: [
      { type: "unlock", amount: 7 },
      { type: "clear", obstacle: "frame", amount: 8 },
      { type: "score", amount: 4200 },
    ],
    obstacleMap: [
      "i..ff..i", ".i....i.", "..fiif..", ".f....f.",
      ".f....f.", "..fiif..", ".i....i.", "i..ff..i",
    ],
    lockMap: [
      "........", "..l..l..", ".l....l.", "........",
      "........", ".l....l.", "..l..l..", "........",
    ],
  },
  {
    id: 28, name: "Kaosbiblioteket", moves: 20,
    goals: [
      { type: "collect", tile: "star", amount: 14 },
      { type: "clear", obstacle: "frame", amount: 8 },
      { type: "clear", obstacle: "ink", amount: 8 },
    ],
    obstacleMap: [
      "..f..f..", ".i....i.", "f..ii..f", "........",
      "........", "f..ii..f", ".i....i.", "..f..f..",
    ],
  },
  {
    id: 29, name: "Demonkungen", moves: 20,
    goals: [
      { type: "score", amount: 5000 },
      { type: "unlock", amount: 8 },
      { type: "clear", obstacle: "frame", amount: 8 },
    ],
    obstacleMap: [
      ".f.ff.f.", "........", "f......f", ".f.ii.f.",
      ".f.ii.f.", "f......f", "........", ".f.ff.f.",
    ],
    lockMap: [
      "........", ".l.ll.l.", "........", "........",
      "........", "........", ".l.ll.l.", "........",
    ],
  },
  {
    id: 30, name: "Finalpanelen", moves: 19,
    goals: [
      { type: "score", amount: 5600 },
      { type: "collect", tile: "star", amount: 14 },
      { type: "clear", obstacle: "frame", amount: 10 },
      { type: "unlock", amount: 8 },
    ],
    obstacleMap: [
      "if.ff.fi", ".i....i.", "ff....ff", ".f.iif..",
      ".f.iif..", "ff....ff", ".i....i.", "if.ff.fi",
    ],
    lockMap: [
      "..l..l..", "...ll...", "........", ".l....l.",
      ".l....l.", "........", "...ll...", "........",
    ],
  },
];

const POWERUPS = [
  { id: "ink_blast", name: "Manga-Bläck", icon: "墨", desc: "Förstör alla brickor av en vald färg", cost: 80, type: "active" },
  { id: "extra_moves", name: "Tidshopp", icon: "+3", desc: "+3 extra drag", cost: 60, type: "pre" },
  { id: "fever_start", name: "Shōnen Boost", icon: "炎", desc: "Starta med 50% fever", cost: 100, type: "pre" },
  { id: "bomb_3x3", name: "Panelbrytare", icon: "💥", desc: "Förstör ett 3×3-område", cost: 120, type: "active" },
  { id: "sensei", name: "Sensei-blick", icon: "目", desc: "Visa bästa drag i 10s", cost: 40, type: "active" },
];

const COIN_REWARDS = {
  STAR_1: 50,
  STAR_2: 80,
  STAR_3: 150,
  DAILY_BASE: 100,
  DAILY_STREAK_BONUS: 30,
};

class MangaMatch3 {
  constructor() {
    this.boardEl = document.getElementById("board");
    this.hudPanelEl = document.querySelector(".hud-panel");
    this.boardPanelEl = document.querySelector(".board-panel");
    this.sfxTagEl = document.querySelector(".sfx-tag");
    this.fxLayerEl = document.getElementById("fxLayer");
    this.scoreEl = document.getElementById("score");
    this.levelEl = document.getElementById("level");
    this.movesEl = document.getElementById("moves");
    this.comboEl = document.getElementById("combo");
    this.feverMeterEl = document.getElementById("feverMeter");
    this.feverFillEl = document.getElementById("feverFill");
    this.feverPercentEl = document.getElementById("feverPercent");
    this.feverStateEl = document.getElementById("feverState");
    this.feverTurnsEl = document.getElementById("feverTurns");
    this.dailyPanelEl = document.getElementById("dailyPanel");
    this.dailyTaskEl = document.getElementById("dailyTask");
    this.dailyProgressEl = document.getElementById("dailyProgress");
    this.dailyFillEl = document.getElementById("dailyFill");
    this.dailyCountEl = document.getElementById("dailyCount");
    this.dailyStreakEl = document.getElementById("dailyStreak");
    this.dailyRewardEl = document.getElementById("dailyReward");
    this.statusEl = document.getElementById("status");
    this.goalsListEl = document.getElementById("goalsList");
    this.comboBurstEl = document.getElementById("comboBurst");
    this.mScoreEl = document.getElementById("mScore");
    this.mMovesEl = document.getElementById("mMoves");
    this.mComboEl = document.getElementById("mCombo");
    this.mLevelEl = document.getElementById("mLevel");
    this.restartBtn = document.getElementById("restartBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.shuffleBtn = document.getElementById("shuffleBtn");
    this.resultOverlay = document.getElementById("resultOverlay");
    this.resultTitle = document.getElementById("resultTitle");
    this.resultBody = document.getElementById("resultBody");
    this.resultRetryBtn = document.getElementById("resultRetryBtn");
    this.resultNextBtn = document.getElementById("resultNextBtn");
    this.levelSelectEl = document.getElementById("levelSelect");
    this.levelMapEl = document.getElementById("levelMap");
    this.gameShellEl = document.querySelector(".game-shell");
    this.resultStarsEl = document.getElementById("resultStars");
    this.resultConfettiEl = document.getElementById("resultConfetti");

    this.levelIndex = 0;
    this.currentLevel = null;
    this.board = [];
    this.obstacles = [];
    this.spawnOffsets = new Map();
    this.cellNodes = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    this.cellParts = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    this.cellHashes = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(""));

    this.score = 0;
    this.moves = 0;
    this.combo = 1;
    this.selected = null;
    this.busy = false;
    this.levelComplete = false;
    this.feverCharge = 0;
    this.feverActive = false;
    this.feverTurnsLeft = 0;
    this.feverActivatedThisTurn = false;

    // Shop & power-ups
    this.shopData = this.loadShopData();
    this.activePowerups = [];
    this.bomb3x3Pending = false;
    this.inkBlastPending = false;

    this.dailyState = null;
    this.pendingDailyReward = null;
    this.dailyRewardStatus = "";
    this.dailyProgressDirty = false;
    this.comboBurstToken = 0;
    this.comboBurstVisible = false;
    this.comboBurstQueue = [];
    this.comboBurstTimer = null;
    this.hintTimer = null;
    this.hintedCells = [];

    this.collectCounts = Array(TILE_TYPES.length).fill(0);
    this.clearedObstacleCounts = { ink: 0, frame: 0 };
    this.unlockedCount = 0;

    this.initializeDailyLoop();
    this.setupBoardGrid();

    this.boardEl.addEventListener("click", (event) => {
      sfx.init();
      this.clearHint();
      this.onTileClick(event);
    });
    this.restartBtn.addEventListener("click", () => this.resetCurrentLevel());
    this.nextBtn.addEventListener("click", () => this.goToNextLevel());
    this.shuffleBtn.addEventListener("click", () => this.manualShuffle());
    this.resultRetryBtn.addEventListener("click", () => {
      this.hideResultOverlay();
      this.resetCurrentLevel();
    });
    this.resultNextBtn.addEventListener("click", () => {
      this.hideResultOverlay();
      this.goToNextLevel();
    });
    this.resultMapBtn = document.getElementById("resultMapBtn");
    this.resultMapBtn.addEventListener("click", () => {
      this.hideResultOverlay();
      this.showLevelSelect();
    });
    this.mapBtn = document.getElementById("mapBtn");
    this.mapBtn.addEventListener("click", () => this.showLevelSelect());

    this.swipeStart = null;
    this.swipeThreshold = 30;
    this.boardEl.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    this.boardEl.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    this.boardEl.addEventListener("touchend", (e) => this.onTouchEnd(e));

    this.initLevelPicker();
    this.initShop();
    this.initPrepScreen();
    this.updateCoinHUD();
    this.initTutorial();
    this.initMainMenu();
  }

  /* ── Main Menu ── */

  initMainMenu() {
    this.mainMenuEl = document.getElementById("mainMenu");
    this.optionsOverlay = document.getElementById("optionsOverlay");
    this.highscoreOverlay = document.getElementById("highscoreOverlay");
    this.achievementsOverlay = document.getElementById("achievementsOverlay");
    this.creditsOverlay = document.getElementById("creditsOverlay");

    document.getElementById("menuStartBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.mainMenuEl.hidden = true;
      this.showLevelSelect();
    });

    document.getElementById("menuOptionsBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.showOptions();
    });

    document.getElementById("menuHighscoreBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.showHighscores();
    });

    document.getElementById("menuAchievementsBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.showAchievements();
    });

    this.howtoOverlay = document.getElementById("howtoOverlay");
    document.getElementById("menuHowtoBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.howtoOverlay.hidden = false;
    });

    document.getElementById("menuTutorialBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.mainMenuEl.hidden = true;
      this.hideLevelSelect();
      this.loadLevel(0);
      window.setTimeout(() => this.startTutorial(), 400);
    });

    document.getElementById("menuCreditsBtn").addEventListener("click", () => {
      sfx.init();
      sfx.uiClick();
      this.creditsOverlay.hidden = false;
    });

    // Back buttons
    document.getElementById("optBackBtn").addEventListener("click", () => {
      sfx.uiClick();
      this.optionsOverlay.hidden = true;
    });
    document.getElementById("hsBackBtn").addEventListener("click", () => {
      sfx.uiClick();
      this.highscoreOverlay.hidden = true;
    });
    document.getElementById("achBackBtn").addEventListener("click", () => {
      sfx.uiClick();
      this.achievementsOverlay.hidden = true;
    });
    document.getElementById("credBackBtn").addEventListener("click", () => {
      sfx.uiClick();
      this.creditsOverlay.hidden = true;
    });
    document.getElementById("howtoBackBtn").addEventListener("click", () => {
      sfx.uiClick();
      this.howtoOverlay.hidden = true;
    });

    // Options controls
    const soundBtn = document.getElementById("optSoundBtn");
    soundBtn.textContent = sfx.muted ? "AV" : "PÅ";
    soundBtn.addEventListener("click", () => {
      const muted = sfx.toggleMute();
      soundBtn.textContent = muted ? "AV" : "PÅ";
    });

    const volRange = document.getElementById("optVolumeRange");
    volRange.value = Math.round(sfx.volume * 100);
    volRange.addEventListener("input", () => {
      sfx.setVolume(volRange.value / 100);
    });

    const resetBtn = document.getElementById("optResetBtn");
    resetBtn.addEventListener("click", () => {
      if (this.confirmReset) {
        window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
        window.localStorage.removeItem(SHOP_STORAGE_KEY);
        window.localStorage.removeItem(DAILY_STORAGE_KEY);
        window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        resetBtn.textContent = "Raderat!";
        this.confirmReset = false;
        window.setTimeout(() => { resetBtn.textContent = "Radera"; }, 2000);
      } else {
        this.confirmReset = true;
        resetBtn.textContent = "Säker? Tryck igen";
        window.setTimeout(() => {
          if (this.confirmReset) {
            this.confirmReset = false;
            resetBtn.textContent = "Radera";
          }
        }, 3000);
      }
    });
    this.confirmReset = false;
  }

  showMainMenu() {
    this.clearHint();
    this.gameShellEl.hidden = true;
    this.closeLevelPicker();
    this.levelSelectEl.hidden = true;
    this.mainMenuEl.hidden = false;
  }

  showOptions() {
    this.optionsOverlay.hidden = false;
  }

  showHighscores() {
    const list = document.getElementById("highscoreList");
    list.innerHTML = "";
    const progress = this.loadProgress();
    let hasAny = false;

    for (const level of LEVELS) {
      const p = progress[`level-${level.id}`];
      if (!p) continue;
      hasAny = true;

      const row = document.createElement("div");
      row.className = "highscore-row";

      let starsHtml = "";
      for (let s = 0; s < 3; s++) {
        starsHtml += s < (p.bestStars ?? 0) ? "★" : "☆";
      }

      row.innerHTML = `
        <span class="highscore-row__level">${level.id}. ${level.name}</span>
        <span class="highscore-row__stars">${starsHtml}</span>
        <span class="highscore-row__score">${p.bestScore.toLocaleString("sv")} p</span>
      `;
      list.append(row);
    }

    if (!hasAny) {
      list.innerHTML = `<p class="highscore-empty">Inga poäng ännu. Spela en bana!</p>`;
    }

    this.highscoreOverlay.hidden = false;
  }

  showAchievements() {
    const list = document.getElementById("achievementsList");
    list.innerHTML = `<p class="highscore-empty">Kommer snart!</p>`;
    this.achievementsOverlay.hidden = false;
  }

  setupBoardGrid() {
    this.boardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    this.boardEl.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

    const nodes = [];
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tile";
        button.dataset.row = String(r);
        button.dataset.col = String(c);
        button.setAttribute("aria-label", "Tom ruta");
        button.disabled = true;
        const parts = this.createCellParts();
        this.cellParts[r][c] = parts;
        button.append(
          parts.moodAura,
          parts.sprite,
          parts.moodMark,
          parts.specialChip,
          parts.lockMark,
          parts.inkLayer,
          parts.frameIcon,
          parts.frameLayer
        );
        this.cellNodes[r][c] = button;
        nodes.push(button);
      }
    }
    this.boardEl.replaceChildren(...nodes);
  }

  getCellNode(row, col) {
    return this.cellNodes[row]?.[col] ?? null;
  }

  getCellParts(row, col) {
    return this.cellParts[row]?.[col] ?? null;
  }

  createCellParts() {
    const moodAura = document.createElement("span");
    moodAura.className = "mood-aura mood-aura-0";
    moodAura.hidden = true;

    const sprite = document.createElement("span");
    sprite.className = "sprite sprite--tile sprite-sakura mood-0";
    sprite.style.setProperty("--mood", "0");
    sprite.hidden = true;

    const moodMark = document.createElement("span");
    moodMark.hidden = true;
    moodMark.setAttribute("aria-hidden", "true");

    const specialChip = document.createElement("span");
    specialChip.hidden = true;

    const lockMark = document.createElement("span");
    lockMark.className = "lock-mark";
    const lockSprite = document.createElement("span");
    lockSprite.className = "sprite sprite--badge sprite-lock";
    lockMark.append(lockSprite);
    lockMark.hidden = true;

    const inkLayer = document.createElement("span");
    inkLayer.className = "ink-layer";
    const inkSprite = document.createElement("span");
    inkSprite.className = "sprite sprite--badge sprite-ink-badge";
    const inkCount = document.createElement("span");
    inkCount.className = "layer-count";
    inkCount.textContent = "0";
    inkLayer.append(inkSprite, inkCount);
    inkLayer.hidden = true;

    const frameIcon = document.createElement("span");
    frameIcon.className = "frame-icon sprite sprite--badge sprite-frame-badge";
    frameIcon.hidden = true;

    const frameLayer = document.createElement("span");
    frameLayer.className = "frame-layer";
    frameLayer.textContent = "0";
    frameLayer.hidden = true;

    return {
      moodAura,
      sprite,
      moodMark,
      specialChip,
      lockMark,
      inkLayer,
      inkCount,
      frameIcon,
      frameLayer,
    };
  }

  loadLevel(index) {
    this.levelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
    this.currentLevel = LEVELS[this.levelIndex];

    this.score = 0;
    this.moves = this.currentLevel.moves;
    this.combo = 1;
    this.resetFever();
    this.selected = null;
    this.busy = false;
    this.levelComplete = false;
    this.bomb3x3Pending = false;
    this.inkBlastPending = false;

    this.collectCounts = Array(TILE_TYPES.length).fill(0);
    this.clearedObstacleCounts = { ink: 0, frame: 0 };
    this.unlockedCount = 0;

    this.buildObstacleGrid(this.currentLevel.obstacleMap);
    this.initBoard();
    this.applyLockMap(this.currentLevel.lockMap);
    this.applyPendingDailyReward();

    this.updateHUD();
    this.renderDailyPanel();
    this.renderGoals();
    const stageStatus = `Bana ${this.currentLevel.id}: ${this.currentLevel.name}`;
    if (this.dailyRewardStatus) {
      this.setStatus(`${stageStatus} | ${this.dailyRewardStatus}`);
      this.showComboBurst("DAILY BONUS");
      this.dailyRewardStatus = "";
    } else {
      this.setStatus(stageStatus);
    }
    this.showComboBurst(`STAGE ${this.currentLevel.id}`);
    this.spawnOffsets.clear();
    this.invalidateAllCells();
    this.fxLayerEl?.replaceChildren();
    this.hideResultOverlay();
    this.hideLevelSelect();
    this.render();
    this.scheduleHint();
    this.maybeTutorial();
  }

  resetCurrentLevel() {
    this.activePowerups = [];
    this.loadLevel(this.levelIndex);
    this.renderActivePowerupBar();
  }

  goToNextLevel() {
    if (!this.levelComplete) return;
    if (this.levelIndex >= LEVELS.length - 1) {
      this.showLevelSelect();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
  }

  showLevelSelect() {
    this.clearHint();
    this.mainMenuEl.hidden = true;
    this.gameShellEl.hidden = true;
    this.levelSelectEl.hidden = true;
    this.openLevelPicker();
  }

  hideLevelSelect() {
    this.levelSelectEl.hidden = true;
    this.closeLevelPicker();
    this.gameShellEl.hidden = false;
  }

  isLevelUnlocked(index) {
    if (index === 0) return true;
    const prevLevel = LEVELS[index - 1];
    const prev = this.getLevelProgress(prevLevel.id);
    return prev !== null && prev.bestStars > 0;
  }

  renderLevelMap() {
    this.levelMapEl.replaceChildren();
    for (let i = 0; i < LEVELS.length; i += 1) {
      const level = LEVELS[i];
      const progress = this.getLevelProgress(level.id);
      const unlocked = this.isLevelUnlocked(i);

      const node = document.createElement("div");
      node.className = `level-node${unlocked ? "" : " locked"}`;

      const num = document.createElement("span");
      num.className = "level-node__number";
      num.textContent = level.id;

      const name = document.createElement("span");
      name.className = "level-node__name";
      name.textContent = level.name;

      const stars = document.createElement("div");
      stars.className = "level-node__stars";
      const earned = progress?.bestStars ?? 0;
      for (let s = 0; s < 3; s += 1) {
        const star = document.createElement("span");
        star.className = s < earned ? "star-earned" : "star-empty";
        star.textContent = "★";
        stars.append(star);
      }

      const best = document.createElement("span");
      best.className = "level-node__best";
      if (unlocked && progress) {
        best.textContent = `Bästa: ${progress.bestScore.toLocaleString("sv")} p`;
      } else if (!unlocked) {
        best.textContent = "";
      }

      node.append(num, name, stars, best);

      if (unlocked) {
        node.addEventListener("click", () => {
          this.hideLevelSelect();
          this.loadLevel(i);
        });
      }

      this.levelMapEl.append(node);
    }
  }

  buildObstacleGrid(obstacleMap) {
    this.obstacles = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    if (!obstacleMap) return;

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      const rowText = obstacleMap[r] ?? ".".repeat(BOARD_SIZE);
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const char = rowText[c] ?? ".";
        if (char === "i") {
          this.obstacles[r][c] = { kind: "ink", layers: 2 };
        } else if (char === "f") {
          this.obstacles[r][c] = { kind: "frame", layers: 2 };
        }
      }
    }
  }

  initBoard() {
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (this.isFrameCell(r, c)) continue;
        this.board[r][c] = this.createRandomTile();
      }
    }

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (!this.board[r][c]) continue;
        while (this.formsInitialMatch(r, c, this.board[r][c].type)) {
          this.board[r][c] = this.createRandomTile();
        }
      }
    }

    if (!this.hasAnyPossibleMove()) {
      this.shuffleBoard(true);
    }
  }

  applyLockMap(lockMap) {
    if (!lockMap) return;
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      const rowText = lockMap[r] ?? ".".repeat(BOARD_SIZE);
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (rowText[c] === "l" && this.board[r][c]) {
          this.board[r][c].locked = true;
        }
      }
    }
  }

  createRandomTile(typeOverride) {
    const type = typeOverride ?? Math.floor(Math.random() * TILE_TYPES.length);
    return { type, special: null, locked: false, mood: this.randomMood() };
  }

  randomMood() {
    return Math.floor(Math.random() * MOOD_VARIANTS);
  }

  formsInitialMatch(r, c, type) {
    const leftA = this.board[r][c - 1];
    const leftB = this.board[r][c - 2];
    const topA = this.board[r - 1]?.[c];
    const topB = this.board[r - 2]?.[c];

    const leftTwoMatch = Boolean(leftA && leftB && leftA.type === type && leftB.type === type);
    const topTwoMatch = Boolean(topA && topB && topA.type === type && topB.type === type);
    return leftTwoMatch || topTwoMatch;
  }

  onTileClick(event) {
    const tileButton = event.target.closest(".tile");
    if (!tileButton || this.busy || this.levelComplete || this.tutActive) return;

    const row = Number(tileButton.dataset.row);
    const col = Number(tileButton.dataset.col);
    if (!this.inBounds(row, col)) return;

    // Handle active power-up targeting
    if ((this.bomb3x3Pending || this.inkBlastPending) && this.handlePowerupClick(row, col)) return;

    if (this.isFrameCell(row, col) || !this.board[row][col]) return;

    const pos = { row, col };

    if (!this.selected) {
      if (!this.canSelectCell(pos)) {
        this.setStatus("Låsta brickor kan inte flyttas.");
        return;
      }
      this.selected = pos;
      sfx.select();
      this.render();
      return;
    }

    if (this.selected.row === row && this.selected.col === col) {
      this.selected = null;
      sfx.deselect();
      this.render();
      return;
    }

    if (!this.isAdjacent(this.selected, pos)) {
      if (this.canSelectCell(pos)) {
        this.selected = pos;
      } else {
        this.setStatus("Välj en olåst bricka.");
      }
      this.render();
      return;
    }

    if (!this.canSwap(this.selected, pos)) {
      this.selected = null;
      this.setStatus("Det draget är låst.");
      this.render();
      return;
    }

    this.swapAttempt(this.selected, pos);
  }

  getTilePosFromTouch(touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return null;
    const tileButton = el.closest(".tile");
    if (!tileButton) return null;
    const row = Number(tileButton.dataset.row);
    const col = Number(tileButton.dataset.col);
    if (!this.inBounds(row, col) || this.isFrameCell(row, col) || !this.board[row][col]) return null;
    return { row, col };
  }

  onTouchStart(event) {
    sfx.init();
    if (this.busy || this.levelComplete || this.tutActive) return;
    const touch = event.touches[0];
    const pos = this.getTilePosFromTouch(touch);
    if (!pos) return;
    event.preventDefault();
    this.clearHint();
    this.swipeStart = { x: touch.clientX, y: touch.clientY, row: pos.row, col: pos.col };
  }

  onTouchMove(event) {
    if (!this.swipeStart) return;
    event.preventDefault();
  }

  onTouchEnd(event) {
    if (!this.swipeStart) return;
    this.clearHint();
    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.swipeStart.x;
    const dy = touch.clientY - this.swipeStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const startPos = { row: this.swipeStart.row, col: this.swipeStart.col };
    this.swipeStart = null;

    if (absDx < this.swipeThreshold && absDy < this.swipeThreshold) {
      this.onTileClick({ target: this.cellNodes[startPos.row][startPos.col] });
      return;
    }

    let targetRow = startPos.row;
    let targetCol = startPos.col;
    if (absDx > absDy) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (!this.inBounds(targetRow, targetCol) || this.isFrameCell(targetRow, targetCol) || !this.board[targetRow][targetCol]) {
      return;
    }

    const target = { row: targetRow, col: targetCol };
    if (!this.canSelectCell(startPos)) {
      this.setStatus("Låsta brickor kan inte flyttas.");
      return;
    }
    if (!this.canSwap(startPos, target)) {
      this.setStatus("Det draget är låst.");
      return;
    }

    this.selected = null;
    this.swapAttempt(startPos, target);
  }

  canSelectCell(pos) {
    const tile = this.board[pos.row][pos.col];
    return Boolean(tile && !tile.locked);
  }

  canSwap(a, b) {
    return this.canSelectCell(a) && this.canSelectCell(b);
  }

  isAdjacent(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  swapTiles(a, b) {
    const temp = this.board[a.row][a.col];
    this.board[a.row][a.col] = this.board[b.row][b.col];
    this.board[b.row][b.col] = temp;
  }

  async swapAttempt(a, b) {
    if (this.busy || this.levelComplete) return;
    this.busy = true;
    this.selected = null;

    this.swapTiles(a, b);
    this.render();
    sfx.swap();
    await this.animatePositions([a, b], "swap-pop", TIMING.SWAP_MS);

    const tileA = this.board[a.row][a.col];
    const tileB = this.board[b.row][b.col];
    const includesSpecial = Boolean(tileA.special || tileB.special);
    const found = this.findMatches();

    if (!includesSpecial && found.matchSet.size === 0) {
      sfx.invalidSwap();
      await this.animatePositions([a, b], "swap-deny", TIMING.INVALID_MS);
      this.swapTiles(a, b);
      this.busy = false;
      this.setStatus(this.charQuote("miss"));
      this.render();
      this.scheduleHint();
      return;
    }

    this.moves -= 1;

    if (includesSpecial) {
      await this.resolveSpecialSwap(a, b);
    } else {
      await this.resolveCascade({ lastSwap: [a, b] });
    }

    this.consumeFeverTurn();
    this.combo = 1;
    this.postTurnChecks();
    this.busy = false;
    this.render();
    this.scheduleHint();
  }

  async resolveSpecialSwap(a, b) {
    const tileA = this.board[a.row][a.col];
    const tileB = this.board[b.row][b.col];
    const clearSet = new Set();
    let impactLevel = 2;

    const isColorA = tileA.special === SPECIAL.COLOR;
    const isColorB = tileB.special === SPECIAL.COLOR;

    if (isColorA && isColorB) {
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (!this.isFrameCell(r, c)) clearSet.add(this.key(r, c));
        }
      }
      this.setStatus(this.charQuote("mega"));
      this.showComboBurst("MEGA!");
      this.flashSfxTag("ドカーン!");
      sfx.colorBlast();
      impactLevel = 3;
    } else if (isColorA) {
      this.collectTilesByType(tileB.type, clearSet);
      clearSet.add(this.key(a.row, a.col));
      this.setStatus(this.charQuote("color"));
      this.showComboBurst("COLOR!");
      this.flashSfxTag("ズバッ!");
      sfx.colorBlast();
    } else if (isColorB) {
      this.collectTilesByType(tileA.type, clearSet);
      clearSet.add(this.key(b.row, b.col));
      this.setStatus(this.charQuote("color"));
      this.showComboBurst("COLOR!");
      this.flashSfxTag("ズバッ!");
      sfx.colorBlast();
    } else {
      this.addSpecialArea(a.row, a.col, tileA.special, clearSet);
      this.addSpecialArea(b.row, b.col, tileB.special, clearSet);
      clearSet.add(this.key(a.row, a.col));
      clearSet.add(this.key(b.row, b.col));
      this.setStatus(this.charQuote("chain"));
      this.showComboBurst("CHAIN!");
      const hasBomb = tileA.special === SPECIAL.BOMB || tileB.special === SPECIAL.BOMB;
      const hasLine = [tileA.special, tileB.special].some(s => s === SPECIAL.LINE_H || s === SPECIAL.LINE_V);
      if (hasBomb) { sfx.bombBlast(); this.flashSfxTag("ボカン!"); }
      else if (hasLine) { sfx.lineBlast(); this.flashSfxTag("シュッ!"); }
      else sfx.match(2);
      impactLevel = 2 + Number(hasBomb);
    }

    const reactionSet = this.collectNeighborReactionSet(clearSet);
    this.triggerKeySet(reactionSet, "neighbor-nudge");
    await this.animateKeySet(clearSet, "clear-pop", TIMING.CLEAR_MS);
    this.spawnDualSweepFX(a, b, impactLevel);
    this.spawnImpactFX(clearSet, "mega");
    this.flashBoard(impactLevel);
    this.triggerPanelBoost(impactLevel);
    this.triggerImpactChain(impactLevel);
    const gained = this.clearTiles(clearSet, new Map(), clearSet);
    this.spawnScorePopup(clearSet, gained, 2);
    await this.applyGravityAnimated();
    const spawned = this.fillEmptyTiles();
    this.render();
    await this.animateKeySet(spawned, "spawn-enter", TIMING.SPAWN_MS);
    this.consumeSpawnOffsets(spawned);
    this.spawnImpactFX(spawned, "spawn");
    await this.sleep(TIMING.CASCADE_MS);
    await this.resolveCascade();
  }

  async resolveCascade({ lastSwap = null } = {}) {
    let chain = 0;
    let localLastSwap = lastSwap;

    while (true) {
      const found = this.findMatches();
      if (found.matchSet.size === 0) break;

      chain += 1;
      this.combo = 1 + Math.min(2, chain * 0.25);
      if (chain === 1) {
        sfx.match(chain);
        this.flashSfxTag("パキッ!");
      } else {
        sfx.cascade(chain);
        const chainTags = ["すごい!", "やった!", "最高!", "鬼!", "神!"];
        this.flashSfxTag(chainTags[Math.min(chain - 2, chainTags.length - 1)]);
      }

      const specialMap = this.determineSpecials(found.runs, localLastSwap);
      if (specialMap.size > 0) {
        sfx.specialCreate();
        this.flashSfxTag("キラッ!");
      }
      const clearSet = this.expandClearBySpecial(found.matchSet);
      const filteredSpecialMap = this.applySpecialMapToClearSet(specialMap, clearSet);
      const impactSet = new Set([...clearSet, ...filteredSpecialMap.keys()]);
      const fxType = impactSet.size >= 8 ? "mega" : "clear";
      const impactLevel = Math.min(3, Math.max(1, Math.floor(impactSet.size / 5)));

      const reactionSet = this.collectNeighborReactionSet(impactSet);
      this.triggerKeySet(reactionSet, "neighbor-nudge");
      await this.animateKeySet(impactSet, "clear-pop", TIMING.CLEAR_MS);
      this.spawnRunSweeps(found.runs, impactLevel);
      this.spawnImpactFX(impactSet, fxType);
      const heavyImpact = impactSet.size >= 6 || chain >= 2;
      if (chain >= 2) this.triggerSpeedLines();
      if (heavyImpact) {
        this.flashBoard(impactLevel);
        this.triggerPanelBoost(Math.min(3, Math.max(1, Math.floor(impactSet.size / 6))));
        this.triggerImpactChain(impactLevel);
      } else {
        this.pulseBoard(1);
      }
      const gained = this.clearTiles(clearSet, filteredSpecialMap, impactSet);
      this.spawnScorePopup(impactSet, gained, chain);
      await this.applyGravityAnimated();
      const spawned = this.fillEmptyTiles();
      this.render();
      if (spawned.length > 0) sfx.spawn();
      await this.animateKeySet(spawned, "spawn-enter", TIMING.SPAWN_MS);
      this.consumeSpawnOffsets(spawned);
      this.spawnImpactFX(spawned, "spawn");
      await this.sleep(TIMING.CASCADE_MS);

      localLastSwap = null;
    }

    if (chain > 1) {
      this.recordDailyProgress("chain", 1);
      this.syncDailyProgress();
      this.setStatus(this.charQuote("combo"));
      this.showComboBurst(`${chain} CHAIN`);
    } else if (chain === 1) {
      this.setStatus(this.charQuote("hit"));
    }
  }

  findMatches() {
    const runs = [];
    const matched = new Set();

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      let c = 0;
      while (c < BOARD_SIZE) {
        const current = this.board[r][c];
        if (!current) {
          c += 1;
          continue;
        }

        let end = c + 1;
        while (end < BOARD_SIZE && this.board[r][end]?.type === current.type) {
          end += 1;
        }

        const length = end - c;
        if (length >= 3) {
          const cells = [];
          for (let x = c; x < end; x += 1) {
            cells.push({ row: r, col: x });
            matched.add(this.key(r, x));
          }
          runs.push({ cells, orientation: "h", length });
        }
        c = end;
      }
    }

    for (let c = 0; c < BOARD_SIZE; c += 1) {
      let r = 0;
      while (r < BOARD_SIZE) {
        const current = this.board[r][c];
        if (!current) {
          r += 1;
          continue;
        }

        let end = r + 1;
        while (end < BOARD_SIZE && this.board[end][c]?.type === current.type) {
          end += 1;
        }

        const length = end - r;
        if (length >= 3) {
          const cells = [];
          for (let x = r; x < end; x += 1) {
            cells.push({ row: x, col: c });
            matched.add(this.key(x, c));
          }
          runs.push({ cells, orientation: "v", length });
        }
        r = end;
      }
    }

    return { runs, matchSet: matched };
  }

  determineSpecials(runs, lastSwap) {
    const map = new Map();
    const horizontal = runs.filter((run) => run.orientation === "h");
    const vertical = runs.filter((run) => run.orientation === "v");

    for (const hRun of horizontal) {
      for (const vRun of vertical) {
        const intersection = hRun.cells.find((hCell) =>
          vRun.cells.some((vCell) => vCell.row === hCell.row && vCell.col === hCell.col)
        );
        if (!intersection) continue;
        const tile = this.board[intersection.row][intersection.col];
        if (!tile) continue;
        map.set(this.key(intersection.row, intersection.col), {
          special: SPECIAL.BOMB,
          type: tile.type,
          mood: tile.mood ?? this.randomMood(),
        });
      }
    }

    for (const run of runs) {
      if (run.length < 4) continue;

      const cell = this.pickSpecialCell(run, lastSwap);
      const tile = this.board[cell.row][cell.col];
      if (!tile) continue;

      if (run.length >= 5) {
        map.set(this.key(cell.row, cell.col), {
          special: SPECIAL.COLOR,
          type: tile.type,
          mood: tile.mood ?? this.randomMood(),
        });
        continue;
      }

      if (!map.has(this.key(cell.row, cell.col))) {
        map.set(this.key(cell.row, cell.col), {
          special: run.orientation === "h" ? SPECIAL.LINE_H : SPECIAL.LINE_V,
          type: tile.type,
          mood: tile.mood ?? this.randomMood(),
        });
      }
    }

    return map;
  }

  pickSpecialCell(run, lastSwap) {
    const candidates = [];

    if (lastSwap) {
      for (const moved of lastSwap) {
        if (run.cells.some((cell) => cell.row === moved.row && cell.col === moved.col)) {
          candidates.push(moved);
        }
      }
    }

    for (const cell of run.cells) {
      candidates.push(cell);
    }

    for (const candidate of candidates) {
      const tile = this.board[candidate.row][candidate.col];
      if (tile && !tile.locked) return candidate;
    }

    return run.cells[Math.floor(run.cells.length / 2)];
  }

  expandClearBySpecial(initialSet) {
    const clearSet = new Set(initialSet);
    const queue = [...initialSet];
    const seen = new Set();

    while (queue.length > 0) {
      const key = queue.shift();
      if (seen.has(key)) continue;
      seen.add(key);

      const [row, col] = this.fromKey(key);
      const tile = this.board[row][col];
      if (!tile || !tile.special) continue;

      if (tile.special === SPECIAL.COLOR) {
        this.collectTilesByType(tile.type, clearSet);
        continue;
      }

      const temp = new Set();
      this.addSpecialArea(row, col, tile.special, temp);
      for (const tempKey of temp) {
        if (!clearSet.has(tempKey)) {
          clearSet.add(tempKey);
          queue.push(tempKey);
        }
      }
    }

    return clearSet;
  }

  applySpecialMapToClearSet(specialMap, clearSet) {
    const filtered = new Map();
    for (const [key, value] of specialMap.entries()) {
      const [row, col] = this.fromKey(key);
      const tile = this.board[row][col];
      if (!tile || tile.locked) continue;
      clearSet.delete(key);
      filtered.set(key, value);
    }
    return filtered;
  }

  clearTiles(clearSet, specialMap = new Map(), impactSet = clearSet) {
    let cleared = 0;
    const clearedByType = Array(TILE_TYPES.length).fill(0);

    for (const key of clearSet) {
      const [row, col] = this.fromKey(key);
      const tile = this.board[row][col];
      if (!tile) continue;

      this.collectCounts[tile.type] += 1;
      clearedByType[tile.type] += 1;
      if (tile.locked) this.unlockedCount += 1;

      this.board[row][col] = null;
      cleared += 1;
    }

    for (const [key, value] of specialMap.entries()) {
      const [row, col] = this.fromKey(key);
      if (this.isFrameCell(row, col)) continue;
      if (!this.board[row][col]) {
        this.board[row][col] = this.createRandomTile(value.type);
      }
      this.board[row][col].type = value.type;
      this.board[row][col].special = value.special;
      this.board[row][col].locked = false;
      this.board[row][col].mood = value.mood ?? this.randomMood();
    }

    this.applyImpactEffects(impactSet);

    const feverMultiplier = this.feverActive ? FEVER.SCORE_MULTIPLIER : 1;
    const basePoints = Math.floor(cleared * BASE_POINTS * this.combo * feverMultiplier);
    let bonusPoints = 0;
    if (specialMap.size > 0) {
      bonusPoints += Math.floor(specialMap.size * 220 * feverMultiplier);
    }
    const gained = basePoints + bonusPoints;
    this.score += gained;
    const feverGain = this.computeFeverGain(cleared, specialMap.size);
    this.addFeverCharge(feverGain);
    this.recordDailyProgress("clear", cleared);
    this.recordDailyProgress("special", specialMap.size);
    this.recordDailyProgress("score", gained);
    for (let i = 0; i < clearedByType.length; i += 1) {
      const amount = clearedByType[i];
      if (amount <= 0) continue;
      this.recordDailyProgress("collect", amount, TILE_TYPES[i].id);
    }

    this.syncDailyProgress();
    this.updateHUD();
    this.renderGoals();
    return gained;
  }

  applyImpactEffects(impactSet) {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const obstacle = this.obstacles[r][c];
        if (!obstacle) continue;

        let shouldDamage = false;
        if (obstacle.kind === "ink") {
          shouldDamage = this.isCellImpacted(r, c, impactSet, true);
        } else if (obstacle.kind === "frame") {
          shouldDamage = this.isCellImpacted(r, c, impactSet, false);
        }

        if (shouldDamage) {
          obstacle.layers -= 1;
          if (obstacle.layers <= 0) {
            this.obstacles[r][c] = null;
            this.clearedObstacleCounts[obstacle.kind] += 1;
          }
        }
      }
    }

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const tile = this.board[r][c];
        if (!tile || !tile.locked) continue;
        if (!this.isCellImpacted(r, c, impactSet, true)) continue;
        tile.locked = false;
        this.unlockedCount += 1;
      }
    }
  }

  isCellImpacted(row, col, impactSet, includeSelf) {
    if (includeSelf && impactSet.has(this.key(row, col))) return true;

    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (!this.inBounds(nr, nc)) continue;
      if (impactSet.has(this.key(nr, nc))) return true;
    }
    return false;
  }

  applyGravityStep() {
    const moved = [];

    for (let c = 0; c < BOARD_SIZE; c += 1) {
      let segment = [];
      for (let r = 0; r <= BOARD_SIZE; r += 1) {
        const isBoundary = r === BOARD_SIZE || this.isFrameCell(r, c);
        if (!isBoundary) {
          segment.push(r);
          continue;
        }

        if (segment.length > 0) {
          let writeIndex = segment.length - 1;
          for (let i = segment.length - 1; i >= 0; i -= 1) {
            const fromRow = segment[i];
            const tile = this.board[fromRow][c];
            if (!tile) continue;
            const toRow = segment[writeIndex];
            if (fromRow !== toRow) {
              this.board[toRow][c] = tile;
              this.board[fromRow][c] = null;
              moved.push({ row: toRow, col: c, fromRow, distance: toRow - fromRow });
            }
            writeIndex -= 1;
          }
          for (let i = writeIndex; i >= 0; i -= 1) {
            this.board[segment[i]][c] = null;
          }
        }
        segment = [];
      }
    }

    return moved;
  }

  async applyGravityAnimated() {
    const moved = this.applyGravityStep();
    if (moved.length === 0) return false;
    sfx.gravity();

    this.boardEl?.classList.add("gravity-phase");
    this.syncBoardInteractivity();
    const dirtyKeys = new Set();
    for (const move of moved) {
      dirtyKeys.add(this.key(move.row, move.col));
      dirtyKeys.add(this.key(move.fromRow, move.col));
    }
    this.renderKeySet(dirtyKeys);

    const entries = [];
    let maxTotalMs = 0;
    for (const move of moved) {
      const node = this.getCellNode(move.row, move.col);
      if (!node) continue;
      entries.push({ node, row: move.row, col: move.col, distance: move.distance });
    }
    if (entries.length === 0) {
      this.boardEl?.classList.remove("gravity-phase");
      return true;
    }

    let maxDistance = 1;
    entries.sort((a, b) => a.row - b.row || a.col - b.col);
    for (let i = 0; i < entries.length; i += 1) {
      const { node, distance } = entries[i];
      const cappedDistance = Math.min(6, Math.max(1, distance));
      const fallMs = Math.min(420, 180 + cappedDistance * 40);
      const delayMs = Math.min(10, i * 0.6);
      node.style.setProperty("--fall-distance", `${cappedDistance}`);
      node.style.setProperty("--fall-ms", `${fallMs}ms`);
      node.style.setProperty("--fx-delay", `${Math.round(delayMs)}ms`);
      maxDistance = Math.max(maxDistance, cappedDistance);
      maxTotalMs = Math.max(maxTotalMs, fallMs + delayMs);
    }
    if (maxTotalMs <= 0) {
      maxTotalMs = Math.min(360, 150 + maxDistance * 34);
    }

    try {
      await this.retriggerClass(
        entries.map((entry) => entry.node),
        "fall-drop"
      );

      await this.sleep(Math.ceil(maxTotalMs + 8));
      return true;
    } finally {
      this.boardEl?.classList.remove("gravity-phase");
    }
  }

  fillEmptyTiles() {
    const spawned = [];
    this.spawnOffsets.clear();
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      let segmentDepth = 0;
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        if (this.isFrameCell(r, c)) {
          segmentDepth = 0;
          continue;
        }
        if (!this.board[r][c]) {
          segmentDepth += 1;
          this.board[r][c] = this.createRandomTile();
          const key = this.key(r, c);
          spawned.push(key);
          this.spawnOffsets.set(key, segmentDepth);
          continue;
        }
        segmentDepth = 0;
      }
    }
    return spawned;
  }

  addSpecialArea(row, col, special, targetSet) {
    if (!special) return;

    if (special === SPECIAL.LINE_H) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (!this.isFrameCell(row, c)) targetSet.add(this.key(row, c));
      }
      return;
    }

    if (special === SPECIAL.LINE_V) {
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        if (!this.isFrameCell(r, col)) targetSet.add(this.key(r, col));
      }
      return;
    }

    if (special === SPECIAL.BOMB) {
      for (let r = row - 1; r <= row + 1; r += 1) {
        for (let c = col - 1; c <= col + 1; c += 1) {
          if (!this.inBounds(r, c) || this.isFrameCell(r, c)) continue;
          targetSet.add(this.key(r, c));
        }
      }
      return;
    }

    if (special === SPECIAL.COLOR) {
      const source = this.board[row][col];
      if (source) this.collectTilesByType(source.type, targetSet);
    }
  }

  collectTilesByType(type, targetSet) {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const tile = this.board[r][c];
        if (tile && tile.type === type) {
          targetSet.add(this.key(r, c));
        }
      }
    }
  }

  collectNeighborReactionSet(clearedSet) {
    const reaction = new Set();
    const source = Array.isArray(clearedSet) ? new Set(clearedSet) : new Set(clearedSet);

    for (const key of source) {
      const [row, col] = this.fromKey(key);
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (!this.inBounds(nr, nc) || this.isFrameCell(nr, nc)) continue;
          const nearKey = this.key(nr, nc);
          if (source.has(nearKey)) continue;
          if (!this.board[nr][nc]) continue;
          reaction.add(nearKey);
        }
      }
    }
    return reaction;
  }

  isFrameCell(row, col) {
    return this.obstacles[row]?.[col]?.kind === "frame";
  }

  key(row, col) {
    return `${row},${col}`;
  }

  fromKey(key) {
    return key.split(",").map(Number);
  }

  inBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  hasAnyPossibleMove() {
    return this.findHintMove() !== null;
  }

  findHintMove() {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (!this.canSwapCell(r, c)) continue;

        if (c + 1 < BOARD_SIZE && this.canSwapCell(r, c + 1) && this.testSwapForMatch(r, c, r, c + 1)) {
          return [{ row: r, col: c }, { row: r, col: c + 1 }];
        }
        if (r + 1 < BOARD_SIZE && this.canSwapCell(r + 1, c) && this.testSwapForMatch(r, c, r + 1, c)) {
          return [{ row: r, col: c }, { row: r + 1, col: c }];
        }
      }
    }
    return null;
  }

  scheduleHint() {
    this.clearHint();
    if (this.busy || this.levelComplete || this.tutActive) return;
    this.hintTimer = window.setTimeout(() => {
      this.hintTimer = null;
      this.showHint();
    }, 12000);
  }

  clearHint() {
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    for (const node of this.hintedCells) {
      node.classList.remove("hint");
    }
    this.hintedCells = [];
  }

  showHint() {
    if (this.busy || this.levelComplete) return;
    sfx.hint();
    const move = this.findHintMove();
    if (!move) return;
    for (const pos of move) {
      const node = this.getCellNode(pos.row, pos.col);
      if (node) {
        node.classList.add("hint");
        this.hintedCells.push(node);
      }
    }
  }

  canSwapCell(row, col) {
    const tile = this.board[row][col];
    return Boolean(tile && !tile.locked && !this.isFrameCell(row, col));
  }

  testSwapForMatch(r1, c1, r2, c2) {
    const a = this.board[r1][c1];
    const b = this.board[r2][c2];
    this.board[r1][c1] = b;
    this.board[r2][c2] = a;

    const isSpecialMove = Boolean(a?.special || b?.special);
    const hasMatch = isSpecialMove || this.findMatches().matchSet.size > 0;

    this.board[r1][c1] = a;
    this.board[r2][c2] = b;
    return hasMatch;
  }

  shuffleBoard(silent = false) {
    const pool = [];
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (this.isFrameCell(r, c)) continue;
        const tile = this.board[r][c] ?? this.createRandomTile();
        pool.push({ ...tile, special: null });
      }
    }

    let safety = 0;
    do {
      safety += 1;
      const shuffled = this.shuffleArray(pool);
      let index = 0;
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (this.isFrameCell(r, c)) {
            this.board[r][c] = null;
            continue;
          }
          this.board[r][c] = { ...shuffled[index] };
          index += 1;
        }
      }
    } while ((this.findMatches().matchSet.size > 0 || !this.hasAnyPossibleMove()) && safety < 200);

    if (!this.hasAnyPossibleMove()) {
      this.releaseAllLocks();
    }

    if (!silent) this.render();
  }

  releaseAllLocks() {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const tile = this.board[r][c];
        if (tile?.locked) tile.locked = false;
      }
    }
  }

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  getGoalProgress(goal) {
    if (goal.type === "score") {
      return this.score;
    }

    if (goal.type === "collect") {
      const index = TILE_INDEX_BY_ID[goal.tile];
      return this.collectCounts[index] ?? 0;
    }

    if (goal.type === "clear") {
      return this.clearedObstacleCounts[goal.obstacle] ?? 0;
    }

    if (goal.type === "unlock") {
      return this.unlockedCount;
    }

    return 0;
  }

  isGoalComplete(goal) {
    return this.getGoalProgress(goal) >= goal.amount;
  }

  isLevelComplete() {
    return this.currentLevel.goals.every((goal) => this.isGoalComplete(goal));
  }

  goalText(goal) {
    const progress = Math.min(this.getGoalProgress(goal), goal.amount);

    if (goal.type === "score") {
      return `Score ${progress}/${goal.amount}`;
    }

    if (goal.type === "collect") {
      const tileIndex = TILE_INDEX_BY_ID[goal.tile];
      const tile = TILE_TYPES[tileIndex];
      const icon = tile?.icon ?? "◆";
      const label = tile?.name ?? "brickor";
      return `${icon} Samla ${label}: ${progress}/${goal.amount}`;
    }

    if (goal.type === "clear") {
      const label = goal.obstacle === "ink" ? "bläckblock" : "panelramar";
      return `Rensa ${label}: ${progress}/${goal.amount}`;
    }

    if (goal.type === "unlock") {
      return `Bryt lås ${progress}/${goal.amount}`;
    }

    return "";
  }

  renderGoals() {
    const items = this.currentLevel.goals.map((goal) => {
      const li = document.createElement("li");
      const done = this.isGoalComplete(goal);
      if (done) li.classList.add("done");
      li.textContent = `${done ? "Klar: " : ""}${this.goalText(goal)}`;
      return li;
    });
    this.goalsListEl.replaceChildren(...items);
  }

  postTurnChecks() {
    if (this.isLevelComplete()) {
      this.levelComplete = true;
      this.updateHUD();
      this.renderGoals();

      sfx.levelComplete();
      this.flashSfxTag("クリア!", 2000);
      if (this.levelIndex >= LEVELS.length - 1) {
        this.setStatus("Du klarade alla banor! Finalpanelen är säkrad.");
        this.showComboBurst("VICTORY!");
      } else {
        this.setStatus(`Bana ${this.currentLevel.id} klar!`);
        this.showComboBurst("STAGE CLEAR");
      }
      window.setTimeout(() => this.showResultOverlay("victory"), 1200);
      return;
    }

    if (this.moves <= 0) {
      this.levelComplete = true;
      this.updateHUD();
      sfx.gameOver();
      this.flashSfxTag("ざんねん…", 2000);
      this.showComboBurst("TRY AGAIN");
      window.setTimeout(() => this.showResultOverlay("game-over"), 1200);
      return;
    }

    if (!this.hasAnyPossibleMove()) {
      this.shuffleBoard(false);
      this.setStatus(this.charQuote("shuffle"));
    }

    this.updateHUD();
    this.renderGoals();
  }

  calculateStars() {
    const movesLeft = this.moves;
    const totalMoves = this.currentLevel.moves;
    const ratio = movesLeft / totalMoves;
    if (ratio >= 0.4) return 3;
    if (ratio >= 0.15) return 2;
    return 1;
  }

  loadProgress() {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  saveProgress(levelId, score, stars) {
    const progress = this.loadProgress();
    const key = `level-${levelId}`;
    const prev = progress[key];
    const bestScore = Math.max(score, prev?.bestScore ?? 0);
    const bestStars = Math.max(stars, prev?.bestStars ?? 0);
    progress[key] = { bestScore, bestStars };
    try { window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); } catch {}
  }

  getLevelProgress(levelId) {
    const progress = this.loadProgress();
    return progress[`level-${levelId}`] ?? null;
  }

  renderStars(count, animated) {
    this.resultStarsEl.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const star = document.createElement("span");
      star.className = `result-star ${i < count ? "earned" : "empty"}`;
      star.textContent = "★";
      if (animated && i < count) {
        star.style.animationDelay = `${300 + i * 250}ms`;
      }
      this.resultStarsEl.append(star);
    }
  }

  spawnConfetti() {
    this.resultConfettiEl.innerHTML = "";
    const colors = ["#ff4f9e", "#25d7ee", "#ffd25f", "#9cf7d8", "#c579ff", "#ff7a3a"];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.setProperty("--x", `${Math.random() * 100}%`);
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 200}px`);
      piece.style.setProperty("--delay", `${Math.random() * 600}ms`);
      piece.style.setProperty("--duration", `${1200 + Math.random() * 800}ms`);
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      this.resultConfettiEl.append(piece);
    }
  }

  showResultOverlay(type) {
    const isVictory = type === "victory";
    this.resultOverlay.hidden = false;
    this.resultOverlay.className = `result-overlay ${isVictory ? "victory" : "game-over"}`;

    this.resultTitle.textContent = isVictory ? "Stage Clear!" : "Game Over";

    const movesUsed = this.currentLevel.moves - this.moves;
    const stars = isVictory ? this.calculateStars() : 0;
    const lines = [];

    if (isVictory) {
      lines.push(`Bana ${this.currentLevel.id}: ${this.currentLevel.name}`);
      this.saveProgress(this.currentLevel.id, this.score, stars);
      const coinsEarned = this.awardLevelCoins(stars);
      const prev = this.getLevelProgress(this.currentLevel.id);
      if (prev && prev.bestScore > this.score) {
        lines.push(`<span class="result-detail">Bästa: ${prev.bestScore.toLocaleString("sv")} p</span>`);
      }
      if (coinsEarned > 0) {
        lines.push(`<span class="result-coins">+${coinsEarned} コイン</span>`);
      }
    }

    lines.push(`<span class="result-score">${this.score.toLocaleString("sv")} p</span>`);
    lines.push(`<span class="result-detail">${movesUsed} drag använda av ${this.currentLevel.moves}</span>`);

    if (!isVictory) {
      const missing = this.currentLevel.goals.find((g) => !this.isGoalComplete(g));
      if (missing) {
        lines.push(`<span class="result-detail">Kvar: ${this.goalText(missing)}</span>`);
      }
    }

    this.renderStars(stars, isVictory);
    this.resultBody.innerHTML = lines.join("");
    this.resultNextBtn.hidden = !isVictory || this.levelIndex >= LEVELS.length - 1;
    this.resultRetryBtn.textContent = isVictory ? "Spela igen" : "Försök igen";

    if (isVictory) {
      this.spawnConfetti();
    } else {
      this.resultConfettiEl.innerHTML = "";
    }
  }

  hideResultOverlay() {
    this.resultOverlay.hidden = true;
    this.resultConfettiEl.innerHTML = "";
  }

  manualShuffle() {
    if (this.busy || this.levelComplete) return;
    this.shuffleBoard(false);
    this.setStatus("Brädet blandades manuellt.");
  }

  initializeDailyLoop() {
    const today = this.getLocalDateKey();
    const raw = this.loadDailyState();
    this.dailyState = {
      version: 1,
      streak: Number.isFinite(raw?.streak) ? Math.max(0, Math.floor(raw.streak)) : 0,
      lastLoginDate: typeof raw?.lastLoginDate === "string" ? raw.lastLoginDate : "",
      lastCompletedDate: typeof raw?.lastCompletedDate === "string" ? raw.lastCompletedDate : "",
      challenge: null,
    };

    if (this.dailyState.lastCompletedDate) {
      const gap = this.dayDiffBetween(this.dailyState.lastCompletedDate, today);
      if (gap > 1) this.dailyState.streak = 0;
    }

    let challenge = null;
    const generatedChallenge = this.createDailyChallengeForDate(today, this.dailyState.streak);
    if (raw?.challenge?.dateKey === today) {
      const savedVersion = Number(raw.challenge.version ?? 1);
      const savedTarget = Number(raw.challenge.target);
      const savedProgress = Number(raw.challenge.progress);
      if (savedVersion === DAILY_CHALLENGE_VERSION) {
        challenge = {
          version: DAILY_CHALLENGE_VERSION,
          dateKey: today,
          type: typeof raw.challenge.type === "string" ? raw.challenge.type : "score",
          target: Number.isFinite(savedTarget) ? Math.max(1, Math.floor(savedTarget)) : 1,
          progress: Number.isFinite(savedProgress) ? Math.max(0, Math.floor(savedProgress)) : 0,
          completed: Boolean(raw.challenge.completed),
          tileId: typeof raw.challenge.tileId === "string" ? raw.challenge.tileId : "",
        };
        challenge.progress = Math.min(challenge.target, challenge.progress);
        challenge.completed = challenge.completed || challenge.progress >= challenge.target;
      } else {
        challenge = { ...generatedChallenge };
        if (Number.isFinite(savedTarget) && savedTarget > 0 && Number.isFinite(savedProgress) && savedProgress > 0) {
          const ratio = Math.min(1, Math.max(0, savedProgress / savedTarget));
          challenge.progress = Math.min(challenge.target, Math.floor(challenge.target * ratio));
        }
        if (Boolean(raw.challenge.completed)) {
          challenge.progress = challenge.target;
          challenge.completed = true;
        }
      }
    }
    if (!challenge) {
      challenge = generatedChallenge;
    }
    this.dailyState.challenge = challenge;

    if (this.dailyState.lastLoginDate !== today) {
      this.pendingDailyReward = this.getDailyLoginReward(this.dailyState.streak);
      this.dailyState.lastLoginDate = today;
    }

    this.saveDailyState();
  }

  getLocalDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  dateFromKey(dateKey) {
    const [y, m, d] = String(dateKey).split("-").map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    return new Date(y, m - 1, d);
  }

  dayDiffBetween(fromDateKey, toDateKey) {
    const from = this.dateFromKey(fromDateKey);
    const to = this.dateFromKey(toDateKey);
    if (!from || !to) return 0;
    const ms = to.getTime() - from.getTime();
    return Math.round(ms / 86400000);
  }

  shiftDateKey(dateKey, deltaDays) {
    const source = this.dateFromKey(dateKey);
    if (!source) return this.getLocalDateKey();
    source.setDate(source.getDate() + deltaDays);
    return this.getLocalDateKey(source);
  }

  loadDailyState() {
    try {
      const raw = window.localStorage.getItem(DAILY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  saveDailyState() {
    if (!this.dailyState) return;
    try {
      window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(this.dailyState));
    } catch {
      // Ignore storage issues to keep gameplay resilient.
    }
  }

  syncDailyProgress(force = false) {
    if (!force && !this.dailyProgressDirty) return;
    this.dailyProgressDirty = false;
    this.saveDailyState();
    this.renderDailyPanel();
  }

  createDailyChallengeForDate(dateKey, streak = 0) {
    const seed = Number(String(dateKey).replace(/-/g, "")) || 0;
    const modes = ["score", "clear", "collect", "score", "clear", "collect", "special", "chain"];
    const mode = modes[Math.abs(seed % modes.length)];
    const tier = Math.abs(Math.floor(seed / 10) % 3);
    const streakTier = Math.min(3, Math.floor(Math.max(0, streak) / 4));
    const difficulty = tier + streakTier;
    const challenge = {
      version: DAILY_CHALLENGE_VERSION,
      dateKey,
      type: "score",
      target: 3200,
      progress: 0,
      completed: false,
      tileId: "",
    };

    if (mode === "score") {
      challenge.type = "score";
      challenge.target = 3000 + difficulty * 700;
      return challenge;
    }

    if (mode === "clear") {
      challenge.type = "clear";
      challenge.target = 42 + difficulty * 8;
      return challenge;
    }

    if (mode === "collect") {
      challenge.type = "collect";
      const tileIndex = Math.abs((seed * 7 + 3) % TILE_TYPES.length);
      challenge.tileId = TILE_TYPES[tileIndex].id;
      challenge.target = 18 + difficulty * 5;
      return challenge;
    }

    if (mode === "special") {
      challenge.type = "special";
      challenge.target = 3 + Math.floor((difficulty + 1) / 2);
      return challenge;
    }

    challenge.type = "chain";
    challenge.target = 2 + Math.floor(difficulty / 2);
    return challenge;
  }

  getDailyChallengeText(challenge) {
    if (!challenge) return "Ingen utmaning aktiv.";
    if (challenge.type === "score") return `Gör ${challenge.target} poäng idag.`;
    if (challenge.type === "clear") return `Rensa ${challenge.target} brickor idag.`;
    if (challenge.type === "collect") {
      const tileIndex = TILE_INDEX_BY_ID[challenge.tileId];
      const tile = TILE_TYPES[tileIndex];
      const icon = tile?.icon ?? "◆";
      const label = tile?.name ?? "brickor";
      return `Samla ${label} ${icon} x${challenge.target} idag.`;
    }
    if (challenge.type === "special") return `Skapa ${challenge.target} specialbrickor idag.`;
    if (challenge.type === "chain") return `Gör ${challenge.target} combo-kedjor idag.`;
    return "Slutför dagens mål.";
  }

  getDailyLoginReward(streak) {
    const safeStreak = Math.max(0, Math.floor(streak));
    return {
      moves: 1 + Number(safeStreak >= 7),
      fever: 10 + Math.min(16, safeStreak * 2),
    };
  }

  getDailyChallengeReward(streak, challengeType = "score") {
    const safeStreak = Math.max(1, Math.floor(streak));
    const profile = {
      score: { score: 320, fever: 10 },
      clear: { score: 360, fever: 12 },
      collect: { score: 340, fever: 11 },
      special: { score: 420, fever: 14 },
      chain: { score: 460, fever: 15 },
    };
    const base = profile[challengeType] ?? profile.score;
    const streakScoreBonus = Math.min(700, safeStreak * 55);
    const streakFeverBonus = Math.min(16, Math.floor(safeStreak / 2) * 2);
    return {
      moves: 1 + Number(safeStreak >= 5),
      score: base.score + streakScoreBonus,
      fever: base.fever + streakFeverBonus,
    };
  }

  getProjectedDailyStreak() {
    if (!this.dailyState) return 1;
    const today = this.getLocalDateKey();
    const yesterday = this.shiftDateKey(today, -1);
    if (this.dailyState.lastCompletedDate === yesterday) return this.dailyState.streak + 1;
    if (this.dailyState.lastCompletedDate === today) return this.dailyState.streak;
    return 1;
  }

  applyPendingDailyReward() {
    if (!this.pendingDailyReward) return;
    const reward = this.pendingDailyReward;
    this.pendingDailyReward = null;
    this.moves += reward.moves;
    this.addFeverCharge(reward.fever);
    this.dailyRewardStatus = `Daglig bonus: +${reward.moves} drag, +${reward.fever}% FEVER`;
  }

  recordDailyProgress(kind, amount = 1, tileId = "") {
    if (!this.dailyState?.challenge || this.dailyState.challenge.completed) return;
    const challenge = this.dailyState.challenge;
    if (!Number.isFinite(amount) || amount <= 0) return;

    let delta = 0;
    if (challenge.type === "score" && kind === "score") delta = Math.floor(amount);
    if (challenge.type === "clear" && kind === "clear") delta = Math.floor(amount);
    if (challenge.type === "collect" && kind === "collect" && tileId === challenge.tileId) {
      delta = Math.floor(amount);
    }
    if (challenge.type === "special" && kind === "special") delta = Math.floor(amount);
    if (challenge.type === "chain" && kind === "chain") delta = Math.floor(amount);
    if (delta <= 0) return;

    challenge.progress = Math.min(challenge.target, challenge.progress + delta);
    if (challenge.progress >= challenge.target) {
      this.completeDailyChallenge();
      return;
    }

    this.dailyProgressDirty = true;
  }

  completeDailyChallenge() {
    const challenge = this.dailyState?.challenge;
    if (!challenge || challenge.completed) return;

    challenge.completed = true;
    challenge.progress = challenge.target;
    const today = this.getLocalDateKey();
    const yesterday = this.shiftDateKey(today, -1);

    if (this.dailyState.lastCompletedDate === yesterday) {
      this.dailyState.streak += 1;
    } else if (this.dailyState.lastCompletedDate !== today) {
      this.dailyState.streak = 1;
    }
    this.dailyState.lastCompletedDate = today;

    const reward = this.getDailyChallengeReward(this.dailyState.streak, challenge.type);
    this.moves += reward.moves;
    this.score += reward.score;
    this.addFeverCharge(reward.fever);

    this.dailyProgressDirty = true;
    this.syncDailyProgress(true);
    this.showComboBurst("DAILY CLEAR");
    this.setStatus(
      `Daglig utmaning klar! +${reward.moves} drag, +${reward.score} score, +${reward.fever}% FEVER.`
    );
    this.updateHUD();
  }

  renderDailyPanel() {
    if (!this.dailyTaskEl || !this.dailyFillEl || !this.dailyCountEl || !this.dailyStreakEl || !this.dailyRewardEl) {
      return;
    }

    const challenge = this.dailyState?.challenge;
    if (!challenge) {
      this.dailyTaskEl.textContent = "Daglig utmaning laddas...";
      this.dailyFillEl.style.width = "0%";
      this.dailyCountEl.textContent = "0/0";
      this.dailyStreakEl.textContent = "Streak 0";
      this.dailyRewardEl.textContent = "Belöning väntar";
      return;
    }

    const progress = Math.min(challenge.target, challenge.progress);
    const percent = challenge.target > 0 ? Math.round((progress / challenge.target) * 100) : 0;
    this.dailyTaskEl.textContent = this.getDailyChallengeText(challenge);
    this.dailyFillEl.style.width = `${percent}%`;
    this.dailyCountEl.textContent = `${progress}/${challenge.target}`;
    this.dailyStreakEl.textContent = `Streak ${this.dailyState.streak}`;
    this.dailyProgressEl?.setAttribute("aria-valuenow", `${percent}`);
    this.dailyPanelEl?.classList.toggle("complete", challenge.completed);

    if (challenge.completed) {
      this.dailyRewardEl.textContent = "Klar idag. Ny utmaning imorgon.";
      return;
    }

    const projectedStreak = this.getProjectedDailyStreak();
    const preview = this.getDailyChallengeReward(projectedStreak, challenge.type);
    this.dailyRewardEl.textContent = `Belöning: +${preview.moves} drag, +${preview.score} score, +${preview.fever}% FEVER`;
  }

  resetFever() {
    this.feverCharge = 0;
    this.feverActive = false;
    this.feverTurnsLeft = 0;
    this.feverActivatedThisTurn = false;
  }

  computeFeverGain(cleared, specialCreated = 0) {
    if (cleared <= 0) return 0;
    const comboBonus = Math.max(0, this.combo - 1);
    const gain = Math.round(cleared * 3.4 + specialCreated * 10 + comboBonus * 8);
    return Math.min(38, Math.max(6, gain));
  }

  addFeverCharge(amount) {
    if (amount <= 0 || this.feverActive) return;
    this.feverCharge = Math.min(FEVER.MAX_CHARGE, this.feverCharge + amount);
    if (this.feverCharge >= FEVER.MAX_CHARGE) {
      this.activateFever();
    }
  }

  activateFever() {
    if (this.feverActive) return;
    sfx.feverActivate();
    this.flashSfxTag("燃えろ!", 1800);
    this.feverActive = true;
    this.feverTurnsLeft = FEVER.TURNS;
    this.feverCharge = FEVER.MAX_CHARGE;
    this.feverActivatedThisTurn = true;
    this.showComboBurst("FEVER!");
    this.triggerPanelBoost(3);
    this.flashBoard(2);
  }

  consumeFeverTurn() {
    if (!this.feverActive) return;
    if (this.feverActivatedThisTurn) {
      this.feverActivatedThisTurn = false;
      return;
    }
    this.feverTurnsLeft = Math.max(0, this.feverTurnsLeft - 1);
    const remaining = Math.round((this.feverTurnsLeft / FEVER.TURNS) * FEVER.MAX_CHARGE);
    this.feverCharge = remaining;
    if (this.feverTurnsLeft === 0) {
      this.feverActive = false;
      this.feverCharge = 0;
    }
  }

  updateHUD() {
    this.scoreEl.textContent = `${this.score}`;
    this.levelEl.textContent = `${this.levelIndex + 1} / ${LEVELS.length}`;
    this.movesEl.textContent = `${this.moves}`;
    this.comboEl.textContent = `x${this.combo.toFixed(1)}`;

    if (this.mScoreEl) this.mScoreEl.textContent = `${this.score}`;
    if (this.mMovesEl) this.mMovesEl.textContent = `${this.moves}`;
    if (this.mComboEl) this.mComboEl.textContent = `x${this.combo.toFixed(1)}`;
    if (this.mLevelEl) this.mLevelEl.textContent = `${this.levelIndex + 1}`;
    const feverPercent = Math.round((this.feverCharge / FEVER.MAX_CHARGE) * 100);
    if (this.feverFillEl) this.feverFillEl.style.width = `${feverPercent}%`;
    if (this.feverMeterEl) this.feverMeterEl.setAttribute("aria-valuenow", `${feverPercent}`);
    if (this.feverPercentEl) this.feverPercentEl.textContent = `${feverPercent}%`;
    if (this.feverStateEl) {
      this.feverStateEl.textContent = this.feverActive ? "FEVER ON" : feverPercent >= 82 ? "Nära!" : "Laddar";
    }
    if (this.feverTurnsEl) {
      this.feverTurnsEl.textContent = this.feverActive ? `${this.feverTurnsLeft} drag boost` : "Bygg kedjor";
    }
    this.hudPanelEl?.classList.toggle("fever-on", this.feverActive);
    this.boardPanelEl?.classList.toggle("fever-on", this.feverActive);
    if (this.sfxTagEl && !this.sfxTagTimer) {
      this.sfxTagEl.textContent = this.feverActive ? "FEVER!" : "KIRA!";
    }

    this.nextBtn.disabled = !this.levelComplete || this.levelIndex >= LEVELS.length - 1;
    this.shuffleBtn.disabled = this.busy || this.levelComplete;
  }

  flashSfxTag(text, duration = 1200) {
    if (!this.sfxTagEl) return;
    if (this.sfxTagTimer) window.clearTimeout(this.sfxTagTimer);
    this.sfxTagEl.textContent = text;
    this.sfxTagEl.classList.remove("sfx-pop");
    void this.sfxTagEl.offsetWidth;
    this.sfxTagEl.classList.add("sfx-pop");
    this.sfxTagTimer = window.setTimeout(() => {
      this.sfxTagTimer = null;
      this.sfxTagEl.textContent = this.feverActive ? "FEVER!" : "KIRA!";
      this.sfxTagEl.classList.remove("sfx-pop");
    }, duration);
  }

  retriggerElementClass(node, className, tokenKey) {
    if (!node) return;
    const nextToken = (node[tokenKey] ?? 0) + 1;
    node[tokenKey] = nextToken;
    node.classList.remove(className);
    window.requestAnimationFrame(() => {
      if (node[tokenKey] !== nextToken) return;
      node.classList.add(className);
    });
  }

  charQuote(event) {
    const chars = ["Sakura", "Neko", "Sol", "Bläck", "Stjärna", "Blad"];
    const pick = chars[Math.floor(Math.random() * chars.length)];
    const quotes = {
      miss: [
        `${pick}: "Nja, det funkar inte..."`,
        `${pick}: "Försök igen!"`,
        `${pick}: "Inte riktigt, nya~"`,
        `${pick}: "Hmm, tänk om!"`,
      ],
      hit: [
        `${pick}: "Bra drag!"`,
        `${pick}: "Snyggt!"`,
        `${pick}: "Fortsätt så!"`,
        `${pick}: "Naisu~!"`,
      ],
      chain: [
        `${pick}: "Kedjeattack!!"`,
        `${pick}: "Vi är ostoppbara!"`,
        `${pick}: "IKUZO!"`,
      ],
      combo: [
        `${pick}: "Vilken kombo!!"`,
        `${pick}: "Sugoi~!!"`,
        `${pick}: "Vi brinner!"`,
      ],
      mega: [
        `${pick}: "MEGA COMBO!!!"`,
        `${pick}: "Otroligt!!!"`,
        `${pick}: "MASAKA?!"`,
      ],
      color: [
        `${pick}: "Färgexplosion!"`,
        `${pick}: "Alla på en gång!"`,
        `${pick}: "Zenbu kieta!"`,
      ],
      shuffle: [
        `${pick}: "Brädet blandas om!"`,
        `${pick}: "Nytt läge, nya chanser!"`,
        `${pick}: "Omstart!"`,
      ],
    };
    const list = quotes[event] ?? quotes.hit;
    return list[Math.floor(Math.random() * list.length)];
  }

  setStatus(text) {
    this.statusEl.textContent = text;
    this.retriggerElementClass(this.statusEl, "flash", "__statusFlashToken");
  }

  showComboBurst(text, animate = true) {
    if (!this.comboBurstEl) return;
    if (!animate) {
      this.comboBurstQueue.length = 0;
      this.comboBurstVisible = false;
      if (this.comboBurstTimer) {
        window.clearTimeout(this.comboBurstTimer);
        this.comboBurstTimer = null;
      }
      this.comboBurstEl.classList.remove("show");
      this.comboBurstEl.textContent = text;
      return;
    }

    this.comboBurstQueue.push(String(text));
    if (this.comboBurstQueue.length > 2) {
      this.comboBurstQueue.splice(1, this.comboBurstQueue.length - 2);
    }
    if (this.comboBurstVisible) return;
    this.playNextComboBurst();
  }

  playNextComboBurst() {
    if (!this.comboBurstEl) return;
    const text = this.comboBurstQueue.shift();
    if (!text) {
      this.comboBurstVisible = false;
      return;
    }

    this.comboBurstVisible = true;
    this.comboBurstEl.textContent = text;
    const duration = this.getComboBurstDuration(text);
    this.comboBurstEl.style.setProperty("--combo-ms", `${duration}ms`);
    this.comboBurstEl.classList.remove("show");
    this.triggerPanelBoost(2);

    const token = ++this.comboBurstToken;
    window.requestAnimationFrame(() => {
      if (token !== this.comboBurstToken) return;
      this.comboBurstEl.classList.add("show");
    });

    if (this.comboBurstTimer) {
      window.clearTimeout(this.comboBurstTimer);
    }
    this.comboBurstTimer = window.setTimeout(() => {
      if (token !== this.comboBurstToken) return;
      this.comboBurstVisible = false;
      this.comboBurstTimer = null;
      this.playNextComboBurst();
    }, duration + 40);
  }

  getComboBurstDuration(text) {
    const compact = String(text ?? "").trim();
    const charCount = compact.replace(/\s+/g, "").length;
    let duration = 1100 + Math.min(520, charCount * 45);
    if (compact.includes("CHAIN")) duration += 180;
    if (compact === "VICTORY!" || compact === "STAGE CLEAR") duration += 240;
    return Math.min(duration, 1900);
  }

  pulseBoard(level = 1) {
    if (!this.boardEl) return;
    this.boardEl.style.setProperty("--shake-power", `${1 + level * 0.35}`);
    this.retriggerElementClass(this.boardEl, "juice-shake", "__shakeToken");
  }

  flashBoard(level = 1) {
    if (!this.boardEl) return;
    this.boardEl.style.setProperty("--flash-power", `${0.28 + level * 0.14}`);
    this.retriggerElementClass(this.boardEl, "hit-flash", "__flashToken");
  }

  triggerSpeedLines() {
    if (!this.boardPanelEl) return;
    this.retriggerElementClass(this.boardPanelEl, "speed-lines", "__speedToken");
  }

  triggerPanelBoost(level = 1) {
    if (!this.boardPanelEl) return;
    this.boardPanelEl.style.setProperty("--boost-power", `${1 + level * 0.15}`);
    this.retriggerElementClass(this.boardPanelEl, "boost", "__boostToken");
  }

  triggerImpactChain(level = 1) {
    if (!this.boardEl) return;
    this.pulseBoard(level);
    this.boardEl.style.setProperty("--impact-level", `${1 + level * 0.22}`);
    this.retriggerElementClass(this.boardEl, "impact-chain", "__impactToken");

    window.setTimeout(() => {
      this.boardEl.style.setProperty("--shake-power", `${1.2 + level * 0.42}`);
      this.retriggerElementClass(this.boardEl, "juice-shake", "__shakeToken");
    }, 44);
  }

  getBoardRects() {
    if (!this.boardEl || !this.boardPanelEl) return null;
    const boardRect = this.boardEl.getBoundingClientRect();
    const panelRect = this.boardPanelEl.getBoundingClientRect();
    if (boardRect.width <= 0 || boardRect.height <= 0) return null;
    return { boardRect, panelRect };
  }

  cellCenter(row, col, rects) {
    return {
      x: rects.boardRect.left - rects.panelRect.left + ((col + 0.5) * rects.boardRect.width) / BOARD_SIZE,
      y: rects.boardRect.top - rects.panelRect.top + ((row + 0.5) * rects.boardRect.height) / BOARD_SIZE,
    };
  }

  spawnScorePopup(keys, points, chain = 1) {
    if (!this.fxLayerEl || !points || points <= 0) return;
    const rects = this.getBoardRects();
    if (!rects) return;
    const keyList = Array.isArray(keys) ? keys : [...keys];
    if (keyList.length === 0) return;

    let rowSum = 0;
    let colSum = 0;
    for (const key of keyList) {
      const [row, col] = this.fromKey(key);
      rowSum += row;
      colSum += col;
    }
    const row = rowSum / keyList.length;
    const col = colSum / keyList.length;
    const center = this.cellCenter(row, col, rects);

    const label = document.createElement("div");
    label.className = "fx-score";
    if (chain >= 2) label.classList.add("chain");
    if (points >= 1200) label.classList.add("mega");
    if (this.feverActive) label.classList.add("fever");
    const comboLabel = chain >= 2 ? ` x${chain}` : "";
    label.textContent = `+${points}${comboLabel}`;
    label.style.left = `${center.x}px`;
    label.style.top = `${center.y}px`;
    this.fxLayerEl.append(label);
    window.setTimeout(() => label.remove(), TIMING.SCORE_POP_MS);
  }

  spawnSweepFX(row, col, orientation, level = 1) {
    if (!this.fxLayerEl) return;
    const rects = this.getBoardRects();
    if (!rects) return;
    const center = this.cellCenter(row, col, rects);
    const sweep = document.createElement("div");
    sweep.className = `fx-sweep fx-sweep-${orientation}`;
    sweep.style.left = `${center.x}px`;
    sweep.style.top = `${center.y}px`;
    sweep.style.setProperty("--sweep-power", `${1 + level * 0.24}`);
    this.fxLayerEl.append(sweep);
    window.setTimeout(() => sweep.remove(), TIMING.SWEEP_MS);
  }

  spawnDualSweepFX(a, b, level = 2) {
    this.spawnSweepFX(a.row, a.col, "h", level);
    this.spawnSweepFX(a.row, a.col, "v", level);
    this.spawnSweepFX(b.row, b.col, "h", level);
    this.spawnSweepFX(b.row, b.col, "v", level);
  }

  spawnRunSweeps(runs, level = 1) {
    const candidates = runs.filter((run) => run.length >= 4);
    if (candidates.length === 0) return;
    const sorted = [...candidates].sort((a, b) => b.length - a.length);
    for (const run of sorted.slice(0, 2)) {
      const anchor = run.cells[Math.floor(run.cells.length / 2)];
      this.spawnSweepFX(anchor.row, anchor.col, run.orientation, level + Number(run.length >= 5));
    }
  }

  async animatePositions(positions, className, duration = 140) {
    const nodes = [];
    for (const pos of positions) {
      const node = this.getCellNode(pos.row, pos.col);
      if (node) nodes.push(node);
    }
    if (nodes.length === 0) return;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (className === "swap-pop") {
        const dir = i % 2 === 0 ? 1 : -1;
        node.style.setProperty("--motion-tilt", `${(0.8 * dir).toFixed(2)}deg`);
        node.style.setProperty("--motion-shift", `${(1.6 * dir).toFixed(2)}px`);
      } else if (className === "swap-deny") {
        const dir = i % 2 === 0 ? 1 : -1;
        node.style.setProperty("--deny-dir", `${dir}`);
      }
    }
    await this.retriggerClass(nodes, className);
    await this.sleep(duration);
  }

  async animateKeySet(keys, className, duration = 150) {
    const entries = [];
    const keyList = Array.isArray(keys) ? keys : [...keys];
    for (const key of keyList) {
      const [row, col] = this.fromKey(key);
      const node = this.getCellNode(row, col);
      if (node) entries.push({ row, col, node });
    }
    if (entries.length === 0) return;

    if (className === "spawn-enter") {
      entries.sort((a, b) => a.row - b.row || a.col - b.col);
    } else if (className === "clear-pop") {
      entries.sort((a, b) => a.col - b.col || a.row - b.row);
    } else {
      entries.sort((a, b) => a.row - b.row || a.col - b.col);
    }

    for (let i = 0; i < entries.length; i += 1) {
      const { node } = entries[i];
      if (className === "clear-pop") {
        const dir = i % 2 === 0 ? 1 : -1;
        node.style.setProperty("--clear-tilt", `${(1.6 * dir).toFixed(2)}deg`);
        node.style.setProperty("--fx-delay", `${Math.min(16, i * 4)}ms`);
      } else if (className === "spawn-enter") {
        const dir = i % 2 === 0 ? 1 : -1;
        node.style.setProperty("--spawn-jitter", `${(0.34 * dir).toFixed(2)}deg`);
        node.style.setProperty("--fx-delay", `${Math.min(10, i * 2)}ms`);
      } else if (className === "fall-step") {
        const dir = i % 2 === 0 ? 1 : -1;
        node.style.setProperty("--fall-tilt", `${(0.5 * dir).toFixed(2)}deg`);
        node.style.setProperty("--fall-shift", `${(0.8 * dir).toFixed(2)}px`);
        node.style.setProperty("--fx-delay", "0ms");
      } else {
        node.style.setProperty("--fx-delay", "0ms");
      }
    }
    await this.retriggerClass(
      entries.map((entry) => entry.node),
      className
    );
    await this.sleep(duration);
    // Invalidate hashes so next render() cleans up animation classes
    for (const { row, col } of entries) {
      this.cellHashes[row][col] = "";
    }
  }

  triggerKeySet(keys, className) {
    const entries = [];
    const keyList = Array.isArray(keys) ? keys : [...keys];
    for (const key of keyList) {
      const [row, col] = this.fromKey(key);
      const node = this.getCellNode(row, col);
      if (node) {
        entries.push(node);
        this.cellHashes[row][col] = "";
      }
    }
    if (entries.length === 0) return;
    for (let i = 0; i < entries.length; i += 1) {
      entries[i].style.setProperty("--fx-delay", `${Math.min(10, i * 2)}ms`);
    }
    void this.retriggerClass(entries, className);
  }

  async retriggerClass(nodes, className) {
    for (const node of nodes) {
      node.classList.remove(className);
    }
    await this.nextFrame();
    for (const node of nodes) {
      node.classList.add(className);
    }
  }

  nextFrame() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  consumeSpawnOffsets(keys) {
    if (!this.spawnOffsets || this.spawnOffsets.size === 0) return;
    const keyList = Array.isArray(keys) ? keys : [...keys];
    for (const key of keyList) {
      this.spawnOffsets.delete(key);
    }
  }

  sampleKeys(keys, maxCount = 10) {
    const list = Array.isArray(keys) ? [...keys] : [...keys];
    if (list.length <= maxCount) return list;
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, maxCount);
  }

  spawnImpactFX(keys, type = "clear") {
    if (!this.fxLayerEl || !this.boardPanelEl) return;
    const keyList = this.sampleKeys(keys, type === "mega" ? 10 : type === "spawn" ? 4 : 6);
    if (keyList.length === 0) return;

    const rects = this.getBoardRects();
    if (!rects) return;

    for (const key of keyList) {
      const [row, col] = this.fromKey(key);
      const burst = document.createElement("div");
      burst.className = `fx-burst fx-burst-${type}`;
      const center = this.cellCenter(row, col, rects);
      burst.style.left = `${center.x}px`;
      burst.style.top = `${center.y}px`;

      const particles = type === "mega" ? 6 : type === "spawn" ? 3 : 4;
      for (let i = 0; i < particles; i += 1) {
        const p = document.createElement("span");
        const baseAngle = (360 / particles) * i;
        p.className = "fx-p";
        p.style.setProperty("--a", `${baseAngle + (Math.random() * 18 - 9)}deg`);
        p.style.setProperty("--d", `${14 + Math.random() * (type === "spawn" ? 10 : 20)}px`);
        burst.append(p);
      }

      this.fxLayerEl.append(burst);
      window.setTimeout(() => burst.remove(), type === "spawn" ? 320 : 440);
    }
  }

  syncBoardInteractivity() {
    const blocked = this.busy || this.levelComplete;
    this.boardEl.classList.toggle("blocked", blocked);
    this.nextBtn.disabled = !this.levelComplete || this.levelIndex >= LEVELS.length - 1;
    this.shuffleBtn.disabled = this.busy || this.levelComplete;
  }

  cellHash(row, col) {
    const obstacle = this.obstacles[row]?.[col] ?? null;
    const tile = this.board[row]?.[col] ?? null;
    const sel = this.selected && this.selected.row === row && this.selected.col === col ? 1 : 0;
    if (obstacle?.kind === "frame") return `F${obstacle.layers}`;
    if (!tile) return "E";
    const spawnCells = this.spawnOffsets.get(this.key(row, col)) ?? 0;
    return `${tile.type}|${tile.mood ?? 0}|${tile.special ?? ""}|${tile.locked ? 1 : 0}|${obstacle?.kind === "ink" ? obstacle.layers : 0}|${sel}|${spawnCells}`;
  }

  renderCell(row, col, force) {
    const hash = this.cellHash(row, col);
    if (!force && hash === this.cellHashes[row][col]) return;
    this.cellHashes[row][col] = hash;

    const obstacle = this.obstacles[row]?.[col] ?? null;
    const tile = this.board[row]?.[col] ?? null;
    const button = this.getCellNode(row, col);
    const parts = this.getCellParts(row, col);
    if (!button || !parts) return;

    // Build target className as a single string to minimize DOM writes
    let cls = "tile";
    let disabled = false;
    let label = "Tom ruta";

    parts.moodAura.hidden = true;
    parts.sprite.hidden = true;
    parts.moodMark.hidden = true;
    parts.specialChip.hidden = true;
    parts.lockMark.hidden = true;
    parts.inkLayer.hidden = true;
    parts.frameIcon.hidden = true;
    parts.frameLayer.hidden = true;

    if (obstacle?.kind === "frame") {
      cls += " frame-block";
      disabled = true;
      parts.frameIcon.hidden = false;
      parts.frameLayer.hidden = false;
      parts.frameLayer.textContent = `${obstacle.layers}`;
      label = `Panel Frame ${obstacle.layers} lager`;
      if (button.className !== cls) button.className = cls;
      button.disabled = disabled;
      button.setAttribute("aria-label", label);
      return;
    }

    if (!tile) {
      disabled = true;
      if (button.className !== cls) button.className = cls;
      button.disabled = disabled;
      button.setAttribute("aria-label", label);
      return;
    }

    const meta = TILE_TYPES[tile.type];
    const mood = tile.mood ?? 0;
    cls += ` ${meta.id} mood-${mood}`;
    label = `${meta.id} på ${row + 1},${col + 1}`;

    const tileKey = this.key(row, col);
    const spawnCells = this.spawnOffsets.get(tileKey);
    if (spawnCells) {
      const spawnDepth = Math.min(4, spawnCells);
      button.style.setProperty("--spawn-cells", `${spawnDepth}`);
      button.style.setProperty("--spawn-delay", `${Math.min(60, (spawnDepth - 1) * 14)}ms`);
      button.style.setProperty("--spawn-ms", `${Math.min(440, 310 + spawnDepth * 28)}ms`);
    } else {
      button.style.setProperty("--spawn-cells", "1");
      button.style.setProperty("--spawn-delay", "0ms");
      button.style.setProperty("--spawn-ms", "300ms");
    }
    button.style.setProperty("--fall-ms", "220ms");
    button.style.setProperty("--fx-delay", "0ms");

    parts.moodAura.hidden = false;
    const auraClass = `mood-aura mood-aura-${mood}`;
    if (parts.moodAura.className !== auraClass) parts.moodAura.className = auraClass;

    parts.sprite.hidden = false;
    const spriteClass = `sprite sprite--tile sprite-${meta.id} mood-${mood}`;
    if (parts.sprite.className !== spriteClass) parts.sprite.className = spriteClass;
    parts.sprite.style.setProperty("--mood", `${mood}`);

    if (mood > 0) {
      parts.moodMark.hidden = false;
      const markClass = `mood-mark mood-mark-${mood}`;
      if (parts.moodMark.className !== markClass) parts.moodMark.className = markClass;
      parts.moodMark.textContent = mood === 1 ? "♥" : "!";
    }

    if (tile.special) {
      cls += ` special special-${tile.special}`;
      parts.specialChip.hidden = false;
      const chipClass = `special-chip sprite sprite--badge sprite-special-${tile.special}`;
      if (parts.specialChip.className !== chipClass) parts.specialChip.className = chipClass;
    }
    if (tile.locked) {
      cls += " locked";
      parts.lockMark.hidden = false;
    }
    if (obstacle?.kind === "ink") {
      cls += " inked";
      parts.inkLayer.hidden = false;
      parts.inkCount.textContent = `${obstacle.layers}`;
    }

    if (this.selected && this.selected.row === row && this.selected.col === col) {
      cls += " selected";
    }

    if (button.className !== cls) button.className = cls;
    button.disabled = disabled;
    button.setAttribute("aria-label", label);
  }

  renderKeySet(keys) {
    const keyList = Array.isArray(keys) ? keys : [...keys];
    for (const key of keyList) {
      const [row, col] = this.fromKey(key);
      if (!this.inBounds(row, col)) continue;
      this.renderCell(row, col);
    }
  }

  invalidateAllCells() {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        this.cellHashes[r][c] = "";
      }
    }
  }

  render() {
    this.syncBoardInteractivity();
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        this.renderCell(r, c);
      }
    }
  }

  sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  /* ── Level Picker ── */

  initLevelPicker() {
    this.pickerEl = document.getElementById("levelPicker");
    this.pickerGridEl = document.getElementById("levelGrid");
    this.pickerBtn = document.getElementById("pickerBtn");
    this.pickerCloseBtn = document.getElementById("pickerCloseBtn");
    this.pickerOpen = false;

    if (this.pickerBtn) {
      this.pickerBtn.addEventListener("click", () => this.openLevelPicker());
    }
    if (this.pickerCloseBtn) {
      this.pickerCloseBtn.addEventListener("click", () => {
        sfx.uiClick();
        this.closeLevelPicker();
        this.gameShellEl.hidden = false;
      });
    }
    const pickerMenuBtn = document.getElementById("pickerMenuBtn");
    if (pickerMenuBtn) {
      pickerMenuBtn.addEventListener("click", () => {
        sfx.uiClick();
        this.closeLevelPicker();
        this.showMainMenu();
      });
    }
  }

  openLevelPicker() {
    this.pickerOpen = true;
    this.renderLevelPicker();
    this.updateCoinHUD();
    this.pickerEl.hidden = false;
    this.pickerEl.style.display = "";
  }

  closeLevelPicker() {
    this.pickerOpen = false;
    this.pickerEl.hidden = true;
    this.pickerEl.style.display = "none";
  }

  getUnlockedLevelCount() {
    const progress = this.loadProgress();
    let unlocked = 1; // Level 1 always unlocked
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const p = progress[`level-${LEVELS[i].id}`];
      if (p && p.bestStars > 0) {
        unlocked = i + 2; // Next level unlocked
      } else {
        break;
      }
    }
    return Math.min(unlocked, LEVELS.length);
  }

  renderLevelPicker() {
    const progress = this.loadProgress();
    const unlockedCount = this.getUnlockedLevelCount();
    this.pickerGridEl.innerHTML = "";

    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      const isLocked = i >= unlockedCount;
      const isCurrent = i === this.levelIndex;
      const p = progress[`level-${level.id}`];
      const stars = p?.bestStars ?? 0;
      const bestScore = p?.bestScore ?? 0;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      if (isLocked) card.classList.add("level-card--locked");
      else if (isCurrent) card.classList.add("level-card--current");
      else if (stars > 0) card.classList.add("level-card--cleared");

      card.disabled = isLocked;

      let starsHtml = "";
      for (let s = 0; s < 3; s++) {
        starsHtml += `<span class="level-card__star ${s < stars ? "level-card__star--earned" : "level-card__star--empty"}">★</span>`;
      }

      let detailHtml = "";
      if (isLocked) {
        detailHtml = `<span class="level-card__lock">🔒</span>`;
      } else if (bestScore > 0) {
        detailHtml = `<span class="level-card__best">Bästa: ${bestScore.toLocaleString("sv")} p</span>`;
      }

      card.innerHTML = `
        <span class="level-card__number">${level.id}</span>
        <p class="level-card__name">${level.name}</p>
        <div class="level-card__stars">${starsHtml}</div>
        ${detailHtml}
      `;

      if (!isLocked) {
        card.addEventListener("click", () => {
          sfx.init();
          sfx.uiClick();
          this.closeLevelPicker();
          this.openPrepScreen(i);
        });
      }

      // Stagger animation
      card.style.animation = `picker-fade-in 300ms ${80 * i}ms ease-out both`;

      this.pickerGridEl.append(card);
    }
  }

  /* ── Shop & Power-ups ── */

  loadShopData() {
    try {
      const raw = window.localStorage.getItem(SHOP_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return {
        coins: Math.max(0, Math.floor(data.coins ?? 0)),
        inventory: data.inventory ?? {},
      };
    } catch {
      return { coins: 0, inventory: {} };
    }
  }

  saveShopData() {
    try {
      window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(this.shopData));
    } catch {}
  }

  getCoins() {
    return this.shopData.coins;
  }

  addCoins(amount) {
    this.shopData.coins = Math.max(0, this.shopData.coins + amount);
    this.saveShopData();
    this.updateCoinHUD();
  }

  getInventoryCount(powerupId) {
    return this.shopData.inventory[powerupId] ?? 0;
  }

  buyPowerup(powerupId) {
    const pu = POWERUPS.find((p) => p.id === powerupId);
    if (!pu) return false;
    if (this.shopData.coins < pu.cost) return false;
    this.shopData.coins -= pu.cost;
    this.shopData.inventory[powerupId] = (this.shopData.inventory[powerupId] ?? 0) + 1;
    this.saveShopData();
    this.updateCoinHUD();
    sfx.purchase();
    return true;
  }

  consumePowerup(powerupId) {
    if ((this.shopData.inventory[powerupId] ?? 0) <= 0) return false;
    this.shopData.inventory[powerupId] -= 1;
    if (this.shopData.inventory[powerupId] <= 0) delete this.shopData.inventory[powerupId];
    this.saveShopData();
    return true;
  }

  awardLevelCoins(stars) {
    const coinsByStars = [0, COIN_REWARDS.STAR_1, COIN_REWARDS.STAR_2, COIN_REWARDS.STAR_3];
    const earned = coinsByStars[stars] ?? 0;
    if (earned > 0) this.addCoins(earned);
    return earned;
  }

  updateCoinHUD() {
    const el = document.getElementById("coinDisplay");
    if (el) el.textContent = this.getCoins().toLocaleString("sv");
    const mEl = document.getElementById("mCoins");
    if (mEl) mEl.textContent = this.getCoins().toLocaleString("sv");
  }

  /* ── Shop UI ── */

  initShop() {
    this.shopOverlay = document.getElementById("shopOverlay");
    this.shopGrid = document.getElementById("shopGrid");
    this.shopCloseBtn = document.getElementById("shopCloseBtn");
    this.shopCoinsEl = document.getElementById("shopCoins");

    if (this.shopCloseBtn) {
      this.shopCloseBtn.addEventListener("click", () => this.closeShop());
    }

    // Shop button in level picker
    const shopBtn = document.getElementById("shopOpenBtn");
    if (shopBtn) {
      shopBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openShop();
      });
    }
  }

  openShop() {
    if (!this.shopOverlay) return;
    this.renderShop();
    this.shopOverlay.hidden = false;
  }

  closeShop() {
    if (!this.shopOverlay) return;
    this.shopOverlay.hidden = true;
  }

  renderShop() {
    if (!this.shopGrid) return;
    this.shopCoinsEl.textContent = this.getCoins().toLocaleString("sv");
    this.shopGrid.innerHTML = "";

    for (const pu of POWERUPS) {
      const owned = this.getInventoryCount(pu.id);
      const canAfford = this.getCoins() >= pu.cost;

      const card = document.createElement("button");
      card.type = "button";
      card.className = `shop-card ${canAfford ? "" : "shop-card--disabled"}`;

      card.innerHTML = `
        <span class="shop-card__icon">${pu.icon}</span>
        <span class="shop-card__name">${pu.name}</span>
        <span class="shop-card__desc">${pu.desc}</span>
        <span class="shop-card__footer">
          <span class="shop-card__cost">コイン ${pu.cost}</span>
          ${owned > 0 ? `<span class="shop-card__owned">×${owned}</span>` : ""}
        </span>
      `;

      card.addEventListener("click", () => {
        if (this.buyPowerup(pu.id)) {
          this.renderShop();
          this.showComboBurst("GET!");
        }
      });

      this.shopGrid.append(card);
    }
  }

  /* ── Pre-level Prep Screen ── */

  initPrepScreen() {
    this.prepOverlay = document.getElementById("prepOverlay");
    this.prepTitle = document.getElementById("prepTitle");
    this.prepGoals = document.getElementById("prepGoals");
    this.prepPowerups = document.getElementById("prepPowerups");
    this.prepStartBtn = document.getElementById("prepStartBtn");
    this.prepBackBtn = document.getElementById("prepBackBtn");

    if (this.prepStartBtn) {
      this.prepStartBtn.addEventListener("click", () => this.startFromPrep());
    }
    if (this.prepBackBtn) {
      this.prepBackBtn.addEventListener("click", () => this.closePrepScreen());
    }

    this.prepSelectedPowerups = [];
  }

  openPrepScreen(levelIndex) {
    this.prepLevelIndex = levelIndex;
    const level = LEVELS[levelIndex];
    this.prepSelectedPowerups = [];

    this.prepTitle.textContent = `Bana ${level.id}: ${level.name}`;

    // Render goals
    this.prepGoals.innerHTML = "";
    for (const goal of level.goals) {
      const li = document.createElement("li");
      li.textContent = this.goalText(goal);
      this.prepGoals.append(li);
    }

    this.renderPrepPowerups();
    this.prepOverlay.hidden = false;
  }

  renderPrepPowerups() {
    this.prepPowerups.innerHTML = "";
    let hasAny = false;

    for (const pu of POWERUPS) {
      const owned = this.getInventoryCount(pu.id);
      if (owned <= 0) continue;
      hasAny = true;

      const isSelected = this.prepSelectedPowerups.includes(pu.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `prep-powerup ${isSelected ? "prep-powerup--active" : ""}`;

      btn.innerHTML = `
        <span class="prep-powerup__icon">${pu.icon}</span>
        <span class="prep-powerup__name">${pu.name}</span>
        <span class="prep-powerup__count">×${owned}</span>
      `;

      btn.addEventListener("click", () => {
        if (isSelected) {
          this.prepSelectedPowerups = this.prepSelectedPowerups.filter((id) => id !== pu.id);
        } else {
          this.prepSelectedPowerups.push(pu.id);
        }
        this.renderPrepPowerups();
      });

      this.prepPowerups.append(btn);
    }

    if (!hasAny) {
      const msg = document.createElement("p");
      msg.className = "prep-empty";
      msg.textContent = "Inga power-ups. Köp i butiken!";
      this.prepPowerups.append(msg);
    }
  }

  closePrepScreen() {
    this.prepOverlay.hidden = true;
    this.openLevelPicker();
  }

  startFromPrep() {
    // Consume selected power-ups
    const activated = [];
    for (const puId of this.prepSelectedPowerups) {
      if (this.consumePowerup(puId)) {
        activated.push(puId);
      }
    }
    this.activePowerups = activated;

    this.prepOverlay.hidden = true;
    this.loadLevel(this.prepLevelIndex);

    // Apply pre-game power-ups
    if (activated.includes("extra_moves")) {
      this.moves += 3;
      this.updateHUD();
      this.showComboBurst("+3 DRAG!");
    }
    if (activated.includes("fever_start")) {
      this.addFeverCharge(50);
      window.setTimeout(() => this.showComboBurst("FEVER!"), 400);
    }

    this.updateCoinHUD();
    this.renderActivePowerupBar();
  }

  /* ── Active power-up bar (in-game) ── */

  renderActivePowerupBar() {
    let bar = document.getElementById("activePowerupBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "activePowerupBar";
      bar.className = "active-powerup-bar";
      this.boardEl.parentElement.insertBefore(bar, this.boardEl);
    }
    bar.innerHTML = "";

    const activePUs = this.activePowerups.filter((id) => {
      const pu = POWERUPS.find((p) => p.id === id);
      return pu && pu.type === "active";
    });

    if (activePUs.length === 0) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;

    for (const puId of activePUs) {
      const pu = POWERUPS.find((p) => p.id === puId);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "active-pu-btn";
      btn.innerHTML = `<span class="active-pu-btn__icon">${pu.icon}</span><span class="active-pu-btn__name">${pu.name}</span>`;
      btn.addEventListener("click", () => this.usePowerup(puId));
      bar.append(btn);
    }
  }

  usePowerup(puId) {
    if (this.busy || this.levelComplete) return;

    if (puId === "sensei") {
      this.activePowerups = this.activePowerups.filter((id) => id !== puId);
      this.showHint();
      this.showComboBurst("SENSEI!");
      // Keep hint visible for 10s
      this.clearHintTimeout = window.setTimeout(() => this.clearHint(), 10000);
      this.renderActivePowerupBar();
      return;
    }

    if (puId === "ink_blast") {
      this.inkBlastPending = true;
      this.bomb3x3Pending = false;
      this.setStatus("Tryck på en bricka för att förstöra alla av den färgen!");
      this.renderActivePowerupBar();
      return;
    }

    if (puId === "bomb_3x3") {
      this.bomb3x3Pending = true;
      this.inkBlastPending = false;
      this.setStatus("Tryck på en ruta för att spränga 3×3!");
      this.renderActivePowerupBar();
      return;
    }
  }

  handlePowerupClick(row, col) {
    if (this.inkBlastPending) {
      this.inkBlastPending = false;
      const tile = this.board[row][col];
      if (!tile) return false;
      const targetType = tile.type;

      this.activePowerups = this.activePowerups.filter((id) => id !== "ink_blast");
      this.renderActivePowerupBar();

      // Clear all tiles of that color
      const cleared = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (this.board[r][c] && this.board[r][c].type === targetType && !this.board[r][c].locked) {
            cleared.push({ row: r, col: c });
            this.board[r][c] = null;
          }
        }
      }
      if (cleared.length > 0) {
        this.score += cleared.length * BASE_POINTS;
        this.showComboBurst("墨 BLAST!");
        this.updateHUD();
        this.render();
        this.busy = true;
        window.setTimeout(async () => {
          await this.applyGravityAnimated();
          const spawned = this.fillEmptyTiles();
          this.render();
          await this.resolveCascade();
          this.busy = false;
          this.render();
          this.postTurnChecks();
        }, 300);
      }
      return true;
    }

    if (this.bomb3x3Pending) {
      this.bomb3x3Pending = false;
      this.activePowerups = this.activePowerups.filter((id) => id !== "bomb_3x3");
      this.renderActivePowerupBar();

      const impactSet = new Set();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            impactSet.add(this.key(nr, nc));
            if (this.board[nr][nc] && !this.board[nr][nc].locked) {
              this.board[nr][nc] = null;
            }
          }
        }
      }
      this.applyImpactEffects(impactSet);
      this.score += 9 * BASE_POINTS;
      this.showComboBurst("💥 BOOM!");
      this.updateHUD();
      this.renderGoals();
      this.render();
      this.busy = true;
      window.setTimeout(async () => {
        await this.applyGravityAnimated();
        const spawned = this.fillEmptyTiles();
        this.render();
        await this.resolveCascade();
        this.busy = false;
        this.render();
        this.postTurnChecks();
      }, 300);
      return true;
    }

    return false;
  }

  /* ── Tutorial system ── */

  initTutorial() {
    this.tutOverlay = document.getElementById("tutorialOverlay");
    this.tutSpotlight = document.getElementById("tutorialSpotlight");
    this.tutBubble = document.getElementById("tutorialBubble");
    this.tutText = document.getElementById("tutorialText");
    this.tutBtn = document.getElementById("tutorialBtn");
    this.tutSkip = document.getElementById("tutorialSkip");
    this.tutStep = -1;
    this.tutActive = false;
    this.tutPointer = null;

    this.tutBtn.addEventListener("click", () => this.tutorialNext());
    this.tutSkip.addEventListener("click", () => this.tutorialEnd());
  }

  shouldShowTutorial() {
    try {
      return !window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    } catch { return false; }
  }

  markTutorialDone() {
    try { window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1"); } catch {}
  }

  isMobile() {
    return window.innerWidth <= 940;
  }

  getTutorialSteps() {
    const mobile = this.isMobile();
    return [
      {
        text: '<span class="tut-emoji">🌸</span> <strong>Välkommen till Manga Match!</strong><br>Matcha tre eller fler likadana brickor i rad för att samla poäng.',
        target: () => this.boardEl,
        btn: "Kör igång!",
      },
      {
        text: 'Klicka på en bricka för att <strong>välja</strong> den, sedan klicka på en <strong>granne</strong> för att byta plats. Du kan också <strong>swipa</strong> på mobil!',
        target: () => this.boardEl,
        btn: "Förstår!",
      },
      {
        text: '<span class="tut-emoji">🎯</span> Här ser du banans <strong>mål</strong>. Klara alla mål innan dragen tar slut!',
        target: () => mobile
          ? document.querySelector(".mobile-hud") || this.boardEl
          : document.querySelector(".goals-panel"),
        btn: "Nästa",
      },
      {
        text: '<span class="tut-emoji">📊</span> Håll koll på <strong>poäng</strong>, <strong>drag kvar</strong> och din <strong>combo</strong>-multiplikator här.',
        target: () => mobile
          ? document.querySelector(".mobile-hud") || this.boardEl
          : document.querySelector(".stat-grid"),
        btn: "Nästa",
      },
      {
        text: '<span class="tut-emoji">🔥</span> Bygg kedjor för att ladda <strong>Fever-mätaren</strong>! När den är full aktiveras Fever Mode med bonuspoäng.',
        target: () => mobile
          ? this.boardEl
          : document.querySelector(".fever-panel"),
        btn: "Nästa",
      },
      {
        text: 'Matcha <strong>4 i rad</strong> för en linjeattack, <strong>5 i rad</strong> för färgbomb, och <strong>T/L-form</strong> för en bomb! Kombinera special-brickor för maximal effekt.',
        target: () => this.boardEl,
        btn: "Nästa",
      },
      {
        text: '<span class="tut-emoji">⭐</span> Ju fler drag du har kvar, desto fler <strong>stjärnor</strong> får du! Sikta på 3 stjärnor för varje bana.',
        target: () => this.boardEl,
        btn: "Spela!",
      },
    ];
  }

  startTutorial() {
    if (!this.tutOverlay) this.initTutorial();
    this.tutActive = true;
    this.tutStep = -1;
    this.tutOverlay.hidden = false;
    this.tutOverlay.style.display = "";
    this.tutSpotlight.style.boxShadow = "";
    this.clearHint();
    this.tutorialNext();
  }

  tutorialNext() {
    const steps = this.getTutorialSteps();
    this.tutStep += 1;

    if (this.tutStep >= steps.length) {
      this.tutorialEnd();
      return;
    }

    const step = steps[this.tutStep];
    this.tutText.innerHTML = step.text;
    this.tutBtn.textContent = step.btn || "Nästa";

    // Position spotlight
    const targetEl = step.target();
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const inView = rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;

      if (inView) {
        const pad = 8;
        this.tutSpotlight.style.top = `${rect.top - pad}px`;
        this.tutSpotlight.style.left = `${rect.left - pad}px`;
        this.tutSpotlight.style.width = `${rect.width + pad * 2}px`;
        this.tutSpotlight.style.height = `${rect.height + pad * 2}px`;
        this.tutSpotlight.style.display = "";
        this.positionBubble(rect);
      } else {
        // Target off-screen: hide spotlight, center bubble
        this.tutSpotlight.style.display = "none";
        const bubbleW = Math.min(340, vw * 0.88);
        this.tutBubble.classList.remove("tutorial-bubble--above");
        this.tutBubble.style.top = `${Math.round(vh * 0.35)}px`;
        this.tutBubble.style.bottom = "auto";
        this.tutBubble.style.left = `${Math.round((vw - bubbleW) / 2)}px`;
      }
    }

    // Re-trigger bubble animation
    this.tutBubble.style.animation = "none";
    void this.tutBubble.offsetHeight;
    this.tutBubble.style.animation = "";
  }

  positionBubble(targetRect) {
    const bubbleW = Math.min(340, window.innerWidth * 0.88);
    const gap = 18;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    this.tutBubble.classList.remove("tutorial-bubble--above");

    if (spaceBelow > 200) {
      // Place below target – tail at top pointing up toward target
      this.tutBubble.style.top = `${targetRect.bottom + gap}px`;
      this.tutBubble.style.bottom = "auto";
      this.tutBubble.classList.add("tutorial-bubble--above");
    } else if (spaceAbove > 200) {
      // Place above target – tail at bottom pointing down toward target
      this.tutBubble.style.top = "auto";
      this.tutBubble.style.bottom = `${window.innerHeight - targetRect.top + gap}px`;
    } else {
      // Center vertically
      this.tutBubble.style.top = `${Math.max(20, targetRect.top - 160)}px`;
      this.tutBubble.style.bottom = "auto";
    }

    // Horizontal: center on target, clamped
    const idealLeft = targetRect.left + targetRect.width / 2 - bubbleW / 2;
    const clampedLeft = Math.max(12, Math.min(idealLeft, window.innerWidth - bubbleW - 12));
    this.tutBubble.style.left = `${clampedLeft}px`;

    // Adjust tail to point at target center
    const tailTarget = targetRect.left + targetRect.width / 2 - clampedLeft;
    const tail = this.tutBubble.querySelector(".tutorial-bubble__tail");
    if (tail) {
      tail.style.left = `${Math.max(20, Math.min(tailTarget - 10, bubbleW - 40))}px`;
    }
  }

  tutorialEnd() {
    this.tutActive = false;
    this.tutOverlay.hidden = true;
    this.tutOverlay.style.display = "none";
    this.tutSpotlight.style.boxShadow = "none";
    this.markTutorialDone();
    this.render();
    this.scheduleHint();
    // Reveal picker button now that tutorial is complete
    if (this.pickerBtn) this.pickerBtn.hidden = false;
  }

  maybeTutorial() {
    if (this.levelIndex === 0 && this.shouldShowTutorial()) {
      window.setTimeout(() => this.startTutorial(), 600);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new MangaMatch3();
});
