const test = require('node:test');
const assert = require('node:assert/strict');

const { convertDeckInput } = require('../deck-converter/converter.js');

test('converts an OPlay deck code to OPTCGSim lines in deck order', () => {
  const input = '2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccds0';
  const expected = [
    '1xOP17-039',
    '4xOP08-051',
    '2xOP14-049',
    '4xOP17-040',
    '2xOP17-042',
    '4xOP17-045',
    '4xOP17-046',
    '4xOP17-048',
    '4xOP17-049',
    '3xOP17-050',
    '3xOP17-052',
    '4xOP17-054',
    '4xOP17-055',
    '4xOP17-056',
    '4xOP17-118',
  ].join('\n');

  const converted = convertDeckInput(input);
  assert.equal(converted.text, expected);
  assert.equal(converted.leaderCount, 1);
  assert.equal(converted.deckCount, 50);
  assert.equal(converted.totalCount, 51);
  assert.equal(converted.isStandardSize, true);
});

test('accepts a complete OPlay deck-builder URL', () => {
  const input = 'https://oplaytcg.com/deck-builder?d=2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccds0&s=copy';
  const converted = convertDeckInput(input);

  assert.equal(converted.code, '2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccds0');
  assert.match(converted.text, /^1xOP17-039\n/);
  assert.equal(converted.deckCount, 50);
});

test('decodes a second real OPlay fixture', () => {
  const converted = convertDeckInput('2gSCkgASFxDiAQDiASCyhdwvYYcMeGVDOhow14bcN6HHDua');

  assert.match(converted.text, /^1xOP18-041\n/);
  assert.match(converted.text, /4xOP18-046/);
  assert.match(converted.text, /3xOP18-059$/);
  assert.equal(converted.deckCount, 50);
});

test('rejects a damaged checksum instead of returning a wrong deck', () => {
  assert.throws(
    () => convertDeckInput('2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccdsA'),
    /damaged or incomplete/
  );
});

test('supports OPlay legacy v1 codes', () => {
  const payload = Buffer.from('OP01-001|4xOP01-002,2xST01-003', 'binary')
    .toString('base64url');
  const converted = convertDeckInput(`1${payload}`);

  assert.equal(converted.text, '1xOP01-001\n4xOP01-002\n2xST01-003');
  assert.equal(converted.deckCount, 6);
});

test('merges duplicate card entries into one OPTCGSim line', () => {
  const payload = Buffer.from('OP01-001|2xOP01-002,2xOP01-002', 'binary')
    .toString('base64url');
  const converted = convertDeckInput(`1${payload}`);

  assert.equal(converted.text, '1xOP01-001\n4xOP01-002');
  assert.equal(converted.decoded.deck.length, 1);
});
