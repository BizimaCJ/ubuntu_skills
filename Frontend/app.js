/* ============================================================
   BACKEND CONFIG
   The auth service (register/login/logout) and the api service
   (everything else) run as two separate Flask apps.
   ============================================================ */
const AUTH_BASE = 'https://ubuntu-skills-auth-9v0u.onrender.com';
const API_BASE = 'https://ubuntu-skills-api-64pi.onrender.com';

/* Small wrapper around fetch that always sends/expects JSON, always
   includes cookies (the auth service uses a session cookie), and
   throws with the backend's own error message so callers can toast it. */
async function apiRequest(base, path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(base + path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Could not reach the server at ${base}. Is the backend running?`);
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* empty body, e.g. some errors */ }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}
const authApi = (path, opts) => apiRequest(AUTH_BASE, path, opts);
const api = (path, opts) => apiRequest(API_BASE, path, opts);

/* ============================================================
   ICONS — tiny inline SVG set, injected wherever data-icon appears
   ============================================================ */
const ICONS = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.8-4 5-6 8-6s6.2 2 8 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c1.3-3.2 3.8-5 7-5s5.7 1.8 7 5"/><path d="M16 5.5a3.5 3.5 0 0 1 0 7"/><path d="M17.5 15c2.6.4 4 1.9 4.9 5"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  'user-plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  'eye-off': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>'
};
function stampIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = ICONS[el.getAttribute('data-icon')] || '';
  });
}
stampIcons();
// stamp the logo template into both logo slots
const logoMarkup = document.getElementById('logo-tpl').innerHTML;
document.getElementById('auth-logo').innerHTML = logoMarkup;
document.querySelector('.sidebar-top .mark').innerHTML = logoMarkup;

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ============================================================
   APP STATE
   ============================================================ */
let currentUser = null;      // { user_id, name, email, ... } — the logged in user's row
let degrees = [];
let categories = [];
let mySkills = { teach: [], learn: [] };
let peopleIndex = [];        // merged user + skills, used by the Search page
let conversations = [];
let activeConvId = null;
let sessionsByTab = { upcoming: [], pending: [], completed: [], declined: [] };
let notifications = [];
let groupSessions = [];
const userCache = {};        // user_id -> { name, ... }, filled in lazily
const skillDescCache = {};   // user_skill_id -> description string, filled in lazily

function initials(name){
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/* ============================================================
   AUTH SCREEN
   ============================================================ */
const authTabs = document.querySelectorAll('.auth-tab');
function setAuthPanel(name){
  authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.dataset.panel === name));
  document.querySelectorAll('[data-show-when]').forEach(el => el.classList.toggle('hidden', el.dataset.showWhen !== name));
}
authTabs.forEach(tab => tab.addEventListener('click', () => setAuthPanel(tab.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); setAuthPanel(a.dataset.goto);
}));

// verification method toggle
document.querySelectorAll('.verify-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.verify-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.verify-panel').forEach(p => p.classList.toggle('active', p.dataset.verifyPanel === btn.dataset.verify));
  });
});

// document upload (still local-only preview — no verification-document
// upload endpoint exists on the backend yet, so we just send the
// filename as a placeholder path)
const uploadDrop = document.getElementById('upload-drop');
uploadDrop.addEventListener('click', () => document.getElementById('signup-doc').click());
document.getElementById('signup-doc').addEventListener('change', e => {
  if(e.target.files[0]){
    document.getElementById('upload-label').textContent = e.target.files[0].name;
    uploadDrop.classList.add('has-file');
  }
});

function populateSelect(select, items, valueKey, labelKey, placeholder){
  select.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(item => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join('');
}

async function loadLookupData(){
  try {
    const [degreesRes, categoriesRes] = await Promise.all([
      api('/api/degrees'),
      api('/api/skill-categories'),
    ]);
    degrees = degreesRes.degrees || [];
    categories = categoriesRes.categories || [];
    populateSelect(document.getElementById('signup-degree'), degrees, 'degree_id', 'degree_name', 'Select a degree');
    populateSelect(document.getElementById('gs-category'), categories, 'category_id', 'category_name', 'Select a category');
  } catch (err) {
    toast(err.message);
  }
}
loadLookupData();

// PASSWORD VISIBILITY TOGGLE
document.querySelectorAll('[data-toggle-password]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.togglePassword);
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.innerHTML = '';
    btn.appendChild(document.createRange().createContextualFragment(ICONS[showing ? 'eye' : 'eye-off']));
  });
});

// LOGIN
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await authApi('/login', { method: 'POST', body: { email, password } });
    currentUser = data.user;
    sessionStorage.setItem('ubuntuskills_user', JSON.stringify(currentUser));
    toast(`Welcome back, ${currentUser.name}!`);
    await enterApp();
  } catch (err) {
    toast(err.message);
  }
});

// SIGN UP
document.getElementById('signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const password = document.getElementById('signup-password').value;
  const degreeId = document.getElementById('signup-degree').value;
  const classYear = document.getElementById('signup-class-year').value;
  const usingDocument = document.querySelector('.verify-opt.active').dataset.verify === 'document';

  const body = {
    name,
    password,
    degree_id: degreeId ? Number(degreeId) : null,
    class_year: classYear ? Number(classYear) : null,
  };

  if (usingDocument) {
    const file = document.getElementById('signup-doc').files[0];
    body.email = document.getElementById('signup-email').value.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    body.verification_document_path = file ? `uploads/${file.name}` : null;
  } else {
    body.email = document.getElementById('signup-email').value.trim();
  }

  if (!body.email) { toast('Enter an email address first'); return; }

  try {
    const data = await authApi('/register', { method: 'POST', body });
    if (data.verification_status === 'verified') {
      toast('Account created — logging you in…');
      const loginData = await authApi('/login', { method: 'POST', body: { email: body.email, password } });
      currentUser = loginData.user;
      sessionStorage.setItem('ubuntuskills_user', JSON.stringify(currentUser));
      await enterApp();
    } else {
      toast('Account created — your document is pending manual review.');
      setAuthPanel('login');
    }
  } catch (err) {
    toast(err.message);
  }
});

async function enterApp(){
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  await refreshEverything();
  const lastView = sessionStorage.getItem('ubuntuskills_active_view');
  if (lastView && document.getElementById('view-' + lastView)) {
    document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === lastView));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + lastView).classList.add('active');
  }
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  try { await authApi('/logout', { method: 'POST' }); } catch (_) { /* log out locally regardless */ }
  currentUser = null;
  sessionStorage.removeItem('ubuntuskills_user');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
});

// Resume a session on page refresh if we already have one
(function tryResumeSession(){
  const saved = sessionStorage.getItem('ubuntuskills_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    enterApp();
  }
})();

/* ============================================================
   NAV ROUTING
   ============================================================ */
document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    sessionStorage.setItem('ubuntuskills_active_view', btn.dataset.view);
  });
});
document.getElementById('profile-message-btn').addEventListener('click', async () => {
  try {
    const { conversation_id } = await api('/api/conversations', { method: 'POST', body: { participant_ids: [currentUser.user_id, currentUser.user_id] } });
    await loadConversations();
    activeConvId = conversation_id;
    document.querySelector('.nav-btn[data-view="messages"]').click();
    renderConvList(); renderChat();
  } catch (err) {
    toast(err.message);
  }
});

/* ============================================================
   LOAD EVERYTHING FOR THE LOGGED IN USER
   ============================================================ */
async function refreshEverything(){
  await loadLookupData();
  await Promise.all([
    loadProfile(),
    loadPeopleIndex(),
    loadConversations(),
    loadSessions(),
    loadNotifications(),
    loadGroupSessions(),
  ]);
}

/* ============================================================
   PROFILE
   ============================================================ */
async function loadProfile(){
  try {
    const { user } = await api(`/api/users/${currentUser.user_id}`);
    currentUser = { ...currentUser, ...user };

    const nameEl = document.querySelector('#view-profile h1');
    nameEl.textContent = user.name;
    nameEl.classList.remove('skeleton-text');
    const degree = degrees.find(d => d.degree_id === user.degree_id);
    const degreeEl = document.querySelector('#view-profile .muted');
    degreeEl.textContent =
      [degree ? degree.degree_name : null, user.class_year ? `Class of ${user.class_year}` : null].filter(Boolean).join(' · ') || 'No degree set yet';
    degreeEl.classList.remove('skeleton-text');
    document.querySelector('#view-profile .stars').dataset.rating = user.credits_average;
    const creditsEl = document.querySelector('#view-profile .credits-label');
    creditsEl.innerHTML = `${user.credits_average} <span class="muted">Ubuntu Credits (${user.credits_count} reviews)</span>`;
    creditsEl.classList.remove('skeleton-text');

    const avatarEl = document.getElementById('profile-avatar');
    avatarEl.classList.remove('skeleton-circle');
    avatarEl.innerHTML = user.avatar_url ? `<img src="${user.avatar_url}" alt="">` : initials(user.name);

    const indicatorAvatar = document.getElementById('account-indicator-avatar');
    const indicatorName = document.getElementById('account-indicator-name');
    indicatorAvatar.classList.remove('skeleton-circle');
    indicatorAvatar.innerHTML = user.avatar_url ? `<img src="${user.avatar_url}" alt="">` : initials(user.name);
    indicatorName.textContent = user.name;
    indicatorName.classList.remove('skeleton-text');

    const firstName = user.name.split(' ')[0];
    const profileNavLabel = document.querySelector('.nav-btn[data-view="profile"] span:not(.dot-badge)');
    if (profileNavLabel) profileNavLabel.textContent = firstName;

    const [teachRes, learnRes] = await Promise.all([
      api(`/api/users/${currentUser.user_id}/skills?type=teach`),
      api(`/api/users/${currentUser.user_id}/skills?type=learn`),
    ]);
    mySkills = { teach: teachRes.skills, learn: learnRes.skills };
    renderSkillChips();

    const { reviews } = await api(`/api/users/${currentUser.user_id}/reviews`);
    renderReviews(reviews);
  } catch (err) {
    toast(err.message);
  }
}

function renderSkillChips(){
  document.querySelectorAll('.chip-input').forEach(group => {
    const type = group.dataset.chipGroup; // 'teach' or 'learn'
    const input = group.querySelector('input');
    const chipClass = type === 'teach' ? 'chip-teal' : 'chip-steel';
    group.querySelectorAll('.chip').forEach(c => c.remove());
    mySkills[type].forEach(skill => {
      const chip = document.createElement('span');
      chip.className = `chip ${chipClass}`;
      chip.dataset.userSkillId = skill.user_skill_id;
      chip.innerHTML = `${skill.description} <button data-remove>×</button>`;
      group.insertBefore(chip, input);
    });
  });
}

document.querySelectorAll('.chip-input').forEach(group => {
  const input = group.querySelector('input');
  const type = group.dataset.chipGroup;

  input.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      const description = input.value.trim();

      if (!categories.length) { toast('Skill categories are still loading, try again in a second'); return; }

      const addSkill = async (category) => {
        try {
          await api(`/api/users/${currentUser.user_id}/skills`, {
            method: 'POST',
            body: { category_id: category.category_id, description, skill_type: type },
          });
          input.value = '';
          await loadProfile();
          toast('Skill added to your profile');
        } catch (err) {
          toast(err.message);
        }
      };

      // Best-effort match of the free text to an existing category name,
      // otherwise ask which category it belongs to via the picker modal.
      const matched = categories.find(c => description.toLowerCase().includes(c.category_name.toLowerCase()));
      if (matched) {
        await addSkill(matched);
      } else {
        openCategoryPickModal(description, addSkill);
      }
    }
  });

  group.addEventListener('click', async e => {
    if (e.target.matches('[data-remove]')) {
      const chip = e.target.closest('.chip');
      const userSkillId = chip.dataset.userSkillId;
      try {
        await api(`/api/users/${currentUser.user_id}/skills/${userSkillId}`, { method: 'DELETE' });
        chip.remove();
        toast('Skill removed');
      } catch (err) {
        toast(err.message);
      }
    }
  });
});

document.getElementById('avatar-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    document.getElementById('profile-avatar').innerHTML = `<img src="${ev.target.result}" alt="">`;
    try {
      await api(`/api/users/${currentUser.user_id}`, { method: 'PATCH', body: { avatar_url: ev.target.result } });
    } catch (err) {
      toast(err.message);
    }
  };
  reader.readAsDataURL(file);
});

function renderReviews(reviews){
  document.getElementById('reviews-list').innerHTML = (reviews || []).map(r => `
    <div class="review-item">
      <div class="avatar avatar-sm">${initials(r.reviewer_name || '')}</div>
      <div class="review-body">
        <div class="review-top">
          <span class="review-name">${r.reviewer_name || 'A student'}</span>
          <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        <p class="review-text">${r.comment || ''}</p>
        <p class="review-date">${(r.created_at || '').slice(0, 10)}</p>
      </div>
    </div>`).join('') || `<p class="muted">No reviews yet.</p>`;
  document.querySelector('#view-profile .card-head .muted').textContent = `${(reviews || []).length} total`;
}

/* ============================================================
   SEARCH — powered by /api/search/users and /api/search/skills
   ============================================================ */
async function loadPeopleIndex(){
  try {
    const [usersRes, teachRes, learnRes] = await Promise.all([
      api('/api/search/users'),
      api('/api/search/skills?type=teach'),
      api('/api/search/skills?type=learn'),
    ]);

    const byId = {};
    (usersRes.users || []).forEach(u => {
      if (u.user_id === currentUser.user_id) return; // don't show yourself in search
      byId[u.user_id] = {
        user_id: u.user_id,
        name: u.name,
        meta: [degrees.find(d => d.degree_id === u.degree_id)?.degree_name, u.class_year ? `Class of ${u.class_year}` : null].filter(Boolean).join(' · '),
        initials: initials(u.name),
        teach: [],
        learn: [],
        teachSkillIds: [],
      };
    });
    (teachRes.results || []).forEach(s => {
      if (byId[s.user_id]) { byId[s.user_id].teach.push(s.description); byId[s.user_id].teachSkillIds.push(s.user_skill_id); }
    });
    (learnRes.results || []).forEach(s => {
      if (byId[s.user_id]) byId[s.user_id].learn.push(s.description);
    });

    peopleIndex = Object.values(byId);
    renderResults(document.getElementById('search-input').value);
  } catch (err) {
    toast(err.message);
  }
}

let activeFilter = 'all';
function renderResults(query=''){
  const q = query.toLowerCase();
  let list = peopleIndex.filter(p => {
    const text = (p.name + ' ' + p.teach.join(' ') + ' ' + p.learn.join(' ')).toLowerCase();
    return text.includes(q);
  });
  if(activeFilter === 'teach') list = list.filter(p => p.teach.length);
  if(activeFilter === 'learn') list = list.filter(p => p.learn.length);
  document.getElementById('results-grid').innerHTML = list.map((p, i) => `
    <div class="result-card">
      <div class="result-top">
        <div class="avatar avatar-md">${p.initials}</div>
        <div>
          <div class="result-name">${p.name}</div>
          <div class="result-meta">${p.meta}</div>
        </div>
      </div>
      <div class="result-tags">
        ${p.teach.map(s => `<span class="tag">Teaches ${s}</span>`).join('')}
        ${activeFilter !== 'teach' ? p.learn.map(s => `<span class="tag" style="background:var(--teal);color:#0F3A30">Wants ${s}</span>`).join('') : ''}
      </div>
      <div class="result-actions">
        <button class="btn btn-secondary" data-request-idx="${i}" ${p.teachSkillIds.length ? '' : 'disabled'}>Request session</button>
        <button class="btn btn-primary" data-message-idx="${i}">Message</button>
      </div>
    </div>`).join('') || `<p class="muted">No one matches that search yet.</p>`;

  document.querySelectorAll('[data-message-idx]').forEach(btn => btn.addEventListener('click', async () => {
    const person = list[Number(btn.dataset.messageIdx)];
    try {
      const { conversation_id } = await api('/api/conversations', { method: 'POST', body: { participant_ids: [currentUser.user_id, person.user_id] } });
      await loadConversations();
      activeConvId = conversation_id;
      document.querySelector('.nav-btn[data-view="messages"]').click();
      renderConvList(); renderChat();
    } catch (err) {
      toast(err.message);
    }
  }));

  document.querySelectorAll('[data-request-idx]').forEach(btn => btn.addEventListener('click', () => {
    const person = list[Number(btn.dataset.requestIdx)];
    const skillOptions = (person.teach || []).map((desc, i) => ({ id: person.teachSkillIds[i], label: desc }));
    openScheduleModal({
      title: `Request a session with ${person.name}`,
      sub: 'They can approve this time, or message you to propose a different one.',
      buttonLabel: 'Send request',
      initialValue: '',
      skillOptions,
      onConfirm: async (when, skillId) => {
        try {
          const body = { learner_id: currentUser.user_id, scheduled_time: when };
          if (skillId) body.user_skill_id = skillId; else body.teacher_id = person.user_id;
          await api('/api/sessions', { method: 'POST', body });
          toast(`Session requested with ${person.name}`);
          await loadSessions();
        } catch (err) {
          toast(err.message);
        }
      }
    });
  }));
}
document.getElementById('search-input').addEventListener('input', e => renderResults(e.target.value));
document.querySelectorAll('#filter-row .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#filter-row .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderResults(document.getElementById('search-input').value);
  });
});

/* ============================================================
   MESSAGES
   ============================================================ */
async function loadConversations(){
  try {
    const { conversations: convs } = await api(`/api/users/${currentUser.user_id}/conversations`);
    conversations = (convs || []).map(c => {
      const others = (c.participants || []).filter(p => p.user_id !== currentUser.user_id);
      const isSelfChat = !c.is_group && others.length === 0 && (c.participants || []).length > 0;
      let name, subtitle = null;
      if (c.is_group) {
        name = others.map(p => p.name).join(', ') || 'Group chat';
      } else if (isSelfChat) {
        name = currentUser.name;
        subtitle = "It's you";
      } else {
        name = others[0]?.name || 'Conversation';
      }
      return {
        id: c.conversation_id,
        name,
        subtitle,
        initials: initials(name),
        group: !!c.is_group,
        groupSessionId: c.group_session_id || null,
        otherUserId: !c.is_group ? (isSelfChat ? currentUser.user_id : others[0]?.user_id) : null,
        participants: c.participants || [],
      };
    });
    if (!activeConvId && conversations.length) activeConvId = conversations[0].id;
    renderConvList();
    if (activeConvId) await renderChat();
  } catch (err) {
    toast(err.message);
  }
}
async function openMessagesProfilePanel(userId){
  if (!userId) return;
  const panel = document.getElementById('msg-profile-panel');
  const body = document.getElementById('msg-profile-panel-body');
  panel.classList.add('active');
  body.innerHTML = `<p class="muted skeleton-text" style="width:100%;">&nbsp;</p>`;
  try {
    const [{ user }, { skills }] = await Promise.all([
      api(`/api/users/${userId}`),
      api(`/api/users/${userId}/skills`),
    ]);
    const degree = degrees.find(d => d.degree_id === user.degree_id);
    const teach = (skills || []).filter(s => s.skill_type === 'teach');
    const isSelf = userId === currentUser.user_id;

    const allSessions = [...(sessionsByTab.upcoming || []), ...(sessionsByTab.pending || []), ...(sessionsByTab.completed || []), ...(sessionsByTab.declined || [])];
    const withThisPerson = allSessions.filter(s => s.teacher_id === userId || s.learner_id === userId);

    body.innerHTML = `
      <div class="avatar avatar-lg">${initials(user.name)}</div>
      <h3>${user.name}</h3>
      <p class="muted">${[degree ? degree.degree_name : null, user.class_year ? `Class of ${user.class_year}` : null].filter(Boolean).join(' · ')}</p>
      ${!isSelf ? `<button class="btn btn-primary btn-block" id="msph-request-btn" style="margin-top:12px;">Request session</button>` : ''}
      <h4 style="margin-top:20px;">Session history</h4>
      <div id="msph-sessions">${withThisPerson.length ? withThisPerson.map(s => `
        <div class="msph-session-row">
          <div>${sessionLabel(s)}</div>
          <div class="muted">${s.scheduled_time} · ${s.status}</div>
        </div>`).join('') : `<p class="muted">No sessions together yet.</p>`}</div>
    `;

    if (!isSelf) {
      document.getElementById('msph-request-btn').addEventListener('click', () => {
        const skillOptions = teach.map(s => ({ id: s.user_skill_id, label: s.description }));
        openScheduleModal({
          title: `Request a session with ${user.name}`,
          sub: 'They can approve this time, or propose a different one.',
          buttonLabel: 'Send request',
          initialValue: '',
          skillOptions,
          onConfirm: async (when, skillId) => {
            try {
              const reqBody = { learner_id: currentUser.user_id, scheduled_time: when };
              if (skillId) reqBody.user_skill_id = skillId; else reqBody.teacher_id = userId;
              await api('/api/sessions', { method: 'POST', body: reqBody });
              toast(`Session requested with ${user.name}`);
              await loadSessions();
            } catch (err) { toast(err.message); }
          }
        });
      });
    }
  } catch (err) {
    body.innerHTML = `<p class="muted">Couldn't load this profile.</p>`;
    toast(err.message);
  }
}
document.getElementById('msg-profile-panel-close').addEventListener('click', () => {
  document.getElementById('msg-profile-panel').classList.remove('active');
});

