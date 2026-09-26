import { listGroups, countStudents } from "../repo.js";
import { createHintButton } from "../ui.js";

export const title = "Выберите группу";

export async function render(container) {
  container.innerHTML = "";

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.5rem";
  head.style.marginBottom = "0.75rem";
  head.innerHTML = `<h3 style="flex:1;margin:0;">Для какой группы готовим таблицу?</h3>`;
  head.appendChild(createHintButton("Выберите группу — соберём таблицу с её оценками для AVN."));
  container.appendChild(head);

  const groups = await listGroups();
  if (!groups.length) {
    container.innerHTML += `<div class="empty-state"><div class="empty-icon">📊</div><h2>Пока нет групп</h2><p>Сначала добавьте группу и оценки в разделе «Оценки».</p></div>`;
    return;
  }

  for (const g of groups) {
    const count = await countStudents(g.id);
    const card = document.createElement("a");
    card.href = `#/avn-export/${g.id}`;
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
