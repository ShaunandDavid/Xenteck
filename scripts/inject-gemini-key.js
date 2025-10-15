#!/usr/bin/env node
/**
 * Injects environment values into index.html at build time.
 * Usage:
 *    GEMINI_API_KEY=xxx node scripts/inject-gemini-key.js
 *
 * The script is idempotent—running it repeatedly will keep replacing the
 * placeholder values so you can run it locally or in CI.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Cannot locate index.html. Did the project structure change?');
  process.exit(1);
}

const escapeForJsString = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'');

const geminiKey = escapeForJsString(process.env.GEMINI_API_KEY || '');
const growthApiUrl = escapeForJsString(process.env.GROWTH_API_URL || '');

const original = fs.readFileSync(indexPath, 'utf8');

let updated = original.replace(
  /window\.ENV\.GEMINI_API_KEY = window\.ENV\.GEMINI_API_KEY \|\| '[^']*';/,
  `window.ENV.GEMINI_API_KEY = window.ENV.GEMINI_API_KEY || '${geminiKey}';`
);

updated = updated.replace(
  /window\.ENV\.GROWTH_API_URL = window\.ENV\.GROWTH_API_URL \|\| '[^']*';/,
  `window.ENV.GROWTH_API_URL = window.ENV.GROWTH_API_URL || '${growthApiUrl}';`
);

if (updated !== original) {
  fs.writeFileSync(indexPath, updated);
  console.log('Injected environment values into index.html');
} else {
  console.log('No replacements made. The script may have already run.');
}
