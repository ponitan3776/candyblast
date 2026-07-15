// ===================== ゲーム本体 =====================
let SIZE = 8;
let board = [],
  cellEls = [],
  tray = [];
let dragState = null;
let dailyStats = { date: '', ...DAILY_STATS_DEFAULT };
let quests = [];
let playTime = 0;
let playTimeInterval = null;
let currentMode = 'baked';
let pendingMode = currentMode,
  pendingSize = SIZE;

const COLORS = []; // skins.js で設定される

const SHAPES = [
  [
    [0, 0]
  ],
  [
    [0, 0]
  ],
  [
    [0, 0],
    [0, 1]
  ],
  [
    [0, 0],
    [0, 1]
  ],
  [
    [0, 0],
    [1, 0]
  ],
  [
    [0, 0],
    [1, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0]
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1]
  ],
  [
    [0, 1],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1]
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [0, 1]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1]
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 0]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1]
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 0]
  ],
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2]
  ],
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2]
  ]
];

function boardIndex(r, c) { return r * SIZE + c; }

function sizeCoinMult(size) { return 8 / size; }

function coinMultiplier(mode, size) {
  const m = mode || currentMode,
    s = (m === 'extreme') ? 8 : (size || SIZE);
  return MODE_COIN_MULT[m] * sizeCoinMult(s);
}

function initBoard() {
  boardEl.innerHTML = '';
  board = [];
  cellEls = [];
  const gap = SIZE <= 8 ? 4 : (SIZE <= 12 ? 3 : 2);
  const radius = SIZE <= 8 ? 7 : (SIZE <= 12 ? 5 : 3);
  boardEl.style.gridTemplateColumns = `repeat(${SIZE},1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${SIZE},1fr)`;
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

function applyMode(mode, size) {
  currentMode = MODES[mode] ? mode : 'baked';
  SIZE = (currentMode === 'extreme') ? 8 : Math.min(18, Math.max(5, size || 8));
  saveSettings();
  updateModeBadge();
  overlayEl.classList.remove('show');
  score = 0;
  streak = 0;
  noClearStreak = 0;
  updateScoreUI();
  initBoard();
  fillTray();
}

function randomShapeColor(shape) {
  return { shape, colorIdx: Math.floor(Math.random() * COLORS.length), used: false };
}

function boardFullnessRatio() {
  let filled = 0;
  for (let i = 0; i < board.length; i++)
    if (board[i].filled) filled++;
  return filled / board.length;
}

function countValidPlacements(shape, pool) {
  const shapes = pool || SHAPES;
  let count = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (canPlaceAt(shape, r, c)) count++;
    }
  }
  return count;
}

function pickAdaptiveShape(aggressive, pool) {
  const shapes = pool || SHAPES;
  const fullness = boardFullnessRatio();
  const threshold = aggressive ? 0.12 : 0.4;
  const maxBias = aggressive ? 6.0 : 3.2;
  const biasPower = fullness < threshold ? (aggressive ? 1.4 : 0) : ((fullness - threshold) / (1 - threshold)) * maxBias;
  if (biasPower <= 0) return shapes[Math.floor(Math.random() * shapes.length)];
  let totalWeight = 0;
  const weights = shapes.map(shape => {
    const validCount = countValidPlacements(shape, shapes);
    const sizeBonus = 1 / shape.length;
    const weight = Math.pow(validCount + 0.05, biasPower) * (1 + sizeBonus);
    totalWeight += weight;
    return weight;
  });
  let r = Math.random() * totalWeight;
  for (let i = 0; i < shapes.length; i++) {
    r -= weights[i];
    if (r <= 0) return shapes[i];
  }
  return shapes[shapes.length - 1];
}

function pickWeightedBigShape(pool) {
  const shapes = pool || SHAPES;
  let totalWeight = 0;
  const weights = shapes.map(shape => {
    const w = Math.pow(shape.length, 2.2);
    totalWeight += w;
    return w;
  });
  let r = Math.random() * totalWeight;
  for (let i = 0; i < shapes.length; i++) {
    r -= weights[i];
    if (r <= 0) return shapes[i];
  }
  return shapes[shapes.length - 1];
}

