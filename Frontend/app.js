const API_BASE = "http://127.0.0.1:5001";
const AUTH_BASE = "http://127.0.0.1:5000";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
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

  pageTitle.textContent = config.title;
  view.replaceChildren(template.content.cloneNode(true));

  if (route === "profile") {
    console.log("Rendering profile");

    const userId = localStorage.getItem("user_id");

    if (!userId) {
      console.warn("No user logged in");
      return;
    }

    const nameEl = document.querySelector(".profile-hero h2");
    const userName = localStorage.getItem("user_name");

    if (nameEl) {
      nameEl.textContent = userName || "User";
    }

    loadProfileSkills();
  }

  if (route === "register") {
    const button = view.querySelector("button");
    if (!button) return;

    console.log("register handler attached");

    button.onclick = async (e) => {
      e.preventDefault();

      const name = view.querySelector('input[name="name"]').value;
      const email = view.querySelector('input[name="email"]').value;
      const password = view.querySelector('input[name="password"]').value;
      const teach_skill = view.querySelector('input[name="teach_skill"]').value;
      const learn_skill = view.querySelector('input[name="learn_skill"]').value;
      const res = await fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            email,
            password,
            teach_skill,
            learn_skill
        })
      });

      const data = await res.json();
      console.log(data);

      alert(data.message || data.error);
    };
  }

  if (route === "login") {
    const button = view.querySelector("button");
    if (!button) return;

    button.onclick = async () => {
      const inputs = view.querySelectorAll("input");

      const email = inputs[0].value;
      const password = inputs[1].value;

      const res = await fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log(data);

      if (data.user?.user_id) {
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("user_name", data.user.name);
      }

      alert(data.message || data.error);
    };
  }

  navLinks.forEach((link) => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

window.addEventListener("hashchange", render);

if (!window.location.hash) {
  window.location.hash = "#/login";
} else {
  render();
}

async function loadProfileSkills() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const profileSection = document.querySelector(".profile-grid");
  if (!profileSection) return;

  const teachBox = document.querySelector(".profile-section .skill-list");
  const learnBox = document.querySelector(".skill-list.learn");

  const data = await apiGet(`/api/users/${userId}/skills`);

  const teach = data.skills.filter(s => s.type === "teach");
  const learn = data.skills.filter(s => s.type === "learn");

  teachBox.innerHTML = teach.map(s => `<span>${s.skill_name}</span>`).join("");
  learnBox.innerHTML = learn.map(s => `<span>${s.skill_name}</span>`).join("");
}

