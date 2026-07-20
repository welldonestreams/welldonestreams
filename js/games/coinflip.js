window.Games.coinflip = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="game-card">
      <h2>🪙 Coin Flip</h2>
      <div id="coin-display" style="font-size: 3rem; margin: 20px 0;">🪙</div>
      <input type="number" id="coin-bet" class="bet-input" value="50" min="10" />
      <br>
      <button class="pill" id="flip-heads">Heads</button>
      <button class="pill secondary" id="flip-tails">Tails</button>
      <p id="coin-msg" style="margin-top: 12px; font-weight: bold;"></p>
    </div>
  `;

  const flip = async (choice) => {
    let bet = parseInt(document.getElementById('coin-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    let outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    document.getElementById('coin-display').textContent = outcome === 'heads' ? '👤 Heads' : '🦅 Tails';
    const msg = document.getElementById('coin-msg');

    if (choice === outcome) {
      await window.GameAPI.setBalance(bal + bet);
      msg.textContent = `Correct! Won +${bet} chips!`;
    } else {
      await window.GameAPI.setBalance(bal - bet);
      msg.textContent = `Flipped ${outcome}. Lost -${bet} chips.`;
    }
  };

  document.getElementById('flip-heads').addEventListener('click', () => flip('heads'));
  document.getElementById('flip-tails').addEventListener('click', () => flip('tails'));
};