function pickShapeForMode(pool) {
  const shapes = pool || SHAPES;
  if (currentMode === 'soft') return pickAdaptiveShape(true, shapes);
  if (currentMode === 'hard') return shapes[Math.floor(Math.random() * shapes.length)];
  if (currentMode === 'extreme') return pickWeightedBigShape(shapes);
  return pickAdaptiveShape(false, shapes);
}

function ensurePlayable() {
  if (currentMode === 'hard' || currentMode === 'extreme') return;
  if (currentMode === 'soft') {
    tray.forEach((p, i) => {
      if (p.used || anyValidPlacement(p.shape)) return;
      let bestShape = null,
        bestCount = -1;
      SHAPES.forEach(shape => {
        const c = countValidPlacements(shape);
        if (c > bestCount) { bestCount = c;
          bestShape = shape; }
      });
      if (bestShape && bestCount > 0) tray[i] = randomShapeColor(bestShape);
    });
    return;
  }
  const anyFits = tray.some(p => !p.used && anyValidPlacement(p.shape));
  if (anyFits) return;
  let bestShape = null,
    bestCount = -1;
  SHAPES.forEach(shape => {
    const c = countValidPlacements(shape);
    if (c > bestCount) { bestCount = c;
      bestShape = shape; }
  });
  if (bestShape && bestCount > 0) tray[0] = randomShapeColor(bestShape);
}

function fillTray() {
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
  renderTray();
  setTimeout(checkGameOver, 50);
}

function shapeBounds(shape) {
  let maxR = 0,
    maxC = 0;
  shape.forEach(([r, c]) => { maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c); });
  return { rows: maxR + 1, cols: maxC + 1 };
}

function renderTray() {
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

function canPlaceAt(shape, baseR, baseC) {
  for (const [dr, dc] of shape) {
    const r = baseR + dr,
      c = baseC + dc;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (board[boardIndex(r, c)].filled) return false;
  }
  return true;
}

function anyValidPlacement(shape) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (canPlaceAt(shape, r, c)) return true;
  return false;
}

function checkGameOver() {
  if (currentUserId === 'admin' && adminSafetyMode) {
    if (tray.every(p => p.used)) fillTray();
    return;
  }
  const remaining = tray.filter(p => !p.used);
  const stillPossible = remaining.some(p => anyValidPlacement(p.shape));
  if (!stillPossible && remaining.length > 0) endGame();
}

function startDrag(e, trayIdx) {
  e.preventDefault();
  unlockAudio();
  const piece = tray[trayIdx];
  if (!piece || piece.used) return;
  const boardRect = boardEl.getBoundingClientRect();
  const cellSize = (boardRect.width - 16) / SIZE;
  const { rows, cols } = shapeBounds(piece.shape);
  dragState = { trayIdx, piece, cellSize, boardRect, grabDX: cellSize * 0.5, grabDY: cellSize * 0.5 + 46, lastValid: false, lastR: -1, lastC: -1 };
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
  ghostEl.style.left = (x - dragState.grabDX) + 'px';
  ghostEl.style.top = (y - dragState.grabDY) + 'px';
}

function onDragMove(e) {
  if (!dragState) return;
  updateGhostPosition(e.clientX, e.clientY);
  const rect = dragState.boardRect,
    cs = dragState.cellSize;
  const relX = (e.clientX - dragState.grabDX) - (rect.left + 8);
  const relY = (e.clientY - dragState.grabDY) - (rect.top + 8);
  const baseC = Math.round(relX / cs),
    baseR = Math.round(relY / cs);
  const valid = canPlaceAt(dragState.piece.shape, baseR, baseC);
  clearPreview();
  dragState.piece.shape.forEach(([dr, dc]) => {
    const r = baseR + dr,
      c = baseC + dc;
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) cellEls[boardIndex(r, c)].classList.add(valid ? 'preview-ok' : 'preview-bad');
  });
  dragState.lastValid = valid;
  dragState.lastR = baseR;
  dragState.lastC = baseC;
}

function clearPreview() { cellEls.forEach(cell => cell.classList.remove('preview-ok', 'preview-bad')); }

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
  dragState = null;
}