function convDisplayName(c){
  if (c.group && c.groupSessionId) {
    const session = groupSessions.find(g => g.group_session_id === c.groupSessionId);
    if (session) return session.topic;
  }
  return c.name;
}
function renderConvList(){
  document.getElementById('conv-items').innerHTML = conversations.map(c => `
    <div class="conv-item ${c.id === activeConvId ? 'active' : ''}" data-conv="${c.id}">
      <div class="avatar avatar-md">${c.initials}</div>
      <div class="conv-info">
        <div class="conv-name">${convDisplayName(c)}${c.subtitle ? ` <span class="conv-subtitle">${c.subtitle}</span>` : ''}${c.group ? '<span class="group-icon-badge">GROUP</span>' : ''}</div>
        <div class="conv-preview">${c.preview || ''}</div>
      </div>
    </div>`).join('') || `<p class="muted" style="padding:16px">No conversations yet — message someone from Search.</p>`;
  document.querySelectorAll('.conv-item').forEach(el => el.addEventListener('click', async () => {
    activeConvId = Number(el.dataset.conv);
    renderConvList(); await renderChat();
  }));
}
async function renderChat(){
  document.getElementById('msg-profile-panel').classList.remove('active');
  const c = conversations.find(x => x.id === activeConvId);
  if (!c) { document.getElementById('chat-header').innerHTML = ''; document.getElementById('chat-body').innerHTML = ''; return; }
  const displayName = convDisplayName(c);
  document.getElementById('chat-header').innerHTML = c.group
    ? `<div class="avatar avatar-sm" style="cursor:pointer" id="chat-header-avatar">${initials(displayName)}</div><span style="cursor:pointer" id="chat-header-name">${displayName}</span>`
    : `<div class="avatar avatar-sm" style="cursor:pointer" id="chat-header-avatar">${c.initials}</div><span style="cursor:pointer" id="chat-header-name">${displayName}</span>${c.subtitle ? ` <span class="conv-subtitle">${c.subtitle}</span>` : ''}`;
  if (c.group) {
    const openMembers = () => openGroupMembersModal(c);
    document.getElementById('chat-header-avatar').addEventListener('click', openMembers);
    document.getElementById('chat-header-name').addEventListener('click', openMembers);
  } else {
    const openProfile = () => openMessagesProfilePanel(c.otherUserId);
    document.getElementById('chat-header-avatar').addEventListener('click', openProfile);
    document.getElementById('chat-header-name').addEventListener('click', openProfile);
  }
  try {
    const { messages } = await api(`/api/conversations/${c.id}/messages`);
    document.getElementById('chat-body').innerHTML = (messages || [])
      .map(m => `<div class="msg-bubble ${m.sender_id === currentUser.user_id ? 'msg-me' : 'msg-them'}">${m.message_text}</div>`)
      .join('');
    const body = document.getElementById('chat-body');
    body.scrollTop = body.scrollHeight;
  } catch (err) {
    toast(err.message);
  }
}
document.getElementById('chat-form').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text || !activeConvId) return;
  try {
    await api(`/api/conversations/${activeConvId}/messages`, { method: 'POST', body: { sender_id: currentUser.user_id, message_text: text } });
    input.value = '';
    await renderChat();
  } catch (err) {
    toast(err.message);
  }
});
document.getElementById('new-group-btn').addEventListener('click', () => {
  const candidates = conversations.filter(c => !c.group && c.otherUserId && c.otherUserId !== currentUser.user_id);
  if (candidates.length < 2) {
    toast('Message at least two different people first, then you can start a group chat with them.');
    return;
  }
  document.getElementById('new-group-people').innerHTML = candidates.map(c => `
    <label style="display:flex; align-items:center; gap:10px; padding:8px 4px; cursor:pointer;">
      <input type="checkbox" value="${c.otherUserId}">
      <div class="avatar avatar-sm">${c.initials}</div>
      <span>${c.name}</span>
    </label>`).join('');
  document.getElementById('new-group-modal').classList.add('active');
});
document.getElementById('new-group-confirm-btn').addEventListener('click', async () => {
  const checked = Array.from(document.querySelectorAll('#new-group-people input:checked')).map(i => Number(i.value));
  if (checked.length < 2) { toast('Pick at least two people'); return; }
  try {
    const { conversation_id } = await api('/api/conversations', {
      method: 'POST',
      body: { is_group: true, participant_ids: [currentUser.user_id, ...checked] },
    });
    closeModals();
    await loadConversations();
    activeConvId = conversation_id;
    renderConvList(); await renderChat();
    toast('Group chat started');
  } catch (err) { toast(err.message); }
});

