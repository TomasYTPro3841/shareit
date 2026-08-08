/**
 * POST /api/create
 * Body: { type: 'file'|'text'|'url', content: string, mimeType?: string, originalName?: string, expiresIn: number (seconds) }
 * Returns: { id, url, expiresAt }
 */

import { encrypt } from '../_shared/crypto.js';
import { generateId, json, corsHeaders } from '../_shared/utils.js';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const EXPIRY_OPTIONS = [3600, 21600, 86400, 259200, 604800]; // 1h, 6h, 1d, 3d, 7d

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { type, content, mimeType, originalName, expiresIn } = body;

  // Validate type
  if (!['file', 'text', 'url'].includes(type)) {
    return json({ error: 'Type must be file, text, or url' }, 400);
  }

  // Validate content
  if (!content || typeof content !== 'string' || content.length === 0) {
    return json({ error: 'Content is required' }, 400);
  }

  // Validate expiry
  if (!expiresIn || typeof expiresIn !== 'number' || !EXPIRY_OPTIONS.includes(expiresIn)) {
    return json({ error: 'Invalid expiry duration' }, 400);
  }

  // Size limits per type
  if (type === 'file' && content.length > MAX_FILE_SIZE) {
    return json({ error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }, 413);
  }
  if (type === 'text' && content.length > 512 * 1024) {
    return json({ error: 'Text too long. Max 512KB' }, 413);
  }
  if (type === 'url') {
    try {
      new URL(content);
    } catch {
      return json({ error: 'Invalid URL' }, 400);
    }
  }

  // Generate unique ID
  let id;
  let attempts = 0;
  while (attempts < 5) {
    id = generateId(8);
    const existing = await db.prepare('SELECT id FROM shares WHERE id = ?').bind(id).first();
    if (!existing) break;
    attempts++;
  }
  if (attempts >= 5) {
    return json({ error: 'Could not generate unique ID' }, 500);
  }

  // Encrypt content
  const encrypted = await encrypt(content, env);

  // Store in D1
  const now = Date.now();
  const expiresAt = now + expiresIn * 1000;

  await db.prepare(
    'INSERT INTO shares (id, type, content_enc, iv, mime_type, original_name, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, type, encrypted.content, encrypted.iv,
    mimeType || null, originalName || null, now, expiresAt
  ).run();

  // Build URL
  const prefix = type === 'file' ? 'f' : type === 'text' ? 't' : 'u';
  const origin = new URL(request.url).origin;
  const url = `${origin}/${prefix}/${id}`;

  return json({ id, url, expiresAt });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
