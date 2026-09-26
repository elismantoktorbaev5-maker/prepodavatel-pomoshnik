import { createHintButton } from "../ui.js";
import { getModuleDeadlines } from "../avn.js";
import { todayISO } from "../repo.js";

export const title = "Главная";

const DEADLINE_LABELS = {
  module1: "Модуль 1",
  module2: "Модуль 2",
  final: "Итоговый контроль",
};

export async function render(container) {
  container.innerHTML = "";

  const greeting = document.createElement("div");
  greeting.className = "card";
  greeting.innerHTML = `<h2>Добро пожаловать!</h2><p class="muted">Оценки, посещаемость и документы — всё в этом приложении.</p>`;
  container.appendChild(greeting);

  await renderDeadlineReminders(container);

  const quick = document.createElement("div");
  quick.className = "home-section";
  quick.innerHTML = `<h3>Быстрые действия</h3>`;
  const grid = document.createElement("div");
  grid.className = "tile-grid";
  grid.appendChild(makeTile("📊", "Оценки", "#/grades"));
  grid.appendChild(makeTile("🗓️", "Посещаемость", "#/attendance"));
  grid.appendChild(makeTile("📄", "AVN", "#/avn"));
  grid.appendChild(makeTile("📚", "Документы", "#/more"));
  quick.appendChild(grid);
  container.appendChild(quick);

  const helpCard = document.createElement("div");
  helpCard.className = "card";
  const helpRow = document.createElement("div");
  helpRow.style.display = "flex";
  helpRow.style.alignItems = "center";
  helpRow.style.justifyContent = "space-between";
  helpRow.innerHTML = `<div><strong>Нужна помощь?</strong><div class="muted">Как установить приложение на телефон</div></div>`;
  const hintBtn = createHintButton("Откроется экран с пошаговой инструкцией: как добавить приложение на главный экран телефона.");
  helpRow.appendChild(hintBtn);
  helpCard.appendChild(helpRow);
  const openInstall = document.createElement("button");
  openInstall.className = "btn btn-block";
  openInstall.style.marginTop = "0.75rem";
  openInstall.textContent = "Показать инструкцию";
  openInstall.addEventListener("click", () => { window.location.hash = "#/install-guide"; });
  helpCard.appendChild(openInstall);
  container.appendChild(helpCard);
}

async function renderDeadlineReminders(container) {
  const deadlines = await getModuleDeadlines();
  const today = todayISO();
  const soon = [];

  for (const key of Object.keys(DEADLINE_LABELS)) {
    const date = deadlines[key];
    if (!date) continue;
    const diffDays = Math.round((new Date(date) - new Date(today)) / 86400000);
    if (diffDays <= 7) {
      soon.push({ label: DEADLINE_LABELS[key], date, diffDays });
    }
  }

  if (!soon.length) return;

  const card = document.createElement("div");
  card.className = "card";
  card.style.borderLeft = "5px solid var(--color-danger)";
  const rows = soon
    .map((d) => {
      const text = d.diffDays < 0
        ? `просрочено (было ${formatDate(d.date)})`
        : d.diffDays === 0
        ? `сегодня, ${formatDate(d.date)}`
        : `через ${d.diffDays} дн., ${formatDate(d.date)}`;
      return `<div style="margin-bottom:0.3rem;"><strong>${d.label}</strong> — ${text}</div>`;
    })
    .join("");
  card.innerHTML = `<h3 style="margin-top:0;">⏰ Скоро сдавать оценки в AVN</h3>${rows}`;
  const link = document.createElement("a");
  link.className = "btn btn-block";
  link.style.marginTop = "0.5rem";
  link.style.textDecoration = "none";
  link.style.color = "inherit";
  link.href = "#/avn-deadlines";
  link.textContent = "Изменить сроки";
  card.appendChild(link);
  container.appendChild(card);
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function makeTile(icon, label, href) {
  const a = document.createElement("a");
  a.className = "tile";
  a.href = href;
  a.innerHTML = `<span class="tile-icon">${icon}</span><span class="tile-title">${label}</span>`;
  return a;
}
