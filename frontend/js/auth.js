import { API_BASE_URL } from './config.js';
import { login, register, recoverPassword, deleteAccount, syncFromServer, syncToServer } from './api.js';
import { 
  setAuthData, startPlayTimeTracking, stopPlayTimeTracking, 
  playSound, updateCoinUI, updateScoreUI, 
  best, coins, playTime, 
  boardEl, modalOverlay, modalContent,
  currentUserId, authToken
} from './game-core.js';
import { closeModal } from './ui.js'; // 後で実装

// ---- 認証モーダル描画 ----
export function renderAuthModal() {
  modalContent.dataset.mode = 'auth';
  if (currentUserId) {
    modalContent.innerHTML = `
      <h2 style="color:var(--gold);">👤 アカウント</h2>
      <div class="sub">ログイン中: <b>${currentUserId}</b></div>
      <div class="sub">スコア・コインはサーバーと同期されています。</div>
      <button class="primary-btn" id="syncNowBtn">今すぐ同期する</button>
      <button class="ghost-btn" id="logoutBtn">ログアウト</button>
      <button class="ghost-btn" id="deleteAccountBtn" style="color:var(--coral);border-color:var(--coral);">🗑️ アカウント削除</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      setAuthData(null, null);
      stopPlayTimeTracking();
      // best, coins はクリアしない（ローカルに残す）
      updateAccountButton();
      renderAuthModal();
      closeModal();
    });
    document.getElementById('syncNowBtn').addEventListener('click', async () => {
      await syncFromServer(authToken);
      await syncToServer(authToken, { bestScore: best, coins, playTime });
    });
    document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
      if (!authToken) return;
      if (!confirm('⚠️ 本当にアカウントを削除しますか？\nこの操作は元に戻せません！')) return;
      if (!confirm('本当に削除しますか？（最終確認）')) return;
      try {
        await deleteAccount(authToken);
        alert('アカウントを削除しました。');
        setAuthData(null, null);
        updateAccountButton();
        renderAuthModal();
        closeModal();
      } catch (err) { alert(err.message); }
    });
    return;
  }

  // 未ログイン
  modalContent.innerHTML = `
    <h2 style="color:var(--gold);">👤 アカウント</h2>
    <div class="tab-row">
      <button class="tab-btn active" data-tab="login">ログイン</button>
      <button class="tab-btn" data-tab="register">新規登録</button>
      <button class="tab-btn" data-tab="recover">復元</button>
    </div>
    <form class="auth-form active" id="loginForm">
      <label>ID</label><input type="text" id="loginId" autocomplete="username" />
      <label>パスワード</label><input type="password" id="loginPw" autocomplete="current-password" />
      <button type="submit" class="primary-btn">ログイン</button>
      <div class="auth-msg" id="loginMsg"></div>
    </form>
    <form class="auth-form" id="registerForm">
      <label>ID (半角英数字3〜20文字)</label><input type="text" id="regId" autocomplete="username" />
      <label>パスワード (6文字以上)</label><input type="password" id="regPw" autocomplete="new-password" />
      <button type="submit" class="primary-btn">新規登録</button>
      <div class="auth-msg" id="regMsg"></div>
    </form>
    <form class="auth-form" id="recoverForm">
      <label>ID</label><input type="text" id="recId" />
      <label>復元コード(管理者から受け取ったもの)</label><input type="text" id="recCode" placeholder="XXXX-XXXX-XXXX-XXXX" />
      <label>新しいパスワード</label><input type="password" id="recPw" autocomplete="new-password" />
      <button type="submit" class="primary-btn">パスワードを再設定</button>
      <div class="auth-msg" id="recMsg"></div>
    </form>
  `;

  // タブ切り替え
  modalContent.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modalContent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modalContent.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      modalContent.querySelector(`#${btn.dataset.tab}Form`).classList.add('active');
    });
  });

  // ログインフォーム
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('loginId').value.trim();
    const password = document.getElementById('loginPw').value;
    const msgEl = document.getElementById('loginMsg');
    msgEl.textContent = '処理中...'; msgEl.className = 'auth-msg';
    try {
      const data = await login(id, password);
      setAuthData(data.token, data.id);
      // サーバーデータを反映
      best = data.bestScore || 0;
      coins = data.coins || 0;
      playTime = data.playTime || 0;
      updateScoreUI();
      updateCoinUI();
      startPlayTimeTracking();
      msgEl.textContent = 'ログインしました！'; msgEl.className = 'auth-msg ok';
      await syncFromServer(authToken);
      updateAccountButton();
      setTimeout(renderAuthModal, 500);
    } catch (err) {
      msgEl.textContent = err.message + '(サーバーに接続できているか確認してください)';
      msgEl.className = 'auth-msg error';
    }
  });

  // 新規登録フォーム
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('regId').value.trim();
    const password = document.getElementById('regPw').value;
    const msgEl = document.getElementById('regMsg');
    msgEl.textContent = '処理中...'; msgEl.className = 'auth-msg';
    try {
      const data = await register(id, password);
      setAuthData(data.token, data.id);
      best = 0; coins = 0; playTime = 0;
      updateScoreUI();
      updateCoinUI();
      startPlayTimeTracking();
      msgEl.textContent = '登録が完了しました！復元コードは管理者のDiscordに通知されました。';
      msgEl.className = 'auth-msg ok';
      await syncToServer(authToken, { bestScore: 0, coins: 0, playTime: 0 });
      updateAccountButton();
      setTimeout(renderAuthModal, 800);
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.className = 'auth-msg error';
    }
  });

  // 復元フォーム
  document.getElementById('recoverForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('recId').value.trim();
    const recoveryCode = document.getElementById('recCode').value.trim();
    const newPassword = document.getElementById('recPw').value;
    const msgEl = document.getElementById('recMsg');
    msgEl.textContent = '処理中...'; msgEl.className = 'auth-msg';
    try {
      await recoverPassword(id, recoveryCode, newPassword);
      msgEl.textContent = 'パスワードを再設定しました。ログインしてください。';
      msgEl.className = 'auth-msg ok';
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.className = 'auth-msg error';
    }
  });
}

// ---- アカウントボタン更新 ----
export function updateAccountButton() {
  const accountBtn = document.getElementById('accountBtn');
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (accountBtn) {
    accountBtn.title = currentUserId ? `ログイン中: ${currentUserId}` : '未ログイン';
  }
  if (adminPanelBtn) {
    adminPanelBtn.style.display = (currentUserId === 'admin') ? 'flex' : 'none';
  }
}

// ---- 初期化（app.jsから呼び出し） ----
export function initAuth() {
  // イベントバインドはapp.jsで行う
}
