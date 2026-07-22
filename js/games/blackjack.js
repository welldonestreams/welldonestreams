window.Games.blackjack = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <style>
      .bj-board{max-width:760px;margin:0 auto}.bj-zone{margin:18px 0;padding:14px;border-radius:16px;background:rgba(0,0,0,.22)}
      .bj-zone h3{margin-bottom:10px}.bj-cards{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;min-height:104px}
      .bj-card{width:68px;height:98px;border-radius:9px;background:linear-gradient(160deg,#fff,#eceaf0);color:#111;position:relative;display:flex;align-items:center;justify-content:center;font-family:var(--money);font-size:1.35rem;font-weight:700;box-shadow:0 5px 12px rgba(0,0,0,.5)}
      .bj-card.red{color:#b91c1c}.bj-card.hidden{background:repeating-linear-gradient(45deg,#241b2d 0 8px,#e5a00d 8px 10px);color:transparent}
      .bj-hands{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.bj-hand{min-width:210px;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:14px}.bj-hand.active{border-color:var(--ember);box-shadow:0 0 18px var(--ember-glow)}
      .bj-meta{margin-top:8px;font-family:var(--money);font-size:.85rem}.bj-msg{min-height:28px;margin-top:14px;font-weight:700}
    </style>
    <div class="table-felt bj-board">
      <h2>Blackjack</h2><p class="game-subtitle">Beat the dealer without going over 21.</p>
      <div class="bj-zone"><h3>Dealer <span id="bj-dealer-score"></span></h3><div class="bj-cards" id="bj-dealer"></div></div>
      <div class="bj-hands" id="bj-hands"></div>
      <div id="bj-betmount"></div>
      <div class="game-actions">
        <button class="pill" id="bj-deal">Deal</button><button class="pill" id="bj-hit" hidden>Hit</button><button class="pill" id="bj-stand" hidden>Stand</button><button class="pill secondary" id="bj-double" hidden>Double</button><button class="pill secondary" id="bj-split" hidden>Split</button>
      </div>
      <p class="bj-msg" id="bj-msg" aria-live="polite">Place your bet.</p>
    </div>`;
  const bet=CasinoShared.betPanel(document.getElementById('bj-betmount'),{value:50});
  const els={dealer:document.getElementById('bj-dealer'),dealerScore:document.getElementById('bj-dealer-score'),hands:document.getElementById('bj-hands'),msg:document.getElementById('bj-msg'),deal:document.getElementById('bj-deal'),hit:document.getElementById('bj-hit'),stand:document.getElementById('bj-stand'),dbl:document.getElementById('bj-double'),split:document.getElementById('bj-split')};
  const cardHtml=c=>c.hidden?'<div class="bj-card hidden">?</div>':`<div class="bj-card ${c.red?'red':''}">${c.v}${c.s}</div>`;
  function render(data){
    els.dealer.innerHTML=(data.dealerCards||[]).map(cardHtml).join(''); els.dealerScore.textContent=data.dealerScore!=null?`· ${data.dealerScore}`:'';
    els.hands.innerHTML=(data.hands||[]).map((h,i)=>`<div class="bj-hand ${i===data.activeHand&&data.phase==='playing'?'active':''}"><div class="bj-cards">${h.cards.map(cardHtml).join('')}</div><div class="bj-meta">Score ${h.score} · Bet ${CasinoShared.formatAmt(h.bet)}${h.status&&h.status!=='active'?` · ${h.status.toUpperCase()}`:''}</div></div>`).join('');
    const playing=data.phase==='playing'; els.deal.hidden=playing; els.hit.hidden=!playing||!data.allowed?.hit; els.stand.hidden=!playing||!data.allowed?.stand; els.dbl.hidden=!playing||!data.allowed?.double; els.split.hidden=!playing||!data.allowed?.split;
    document.getElementById('bj-betmount').style.display=playing?'none':''; if(data.result) els.msg.textContent=data.result;
  }
  async function act(action,extra={}){Object.values(els).filter(x=>x&&x.tagName==='BUTTON').forEach(b=>b.disabled=true);try{const d=await GameAPI.play({game:'blackjack',action,...extra});render(d);if(d.win>0)CasinoShared.playSound('win');}catch(e){els.msg.textContent=e.message;}finally{Object.values(els).filter(x=>x&&x.tagName==='BUTTON').forEach(b=>b.disabled=false);}}
  els.deal.onclick=()=>act('deal',{bet:bet.get()}); els.hit.onclick=()=>act('hit'); els.stand.onclick=()=>act('stand'); els.dbl.onclick=()=>act('double'); els.split.onclick=()=>act('split');
  CasinoShared.addGameInfo(stage,{title:'More info',html:`<p>Get closer to 21 than the dealer without going over. Number cards use face value, face cards count as 10, and an ace counts as 1 or 11.</p><ul><li><strong>Hit:</strong> draw another card.</li><li><strong>Stand:</strong> finish the current hand.</li><li><strong>Double:</strong> double the wager, receive one card, then stand.</li><li><strong>Split:</strong> turn a matching pair into two hands.</li></ul><table class="game-info-table"><thead><tr><th>Result</th><th>Payout</th></tr></thead><tbody><tr><td>Natural blackjack</td><td>3:2</td></tr><tr><td>Regular win</td><td>1:1</td></tr><tr><td>Push</td><td>Wager returned</td></tr></tbody></table><p class="game-info-note">The dealer stands on all 17s. Cards and outcomes are generated and verified by the server.</p>`});
};
