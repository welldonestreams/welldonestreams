const IMPORT_STORAGE_KEY = 'one-piece-collection-imports-v1';

const collectionView = document.querySelector('#collection-view');
const collectionGroups = document.querySelector('#collection-groups');
const collectionSearch = document.querySelector('#collection-search');
const setFilter = document.querySelector('#set-filter');
const colorFilters = document.querySelector('#color-filters');
const collectionTotal = document.querySelector('#collection-total');
const collectionUnique = document.querySelector('#collection-unique');
const resultsLine = document.querySelector('#results-line');
const reviewList = document.querySelector('#review-list');
const reviewPanel = document.querySelector('#review-panel');
const importDialog = document.querySelector('#import-dialog');
const importForm = document.querySelector('#import-form');
const importInput = document.querySelector('#import-input');
const importError = document.querySelector('#import-error');
const importHistory = document.querySelector('#import-history');
const cardDialog = document.querySelector('#card-dialog');

let selectedColor = 'All';
let importBatches = loadImportBatches();
let displayedCards = [];

function escapeSelectorValue(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, '\\$&');
}

function showCollectionToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showCollectionToast.timeout);
  showCollectionToast.timeout = window.setTimeout(() => { toast.hidden = true; }, 2200);
}

function setView(view, updateHash = true) {
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('.shell').classList.toggle('collection-active', view === 'collection');
  if (updateHash && window.location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
}

function loadImportBatches() {
  try {
    const parsed = JSON.parse(localStorage.getItem(IMPORT_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((batch) => batch && Array.isArray(batch.entries))
      .map((batch) => ({
        ...batch,
        entries: batch.entries.filter((entry) => entry
          && CollectionModel.normalizeCode(entry.code)
          && Number.isFinite(Number(entry.quantity))
          && Number(entry.quantity) > 0),
      }))
      .filter((batch) => batch.entries.length);
  } catch (_) {
    return [];
  }
}

function saveImportBatches() {
  localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(importBatches));
}

function importFingerprint(entries) {
  return entries
    .map((entry) => `${entry.code}:${entry.quantity}`)
    .sort()
    .join('|');
}

function importedEntries() {
  const totals = new Map();
  importBatches.forEach((batch) => {
    batch.entries.forEach((entry) => {
      totals.set(entry.code, (totals.get(entry.code) || 0) + entry.quantity);
    });
  });
  return [...totals].map(([code, quantity]) => ({ code, quantity }));
}

function allCards() {
  return CollectionModel.mergeCards(OnePieceCollection.cards, importedEntries(), OPlayCardNames);
}

function setOptions(cards) {
  const existing = new Set([...setFilter.options].map((option) => option.value));
  const sets = new Map();
  cards.forEach((card) => {
    if (!sets.has(card.setCode)) sets.set(card.setCode, card.setName || card.setCode);
  });
  [...sets].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).forEach(([code, name]) => {
    if (existing.has(code)) return;
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} · ${name}`;
    setFilter.append(option);
  });
}

function renderColorFilters(cards) {
  const colors = ['All', ...new Set(cards.flatMap((card) => String(card.color || 'Unknown').split(/\s*\/\s*/)))];
  const order = ['All', 'Red', 'Blue', 'Green', 'Purple', 'Black', 'Yellow', 'DON!!', 'Unknown'];
  colors.sort((a, b) => {
    const aIndex = order.indexOf(a) < 0 ? order.length : order.indexOf(a);
    const bIndex = order.indexOf(b) < 0 ? order.length : order.indexOf(b);
    return aIndex - bIndex;
  });
  colorFilters.replaceChildren();
  colors.forEach((color) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-chip';
    button.dataset.color = color;
    button.setAttribute('aria-pressed', String(color === selectedColor));
    const dot = document.createElement('span');
    dot.className = `color-dot color-${color.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    dot.setAttribute('aria-hidden', 'true');
    button.append(dot, document.createTextNode(color));
    button.addEventListener('click', () => {
      selectedColor = color;
      renderCollection();
    });
    colorFilters.append(button);
  });
}

function makeCard(card) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'collection-card';
  button.dataset.code = card.code;
  button.setAttribute('aria-label', `${card.name}, ${card.code}, ${card.quantity} owned`);

  const art = document.createElement('span');
  art.className = 'card-art';
  if (card.image) {
    const image = document.createElement('img');
    image.src = card.image;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => art.classList.add('image-failed'), { once: true });
    art.append(image);
  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'don-placeholder';
    placeholder.innerHTML = '<strong>DON!!</strong><span>＋1000</span>';
    art.append(placeholder);
  }

  const quantity = document.createElement('strong');
  quantity.className = 'quantity-badge';
  quantity.textContent = `×${card.quantity}`;
  art.append(quantity);

  const info = document.createElement('span');
  info.className = 'collection-card-info';
  const name = document.createElement('strong');
  name.textContent = card.name;
  const metadata = document.createElement('span');
  metadata.textContent = `${card.code} · ${card.color}`;
  info.append(name, metadata);
  button.append(art, info);
  button.addEventListener('click', () => openCardDetails(card));
  return button;
}