function commitPlacement(piece, baseR, baseC, trayIdx) {
  piece.shape.forEach(([dr, dc]) => {
    const r = baseR + dr,
      c = baseC + dc,
      idx = boardIndex(r, c);
    board[idx] = { filled: true, colorIdx: piece.colorIdx };
    const cellEl = cellEls[idx];
    cellEl.className = 'cell filled just-placed';
    cellEl.style.background = COLORS[piece.colorIdx].bg;
  });
  playSound('place');
  addScore(piece.shape.length);
  dailyStats.piecesPlaced += 1;
  if (piece.shape.length >= 5) dailyStats.bigPiecesPlaced = (dailyStats.bigPiecesPlaced || 0) + 1;
  tray[trayIdx].used = true;
  renderTray();
  setTimeout(() => { resolveLines(); }, 80);
}

function resolveLines() {
  const fullRows = [],
    fullCols = [];
  for (let r = 0; r < SIZE; r++) { let full = true; for (let c = 0; c < SIZE; c++) { if (!board[boardIndex(r, c)].filled) { full = false; break; } } if (full) fullRows.push(r); }
  for (let c = 0; c < SIZE; c++) { let full = true; for (let r = 0; r < SIZE; r++) { if (!board[boardIndex(r, c)].filled) { full = false; break; } } if (full) fullCols.push(c); }
  const linesCleared = fullRows.length + fullCols.length;
  if (linesCleared > 0) {
    streak++;
    noClearStreak = 0;
    dailyStats.linesCleared += linesCleared;
    dailyStats.maxComboStreak = Math.max(dailyStats.maxComboStreak || 0, streak);
    if (linesCleared >= 2) dailyStats.combos += 1;
    if (linesCleared >= 3) dailyStats.tripleClearCount = (dailyStats.tripleClearCount || 0) + 1;
    const cellsToClear = new Set();
    fullRows.forEach(r => { for (let c = 0; c < SIZE; c++) cellsToClear.add(boardIndex(r, c)); });
    fullCols.forEach(c => { for (let r = 0; r < SIZE; r++) cellsToClear.add(boardIndex(r, c)); });
    cellsToClear.forEach(idx => { cellEls[idx].classList.add('clearing');
      spawnConfetti(cellEls[idx]); });
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
      cellsToClear.forEach(idx => { board[idx] = { filled: false, colorIdx: -1 };
        cellEls[idx].className = 'cell';
        cellEls[idx].style.background = ''; });
      if (tray.every(p => p.used)) fillTray();
      else checkGameOver();
    }, 360);
  } else {
    streak = 0;
    noClearStreak++;
    dailyStats.maxNoClearStreak = Math.max(dailyStats.maxNoClearStreak || 0, noClearStreak);
    if (tray.every(p => p.used)) fillTray();
    else checkGameOver();
  }
}

function addScore(amount) {
  score += amount;
  dailyStats.scoreEarned += amount;
  dailyStats.bestSingleGameScore = Math.max(dailyStats.bestSingleGameScore || 0, score);
  updateScoreUI();
}

function awardGameEndCoins() {
  const earned = Math.floor((score / 50) * coinMultiplier());
  if (earned > 0) { coins += earned;
    updateCoinUI();
    floatCoin(earned); }
  return earned;
}

function startPlayTimeTracking() {
  if (playTimeInterval) return;
  playTimeInterval = setInterval(() => { playTime++; }, 1000);
}

function stopPlayTimeTracking() {
  if (playTimeInterval) { clearInterval(playTimeInterval);
    playTimeInterval = null; }
}

function endGame() {
  dailyStats.gamesPlayed += 1;
  if (currentMode === 'hard' || currentMode === 'extreme') dailyStats.hardModeGamesPlayed = (dailyStats.hardModeGamesPlayed || 0) + 1;
  saveDailyQuests();
  updateQuestProgress();
  const earned = awardGameEndCoins();
  if (earned > 0) playSound('coin');
  finalScoreEl.textContent = score;
  newBestNoteEl.textContent = (score >= best && score > 0) ? '🎉 ハイスコア更新！' : 'お疲れさまでした！';
  coinEarnedNoteEl.textContent = earned > 0 ? `🪙 +${earned} コイン獲得！` : '';
  overlayEl.classList.add('show');
  if (SIZE === 8) syncToServer();
  syncPlayTime();
}
