window.Games.slots = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <style>
      .sl-machine { display:flex; gap:14px; justify-content:center; margin:18px 0; }
      .sl-reel {
        width:96px; height:112px; border-radius:14px;
        background:linear-gradient(180deg,#f8fafc,#cbd5e1);
        color:#0f172a; display:flex; align-items:center; justify-content:center;
        font-size:3rem; box-shadow: inset 0 4px 10px rgba(0,0,0,.35), 0 4px 12px rgba(0,0,0,.4);
        overflow:hidden; position:relative;
      }
      .sl-reel .sym { transition: transform .06s linear; }
      .sl-reel.spinning .sym { filter: blur(1.5px); }
    </style>
    <div class="table-felt" style="background: radial-gradient(circle, #1e1b4b 0%, #0f172a 100%);">
      <h2>🎰 Royal Slots</h2>
      <div class="sl-machine">
        <div class="sl-reel" id="r1"><span class="sym">7️⃣</span></div>
        <div class="sl-reel" id="r2"><span class="sym">7️⃣</span></div>
        <div class="sl-reel" id="r3"><span class="sym">7️⃣</span></div>
      </div>
      <div id="sl-betmount"></div>
      <button class="pill" id="spin-btn" style="padding:12px 44px; font-size:1.1rem;">SPIN</button>
      <p id="slot-msg" style="margin-top: 14px; font-weight: bold; min-height: 24px;"></p>
    </div>
  `;

  const SYMS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣', '🍀'];
  const bet = CasinoShared.betPanel(document.getElementById('sl-betmount'), { value: 50 });
  const spinBtn = document.getElementById('spin-btn');
  const msg = document.getElementById('slot-msg');
  const reels = [1, 2, 3].map(i => document.getElementById('r' + i));

  // Smooth spin: symbols cycle fast then decelerate; reels stop left-to-right for suspense
  function spinReel(el, stopAfterMs, finalSym) {
    return new Promise(resolve => {
      const sym = el.querySelector('.sym');
      el.classList.add('spinning');
      let delay = 45;               // start fast
      const start = performance.now();
      function tick() {
        sym.textContent = SYMS[Math.floor(Math.random() * SYMS.length)];
        sym.style.transform = `translateY(${(Math.random() * 8 - 4).toFixed(1)}px)`;
        const elapsed = performance.now() - start;
        if (elapsed >= stopAfterMs) {
          el.classList.remove('spinning');
          sym.style.transform = 'translateY(0)';
          sym.textContent = finalSym;
          resolve();
          return;
        }
        // ease-out: last 40% of the spin slows down progressively
        const p = elapsed / stopAfterMs;
        delay = p > 0.6 ? 45 + Math.pow((p - 0.6) / 0.4, 2) * 200 : 45;
        setTimeout(tick, delay);
      }
      tick();
    });
  }

  spinBtn.addEventListener('click', async () => {
    const b = bet.get();
    if (b <= 0) { msg.textContent = 'Enter a valid bet.'; return; }
    if (window.GameAPI.cachedBalance != null && b > window.GameAPI.cachedBalance) {
      msg.textContent = 'Not enough chips.'; return;
    }
    spinBtn.disabled = true;
    msg.textContent = '';
    CasinoShared.playSound('spin');
    try {
      const d = await window.GameAPI.play({ game: 'slots', bet: b });
      await Promise.all([
        spinReel(reels[0], 900, d.reels[0]),
        spinReel(reels[1], 1450, d.reels[1]),
        spinReel(reels[2], 2000, d.reels[2]),
      ]);
      msg.textContent = d.result;
      if (d.result.includes('JACKPOT')) CasinoShared.playSound('win');
    } catch (e) {
      reels.forEach(r => r.classList.remove('spinning'));
      msg.textContent = e.message;
    } finally {
      spinBtn.disabled = false;
    }
  });
};