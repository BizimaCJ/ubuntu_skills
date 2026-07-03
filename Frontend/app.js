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