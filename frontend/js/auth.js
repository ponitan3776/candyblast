/**
 * 認証・同期管理
 */

const auth = {
  token: null,
  userId: null,

  async login(id, password) {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ログインに失敗しました');
    this.token = data.token;
    this.userId = id;
    localStorage.setItem('candyblast_token', this.token);
    localStorage.setItem('candyblast_userId', this.userId);
    return data;
  },

  async register(id, password) {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登録に失敗しました');
    return data;
  },

  logout() {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('candyblast_token');
    localStorage.removeItem('candyblast_userId');
  },

  loadFromStorage() {
    this.token = localStorage.getItem('candyblast_token');
    this.userId = localStorage.getItem('candyblast_userId');
  },

  async syncToServer(gameData) {
    if (!this.token) return;
    try {
      await fetch(`${API_BASE_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(gameData)
      });
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  },

  async syncFromServer() {
    if (!this.token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/sync`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fetch sync failed:', e);
    }
    return null;
  }
};
