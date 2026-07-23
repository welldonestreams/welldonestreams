// Shared helpers for WellDoneBets. LOAD THIS FIRST (before api.js, games, ui.js).
window.Games = {}; // game registry — games attach themselves to this

window.CasinoShared = {
  formatAmt(amt) { return amt >= 1000 ? (amt % 1000 === 0 ? (amt / 1000) + 'k' : (amt / 1000).toFixed(1) + 'k') : amt; },

  getChipClass(amt) {
    if (amt >= 10000) return 'c-10k'; if (amt >= 5000) return 'c-5k'; if (amt >= 1000) return 'c-1k';
    if (amt >= 500) return 'c-500'; if (amt >= 100) return 'c-100'; if (amt >= 50) return 'c-50';
    if (amt >= 10) return 'c-10'; return 'c-1';
  },

  // Standard chip denominations, largest first — used for auto-breakdown betting
  DENOMS: [10000, 5000, 1000, 500, 100, 50, 10, 1],

  // Given a remaining budget, the largest denom that fits (or 0)
  bestFit(remaining) {
    for (const d of this.DENOMS) if (d <= remaining) return d;
    return 0;
  },

  // Bet controls used by slots / coinflip / craps / baccarat. Styling lives in games.css.
  betPanel(mountEl, opts = {}) {
    const start = opts.value || 50;
    mountEl.innerHTML = `
      <div class="wdb-panel">
        <div class="wdb-stepper">
          <button type="button" class="wdb-step" data-d="-1" aria-label="Lower bet">−</button>
          <input type="number" class="wdb-bet" value="${start}" min="1" aria-label="Bet amount" />
          <button type="button" class="wdb-step" data-d="1" aria-label="Raise bet">+</button>
        </div>
        <div class="wdb-quicks">
          ${[10, 50, 100, 500, 1000].map(v => `<button type="button" class="wdb-quick" data-v="${v}">${this.formatAmt(v)}</button>`).join('')}
          <button type="button" class="wdb-quick allin" data-v="all">ALL IN</button>
        </div>
      </div>`;
    const input = mountEl.querySelector('.wdb-bet');
    const step = (dir) => {
      const cur = parseInt(input.value, 10) || 0;
      const stepSize = cur >= 1000 ? 500 : (cur >= 100 ? 50 : 10);
      input.value = Math.max(1, cur + dir * stepSize);
    };
    mountEl.querySelectorAll('.wdb-step').forEach(b => b.addEventListener('click', () => step(parseInt(b.dataset.d, 10))));
    mountEl.querySelectorAll('.wdb-quick').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.v === 'all') input.value = Math.max(1, window.GameAPI.cachedBalance || 0);
      else input.value = b.dataset.v;
    }));
    return { get: () => parseInt(input.value, 10) || 0, set: (v) => { input.value = v; } };
  },


  // ---- Touch-capable drag/drop. HTML5 dragstart never fires on mobile, so we use
  // Pointer Events with a floating ghost and hit-test the drop target ourselves.
  // sources: elements you can pick a chip up from. targets: valid drop zones.
  makeDraggable(el, opts) {
    // opts: { amount(), label(), onDropTarget(targetEl, amount), onDropOutside(amount), targetSelector, container }
    let ghost = null, dragging = false, startX = 0, startY = 0, moved = false, lastTarget = null;
    const TH = 6;

    const cleanup = () => {
      if (ghost) { ghost.remove(); ghost = null; }
      if (lastTarget) { lastTarget.classList.remove('drag-over'); lastTarget = null; }
      dragging = false; moved = false;
    };

    el.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < TH) return;
      if (!moved) {
        moved = true;
        ghost = document.createElement('div');
        ghost.textContent = opts.label ? opts.label() : '';
        ghost.className = 'wdb-ghost';
        ghost.style.cssText = 'position:fixed;z-index:9999;width:46px;height:46px;border-radius:50%;border:5px dashed #fff;display:flex;align-items:center;justify-content:center;font-weight:900;color:#111;font-size:.75rem;pointer-events:none;box-shadow:0 6px 16px rgba(0,0,0,.6);opacity:.92;';
        ghost.style.background = getComputedStyle(el).backgroundColor || '#e5e7eb';
        document.body.appendChild(ghost);
      }
      e.preventDefault();
      ghost.style.left = (e.clientX - 23) + 'px';
      ghost.style.top = (e.clientY - 23) + 'px';
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const tgt = under ? under.closest(opts.targetSelector) : null;
      if (tgt !== lastTarget) {
        if (lastTarget) lastTarget.classList.remove('drag-over');
        if (tgt) tgt.classList.add('drag-over');
        lastTarget = tgt;
      }
    });

    const finish = (e) => {
      if (!dragging) return;
      const wasMoved = moved;
      const tgt = lastTarget;
      const amt = opts.amount ? opts.amount() : 0;
      cleanup();
      if (!wasMoved) { if (opts.onTap) opts.onTap(); return; }
      if (tgt) { if (opts.onDropTarget) opts.onDropTarget(tgt, amt); }
      else if (opts.onDropOutside) opts.onDropOutside(amt);
    };
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', () => cleanup());
  },

  audioEnabled: true,
  playSound(type) {
    if (!this.audioEnabled) return;
    const sounds = { chip: '', card: '', spin: '', win: '' };
    if (sounds[type]) {
      const audio = new Audio(sounds[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  },

  getSVG(suit) {
    const svgs = {
      '♥': `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
      '♦': `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 12l10 10-10 10L2 12z" transform="scale(0.8) translate(3,3)"/></svg>`,
      '♣': `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-2.21 0-4 1.79-4 4 0 1.5.86 2.8 2.14 3.45-.63-.09-1.28-.15-1.94-.15-2.76 0-5 2.24-5 5s2.24 5 5 5c1.47 0 2.79-.64 3.71-1.65.23 1.25.5 2.35 1.09 3.35h4c.59-1 .86-2.1 1.09-3.35.92 1.01 2.24 1.65 3.71 1.65 2.76 0 5-2.24 5-5s-2.24-5-5-5c-.66 0-1.31.06-1.94.15C19.14 8.8 20 7.5 20 6c0-2.21-1.79-4-4-4z"/></svg>`,
      '♠': `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-.35 0-.7.21-.92.58l-7.79 13.06c-.34.58-.33 1.3.04 1.87.36.57.98.9 1.64.9h2.39c.39 1.36.94 3.02 1.64 4.59h6c.7-1.57 1.25-3.23 1.64-4.59h2.39c.66 0 1.28-.33 1.64-.9.37-.57.38-1.29.04-1.87l-7.79-13.06C12.7 2.21 12.35 2 12 2z"/></svg>`
    };
    return svgs[suit] || suit;
  }
};


CasinoShared.addGameInfo = function addGameInfo(target, content) {
  if (!target || !content) return null;

  const details = document.createElement('details');
  details.className = 'game-info';

  const summary = document.createElement('summary');
  summary.textContent = content.title || 'More info';

  const body = document.createElement('div');
  body.className = 'game-info-body';
  body.innerHTML = content.html || '';

  details.append(summary, body);
  target.appendChild(details);

  return details;
};
