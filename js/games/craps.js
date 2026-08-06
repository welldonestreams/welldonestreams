window.Games.craps = function () {
  const stage = document.getElementById('game-stage');

  stage.innerHTML = `
    <style>
      .cr-dice { display: flex; gap: 18px; justify-content: center; margin: 22px 0 10px; }
      .cr-die { width: 84px; height: 84px; border-radius: 16px; color: #111; display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); padding: 10px; transition: transform .15s; }
      .cr-die.rolling { animation: crshake .28s infinite; }
      @keyframes crshake { 0% { transform: rotate(-9deg) translateY(-3px); } 50% { transform: rotate(9deg) translateY(3px); } 100% { transform: rotate(-9deg) translateY(-3px); } }
      .cr-pip { width: 14px; height: 14px; border-radius: 50%; background: #111; align-self: center; justify-self: center; }
      .cr-point { font-weight: 900; font-size: 1.1rem; margin: 8px 0; min-height: 30px; }
      .cr-point .on { display: inline-block; background: var(--ember); color: #111; padding: 4px 14px; border-radius: 999px; }
      .cr-log { font-size: .85rem; opacity: .8; margin-top: 8px; min-height: 22px; }
      .cr-picks { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin:14px 0 6px; }
      .cr-pick { border:2px solid rgba(255,255,255,.25); background:rgba(255,255,255,.06); color:inherit;
        border-radius:14px; padding:10px 18px; font-weight:800; cursor:pointer; transition:all .15s; min-width:100px; }
      .cr-pick:hover { transform:translateY(-2px); }
      .cr-pick.sel { border-color:#eab308; background:rgba(234,179,8,.18); color:#eab308; }
      .cr-pick small { display:block; font-weight:600; opacity:.7; font-size:.72rem; margin-top:2px; }
      .cr-nums { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:0 0 6px; }
      .cr-num { border:2px solid rgba(255,255,255,.25); background:rgba(255,255,255,.06); color:inherit;
        border-radius:12px; padding:8px 14px; font-weight:800; cursor:pointer; transition:all .15s; min-width:56px; }
      .cr-num.sel { border-color:#eab308; background:rgba(234,179,8,.18); color:#eab308; }
      @media (max-width: 520px) { .cr-die { width: 66px; height: 66px; padding: 8px; } .cr-pip { width: 11px; height: 11px; } }
    </style>

    <div class="table-felt">
      <h2>Craps</h2>
      <p style="opacity:.85;font-size:.95rem;margin-top:4px;">Re-roll your point before a 7!</p>

      <div class="cr-picks">
        <button class="cr-pick sel" data-t="pass">PASS LINE<small>true odds</small></button>
        <button class="cr-pick" data-t="field">FIELD<small>1 roll</small></button>
        <button class="cr-pick" data-t="place">PLACE<small>pick a number</small></button>
        <button class="cr-pick" data-t="prop">PROP<small>2, 3, 11, 12</small></button>
      </div>
      <div class="cr-nums" id="cr-nums" style="display:none;"></div>

      <div class="cr-dice">
        <div class="cr-die" id="cr-d1"></div>
        <div class="cr-die" id="cr-d2"></div>
      </div>

      <div class="cr-point" id="cr-point">The first roll is the come-out roll.</div>
      <div id="cr-betmount"></div>
      <button class="pill" id="cr-roll" style="padding:12px 44px;font-size:1.1rem;">ROLL</button>
      <p id="cr-msg" style="margin-top:14px;font-weight:bold;min-height:26px;" aria-live="polite"></p>
      <div class="cr-log" id="cr-log"></div>
    </div>
  `;

  const PIPS = {
    1: [4], 2: [0,8], 3: [0,4,8], 4: [0,2,6,8], 5: [0,2,4,6,8], 6: [0,2,3,5,6,8]
  };

  const PLACE_NUMBERS = [{ n: 4, label: '9:5' }, { n: 5, label: '7:5' }, { n: 6, label: '7:6' }, { n: 8, label: '7:6' }, { n: 9, label: '7:5' }, { n: 10, label: '9:5' }];
  const PROP_NUMBERS = [{ n: 2, label: '30:1' }, { n: 3, label: '15:1' }, { n: 11, label: '15:1' }, { n: 12, label: '30:1' }];

  let betType = 'pass';
  let number = null;

  const bet = CasinoShared.betPanel(document.getElementById('cr-betmount'), { value: 50 });
  const rollBtn = document.getElementById('cr-roll');
  const msg = document.getElementById('cr-msg');
  const log = document.getElementById('cr-log');
  const pointEl = document.getElementById('cr-point');
  const numsEl = document.getElementById('cr-nums');
  const dice = [document.getElementById('cr-d1'), document.getElementById('cr-d2')];

  function idleStatus() {
    if (betType === 'pass') return 'The first roll is the come-out roll.';
    if (betType === 'field') return 'Field bet — wins or loses on the very next roll.';
    if (betType === 'place') return number ? `Place bet on ${number} — pays ${PLACE_NUMBERS.find(p => p.n === number).label}. Rolling for it before a 7.` : 'Pick a number to place.';
    if (betType === 'prop') return number ? `Prop bet on ${number} — pays ${PROP_NUMBERS.find(p => p.n === number).label} on the very next roll.` : 'Pick a number for your proposition bet.';
    return '';
  }

  function renderNums() {
    if (betType === 'place') {
      numsEl.style.display = 'flex';
      numsEl.innerHTML = PLACE_NUMBERS.map(p => `<button type="button" class="cr-num${number === p.n ? ' sel' : ''}" data-n="${p.n}">${p.n}</button>`).join('');
    } else if (betType === 'prop') {
      numsEl.style.display = 'flex';
      numsEl.innerHTML = PROP_NUMBERS.map(p => `<button type="button" class="cr-num${number === p.n ? ' sel' : ''}" data-n="${p.n}">${p.n}<small>${p.label}</small></button>`).join('');
    } else {
      numsEl.style.display = 'none';
      numsEl.innerHTML = '';
    }
    numsEl.querySelectorAll('.cr-num').forEach((btn) => {
      btn.addEventListener('click', () => {
        number = parseInt(btn.dataset.n, 10);
        renderNums();
        pointEl.textContent = idleStatus();
        CasinoShared.playSound('chip');
      });
    });
  }

  document.querySelectorAll('.cr-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cr-pick').forEach((b) => b.classList.remove('sel'));
      btn.classList.add('sel');
      betType = btn.dataset.t;
      number = null;
      renderNums();
      pointEl.textContent = idleStatus();
      CasinoShared.playSound('chip');
    });
  });

  function drawDie(element, num) {
    element.innerHTML = '';
    const cells = PIPS[num] || [];
    for (let index = 0; index < 9; index += 1) {
      const pip = document.createElement('div');
      if (cells.includes(index)) pip.className = 'cr-pip';
      element.appendChild(pip);
    }
  }

  drawDie(dice[0], 5);
  drawDie(dice[1], 2);

  async function animateRoll(a, b) {
    dice.forEach((die) => die.classList.add('rolling'));
    const startedAt = performance.now();

    await new Promise((resolve) => {
      const interval = setInterval(() => {
        drawDie(dice[0], 1 + Math.floor(Math.random() * 6));
        drawDie(dice[1], 1 + Math.floor(Math.random() * 6));
        if (performance.now() - startedAt > 650) {
          clearInterval(interval);
          resolve();
        }
      }, 70);
    });

    dice.forEach((die) => die.classList.remove('rolling'));
    drawDie(dice[0], a);
    drawDie(dice[1], b);
    CasinoShared.playSound('chip');
  }

  rollBtn.addEventListener('click', async () => {
    const wager = bet.get();
    if (wager <= 0) {
      msg.textContent = 'Enter a valid bet.';
      return;
    }
    if (window.GameAPI.cachedBalance != null && wager > window.GameAPI.cachedBalance) {
      msg.textContent = 'Not enough chips.';
      return;
    }
    if ((betType === 'place' || betType === 'prop') && !number) {
      msg.textContent = `Pick a number for your ${betType} bet.`;
      return;
    }

    rollBtn.disabled = true;
    msg.textContent = '';
    log.textContent = '';
    pointEl.textContent = betType === 'pass' ? 'Come-out roll…' : 'Rolling…';

    try {
      const payload = { game: 'craps', bet: wager, betType };
      if (number) payload.number = number;
      const data = await window.GameAPI.play(payload);
      const sequence = [];

      for (let index = 0; index < data.rolls.length; index += 1) {
        const currentRoll = data.rolls[index];
        await animateRoll(currentRoll.a, currentRoll.b);
        sequence.push(currentRoll.t);
        log.textContent = `Rolls: ${sequence.join(' → ')}`;

        if (data.betType === 'pass') {
          if (index === 0 && data.outcomeType === 'comeout-win') {
            pointEl.innerHTML = '<span class="on">COME-OUT WIN</span>';
          } else if (index === 0 && data.outcomeType === 'craps-loss') {
            pointEl.textContent = 'Craps on the come-out roll.';
          } else if (index === data.pointRollIndex && data.point) {
            pointEl.innerHTML = `POINT IS <span class="on">${data.point}</span> — pays ${data.payoutLabel}`;
          }
        } else if (data.betType === 'place' && index < data.rolls.length - 1) {
          pointEl.innerHTML = `CHASING <span class="on">${data.number}</span> — pays ${data.payoutLabel}`;
        }

        if (index < data.rolls.length - 1) await new Promise((resolve) => setTimeout(resolve, 420));
      }

      if (data.betType === 'field') {
        pointEl.innerHTML = data.won ? '<span class="on">FIELD WIN</span>' : 'Field — no match.';
      } else if (data.betType === 'prop') {
        pointEl.innerHTML = data.won ? `<span class="on">${data.number} HIT</span>` : `Prop ${data.number} — no match.`;
      } else if (data.betType === 'place') {
        pointEl.innerHTML = data.won ? `<span class="on">${data.number} HIT</span> — paid ${data.payoutLabel}` : 'Seven out.';
      }

      msg.style.color = data.won ? 'var(--ember)' : 'var(--sear)';
      msg.textContent = data.result;
      if (data.won) CasinoShared.playSound('win');
    } catch (error) {
      msg.style.color = 'var(--sear)';
      msg.textContent = error.message;
    } finally {
      rollBtn.disabled = false;
    }
  });

  CasinoShared.addGameInfo(stage, {
    title: 'More info',
    html: `
      <p><b>Pass Line</b> follows standard come-out rules, then automatically pays true odds when a point is made.</p>
      <table class="game-info-table"><thead><tr><th>Come-out roll</th><th>Result</th></tr></thead><tbody>
        <tr><td>7 or 11</td><td>Immediate win at 1:1</td></tr>
        <tr><td>2, 3, or 12</td><td>Immediate loss</td></tr>
        <tr><td>4, 5, 6, 8, 9, or 10</td><td>That number becomes the point</td></tr>
      </tbody></table>
      <p>After a point is established, roll the point again before a 7. Any other number keeps the round going.</p>
      <table class="game-info-table"><thead><tr><th>Point</th><th>True-odds payout</th></tr></thead><tbody>
        <tr><td>4 or 10</td><td>2:1</td></tr>
        <tr><td>5 or 9</td><td>3:2</td></tr>
        <tr><td>6 or 8</td><td>6:5</td></tr>
      </tbody></table>
      <p class="game-info-note">Because 2, 3, and 12 lose on a standard Pass Line come-out roll, they no longer become points in this version.</p>
      <p><b>Field</b> is a single-roll bet on 2, 3, 4, 9, 10, 11, or 12. Pays 1:1, except 2 pays 2:1 and 12 pays 3:1.</p>
      <p><b>Place</b> bets on 4, 5, 6, 8, 9, or 10 hitting before a 7.</p>
      <table class="game-info-table"><thead><tr><th>Number</th><th>Payout</th></tr></thead><tbody>
        <tr><td>4 or 10</td><td>9:5</td></tr>
        <tr><td>5 or 9</td><td>7:5</td></tr>
        <tr><td>6 or 8</td><td>7:6</td></tr>
      </tbody></table>
      <p><b>Proposition</b> bets on 2 or 12 pay 30:1, and 3 or 11 pay 15:1, resolved on the very next roll.</p>`
  });
};
