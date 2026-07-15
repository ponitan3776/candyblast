// ===================== ゲーム本体 =====================
// SHAPES をグローバルに（admin.js で使うため）
window.SHAPES = [
  [[0,0]],[[0,0]],
  [[0,0],[0,1]],[[0,0],[0,1]],
  [[0,0],[1,0]],[[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],
  [[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,1]],[[1,0],[1,1],[1,2],[0,1]],
  [[0,0],[1,0],[2,0],[1,1]],[[0,1],[1,1],[2,1],[1,0]],
  [[0,0],[1,0],[2,0],[2,1]],[[0,1],[1,1],[2,1],[2,0]],
  [[0,1],[0,2],[1,0],[1,1]],[[0,0],[0,1],[1,1],[1,2]],
  [[0,1],[1,0],[1,1],[1,2],[2,1]],
  [[0,0],[0,1],[0,2],[0,3],[0,4]],[[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
];

function boardIndex(r, c) { return r * G.SIZE + c; }

function sizeCoinMult(size) { return 8 / size; }

function coinMultiplier(mode, size) {
  const m = mode || G.currentMode;
  const s = (m === 'extreme') ? 8 : (size || G.SIZE);
  return MODE_COIN_MULT[m] * sizeCoinMult(s);
}

function initBoard() {
  G.boardEl.innerHTML = '';
  G.board = [];
  G.cellEls = [];
  const gap = G.SIZE <= 8 ? 4 : (G.SIZE <= 12 ? 3 : 2);
  const radius = G.SIZE <= 8 ? 7 : (G.SIZE <= 12 ? 5 : 3);
  G.boardEl.style.gridTemplateColumns = `repeat(${G.SIZE},1fr)`;
  G.boardEl.style.gridTemplateRows = `repeat(${G.SIZE},1fr)`;
  G.boardEl.style.gap = gap + 'px';
  for (let r = 0; r < G.SIZE; r++) {
    for (let c = 0; c < G.SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.borderRadius = radius + 'px';
      G.boardEl.appendChild(cell);
      G.cellEls.push(cell);
      G.board.push({ filled: false, colorIdx: -1 });
    }
  }
}

function applyMode(mode, size) {
  G.currentMode = MODES[mode] ? mode : 'baked';
  G.SIZE = (G.currentMode === 'extreme') ? 8 : Math.min(18, Math.max(5, size || 8));
  saveSettings();
  updateModeBadge();
  G.overlayEl.classList.remove('show');
  G.score = 0;
  G.streak = 0;
  G.noClearStreak = 0;
  updateScoreUI();
  initBoard();
  fillTray();
}

function randomShapeColor(shape) {
  return { shape, colorIdx: Math.floor(Math.random() * window.COLORS.length), used: false };
}

function boardFullnessRatio() {
  let filled = 0;
  for (let i = 0; i < G.board.length; i++) if (G.board[i].filled) filled++;
  return filled / G.board.length;
}

function countValidPlacements(shape, pool) {
  const shapes = pool || window.SHAPES;
  let count = 0;
  for (let r = 0; r < G.SIZE; r++) {
    for (let c = 0; c < G.SIZE; c++) {
      if (canPlaceAt(shape, r, c)) count++;
    }
  }
  return count;
}

function pickAdaptiveShape(aggressive, pool) {
  const shapes = pool || window.SHAPES;
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
  const shapes = pool || window.SHAPES;
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
  const shapes = pool || window.SHAPES;
  if (G.currentMode === 'soft') return pickAdaptiveShape(true, shapes);
  if (G.currentMode === 'hard') return shapes[Math.floor(Math.random() * shapes.length)];
  if (G.currentMode === 'extreme') return pickWeightedBigShape(shapes);
  return pickAdaptiveShape(false, shapes);
}

function ensurePlayable() {
  if (G.currentMode === 'hard' || G.currentMode === 'extreme') return;
  if (G.currentMode === 'soft') {
    G.tray.forEach((p, i) => {
      if (p.used || anyValidPlacement(p.shape)) return;
      let bestShape = null;
      let bestCount = -1;
      window.SHAPES.forEach(shape => {
        const c = countValidPlacements(shape);
        if (c > bestCount) { bestCount = c;
          bestShape = shape; }
      });
      if (bestShape && bestCount > 0) G.tray[i] = randomShapeColor(bestShape);
    });
    return;
  }
  const anyFits = G.tray.some(p => !p.used && anyValidPlacement(p.shape));
  if (anyFits) return;
  let bestShape = null;
  let bestCount = -1;
  window.SHAPES.forEach(shape => {
    const c = countValidPlacements(shape);
    if (c > bestCount) { bestCount = c;
      bestShape = shape; }
  });
  if (bestShape && bestCount > 0) G.tray[0] = randomShapeColor(bestShape);
}

function fillTray() {
  let availableShapes = window.SHAPES;
  if (G.currentUserId === 'admin' && G.adminDisabledBlocks.length > 0) {
    availableShapes = window.SHAPES.filter((_, idx) => !G.adminDisabledBlocks.includes(idx));
    if (availableShapes.length === 0) availableShapes = window.SHAPES;
  }
  G.tray = [
    randomShapeColor(pickShapeForMode(availableShapes)),
    randomShapeColor(pickShapeForMode(availableShapes)),
    randomShapeColor(pickShapeForMode(availableShapes))
  ];
  ensurePlayable();
  renderTray();
  setTimeout(checkGameOver, 50);
}

function shapeBounds(shape) {
  let maxR = 0;
  let maxC = 0;
  shape.forEach(([r, c]) => { maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c); });
  return { rows: maxR + 1, cols: maxC + 1 };
}

function renderTray() {
  G.trayEl.innerHTML = '';
  G.tray.forEach((piece, idx) => {
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
          if (filled) cd.style.background = window.COLORS[piece.colorIdx].bg;
          grid.appendChild(cd);
        }
      }
      slot.appendChild(grid);
      slot.addEventListener('pointerdown', (e) => startDrag(e, idx));
    }
    G.trayEl.appendChild(slot);
  });
}

