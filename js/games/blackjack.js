window.Games.blackjack = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="game-card">
      <h2>🃏 Blackjack</h2>
      <div id="bj-display" style="margin: 20px 0;">Hit deal to play.</div>
      <input type="number" id="bj-bet" class="bet-input" value="50" min="10" />
      <br>
      <button class="pill" id="bj-deal">Deal</button>
      <p id="bj-msg" style="margin-top: 12px; font-weight: bold;"></p>
    </div>
  `;

  document.getElementById('bj-deal').addEventListener('click', async () => {
    let bet = parseInt(document.getElementById('bj-bet').value, 10) || 50;
    let bal = await window.GameAPI.getBalance();
    if (bet > bal) { alert("Insufficient chips!"); return; }

    let pScore = Math.floor(Math.random() * 10) + 12;
    let dScore = Math.floor(Math.random() * 10) + 12;

    const msg = document.getElementById('bj-msg');
    document.getElementById('bj-display').innerHTML = `You: <strong>${pScore}</strong> | Dealer: <strong>${dScore}</strong>`;

    if (pScore > 21) {
      await window.GameAPI.setBalance(bal - bet);
      msg.textContent = "Bust! You lose.";
    } else if (dScore > 21 || pScore > dScore) {
      await window.GameAPI.setBalance(bal + bet);
      msg.textContent = `You win +${bet} chips!`;
    } else if (pScore === dScore) {
      msg.textContent = "Push! Bet returned.";
    } else {
      await window.GameAPI.setBalance(bal - bet);
      msg.textContent = `Dealer wins. Lost -${bet} chips.`;
    }
  });
};
