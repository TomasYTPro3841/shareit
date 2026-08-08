/**
 * Shared HTML template for retrieval pages.
 * Minimal dark theme matching the main app.
 */

export function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShareIt — ${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
    .card{max-width:640px;width:100%;background:#141414;border:1px solid #262626;border-radius:12px;padding:2rem}
    h1{font-size:1.25rem;font-weight:600;margin-bottom:1rem;color:#fafafa}
    pre{background:#0a0a0a;border:1px solid #262626;border-radius:8px;padding:1rem;overflow-x:auto;font-size:0.875rem;line-height:1.6;white-space:pre-wrap;word-break:break-all}
    a{color:#22d3ee;text-decoration:none}
    a:hover{text-decoration:underline}
    .btn{display:inline-block;margin-top:1rem;padding:0.6rem 1.5rem;background:#22d3ee;color:#0a0a0a;border:none;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s}
    .btn:hover{opacity:.85;text-decoration:none}
    .copy-btn{margin-top:.75rem;padding:.4rem 1rem;background:#262626;color:#e5e5e5;border:1px solid #333;border-radius:6px;font-size:.8rem;cursor:pointer;transition:background .15s}
    .copy-btn:hover{background:#333}
    .meta{margin-top:1rem;font-size:.75rem;color:#737373}
    .expired{text-align:center;padding:3rem 1rem}
    .expired h1{color:#ef4444}
  </style>
</head>
<body>
  <div class="card">${body}</div>
  <script>
    function copyText(text,btn){navigator.clipboard.writeText(text).then(()=>{const o=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=o,1500)})}
  </script>
</body>
</html>`;
}
