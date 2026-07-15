// ===================== 永続化 =====================
async function loadBest() {
  try {
    const res = await window.storage.get(STORAGE_BEST, false);
    if (res && res.value) G.best = parseInt(res.value, 10) || 0;
  } catch (err) { G.best = 0; }
  G.bestValEl.textContent = G.best;
}

async function saveBest(val) {
  try { await window.storage.set(STORAGE_BEST, String(val), false); } catch (err) {}
}

async function loadCoins() {
  try {
    const res = await window.storage.get(STORAGE_COINS, false);
    if (res && res.value) G.coins = parseInt(res.value, 10) || 0;
  } catch (err) { G.coins = 0; }
  G.coinValEl.textContent = G.coins;
}

async function saveCoins(val) {
  try { await window.storage.set(STORAGE_COINS, String(val), false); } catch (err) {}
}

async function loadSettings() {
  let isFirstTime = true;
  try {
    const res = await window.storage.get(STORAGE_SETTINGS, false);
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      G.currentMode = MODES[parsed.mode] ? parsed.mode : 'baked';
      G.SIZE = (G.currentMode === 'extreme') ? 8 : Math.min(18, Math.max(5, parsed.size || 8));
      isFirstTime = false;
    }
  } catch (err) {}
  return isFirstTime;
}

async function saveSettings() {
  try {
    await window.storage.set(STORAGE_SETTINGS, JSON.stringify({ mode: G.currentMode, size: G.SIZE }), false);
  } catch (err) {}
}

async function loadSkinsData() {
  try {
    const res = await window.storage.get(STORAGE_SKINS, false);
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      window.ownedSkins = (parsed.owned && parsed.owned.length) ? parsed.owned : ['default'];
      window.equippedSkin = parsed.equipped || 'default';
    }
  } catch (err) { window.ownedSkins = ['default']; window.equippedSkin = 'default'; }
  applySkin(window.equippedSkin);
}

async function saveSkinsData() {
  try {
    await window.storage.set(STORAGE_SKINS, JSON.stringify({ owned: window.ownedSkins, equipped: window.equippedSkin }), false);
  } catch (err) {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function loadDailyQuests() {
  const today = todayKey();
  try {
    const res = await window.storage.get(STORAGE_QUESTS, false);
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      if (parsed.date === today) {
        G.dailyStats = { ...DAILY_STATS_DEFAULT, ...parsed.stats, date: today };
        G.quests = parsed.quests;
        return;
      }
    }
  } catch (err) {}
  G.dailyStats = { date: today, ...DAILY_STATS_DEFAULT };
  G.quests = pickDailyQuests();
  await saveDailyQuests();
}

async function saveDailyQuests() {
  G.dailyStats.date = todayKey();
  try {
    await window.storage.set(STORAGE_QUESTS, JSON.stringify({ date: G.dailyStats.date, stats: G.dailyStats, quests: G.quests }), false);
  } catch (err) {}
}
