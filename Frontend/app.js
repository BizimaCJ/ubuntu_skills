const API_BASE = "http://127.0.0.1:5001";
const AUTH_BASE = "http://127.0.0.1:5000";

async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}


const routes = {
  login: {
    title: "Login",
    template: "login-template",
  },
  register: {
    title: "Register",
    template: "register-template",
  },
  profile: {
    title: "Profile",
    template: "profile-template",
  },
  portfolio: {
    title: "Portfolio",
    template: "portfolio-template",
  },
};

const view = document.querySelector("#view");
const pageTitle = document.querySelector("#page-title");
const navLinks = document.querySelectorAll("[data-route]");

function currentRoute() {
  const route = window.location.hash.replace("#/", "");
  return routes[route] ? route : "login";
}

function render() {
  const route = currentRoute();
  const config = routes[route];
  const template = document.querySelector(`#${config.template}`);

  console.log("Current route:", route);

  pageTitle.textContent = config.title;
  view.replaceChildren(template.content.cloneNode(true));

  if (route === "profile") {
    console.log("Rendering profile");
    loadProfileSkills();
  }

  if (route === "register") {
    const form = document.querySelector(".form-panel");
    const button = form.querySelector("button");

    button.addEventListener("click", async () => {
      const name = form.querySelector('input[placeholder="Amina Hassan"]').value;
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;

      const res = await fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      console.log("REGISTER RESULT:", data);
    });
  }
}

window.addEventListener("hashchange", render);

if (!window.location.hash) {
  window.location.hash = "#/login";
} else {
  render();
}

async function loadProfileSkills() {
  console.log("loadProfileSkills called");
  const profileSection = document.querySelector(".profile-section");
  if (!profileSection) return;

  const skillList = profileSection.querySelector(".skill-list");
  if (!skillList) return;

  skillList.innerHTML = "Loading...";

  try {
    const data = await apiGet("/api/users/1/skills?type=teach");

    skillList.innerHTML = data.skills
      .map(s => `<span>${s.skill_name}</span>`)
      .join("");

  } catch (err) {
    showApiError("Backend unavailable");
  }
}

function showApiError(message) {
  const profileSection = document.querySelector(".profile-section");
  if (!profileSection) return;

  const skillList = profileSection.querySelector(".skill-list");
  if (!skillList) return;

  skillList.innerHTML = `<span style="color:red;">${message}</span>`;
}
