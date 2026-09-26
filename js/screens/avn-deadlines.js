import { getModuleDeadlines, setModuleDeadlines } from "../avn.js";
import { createHintButton, showToast } from "../ui.js";

export const title = "Сроки модулей";

const FIELDS = [
  { key: "module1", label: "Модуль 1 — сдать до" },
  { key: "module2", label: "Модуль 2 — сдать до" },
  { key: "final", label: "Итоговый контроль — сдать до" },
];

export async function render(container) {
  container.innerHTML = "";
  const deadlines = await getModuleDeadlines();

  const card = document.createElement("div");
  card.className = "card";
  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.4rem";
  head.innerHTML = `<h3 style="flex:1;margin:0;">Сроки сдачи оценок в AVN</h3>`;
  head.appendChild(createHintButton("Укажите даты, до которых нужно внести оценки в AVN. На главном экране появится напоминание, когда срок приближается."));
  card.appendChild(head);

  for (const f of FIELDS) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    wrap.innerHTML = `<label>${f.label}</label><input type="date" data-key="${f.key}" value="${deadlines[f.key] || ""}">`;
    card.appendChild(wrap);
  }

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-primary btn-block";
  saveBtn.textContent = "Сохранить";
  saveBtn.addEventListener("click", async () => {
    const updated = { ...deadlines };
    card.querySelectorAll("[data-key]").forEach((input) => {
      updated[input.dataset.key] = input.value;
    });
    await setModuleDeadlines(updated);
    showToast("Сроки сохранены");
  });
  card.appendChild(saveBtn);
  container.appendChild(card);
}
