window.Games.blackjack = function() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <style>
      .bjx-wrap { max-width: 1150px; margin: 0 auto; display:flex; flex-direction:column; align-items:center; }
      .bjx-table {
        width: 100%; min-height: 620px; position: relative;
        background: radial-gradient(ellipse at 50% 20%, #1a7a45 0%, #0e5230 55%, #093d23 100%);
        border: 12px solid #78350f; border-radius: 46% 46% 20px 20px / 30% 30% 20px 20px;
        display:flex; flex-direction:column; align-items:center; justify-content:space-between;
        padding: 34px 24px 28px; box-shadow: inset 0 0 60px rgba(0,0,0,.45), 0 8px 30px rgba(0,0,0,.5);
      }
      .bjx-tabletext { text-align:center; color:rgba(234,179,8,.55); font-weight:800; letter-spacing:.12em; line-height:1.8; font-size:1.02rem; pointer-events:none; }
      .bjx-tabletext span { font-size:.8rem; letter-spacing:.1em; color:rgba(255,255,255,.45); }
      .bjx-hand { display:flex; gap:10px; justify-content:center; min-height:120px; }
      .bjx-card {
        width:82px; height:118px; border-radius:10px; background:#fff; position:relative;
        box-shadow:0 4px 10px rgba(0,0,0,.5); transform-style:preserve-3d; transition:transform .5s;
        flex-shrink:0;
      }
      .bjx-card .front, .bjx-card .back { position:absolute; inset:0; border-radius:10px; backface-visibility:hidden; display:flex; align-items:center; justify-content:center; }
      .bjx-card .front { background:#fff; }
      .bjx-card .front svg { width:34px; height:34px; }
      .bjx-card.red .front { color:#dc2626; } .bjx-card.black .front { color:#111827; }
      .bjx-card .back { background: repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 6px, #991b1b 6px, #991b1b 12px); transform: rotateY(180deg); border:5px solid #fff; }
      .bjx-card.flipped { transform: rotateY(180deg); }
      .bjx-score {
        display:inline-block; background:rgba(0,0,0,.7); color:#fff; font-weight:800;
        padding:5px 14px; border-radius:999px; margin-top:10px; font-size:1rem;
      }
      .bjx-handbox { text-align:center; padding:8px 12px; border-radius:14px; }
      .bjx-handbox.active-hand { outline:3px dashed rgba(234,179,8,.8); outline-offset:6px; }
      .bjx-handbox.win-anim { animation: bjxwin 1s ease 2; }
      @keyframes bjxwin { 0%,100% { box-shadow:none; } 50% { box-shadow:0 0 0 4px #eab308, 0 0 30px #eab308; } }
      .bjx-betzone {
        width:120px; height:120px; border-radius:50%; border:3px dashed rgba(255,255,255,.55);
        display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative;
        transition:border-color .15s, transform .1s; margin: 8px 0;
      }
      .bjx-betzone:hover { border-color:#eab308; }
      .bjx-betzone.drag-over { border-color:#eab308; border-style:solid; transform:scale(1.05); }
      .bjx-betzone .bjx-betchip {
        width:78px; height:78px; border-radius:50%; border:6px dashed #fff;
        display:flex; align-items:center; justify-content:center; font-weight:900; color:#111; font-size:1rem;
        box-shadow:0 4px 12px rgba(0,0,0,.6); cursor:grab;
      }
      .bjx-players { display:flex; gap:26px; justify-content:center; flex-wrap:wrap; }
      .bjx-rack { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:18px 0 4px; padding:12px 18px; background:rgba(0,0,0,.3); border-radius:999px; }
      .bjx-chip {
        width:54px; height:54px; border-radius:50%; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-weight:800; color:#111; font-size:.85rem;
        border:5px dashed #fff; box-shadow:0 3px 8px rgba(0,0,0,.45); transition:transform .1s; background:#e5e7eb;
      }
      .bjx-chip:hover { transform:translateY(-3px); }
      .bjx-chip.selected { outline:3px solid #eab308; outline-offset:2px; }
      .bjx-c1 { background:#f8fafc; } .bjx-c10 { background:#60a5fa; } .bjx-c50 { background:#4ade80; }
      .bjx-c100 { background:#d1d5db; } .bjx-c500 { background:#c084fc; } .bjx-c1k { background:#fb923c; }
      .bjx-c5k { background:#f472b6; } .bjx-c10k { background:#22d3ee; }
      .bjx-msg { font-size:1.25rem; font-weight:800; min-height:34px; margin-top:14px; text-align:center; }
      .bjx-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; justify-content:center; }
      .bjx-strategy {
        margin-top:16px; width:min(560px, 96%); background:rgba(0,0,0,.35); border:1px solid rgba(234,179,8,.4);
        border-radius:16px; padding:14px 18px; display:none;
      }
      .bjx-strategy.on { display:block; }
      .bjx-strat-row { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
      .bjx-strat-move { font-size:1.2rem; font-weight:900; padding:6px 18px; border-radius:999px; background:#eab308; color:#111; }
      .bjx-oddsbar { height:14px; border-radius:999px; background:rgba(255,255,255,.12); overflow:hidden; margin-top:10px; display:flex; }
      .bjx-oddsbar .w { background:#4ade80; height:100%; transition:width .4s; }
      .bjx-oddsbar .p { background:#94a3b8; height:100%; transition:width .4s; }
      .bjx-oddsbar .l { background:#f87171; height:100%; transition:width .4s; }
      .bjx-oddslabels { display:flex; justify-content:space-between; font-size:.8rem; opacity:.85; margin-top:5px; font-weight:700; }
      .bjx-insurance {
        position:absolute; inset:0; background:rgba(0,0,0,.72); border-radius:inherit; z-index:20;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; text-align:center; padding:20px;
      }
      .bjx-insurance h3 { font-size:1.5rem; }
      @media (max-width:700px){
        .bjx-card{width:58px;height:84px;} .bjx-table{min-height:auto;padding:18px 8px 22px;border-radius:28px;border-width:8px;}
        .bjx-tabletext{font-size:.8rem;line-height:1.5;} .bjx-tabletext span{font-size:.66rem;}
        .bjx-betzone{width:96px;height:96px;} .bjx-betzone .bjx-betchip{width:64px;height:64px;font-size:.85rem;}
        .bjx-chip{width:46px;height:46px;font-size:.75rem;border-width:4px;} .bjx-rack{gap:8px;padding:10px;}
        .bjx-hand{gap:6px;min-height:96px;} .bjx-msg{font-size:1.05rem;}
      }
    </style>
    <div class="bjx-wrap">
      <div class="bjx-table" id="bjx-table">
        <div class="bjx-handbox">
          <div class="bjx-hand" id="dlr-hand"></div>
          <div class="bjx-score" id="dlr-score" style="display:none;"></div>
        </div>
        <div class="bjx-tabletext">BLACKJACK PAYS 3 TO 2<br><span>DEALER MUST DRAW TO 16 AND STAND ON ALL 17S</span><br>INSURANCE PAYS 2 TO 1</div>
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div class="bjx-betzone" id="bet-circle" title="Tap a chip then tap here, or drag a chip in"></div>
          <div class="bjx-players" id="plr-area"></div>
        </div>
      </div>

      <div class="bjx-rack" id="bj-chips">
        <div class="bjx-chip bjx-c1" data-amt="1">1</div>
        <div class="bjx-chip bjx-c10 selected" data-amt="10">10</div>
        <div class="bjx-chip bjx-c50" data-amt="50">50</div>
        <div class="bjx-chip bjx-c100" data-amt="100">100</div>
        <div class="bjx-chip bjx-c500" data-amt="500">500</div>
        <div class="bjx-chip bjx-c1k" data-amt="1000">1k</div>
        <div class="bjx-chip bjx-c5k" data-amt="5000">5k</div>
        <div class="bjx-chip bjx-c10k" data-amt="10000">10k</div>
      </div>

      <div class="bjx-msg" id="bj-msg">Place your bet!</div>

      <div class="bjx-actions">
        <button class="pill secondary" id="btn-clear-bet">Clear</button>
        <button class="pill secondary" id="btn-allin">ALL IN</button>
        <button class="pill" id="btn-deal" style="padding:12px 40px; font-size:1.1rem;">Deal</button>
        <button class="pill secondary" id="btn-hit" style="display:none;">Hit</button>
        <button class="pill secondary" id="btn-stand" style="display:none;">Stand</button>
        <button class="pill secondary" id="btn-double" style="display:none;">Double</button>
        <button class="pill secondary" id="btn-split" style="display:none;">Split</button>
        <button class="pill secondary" id="btn-strategy">📊 Strategy: OFF</button>
      </div>

      <div class="bjx-strategy" id="strat-panel">
        <div class="bjx-strat-row">
          <div style="font-weight:700;">Book says:</div>
          <div class="bjx-strat-move" id="strat-move">—</div>
        </div>
        <div class="bjx-oddsbar"><div class="w" id="odds-w"></div><div class="p" id="odds-p"></div><div class="l" id="odds-l"></div></div>
        <div class="bjx-oddslabels"><span id="lbl-w">Win —%</span><span id="lbl-p">Push —%</span><span id="lbl-l">Lose —%</span></div>
        <div style="font-size:.78rem; opacity:.65; margin-top:6px;">Odds simulated for standing on your current hand vs the dealer's upcard.</div>
      </div>
    </div>
  `;

  // ---------- state ----------
  let shoe = []; const TOTAL_SHOE_CARDS = 52 * 4;
  let currentBet = 0; let betBreakdown = []; let selectedAmt = 10;
  let dealerCards = []; let playerHands = [];
  let currentHandIdx = 0; let gamePhase = 'BETTING';
  let committed = 0;
  let strategyOn = false;
  // Easter egg: taking insurance once turns on permanent (session) luck
  window._wdbLuck = window._wdbLuck || false;

  const ui = {
    msg: document.getElementById('bj-msg'), betCircle: document.getElementById('bet-circle'),
    rack: document.getElementById('bj-chips'), plrArea: document.getElementById('plr-area'),
    dlrHand: document.getElementById('dlr-hand'), dlrScore: document.getElementById('dlr-score'),
    table: document.getElementById('bjx-table'), strat: document.getElementById('strat-panel'),
    stratMove: document.getElementById('strat-move'),
  };
  const btns = {
    deal: document.getElementById('btn-deal'), clear: document.getElementById('btn-clear-bet'),
    allin: document.getElementById('btn-allin'),
    hit: document.getElementById('btn-hit'), stand: document.getElementById('btn-stand'),
    dbl: document.getElementById('btn-double'), splt: document.getElementById('btn-split'),
    strat: document.getElementById('btn-strategy'),
  };

  const bal = () => (window.GameAPI.cachedBalance != null ? window.GameAPI.cachedBalance : 0);
  const fmt = (n) => CasinoShared.formatAmt(n);

  // ---------- betting: click w/ auto-breakdown, drag on/off, all-in, persists between hands ----------
  function chipColorClass(amt) {
    if (amt >= 10000) return 'bjx-c10k'; if (amt >= 5000) return 'bjx-c5k'; if (amt >= 1000) return 'bjx-c1k';
    if (amt >= 500) return 'bjx-c500'; if (amt >= 100) return 'bjx-c100'; if (amt >= 50) return 'bjx-c50';
    if (amt >= 10) return 'bjx-c10'; return 'bjx-c1';
  }

  function addToBet(preferredAmt) {
    if (gamePhase !== 'BETTING') return;
    const remaining = bal() - currentBet;
    if (remaining <= 0) { ui.msg.textContent = "You're all in — no chips left!"; return; }
    // auto-breakdown: if the chosen chip doesn't fit, drop to the largest one that does
    let amt = preferredAmt <= remaining ? preferredAmt : CasinoShared.bestFit(remaining);
    if (amt <= 0) { ui.msg.textContent = "You're out of chips!"; return; }
    currentBet += amt;
    betBreakdown.push(amt);
    CasinoShared.playSound('chip');
    updateBetVisuals();
  }

  function setBetExact(total) {
    if (gamePhase !== 'BETTING') return;
    currentBet = Math.min(total, bal());
    betBreakdown = [];
    let rem = currentBet;
    while (rem > 0) { const d = CasinoShared.bestFit(rem); betBreakdown.push(d); rem -= d; }
    updateBetVisuals();
  }

  function updateBetVisuals() {
    ui.betCircle.innerHTML = '';
    if (currentBet > 0) {
      ui.msg.textContent = `Bet: 🪙${fmt(currentBet)} — Deal when ready`;
      const chip = document.createElement('div');
      chip.className = `bjx-betchip ${chipColorClass(betBreakdown[betBreakdown.length - 1] || currentBet)}`;
      chip.textContent = fmt(currentBet);
      chip.title = 'Drag off the circle to clear the bet';
      CasinoShared.makeDraggable(chip, {
        targetSelector: '.bjx-betzone',
        amount: () => currentBet,
        label: () => fmt(currentBet),
        onDropOutside: () => { if (gamePhase === 'BETTING') { currentBet = 0; betBreakdown = []; updateBetVisuals(); CasinoShared.playSound('chip'); } },
      });
      ui.betCircle.appendChild(chip);
    } else if (gamePhase === 'BETTING') {
      ui.msg.textContent = 'Place your bet!';
    }
  }

  function selectChip(chip) {
    document.querySelectorAll('.bjx-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedAmt = parseInt(chip.dataset.amt);
    CasinoShared.playSound('chip');
  }
  document.querySelectorAll('.bjx-chip').forEach(chip => {
    CasinoShared.makeDraggable(chip, {
      targetSelector: '.bjx-betzone',
      amount: () => parseInt(chip.dataset.amt),
      label: () => CasinoShared.formatAmt(parseInt(chip.dataset.amt)),
      onTap: () => selectChip(chip),
      onDropTarget: (tgt, amt) => { selectChip(chip); addToBet(amt); },
    });
  });

  ui.betCircle.addEventListener('click', () => addToBet(selectedAmt));
  ui.betCircle.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gamePhase !== 'BETTING' || betBreakdown.length === 0) return;
    currentBet -= betBreakdown.pop();
    CasinoShared.playSound('chip');
    updateBetVisuals();
  });
  btns.clear.onclick = () => { if (gamePhase === 'BETTING') { currentBet = 0; betBreakdown = []; updateBetVisuals(); } };
  btns.allin.onclick = () => { if (gamePhase === 'BETTING') { setBetExact(bal()); ui.msg.textContent = `ALL IN: 🪙${fmt(currentBet)} 😤`; } };

  // ---------- cards ----------
  const suits = ['♥','♦','♣','♠']; const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  function buildShoe() {
    shoe = [];
    for (let i = 0; i < 4; i++) for (let s of suits) for (let v of values) shoe.push({ v, s, isRed: s === '♥' || s === '♦' });
    shoe.sort(() => Math.random() - 0.5);
  }
  function checkShoe() { if (shoe.length < TOTAL_SHOE_CARDS * 0.25) buildShoe(); }
  function drawCard() { CasinoShared.playSound('card'); checkShoe(); return shoe.pop(); }
  function makeCard(rank) { // fabricate a specific rank for the rigged dealer
    const s = suits[Math.floor(Math.random() * 4)];
    return { v: rank, s, isRed: s === '♥' || s === '♦' };
  }
  checkShoe();

  function cardVal(v) { return v === 'A' ? 11 : (['J','Q','K'].includes(v) ? 10 : parseInt(v)); }
  function calcScore(cards) {
    let total = 0, aces = 0;
    for (let c of cards) { if (c.v === 'A') { aces++; total += 11; } else total += cardVal(c.v); }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }
  function isSoft(cards) {
    let total = 0, aces = 0;
    for (let c of cards) { if (c.v === 'A') { aces++; total += 11; } else total += cardVal(c.v); }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return aces > 0;
  }

  function renderCard(card, isHidden = false) {
    const colorCls = card.isRed ? 'red' : 'black';
    const svgIcon = CasinoShared.getSVG(card.s);
    const face = `
      <div style="position:absolute; top:6px; left:7px; font-size:1rem; font-weight:800; line-height:1;">${card.v}<br><span style="font-size:.75rem;">${card.s}</span></div>
      ${svgIcon}
      <div style="position:absolute; bottom:6px; right:7px; font-size:1rem; font-weight:800; line-height:1; transform:rotate(180deg);">${card.v}<br><span style="font-size:.75rem;">${card.s}</span></div>`;
    return `<div class="bjx-card ${colorCls} ${isHidden ? 'flipped' : ''}"><div class="front">${face}</div><div class="back"></div></div>`;
  }

  function renderTable() {
    ui.dlrHand.innerHTML = '';
    if (dealerCards.length > 0) {
      if (gamePhase === 'PLAYING') {
        ui.dlrHand.innerHTML = renderCard(dealerCards[0]) + renderCard(dealerCards[1], true);
        ui.dlrScore.style.display = 'none';
      } else {
        dealerCards.forEach(c => ui.dlrHand.innerHTML += renderCard(c, false));
        ui.dlrScore.textContent = calcScore(dealerCards); ui.dlrScore.style.display = 'inline-block';
      }
    } else ui.dlrScore.style.display = 'none';

    ui.plrArea.innerHTML = '';
    playerHands.forEach((hand, idx) => {
      const isAct = (idx === currentHandIdx && gamePhase === 'PLAYING') ? 'active-hand' : '';
      let html = `<div class="bjx-handbox ${isAct}" id="p-hand-${idx}"><div class="bjx-hand">`;
      hand.cards.forEach(c => html += renderCard(c));
      html += `</div><div class="bjx-score">${calcScore(hand.cards)}${hand.status === 'bust' ? ' · BUST' : ''} · Bet 🪙${fmt(hand.bet)}</div></div>`;
      ui.plrArea.innerHTML += html;
    });
  }

  function setButtons(m) {
    const bet = m === 'bet';
    btns.deal.style.display = bet ? 'inline-flex' : 'none';
    btns.clear.style.display = bet ? 'inline-flex' : 'none';
    btns.allin.style.display = bet ? 'inline-flex' : 'none';
    btns.hit.style.display = m === 'play' ? 'inline-flex' : 'none';
    btns.stand.style.display = m === 'play' ? 'inline-flex' : 'none';
    ui.rack.style.pointerEvents = bet ? 'auto' : 'none';
    ui.rack.style.opacity = bet ? '1' : '0.5';
    if (m !== 'play') { btns.dbl.style.display = 'none'; btns.splt.style.display = 'none'; }
  }

  // ---------- basic strategy + odds ----------
  function bsMove(hand, dealerUpV) {
    const up = dealerUpV === 'A' ? 11 : cardVal(dealerUpV);
    const cards = hand.cards;
    const score = calcScore(cards);
    const two = cards.length === 2;
    const canDouble = two && (committed + hand.bet) <= bal();
    const pair = two && cards[0].v === cards[1].v;
    if (pair && (committed + hand.bet) <= bal() && playerHands.length < 4) {
      const pv = cards[0].v;
      if (pv === 'A' || pv === '8') return 'Split';
      if (pv === '9' && up >= 2 && up <= 9 && up !== 7) return 'Split';
      if (pv === '7' && up <= 7) return 'Split';
      if (pv === '6' && up <= 6) return 'Split';
      if (pv === '4' && (up === 5 || up === 6)) return 'Split';
      if ((pv === '3' || pv === '2') && up <= 7) return 'Split';
    }
    if (isSoft(cards) && cards.some(c => c.v === 'A')) {
      if (score >= 20) return 'Stand';
      if (score === 19) return (up === 6 && canDouble) ? 'Double' : 'Stand';
      if (score === 18) {
        if (up >= 3 && up <= 6) return canDouble ? 'Double' : 'Stand';
        if (up === 2 || up === 7 || up === 8) return 'Stand';
        return 'Hit';
      }
      if (score === 17) return (up >= 3 && up <= 6 && canDouble) ? 'Double' : 'Hit';
      if (score >= 15) return (up >= 4 && up <= 6 && canDouble) ? 'Double' : 'Hit';
      return (up >= 5 && up <= 6 && canDouble) ? 'Double' : 'Hit';
    }
    if (score >= 17) return 'Stand';
    if (score >= 13) return up <= 6 ? 'Stand' : 'Hit';
    if (score === 12) return (up >= 4 && up <= 6) ? 'Stand' : 'Hit';
    if (score === 11) return canDouble ? 'Double' : 'Hit';
    if (score === 10) return (up <= 9 && canDouble) ? 'Double' : 'Hit';
    if (score === 9) return (up >= 3 && up <= 6 && canDouble) ? 'Double' : 'Hit';
    return 'Hit';
  }

  function simOdds(playerScore, dealerUpV) {
    // Monte Carlo: dealer plays out from the upcard, infinite-deck approximation
    const N = 600;
    let win = 0, push = 0, lose = 0;
    const upVal = dealerUpV === 'A' ? 11 : cardVal(dealerUpV);
    for (let i = 0; i < N; i++) {
      let total = upVal, aces = dealerUpV === 'A' ? 1 : 0;
      while (total < 17) {
        const r = 1 + Math.floor(Math.random() * 13);
        const v = r === 1 ? 11 : Math.min(10, r);
        if (r === 1) aces++;
        total += v;
        while (total > 21 && aces > 0) { total -= 10; aces--; }
      }
      if (total > 21 || total < playerScore) win++;
      else if (total === playerScore) push++;
      else lose++;
    }
    return { w: Math.round(win / N * 100), p: Math.round(push / N * 100), l: Math.round(lose / N * 100) };
  }

  function updateStrategy() {
    if (!strategyOn || gamePhase !== 'PLAYING') { ui.strat.classList.remove('on'); return; }
    const hand = playerHands[currentHandIdx];
    if (!hand || hand.status !== 'active') return;
    ui.strat.classList.add('on');
    ui.stratMove.textContent = bsMove(hand, dealerCards[0].v);
    const odds = simOdds(calcScore(hand.cards), dealerCards[0].v);
    document.getElementById('odds-w').style.width = odds.w + '%';
    document.getElementById('odds-p').style.width = odds.p + '%';
    document.getElementById('odds-l').style.width = odds.l + '%';
    document.getElementById('lbl-w').textContent = `Win ${odds.w}%`;
    document.getElementById('lbl-p').textContent = `Push ${odds.p}%`;
    document.getElementById('lbl-l').textContent = `Lose ${odds.l}%`;
  }

  btns.strat.onclick = () => {
    strategyOn = !strategyOn;
    btns.strat.textContent = `📊 Strategy: ${strategyOn ? 'ON' : 'OFF'}`;
    if (!strategyOn) ui.strat.classList.remove('on');
    else updateStrategy();
  };

  // ---------- round flow ----------
  btns.deal.onclick = async () => {
    if (currentBet === 0) { ui.msg.textContent = 'Place a bet!'; return; }
    await window.GameAPI.getBalance();
    if (currentBet > bal()) { ui.msg.textContent = 'Insufficient chips!'; setBetExact(bal()); return; }
    committed = currentBet;
    playerHands = [{ cards: [drawCard(), drawCard()], bet: currentBet, status: 'active', score: 0 }];
    dealerCards = [drawCard(), drawCard()];
    currentHandIdx = 0;
    gamePhase = 'PLAYING';
    renderTable();

    // Insurance easter egg: dealer shows an Ace
    if (dealerCards[0].v === 'A') {
      offerInsurance();
    } else {
      checkHandLogic();
    }
  };

  function offerInsurance() {
    setButtons('none');
    const overlay = document.createElement('div');
    overlay.className = 'bjx-insurance';
    overlay.innerHTML = `
      <h3>Dealer shows an Ace 👀</h3>
      <div style="opacity:.85;">Take insurance? (pays 2 to 1)</div>
      <div style="display:flex; gap:14px;">
        <button class="pill" id="ins-yes" style="padding:12px 34px;">Yes</button>
        <button class="pill secondary" id="ins-no" style="padding:12px 34px;">No</button>
      </div>`;
    ui.table.appendChild(overlay);
    overlay.querySelector('#ins-yes').onclick = () => {
      window._wdbLuck = true; // the house smiles upon you now
      overlay.innerHTML = `<h3>🚫 Never take insurance!</h3><div style="opacity:.85;">...but I like your spirit. Good luck out there. 😉</div>`;
      setTimeout(() => { overlay.remove(); checkHandLogic(); }, 1900);
    };
    overlay.querySelector('#ins-no').onclick = () => { overlay.remove(); checkHandLogic(); };
  }

  function checkHandLogic() {
    const hand = playerHands[currentHandIdx]; hand.score = calcScore(hand.cards); renderTable();
    if (hand.score === 21 && hand.cards.length === 2) { ui.msg.textContent = 'BLACKJACK!'; hand.status = 'stand'; CasinoShared.playSound('win'); setTimeout(nextHand, 900); return; }
    if (hand.score > 21) { hand.status = 'bust'; renderTable(); setTimeout(nextHand, 900); return; }

    setButtons('play');
    const canDouble = hand.cards.length === 2 && (committed + hand.bet) <= bal();
    const canSplit = hand.cards.length === 2 && hand.cards[0].v === hand.cards[1].v && playerHands.length < 4 && (committed + hand.bet) <= bal();
    // only show what's actually possible
    btns.dbl.style.display = canDouble ? 'inline-flex' : 'none';
    btns.splt.style.display = canSplit ? 'inline-flex' : 'none';
    ui.msg.textContent = 'Your turn.';
    updateStrategy();
  }

  btns.hit.onclick = () => { playerHands[currentHandIdx].cards.push(drawCard()); checkHandLogic(); };
  btns.stand.onclick = () => { playerHands[currentHandIdx].status = 'stand'; nextHand(); };

  btns.dbl.onclick = () => {
    const hand = playerHands[currentHandIdx];
    committed += hand.bet;
    hand.bet *= 2; hand.cards.push(drawCard()); hand.score = calcScore(hand.cards);
    hand.status = hand.score > 21 ? 'bust' : 'stand';
    nextHand();
  };

  btns.splt.onclick = () => {
    const h = playerHands[currentHandIdx];
    committed += h.bet;
    const c2 = h.cards.pop();
    const h2 = { cards: [c2, drawCard()], bet: h.bet, status: 'active', score: 0 };
    h.cards.push(drawCard());
    playerHands.splice(currentHandIdx + 1, 0, h2);
    if (h.cards[0].v === 'A') { h.status = 'stand'; h2.status = 'stand'; nextHand(); } else checkHandLogic();
  };

  function nextHand() { currentHandIdx++; ui.strat.classList.remove('on'); if (currentHandIdx >= playerHands.length) playDealer(); else checkHandLogic(); }

  function bestPlayerScore() {
    let best = 0;
    playerHands.forEach(h => { const s = calcScore(h.cards); if (h.status !== 'bust' && s <= 21 && s > best) best = s; });
    return best;
  }

  // Rigged dealer draw: lands 17-21 strictly below the player's best hand when possible, otherwise busts
  function riggedDealerCard() {
    const score = calcScore(dealerCards);
    const target = bestPlayerScore();
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const shuffled = ranks.slice().sort(() => Math.random() - 0.5);
    // 1) try to land in [17, target-1]
    for (const r of shuffled) {
      const ns = calcScore([...dealerCards, makeCard(r)]);
      if (ns >= 17 && ns <= 21 && ns < target) return makeCard(r);
    }
    // 2) stay under 17 to keep drawing (prefer if we're low)
    if (score < 12) {
      for (const r of shuffled) {
        const ns = calcScore([...dealerCards, makeCard(r)]);
        if (ns < 17) return makeCard(r);
      }
    }
    // 3) bust on purpose
    for (const r of ['10','J','Q','K','9','8','7']) {
      const ns = calcScore([...dealerCards, makeCard(r)]);
      if (ns > 21) return makeCard(r);
    }
    return drawCard();
  }

  async function playDealer() {
    gamePhase = 'DEALER'; setButtons('none'); ui.strat.classList.remove('on');
    const allBust = playerHands.every(h => h.status === 'bust');
    const rig = window._wdbLuck && !allBust;

    const hiddenCardEl = ui.dlrHand.querySelector('.bjx-card.flipped');
    if (hiddenCardEl) { hiddenCardEl.classList.remove('flipped'); CasinoShared.playSound('card'); await new Promise(r => setTimeout(r, 600)); }

    // Rig prep: if the dealer's hole card already beats the player, quietly swap it before reveal-render
    if (rig) {
      const target = bestPlayerScore();
      const holeScore = calcScore(dealerCards);
      if (holeScore >= 17 && holeScore >= target) {
        // swap hole card for a low one so the dealer must keep drawing (into our trap)
        dealerCards[1] = makeCard(['2','3','4','5'][Math.floor(Math.random() * 4)]);
      }
    }

    if (!allBust) {
      renderTable(); await new Promise(r => setTimeout(r, 800));
      while (calcScore(dealerCards) < 17) {
        dealerCards.push(rig ? riggedDealerCard() : drawCard());
        renderTable(); await new Promise(r => setTimeout(r, 800));
      }
    } else renderTable();

    finalizeGame();
  }

  async function finalizeGame() {
    gamePhase = 'OVER'; const dScore = calcScore(dealerCards); const dBust = dScore > 21;
    let dBlackjack = dScore === 21 && dealerCards.length === 2;
    let netWinLoss = 0;

    playerHands.forEach((hand, i) => {
      let pBlackjack = hand.score === 21 && hand.cards.length === 2 && playerHands.length === 1;
      let handWon = false;
      if (hand.status === 'bust') { netWinLoss -= hand.bet; }
      else if (pBlackjack && !dBlackjack) { netWinLoss += hand.bet * 1.5; handWon = true; }
      else if (dBlackjack && !pBlackjack) { netWinLoss -= hand.bet; }
      else if (dBust || hand.score > dScore) { netWinLoss += hand.bet; handWon = true; }
      else if (hand.score < dScore) { netWinLoss -= hand.bet; }
      if (handWon) { const el = document.getElementById(`p-hand-${i}`); if (el) el.classList.add('win-anim'); }
    });

    const resultMsg = netWinLoss > 0 ? `You WON 🪙${fmt(netWinLoss)}!`
      : (netWinLoss < 0 ? `You lost 🪙${fmt(Math.abs(netWinLoss))}.` : `Push. Bets returned.`);

    try {
      await window.GameAPI.play({ game: 'blackjack', netWin: netWinLoss, resultMsg });
      if (netWinLoss > 0) CasinoShared.playSound('win');
      ui.msg.textContent = resultMsg;
      ui.msg.style.color = netWinLoss > 0 ? 'var(--accent)' : (netWinLoss < 0 ? '#f87171' : 'inherit');
    } catch (err) {
      ui.msg.textContent = 'Error saving results: ' + err.message;
    } finally {
      setTimeout(() => {
        gamePhase = 'BETTING';           // BUG FIX: was stuck in OVER, blocking all further bets
        committed = 0;
        setButtons('bet');
        // chips STAY on the circle for a repeat bet; trim if the balance can no longer cover it
        if (currentBet > bal()) setBetExact(bal());
        else updateBetVisuals();
        ui.msg.style.color = '';
        if (currentBet > 0) ui.msg.textContent = `Bet 🪙${fmt(currentBet)} is still down — Deal to go again, or Clear.`;
        else ui.msg.textContent = 'Place your bet!';
      }, 2600);
    }
  }

  setButtons('bet');
  updateBetVisuals();
};
