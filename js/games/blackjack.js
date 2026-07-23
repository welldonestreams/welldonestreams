window.Games.blackjack = function () {
  const stage = document.getElementById('game-stage');

  stage.innerHTML = `
    <style>
      .bjx-table { position: relative; max-width: 920px; margin: 0 auto; }
      .bjx-zone { margin: 16px 0; padding: 14px; border-radius: 16px; background: rgba(0,0,0,.24); }
      .bjx-zone h3 { margin-bottom: 10px; }
      .bjx-cards { display: flex; justify-content: center; gap: 9px; flex-wrap: wrap; min-height: 104px; }
      .bjx-card { width: 68px; height: 98px; border-radius: 9px; background: linear-gradient(160deg,#fff,#eceaf0); color: #111; position: relative; display: flex; align-items: center; justify-content: center; font-family: var(--money); font-size: 1.35rem; font-weight: 700; box-shadow: 0 5px 12px rgba(0,0,0,.5); }
      .bjx-card.red { color: #b91c1c; }
      .bjx-card.hidden { background: repeating-linear-gradient(45deg,#241b2d 0 8px,#e5a00d 8px 10px); color: transparent; }
      .bjx-hands { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      .bjx-hand { min-width: 220px; padding: 12px; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; background: rgba(0,0,0,.12); }
      .bjx-hand.active { border-color: var(--ember); box-shadow: 0 0 18px var(--ember-glow); }
      .bjx-hand.win { animation: winFloat 1.1s ease-in-out 2 alternate; }
      .bjx-meta { margin-top: 8px; font-family: var(--money); font-size: .85rem; }
      .bjx-msg { min-height: 28px; margin-top: 14px; font-weight: 700; }

      .bjx-betting { margin: 18px auto 8px; max-width: 720px; transition: opacity .18s; }
      .bjx-chiprack { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; padding: 12px; background: rgba(0,0,0,.24); border-radius: 999px; }
      .bjx-chip { width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: grab; font-family: var(--money); font-size: .76rem; }
      .bjx-chip:active { cursor: grabbing; }
      .bjx-c1 { background: #f8fafc; } .bjx-c10 { background: #60a5fa; } .bjx-c50 { background: #4ade80; }
      .bjx-c100 { background: #d1d5db; } .bjx-c500 { background: #c084fc; } .bjx-c1k { background: #fb923c; }
      .bjx-c5k { background: #f472b6; } .bjx-c10k { background: #22d3ee; }
      .bjx-betzone { width: 178px; min-height: 88px; margin: 14px auto 8px; border: 2px dashed rgba(255,255,255,.42); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; background: rgba(0,0,0,.18); cursor: pointer; }
      .bjx-betzone small { color: rgba(255,255,255,.7); max-width: 120px; line-height: 1.25; }
      .bjx-betchip { width: 68px; height: 68px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: grab; font-family: var(--money); font-size: .78rem; position: absolute; }
      .bjx-betread { font-family: var(--money); font-size: 1rem; }
      .bjx-betbuttons { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
      .bjx-actions { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 14px; }

      .bjx-strategy { display: none; max-width: 760px; margin: 16px auto 0; padding: 14px; text-align: left; border: 1px solid rgba(229,160,13,.35); border-radius: 14px; background: rgba(0,0,0,.28); }
      .bjx-strategy.on { display: block; }
      .bjx-strategy-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
      .bjx-book { color: var(--ember); font-family: var(--money); font-size: 1.05rem; }
      .bjx-odds-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 9px; margin-top: 12px; }
      .bjx-odds-card { padding: 10px; border-radius: 11px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
      .bjx-odds-card.recommended { border-color: var(--ember); box-shadow: 0 0 14px rgba(229,160,13,.15); }
      .bjx-odds-card strong { display: block; margin-bottom: 5px; color: #fff; }
      .bjx-odds-line { font-family: var(--money); font-size: .72rem; color: rgba(255,255,255,.78); }
      .bjx-odds-note { margin-top: 9px; color: var(--text-dim); font-size: .78rem; }

      .bjx-insurance { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(0,0,0,.78); backdrop-filter: blur(4px); }
      .bjx-insurance-card { width: min(570px,100%); padding: 22px; border-radius: 18px; background: var(--char); border: 1px solid rgba(229,160,13,.55); box-shadow: var(--shadow-pop); text-align: left; }
      .bjx-insurance-card h3 { color: var(--ember); margin-bottom: 10px; }
      .bjx-insurance-card p + p { margin-top: 12px; }
      .bjx-insurance-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 18px; }

      @media (max-width: 560px) {
        .bjx-card { width: 58px; height: 84px; font-size: 1.1rem; }
        .bjx-chip { width: 50px; height: 50px; font-size: .68rem; }
        .bjx-hand { min-width: 100%; }
        .bjx-zone { padding: 11px; }
      }
    </style>

    <div class="table-felt bjx-table" id="bjx-table">
      <h2>Blackjack</h2>
      <p class="game-subtitle">Beat the dealer without going over 21.</p>

      <div class="bjx-zone">
        <h3>Dealer <span id="bjx-dealer-score"></span></h3>
        <div class="bjx-cards" id="bjx-dealer"></div>
      </div>

      <div class="bjx-hands" id="bjx-hands"></div>

      <div class="bjx-betting" id="bjx-betting">
        <div class="bjx-chiprack" id="bjx-chiprack" aria-label="Blackjack chips">
          <div class="bjx-chip bjx-c1" data-amt="1" role="button" tabindex="0">1</div>
          <div class="bjx-chip bjx-c10 selected" data-amt="10" role="button" tabindex="0">10</div>
          <div class="bjx-chip bjx-c50" data-amt="50" role="button" tabindex="0">50</div>
          <div class="bjx-chip bjx-c100" data-amt="100" role="button" tabindex="0">100</div>
          <div class="bjx-chip bjx-c500" data-amt="500" role="button" tabindex="0">500</div>
          <div class="bjx-chip bjx-c1k" data-amt="1000" role="button" tabindex="0">1k</div>
          <div class="bjx-chip bjx-c5k" data-amt="5000" role="button" tabindex="0">5k</div>
          <div class="bjx-chip bjx-c10k" data-amt="10000" role="button" tabindex="0">10k</div>
        </div>

        <div class="bjx-betzone" id="bjx-betzone" aria-label="Blackjack betting circle">
          <small id="bjx-betplaceholder">Drag a chip here or tap the circle</small>
          <div id="bjx-betstack"></div>
        </div>
        <div class="bjx-betread">Bet: <span id="bjx-betamount">0</span></div>
        <div class="bjx-betbuttons">
          <button class="pill secondary" id="bjx-clear">Clear</button>
          <button class="pill secondary" id="bjx-allin">All In</button>
        </div>
      </div>

      <div class="bjx-actions">
        <button class="pill" id="bjx-deal">Deal</button>
        <button class="pill" id="bjx-hit" hidden>Hit</button>
        <button class="pill" id="bjx-stand" hidden>Stand</button>
        <button class="pill secondary" id="bjx-double" hidden>Double</button>
        <button class="pill secondary" id="bjx-split" hidden>Split</button>
        <button class="pill secondary" id="bjx-strategy-toggle">Basic Strategy: OFF</button>
      </div>

      <section class="bjx-strategy" id="bjx-strategy" aria-live="polite">
        <div class="bjx-strategy-head">
          <span>Book says: <strong class="bjx-book" id="bjx-book">—</strong></span>
          <span class="muted" id="bjx-strategy-status"></span>
        </div>
        <div class="bjx-odds-grid" id="bjx-odds-grid"></div>
        <p class="bjx-odds-note">Estimated with repeated four-deck simulations. Percentages are guidance, not a guarantee for the next hand.</p>
      </section>

      <p class="bjx-msg" id="bjx-msg" aria-live="polite">Drag chips to the betting circle.</p>
    </div>
  `;

  const els = {
    table: document.getElementById('bjx-table'),
    dealer: document.getElementById('bjx-dealer'),
    dealerScore: document.getElementById('bjx-dealer-score'),
    hands: document.getElementById('bjx-hands'),
    betting: document.getElementById('bjx-betting'),
    rack: document.getElementById('bjx-chiprack'),
    betzone: document.getElementById('bjx-betzone'),
    betstack: document.getElementById('bjx-betstack'),
    placeholder: document.getElementById('bjx-betplaceholder'),
    betamount: document.getElementById('bjx-betamount'),
    msg: document.getElementById('bjx-msg'),
    deal: document.getElementById('bjx-deal'),
    hit: document.getElementById('bjx-hit'),
    stand: document.getElementById('bjx-stand'),
    dbl: document.getElementById('bjx-double'),
    split: document.getElementById('bjx-split'),
    clear: document.getElementById('bjx-clear'),
    allin: document.getElementById('bjx-allin'),
    strategyToggle: document.getElementById('bjx-strategy-toggle'),
    strategy: document.getElementById('bjx-strategy'),
    book: document.getElementById('bjx-book'),
    oddsGrid: document.getElementById('bjx-odds-grid'),
    strategyStatus: document.getElementById('bjx-strategy-status')
  };

  let currentBet = 0;
  let selectedAmt = 10;
  let lastData = { phase: 'betting', dealerCards: [], hands: [], allowed: {} };
  let strategyOn = sessionStorage.getItem('wdb-blackjack-strategy') === 'on';
  let strategyJob = 0;
  const oddsCache = new Map();

  const fmt = (value) => CasinoShared.formatAmt(Number(value) || 0);
  const balance = () => Number.isFinite(window.GameAPI.cachedBalance) ? window.GameAPI.cachedBalance : null;

  function chipClass(amount) {
    if (amount >= 10000) return 'bjx-c10k';
    if (amount >= 5000) return 'bjx-c5k';
    if (amount >= 1000) return 'bjx-c1k';
    if (amount >= 500) return 'bjx-c500';
    if (amount >= 100) return 'bjx-c100';
    if (amount >= 50) return 'bjx-c50';
    if (amount >= 10) return 'bjx-c10';
    return 'bjx-c1';
  }

  function selectChip(chip) {
    document.querySelectorAll('.bjx-chip').forEach((item) => item.classList.remove('selected'));
    chip.classList.add('selected');
    selectedAmt = Number(chip.dataset.amt) || 1;
    CasinoShared.playSound('chip');
  }

  function addToBet(amount) {
    if (lastData.phase === 'playing') return;
    const available = balance();
    const room = available == null ? amount : Math.max(0, available - currentBet);
    const add = available == null ? amount : Math.min(amount, room);
    if (add <= 0) {
      els.msg.textContent = 'No more chips are available for this bet.';
      return;
    }
    currentBet += add;
    CasinoShared.playSound('chip');
    renderBet();
  }

  function clearBet() {
    if (lastData.phase === 'playing') return;
    currentBet = 0;
    CasinoShared.playSound('chip');
    renderBet();
  }

  function renderBet() {
    els.betamount.textContent = fmt(currentBet);
    els.betstack.innerHTML = '';
    els.placeholder.style.display = currentBet > 0 ? 'none' : '';

    if (currentBet > 0) {
      const placed = document.createElement('div');
      placed.className = `bjx-betchip ${chipClass(currentBet)}`;
      placed.textContent = fmt(currentBet);
      placed.title = 'Drag this chip away from the circle to clear the bet';
      CasinoShared.makeDraggable(placed, {
        targetSelector: '.bjx-betzone',
        amount: () => currentBet,
        label: () => fmt(currentBet),
        onTap: () => addToBet(selectedAmt),
        onDropOutside: clearBet
      });
      els.betstack.appendChild(placed);
      if (lastData.phase !== 'playing') els.msg.textContent = `Bet ${fmt(currentBet)} — deal when ready.`;
    } else if (lastData.phase !== 'playing') {
      els.msg.textContent = 'Drag chips to the betting circle.';
    }
  }

  document.querySelectorAll('.bjx-chip').forEach((chip) => {
    CasinoShared.makeDraggable(chip, {
      targetSelector: '.bjx-betzone',
      amount: () => Number(chip.dataset.amt) || 1,
      label: () => fmt(Number(chip.dataset.amt) || 1),
      onTap: () => selectChip(chip),
      onDropTarget: (_target, amount) => {
        selectChip(chip);
        addToBet(amount);
      }
    });
    chip.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectChip(chip);
        addToBet(Number(chip.dataset.amt) || 1);
      }
    });
  });

  els.betzone.addEventListener('click', (event) => {
    if (event.target.closest('.bjx-betchip')) return;
    addToBet(selectedAmt);
  });
  els.clear.addEventListener('click', clearBet);
  els.allin.addEventListener('click', async () => {
    if (lastData.phase === 'playing') return;
    if (balance() == null) await window.GameAPI.getBalance();
    currentBet = Math.max(0, balance() || 0);
    renderBet();
  });

  function cardHtml(card) {
    if (card.hidden) return '<div class="bjx-card hidden" aria-label="Hidden card">?</div>';
    return `<div class="bjx-card ${card.red ? 'red' : ''}">${card.v}${card.s}</div>`;
  }

  function render(data) {
    lastData = data;
    const playing = data.phase === 'playing';

    els.dealer.innerHTML = (data.dealerCards || []).map(cardHtml).join('');
    els.dealerScore.textContent = data.dealerScore != null ? `· ${data.dealerScore}` : '';
    els.hands.innerHTML = (data.hands || []).map((hand, index) => {
      const active = playing && index === data.activeHand;
      const statusClass = hand.status === 'win' || hand.status === 'blackjack' ? 'win' : '';
      const status = hand.status && hand.status !== 'active' ? ` · ${String(hand.status).toUpperCase()}` : '';
      return `
        <div class="bjx-hand ${active ? 'active' : ''} ${statusClass}">
          <div class="bjx-cards">${hand.cards.map(cardHtml).join('')}</div>
          <div class="bjx-meta">Score ${hand.score} · Bet ${fmt(hand.bet)}${status}</div>
        </div>`;
    }).join('');

    els.deal.hidden = playing;
    els.hit.hidden = !playing || !data.allowed?.hit || data.insuranceOffered;
    els.stand.hidden = !playing || !data.allowed?.stand || data.insuranceOffered;
    els.dbl.hidden = !playing || !data.allowed?.double || data.insuranceOffered;
    els.split.hidden = !playing || !data.allowed?.split || data.insuranceOffered;

    els.betting.style.pointerEvents = playing ? 'none' : 'auto';
    els.betting.style.opacity = playing ? '.45' : '1';
    els.clear.disabled = playing;
    els.allin.disabled = playing;

    if (typeof data.newBalance === 'number' && currentBet > data.newBalance && !playing) currentBet = Math.max(0, data.newBalance);
    renderBet();
    if (typeof data.result === 'string' && data.result) els.msg.textContent = data.result;

    if (data.insuranceOffered) showInsurance();
    updateStrategy();
  }

  function setActionButtonsDisabled(disabled) {
    [els.deal, els.hit, els.stand, els.dbl, els.split].forEach((button) => { button.disabled = disabled; });
  }

  async function act(action, extra = {}) {
    setActionButtonsDisabled(true);
    try {
      const data = await window.GameAPI.play({ game: 'blackjack', action, ...extra });
      render(data);
      if (data.win > 0) CasinoShared.playSound('win');
      return data;
    } catch (error) {
      els.msg.textContent = error.message;
      throw error;
    } finally {
      setActionButtonsDisabled(false);
    }
  }

  els.deal.addEventListener('click', async () => {
    if (currentBet <= 0) {
      els.msg.textContent = 'Place a bet first.';
      return;
    }
    try {
      await act('deal', { bet: currentBet });
    } catch (_error) {
      // act() already displayed the message.
    }
  });
  els.hit.addEventListener('click', () => act('hit').catch(() => {}));
  els.stand.addEventListener('click', () => act('stand').catch(() => {}));
  els.dbl.addEventListener('click', () => act('double').catch(() => {}));
  els.split.addEventListener('click', () => act('split').catch(() => {}));

  function showInsurance() {
    if (els.table.querySelector('.bjx-insurance')) return;
    const overlay = document.createElement('div');
    overlay.className = 'bjx-insurance';
    overlay.innerHTML = `
      <div class="bjx-insurance-card">
        <h3>Dealer shows an Ace</h3>
        <p>Take insurance?</p>
        <p class="muted">Insurance normally pays 2:1 when the dealer has blackjack.</p>
        <div class="bjx-insurance-actions">
          <button class="pill" data-answer="yes">Yes</button>
          <button class="pill secondary" data-answer="no">No</button>
        </div>
      </div>`;
    els.table.appendChild(overlay);

    overlay.querySelector('[data-answer="no"]').addEventListener('click', async () => {
      overlay.querySelectorAll('button').forEach((button) => { button.disabled = true; });
      try {
        const data = await window.GameAPI.play({ game: 'blackjack', action: 'insurance', take: false });
        overlay.remove();
        render(data);
      } catch (error) {
        overlay.querySelector('.bjx-insurance-card').insertAdjacentHTML('beforeend', `<p class="lose-text">${error.message}</p>`);
      }
    });

    overlay.querySelector('[data-answer="yes"]').addEventListener('click', async () => {
      overlay.querySelectorAll('button').forEach((button) => { button.disabled = true; });
      try {
        const data = await window.GameAPI.play({ game: 'blackjack', action: 'insurance', take: true });
        overlay.innerHTML = `
          <div class="bjx-insurance-card">
            <h3>Never take insurance!</h3>
            <p>When the dealer shows an Ace, the chance of them having a ten-value card (and thus a blackjack) is about 31%. This means that insurance will fail nearly 69% of the time, leading to consistent losses over time.</p>
            <p>Since the insurance bet pays 2:1, a winning bet only offsets the original wager’s loss. However, since this bet loses more often than it wins, the casino maintains a house edge of approximately 7.5% on insurance bets—significantly higher than the edge on the main game.</p>
            <p class="win-text"><strong>You found the easter egg:</strong> the table is giving you one lucky lesson. The dealer will bust unless you bust first.</p>
            <div class="bjx-insurance-actions"><button class="pill" id="bjx-insurance-continue">Continue</button></div>
          </div>`;
        overlay.querySelector('#bjx-insurance-continue').addEventListener('click', () => {
          overlay.remove();
          render(data);
        });
      } catch (error) {
        overlay.querySelector('.bjx-insurance-card').insertAdjacentHTML('beforeend', `<p class="lose-text">${error.message}</p>`);
      }
    });
  }

  // -------------------------- Basic strategy and estimated action probabilities
  const SIM_RANKS = ['A','2','3','4','5','6','7','8','9','10','10','10','10'];
  const randomRank = () => SIM_RANKS[Math.floor(Math.random() * SIM_RANKS.length)];
  const simCard = (v) => ({ v });
  const value = (v) => v === 'A' ? 11 : (['10','J','Q','K'].includes(v) ? 10 : Number(v));

  function scoreCards(cards) {
    let total = 0;
    let aces = 0;
    cards.forEach((card) => {
      if (card.v === 'A') aces += 1;
      total += value(card.v);
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return { total, soft: aces > 0 };
  }

  function dealerUpValue(v) {
    return v === 'A' ? 11 : Math.min(10, value(v));
  }

  function strategyDecision(cards, dealerV, allowed = {}) {
    const up = dealerUpValue(dealerV);
    const hand = scoreCards(cards);
    const two = cards.length === 2;
    const canDouble = Boolean(allowed.double && two);
    const canSplit = Boolean(allowed.split && two && cards[0].v === cards[1].v);

    if (canSplit) {
      const pair = cards[0].v;
      if (pair === 'A' || pair === '8') return 'split';
      if (pair === '9') return ((up >= 2 && up <= 6) || up === 8 || up === 9) ? 'split' : 'stand';
      if (pair === '7') return up <= 7 ? 'split' : 'hit';
      if (pair === '6') return up <= 6 ? 'split' : 'hit';
      if (pair === '4') return (up === 5 || up === 6) ? 'split' : 'hit';
      if (pair === '3' || pair === '2') return up <= 7 ? 'split' : 'hit';
    }

    if (hand.soft && cards.some((card) => card.v === 'A')) {
      if (hand.total >= 19) return 'stand';
      if (hand.total === 18) {
        if (up >= 3 && up <= 6) return canDouble ? 'double' : 'stand';
        if (up === 2 || up === 7 || up === 8) return 'stand';
        return 'hit';
      }
      if (hand.total === 17) return up >= 3 && up <= 6 && canDouble ? 'double' : 'hit';
      if (hand.total === 16 || hand.total === 15) return up >= 4 && up <= 6 && canDouble ? 'double' : 'hit';
      return up >= 5 && up <= 6 && canDouble ? 'double' : 'hit';
    }

    if (hand.total >= 17) return 'stand';
    if (hand.total >= 13) return up <= 6 ? 'stand' : 'hit';
    if (hand.total === 12) return up >= 4 && up <= 6 ? 'stand' : 'hit';
    if (hand.total === 11) return up <= 10 && canDouble ? 'double' : 'hit';
    if (hand.total === 10) return up <= 9 && canDouble ? 'double' : 'hit';
    if (hand.total === 9) return up >= 3 && up <= 6 && canDouble ? 'double' : 'hit';
    return 'hit';
  }

  function drawDealerHole(upV) {
    let rank = randomRank();
    let guard = 0;
    while (guard < 30 && ((upV === 'A' && value(rank) === 10) || (value(upV) === 10 && rank === 'A'))) {
      rank = randomRank();
      guard += 1;
    }
    return rank;
  }

  function finishDealer(upV, lucky) {
    if (lucky) return 22;
    const cards = [simCard(upV), simCard(drawDealerHole(upV))];
    while (scoreCards(cards).total < 17) cards.push(simCard(randomRank()));
    return scoreCards(cards).total;
  }

  function playSimHand(startCards, upV, allowDouble) {
    const cards = startCards.map((card) => simCard(card.v));
    let stake = 1;
    let first = cards.length === 2;

    while (true) {
      const hand = scoreCards(cards);
      if (hand.total >= 21) return { cards, stake };
      const move = strategyDecision(cards, upV, { double: allowDouble && first, split: false });
      if (move === 'stand') return { cards, stake };
      if (move === 'double' && allowDouble && first) {
        stake = 2;
        cards.push(simCard(randomRank()));
        return { cards, stake };
      }
      cards.push(simCard(randomRank()));
      first = false;
    }
  }

  function settleSimHand(cards, dealerTotal, stake) {
    const playerTotal = scoreCards(cards).total;
    if (playerTotal > 21) return -stake;
    if (dealerTotal > 21 || playerTotal > dealerTotal) return stake;
    if (playerTotal === dealerTotal) return 0;
    return -stake;
  }

  function simulateAction(action, handCards, dealerV, lucky, count = 1200) {
    let wins = 0;
    let pushes = 0;
    let losses = 0;
    let totalNet = 0;

    for (let i = 0; i < count; i += 1) {
      let net = 0;
      const dealerTotal = finishDealer(dealerV, lucky);

      if (action === 'stand') {
        net = settleSimHand(handCards, dealerTotal, 1);
      } else if (action === 'hit') {
        const firstHit = handCards.map((card) => simCard(card.v));
        firstHit.push(simCard(randomRank()));
        const played = scoreCards(firstHit).total > 21 ? { cards: firstHit, stake: 1 } : playSimHand(firstHit, dealerV, false);
        net = settleSimHand(played.cards, dealerTotal, played.stake);
      } else if (action === 'double') {
        const doubled = handCards.map((card) => simCard(card.v));
        doubled.push(simCard(randomRank()));
        net = settleSimHand(doubled, dealerTotal, 2);
      } else if (action === 'split') {
        const rank = handCards[0].v;
        const left = [simCard(rank), simCard(randomRank())];
        const right = [simCard(rank), simCard(randomRank())];
        const leftPlayed = rank === 'A' ? { cards: left, stake: 1 } : playSimHand(left, dealerV, true);
        const rightPlayed = rank === 'A' ? { cards: right, stake: 1 } : playSimHand(right, dealerV, true);
        net = settleSimHand(leftPlayed.cards, dealerTotal, leftPlayed.stake) + settleSimHand(rightPlayed.cards, dealerTotal, rightPlayed.stake);
      }

      totalNet += net;
      if (net > 0) wins += 1;
      else if (net === 0) pushes += 1;
      else losses += 1;
    }

    return {
      win: Math.round((wins / count) * 100),
      push: Math.round((pushes / count) * 100),
      lose: Math.round((losses / count) * 100),
      ev: totalNet / count
    };
  }

  function actionLabel(action) {
    return ({ hit: 'Hit', stand: 'Stand', double: 'Double', split: 'Split' })[action] || action;
  }

  function updateStrategy() {
    strategyJob += 1;
    const job = strategyJob;
    els.strategyToggle.textContent = `Basic Strategy: ${strategyOn ? 'ON' : 'OFF'}`;
    els.strategy.classList.toggle('on', strategyOn && lastData.phase === 'playing' && !lastData.insuranceOffered);

    if (!strategyOn || lastData.phase !== 'playing' || lastData.insuranceOffered) return;
    const hand = lastData.hands?.[lastData.activeHand];
    const dealer = lastData.dealerCards?.[0];
    if (!hand || !dealer || dealer.hidden) return;

    const recommended = strategyDecision(hand.cards, dealer.v, lastData.allowed || {});
    els.book.textContent = actionLabel(recommended);
    els.strategyStatus.textContent = 'Calculating estimated odds…';
    els.oddsGrid.innerHTML = '';

    const actions = ['stand', 'hit'];
    if (lastData.allowed?.double) actions.push('double');
    if (lastData.allowed?.split) actions.push('split');
    const cacheKey = JSON.stringify({ cards: hand.cards.map((card) => card.v), dealer: dealer.v, actions, lucky: Boolean(lastData.insuranceLucky) });

    setTimeout(() => {
      if (job !== strategyJob) return;
      let results = oddsCache.get(cacheKey);
      if (!results) {
        results = {};
        actions.forEach((action) => {
          results[action] = simulateAction(action, hand.cards, dealer.v, Boolean(lastData.insuranceLucky));
        });
        oddsCache.set(cacheKey, results);
      }

      els.oddsGrid.innerHTML = actions.map((action) => {
        const result = results[action];
        const evText = `${result.ev >= 0 ? '+' : ''}${result.ev.toFixed(2)} units`;
        return `
          <div class="bjx-odds-card ${action === recommended ? 'recommended' : ''}">
            <strong>${actionLabel(action)}${action === recommended ? ' ★' : ''}</strong>
            <div class="bjx-odds-line">Win ${result.win}% · Push ${result.push}% · Lose ${result.lose}%</div>
            <div class="bjx-odds-line">Estimated return ${evText}</div>
          </div>`;
      }).join('');
      els.strategyStatus.textContent = lastData.insuranceLucky ? 'Lucky lesson active' : '4-deck · dealer stands on soft 17';
    }, 0);
  }

  els.strategyToggle.addEventListener('click', () => {
    strategyOn = !strategyOn;
    sessionStorage.setItem('wdb-blackjack-strategy', strategyOn ? 'on' : 'off');
    updateStrategy();
  });

  CasinoShared.addGameInfo(stage, {
    title: 'More info',
    html: `
      <p>Get closer to 21 than the dealer without going over. Number cards use face value, face cards count as 10, and an Ace counts as 1 or 11.</p>
      <ul>
        <li><strong>Hit:</strong> draw another card.</li>
        <li><strong>Stand:</strong> finish the current hand.</li>
        <li><strong>Double:</strong> double the wager, receive one card, then stand.</li>
        <li><strong>Split:</strong> turn a matching pair into two hands.</li>
      </ul>
      <table class="game-info-table"><thead><tr><th>Result</th><th>Payout</th></tr></thead><tbody>
        <tr><td>Natural blackjack</td><td>3:2</td></tr>
        <tr><td>Regular win</td><td>1:1</td></tr>
        <tr><td>Push</td><td>Wager returned</td></tr>
      </tbody></table>
      <p class="game-info-note">The dealer stands on all 17s. The strategy panel uses simulations for education; the Worker still owns the real cards, balance, and outcome.</p>`
  });

  renderBet();
  updateStrategy();
};
