window.Games.baccarat = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <style>
      .bc-sides { display:flex; gap:26px; justify-content:center; flex-wrap:wrap; margin:20px 0 6px; }
      .bc-side { min-width:210px; padding:14px; border-radius:16px; background:rgba(0,0,0,.28); border:2px solid transparent; transition:border-color .25s, box-shadow .25s; }
      .bc-side.won { border-color:#eab308; box-shadow:0 0 22px rgba(234,179,8,.45); }
      .bc-side h3 { font-size:1.05rem; letter-spacing:.06em; margin-bottom:8px; }
      .bc-cards { display:flex; gap:8px; justify-content:center; min-height:104px; }
      .bc-card {
        width:68px; height:98px; border-radius:9px; background:#fff; color:#111; position:relative;
        box-shadow:0 4px 10px rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center;
        font-size:1.5rem; font-weight:800; animation: bcdeal .32s ease;
      }
      @keyframes bcdeal { from { transform: translateY(-18px) scale(.9); opacity:0; } to { transform:none; opacity:1; } }
      .bc-card.red { color:#dc2626; }
      .bc-card .c { position:absolute; top:5px; left:7px; font-size:.85rem; line-height:1; }
      .bc-total { margin-top:10px; font-weight:900; font-size:1.5rem; }
      .bc-picks { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin:12px 0; }
      .bc-pick { border:2px solid rgba(255,255,255,.25); background:rgba(255,255,255,.06); color:inherit;
        border-radius:14px; padding:12px 22px; font-weight:800; cursor:pointer; transition:all .15s; min-width:120px; }
      .bc-pick:hover { transform:translateY(-2px); }
      .bc-pick.sel { border-color:#eab308; background:rgba(234,179,8,.18); color:#eab308; }
      .bc-pick small { display:block; font-weight:600; opacity:.7; font-size:.72rem; margin-top:2px; }
      @media (max-width:520px){ .bc-card{width:54px;height:78px;font-size:1.2rem;} .bc-side{min-width:0;flex:1;} }
    </style>
    <div class="table-felt">
      <h2>🃏 Baccarat</h2>
      <p style="opacity:.8; font-size:.88rem; margin-top:-4px;">Closest to <b>9</b> wins. Bet Player (1:1), Banker (0.95:1 after commission), or Tie (8:1). Ties push Player/Banker bets.</p>
      <div class="bc-sides">
        <div class="bc-side" id="side-player">
          <h3>PLAYER</h3>
          <div class="bc-cards" id="bc-pcards"></div>
          <div class="bc-total" id="bc-ptotal">—</div>
        </div>
        <div class="bc-side" id="side-banker">
          <h3>BANKER</h3>
          <div class="bc-cards" id="bc-bcards"></div>
          <div class="bc-total" id="bc-btotal">—</div>
        </div>
      </div>
      <div class="bc-picks">
        <button class="bc-pick sel" data-c="player">PLAYER<small>pays 1 : 1</small></button>
        <button class="bc-pick" data-c="banker">BANKER<small>pays 0.95 : 1</small></button>
        <button class="bc-pick" data-c="tie">TIE<small>pays 8 : 1</small></button>
      </div>
      <div id="bc-betmount"></div>
      <button class="pill" id="bc-deal" style="padding:12px 44px; font-size:1.1rem;">DEAL</button>
      <p id="bc-msg" style="margin-top:14px; font-weight:bold; min-height:26px;"></p>
    </div>
  `;

  let choice = 'player';
  const bet = CasinoShared.betPanel(document.getElementById('bc-betmount'), { value: 50 });
  const dealBtn = document.getElementById('bc-deal');
  const msg = document.getElementById('bc-msg');
  const pCards = document.getElementById('bc-pcards'), bCards = document.getElementById('bc-bcards');
  const pTotal = document.getElementById('bc-ptotal'), bTotal = document.getElementById('bc-btotal');

  document.querySelectorAll('.bc-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bc-pick').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      choice = btn.dataset.c;
      CasinoShared.playSound('chip');
    });
  });

  function cardHTML(c) {
    return `<div class="bc-card ${c.red ? 'red' : ''}"><span class="c">${c.v}${c.s}</span>${c.s}</div>`;
  }

  async function dealCards(el, cards) {
    el.innerHTML = '';
    for (const c of cards) {
      el.insertAdjacentHTML('beforeend', cardHTML(c));
      CasinoShared.playSound('card');
      await new Promise(r => setTimeout(r, 340));
    }
  }

  dealBtn.addEventListener('click', async () => {
    const b = bet.get();
    if (b <= 0) { msg.textContent = 'Enter a valid bet.'; return; }
    if (window.GameAPI.cachedBalance != null && b > window.GameAPI.cachedBalance) { msg.textContent = 'Not enough chips.'; return; }
    dealBtn.disabled = true; msg.textContent = '';
    pCards.innerHTML = ''; bCards.innerHTML = ''; pTotal.textContent = '—'; bTotal.textContent = '—';
    document.querySelectorAll('.bc-side').forEach(s => s.classList.remove('won'));
    try {
      const d = await window.GameAPI.play({ game: 'baccarat', bet: b, choice });
      await dealCards(pCards, d.playerCards.slice(0, 2));
      await dealCards(bCards, d.bankerCards.slice(0, 2));
      if (d.playerCards.length > 2) { pCards.insertAdjacentHTML('beforeend', cardHTML(d.playerCards[2])); await new Promise(r => setTimeout(r, 340)); }
      if (d.bankerCards.length > 2) { bCards.insertAdjacentHTML('beforeend', cardHTML(d.bankerCards[2])); await new Promise(r => setTimeout(r, 340)); }
      pTotal.textContent = d.playerTotal; bTotal.textContent = d.bankerTotal;
      if (d.outcome === 'player') document.getElementById('side-player').classList.add('won');
      else if (d.outcome === 'banker') document.getElementById('side-banker').classList.add('won');
      else { document.getElementById('side-player').classList.add('won'); document.getElementById('side-banker').classList.add('won'); }
      msg.style.color = d.win > 0 ? 'var(--accent)' : (d.win < 0 ? '#f87171' : 'inherit');
      msg.textContent = d.result;
      if (d.win > 0) CasinoShared.playSound('win');
    } catch (e) {
      msg.style.color = '#f87171';
      msg.textContent = e.message;
    } finally {
      dealBtn.disabled = false;
    }
  });

  CasinoShared.addGameInfo(stage, { title: 'More info', html: `<p>Choose Player, Banker, or Tie. Cards are dealt automatically using standard punto banco drawing rules.</p><p>Aces count as 1, 2–9 use face value, and 10/J/Q/K count as 0. Only the last digit of the total matters.</p><table class="game-info-table"><thead><tr><th>Bet</th><th>Profit payout</th></tr></thead><tbody><tr><td>Player</td><td>1:1</td></tr><tr><td>Banker</td><td>0.95:1</td></tr><tr><td>Tie</td><td>8:1</td></tr></tbody></table><p class="game-info-note">Player and Banker bets push when the result is a tie.</p>` });
};