function canPlaceAt(shape, baseR, baseC) {
  for (const [dr, dc] of shape) {
    const r = baseR + dr;
    const c = baseC + dc;
    if (r < 0 || r >= G.SIZE || c < 0 || c >= G.SIZE) return false;
    if (G.board[boardIndex(r, c)].filled) return false;
  }
  return true;
}

function anyValidPlacement(shape) {
  for (let r = 0; r < G.SIZE; r++) {
    for (let c = 0; c < G.SIZE; c++) {
      if (canPlaceAt(shape, r, c)) return true;
    }
  }
  return false;
}

function checkGameOver() {
  if (G.currentUserId === 'admin' && G.adminSafetyMode) {
    if (G.tray.every(p => p.used)) fillTray();
    return;
  }
  const remaining = G.tray.filter(p => !p.used);
  const stillPossible = remaining.some(p => anyValidPlacement(p.shape));
  if (!stillPossible && remaining.length > 0) endGame();
}

function startDrag(e, trayIdx) {
  e.preventDefault();
  unlockAudio();
  const piece = G.tray[trayIdx];
  if (!piece || piece.used) return;
  const boardRect = G.boardEl.getBoundingClientRect();
  const cellSize = (boardRect.width - 16) / G.SIZE;
  const { rows, cols } = shapeBounds(piece.shape);
  G.dragState = {
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
  const slot = G.trayEl.querySelector(`.tray-slot[data-idx="${trayIdx}"]`);
  if (slot) slot.classList.add('dragging-source');
  G.ghostEl.innerHTML = '';
  G.ghostEl.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  G.ghostEl.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const filled = piece.shape.some(([sr, sc]) => sr === r && sc === c);
      const gd = document.createElement('div');
      gd.className = 'ghost-cell' + (filled ? '' : ' empty');
      if (filled) gd.style.background = window.COLORS[piece.colorIdx].bg;
      G.ghostEl.appendChild(gd);
    }
  }
  G.ghostEl.style.display = 'grid';
  updateGhostPosition(e.clientX, e.clientY);
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd);
}

