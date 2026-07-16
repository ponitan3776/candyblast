/**
 * UI表示・レンダリング管理
 */

const ui = {
  overlay: document.getElementById('modalOverlay'),
  content: document.getElementById('modalContent'),

  showModal(mode, data = {}) {
    this.overlay.classList.add('show');
    this.render(mode, data);
  },

  closeModal() {
    this.overlay.classList.remove('show');
    this.content.innerHTML = '';
  },

  render(mode, data) {
    this.content.dataset.mode = mode;
    switch (mode) {
      case 'settings':
        this.renderSettings(data.tab || 'mode', data);
        break;
      case 'quests':
        this.renderQuests(data.quests);
        break;
      case 'ranking':
        this.renderRanking(data);
        break;
      case 'admin':
        this.renderAdmin(data);
        break;
      case 'auth':
        this.renderAuth(data.subMode || 'login');
        break;
    }
  },

  renderSettings(tab, data) {
    let html = `<h2 style="color:var(--gold);">⚙️ 設定</h2>
      <div class="tab-row">
        <button class="tab-btn ${tab === 'mode' ? 'active' : ''}" data-tab="mode">ゲームモード</button>
        <button class="tab-btn ${tab === 'skin' ? 'active' : ''}" data-tab="skin">🎨 スキン</button>
      </div>
      <div id="settingsTabBody">`;

    if (tab === 'mode') {
      html += this.getModeTabHtml(data);
    } else {
      html += this.getSkinTabHtml(data);
    }
    html += `</div>`;
    this.content.innerHTML = html;
    this.attachSettingsEvents(tab, data);
  },

  getModeTabHtml(data) {
    let html = `<div class="sub" style="margin-bottom:10px;">モードと盤面サイズを選んで「この設定でスタート」を押してください。</div>`;
    Object.entries(MODES).forEach(([key, m]) => {
      const selected = data.pendingMode === key;
      html += `
        <div class="mode-card ${selected ? 'selected' : ''}" data-mode="${key}">
          <div class="mode-card-head"><span class="mode-emoji">${m.emoji}</span><span>${m.label}</span>
            <span class="coin-tag">🪙×${MODE_COIN_MULT[key]}</span></div>
        </div>`;
    });
    const sizeNow = data.pendingMode === 'extreme' ? 8 : data.pendingSize;
    const totalMult = (MODE_COIN_MULT[data.pendingMode] * utils.sizeCoinMult(sizeNow)).toFixed(2);
    html += `
      <div class="size-row">
        <div class="qtitle" style="margin-bottom:2px;">盤面サイズ: <span id="sizeVal">${sizeNow}</span> × ${sizeNow}</div>
        <input type="range" id="sizeSlider" min="5" max="18" step="1" value="${sizeNow}" ${data.pendingMode === 'extreme' ? 'disabled' : ''}>
        <div class="sub" style="margin-top:4px;">${data.pendingMode === 'extreme' ? '激硬モードは8×8で固定です。' : '盤面が小さいほどコイン倍率が上がります。'}</div>
        <div class="sub" style="margin-top:8px; color:var(--gold); font-weight:800;">獲得コイン倍率: ×<span id="totalMultVal">${totalMult}</span></div>
      </div>
      <button class="primary-btn" id="applyModeBtn">この設定でスタート</button>`;
    return html;
  },

  getSkinTabHtml(data) {
    let html = `<div class="sub" style="margin-bottom:10px;">🪙 ${data.coins} 所持中。</div>`;
    SKINS.forEach(skin => {
      const owned = data.ownedSkins.includes(skin.id);
      const equipped = data.equippedSkin === skin.id;
      const canBuy = !owned && data.coins >= skin.price;
      let btnLabel = equipped ? '装備中' : owned ? '装備する' : (skin.price === 0 ? '入手する' : (canBuy ? '購入する' : '不足'));
      html += `
        <div class="quest-item">
          <div class="qtitle">${skin.name}${equipped ? ' ✅' : ''}</div>
          <div class="skin-swatches">${skin.colors.map(c => `<span class="swatch" style="background:${c.bg}"></span>`).join('')}</div>
          <div class="quest-foot" style="margin-top:8px;">
            <span>🪙${skin.price}</span>
            <button class="claim-btn" data-skin="${skin.id}" data-action="${equipped ? '' : (owned ? 'equip' : 'buy')}" ${equipped || (!owned && !canBuy) ? 'disabled' : ''}>${btnLabel}</button>
          </div>
        </div>`;
    });
    return html;
  },

  attachSettingsEvents(tab, data) {
    this.content.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => this.renderSettings(btn.dataset.tab, data);
    });
    if (tab === 'mode') {
      this.content.querySelectorAll('.mode-card').forEach(card => {
        card.onclick = () => {
          data.pendingMode = card.dataset.mode;
          if (data.pendingMode === 'extreme') data.pendingSize = 8;
          this.renderSettings('mode', data);
        };
      });
      const slider = document.getElementById('sizeSlider');
      if (slider) {
        slider.oninput = (e) => {
          data.pendingSize = parseInt(e.target.value);
          document.getElementById('sizeVal').textContent = data.pendingSize;
          document.getElementById('totalMultVal').textContent = (MODE_COIN_MULT[data.pendingMode] * utils.sizeCoinMult(data.pendingSize)).toFixed(2);
        };
      }
      document.getElementById('applyModeBtn').onclick = () => {
        if (data.onApply) data.onApply(data.pendingMode, data.pendingSize);
        this.closeModal();
      };
    } else {
      this.content.querySelectorAll('.claim-btn').forEach(btn => {
        btn.onclick = () => {
          if (data.onSkinAction) data.onSkinAction(btn.dataset.skin, btn.dataset.action);
        };
      });
    }
  },

  renderQuests(quests) {
    let html = `<h2 style="color:var(--mint);">📋 デイリークエスト</h2>`;
    quests.forEach(q => {
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
    this.content.innerHTML = html;
    this.content.querySelectorAll('.claim-btn').forEach(btn => {
      btn.onclick = () => { if (window.onClaimQuest) window.onClaimQuest(btn.dataset.qid); };
    });
  },

  renderAuth(subMode) {
    let html = `<h2 style="color:var(--gold);">👤 アカウント</h2>
      <div class="tab-row">
        <button class="tab-btn ${subMode === 'login' ? 'active' : ''}" data-amode="login">ログイン</button>
        <button class="tab-btn ${subMode === 'reg' ? 'active' : ''}" data-amode="reg">新規登録</button>
      </div>
      <div id="authFormBody">`;

    if (subMode === 'login') {
      html += `
        <form id="loginForm" class="auth-form active">
          <label>ユーザーID</label><input type="text" id="liId" required>
          <label>パスワード</label><input type="password" id="liPw" required>
          <button type="submit" class="primary-btn">ログイン</button>
          <div id="liMsg" class="auth-msg"></div>
        </form>`;
    } else {
      html += `
        <form id="regForm" class="auth-form active">
          <label>希望のユーザーID</label><input type="text" id="rgId" required>
          <label>パスワード</label><input type="password" id="rgPw" required>
          <button type="submit" class="primary-btn">登録する</button>
          <div id="rgMsg" class="auth-msg"></div>
        </form>`;
    }
    html += `</div>`;
    this.content.innerHTML = html;
    this.attachAuthEvents(subMode);
  },

  attachAuthEvents(subMode) {
    this.content.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => this.renderAuth(btn.dataset.amode);
    });
    const form = subMode === 'login' ? document.getElementById('loginForm') : document.getElementById('regForm');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const id = subMode === 'login' ? document.getElementById('liId').value : document.getElementById('rgId').value;
        const pw = subMode === 'login' ? document.getElementById('liPw').value : document.getElementById('rgPw').value;
        const msg = subMode === 'login' ? document.getElementById('liMsg') : document.getElementById('rgMsg');
        if (window.onAuthSubmit) await window.onAuthSubmit(subMode, id, pw, msg);
      };
    }
  }
};