/* ============================================================
   SESSIONS
   ============================================================ */
async function getCachedUser(userId){
  if (userCache[userId]) return userCache[userId];
  try {
    const { user } = await api(`/api/users/${userId}`);
    userCache[userId] = user;
    return user;
  } catch (_) {
    return null;
  }
}
async function getCachedSkillDescription(teacherId, userSkillId){
  if (skillDescCache[userSkillId]) return skillDescCache[userSkillId];
  try {
    const { skills } = await api(`/api/users/${teacherId}/skills`);
    (skills || []).forEach(s => { skillDescCache[s.user_skill_id] = s.description; });
    return skillDescCache[userSkillId] || 'Session';
  } catch (_) {
    return 'Session';
  }
}
async function enrichSessions(rawSessions){
  return Promise.all(rawSessions.map(async s => {
    const isTeacher = s.teacher_id === currentUser.user_id;
    const otherId = isTeacher ? s.learner_id : s.teacher_id;
    const [otherUser, description] = await Promise.all([
      getCachedUser(otherId),
      getCachedSkillDescription(s.teacher_id, s.user_skill_id),
    ]);
    return { ...s, isTeacher, otherName: otherUser ? otherUser.name : `User #${otherId}`, description };
  }));
}

async function loadSessions(){
  try {
    const [upcoming, pending, completed, declined] = await Promise.all([
      api(`/api/users/${currentUser.user_id}/sessions?status=approved`),
      api(`/api/users/${currentUser.user_id}/sessions?status=pending`),
      api(`/api/users/${currentUser.user_id}/sessions?status=completed`),
      api(`/api/users/${currentUser.user_id}/sessions?status=declined`),
    ]);
    const [u, p, c, d] = await Promise.all([
      enrichSessions(upcoming.sessions || []),
      enrichSessions(pending.sessions || []),
      enrichSessions(completed.sessions || []),
      enrichSessions(declined.sessions || []),
    ]);
    sessionsByTab = { upcoming: u, pending: p, completed: c, declined: d };
    renderSessions();
  } catch (err) {
    toast(err.message);
  }
}

