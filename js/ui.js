// UI wiring for WellDoneBets. LOAD THIS LAST.
const UI = {
  initialized: false,
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bindEvents();
    this.boot();
  },

  boot() {
    // Launch the active game immediately. Balance loading must never block the UI.
    const active = document.querySelector('.nav-btn.active');
    const game = active ? active.dataset.game : 'slots';
    this.launch(game);

    // Fetch the balance in the background. GameAPI handles failures/timeouts.
    window.GameAPI.getBalance().catch((error) => {
      console.error('Casino balance initialization failed:', error);
    });
  },

  bindEvents() {
    const dailyBtn = document.getElementById('dailyClaimBtn');
    if (dailyBtn) {
      dailyBtn.addEventListener('click', async () => {
        dailyBtn.disabled = true;
        try {
          const data = await window.GameAPI.claimDaily();
          alert(`Claimed ${data.reward} daily chips! Balance: ${data.balance.toLocaleString()}`);
        } catch (error) {
          alert(error.message);
        } finally {
          dailyBtn.disabled = false;
        }
      });
    }

    document.querySelectorAll('.nav-btn').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach((item) => {
          item.classList.remove('active');
          item.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        this.launch(button.dataset.game);
      });
    });
  },

  launch(game) {
    const stage = document.getElementById('game-stage');

    // Let the previous game stop timers and other background activity before
    // the stage is replaced.
    window.dispatchEvent(new CustomEvent('casino:game-leave'));

    if (!window.Games || typeof window.Games[game] !== 'function') {
      if (stage) {
        stage.innerHTML = `
          <div class="table-felt" style="text-align:center;">
            <h2>⚠️ ${game} didn't load</h2>
            <p style="opacity:.85;">The file <code>js/games/${game}.js</code> isn't available or failed to run.</p>
            <p style="opacity:.6; font-size:.85rem;">Check the deployed file, then hard-refresh.</p>
          </div>`;
      }
      console.error(`Game "${game}" is not registered.`);
      return;
    }

    try {
      window.Games[game]();
    } catch (error) {
      console.error(`Game "${game}" crashed:`, error);
      if (stage) {
        stage.innerHTML = `
          <div class="table-felt" style="text-align:center;">
            <h2>⚠️ ${game} crashed</h2>
            <p style="opacity:.85;">${error.message}</p>
          </div>`;
      }
    }
  }
};

window.UI = UI;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UI.init(), { once: true });
} else {
  UI.init();
}
