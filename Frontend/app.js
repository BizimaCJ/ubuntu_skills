const API_BASE = "http://127.0.0.1:5001";
const AUTH_BASE = "http://127.0.0.1:5000";

async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}

const routes = {
  login: { title: "Login", template: "login-template" },
  register: { title: "Register", template: "register-template" },
  profile: { title: "Profile", template: "profile-template" },
  portfolio: { title: "Portfolio", template: "portfolio-template" },
  availability: { title: "Availability", template: "availability-template" },
  booking: { title: "Book Tutor", template: "booking-template" },
  chat: { title: "Chat", template: "chat-template" }
};

const view = document.querySelector("#view");
const pageTitle = document.querySelector("#page-title");

const slots = [
  {
    id: 1,
    date: "2026-07-15",
    time: "16:00",
    skill: "React basics",
    length: "45 minutes",
    booked: false,
  },
  {
    id: 2,
    date: "2026-07-17",
    time: "11:30",
    skill: "Portfolio review",
    length: "30 minutes",
    booked: false,
  },
  {
    id: 3,
    date: "2026-07-19",
    time: "18:00",
    skill: "JavaScript patterns",
    length: "60 minutes",
    booked: true,
  },
];

const messages = [
  {
    sender: "Omar",
    text: "Hi Amina, I have a JavaScript slot open this week if you want to book it.",
    side: "them",
  },
  {
    sender: "Amina",
    text: "That would be great. I can help you review your portfolio after.",
    side: "me",
  },
  {
    sender: "Omar",
    text: "Perfect. Send me the page you want to work on before the session.",
    side: "them",
  },
];
function currentRoute() {
  const route = window.location.hash.replace("#/", "");
  return routes[route] ? route : "login";
}

function formatSlot(slot) {
  const date = new Date(`${slot.date}T${slot.time}`);
  return date.toLocaleString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function showConfirmation(id, message) {
  const element = document.querySelector(`#${id}`);
  if (element) {
    element.textContent = message;
  }
}

function renderTutorSlots() {
  const list = document.querySelector("#tutor-slots");
  if (!list) return;

  list.replaceChildren(
    ...slots.map((slot) => {
      const item = document.createElement("article");
      item.className = "slot-card";
      item.innerHTML = `
        <div>
          <strong>${formatSlot(slot)}</strong>
          <p>${slot.skill} · ${slot.length}</p>
        </div>
        <span class="status-pill ${slot.booked ? "booked" : ""}">${slot.booked ? "Booked" : "Open"}</span>
      `;
      return item;
    }),
  );
}

function renderBookingSlots() {
  const list = document.querySelector("#booking-slots");
  if (!list) return;

  list.replaceChildren(
    ...slots.map((slot) => {
      const item = document.createElement("article");
      item.className = "slot-card";
      const buttonLabel = slot.booked ? "Cancel Booking" : "Book";
      item.innerHTML = `
        <div>
          <strong>${formatSlot(slot)}</strong>
          <p>${slot.skill} · ${slot.length}</p>
        </div>
        <button class="${slot.booked ? "secondary-action" : ""}" type="button" data-slot-id="${slot.id}">
          ${buttonLabel}
        </button>
      `;
      return item;
    }),
  );
}

function renderMessages() {
  const list = document.querySelector("#chat-messages");
  if (!list) return;

  list.replaceChildren(
    ...messages.map((message) => {
      const bubble = document.createElement("article");
      bubble.className = `message-bubble ${message.side}`;
      bubble.innerHTML = `
        <span>${message.sender}</span>
        <p>${message.text}</p>
      `;
      return bubble;
    }),
  );
  list.scrollTop = list.scrollHeight;
}

function setupAvailabilityPage() {
  renderTutorSlots();

   const button = document.querySelector("#add-slot");
  button?.addEventListener("click", () => {
    const date = document.querySelector("#slot-date").value;
    const time = document.querySelector("#slot-time").value;
    const skill = document.querySelector("#slot-skill").value.trim() || "Skill exchange session";
    const length = document.querySelector("#slot-length").value.trim() || "45 minutes";

    if (!date || !time) {
      showConfirmation("availability-confirmation", "Please choose both a date and a time.");
      return;
    }

    slots.push({
      id: Date.now(),
      date,
      time,
      skill,
      length,
      booked: false,
    });

    renderTutorSlots();
    showConfirmation("availability-confirmation", "Time slot added and now visible to learners.");
  });
}

function setupBookingPage() {
  renderBookingSlots();

  const list = document.querySelector("#booking-slots");
  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-slot-id]");
    if (!button) return;

    const slot = slots.find((item) => item.id === Number(button.dataset.slotId));
    if (!slot) return;

    slot.booked = !slot.booked;
    renderBookingSlots();
    showConfirmation(
      "booking-confirmation",
      slot.booked ? "Booking confirmed. The tutor has been notified." : "Booking cancelled. The slot is open again.",
    );
  });
}

function setupChatPage() {
  renderMessages();

  const form = document.querySelector("#chat-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#chat-input");
    const text = input.value.trim();
    if (!text) return;

    messages.push({
      sender: "Amina",
      text,
      side: "me",
    });
    input.value = "";
    renderMessages();
  });
}

function setupPage(route) {
  if (route === "availability") setupAvailabilityPage();
  if (route === "booking") setupBookingPage();
  if (route === "chat") setupChatPage();
}

function render() {
  const route = currentRoute();
  const config = routes[route];
  const template = document.querySelector(`#${config.template}`);
  const navLinks = document.querySelectorAll("[data-route]");

  pageTitle.textContent = config.title;
  view.replaceChildren(template.content.cloneNode(true));

  if (route === "profile") {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    const nameEl = document.querySelector(".profile-hero h2");
    nameEl.textContent = localStorage.getItem("user_name") || "User";

    loadProfileSkills();
  }

  if (route === "register") {
    const button = view.querySelector("button");
    if (!button) return;

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
        body: JSON.stringify({ name, email, password, teach_skill, learn_skill })
      });

      const data = await res.json();
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

      if (data.user?.user_id) {
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("user_name", data.user.name);
      }

      alert(data.message || data.error);
    };
  }

  navLinks.forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("active", active);
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

  const teachBox = document.querySelector(".profile-section .skill-list");
  const learnBox = document.querySelector(".skill-list.learn");

  const data = await apiGet(`/api/users/${userId}/skills`);

  const teach = data.skills.filter(s => s.type === "teach");
  const learn = data.skills.filter(s => s.type === "learn");

  teachBox.innerHTML = teach.map(s => `<span>${s.skill_name}</span>`).join("");
  learnBox.innerHTML = learn.map(s => `<span>${s.skill_name}</span>`).join("");
}
