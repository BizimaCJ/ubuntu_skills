const API_BASE = "http://127.0.0.1:5001"; // api service — currently exposes /api/sessions* and /api/users/:id/reviews
const AUTH_BASE = "http://127.0.0.1:5000"; // auth service — /register, /login, /logout

// ---------- small fetch helpers ----------

async function request(base, path, { method = "GET", json, form } = {}) {
  const opts = { method };
  if (json !== undefined) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(json);
  } else if (form !== undefined) {
    opts.body = form; // FormData — let the browser set the multipart boundary
  }

  const res = await fetch(`${base}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const api = {
  get: (path) => request(API_BASE, path),
  post: (path, json) => request(API_BASE, path, { method: "POST", json }),
  patch: (path, json) => request(API_BASE, path, { method: "PATCH", json }),
};

const authApi = {
  post: (path, json) => request(AUTH_BASE, path, { method: "POST", json }),
  postForm: (path, form) => request(AUTH_BASE, path, { method: "POST", form }),
};

// ---------- auth state ----------

function isLoggedIn() {
  return localStorage.getItem("user_id") !== null;
}

function currentUserId() {
  return Number(localStorage.getItem("user_id"));
}

function logout() {
  authApi.post("/logout", {}).catch(() => {});
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  window.location.hash = "#/login";
  render();
}

// ---------- routing ----------

const routes = {
  login: { title: "Login", template: "login-template", auth: false },
  register: { title: "Register", template: "register-template", auth: false },
  dashboard: { title: "Dashboard", template: "dashboard-template", auth: true },
  sessions: { title: "Sessions", template: "sessions-template", auth: true },
  profile: { title: "Profile", template: "profile-template", auth: true },
};

const view = document.querySelector("#view");
const pageTitle = document.querySelector("#page-title");

function defaultRoute() {
  return isLoggedIn() ? "dashboard" : "login";
}

function currentRoute() {
  const route = window.location.hash.replace("#/", "");
  return routes[route] ? route : defaultRoute();
}

function updateNav() {
  const loggedIn = isLoggedIn();
  document.querySelectorAll("[data-auth]").forEach((el) => {
    const needsUser = el.dataset.auth === "user";
    const needsGuest = el.dataset.auth === "guest";
    const shouldHide = (needsUser && !loggedIn) || (needsGuest && loggedIn);
    el.style.display = shouldHide ? "none" : "";
  });

  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === currentRoute());
  });
}

function render() {
  const route = currentRoute();
  const config = routes[route];

  // Auth guards: bounce signed-out users away from protected pages,
  // and bounce signed-in users away from login/register.
  if (config.auth && !isLoggedIn()) {
    window.location.hash = "#/login";
    return;
  }
  if (!config.auth && (route === "login" || route === "register") && isLoggedIn()) {
    window.location.hash = "#/dashboard";
    return;
  }

  const template = document.querySelector(`#${config.template}`);
  pageTitle.textContent = config.title;
  view.replaceChildren(template.content.cloneNode(true));
  updateNav();

  if (route === "login") initLoginForm();
  if (route === "register") initRegisterForm();
  if (route === "dashboard") loadDashboard();
  if (route === "sessions") initSessions();
  if (route === "profile") initProfile();
}

window.addEventListener("hashchange", render);

document.getElementById("logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

if (!window.location.hash) {
  window.location.hash = `#/${defaultRoute()}`;
} else {
  render();
}

// ---------- login ----------

function initLoginForm() {
  const form = view.querySelector("#login-form");
  const errorBox = document.getElementById("loginError");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";

    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;

    if (!email || !password) {
      errorBox.textContent = "Please enter your email and password.";
      errorBox.style.display = "flex";
      return;
    }

    try {
      const data = await authApi.post("/login", { email, password });
      if (!data.user?.user_id) {
        throw new Error(data.error || "Invalid email or password");
      }
      localStorage.setItem("user_id", data.user.user_id);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_email", data.user.email);
      window.location.hash = "#/dashboard";
      render();
    } catch (err) {
      errorBox.textContent = err.message || "Invalid email or password";
      errorBox.style.display = "flex";
    }
  });
}

// ---------- register ----------
// auth.py's /register expects multipart form data (it accepts an optional
// verification document upload), never JSON — so this posts a FormData
// body. It also never logs the new user in; on success it just reports
// their verification_status and sends them to log in.

