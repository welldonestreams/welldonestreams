// Shared helpers for FakeStake. LOAD THIS FIRST (before api.js, games, ui.js).
window.Games = {}; // game registry — games attach themselves to this

window.CasinoShared = {
  formatAmt(amt) { return amt >= 1000 ? (amt % 1000 === 0 ? (amt / 1000) + 'k' : (amt / 1000).toFixed(1) + 'k') : amt; },

  getChipClass(amt) {
    if (amt >= 10000) return 'c-10k'; if (amt >= 5000) return 'c-5k'; if (amt >= 1000) return 'c-1k';
    if (amt >= 500) return 'c-500'; if (amt >= 100) return 'c-100'; if (amt >= 50) return 'c-50'; return 'c-10';
  },

  audioEnabled: true,
  playSound(type) {
    if (!this.audioEnabled) return;
    const sounds = { chip: '', card: '', spin: '', win: '' }; // add real audio URLs when ready
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
