(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OPlayConverter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const PREFIXES = ['OP', 'ST', 'EB', 'PRB', 'P'];
  const CARD_BODY = '[A-Za-z]{1,5}\\d{0,3}-\\d{1,4}[A-Za-z0-9_]*';
  const CARD_PATTERN = new RegExp(`^${CARD_BODY}$`);
  const LEGACY_ENTRY_PATTERN = new RegExp(`^(\\d{1,2})x(${CARD_BODY})$`, 'i');

  class BitReader {
    constructor(bits) {
      this.bits = bits;
      this.position = 0;
    }

    read(length) {
      if (this.position + length > this.bits.length) throw new Error('Unexpected end of deck code.');
      let value = 0;
      for (let index = 0; index < length; index += 1) {
        value = (value << 1) | this.bits[this.position++];
      }
      return value;
    }
  }

  function extractDeckCode(input) {
    const value = String(input || '').trim();
    if (!value) throw new Error('Paste an OPlay deck link or code.');
    if (/\s/.test(value)) throw new Error('The OPlay link or code contains spaces.');

    const match = value.match(/[?&]d=([A-Za-z0-9_-]+)/);
    const code = match ? match[1] : value;
    if (code.length < 2 || !/^[A-Za-z0-9_-]+$/.test(code)) {
      throw new Error('That is not a valid OPlay deck link or code.');
    }
    return code;
  }

  function checksum(payload) {
    let value = 7;
    for (let index = 0; index < payload.length; index += 1) {
      value = (31 * value + payload.charCodeAt(index)) % 4093;
    }
    return ALPHABET[value % 64];
  }

  function decodeCard(reader, hasQuantity, previousParts) {
    let prefix;
    let set;

    if (hasQuantity && reader.read(1) === 1) {
      if (!previousParts) throw new Error('Deck code repeats a card set before defining it.');
      ({ prefix, set } = previousParts);
    } else {
      const family = reader.read(4);
      if (family === 15) {
        const length = reader.read(5) + 1;
        let code = '';
        for (let index = 0; index < length; index += 1) code += String.fromCharCode(reader.read(7));
        return { code, quantity: hasQuantity ? reader.read(7) : 1, parts: null };
      }

      if (family === 14) {
        const length = reader.read(2) + 1;
        prefix = '';
        for (let index = 0; index < length; index += 1) {
          const letter = reader.read(5);
          if (letter > 25) throw new Error('Deck code contains an invalid card prefix.');
          prefix += String.fromCharCode(65 + letter);
        }
      } else {
        if (family >= PREFIXES.length) throw new Error('Deck code contains an unknown card family.');
        prefix = PREFIXES[family];
      }
      set = reader.read(7);
    }

    const parts = { prefix, set, number: reader.read(10) };
    const setText = parts.set ? String(parts.set).padStart(2, '0') : '';
    return {
      code: `${parts.prefix}${setText}-${String(parts.number).padStart(3, '0')}`,
      quantity: hasQuantity ? reader.read(2) + 1 : 1,
      parts
    };
  }

  function decodeVersion2(code) {
    const payload = code.slice(1, -1);
    if (!payload || checksum(payload) !== code[code.length - 1]) {
      throw new Error('The OPlay deck code is damaged or incomplete.');
    }

    const bits = [];
    for (const character of payload) {
      const value = ALPHABET.indexOf(character);
      if (value < 0) throw new Error('The OPlay deck code contains invalid characters.');
      for (let bit = 5; bit >= 0; bit -= 1) bits.push((value >> bit) & 1);
    }

    const reader = new BitReader(bits);
    let leader = null;
    let previousParts = null;
    if (reader.read(1)) {
      leader = decodeCard(reader, false, null);
      previousParts = leader.parts;
    }

    const entryCount = reader.read(7);
    if (entryCount > 80) throw new Error('The OPlay deck contains too many entries.');

    const deck = [];
    for (let index = 0; index < entryCount; index += 1) {
      const card = decodeCard(reader, true, previousParts);
      previousParts = card.parts;
      if (!CARD_PATTERN.test(card.code) || card.quantity <= 0) {
        throw new Error('The OPlay deck code contains an invalid card.');
      }
      deck.push(card);
    }

    if (leader && !CARD_PATTERN.test(leader.code)) throw new Error('The OPlay leader code is invalid.');
    if (!leader && deck.length === 0) throw new Error('The OPlay deck code contains no cards.');
    return { version: 2, leader, deck };
  }

  function decodeVersion1(code) {
    let decoded;
    try {
      const value = code.slice(1).replace(/-/g, '+').replace(/_/g, '/');
      if (typeof atob === 'function') decoded = atob(value);
      else decoded = Buffer.from(value, 'base64').toString('binary');
    } catch (_) {
      throw new Error('The legacy OPlay deck code could not be decoded.');
    }

    const separator = decoded.indexOf('|');
    if (separator < 0) throw new Error('The legacy OPlay deck code is invalid.');
    const leaderCode = decoded.slice(0, separator).toUpperCase();
    const leader = leaderCode && CARD_PATTERN.test(leaderCode)
      ? { code: leaderCode, quantity: 1, parts: null }
      : null;
    const deck = [];
    const list = decoded.slice(separator + 1);
    if (list) {
      for (const item of list.split(',')) {
        const match = item.match(LEGACY_ENTRY_PATTERN);
        if (!match) continue;
        const quantity = Number.parseInt(match[1], 10);
        if (quantity > 0) deck.push({ quantity, code: match[2].toUpperCase(), parts: null });
        if (deck.length >= 80) break;
      }
    }
    if (!leader && deck.length === 0) throw new Error('The legacy OPlay deck code contains no cards.');
    return { version: 1, leader, deck };
  }

  function mergeDuplicateCards(cards) {
    const merged = [];
    const byCode = new Map();
    for (const card of cards) {
      const existing = byCode.get(card.code);
      if (existing) existing.quantity += card.quantity;
      else {
        const copy = { ...card };
        byCode.set(copy.code, copy);
        merged.push(copy);
      }
    }
    return merged;
  }

  function decodeDeckCode(code) {
    const decoded = code[0] === '2'
      ? decodeVersion2(code)
      : code[0] === '1'
        ? decodeVersion1(code)
        : null;
    if (!decoded) throw new Error(`OPlay deck-code version ${code[0]} is not supported.`);
    return { ...decoded, deck: mergeDuplicateCards(decoded.deck) };
  }

  function toOptcgSim(decoded) {
    return [decoded.leader, ...decoded.deck]
      .filter(Boolean)
      .map((card) => `${card.quantity}x${card.code}`)
      .join('\n');
  }

  function toTcgplayerMassEntry(decoded, cardNames) {
    const unresolved = [];
    const text = [decoded.leader, ...decoded.deck]
      .filter(Boolean)
      .map(({ code, quantity }) => {
        const name = cardNames[code];
        if (!name) {
          if (!unresolved.includes(code)) unresolved.push(code);
          return `${quantity} ${code}`;
        }
        const match = code.match(/^(OP|ST|EB|PRB)(\d{2})-(\d{3})$/);
        if (!match) return `${quantity} ${name} ${code}`;
        const [, prefix, set, number] = match;
        const setCode = prefix === 'OP' && set === '14' ? 'OP14-EB04'
          : prefix === 'ST' || prefix === 'PRB' ? `${prefix}-${set}`
            : `${prefix}${set}`;
        return `${quantity} ${name} [${setCode}] ${number}`;
      }).join('\n');
    return { text, unresolved };
  }

  function convertDeckInput(input) {
    const code = extractDeckCode(input);
    const decoded = decodeDeckCode(code);
    const leaderCount = decoded.leader ? 1 : 0;
    const deckCount = decoded.deck.reduce((sum, card) => sum + card.quantity, 0);
    return {
      code,
      decoded,
      text: toOptcgSim(decoded),
      leaderCount,
      deckCount,
      totalCount: leaderCount + deckCount,
      isStandardSize: leaderCount === 1 && deckCount === 50
    };
  }

  return { extractDeckCode, checksum, decodeDeckCode, toOptcgSim, toTcgplayerMassEntry, convertDeckInput };
});
