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
    this.launch(game);
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
        this.launch(btn.dataset.game);
      });
    });
  },

  launch(game) {
    const stage = document.getElementById('game-stage');
    if (!window.Games || typeof window.Games[game] !== 'function') {
      // Almost always means js/games/<game>.js didn't load (404 -> served as HTML)
      if (stage) stage.innerHTML = `<div class="table-felt" style="text-align:center;">
        <h2>⚠️ ${game} didn't load</h2>
        <p style="opacity:.85;">The file <code>js/games/${game}.js</code> isn't available on the server.</p>
        <p style="opacity:.6; font-size:.85rem;">Check it deployed, then hard-refresh.</p></div>`;
      console.error(`Game "${game}" is not registered — js/games/${game}.js probably failed to load.`);
      return;
    }
    try { window.Games[game](); }
    catch (err) {
      console.error(`Game "${game}" crashed:`, err);
      if (stage) stage.innerHTML = `<div class="table-felt" style="text-align:center;">
        <h2>⚠️ ${game} crashed</h2><p style="opacity:.85;">${err.message}</p></div>`;
    }
  }
};
window.UI = UI;
document.addEventListener('DOMContentLoaded', () => UI.init());
