/**
 * ShareIt — Frontend app logic.
 */

(function () {
  'use strict';

  // State
  let currentType = 'text';
  let selectedFile = null;
  let expiresIn = 86400;

  // DOM
  const tabs = document.querySelectorAll('.tab');
  const inputGroups = document.querySelectorAll('.input-group');
  const textContent = document.getElementById('text-content');
  const urlContent = document.getElementById('url-content');
  const fileDrop = document.getElementById('file-drop');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const fileRemove = document.getElementById('file-remove');
  const expiryBtns = document.querySelectorAll('.expiry-btn');
  const submitBtn = document.getElementById('submit-btn');
  const result = document.getElementById('result');
  const resultUrl = document.getElementById('result-url');
  const resultExpires = document.getElementById('result-expires');
  const copyBtn = document.getElementById('copy-btn');
  const shareAnother = document.getElementById('share-another');
  const qrCanvas = document.getElementById('qr-canvas');
  const errorEl = document.getElementById('error');

  // Tabs
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentType = tab.dataset.type;
      showInputGroup(currentType);
    });
  });

  function showInputGroup(type) {
    inputGroups.forEach(function (g) {
      g.classList.remove('visible');
    });
    document.getElementById('input-' + type).classList.add('visible');
  }

  // Expiry
  expiryBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      expiryBtns.forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      expiresIn = parseInt(btn.dataset.seconds, 10);
    });
  });

  // File handling
  fileDrop.addEventListener('click', function () {
    fileInput.click();
  });

  fileDrop.addEventListener('dragover', function (e) {
    e.preventDefault();
    fileDrop.classList.add('dragover');
  });

  fileDrop.addEventListener('dragleave', function () {
    fileDrop.classList.remove('dragover');
  });

  fileDrop.addEventListener('drop', function (e) {
    e.preventDefault();
    fileDrop.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  fileRemove.addEventListener('click', function () {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.hidden = true;
    fileDrop.hidden = false;
  });

  function handleFile(file) {
    if (file.size > 4 * 1024 * 1024) {
      showError('File too large. Max 4MB.');
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatSize(file.size);
    fileInfo.hidden = false;
    fileDrop.hidden = true;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Submit
  submitBtn.addEventListener('click', function () {
    hideError();
    if (currentType === 'text') shareText();
    else if (currentType === 'url') shareUrl();
    else if (currentType === 'file') shareFile();
  });

  function shareText() {
    var text = textContent.value.trim();
    if (!text) { showError('Enter some text.'); return; }
    createShare('text', text);
  }

  function shareUrl() {
    var url = urlContent.value.trim();
    if (!url) { showError('Enter a URL.'); return; }
    try { new URL(url); } catch { showError('Invalid URL.'); return; }
    createShare('url', url);
  }

  function shareFile() {
    if (!selectedFile) { showError('Select a file.'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Reading file...';
    var reader = new FileReader();
    reader.onload = function () {
      var base64 = reader.result.split(',')[1];
      createShare('file', base64, selectedFile.type, selectedFile.name);
    };
    reader.onerror = function () {
      showError('Could not read file.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share';
    };
    reader.readAsDataURL(selectedFile);
  }

  async function createShare(type, content, mimeType, originalName) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Encrypting...';

    var body = { type: type, content: content, expiresIn: expiresIn };
    if (mimeType) body.mimeType = mimeType;
    if (originalName) body.originalName = originalName;

    try {
      var res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      var data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Something went wrong.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Share';
        return;
      }

      showResult(data.url, data.expiresAt);
    } catch (err) {
      showError('Network error. Try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share';
    }
  }

  function showResult(url, expiresAt) {
    resultUrl.value = url;

    var d = new Date(expiresAt);
    resultExpires.textContent = 'Expires ' + d.toLocaleString();

    // QR code
    try {
      new QRious({
        element: qrCanvas,
        value: url,
        size: 180,
        background: '#0a0a0a',
        foreground: '#e5e5e5',
        level: 'M',
      });
    } catch (e) {
      qrCanvas.hidden = true;
    }

    result.hidden = false;
    submitBtn.hidden = true;
  }

  // Copy
  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(resultUrl.value).then(function () {
      var orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied';
      setTimeout(function () { copyBtn.textContent = orig; }, 1500);
    });
  });

  // Share another
  shareAnother.addEventListener('click', function () {
    result.hidden = true;
    submitBtn.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Share';
    textContent.value = '';
    urlContent.value = '';
    selectedFile = null;
    fileInput.value = '';
    fileInfo.hidden = true;
    fileDrop.hidden = false;
    hideError();
  });

  // Error
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
  }
})();
