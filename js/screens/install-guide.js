import { renderInstallGuide } from "../onboarding.js";

export const title = "Как установить";

export async function render(container) {
  container.innerHTML = "";
  const intro = document.createElement("p");
  intro.className = "muted";
  intro.textContent = "Выберите свой телефон и следуйте шагам.";
  container.appendChild(intro);
  container.appendChild(renderInstallGuide());
}
