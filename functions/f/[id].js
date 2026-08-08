/**
 * GET /f/[id] — Retrieve and serve a shared file.
 */

import { decrypt } from '../_shared/crypto.js';
import { getShare, json } from '../_shared/utils.js';
import { page } from '../_shared/html.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const id = params.id;

  if (!id || !/^[a-zA-Z0-9]{8}$/.test(id)) {
    return json({ error: 'Not found' }, 404);
  }

  const share = await getShare(env.DB, id);

  if (!share || share.type !== 'file') {
    return new Response(page('Expired', `
      <div class="expired">
        <h1>This link has expired</h1>
        <p style="color:#737373;margin-top:.5rem">The shared file is no longer available.</p>
      </div>
    `), { status: 410, headers: { 'Content-Type': 'text/html' } });
  }

  const content = await decrypt(share.content_enc, share.iv, env);
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const mime = share.mime_type || 'application/octet-stream';
  const filename = share.original_name || 'file';

  return new Response(bytes, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
