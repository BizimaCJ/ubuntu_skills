const API_BASE = "http://127.0.0.1:5001";
const AUTH_BASE = "http://127.0.0.1:5000";

// ---------- small fetch helpers ----------

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function apiPost(base, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ---------- auth state ----------

function isLoggedIn() {
  return localStorage.getItem("user_id") !== null;
}

function logout() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  window.location.hash = "#/login";
  render();
}

// ---------- routing ----------

const routes = {
  login: { title: "Login", template: "login-template", auth: false },
  register: { title: "Register", template: "register-template", auth: false },
  dashboard: { title: "Dashboard", template: "dashboard-template", auth: true },
  skills: { title: "Skills Catalog", template: "skills-template", auth: false },
  profile: { title: "Profile", template: "profile-template", auth: true },
  portfolio: { title: "Portfolio", template: "portfolio-template", auth: true },
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
  if (route === "skills") loadSkillsList();
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
      const data = await apiPost(AUTH_BASE, "/login", { email, password });
      if (!data.user?.user_id) {
        throw new Error(data.error || "Invalid email or password");
      }
      localStorage.setItem("user_id", data.user.user_id);
      localStorage.setItem("user_name", data.user.name);
      window.location.hash = "#/dashboard";
      render();
    } catch (err) {
      errorBox.textContent = err.message || "Invalid email or password";
      errorBox.style.display = "flex";
    }
  });
}

// ---------- register ----------

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
    const teach_skill = view.querySelector('input[name="teach_skill"]').value.trim();
    const learn_skill = view.querySelector('input[name="learn_skill"]').value.trim();
    const bio = view.querySelector('textarea[name="bio"]').value.trim();

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

    try {
      const data = await apiPost(AUTH_BASE, "/register", {
        name,
        email,
        password,
        bio,
        teach_skill,
        learn_skill,
      });

      if (data.user?.user_id) {
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("user_name", data.user.name);
        window.location.hash = "#/dashboard";
        render();
        return;
      }

      messageBox.className = "form-message success";
      messageBox.textContent = data.message || "Account created. You can now log in.";
      messageBox.style.display = "flex";
    } catch (err) {
      messageBox.className = "form-message error";
      messageBox.textContent = err.message || "Could not create your account.";
      messageBox.style.display = "flex";
    }
  });
}

// ---------- dashboard ----------

async function loadDashboard() {
  const userId = localStorage.getItem("user_id");
  const nameEl = document.getElementById("dashboard-name");
  if (nameEl) nameEl.textContent = localStorage.getItem("user_name") || "there";

  const errorBox = document.getElementById("dashboard-error");
  const recentList = document.getElementById("dashboard-recent-projects");

  try {
    const [skillsData, projectsData, verificationsData] = await Promise.all([
      apiGet(`/api/users/${userId}/skills`),
      apiGet(`/api/users/${userId}/projects`),
      apiGet(`/api/users/${userId}/verifications`),
    ]);

    const teachCount = skillsData.skills.filter((s) => s.type === "teach").length;
    const learnCount = skillsData.skills.filter((s) => s.type === "learn").length;

    document.getElementById("stat-teach").textContent = teachCount;
    document.getElementById("stat-learn").textContent = learnCount;
    document.getElementById("stat-projects").textContent = projectsData.count;
    document.getElementById("stat-verifications").textContent = verificationsData.count;

    const recent = projectsData.projects.slice(0, 5);
    recentList.innerHTML = recent.length
      ? recent
          .map(
            (p) => `
        <li>
          <strong>${escapeHtml(p.skill_name || "Skill exchange")}</strong>
          <span>${escapeHtml(p.description || "No description provided.")}</span>
        </li>`
          )
          .join("")
      : '<li class="empty">No projects logged yet. Complete an exchange to see it here.</li>';
  } catch (err) {
    errorBox.textContent =
      "Could not load your dashboard data. Make sure the backend services are running.";
    errorBox.style.display = "flex";
    ["stat-teach", "stat-learn", "stat-projects", "stat-verifications"].forEach((id) => {
      document.getElementById(id).textContent = "–";
    });
    recentList.innerHTML = '<li class="empty">Unable to load recent activity.</li>';
  }
}

