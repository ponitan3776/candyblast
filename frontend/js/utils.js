// ==================== 日付・時間 ====================
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatPlayTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m}m${s}s`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}

// ==================== HTMLエスケープ ====================
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== ランダム ====================
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ==================== 配列 ====================
export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ==================== 形状（ゲーム固有） ====================
export function shapeBounds(shape) {
  let maxR = 0, maxC = 0;
  shape.forEach(([r, c]) => {
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  });
  return { rows: maxR + 1, cols: maxC + 1 };
}

export function shapeToGrid(shape, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  shape.forEach(([r, c]) => {
    if (r < rows && c < cols) grid[r][c] = true;
  });
  return grid;
}

// ==================== 遅延 ====================
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== バリデーション ====================
export function isValidId(id) {
  return /^[a-zA-Z0-9]{3,20}$/.test(id);
}

export function isValidPassword(pw) {
  return pw.length >= 6;
}

// ==================== デバッグ ====================
export const isDev = import.meta.env?.MODE === 'development';

export function debugLog(...args) {
  if (isDev) console.log('[DEBUG]', ...args);
}

// ==================== オブジェクト操作 ====================
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(obj) {
  return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

// ==================== ファイルサイズ整形 ====================
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}
