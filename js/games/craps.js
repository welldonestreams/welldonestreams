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
      @media (max-width: 520px) { .cr-die { width: 66px; height: 66px; padding: 8px; } .cr-pip { width: 11px; height: 11px; } }
    </style>

    <div class="table-felt">
      <h2>Craps</h2>
      <p style="opacity:.85;font-size:.95rem;margin-top:4px;">Come out with 7 or 11 — or make your point before a 7!</p>

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

  const bet = CasinoShared.betPanel(document.getElementById('cr-betmount'), { value: 50 });
  const rollBtn = document.getElementById('cr-roll');
  const msg = document.getElementById('cr-msg');
  const log = document.getElementById('cr-log');
  const pointEl = document.getElementById('cr-point');
  const dice = [document.getElementById('cr-d1'), document.getElementById('cr-d2')];

  function drawDie(element, number) {
    element.innerHTML = '';
    const cells = PIPS[number] || [];
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

    rollBtn.disabled = true;
    msg.textContent = '';
    log.textContent = '';
    pointEl.textContent = 'Come-out roll…';

    try {
      const data = await window.GameAPI.play({ game: 'craps', bet: wager });
      const sequence = [];

      for (let index = 0; index < data.rolls.length; index += 1) {
        const currentRoll = data.rolls[index];
        await animateRoll(currentRoll.a, currentRoll.b);
        sequence.push(currentRoll.t);
        log.textContent = `Rolls: ${sequence.join(' → ')}`;

        if (index === 0 && data.outcomeType === 'comeout-win') {
          pointEl.innerHTML = '<span class="on">COME-OUT WIN</span>';
        } else if (index === 0 && data.outcomeType === 'craps-loss') {
          pointEl.textContent = 'Craps on the come-out roll.';
        } else if (index === data.pointRollIndex && data.point) {
          pointEl.innerHTML = `POINT IS <span class="on">${data.point}</span> — pays ${data.payoutLabel}`;
        }

        if (index < data.rolls.length - 1) await new Promise((resolve) => setTimeout(resolve, 420));
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
      <p>This version follows the standard Pass Line come-out rules, then automatically pays true odds when a point is made.</p>
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
      <p class="game-info-note">Because 2, 3, and 12 lose on a standard Pass Line come-out roll, they no longer become points in this version.</p>`
  });
};
