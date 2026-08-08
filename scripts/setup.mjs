/**
 * ShareIt setup script.
 * Generates AES-256 encryption key and patches wrangler.toml.
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const tomlPath = resolve(root, 'wrangler.toml');

// Generate 256-bit key and base64 encode
const key = randomBytes(32).toString('base64');

// Read wrangler.toml and replace the placeholder
let toml = readFileSync(tomlPath, 'utf8');

if (!toml.includes('TODO_REPLACE_WITH_BASE64_KEY')) {
  console.log('Encryption key already set in wrangler.toml. Skipping.');
  console.log('If you want to regenerate, reset the value to TODO_REPLACE_WITH_BASE64_KEY first.');
  process.exit(0);
}

toml = toml.replace('TODO_REPLACE_WITH_BASE64_KEY_RUN_npm_run_genkey', key);
toml = toml.replace('TODO_REPLACE_WITH_BASE64_KEY', key);

writeFileSync(tomlPath, toml);

console.log('');
console.log('Encryption key generated and written to wrangler.toml.');
console.log('');
console.log('For Cloudflare Pages production, set this secret:');
console.log('');
console.log('  npx wrangler pages secret put ENCRYPTION_KEY');
console.log('');
console.log('When prompted, paste this key:');
console.log('');
console.log('  ' + key);
console.log('');
