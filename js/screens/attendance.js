import { listGroups, countStudents } from "../repo.js";
import { createHintButton } from "../ui.js";

export const title = "Посещаемость";

export async function render(container) {
  container.innerHTML = "";

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.5rem";
  head.style.marginBottom = "0.75rem";
  head.innerHTML = `<h3 style="flex:1;margin:0;">Выберите группу</h3>`;
  head.appendChild(createHintButton("Откройте группу, чтобы отметить, кто пришёл на сегодняшнюю пару."));
  container.appendChild(head);

  const groups = await listGroups();

  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">🗓️</div>
      <h2>Пока нет ни одной группы</h2>
      <p>Сначала добавьте группу и студентов в разделе «Оценки».</p>
    `;
    const btn = document.createElement("a");
    btn.className = "btn btn-primary btn-lg";
    btn.href = "#/grades";
    btn.textContent = "Перейти в «Оценки»";
    empty.appendChild(btn);
    container.appendChild(empty);
    return;
  }

  for (const g of groups) {
    const count = await countStudents(g.id);
    const card = document.createElement("a");
    card.href = `#/lesson/${g.id}`;
    card.className = "card";
    card.style.display = "block";
    card.style.textDecoration = "none";
    card.style.color = "inherit";
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:700;font-size:1.05rem;">${escapeHtml(g.name)}</div>
          <div class="muted">${count ? count + " студ." : "Нет студентов"}</div>
        </div>
        <div style="font-size:1.3rem;" class="muted">›</div>
      </div>
    `;
    container.appendChild(card);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