let currentSessionTab = 'upcoming';
function sessionLabel(s){
  return `${s.description || 'Session'} with ${s.otherName}`;
}
function renderSessions(){
  const list = sessionsByTab[currentSessionTab] || [];
  document.getElementById('sessions-list').innerHTML = list.map((s, i) => {
    const statusLabel = s.status.charAt(0).toUpperCase() + s.status.slice(1);
    let actions = '';
    const rescheduleBtn = `<button class="btn-icon" data-reschedule-idx="${i}" title="Propose a different time"><i data-icon="calendar"></i></button>`;
    if (currentSessionTab === 'upcoming') {
      actions = `${rescheduleBtn}<button class="btn btn-secondary" data-cancel-idx="${i}">Cancel</button>`;
    }
    if (currentSessionTab === 'pending') {
      actions = s.isTeacher
        ? `${rescheduleBtn}<button class="btn btn-primary" data-approve-idx="${i}">Approve</button><button class="btn btn-secondary" data-decline-idx="${i}">Decline</button>`
        : `${rescheduleBtn}<button class="btn btn-secondary" data-cancel-idx="${i}">Withdraw</button>`;
    }
    if (currentSessionTab === 'completed') {
      const myFlag = s.isTeacher ? s.completed_by_teacher : s.completed_by_learner;
      const bothDone = s.completed_by_teacher && s.completed_by_learner;
      if (!bothDone && !myFlag) actions = `<button class="btn btn-secondary" data-confirm-idx="${i}">Confirm it happened</button>`;
      else if (!s.isTeacher) actions = `<button class="btn btn-primary" data-review-idx="${i}">Leave review</button>`;
      else actions = `<span class="muted">Waiting on learner review</span>`;
    }
    return `
      <div class="session-card">
        <div class="session-info">
          <div class="session-skill">${sessionLabel(s)}</div>
          <div class="session-meta">${s.scheduled_time}</div>
        </div>
        <span class="status-badge status-${s.status}">${statusLabel}</span>
        <div class="session-actions">${actions}</div>
      </div>`;
  }).join('') || `<p class="muted">Nothing here yet.</p>`;

  document.querySelectorAll('[data-approve-idx]').forEach(btn => btn.addEventListener('click', () => respondSession(list[Number(btn.dataset.approveIdx)], 'approved')));
  document.querySelectorAll('[data-decline-idx]').forEach(btn => btn.addEventListener('click', () => respondSession(list[Number(btn.dataset.declineIdx)], 'declined')));
  document.querySelectorAll('[data-cancel-idx]').forEach(btn => btn.addEventListener('click', () => cancelSession(list[Number(btn.dataset.cancelIdx)])));
  document.querySelectorAll('[data-confirm-idx]').forEach(btn => btn.addEventListener('click', () => completeSession(list[Number(btn.dataset.confirmIdx)])));
  document.querySelectorAll('[data-review-idx]').forEach(btn => btn.addEventListener('click', () => openReviewModal(list[Number(btn.dataset.reviewIdx)])));
  document.querySelectorAll('[data-reschedule-idx]').forEach(btn => btn.addEventListener('click', () => openRescheduleModal(list[Number(btn.dataset.rescheduleIdx)])));
  stampIcons(document.getElementById('sessions-list'));
}
function openRescheduleModal(session){
  openScheduleModal({
    title: 'Propose a new time',
    sub: `${sessionLabel(session)} — the other person will need to confirm.`,
    buttonLabel: 'Propose time',
    initialValue: (session.scheduled_time || '').slice(0, 16),
    onConfirm: async (when) => {
      try {
        await api(`/api/sessions/${session.session_id}/reschedule`, { method: 'PATCH', body: { user_id: currentUser.user_id, scheduled_time: when } });
        toast('New time proposed — waiting on their confirmation.');
        await loadSessions();
      } catch (err) { toast(err.message); }
    }
  });
}
document.querySelectorAll('[data-session-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-session-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSessionTab = btn.dataset.sessionTab;
    renderSessions();
  });
});

