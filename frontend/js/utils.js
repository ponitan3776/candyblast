/**
 * ユーティリティ関数
 */

const utils = {
  // --- ストレージ操作 ---
  storage: {
    async get(key, isServer = false) {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    async set(key, value, isServer = false) {
      localStorage.setItem(key, value);
    }
  },

  // --- サウンド管理 ---
  audio: {
    ctx: null,
    enabled: true,
    unlock() {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) {}
    },
    play(type) {
      if (!this.enabled) return;
      this.unlock();
      if (!this.ctx) return;
      try {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        if (type === 'place') {
          o.type = 'sine'; o.frequency.value = 440;
          g.gain.setValueAtTime(0.09, this.ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
          o.start(); o.stop(this.ctx.currentTime + 0.13);
        } else if (type === 'clear') {
          o.type = 'triangle'; o.frequency.setValueAtTime(660, this.ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(990, this.ctx.currentTime + 0.2);
          g.gain.setValueAtTime(0.11, this.ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
          o.start(); o.stop(this.ctx.currentTime + 0.3);
        } else if (type === 'coin') {
          o.type = 'square'; o.frequency.setValueAtTime(880, this.ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.1);
          g.gain.setValueAtTime(0.08, this.ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
          o.start(); o.stop(this.ctx.currentTime + 0.18);
        }
      } catch (e) {}
    }
  },

  // --- ヘルパー ---
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  sizeCoinMult(size) {
    if (size <= 5) return 2.2;
    if (size <= 6) return 1.8;
    if (size <= 7) return 1.3;
    if (size <= 8) return 1.0;
    if (size <= 10) return 0.8;
    if (size <= 12) return 0.6;
    return 0.45;
  },

  shapeBounds(shape) {
    let maxR = 0, maxC = 0;
    shape.forEach(([r, c]) => {
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    });
    return { rows: maxR + 1, cols: maxC + 1 };
  }
};
