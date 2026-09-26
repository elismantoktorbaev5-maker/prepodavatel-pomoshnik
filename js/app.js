import { db } from "./db.js";
import { showToast } from "./ui.js";
import { initOnboarding } from "./onboarding.js";
import { applyTheme, applyFontSize } from "./theme.js";
import * as homeScreen from "./screens/home.js";
import * as moreScreen from "./screens/more.js";
import * as settingsScreen from "./screens/settings.js";
import * as installGuideScreen from "./screens/install-guide.js";
import * as gradesScreen from "./screens/grades.js";
import * as groupDetailScreen from "./screens/group-detail.js";
import * as journalScreen from "./screens/journal.js";
import * as gradeColumnsScreen from "./screens/grade-columns.js";
import * as attendanceScreen from "./screens/attendance.js";
import * as lessonScreen from "./screens/lesson.js";
import * as attendanceSummaryScreen from "./screens/attendance-summary.js";
import * as avnScreen from "./screens/avn.js";
import * as avnSettingsScreen from "./screens/avn-settings.js";
import * as avnDeadlinesScreen from "./screens/avn-deadlines.js";
import * as avnGroupsScreen from "./screens/avn-groups.js";
import * as avnExportScreen from "./screens/avn-export.js";
import * as avnColumnsScreen from "./screens/avn-columns.js";
import * as avnGuideScreen from "./screens/avn-guide.js";
import { makePlaceholder } from "./screens/placeholder.js";

const MAIN_ROUTES = ["home", "grades", "attendance", "more"];

const registry = {
  home: homeScreen,
  more: moreScreen,
  settings: settingsScreen,
  "install-guide": installGuideScreen,
  grades: gradesScreen,
  group: groupDetailScreen,
  journal: journalScreen,
  "grade-columns": gradeColumnsScreen,
  attendance: attendanceScreen,
  lesson: lessonScreen,
  "attendance-summary": attendanceSummaryScreen,
  avn: avnScreen,
  "avn-settings": avnSettingsScreen,
  "avn-deadlines": avnDeadlinesScreen,
  "avn-groups": avnGroupsScreen,
  "avn-export": avnExportScreen,
  "avn-columns": avnColumnsScreen,
  "avn-guide": avnGuideScreen,
  documents: makePlaceholder("Документы", "📚", "Открытие и редактирование документов появится позже."),
  templates: makePlaceholder("Шаблоны", "🧩", "Шаблоны документов появятся позже."),
  exercises: makePlaceholder("Задания по английскому", "✏️", "Генератор заданий появится позже."),
  classroom: makePlaceholder("На уроке", "⏱️", "Таймер и случайный выбор студента появятся позже."),
  backup: makePlaceholder("Резервная копия", "💾", "Резервное копирование появится позже."),
};

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  const name = parts[0] || "home";
  return { name, parts };
}

function mainGroupFor(name) {
  if (name === "home") return "home";
  if (name === "grades" || name === "group" || name === "journal" || name === "grade-columns") return "grades";
  if (name === "attendance" || name === "lesson" || name === "attendance-summary") return "attendance";
  return "more"; // всё остальное живёт внутри "Ещё"
}

async function renderRoute() {
  const { name, parts } = parseRoute();
  const def = registry[name] || registry.home;
  const params = { id: parts[1] };

  const container = document.getElementById("screen-root");
  document.getElementById("screen-title").textContent = def.title || "Помощник преподавателя";

  const group = mainGroupFor(name);
  document.querySelectorAll(".bottom-nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === group);
  });

  updateTopbarBack(!(MAIN_ROUTES.includes(name) && parts.length === 1));

  try {
    await def.render(container, params);
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
