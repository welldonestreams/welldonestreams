window.Games.slots = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="game-card">
      <h2>🎰 Slots</h2>
      <div id="slot-reels" style="font-size: 3rem; margin: 20px 0;">🍒 🍒 🍒</div>
      <input type="number" id="slot-bet" class="bet-input" value="50" min="10" />
      <br>
      <button class="pill" id="spin-btn">Spin</button>
      <p id="slot-msg" style="margin-top: 12px; font-weight: bold;"></p>
    </div>
  `;

  document.getElementById('spin-btn').addEventListener('click', async () => {
    let bet = parseInt(document.getElementById('slot-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
    let r1 = symbols[Math.floor(Math.random() * symbols.length)];
    let r2 = symbols[Math.floor(Math.random() * symbols.length)];
    let r3 = symbols[Math.floor(Math.random() * symbols.length)];

    document.getElementById('slot-reels').textContent = `${r1} ${r2} ${r3}`;
    const msg = document.getElementById('slot-msg');

    if (r1 === r2 && r2 === r3) {
      let win = bet * 10;
      await window.GameAPI.setBalance(bal + win);
      msg.textContent = `JACKPOT! Won +${win} chips!`;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      let win = bet * 2;
      await window.GameAPI.setBalance(bal + win);
      msg.textContent = `Pair! Won +${win} chips!`;
    } else {
      await window.GameAPI.setBalance(bal - bet);
      msg.textContent = `Lost -${bet} chips. Try again!`;
    }
  });
};