function groupCards(cards) {
  const sets = new Map();
  cards.forEach((card) => {
    const key = card.setCode || 'Unknown';
    if (!sets.has(key)) sets.set(key, { code: key, name: card.setName || key, cards: [] });
    sets.get(key).cards.push(card);
  });
  return [...sets.values()].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

function renderGroups(cards) {
  collectionGroups.replaceChildren();
  if (!cards.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<strong>No cards match</strong><span>Clear a filter or try another name.</span>';
    collectionGroups.append(empty);
    return;
  }

  const colorOrder = ['Red', 'Blue', 'Green', 'Purple', 'Black', 'Yellow', 'DON!!', 'Unknown'];
  groupCards(cards).forEach((set) => {
    const section = document.createElement('section');
    section.className = 'set-group';
    const heading = document.createElement('div');
    heading.className = 'set-heading';
    const titleWrap = document.createElement('div');
    const code = document.createElement('span');
    code.textContent = set.code;
    const title = document.createElement('h3');
    title.textContent = set.name;
    titleWrap.append(code, title);
    const count = document.createElement('strong');
    count.textContent = `${set.cards.reduce((sum, card) => sum + card.quantity, 0)} cards`;
    heading.append(titleWrap, count);
    section.append(heading);

    const byColor = new Map();
    set.cards.forEach((card) => {
      const color = card.color || 'Unknown';
      if (!byColor.has(color)) byColor.set(color, []);
      byColor.get(color).push(card);
    });
    [...byColor].sort(([a], [b]) => colorOrder.indexOf(a) - colorOrder.indexOf(b)).forEach(([color, colorCards]) => {
      const band = document.createElement('div');
      band.className = 'color-band';
      const bandTitle = document.createElement('h4');
      const dot = document.createElement('span');
      dot.className = `color-dot color-${color.toLowerCase().replace(/[^a-z]+/g, '-')}`;
      bandTitle.append(dot, document.createTextNode(color));
      const grid = document.createElement('div');
      grid.className = 'collection-grid';
      colorCards.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })).forEach((card) => grid.append(makeCard(card)));
      band.append(bandTitle, grid);
      section.append(band);
    });
    collectionGroups.append(section);
  });
}

function renderCollection() {
  const cards = allCards();
  setOptions(cards);
  renderColorFilters(cards);
  const filters = {
    query: collectionSearch.value,
    set: setFilter.value,
    color: selectedColor,
  };
  displayedCards = CollectionModel.filterCards(cards, filters);
  const totals = CollectionModel.summarize(cards);
  const visible = CollectionModel.summarize(displayedCards);
  collectionTotal.textContent = totals.total;
  document.querySelector('#collection-tab-total').textContent = totals.total;
  collectionUnique.textContent = totals.unique;
  resultsLine.textContent = `${visible.unique} entries · ${visible.total} cards shown`;
  renderGroups(displayedCards);
}

function renderReview() {
  reviewList.replaceChildren();
  OnePieceCollection.review.forEach((item) => {
    const article = document.createElement('article');
    const heading = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const badge = document.createElement('span');
    badge.textContent = item.quantity ? `×${item.quantity}` : 'count unknown';
    heading.append(title, badge);
    const set = document.createElement('p');
    set.textContent = item.setName;
    const note = document.createElement('p');
    note.textContent = item.note;
    article.append(heading, set, note);
    reviewList.append(article);
  });
}