function updateGhostPosition(x, y) {
  G.ghostEl.style.left = (x - G.dragState.grabDX) + 'px';
  G.ghostEl.style.top = (y - G.dragState.grabDY) + 'px';
}

function onDragMove(e) {
  if (!G.dragState) return;
  updateGhostPosition(e.clientX, e.clientY);
  const rect = G.dragState.boardRect;
  const cs = G.dragState.cellSize;
  const relX = (e.clientX - G.dragState.grabDX) - (rect.left + 8);
  const relY = (e.clientY - G.dragState.grabDY) - (rect.top + 8);
  const baseC = Math.round(relX / cs);
  const baseR = Math.round(relY / cs);
  const valid = canPlaceAt(G.dragState.piece.shape, baseR, baseC);
  clearPreview();
  G.dragState.piece.shape.forEach(([dr, dc]) => {
    const r = baseR + dr;
    const c = baseC + dc;
    if (r >= 0 && r < G.SIZE && c >= 0 && c < G.SIZE) {
      G.cellEls[boardIndex(r, c)].classList.add(valid ? 'preview-ok' : 'preview-bad');
    }
  });
  G.dragState.lastValid = valid;
  G.dragState.lastR = baseR;
  G.dragState.lastC = baseC;
}

function clearPreview() {
  G.cellEls.forEach(cell => cell.classList.remove('preview-ok', 'preview-bad'));
}

function onDragEnd(e) {
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  if (!G.dragState) return;
  const { piece, trayIdx, lastValid, lastR, lastC } = G.dragState;
  clearPreview();
  G.ghostEl.style.display = 'none';
  const slot = G.trayEl.querySelector(`.tray-slot[data-idx="${trayIdx}"]`);
  if (slot) slot.classList.remove('dragging-source');
  if (lastValid) commitPlacement(piece, lastR, lastC, trayIdx);
  G.dragState = null;
}

function commitPlacement(piece, baseR, baseC, trayIdx) {
  piece.shape.forEach(([dr, dc]) => {
    const r = baseR + dr;
    const c = baseC + dc;
    const idx = boardIndex(r, c);
    G.board[idx] = { filled: true, colorIdx: piece.colorIdx };
    const cellEl = G.cellEls[idx];
    cellEl.className = 'cell filled just-placed';
    cellEl.style.background = window.COLORS[piece.colorIdx].bg;
  });
  playSound('place');
  addScore(piece.shape.length);
  G.dailyStats.piecesPlaced += 1;
  if (piece.shape.length >= 5) G.dailyStats.bigPiecesPlaced = (G.dailyStats.bigPiecesPlaced || 0) + 1;
  G.tray[trayIdx].used = true;
  renderTray();
  setTimeout(() => { resolveLines(); }, 80);
}

