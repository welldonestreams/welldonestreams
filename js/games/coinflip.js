window.Games.coinflip = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="table-felt">
      <h2>🪙 High-Stakes Flip</h2>
      <div class="coin-box">
        <div class="coin" id="coin">
          <div class="side heads">👤</div>
          <div class="side tails">🦅</div>
        </div>
      </div>
      <input type="number" id="coin-bet" class="bet-input" value="50" min="10" />
      <br>
      <button class="pill" id="flip-h">Heads</button>
      <button class="pill secondary" id="flip-t">Tails</button>
      <p id="coin-msg" style="margin-top: 14px; font-weight: bold; min-height: 24px;"></p>
    </div>
  `;

  const btnH = document.getElementById('flip-h');
  const btnT = document.getElementById('flip-t');
  const msg = document.getElementById('coin-msg');

  const flipCoin = async (choice) => {
    const bet = parseInt(document.getElementById('coin-bet').value, 10) || 0;
    if (bet <= 0) { msg.textContent = 'Enter a valid bet.'; return; }
    if (window.GameAPI.cachedBalance != null && bet > window.GameAPI.cachedBalance) {
      msg.textContent = 'Not enough chips.'; return;
    }

    btnH.disabled = true; btnT.disabled = true;
    msg.textContent = '';
    const coin = document.getElementById('coin');
    coin.className = 'coin';

    try {
      // server decides the flip and settles the bet
      const d = await window.GameAPI.play({ game: 'coinflip', bet, choice });
      setTimeout(() => coin.classList.add(d.flip === 'heads' ? 'flip-heads' : 'flip-tails'), 50);
      setTimeout(() => {
        msg.textContent = d.result;
        if (d.flip === choice) CasinoShared.playSound('win');
        btnH.disabled = false; btnT.disabled = false;
      }, 2050);
    } catch (e) {
      msg.textContent = e.message;
      btnH.disabled = false; btnT.disabled = false;
    }
  };

  btnH.addEventListener('click', () => flipCoin('heads'));
  btnT.addEventListener('click', () => flipCoin('tails'));
};
