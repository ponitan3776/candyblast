import { SKINS } from './config.js';
import { loadSkinsData as loadStorage, saveSkinsData as saveStorage } from './storage.js';

// ゲーム内のグローバル参照（後でapp.jsから注入しても可）
let _COLORS = [];
let _board = [];
let _cellEls = [];
let _renderTray = null;

/**
 * 外部から依存を注入（app.jsで呼ぶ）
 */
export function injectSkinDependencies({ COLORS, board, cellEls, renderTray }) {
  _COLORS = COLORS;
  _board = board;
  _cellEls = cellEls;
  _renderTray = renderTray;
}

/**
 * スキンを適用（CSS変数・タイトル・カラーパレット・既存セルの再描画）
 */
export function applySkin(id) {
  const skin = SKINS.find(s => s.id === id) || SKINS[0];
  // CSS変数
  Object.entries(skin.vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
  // タイトルグラデ
  const titleEl = document.querySelector('.title');
  if (titleEl) titleEl.style.background = skin.titleGrad;
  // カラーパレットを差し替え
  _COLORS.length = 0;
  skin.colors.forEach(c => _COLORS.push(c));
  // 既存の盤面セルの色を更新（filledセルのみ）
  if (_cellEls.length && _board.length) {
    _board.forEach((cellData, idx) => {
      if (cellData.filled && _COLORS[cellData.colorIdx]) {
        _cellEls[idx].style.background = _COLORS[cellData.colorIdx].bg;
      }
    });
  }
  // トレイ再描画（ある場合）
  if (_renderTray) _renderTray();
}

/**
 * スキンを購入
 * @returns {{ newCoins, newOwned }}
 */
export function buySkin(id, coins, ownedSkins) {
  const skin = SKINS.find(s => s.id === id);
  if (!skin || ownedSkins.includes(id) || coins < skin.price) {
    return { newCoins: coins, newOwned: ownedSkins, success: false };
  }
  const newCoins = coins - skin.price;
  const newOwned = [...ownedSkins, id];
  return { newCoins, newOwned, success: true };
}

/**
 * スキンを装備（所有チェック済み）
 */
export function equipSkin(id, ownedSkins) {
  if (!ownedSkins.includes(id)) return { equipped: null, success: false };
  return { equipped: id, success: true };
}

/**
 * ストレージからスキン情報を読み込む
 */
export async function loadSkinsData() {
  const data = await loadStorage();
  return data; // { owned, equipped }
}

/**
 * ストレージにスキン情報を保存
 */
export async function saveSkinsData(owned, equipped) {
  await saveStorage(owned, equipped);
}

/**
 * スキンIDからスキンオブジェクトを取得
 */
export function getSkin(id) {
  return SKINS.find(s => s.id === id) || SKINS[0];
}

/**
 * 全スキンリストを取得
 */
export function getSkins() {
  return SKINS;
}