function initRegisterForm() {
  const button = view.querySelector("#register-btn");
  const messageBox = document.getElementById("registerMessage");
  if (!button) return;

  button.addEventListener("click", async (e) => {
    e.preventDefault();
    messageBox.className = "form-message error";
    messageBox.style.display = "none";

    const name = view.querySelector('input[name="name"]').value.trim();
    const email = view.querySelector('input[name="email"]').value.trim();
    const password = view.querySelector('input[name="password"]').value;
    const confirmPassword = view.querySelector('input[name="confirm_password"]').value;
    const teachCategoryId = view.querySelector('input[name="teach_category_id"]').value.trim();
    const teachDescription = view.querySelector('input[name="teach_description"]').value.trim();
    const learnCategoryId = view.querySelector('input[name="learn_category_id"]').value.trim();
    const learnDescription = view.querySelector('input[name="learn_description"]').value.trim();
    const documentInput = view.querySelector('input[name="document"]');
    const documentFile = documentInput?.files?.[0];

    if (!name || !email || !password) {
      messageBox.textContent = "Name, email, and password are required.";
      messageBox.style.display = "flex";
      return;
    }
    if (password !== confirmPassword) {
      messageBox.textContent = "Passwords do not match.";
      messageBox.style.display = "flex";
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (teachCategoryId && teachDescription) {
      formData.append("teach_category_id", teachCategoryId);
      formData.append("teach_description", teachDescription);
    }
    if (learnCategoryId && learnDescription) {
      formData.append("learn_category_id", learnCategoryId);
      formData.append("learn_description", learnDescription);
    }
    if (documentFile) {
      formData.append("document", documentFile);
    }

    try {
      const data = await authApi.postForm("/register", formData);

      messageBox.className = "form-message success";
      messageBox.textContent =
        data.verification_status === "verified"
          ? "Account created and verified. You can log in now."
          : "Account created. Your verification document is pending review — you can log in now.";
      messageBox.style.display = "flex";
      view.querySelector("#register-btn").insertAdjacentHTML(
        "afterend",
        '<a class="top-action" href="#/login">Go to login</a>'
      );
    } catch (err) {
      messageBox.className = "form-message error";
      messageBox.textContent = err.message || "Could not create your account.";
      messageBox.style.display = "flex";
    }
  });
}

// ---------- dashboard ----------

async function loadDashboard() {
  const userId = currentUserId();
  const nameEl = document.getElementById("dashboard-name");
  if (nameEl) nameEl.textContent = localStorage.getItem("user_name") || "there";

  const errorBox = document.getElementById("dashboard-error");
  const recentList = document.getElementById("dashboard-recent-sessions");

  try {
    const [sessionsData, reviewsData] = await Promise.all([
      api.get(`/api/users/${userId}/sessions`),
      api.get(`/api/users/${userId}/reviews`),
    ]);

    const sessions = sessionsData.sessions || [];
    const reviews = reviewsData.reviews || [];

    const pendingCount = sessions.filter((s) => s.status === "pending").length;
    const upcomingCount = sessions.filter((s) => s.status === "approved").length;
    const completedCount = sessions.filter((s) => s.status === "completed").length;
    const averageRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

    document.getElementById("stat-pending").textContent = pendingCount;
    document.getElementById("stat-upcoming").textContent = upcomingCount;
    document.getElementById("stat-completed").textContent = completedCount;
    document.getElementById("stat-rating").textContent =
      reviews.length ? `${averageRating} (${reviews.length})` : "No reviews yet";

    const recent = sessions.slice(0, 5);
    recentList.innerHTML = recent.length
      ? recent
          .map((s) => {
            const role = s.teacher_id === userId ? "Teaching" : "Learning";
            return `
        <li>
          <strong>${role} · ${escapeHtml(s.status)}</strong>
          <span>Session #${s.session_id} scheduled ${formatDateTime(s.scheduled_time)}</span>
        </li>`;
          })
          .join("")
      : '<li class="empty">No sessions yet. Request one from the Sessions page.</li>';
  } catch (err) {
    errorBox.textContent =
      "Could not load your dashboard data. Make sure the backend services are running.";
    errorBox.style.display = "flex";
    ["stat-pending", "stat-upcoming", "stat-completed", "stat-rating"].forEach((id) => {
      document.getElementById(id).textContent = "–";
    });
    recentList.innerHTML = '<li class="empty">Unable to load recent activity.</li>';
  }
}

// ---------- sessions ----------

function initSessions() {
  const requestForm = view.querySelector("#request-session-form");
  const requestMessage = document.getElementById("request-session-message");

  requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    requestMessage.style.display = "none";

    const userSkillId = requestForm.querySelector('input[name="user_skill_id"]').value.trim();
    const scheduledTimeRaw = requestForm.querySelector('input[name="scheduled_time"]').value;

    if (!userSkillId || !scheduledTimeRaw) {
      requestMessage.className = "form-message error";
      requestMessage.textContent = "A listing ID and a scheduled time are both required.";
      requestMessage.style.display = "flex";
      return;
    }

    try {
      await api.post("/api/sessions", {
        learner_id: currentUserId(),
        user_skill_id: Number(userSkillId),
        scheduled_time: new Date(scheduledTimeRaw).toISOString(),
      });
      requestMessage.className = "form-message success";
      requestMessage.textContent = "Session requested — the teacher has been notified.";
      requestMessage.style.display = "flex";
      requestForm.reset();
      loadSessions();
    } catch (err) {
      requestMessage.className = "form-message error";
      requestMessage.textContent = err.message || "Could not request that session.";
      requestMessage.style.display = "flex";
    }
  });

  const container = document.getElementById("sessions-container");
  container.addEventListener("click", handleSessionAction);
  container.addEventListener("submit", handleReviewSubmit);

  loadSessions();
}

