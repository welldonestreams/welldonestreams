(function collectionModelModule(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CollectionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const CARD_CODE = /^(?:OP|ST|EB|PRB)\d{2}-\d{3}$|^P-\d{3}$/i;
  const CDN_ROOT = 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece';

  function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
  }

  function getSetCode(code) {
    const normalized = normalizeCode(code);
    if (normalized.startsWith('P-')) return 'P';
    return normalized.split('-')[0] || 'Unknown';
  }

  function imageForCode(code) {
    const normalized = normalizeCode(code);
    return `${CDN_ROOT}/${getSetCode(normalized)}/${normalized}_EN.webp`;
  }

  function parseImport(text) {
    const combined = new Map();
    const errors = [];

    String(text || '').split(/\r?\n/).forEach((raw, index) => {
      const value = raw.trim();
      if (!value) return;

      let quantity = 1;
      let code = value;
      let match = value.match(/^(\d{1,2})\s*x?\s*((?:OP|ST|EB|PRB)\d{2}-\d{3}|P-\d{3})$/i);
      if (match) {
        quantity = Number(match[1]);
        code = match[2];
      } else {
        match = value.match(/^((?:OP|ST|EB|PRB)\d{2}-\d{3}|P-\d{3})$/i);
        if (match) code = match[1];
      }

      code = normalizeCode(code);
      if (!CARD_CODE.test(code) || quantity < 1) {
        errors.push({ line: index + 1, value });
        return;
      }
      combined.set(code, (combined.get(code) || 0) + quantity);
    });

    return {
      entries: [...combined].map(([code, quantity]) => ({ code, quantity })),
      errors,
    };
  }

  function mergeCards(baseCards, importedEntries, nameCatalog = {}) {
    const cards = baseCards.map((card) => ({ ...card }));
    const byCode = new Map(cards.map((card, index) => [normalizeCode(card.code), index]));

    importedEntries.forEach(({ code: rawCode, quantity: rawQuantity }) => {
      const code = normalizeCode(rawCode);
      const quantity = Number(rawQuantity) || 0;
      if (!CARD_CODE.test(code) || quantity < 1) return;

      if (byCode.has(code)) {
        const card = cards[byCode.get(code)];
        card.quantity = Number(card.quantity || 0) + quantity;
        return;
      }

      const setCode = getSetCode(code);
      byCode.set(code, cards.length);
      cards.push({
        code,
        name: nameCatalog[code] || code,
        quantity,
        setCode,
        setName: setCode,
        color: 'Unknown',
        type: 'Unknown',
        rarity: '',
        image: imageForCode(code),
        addedBy: 'scan-import',
      });
    });

    return cards;
  }

  function filterCards(cards, filters = {}) {
    const query = String(filters.query || '').trim().toLowerCase();
    const set = filters.set || 'All';
    const color = filters.color || 'All';

    return cards.filter((card) => {
      if (Number(card.quantity || 0) < 1) return false;
      if (set !== 'All' && card.setCode !== set) return false;
      const cardColors = String(card.color || 'Unknown').split(/\s*\/\s*/);
      if (color !== 'All' && !cardColors.includes(color)) return false;
      if (!query) return true;
      const haystack = [card.name, card.code, card.setName, card.setCode, card.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function summarize(cards) {
    return cards.reduce((summary, card) => {
      const quantity = Number(card.quantity || 0);
      if (quantity > 0) {
        summary.total += quantity;
        summary.unique += 1;
      }
      return summary;
    }, { total: 0, unique: 0 });
  }

  return {
    filterCards,
    getSetCode,
    imageForCode,
    mergeCards,
    normalizeCode,
    parseImport,
    summarize,
  };
});
