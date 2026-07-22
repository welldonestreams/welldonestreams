window.Games.craps = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <style>
      .cr-dice { display:flex; gap:18px; justify-content:center; margin:22px 0 10px; }
      .cr-die {
        width:84px; height:84px; border-radius:16px; background:#fff; color:#111;
        display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr);
        padding:10px; box-shadow:0 6px 14px rgba(0,0,0,.5); transition: transform .15s;
      }
      .cr-die.rolling { animation: crshake .28s infinite; }
      @keyframes crshake { 0%{transform:rotate(-9deg) translateY(-3px);} 50%{transform:rotate(9deg) translateY(3px);} 100%{transform:rotate(-9deg) translateY(-3px);} }
      .cr-pip { width:14px; height:14px; border-radius:50%; background:#111; align-self:center; justify-self:center; }
      .cr-point { font-weight:900; font-size:1.1rem; margin:8px 0; min-height:26px; }
      .cr-point .on { background:#eab308; color:#111; padding:4px 14px; border-radius:999px; }
      .cr-log { font-size:.85rem; opacity:.8; margin-top:8px; min-height:22px; }
      @media (max-width:520px){ .cr-die{width:66px;height:66px;padding:8px;} .cr-pip{width:11px;height:11px;} }
    </style>
    <div class="table-felt">
      <h2>🎲 Craps — Pass Line</h2>
      <p style="opacity:.8; font-size:.88rem; margin-top:-4px;">Come-out roll: <b>7 or 11 wins</b>, <b>2/3/12 craps out</b>. Anything else sets the point — then you need that number again <b>before a 7</b>. Even money.</p>
      <div class="cr-dice">
        <div class="cr-die" id="d1"></div>
        <div class="cr-die" id="d2"></div>
      </div>
      <div class="cr-point" id="cr-point"></div>
      <div id="cr-betmount"></div>
      <button class="pill" id="cr-roll" style="padding:12px 44px; font-size:1.1rem;">ROLL</button>
      <p id="cr-msg" style="margin-top:14px; font-weight:bold; min-height:26px;"></p>
      <div class="cr-log" id="cr-log"></div>
    </div>
  `;

  const PIPS = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  };
  const bet = CasinoShared.betPanel(document.getElementById('cr-betmount'), { value: 50 });
  const rollBtn = document.getElementById('cr-roll');
  const msg = document.getElementById('cr-msg');
  const log = document.getElementById('cr-log');
  const pointEl = document.getElementById('cr-point');
  const dice = [document.getElementById('d1'), document.getElementById('d2')];

  function drawDie(el, n) {
    el.innerHTML = '';
    const cells = PIPS[n] || [];
    for (let i = 0; i < 9; i++) {
      const d = document.createElement('div');
      if (cells.includes(i)) d.className = 'cr-pip';
      el.appendChild(d);
    }
  }
  drawDie(dice[0], 5); drawDie(dice[1], 2);

  async function animateRoll(a, b) {
    dice.forEach(d => d.classList.add('rolling'));
    const t0 = performance.now();
    await new Promise(res => {
      const iv = setInterval(() => {
        drawDie(dice[0], 1 + Math.floor(Math.random() * 6));
        drawDie(dice[1], 1 + Math.floor(Math.random() * 6));
        if (performance.now() - t0 > 650) { clearInterval(iv); res(); }
      }, 70);
    });
    dice.forEach(d => d.classList.remove('rolling'));
    drawDie(dice[0], a); drawDie(dice[1], b);
    CasinoShared.playSound('chip');
  }

  rollBtn.addEventListener('click', async () => {
    const b = bet.get();
    if (b <= 0) { msg.textContent = 'Enter a valid bet.'; return; }
    if (window.GameAPI.cachedBalance != null && b > window.GameAPI.cachedBalance) { msg.textContent = 'Not enough chips.'; return; }
    rollBtn.disabled = true; msg.textContent = ''; log.textContent = ''; pointEl.innerHTML = '';
    try {
      const d = await window.GameAPI.play({ game: 'craps', bet: b });
      const seq = [];
      for (let i = 0; i < d.rolls.length; i++) {
        const r = d.rolls[i];
        await animateRoll(r.a, r.b);
        seq.push(r.t);
        log.textContent = 'Rolls: ' + seq.join(' → ');
        if (i === 0 && d.point) pointEl.innerHTML = `POINT IS <span class="on">${d.point}</span> — roll it again before a 7!`;
        if (i < d.rolls.length - 1) await new Promise(res => setTimeout(res, 420));
      }
      msg.style.color = d.won ? 'var(--accent)' : '#f87171';
      msg.textContent = d.result;
      if (d.won) CasinoShared.playSound('win');
    } catch (e) {
      msg.style.color = '#f87171';
      msg.textContent = e.message;
    } finally {
      rollBtn.disabled = false;
    }
  });
};
