// GameAPI — communicates with the casino Worker through /api/casino/*.
window.GameAPI = {
  BASE: '/api/casino',
  cachedBalance: null,
  REQUEST_TIMEOUT_MS: 10000,

  getUserId() {
    let user = null;

    try {
      user = localStorage.getItem('wds-casino-user');
    } catch (error) {
      console.warn('Unable to read casino nickname from localStorage.', error);
    }

    if (!user) {
      user = (prompt('Pick a nickname for your chips (saved on this device):') || '').trim();
      user = user.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);

      if (!user) {
        user = `guest-${Math.random().toString(36).slice(2, 8)}`;
      }

      try {
        localStorage.setItem('wds-casino-user', user);
      } catch (error) {
        console.warn('Unable to save casino nickname to localStorage.', error);
      }
    }

    return user;
  },

  async request(path, options = {}) {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.BASE}${path}${separator}user=${encodeURIComponent(this.getUserId())}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      let data = {};
      try {
        data = await response.json();
      } catch (error) {
        // Preserve the HTTP error below when the server does not return JSON.
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('The casino server took too long to respond.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },

  async getBalance() {
    try {
      const data = await this.request('/balance');
      this.cachedBalance = data.balance;
    } catch (error) {
      console.error('Balance fetch failed:', error.message);
      // Keep an unknown balance unknown. Treating a temporary outage as a real
      // zero prevents players from placing a bet even after the game UI loads.
      const element = document.getElementById('global-balance');
      if (element && this.cachedBalance == null) element.textContent = '?';
    }

    this.updateBalanceUI();
    return this.cachedBalance;
  },

  async claimDaily() {
    const data = await this.request('/claim', { method: 'POST' });
    this.cachedBalance = data.balance;
    this.updateBalanceUI();
    return data;
  },

  async play(payload) {
    const data = await this.request('/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (typeof data.newBalance === 'number') {
      this.cachedBalance = data.newBalance;
      this.updateBalanceUI();
    }

    return data;
  },

  updateBalanceUI() {
    const element = document.getElementById('global-balance');
    if (!element || this.cachedBalance == null) return;

    const previous = element.textContent;
    const next = this.cachedBalance.toLocaleString();
    element.textContent = next;

    if (previous !== next && previous !== '---') {
      const badge = element.closest('.balance-badge') || element.parentElement;
      if (badge) {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
    }
  }
};
