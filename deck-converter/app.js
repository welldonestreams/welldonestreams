const SAMPLE_CODE = '2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccds0';

const input = document.querySelector('#deck-input');
const output = document.querySelector('#deck-output');
const result = document.querySelector('#result');
const error = document.querySelector('#error');
const convertButton = document.querySelector('#convert-button');
const pasteButton = document.querySelector('#paste-button');
const copyButton = document.querySelector('#copy-button');
const copyLabel = document.querySelector('#copy-label');
const tcgplayerButton = document.querySelector('#tcgplayer-button');
const tcgplayerLabel = document.querySelector('#tcgplayer-label');
const tcgplayerWarning = document.querySelector('#tcgplayer-warning');
const tcgplayerOutput = document.querySelector('#tcgplayer-output');
const tcgplayerPreview = document.querySelector('#tcgplayer-preview');
let massEntry = null;
const sampleButton = document.querySelector('#sample-button');
const toast = document.querySelector('#toast');
const leaderCount = document.querySelector('#leader-count');
const deckCount = document.querySelector('#deck-count');
const entryCount = document.querySelector('#entry-count');
const deckStatus = document.querySelector('#deck-status');

function showError(message) {
  massEntry = null;
  error.textContent = message;
  error.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  result.hidden = true;
}

function clearError() {
  error.hidden = true;
  error.textContent = '';
  input.removeAttribute('aria-invalid');
}

function convert() {
  clearError();
  try {
    const converted = OPlayConverter.convertDeckInput(input.value);
    massEntry = OPlayConverter.toTcgplayerMassEntry(converted.decoded, OPlayCardNames);
    tcgplayerOutput.value = massEntry.text;
    tcgplayerPreview.open = false;
    tcgplayerWarning.hidden = massEntry.unresolved.length === 0;
    tcgplayerWarning.textContent = massEntry.unresolved.length
      ? `No card name found for ${massEntry.unresolved.join(', ')}. Those lines use IDs only; check them on TCGplayer before buying.`
      : '';
    tcgplayerLabel.textContent = 'Copy for TCGplayer Mass Entry';
    output.value = converted.text;
    leaderCount.textContent = converted.leaderCount;
    deckCount.textContent = converted.deckCount;
    entryCount.textContent = converted.text.split('\n').length;
    deckStatus.textContent = converted.isStandardSize ? '51 cards · ready' : `${converted.totalCount} cards`;
    deckStatus.classList.toggle('warning', !converted.isStandardSize);
    result.hidden = false;
    copyLabel.textContent = 'Copy for OPTCGSim';
    output.style.height = 'auto';
    output.style.height = `${Math.min(Math.max(output.scrollHeight, 280), 560)}px`;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (reason) {
    showError(reason instanceof Error ? reason.message : 'That deck could not be converted.');
  }
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.append(temporary);
    temporary.select();
    const copied = document.execCommand('copy');
    temporary.remove();
    if (!copied) throw new Error('Clipboard access was blocked.');
  }
}

function showCopied(label, message, original) {
  label.textContent = 'Copied';
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
    label.textContent = original;
  }, 1800);
}

async function copyResult() {
  if (!output.value || result.hidden) return;
  try {
    await writeClipboard(output.value);
    showCopied(copyLabel, 'Deck copied for OPTCGSim', 'Copy for OPTCGSim');
  } catch (reason) {
    toast.textContent = reason.message;
    toast.hidden = false;
  }
}

async function copyTcgplayer() {
  if (!massEntry || result.hidden) return;
  try {
    await writeClipboard(massEntry.text);
    showCopied(tcgplayerLabel, 'Deck copied for TCGplayer Mass Entry', 'Copy for TCGplayer Mass Entry');
  } catch (reason) {
    toast.textContent = reason.message;
    toast.hidden = false;
  }
}

convertButton.addEventListener('click', convert);
copyButton.addEventListener('click', copyResult);
tcgplayerButton.addEventListener('click', copyTcgplayer);
sampleButton.addEventListener('click', () => {
  input.value = SAMPLE_CODE;
  convert();
});
pasteButton.addEventListener('click', async () => {
  try {
    input.value = await navigator.clipboard.readText();
    convert();
  } catch (_) {
    input.focus();
    showError('Clipboard access was blocked. Press and hold in the box to paste.');
  }
});
input.addEventListener('input', () => {
  clearError();
  massEntry = null;
  result.hidden = true;
});
input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') convert();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
