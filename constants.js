/* ── Constants & Level Data ── */

export const BOARD_SIZE = 8;
export const BASE_POINTS = 100;
export const MOOD_VARIANTS = 3;
export const TIMING = {
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

export const FEVER = {
  MAX_CHARGE: 100,
  TURNS: 5,
  SCORE_MULTIPLIER: 1.45,
};

export const DAILY_STORAGE_KEY = "manga-match-daily-v1";
export const PROGRESS_STORAGE_KEY = "manga-match-progress-v1";
export const TUTORIAL_STORAGE_KEY = "manga-match-tutorial-done-v1";
export const SHOP_STORAGE_KEY = "manga-match-shop-v1";
export const DAILY_CHALLENGE_VERSION = 2;

export const TILE_TYPES = [
  { id: "sakura", name: "Rosa", icon: "🌸" },
  { id: "neko", name: "Blå", icon: "🔵" },
  { id: "sun", name: "Gul", icon: "🌟" },
  { id: "ink", name: "Lila", icon: "🟣" },
  { id: "star", name: "Grön", icon: "💚" },
  { id: "blade", name: "Orange", icon: "🔶" },
];

export const TILE_INDEX_BY_ID = Object.fromEntries(TILE_TYPES.map((tile, index) => [tile.id, index]));

export const SPECIAL = {
  LINE_H: "line-h",
  LINE_V: "line-v",
  BOMB: "bomb",
  COLOR: "color",
};

export const LEVELS = [
  // ── World 1: Grunder (1-10) — score & collect, inga hinder ──
  { id: 1, name: "Akademiporten", moves: 30, goals: [{ type: "score", amount: 1000 }] },
  { id: 2, name: "Körsbärsträdgården", moves: 30, goals: [{ type: "collect", tile: "sakura", amount: 6 }] },
  { id: 3, name: "Kattkaféet", moves: 28, goals: [{ type: "score", amount: 1400 }, { type: "collect", tile: "neko", amount: 8 }] },
  { id: 4, name: "Solnedgången", moves: 28, goals: [{ type: "collect", tile: "sun", amount: 10 }] },
  { id: 5, name: "Stjärnfestivalen", moves: 27, goals: [{ type: "score", amount: 1800 }, { type: "collect", tile: "star", amount: 8 }] },
  { id: 6, name: "Bladvirvelns park", moves: 27, goals: [{ type: "collect", tile: "blade", amount: 10 }] },
  { id: 7, name: "Nattmarknaden", moves: 26, goals: [{ type: "score", amount: 2200 }, { type: "collect", tile: "neko", amount: 10 }] },
  { id: 8, name: "Månbron", moves: 26, goals: [{ type: "collect", tile: "sakura", amount: 8 }, { type: "collect", tile: "star", amount: 8 }] },
  { id: 9, name: "Tusenkransvägen", moves: 25, goals: [{ type: "score", amount: 2600 }] },
  { id: 10, name: "Portalens prov", moves: 25, goals: [{ type: "score", amount: 2800 }, { type: "collect", tile: "sun", amount: 12 }] },
  // ── World 2: Ink & Locks (11-20) ──
  { id: 11, name: "Bläckgränden", moves: 26, goals: [{ type: "score", amount: 2000 }, { type: "clear", obstacle: "ink", amount: 4 }], obstacleMap: ["........", "........", "...i....", "........", "....i...", "........", "........", "........"] },
  { id: 12, name: "Bläckregnet", moves: 26, goals: [{ type: "clear", obstacle: "ink", amount: 6 }], obstacleMap: ["........", "..i..i..", "........", "........", "........", "........", "..i..i..", "........"] },
  { id: 13, name: "Mörka floden", moves: 25, goals: [{ type: "score", amount: 2400 }, { type: "clear", obstacle: "ink", amount: 6 }], obstacleMap: ["........", "..i..i..", "...ii...", "........", "........", "...ii...", "..i..i..", "........"] },
  { id: 14, name: "Soltemplet", moves: 25, goals: [{ type: "collect", tile: "sun", amount: 12 }, { type: "clear", obstacle: "ink", amount: 8 }], obstacleMap: ["........", ".i....i.", "..i..i..", "...ii...", "...ii...", "..i..i..", ".i....i.", "........"] },
  { id: 15, name: "Sigillhallen", moves: 25, goals: [{ type: "unlock", amount: 4 }, { type: "score", amount: 2600 }], lockMap: ["........", "........", "...ll...", "........", "........", "...ll...", "........", "........"] },
  { id: 16, name: "Kedjornas kammare", moves: 24, goals: [{ type: "unlock", amount: 6 }], lockMap: ["........", "..l..l..", "........", "..l..l..", "..l..l..", "........", "..l..l..", "........"] },
  { id: 17, name: "Bläck och bojor", moves: 24, goals: [{ type: "unlock", amount: 4 }, { type: "clear", obstacle: "ink", amount: 6 }], obstacleMap: ["........", "...ii...", "........", "........", "........", "........", "...ii...", "........"], lockMap: ["........", "........", "..l..l..", "........", "........", "..l..l..", "........", "........"] },
  { id: 18, name: "Tvillingtornen", moves: 24, goals: [{ type: "score", amount: 3000 }, { type: "unlock", amount: 6 }, { type: "clear", obstacle: "ink", amount: 6 }], obstacleMap: ["........", "..i..i..", "........", "........", "........", "........", "..i..i..", "........"], lockMap: ["........", ".l....l.", "..l..l..", "........", "........", "..l..l..", ".l....l.", "........"] },
  { id: 19, name: "Drömlabyrinten", moves: 23, goals: [{ type: "collect", tile: "ink", amount: 12 }, { type: "clear", obstacle: "ink", amount: 8 }], obstacleMap: ["........", ".i....i.", "..i..i..", "........", "........", "..i..i..", ".i....i.", "........"] },
  { id: 20, name: "Portalens väktare", moves: 23, goals: [{ type: "score", amount: 3400 }, { type: "unlock", amount: 8 }], lockMap: ["..l..l..", "...ll...", "........", ".l....l.", ".l....l.", "........", "...ll...", "..l..l.."] },
  // ── World 3: Frames & Full Mix (21-30) ──
  { id: 21, name: "Panelfästet", moves: 24, goals: [{ type: "clear", obstacle: "frame", amount: 4 }, { type: "score", amount: 2800 }], obstacleMap: ["........", "........", "...ff...", "........", "........", "...ff...", "........", "........"] },
  { id: 22, name: "Ramverkets ruin", moves: 23, goals: [{ type: "clear", obstacle: "frame", amount: 6 }], obstacleMap: ["........", "........", "..f..f..", "........", "........", "..f..f..", "........", "........"] },
  { id: 23, name: "Stålpanelerna", moves: 23, goals: [{ type: "clear", obstacle: "frame", amount: 6 }, { type: "clear", obstacle: "ink", amount: 4 }], obstacleMap: ["........", "..f..f..", "........", "...ii...", "...ii...", "........", "..f..f..", "........"] },
  { id: 24, name: "Mekanisk manga", moves: 22, goals: [{ type: "clear", obstacle: "frame", amount: 8 }, { type: "clear", obstacle: "ink", amount: 6 }], obstacleMap: [".i....i.", "...ff...", "..f..f..", ".f.ii.f.", ".f.ii.f.", "..f..f..", "...ff...", ".i....i."] },
  { id: 25, name: "Fängelseön", moves: 22, goals: [{ type: "unlock", amount: 6 }, { type: "clear", obstacle: "frame", amount: 6 }], obstacleMap: ["........", "...ff...", "..f..f..", "........", "........", "..f..f..", "...ff...", "........"], lockMap: ["........", "........", "........", "..l..l..", "..l..l..", "........", "........", "........"] },
  { id: 26, name: "Skuggpalatset", moves: 21, goals: [{ type: "score", amount: 3800 }, { type: "clear", obstacle: "ink", amount: 8 }, { type: "unlock", amount: 6 }], obstacleMap: ["........", ".i....i.", "..i..i..", "...ii...", "...ii...", "..i..i..", ".i....i.", "........"], lockMap: ["........", "........", ".l....l.", "........", "........", ".l....l.", "........", "........"] },
  { id: 27, name: "Shogunens port", moves: 21, goals: [{ type: "unlock", amount: 7 }, { type: "clear", obstacle: "frame", amount: 8 }, { type: "score", amount: 4200 }], obstacleMap: ["i..ff..i", ".i....i.", "..fiif..", ".f....f.", ".f....f.", "..fiif..", ".i....i.", "i..ff..i"], lockMap: ["........", "..l..l..", ".l....l.", "........", "........", ".l....l.", "..l..l..", "........"] },
  { id: 28, name: "Kaosbiblioteket", moves: 20, goals: [{ type: "collect", tile: "star", amount: 14 }, { type: "clear", obstacle: "frame", amount: 8 }, { type: "clear", obstacle: "ink", amount: 8 }], obstacleMap: ["..f..f..", ".i....i.", "f..ii..f", "........", "........", "f..ii..f", ".i....i.", "..f..f.."] },
  { id: 29, name: "Demonkungen", moves: 20, goals: [{ type: "score", amount: 5000 }, { type: "unlock", amount: 8 }, { type: "clear", obstacle: "frame", amount: 8 }], obstacleMap: [".f.ff.f.", "........", "f......f", ".f.ii.f.", ".f.ii.f.", "f......f", "........", ".f.ff.f."], lockMap: ["........", ".l.ll.l.", "........", "........", "........", "........", ".l.ll.l.", "........"] },
  { id: 30, name: "Finalpanelen", moves: 19, goals: [{ type: "score", amount: 5600 }, { type: "collect", tile: "star", amount: 14 }, { type: "clear", obstacle: "frame", amount: 10 }, { type: "unlock", amount: 8 }], obstacleMap: ["if.ff.fi", ".i....i.", "ff....ff", ".f.iif..", ".f.iif..", "ff....ff", ".i....i.", "if.ff.fi"], lockMap: ["..l..l..", "...ll...", "........", ".l....l.", ".l....l.", "........", "...ll...", "........"] },
];

export const POWERUPS = [
  { id: "ink_blast", name: "Manga-Bläck", icon: "墨", desc: "Förstör alla brickor av en vald färg", cost: 80, type: "active" },
  { id: "extra_moves", name: "Tidshopp", icon: "+3", desc: "+3 extra drag", cost: 60, type: "pre" },
  { id: "fever_start", name: "Shōnen Boost", icon: "炎", desc: "Starta med 50% fever", cost: 100, type: "pre" },
  { id: "bomb_3x3", name: "Panelbrytare", icon: "💥", desc: "Förstör ett 3×3-område", cost: 120, type: "active" },
  { id: "sensei", name: "Sensei-blick", icon: "目", desc: "Visa bästa drag i 10s", cost: 40, type: "active" },
];

export const COIN_REWARDS = {
  STAR_1: 50,
  STAR_2: 80,
  STAR_3: 150,
  DAILY_BASE: 100,
  DAILY_STREAK_BONUS: 30,
};
