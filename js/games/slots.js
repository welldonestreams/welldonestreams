window.Games.slots = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="table-felt" style="background: radial-gradient(circle, #1e1b4b 0%, #0f172a 100%);">
      <h2>🎰 Royal Slots</h2>

      <div class="slot-machine">
        <div class="reel" id="r1">7️⃣</div>
        <div class="reel" id="r2">7️⃣</div>
        <div class="reel" id="r3">7️⃣</div>
      </div>

      <input type="number" id="slot-bet" class="bet-input" value="50" min="10" />
      <br>
      <button class="pill" id="spin-btn">SPIN</button>
      <p id="slot-msg" style="margin-top: 14px; font-weight: bold; min-height: 24px;"></p>
    </div>
  `;

  document.getElementById('spin-btn').addEventListener('click', async () => {
    let bet = parseInt(document.getElementById('slot-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    const reels = [document.getElementById('r1'), document.getElementById('r2'), document.getElementById('r3')];
    reels.forEach(r => r.classList.add('spin'));

    setTimeout(async () => {
      const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
      let res = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      reels.forEach((r, i) => {
        r.classList.remove('spin');
        r.textContent = res[i];
      });

      const msg = document.getElementById('slot-msg');
      if (res[0] === res[1] && res[1] === res[2]) {
        let win = bet * 10;
        await window.GameAPI.setBalance(bal + win);
        msg.textContent = `💥 MEGA JACKPOT! Won +${win} chips!`;
      } else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) {
        let win = bet * 2;
        await window.GameAPI.setBalance(bal + win);
        msg.textContent = `✨ Pair! Won +${win} chips!`;
      } else {
        await window.GameAPI.setBalance(bal - bet);
        msg.textContent = `Lost -${bet} chips.`;
      }
    }, 600);
  });
};