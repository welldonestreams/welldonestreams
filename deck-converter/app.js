const SAMPLE_CODE = '2gRCccAQGeAcGKAiFHCphbwu4YcMeGVDShtw34ccds0';

const input = document.querySelector('#deck-input');
const output = document.querySelector('#deck-output');
const result = document.querySelector('#result');
const error = document.querySelector('#error');
const convertButton = document.querySelector('#convert-button');
const pasteButton = document.querySelector('#paste-button');
const copyButton = document.querySelector('#copy-button');
const copyLabel = document.querySelector('#copy-label');
const sampleButton = document.querySelector('#sample-button');
const toast = document.querySelector('#toast');
const leaderCount = document.querySelector('#leader-count');
const deckCount = document.querySelector('#deck-count');
const entryCount = document.querySelector('#entry-count');
const deckStatus = document.querySelector('#deck-status');

function showError(message) {
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

async function copyResult() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
  } catch (_) {
    output.focus();
    output.select();
    document.execCommand('copy');
  }
  copyLabel.textContent = 'Copied';
  toast.textContent = 'Deck copied for OPTCGSim';
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
    copyLabel.textContent = 'Copy for OPTCGSim';
  }, 1800);
}

convertButton.addEventListener('click', convert);
copyButton.addEventListener('click', copyResult);
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
input.addEventListener('input', clearError);
input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') convert();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
