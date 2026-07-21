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

  let boardHtml = `<div class="spot s-green s-0" data-bet="number" data-val="0">0</div>`;
  const rows = [ [3,6,9,12,15,18,21,24,27,30,33,36], [2,5,8,11,14,17,20,23,26,29,32,35], [1,4,7,10,13,16,19,22,25,28,31,34] ];
  rows.forEach((row, rIdx) => {
    row.forEach((num, cIdx) => {
      const color = RED_NUMS.includes(num) ? 's-red' : 's-black';
      boardHtml += `<div class="spot ${color} s-row${rIdx+1}" style="grid-column:${cIdx+2}" data-bet="number" data-val="${num}">${num}</div>`;
    });
  });

  boardHtml += `<div class="spot s-trans s-2to1 s-row1" data-bet="col3">2:1</div>
                <div class="spot s-trans s-2to1 s-row2" data-bet="col2">2:1</div>
                <div class="spot s-trans s-2to1 s-row3" data-bet="col1">2:1</div>
                <div class="spot s-trans s-doz" style="grid-column: 2 / span 4" data-bet="1-12">1st 12</div>
                <div class="spot s-trans s-doz" style="grid-column: 6 / span 4" data-bet="13-24">2nd 12</div>
                <div class="spot s-trans s-doz" style="grid-column: 10 / span 4" data-bet="25-36">3rd 12</div>
                <div class="spot s-trans s-out" style="grid-column: 2 / span 2" data-bet="1-18">1 to 18</div>
                <div class="spot s-trans s-out" style="grid-column: 4 / span 2" data-bet="even">EVEN</div>
                <div class="spot s-red s-out" style="grid-column: 6 / span 2" data-bet="red">RED</div>
                <div class="spot s-black s-out" style="grid-column: 8 / span 2" data-bet="black">BLACK</div>
                <div class="spot s-trans s-out" style="grid-column: 10 / span 2" data-bet="odd">ODD</div>
                <div class="spot s-trans s-out" style="grid-column: 12 / span 2" data-bet="19-36">19 to 36</div>`;

  stage.innerHTML = `
    <div class="r-head"><h2>🎡 ROULETTE</h2></div>
    <div class="r-wrap">
      <div class="r-left">
        <div class="r-wheel"><canvas id="wheelCanvas" width="400" height="400"></canvas></div>
        <div class="r-msg" id="r-msg">Drag chips or click to place.</div>
      </div>
      <div class="r-board-scroll">
        <div class="r-board-area">
          <div class="board-grid" id="board">${boardHtml}</div>
          <div class="chip-rack">
            <div class="rack-chip c-10 selected" draggable="true" data-amt="10" data-lbl="10"></div>
            <div class="rack-chip c-50" draggable="true" data-amt="50" data-lbl="50"></div>
            <div class="rack-chip c-100" draggable="true" data-amt="100" data-lbl="100"></div>
            <div class="rack-chip c-500" draggable="true" data-amt="500" data-lbl="500"></div>
            <div class="rack-chip c-1k" draggable="true" data-amt="1000" data-lbl="1k"></div>
            <div class="rack-chip c-5k" draggable="true" data-amt="5000" data-lbl="5k"></div>
            <div class="rack-chip c-10k" draggable="true" data-amt="10000" data-lbl="10k"></div>
          </div>
          <div style="display:flex; gap:12px; margin-top:20px; width:100%; justify-content:center;">
            <button class="pill secondary" id="btn-clear" style="padding:12px 24px;">Clear Bets</button>
            <button class="pill" id="btn-spin" style="padding:12px 40px; font-size:1.1rem;">Spin</button>
          </div>
        </div>
      </div>
    </div>
  `;

  let bets = []; let selectedChipAmt = 10; let dragState = { amt: 10, sourceBet: null };
  const msgEl = document.getElementById('r-msg');
  const spinBtn = document.getElementById('btn-spin');
  const clearBtn = document.getElementById('btn-clear');

  document.querySelectorAll('.rack-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.rack-chip').forEach(c => c.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedChipAmt = parseInt(e.target.dataset.amt);
      CasinoShared.playSound('chip');
    });
    chip.addEventListener('dragstart', (e) => {
      dragState = { amt: parseInt(e.target.dataset.amt), sourceBet: null };
      e.dataTransfer.effectAllowed = 'copy';
      document.querySelectorAll('.rack-chip').forEach(c => c.classList.remove('selected'));
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

  function renderChipVisual(betObj, newAmt) {
    if (!betObj.chips) betObj.chips = [];
    const chipEl = document.createElement('div');
    chipEl.draggable = true;
    chipEl.className = `placed-chip ${CasinoShared.getChipClass(newAmt)}`;
    chipEl.setAttribute('data-text', CasinoShared.formatAmt(betObj.amt));

    const offset = Math.random() * 6 - 3;
    chipEl.style.transform = `translate(${offset}px, ${offset - (betObj.chips.length * 2)}px)`;
    chipEl.style.zIndex = betObj.chips.length + 2;

    chipEl.addEventListener('dragstart', (e) => {
      e.stopPropagation(); dragState = { amt: betObj.amt, sourceBet: betObj };
      e.dataTransfer.effectAllowed = 'move'; CasinoShared.playSound('chip');
      setTimeout(() => betObj.chips.forEach(c => c.style.opacity = '0.5'), 0);
    });
    chipEl.addEventListener('dragend', () => { if(betObj.chips) betObj.chips.forEach(c => c.style.opacity = '1'); dragState.sourceBet = null; });
    betObj.chips.push(chipEl); betObj.spotEl.appendChild(chipEl);
  }

  function placeBet(spotEl, amt) {
    if (spinBtn.disabled) return;
    const choice = spotEl.dataset.bet;
    const val = spotEl.dataset.val ? parseInt(spotEl.dataset.val) : undefined;

    let existingBet = bets.find(b => b.choice === choice && b.val === val);
    if (existingBet) { existingBet.amt += amt; renderChipVisual(existingBet, amt); }
    else { let newBet = { spotEl, choice, val, amt, chips: [] }; bets.push(newBet); renderChipVisual(newBet, amt); }
    CasinoShared.playSound('chip');
    updateTotalMsg();
  }

  function updateTotalMsg() {
    const total = bets.reduce((sum, b) => sum + b.amt, 0);
    msgEl.textContent = total > 0 ? `Total Bet: 🪙${CasinoShared.formatAmt(total)} (Right-click a stack to remove)` : "Drag chips or click to place.";
  }

  document.querySelectorAll('.spot').forEach(spot => {
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
      // The SERVER decides the outcome and settles all bets in one call.
      const payloadBets = bets.map(b => ({ amt: b.amt, choice: b.choice, number: b.val }));
      const d = await window.GameAPI.play({ game: 'roulette', bets: payloadBets });

      // Animate the wheel to land on the server's spin result.
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
          const winSpot = document.querySelector(`.spot[data-bet="number"][data-val="${winNum}"]`);
          if (winSpot) winSpot.classList.add('winner-glow');

          if (d.netWin >= 0) CasinoShared.playSound('win');
          msgEl.textContent = d.result; // e.g. "Landed on 17 (black). You won 350 chips."
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
