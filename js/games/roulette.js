window.Games.roulette = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="game-card">
      <h2>🎡 Roulette</h2>
      <div id="roulette-wheel" style="font-size: 2.5rem; margin: 20px 0;">🔴 Red or 🖤 Black</div>
      <input type="number" id="roulette-bet" class="bet-input" value="50" min="10" />
      <br>
      <button class="pill" id="bet-red" style="background:#e2483d; color:#fff;">Red</button>
      <button class="pill" id="bet-black" style="background:#22262d; color:#fff;">Black</button>
      <p id="roulette-msg" style="margin-top: 12px; font-weight: bold;"></p>
    </div>
  `;

  const play = async (chosenColor) => {
    let bet = parseInt(document.getElementById('roulette-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    let result = Math.random() < 0.5 ? 'red' : 'black';
    let symbol = result === 'red' ? '🔴 Red' : '🖤 Black';
    document.getElementById('roulette-wheel').textContent = symbol;
    const msg = document.getElementById('roulette-msg');

    if (chosenColor === result) {
      await window.GameAPI.setBalance(bal + bet);
      msg.textContent = `Winner! Won +${bet} chips!`;
    } else {
      await window.GameAPI.setBalance(bal - bet);
      msg.textContent = `Landed on ${result}. Lost -${bet} chips.`;
    }
  };

  document.getElementById('bet-red').addEventListener('click', () => play('red'));
  document.getElementById('bet-black').addEventListener('click', () => play('black'));
};
