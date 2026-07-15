// ===================== サーバー同期 =====================
async function syncToServer() {
  if (!G.authToken) return;
  try {
    await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${G.authToken}` },
      body: JSON.stringify({
        bestScore: G.best,
        coins: G.coins,
        skins: window.ownedSkins,
        equippedSkin: window.equippedSkin,
        quests: G.quests,
        mode: G.currentMode,
        size: G.SIZE,
        playTime: G.playTime
      })
    });
  } catch (err) { console.warn('サーバー同期に失敗:', err.message); }
}

async function syncFromServer() {
  if (!G.authToken) return;
  try {
    const r = await fetch(`${API_BASE_URL}/api/sync`, { headers: { 'Authorization': `Bearer ${G.authToken}` } });
    if (!r.ok) return;
    const data = await r.json();
    G.best = Math.max(G.best, data.bestScore || 0);
    G.coins = Math.max(G.coins, data.coins || 0);
    if (data.skins) window.ownedSkins = data.skins;
    if (data.equippedSkin) {
      window.equippedSkin = data.equippedSkin;
      applySkin(window.equippedSkin);
    }
    if (data.playTime !== undefined) G.playTime = data.playTime;
    G.bestValEl.textContent = G.best;
    updateCoinUI();
    saveBest(G.best);
  } catch (err) { console.warn('サーバー取得失敗:', err.message); }
}

function syncPlayTime() {
  if (!G.authToken) return;
  fetch(`${API_BASE_URL}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${G.authToken}` },
    body: JSON.stringify({ playTime: G.playTime })
  }).catch(() => {});
}
