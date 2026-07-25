#!/usr/bin/env node
// Static invariant checks for index.html. These exist because a landing-page
// cleanup pass (commit 35478c6) silently dropped three cosmetic safeguards
// during minification; this script catches the same regressions returning.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const indexPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const html = readFileSync(indexPath, 'utf8');
const errors = [];

function requireOnError(label, srcMatch) {
  const tagMatch = html.match(new RegExp(`<img[^>]*src="${srcMatch}"[^>]*>`));
  if (!tagMatch) {
    errors.push(`${label}: <img> tag not found (did the src path change?)`);
    return;
  }
  if (!/onerror=/.test(tagMatch[0])) {
    errors.push(`${label}: missing onerror fallback — a 404'd image will show a broken-image icon instead of hiding.`);
  }
}

requireOnError('Google Play badge', 'GetItOnGooglePlay_Badge_Web_color_English\\.svg');
requireOnError('App Store badge', 'Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917\\.svg');

for (const name of ['MOCK_RECENT', 'MOCK_POLL']) {
  const declMatch = html.match(new RegExp(`const ${name} = ([\\s\\S]+?);\\r?\\n`));
  if (!declMatch) {
    errors.push(`${name}: declaration not found.`);
    continue;
  }
  const posterFields = [...declMatch[1].matchAll(/poster:\s*'([^']*)'/g)].map(m => m[1]);
  if (posterFields.length === 0) {
    errors.push(`${name}: no poster fields found — check the array shape didn't change.`);
  }
  const empty = posterFields.filter(p => !p.trim()).length;
  if (empty > 0) {
    errors.push(`${name}: ${empty} of ${posterFields.length} poster URLs are empty — preview mode will show placeholder icons instead of real posters.`);
  }
}

if (!/requestAnimationFrame\(\s*\(\)\s*=>\s*requestAnimationFrame\(/.test(html)) {
  errors.push('poll-bar animation: expected a nested double requestAnimationFrame before setting .poll-bar height (single rAF risks the fill transition snapping instantly instead of animating).');
}

if (errors.length) {
  console.error('Landing-page invariant checks failed:\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nSee AGENTS.md and WORKLOG.md for why these checks exist.');
  process.exit(1);
}

console.log('Landing-page invariant checks passed.');