async function respondSession(session, status){
  try {
    const action = status === 'approved' ? 'approve' : 'decline';
    await api(`/api/sessions/${session.session_id}/${action}`, { method: 'PATCH', body: { user_id: currentUser.user_id } });
    await markSessionNotificationsRead(session.session_id);
    toast(`Session ${status}`);
    await Promise.all([loadSessions(), loadNotifications()]);
  } catch (err) { toast(err.message); }
}
async function cancelSession(session){
  try {
    await api(`/api/sessions/${session.session_id}/cancel`, { method: 'PATCH', body: { user_id: currentUser.user_id } });
    toast('Session cancelled');
    await loadSessions();
  } catch (err) { toast(err.message); }
}
async function completeSession(session){
  try {
    await api(`/api/sessions/${session.session_id}/complete`, { method: 'PATCH', body: { user_id: currentUser.user_id } });
    toast('Marked as completed on your side');
    await loadSessions();
  } catch (err) { toast(err.message); }
}

/* review modal */
let selectedStars = 0;
let reviewTargetSession = null;
function openReviewModal(session){
  reviewTargetSession = session;
  document.getElementById('review-modal-sub').textContent = `How was your session? (${sessionLabel(session)})`;
  selectedStars = 0;
  document.querySelectorAll('#star-picker button').forEach(b => b.classList.remove('selected'));
  document.getElementById('review-text').value = '';
  document.getElementById('review-modal').classList.add('active');
}
document.querySelectorAll('#star-picker button').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedStars = Number(btn.dataset.star);
    document.querySelectorAll('#star-picker button').forEach(b => b.classList.toggle('selected', Number(b.dataset.star) <= selectedStars));
  });
});
document.getElementById('submit-review-btn').addEventListener('click', async () => {
  if(!selectedStars){ toast('Pick a star rating first'); return; }
  if(!reviewTargetSession) return;
  try {
    await api(`/api/sessions/${reviewTargetSession.session_id}/review`, {
      method: 'POST',
      body: { reviewer_id: currentUser.user_id, rating: selectedStars, comment: document.getElementById('review-text').value.trim() },
    });
    closeModals();
    await Promise.all([loadSessions(), loadProfile()]);
    toast(`Review submitted — ${selectedStars} Ubuntu Credits awarded!`);
  } catch (err) {
    toast(err.message);
  }
});

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
const NOTIF_ICON = {
  session_requested: 'calendar', session_approved: 'calendar', session_declined: 'calendar',
  session_cancelled: 'calendar', session_reminder: 'bell', review_prompt: 'bell',
  group_session_announced: 'users', new_message: 'message',
};
async function loadNotifications(){
  try {
    const { notifications: list } = await api(`/api/users/${currentUser.user_id}/notifications`);
    notifications = list || [];
    renderNotifications();
  } catch (err) {
    toast(err.message);
  }
}
let selectedNotifIds = new Set();
function renderNotifications(){
  document.getElementById('notif-list').innerHTML = notifications.map(n => `
    <div class="notif-item ${!n.is_read ? 'unread' : ''}">
      <input type="checkbox" class="notif-check" data-notif-check="${n.notification_id}" ${selectedNotifIds.has(n.notification_id) ? 'checked' : ''}>
      <div class="notif-icon"><i data-icon="${NOTIF_ICON[n.notification_type] || 'bell'}"></i></div>
      <div class="notif-body">
        <p class="notif-text">${n.message}</p>
        <p class="notif-time">${(n.created_at || '').slice(0, 16).replace('T', ' ')}</p>
        ${n.notification_type === 'session_requested' && !n.is_read ? `<div class="notif-actions"><button class="btn btn-primary" data-approve="${n.related_session_id}">Approve</button><button class="btn btn-secondary" data-decline="${n.related_session_id}">Decline</button></div>` : ''}
      </div>
    </div>`).join('') || `<p class="muted">No notifications yet.</p>`;
  stampIcons(document.getElementById('notif-list'));
  updateNotifBadge();
  updateNotifToolbar();
  document.querySelectorAll('[data-notif-check]').forEach(cb => cb.addEventListener('change', () => {
    const id = Number(cb.dataset.notifCheck);
    if (cb.checked) selectedNotifIds.add(id); else selectedNotifIds.delete(id);
    updateNotifToolbar();
  }));
}
function updateNotifToolbar(){
  const toolbar = document.getElementById('notif-bulk-actions');
  if (!toolbar) return;
  toolbar.style.display = selectedNotifIds.size ? 'flex' : 'none';
  const countEl = document.getElementById('notif-selected-count');
  if (countEl) countEl.textContent = `${selectedNotifIds.size} selected`;
}
async function markSessionNotificationsRead(sessionId){
  const toMark = notifications.filter(n => n.related_session_id === Number(sessionId) && !n.is_read);
  await Promise.all(toMark.map(n => api(`/api/notifications/${n.notification_id}/read`, { method: 'PATCH' }).catch(() => {})));
}
function updateNotifBadge(){
  const count = notifications.filter(n => !n.is_read).length;
  const badge = document.getElementById('notif-badge');
  badge.textContent = count;
  badge.style.display = count ? '' : 'none';
}
document.getElementById('mark-all-read').addEventListener('click', async () => {
  try {
    await api(`/api/users/${currentUser.user_id}/notifications/read-all`, { method: 'PATCH' });
    await loadNotifications();
  } catch (err) { toast(err.message); }
});
document.getElementById('notif-delete-selected').addEventListener('click', async () => {
  try {
    await api('/api/notifications/delete', { method: 'POST', body: { notification_ids: Array.from(selectedNotifIds) } });
    selectedNotifIds.clear();
    await loadNotifications();
    toast('Deleted selected notifications');
  } catch (err) { toast(err.message); }
});
document.getElementById('notif-read-selected').addEventListener('click', async () => {
  try {
    await Promise.all(Array.from(selectedNotifIds).map(id => api(`/api/notifications/${id}/read`, { method: 'PATCH' })));
    selectedNotifIds.clear();
    await loadNotifications();
  } catch (err) { toast(err.message); }
});
document.getElementById('notif-list').addEventListener('click', async e => {
  if(e.target.matches('[data-approve]')){
    const sessionId = e.target.dataset.approve;
    try {
      await api(`/api/sessions/${sessionId}/approve`, { method: 'PATCH', body: { user_id: currentUser.user_id } });
      await markSessionNotificationsRead(sessionId);
      toast('Session approved — added to your upcoming sessions.');
      await Promise.all([loadNotifications(), loadSessions()]);
    } catch (err) { toast(err.message); }
  }
  if(e.target.matches('[data-decline]')){
    const sessionId = e.target.dataset.decline;
    try {
      await api(`/api/sessions/${sessionId}/decline`, { method: 'PATCH', body: { user_id: currentUser.user_id } });
      await markSessionNotificationsRead(sessionId);
      toast('Session declined.');
      await Promise.all([loadNotifications(), loadSessions()]);
    } catch (err) { toast(err.message); }
  }
});

