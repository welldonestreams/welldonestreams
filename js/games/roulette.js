window.Games.roulette = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="table-felt">
      <h2>🎡 European Roulette</h2>
      <div id="wheel-status" style="font-size: 1.2rem; font-weight: 800; margin: 12px 0;">Place your bet</div>

      <div class="roulette-grid">
        <div class="num-tile green" id="tile-0">0</div>
        <div class="num-tile red" id="tile-1">1</div>
        <div class="num-tile black" id="tile-2">2</div>
        <div class="num-tile red" id="tile-3">3</div>
        <div class="num-tile black" id="tile-4">4</div>
        <div class="num-tile red" id="tile-5">5</div>
        <div class="num-tile black" id="tile-6">6</div>
        <div class="num-tile red" id="tile-7">7</div>
        <div class="num-tile black" id="tile-8">8</div>
        <div class="num-tile red" id="tile-9">9</div>
        <div class="num-tile black" id="tile-10">10</div>
      </div>

      <div style="margin: 16px 0;">
        <button class="pill" id="r-red" style="background:#b91c1c; color:#fff;">Red (2x)</button>
        <button class="pill" id="r-black" style="background:#1f2937; color:#fff;">Black (2x)</button>
      </div>

      <input type="number" id="r-bet" class="bet-input" value="50" min="10" />
      <p id="r-msg" style="margin-top: 10px; font-weight: bold;"></p>
    </div>
  `;

  const spin = async (choice) => {
    let bet = parseInt(document.getElementById('r-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    document.querySelectorAll('.num-tile').forEach(t => t.classList.remove('gold-win'));
    let winningNum = Math.floor(Math.random() * 11);
    
    let targetTile = document.getElementById(`tile-${winningNum}`);
    if (targetTile) targetTile.classList.add('gold-win');

    let isRed = [1, 3, 5, 7, 9].includes(winningNum);
    let resultColor = winningNum === 0 ? 'green' : (isRed ? 'red' : 'black');

    const msg = document.getElementById('r-msg');
    document.getElementById('wheel-status').textContent = `Landed on: ${winningNum} (${resultColor.toUpperCase()})`;

    if (choice === resultColor) {
      let win = bet * 2;
      await window.GameAPI.setBalance(bal + win);
      msg.textContent = `🎯 WINNER! Won +${win} chips!`;
    } else {
      await window.GameAPI.setBalance(bal - bet);
      msg.textContent = `Lost -${bet} chips.`;
    }
  };

  document.getElementById('r-red').addEventListener('click', () => spin('red'));
  document.getElementById('r-black').addEventListener('click', () => spin('black'));
};