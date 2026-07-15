// ===================== 管理者設定 =====================
async function loadAdminSettings() {
  if (!G.authToken || G.currentUserId !== 'admin') return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/block-settings`, {
      headers: { 'Authorization': `Bearer ${G.authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      G.adminDisabledBlocks = data.disabledBlocks || [];
      G.adminSafetyMode = data.safetyMode || false;
    }
  } catch (e) {}
}

async function executeAdminCommand(cmd) {
  if (!G.authToken || G.currentUserId !== 'admin') return '❌ 管理者権限がありません';
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${G.authToken}` },
      body: JSON.stringify({ command: cmd })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'コマンド実行に失敗しました');
    if (cmd.startsWith('/setcoins')) {
      const parts = cmd.split(' ');
      const newCoins = parseInt(parts[1]);
      if (!isNaN(newCoins) && newCoins >= 0) { G.coins = newCoins; updateCoinUI(); }
    }
    if (cmd.startsWith('/setscore')) {
      const parts = cmd.split(' ');
      const score = parseInt(parts[2]);
      if (!isNaN(score) && score >= 0) { G.best = score; G.bestValEl.textContent = G.best; saveBest(G.best); }
    }
    return data.result || '✅ コマンドを実行しました';
  } catch (e) {
    return '❌ ' + e.message;
  }
}

async function renderAdminPanel() {
  G.modalContent.dataset.mode = 'admin';
  let html = `
    <h2 style="color:var(--gold);">🔧 管理者パネル</h2>
    <div class="sub">admin専用コマンド実行欄です。</div>
    <div class="admin-setting-item">
      <div class="label-row"><span>⌨️ 管理者コマンド</span></div>
      <input type="text" id="adminCmdInput" placeholder="コマンドを入力..." style="width:100%;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:var(--bg-deep2);color:var(--text);font-size:14px;font-family:'Nunito',sans-serif;margin-bottom:6px;">
      <button class="primary-btn" id="adminCmdBtn">実行</button>
      <div class="cmd-output" id="adminCmdOutput">📋 コマンド一覧:
  /setcoins &lt;amount&gt; - コインを指定値に設定
  /setscore &lt;mode&gt; &lt;score&gt; - モード別スコア設定 (soft, baked, hard, extreme)
  /safety [on|off] - 強制セーフティモード（引数なしで状態表示）
  /resetquests - 全ユーザーのクエスト進捗リセット
  /setplaytime &lt;seconds&gt; - プレイ時間を設定
  /ban &lt;ID&gt; - ユーザーをBAN
  /unban &lt;ID&gt; - BAN解除
  /resetuser &lt;ID&gt; - ユーザーデータリセット
  /listusers - ユーザー一覧表示
  /search &lt;ID&gt; - ユーザー情報検索
  /stats - サーバー統計情報
  /help - このヘルプ</div>
    </div>
    <div class="admin-setting-item">
      <div class="label-row"><span>🧩 ブロック出現設定（オフにすると出現しなくなります）</span></div>
      <div style="max-height:200px; overflow-y:auto;">
  `;
  const SHAPES = window.SHAPES || [
    [[0,0]],[[0,0]],
    [[0,0],[0,1]],[[0,0],[0,1]],
    [[0,0],[1,0]],[[0,0],[1,0]],
    [[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],
    [[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[0,2],[1,1]],[[1,0],[1,1],[1,2],[0,1]],
    [[0,0],[1,0],[2,0],[1,1]],[[0,1],[1,1],[2,1],[1,0]],
    [[0,0],[1,0],[2,0],[2,1]],[[0,1],[1,1],[2,1],[2,0]],
    [[0,1],[0,2],[1,0],[1,1]],[[0,0],[0,1],[1,1],[1,2]],
    [[0,1],[1,0],[1,1],[1,2],[2,1]],
    [[0,0],[0,1],[0,2],[0,3],[0,4]],[[0,0],[1,0],[2,0],[3,0],[4,0]],
    [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
  ];
  SHAPES.forEach((shape, idx) => {
    const isOff = G.adminDisabledBlocks.includes(idx);
    const { rows, cols } = shapeBounds(shape);
    const size = 24;
    html += `
      <div style="display:flex; align-items:center; gap:10px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <div class="block-grid-preview" style="grid-template-columns:repeat(${cols}, ${size}px); grid-template-rows:repeat(${rows}, ${size}px);">
          ${Array.from({ length: rows * cols }, (_, i) => {
            const r = Math.floor(i / cols), c = i % cols;
            const filled = shape.some(([sr, sc]) => sr === r && sc === c);
            return `<div class="block-cell ${filled ? '' : 'empty'}"></div>`;
          }).join('')}
        </div>
        <span style="font-size:12px; color:var(--text-dim);">#${idx}</span>
        <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
          <span style="font-size:12px; color:${isOff ? 'var(--coral)' : 'var(--mint)'};">${isOff ? 'OFF' : 'ON'}</span>
          <div class="toggle-switch ${isOff ? '' : 'active'}" data-block-index="${idx}" style="cursor:pointer;">
            <div class="knob"></div>
          </div>
        </div>
      </div>
    `;
  });
  html += `</div></div>`;
  G.modalContent.innerHTML = html;

  document.getElementById('adminCmdBtn').addEventListener('click', async () => {
    const input = document.getElementById('adminCmdInput');
    const output = document.getElementById('adminCmdOutput');
    const cmd = input.value.trim();
    if (!cmd) return;
    output.textContent = '⏳ 実行中...';
    const result = await executeAdminCommand(cmd);
    output.innerHTML = result;
    input.value = '';
  });

  document.querySelectorAll('.toggle-switch[data-block-index]').forEach(el => {
    el.addEventListener('click', async function() {
      const idx = parseInt(this.dataset.blockIndex, 10);
      const currentOff = G.adminDisabledBlocks.includes(idx);
      const enabled = currentOff;
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/block-toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${G.authToken}` },
          body: JSON.stringify({ blockIndex: idx, enabled })
        });
        if (res.ok) {
          const data = await res.json();
          G.adminDisabledBlocks = data.settings.disabledBlocks || [];
          renderAdminPanel();
        }
      } catch (e) {}
    });
  });
}
