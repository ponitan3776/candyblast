/**
 * メインゲームロジック
 */

const game = {
  size: 8,
  mode: 'baked',
  board: [],
  cellEls: [],
  tray: [],
  score: 0,
  best: 0,
  coins: 0,
  streak: 0,
  dragState: null,

  // --- 初期化 ---
  init(size, mode) {
    this.size = size;
    this.mode = mode;
    this.score = 0;
    this.streak = 0;
    this.initBoard();
    this.fillTray();
    this.updateUI();
  },

  initBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    this.board = [];
    this.cellEls = [];
    boardEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
    
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        boardEl.appendChild(cell);
        this.cellEls.push(cell);
        this.board.push({ filled: false, colorIdx: -1 });
      }
    }
  },

  // --- トレイ管理 ---
  fillTray() {
    this.tray = [
      this.getRandomPiece(),
      this.getRandomPiece(),
      this.getRandomPiece()
    ];
    this.renderTray();
    setTimeout(() => this.checkGameOver(), 50);
  },

  getRandomPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    return { shape, colorIdx, used: false };
  },

  renderTray() {
    const trayEl = document.getElementById('tray');
    trayEl.innerHTML = '';
    this.tray.forEach((piece, idx) => {
      const slot = document.createElement('div');
      slot.className = 'tray-slot';
      if (!piece.used) {
        const { rows, cols } = utils.shapeBounds(piece.shape);
        const cellPx = Math.max(14, Math.min(24, Math.floor(68 / Math.max(rows, cols))));
        const grid = document.createElement('div');
        grid.className = 'piece-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
        
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
        slot.onpointerdown = (e) => this.startDrag(e, idx);
      }
      trayEl.appendChild(slot);
    });
  },

  // --- ドラッグ & ドロップ ---
  startDrag(e, trayIdx) {
    e.preventDefault();
    utils.audio.unlock();
    const piece = this.tray[trayIdx];
    const boardEl = document.getElementById('board');
    const boardRect = boardEl.getBoundingClientRect();
    const cellSize = (boardRect.width - 16) / this.size;
    const { rows, cols } = utils.shapeBounds(piece.shape);

    this.dragState = {
      trayIdx, piece, cellSize, boardRect,
      grabDX: cellSize * 0.5,
      grabDY: cellSize * 0.5 + 46,
      lastR: -1, lastC: -1, lastValid: false
    };

    const ghostEl = document.getElementById('ghost');
    ghostEl.innerHTML = '';
    ghostEl.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
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
    this.updateGhostPos(e.clientX, e.clientY);

    document.onpointermove = (ev) => this.onDragMove(ev);
    document.onpointerup = () => this.onDragEnd();
  },

  updateGhostPos(x, y) {
    const ghostEl = document.getElementById('ghost');
    ghostEl.style.left = (x - this.dragState.grabDX) + 'px';
    ghostEl.style.top = (y - this.dragState.grabDY) + 'px';
  },

  onDragMove(e) {
    if (!this.dragState) return;
    this.updateGhostPos(e.clientX, e.clientY);
    const { boardRect, cellSize, piece } = this.dragState;
    const relX = (e.clientX - this.dragState.grabDX) - (boardRect.left + 8);
    const relY = (e.clientY - this.dragState.grabDY) - (boardRect.top + 8);
    const c = Math.round(relX / cellSize);
    const r = Math.round(relY / cellSize);

    const valid = this.canPlace(piece.shape, r, c);
    this.clearPreview();
    piece.shape.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
        this.cellEls[nr * this.size + nc].classList.add(valid ? 'preview-ok' : 'preview-bad');
      }
    });
    this.dragState.lastR = r; this.dragState.lastC = c; this.dragState.lastValid = valid;
  },

  onDragEnd() {
    document.onpointermove = null;
    document.onpointerup = null;
    if (!this.dragState) return;
    const { trayIdx, piece, lastR, lastC, lastValid } = this.dragState;
    this.clearPreview();
    document.getElementById('ghost').style.display = 'none';
    if (lastValid) {
      this.placePiece(piece, lastR, lastC, trayIdx);
    }
    this.dragState = null;
  },

  canPlace(shape, r, c) {
    return shape.every(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      return nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !this.board[nr * this.size + nc].filled;
    });
  },

  clearPreview() {
    this.cellEls.forEach(el => el.classList.remove('preview-ok', 'preview-bad'));
  },

  placePiece(piece, r, c, trayIdx) {
    piece.shape.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      const idx = nr * this.size + nc;
      this.board[idx] = { filled: true, colorIdx: piece.colorIdx };
      this.cellEls[idx].className = 'cell filled just-placed';
      this.cellEls[idx].style.background = COLORS[piece.colorIdx].bg;
    });
    utils.audio.play('place');
    this.score += piece.shape.length;
    this.tray[trayIdx].used = true;
    this.renderTray();
    setTimeout(() => this.resolveLines(), 100);
  },

  // --- ライン消去ロジック ---
  resolveLines() {
    const fullRows = [];
    const fullCols = [];
    for (let r = 0; r < this.size; r++) {
      let full = true;
      for (let c = 0; c < this.size; c++) if (!this.board[r * this.size + c].filled) full = false;
      if (full) fullRows.push(r);
    }
    for (let c = 0; c < this.size; c++) {
      let full = true;
      for (let r = 0; r < this.size; r++) if (!this.board[r * this.size + c].filled) full = false;
      if (full) fullCols.push(c);
    }

    const lines = fullRows.length + fullCols.length;
    if (lines > 0) {
      this.streak++;
      const toClear = new Set();
      fullRows.forEach(r => { for (let c = 0; c < this.size; c++) toClear.add(r * this.size + c); });
      fullCols.forEach(c => { for (let r = 0; r < this.size; r++) toClear.add(r * this.size + c); });
      
      toClear.forEach(idx => this.cellEls[idx].classList.add('clearing'));
      utils.audio.play('clear');
      this.score += lines * 10 * lines + (this.streak > 1 ? this.streak * 5 : 0);
      this.showCombo(lines, this.streak);

      setTimeout(() => {
        toClear.forEach(idx => {
          this.board[idx] = { filled: false, colorIdx: -1 };
          this.cellEls[idx].className = 'cell';
          this.cellEls[idx].style.background = '';
        });
        if (this.tray.every(p => p.used)) this.fillTray(); else this.checkGameOver();
        this.updateUI();
      }, 360);
    } else {
      this.streak = 0;
      if (this.tray.every(p => p.used)) this.fillTray(); else this.checkGameOver();
      this.updateUI();
    }
  },

  showCombo(lines, streak) {
    const el = document.getElementById('comboText');
    el.textContent = `COMBO x${lines}${streak > 1 ? ' 🔥' + streak : ''}`;
    el.className = 'combo-text show';
    setTimeout(() => el.className = 'combo-text', 900);
  },

  updateUI() {
    document.getElementById('scoreVal').textContent = this.score;
    if (this.score > this.best) {
      this.best = this.score;
      document.getElementById('bestVal').textContent = this.best;
      utils.storage.set(STORAGE_BEST, this.best);
    }
    document.getElementById('coinVal').textContent = this.coins;
  },

  checkGameOver() {
    const remaining = this.tray.filter(p => !p.used);
    const possible = remaining.some(p => {
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.canPlace(p.shape, r, c)) return true;
        }
      }
      return false;
    });
    if (!possible && remaining.length > 0) {
      document.getElementById('finalScore').textContent = this.score;
      document.getElementById('overlay').classList.add('show');
    }
  }
};
