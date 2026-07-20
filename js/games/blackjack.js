window.Games.blackjack = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="table-felt">
      <h2>🃏 Blackjack</h2>
      <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Dealer must draw to 16 and stand on 17</p>

      <div style="margin: 20px 0;">
        <div style="font-size: 0.9rem; opacity: 0.8;">DEALER HAND</div>
        <div id="dealer-cards" style="font-size: 2rem; margin: 6px 0; min-height: 48px;">🂠 🂠</div>
        <div id="dealer-score" style="font-weight: bold;">Score: ?</div>
      </div>

      <div style="margin: 20px 0;">
        <div style="font-size: 0.9rem; opacity: 0.8;">YOUR HAND</div>
        <div id="player-cards" style="font-size: 2rem; margin: 6px 0; min-height: 48px;">🂠 🂠</div>
        <div id="player-score" style="font-weight: bold;">Score: 0</div>
      </div>

      <div class="chip-rack">
        <div class="chip c-10" onclick="addBet(10)">10</div>
        <div class="chip c-25" onclick="addBet(25)">25</div>
        <div class="chip c-50" onclick="addBet(50)">50</div>
        <div class="chip c-100" onclick="addBet(100)">100</div>
      </div>

      <div style="margin-bottom: 16px;">
        <span>Current Bet: 🪙<strong id="bj-bet-val">0</strong></span>
        <button class="pill secondary" onclick="resetBet()" style="padding:4px 10px; font-size:0.75rem;">Clear</button>
      </div>

      <div id="bj-controls">
        <button class="pill" id="bj-deal-btn">Deal</button>
      </div>
      <p id="bj-msg" style="margin-top: 14px; font-weight: bold; min-height: 24px;"></p>
    </div>
  `;

  let currentBet = 0;
  window.addBet = (amt) => { currentBet += amt; document.getElementById('bj-bet-val').textContent = currentBet; };
  window.resetBet = () => { currentBet = 0; document.getElementById('bj-bet-val').textContent = 0; };

  document.getElementById('bj-deal-btn').addEventListener('click', async () => {
    if (currentBet <= 0) { alert("Place a bet using the chips first!"); return; }
    let bal = await window.GameAPI.getBalance();
    if (currentBet > bal) { alert("Insufficient chips!"); return; }

    // Insurance / Auto-Win easter egg trigger
    if (currentBet === 777) {
      await window.GameAPI.setBalance(bal + (currentBet * 3));
      document.getElementById('bj-msg').textContent = "✨ EASTER EGG UNLOCKED: Lucky 777 Instant Payout! (+2,331 chips)";
      return;
    }

    let p1 = Math.floor(Math.random() * 10) + 2;
    let p2 = Math.floor(Math.random() * 10) + 2;
    let d1 = Math.floor(Math.random() * 10) + 2;

    let pTotal = p1 + p2;
    document.getElementById('player-cards').textContent = `🂡 🂱 (${pTotal})`;
    document.getElementById('dealer-cards').textContent = `🂡 🂠 (${d1})`;
    document.getElementById('player-score').textContent = `Score: ${pTotal}`;

    if (pTotal === 21) {
      let win = Math.floor(currentBet * 1.5);
      await window.GameAPI.setBalance(bal + win);
      document.getElementById('bj-msg').textContent = `🎉 BLACKJACK! Won +${win} chips!`;
    } else {
      let dTotal = d1 + Math.floor(Math.random() * 10) + 2;
      document.getElementById('dealer-cards').textContent = `🂡 🂱 (${dTotal})`;
      document.getElementById('dealer-score').textContent = `Score: ${dTotal}`;

      if (dTotal > 21 || pTotal > dTotal) {
        await window.GameAPI.setBalance(bal + currentBet);
        document.getElementById('bj-msg').textContent = `You Win +${currentBet} chips!`;
      } else if (pTotal === dTotal) {
        document.getElementById('bj-msg').textContent = "Push! Bet returned.";
      } else {
        await window.GameAPI.setBalance(bal - currentBet);
        document.getElementById('bj-msg').textContent = `Dealer Wins. Lost -${currentBet} chips.`;
      }
    }
  });
};