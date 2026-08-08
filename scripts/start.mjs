/**
 * ShareIt — One-command startup.
 * Generates encryption key, creates D1 database, inits schema, starts dev server.
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const tomlPath = resolve(root, 'wrangler.toml');

function log(tag, msg) {
  console.log(`  [\x1b[1m${tag}\x1b[0m] ${msg}`);
}

function run(cmd, opts) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

function runQuiet(cmd, opts) {
  try { return run(cmd, { stdio: ['pipe', 'pipe', 'pipe'], ...opts }); } catch { return null; }
}

// ─── Step 1: Encryption key ────────────────────────────────────────

log('key', 'Checking encryption key...');

let toml = readFileSync(tomlPath, 'utf8');
let generatedKey = null;

if (toml.includes('TODO_REPLACE_WITH_BASE64_KEY')) {
  generatedKey = randomBytes(32).toString('base64');
  toml = toml.replace('TODO_REPLACE_WITH_BASE64_KEY_RUN_npm_run_genkey', generatedKey);
  toml = toml.replace('TODO_REPLACE_WITH_BASE64_KEY', generatedKey);
  writeFileSync(tomlPath, toml);
  log('key', 'Generated AES-256 key and wrote to wrangler.toml');
} else {
  log('key', 'Key already set in wrangler.toml');
}

// ─── Step 2: D1 database ───────────────────────────────────────────

toml = readFileSync(tomlPath, 'utf8');
const dbIdPlaceholder = 'TODO_REPLACE_WITH_YOUR_D1_DATABASE_ID';

if (toml.includes(dbIdPlaceholder)) {
  log('d1', 'Creating D1 database...');

  try {
    const output = run('npx wrangler d1 create shareit-db', { cwd: root });
    const match = output.match(/database_id\s*=\s*"([a-f0-9-]+)"/);
    if (match) {
      toml = toml.replace(dbIdPlaceholder, match[1]);
      writeFileSync(tomlPath, toml);
      log('d1', `Created database: ${match[1]}`);
    } else {
      console.error('\n  Could not parse database_id from wrangler output.');
      console.error('  Create it manually: npx wrangler d1 create shareit-db');
      console.error('  Then paste the database_id in wrangler.toml\n');
      process.exit(1);
    }
  } catch (err) {
    const stderr = err.stderr || '';
    if (stderr.includes('already exists')) {
      log('d1', 'Database already exists. Look up the ID in Cloudflare dashboard and paste it in wrangler.toml.');
      console.error('\n  Run: npx wrangler d1 list\n  Then replace TODO_REPLACE_WITH_YOUR_D1_DATABASE_ID in wrangler.toml\n');
      process.exit(1);
    }
    console.error('\n  Failed to create D1 database.');
    console.error('  Make sure you are logged in: npx wrangler login\n');
    console.error(err.message);
    process.exit(1);
  }
} else {
  log('d1', 'Database ID already configured');
}

// ─── Step 3: Init schema ───────────────────────────────────────────

log('schema', 'Initializing schema...');

try {
  run('npx wrangler d1 execute shareit-db --file=./schema.sql --local', { cwd: root });
  log('schema', 'Local schema ready');
} catch {
  log('schema', 'Schema init skipped (may already exist or D1 not yet bound)');
}

// Also try remote if not local-only
try {
  run('npx wrangler d1 execute shareit-db --file=./schema.sql --remote', { cwd: root, timeout: 15000 });
  log('schema', 'Remote schema ready');
} catch {
  log('schema', 'Remote schema skipped (login or create DB first)');
}

// ─── Step 4: Print key for production ──────────────────────────────

if (generatedKey) {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │  Save this key for Cloudflare Pages production:  │');
  console.log('  └─────────────────────────────────────────────────┘');
  console.log(`  ${generatedKey}`);
  console.log('');
  console.log('  Set it with: npx wrangler pages secret put ENCRYPTION_KEY');
  console.log('');
}

// ─── Step 5: Start dev server ──────────────────────────────────────

log('dev', 'Starting wrangler pages dev...');
console.log('');

const dev = spawn('npx', ['wrangler', 'pages', 'dev', 'public', '--d1=DB'], {
  cwd: root,
  stdio: 'inherit',
});

dev.on('error', (err) => {
  console.error('Failed to start dev server:', err.message);
  process.exit(1);
});

dev.on('exit', (code) => {
  process.exit(code || 0);
});
