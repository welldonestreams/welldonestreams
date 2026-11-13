const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { convertDeckInput, toTcgplayerMassEntry } = require('../deck-converter/converter.js');
const cardNames = require('../deck-converter/card-names.js');

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

test('formats a real OPlay deck for TCGplayer Mass Entry with names and set codes', () => {
  const converted = convertDeckInput('2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccds0');
  const { text, unresolved } = toTcgplayerMassEntry(converted.decoded, cardNames);
  assert.equal(unresolved.length, 0);
  assert.equal(text.split('\n').length, 15);
  assert.match(text, /^1 Rocks\.D\.Xebec \[OP17\] 039\n4 Buckin \[OP08\] 051\n2 Jinbe \[OP14-EB04\] 049\n/);
  assert.match(text, /4 Rocks\.D\.Xebec \[OP17\] 118$/);
});

test('Mass Entry handles starter and promo IDs, and flags unknown card names', () => {
  const decoded = { leader: { code: 'ST01-011', quantity: 1 }, deck: [
    { code: 'P-163', quantity: 2 }, { code: 'OP99-999', quantity: 4 }
  ] };
  const { text, unresolved } = toTcgplayerMassEntry(decoded, cardNames);
  assert.equal(text.split('\n')[0], `1 ${cardNames['ST01-011']} [ST-01] 011`);
  assert.equal(text.split('\n')[1], '2 Dracule Mihawk P-163');
  assert.equal(text.split('\n')[2], '4 OP99-999');
  assert.deepEqual(unresolved, ['OP99-999']);
});

test('reports each unknown card ID once even if used as leader and deck card', () => {
  const decoded = { leader: { code: 'OP99-999', quantity: 1 }, deck: [{ code: 'OP99-999', quantity: 2 }] };
  assert.deepEqual(toTcgplayerMassEntry(decoded, cardNames).unresolved, ['OP99-999']);
});

test('the Mass Entry list has an inspectable preview alongside the copy button', () => {
  const html = fs.readFileSync(path.join(__dirname, '../deck-converter/index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '../deck-converter/app.js'), 'utf8');
  assert.match(html, /<details[^>]*id="tcgplayer-preview"/);
  assert.match(html, /<textarea[^>]*id="tcgplayer-output"[^>]*readonly/);
  assert.match(app, /tcgplayerOutput\.value = massEntry\.text/);
});

test('merges duplicate card entries into one OPTCGSim line', () => {
  const payload = Buffer.from('OP01-001|2xOP01-002,2xOP01-002', 'binary')
    .toString('base64url');
  const converted = convertDeckInput(`1${payload}`);

  assert.equal(converted.text, '1xOP01-001\n4xOP01-002');
  assert.equal(converted.decoded.deck.length, 1);
});