/* ============================================================
   COMMUNITY
   ============================================================ */
async function loadGroupSessions(){
  try {
    const { group_sessions } = await api('/api/group-sessions');
    groupSessions = group_sessions || [];
    renderCommunity();
  } catch (err) {
    toast(err.message);
  }
}
function renderCommunity(){
  document.getElementById('community-grid').innerHTML = groupSessions.map(g => {
    const memberCount = g.current_members ?? 0;
    const full = memberCount >= g.max_participants;
    const alreadyJoined = (g.member_ids || []).includes(currentUser.user_id);
    let label = 'Join session';
    let disabled = false;
    if (alreadyJoined) { label = 'Joined'; disabled = true; }
    else if (full) { label = 'Full'; disabled = true; }
    return `
    <div class="gs-card">
      <div class="gs-top">
        <div>
          <div class="gs-topic">${g.topic}</div>
          <div class="gs-teacher">Hosted by ${g.teacher_name || `User #${g.teacher_id}`}</div>
        </div>
        <button class="btn-icon gs-chat-icon" data-gs-chat="${g.group_session_id}" title="Group chat"><i data-icon="message"></i></button>
      </div>
      <div class="gs-time"><i data-icon="calendar"></i> ${g.scheduled_time}</div>
      <div class="gs-seats">${memberCount} / ${g.max_participants} joined</div>
      <div class="seats-bar"><div class="seats-fill" style="width:${(memberCount/g.max_participants)*100}%"></div></div>
      <div class="gs-actions">
        <button class="btn ${disabled ? 'btn-secondary' : 'btn-primary'}" data-gs-join="${g.group_session_id}" ${disabled ? 'disabled' : ''}>${label}</button>
      </div>
    </div>`;
  }).join('') || `<p class="muted">No group sessions scheduled yet — host one!</p>`;
  stampIcons(document.getElementById('community-grid'));
  document.querySelectorAll('[data-gs-join]').forEach(btn => btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true; // prevent duplicate joins from rapid/repeat clicks while the request is in flight
    const originalLabel = btn.textContent;
    btn.textContent = 'Joining…';
    try {
      await api(`/api/group-sessions/${btn.dataset.gsJoin}/join`, { method: 'POST', body: { user_id: currentUser.user_id } });
      toast('You joined the session — added to the group chat.');
      await Promise.all([loadGroupSessions(), loadConversations()]);
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }));
  document.querySelectorAll('[data-gs-chat]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelector('.nav-btn[data-view="messages"]').click();
  }));
}

document.getElementById('create-group-session-btn').addEventListener('click', () => {
  document.getElementById('group-session-modal').classList.add('active');
});
document.getElementById('publish-group-session').addEventListener('click', async () => {
  const btn = document.getElementById('publish-group-session');
  if (btn.disabled) return;
  const topic = document.getElementById('gs-topic').value.trim();
  const time = document.getElementById('gs-time').value;
  const categoryId = document.getElementById('gs-category').value;
  if(!topic || !time || !categoryId){ toast('Add a topic, category, and time slot first'); return; }
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = 'Publishing…';
  try {
    await api('/api/group-sessions', {
      method: 'POST',
      body: { teacher_id: currentUser.user_id, category_id: Number(categoryId), topic, scheduled_time: time, max_participants: 5 },
    });
    document.getElementById('gs-topic').value = '';
    document.getElementById('gs-time').value = '';
    document.getElementById('gs-category').value = '';
    closeModals();
    await loadGroupSessions();
    toast('Group session published!');
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
});

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function closeModals(){ document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); }
document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeModals));
document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', e => { if(e.target === overlay) closeModals(); }));

/* ============================================================
   SCHEDULE MODAL — used for booking a session and for
   proposing a new time on an existing one. No native browser
   popups anywhere in this app; this is the one date/time picker.
   ============================================================ */
let scheduleModalAction = null;
function openScheduleModal({ title, sub, buttonLabel, initialValue, skillOptions, onConfirm }){
  document.getElementById('schedule-modal-title').textContent = title;
  document.getElementById('schedule-modal-sub').textContent = sub || '';
  document.getElementById('schedule-time').value = initialValue || '';
  document.getElementById('schedule-confirm-btn').textContent = buttonLabel || 'Confirm';
  const skillField = document.getElementById('schedule-skill-field');
  const skillSelect = document.getElementById('schedule-skill');
  if (skillOptions && skillOptions.length) {
    skillSelect.innerHTML = '<option value="">General session (no specific topic)</option>' +
      skillOptions.map(o => `<option value="${o.id}">${o.label}</option>`).join('');
    skillField.style.display = '';
  } else {
    skillField.style.display = 'none';
  }
  scheduleModalAction = onConfirm;
  document.getElementById('schedule-modal').classList.add('active');
}
document.getElementById('schedule-confirm-btn').addEventListener('click', async () => {
  const value = document.getElementById('schedule-time').value;
  if (!value) { toast('Pick a date and time first'); return; }
  const skillSelect = document.getElementById('schedule-skill');
  const skillId = skillSelect.value ? Number(skillSelect.value) : null;
  if (scheduleModalAction) await scheduleModalAction(value, skillId);
  closeModals();
});

/* ============================================================
   OTHER PERSON'S PROFILE — read-only view, opened by clicking a
   name/photo in an open conversation.
   ============================================================ */
function openGroupMembersModal(conversation){
  const list = document.getElementById('group-members-list');
  list.innerHTML = (conversation.participants || []).map(p => `
    <div class="group-member-row" data-member="${p.user_id}" style="display:flex; align-items:center; gap:10px; padding:8px 4px; cursor:pointer; border-radius:8px;">
      <div class="avatar avatar-sm">${initials(p.name)}</div>
      <span>${p.name}${p.user_id === currentUser.user_id ? ' (You)' : ''}</span>
    </div>`).join('') || `<p class="muted">No members found.</p>`;
  document.querySelectorAll('#group-members-list [data-member]').forEach(row => row.addEventListener('click', () => {
    closeModals();
    openOtherProfileModal(Number(row.dataset.member));
  }));

  const session = conversation.groupSessionId ? groupSessions.find(g => g.group_session_id === conversation.groupSessionId) : null;
  const deleteBtnWrap = document.getElementById('group-delete-chat-wrap');
  if (session && session.teacher_id === currentUser.user_id) {
    deleteBtnWrap.style.display = '';
    deleteBtnWrap.querySelector('button').onclick = async () => {
      try {
        await api(`/api/group-sessions/${session.group_session_id}/chat`, { method: 'DELETE', body: { user_id: currentUser.user_id } });
        closeModals();
        activeConvId = null;
        await loadConversations();
        renderConvList(); renderChat();
        toast('Group chat deleted');
      } catch (err) { toast(err.message); }
    };
  } else {
    deleteBtnWrap.style.display = 'none';
  }

  document.getElementById('group-members-modal').classList.add('active');
}
async function openOtherProfileModal(userId){
  if (!userId) return;
  try {
    const [{ user }, { skills }] = await Promise.all([
      api(`/api/users/${userId}`),
      api(`/api/users/${userId}/skills`),
    ]);
    document.getElementById('op-avatar').textContent = initials(user.name);
    document.getElementById('op-name').textContent = user.name;
    const degree = degrees.find(d => d.degree_id === user.degree_id);
    document.getElementById('op-degree').textContent = [degree ? degree.degree_name : null, user.class_year ? `Class of ${user.class_year}` : null].filter(Boolean).join(' · ');
    document.getElementById('op-bio').textContent = user.bio || '';
    const teach = (skills || []).filter(s => s.skill_type === 'teach');
    const learn = (skills || []).filter(s => s.skill_type === 'learn');
    document.getElementById('op-teach-chips').innerHTML = teach.map(s => `<span class="chip chip-teal">Teaches ${s.description}</span>`).join('');
    document.getElementById('op-learn-chips').innerHTML = learn.map(s => `<span class="chip chip-steel">Wants ${s.description}</span>`).join('');

    const isSelf = userId === currentUser.user_id;
    document.getElementById('op-request-btn').style.display = isSelf ? 'none' : '';
    document.getElementById('op-message-btn').onclick = async () => {
      closeModals();
      try {
        const { conversation_id } = await api('/api/conversations', { method: 'POST', body: { participant_ids: [currentUser.user_id, userId] } });
        await loadConversations();
        activeConvId = conversation_id;
        document.querySelector('.nav-btn[data-view="messages"]').click();
        renderConvList(); renderChat();
      } catch (err) { toast(err.message); }
    };
    document.getElementById('op-request-btn').onclick = () => {
      closeModals();
      const skillOptions = teach.map(s => ({ id: s.user_skill_id, label: s.description }));
      openScheduleModal({
        title: `Request a session with ${user.name}`,
        sub: 'They can approve this time, or propose a different one.',
        buttonLabel: 'Send request',
        initialValue: '',
        skillOptions,
        onConfirm: async (when, skillId) => {
          try {
            const body = { learner_id: currentUser.user_id, scheduled_time: when };
            if (skillId) body.user_skill_id = skillId; else body.teacher_id = userId;
            await api('/api/sessions', { method: 'POST', body });
            toast(`Session requested with ${user.name}`);
            await loadSessions();
          } catch (err) { toast(err.message); }
        }
      });
    };

    document.getElementById('other-profile-modal').classList.add('active');
  } catch (err) {
    toast(err.message);
  }
}

/* ============================================================
   CATEGORY PICK MODAL — used when adding a skill whose text
   doesn't obviously match an existing category name.
   ============================================================ */
let categoryPickAction = null;
function openCategoryPickModal(description, onConfirm){
  document.getElementById('category-pick-sub').textContent = `"${description}" — pick the closest category:`;
  const select = document.getElementById('category-pick-select');
  select.innerHTML = categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
  categoryPickAction = onConfirm;
  document.getElementById('category-pick-modal').classList.add('active');
}
document.getElementById('category-pick-confirm-btn').addEventListener('click', async () => {
  const categoryId = Number(document.getElementById('category-pick-select').value);
  const category = categories.find(c => c.category_id === categoryId);
  if (categoryPickAction && category) await categoryPickAction(category);
  closeModals();
});
