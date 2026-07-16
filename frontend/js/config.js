/**
 * ゲームの定数定義
 */

const API_BASE_URL = ''; // 必要に応じて設定
const STORAGE_BEST = 'candyblast_best';
const STORAGE_COINS = 'candyblast_coins';
const STORAGE_SETTINGS = 'candyblast_settings';
const STORAGE_QUESTS = 'candyblast_quests';
const STORAGE_SKINS = 'candyblast_skins';

const SHAPES = [
  [[0,0]],
  [[0,0],[0,1]], [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[1,0],[1,1]], [[0,1],[1,1],[1,0]], [[0,0],[0,1],[1,1]], [[0,0],[0,1],[1,0]],
  [[0,0],[0,1],[0,2],[1,1]], [[0,1],[1,0],[1,1],[1,2]], [[0,0],[1,0],[2,0],[1,1]], [[0,1],[1,1],[2,1],[1,0]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,1],[1,1],[2,1],[2,0]], [[0,0],[0,1],[0,2],[1,0]], [[0,0],[0,1],[0,2],[1,2]],
  [[0,0],[0,1],[1,1],[1,2]], [[0,1],[1,1],[1,0],[2,0]], [[0,1],[0,2],[1,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]],
  [[0,0],[0,1],[0,2],[0,3],[0,4]], [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,0],[0,1],[0,2],[1,0],[2,0]], [[0,0],[0,1],[0,2],[1,2],[2,2]], [[0,0],[1,0],[2,0],[2,1],[2,2]], [[2,0],[2,1],[2,2],[1,0],[0,0]],
  [[0,0],[0,1],[0,2],[1,1],[2,1]], [[0,1],[1,1],[2,1],[1,0],[1,2]], [[1,0],[1,1],[1,2],[0,1],[2,1]], [[0,1],[1,1],[2,1],[1,2]],
  [[0,0],[0,1],[1,0],[2,0],[2,1]], [[0,0],[0,1],[1,1],[2,1],[2,0]], [[0,0],[1,0],[1,1],[1,2],[0,2]], [[0,0],[0,1],[0,2],[1,0],[1,2]]
];

const COLORS = [
  {bg:'linear-gradient(135deg, #FF6B6B, #EE5253)', name:'Coral'},
  {bg:'linear-gradient(135deg, #4D96FF, #3867FF)', name:'Blue'},
  {bg:'linear-gradient(135deg, #3DDC97, #2ECC71)', name:'Mint'},
  {bg:'linear-gradient(135deg, #FFD93D, #F1C40F)', name:'Gold'},
  {bg:'linear-gradient(135deg, #B18CFF, #8E44AD)', name:'Purple'},
  {bg:'linear-gradient(135deg, #FF6FB5, #D81B60)', name:'Pink'},
  {bg:'linear-gradient(135deg, #C6E62D, #A4C639)', name:'Lime'}
];

const MODES = {
  soft: { label:'ソフト', emoji:'☁️' },
  baked: { label:'焼成', emoji:'🍞' },
  hard: { label:'硬い', emoji:'💎' },
  extreme: { label:'激硬', emoji:'💀' }
};

const MODE_COIN_MULT = { soft:0.6, baked:1.0, hard:1.5, extreme:2.5 };

const SKINS = [
  {
    id:'default', name:'デフォルト', desc:'標準のキャンディスキン', price:0,
    titleGrad:'linear-gradient(90deg, var(--gold), var(--pink))',
    colors: [...COLORS],
    vars: { '--bg-deep':'#1a1233', '--bg-deep2':'#241a45', '--panel':'#2c2054', '--panel-light':'#382a68' }
  },
  {
    id:'ocean', name:'オーシャン', desc:'深海の静寂', price:200,
    titleGrad:'linear-gradient(90deg, #4facfe, #00f2fe)',
    colors: [
      {bg:'linear-gradient(135deg, #4facfe, #00f2fe)', name:'Cyan'},
      {bg:'linear-gradient(135deg, #43e97b, #38f9d7)', name:'Green'},
      {bg:'linear-gradient(135deg, #fa709a, #fee140)', name:'Sunset'}
    ],
    vars: { '--bg-deep':'#09203f', '--bg-deep2':'#134e5e', '--panel':'#1e3c72', '--panel-light':'#2a5298' }
  },
  {
    id:'midnight', name:'ミッドナイト', desc:'真夜中のネオン', price:500,
    titleGrad:'linear-gradient(90deg, #f093fb, #f5576c)',
    colors: [
      {bg:'linear-gradient(135deg, #f093fb, #f5576c)', name:'Neon Pink'},
      {bg:'linear-gradient(135deg, #5ee7df, #b490ca)', name:'Neon Blue'},
      {bg:'linear-gradient(135deg, #667eea, #764ba2)', name:'Deep Purple'}
    ],
    vars: { '--bg-deep':'#0f0c29', '--bg-deep2':'#302b63', '--panel':'#24243e', '--panel-light':'#485563' }
  }
];

const DAILY_STATS_DEFAULT = {
  date: '', scoreEarned:0, piecesPlaced:0, bigPiecesPlaced:0, linesCleared:0,
  combos:0, tripleClearCount:0, gamesPlayed:0, hardModeGamesPlayed:0,
  maxComboStreak:0, maxNoClearStreak:0, bestSingleGameScore:0
};

const RANKING_TYPES = ['score', 'coins', 'playtime'];
const RANKING_TYPE_LABELS = { score:'スコア', coins:'コイン', playtime:'プレイ時間' };
const RANKING_MODES = ['soft', 'baked', 'hard', 'extreme'];
const RANKING_MODE_LABELS = { soft:'ソフト', baked:'焼成', hard:'硬い', extreme:'激硬' };
