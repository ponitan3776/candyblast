// ===================== ランキング =====================
let currentRankingMode = 'soft';
let currentRankingType = 'score';

async function renderRankingModal() {
  modalContent.dataset.mode = 'ranking';
  let html = `
    <h2 style="color:var(--gold);">🏆 ランキング</h2>
    <div class="sub">8×8サイズのスコアのみランキング対象です。</div>
    <div class="tab-row" style="margin-bottom:6px;">
      ${RANKING_TYPES.map(t => `
        <button class="tab-btn ${currentRankingType === t ? 'active' : ''}" data-rtype="${t}">${RANKING_TYPE_LABELS[t]}</button>
      `).join('')}
    </div>
    <div class="tab-row" id="modeTabs" style="margin-bottom:10px; ${currentRankingType === 'score' ? '' : 'display:none;'}">
      ${RANKING_MODES.map(m => `
        <button class="tab-btn ${currentRankingMode === m ? 'active' : ''}" data-rmode="${m}">${RANKING_MODE_LABELS[m]}</button>
      `).join('')}
    </div>
    <div id="rankingContent">
      <div class="sub">🔄 読み込み中...</div>
    </div>
  `;
  modalContent.innerHTML = html;

  modalContent.querySelectorAll('.tab-btn[data-rtype]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRankingType = btn.dataset.rtype;
      renderRankingModal();
    });
  });
  modalContent.querySelectorAll('.tab-btn[data-rmode]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRankingMode = btn.dataset.rmode;
      renderRankingModal();
    });
  });

  try {
    const res = await fetch(`${API_BASE_URL}/api/ranking?mode=${currentRankingMode}&type=${currentRankingType}`);
    const data = await res.json();
    let content = `<div style="text-align:left; max-height:380px; overflow-y:auto;">`;
    if (data.top && data.top.length > 0) {
      data.top.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const isMe = user.id === currentUserId;
        const valueLabel = currentRankingType === 'coins' ? `${user.value}コイン` :
          currentRankingType === 'playtime' ? `${user.value}秒` :
          `${user.value}点`;
        content += `
          <div style="display:flex; justify-content:space-between; padding:8px 4px; border-bottom:1px solid rgba(255,255,255,0.05); ${isMe ? 'background:rgba(255,217,61,0.15); border-radius:8px;' : ''}">
            <span style="font-weight:700; ${isMe ? 'color:var(--gold);' : ''}">${medal} ${user.id} ${isMe ? '👈' : ''}</span>
            <span style="color:var(--gold); font-weight:800;">${valueLabel}</span>
          </div>
        `;
      });
    } else {
      const msg = currentRankingType === 'score' ? 'このモードのランキングデータがまだありません。' :
        currentRankingType === 'coins' ? 'まだコインデータがありません。' :
        'プレイ時間データがまだありません。';
      content += `<div class="sub">${msg}</div>`;
    }
    content += `</div>`;

    if (authToken && currentUserId) {
      let myValue = 0;
      try {
        const syncRes = await fetch(`${API_BASE_URL}/api/sync`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const syncData = await syncRes.json();
        if (currentRankingType === 'coins') {
          myValue = syncData.coins || 0;
        } else if (currentRankingType === 'playtime') {
          myValue = syncData.playTime || 0;
        } else {
          const bestScores = syncData.bestScores || {};
          myValue = bestScores[currentRankingMode] || 0;
        }
      } catch (e) {}

      if (myValue > 0) {
        const higherCount = data.top ? data.top.filter(u => u.value > myValue).length : 0;
        const myInTop = data.top ? data.top.some(u => u.id === currentUserId) : false;
        let rankDisplay = myInTop ? `${data.top.findIndex(u => u.id === currentUserId) + 1}位` :
          (data.top && data.top.length > 0 ? `${higherCount + 1}位以上` : '-');
        const valueLabel = currentRankingType === 'coins' ? `${myValue}コイン` :
          currentRankingType === 'playtime' ? `${myValue}秒` :
          `${myValue}点`;
        content += `
          <div style="margin-top:16px; padding:14px 16px; background:linear-gradient(135deg,var(--panel-light),var(--panel)); border-radius:14px; border:2px solid var(--gold); display:flex; justify-content:space-between; align-items:center; position:sticky; bottom:0; backdrop-filter:blur(8px);">
            <span style="font-weight:700; color:var(--gold);">👤 ${currentUserId} の順位</span>
            <span style="font-weight:800; font-size:20px; color:var(--gold);">
              ${rankDisplay}
              <span style="font-size:14px; color:var(--text-dim); font-weight:400; margin-left:8px;">${valueLabel}</span>
            </span>
          </div>
        `;
      } else {
        const msg = currentRankingType === 'score' ? 'まだこのモードのスコアがありません。' :
          currentRankingType === 'coins' ? 'まだコインがありません。' :
          'プレイ時間が記録されていません。';
        content += `
          <div style="margin-top:16px; padding:14px 16px; background:var(--panel-light); border-radius:14px; text-align:center; color:var(--text-dim);">
            📊 ${msg}
          </div>
        `;
      }
    } else {
      content += `
        <div style="margin-top:16px; padding:14px 16px; background:var(--panel-light); border-radius:14px; text-align:center; color:var(--text-dim);">
          🔐 ログインすると自分の順位が表示されます
        </div>
      `;
    }
    document.getElementById('rankingContent').innerHTML = content;
  } catch (err) {
    document.getElementById('rankingContent').innerHTML = `<div class="sub" style="color:var(--coral);">❌ ランキングの読み込みに失敗しました</div>`;
  }
}
