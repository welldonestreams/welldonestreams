// GameAPI — talks to the Worker at /api/casino/*. Server owns all balances now.
// Each device picks a nickname once (stored locally) so people get their own wallet.
window.GameAPI = {
  BASE: '/api/casino',
  cachedBalance: null,

  getUserId() {
    let u = null;
    try { u = localStorage.getItem('wds-casino-user'); } catch (e) {}
    if (!u) {
      u = (prompt('Pick a nickname for your chips (saved on this device):') || '').trim();
      u = u.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
      if (!u) u = 'guest-' + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem('wds-casino-user', u); } catch (e) {}
    }
    return u;
  },

  async request(path, opts = {}) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${this.BASE}${path}${sep}user=${encodeURIComponent(this.getUserId())}`, opts);
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  },

  async getBalance() {
    try {
      const d = await this.request('/balance');
      this.cachedBalance = d.balance;
    } catch (e) {
      if (this.cachedBalance == null) this.cachedBalance = 0;
      console.error('Balance fetch failed:', e.message);
    }
    this.updateBalanceUI();
    return this.cachedBalance;
  },

  async claimDaily() {
    const d = await this.request('/claim', { method: 'POST' }); // throws if already claimed today
    this.cachedBalance = d.balance;
    this.updateBalanceUI();
    return d;
  },

  // payload examples:
  //  { game:'slots', bet:50 }
  //  { game:'coinflip', bet:50, choice:'heads' }
  //  { game:'roulette', bets:[{choice:'red',amt:100},{choice:'number',number:17,amt:10}] }
  //  { game:'blackjack', netWin:-150, resultMsg:'You lost 150 chips.' }
  async play(payload) {
    const d = await this.request('/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (typeof d.newBalance === 'number') {
      this.cachedBalance = d.newBalance;
      this.updateBalanceUI();
    }
    return d;
  },

  updateBalanceUI() {
    const el = document.getElementById('global-balance');
    if (el && this.cachedBalance != null) el.textContent = this.cachedBalance.toLocaleString();
  }
};
