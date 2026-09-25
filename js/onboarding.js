import { db } from "./db.js";

const TOUR_STEPS = [
  {
    icon: "👋",
    title: "Добро пожаловать!",
    text: "Это ваш помощник в телефоне: оценки, посещаемость, документы и материалы для уроков — всё в одном месте.",
  },
  {
    icon: "📊",
    title: "Оценки и посещаемость",
    text: "Ставьте баллы и отмечайте, кто пришёл на пару, прямо во время занятия — крупными кнопками, без лишних действий.",
  },
  {
    icon: "📄",
    title: "AVN и документы",
    text: "Готовьте таблицу с оценками для AVN и редактируйте документы Word — без компьютера.",
  },
  {
    icon: "🔒",
    title: "Работает без интернета",
    text: "Все записи хранятся только в вашем телефоне. Периодически делайте резервную копию — приложение будет напоминать об этом.",
  },
];

export async function initOnboarding() {
  const done = await db.getSetting("onboardingDone", false);
  if (!done) {
    showOnboarding();
  }
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  return "android";
}

export function showOnboarding() {
  const root = document.getElementById("onboarding-root");
  let step = 0;
  const total = TOUR_STEPS.length + 1; // + экран установки

  const screen = document.createElement("div");
  screen.className = "onboarding-screen";
  root.appendChild(screen);

  function finish() {
    db.setSetting("onboardingDone", true);
    screen.remove();
  }

  function render() {
    if (step < TOUR_STEPS.length) {
      const s = TOUR_STEPS[step];
      screen.innerHTML = "";
      const skip = document.createElement("button");
      skip.className = "onboarding-skip";
      skip.textContent = "Пропустить";
      skip.addEventListener("click", finish);
      screen.appendChild(skip);

      const body = document.createElement("div");
      body.className = "onboarding-body";
      body.innerHTML = `
        <div class="onboarding-icon">${s.icon}</div>
        <h1>${s.title}</h1>
        <p class="muted">${s.text}</p>
      `;
      screen.appendChild(body);

      const dots = document.createElement("div");
      dots.className = "onboarding-dots";
      for (let i = 0; i < total; i++) {
        const d = document.createElement("span");
        if (i === step) d.className = "active";
        dots.appendChild(d);
      }
      screen.appendChild(dots);

      const next = document.createElement("button");
      next.className = "btn btn-primary btn-block btn-lg";
      next.textContent = "Далее";
      next.addEventListener("click", () => { step++; render(); });
      screen.appendChild(next);
    } else {
      screen.innerHTML = "";
      const skip = document.createElement("button");
      skip.className = "onboarding-skip";
      skip.textContent = "Пропустить";
      skip.addEventListener("click", finish);
      screen.appendChild(skip);

      const body = document.createElement("div");
      body.style.flex = "1";
      body.style.overflowY = "auto";
      body.style.width = "100%";
      body.innerHTML = `<div style="text-align:center; margin-bottom:0.75rem;">
          <div class="onboarding-icon">📲</div>
          <h1>Установите на телефон</h1>
          <p class="muted">Чтобы открывать приложение одним нажатием, как обычное приложение.</p>
        </div>`;
      body.appendChild(renderInstallGuide());
      screen.appendChild(body);

      const dots = document.createElement("div");
      dots.className = "onboarding-dots";
      for (let i = 0; i < total; i++) {
        const d = document.createElement("span");
        if (i === step) d.className = "active";
        dots.appendChild(d);
      }
      screen.appendChild(dots);

      const done = document.createElement("button");
      done.className = "btn btn-primary btn-block btn-lg";
      done.textContent = "Готово";
      done.addEventListener("click", finish);
      screen.appendChild(done);
    }
  }

  render();
}

export function renderInstallGuide() {
  const wrap = document.createElement("div");
  const platform = detectPlatform();

  const tabs = document.createElement("div");
  tabs.style.display = "flex";
  tabs.style.gap = "0.5rem";
  tabs.style.marginBottom = "0.9rem";

  const androidBtn = document.createElement("button");
  androidBtn.className = "btn btn-block";
  androidBtn.textContent = "🤖 Android (Chrome)";
  const iosBtn = document.createElement("button");
  iosBtn.className = "btn btn-block";
  iosBtn.textContent = "🍎 iPhone (Safari)";

  const content = document.createElement("div");

  const androidSteps = [
    "Откройте эту страницу в браузере Chrome.",
    "Нажмите на значок «⋮» (три точки) в правом верхнем углу экрана.",
    "Выберите пункт «Установить приложение» или «Добавить на главный экран».",
    "Нажмите «Установить». Значок появится на главном экране телефона.",
  ];
  const iosSteps = [
    "Откройте эту страницу в браузере Safari (не в Chrome).",
    "Нажмите на значок «Поделиться» — квадрат со стрелкой вверх, внизу экрана.",
    "Прокрутите список вниз и выберите «На экран «Домой»».",
    "Нажмите «Добавить» в правом верхнем углу.",
  ];

  function renderSteps(steps) {
    content.innerHTML = "";
    const list = document.createElement("div");
    list.className = "install-steps";
    steps.forEach((text, i) => {
      const el = document.createElement("div");
      el.className = "install-step";
      el.innerHTML = `<span class="step-num">${i + 1}</span><span>${text}</span>`;
      list.appendChild(el);
    });
    content.appendChild(list);
  }

  function setActive(which) {
    androidBtn.className = "btn btn-block" + (which === "android" ? " btn-primary" : "");
    iosBtn.className = "btn btn-block" + (which === "ios" ? " btn-primary" : "");
    renderSteps(which === "android" ? androidSteps : iosSteps);
  }

  androidBtn.addEventListener("click", () => setActive("android"));
  iosBtn.addEventListener("click", () => setActive("ios"));

  tabs.appendChild(androidBtn);
  tabs.appendChild(iosBtn);
  wrap.appendChild(tabs);
  wrap.appendChild(content);

  setActive(platform);
  return wrap;
}