function openCardDetails(card) {
  document.querySelector('#card-dialog-code').textContent = `${card.code} · ${card.setCode}`;
  document.querySelector('#card-dialog-title').textContent = card.name;
  const body = document.querySelector('#card-dialog-body');
  body.replaceChildren();

  const layout = document.createElement('div');
  layout.className = 'card-detail-layout';
  if (card.image) {
    const image = document.createElement('img');
    image.src = card.image;
    image.alt = card.name;
    layout.append(image);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'don-placeholder detail-don';
    placeholder.innerHTML = '<strong>DON!!</strong><span>＋1000</span>';
    layout.append(placeholder);
  }

  const details = document.createElement('div');
  const quantity = document.createElement('p');
  quantity.className = 'detail-quantity';
  quantity.innerHTML = `<strong>${card.quantity}</strong><span>owned</span>`;
  const metadata = document.createElement('dl');
  [['Set', `${card.setCode} · ${card.setName}`], ['Color', card.color], ['Type', card.type], ['Rarity', card.rarity || '—']].forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    metadata.append(dt, dd);
  });
  details.append(quantity, metadata);
  layout.append(details);
  body.append(layout);

  if (card.sources && card.sources.length) {
    const sourceTitle = document.createElement('h3');
    sourceTitle.textContent = 'Imported provenance';
    const list = document.createElement('ul');
    list.className = 'source-list';
    card.sources.forEach((source) => {
      const item = document.createElement('li');
      const sourceName = document.createElement('strong');
      sourceName.textContent = `×${source.quantity} · ${source.setName}`;
      const sourceText = document.createElement('span');
      sourceText.textContent = source.title;
      item.append(sourceName, sourceText);
      list.append(item);
    });
    body.append(sourceTitle, list);
  }

  if (typeof cardDialog.showModal === 'function') cardDialog.showModal();
  else cardDialog.setAttribute('open', '');
}

function renderImportHistory() {
  importHistory.replaceChildren();
  if (!importBatches.length) {
    importHistory.textContent = 'No local scan batches yet.';
    return;
  }
  [...importBatches].reverse().forEach((batch) => {
    const row = document.createElement('div');
    const when = document.createElement('span');
    when.textContent = new Date(batch.createdAt).toLocaleString();
    const count = document.createElement('strong');
    count.textContent = `${batch.entries.reduce((sum, entry) => sum + entry.quantity, 0)} cards`;
    row.append(when, count);
    importHistory.append(row);
  });
}

function openImportDialog() {
  importError.hidden = true;
  importError.textContent = '';
  importInput.value = '';
  renderImportHistory();
  if (typeof importDialog.showModal === 'function') importDialog.showModal();
  else importDialog.setAttribute('open', '');
  window.setTimeout(() => importInput.focus(), 50);
}

function saveImport(event) {
  event.preventDefault();
  const parsed = CollectionModel.parseImport(importInput.value);
  if (!parsed.entries.length || parsed.errors.length) {
    const badLines = parsed.errors.map((error) => error.line).join(', ');
    importError.textContent = parsed.entries.length
      ? `Fix unrecognized line${parsed.errors.length === 1 ? '' : 's'} ${badLines} before importing.`
      : 'Add at least one card ID.';
    importError.hidden = false;
    return;
  }

  const id = importFingerprint(parsed.entries);
  if (importBatches.some((batch) => batch.id === id)) {
    importDialog.close();
    showCollectionToast('That scan batch was already imported');
    return;
  }

  importBatches.push({ id, createdAt: new Date().toISOString(), entries: parsed.entries });
  saveImportBatches();
  importDialog.close();
  renderCollection();
  showCollectionToast(`${parsed.entries.reduce((sum, entry) => sum + entry.quantity, 0)} cards added`);
}

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});
window.addEventListener('hashchange', () => setView(window.location.hash === '#converter' ? 'converter' : 'collection', false));
collectionSearch.addEventListener('input', renderCollection);
setFilter.addEventListener('change', renderCollection);
document.querySelector('#review-jump').addEventListener('click', () => reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
document.querySelector('#import-open').addEventListener('click', openImportDialog);
document.querySelector('#import-close').addEventListener('click', () => importDialog.close());
importForm.addEventListener('submit', saveImport);
document.querySelector('#import-paste').addEventListener('click', async () => {
  try {
    importInput.value = await navigator.clipboard.readText();
  } catch (_) {
    importInput.focus();
    importError.textContent = 'Clipboard access was blocked. Press and hold in the box to paste.';
    importError.hidden = false;
  }
});
document.querySelector('#import-clear').addEventListener('click', () => {
  if (!importBatches.length || !window.confirm('Clear every local scan import from this device?')) return;
  importBatches = [];
  saveImportBatches();
  renderImportHistory();
  renderCollection();
  showCollectionToast('Local scan imports cleared');
});
document.querySelector('#card-dialog-close').addEventListener('click', () => cardDialog.close());

renderReview();
renderCollection();
setView(window.location.hash === '#converter' ? 'converter' : 'collection', false);
