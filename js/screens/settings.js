import { db } from "../db.js";
import { createHintButton, showToast } from "../ui.js";
import { showOnboarding } from "../onboarding.js";
import { applyTheme, applyFontSize } from "../theme.js";

export const title = "Настройки";

export async function render(container) {
  container.innerHTML = "";

  const theme = await db.getSetting("theme", "system");
  const fontSize = await db.getSetting("fontSize", "normal");

  const themeCard = document.createElement("div");
  themeCard.className = "card";
  const themeHead = document.createElement("div");
  themeHead.style.display = "flex";
  themeHead.style.alignItems = "center";
  themeHead.style.gap = "0.5rem";
  themeHead.innerHTML = `<h3 style="margin:0;flex:1;">Оформление</h3>`;
  themeHead.appendChild(createHintButton("Выберите, как будет выглядеть приложение: светлый или тёмный фон, обычный или крупный текст."));
  themeCard.appendChild(themeHead);

  const themeRow = document.createElement("div");
  themeRow.style.display = "flex";
  themeRow.style.gap = "0.5rem";
  themeRow.style.marginTop = "0.75rem";
  themeRow.appendChild(makeToggleBtn("☀️ Светлая", theme === "light", async () => {
    await db.setSetting("theme", "light");
    applyTheme("light");
    render(container);
  }));
  themeRow.appendChild(makeToggleBtn("🌙 Тёмная", theme === "dark", async () => {
    await db.setSetting("theme", "dark");
    applyTheme("dark");
    render(container);
  }));
  themeRow.appendChild(makeToggleBtn("⚙️ Как в телефоне", theme === "system", async () => {
    await db.setSetting("theme", "system");
    applyTheme("system");
    render(container);
  }));
  themeCard.appendChild(themeRow);

  const fontRow = document.createElement("div");
  fontRow.style.display = "flex";
  fontRow.style.gap = "0.5rem";
  fontRow.style.marginTop = "0.75rem";
  fontRow.appendChild(makeToggleBtn("А Обычный", fontSize === "normal", async () => {
    await db.setSetting("fontSize", "normal");
    applyFontSize("normal");
    render(container);
  }));
  fontRow.appendChild(makeToggleBtn("А Крупнее", fontSize === "large", async () => {
    await db.setSetting("fontSize", "large");
    applyFontSize("large");
    render(container);
  }));
  themeCard.appendChild(fontRow);
  container.appendChild(themeCard);

  const helpCard = document.createElement("div");
  helpCard.className = "card";
  helpCard.innerHTML = `<h3>Помощь</h3>`;
  const tourBtn = document.createElement("button");
  tourBtn.className = "btn btn-block";
  tourBtn.style.marginBottom = "0.6rem";
  tourBtn.textContent = "Показать приветствие ещё раз";
  tourBtn.addEventListener("click", showOnboarding);
  helpCard.appendChild(tourBtn);

  const installBtn = document.createElement("button");
  installBtn.className = "btn btn-block";
  installBtn.textContent = "Как установить на телефон";
  installBtn.addEventListener("click", () => { window.location.hash = "#/install-guide"; });
  helpCard.appendChild(installBtn);
  container.appendChild(helpCard);
}

function makeToggleBtn(label, active, onClick) {
  const btn = document.createElement("button");
  btn.className = "btn" + (active ? " btn-primary" : "");
  btn.style.flex = "1";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}
