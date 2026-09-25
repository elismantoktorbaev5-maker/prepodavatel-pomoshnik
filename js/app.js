import { db } from "./db.js";
import { showToast } from "./ui.js";
import { initOnboarding } from "./onboarding.js";
import { applyTheme, applyFontSize } from "./theme.js";
import * as homeScreen from "./screens/home.js";
import * as moreScreen from "./screens/more.js";
import * as settingsScreen from "./screens/settings.js";
import * as installGuideScreen from "./screens/install-guide.js";
import { makePlaceholder } from "./screens/placeholder.js";

const MAIN_ROUTES = ["home", "grades", "attendance", "more"];

const registry = {
  home: homeScreen,
  more: moreScreen,
  settings: settingsScreen,
  "install-guide": installGuideScreen,
  grades: makePlaceholder("Оценки", "📊", "Журнал оценок появится на следующем этапе."),
  attendance: makePlaceholder("Посещаемость", "🗓️", "Отметка посещаемости появится на следующем этапе."),
  avn: makePlaceholder("AVN", "📄", "Подготовка таблицы для AVN появится на следующем этапе."),
  documents: makePlaceholder("Документы", "📚", "Открытие и редактирование документов появится позже."),
  templates: makePlaceholder("Шаблоны", "🧩", "Шаблоны документов появятся позже."),
  exercises: makePlaceholder("Задания по английскому", "✏️", "Генератор заданий появится позже."),
  classroom: makePlaceholder("На уроке", "⏱️", "Таймер и случайный выбор студента появятся позже."),
  backup: makePlaceholder("Резервная копия", "💾", "Резервное копирование появится позже."),
};

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash || "home";
}

function mainGroupFor(route) {
  if (route === "home") return "home";
  if (route === "grades") return "grades";
  if (route === "attendance") return "attendance";
  return "more"; // всё остальное живёт внутри "Ещё"
}

async function renderRoute() {
  const route = parseRoute();
  const def = registry[route] || registry.home;

  document.getElementById("screen-title").textContent = def.title || "Помощник преподавателя";

  const group = mainGroupFor(route);
  document.querySelectorAll(".bottom-nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === group);
  });

  updateTopbarBack(route !== group || !MAIN_ROUTES.includes(route));

  const container = document.getElementById("screen-root");
  try {
    await def.render(container);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h2>Что-то пошло не так</h2><p>Не получилось открыть этот раздел. Попробуйте вернуться назад и открыть его ещё раз.</p></div>`;
  }
  window.scrollTo(0, 0);
}

function updateTopbarBack(show) {
  const topbar = document.getElementById("topbar");
  let backBtn = document.getElementById("back-btn");
  if (show) {
    if (!backBtn) {
      backBtn = document.createElement("button");
      backBtn.id = "back-btn";
      backBtn.className = "icon-btn";
      backBtn.setAttribute("aria-label", "Назад");
      backBtn.textContent = "←";
      backBtn.addEventListener("click", () => window.history.back());
      topbar.insertBefore(backBtn, topbar.firstChild);
    }
  } else if (backBtn) {
    backBtn.remove();
  }
}

function navigate(route) {
  window.location.hash = "#/" + route;
}

function wireNav() {
  document.querySelectorAll(".bottom-nav button").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.route));
  });
  window.addEventListener("hashchange", renderRoute);
}

async function applySavedPreferences() {
  const theme = await db.getSetting("theme", "system");
  const fontSize = await db.getSetting("fontSize", "normal");
  applyTheme(theme);
  applyFontSize(fontSize);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("service-worker.js");
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showToast("Доступно обновление приложения", {
              actionLabel: "Обновить",
              onAction: () => {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              },
            });
          }
        });
      });
    } catch (err) {
      console.warn("Не удалось зарегистрировать service worker", err);
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

async function init() {
  await applySavedPreferences();
  wireNav();
  await renderRoute();
  registerServiceWorker();
  await initOnboarding();
}

init();
