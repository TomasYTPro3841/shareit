/**
 * GET /t/[id] — Retrieve and display shared text.
 */

import { decrypt } from '../_shared/crypto.js';
import { getShare, json } from '../_shared/utils.js';
import { page } from '../_shared/html.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;

  if (!id || !/^[a-zA-Z0-9]{8}$/.test(id)) {
    return json({ error: 'Not found' }, 404);
  }

  const share = await getShare(env.DB, id);

  if (!share || share.type !== 'text') {
    return new Response(page('Expired', `
      <div class="expired">
        <h1>This link has expired</h1>
        <p style="color:#737373;margin-top:.5rem">The shared text is no longer available.</p>
      </div>
    `), { status: 410, headers: { 'Content-Type': 'text/html' } });
  }

  const text = await decrypt(share.content_enc, share.iv, env);

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const expires = new Date(share.expires_at).toISOString();

  return new Response(page('Text', `
    <h1>Shared Text</h1>
    <pre id="text-content">${escaped}</pre>
    <button class="copy-btn" onclick="copyText(document.getElementById('text-content').textContent, this)">Copy</button>
    <p class="meta">Expires: ${expires}</p>
  `), { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
}
