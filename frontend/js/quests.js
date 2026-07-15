// ===================== クエスト =====================
const QUEST_POOL = [
  { id: 'singleScore400', desc: '1回のプレイでスコア400点以上を叩き出す', statKey: 'bestSingleGameScore', target: 400, reward: 50 },
  { id: 'tripleClear', desc: '1回の設置で3ライン以上同時に消す(トリプルクリア)', statKey: 'tripleClearCount', target: 1, reward: 70 },
  { id: 'comboStreak4', desc: '1回のプレイでコンボストリークを4連続つなげる', statKey: 'maxComboStreak', target: 4, reward: 65 },
  { id: 'lines25', desc: 'ラインを合計25本消す', statKey: 'linesCleared', target: 25, reward: 55 },
  { id: 'hardMode1', desc: '「硬い」以上の難易度でゲームを1回プレイし切る', statKey: 'hardModeGamesPlayed', target: 1, reward: 45 },
  { id: 'pieces60', desc: 'ピースを合計60個配置する', statKey: 'piecesPlaced', target: 60, reward: 40 },
  { id: 'score600total', desc: '1日の合計スコアを600点稼ぐ', statKey: 'scoreEarned', target: 600, reward: 50 },
  { id: 'noClearStreak10', desc: 'ラインを消さずにピースを10個連続で置く我慢比べ', statKey: 'maxNoClearStreak', target: 10, reward: 60 },
  { id: 'bigPiece5', desc: '5マス以上の大きいブロックを5個配置する', statKey: 'bigPiecesPlaced', target: 5, reward: 55 },
  { id: 'play3', desc: 'ゲームを3回プレイする', statKey: 'gamesPlayed', target: 3, reward: 30 }
];

function pickDailyQuests() {
  const pool = [...QUEST_POOL];
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const q = pool.splice(idx, 1)[0];
    picked.push({ ...q, progress: 0, claimed: false });
  }
  return picked;
}

function updateQuestProgress() {
  G.quests.forEach(q => { q.progress = G.dailyStats[q.statKey] || 0; });
  saveDailyQuests();
  if (G.modalOverlay.classList.contains('show') && G.modalContent.dataset.mode === 'quests') renderQuestModal();
}

function claimQuest(id) {
  const q = G.quests.find(q => q.id === id);
  if (!q || q.claimed || q.progress < q.target) return;
  q.claimed = true;
  G.coins += q.reward;
  updateCoinUI();
  saveDailyQuests();
  renderQuestModal();
  syncToServer();
}

function renderQuestModal() {
  G.modalContent.dataset.mode = 'quests';
  let html = `<h2 style="color:var(--mint);">📋 デイリークエスト</h2><div class="sub">毎日リセットされます。がんばって集めよう！</div>`;
  G.quests.forEach(q => {
    const pct = Math.min(100, Math.floor((q.progress / q.target) * 100));
    const done = q.progress >= q.target;
    html += `
      <div class="quest-item">
        <div class="qtitle">${q.desc}</div>
        <div class="quest-bar-bg"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
        <div class="quest-foot">
          <span>${Math.min(q.progress, q.target)} / ${q.target}</span>
          <button class="claim-btn" data-qid="${q.id}" ${(!done || q.claimed) ? 'disabled' : ''}>
            ${q.claimed ? '受取済み' : `🪙${q.reward} 受け取る`}
          </button>
        </div>
      </div>`;
  });
  G.modalContent.innerHTML = html;
  G.modalContent.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', () => claimQuest(btn.dataset.qid));
  });
}
