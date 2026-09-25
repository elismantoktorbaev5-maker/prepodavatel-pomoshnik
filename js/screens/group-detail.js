import { getGroup, renameGroup, deleteGroupCascade, listStudents, addStudentsBulk, renameStudent, deleteStudentCascade } from "../repo.js";
import { createHintButton, promptDialog, confirmDialog, showToast, setScreenTitle } from "../ui.js";

export const title = "Группа";

export async function render(container, params) {
  const groupId = Number(params.id);
  container.innerHTML = "";

  const group = await getGroup(groupId);
  if (!group) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><h2>Группа не найдена</h2><p>Возможно, она была удалена.</p></div>`;
    return;
  }
  setScreenTitle(group.name);

  // Заголовок группы с переименованием и удалением
  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;">
      <h2 style="flex:1;margin:0;">${escapeHtml(group.name)}</h2>
    </div>
  `;
  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "0.5rem";
  btnRow.style.marginTop = "0.75rem";

  const renameBtn = document.createElement("button");
  renameBtn.className = "btn";
  renameBtn.style.flex = "1";
  renameBtn.textContent = "✏️ Переименовать";
  renameBtn.addEventListener("click", async () => {
    const newName = await promptDialog({
      title: "Переименовать группу",
      label: "Название группы",
      initialValue: group.name,
      confirmLabel: "Сохранить",
    });
    if (!newName) return;
    await renameGroup(groupId, newName);
    render(container, params);
    showToast("Название сохранено");
  });
  btnRow.appendChild(renameBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger";
  deleteBtn.style.flex = "1";
  deleteBtn.textContent = "🗑 Удалить группу";
  deleteBtn.addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Удалить группу?",
      message: `Группа «${group.name}» и все студенты, оценки и посещаемость внутри неё будут удалены безвозвратно.`,
      confirmLabel: "Да, удалить",
    });
    if (!ok) return;
    await deleteGroupCascade(groupId);
    showToast("Группа удалена");
    window.location.hash = "#/grades";
  });
  btnRow.appendChild(deleteBtn);
  head.appendChild(btnRow);
  container.appendChild(head);

  // Список студентов
  const listHead = document.createElement("div");
  listHead.style.display = "flex";
  listHead.style.alignItems = "center";
  listHead.style.gap = "0.5rem";
  listHead.style.margin = "1rem 0 0.5rem";
  const listTitle = document.createElement("h3");
  listTitle.style.flex = "1";
  listTitle.style.margin = "0";
  listTitle.textContent = "Студенты";
  listHead.appendChild(listTitle);
  listHead.appendChild(createHintButton("Список студентов этой группы. Можно вставить сразу весь список, скопированный из WhatsApp, Word или Excel — по одному имени в строке."));
  container.appendChild(listHead);

  const students = await listStudents(groupId);

  if (!students.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<div class="empty-icon">🧑‍🎓</div><h2>Пока нет студентов</h2><p>Нажмите кнопку ниже и вставьте список ФИО — по одному в строке.</p>`;
    container.appendChild(empty);
  } else {
    for (const s of students) {
      const card = document.createElement("div");
      card.className = "student-card";
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
          <div class="student-card-name">${escapeHtml(s.fullName)}</div>
          <div style="display:flex;gap:0.4rem;flex:none;">
            <button class="btn" data-action="edit" style="min-height:40px;padding:0.4rem 0.6rem;">✏️</button>
            <button class="btn btn-danger" data-action="delete" style="min-height:40px;padding:0.4rem 0.6rem;">🗑</button>
          </div>
        </div>
      `;
      card.querySelector('[data-action="edit"]').addEventListener("click", async () => {
        const newName = await promptDialog({
          title: "Изменить имя студента",
          label: "ФИО",
          initialValue: s.fullName,
          confirmLabel: "Сохранить",
        });
        if (!newName) return;
        await renameStudent(s.id, newName);
        render(container, params);
      });
      card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
        const ok = await confirmDialog({
          title: "Удалить студента?",
          message: `«${s.fullName}» и все его оценки и отметки посещаемости будут удалены безвозвратно.`,
          confirmLabel: "Да, удалить",
        });
        if (!ok) return;
        await deleteStudentCascade(s.id);
        showToast("Студент удалён");
        render(container, params);
      });
      container.appendChild(card);
    }
  }

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-primary btn-block btn-lg";
  addBtn.style.marginTop = "0.75rem";
  addBtn.textContent = "+ Добавить студентов";
  addBtn.addEventListener("click", async () => {
    const text = await promptDialog({
      title: "Добавить студентов",
      label: "Вставьте список — по одному ФИО в строке",
      placeholder: "Иванова Айгуль\nПетров Данияр\n...",
      confirmLabel: "Добавить",
      multiline: true,
    });
    if (!text) return;
    const count = await addStudentsBulk(groupId, text);
    if (count === 0) {
      showToast("Не удалось найти ни одного имени в тексте");
      return;
    }
    showToast(`Добавлено студентов: ${count}`);
    render(container, params);
  });
  container.appendChild(addBtn);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
