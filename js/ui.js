// UI wiring for FakeStake. LOAD THIS LAST (after shared.js, api.js, and all games).
const UI = {
  init() {
    this.bindEvents();
    this.boot();
  },

  async boot() {
    await window.GameAPI.getBalance(); // fetch + paint the topbar balance
    // auto-launch the default game so we never sit on "Loading engine..."
    const active = document.querySelector('.nav-btn.active');
    const game = active ? active.dataset.game : 'slots';
    if (window.Games[game]) window.Games[game]();
  },

  bindEvents() {
    const dailyBtn = document.getElementById('dailyClaimBtn');
    if (dailyBtn) {
      dailyBtn.addEventListener('click', async () => {
        dailyBtn.disabled = true;
        try {
          const d = await window.GameAPI.claimDaily();
          alert(`Claimed ${d.reward} daily chips! Balance: ${d.balance.toLocaleString()}`);
        } catch (e) {
          alert(e.message); // "Already claimed your daily chips today."
        } finally {
          dailyBtn.disabled = false;
        }
      });
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const game = btn.dataset.game;
        if (window.Games[game]) window.Games[game]();
      });
    });
  }
};
window.UI = UI;
document.addEventListener('DOMContentLoaded', () => UI.init());