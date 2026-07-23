window.Games.slots = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <style>
      .sl-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; max-width:340px; margin:18px auto; }
      .sl-cell {
        aspect-ratio:1; border-radius:14px; background:linear-gradient(180deg,#f8fafc,#cbd5e1);
        display:flex; align-items:center; justify-content:center; font-size:2.4rem;
        box-shadow: inset 0 4px 10px rgba(0,0,0,.3), 0 3px 10px rgba(0,0,0,.4);
        position:relative; overflow:hidden; transition: box-shadow .2s;
      }
      .sl-cell.spinning span { filter: blur(2px); }
      .sl-cell.hit3 { box-shadow: 0 0 0 4px #eab308, 0 0 22px #eab308; }
      .sl-cell.hit2 { box-shadow: 0 0 0 3px #4ade80; }
      .sl-paytable { font-size:.78rem; opacity:.75; margin-top:6px; line-height:1.6; }
      @media (max-width:520px){ .sl-grid{max-width:280px; gap:8px;} .sl-cell{font-size:2rem;} }
    </style>
    <div class="table-felt" style="background: radial-gradient(circle, #1e1b4b 0%, #0f172a 100%);">
      <h2>🎰 Royal Slots</h2>
      <div class="sl-grid" id="sl-grid">
        ${[0,1,2,3,4,5,6,7,8].map(i => `<div class="sl-cell" id="c${i}"><span>7️⃣</span></div>`).join('')}
      </div>
      <div class="sl-paytable">5 paylines: 3 rows + both diagonals · 3-of-a-kind pays <b>6×</b> (💎/7️⃣ pay <b>12×</b>) · 2 matching from the left pays <b>0.4×</b> back</div>
      <div id="sl-betmount"></div>
      <button class="pill" id="spin-btn" style="padding:12px 44px; font-size:1.1rem;">SPIN</button>
      <p id="slot-msg" style="margin-top: 14px; font-weight: bold; min-height: 44px;"></p>
    </div>
  `;

  const SYMS = ['🍒', '🍋', '🔔', '7️⃣', '💎', '🍀'];
  const bet = CasinoShared.betPanel(document.getElementById('sl-betmount'), { value: 50 });
  const spinBtn = document.getElementById('spin-btn');
  const msg = document.getElementById('slot-msg');
  const cellEl = (col, row) => document.getElementById('c' + (row * 3 + col));
  const LINE_CELLS = [
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
  ];

  // Column spins as a unit, decelerating; columns stop left→right for suspense
  function spinColumn(col, stopAfterMs, finalSyms) {
    return new Promise(resolve => {
      const cells = [0,1,2].map(r => cellEl(col, r));
      cells.forEach(c => c.classList.add('spinning'));
      const start = performance.now();
      function tick() {
        cells.forEach(c => { c.querySelector('span').textContent = SYMS[Math.floor(Math.random() * SYMS.length)]; });
        const elapsed = performance.now() - start;
        if (elapsed >= stopAfterMs) {
          cells.forEach((c, r) => { c.classList.remove('spinning'); c.querySelector('span').textContent = finalSyms[r]; });
          resolve(); return;
        }
        const p = elapsed / stopAfterMs;
        const delay = p > 0.6 ? 50 + Math.pow((p - 0.6) / 0.4, 2) * 220 : 50;
        setTimeout(tick, delay);
      }
      tick();
    });
  }

  spinBtn.addEventListener('click', async () => {
    const b = bet.get();
    if (b <= 0) { msg.textContent = 'Enter a valid bet.'; return; }
    if (window.GameAPI.cachedBalance != null && b > window.GameAPI.cachedBalance) { msg.textContent = 'Not enough chips.'; return; }
    spinBtn.disabled = true;
    msg.textContent = '';
    document.querySelectorAll('.sl-cell').forEach(c => c.classList.remove('hit3', 'hit2'));
    CasinoShared.playSound('spin');
    try {
      const d = await window.GameAPI.play({ game: 'slots', bet: b });
      await Promise.all([
        spinColumn(0, 900, d.grid[0]),
        spinColumn(1, 1400, d.grid[1]),
        spinColumn(2, 1900, d.grid[2]),
      ]);
      (d.hits || []).forEach(h => {
        const cells = LINE_CELLS[h.line];
        const count = h.kind === 3 ? 3 : 2;
        for (let i = 0; i < count; i++) {
          const [c, r] = cells[i];
          cellEl(c, r).classList.add(h.kind === 3 ? 'hit3' : 'hit2');
        }
      });
      msg.textContent = d.result;
      if (d.win > 0) CasinoShared.playSound('win');
    } catch (e) {
      document.querySelectorAll('.sl-cell').forEach(c => c.classList.remove('spinning'));
      msg.textContent = e.message;
    } finally {
      spinBtn.disabled = false;
    }
  });

  CasinoShared.addGameInfo(stage, { title: 'More info', html: `<p>Each spin creates a 3-by-3 grid. Wins are checked on the three horizontal rows and both diagonals.</p><table class="game-info-table"><thead><tr><th>Result</th><th>Gross payout</th></tr></thead><tbody><tr><td>Three 7s or diamonds</td><td>12× wager</td></tr><tr><td>Three matching regular symbols</td><td>6× wager</td></tr><tr><td>First two symbols match</td><td>0.4× wager</td></tr></tbody></table><p class="game-info-note">Winning lines are added together, then the original wager is subtracted to calculate the net result.</p>` });
};
