// ===================== サーバー同期 =====================
async function syncToServer() {
  if (!authToken) return;
  try {
    await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        bestScore: best,
        coins,
        skins: ownedSkins,
        equippedSkin,
        quests,
        mode: currentMode,
        size: SIZE,
        playTime
      })
    });
  } catch (err) { console.warn('サーバー同期に失敗しました:', err.message); }
}

async function syncFromServer() {
  if (!authToken) return;
  try {
    const r = await fetch(`${API_BASE_URL}/api/sync`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    if (!r.ok) return;
    const data = await r.json();
    best = Math.max(best, data.bestScore || 0);
    coins = Math.max(coins, data.coins || 0);
    if (data.skins) ownedSkins = data.skins;
    if (data.equippedSkin) {
      equippedSkin = data.equippedSkin;
      applySkin(equippedSkin);
    }
    if (data.playTime !== undefined) playTime = data.playTime;
    bestValEl.textContent = best;
    updateCoinUI();
    saveBest(best);
  } catch (err) { console.warn('サーバーからの取得に失敗しました:', err.message); }
}

function syncPlayTime() {
  if (!authToken) return;
  fetch(`${API_BASE_URL}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ playTime })
  }).catch(() => {});
}
