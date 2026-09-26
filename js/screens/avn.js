import { getAvnUrl } from "../avn.js";
import { createHintButton, showToast } from "../ui.js";

export const title = "AVN";

export async function render(container) {
  container.innerHTML = "";

  const info = document.createElement("div");
  info.className = "card";
  info.innerHTML = `<p class="muted" style="margin:0;">Приложение не заходит в AVN само и не хранит ваш пароль. Оно только открывает сайт и готовит таблицу с оценками, которую вы сами вставите в AVN.</p>`;
  container.appendChild(info);

  const openRow = document.createElement("div");
  openRow.style.display = "flex";
  openRow.style.alignItems = "center";
  openRow.style.gap = "0.5rem";
  const openBtn = document.createElement("button");
  openBtn.className = "btn btn-primary btn-block btn-lg";
  openBtn.textContent = "🌐 Открыть AVN";
  openBtn.addEventListener("click", async () => {
    const url = await getAvnUrl();
    if (!url) {
      showToast("Сначала укажите адрес сайта AVN в настройках ниже");
      return;
    }
    window.open(url, "_blank", "noopener");
  });
  openRow.appendChild(openBtn);
  openRow.appendChild(createHintButton("Откроет сайт AVN в браузере. Вводить логин и пароль нужно будет самим — приложение их не хранит."));
  container.appendChild(openRow);

  const items = [
    { icon: "📊", label: "Подготовить оценки для AVN", href: "#/avn-groups" },
    { icon: "📖", label: "Как перенести оценки в AVN", href: "#/avn-guide" },
    { icon: "🗓️", label: "Сроки модулей", href: "#/avn-deadlines" },
    { icon: "⚙️", label: "Адрес сайта AVN", href: "#/avn-settings" },
  ];
  const grid = document.createElement("div");
  grid.className = "tile-grid";
  grid.style.marginTop = "0.9rem";
  for (const item of items) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = item.href;
    a.innerHTML = `<span class="tile-icon">${item.icon}</span><span class="tile-title">${item.label}</span>`;
    grid.appendChild(a);
  }
  container.appendChild(grid);
}
