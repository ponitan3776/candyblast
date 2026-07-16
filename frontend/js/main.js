/**
 * エントリーポイント
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- 初期データ読み込み ---
  auth.loadFromStorage();
  const bestRes = await utils.storage.get(STORAGE_BEST);
  game.best = bestRes ? parseInt(bestRes.value) : 0;
  const coinRes = await utils.storage.get(STORAGE_COINS);
  game.coins = coinRes ? parseInt(coinRes.value) : 0;

  // --- ゲーム開始 ---
  const settingsRes = await utils.storage.get(STORAGE_SETTINGS);
  let mode = 'baked', size = 8;
  if (settingsRes) {
    const s = JSON.parse(settingsRes.value);
    mode = s.mode; size = s.size;
  }
  game.init(size, mode);
  updateHeaderUI();

  // --- イベント設定 ---
  document.getElementById('settingsBtn').onclick = () => {
    ui.showModal('settings', {
      pendingMode: game.mode,
      pendingSize: game.size,
      coins: game.coins,
      ownedSkins: ['default'], // 簡易化のため
      equippedSkin: 'default',
      onApply: (m, s) => {
        game.init(s, m);
        utils.storage.set(STORAGE_SETTINGS, JSON.stringify({ mode: m, size: s }));
        updateHeaderUI();
      }
    });
  };

  document.getElementById('questBtn').onclick = () => {
    ui.showModal('quests', { quests: [] }); // 簡易化
  };

  document.getElementById('accountBtn').onclick = () => {
    ui.showModal('auth', { subMode: 'login' });
  };

  document.getElementById('modalCloseBtn').onclick = () => ui.closeModal();
  document.getElementById('restartBtn').onclick = () => {
    document.getElementById('overlay').classList.remove('show');
    game.init(game.size, game.mode);
  };
  document.getElementById('homeBtn').onclick = () => location.reload();

  document.getElementById('soundBtn').onclick = () => {
    utils.audio.enabled = !utils.audio.enabled;
    document.getElementById('soundBtn').textContent = utils.audio.enabled ? '🔊' : '🔇';
  };

  // --- グローバル関数 (UI用) ---
  window.onAuthSubmit = async (subMode, id, pw, msgEl) => {
    msgEl.textContent = '処理中...';
    try {
      if (subMode === 'login') {
        await auth.login(id, pw);
        msgEl.textContent = 'ログイン成功！';
        setTimeout(() => ui.closeModal(), 1000);
      } else {
        await auth.register(id, pw);
        msgEl.textContent = '登録完了！ログインしてください。';
      }
    } catch (e) {
      msgEl.textContent = e.message;
      msgEl.className = 'auth-msg error';
    }
  };

  function updateHeaderUI() {
    const badge = document.getElementById('modeBadge');
    const m = MODES[game.mode];
    badge.textContent = `${m.emoji} ${m.label} · ${game.size}×${game.size}`;
  }
});
