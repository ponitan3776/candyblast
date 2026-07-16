import { SHAPES, MODES, MODE_COIN_MULT, sizeCoinMult } from './config.js';
import { saveBest, loadBest, saveCoins, loadCoins, saveSettings } from './storage.js';
import { syncToServer } from './api.js';
import { updateQuestProgress, updateDailyStats } from './quest.js';
import { applySkin, getSkin } from './skin.js';

// ---- 状態 ----
export let SIZE = 8;
export let currentMode = 'baked';
export let COLORS = []; // 動的にスキンで差し替え

export let board = [];
export let cellEls = [];
export let tray = [];

export let score = 0;
export let best = 0;
export let coins = 0;
export let streak = 0;
export let noClearStreak = 0;

export let dragState = null;

export let adminDisabledBlocks = [];
export let adminSafetyMode = false;

export let authToken = null;
export let currentUserId = null;
export let playTime = 0;
export let playTimeInterval = null;

// ---- DOM要素の参照（ui.jsから注入される） ----
export let boardEl = null;
export let trayEl = null;
export let ghostEl = null;
export let scoreValEl = null;
export let bestValEl = null;
export let coinValEl = null;
export let comboTextEl = null;
export let overlayEl = null;
export let finalScoreEl = null;
export let newBestNoteEl = null;
export let coinEarnedNoteEl = null;
export let restartBtn = null;
export let modalOverlay = null;
export let modalContent = null;
export let modalClose = null;

// ---- 依存注入（app.jsから呼び出す） ----
export function injectGameElements(elements) {
  boardEl = elements.boardEl;
  trayEl = elements.trayEl;
  ghostEl = elements.ghostEl;
  scoreValEl = elements.scoreValEl;
  bestValEl = elements.bestValEl;
  coinValEl = elements.coinValEl;
  comboTextEl = elements.comboTextEl;
  overlayEl = elements.overlayEl;
  finalScoreEl = elements.finalScoreEl;
  newBestNoteEl = elements.newBestNoteEl;
  coinEarnedNoteEl = elements.coinEarnedNoteEl;
  restartBtn = elements.restartBtn;
  modalOverlay = elements.modalOverlay;
  modalContent = elements.modalContent;
  modalClose = elements.modalClose;
}

export function setAuthData(token, userId) {
  authToken = token;
  currentUserId = userId;
}

export function setColors(newColors) {
  COLORS.length = 0;
  newColors.forEach(c => COLORS.push(c));
}

export function getColors() { return COLORS; }

// ---- 盤面インデックス ----
export function boardIndex(r, c) { return r * SIZE + c; }