async function loadSessions() {
  const userId = currentUserId();
  const container = document.getElementById("sessions-container");
  const errorBox = document.getElementById("sessions-error");
  errorBox.style.display = "none";

  try {
    const data = await api.get(`/api/users/${userId}/sessions`);
    await renderSessions(data.sessions || [], userId);
  } catch (err) {
    errorBox.textContent =
      "Could not load your sessions. Make sure the backend services are running.";
    errorBox.style.display = "flex";
    container.innerHTML = "";
  }
}

const SESSION_GROUPS = [
  { key: "awaiting_you", title: "Waiting on your response" },
  { key: "awaiting_them", title: "Waiting on the other person" },
  { key: "upcoming", title: "Upcoming (approved)" },
  { key: "completed", title: "Completed" },
  { key: "past", title: "Declined / cancelled" },
];

async function renderSessions(sessions, userId) {
  const container = document.getElementById("sessions-container");

  if (!sessions.length) {
    container.innerHTML = '<p class="empty">No sessions yet. Request one above.</p>';
    return;
  }

  const groups = { awaiting_you: [], awaiting_them: [], upcoming: [], completed: [], past: [] };

  sessions.forEach((s) => {
    if (s.status === "pending") {
      (s.teacher_id === userId ? groups.awaiting_you : groups.awaiting_them).push(s);
    } else if (s.status === "approved") {
      groups.upcoming.push(s);
    } else if (s.status === "completed") {
      groups.completed.push(s);
    } else {
      groups.past.push(s);
    }
  });

  // Only completed sessions need an extra round trip to find out whether
  // they already have a review.
  const reviewsBySession = {};
  await Promise.all(
    groups.completed.map(async (s) => {
      try {
        const data = await api.get(`/api/sessions/${s.session_id}/review`);
        reviewsBySession[s.session_id] = data.review;
      } catch (err) {
        reviewsBySession[s.session_id] = null;
      }
    })
  );

  container.innerHTML = SESSION_GROUPS.filter((g) => groups[g.key].length).length
    ? SESSION_GROUPS.filter((g) => groups[g.key].length)
        .map(
          (g) => `
      <section class="profile-section">
        <h3>${g.title}</h3>
        <div class="skills-grid">
          ${groups[g.key].map((s) => renderSessionCard(s, userId, reviewsBySession[s.session_id])).join("")}
        </div>
      </section>`
        )
        .join("")
    : '<p class="empty">No sessions match yet.</p>';
}

