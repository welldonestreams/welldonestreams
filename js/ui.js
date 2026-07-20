const UI = {
  init() {
    this.bindEvents();
    this.refreshBalance();
  },
  async refreshBalance() {
    if (window.GameAPI) {
      let bal = await window.GameAPI.getBalance();
      this.updateBalance(bal);
    }
  },
  updateBalance(bal) {
    const el = document.getElementById('global-balance');
    if (el) el.textContent = bal.toLocaleString();
  },
  bindEvents() {
    const dailyBtn = document.getElementById('dailyClaimBtn');
    if (dailyBtn) {
      dailyBtn.addEventListener('click', () => {
        if (window.GameAPI) window.GameAPI.claimDaily();
      });
    }

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const game = btn.dataset.game;
        if (window.Games && window.Games[game]) {
          window.Games[game]();
        }
      });
    });
  }
};

window.UI = UI;
document.addEventListener('DOMContentLoaded', () => UI.init());
window.Games = {};
