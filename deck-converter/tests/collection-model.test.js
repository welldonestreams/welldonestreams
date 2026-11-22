const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CollectionModel = require('../collection-model.js');

test('parseImport accepts scanner-style codes and quantity-first lines', () => {
  const parsed = CollectionModel.parseImport(`OP01-001\n2 op02-089\n3x ST18-001\nnot-a-card`);

  assert.deepEqual(parsed.entries, [
    { code: 'OP01-001', quantity: 1 },
    { code: 'OP02-089', quantity: 2 },
    { code: 'ST18-001', quantity: 3 },
  ]);
  assert.deepEqual(parsed.errors, [{ line: 4, value: 'not-a-card' }]);
});

test('mergeCards adds imported quantities and creates future scanned cards', () => {
  const base = [
    { code: 'OP01-001', name: 'Roronoa Zoro', quantity: 2, setCode: 'OP01', color: 'Red' },
  ];
  const imported = [
    { code: 'OP01-001', quantity: 3 },
    { code: 'OP02-089', quantity: 1 },
  ];

  assert.deepEqual(CollectionModel.mergeCards(base, imported, {
    'OP02-089': 'Judgment of Hell',
  }), [
    { code: 'OP01-001', name: 'Roronoa Zoro', quantity: 5, setCode: 'OP01', color: 'Red' },
    {
      code: 'OP02-089',
      name: 'Judgment of Hell',
      quantity: 1,
      setCode: 'OP02',
      setName: 'OP02',
      color: 'Unknown',
      type: 'Unknown',
      rarity: '',
      image: 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP02/OP02-089_EN.webp',
      addedBy: 'scan-import',
    },
  ]);
});

test('filterCards combines search, set, and color filters', () => {
  const cards = [
    { code: 'OP01-001', name: 'Roronoa Zoro', quantity: 1, setCode: 'OP01', setName: 'Romance Dawn', color: 'Red' },
    { code: 'OP02-089', name: 'Judgment of Hell', quantity: 1, setCode: 'OP02', setName: 'Paramount War', color: 'Purple' },
  ];

  assert.deepEqual(
    CollectionModel.filterCards(cards, { query: 'hell', set: 'OP02', color: 'Purple' }),
    [cards[1]],
  );
  assert.deepEqual(CollectionModel.filterCards(cards, { query: 'zoro', set: 'OP02', color: 'All' }), []);

  const multicolor = [
    { code: 'OP10-001', name: 'Leader', quantity: 1, setCode: 'OP10', color: 'Red/Yellow' },
  ];
  assert.deepEqual(CollectionModel.filterCards(multicolor, { color: 'Red' }), multicolor);
});

test('summarize reports total copies and unique entries', () => {
  assert.deepEqual(CollectionModel.summarize([
    { quantity: 4 },
    { quantity: 2 },
    { quantity: 0 },
  ]), { total: 6, unique: 2 });
});

test('built collection contains every identified owned card and review line', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'collection-data.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.collection = OnePieceCollection;`, context);
  const collection = context.collection;

  assert.equal(collection.cards.length, 132);
  assert.deepEqual(CollectionModel.summarize(collection.cards), { total: 456, unique: 132 });
  assert.equal(collection.cards.filter((card) => card.image).length, 125);
  assert.equal(collection.review.length, 4);
  assert.equal(new Set(collection.cards.map((card) => card.code)).size, 132);
});
