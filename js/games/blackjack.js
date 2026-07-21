window.Games.blackjack = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="bj-wrap">
      <div class="bj-table">
        <div class="bj-table-text">BLACKJACK PAYS 3 TO 2<br><span>Dealer must draw to 16 and stand on all 17s</span><br>INSURANCE PAYS 2 TO 1</div>
        <div class="bj-dealer-area">
          <div class="bj-hand-container" id="dlr-hand-wrap">
            <div class="bj-hand" id="dlr-hand"></div>
            <div class="bj-hand-score" id="dlr-score" style="display:none;"></div>
          </div>
        </div>
        <div class="bj-bet-circle" id="bet-circle"></div>
        <div class="bj-player-area" id="plr-area"></div>
      </div>
      
      <div class="chip-rack" id="bj-chips">
        <div class="rack-chip c-10 selected" data-amt="10" data-lbl="10"></div>
        <div class="rack-chip c-50" data-amt="50" data-lbl="50"></div>
        <div class="rack-chip c-100" data-amt="100" data-lbl="100"></div>
        <div class="rack-chip c-500" data-amt="500" data-lbl="500"></div>
        <div class="rack-chip c-1k" data-amt="1000" data-lbl="1k"></div>
        <div class="rack-chip c-5k" data-amt="5000" data-lbl="5k"></div>
        <div class="rack-chip c-10k" data-amt="10000" data-lbl="10k"></div>
      </div>
      
      <div style="font-size:1.2rem; font-weight:bold; color:var(--text); margin-top:15px; min-height:30px;" id="bj-msg">Place your bet!</div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:20px; justify-content:center; width:100%; z-index:10;">
        <button class="pill secondary" id="btn-clear-bet" style="padding:12px 24px;">Clear</button>
        <button class="pill" id="btn-deal" style="padding:12px 40px; font-size:1.1rem;">Deal</button>
        <button class="pill secondary" id="btn-hit" style="display:none;">Hit</button>
        <button class="pill secondary" id="btn-stand" style="display:none;">Stand</button>
        <button class="pill secondary" id="btn-double" style="display:none;">Double</button>
        <button class="pill secondary" id="btn-split" style="display:none;">Split</button>
      </div>
    </div>
  `;

  let shoe = []; const TOTAL_SHOE_CARDS = 52 * 4;
  let currentBet = 0; let selectedAmt = 10;
  let dealerCards = []; let playerHands = []; 
  let currentHandIdx = 0; let gamePhase = 'BETTING';

  const ui = { msg: document.getElementById('bj-msg'), betCircle: document.getElementById('bet-circle'), rack: document.getElementById('bj-chips'), plrArea: document.getElementById('plr-area'), dlrHand: document.getElementById('dlr-hand'), dlrScore: document.getElementById('dlr-score') };
  const btns = { deal: document.getElementById('btn-deal'), clear: document.getElementById('btn-clear-bet'), hit: document.getElementById('btn-hit'), stand: document.getElementById('btn-stand'), dbl: document.getElementById('btn-double'), splt: document.getElementById('btn-split') };

  document.querySelectorAll('.rack-chip').forEach(chip => {
    chip.onclick = () => { document.querySelectorAll('.rack-chip').forEach(c => c.classList.remove('selected')); chip.classList.add('selected'); selectedAmt = parseInt(chip.dataset.amt); CasinoShared.playSound('chip'); };
  });

  ui.betCircle.onclick = () => { if (gamePhase === 'BETTING') { currentBet += selectedAmt; updateBetVisuals(); CasinoShared.playSound('chip'); }};
  btns.clear.onclick = () => { if (gamePhase === 'BETTING') { currentBet = 0; updateBetVisuals(); }};

  function updateBetVisuals() {
    ui.betCircle.innerHTML = '';
    if (currentBet > 0) {
      ui.msg.textContent = `Total Bet: 🪙${CasinoShared.formatAmt(currentBet)}`;
      const chip = document.createElement('div'); chip.className = `placed-chip ${CasinoShared.getChipClass(selectedAmt)}`; chip.setAttribute('data-text', CasinoShared.formatAmt(currentBet)); ui.betCircle.appendChild(chip);
    } else ui.msg.textContent = "Place your bet!";
  }

  const suits = ['♥','♦','♣','♠']; const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  function buildShoe() {
    shoe = [];
    for(let i=0; i<4; i++) { for(let s of suits) { for(let v of values) { shoe.push({ v, s, isRed: s==='♥'||s==='♦' }); } } }
    shoe.sort(() => Math.random() - 0.5);
  }
  function checkShoe() { if (shoe.length < TOTAL_SHOE_CARDS * 0.25) buildShoe(); }
  function drawCard() { CasinoShared.playSound('card'); return shoe.pop(); }
  checkShoe();

  function calcScore(cards) {
    let total = 0, aces = 0;
    for (let c of cards) { if (c.v === 'A') { aces++; total += 11; } else if (['J','Q','K'].includes(c.v)) total += 10; else total += parseInt(c.v); }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }

  function renderCard(card, isHidden=false) {
    const colorCls = card.isRed ? 'red' : 'black';
    const svgIcon = CasinoShared.getSVG(card.s);
    const face = `
      <div style="position:absolute; top:5px; left:5px; font-size:0.9rem; font-weight:bold; line-height:1;">${card.v}<br><span style="font-size:0.7rem;">${card.s}</span></div>
      ${svgIcon}
      <div style="position:absolute; bottom:5px; right:5px; font-size:0.9rem; font-weight:bold; line-height:1; transform:rotate(180deg);">${card.v}<br><span style="font-size:0.7rem;">${card.s}</span></div>`;
    const flipCls = isHidden ? 'flipped' : '';
    return `<div class="bj-card ${colorCls} ${flipCls}"><div class="front">${face}</div><div class="back"></div></div>`;
  }

  function renderTable() {
    ui.dlrHand.innerHTML = '';
    if (dealerCards.length > 0) {
      if (gamePhase === 'PLAYING') {
        ui.dlrHand.innerHTML = renderCard(dealerCards[0]) + renderCard(dealerCards[1], true);
        ui.dlrScore.style.display = 'none';
      } else {
        dealerCards.forEach(c => ui.dlrHand.innerHTML += renderCard(c, false));
        ui.dlrScore.textContent = calcScore(dealerCards); ui.dlrScore.style.display = 'block';
      }
    } else ui.dlrScore.style.display = 'none';

    ui.plrArea.innerHTML = '';
    playerHands.forEach((hand, idx) => {
      const isAct = (idx === currentHandIdx && gamePhase === 'PLAYING') ? 'active-hand' : '';
      let html = `<div class="bj-hand-container ${isAct}" id="p-hand-${idx}"><div class="bj-hand" style="margin-bottom:12px;">`;
      hand.cards.forEach(c => html += renderCard(c));
      html += `</div><div class="bj-hand-score">${calcScore(hand.cards)}${hand.status==='bust'?' (Bust)':''} | Bet: 🪙${CasinoShared.formatAmt(hand.bet)}</div></div>`;
      ui.plrArea.innerHTML += html;
    });
    checkShoe();
  }

  function setButtons(m) {
    btns.deal.style.display = m==='bet'?'inline-block':'none'; btns.clear.style.display = m==='bet'?'inline-block':'none';
    btns.hit.style.display = m==='play'?'inline-block':'none'; btns.stand.style.display = m==='play'?'inline-block':'none';
    btns.dbl.style.display = m==='play'?'inline-block':'none'; btns.splt.style.display = m==='play'?'inline-block':'none';
    ui.rack.style.pointerEvents = m==='bet'?'auto':'none'; ui.rack.style.opacity = m==='bet'?'1':'0.5';
  }

  btns.deal.onclick = async () => {
    if (currentBet === 0) return alert("Place a bet!");
    let bal = await window.GameAPI.getBalance();
    if (currentBet > bal) return alert("Insufficient chips!");
    await window.GameAPI.setBalance(bal - currentBet); 
    
    checkShoe();
    playerHands = [{ cards: [drawCard(), drawCard()], bet: currentBet, status: 'active', score: 0 }];
    dealerCards = [drawCard(), drawCard()];
    currentHandIdx = 0; 
    
    startPlayerTurn();
    renderTable();
  };

  function startPlayerTurn() { gamePhase = 'PLAYING'; checkHandLogic(); }

  function checkHandLogic() {
    const hand = playerHands[currentHandIdx]; hand.score = calcScore(hand.cards); renderTable();
    if (hand.score === 21 && hand.cards.length === 2) { ui.msg.textContent = "BLACKJACK!"; hand.status = 'stand'; CasinoShared.playSound('win'); setTimeout(nextHand, 1000); return; }
    if (hand.score > 21) { hand.status = 'bust'; setTimeout(nextHand, 1000); return; }
    
    setButtons('play');
    btns.dbl.disabled = hand.cards.length > 2; 
    const canSplit = hand.cards.length === 2 && hand.cards[0].v === hand.cards[1].v && playerHands.length < 4; 
    btns.splt.disabled = !canSplit;
    ui.msg.textContent = `Your Turn.`;
  }

  btns.hit.onclick = () => { playerHands[currentHandIdx].cards.push(drawCard()); checkHandLogic(); };
  btns.stand.onclick = () => { playerHands[currentHandIdx].status = 'stand'; nextHand(); };
  
  btns.dbl.onclick = async () => {
    const hand = playerHands[currentHandIdx];
    let bal = await window.GameAPI.getBalance();
    if (hand.bet > bal) return alert("Not enough chips to double!");
    await window.GameAPI.setBalance(bal - hand.bet); 
    hand.bet *= 2; hand.cards.push(drawCard()); hand.score = calcScore(hand.cards);
    hand.status = hand.score > 21 ? 'bust' : 'stand';
    nextHand();
  };

  btns.splt.onclick = async () => {
    const h = playerHands[currentHandIdx];
    let bal = await window.GameAPI.getBalance();
    if (h.bet > bal) return alert("Not enough chips to split!");
    await window.GameAPI.setBalance(bal - h.bet); 
    
    const c2 = h.cards.pop();
    const h2 = { cards: [c2, drawCard()], bet: h.bet, status: 'active', score: 0 };
    h.cards.push(drawCard());
    playerHands.splice(currentHandIdx + 1, 0, h2);
    
    if (h.cards[0].v === 'A') { h.status = 'stand'; h2.status = 'stand'; nextHand(); } else checkHandLogic();
  };

  function nextHand() { currentHandIdx++; if (currentHandIdx >= playerHands.length) playDealer(); else checkHandLogic(); }

  async function playDealer() {
    gamePhase = 'DEALER'; setButtons('none');
    const allBust = playerHands.every(h => h.status === 'bust');
    
    const hiddenCardEl = ui.dlrHand.querySelector('.bj-card.flipped');
    if (hiddenCardEl) { hiddenCardEl.classList.remove('flipped'); CasinoShared.playSound('card'); await new Promise(r => setTimeout(r, 600)); } 
    
    if (!allBust) {
      renderTable(); await new Promise(r => setTimeout(r, 800));
      while (calcScore(dealerCards) < 17) { dealerCards.push(drawCard()); renderTable(); await new Promise(r => setTimeout(r, 800)); }
    } else renderTable();

    finalizeGame();
  }

  async function finalizeGame() {
    gamePhase = 'OVER'; const dScore = calcScore(dealerCards); const dBust = dScore > 21;
    let dBlackjack = dScore === 21 && dealerCards.length === 2;
    let totalReturns = 0; let netWinLoss = 0; 
    
    playerHands.forEach((hand, i) => {
      let pBlackjack = hand.score === 21 && hand.cards.length === 2 && playerHands.length === 1; 
      let handWon = false;

      if (hand.status === 'bust') { netWinLoss -= hand.bet; }
      else if (pBlackjack && !dBlackjack) { let win = hand.bet * 1.5; totalReturns += hand.bet + win; netWinLoss += win; handWon = true; }
      else if (dBlackjack && !pBlackjack) { netWinLoss -= hand.bet; }
      else if (dBust || hand.score > dScore) { totalReturns += hand.bet * 2; netWinLoss += hand.bet; handWon = true; }
      else if (hand.score < dScore) { netWinLoss -= hand.bet; }
      else { totalReturns += hand.bet; } // Push

      // Apply Win Animation to specific hand
      if (handWon) { document.getElementById(`p-hand-${i}`).classList.add('win-anim'); }
    });

    try {
      let bal = await window.GameAPI.getBalance();
      await window.GameAPI.setBalance(bal + totalReturns);
      
      if (netWinLoss > 0) CasinoShared.playSound('win');
      ui.msg.textContent = netWinLoss > 0 ? `You WON 🪙${CasinoShared.formatAmt(netWinLoss)}!` : (netWinLoss < 0 ? `You lost 🪙${CasinoShared.formatAmt(Math.abs(netWinLoss))}.` : `Push. Bets returned.`);
      ui.msg.style.color = netWinLoss > 0 ? "var(--accent)" : (netWinLoss < 0 ? "#d32f2f" : "var(--text)");
      
      setTimeout(() => { setButtons('bet'); currentBet = 0; updateBetVisuals(); }, 3000);
    } catch(err) { ui.msg.textContent = "Error saving results."; setButtons('bet'); }
  }
};
