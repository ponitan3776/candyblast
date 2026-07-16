import { 
  board, cellEls, tray, SIZE, COLORS, score, best, coins,
  shapeBounds, canPlaceAt, boardIndex, commitPlacement,
  setDragState, clearDragState, startPlayTimeTracking,
  playSound, unlockAudio, dragState,
  boardEl, trayEl, ghostEl, scoreValEl, bestValEl, coinValEl,
  comboTextEl, overlayEl, finalScoreEl, newBestNoteEl,
  coinEarnedNoteEl, restartBtn, modalOverlay, modalContent,
  currentUserId, adminSafetyMode, adminDisabledBlocks,
  renderTray as coreRenderTray, showCombo as coreShowCombo,
  showComboText as coreShowComboText, spawnConfetti as coreSpawnConfetti,
  floatCoin as coreFloatCoin, getDailyStats
} from './game-core.js';

// ---- DOM要素の再取得（念のため） ----
export function initUIElements() {
  // 既にgame-coreに注入済みなので、ここでは参照のみ
}

// ---- トレイ描画 ----
export function renderTray() {
  trayEl.innerHTML = '';
  tray.forEach((piece, idx) => {
    const slot = document.createElement('div');
    slot.className = 'tray-slot';
    slot.dataset.idx = idx;
    if (!piece.used) {
      const { rows, cols } = shapeBounds(piece.shape);
      const cellPx = Math.max(14, Math.min(24, Math.floor(68 / Math.max(rows, cols))));
      const grid = document.createElement('div');
      grid.className = 'piece-grid';
      grid.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
      grid.style.gridTemplateRows = `repeat(${rows}, ${cellPx}px)`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const filled = piece.shape.some(([sr, sc]) => sr === r && sc === c);
          const cd = document.createElement('div');
          cd.className = 'piece-cell' + (filled ? '' : ' empty');
          if (filled) cd.style.background = COLORS[piece.colorIdx].bg;
          grid.appendChild(cd);
        }
      }
      slot.appendChild(grid);
      slot.addEventListener('pointerdown', (e) => startDrag(e, idx));
    }
    trayEl.appendChild(slot);
  });
}

// ---- ドラッグ開始 ----
function startDrag(e, trayIdx) {
  e.preventDefault();
  unlockAudio();
  const piece = tray[trayIdx];
  if (!piece || piece.used) return;
  const boardRect = boardEl.getBoundingClientRect();
  const cellSize = (boardRect.width - 16) / SIZE;
  const { rows, cols } = shapeBounds(piece.shape);
  const newDragState = {
    trayIdx,
    piece,
    cellSize,
    boardRect,
    grabDX: cellSize * 0.5,
    grabDY: cellSize * 0.5 + 46,
    lastValid: false,
    lastR: -1,
    lastC: -1
  };
  setDragState(newDragState);
  const slot = trayEl.querySelector(`.tray-slot[data-idx="${trayIdx}"]`);
  if (slot) slot.classList.add('dragging-source');
  ghostEl.innerHTML = '';
  ghostEl.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  ghostEl.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const filled = piece.shape.some(([sr, sc]) => sr === r && sc === c);
      const gd = document.createElement('div');
      gd.className = 'ghost-cell' + (filled ? '' : ' empty');
      if (filled) gd.style.background = COLORS[piece.colorIdx].bg;
      ghostEl.appendChild(gd);
    }
  }
  ghostEl.style.display = 'grid';
  updateGhostPosition(e.clientX, e.clientY);
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd);
}

function updateGhostPosition(x, y) {
  if (!dragState) return;
  ghostEl.style.left = (x - dragState.grabDX) + 'px';
  ghostEl.style.top = (y - dragState.grabDY) + 'px';
}

function onDragMove(e) {
  if (!dragState) return;
  updateGhostPosition(e.clientX, e.clientY);
  const rect = dragState.boardRect, cs = dragState.cellSize;
  const relX = (e.clientX - dragState.grabDX) - (rect.left + 8);
  const relY = (e.clientY - dragState.grabDY) - (rect.top + 8);
  const baseC = Math.round(relX / cs), baseR = Math.round(relY / cs);
  const valid = canPlaceAt(dragState.piece.shape, baseR, baseC);
  clearPreview();
  dragState.piece.shape.forEach(([dr, dc]) => {
    const r = baseR + dr, c = baseC + dc;
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
      cellEls[boardIndex(r, c)].classList.add(valid ? 'preview-ok' : 'preview-bad');
    }
  });
  dragState.lastValid = valid;
  dragState.lastR = baseR;
  dragState.lastC = baseC;
}

function clearPreview() {
  cellEls.forEach(cell => cell.classList.remove('preview-ok', 'preview-bad'));
}

function onDragEnd(e) {
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  if (!dragState) return;
  const { piece, trayIdx, lastValid, lastR, lastC } = dragState;
  clearPreview();
  ghostEl.style.display = 'none';
  const slot = trayEl.querySelector(`.tray-slot[data-idx="${trayIdx}"]`);
  if (slot) slot.classList.remove('dragging-source');
  if (lastValid) commitPlacement(piece, lastR, lastC, trayIdx);
  clearDragState();
}

// ---- コンボ表示 ----
export function showCombo(linesCleared, streakVal) {
  if (linesCleared < 2 && streakVal < 2) return;
  let msg = '';
  if (linesCleared >= 2) msg = `COMBO x${linesCleared}!`;
  if (streakVal >= 2) msg += (msg ? '  ' : '') + `🔥x${streakVal}`;
  comboTextEl.textContent = msg;
  comboTextEl.className = 'combo-text show';
  setTimeout(() => { comboTextEl.className = 'combo-text'; }, 900);
}

export function showComboText(msg) {
  comboTextEl.textContent = msg;
  comboTextEl.className = 'combo-text bonus show';
  setTimeout(() => { comboTextEl.className = 'combo-text'; }, 900);
}

// ---- 紙吹雪 ----
export function spawnConfetti(cellEl) {
  const rect = cellEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)].bg;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    const angle = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 50;
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    p.style.setProperty('--rot', (Math.random() * 360) + 'deg');
    p.style.animation = 'confettiBurst 0.55s ease-out forwards';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// ---- コインフロート ----
export function floatCoin(amount) {
  const rect = boardEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = `+${amount}🪙`;
  el.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  el.style.top = (rect.top + rect.height / 2) + 'px';
  el.style.animation = 'coinFloat 0.9s ease-out forwards';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

// ---- モードバッジ更新 ----
export function updateModeBadge() {
  const modeBadgeEl = document.getElementById('modeBadge');
  if (!modeBadgeEl) return;
  // MODESはconfigから取得する必要があるが、game-coreから渡してもらう
  // ここでは簡易的にglobalから取得するか、app.jsで注入する
  // 後で修正
}

// ---- 初期化（app.jsから呼び出し） ----
export function initUI() {
  // game-coreにUI関数を注入
  const { setUIFunctions } = require('./game-core.js');
  setUIFunctions({
    renderTray,
    showCombo,
    showComboText,
    spawnConfetti,
    floatCoin,
    dailyStats: getDailyStats
  });
}
