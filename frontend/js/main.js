// ===================== メイン（起動時に実行） =====================
(function() {
  // ズーム無効化
  document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
  document.addEventListener('gestureend', function(e) { e.preventDefault(); });

  // 戻るボタン
  document.getElementById('backButton').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('本当に戻りますか？\nゲームの進行は保存されません。')) {
      window.location.href = 'https://my-link-portal.onrender.com';
    }
  });

  // サウンドボタン
  soundBtn.addEventListener('click', () => {
    unlockAudio();
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
  });

  // クエストボタン
  questBtn.addEventListener('click', () => {
    renderQuestModal();
    modalOverlay.classList.add('show');
  });

  // 設定ボタン
  settingsBtn.addEventListener('click', () => {
    pendingMode = currentMode;
    pendingSize = SIZE;
    renderSettingsModal('mode');
    modalOverlay.classList.add('show');
  });

  // アカウントボタン
  accountBtn.addEventListener('click', () => {
    renderAuthModal();
    modalOverlay.classList.add('show');
  });

  // ランキングボタン
  rankingBtn.addEventListener('click', () => {
    renderRankingModal();
    modalOverlay.classList.add('show');
  });

  // チャットボタン
  chatBtn.addEventListener('click', () => {
    renderChatModal();
    const observer = new MutationObserver(() => {
      if (!modalOverlay.classList.contains('show')) {
        if (chatPollingInterval) {
          clearInterval(chatPollingInterval);
          chatPollingInterval = null;
        }
      }
    });
    observer.observe(modalOverlay, { attributes: true, attributeFilter: ['class'] });
  });

  // 管理者ボタン
  adminPanelBtn.addEventListener('click', () => {
    if (currentUserId === 'admin') {
      renderAdminPanel();
      modalOverlay.classList.add('show');
    }
  });

  // モーダル閉じる
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // リスタートボタン
  restartBtn.addEventListener('click', () => {
    overlayEl.classList.remove('show');
    score = 0;
    streak = 0;
    noClearStreak = 0;
    updateScoreUI();
    initBoard();
    fillTray();
  });

  // 音声アンロック（1回だけ）
  document.body.addEventListener('pointerdown', unlockAudio, { once: true });

  // ===================== ゲーム開始！ =====================
  (async function start() {
    await loadBest();
    await loadCoins();
    await loadSkinsData();
    const isFirstTime = await loadSettings();
    await loadDailyQuests();
    updateAccountButton();
    updateModeBadge();
    initBoard();
    fillTray();
    if (isFirstTime) {
      pendingMode = currentMode;
      pendingSize = SIZE;
      renderSettingsModal('mode');
      modalOverlay.classList.add('show');
    }
  })();

})();