function resolveLines() {
  const fullRows = [];
  const fullCols = [];
  for (let r = 0; r < G.SIZE; r++) {
    let full = true;
    for (let c = 0; c < G.SIZE; c++) {
      if (!G.board[boardIndex(r, c)].filled) { full = false; break; }
    }
    if (full) fullRows.push(r);
  }
  for (let c = 0; c < G.SIZE; c++) {
    let full = true;
    for (let r = 0; r < G.SIZE; r++) {
      if (!G.board[boardIndex(r, c)].filled) { full = false; break; }
    }
    if (full) fullCols.push(c);
  }
  const linesCleared = fullRows.length + fullCols.length;
  if (linesCleared > 0) {
    G.streak++;
    G.noClearStreak = 0;
    G.dailyStats.linesCleared += linesCleared;
    G.dailyStats.maxComboStreak = Math.max(G.dailyStats.maxComboStreak || 0, G.streak);
    if (linesCleared >= 2) G.dailyStats.combos += 1;
    if (linesCleared >= 3) G.dailyStats.tripleClearCount = (G.dailyStats.tripleClearCount || 0) + 1;
    const cellsToClear = new Set();
    fullRows.forEach(r => {
      for (let c = 0; c < G.SIZE; c++) cellsToClear.add(boardIndex(r, c));
    });
    fullCols.forEach(c => {
      for (let r = 0; r < G.SIZE; r++) cellsToClear.add(boardIndex(r, c));
    });
    cellsToClear.forEach(idx => {
      G.cellEls[idx].classList.add('clearing');
      spawnConfetti(G.cellEls[idx]);
    });
    playSound('clear');
    const lineScore = linesCleared * 10 * linesCleared;
    const streakBonus = G.streak > 1 ? G.streak * 5 : 0;
    addScore(lineScore + streakBonus);
    showCombo(linesCleared, G.streak);
    updateQuestProgress();

    const totalFilled = G.board.reduce((sum, cell) => sum + (cell.filled ? 1 : 0), 0);
    if (totalFilled === 0 && linesCleared > 0) {
      const bonus = linesCleared * 50 + 100;
      addScore(bonus);
      showComboText(`✨ 全消しボーナス +${bonus}点!`);
    }

    setTimeout(() => {
      cellsToClear.forEach(idx => {
        G.board[idx] = { filled: false, colorIdx: -1 };
        G.cellEls[idx].className = 'cell';
        G.cellEls[idx].style.background = '';
      });
      if (G.tray.every(p => p.used)) fillTray();
      else checkGameOver();
    }, 360);
  } else {
    G.streak = 0;
    G.noClearStreak++;
    G.dailyStats.maxNoClearStreak = Math.max(G.dailyStats.maxNoClearStreak || 0, G.noClearStreak);
    if (G.tray.every(p => p.used)) fillTray();
    else checkGameOver();
  }
}

function addScore(amount) {
  G.score += amount;
  G.dailyStats.scoreEarned += amount;
  G.dailyStats.bestSingleGameScore = Math.max(G.dailyStats.bestSingleGameScore || 0, G.score);
  updateScoreUI();
}

function awardGameEndCoins() {
  const earned = Math.floor((G.score / 50) * coinMultiplier());
  if (earned > 0) {
    G.coins += earned;
    updateCoinUI();
    floatCoin(earned);
  }
  return earned;
}

function startPlayTimeTracking() {
  if (G.playTimeInterval) return;
  G.playTimeInterval = setInterval(() => { G.playTime++; }, 1000);
}

function stopPlayTimeTracking() {
  if (G.playTimeInterval) {
    clearInterval(G.playTimeInterval);
    G.playTimeInterval = null;
  }
}

function endGame() {
  G.dailyStats.gamesPlayed += 1;
  if (G.currentMode === 'hard' || G.currentMode === 'extreme') {
    G.dailyStats.hardModeGamesPlayed = (G.dailyStats.hardModeGamesPlayed || 0) + 1;
  }
  saveDailyQuests();
  updateQuestProgress();
  const earned = awardGameEndCoins();
  if (earned > 0) playSound('coin');
  G.finalScoreEl.textContent = G.score;
  G.newBestNoteEl.textContent = (G.score >= G.best && G.score > 0) ? '🎉 ハイスコア更新！' : 'お疲れさまでした！';
  G.coinEarnedNoteEl.textContent = earned > 0 ? `🪙 +${earned} コイン獲得！` : '';
  G.overlayEl.classList.add('show');
  if (G.SIZE === 8) syncToServer();
  syncPlayTime();
}
