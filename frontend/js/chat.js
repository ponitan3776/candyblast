// ===================== チャット＆プロフィール =====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function fetchChatMessages() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/messages`);
    const data = await res.json();
    G.chatMessages = data;
    renderChatMessages();
  } catch (err) {
    console.warn('チャット取得失敗:', err);
  }
}

async function sendChatMessage(message) {
  if (!G.authToken) {
    alert('ログインが必要です');
    return false;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${G.authToken}`
      },
      body: JSON.stringify({ message })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '送信失敗');
    }
    await fetchChatMessages();
    return true;
  } catch (err) {
    alert(err.message);
    return false;
  }
}

async function showProfile(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/profile/${userId}`);
    if (!res.ok) throw new Error('ユーザーが見つかりません');
    const data = await res.json();
    G.modalContent.dataset.mode = 'profile';
    G.modalContent.innerHTML = `
      <h2 style="color:var(--gold);">👤 ${data.userId} のプロフィール</h2>
      <div style="text-align:left; padding:8px 0;">
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:var(--text-dim);">🏆 ベストスコア</span>
          <span style="color:var(--gold); font-weight:800;">${data.bestScore}点</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:var(--text-dim);">🪙 コイン</span>
          <span style="color:var(--gold); font-weight:800;">${data.coins}コイン</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:var(--text-dim);">⏱️ プレイ時間</span>
          <span style="color:var(--gold); font-weight:800;">${data.playTime}秒</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0;">
          <span style="color:var(--text-dim);">📅 登録日</span>
          <span style="color:var(--text-dim);">${new Date(data.joinedAt).toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
      <button class="ghost-btn" onclick="closeModal()">閉じる</button>
    `;
    G.modalOverlay.classList.add('show');
  } catch (err) {
    alert(err.message);
  }
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  if (G.chatMessages.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-dim);">まだメッセージがありません。</div>`;
    return;
  }
  container.innerHTML = G.chatMessages.map(msg => `
    <div style="display:flex; align-items:baseline; gap:6px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
      <span style="color:var(--gold); font-weight:700; cursor:pointer; flex-shrink:0;" onclick="showProfile('${msg.user_id}')">
        [${msg.user_id}]
      </span>
      <span style="color:var(--text); word-break:break-word;">${escapeHtml(msg.message)}</span>
      <span style="color:var(--text-dim); font-size:10px; margin-left:auto; flex-shrink:0;">
        ${new Date(msg.timestamp).toLocaleTimeString('ja-JP')}
      </span>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

function renderChatModal() {
  G.modalContent.dataset.mode = 'chat';
  G.modalContent.innerHTML = `
    <h2 style="color:var(--gold);">💬 グローバルチャット</h2>
    <div class="sub">全ユーザーと会話できます。</div>
    <div id="chatMessages" style="height:300px; overflow-y:auto; background:var(--bg-deep2); border-radius:12px; padding:10px; margin:8px 0; text-align:left; border:1px solid rgba(255,255,255,0.05);">
      <div style="text-align:center; color:var(--text-dim);">読み込み中...</div>
    </div>
    <div style="display:flex; gap:6px;">
      <input type="text" id="chatInput" placeholder="メッセージを入力..." style="flex:1; padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background:var(--bg-deep2); color:var(--text); font-size:14px; font-family:'Nunito',sans-serif;">
      <button class="primary-btn" id="chatSendBtn" style="flex-shrink:0; width:auto; padding:10px 20px; margin:0;">送信</button>
    </div>
    <div style="margin-top:6px; text-align:right; font-size:10px; color:var(--text-dim);">最新50件を表示</div>
  `;
  G.modalOverlay.classList.add('show');

  fetchChatMessages();

  document.getElementById('chatSendBtn').addEventListener('click', async () => {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    await sendChatMessage(msg);
    input.value = '';
  });

  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('chatSendBtn').click();
    }
  });

  if (G.chatPollingInterval) clearInterval(G.chatPollingInterval);
  G.chatPollingInterval = setInterval(fetchChatMessages, 3000);
}
