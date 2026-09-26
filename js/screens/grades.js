import { listGroups, createGroup, countStudents } from "../repo.js";
import { createHintButton, promptDialog, showToast } from "../ui.js";

export const title = "Оценки";

export async function render(container) {
  container.innerHTML = "";

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "0.5rem";
  head.style.marginBottom = "0.75rem";
  const headTitle = document.createElement("h3");
  headTitle.style.flex = "1";
  headTitle.style.margin = "0";
  headTitle.textContent = "Ваши группы";
  head.appendChild(headTitle);
  head.appendChild(createHintButton("Группа — это, например, «АНГ-21». Внутри группы вы ведёте список студентов и их оценки."));
  container.appendChild(head);

  const groups = await listGroups();

  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📊</div>
      <h2>Пока нет ни одной группы</h2>
      <p>Добавьте группу, а затем вставьте список студентов — оценки и посещаемость будут вестись по ней.</p>
    `;
    container.appendChild(empty);
  } else {
    for (const g of groups) {
      const count = await countStudents(g.id);
      const card = document.createElement("a");
      card.href = `#/journal/${g.id}`;
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

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-primary btn-block btn-lg";
  addBtn.style.marginTop = "0.75rem";
  addBtn.textContent = "+ Добавить группу";
  addBtn.addEventListener("click", async () => {
    const name = await promptDialog({
      title: "Новая группа",
      label: "Название группы",
      placeholder: "Например, АНГ-21",
      confirmLabel: "Создать",
    });
    if (!name) return;
    const id = await createGroup(name);
    showToast("Группа добавлена");
    window.location.hash = `#/group/${id}`;
  });
  container.appendChild(addBtn);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