// ---------- skills catalog ----------

let allSkillsCache = [];

async function loadSkillsList() {
  const grid = document.getElementById("skills-grid");
  const errorBox = document.getElementById("skills-error");
  const searchInput = document.getElementById("skills-search");

  try {
    const data = await apiGet("/api/skills");
    allSkillsCache = data.skills || [];
    renderSkillsGrid(allSkillsCache);
  } catch (err) {
    errorBox.textContent =
      "Could not load the skill catalog. Make sure the backend services are running.";
    errorBox.style.display = "flex";
    grid.innerHTML = "";
  }

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allSkillsCache.filter(
      (s) =>
        s.skill_name.toLowerCase().includes(term) ||
        (s.category || "").toLowerCase().includes(term)
    );
    renderSkillsGrid(filtered);
  });
}

function renderSkillsGrid(skills) {
  const grid = document.getElementById("skills-grid");

  if (!skills.length) {
    grid.innerHTML = '<p class="empty">No skills match your search.</p>';
    return;
  }

  grid.innerHTML = skills
    .map(
      (s) => `
    <article class="skill-card" data-skill-id="${s.skill_id}">
      <div>
        <h3>${escapeHtml(s.skill_name)}</h3>
        <span class="skill-category">${escapeHtml(s.category || "General")}</span>
      </div>
      <button type="button" class="tutors-btn" data-skill-id="${s.skill_id}">See tutors</button>
      <div class="tutors-list" id="tutors-${s.skill_id}"></div>
    </article>`
    )
    .join("");

  grid.querySelectorAll(".tutors-btn").forEach((btn) => {
    btn.addEventListener("click", () => loadTutors(btn.dataset.skillId, btn));
  });
}

async function loadTutors(skillId, button) {
  const container = document.getElementById(`tutors-${skillId}`);
  if (container.dataset.loaded === "true") {
    container.classList.toggle("hidden");
    return;
  }

  button.disabled = true;
  button.textContent = "Loading...";

  try {
    const data = await apiGet(`/api/skills/${skillId}/tutors`);
    container.innerHTML = data.tutors.length
      ? data.tutors.map((t) => `<span class="tutor-pill">${escapeHtml(t.name)}</span>`).join("")
      : '<span class="empty">No tutors listed yet.</span>';
    container.dataset.loaded = "true";
  } catch (err) {
    container.innerHTML = '<span class="empty">Could not load tutors.</span>';
  } finally {
    button.disabled = false;
    button.textContent = "See tutors";
  }
}

// ---------- profile ----------

function initProfile() {
  const nameEl = document.querySelector(".profile-hero h2");
  if (nameEl) nameEl.textContent = localStorage.getItem("user_name") || "User";
  loadProfileSkills();
}

async function loadProfileSkills() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const teachBox = document.querySelector(".profile-section .skill-list");
  const learnBox = document.querySelector(".skill-list.learn");

  try {
    const data = await apiGet(`/api/users/${userId}/skills`);
    const teach = data.skills.filter((s) => s.type === "teach");
    const learn = data.skills.filter((s) => s.type === "learn");

    teachBox.innerHTML = teach.length
      ? teach.map((s) => `<span>${escapeHtml(s.skill_name)}</span>`).join("")
      : '<span class="empty">No teaching skills yet.</span>';
    learnBox.innerHTML = learn.length
      ? learn.map((s) => `<span>${escapeHtml(s.skill_name)}</span>`).join("")
      : '<span class="empty">No learning skills yet.</span>';
  } catch (err) {
    teachBox.innerHTML = '<span class="empty">Could not load skills.</span>';
    learnBox.innerHTML = '<span class="empty">Could not load skills.</span>';
  }
}

// ---------- utils ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}