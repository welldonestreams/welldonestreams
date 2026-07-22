window.Games.craps = function () {
  const stage = document.getElementById('game-stage');

  stage.innerHTML = `
    <style>
      .cr-dice {
        display: flex;
        gap: 18px;
        justify-content: center;
        margin: 22px 0 10px;
      }

      .cr-die {
        width: 84px;
        height: 84px;
        border-radius: 16px;
        background: #fff;
        color: #111;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        padding: 10px;
        box-shadow: 0 6px 14px rgba(0, 0, 0, .5);
        transition: transform .15s;
      }

      .cr-die.rolling {
        animation: crshake .28s infinite;
      }

      @keyframes crshake {
        0% {
          transform: rotate(-9deg) translateY(-3px);
        }

        50% {
          transform: rotate(9deg) translateY(3px);
        }

        100% {
          transform: rotate(-9deg) translateY(-3px);
        }
      }

      .cr-pip {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #111;
        align-self: center;
        justify-self: center;
      }

      .cr-point {
        font-weight: 900;
        font-size: 1.1rem;
        margin: 8px 0;
        min-height: 30px;
      }

      .cr-point .on {
        display: inline-block;
        background: var(--ember);
        color: #111;
        padding: 4px 14px;
        border-radius: 999px;
      }

      .cr-log {
        font-size: .85rem;
        opacity: .8;
        margin-top: 8px;
        min-height: 22px;
      }

      .cr-info {
        max-width: 620px;
        margin: 24px auto 0;
        text-align: left;
        background: rgba(0, 0, 0, .25);
        border: 1px solid rgba(255, 255, 255, .14);
        border-radius: var(--r-md);
        overflow: hidden;
      }

      .cr-info summary {
        padding: 14px 17px;
        cursor: pointer;
        font-weight: 700;
        color: var(--ember);
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .cr-info summary::-webkit-details-marker {
        display: none;
      }

      .cr-info summary::after {
        content: "+";
        font-family: var(--money);
        font-size: 1.25rem;
      }

      .cr-info[open] summary::after {
        content: "−";
      }

      .cr-info-body {
        padding: 0 17px 17px;
        color: rgba(255, 255, 255, .84);
        font-size: .9rem;
        line-height: 1.55;
      }

      .cr-info-body p {
        margin-bottom: 12px;
        color: inherit;
      }

      .cr-odds {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-family: var(--money);
        font-size: .82rem;
      }

      .cr-odds th,
      .cr-odds td {
        padding: 9px 8px;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, .1);
      }

      .cr-odds th {
        color: var(--ember);
      }

      .cr-odds td:last-child,
      .cr-odds th:last-child {
        text-align: right;
      }

      @media (max-width: 520px) {
        .cr-die {
          width: 66px;
          height: 66px;
          padding: 8px;
        }

        .cr-pip {
          width: 11px;
          height: 11px;
        }

        .cr-info {
          margin-top: 20px;
        }
      }
    </style>

    <div class="table-felt">
      <h2>Craps</h2>
      <p style="opacity:.85; font-size:.95rem; margin-top:4px;">
        Roll your point before a 7!
      </p>

      <div class="cr-dice">
        <div class="cr-die" id="d1"></div>
        <div class="cr-die" id="d2"></div>
      </div>

      <div class="cr-point" id="cr-point">
        Your first non-7 roll sets the point.
      </div>

      <div id="cr-betmount"></div>

      <button
        class="pill"
        id="cr-roll"
        style="padding:12px 44px; font-size:1.1rem;"
      >
        ROLL
      </button>

      <p
        id="cr-msg"
        style="margin-top:14px; font-weight:bold; min-height:26px;"
        aria-live="polite"
      ></p>

      <div class="cr-log" id="cr-log"></div>

      <details class="cr-info">
        <summary>More info</summary>

        <div class="cr-info-body">
          <p>
            Your first roll establishes a point. If the first roll is 7,
            the dice are rolled again until a point is established.
          </p>

          <p>
            After the point is set, you win by rolling that same number
            again before rolling a 7. A 7 ends the round and loses the bet.
          </p>

          <p>
            Difficult points pay more because they have fewer possible dice
            combinations. The displayed payout is profit in addition to
            receiving your original wager back.
          </p>

          <table class="cr-odds">
            <thead>
              <tr>
                <th>Point</th>
                <th>Ways to roll</th>
                <th>Payout</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>2 or 12</td>
                <td>1</td>
                <td>6:1</td>
              </tr>

              <tr>
                <td>3 or 11</td>
                <td>2</td>
                <td>3:1</td>
              </tr>

              <tr>
                <td>4 or 10</td>
                <td>3</td>
                <td>2:1</td>
              </tr>

              <tr>
                <td>5 or 9</td>
                <td>4</td>
                <td>3:2</td>
              </tr>

              <tr>
                <td>6 or 8</td>
                <td>5</td>
                <td>6:5</td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top:12px; margin-bottom:0;">
            Example: a 100-chip wager with a point of 12 wins 600 chips.
            A point of 6 or 8 wins 120 chips.
          </p>
        </div>
      </details>
    </div>
  `;

  const PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const bet = CasinoShared.betPanel(
    document.getElementById('cr-betmount'),
    { value: 50 }
  );

  const rollBtn = document.getElementById('cr-roll');
  const msg = document.getElementById('cr-msg');
  const log = document.getElementById('cr-log');
  const pointEl = document.getElementById('cr-point');

  const dice = [
    document.getElementById('d1'),
    document.getElementById('d2'),
  ];

  function drawDie(el, number) {
    el.innerHTML = '';

    const cells = PIPS[number] || [];

    for (let i = 0; i < 9; i += 1) {
      const pip = document.createElement('div');

      if (cells.includes(i)) {
        pip.className = 'cr-pip';
      }

      el.appendChild(pip);
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

    if (
      window.GameAPI.cachedBalance != null &&
      wager > window.GameAPI.cachedBalance
    ) {
      msg.textContent = 'Not enough chips.';
      return;
    }

    rollBtn.disabled = true;
    msg.textContent = '';
    log.textContent = '';
    pointEl.textContent = 'Establishing your point…';

    try {
      const data = await window.GameAPI.play({
        game: 'craps',
        bet: wager,
      });

      const sequence = [];

      for (let i = 0; i < data.rolls.length; i += 1) {
        const currentRoll = data.rolls[i];

        await animateRoll(currentRoll.a, currentRoll.b);

        sequence.push(currentRoll.t);
        log.textContent = `Rolls: ${sequence.join(' → ')}`;

        if (i === data.pointRollIndex) {
          pointEl.innerHTML =
            `POINT IS <span class="on">${data.point}</span> ` +
            `— pays ${data.payoutLabel}`;
        }

        if (i < data.rolls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 420));
        }
      }

      msg.style.color = data.won ? 'var(--ember)' : 'var(--sear)';
      msg.textContent = data.result;

      if (data.won) {
        CasinoShared.playSound('win');
      }
    } catch (error) {
      msg.style.color = 'var(--sear)';
      msg.textContent = error.message;
    } finally {
      rollBtn.disabled = false;
    }
  });
};