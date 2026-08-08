/**
 * GET /u/[id] — Retrieve and redirect to a shared URL.
 * Shows interstitial page to prevent open redirect attacks.
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

  if (!share || share.type !== 'url') {
    return new Response(page('Expired', `
      <div class="expired">
        <h1>This link has expired</h1>
        <p style="color:#737373;margin-top:.5rem">The shared URL is no longer available.</p>
      </div>
    `), { status: 410, headers: { 'Content-Type': 'text/html' } });
  }

  const url = await decrypt(share.content_enc, share.iv, env);

  // Validate URL format before displaying
  let displayUrl;
  try {
    displayUrl = new URL(url).href;
  } catch {
    return new Response(page('Error', `
      <div class="expired">
        <h1>Invalid URL</h1>
        <p style="color:#737373;margin-top:.5rem">The stored URL is malformed.</p>
      </div>
    `), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }

  const escaped = displayUrl
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');

  const expires = new Date(share.expires_at).toISOString();

  return new Response(page('URL', `
    <h1>Shared Link</h1>
    <pre style="word-break:break-all">${escaped}</pre>
    <a class="btn" href="${escaped}" rel="nofollow noopener noreferrer" target="_blank">Go to link</a>
    <button class="copy-btn" onclick="copyText('${escaped}', this)">Copy URL</button>
    <p class="meta">Expires: ${expires}</p>
  `), { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
}
