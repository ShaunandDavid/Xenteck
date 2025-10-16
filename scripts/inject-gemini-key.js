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

const resolveTargets = () => {
  const raw =
    process.env.TARGET_INDEX_PATHS ||
    process.env.TARGET_INDEX_PATH ||
    'index.html';

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      path.isAbsolute(entry) ? entry : path.join(projectRoot, entry)
    );
};

const targets = resolveTargets();

if (!targets.length) {
  console.error('No target index paths provided for environment injection.');
  process.exit(1);
}

const escapeForJsString = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'');

const geminiKey = escapeForJsString(process.env.GEMINI_API_KEY || '');
const growthApiUrl = escapeForJsString(process.env.GROWTH_API_URL || '');

const applyInjection = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    console.warn(`[inject-env] Skipping missing file: ${targetPath}`);
    return;
  }

  const original = fs.readFileSync(targetPath, 'utf8');

  let updated = original.replace(
    /window\.ENV\.GEMINI_API_KEY = window\.ENV\.GEMINI_API_KEY \|\| '[^']*';/,
    `window.ENV.GEMINI_API_KEY = window.ENV.GEMINI_API_KEY || '${geminiKey}';`
  );

  updated = updated.replace(
    /window\.ENV\.GROWTH_API_URL = window\.ENV\.GROWTH_API_URL \|\| '[^']*';/,
    `window.ENV.GROWTH_API_URL = window.ENV.GROWTH_API_URL || '${growthApiUrl}';`
  );

  if (updated !== original) {
    fs.writeFileSync(targetPath, updated);
    console.log(`[inject-env] Injected environment values into ${targetPath}`);
  } else {
    console.log(`[inject-env] No replacements made for ${targetPath}`);
  }
};

targets.forEach(applyInjection);
