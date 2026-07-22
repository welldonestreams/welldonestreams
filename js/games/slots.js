window.Games.slots = function () {
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

  const spinBtn = document.getElementById('spin-btn');
  const msg = document.getElementById('slot-msg');

  spinBtn.addEventListener('click', async () => {
    const bet = parseInt(document.getElementById('slot-bet').value, 10) || 0;
    if (bet <= 0) { msg.textContent = 'Enter a valid bet.'; return; }
    if (window.GameAPI.cachedBalance != null && bet > window.GameAPI.cachedBalance) {
      msg.textContent = 'Not enough chips.'; return;
    }

    const reels = [document.getElementById('r1'), document.getElementById('r2'), document.getElementById('r3')];
    reels.forEach(r => r.classList.add('spin'));
    spinBtn.disabled = true;
    msg.textContent = '';
    CasinoShared.playSound('spin');

    try {
      // server rolls the outcome and settles the bet
      const d = await window.GameAPI.play({ game: 'slots', bet });
      setTimeout(() => {
        reels.forEach((r, i) => { r.classList.remove('spin'); r.textContent = d.reels[i]; });
        msg.textContent = d.result;
        if (d.result.includes('JACKPOT')) CasinoShared.playSound('win');
        spinBtn.disabled = false;
      }, 600);
    } catch (e) {
      reels.forEach(r => r.classList.remove('spin'));
      msg.textContent = e.message;
      spinBtn.disabled = false;
    }
  });
};