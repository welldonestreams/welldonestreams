window.Games.coinflip = function() {
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

  const flipCoin = async (choice) => {
    let bet = parseInt(document.getElementById('coin-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    const coin = document.getElementById('coin');
    coin.className = 'coin'; 

    let outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    
    setTimeout(() => {
      coin.classList.add(outcome === 'heads' ? 'flip-heads' : 'flip-tails');
    }, 50);

    setTimeout(async () => {
      const msg = document.getElementById('coin-msg');
      if (choice === outcome) {
        await window.GameAPI.setBalance(bal + bet);
        msg.textContent = `🎉 Flipped ${outcome.toUpperCase()}! Won +${bet} chips!`;
      } else {
        await window.GameAPI.setBalance(bal - bet);
        msg.textContent = `Flipped ${outcome.toUpperCase()}. Lost -${bet} chips.`;
      }
    }, 2050);
  };

  document.getElementById('flip-h').addEventListener('click', () => flipCoin('heads'));
  document.getElementById('flip-t').addEventListener('click', () => flipCoin('tails'));
};