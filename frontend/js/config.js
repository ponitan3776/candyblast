// ===================== 設定 =====================
const API_BASE_URL = 'https://blockblitz-backend.onrender.com';

const STORAGE_BEST = 'blockblitz-highscore';
const STORAGE_COINS = 'blockblitz-coins';
const STORAGE_QUESTS = 'blockblitz-quests-v1';
const STORAGE_SETTINGS = 'blockblitz-settings-v1';
const STORAGE_SKINS = 'blockblitz-skins-v1';

const MODES = {
  soft:    { label:'柔らかい', emoji:'🍮' },
  baked:   { label:'焼成',     emoji:'🍪' },
  hard:    { label:'硬い',     emoji:'🍬' },
  extreme: { label:'激硬',     emoji:'🧊' }
};

const MODE_COIN_MULT = { soft:0.5, baked:1.0, hard:1.5, extreme:3.0 };

const RANKING_MODES = ['soft', 'baked', 'hard', 'extreme'];
const RANKING_MODE_LABELS = {
  soft: '🍮 柔らかい',
  baked: '🍪 焼成',
  hard: '🍬 硬い',
  extreme: '🧊 激硬'
};
const RANKING_TYPES = ['score', 'coins', 'playtime'];
const RANKING_TYPE_LABELS = {
  score: '🏆 スコア',
  coins: '🪙 コイン',
  playtime: '⏱️ プレイ時間'
};

const DAILY_STATS_DEFAULT = {
  linesCleared: 0,
  piecesPlaced: 0,
  combos: 0,
  gamesPlayed: 0,
  scoreEarned: 0,
  bestSingleGameScore: 0,
  tripleClearCount: 0,
  maxComboStreak: 0,
  hardModeGamesPlayed: 0,
  maxNoClearStreak: 0,
  bigPiecesPlaced: 0
};
