/* ============================================================
   ADMIN VERIFICATION REVIEW
   Talks directly to the auth service's /admin/* endpoints.
   Auth is a single shared X-Admin-Key header - not a real login -
   see the note in auth/config.py. Kept in sessionStorage only
   (cleared when the tab closes), never localStorage.
   ============================================================ */

const AUTH_BASE =
  new URLSearchParams(location.search).get('auth') ||
  'https://ubuntu-skills-auth-9v0u.onrender.com';

const KEY_STORAGE_NAME = 'ubuntuskills_admin_key';

const el = (id) => document.getElementById(id);

function showError(message) {
  const banner = el('error-banner');
  banner.textContent = message;
  banner.style.display = 'block';
}
function clearError() {
  el('error-banner').style.display = 'none';
}

/* Small wrapper: always attaches the admin key header, always parses
   JSON, throws with the backend's own error message on failure. */
async function adminRequest(path, { method = 'GET', body, admin_key } = {}) {
  const key = admin_key ?? sessionStorage.getItem(KEY_STORAGE_NAME);
  let res;
  try {
    res = await fetch(AUTH_BASE + path, {
      method,
      headers: {
        'X-Admin-Key': key || '',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Could not reach the auth service at ${AUTH_BASE}. Is it running?`);
  }

  if (res.status === 401) {
    sessionStorage.removeItem(KEY_STORAGE_NAME);
    showKeyGate();
    throw new Error('Admin key was rejected. Enter it again.');
  }

  let data = null;
  try { data = await res.json(); } catch (_) { /* not JSON, e.g. file responses */ }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

function showKeyGate() {
  el('key-gate').style.display = 'block';
  el('admin-panel').style.display = 'none';
}
function showPanel() {
  el('key-gate').style.display = 'none';
  el('admin-panel').style.display = 'block';
}

/* ---------- Unlock flow ---------- */
el('unlock-btn').addEventListener('click', unlock);
el('admin-key-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') unlock();
});

async function unlock() {
  clearError();
  const key = el('admin-key-input').value.trim();
  if (!key) return showError('Enter an admin key first.');

  try {
    // Use this request itself to validate the key - a successful
    // pending-list fetch means it's good.
    await adminRequest('/admin/verifications/pending', { admin_key: key });
    sessionStorage.setItem(KEY_STORAGE_NAME, key);
    showPanel();
    loadPending();
  } catch (err) {
    showError(err.message);
  }
}

el('lock-btn').addEventListener('click', () => {
  sessionStorage.removeItem(KEY_STORAGE_NAME);
  el('admin-key-input').value = '';
  showKeyGate();
});
el('refresh-btn').addEventListener('click', loadPending);

/* ---------- Pending list ---------- */
async function loadPending() {
  clearError();
  el('count-label').textContent = 'Loading…';
  try {
    const data = await adminRequest('/admin/verifications/pending');
    renderList(data.pending_verifications, data.count);
  } catch (err) {
    showError(err.message);
    el('count-label').textContent = '';
  }
}

function renderList(users, count) {
  el('count-label').textContent =
    count === 0 ? 'Nothing waiting on review' : `${count} waiting on review`;

  const container = el('list-container');
  container.innerHTML = '';

  if (count === 0) {
    container.innerHTML = `<div class="empty-state">No pending verifications right now.</div>`;
    return;
  }

  for (const user of users) {
    const card = document.createElement('div');
    card.className = 'verification-card';
    card.innerHTML = `
      <div class="vc-top">
        <div>
          <div class="vc-name">${escapeHtml(user.name)}</div>
          <div class="vc-email">${escapeHtml(user.email)}</div>
          <div class="vc-meta">
            <span class="badge">${escapeHtml(user.verification_method)}</span>
            &nbsp;·&nbsp; Signed up ${escapeHtml(user.created_at || '')}
          </div>
        </div>
      </div>
      <div class="vc-actions">
        <button class="ghost" data-action="view" data-id="${user.user_id}">View document</button>
        <button class="primary" data-action="approve" data-id="${user.user_id}">Approve</button>
        <button class="ghost" data-action="reject" data-id="${user.user_id}">Reject</button>
      </div>
    `;
    container.appendChild(card);
  }

  container.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id, btn));
  });
}

/* Minimal HTML-escaping so a user's name/email can't inject markup. */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

async function handleAction(action, userId, btn) {
  clearError();
  if (action === 'view') return viewDocument(userId);

  const status = action === 'approve' ? 'verified' : 'rejected';
  const confirmMsg =
    action === 'approve'
      ? 'Approve this user? They will be marked as verified.'
      : 'Reject this user? They will be marked as rejected.';
  if (!confirm(confirmMsg)) return;

  btn.disabled = true;
  try {
    await adminRequest(`/admin/verifications/${userId}`, { method: 'PATCH', body: { status } });
    loadPending();
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
  }
}

/* ---------- Document viewer ---------- */
el('doc-close-btn').addEventListener('click', closeDocModal);
el('doc-backdrop').addEventListener('click', (e) => {
  if (e.target === el('doc-backdrop')) closeDocModal();
});

let currentDocObjectUrl = null;

async function viewDocument(userId) {
  const body = el('doc-modal-body');
  body.innerHTML = '<span style="color:var(--white);">Loading…</span>';
  el('doc-backdrop').classList.add('open');

  const key = sessionStorage.getItem(KEY_STORAGE_NAME);
  let res;
  try {
    res = await fetch(`${AUTH_BASE}/admin/verifications/${userId}/document`, {
      headers: { 'X-Admin-Key': key || '' },
    });
  } catch (err) {
    body.innerHTML = `<span style="color:var(--white);">Could not reach the server.</span>`;
    return;
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch (_) { /* ignore */ }
    body.innerHTML = `<span style="color:var(--white);">${escapeHtml(message)}</span>`;
    return;
  }

  const blob = await res.blob();
  if (currentDocObjectUrl) URL.revokeObjectURL(currentDocObjectUrl);
  currentDocObjectUrl = URL.createObjectURL(blob);

  if (blob.type.startsWith('image/')) {
    body.innerHTML = `<img src="${currentDocObjectUrl}" alt="Verification document">`;
  } else {
    // PDF or anything else the browser can render inline
    body.innerHTML = `<iframe src="${currentDocObjectUrl}" title="Verification document"></iframe>`;
  }
}

function closeDocModal() {
  el('doc-backdrop').classList.remove('open');
  if (currentDocObjectUrl) {
    URL.revokeObjectURL(currentDocObjectUrl);
    currentDocObjectUrl = null;
  }
}

/* ---------- Boot ---------- */
(function init() {
  const savedKey = sessionStorage.getItem(KEY_STORAGE_NAME);
  if (savedKey) {
    showPanel();
    loadPending();
  } else {
    showKeyGate();
  }
})();