// ---- ボード初期化 ----
export function initBoard() {
  boardEl.innerHTML = '';
  board = [];
  cellEls = [];
  const gap = SIZE <= 8 ? 4 : (SIZE <= 12 ? 3 : 2);
  const radius = SIZE <= 8 ? 7 : (SIZE <= 12 ? 5 : 3);
  boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`;
  boardEl.style.gap = gap + 'px';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.borderRadius = radius + 'px';
      boardEl.appendChild(cell);
      cellEls.push(cell);
      board.push({ filled: false, colorIdx: -1 });
    }
  }
}

// ---- モード適用 ----
export function applyMode(mode, size) {
  currentMode = MODES[mode] ? mode : 'baked';
  SIZE = (currentMode === 'extreme') ? 8 : Math.min(18, Math.max(5, size || 8));
  saveSettings(currentMode, SIZE);
  updateModeBadge();
  overlayEl.classList.remove('show');
  score = 0;
  streak = 0;
  noClearStreak = 0;
  updateScoreUI();
  initBoard();
  fillTray();
}

// ---- モードバッジ更新（ui.js経由で呼び出し） ----
let _updateModeBadge = null;
export function setModeBadgeUpdater(fn) { _updateModeBadge = fn; }
export function updateModeBadge() { if (_updateModeBadge) _updateModeBadge(); }

// ---- ピース生成 ----
export function randomShapeColor(shape) {
  return { shape, colorIdx: Math.floor(Math.random() * COLORS.length), used: false };
}

// ---- 盤面の埋まり具合 ----
export function boardFullnessRatio() {
  let filled = 0;
  for (let i = 0; i < board.length; i++) if (board[i].filled) filled++;
  return filled / board.length;
}

// ---- 配置可能カウント ----
export function countValidPlacements(shape, pool = SHAPES) {
  let count = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (canPlaceAt(shape, r, c)) count++;
    }
  }
  return count;
}

// ---- 形状選択（モード別） ----
function pickAdaptiveShape(aggressive, pool = SHAPES) {
  const fullness = boardFullnessRatio();
  const threshold = aggressive ? 0.12 : 0.4;
  const maxBias = aggressive ? 6.0 : 3.2;
  const biasPower = fullness < threshold ? (aggressive ? 1.4 : 0) : ((fullness - threshold) / (1 - threshold)) * maxBias;
  if (biasPower <= 0) return pool[Math.floor(Math.random() * pool.length)];
  let totalWeight = 0;
  const weights = pool.map(shape => {
    const validCount = countValidPlacements(shape, pool);
    const sizeBonus = 1 / shape.length;
    const weight = Math.pow(validCount + 0.05, biasPower) * (1 + sizeBonus);
    totalWeight += weight;
    return weight;
  });
  let r = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function pickWeightedBigShape(pool = SHAPES) {
  let totalWeight = 0;
  const weights = pool.map(shape => {
    const w = Math.pow(shape.length, 2.2);
    totalWeight += w;
    return w;
  });
  let r = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function pickShapeForMode(pool = SHAPES) {
  if (currentMode === 'soft') return pickAdaptiveShape(true, pool);
  if (currentMode === 'hard') return pool[Math.floor(Math.random() * pool.length)];
  if (currentMode === 'extreme') return pickWeightedBigShape(pool);
  return pickAdaptiveShape(false, pool);
}

// ---- プレイアブル保証 ----
export function ensurePlayable() {
  if (currentMode === 'hard' || currentMode === 'extreme') return;
  if (currentMode === 'soft') {
    tray.forEach((p, i) => {
      if (p.used || anyValidPlacement(p.shape)) return;
      let bestShape = null, bestCount = -1;
      SHAPES.forEach(shape => {
        const c = countValidPlacements(shape);
        if (c > bestCount) { bestCount = c; bestShape = shape; }
      });
      if (bestShape && bestCount > 0) tray[i] = randomShapeColor(bestShape);
    });
    return;
  }
  const anyFits = tray.some(p => !p.used && anyValidPlacement(p.shape));
  if (anyFits) return;
  let bestShape = null, bestCount = -1;
  SHAPES.forEach(shape => {
    const c = countValidPlacements(shape);
    if (c > bestCount) { bestCount = c; bestShape = shape; }
  });
  if (bestShape && bestCount > 0) tray[0] = randomShapeColor(bestShape);
}

// ---- トレイ補充 ----
export function fillTray() {
  let availableShapes = SHAPES;
  if (currentUserId === 'admin' && adminDisabledBlocks.length > 0) {
    availableShapes = SHAPES.filter((_, idx) => !adminDisabledBlocks.includes(idx));
    if (availableShapes.length === 0) availableShapes = SHAPES;
  }
  tray = [
    randomShapeColor(pickShapeForMode(availableShapes)),
    randomShapeColor(pickShapeForMode(availableShapes)),
    randomShapeColor(pickShapeForMode(availableShapes))
  ];
  ensurePlayable();
  renderTray(); // ui.jsの関数
  setTimeout(checkGameOver, 50);
}

// ---- 形状のバウンディング ----
export function shapeBounds(shape) {
  let maxR = 0, maxC = 0;
  shape.forEach(([r, c]) => { maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); });
  return { rows: maxR + 1, cols: maxC + 1 };
}

// ---- 配置可否 ----
export function canPlaceAt(shape, baseR, baseC) {
  for (const [dr, dc] of shape) {
    const r = baseR + dr, c = baseC + dc;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (board[boardIndex(r, c)].filled) return false;
  }
  return true;
}

export function anyValidPlacement(shape) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (canPlaceAt(shape, r, c)) return true;
    }
  }
  return false;
}

// ---- ゲームオーバーチェック ----
export function checkGameOver() {
  if (currentUserId === 'admin' && adminSafetyMode) {
    if (tray.every(p => p.used)) fillTray();
    return;
  }
  const remaining = tray.filter(p => !p.used);
  const stillPossible = remaining.some(p => anyValidPlacement(p.shape));
  if (!stillPossible && remaining.length > 0) endGame();
}

// ---- ドラッグ操作（startDragはui.jsから呼ばれる） ----
export function setDragState(newState) { dragState = newState; }
export function clearDragState() { dragState = null; }

// ---- 配置確定 ----
export function commitPlacement(piece, baseR, baseC, trayIdx) {
  piece.shape.forEach(([dr, dc]) => {
    const r = baseR + dr, c = baseC + dc, idx = boardIndex(r, c);
    board[idx] = { filled: true, colorIdx: piece.colorIdx };
    const cellEl = cellEls[idx];
    cellEl.className = 'cell filled just-placed';
    cellEl.style.background = COLORS[piece.colorIdx].bg;
  });
  playSound('place');
  addScore(piece.shape.length);
  updateDailyStats({ piecesPlaced: (dailyStats.piecesPlaced || 0) + 1 });
  if (piece.shape.length >= 5) {
    updateDailyStats({ bigPiecesPlaced: (dailyStats.bigPiecesPlaced || 0) + 1 });
  }
  tray[trayIdx].used = true;
  renderTray();
  setTimeout(resolveLines, 80);
}

// ---- ライン消去 ----
export function resolveLines() {
  const fullRows = [], fullCols = [];
  for (let r = 0; r < SIZE; r++) {
    let full = true;
    for (let c = 0; c < SIZE; c++) if (!board[boardIndex(r, c)].filled) { full = false; break; }
    if (full) fullRows.push(r);
  }
  for (let c = 0; c < SIZE; c++) {
    let full = true;
    for (let r = 0; r < SIZE; r++) if (!board[boardIndex(r, c)].filled) { full = false; break; }
    if (full) fullCols.push(c);
  }
  const linesCleared = fullRows.length + fullCols.length;
  if (linesCleared > 0) {
    streak++;
    noClearStreak = 0;
    updateDailyStats({ linesCleared: (dailyStats.linesCleared || 0) + linesCleared });
    updateDailyStats({ maxComboStreak: Math.max(dailyStats.maxComboStreak || 0, streak) });
    if (linesCleared >= 2) updateDailyStats({ combos: (dailyStats.combos || 0) + 1 });
    if (linesCleared >= 3) updateDailyStats({ tripleClearCount: (dailyStats.tripleClearCount || 0) + 1 });

    const cellsToClear = new Set();
    fullRows.forEach(r => { for (let c = 0; c < SIZE; c++) cellsToClear.add(boardIndex(r, c)); });
    fullCols.forEach(c => { for (let r = 0; r < SIZE; r++) cellsToClear.add(boardIndex(r, c)); });
    cellsToClear.forEach(idx => { cellEls[idx].classList.add('clearing'); spawnConfetti(cellEls[idx]); });
    playSound('clear');
    const lineScore = linesCleared * 10 * linesCleared;
    const streakBonus = streak > 1 ? streak * 5 : 0;
    addScore(lineScore + streakBonus);
    showCombo(linesCleared, streak);
    updateQuestProgress();

    const totalFilled = board.reduce((sum, cell) => sum + (cell.filled ? 1 : 0), 0);
    if (totalFilled === 0 && linesCleared > 0) {
      const bonus = linesCleared * 50 + 100;
      addScore(bonus);
      showComboText(`✨ 全消しボーナス +${bonus}点!`);
    }

    setTimeout(() => {
      cellsToClear.forEach(idx => {
        board[idx] = { filled: false, colorIdx: -1 };
        cellEls[idx].className = 'cell';
        cellEls[idx].style.background = '';
      });
      if (tray.every(p => p.used)) fillTray(); else checkGameOver();
    }, 360);
  } else {
    streak = 0;
    noClearStreak++;
    updateDailyStats({ maxNoClearStreak: Math.max(dailyStats.maxNoClearStreak || 0, noClearStreak) });
    if (tray.every(p => p.used)) fillTray(); else checkGameOver();
  }
}

// ---- スコア・コイン更新 ----
export function addScore(amount) {
  score += amount;
  updateDailyStats({ scoreEarned: (dailyStats.scoreEarned || 0) + amount });
  updateDailyStats({ bestSingleGameScore: Math.max(dailyStats.bestSingleGameScore || 0, score) });
  updateScoreUI();
}

export function updateScoreUI() {
  scoreValEl.textContent = score;
  if (score > best) { best = score; bestValEl.textContent = best; saveBest(best); }
}

export function updateCoinUI() {
  coinValEl.textContent = coins;
  saveCoins(coins);
}

export function awardGameEndCoins() {
  const mult = (MODE_COIN_MULT[currentMode] || 1) * sizeCoinMult(SIZE);
  const earned = Math.floor((score / 50) * mult);
  if (earned > 0) { coins += earned; updateCoinUI(); floatCoin(earned); }
  return earned;
}

// ---- ゲーム終了 ----
export function endGame() {
  updateDailyStats({ gamesPlayed: (dailyStats.gamesPlayed || 0) + 1 });
  if (currentMode === 'hard' || currentMode === 'extreme') {
    updateDailyStats({ hardModeGamesPlayed: (dailyStats.hardModeGamesPlayed || 0) + 1 });
  }
  updateQuestProgress();
  const earned = awardGameEndCoins();
  if (earned > 0) playSound('coin');
  finalScoreEl.textContent = score;
  newBestNoteEl.textContent = (score >= best && score > 0) ? '🎉 ハイスコア更新！' : 'お疲れさまでした！';
  coinEarnedNoteEl.textContent = earned > 0 ? `🪙 +${earned} コイン獲得！` : '';
  overlayEl.classList.add('show');
  if (SIZE === 8) syncToServer(authToken, { bestScore: best, coins, playTime });
}

// ---- サウンド（ui.jsにも一部依存） ----
let audioCtx = null;
let soundOn = true;
export function setSoundOn(val) { soundOn = val; }
export function getSoundOn() { return soundOn; }

export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}
export function playSound(type) {
  if (!soundOn) return;
  try {
    unlockAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (type === 'place') {
      o.type = 'sine'; o.frequency.value = 440;
      g.gain.setValueAtTime(0.09, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      o.start(); o.stop(audioCtx.currentTime + 0.13);
    } else if (type === 'clear') {
      o.type = 'triangle'; o.frequency.setValueAtTime(660, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(990, audioCtx.currentTime + 0.2);
      g.gain.setValueAtTime(0.11, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.start(); o.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'coin') {
      o.type = 'square'; o.frequency.setValueAtTime(880, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      o.start(); o.stop(audioCtx.currentTime + 0.18);
    }
  } catch (e) {}
}

// ---- プレイ時間 ----
export function startPlayTimeTracking() {
  if (playTimeInterval) return;
  playTimeInterval = setInterval(() => { playTime++; }, 1000);
}
export function stopPlayTimeTracking() {
  if (playTimeInterval) { clearInterval(playTimeInterval); playTimeInterval = null; }
}
export function syncPlayTime() {
  if (!authToken) return;
  syncToServer(authToken, { playTime });
}

// ---- ui.jsから呼ばれる描画関数の参照（循環回避） ----
let _renderTray = null;
let _showCombo = null;
let _showComboText = null;
let _spawnConfetti = null;
let _floatCoin = null;
let _dailyStats = null;

export function setUIFunctions({ renderTray, showCombo, showComboText, spawnConfetti, floatCoin, dailyStats }) {
  _renderTray = renderTray;
  _showCombo = showCombo;
  _showComboText = showComboText;
  _spawnConfetti = spawnConfetti;
  _floatCoin = floatCoin;
  _dailyStats = dailyStats;
}

export function renderTray() { if (_renderTray) _renderTray(); }
export function showCombo(lines, streakVal) { if (_showCombo) _showCombo(lines, streakVal); }
export function showComboText(msg) { if (_showComboText) _showComboText(msg); }
export function spawnConfetti(cellEl) { if (_spawnConfetti) _spawnConfetti(cellEl); }
export function floatCoin(amount) { if (_floatCoin) _floatCoin(amount); }
export function getDailyStats() { return _dailyStats; }
