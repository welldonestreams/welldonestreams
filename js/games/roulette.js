const POCKETS = [
  {n:0,c:'green'},{n:32,c:'red'},{n:15,c:'black'},{n:19,c:'red'},{n:4,c:'black'},{n:21,c:'red'},
  {n:2,c:'black'},{n:25,c:'red'},{n:17,c:'black'},{n:34,c:'red'},{n:6,c:'black'},{n:27,c:'red'},
  {n:13,c:'black'},{n:36,c:'red'},{n:11,c:'black'},{n:30,c:'red'},{n:8,c:'black'},{n:23,c:'red'},
  {n:10,c:'black'},{n:5,c:'red'},{n:24,c:'black'},{n:16,c:'red'},{n:33,c:'black'},{n:1,c:'red'},
  {n:20,c:'black'},{n:14,c:'red'},{n:31,c:'black'},{n:9,c:'red'},{n:22,c:'black'},{n:18,c:'red'},
  {n:29,c:'black'},{n:7,c:'red'},{n:28,c:'black'},{n:12,c:'red'},{n:35,c:'black'},{n:3,c:'red'},{n:26,c:'black'}
];
const RED_NUMS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

window.Games.roulette = function() {
  const stage = document.getElementById('game-stage');

  // Self-contained grid: fixed rows/columns so nothing can drift out of alignment.
  // Rows: 3 number rows (52px) + dozens (52px) + outside (52px). Taller = easier chip drops.
  let numberCells = '';
  const rows = [ [3,6,9,12,15,18,21,24,27,30,33,36], [2,5,8,11,14,17,20,23,26,29,32,35], [1,4,7,10,13,16,19,22,25,28,31,34] ];
  rows.forEach((row, rIdx) => {
    row.forEach((num, cIdx) => {
      const color = RED_NUMS.includes(num) ? 'rl-red' : 'rl-black';
      numberCells += `<div class="rl-spot ${color}" style="grid-row:${rIdx+1}; grid-column:${cIdx+2};" data-bet="number" data-val="${num}">${num}</div>`;
    });
  });

  stage.innerHTML = `
    <style>
      .rl-wrap { max-width: 1100px; margin: 0 auto; }
      .rl-msg { text-align:center; font-weight:700; margin:10px 0 14px; min-height:26px; }
      .rl-board-outer { background:#166534; border:10px solid #78350f; border-radius:18px; padding:20px; overflow-x:auto; }
      .rl-grid {
        display:grid; gap:5px;
        grid-template-columns: 52px repeat(12, minmax(52px, 1fr)) 52px;
        grid-template-rows: repeat(3, 56px) 56px 56px;
        min-width: 880px;
      }
      .rl-spot {
        display:flex; align-items:center; justify-content:center; position:relative;
        border:1px solid rgba(255,255,255,.5); border-radius:6px;
        font-weight:800; color:#fff; cursor:pointer; user-select:none;
        transition: filter .1s, transform .05s; font-size:1.02rem;
      }
      .rl-spot:hover { filter:brightness(1.25); }
      .rl-spot:active { transform:scale(.97); }
      .rl-red { background:#b91c1c; } .rl-black { background:#1f2937; }
      .rl-green { background:#15803d; } .rl-trans { background:rgba(255,255,255,.06); }
      .rl-spot.drag-over { outline:3px dashed #eab308; outline-offset:-3px; }
      .rl-spot.winner-glow { box-shadow:0 0 0 3px #eab308, 0 0 24px #eab308; z-index:5; }
      .rl-chiprack { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:18px 0 6px; padding:12px; background:rgba(0,0,0,.25); border-radius:999px; }
      .rl-chip {
        width:52px; height:52px; border-radius:50%; cursor:pointer; position:relative;
        display:flex; align-items:center; justify-content:center; font-weight:800; color:#111; font-size:.85rem;
        border:5px dashed #fff; box-shadow:0 3px 8px rgba(0,0,0,.45); transition:transform .1s;
        background:#e5e7eb;
      }
      .rl-chip:hover { transform:translateY(-3px); }
      .rl-chip.selected { outline:3px solid #eab308; outline-offset:2px; }
      .rl-c1 { background:#f8fafc; } .rl-c10 { background:#60a5fa; } .rl-c50 { background:#4ade80; }
      .rl-c100 { background:#d1d5db; } .rl-c500 { background:#c084fc; } .rl-c1k { background:#fb923c; }
      .rl-c5k { background:#f472b6; } .rl-c10k { background:#22d3ee; }
      .rl-placed {
        position:absolute; width:36px; height:36px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:.68rem; font-weight:900; color:#111;
        border:4px dashed #fff; box-shadow:0 2px 6px rgba(0,0,0,.6); cursor:grab; z-index:3;
      }
    </style>
    <div class="rl-wrap">
      <div class="r-head" style="text-align:center;"><h2>🎡 ROULETTE</h2></div>
      <div style="display:flex; justify-content:center;"><canvas id="wheelCanvas" width="400" height="400" style="max-width:min(400px,90vw);"></canvas></div>
      <div class="rl-msg" id="r-msg">Drag chips or click to place.</div>
      <div class="rl-board-outer">
        <div class="rl-grid" id="board">
          <div class="rl-spot rl-green" style="grid-row:1 / span 3; grid-column:1;" data-bet="number" data-val="0">0</div>
          ${numberCells}
          <div class="rl-spot rl-trans" style="grid-row:1; grid-column:14;" data-bet="col3">2:1</div>
          <div class="rl-spot rl-trans" style="grid-row:2; grid-column:14;" data-bet="col2">2:1</div>
          <div class="rl-spot rl-trans" style="grid-row:3; grid-column:14;" data-bet="col1">2:1</div>
          <div class="rl-spot rl-trans" style="grid-row:4; grid-column:2 / span 4;" data-bet="1-12">1ST 12</div>
          <div class="rl-spot rl-trans" style="grid-row:4; grid-column:6 / span 4;" data-bet="13-24">2ND 12</div>
          <div class="rl-spot rl-trans" style="grid-row:4; grid-column:10 / span 4;" data-bet="25-36">3RD 12</div>
          <div class="rl-spot rl-trans" style="grid-row:5; grid-column:2 / span 2;" data-bet="1-18">1 TO 18</div>
          <div class="rl-spot rl-trans" style="grid-row:5; grid-column:4 / span 2;" data-bet="even">EVEN</div>
          <div class="rl-spot rl-red" style="grid-row:5; grid-column:6 / span 2;" data-bet="red">RED</div>
          <div class="rl-spot rl-black" style="grid-row:5; grid-column:8 / span 2;" data-bet="black">BLACK</div>
          <div class="rl-spot rl-trans" style="grid-row:5; grid-column:10 / span 2;" data-bet="odd">ODD</div>
          <div class="rl-spot rl-trans" style="grid-row:5; grid-column:12 / span 2;" data-bet="19-36">19 TO 36</div>
        </div>
        <div class="rl-chiprack" id="rack">
          <div class="rl-chip rl-c1" draggable="true" data-amt="1">1</div>
          <div class="rl-chip rl-c10 selected" draggable="true" data-amt="10">10</div>
          <div class="rl-chip rl-c50" draggable="true" data-amt="50">50</div>
          <div class="rl-chip rl-c100" draggable="true" data-amt="100">100</div>
          <div class="rl-chip rl-c500" draggable="true" data-amt="500">500</div>
          <div class="rl-chip rl-c1k" draggable="true" data-amt="1000">1k</div>
          <div class="rl-chip rl-c5k" draggable="true" data-amt="5000">5k</div>
          <div class="rl-chip rl-c10k" draggable="true" data-amt="10000">10k</div>
        </div>
        <div style="display:flex; gap:12px; margin-top:14px; justify-content:center;">
          <button class="pill secondary" id="btn-clear" style="padding:12px 24px;">Clear Bets</button>
          <button class="pill" id="btn-spin" style="padding:12px 44px; font-size:1.1rem;">Spin</button>
        </div>
      </div>
    </div>
  `;

  let bets = []; let selectedChipAmt = 10; let dragState = { amt: 10, sourceBet: null };
  const msgEl = document.getElementById('r-msg');
  const spinBtn = document.getElementById('btn-spin');
  const clearBtn = document.getElementById('btn-clear');

  function chipColorClass(amt) {
    if (amt >= 10000) return 'rl-c10k'; if (amt >= 5000) return 'rl-c5k'; if (amt >= 1000) return 'rl-c1k';
    if (amt >= 500) return 'rl-c500'; if (amt >= 100) return 'rl-c100'; if (amt >= 50) return 'rl-c50';
    if (amt >= 10) return 'rl-c10'; return 'rl-c1';
  }

  document.querySelectorAll('.rl-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.rl-chip').forEach(c => c.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedChipAmt = parseInt(e.target.dataset.amt);
      CasinoShared.playSound('chip');
    });
    chip.addEventListener('dragstart', (e) => {
      dragState = { amt: parseInt(e.target.dataset.amt), sourceBet: null };
      e.dataTransfer.effectAllowed = 'copy';
      document.querySelectorAll('.rl-chip').forEach(c => c.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedChipAmt = dragState.amt;
      CasinoShared.playSound('chip');
    });
  });

  function removeBet(betObj) {
    const idx = bets.indexOf(betObj);
    if (idx > -1) bets.splice(idx, 1);
    if (betObj.chips) betObj.chips.forEach(c => c.remove());
    updateTotalMsg();
  }

  function renderChipVisual(betObj) {
    if (!betObj.chips) betObj.chips = [];
    const chipEl = document.createElement('div');
    chipEl.draggable = true;
    chipEl.className = `rl-placed ${chipColorClass(betObj.amt)}`;
    chipEl.textContent = CasinoShared.formatAmt(betObj.amt);
    const offset = Math.random() * 6 - 3;
    chipEl.style.transform = `translate(${offset}px, ${offset - (betObj.chips.length * 2)}px)`;
    chipEl.style.zIndex = betObj.chips.length + 3;
    chipEl.addEventListener('dragstart', (e) => {
      e.stopPropagation(); dragState = { amt: betObj.amt, sourceBet: betObj };
      e.dataTransfer.effectAllowed = 'move'; CasinoShared.playSound('chip');
      setTimeout(() => betObj.chips.forEach(c => c.style.opacity = '0.5'), 0);
    });
    chipEl.addEventListener('dragend', () => { if (betObj.chips) betObj.chips.forEach(c => c.style.opacity = '1'); dragState.sourceBet = null; });
    betObj.chips.push(chipEl); betObj.spotEl.appendChild(chipEl);
  }

  function placeBet(spotEl, amt) {
    if (spinBtn.disabled) return;
    const choice = spotEl.dataset.bet;
    const val = spotEl.dataset.val ? parseInt(spotEl.dataset.val) : undefined;
    let existingBet = bets.find(b => b.choice === choice && b.val === val);
    if (existingBet) { existingBet.amt += amt; existingBet.chips.forEach(c => c.remove()); existingBet.chips = []; renderChipVisual(existingBet); }
    else { let newBet = { spotEl, choice, val, amt, chips: [] }; bets.push(newBet); renderChipVisual(newBet); }
    CasinoShared.playSound('chip');
    updateTotalMsg();
  }

  function updateTotalMsg() {
    const total = bets.reduce((sum, b) => sum + b.amt, 0);
    msgEl.textContent = total > 0 ? `Total Bet: 🪙${CasinoShared.formatAmt(total)} (right-click a stack to remove, or drag it off)` : "Drag chips or click to place.";
  }

  document.querySelectorAll('.rl-spot').forEach(spot => {
    spot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = dragState.sourceBet ? 'move' : 'copy'; spot.classList.add('drag-over'); });
    spot.addEventListener('dragleave', () => spot.classList.remove('drag-over'));
    spot.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation(); spot.classList.remove('drag-over');
      if (dragState.sourceBet) { if (dragState.sourceBet.spotEl === spot) { dragState.sourceBet = null; return; } removeBet(dragState.sourceBet); dragState.sourceBet = null; }
      placeBet(spot, dragState.amt);
    });
    spot.addEventListener('click', () => placeBet(spot, selectedChipAmt));
    spot.addEventListener('contextmenu', (e) => { e.preventDefault(); if (spinBtn.disabled) return; const b = bets.find(b => b.choice === spot.dataset.bet && b.val === (spot.dataset.val ? parseInt(spot.dataset.val) : undefined)); if (b) { removeBet(b); CasinoShared.playSound('chip'); } });
  });

  // Drag a placed stack anywhere off the board = remove that bet
  stage.addEventListener('dragover', (e) => { if (dragState.sourceBet) e.preventDefault(); });
  stage.addEventListener('drop', (e) => {
    if (dragState.sourceBet && !e.target.closest('.rl-spot')) {
      e.preventDefault();
      removeBet(dragState.sourceBet);
      dragState.sourceBet = null;
      CasinoShared.playSound('chip');
    }
  });

  clearBtn.onclick = () => { [...bets].forEach(b => removeBet(b)); document.querySelectorAll('.winner-glow').forEach(el => el.classList.remove('winner-glow')); };

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  let currentWheelAngle = 0; let currentBallAngle = 0;
  const arc = (2 * Math.PI) / POCKETS.length;

  function drawWheel(wheelAngle, bAngle, bRad) {
    ctx.clearRect(0, 0, 400, 400);
    ctx.save(); ctx.translate(200, 200); ctx.rotate(wheelAngle);
    let rimGrad = ctx.createLinearGradient(0, -200, 0, 200);
    rimGrad.addColorStop(0, '#555'); rimGrad.addColorStop(0.5, '#bbb'); rimGrad.addColorStop(1, '#555');
    ctx.beginPath(); ctx.arc(0, 0, 195, 0, 2*Math.PI); ctx.fillStyle = rimGrad; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 190, 0, 2*Math.PI); ctx.fillStyle = '#1c110a'; ctx.fill();
    for (let i = 0; i < POCKETS.length; i++) {
      let a = i * arc;
      ctx.beginPath(); ctx.arc(0, 0, 180, a, a + arc); ctx.lineTo(0, 0);
      ctx.fillStyle = POCKETS[i].c === 'red' ? '#b91c1c' : (POCKETS[i].c === 'black' ? '#1f2937' : '#15803d');
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); ctx.rotate(a + arc/2); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif'; ctx.fillText(POCKETS[i].n, 155, 5); ctx.restore();
    }
    let spinGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 40);
    spinGrad.addColorStop(0, '#fff'); spinGrad.addColorStop(0.8, '#d4af37'); spinGrad.addColorStop(1, '#aa7f17');
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, 2*Math.PI); ctx.fillStyle = spinGrad; ctx.fill();
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(200, 200); ctx.rotate(bAngle);
    ctx.beginPath(); ctx.arc(bRad, 0, 8, 0, 2*Math.PI);
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowOffsetY = 4; ctx.fill();
    ctx.restore();
  }
  drawWheel(0, 0, 190);

  spinBtn.onclick = async () => {
    if (bets.length === 0) { msgEl.textContent = 'Place a bet first!'; return; }
    const totalBet = bets.reduce((sum, b) => sum + b.amt, 0);
    if (window.GameAPI.cachedBalance != null && totalBet > window.GameAPI.cachedBalance) {
      msgEl.textContent = 'Not enough chips for all bets!'; return;
    }
    document.querySelectorAll('.winner-glow').forEach(el => el.classList.remove('winner-glow'));
    spinBtn.disabled = true; clearBtn.disabled = true;
    msgEl.textContent = "No more bets...";
    CasinoShared.playSound('spin');
    try {
      const payloadBets = bets.map(b => ({ amt: b.amt, choice: b.choice, number: b.val }));
      const d = await window.GameAPI.play({ game: 'roulette', bets: payloadBets });
      const winNum = d.spin;
      const winIdx = POCKETS.findIndex(p => p.n === winNum);
      const startW = currentWheelAngle;
      const targetPocketAngle = winIdx * arc + (arc/2);
      const totalW = (4 * 2 * Math.PI) + (Math.random() * Math.PI * 2) - (startW % (2 * Math.PI));
      const finalWheelAngle = startW + totalW;
      const finalPocketPhysicalAngle = finalWheelAngle + targetPocketAngle;
      let nStartB = currentBallAngle % (2 * Math.PI); if (nStartB < 0) nStartB += 2 * Math.PI;
      let nEndB = finalPocketPhysicalAngle % (2 * Math.PI); if (nEndB < 0) nEndB += 2 * Math.PI;
      let diff = nStartB - nEndB; if (diff < 0) diff += 2 * Math.PI;
      const totalB = -diff - (3 * 2 * Math.PI);
      const startT = performance.now();
      function anim(t) {
        let p = Math.min((t - startT) / 5500, 1);
        let ease = 1 - Math.pow(1 - p, 3);
        currentWheelAngle = startW + (totalW * ease);
        let bAngle = currentBallAngle + (totalB * ease);
        let bRad = 190;
        if (p > 0.6) {
          let dropP = (p - 0.6) / 0.4;
          let bounce = Math.abs(Math.sin(dropP * Math.PI * 4)) * (1 - dropP);
          bRad = 190 - (65 * dropP) + (15 * bounce);
        }
        drawWheel(currentWheelAngle, bAngle, bRad);
        if (p < 1) requestAnimationFrame(anim);
        else {
          currentBallAngle = finalPocketPhysicalAngle;
          drawWheel(finalWheelAngle, finalPocketPhysicalAngle, 125);
          const winSpot = document.querySelector(`.rl-spot[data-bet="number"][data-val="${winNum}"]`);
          if (winSpot) winSpot.classList.add('winner-glow');
          if (d.netWin >= 0) CasinoShared.playSound('win');
          msgEl.textContent = d.result;
          spinBtn.disabled = false; clearBtn.disabled = false;
        }
      }
      requestAnimationFrame(anim);
    } catch (err) {
      msgEl.textContent = err.message;
      spinBtn.disabled = false; clearBtn.disabled = false;
    }
  };
};