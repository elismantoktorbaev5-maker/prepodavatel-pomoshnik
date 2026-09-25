import { createHintButton } from "../ui.js";

export const title = "Главная";

export async function render(container) {
  container.innerHTML = "";

  const greeting = document.createElement("div");
  greeting.className = "card";
  greeting.innerHTML = `<h2>Добро пожаловать!</h2><p class="muted">Здесь скоро появятся напоминания о сроках модулей и резервной копии.</p>`;
  container.appendChild(greeting);

  const quick = document.createElement("div");
  quick.className = "home-section";
  quick.innerHTML = `<h3>Быстрые действия</h3>`;
  const grid = document.createElement("div");
  grid.className = "tile-grid";
  grid.appendChild(makeTile("📊", "Оценки", "#/grades"));
  grid.appendChild(makeTile("🗓️", "Посещаемость", "#/attendance"));
  grid.appendChild(makeTile("📄", "AVN", "#/more"));
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

function makeTile(icon, label, href) {
  const a = document.createElement("a");
  a.className = "tile";
  a.href = href;
  a.innerHTML = `<span class="tile-icon">${icon}</span><span class="tile-title">${label}</span>`;
  return a;
}