function renderSessionCard(session, userId, review) {
  const role = session.teacher_id === userId ? "teacher" : "learner";
  const counterpartId = role === "teacher" ? session.learner_id : session.teacher_id;
  const counterpartLabel = role === "teacher" ? "Learner" : "Teacher";
  const myCompletionFlag = role === "teacher" ? session.completed_by_teacher : session.completed_by_learner;

  let actions = "";

  if (session.status === "pending" && role === "teacher") {
    actions = `
      <button type="button" data-action="approve" data-session-id="${session.session_id}">Approve</button>
      <button type="button" data-action="decline" data-session-id="${session.session_id}">Decline</button>`;
  } else if (session.status === "pending" && role === "learner") {
    actions = `<button type="button" data-action="cancel" data-session-id="${session.session_id}">Cancel request</button>`;
  } else if (session.status === "approved") {
    actions = `<button type="button" data-action="cancel" data-session-id="${session.session_id}">Cancel</button>`;
    actions += myCompletionFlag
      ? `<span class="empty">Waiting for the other participant to confirm completion.</span>`
      : `<button type="button" data-action="complete" data-session-id="${session.session_id}">Mark complete</button>`;
  } else if (session.status === "completed") {
    actions = review
      ? `<div class="tag-row"><span>Rated ${review.rating}/5 by user #${review.reviewer_id}</span></div>${
          review.comment ? `<p>${escapeHtml(review.comment)}</p>` : ""
        }`
      : `
      <form data-review-session-id="${session.session_id}" class="form-row">
        <label>
          Rating
          <select name="rating" required>
            <option value="">Rate...</option>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Okay</option>
            <option value="2">2 — Poor</option>
            <option value="1">1 — Very poor</option>
          </select>
        </label>
        <label>
          Comment
          <input type="text" name="comment" placeholder="Optional comment" />
        </label>
        <button type="submit">Submit review</button>
      </form>`;
  } else if (session.status === "cancelled") {
    actions = `<span class="empty">Cancelled by user #${session.cancelled_by ?? "unknown"}.</span>`;
  }

  return `
    <article class="skill-card" data-session-card="${session.session_id}">
      <div>
        <h3>Session #${session.session_id}</h3>
        <span class="skill-category">${escapeHtml(session.status)}</span>
      </div>
      <p>${counterpartLabel} #${counterpartId} · Listing #${session.user_skill_id}</p>
      <p>${formatDateTime(session.scheduled_time)}</p>
      ${actions}
    </article>`;
}

async function handleSessionAction(e) {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const sessionId = button.dataset.sessionId;
  const action = button.dataset.action;
  const userId = currentUserId();
  const errorBox = document.getElementById("sessions-error");
  errorBox.style.display = "none";
  button.disabled = true;

  try {
    if (action === "approve") await api.patch(`/api/sessions/${sessionId}/approve`, { user_id: userId });
    if (action === "decline") await api.patch(`/api/sessions/${sessionId}/decline`, { user_id: userId });
    if (action === "cancel") await api.patch(`/api/sessions/${sessionId}/cancel`, { user_id: userId });
    if (action === "complete") await api.patch(`/api/sessions/${sessionId}/complete`, { user_id: userId });
    await loadSessions();
  } catch (err) {
    errorBox.textContent = err.message || "That action could not be completed.";
    errorBox.style.display = "flex";
    button.disabled = false;
  }
}

async function handleReviewSubmit(e) {
  const form = e.target.closest("form[data-review-session-id]");
  if (!form) return;
  e.preventDefault();

  const sessionId = form.dataset.reviewSessionId;
  const rating = Number(form.querySelector('select[name="rating"]').value);
  const comment = form.querySelector('input[name="comment"]').value.trim();
  const errorBox = document.getElementById("sessions-error");
  errorBox.style.display = "none";

  if (!rating) {
    errorBox.textContent = "Please choose a rating before submitting.";
    errorBox.style.display = "flex";
    return;
  }

  try {
    await api.post(`/api/sessions/${sessionId}/review`, {
      reviewer_id: currentUserId(),
      rating,
      comment: comment || null,
    });
    await loadSessions();
  } catch (err) {
    errorBox.textContent = err.message || "Could not submit that review.";
    errorBox.style.display = "flex";
  }
}

// ---------- profile ----------

function initProfile() {
  const nameEl = view.querySelector(".profile-hero h2");
  const emailEl = view.querySelector(".profile-hero .profile-email");
  if (nameEl) nameEl.textContent = localStorage.getItem("user_name") || "User";
  if (emailEl) emailEl.textContent = localStorage.getItem("user_email") || "";
  loadProfileReviews();
}

async function loadProfileReviews() {
  const userId = currentUserId();
  const summaryEl = document.getElementById("profile-rating-summary");
  const listEl = document.getElementById("profile-reviews-list");

  try {
    const data = await api.get(`/api/users/${userId}/reviews`);
    const reviews = data.reviews || [];

    if (!reviews.length) {
      summaryEl.textContent = "No reviews yet.";
      listEl.innerHTML = '<li class="empty">Complete a session to start collecting reviews.</li>';
      return;
    }

    const average = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    summaryEl.textContent = `${average} / 5 average from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`;

    listEl.innerHTML = reviews
      .map(
        (r) => `
      <li>
        <strong>${escapeHtml(r.reviewer_name || `User #${r.reviewer_id}`)} · ${r.rating}/5</strong>
        <span>${escapeHtml(r.comment || "No comment left.")}</span>
      </li>`
      )
      .join("");
  } catch (err) {
    summaryEl.textContent = "Could not load your reviews.";
    listEl.innerHTML = '<li class="empty">Unable to load reviews right now.</li>';
  }
}

// ---------- utils ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDateTime(isoString) {
  if (!isoString) return "an unscheduled time";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}